// web/js/api.js

const BASE = window.QUESTRO_API_BASE; // set in config.js

async function http(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "content-type": "application/json", ...(opts.headers || {}) },
  });
  if (res.status === 204) return null;
  const text = await res.text();
  if (!res.ok) throw new Error(text || `${res.status}`);
  try { return JSON.parse(text); } catch { return text; }
}

export function createQuest({ serverId, userId, username, title, tags = [] }) {
  return http(`/quests`, {
    method: "POST",
    body: JSON.stringify({ serverId, userId, username, title, tags }),
  });
}

export async function listQuests({ serverId, status, userId, tag, limit } = {}) {
  if (!serverId) throw new Error("serverId required");
  const u = new URL(`${BASE}/quests`);
  u.searchParams.set("serverId", serverId);
  if (status) u.searchParams.set("status", status);
  if (userId) u.searchParams.set("userId", userId);
  if (tag) u.searchParams.set("tag", tag);
  if (limit) u.searchParams.set("limit", String(limit));
  const r = await fetch(u, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // { items: [...] }
}

export function updateQuest(id, patch) {
  return http(`/quests/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteQuest(id) {
  return http(`/quests/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function getLeaderboard({ serverId, limit = 10 } = {}) {
  const u = new URL(`${BASE}/leaderboard`);
  u.searchParams.set("serverId", serverId);
  u.searchParams.set("limit", String(limit));
  const r = await fetch(u);
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // array
}
