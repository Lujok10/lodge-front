// import { useEffect, useState } from "react";
// import api from "./api";
// import GuestList from "./GuestList";
// import jsPDF from "jspdf";
// import "jspdf-autotable";

// export default function Dashboard() {
//   const [guests, setGuests] = useState([]);
//   const [search, setSearch] = useState("");
//   const role = localStorage.getItem("role");

//   const fetchGuests = async () => {
//     try {
//       const res = await api.get("/guests");
//       setGuests(res.data);
//     } catch {
//       alert("Failed to fetch guests");
//     }
//   };

//   useEffect(() => {
//     fetchGuests();
//   }, []);

//   const deleteGuest = async (id) => {
//     if (window.confirm("Are you sure you want to delete this guest?")) {
//       try {
//         await api.delete(`/guests/${id}`);
//         fetchGuests();
//       } catch {
//         alert("Failed to delete guest");
//       }
//     }
//   };

//   const exportToPDF = () => {
//     const doc = new jsPDF();
//     doc.text("Guest Report", 14, 16);
//     const tableData = guests.map((g) => [
//       `${g.firstName} ${g.lastName}`,
//       g.email,
//       g.phone,
//       g.checkInTime || "N/A",
//       g.checkOutTime || "Pending",
//       g.paymentType || "-",
//       g.paymentAmount || "-",
//       g.lateCheckoutFee || "-",
//     ]);
//     doc.autoTable({
//       startY: 20,
//       head: [
//         [
//           "Name",
//           "Email",
//           "Phone",
//           "Check-In",
//           "Check-Out",
//           "Payment Type",
//           "Amount",
//           "Late Fee",
//         ],
//       ],
//       body: tableData,
//     });
//     doc.save("guest-report.pdf");
//   };

//   const filteredGuests = guests.filter((g) => {
//     const text = `${g.firstName} ${g.lastName} ${g.email} ${g.phone}`.toLowerCase();
//     return text.includes(search.toLowerCase());
//   });

//   return (
//     <div className="container my-4">
//       <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mb-4 gap-3">
//         <input
//           type="text"
//           placeholder="Search by name, email, or phone..."
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           className="form-control w-100 w-sm-50"
//         />
//         <button
//           onClick={exportToPDF}
//           className="btn btn-warning"
//           type="button"
//         >
//           Export to PDF
//         </button>
//       </div>

//       {(role === "MANAGER" || role === "RECEPTION") && (
//         <div className="mb-4">
//           {/* Assuming GuestForm is still bootstrap styled */}
//           <GuestForm refresh={fetchGuests} />
//         </div>
//       )}

//       <GuestList
//         guests={filteredGuests}
//         role={role}
//         refresh={fetchGuests}
//         deleteGuest={deleteGuest}
//       />
//     </div>
//   );
// }

// import { useEffect, useState } from "react";
// import api from "../api";
// import GuestForm from "../GuestForm";
// import CheckoutForm from "../CheckoutForm";
// import EditGuestModal from "../components/EditGuestModal";
// import AppLayout from "../components/AppLayout";

// export default function Dashboard() {
//   const [guests, setGuests] = useState([]);
//   const [search, setSearch] = useState("");
//   const [editGuest, setEditGuest] = useState(null);

//   const username = localStorage.getItem("username");
//   const role = localStorage.getItem("role");

//   // Redirect to login if not authenticated
//   useEffect(() => {
//     if (!username || !role) {
//       window.location.href = "/login";
//     }
//   }, [username, role]);

//   const fetchGuests = async () => {
//     try {
//       const res = await api.get("/api/guests");
//       setGuests(res.data);
//     } catch {
//       alert("Failed to fetch guests");
//     }
//   };

//   useEffect(() => {
//     fetchGuests();
//   }, []);

//   const filteredGuests = guests.filter((g) => {
//     const text = `${g.firstName} ${g.lastName} ${g.email} ${g.phone}`.toLowerCase();
//     return text.includes(search.toLowerCase());
//   });

//   const handleEditSave = async (updatedData) => {
//     try {
//       await api.put(`/guests/${editGuest.id}`, updatedData);
//       setEditGuest(null);
//       fetchGuests();
//     } catch {
//       alert("Failed to update guest");
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col">
//       {/* HEADER */}
//       <header className="bg-black text-white py-4 px-6 shadow-md flex justify-between items-center">
//         <div className="flex items-center space-x-2">
//           <img src="/logo.gif" alt="Logo" className="w-8 h-8" />
//           <span className="text-xl font-semibold">
//             {role === "MANAGER" ? "Manager Dashboard" : "Reception Dashboard"}
//           </span>
//         </div>
//         <nav className="space-x-4">
//           <span className="text-sm">
//             Welcome, <strong>{username}</strong> ({role})
//           </span>
//           <a href="/dashboard" className="hover:underline">Dashboard</a>
//           {role === "MANAGER" && (
//             <a href="/register" className="hover:underline">Register User</a>
//           )}
//           <a
//             href="/login"
//             onClick={() => {
//               localStorage.clear();
//             }}
//             className="hover:underline"
//           >
//             Logout
//           </a>
//         </nav>
//       </header>

