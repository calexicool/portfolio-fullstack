// frontend/src/components/Comments.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  getComments,
  addComment,
  likeComment,
  modApprove,
  modRemove,
} from "../api/client";
import { MessageSquare, ThumbsUp, Trash2, Check } from "lucide-react";

function buildTree(list) {
  const byId = new Map();
  list.forEach((c) => byId.set(c.id, { ...c, children: [] }));
  const roots = [];
  list.forEach((c) => {
    const node = byId.get(c.id);
    if (c.parentId && byId.has(c.parentId)) byId.get(c.parentId).children.push(node);
    else roots.push(node);
  });
  // свежие сверху
  const sortFn = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
  const deepSort = (arr) => arr.sort(sortFn).forEach((n) => deepSort(n.children));
  deepSort(roots);
  return roots;
}

function CommentItem({ node, onReply, onLike, admin, onApprove, onRemove }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="mb-1 text-sm opacity-70">
        {node.name || "Гость"} • {new Date(node.createdAt).toLocaleString()}
        {!node.approved && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900">на модерации</span>}
      </div>
      <div className="whitespace-pre-wrap leading-relaxed">{node.text}</div>
      <div className="mt-2 flex flex-wrap gap-3 text-sm">
        <button
          className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 hover:bg-neutral-900/5 dark:hover:bg-white/10"
          onClick={() => onReply(node)}
        >
          <MessageSquare className="h-4 w-4" /> Ответить
        </button>
        <button
          className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 hover:bg-neutral-900/5 dark:hover:bg-white/10"
          onClick={() => onLike(node)}
        >
          <ThumbsUp className="h-4 w-4" /> {node.likes || 0}
        </button>
        {admin && !node.approved && (
          <button
            className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
            onClick={() => onApprove(node)}
          >
            <Check className="h-4 w-4" /> Одобрить
          </button>
        )}
        {admin && (
          <button
            className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
            onClick={() => onRemove(node)}
          >
            <Trash2 className="h-4 w-4" /> Удалить
          </button>
        )}
      </div>

      {node.children?.length > 0 && (
        <div className="mt-3 space-y-3 border-l pl-3">
          {node.children.map((child) => (
            <CommentItem
              key={child.id}
              node={child}
              onReply={onReply}
              onLike={onLike}
              admin={admin}
              onApprove={onApprove}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Comments({ admin = false }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      const data = await getComments();
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError("Не удалось загрузить комментарии");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  const tree = useMemo(() => buildTree(list), [list]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!text.trim()) return;

    try {
      const res = await addComment({
        name: name.trim() || "Гость",
        text: text.trim(),
        parentId: replyTo?.id || null,
      });
      if (res.ok) {
        setText("");
        setReplyTo(null);
        setList(res.list || []);
      } else {
        setError(res.error || "Ошибка отправки");
      }
    } catch (e) {
      setError("Ошибка сети");
    }
  }

  async function onLike(node) {
    try {
      const res = await likeComment(node.id);
      if (res.ok) setList(res.list || []);
    } catch {}
  }
  async function onApprove(node) {
    try {
      const res = await modApprove(node.id);
      if (res.ok) setList(res.list || []);
    } catch {}
  }
  async function onRemove(node) {
    try {
      const res = await modRemove(node.id);
      if (res.ok) setList(res.list || []);
    } catch {}
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="rounded-2xl border p-4">
        <div className="mb-2 text-lg font-medium">Оставить комментарий</div>
        {replyTo && (
          <div className="mb-3 rounded-lg bg-neutral-900/5 px-3 py-2 text-sm dark:bg-white/10">
            Ответ на: <b>{replyTo.name || "Гость"}</b>{" "}
            <button
              type="button"
              className="ml-2 text-rose-600 underline underline-offset-4"
              onClick={() => setReplyTo(null)}
            >
              отменить
            </button>
          </div>
        )}
        <div className="mb-2 grid gap-3 md:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ваше имя (необязательно)"
            className="rounded-xl border bg-white px-4 py-3 dark:bg-neutral-900"
          />
          <div className="text-sm opacity-70 self-center">
            Публикация может требовать модерации.
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Текст…"
          rows={4}
          className="mb-3 w-full rounded-xl border bg-white px-4 py-3 dark:bg-neutral-900"
        />
        {error && <div className="mb-3 text-sm text-rose-600">{error}</div>}
        <button
          type="submit"
          className="rounded-xl bg-neutral-900 px-5 py-2 text-white dark:bg-white dark:text-neutral-900"
        >
          Отправить
        </button>
      </form>

      <div className="space-y-3">
        {loading ? (
          <div className="opacity-70">Загрузка…</div>
        ) : tree.length === 0 ? (
          <div className="opacity-70">Пока нет комментариев — будьте первым!</div>
        ) : (
          tree.map((node) => (
            <CommentItem
              key={node.id}
              node={node}
              onReply={setReplyTo}
              onLike={onLike}
              admin={admin}
              onApprove={onApprove}
              onRemove={onRemove}
            />
          ))
        )}
      </div>
    </div>
  );
}
