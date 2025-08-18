// frontend/src/components/Comments.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  listComments,
  addComment,
  deleteComment,
  approveComment, // см. client.js ниже
} from "../api/client";

function nest(list) {
  const byId = new Map();
  list.forEach((c) => byId.set(c.id, { ...c, children: [] }));
  const roots = [];
  byId.forEach((c) => {
    if (c.parentId && byId.has(c.parentId)) byId.get(c.parentId).children.push(c);
    else roots.push(c);
  });
  return roots;
}

function CommentNode({ c, admin, onReply, onRemove, onToggleApprove }) {
  return (
    <div className="mb-4">
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 dark:bg-neutral-900/50">
        <div className="mb-1 flex items-center gap-2 text-sm opacity-80">
          <span className="font-semibold">{c.name || "Аноним"}</span>
          <span>·</span>
          <time dateTime={c.createdAt}>{new Date(c.createdAt).toLocaleString()}</time>
          {!c.approved && <span className="rounded bg-amber-500/20 px-2 py-[2px] text-amber-300">на модерации</span>}
        </div>
        <div className="whitespace-pre-wrap leading-relaxed">{c.text}</div>

        <div className="mt-2 flex items-center gap-3 text-sm opacity-80">
          <button className="hover:opacity-100" onClick={() => onReply(c.id)}>
            Ответить
          </button>
          {admin && (
            <>
              <button className="hover:opacity-100" onClick={() => onToggleApprove(c.id, !c.approved)}>
                {c.approved ? "Скрыть" : "Одобрить"}
              </button>
              <button className="text-rose-400 hover:text-rose-300" onClick={() => onRemove(c.id)}>
                Удалить
              </button>
            </>
          )}
        </div>
      </div>

      {c.children?.length > 0 && (
        <div className="ml-4 mt-3 border-l pl-4">
          {c.children.map((ch) => (
            <CommentNode
              key={ch.id}
              c={ch}
              admin={admin}
              onReply={onReply}
              onRemove={onRemove}
              onToggleApprove={onToggleApprove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Comments({ admin }) {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ name: "", text: "", parentId: null });
  const [replyTo, setReplyTo] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      // если admin — просим все (включая не одобренные)
      const list = await listComments(admin ? true : false);
      setAll(list || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [admin]);

  const tree = useMemo(() => nest(all), [all]);

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!form.text.trim()) return;

    const payload = {
      name: form.name?.trim() || "",
      text: form.text.trim(),
      parentId: replyTo || null,
    };

    // оптимистично
    const temp = {
      id: "tmp_" + Math.random().toString(36).slice(2),
      name: payload.name,
      text: payload.text,
      parentId: payload.parentId,
      createdAt: new Date().toISOString(),
      approved: admin ? true : false,
    };
    setAll((cur) => [temp, ...cur]);
    setForm((f) => ({ ...f, text: "" }));
    setReplyTo(null);

    try {
      const saved = await addComment(payload);
      setAll((cur) => [saved, ...cur.filter((x) => x.id !== temp.id)]);
    } catch (e) {
      console.error(e);
      // откат
      setAll((cur) => cur.filter((x) => x.id !== temp.id));
      alert("Не удалось отправить комментарий");
    }
  };

  const onRemove = async (id) => {
    const prev = all;
    setAll((cur) => cur.filter((x) => x.id !== id && x.parentId !== id));
    try {
      await deleteComment(id);
    } catch (e) {
      console.error(e);
      setAll(prev);
    }
  };

  const onToggleApprove = async (id, approved) => {
    const prev = all;
    setAll((cur) => cur.map((x) => (x.id === id ? { ...x, approved } : x)));
    try {
      await approveComment(id, approved);
    } catch (e) {
      console.error(e);
      setAll(prev);
    }
  };

  const startReply = (pid) => {
    setReplyTo(pid);
    window?.scrollTo?.({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 dark:bg-neutral-900/40">
      <form onSubmit={submit} className="mb-6 grid gap-3">
        <div className="grid gap-2 md:grid-cols-[240px_1fr]">
          <input
            className="rounded-xl border bg-white/80 px-3 py-2 text-sm dark:bg-neutral-900/80"
            placeholder="Ваше имя"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <textarea
            className="min-h-[80px] rounded-xl border bg-white/80 px-3 py-2 text-sm dark:bg-neutral-900/80"
            placeholder={replyTo ? "Ответ..." : "Комментарий..."}
            value={form.text}
            onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
          />
        </div>
        {replyTo && (
          <div className="text-sm opacity-80">
            Ответ на <code className="rounded bg-white/20 px-2 py-[1px]">#{replyTo}</code>{" "}
            <button className="ml-2 underline" type="button" onClick={() => setReplyTo(null)}>
              отменить
            </button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-xl bg-white px-4 py-2 text-sm text-neutral-900 shadow hover:opacity-90 dark:bg-white"
          >
            Отправить
          </button>
          {loading && <span className="text-sm opacity-70">Загрузка…</span>}
        </div>
      </form>

      {tree.length === 0 && !loading && <div className="opacity-70">Комментариев пока нет.</div>}

      {tree.map((c) => (
        <CommentNode
          key={c.id}
          c={c}
          admin={admin}
          onReply={startReply}
          onRemove={onRemove}
          onToggleApprove={onToggleApprove}
        />
      ))}
    </div>
  );
}
