// src/components/GuestForm.jsx
// import { useState } from "react";
// import axios from "axios";

// export default function GuestForm({ onGuestAdded }) {
//   const [guest, setGuest] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     phone: "",
//     checkInDate: "",
//     checkOutDate: "",
//   });

//   const handleChange = (e) => {
//     setGuest({ ...guest, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//         //await api.post("/guests/checkin", form);
//       await axios.post("http://localhost:9002/api/guests/checkin", guest);
//       alert("Guest added successfully!");
//       setGuest({
//         firstName: "",
//         lastName: "",
//         email: "",
//         phone: "",
//         checkInDate: "",
//         checkOutDate: "",
//       });
//       if (onGuestAdded) onGuestAdded();
//     } catch (error) {
//       console.error("Error adding guest:", error);
//       alert("Failed to add guest.");
//     }
//   };

//   return (
//     <div className="card p-4 shadow">
//       <h4 className="mb-3">Add Guest</h4>
//       <form onSubmit={handleSubmit}>
//         <div className="mb-3">
//           <label className="form-label">First Name</label>
//           <input
//             type="text"
//             className="form-control"
//             name="firstName"
//             value={guest.firstName}
//             onChange={handleChange}
//             required
//           />
//         </div>

//         <div className="mb-3">
//           <label className="form-label">Last Name</label>
//           <input
//             type="text"
//             className="form-control"
//             name="lastName"
//             value={guest.lastName}
//             onChange={handleChange}
//             required
//           />
//         </div>

//         <div className="mb-3">
//           <label className="form-label">Email</label>
//           <input
//             type="email"
//             className="form-control"
//             name="email"
//             value={guest.email}
//             onChange={handleChange}
//             required
//           />
//         </div>

//         <div className="mb-3">
//           <label className="form-label">Phone</label>
//           <input
//             type="text"
//             className="form-control"
//             name="phone"
//             value={guest.phone}
//             onChange={handleChange}
//             required
//           />
//         </div>

//         <div className="mb-3">
//           <label className="form-label">Check-In Date</label>
//           <input
//             type="date"
//             className="form-control"
//             name="checkInDate"
//             value={guest.checkInDate}
//             onChange={handleChange}
//             required
//           />
//         </div>

//         <div className="mb-3">
//           <label className="form-label">Check-Out Date</label>
//           <input
//             type="date"
//             className="form-control"
//             name="checkOutDate"
//             value={guest.checkOutDate}
//             onChange={handleChange}
//             required
//           />
//         </div>

//         <button type="submit" className="btn btn-primary w-100">
//           Add Guest
//         </button>
//       </form>
//     </div>
//   );
// }

//import { useState } from "react";
//import api from "./api";
//import { useNavigate } from "react-router-dom";

import { useState } from "react";
import axios from "axios";

export default function GuestForm({ refresh }) {
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        checkInTime: "",
        checkOutTime: "",
        paymentType: "CASH",
        paymentAmount: "",
        lateCheckoutFee: "",
    });


    const paymentOptions = ["CASH", "CARD", "ONLINE"];

    //const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // const handleSubmit = async (e) => {
    //     e.preventDefault();
    //     try {
    //         //await api.post("/guests/checkin", form);
    //         await axios.post("http://localhost:9002/guests/checkin", form, {
    //             validateStatus: () => true, // prevent axios from auto-throwing 403
    //             headers: {
    //                 'X-User-Role': 'Manager'
    //             },
    //         });
    //         //await axios.post("http://localhost:9002/api/guests/checkin", form);
    //         //await api.post("/guests/checkin", form); guests/checkin
    //         refresh();
    //         setForm({
    //             firstName: "",
    //             lastName: "",
    //             email: "",
    //             phone: "",
    //             checkInTime: "",
    //             checkOutTime: "",
    //             paymentType: "CASH",
    //             paymentAmount: "",
    //             lateCheckoutFee: "",
    //         });
    //     } catch (err) {
    //         alert("Check-in failed.");
    //     }
    // };

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
       await axios.post("http://localhost:9002/api/guests/checkin", form);
        //await api.post("/guests/checkin", form);

      //await api.post("/auth/register", form);
refresh();
     setForm({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                checkInTime: "",
                checkOutTime: "",
                paymentType: "CASH",
                paymentAmount: "",
                lateCheckoutFee: "",
            });
     // alert("Registration successful. Please login.");
      //navigate("/login");
    } catch {
      //alert("Registration failed");
    }
  };

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded bg-light">
            <h3 className="mb-4 text-primary">Guest Check-In</h3>

            <div className="row g-3">
                <div className="col-md-6">
                    <input
                        type="text"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        placeholder="First Name"
                        className="form-control"
                        required
                    />
                </div>
                <div className="col-md-6">
                    <input
                        type="text"
                        name="lastName"
                        value={form.lastName}
                        onChange={handleChange}
                        placeholder="Last Name"
                        className="form-control"
                        required
                    />
                </div>
                <div className="col-12">
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Email"
                        className="form-control"
                        required
                    />
                </div>
                <div className="col-12">
                    <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="Phone"
                        className="form-control"
                        required
                    />
                </div>
                <div className="col-md-6">
                    <input
                        type="datetime-local"
                        name="checkInTime"
                        value={form.checkInTime}
                        onChange={handleChange}
                        className="form-control"
                    />
                </div>
                <div className="col-md-6">
                    <input
                        type="datetime-local"
                        name="checkOutTime"
                        value={form.checkOutTime}
                        onChange={handleChange}
                        className="form-control"
                    />
                </div>
                <div className="col-md-6">
                    <select
                        name="paymentType"
                        value={form.paymentType}
                        onChange={handleChange}
                        className="form-select"
                    >
                        {paymentOptions.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-md-3">
                    <input
                        type="number"
                        name="paymentAmount"
                        placeholder="Payment Amount"
                        value={form.paymentAmount}
                        onChange={handleChange}
                        className="form-control"
                        step="0.01"
                    />
                </div>
                <div className="col-md-3">
                    <input
                        type="number"
                        name="lateCheckoutFee"
                        placeholder="Late Checkout Fee"
                        value={form.lateCheckoutFee}
                        onChange={handleChange}
                        className="form-control"
                        step="0.01"
                    />
                </div>
            </div>

            <div className="mt-4">
                <button type="submit" className="btn btn-primary">
                    Check In
                </button>
            </div>
        </form>
    );
}
