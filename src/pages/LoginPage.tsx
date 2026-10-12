import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";

export function LoginPage({ onAuthenticated }: { onAuthenticated?: () => void }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") await register(email, password);
      else await login(email, password);
      onAuthenticated?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-panel" aria-labelledby="auth-title">
      <div className="auth-copy">
        <span className="eyebrow">MYNEWSTORE / ACCOUNT</span>
        <h1 id="auth-title">{mode === "login" ? "Welcome back." : "Create your account."}</h1>
        <p>Sign in to place orders and manage your storefront access.</p>
      </div>
      <form className="auth-form" onSubmit={submit}>
        <label htmlFor="auth-email">Email address</label>
        <input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <label htmlFor="auth-password">Password</label>
        <input id="auth-password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "register" ? 8 : undefined} required value={password} onChange={(event) => setPassword(event.target.value)} />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-dark submit-button" disabled={busy}>
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
        <button className="text-button" type="button" onClick={() => { setError(""); setMode(mode === "login" ? "register" : "login"); }}>
          {mode === "login" ? "New here? Create an account" : "Already registered? Sign in"}
        </button>
      </form>
    </section>
  );
}

