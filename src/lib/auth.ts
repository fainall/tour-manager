import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { UserRole } from "@/generated/prisma/client";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    emailVerified?: Date | null;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
    avatarUrl?: string | null;
  }

  interface Session {
    user: User;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
    avatarUrl?: string | null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
            deletedAt: null,
          },
        });

        if (!user || !user.isActive) return null;

        const passwordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!passwordValid) return null;

        return {
          id: user.id,
          email: user.email,
          emailVerified: null,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          avatarUrl: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.role = user.role;
        token.isActive = user.isActive;
        token.avatarUrl = user.avatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        email: token.email!,
        emailVerified: null,
        firstName: token.firstName,
        lastName: token.lastName,
        role: token.role,
        isActive: token.isActive,
        avatarUrl: token.avatarUrl,
      };
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});

export function requireRole(userRole: UserRole, ...allowedRoles: UserRole[]) {
  if (!allowedRoles.includes(userRole)) {
    throw new Error("Forbidden");
  }
}
