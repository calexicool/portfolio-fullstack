/* eslint-disable */
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { seedAdmin, login } from '../api/client';

export default function CMSPanel({ open, onClose, isAdmin, refreshAuth }) {
  const [code, setCode] = useState('');
  const [initEmail, setInitEmail] = useState('');
  const [initPass, setInitPass] = useState('');

  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (!open) return null;

  const stop = (e) => e.stopPropagation();

  const onSeed = async (e) => {
    e.preventDefault();
    setErr('');
    if (!code || !initEmail || !initPass) return;
    try {
      setBusy(true);
      await seedAdmin(code.trim(), initEmail.trim(), initPass);
      await refreshAuth?.();
      onClose?.();
    } catch (ex) {
      console.error(ex);
      setErr('Не удалось создать администратора');
    } finally {
      setBusy(false);
    }
  };

  const onLogin = async (e) => {
    e.preventDefault();
    setErr('');
    if (!email || !pass) return;
    try {
      setBusy(true);
      await login(email.trim(), pass);
      await refreshAuth?.();
      onClose?.();
    } catch (ex) {
      console.error(ex);
      setErr('Неверный email или пароль');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
      // гарантируем, что оверлей принимает события
      style={{ pointerEvents: 'auto' }}
    >
      <div
        className="mx-4 w-full max-w-3xl rounded-2xl border border-white/15 bg-neutral-950 text-white shadow-2xl"
        onClick={stop}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <span className="inline-block h-5 w-5 rounded-full border" />
            CMS
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 px-6 pb-6 md:grid-cols-2">
          {/* Инициализация */}
          <div className="rounded-xl border border-white/10 p-4">
            <div className="mb-3 text-sm font-semibold opacity-80">
              Первичная инициализация
            </div>
            <form onSubmit={onSeed} className="space-y-3">
              <input
                className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-white/30"
                placeholder="Код (например, 72405)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-white/30"
                placeholder="email"
                value={initEmail}
                onChange={(e) => setInitEmail(e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-white/30"
                placeholder="пароль"
                type="password"
                value={initPass}
                onChange={(e) => setInitPass(e.target.value)}
              />
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-neutral-900 hover:opacity-90 disabled:opacity-60"
              >
                Создать
              </button>
            </form>
          </div>

          {/* Вход */}
          <div className="rounded-xl border border-white/10 p-4">
            <div className="mb-3 text-sm font-semibold opacity-80">Вход</div>
            <form onSubmit={onLogin} className="space-y-3">
              <input
                className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-white/30"
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-white/30"
                placeholder="пароль"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
              />
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-neutral-900 hover:opacity-90 disabled:opacity-60"
              >
                Войти
              </button>
            </form>
          </div>
        </div>

        {err && (
          <div className="px-6 pb-6 text-sm text-rose-400">{err}</div>
        )}
      </div>
    </div>
  );
}
