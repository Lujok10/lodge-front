import LogoutButton from "./LogoutButton";

export default function AppHeader() {
  const username = localStorage.getItem("username");

  return (
    <nav className="navbar navbar-dark bg-dark px-3">
      <span className="navbar-brand mb-0 h1">Lodge Management</span>
      {username && <LogoutButton />}
    </nav>
  );
}
