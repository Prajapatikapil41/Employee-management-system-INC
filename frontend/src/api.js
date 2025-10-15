// frontend/src/api.js
export const BASE = process.env.REACT_APP_API || "http://localhost:4000/api";

async function handleRes(res) {
  let json = {};
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  // If backend returns structured { success: true/false, data, error }
  if (json && typeof json === "object" && ("success" in json)) {
    if (json.success) {
      // Prefer data if present
      return json.data !== undefined ? json.data : json;
    } else {
      return { error: json.error || json.message || "सर्वर त्रुटि" };
    }
  }

  // Fallback: status-based handling
  if (!res.ok) {
    return { error: (json && (json.error || json.message)) || `HTTP ${res.status}` };
  }
  return json;
}

async function safeFetch(url, options) {
  try {
    const res = await fetch(url, options);
    return await handleRes(res);
  } catch (err) {
    console.error("Network/API error:", err);
    return { error: "नेटवर्क त्रुटि। सर्वर से संपर्क नहीं हो सका।" };
  }
}

export async function login(code) {
  return safeFetch(BASE + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
}

export async function listEvents(type = "ongoing") {
  return safeFetch(BASE + "/events?type=" + encodeURIComponent(type));
}

export async function getEvent(id) {
  return safeFetch(BASE + "/events/" + encodeURIComponent(id));
}

export async function markViewed(id, userId) {
  return safeFetch(BASE + `/events/${encodeURIComponent(id)}/view`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
}

export async function addEvent(formData) {
  return safeFetch(BASE + "/events", {
    method: "POST",
    body: formData, // FormData; DO NOT set Content-Type so browser adds boundary
  });
}

export async function updateEvent(id, formData) {
  return safeFetch(BASE + `/events/${encodeURIComponent(id)}/update`, {
    method: "POST",
    body: formData,
  });
}

export async function getReport(id) {
  return safeFetch(BASE + `/events/${encodeURIComponent(id)}/report`);
}

export async function acceptReport(eventId, userId) {
  return safeFetch(BASE + `/events/${encodeURIComponent(eventId)}/report/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
}

export async function deleteEvent(id) {
  return safeFetch(BASE + `/events/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// Additional helper: fetch jila users list (for admin created_by dropdown)
export async function getJilaUsers() {
  return safeFetch(BASE + "/auth/users/jila");
}
