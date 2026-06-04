import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import prisma from "./prisma";
import { isSuperOwner } from "./superowner";
import { Permission } from "@/types";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Discord({
      clientId: process.env.AUTH_DISCORD_ID!,
      clientSecret: process.env.AUTH_DISCORD_SECRET!,
      authorization: {
        params: {
          scope: "identify guilds",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!profile?.id) return false;

      // Super owner always has access
      if (isSuperOwner(profile.id as string)) {
        return true;
      }

      // Check if this Discord ID is registered as staff
      const staff = await prisma.dashboardStaff.findUnique({
        where: { discordId: profile.id as string },
      });

      if (!staff) {
        return false; // Not a registered staff member
      }

      // Update their username and avatar
      await prisma.dashboardStaff.update({
        where: { discordId: profile.id as string },
        data: {
          username: (profile as any).global_name || (profile as any).username || user.name || "Unknown",
          avatar: user.image || null,
        },
      });

      return true;
    },
    async jwt({ token, account, profile }) {
      if (profile?.id) {
        // Super owner always gets full permissions
        if (isSuperOwner(profile.id as string)) {
          token.staffId = -1;
          token.discordId = profile.id as string;
          token.permissions = Object.values(Permission);
          token.staffUsername = (profile as any).global_name || (profile as any).username || "Owner";
          token.staffAvatar = (profile as any).avatar
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${(profile as any).avatar}.png`
            : null;
          return token;
        }

        const staff = await prisma.dashboardStaff.findUnique({
          where: { discordId: profile.id as string },
        });

        if (staff) {
          token.staffId = staff.id;
          token.discordId = staff.discordId;
          token.permissions = staff.permissions ? JSON.parse(staff.permissions) : [];
          token.staffUsername = staff.username;
          token.staffAvatar = staff.avatar;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session as any).staff = {
          id: token.staffId,
          discordId: token.discordId,
          permissions: token.permissions,
          username: token.staffUsername,
          avatar: token.staffAvatar,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
});
