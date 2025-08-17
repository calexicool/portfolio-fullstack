import React, { useEffect, useMemo, useState } from "react";
import { getComments, addComment, likeComment, modApprove, modRemove } from "../api/client";

// аккуратно строим дерево, не падаем на мусорных данных
function toTree(list = []) {
  try {
    const byId = new Map();
    (Array.isArray(list) ? list : []).forEach(c => byId.set(c.id, { ...c, children: [] }));
    const roots = [];
    byId.forEach(n => {
      if (n.parentId && byId.has(n.parentId)) byId.get(n.parentId).children.push(n);
      else roots.push(n);
    });
    const sort = (a,b) => (new Date(b.createdAt).getTime()||0) - (new Date(a.createdAt).getTime()||0);
    const walk = arr => arr.sort(sort).forEach(ch => walk(ch.children));
    walk(roots);
    return roots;
  } catch {
    return [];
  }
}

function Btn({ onClick, children, danger, ok }) {
  const base = "inline-flex items-center gap-1 rounded-lg border px-2 py-1";
  const hover = " hover:bg-neutral-900/5 dark:hover:bg-white/10";
  const tone = danger ? " text-rose-700 dark:text-rose-400"
            : ok ? " text-emerald-700 dark:text-emerald-400"
            : "";
  return <button onClick={onClick} className={base + hover + tone}>{children}</button>;
}

function Item({ node, onReply, onLike, admin, onApprove, onRemove }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="mb-1 text-sm opacity-70">
        {node.name || "Гость"} • {node.createdAt ? new Date(node.createdAt).toLocaleString() : ""}
        {node.approved === false && (
          <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900">на модерации</span>
        )}
      </div>
      <div className="whitespace-pre-wrap leading-relaxed">{node.text}</div>
      <div className="mt-2 flex flex-wrap gap-3 text-sm">
        <Btn onClick={() => onReply(node)}>Ответить</Btn>
        <Btn onClick={() => onLike(node)}>👍 {node.likes || 0}</Btn>
        {admin && node.approved === false && <Btn ok onClick={() => onApprove(node)}>Одобрить</Btn>}
        {admin && <Btn danger onClick={() => onRemove(node)}>Удалить</Btn>}
      </div>

      {Array.isArray(node.children) && node.children.length > 0 && (
        <div className="mt-3 space-y-3 border-l pl-3">
          {node.children.map(ch => (
            <Item key={ch.id} node={ch} onReply={onReply} onLike={onLike}
                  admin={admin} onApprove={onApprove} onRemove={onRemove}/>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Comments({ admin = false }) {
  const [list, setList]   = useState([]);
  const [busy, setBusy]   = useState(false);
  const [name, setName]   = useState("");
  const [text, setText]   = useState("");
  const [replyTo, setRT]  = useState(null);
  const [err, setErr]     = useState("");

  async function load() {
    setErr("");
    try {
      const data = await getComments();
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setList([]); // не падаем, просто пусто
      setErr("Не удалось загрузить комментарии");
    }
  }

  useEffect(() => { load(); }, []);
  const tree = useMemo(() => toTree(list), [list]);

  async function submit(e) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true); setErr("");
    try {
      const res = await addComment({ name: name.trim() || "Гость", text: text.trim(), parentId: replyTo?.id ?? null });
      if (res?.ok) { setText(""); setRT(null); setList(res.list || []); }
      else setErr(res?.error || "Ошибка отправки");
    } catch (e) {
      console.error(e); setErr("Сеть недоступна");
    } finally { setBusy(false); }
  }
  const onLike    = async n => { try { const r = await likeComment(n.id);    if (r?.ok) setList(r.list || []);} catch {} };
  const onApprove = async n => { try { const r = await modApprove(n.id);     if (r?.ok) setList(r.list || []);} catch {} };
  const onRemove  = async n => { try { const r = await modRemove(n.id);      if (r?.ok) setList(r.list || []);} catch {} };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="rounded-2xl border p-4">
        <div className="mb-2 text-lg font-medium">Оставить комментарий</div>
        {replyTo && (
          <div className="mb-3 rounded-lg bg-neutral-900/5 px-3 py-2 text-sm dark:bg-white/10">
            Ответ на: <b>{replyTo.name || "Гость"}</b>{" "}
            <button type="button" className="ml-2 text-rose-600 underline underline-offset-4" onClick={()=>setRT(null)}>
              отменить
            </button>
          </div>
        )}
        <div className="mb-2 grid gap-3 md:grid-cols-2">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ваше имя (необязательно)"
                 className="rounded-xl border bg-white px-4 py-3 dark:bg-neutral-900"/>
        </div>
        <textarea value={text} onChange={e=>setText(e.target.value)} rows={4} placeholder="Текст…"
                  className="mb-3 w-full rounded-xl border bg-white px-4 py-3 dark:bg-neutral-900"/>
        {err && <div className="mb-3 text-sm text-rose-600">{err}</div>}
        <button disabled={busy} className="rounded-xl bg-neutral-900 px-5 py-2 text-white dark:bg-white dark:text-neutral-900">
          {busy ? "Отправка…" : "Отправить"}
        </button>
      </form>

      {tree.length === 0 ? (
        <div className="opacity-70">Пока нет комментариев — будьте первым!</div>
      ) : (
        <div className="space-y-3">
          {tree.map(n => (
            <Item key={n.id} node={n} onReply={setRT} onLike={onLike}
                  admin={admin} onApprove={onApprove} onRemove={onRemove}/>
          ))}
        </div>
      )}
    </div>
  );
}
