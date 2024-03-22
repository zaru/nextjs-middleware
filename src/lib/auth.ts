import type { Provider } from "@auth/core/providers";
import NextAuth, { type NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

export const providers: Provider[] = [GitHub];

const config = {
  theme: {
    logo: "https://next-auth.js.org/img/logo/logo-sm.png",
  },
  session: {
    strategy: "jwt",
  },
  basePath: "/nextauth-api/auth",
  providers: providers,
  callbacks: {
    authorized({ request, auth }) {
      console.log("authorized session:", auth);
      const { pathname } = request.nextUrl;
      if (pathname === "/nextauth") return !!auth;
      return true;
    },
    async jwt({ token, account, profile }) {
      console.log("authorized token:", token);
      return token;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
