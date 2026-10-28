"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff, LoaderCircle, Moon, Sun } from "lucide-react";

import styles from "./InstructorAdminLogin.module.css";

type ColorMode = "light" | "dark";

export function InstructorAdminLogin() {
  const [colorMode, setColorMode] = useState<ColorMode>("light");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const savedMode = window.localStorage.getItem("godaapp-instructor-theme");
    if (savedMode === "light" || savedMode === "dark") {
      setColorMode(savedMode);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setColorMode("dark");
    }
  }, []);

  function toggleColorMode() {
    setColorMode((currentMode) => {
      const nextMode = currentMode === "light" ? "dark" : "light";
      window.localStorage.setItem("godaapp-instructor-theme", nextMode);
      return nextMode;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    let response: Response;
    try {
      response = await fetch("/payload-api/instructors/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
    } catch {
      setErrorMessage("We couldn't connect. Check your connection and try again.");
      setIsSubmitting(false);
      return;
    }

    if (!response.ok) {
      setErrorMessage(
        response.status === 429 || response.status === 423
          ? "Too many sign-in attempts. Please wait a few minutes and try again."
          : "Those sign-in details don't match an instructor account. Please try again.",
      );
      setIsSubmitting(false);
      return;
    }

    window.location.assign("/instructor-panel");
  }

  return (
    <main className={styles.page} data-mode={colorMode}>
      <button
        className={styles.themeToggle}
        type="button"
        onClick={toggleColorMode}
        aria-label={`Switch to ${colorMode === "light" ? "dark" : "light"} mode`}
        title={`Switch to ${colorMode === "light" ? "dark" : "light"} mode`}
      >
        {colorMode === "light" ? (
          <Moon aria-hidden="true" />
        ) : (
          <Sun aria-hidden="true" className={styles.activeThemeIcon} />
        )}
      </button>

      <div className={styles.layout}>
        <section className={styles.brandPanel} aria-label="GodaApp instructor portal">
          <div className={styles.brandTop}>
            <img className={styles.logo} src="/logotrans.png" alt="GodaApp" />
            <p className={styles.brandEyebrow}>Instructor portal</p>
          </div>

          <div className={styles.brandMessage}>
            <p className={styles.brandKicker}>Teach what moves you.</p>
            <h1>Make your expertise go further.</h1>
            <p className={styles.brandDescription}>
              Sign in to manage your courses, guide your learners, and grow your impact.
            </p>
          </div>

          <p className={styles.brandFootnote}>A learning community built to move forward.</p>
        </section>

        <section className={styles.formPanel} aria-labelledby="login-heading">
          <div className={styles.formContent}>
            <div className={styles.headingGroup}>
              <p className={styles.formEyebrow}>Welcome back</p>
              <h2 id="login-heading">Sign in to GodaApp</h2>
              <p className={styles.formDescription}>
                Use your instructor account details to continue.
              </p>
            </div>

            <form className={styles.form} onSubmit={handleSubmit} aria-busy={isSubmitting}>
              <label className={styles.field}>
                <span className={styles.label}>Email address</span>
                <input
                  className={styles.input}
                  type="email"
                  name="email"
                  autoComplete="username"
                  inputMode="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setErrorMessage("");
                  }}
                  required
                  disabled={isSubmitting}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Password</span>
                <span className={styles.passwordWrap}>
                  <input
                    className={`${styles.input} ${styles.passwordInput}`}
                    type={passwordVisible ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setErrorMessage("");
                    }}
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    className={styles.passwordToggle}
                    type="button"
                    onClick={() => setPasswordVisible((visible) => !visible)}
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                    aria-pressed={passwordVisible}
                    disabled={isSubmitting}
                  >
                    {passwordVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                  </button>
                </span>
              </label>

              <div className={styles.formLinks}>
                <span>Keep your account secure.</span>
                <Link className={styles.forgotLink} href="/instructor-panel/forgot">
                  Forgot password?
                </Link>
              </div>

              {errorMessage && (
                <p className={styles.errorMessage} role="alert">
                  {errorMessage}
                </p>
              )}

              <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoaderCircle className={styles.spinner} aria-hidden="true" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <p className={styles.supportText}>
              Need an instructor account?{" "}
              <Link className={styles.contactLink} href="/contact">
                Contact your GodaApp administrator.
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}