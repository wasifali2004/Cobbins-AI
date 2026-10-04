"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Check, CircleAlert, Github } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Alert } from "@/components/ui/alert";
import { AuthHeroPane } from "@/components/ui/auth-hero-pane";
import { OriginButton } from "@/components/ui/origin-button";

type Mode = "login" | "signup";
type Notice = { kind: "success" | "error"; title: string; message: string };

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.31v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.99.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.57 10.57 0 0 0 12 1a11 11 0 0 0-9.82 6.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

export default function ModernLoginSignup({ defaultMode = "login" }: { defaultMode?: Mode }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const isLogin = mode === "login";

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setNotice(null);
    router.replace(nextMode === "login" ? "/login" : "/signup", { scroll: false });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        name: isLogin ? undefined : name,
        email,
        password,
        mode,
      });

      if (result?.error) {
        setNotice({
          kind: "error",
          title: "Unable to continue",
          message: result.error === "CredentialsSignin"
            ? "The email or password is incorrect."
            : result.error,
        });
      } else {
        setNotice({
          kind: "success",
          title: isLogin ? "Welcome back" : "Your workspace is ready",
          message: "Redirecting you to your workspace…",
        });
        setTimeout(() => router.push("/dashboard"), 900);
      }
    } catch {
      setNotice({
        kind: "error",
        title: "Unable to continue",
        message: "Please try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOAuth(provider: "google" | "github") {
    setOauthLoading(provider);
    setNotice(null);
    try {
      await signIn(provider, { callbackUrl: "/dashboard" });
    } catch {
      setNotice({
        kind: "error",
        title: `${provider === "google" ? "Google" : "GitHub"} sign-in failed`,
        message: "Please try again or use email and password.",
      });
      setOauthLoading(null);
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-vignette" aria-hidden />
      <Link href="/" className="auth-back-link button button-ghost button-sm">
        <ArrowLeft size={15} aria-hidden /> Back home
      </Link>
      <ThemeToggle className="auth-theme-toggle" />

      <div className="auth-layout">
      <AuthHeroPane />

      <motion.section
        className="auth-card"
        key={mode}
        initial={{ opacity: 0, y: reduceMotion ? 0 : 16, scale: reduceMotion ? 1 : 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
        aria-labelledby="auth-title"
      >
        <div className="auth-heading">
          <h1 id="auth-title">{isLogin ? "Sign in to Cobbins" : "Sign up for Cobbins"}</h1>
          <p>{isLogin ? "Return to your interface research workspace." : "Create your workspace and start building from references."}</p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {!isLogin && (
            <label className="field-group">
              <span className="sr-only">Full name</span>
              <input
                className="auth-input"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                required
              />
            </label>
          )}
          <label className="field-group">
            <span className="sr-only">Work email</span>
            <input
              className="auth-input"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@work-email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="field-group">
            <span className="sr-only">Password</span>
            <input
              className="auth-input"
              name="password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder="Password · at least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>
          {isLogin && (
            <Link href="/forgot-password" className="auth-forgot-link">
              Forgot password?
            </Link>
          )}
          <OriginButton className="auth-submit" type="submit" loading={isSubmitting}>
            {isLogin ? "Continue with email" : "Sign up with email"}
          </OriginButton>
        </form>

        <div className="auth-divider"><span>or</span></div>
        <div className="social-grid">
          <button
            className="social-button"
            type="button"
            disabled={oauthLoading === "google"}
            onClick={() => handleOAuth("google")}
          >
            <GoogleIcon />
            {oauthLoading === "google" ? "Redirecting…" : "Continue with Google"}
          </button>
          <button
            className="social-button"
            type="button"
            disabled={oauthLoading === "github"}
            onClick={() => handleOAuth("github")}
          >
            <Github />
            {oauthLoading === "github" ? "Redirecting…" : "Continue with GitHub"}
          </button>
        </div>

        <p className="auth-switch">
          {isLogin ? "Don't have a Cobbins account?" : "Already have an account?"}{" "}
          <button type="button" onClick={() => switchMode(isLogin ? "signup" : "login")}>
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
        <p className="auth-terms">
          By continuing, you agree to the Cobbins <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </motion.section>
      </div>

      {notice && (
        <Alert
          key={`${notice.kind}-${notice.message}`}
          icon={notice.kind === "success" ? <Check /> : <CircleAlert />}
          title={notice.title}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}
    </main>
  );
}
