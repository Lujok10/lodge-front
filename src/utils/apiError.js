export function getApiErrorMessage(err, fallback = "Request failed.") {
  const data = err?.response?.data;

  // Expected ApiError shape from backend: { code, message }
  if (data && typeof data === "object") {
    const msg = data.message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }

  // Plain text responses
  if (typeof data === "string" && data.trim()) return data;

  return fallback;
}

export function getApiErrorCode(err) {
  const data = err?.response?.data;
  if (data && typeof data === "object" && typeof data.code === "string") return data.code;
  return null;
}
