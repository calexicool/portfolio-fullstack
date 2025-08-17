/* eslint-disable */
const API_BASE =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  '';

const joinUrl = (base, path) => {
  if (!base) return path;
  if (base.endsWith('/') && path.startsWith('/')) return base + path.slice(1);
  if (!base.endsWith('/') && !path.startsWith('/')) return `${base}/${path}`;
  return base + path;
};

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(joinUrl(API_BASE, path), {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body != null ? JSON.stringify(body) : undefined,
  });

  const text = await res.text().catch(() => '');
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text || null; }

  if (!res.ok) {
    const msg = (data && data.message) || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status; err.payload = data;
    throw err;
  }
  return data;
}

/* AUTH */
export const getMe    = () => request('/api/auth/me');
export const login    = (email, password) => request('/api/auth/login',  { method: 'POST', body: { email, password } });
export const logout   = () => request('/api/auth/logout', { method: 'POST' });
export const seedAdmin= (code, email, password) => request('/api/auth/seed',   { method: 'POST', body: { code, email, password } });

// приглашения
export const createInvite  = (role='admin') => request('/api/auth/invite', { method: 'POST', body: { role } });
export const acceptInvite  = (code, email, password) => request('/api/auth/accept', { method: 'POST', body: { code, email, password } });

/* CONTENT */
export const getContent = () => request('/api/content');
export const saveContent= (content) => request('/api/content', { method: 'POST', body: { content } });

/* COMMENTS */
export const getComments = () => request('/api/comments');
export const postComment = ({ text, parentId=null }) => request('/api/comments', { method:'POST', body:{ text, parentId } });
export const likeComment = (id) => request(`/api/comments/${id}/like`, { method:'POST' });

/* UPLOAD */
export async function uploadFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(joinUrl(API_BASE, '/api/upload'), {
    method: 'POST',
    credentials: 'include',
    body: fd,
  });
  const text = await res.text().catch(()=> '');
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text || null; }
  if (!res.ok) {
    const msg = (data && data.message) || `HTTP ${res.status}`;
    const err = new Error(msg); err.status = res.status; err.payload = data; throw err;
  }
  return data; // { ok: true, url: '...' }
}
