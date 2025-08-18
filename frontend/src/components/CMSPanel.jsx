/* frontend/src/components/CMSPanel.jsx */
import React, { useEffect, useState } from 'react';
import {
  getMe,
  login,
  initFirstAdmin,
  issueCode,
  addAdmin,
  getAdmins,
  setAdminRole,
  removeAdmin,
  logout,
} from '../api/client';

export default function CMSPanel({
  open,
  onClose,
  onLoggedIn,   // (optional) колбэк — например, refreshAuth() в App
  user,         // текущий пользователь из App (необяз.)
  setUser,      // сеттер пользователя из App (необяз.)
}) {
  const [tab, setTab] = useState('login'); // 'login' | 'add'
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || '').trim());
  const hasPass = (s) => (s || '').trim().length > 0;


  // формы
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [firstCode, setFirstCode] = useState(''); // код инициализации
  const [firstEmail, setFirstEmail] = useState('');
  const [firstPass, setFirstPass] = useState('');

  const [inviteCode, setInviteCode] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newRole, setNewRole] = useState('admin');

  const [admins, setAdmins] = useState([]);
  const [hasAdmins, setHasAdmins] = useState(false);

  const [curUser, setCurUser] = useState(null);
  const loggedIn = !!curUser;

  // при открытии тянем me + список админов
  useEffect(() => {
    if (!open) return;
    (async () => {
      setErr('');
      try {
        const [me, list] = await Promise.allSettled([getMe(), getAdmins()]);
        if (me.status === 'fulfilled') {
          setCurUser(me.value || null);
          setUser?.(me.value || null);
        }
        if (list.status === 'fulfilled') {
          const arr = Array.isArray(list.value) ? list.value : [];
          setAdmins(arr);
          setHasAdmins(arr.length > 0);
        } else {
          setAdmins([]);
          setHasAdmins(false);
        }
      } catch (_) {}
    })();
  }, [open, setUser]);

  async function refreshAdmins() {
    try {
      const list = await getAdmins();
      setAdmins(list);
      setHasAdmins((list || []).length > 0);
    } catch {
      setAdmins([]);
      setHasAdmins(false);
    }
  }

  async function handleLogin() {
    setErr('');
    setBusy(true);
    try {
      await login(email.trim(), password);
      const me = await getMe();
      setCurUser(me);
      setUser?.(me);
      onLoggedIn?.();            // ← дайте сюда refreshAuth() из App
      await refreshAdmins();
      // по желанию можно закрывать модалку:
      // onClose?.();
    } catch (e) {
      setErr(e.message || 'Ошибка входа');
    } finally {
      setBusy(false);
    }
  }

  async function handleInit() {
    setErr('');
    setBusy(true);
    try {
      await initFirstAdmin({
        code: (firstCode || '').trim(),
        email: firstEmail.trim(),
        password: firstPass,
        role: 'owner',
      });
      const me = await getMe();
      setCurUser(me);
      setUser?.(me);
      onLoggedIn?.();
      await refreshAdmins();
      setTab('login'); // после инициализации возвращаемся на вход
    } catch (e) {
      setErr(e.message || 'Не удалось инициализировать');
    } finally {
      setBusy(false);
    }
  }

  async function handleIssueCode() {
    setErr('');
    setBusy(true);
    try {
      const { code } = await issueCode();
      setInviteCode(code || '');
    } catch (e) {
      setErr(e.message || 'Не удалось получить код');
    } finally {
      setBusy(false);
    }
  }

  async function handleAddAdmin() {
    setErr('');
    setBusy(true);
    try {
      await addAdmin({
        code: (inviteCode || '').trim(),
        email: newEmail.trim(),
        password: newPass,
        role: newRole,
      });
      setInviteCode('');
      setNewEmail('');
      setNewPass('');
      await refreshAdmins();
    } catch (e) {
      setErr(e.message || 'Не удалось добавить');
    } finally {
      setBusy(false);
    }
  }

  async function handleRoleChange(id, role) {
    setErr('');
    setBusy(true);
    try {
      await setAdminRole(id, role);
      await refreshAdmins();
      const me = await getMe();
      setCurUser(me);
      setUser?.(me);
    } catch (e) {
      setErr(e.message || 'Не удалось изменить роль');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(id) {
    setErr('');
    setBusy(true);
    try {
      await removeAdmin(id);
      await refreshAdmins();
      const me = await getMe();
      setCurUser(me);
      setUser?.(me);
    } catch (e) {
      setErr(e.message || 'Не удалось удалить');
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setErr('');
    setBusy(true);
    try {
      await logout();
      setCurUser(null);
      setUser?.(null);
    } catch (e) {
      setErr(e.message || 'Не удалось выйти');
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  // вкладку "Добавить админа" показываем только если админов ещё нет ИЛИ пользователь вошёл
  const showAddTab = !hasAdmins || loggedIn;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-6" onMouseDown={onClose}>
      <div className="w-[min(980px,96vw)] rounded-2xl bg-neutral-900 text-white shadow-xl" onMouseDown={(e)=>e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="text-lg font-semibold">CMS</div>
          <button className="rounded px-2 py-1 hover:bg-white/10" onClick={onClose}>✕</button>
        </div>

        <div className="px-5 pb-5 pt-3">
          {/* табы */}
          <div className="mb-4 flex gap-2">
            <button
              className={`rounded-xl px-3 py-1 ${tab === 'login' ? 'bg-white text-neutral-900' : 'bg-white/10'}`}
              onClick={() => setTab('login')}
            >
              Войти
            </button>
            {showAddTab && (
              <button
                className={`rounded-xl px-3 py-1 ${tab === 'add' ? 'bg-white text-neutral-900' : 'bg-white/10'}`}
                onClick={() => { setTab('add'); refreshAdmins(); }}
              >
                Добавить админа
              </button>
            )}
          </div>

          {err && <div className="mb-3 rounded-lg bg-rose-600/20 px-3 py-2 text-rose-200">{err}</div>}

          {/* LOGIN */}
          {tab === 'login' && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-3">
                {loggedIn ? (
                  <div className="rounded-lg bg-white/10 p-3">
                    <div className="mb-2 text-sm opacity-80">Вы вошли как:</div>
                    <div className="font-medium">{curUser?.email}</div>
                    <div className="text-sm opacity-80">роль: {curUser?.role}</div>
                    <div className="mt-3 flex gap-2">
                      <button className="rounded bg-white px-3 py-1 text-neutral-900" onClick={handleLogout} disabled={busy}>
                        Выйти
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <input
                      className="w-full rounded-lg bg-white/10 px-3 py-2 outline-none"
                      placeholder="email"
                      required
                      value={email}
                      onChange={(e)=>setEmail(e.target.value)}
                    />
                    <input                    
                      className="w-full rounded-lg bg-white/10 px-3 py-2 outline-none"
                      placeholder="пароль"
                      type="password"
                      required
                      value={password}
                      onChange={(e)=>setPassword(e.target.value)}
                    />
                    <button
                      className="rounded bg-white px-4 py-2 text-neutral-900 disabled:opacity-50"
                      onClick={handleLogin}
                      disabled={busy || !isEmail(email) || !hasPass(password)}
                    >
                      {busy ? 'Вход…' : 'Войти'}
                    </button>
                  </>
                )}
              </div>

              <div className="rounded-lg bg-white/5 p-3 text-sm opacity-80">
                Чтобы добавить ещё админа, войдите, сгенерируйте «код выдачи», затем введите его вместе с email/паролем.
              </div>

              {/* ИНИЦИАЛИЗАЦИЯ: показываем только если админов ещё нет */}
              {!loggedIn && !hasAdmins && (
                <div className="md:col-span-2">
                  <div className="mt-6 rounded-lg border border-white/10 p-3">
                    <div className="mb-2 font-medium">Инициализация (первый админ)</div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                      <input
                        className="rounded-lg bg-white/10 px-3 py-2 outline-none"
                        placeholder="код (INIT_CODE)"
                        value={firstCode}
                        onChange={(e)=>setFirstCode(e.target.value)}
                      />
                      <input
                        className="rounded-lg bg-white/10 px-3 py-2 outline-none"
                        placeholder="email"
                        value={firstEmail}
                        onChange={(e)=>setFirstEmail(e.target.value)}
                      />
                      <input
                        className="rounded-lg bg-white/10 px-3 py-2 outline-none"
                        placeholder="пароль"
                        type="password"
                        value={firstPass}
                        onChange={(e)=>setFirstPass(e.target.value)}
                      />
                      <button className="rounded bg-white px-4 py-2 text-neutral-900" onClick={handleInit} disabled={busy}>
                        {busy ? 'Создание…' : 'Инициализировать'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ADD ADMIN */}
          {tab === 'add' && showAddTab && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    className="rounded bg-white px-3 py-1 text-neutral-900"
                    onClick={handleIssueCode}
                    disabled={busy || !loggedIn}
                  >
                    Сгенерировать код
                  </button>
                  <input
                    className="flex-1 rounded-lg bg-white/10 px-3 py-2 outline-none"
                    placeholder="код"
                    value={inviteCode}
                    onChange={(e)=>setInviteCode(e.target.value)}
                  />
                </div>

                <input
                  className="w-full rounded-lg bg-white/10 px-3 py-2 outline-none"
                  placeholder="email нового админа"
                  value={newEmail}
                  onChange={(e)=>setNewEmail(e.target.value)}
                />
                <input
                  className="w-full rounded-lg bg-white/10 px-3 py-2 outline-none"
                  placeholder="пароль"
                  type="password"
                  value={newPass}
                  onChange={(e)=>setNewPass(e.target.value)}
                />
                <select
                  className="w-full rounded-lg bg-white/10 px-3 py-2 outline-none"
                  value={newRole}
                  onChange={(e)=>setNewRole(e.target.value)}
                >
                  <option value="admin">admin</option>
                  <option value="editor">editor</option>
                  <option value="viewer">viewer</option>
                </select>
                <button
                  className="rounded bg-white px-4 py-2 text-neutral-900"
                  onClick={handleAddAdmin}
                  disabled={busy || !loggedIn}
                >
                  {busy ? 'Добавление…' : 'Добавить'}
                </button>
              </div>

              <div className="rounded-lg bg-white/5 p-3">
                <div className="mb-2 font-medium">Администраторы</div>
                {!admins.length && <div className="text-sm opacity-70">Список пуст</div>}
                <ul className="space-y-2">
                  {admins.map((a) => (
                    <li key={a.id} className="flex items-center gap-2 rounded bg-white/5 px-3 py-2">
                      <div className="flex-1">
                        <div className="font-medium">{a.email || a.name || a.id}</div>
                        <div className="text-xs opacity-70">id: {a.id}</div>
                      </div>
                      <select
                        className="rounded bg-white/10 px-2 py-1 text-sm outline-none"
                        value={a.role}
                        onChange={(e) => handleRoleChange(a.id, e.target.value)}
                        disabled={busy || !loggedIn}
                      >
                        <option value="owner">owner</option>
                        <option value="admin">admin</option>
                        <option value="editor">editor</option>
                        <option value="viewer">viewer</option>
                      </select>
                      <button
                        className="rounded bg-rose-500 px-2 py-1 text-sm"
                        onClick={() => handleRemove(a.id)}
                        disabled={busy || !loggedIn}
                        title="Удалить"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* если вкладка add скрыта (уже есть админы) — всё равно покажем список */}
          {tab === 'add' && !showAddTab && (
            <div className="rounded-lg bg-white/5 p-3">
              <div className="mb-2 font-medium">Администраторы</div>
              {!admins.length && <div className="text-sm opacity-70">Список пуст</div>}
              <ul className="space-y-2">
                {admins.map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded bg-white/5 px-3 py-2">
                    <div className="font-medium">{a.email || a.name || a.id}</div>
                    <div className="text-xs opacity-70">роль: {a.role}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
