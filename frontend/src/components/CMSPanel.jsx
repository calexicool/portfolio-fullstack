/* eslint-disable */
import React, { useEffect, useMemo, useState } from 'react';
import {
  getMe, login, logout, initAdmin,
  listAdmins, createAdmin, updateAdminRole, deleteAdmin, issueCode,
} from '../api/client';
import { X } from 'lucide-react';

const ROLES = ['admin','editor','viewer'];

export default function CMSPanel({
  open, onClose,
  edit, onToggleEdit,             // <- тумблер режима редактирования из App
  onAuthed,                       // <- вызвать, когда вошли (обновить App)
}) {
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState('login'); // 'login' | 'add'
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');

  // формы
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass,  setLoginPass]  = useState('');
  const [code,       setCode]       = useState('');
  const [newEmail,   setNewEmail]   = useState('');
  const [newPass,    setNewPass]    = useState('');
  const [newRole,    setNewRole]    = useState('admin');

  // управление списком админов
  const [admins, setAdmins] = useState([]);
  const [supportsAdminApi, setSupportsAdminApi] = useState(true);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setErr('');
      try {
        const user = await getMe().catch(() => null);
        setMe(user);
        if (user) {
          // пробуем загрузить список админов
          try {
            const list = await listAdmins();
            setAdmins(list || []);
            setSupportsAdminApi(true);
          } catch {
            setSupportsAdminApi(false);
          }
        }
      } catch (e) {
        // ignore
      }
    })();
  }, [open]);

  const isAuthed = !!me?.isAdmin;

  async function handleLogin(e) {
    e?.preventDefault();
    setErr(''); setBusy(true);
    try {
      const user = await login(loginEmail.trim(), loginPass);
      setMe(user);
      onAuthed?.(user);
    } catch (e) {
      setErr(e.message || 'Не удалось войти');
    } finally { setBusy(false); }
  }

  async function handleInit(e) {
    e?.preventDefault();
    setErr(''); setBusy(true);
    try {
      const user = await initAdmin(code.trim(), newEmail.trim(), newPass);
      setMe(user);
      onAuthed?.(user);
    } catch (e) {
      setErr(e.message || 'Не удалось создать администратора');
    } finally { setBusy(false); }
  }

  async function handleLogout() {
    setBusy(true);
    try { await logout(); setMe(null); onAuthed?.(null); }
    finally { setBusy(false); }
  }

  async function refreshAdmins() {
    try { const list = await listAdmins(); setAdmins(list || []); }
    catch { /* может не быть на старом бэке */ }
  }

  async function handleCreateAdmin(e) {
    e?.preventDefault();
    setErr(''); setBusy(true);
    try {
      await createAdmin({ code: code.trim(), email: newEmail.trim(), password: newPass, role: newRole });
      setCode(''); setNewEmail(''); setNewPass(''); setNewRole('editor');
      await refreshAdmins();
    } catch (e) {
      setErr(e.message || 'Не удалось добавить админа');
    } finally { setBusy(false); }
  }

  async function handleChangeRole(id, role) {
    setBusy(true);
    try { await updateAdminRole(id, role); await refreshAdmins(); }
    finally { setBusy(false); }
  }

  async function handleRemove(id) {
    if (!confirm('Удалить этого администратора?')) return;
    setBusy(true);
    try { await deleteAdmin(id); await refreshAdmins(); }
    finally { setBusy(false); }
  }

  async function handleIssueCode() {
    setBusy(true); setErr('');
    try {
      const res = await issueCode(); // { code: '72405-....' }
      if (res?.code) {
        navigator.clipboard?.writeText(res.code).catch(()=>{});
        alert(`Код сгенерирован и скопирован в буфер:\n\n${res.code}`);
      }
    } catch (e) {
      setErr(e.message || 'Не удалось сгенерировать код');
    } finally { setBusy(false); }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="relative w-[min(980px,96vw)] rounded-2xl bg-neutral-950 text-neutral-50 shadow-2xl ring-1 ring-white/10">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1 hover:bg-white/10">
          <X size={18}/>
        </button>

        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-4">
          <span className="text-lg font-semibold">CMS</span>
          <div className="grow"/>
          {isAuthed && (
            <div className="flex items-center gap-3">
              <label className="flex select-none items-center gap-2 text-sm opacity-80">
                <input type="checkbox" className="h-4 w-4" checked={!!edit} onChange={()=>onToggleEdit?.(!edit)}/>
                Режим редактирования
              </label>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
              >Выйти</button>
            </div>
          )}
        </div>

        {/* контент */}
        <div className="grid gap-6 p-6 md:grid-cols-2">
          {!isAuthed ? (
            <>
              {/* блок выбора */}
              <div className="md:col-span-2">
                <div className="inline-flex rounded-xl bg-white/10 p-1">
                  <button
                    onClick={()=>setTab('login')}
                    className={`rounded-lg px-4 py-1.5 text-sm ${tab==='login'?'bg-white/20':''}`}
                  >Войти</button>
                  <button
                    onClick={()=>setTab('add')}
                    className={`rounded-lg px-4 py-1.5 text-sm ${tab==='add'?'bg-white/20':''}`}
                  >Добавить админа</button>
                </div>
              </div>

              {/* Вход */}
              {tab==='login' && (
                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="text-sm opacity-80">Вход</div>
                  <input
                    value={loginEmail} onChange={e=>setLoginEmail(e.target.value)}
                    placeholder="email"
                    className="w-full rounded-lg bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/20"
                  />
                  <input
                    type="password"
                    value={loginPass} onChange={e=>setLoginPass(e.target.value)}
                    placeholder="пароль"
                    className="w-full rounded-lg bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/20"
                  />
                  <button
                    disabled={busy}
                    className="rounded-lg bg-white px-4 py-2 text-neutral-900 hover:opacity-90 disabled:opacity-50"
                  >Войти</button>
                </form>
              )}

              {/* Добавить админа */}
              {tab==='add' && (
                <form onSubmit={handleCreateAdmin} className="space-y-3">
                  <div className="text-sm opacity-80">Добавить администратора</div>
                  <input
                    value={code} onChange={e=>setCode(e.target.value)}
                    placeholder="код"
                    className="w-full rounded-lg bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/20"
                  />
                  <input
                    value={newEmail} onChange={e=>setNewEmail(e.target.value)}
                    placeholder="email"
                    className="w-full rounded-lg bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/20"
                  />
                  <input
                    type="password"
                    value={newPass} onChange={e=>setNewPass(e.target.value)}
                    placeholder="пароль"
                    className="w-full rounded-lg bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/20"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm opacity-70">роль:</span>
                    <select
                      value={newRole} onChange={e=>setNewRole(e.target.value)}
                      className="rounded-lg bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/20"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={busy}
                      className="rounded-lg bg-white px-4 py-2 text-neutral-900 hover:opacity-90 disabled:opacity-50"
                    >Добавить</button>
                    <button
                      type="button"
                      onClick={handleInit}
                      title="Если это самый первый админ в системе"
                      className="rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/10"
                    >Инициализировать (первый админ)</button>
                  </div>
                </form>
              )}

              <div className="rounded-xl bg-white/5 p-4 text-sm opacity-80">
                Чтобы добавить ещё админа, администратор генерирует «код выдачи», а затем вы вводите
                его здесь вместе с email/паролем.
              </div>
            </>
          ) : (
            <>
              {/* панель администратора после входа */}
              <div className="space-y-3">
                <div className="text-sm opacity-80">Выдать приглашение</div>
                <button
                  disabled={!supportsAdminApi || busy}
                  onClick={handleIssueCode}
                  className="rounded-lg bg-white px-4 py-2 text-neutral-900 hover:opacity-90 disabled:opacity-40"
                >
                  Сгенерировать код
                </button>
                {!supportsAdminApi && (
                  <div className="text-xs opacity-70">
                    На текущем бэкенде нет API для кодов/админов. Обнови бэкенд — тогда кнопка заработает.
                  </div>
                )}
                <div className="text-xs opacity-70">
                  Код копируется в буфер обмена автоматически.
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm opacity-80">Администраторы</div>
                  <button
                    onClick={refreshAdmins}
                    disabled={!supportsAdminApi || busy}
                    className="rounded-lg border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10 disabled:opacity-40"
                  >Обновить</button>
                </div>

                <div className="space-y-2">
                  {(admins || []).map(a => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                      <div>
                        <div className="font-medium">{a.email}</div>
                        <div className="text-xs opacity-60">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={a.role}
                          onChange={(e)=>handleChangeRole(a.id, e.target.value)}
                          disabled={!supportsAdminApi || busy}
                          className="rounded-lg bg-white/10 px-2 py-1 outline-none ring-1 ring-white/10"
                        >
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <button
                          onClick={()=>handleRemove(a.id)}
                          disabled={!supportsAdminApi || busy}
                          className="rounded-lg border border-white/20 px-2 py-1 text-sm hover:bg-white/10 disabled:opacity-40"
                        >Удалить</button>
                      </div>
                    </div>
                  ))}
                  {!admins?.length && (
                    <div className="rounded-lg bg-white/5 p-3 text-sm opacity-70">Список пуст</div>
                  )}
                </div>
              </div>
            </>
          )}

          {err && (
            <div className="md:col-span-2 rounded-lg bg-rose-600/15 p-3 text-sm text-rose-200">
              {String(err)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
