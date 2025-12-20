// src/components/AppLayout.jsx
import LogoutButton from "./LogoutButton";

export default function AppLayout({ children }) {
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  return (
    <>
      <nav className="navbar navbar-dark bg-dark px-3 d-flex justify-content-between">
        <span className="navbar-brand mb-0 h1">Lodge Management</span>
        {username && (
          <div className="d-flex align-items-center gap-3">
            <span className="text-white">
              {username} ({role})
            </span>
            <LogoutButton />
          </div>
        )}
      </nav>

      <main className="container mt-4">{children}</main>

      {/* <footer className="bg-dark text-white text-center py-3 mt-auto">
        &copy; {new Date().getFullYear()} Lodge Management
      </footer> */}
    </>
  );
}
