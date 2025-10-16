import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

// Rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()

const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

function checkRateLimit(email: string): boolean {
  const now = Date.now()
  const attempts = loginAttempts.get(email)
  
  if (!attempts) {
    loginAttempts.set(email, { count: 1, lastAttempt: now })
    return true
  }
  
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.set(email, { count: 1, lastAttempt: now })
    return true
  }
  
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    return false
  }
  
  attempts.count++
  attempts.lastAttempt = now
  return true
}

function resetRateLimit(email: string): void {
  loginAttempts.delete(email)
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(credentials.email)) {
          console.log('Invalid email format')
          return null
        }

        if (!checkRateLimit(credentials.email)) {
          throw new Error('Too many login attempts. Please try again later.')
        }

        try {
          // Connect to database if not connected
          await prisma.$connect()
          
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
            include: { saraf: true }
          })

          if (!user) {
            // Sanitize email for logging to prevent log injection
            const sanitizedEmail = credentials.email.replace(/[\r\n\t]/g, ' ').slice(0, 100)
            console.log('User not found:', sanitizedEmail)
            return null
          }

          const passwordMatch = await bcrypt.compare(credentials.password, user.password)
          
          if (!passwordMatch) {
            // Sanitize email for logging to prevent log injection
            const sanitizedEmail = credentials.email.replace(/[\r\n\t]/g, ' ').slice(0, 100)
            console.log('Password mismatch for user:', sanitizedEmail)
            return null
          }

          if (!user.isActive) {
            throw new Error('Account is deactivated. Please contact support.')
          }

          resetRateLimit(credentials.email)

          // Update last login and create audit log
          await Promise.all([
            prisma.user.update({
              where: { id: user.id },
              data: { lastLogin: new Date() }
            }),
            prisma.auditLog.create({
              data: {
                userId: user.id,
                action: 'LOGIN',
                resource: 'AUTH',
                details: JSON.stringify({ email: user.email, role: user.role })
              }
            })
          ]).catch((error) => {
            console.error('Failed to update login info:', error)
          })
          
          // Sanitize user data for logging to prevent log injection
          const sanitizedEmail = user.email.replace(/[\r\n\t]/g, ' ').slice(0, 100)
          const sanitizedRole = user.role.replace(/[\r\n\t]/g, ' ')
          console.log('Successful login for user:', sanitizedEmail, 'Role:', sanitizedRole)
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            sarafId: user.saraf?.id,
            sarafStatus: user.saraf?.status
          }
        } catch (error) {
          console.error('Authentication error:', error)
          if (error instanceof Error) {
            throw error
          }
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role
        token.sarafId = user.sarafId
        token.sarafStatus = user.sarafStatus
        token.iat = Math.floor(Date.now() / 1000)
      }
      
      // Refresh user data on update trigger
      if (trigger === 'update' && token.sub) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: token.sub },
            include: { saraf: true }
          })
          
          if (user && user.isActive) {
            token.role = user.role
            token.sarafId = user.saraf?.id
            token.sarafStatus = user.saraf?.status
          }
        } catch (error) {
          const sanitizedError = error instanceof Error ? error.message.replace(/[\r\n\t]/g, ' ').slice(0, 200) : 'Unknown error'
          console.error('Token refresh error:', sanitizedError)
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        session.user.role = token.role as string
        session.user.sarafId = token.sarafId as string
        session.user.sarafStatus = token.sarafStatus as string
      }
      return session
    }
  },
  events: {
    async signOut({ token }) {
      if (token?.sub) {
        await prisma.auditLog.create({
          data: {
            userId: token.sub,
            action: 'LOGOUT',
            resource: 'AUTH'
          }
        }).catch(console.error)
      }
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
}