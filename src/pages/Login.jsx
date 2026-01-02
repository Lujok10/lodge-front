// src/pages/Login.jsx
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { notify } from "../utils/notify";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState(localStorage.getItem("remember_username") || "");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(localStorage.getItem("remember_me") === "true");

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const userRef = useRef(null);

  useEffect(() => {
    // Autofocus
    userRef.current?.focus();
  }, []);

  useEffect(() => {
    localStorage.setItem("remember_me", rememberMe ? "true" : "false");
    if (!rememberMe) {
      localStorage.removeItem("remember_username");
    }
  }, [rememberMe]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!username.trim() || !password) {
      notify.error("Enter your username and password.");
      return;
    }

    setSubmitting(true);
    const toastId = notify.loading("Signing in...");

    try {
      // ✅ ADAPT endpoint/payload to your backend
      const res = await api.post("/auth/login", {
        username: username.trim(),
        password,
      });

      // ✅ ADAPT these fields to match your response
      const { username: uName, role, hotelCode, mustChangePassword } = res.data || {};

      if (!role) throw new Error("Missing role from server response.");

      // persist auth
      localStorage.setItem("role", role);
      localStorage.setItem("username", (uName || username.trim()));
      if (hotelCode) localStorage.setItem("hotelCode", hotelCode);
      else localStorage.removeItem("hotelCode");
      localStorage.setItem(
        "mustChangePassword",
        mustChangePassword ? "true" : "false"
      );
       localStorage.removeItem("token");

      // remember me
      if (rememberMe) localStorage.setItem("remember_username", username.trim());

      notify.updateSuccess(toastId, "Welcome back!");

      if (mustChangePassword) {
        navigate("/first-login-change-password");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Login failed. Please try again.";

      notify.updateError(toastId, typeof msg === "string" ? msg : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ui-shell">
      <div className="ui-card auth-anim" role="region" aria-label="Login">
        <div className="ui-card-header text-center">
          <img
            src="/logo.gif"
            alt="Hotel Logo"
            style={{ width: 54, height: 54, objectFit: "contain" }}
            className="mb-2"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <h2 className="ui-title mb-1">Welcome back</h2>
          <div className="ui-subtitle">Sign in to continue</div>
        </div>

        <div className="ui-card-body">
          <form onSubmit={onSubmit}>
            <label className="form-label mt-2">Username</label>
            <input
              ref={userRef}
              className="form-control ui-input"
              placeholder="e.g. superadmin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              disabled={submitting}
            />

            <label className="form-label mt-3">Password</label>

            {/* ✅ Password toggle */}
            <div className="auth-pass-wrap">
              <input
                className="form-control ui-input auth-pass-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                disabled={submitting}
              />
              <button
                type="button"
                className="auth-pass-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={submitting}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>

            {/* ✅ Remember me + forgot */}
            <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
              <label className="auth-check">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={submitting}
                />
                <span>Remember me</span>
              </label>

              <Link className="small" to="/forgot-password">
                Forgot password?
              </Link>
            </div>

            {/* ✅ Spinner + disabled */}
            <button
              className="btn btn-primary w-100 mt-3 ui-btn"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <span className="d-inline-flex align-items-center gap-2">
                  <span className="auth-spinner" aria-hidden="true" />
                  Signing in...
                </span>
              ) : (
                "Login"
              )}
            </button>

            <div className="ui-divider" />

            <div className="d-flex justify-content-between align-items-center">
              <span className="ui-badge">🔒 Secure login</span>
              {/* If you don’t want Register link here, remove it */}
              {/* <Link className="small" to="/register">Create user</Link> */}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
