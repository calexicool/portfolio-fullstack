const API_BASE = import.meta.env.VITE_API_BASE || '';

const defaultHeaders = { 'Content-Type': 'application/json' };

export async function getMe(){
  const r = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' });
  return r.ok ? r.json() : null;
}
export async function login(email, password){
  const r = await fetch(`${API_BASE}/api/auth/login`, { method: 'POST', headers: defaultHeaders, credentials:'include', body: JSON.stringify({ email, password }) });
  return r.json();
}
export async function logout(){ await fetch(`${API_BASE}/api/auth/logout`, { method:'POST', credentials:'include' }); }
export async function initAdmin(inviteCode, email, password){
  const r = await fetch(`${API_BASE}/api/auth/init`, { method: 'POST', headers: defaultHeaders, credentials:'include', body: JSON.stringify({ inviteCode, email, password }) });
  return r.json();
}
export async function getContent(){
  const r = await fetch(`${API_BASE}/api/content`, { credentials:'include' });
  if(!r.ok) throw new Error('Failed to load content'); return r.json();
}
export async function saveContent(content){
  const r = await fetch(`${API_BASE}/api/content`, { method:'POST', headers: defaultHeaders, credentials:'include', body: JSON.stringify({ content }) });
  return r.json();
}
export async function uploadFile(file){
  const fd = new FormData(); fd.append('file', file);
  const r = await fetch(`${API_BASE}/api/upload`, { method:'POST', body: fd, credentials:'include' });
  return r.json();
}
export async function getComments(){ const r = await fetch(`${API_BASE}/api/comments`, { credentials:'include' }); return r.json(); }
export async function addComment(payload){
  const r = await fetch(`${API_BASE}/api/comments`, { method:'POST', headers: defaultHeaders, credentials:'include', body: JSON.stringify(payload) });
  return r.json();
}
export async function likeComment(id){
  const r = await fetch(`${API_BASE}/api/comments/like`, { method:'POST', headers: defaultHeaders, credentials:'include', body: JSON.stringify({ id }) });
  return r.json();
}
export async function modApprove(id){
  const r = await fetch(`${API_BASE}/api/comments/approve`, { method:'POST', headers: defaultHeaders, credentials:'include', body: JSON.stringify({ id }) });
  return r.json();
}
export async function modRemove(id){
  const r = await fetch(`${API_BASE}/api/comments/remove`, { method:'POST', headers: defaultHeaders, credentials:'include', body: JSON.stringify({ id }) });
  return r.json();
}
