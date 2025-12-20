// src/App.jsx
import { Outlet, useLocation } from "react-router-dom";

export default function App() {
  const { pathname } = useLocation();

  const isAuth =
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/first-login-change-password";

  // ✅ Auth pages should render alone (no container / no dashboard shell)
  if (isAuth) return <Outlet />;

  // ✅ App pages can have the dashboard background wrapper
  return (
    <div className="dashboard-shell">
      <Outlet />
    </div>
  );
}
