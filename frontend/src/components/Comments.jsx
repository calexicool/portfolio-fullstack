/* frontend/src/components/Comments.jsx */
import React from "react";
import {
  listComments,
  addComment,
  deleteComment,
  approveComment,
} from "../api/client";

const PENDING_LS_KEY = "pending_comments_v1";
const PENDING_TTL_MS = 2 * 24 * 60 * 60 * 1000;

function loadPending() {
  try {
    const arr = JSON.parse(localStorage.getItem(PENDING_LS_KEY) || "[]");
    const now = Date.now();
    const kept = arr.filter((x) => now < (x.ttl || 0));
    if (kept.length !== arr.length) localStorage.setItem(PENDING_LS_KEY, JSON.stringify(kept));
    return kept;
  } catch { return []; }
}
function savePending(arr) {
  localStorage.setItem(PENDING_LS_KEY, JSON.stringify(arr));
}

export default function Comments({ admin = false }) {
  const [items, setItems] = React.useState([]);
  const [pendingLocal, setPendingLocal] = React.useState([]);
  const [name, setName] = React.useState("");
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");

  const [warn, setWarn] = React.useState("");

  const refresh = React.useCallback(async () => {
    setWarn("");
    try {
      let list = await listComments(admin);
      if (!Array.isArray(list)) list = [];
      // для гостей показываем только одобренные
      if (!admin) list = list.filter(x => x.approved === true);
      setItems(list);
    } catch (e) {
      console.error(e);
      setItems([]);
    }
  }, [admin]);
  {admin && warn && (
    <div className="mb-2 rounded-lg bg-amber-500/15 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
      {warn}
    </div>
  )}


  React.useEffect(() => {
    refresh();
    if (!admin) setPendingLocal(loadPending());
  }, [refresh, admin]);

  const merged = React.useMemo(() => {
    if (admin) return items;
    const ids = new Set(items.map((x) => x.id));
    const now = Date.now();
    const pend = (pendingLocal || []).filter((p) => now < (p.ttl || 0));
    return [...items, ...pend.filter((p) => !ids.has(p.id))];
  }, [items, pendingLocal, admin]);

  async function onSubmit(e) {
    e?.preventDefault?.();
    setErr("");
    const nm = name.trim(), tx = text.trim();
    if (!nm || !tx) { setErr("Введите имя и текст комментария"); return; }
    setBusy(true);
    try {
      const c = await addComment({ name: nm, text: tx });
      if (admin && c?.id) {
        await approveComment(c.id);
        await refresh();
      } else {
        const entry = {
          id: c?.id || `tmp-${Math.random().toString(36).slice(2)}`,
          name: nm, text: tx, approved: false,
          createdAt: Date.now(), ttl: Date.now() + PENDING_TTL_MS, _local: true,
        };
        const next = [entry, ...loadPending()];
        setPendingLocal(next); savePending(next);
      }
      setName(""); setText("");
    } catch (e) {
      setErr(e.message || "Не удалось отправить комментарий");
    } finally { setBusy(false); }
  }

  async function onApprove(id, next) {
    if (!admin) return;
    try { await approveComment(id, next); await refresh(); } catch {}
  }
  async function onDelete(id) {
    if (!admin) return;
    try { await deleteComment(id); await refresh(); } catch {}
  }

  React.useEffect(() => {
    if (admin) return;
    const ids = new Set(items.map((x) => x.id));
    const keep = (pendingLocal || []).filter((p) => !ids.has(p.id));
    if (keep.length !== (pendingLocal || []).length) {
      setPendingLocal(keep); savePending(keep);
    }
  }, [items, pendingLocal, admin]);

  const inputCls =
    "w-full rounded-xl border outline-none " +
    "bg-white text-neutral-900 placeholder-neutral-500 " +
    "dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-400 " +
    "border-neutral-200 dark:border-neutral-700";

  return (
    <div className="rounded-3xl border p-4 md:p-6">
      {/* форма — простая вертикаль */}
      <form className="mb-4 grid gap-3" onSubmit={onSubmit}>
        <input
          className={inputCls + " h-11 px-3"}
          placeholder="Ваше имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className={inputCls + " min-h-[140px] px-3 py-2"}
          placeholder="Ваш комментарий…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            className="h-11 rounded-xl bg-black px-4 text-white hover:opacity-90 dark:bg-white dark:text-black disabled:opacity-50"
            disabled={busy || !name.trim() || !text.trim()}
          >
            {busy ? "Отправка…" : "Отправить"}
          </button>
        </div>
      </form>

      {err && <div className="mb-3 rounded-lg bg-rose-600/20 px-3 py-2 text-rose-200">{err}</div>}

      {!merged.length && <div className="text-sm opacity-70">Комментариев пока нет.</div>}
      <ul className="space-y-3">
        {merged.map((c) => (
          <li key={c.id} className="rounded-2xl border p-3">
            <div className="mb-1 font-medium">
              {c.name}
              {!c.approved && (
                <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-400">
                  {c._local ? "ожидает модерации (локально)" : "ожидает модерации"}
                </span>
              )}
            </div>
            <div className="whitespace-pre-wrap opacity-90">{c.text}</div>

            {admin && (
              <div className="mt-2 flex gap-2">
                {!c.approved && (
                  <button
                    type="button"
                    onClick={() => onApprove(c.id, true)}
                    className="rounded-md bg-emerald-600 px-3 py-1 text-sm text-white"
                    title="Одобрить"
                  >
                    Одобрить
                  </button>
                )}
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