//       {/* MAIN CONTENT */}
//       <main className="flex-1 overflow-y-auto">
//         <AppLayout>
//           <div className="p-4">
//             {/* Welcome Message */}
//             <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded">
//               {role === "MANAGER"
//                 ? `Hello ${username}, as a Manager you can manage all guest records and system users.`
//                 : `Hello ${username}, as a Receptionist you can check in/out guests and update guest details.`}
//             </div>

//             {/* Search Bar */}
//             <input
//               type="text"
//               placeholder="Search guests..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="px-4 py-2 border rounded w-full mb-4"
//             />

//             {/* Add Guest Form */}
//             {(role === "MANAGER" || role === "RECEPTION") && (
//               <GuestForm refresh={fetchGuests} />
//             )}

//             {/* Guest List */}
//             <ul className="space-y-4">
//               {filteredGuests.map((guest) => (
//                 <li
//                   key={guest.id}
//                   className="bg-white rounded shadow p-4 space-y-2"
//                 >
//                   <div className="flex justify-between items-center">
//                     <div>
//                       <div className="text-lg font-semibold">
//                         {guest.firstName} {guest.lastName}
//                       </div>
//                       <div className="text-sm text-gray-600">
//                         📧 {guest.email} | 📞 {guest.phone}
//                       </div>
//                       <div className="text-sm text-gray-500">
//                         🕓 Check-in: {guest.checkInTime || "N/A"} <br />
//                         🕚 Check-out: {guest.checkOutTime || "Pending"}
//                       </div>
//                     </div>
//                     <div className="flex gap-2">
//                       {/* Edit Button */}
//                       <button
//                         onClick={() => setEditGuest(guest)}
//                         className="bg-yellow-400 px-3 py-1 rounded hover:bg-yellow-500"
//                       >
//                         Edit
//                       </button>

//                       {/* Checkout Button */}
//                       {!guest.checkOutTime &&
//                         (role === "MANAGER" || role === "RECEPTION") && (
//                           <CheckoutForm guest={guest} refresh={fetchGuests} />
//                         )}

//                       {/* Delete Button (MANAGER ONLY) */}
//                       {role === "MANAGER" && (
//                         <button
//                           onClick={async () => {
//                             if (
//                               window.confirm(
//                                 "Are you sure you want to delete this guest?"
//                               )
//                             ) {
//                               await api.delete(`/guests/${guest.id}`);
//                               fetchGuests();
//                             }
//                           }}
//                           className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
//                         >
//                           Delete
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         </AppLayout>
//       </main>

//       {/* FOOTER */}
//       <footer className="bg-black text-white text-center py-4 text-sm">
//         &copy; {new Date().getFullYear()} Lodge Manager. All rights reserved.
//       </footer>

//       {/* EDIT MODAL */}
//       {editGuest && (
//         <EditGuestModal
//           guest={editGuest}
//           onClose={() => setEditGuest(null)}
//           onSave={handleEditSave}
//         />
//       )}
//     </div>
//   );
// }


// import { useEffect, useState } from "react";
// import api from "../api";
// import GuestForm from "../components/GuestForm";
// import CheckoutForm from "../components/CheckoutForm";
// import EditGuestModal from "../components/EditGuestModal";
// import AppLayout from "../components/AppLayout";
// import GuestList from "./components/GuestList";

// // import GuestForm from "../GuestForm";
// //  188 │ import CheckoutForm from "../CheckoutForm";
// //  189 │ import EditGuestModal from "../components/EditGuestModal";
// //      ·                            ──────────────────────────────
// //  190 │ import AppLayout from "../components/AppLayout";

// export default function Dashboard() {
//   const [guests, setGuests] = useState([]);
//   const [search, setSearch] = useState("");
//   const [editGuest, setEditGuest] = useState(null);

//   const username = localStorage.getItem("username");
//   const role = localStorage.getItem("role");

//   // Redirect to login if not authenticated
//   useEffect(() => {
//     if (!username || !role) {
//       window.location.href = "/login";
//     }
//   }, [username, role]);

