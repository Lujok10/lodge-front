import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!currentPassword) {
    alert("Enter your current password.");
    return;
  }

  if (newPassword.length < 8) {
    alert("New password must be at least 8 characters.");
    return;
  }
  if (newPassword !== confirm) {
    alert("New passwords do not match.");
    return;
  }

  try {
    const res = await api.post("/auth/change-password", {
      currentPassword,
      newPassword,
    });

    // ✅ IMPORTANT: stop first-login redirects after success
    localStorage.setItem("mustChangePassword", "false");

    alert(typeof res.data === "string" ? res.data : "Password updated successfully.");
    navigate("/");
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data ||
      "Failed to change password.";
    alert(typeof msg === "string" ? msg : "Failed to change password.");
  }
};

  return (
    <div className="container vh-100 d-flex justify-content-center align-items-center">
      <div className="card shadow p-4" style={{ maxWidth: 420, width: "100%" }}>
        <h4 className="mb-3 text-center">Change Password</h4>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className="form-control"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <div className="form-text">Minimum 8 characters.</div>
          </div>

          <div className="mb-3">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              className="form-control"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary w-100">Update Password</button>
        </form>
      </div>
    </div>
  );
}
