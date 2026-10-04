"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CircleAlert } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Alert } from "@/components/ui/alert";
import { AuthHeroPane } from "@/components/ui/auth-hero-pane";
import { OriginButton } from "@/components/ui/origin-button";
import { PasswordStrength } from "@/components/ui/password-strength";
import { ApiError, resetPassword } from "@/lib/api-client";

type Notice = { kind: "success" | "error"; title: string; message: string };

export function ResetPasswordForm({ token }: { token: string | undefined }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setNotice(null);

    if (password !== confirmPassword) {
      setNotice({ kind: "error", title: "Passwords don't match", message: "Make sure both passwords are the same." });
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      setNotice({
        kind: "success",
        title: "Password updated",
        message: "Redirecting you to sign in…",
      });
      setTimeout(() => router.push("/login"), 1200);
    } catch (err) {
      setNotice({
        kind: "error",
        title: "Unable to reset password",
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

      <section className="auth-card" aria-labelledby="reset-title">
        {!token ? (
          <div className="auth-heading">
            <h1 id="reset-title">This link is invalid</h1>
            <p>The reset link is missing its token. Request a new one to continue.</p>
            <p className="auth-switch" style={{ marginTop: 18 }}>
              <Link href="/forgot-password">Request a new link</Link>
            </p>
          </div>
        ) : (
          <>
            <div className="auth-heading">
              <h1 id="reset-title">Set a new password</h1>
              <p>Choose a strong password you haven&apos;t used before.</p>
            </div>

            <form className="auth-form" onSubmit={submit}>
              <label className="field-group">
                <span className="sr-only">New password</span>
                <input
                  className="auth-input"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  spellCheck={false}
                  placeholder="New password · at least 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </label>

              <PasswordStrength value={password} className="mt-1" />

              <label className="field-group">
                <span className="sr-only">Confirm new password</span>
                <input
                  className="auth-input"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  spellCheck={false}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </label>

              <OriginButton className="auth-submit" type="submit" loading={isSubmitting}>
                Reset password
              </OriginButton>
            </form>
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

export default ResetPasswordForm;
