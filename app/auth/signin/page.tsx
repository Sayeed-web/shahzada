'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, LogIn, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('ایمیل یا رمز عبور اشتباه است')
        toast.error('خطا در ورود')
      } else {
        toast.success('با موفقیت وارد شدید')
        
        // Wait for session to be established
        await new Promise(resolve => setTimeout(resolve, 500))
        const session = await getSession()
        
        // Get fresh session and redirect
        const freshSession = await getSession()
        console.log('Fresh session:', freshSession)
        
        if (freshSession?.user?.role === 'ADMIN') {
          router.replace('/admin')
        } else if (freshSession?.user?.role === 'SARAF') {
          router.replace('/portal')
        } else {
          router.replace('/')
        }
      }
    } catch (error) {
      setError('خطا در اتصال به سرور')
      toast.error('خطا در ورود')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">س</span>
          </div>
          <h1 className="text-3xl font-bold gradient-text">سرای شهزاده</h1>
          <p className="text-muted-foreground mt-2">ورود به حساب کاربری</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              ورود
            </CardTitle>
            <CardDescription>
              برای ادامه، لطفاً وارد حساب کاربری خود شوید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">ایمیل</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">رمز عبور</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="رمز عبور خود را وارد کنید"
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="loading-spinner" />
                ) : (
                  <>
                    ورود
                    <ArrowRight className="h-4 w-4 mr-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                حساب کاربری ندارید؟{' '}
                <Link href="/auth/signup" className="text-primary hover:underline">
                  ثبت نام کنید
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">
                صراف هستید؟{' '}
                <Link href="/auth/saraf-signup" className="text-green-600 hover:underline font-medium">
                  ثبت نام صرافی
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}