// src/pages/Unauthorized.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import api from "../api";

export default function Unauthorized() {
  const navigate = useNavigate();
  const location = useLocation();

  const role = localStorage.getItem("role") || "";
  const username = localStorage.getItem("username") || "";
  const hotelCode = localStorage.getItem("hotelCode") || "";

  const loggedRef = useRef(false);

  useEffect(() => {
    if (loggedRef.current) return;
    loggedRef.current = true;

    api
      .post(
        "/audit-logs/unauthorized",
        { path: location.pathname, from: location.state?.from || "" },
        {
          headers: {
            "X-User-Role": role,
            "X-Username": username,
            "X-Hotel-Code": hotelCode,
          },
        }
      )
      .catch(() => {});
  }, [location.pathname]); // intentionally minimal

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/", { replace: true });
  };

  return (
    <div className="container vh-100 d-flex align-items-center justify-content-center">
      <div
        className="card shadow text-center p-4 unauthorized-card"
        style={{ maxWidth: 460 }}
      >
        <div className="card-body">
          <h1 className="text-danger mb-3">Access Denied</h1>
          <p className="mb-2">You do not have permission to view this page.</p>

          {(username || role) && (
            <p className="text-muted mb-3">
              Logged in as <strong>{username || "Unknown"}</strong>{" "}
              {role ? `(${role})` : ""}
              {hotelCode ? ` • Hotel: ${hotelCode}` : ""}
            </p>
          )}

          <div className="d-flex justify-content-center gap-2 flex-wrap">
            <button onClick={handleBack} className="btn btn-outline-secondary">
              ← Back
            </button>

            {role === "SUPER_ADMIN" ? (
              <Link to="/super-admin" className="btn btn-primary">
                Go to Super Admin Dashboard
              </Link>
            ) : (
              <Link to="/" className="btn btn-primary">
                Go to Dashboard
              </Link>
            )}

          </div>

          <div className="small mt-3 unauthorized-hint">
            If you believe this is an error, contact your manager/admin.
          </div>
        </div>
      </div>
    </div>
  );
}
