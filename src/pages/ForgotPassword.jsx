// src/pages/ForgotPassword.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { notify } from "../utils/notify";

/**
 * Dev-friendly password reset:
 * - POST /auth/request-reset { username } -> may return { resetToken } when backend exposeToken=true
 * - POST /auth/reset-password { username, token, newPassword }
 */
export default function ForgotPassword() {
  const [username, setUsername] = useState("");
  const [stage, setStage] = useState("request"); // request | reset
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [devToken, setDevToken] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const requestToken = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!username.trim()) {
      notify.error("Enter your username.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/auth/request-reset", { username: username.trim() });

      // Backend returns generic message always; in dev it can include resetToken
      const maybeToken = res?.data?.resetToken || "";
      if (maybeToken) {
        setDevToken(maybeToken);
        setToken(maybeToken); // prefill for convenience
        notify.success("Reset token generated (dev token shown below).");
      } else {
        setDevToken("");
        notify.success("If the user exists, a reset token has been generated.");
      }

      setStage("reset");
    } catch (err) {
      notify.error("Could not request reset token. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!username.trim() || !token.trim() || !newPassword) {
      notify.error("Fill in username, token, and new password.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/auth/reset-password", {
        username: username.trim(),
        token: token.trim(),
        newPassword,
      });

      notify.success("Password reset. You can now login.");
      // Clear sensitive fields
      setToken("");
      setNewPassword("");
      setDevToken("");
    } catch (err) {
      // Backend may return 400 with message
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Reset failed. Check your token and try again.";
      notify.error(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Forgot Password</h2>

        {stage === "request" ? (
          <>
            <p className="muted">Enter your username to generate a reset token.</p>

            <form onSubmit={requestToken} className="form">
              <label>
                Username
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. reception1"
                  autoComplete="username"
                />
              </label>

              <button type="submit" disabled={submitting}>
                {submitting ? "Requesting..." : "Request reset token"}
              </button>
            </form>

            <div className="auth-links">
              <Link to="/login">Back to login</Link>
            </div>
          </>
        ) : (
          <>
            <p className="muted">Enter the token and choose a new password.</p>

            <form onSubmit={resetPassword} className="form">
              <label>
                Username
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. reception1"
                  autoComplete="username"
                />
              </label>

              <label>
                Reset Token
                <input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste reset token"
                  autoComplete="one-time-code"
                />
              </label>

              {devToken ? (
                <div className="dev-token">
                  <div className="muted">Dev token (backend exposeToken=true):</div>
                  <code style={{ wordBreak: "break-all" }}>{devToken}</code>
                </div>
              ) : null}

              <label>
                New Password
                <input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  type="password"
                  autoComplete="new-password"
                />
              </label>

              <button type="submit" disabled={submitting}>
                {submitting ? "Resetting..." : "Reset password"}
              </button>
            </form>

            <div className="auth-links">
              <button
                type="button"
                className="linklike"
                onClick={() => {
                  setStage("request");
                  setToken("");
                  setNewPassword("");
                  setDevToken("");
                }}
              >
                Request a new token
              </button>
              <span> · </span>
              <Link to="/login">Back to login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
