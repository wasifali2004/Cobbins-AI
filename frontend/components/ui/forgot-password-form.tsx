"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CircleAlert, Mail } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Alert } from "@/components/ui/alert";
import { AuthHeroPane } from "@/components/ui/auth-hero-pane";
import { OriginButton } from "@/components/ui/origin-button";
import { ApiError, requestPasswordReset } from "@/lib/api-client";

type Notice = { kind: "success" | "error"; title: string; message: string };

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice(null);

    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setNotice({
        kind: "error",
        title: "Unable to continue",
        message: err instanceof ApiError ? err.message : "Please try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-vignette" aria-hidden />
      <Link href="/login" className="auth-back-link button button-ghost button-sm">
        <ArrowLeft size={15} aria-hidden /> Back to sign in
      </Link>
      <ThemeToggle className="auth-theme-toggle" />

      <div className="auth-layout">
      <AuthHeroPane />

      <section className="auth-card" aria-labelledby="forgot-title">
        {sent ? (
          <>
            <div className="auth-heading">
              <Mail size={26} aria-hidden style={{ marginBottom: 10, color: "var(--muted)" }} />
              <h1 id="forgot-title">Check your email</h1>
              <p>
                If an account exists for <strong>{email}</strong>, we just sent a link to reset your
                password. It expires in 30 minutes.
              </p>
            </div>
            <p className="auth-switch">
              Didn&apos;t get it?{" "}
              <button type="button" onClick={() => setSent(false)}>
                Try again
              </button>
            </p>
          </>
        ) : (
          <>
            <div className="auth-heading">
              <h1 id="forgot-title">Reset your password</h1>
              <p>Enter the email on your account and we&apos;ll send you a reset link.</p>
            </div>

            <form className="auth-form" onSubmit={submit}>
              <label className="field-group">
                <span className="sr-only">Email</span>
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
              <OriginButton className="auth-submit" type="submit" loading={isSubmitting}>
                Send reset link
              </OriginButton>
            </form>

            <p className="auth-switch">
              Remembered your password? <Link href="/login">Sign in</Link>
            </p>
          </>
        )}
      </section>
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

export default ForgotPasswordForm;
