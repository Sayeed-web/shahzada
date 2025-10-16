import { prisma } from './prisma'
import { sanitizeInput, sanitizeLogData } from './security'

export interface NotificationData {
  type: 'SMS' | 'EMAIL' | 'PUSH'
  recipient: string
  message: string
  transactionId?: string
  userId?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  metadata?: Record<string, any>
}

export interface SMSProvider {
  name: string
  send: (phone: string, message: string) => Promise<{ success: boolean; messageId?: string; error?: string }>
}

// SMS Provider implementations
class TwilioProvider implements SMSProvider {
  name = 'Twilio'
  
  async send(phone: string, message: string) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_FROM_NUMBER
    
    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio credentials not configured')
    }
    
    try {
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: phone,
          Body: message.slice(0, 1600) // SMS limit
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        return { success: true, messageId: data.sid }
      } else {
        const error = await response.text()
        return { success: false, error }
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
}

class AfghanSMSProvider implements SMSProvider {
  name = 'AfghanSMS'
  
  async send(phone: string, message: string) {
    const apiKey = process.env.AFGHAN_SMS_API_KEY
    const senderId = process.env.AFGHAN_SMS_SENDER_ID
    
    if (!apiKey || !senderId) {
      throw new Error('Afghan SMS credentials not configured')
    }
    
    try {
      const response = await fetch('https://api.afghansms.af/v1/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender_id: senderId,
          recipient: phone,
          message: message.slice(0, 160),
          type: 'text'
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        return { success: true, messageId: data.message_id }
      } else {
        const error = await response.text()
        return { success: false, error }
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
}

// SMS Provider factory
function getSMSProvider(): SMSProvider {
  const provider = process.env.SMS_PROVIDER || 'twilio'
  
  switch (provider.toLowerCase()) {
    case 'twilio':
      return new TwilioProvider()
    case 'afghansms':
      return new AfghanSMSProvider()
    default:
      return new TwilioProvider()
  }
}

// Notification templates
export const NotificationTemplates = {
  TRANSACTION_CREATED: (data: any) => ({
    subject: 'تراکنش جدید ایجاد شد',
    message: `تراکنش شما با کد ${data.referenceCode} ایجاد شد. مبلغ: ${data.amount} ${data.currency}. وضعیت: در انتظار تایید.`
  }),
  
  TRANSACTION_COMPLETED: (data: any) => ({
    subject: 'تراکنش تکمیل شد',
    message: `تراکنش ${data.referenceCode} با موفقیت تکمیل شد. گیرنده می‌تواند مبلغ را دریافت کند.`
  }),
  
  TRANSACTION_CANCELLED: (data: any) => ({
    subject: 'تراکنش لغو شد',
    message: `تراکنش ${data.referenceCode} لغو شد. در صورت پرداخت، مبلغ بازگردانده خواهد شد.`
  }),
  
  SARAF_APPROVED: (data: any) => ({
    subject: 'حساب صرافی تایید شد',
    message: `حساب صرافی ${data.businessName} تایید شد. اکنون می‌توانید خدمات ارائه دهید.`
  }),
  
  RATE_ALERT: (data: any) => ({
    subject: 'هشدار نرخ ارز',
    message: `نرخ ${data.currency} به ${data.rate} رسید. تغییر: ${data.change}%`
  })
}

// Main notification service
export class NotificationService {
  private smsProvider: SMSProvider
  
  constructor() {
    this.smsProvider = getSMSProvider()
  }
  
  async sendNotification(notification: NotificationData): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // Sanitize inputs
      const sanitizedRecipient = sanitizeInput(notification.recipient)
      const sanitizedMessage = sanitizeInput(notification.message)
      
      if (!sanitizedRecipient || !sanitizedMessage) {
        return { success: false, error: 'Invalid recipient or message' }
      }
      
      // Store notification in database
      const dbNotification = await prisma.auditLog.create({
        data: {
          action: 'NOTIFICATION_SEND',
          resource: 'notification',
          resourceId: notification.transactionId,
          userId: notification.userId,
          details: sanitizeLogData({
            type: notification.type,
            recipient: sanitizedRecipient,
            priority: notification.priority,
            messageLength: sanitizedMessage.length
          })
        }
      })
      
      let result: { success: boolean; messageId?: string; error?: string } = { success: false, error: 'Unknown error' }
      
      switch (notification.type) {
        case 'SMS':
          result = await this.sendSMS(sanitizedRecipient, sanitizedMessage)
          break
        case 'EMAIL':
          result = await this.sendEmail(sanitizedRecipient, sanitizedMessage)
          break
        case 'PUSH':
          result = await this.sendPush(sanitizedRecipient, sanitizedMessage)
          break
      }
      
      // Update notification status
      await prisma.auditLog.update({
        where: { id: dbNotification.id },
        data: {
          details: sanitizeLogData({
            ...JSON.parse(dbNotification.details || '{}'),
            success: result.success,
            messageId: result.messageId,
            error: result.error
          })
        }
      })
      
      return { success: result.success, id: dbNotification.id, error: result.error }
      
    } catch (error) {
      console.error('Notification service error:', error)
      return { success: false, error: String(error) }
    }
  }
  
  private async sendSMS(phone: string, message: string) {
    // Validate phone number format
    const cleanPhone = phone.replace(/[^\d+]/g, '')
    if (!cleanPhone.match(/^\+?[1-9]\d{7,14}$/)) {
      return { success: false, error: 'Invalid phone number format' }
    }
    
    return await this.smsProvider.send(cleanPhone, message)
  }
  
  private async sendEmail(email: string, message: string) {
    // Email implementation would go here
    // For now, return mock success
    return { success: true, messageId: `email_${Date.now()}` }
  }
  
  private async sendPush(deviceId: string, message: string) {
    // Push notification implementation would go here
    // For now, return mock success
    return { success: true, messageId: `push_${Date.now()}` }
  }
  
  async sendTransactionNotification(transactionId: string, type: keyof typeof NotificationTemplates, recipients: string[]) {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { saraf: true }
      })
      
      if (!transaction) {
        throw new Error('Transaction not found')
      }
      
      const template = NotificationTemplates[type]
      const { message } = template({
        referenceCode: transaction.referenceCode,
        amount: transaction.fromAmount,
        currency: transaction.fromCurrency,
        businessName: transaction.saraf.businessName
      })
      
      const results = []
      for (const recipient of recipients) {
        const result = await this.sendNotification({
          type: 'SMS',
          recipient,
          message,
          transactionId,
          priority: 'MEDIUM'
        })
        results.push(result)
      }
      
      return results
    } catch (error) {
      console.error('Transaction notification error:', error)
      return [{ success: false, error: String(error) }]
    }
  }
  
  async getUserNotifications(userId: string, limit = 50) {
    return await prisma.auditLog.findMany({
      where: {
        userId,
        action: 'NOTIFICATION_SEND'
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }
}

// Export singleton instance
export const notificationService = new NotificationService()