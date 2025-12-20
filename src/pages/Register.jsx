import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "RECEPTION",
    hotelCode: "",
  });
  const [hotels, setHotels] = useState([]);
  const navigate = useNavigate();

  const requesterRole = localStorage.getItem("role") || "";
  const requesterHotelCode = localStorage.getItem("hotelCode") || "";

  useEffect(() => {
    const loadHotels = async () => {
      if (requesterRole === "SUPER_ADMIN") {
        const res = await api.get("/admin/hotels");
        setHotels(res.data || []);
      } else if (requesterRole === "MANAGER") {
        setForm((f) => ({ ...f, hotelCode: requesterHotelCode }));
      }
    };
    loadHotels();
  }, [requesterRole, requesterHotelCode]);

  if (requesterRole !== "MANAGER" && requesterRole !== "SUPER_ADMIN") {
    return <div className="container mt-5">Access denied.</div>;
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      username: form.username.trim(),
      password: form.password,
      role: form.role,
      hotelCode: requesterRole === "SUPER_ADMIN" ? form.hotelCode : undefined,
    };

    try {
      const res = await api.post("/auth/register", payload, { validateStatus: () => true });
      if (res.status !== 201) {
        alert(res.data || "Registration failed");
        return;
      }
      alert("User created.");
      navigate(requesterRole === "SUPER_ADMIN" ? "/super-admin" : "/");
    } catch (err) {
      console.error(err);
      alert("Registration failed");
    }
  };

  return (
    <div className="container vh-100 d-flex justify-content-center align-items-center bg-light">
      <div className="card shadow p-4" style={{ maxWidth: 420, width: "100%" }}>
        <h2 className="fw-bold text-primary text-center mb-4">Create User</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              type="text"
              className="form-control"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="form-select"
            >
              {requesterRole === "SUPER_ADMIN" && <option value="MANAGER">Manager</option>}
              <option value="RECEPTION">Reception</option>
            </select>
          </div>

          {requesterRole === "SUPER_ADMIN" && (
            <div className="mb-3">
              <label className="form-label">Hotel</label>
              <select
                name="hotelCode"
                value={form.hotelCode}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select hotel</option>
                {hotels.map((h) => (
                  <option key={h.id} value={h.code}>
                    {h.name} ({h.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {requesterRole === "MANAGER" && (
            <div className="alert alert-secondary py-2">
              Hotel locked: <strong>{requesterHotelCode || "N/A"}</strong>
            </div>
          )}

          <button type="submit" className="btn btn-primary w-100">
            Save User
          </button>
        </form>
      </div>
    </div>
  );
}
