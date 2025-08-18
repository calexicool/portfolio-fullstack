/* frontend/src/api/client.js */
const BASE =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  ''; // same-origin по умолчанию

// --- helpers ---------------------------------------------------------------
const json = (method, url, body) =>
  fetch(BASE + url, {
    method,
    credentials: 'include', // важна кука сессии
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

const readJSON = async (res) => {
  let data = null;
  try {
    data = await res.json();
  } catch (_) {}
  if (!res.ok) {
    const msg =
      (data && (data.error || data.message)) || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data || {};
};

// --- auth ------------------------------------------------------------------
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
  const r = await json('POST', '/api/auth/init', {
    code,
    email,
    password,
    role,
  });
  const d = await readJSON(r);
  return d.user || true;
}
export async function issueCode() {
  const r = await json('POST', '/api/auth/issue-code');
  const d = await readJSON(r);
  return d; // { code, ttl }
}
export async function addAdmin({ code, email, password, role = 'admin' }) {
  const r = await json('POST', '/api/auth/add', {
    code,
    email,
    password,
    role,
  });
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

// --- content ---------------------------------------------------------------
export async function getContent() {
  const r = await json('GET', '/api/content');
  const d = await readJSON(r);
  return d.content ?? d ?? {};
}
export async function saveContent(content) {
  const r = await json('POST', '/api/content', { content });
  await readJSON(r);
  return true;
}

// --- upload (нужно для EditableImage.jsx) ----------------------------------
export async function uploadFile(file) {
  const fd = new FormData();
  fd.append('file', file);

  // ВАЖНО: не ставить Content-Type вручную — браузер сам проставит boundary
  const res = await fetch(BASE + '/api/upload', {
    method: 'POST',
    credentials: 'include',
    body: fd,
  });

  const data = await readJSON(res);
  // приводим к формату, который ожидает EditableImage: { ok: true, url }
  return { ok: true, url: data.url || data.path || data.location };
}

// --- comments (если используются) -----------------------------------------
// --- comments --------------------------------------------------------------
// listComments(all) — если all=true, сервер вернёт все (включая не одобренные) — для админов
export async function listComments(all = false) {
  const r = await json('GET', `/api/comments${all ? '?all=1' : ''}`);
  const d = await readJSON(r);
  return d.comments || [];
}
export async function addComment({ name, text, parentId = null }) {
  const r = await json('POST', '/api/comments', { name, text, parentId });
  const d = await readJSON(r);
  return d.comment || d || {};
}
export async function deleteComment(id) {
  const r = await json('DELETE', `/api/comments/${id}`);
  await readJSON(r);
  return true;
}
// модерация
export async function approveComment(id, approved) {
  const r = await json('PATCH', `/api/comments/${id}`, { approved });
  const d = await readJSON(r);
  return d.comment || d || {};
}

