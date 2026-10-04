import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

if (!process.env.NEXTAUTH_SECRET) {
  // Fail fast rather than silently signing session tokens with a
  // predictable, publicly-known fallback secret that would let anyone forge
  // a valid session for any user.
  throw new Error("NEXTAUTH_SECRET is not set. Refusing to start without it.");
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    // ─── Google ──────────────────────────────────────────────────────────────
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),

    // ─── GitHub ──────────────────────────────────────────────────────────────
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),

    // ─── Email / Password ────────────────────────────────────────────────────
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        name:     { label: "Name",     type: "text" },
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
        mode:     { label: "Mode",     type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const mode = credentials.mode === "signup" ? "signup" : "login";
        const body: Record<string, string> = {
          email: credentials.email,
          password: credentials.password,
        };
        if (mode === "signup" && credentials.name) {
          body.name = credentials.name;
        }

        try {
          const response = await fetch(`${API_URL}/auth/${mode}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          const data = await response.json().catch(() => null);

          if (!response.ok) {
            const message =
              data?.message
                ? Array.isArray(data.message) ? data.message[0] : data.message
                : "Invalid credentials.";
            throw new Error(message);
          }

          return {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            accessToken: data.accessToken,
          };
        } catch (error) {
          throw new Error(
            error instanceof Error ? error.message : "Authentication failed.",
          );
        }
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        if ("accessToken" in user) {
          token.accessToken = (user as { accessToken?: string }).accessToken;
        }
      }
      if (account) {
        token.provider = account.provider;
      }

      // Google/GitHub don't give us a backend session directly, so exchange
      // the verified OAuth identity for one via a server-to-server call. This
      // runs on EVERY jwt callback invocation (not just initial sign-in) as
      // long as accessToken is still missing, so a session that failed to
      // pick one up the first time (bridge briefly down, etc.) self-heals on
      // the next request instead of being stuck signed-in-but-broken forever.
      if (!token.accessToken && token.email) {
        try {
          const bridgeSecret = process.env.OAUTH_BRIDGE_SECRET;
          if (!bridgeSecret) throw new Error("OAUTH_BRIDGE_SECRET is not set");

          const response = await fetch(`${API_URL}/auth/oauth-login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-secret": bridgeSecret,
            },
            body: JSON.stringify({
              name: token.name ?? "New user",
              email: token.email,
              image: token.picture,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            token.id = data.user.id;
            token.accessToken = data.accessToken;
          } else {
            console.error(`[auth] oauth-login bridge failed: ${response.status} ${await response.text()}`);
          }
        } catch (err) {
          console.error("[auth] oauth-login bridge threw", err);
          // Leave accessToken unset; backend-dependent features will show a
          // clean "sign in required" state instead of crashing.
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
      }
      (session as { accessToken?: string }).accessToken = token.accessToken as string | undefined;
      (session as { provider?: string }).provider = token.provider as string | undefined;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  // Local dev runs over plain http, so cookies can't be marked Secure there —
  // but a real deployment must have the browser refuse to send the session
  // cookie over anything but https.
  useSecureCookies: process.env.NODE_ENV === "production",

  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
