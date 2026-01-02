// src/pages/FirstLoginChangePassword.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function FirstLoginChangePassword() {
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const role = (localStorage.getItem("role") || "").trim().toUpperCase();
  const username = localStorage.getItem("username") || "";
  const mustChangePassword =
    localStorage.getItem("mustChangePassword") === "true";

  /**
   * 🔐 Guard this page properly
   */
  useEffect(() => {
    // Not logged in → go to login
    if (!username || !role) {
      navigate("/login", { replace: true });
      return;
    }

    // Logged in but NOT required to change password → redirect away
    if (!mustChangePassword) {
      if (role === "SUPER_ADMIN") {
        navigate("/super-admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [username, role, mustChangePassword, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (pw1.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }

    if (pw1 !== pw2) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/auth/first-login-change-password", {
        newPassword: pw1,
      });

      // ✅ IMPORTANT: clear first-login flag
      localStorage.setItem("mustChangePassword", "false");

      alert("Password updated successfully.");

      // Route based on role
      if (role === "SUPER_ADMIN") {
        navigate("/super-admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      alert(err?.response?.data || "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ui-shell">
      <div className="ui-card">
        <div className="ui-card-header text-center">
          <h2 className="ui-title mb-0">Change Password</h2>
          <div className="ui-subtitle">
            You must update your password before continuing.
          </div>
        </div>

        <div className="ui-card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small text-muted">
                New Password
              </label>
              <input
                type="password"
                className="form-control ui-input"
                value={pw1}
                onChange={(e) => setPw1(e.target.value)}
                required
                disabled={saving}
                placeholder="At least 8 characters"
              />
            </div>

            <div className="mb-3">
              <label className="form-label small text-muted">
                Confirm New Password
              </label>
              <input
                type="password"
                className="form-control ui-input"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                required
                disabled={saving}
                placeholder="Re-enter password"
              />
            </div>

            <button
              className="btn btn-primary w-100 ui-btn"
              disabled={saving}
            >
              {saving ? "Updating..." : "Update Password"}
            </button>

            <div className="ui-divider" />

            <div className="text-center ui-subtitle small">
              Tip: use a mix of letters, numbers, and symbols.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
