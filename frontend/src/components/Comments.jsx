/* frontend/src/components/Comments.jsx */
import React from "react";
import {
  listComments,
  addComment,
  deleteComment,
  approveComment,
} from "../api/client";

const PENDING_LS_KEY = "pending_comments_v1";
const PENDING_TTL_MS = 2 * 24 * 60 * 60 * 1000; // 2 дня

function loadPending() {
  try {
    const arr = JSON.parse(localStorage.getItem(PENDING_LS_KEY) || "[]");
    const now = Date.now();
    const kept = arr.filter((x) => now < (x.ttl || 0));
    if (kept.length !== arr.length) {
      localStorage.setItem(PENDING_LS_KEY, JSON.stringify(kept));
    }
    return kept;
  } catch {
    return [];
  }
}

function savePending(arr) {
  localStorage.setItem(PENDING_LS_KEY, JSON.stringify(arr));
}

export default function Comments({ admin = false }) {
  const [items, setItems] = React.useState([]);          // серверные (одобренные/все для админа)
  const [pendingLocal, setPendingLocal] = React.useState([]); // локальные «на модерации» (для не-админов)
  const [name, setName] = React.useState("");
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");

  // тянем список
  const refresh = React.useCallback(async () => {
    try {
      const list = await listComments(admin); // admin=true -> all
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
    }
  }, [admin]);

  // merge server + local pending (не дублируем если уже появился на сервере)
  const merged = React.useMemo(() => {
    if (admin) return items;
    const serverIds = new Set(items.map((x) => x.id));
    const now = Date.now();
    const pend = (pendingLocal || []).filter((p) => now < (p.ttl || 0));
    return [...items, ...pend.filter((p) => !serverIds.has(p.id))];
  }, [items, pendingLocal, admin]);

  React.useEffect(() => {
    refresh();
    if (!admin) setPendingLocal(loadPending());
  }, [refresh, admin]);

  async function onSubmit(e) {
    e?.preventDefault?.();
    setErr("");
    if (!name.trim() || !text.trim()) {
      setErr("Введите имя и текст комментария");
      return;
    }
    setBusy(true);
    try {
      const c = await addComment({ name: name.trim(), text: text.trim() });
      // если админ — сразу одобряем на сервере
      if (admin && c?.id) {
        await approveComment(c.id, true);
        await refresh();
      } else {
        // обычный пользователь — сохраняем локально до модерации
        const entry = {
          id: c?.id || `tmp-${Math.random().toString(36).slice(2)}`,
          name: name.trim(),
          text: text.trim(),
          approved: false,
          createdAt: Date.now(),
          ttl: Date.now() + PENDING_TTL_MS,
          _local: true,
        };
        const next = [entry, ...loadPending()];
        setPendingLocal(next);
        savePending(next);
      }
      setText("");
      setName("");
    } catch (e) {
      setErr(e.message || "Не удалось отправить комментарий");
    } finally {
      setBusy(false);
    }
  }

  async function onApprove(id, next) {
    if (!admin) return;
    try {
      await approveComment(id, next);
      await refresh();
    } catch (e) {
      console.error(e);
    }
  }

  async function onDelete(id) {
    if (!admin) return;
    try {
      await deleteComment(id);
      await refresh();
    } catch (e) {
      console.error(e);
    }
  }

  // если сервер уже вернул наш локальный коммент — очистим его из localStorage
  React.useEffect(() => {
    if (admin) return;
    const serverIds = new Set(items.map((x) => x.id));
    const keep = (pendingLocal || []).filter((p) => !serverIds.has(p.id));
    if (keep.length !== (pendingLocal || []).length) {
      setPendingLocal(keep);
      savePending(keep);
    }
  }, [items, pendingLocal, admin]);

  return (
    <div className="rounded-3xl border p-4 md:p-6">
      {/* форма */}
      <form className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={onSubmit}>
        <input
          className="rounded-xl border px-3 py-2 outline-none"
          placeholder="Ваше имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="md:col-span-1 md:hidden" />
        <textarea
          className="min-h-[90px] w-full resize-y rounded-xl border px-3 py-2 outline-none md:col-span-1"
          placeholder="Ваш комментарий…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          className="h-[42px] rounded-xl bg-black px-4 text-white hover:opacity-90 dark:bg-white dark:text-black"
          disabled={busy || !name.trim() || !text.trim()}
        >
          {busy ? "Отправка…" : "Отправить"}
        </button>
      </form>

      {err && (
        <div className="mb-3 rounded-lg bg-rose-600/20 px-3 py-2 text-rose-200">
          {err}
        </div>
      )}

      {/* список */}
      {!merged.length && (
        <div className="text-sm opacity-70">Комментариев пока нет.</div>
      )}

      <ul className="space-y-3">
        {merged.map((c) => (
          <li
            key={c.id}
            className="rounded-2xl border p-3"
            style={{ position: "relative" }}
          >
            <div className="mb-1 font-medium">
              {c.name}{" "}
              {!c.approved && (
                <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400">
                  {c._local ? "ожидает модерации (локально)" : "ожидает модерации"}
                </span>
              )}
            </div>
            <div className="whitespace-pre-wrap opacity-90">{c.text}</div>

            {admin && (
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => onApprove(c.id, !c.approved)}
                  className={`rounded-md px-3 py-1 text-sm ${
                    c.approved
                      ? "bg-neutral-200 dark:bg-neutral-800"
                      : "bg-emerald-600 text-white"
                  }`}
                  title={c.approved ? "Снять одобрение" : "Одобрить"}
                >
                  {c.approved ? "Снять" : "Одобрить"}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(c.id)}
                  className="rounded-md bg-rose-600 px-3 py-1 text-sm text-white"
                  title="Удалить"
                >
                  Удалить
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
