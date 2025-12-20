import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import { Toaster } from "react-hot-toast";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Unauthorized from "./pages/Unauthorized";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import FirstLoginChangePassword from "./pages/FirstLoginChangePassword";
import ForgotPassword from "./pages/ForgotPassword";
import ProtectedRoute from "./components/ProtectedRoute";

import "./styles/mobile.css";
import "./styles/global.css";
import "./styles/theme.css";
import "bootstrap/dist/css/bootstrap.css";
import "./styles/modern-ui.css";
import "react-phone-number-input/style.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./styles/dashboard-table.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: "12px", fontSize: "14px" },
        }}
      />

      <Routes>
        {/* App layout wrapper */}
        <Route element={<App />}>
          {/* PUBLIC */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/first-login-change-password"
            element={<FirstLoginChangePassword />}
          />

          {/* SUPER ADMIN */}
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* CREATE USERS: MANAGER + SUPER_ADMIN */}
          <Route
            path="/register"
            element={
              <ProtectedRoute allowedRoles={["MANAGER", "SUPER_ADMIN"]}>
                <Register />
              </ProtectedRoute>
            }
          />

          {/* DASHBOARD: MANAGER + RECEPTION */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={["MANAGER", "RECEPTION"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<p className="text-center mt-5">Page Not Found</p>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