//   const fetchGuests = async () => {
//     try {
//       const res = await api.get("/api/guests");
//       setGuests(res.data);
//     } catch {
//       alert("Failed to fetch guests");
//     }
//   };

//   useEffect(() => {
//     fetchGuests();
//   }, []);

//   const filteredGuests = guests.filter((g) => {
//     const text = `${g.firstName} ${g.lastName} ${g.email} ${g.phone}`.toLowerCase();
//     return text.includes(search.toLowerCase());
//   });

//   const handleEditSave = async (updatedData) => {
//     try {
//       await api.put(`/guests/${editGuest.id}`, updatedData);
//       setEditGuest(null);
//       fetchGuests();
//     } catch {
//       alert("Failed to update guest");
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col">
//       {/* HEADER */}
//       <header className="bg-black text-white py-4 px-6 shadow-md flex justify-between items-center">
//         <div className="flex items-center space-x-2">
//           <img src="/logo.gif" alt="Logo" className="w-8 h-8" />
//           <span className="text-xl font-semibold">
//             {role === "MANAGER" ? "Manager Dashboard" : "Reception Dashboard"}
//           </span>
//         </div>
//         <nav className="space-x-4">
//           <span className="text-sm">
//             Welcome, <strong>{username}</strong> ({role})
//           </span>
//           {/* <a href="/dashboard" className="hover:underline">Dashboard</a> */}
//           <a href="/" className="hover:underline">Dashboard</a>
//           {role === "MANAGER" && (
//             <a href="/register" className="hover:underline">Register User</a>
//           )}
//           <a
//             href="/login"
//             onClick={() => {
//               localStorage.clear();
//             }}
//             className="hover:underline"
//           >
//             Logout
//           </a>
//         </nav>
//       </header>

//       {/* MAIN CONTENT */}
//       <main className="flex-1 overflow-y-auto">
//         <AppLayout>
//           <div className="p-4">
//             {/* Welcome Message */}
//             <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded">
//               {role === "MANAGER"
//                 ? `Hello ${username}, as a Manager you can manage all guest records and system users.`
//                 : `Hello ${username}, as a Receptionist you can check in/out guests and update guest details.`}
//             </div>

//             {/* Search Bar */}
//             <input
//               type="text"
//               placeholder="Search guests..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="px-4 py-2 border rounded w-full mb-4"
//             />

//             {/* Add Guest Form */}
//             {(role === "MANAGER" || role === "RECEPTION") && (
//               <GuestForm refresh={fetchGuests} />
//             )}
// <GuestList />
//             {/* Guest List */}
//             <ul className="space-y-4">
//               {filteredGuests.map((guest) => (
//                 <li
//                   key={guest.id}
//                   className="bg-white rounded shadow p-4 space-y-2"
//                 >
//                   <div className="flex justify-between items-center">
//                     <div>
//                       <div className="text-lg font-semibold">
//                         {guest.firstName} {guest.lastName}
//                       </div>
//                       <div className="text-sm text-gray-600">
//                         📧 {guest.email} | 📞 {guest.phone}
//                       </div>
//                       <div className="text-sm text-gray-500">
//                         🕓 Check-in: {guest.checkInTime || "N/A"} <br />
//                         🕚 Check-out: {guest.checkOutTime || "Pending"}
//                       </div>



//                       <div className="text-sm text-gray-500">
//                        <GuestList />
//                       </div>

//                     </div>
//                     <div className="flex gap-2">
//                       {/* Edit Button */}
//                       <button
//                         onClick={() => setEditGuest(guest)}
//                         className="bg-yellow-400 px-3 py-1 rounded hover:bg-yellow-500"
//                       >
//                         Edit
//                       </button>

//                       {/* Checkout Button */}
//                       {!guest.checkOutTime &&
//                         (role === "MANAGER" || role === "RECEPTION") && (
//                           <CheckoutForm guest={guest} refresh={fetchGuests} />
//                         )}

//                       {/* Delete Button (MANAGER ONLY) */}
//                       {role === "MANAGER" && (
//                         <button
//                           onClick={async () => {
//                             if (
//                               window.confirm(
//                                 "Are you sure you want to delete this guest?"
//                               )
//                             ) {
//                               await api.delete(`/guests/${guest.id}`);
//                               fetchGuests();
//                             }
//                           }}
//                           className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
//                         >
//                           Delete
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         </AppLayout>
//       </main>

//       {/* FOOTER */}
//       <footer className="bg-black text-white text-center py-4 text-sm">
//         &copy; {new Date().getFullYear()} Lodge Manager. All rights reserved.
//       </footer>

