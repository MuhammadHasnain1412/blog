// src/auth.ts
import NextAuth, { type DefaultSession } from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { type user_role } from "@prisma/client";

// ✅ Module Augmentation to extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: user_role;
    } & DefaultSession["user"];
  }

  interface User {
    role?: user_role;
  }

  interface JWT {
    id: string;
    role: user_role;
  }
}

const ONE_DAY = 24 * 60 * 60;
const THIRTY_DAYS = 30 * ONE_DAY;

async function getUser(email: string) {
  try {
    return await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        role: true,
      },
    });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,

  // ✅ MUST DO: Session + JWT expiry configuration
  session: {
    strategy: "jwt",
    maxAge: THIRTY_DAYS, // Token lives 30 days max
    updateAge: ONE_DAY, // Re-issue token once per day (rolling window)
  },

  jwt: {
    maxAge: THIRTY_DAYS,
  },

  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({
            email: z.string().email(),
            password: z.string().min(6).max(100), // ✅ MUST DO: cap max length
          })
          .safeParse(credentials);

        if (!parsedCredentials.success) return null;

        const { email, password } = parsedCredentials.data;
        const user = await getUser(email);

        // ✅ MUST DO: always run bcrypt even if user not found
        // This prevents timing attacks that reveal valid emails
        const dummyHash =
          "$2b$12$invalid.hash.that.will.never.match.anything.here";
        const hashToCompare = user?.passwordHash ?? dummyHash;

        const passwordsMatch = await bcrypt.compare(password, hashToCompare);

        // ✅ Silent rejection — no log spam from credential stuffing bots
        if (!user || !passwordsMatch) {
          return null;
        }

        // ✅ MUST DO: return only what you need — never return passwordHash
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as user_role;
        token.email = user.email;
      }

      if (trigger === "update" && token.email) {
        const freshUser = await getUser(token.email as string);
        if (freshUser) {
          token.role = freshUser.role;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as user_role;
      }
      return session;
    },
  },
});
