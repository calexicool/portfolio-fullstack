import React, { useState } from 'react'
import { X, Save, Settings } from 'lucide-react'
import { initAdmin, login, logout, saveContent } from '../api/client'

export default function CMSPanel({ open, onClose, isAdmin, content, setContent, refreshAuth }){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [invite,setInvite] = useState('')
  const [msg,setMsg] = useState('')
  if(!open) return null
  return (
    <div className="fixed inset-0 z-50 grid bg-black/40 p-4 backdrop-blur">
      <div className="relative m-auto w-[min(100%,900px)] rounded-3xl border bg-white p-6 shadow-xl dark:bg-neutral-950">
        <button type="button" onClick={onClose} className="absolute right-3 top-3 rounded-full p-2 hover:bg-neutral-900/5 dark:hover:bg-white/10"><X/></button>
        <div className="mb-4 flex items-center gap-2 text-xl font-semibold"><Settings className="h-5 w-5"/> CMS</div>
        {!isAdmin ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border p-4">
              <div className="font-medium mb-2">Первичная инициализация</div>
              <input value={invite} onChange={e=>setInvite(e.target.value)} placeholder="ADMIN_INVITE_CODE" className="mb-2 w-full rounded-xl border bg-white px-4 py-3 dark:bg-neutral-900"/>
              <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="mb-2 w-full rounded-xl border bg-white px-4 py-3 dark:bg-neutral-900"/>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Пароль" className="w-full rounded-xl border bg-white px-4 py-3 dark:bg-neutral-900"/>
              <button type="button" className="mt-3 rounded-xl bg-neutral-900 px-4 py-2 text-white dark:bg-white dark:text-neutral-900" onClick={async()=>{
                const r = await initAdmin(invite, email, password); setMsg(r.ok?'Админ создан':'Ошибка: '+(r.error||'unknown')); refreshAuth();
              }}><Save className="mr-2 inline h-4 w-4"/>Создать</button>
            </div>
            <div className="rounded-2xl border p-4">
              <div className="font-medium mb-2">Вход</div>
              <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="mb-2 w-full rounded-xl border bg-white px-4 py-3 dark:bg-neutral-900"/>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Пароль" className="w-full rounded-xl border bg-white px-4 py-3 dark:bg-neutral-900"/>
              <button type="button" className="mt-3 rounded-xl bg-neutral-900 px-4 py-2 text-white dark:bg-white dark:text-neutral-900" onClick={async()=>{
                const r=await login(email,password); setMsg(r.ok?'Готово':'Ошибка: '+(r.error||'unknown')); refreshAuth();
              }}>Войти</button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 rounded-2xl border p-4">
              <div className="font-medium">Контент</div>
              <button type="button" className="rounded-xl bg-neutral-900 px-4 py-2 text-white dark:bg-white dark:text-neutral-900" onClick={async()=>{
                const r=await saveContent(content); setMsg(r.ok?'Сохранено':'Ошибка'); 
              }}><Save className="mr-2 inline h-4 w-4"/>Сохранить на сервер</button>
            </div>
            <div className="space-y-3 rounded-2xl border p-4">
              <div className="font-medium">Сессия</div>
              <button type="button" onClick={async()=>{ await logout(); refreshAuth(); }} className="rounded-xl border px-4 py-2">Выйти</button>
            </div>
          </div>
        )}
        {msg && <div className="mt-3 text-sm opacity-80">{msg}</div>}
      </div>
    </div>
  )
}
