import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { sql } from '@/lib/db/client'
import bcrypt from 'bcryptjs'

export const { handlers, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await sql`
          SELECT id, email, name, password_hash 
          FROM users 
          WHERE email = ${credentials.email}
        `

        if (user.length === 0) {
          return null
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user[0].password_hash as string
        )

        if (!isValid) {
          return null
        }

        return {
          id: user[0].id,
          email: user[0].email,
          name: user[0].name,
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    signOut: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    },
  },
})
