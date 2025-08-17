/* eslint-disable */
const API =
  (import.meta?.env?.VITE_API_URL && import.meta.env.VITE_API_URL !== 'same-origin')
    ? import.meta.env.VITE_API_URL.replace(/\/+$/,'')
    : ''; // same-origin: фронт и бэк на одном домене

async function http(path, { method = 'GET', body, headers } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  // 204 — ок без тела
  if (res.status === 204) return { ok: true };
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    const e = new Error(msg);
    e.status = res.status;
    e.payload = data;
    throw e;
  }
  return data;
}

/* -------- контент -------- */
export const getContent   = () => http('/api/content');
export const saveContent  = (content) => http('/api/content', { method:'POST', body:{ content } });

/* -------- комментарии (если нужны) -------- */
export const listComments   = () => http('/api/comments');
export const addComment     = (payload) => http('/api/comments', { method:'POST', body:payload });

/* -------- загрузка файлов -------- */
export async function uploadFile(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API}/api/upload`, { method:'POST', body: form, credentials:'include' });
  if (!res.ok) throw new Error('upload failed');
  return await res.json(); // { ok:true, url:"/uploads/..." }
}

/* -------- auth -------- */
export const getMe          = () => http('/api/auth/me');
export const login          = (email, password) => http('/api/auth/login', { method:'POST', body:{ email, password } });
export const logout         = () => http('/api/auth/logout', { method:'POST' });

// «инициализация первого админа»
export const initAdmin      = (code, email, password) => http('/api/auth/init', { method:'POST', body:{ code, email, password } });

// управление администраторами
export const listAdmins     = () => http('/api/auth/admins'); // [{id,email,role,createdAt}]
export const createAdmin    = ({ code, email, password, role }) =>
  http('/api/auth/admins', { method:'POST', body:{ code, email, password, role } });

export const updateAdminRole = (id, role) =>
  http(`/api/auth/admins/${encodeURIComponent(id)}`, { method:'PATCH', body:{ role } });

export const deleteAdmin    = (id) =>
  http(`/api/auth/admins/${encodeURIComponent(id)}`, { method:'DELETE' });

export const issueCode      = () => http('/api/auth/issue-code', { method:'POST' });

export default {
  getContent, saveContent,
  listComments, addComment,
  uploadFile,
  getMe, login, logout, initAdmin,
  listAdmins, createAdmin, updateAdminRole, deleteAdmin, issueCode,
};
