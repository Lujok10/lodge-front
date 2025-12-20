import toast from "react-hot-toast";

export const notify = {
  success: (msg) => toast.success(msg),
  error: (msg) => toast.error(msg),
  info: (msg) => toast(msg),
  warn: (msg) => toast(msg, { icon: "⚠️" }),

  // For async flows
  loading: (msg) => toast.loading(msg),
  updateSuccess: (id, msg) => toast.success(msg, { id }),
  updateError: (id, msg) => toast.error(msg, { id }),
};
