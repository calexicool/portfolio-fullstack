import { useEffect, useRef } from 'react'
export default function useInfiniteSections(scrollerRef, progressRef, { onIndex, onProgress, sectionsCount, hoverLocalRef }){
  const LERP = 0.05, SHIFT_RATIO = 0.22, PRE_DELAY = 320
  const target = useRef(0), current = useRef(0), rafId = useRef(null), lastIdx = useRef(-1)
  const phase = useRef({ state:0, sign:0, timer:null })
  const step = ()=>{
    const el = scrollerRef.current; if(!el) return
    current.current += (target.current - current.current) * LERP; el.scrollLeft = current.current
    const w = el.clientWidth, left = current.current
    const min=w*(sectionsCount*0.5), max=w*(sectionsCount*2.5)
    if (left < min){ current.current += w*sectionsCount; target.current += w*sectionsCount; el.scrollLeft = current.current }
    if (left > max){ current.current -= w*sectionsCount; target.current -= w*sectionsCount; el.scrollLeft = current.current }
    const logical = (current.current / w) % sectionsCount
    const idx = Math.round((logical + sectionsCount) % sectionsCount)
    if (idx !== lastIdx.current){ lastIdx.current = idx; onIndex?.(idx) }
    const p = ((logical % sectionsCount)+sectionsCount)%sectionsCount / sectionsCount
    progressRef.current = p; onProgress?.(p)
    if (phase.current.state===2 && Math.abs(target.current - current.current) < 0.5) phase.current.state = 0
    rafId.current = requestAnimationFrame(step)
  }
  useEffect(()=>{
    const el=scrollerRef.current; if(!el) return
    const w=el.clientWidth; current.current = target.current = el.scrollLeft = w * sectionsCount
    rafId.current = requestAnimationFrame(step)
    const onWheel=(e)=>{
      const path = e.composedPath?.() || []; if (path.some(n=>n?.classList?.contains?.('local-scroll'))) return
      if (window.__MUTE_SECTIONS_UNTIL__ && Date.now() < window.__MUTE_SECTIONS_UNTIL__) { e.preventDefault(); e.stopPropagation(); return }
      e.preventDefault(); e.stopPropagation()
      const dRaw = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX; if (!dRaw) return
      const sign = Math.sign(dRaw); const w=el.clientWidth; const baseIdx = Math.round(current.current / w)
      if (phase.current.state === 0){ phase.current.state=1; phase.current.sign=sign; target.current = baseIdx*w + sign*SHIFT_RATIO*w;
        clearTimeout(phase.current.timer); phase.current.timer = setTimeout(()=>{ phase.current.state=2; target.current=(baseIdx+sign)*w }, PRE_DELAY) }
      else if (phase.current.state === 1){ clearTimeout(phase.current.timer); phase.current.state=2; target.current=(baseIdx+phase.current.sign)*w }
    }
    const onKey=(e)=>{
      if (window.__LIGHTBOX_OPEN__) return; if (hoverLocalRef?.current) return
      const w=el.clientWidth; const baseIdx=Math.round(current.current/w)
      if (e.key==='ArrowRight'){ e.preventDefault(); phase.current.state=2; target.current=(baseIdx+1)*w }
      if (e.key==='ArrowLeft'){  e.preventDefault(); phase.current.state=2; target.current=(baseIdx-1)*w }
    }
    const onResize=()=>{ const w=el.clientWidth; current.current = target.current = el.scrollLeft = w * sectionsCount }
    el.addEventListener('wheel', onWheel, { passive:false }); document.addEventListener('keydown', onKey); window.addEventListener('resize', onResize)
    return ()=>{ el.removeEventListener('wheel', onWheel); document.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize); cancelAnimationFrame(rafId.current); clearTimeout(phase.current.timer) }
  },[])
  const scrollToIndex=(want)=>{ const el=scrollerRef.current; if(!el) return; const w=el.clientWidth; const cur=current.current/w; const c=[want,want+sectionsCount,want+sectionsCount*2]; let best=c[0],d=Infinity; for(const x of c){const dist=Math.abs(x-cur); if(dist<d){d=dist; best=x}} phase.current.state=2; target.current=best*w }
  const scrollToProgress=(p)=>{ const el=scrollerRef.current; if(!el) return; const w=el.clientWidth; const base=Math.floor(current.current/w/sectionsCount)*sectionsCount+sectionsCount; phase.current.state=2; target.current=(base+p*sectionsCount)*w }
  const smoothBy=(dx)=>{ phase.current.state=2; target.current+=dx }
  return { scrollToIndex, scrollToProgress, smoothBy }
}
