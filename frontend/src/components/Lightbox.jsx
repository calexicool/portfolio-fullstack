import React, { useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Lightbox({ images, index, onClose, onPrev, onNext }){
  useEffect(()=>{
    window.__LIGHTBOX_OPEN__ = index>=0
    const onKey=(e)=>{
      if(index<0) return
      if(['Escape','ArrowLeft','ArrowRight'].includes(e.key)){ e.preventDefault(); e.stopImmediatePropagation(); }
      if(e.key==='Escape') onClose()
      if(e.key==='ArrowLeft') onPrev()
      if(e.key==='ArrowRight') onNext()
    }
    document.addEventListener('keydown', onKey, true)
    return ()=>{ document.removeEventListener('keydown', onKey, true); window.__LIGHTBOX_OPEN__ = false }
  },[index,onClose,onPrev,onNext])

  if(index<0) return null
  const src = images[index]?.src ?? images[index]
  return (
    <div className="fixed inset-0 z-50 grid bg-black/80 backdrop-blur" onClick={onClose}>
      <div className="m-auto max-h-[90svh] w-[min(95vw,1200px)]" onClick={(e)=>e.stopPropagation()}>
        <div className="relative rounded-2xl bg-black">
          <img src={src} alt="photo" className="max-h-[90svh] w-full rounded-2xl object-contain"/>
          <button type="button" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur hover:bg-white/30" onClick={onPrev}><ChevronLeft/></button>
          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur hover:bg-white/30" onClick={onNext}><ChevronRight/></button>
          <button type="button" className="absolute right-2 top-2 rounded-full bg-white/20 px-3 py-1 text-sm text-white backdrop-blur hover:bg-white/30" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  )
}
