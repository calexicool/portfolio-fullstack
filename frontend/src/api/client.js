// frontend/src/api/client.js
const BASE = import.meta.env.VITE_API_BASE?.trim() || ""; // same-origin по умолчанию

async function j(method, url, body) {
  const res = await fetch(`${BASE}${url}`, {
    method, credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  // не бросаем исключения наверх — возвращаем {ok:false,error}
  try {
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error || res.statusText };
    return data;
  } catch {
    return res.ok ? {} : { ok:false, error:"Bad JSON" };
  }
}

// Контент (редактируемые тексты/картинки)
export const getContent   = ()            => j("GET",  "/api/content");
export const saveContent  = (content)     => j("POST", "/api/content", { content });

// Комментарии
export const getComments  = ()                     => j("GET",  "/api/comments");
export const addComment   = (payload)              => j("POST", "/api/comments", payload);
export const likeComment  = (id)                   => j("POST", `/api/comments/${id}/like`);
export const modApprove   = (id)                   => j("POST", `/api/comments/${id}/approve`);
export const modRemove    = (id)                   => j("POST", `/api/comments/${id}/remove`);

// Аутентификация (CMS)
export const initAdmin    = (payload)              => j("POST", "/api/auth/init", payload);
export const login        = (payload)              => j("POST", "/api/auth/login", payload);
export const me           = ()                     => j("GET",  "/api/auth/me");
export const logout       = ()                     => j("POST", "/api/auth/logout");
