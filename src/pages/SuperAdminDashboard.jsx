import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { notify } from "../utils/notify";

export default function SuperAdminDashboard() {
  const [hotels, setHotels] = useState([]);
  const [newHotel, setNewHotel] = useState({ code: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const navigate = useNavigate();
  const role = localStorage.getItem("role") || "";
  const username = localStorage.getItem("username") || "";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const loadHotels = useCallback(async () => {
    setLoading(true);
    try {
      // If your backend requires headers, add them here:
      // const res = await api.get("/admin/hotels", { headers: { "X-User-Role": role } });
      const res = await api.get("/admin/hotels");
      setHotels(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load hotels:", err);
      setHotels([]);
      const msg =
        typeof err?.response?.data === "string"
          ? err.response.data
          : "Failed to load hotels.";
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role !== "SUPER_ADMIN") {
      navigate("/unauthorized", { replace: true });
      return;
    }
    loadHotels();
  }, [role, navigate, loadHotels]);

  const handleHotelChange = (e) => {
    const { name, value } = e.target;
    setNewHotel((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateHotel = async (e) => {
    e.preventDefault();

    const code = (newHotel.code || "").trim().toUpperCase();
    const name = (newHotel.name || "").trim();

    if (!code || !name) {
      notify.error("Hotel code and name are required.");
      return;
    }

    // Prevent duplicates locally (nice UX)
    const exists = hotels.some((h) => String(h.code || "").toUpperCase() === code);
    if (exists) {
      notify.error(`Hotel code "${code}" already exists.`);
      return;
    }

    setCreating(true);
    try {
      const res = await api.post("/admin/hotels", { code, name });

      // Add returned hotel safely
      const created = res?.data;
      if (created?.code) {
        setHotels((prev) => [...prev, created]);
      } else {
        // fallback: refresh if API response is not as expected
        await loadHotels();
      }

      setNewHotel({ code: "", name: "" });
      notify.success("Hotel created.");
    } catch (err) {
      console.error("Failed to create hotel:", err);
      const msg =
        typeof err?.response?.data === "string"
          ? err.response.data
          : "Failed to create hotel.";
      notify.error(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm border-bottom">
        <div className="container-fluid">
          <span className="navbar-brand fw-semibold">SUPER ADMIN</span>

          <div className="ms-auto d-flex align-items-center gap-2">
            <span className="text-white small d-none d-md-inline">
              {username || "User"} (SUPER_ADMIN)
            </span>

            <div className="dropdown">
              <button
                className="btn btn-sm btn-outline-light dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Menu
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <Link className="dropdown-item" to="/super-admin">
                    Hotels
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/register">
                    Create Users
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    type="button"
                    className="dropdown-item text-danger"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mt-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4 className="mb-0">Hotels</h4>
          <Link to="/register" className="btn btn-primary">
            + Create User
          </Link>
        </div>

        <div className="row g-3">
          {/* Create Hotel */}
          <div className="col-md-5">
            <div className="card shadow-sm">
              <div className="card-header fw-semibold">Create Hotel</div>
              <div className="card-body">
                <form onSubmit={handleCreateHotel}>
                  <div className="mb-3">
                    <label className="form-label">Code</label>
                    <input
                      name="code"
                      value={newHotel.code}
                      onChange={handleHotelChange}
                      className="form-control"
                      placeholder="HOTEL_X"
                      required
                      disabled={creating}
                    />
                    <div className="form-text">
                      Tip: codes are stored as uppercase (e.g., <b>HOTEL_ASHBURN</b>)
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input
                      name="name"
                      value={newHotel.name}
                      onChange={handleHotelChange}
                      className="form-control"
                      placeholder="Hotel Name"
                      required
                      disabled={creating}
                    />
                  </div>

                  <button className="btn btn-primary w-100" disabled={creating}>
                    {creating ? "Saving..." : "Save Hotel"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Existing Hotels */}
          <div className="col-md-7">
            <div className="card shadow-sm">
              <div className="card-header fw-semibold d-flex justify-content-between align-items-center">
                <span>Existing Hotels</span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={loadHotels}
                  disabled={loading}
                >
                  {loading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-sm table-striped mb-0">
                    <thead>
                      <tr>
                        <th className="ps-3">Code</th>
                        <th>Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hotels.map((h) => (
                        <tr key={h.id ?? h.code}>
                          <td className="ps-3 fw-semibold">{h.code}</td>
                          <td>{h.name}</td>
                        </tr>
                      ))}

                      {!loading && hotels.length === 0 && (
                        <tr>
                          <td className="ps-3" colSpan={2}>
                            No hotels yet.
                          </td>
                        </tr>
                      )}

                      {loading && (
                        <tr>
                          <td className="ps-3" colSpan={2}>
                            Loading...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
