import type { DefaultSession } from "next-auth"

type UserRole = "user" | "moderator" | "owner"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role?: UserRole
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string
  }
}