//       {/* EDIT MODAL */}
//       {editGuest && (
//         <EditGuestModal
//           guest={editGuest}
//           onClose={() => setEditGuest(null)}
//           onSave={handleEditSave}
//         />
//       )}
//     </div>
//   );
// }

// import { useEffect, useState } from "react";
// import api from "../api";
// import GuestForm from "./GuestForm";
// import CheckoutForm from "./CheckoutForm";
// import EditGuestModal from "./EditGuestModal";
// import AppLayout from "./AppLayout";
// import GuestList from "./GuestList"; // ✅ Fixed path

// export default function Dashboard() {
//   const [guests, setGuests] = useState([]);
//   const [search, setSearch] = useState("");
//   const [editGuest, setEditGuest] = useState(null);

//   const username = localStorage.getItem("username");
//   const role = localStorage.getItem("role");

//   // Redirect to login if not authenticated
//   useEffect(() => {
//     if (!username || !role) {
//       window.location.href = "/login";
//     }
//   }, [username, role]);

//   const fetchGuests = async () => {
//     try {
//       const res = await api.get("/api/guests");
//       setGuests(res.data);
//     } catch {
//       alert("Failed to fetch guests");
//     }
//   };

//   useEffect(() => {
//     fetchGuests();
//   }, []);

//   const filteredGuests = guests.filter((g) => {
//     const text = `${g.firstName} ${g.lastName} ${g.email} ${g.phone}`.toLowerCase();
//     return text.includes(search.toLowerCase());
//   });

//   const handleEditSave = async (updatedData) => {
//     try {
//       await api.put(`/guests/${editGuest.id}`, updatedData);
//       setEditGuest(null);
//       fetchGuests();
//     } catch {
//       alert("Failed to update guest");
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col">
//       {/* HEADER */}
//       <header className="bg-black text-white py-4 px-6 shadow-md flex justify-between items-center">
//         <div className="flex items-center space-x-2">
//           <img src="/logo.gif" alt="Logo" className="w-8 h-8" />
//           <span className="text-xl font-semibold">
//             {role === "MANAGER" ? "Manager Dashboard" : "Reception Dashboard"}
//           </span>
//         </div>
//         <nav className="space-x-4">
//           <span className="text-sm">
//             Welcome, <strong>{username}</strong> ({role})
//           </span>
//           <a href="/" className="hover:underline">Dashboard</a>
//           {role === "MANAGER" && (
//             <a href="/register" className="hover:underline">Register User</a>
//           )}
//           <a
//             href="/login"
//             onClick={() => {
//               localStorage.clear();
//             }}
//             className="hover:underline"
//           >
//             Logout
//           </a>
//         </nav>
//       </header>

//       {/* MAIN CONTENT */}
//       <main className="flex-1 overflow-y-auto">
//         <AppLayout>
//           <div className="p-4">
//             {/* Welcome Message */}
//             <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded">
//               {role === "MANAGER"
//                 ? `Hello ${username}, as a Manager you can manage all guest records and system users.`
//                 : `Hello ${username}, as a Receptionist you can check in/out guests and update guest details.`}
//             </div>

//             {/* Search Bar */}
//             <input
//               type="text"
//               placeholder="Search guests..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="px-4 py-2 border rounded w-full mb-4"
//             />

//             {/* Add Guest Form */}
//             {(role === "MANAGER" || role === "RECEPTION") && (
//               <GuestForm refresh={fetchGuests} />
//             )}

//             {/* ✅ Guest List Table */}
//             <div className="mt-4">
//               <GuestList guests={filteredGuests} setEditGuest={setEditGuest} fetchGuests={fetchGuests} role={role} />
//             </div>
//           </div>
//         </AppLayout>
//       </main>

//       {/* FOOTER */}
//       <footer className="bg-black text-white text-center py-4 text-sm">
//         &copy; {new Date().getFullYear()} Lodge Manager. All rights reserved.
//       </footer>

//       {/* EDIT MODAL */}
//       {editGuest && (
//         <EditGuestModal
//           guest={editGuest}
//           onClose={() => setEditGuest(null)}
//           onSave={handleEditSave}
//         />
//       )}
//     </div>
//   );
// }

import React from "react";
import GuestList from "./GuestList"; // ✅ This works with the folder structure above
import GuestForm from "./GuestForm";

export default function Dashboard() {
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");

  return (
    <div className="container mt-4">
      <h2>Welcome {username} ({role})</h2>
      {role === "MANAGER" && <GuestForm />}
      <GuestList guests={[]} onEdit={() => {}} onDelete={() => {}} />
    </div>
  );
}
