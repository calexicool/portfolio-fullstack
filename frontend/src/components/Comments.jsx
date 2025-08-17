/* eslint-disable */
import React, { useEffect, useState } from 'react';

const api = async (url, opts = {}) => {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export default function Comments({ admin }) {
  const [list, setList] = useState([]);
  const [text, setText] = useState('');
  const [pending, setPending] = useState(false);

  const load = async () => {
    try {
      const data = await api('/api/comments');
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('comments load', e);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setPending(true);
    try {
      await api('/api/comments', { method: 'POST', body: JSON.stringify({ text }) });
      setText('');
      await load();
    } finally {
      setPending(false);
    }
  };

  const like = async (id) => {
    try {
      await api(`/api/comments/${id}/like`, { method: 'POST' });
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  const reply = async (parentId, replyText) => {
    if (!replyText.trim()) return;
    try {
      await api('/api/comments', {
        method: 'POST',
        body: JSON.stringify({ text: replyText, parentId }),
      });
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  const Item = ({ c, level = 0 }) => {
    const [t, setT] = useState('');
    return (
      <div className="mb-3" style={{ marginLeft: level * 16 }}>
        <div className="rounded-xl border p-3 bg-white/70 dark:bg-neutral-900/70">
          <div className="text-sm opacity-70">{c.author || 'Гость'}</div>
          <div className="mt-1 whitespace-pre-wrap">{c.text}</div>
          <div className="mt-2 flex gap-4 text-sm opacity-70">
            <button onClick={() => like(c.id)} className="hover:opacity-100">❤ {c.likes || 0}</button>
            <details>
              <summary className="cursor-pointer">Ответить</summary>
              <div className="mt-2 flex gap-2">
                <input
                  className="flex-1 rounded border px-2 py-1"
                  value={t}
                  onChange={(e) => setT(e.target.value)}
                  placeholder="Ваш ответ…"
                />
                <button
                  className="rounded border px-3"
                  onClick={() => { reply(c.id, t); setT(''); }}
                >
                  Отправить
                </button>
              </div>
            </details>
            {admin && c.hidden && <span className="text-amber-600">На модерации</span>}
          </div>
        </div>

        {(c.replies || []).map((r) => (
          <Item key={r.id} c={r} level={level + 1} />
        ))}
      </div>
    );
  };

  return (
    <div className="mt-6">
      <form onSubmit={submit} className="mb-4 flex gap-2">
        <input
          className="flex-1 rounded border px-3 py-2"
          placeholder="Напишите комментарий…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button disabled={pending} className="rounded border px-4 py-2">
          {pending ? '…' : 'Отправить'}
        </button>
      </form>

      {list.length === 0 ? (
        <div className="opacity-60">Пока нет комментариев</div>
      ) : (
        list.map((c) => <Item key={c.id} c={c} />)
      )}
    </div>
  );
}
