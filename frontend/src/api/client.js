/* frontend/src/api/client.js */
const BASE =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  ''; // при same-origin на Render можно оставить пустым

const json = (method, url, body) =>
  fetch(BASE + url, {
    method,
    credentials: 'include', // <-- ВАЖНО: куки для сессии
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

const readJSON = async (res) => {
  let data = null;
  try {
    data = await res.json();
  } catch (_) {}
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data || {};
};

// ---- auth ----
export async function getMe() {
  const r = await json('GET', '/api/auth/me');
  const d = await readJSON(r);
  return d.user || null;
}
export async function login(email, password) {
  const r = await json('POST', '/api/auth/login', { email, password });
  const d = await readJSON(r);
  return d.user || true;
}
export async function logout() {
  const r = await json('POST', '/api/auth/logout');
  await readJSON(r);
  return true;
}
export async function initFirstAdmin({ code, email, password, role = 'owner' }) {
  const r = await json('POST', '/api/auth/init', { code, email, password, role });
  const d = await readJSON(r);
  return d.user || true;
}
export async function issueCode() {
  const r = await json('POST', '/api/auth/issue-code');
  const d = await readJSON(r);
  return d; // { code, ttl }
}
export async function addAdmin({ code, email, password, role = 'admin' }) {
  const r = await json('POST', '/api/auth/add', { code, email, password, role });
  const d = await readJSON(r);
  return d.user || true;
}
export async function getAdmins() {
  const r = await json('GET', '/api/auth/admins');
  const d = await readJSON(r);
  return d.users || [];
}
export async function setAdminRole(id, role) {
  const r = await json('PATCH', `/api/auth/admins/${id}`, { role });
  const d = await readJSON(r);
  return d.user || true;
}
export async function removeAdmin(id) {
  const r = await json('DELETE', `/api/auth/admins/${id}`);
  await readJSON(r);
  return true;
}
