/* eslint-disable */
import React, { useState } from 'react';
import { X, Copy } from 'lucide-react';
import { seedAdmin, login, logout, createInvite, acceptInvite } from '../api/client';

export default function CMSPanel({
  open,
  onClose,
  isAdmin,
  editMode,
  setEditMode,
  refreshAuth,
}) {
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');

  // формы
  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');

  const [code,  setCode]  = useState('');
  const [invEmail, setInvEmail] = useState('');
  const [invPass,  setInvPass]  = useState('');

  const [seedCode, setSeedCode] = useState(''); // на случай «первичной инициализации»
  const [seedEmail,setSeedEmail]= useState('');
  const [seedPass, setSeedPass] = useState('');

  // inv gen
  const [genRole, setGenRole] = useState('admin');
  const [genCode, setGenCode] = useState('');

  if (!open) return null;
  const stop = (e)=> e.stopPropagation();

  const handleLogin = async (e)=>{
    e.preventDefault(); setErr('');
    try { setBusy(true); await login(email, pass); await refreshAuth?.(); }
    catch(ex){ setErr(ex?.payload?.message || ex?.message || 'Ошибка'); }
    finally{ setBusy(false); }
  };

  const handleLogout = async ()=>{
    try { setBusy(true); await logout(); await refreshAuth?.(); }
    catch(ex){ setErr(ex?.payload?.message || ex?.message || 'Ошибка'); }
    finally{ setBusy(false); }
  };

  const handleSeed = async (e)=>{
    e.preventDefault(); setErr('');
    try { setBusy(true); await seedAdmin(seedCode, seedEmail, seedPass); await refreshAuth?.(); }
    catch(ex){ setErr(ex?.payload?.message || ex?.message || 'Ошибка'); }
    finally{ setBusy(false); }
  };

  const handleInvite = async ()=>{
    setErr('');
    try { setBusy(true); const r = await createInvite(genRole); setGenCode(r.code || ''); }
    catch(ex){ setErr(ex?.payload?.message || ex?.message || 'Ошибка'); }
    finally{ setBusy(false); }
  };

  const handleAccept = async (e)=>{
    e.preventDefault(); setErr('');
    try { setBusy(true); await acceptInvite(code, invEmail, invPass); await refreshAuth?.(); }
    catch(ex){ setErr(ex?.payload?.message || ex?.message || 'Ошибка'); }
    finally{ setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose} style={{pointerEvents:'auto'}}>
      <div className="mx-4 w-full max-w-3xl rounded-2xl border border-white/15 bg-neutral-950 text-white shadow-2xl" onClick={stop}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold">CMS</div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 px-6 pb-6 md:grid-cols-2">

          {/* Левая колонка */}
          <div className="space-y-6">
            {/* Добавить администратора по коду */}
            <div className="rounded-xl border border-white/10 p-4">
              <form onSubmit={handleAccept} className="space-y-3">
                <input className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 outline-none" placeholder="код" value={code} onChange={e=>setCode(e.target.value)} />
                <input className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 outline-none" placeholder="email" value={invEmail} onChange={e=>setInvEmail(e.target.value)} />
                <input className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 outline-none" placeholder="пароль" type="password" value={invPass} onChange={e=>setInvPass(e.target.value)} />
                <button type="submit" disabled={busy} className="rounded-xl bg-white px-4 py-2 text-neutral-900 disabled:opacity-60">Добавить</button>
              </form>
            </div>

            {/* Вход / Выход */}
            <div className="rounded-xl border border-white/10 p-4">
              {!isAdmin ? (
                <form onSubmit={handleLogin} className="space-y-3">
                  <input className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 outline-none" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
                  <input className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 outline-none" placeholder="пароль" type="password" value={pass} onChange={e=>setPass(e.target.value)} />
                  <button type="submit" disabled={busy} className="rounded-xl bg-white px-4 py-2 text-neutral-900 disabled:opacity-60">Войти</button>
                </form>
              ) : (
                <button type="button" onClick={handleLogout} disabled={busy} className="rounded-xl bg-white px-4 py-2 text-neutral-900 disabled:opacity-60">Выйти</button>
              )}
            </div>

            {/* Первичная инициализация (если нужна) */}
            <div className="rounded-xl border border-white/10 p-4">
              <form onSubmit={handleSeed} className="space-y-3">
                <input className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 outline-none" placeholder="код инициализации" value={seedCode} onChange={e=>setSeedCode(e.target.value)} />
                <input className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 outline-none" placeholder="email" value={seedEmail} onChange={e=>setSeedEmail(e.target.value)} />
                <input className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 outline-none" placeholder="пароль" type="password" value={seedPass} onChange={e=>setSeedPass(e.target.value)} />
                <button type="submit" disabled={busy} className="rounded-xl bg-white px-4 py-2 text-neutral-900 disabled:opacity-60">Инициализировать</button>
              </form>
            </div>
          </div>

          {/* Правая колонка (для админа) */}
          <div className="space-y-6">
            {/* Режим редактирования */}
            <div className="rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <span>Режим редактирования</span>
                <label className="inline-flex cursor-pointer items-center">
                  <input type="checkbox" className="peer sr-only" checked={!!editMode} onChange={e=>setEditMode?.(e.target.checked)} />
                  <span className="h-6 w-11 rounded-full bg-white/20 peer-checked:bg-white/70 relative after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
                </label>
              </div>
            </div>

            {/* Сгенерировать код */}
            <div className="rounded-xl border border-white/10 p-4">
              <div className="mb-3 flex items-center gap-2">
                <select className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 outline-none" value={genRole} onChange={e=>setGenRole(e.target.value)}>
                  <option value="admin">admin</option>
                  <option value="editor">editor</option>
                </select>
                <button type="button" onClick={handleInvite} disabled={busy || !isAdmin} className="rounded-xl bg-white px-4 py-2 text-neutral-900 disabled:opacity-60">Сгенерировать</button>
              </div>
              {genCode && (
                <div className="flex items-center gap-2">
                  <div className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2">{genCode}</div>
                  <button type="button" onClick={()=>navigator.clipboard.writeText(genCode)} className="rounded-lg p-2 hover:bg-white/10">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {err && <div className="px-6 pb-6 text-sm text-rose-400">{err}</div>}
      </div>
    </div>
  );
}
