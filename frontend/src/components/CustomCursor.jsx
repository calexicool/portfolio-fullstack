import React, { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export default function CustomCursor(){
  const fine = typeof window !== 'undefined' && window.matchMedia?.('(pointer:fine)')?.matches
  const x=useMotionValue(0), y=useMotionValue(0)
  const sx=useSpring(x,{stiffness:300,damping:25,mass:0.4})
  const sy=useSpring(y,{stiffness:300,damping:25,mass:0.4})
  const [hover,setHover]=useState(false)

  useEffect(()=>{
    if(!fine) return
    const mm=e=>{x.set(e.clientX); y.set(e.clientY)}
    const over=e=>{ if(e.target?.closest('a,button,[data-cursor=hover],input,textarea,select')) setHover(true); else setHover(false) }
    window.addEventListener('mousemove',mm)
    document.addEventListener('mouseover',over)
    const st=document.createElement('style'); st.textContent='@media (pointer:fine){ html,body,*{cursor:none!important} }'; document.head.appendChild(st)
    return ()=>{window.removeEventListener('mousemove',mm);document.removeEventListener('mouseover',over);st.remove()}
  },[fine])

  if(!fine) return null
  return (
    <>
      <motion.div style={{translateX:sx, translateY:sy}} className={(hover?'h-12 w-12 border-2 border-fuchsia-400/80':'h-6 w-6 border border-neutral-500/50') + ' pointer-events-none fixed left-0 top-0 z-[100] -translate-x-1/2 -translate-y-1/2 rounded-full transition-all'} />
      <motion.div style={{translateX:sx, translateY:sy}} className="pointer-events-none fixed left-0 top-0 z-[100] -translate-x-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-neutral-800 dark:bg-neutral-200"/>
    </>
  )
}
