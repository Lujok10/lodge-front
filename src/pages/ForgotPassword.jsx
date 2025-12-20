// src/pages/ForgotPassword.jsx
import { useState } from "react";
import api from "../api";

export default function ForgotPassword() {
  const [username, setUsername] = useState("");
  const [stage, setStage] = useState("request"); // request | reset
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const requestToken = async (e) => {
    e.preventDefault();
    await api.post("/auth/request-reset", { username });
    alert("If the user exists, a reset token has been generated (check server logs for now).");
    setStage("reset");
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    await api.post("/auth/reset-password", { username, token, newPassword });
    alert("Password reset. You can now login.");
  };

  return stage === "request" ? (
    <form onSubmit={requestToken}>
      {/* your UI here */}
    </form>
  ) : (
    <form onSubmit={resetPassword}>
      {/* UI for token + new password */}
    </form>
  );
}
