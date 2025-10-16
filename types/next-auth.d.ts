import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      sarafId?: string
      sarafStatus?: string
    }
  }

  interface User {
    role: string
    sarafId?: string
    sarafStatus?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    sarafId?: string
    sarafStatus?: string
  }
}