import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="btn btn-outline-light"
      type="button"
    >
      Logout
    </button>
  );
}
