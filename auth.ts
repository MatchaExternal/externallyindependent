import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"
import { upsertDiscordUser, ensureSchema, getUserRole } from "@/lib/community-db"
import { isDbConfigured } from "@/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "discord" || !profile?.id) return false
      if (!isDbConfigured()) return true

      try {
        await ensureSchema()
        await upsertDiscordUser({
          id: profile.id,
          username: profile.username ?? profile.name ?? "operator",
          avatarUrl: typeof profile.image === "string" ? profile.image : null,
        })
      } catch {
        return false
      }

      return true
    },
    async jwt({ token, profile }) {
      if (profile?.id) {
        token.sub = profile.id
      }
      if (profile?.username) {
        token.username = profile.username
      }
      if (profile?.image) {
        token.picture = profile.image
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? ""
        session.user.name = (token.username as string | undefined) ?? session.user.name
        session.user.image = (token.picture as string | undefined) ?? session.user.image
        // Resolve the live role from the database on each session read.
        if (isDbConfigured() && session.user.id) {
          try {
            session.user.role = await getUserRole(session.user.id)
          } catch {
            session.user.role = "user"
          }
        } else {
          session.user.role = "user"
        }
      }
      return session
    },
  },
  pages: {
    signIn: "/",
  },
  trustHost: true,
})
