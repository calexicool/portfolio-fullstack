// frontend/src/api/client.js
const BASE = import.meta.env.VITE_API_BASE?.trim() || "";

// ... твои функции j(), getContent, saveContent, getComments и т.д.

// === Загрузка файла (использует /api/upload, возвращает {ok, url}) ===
export async function uploadFile(file) {
  try {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch(`${BASE}/api/upload`, {
      method: "POST",
      credentials: "include",
      body: fd, // НЕ ставим Content-Type вручную — браузер проставит boundary
    });

    let data = null;
    try { data = await res.json(); } catch {}

    if (!res.ok) {
      return { ok: false, error: data?.error || res.statusText || "Upload failed" };
    }

    // пытаемся понять адрес загруженного файла из разных возможных полей
    let url =
      data?.url ||
      data?.path ||
      (data?.filename ? `/uploads/${data.filename}` : null) ||
      data?.file?.url ||
      data?.file?.path ||
      null;

    if (!url) {
      return { ok: false, error: "Upload succeeded but URL not returned" };
    }
    return { ok: true, url };
  } catch (e) {
    console.error("uploadFile error:", e);
    return { ok: false, error: "Network error" };
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
