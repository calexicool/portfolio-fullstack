import React from 'react'
import EditableImage from './EditableImage'
import EditableText from './EditableText'
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'

export default function ProjectsCarousel({ projects, strings, admin, onMutateProject, onAddProject, onRemoveLast, hoverLocalRef }){
  const listRef = React.useRef(null)
  const cardWRef = React.useRef(0)
  const L = projects.length

  const drag = React.useRef({ active:false, ignore:false, movedPx:0, startX:0, startLeft:0, suppressClick:false })
  const wheelState = React.useRef({ state:0, sign:0, timer:null })
  const anim = React.useRef({ active:false, timer:null })
  const MUTE_AFTER_DRAG_MS = 600

  const setHover = v => { if (hoverLocalRef) hoverLocalRef.current = v }
  const isHttp = (u)=>/^https?:\/\//i.test(u||'')

  const measure = React.useCallback(() => {
    const el=listRef.current; if(!el) return
    const first = el.querySelector('.carousel-item'); if(!first) return
    const w = first.getBoundingClientRect().width
    const gap = parseFloat(getComputedStyle(el).gap || '0') || 0
    cardWRef.current = w + gap
  }, [])

  const centerToMiddle = React.useCallback(() => {
    const el=listRef.current, cw=cardWRef.current; if(!el||!cw) return
    el.scrollLeft = cw * L
  }, [L])

  const keepLoop = React.useCallback(() => {
    if (anim.current.active) return
    const el=listRef.current, cw=cardWRef.current; if(!el||!cw) return
    const left=el.scrollLeft, span=cw*L
    if (left < span*0.5) el.scrollLeft = left + span
    else if (left > span*2.5) el.scrollLeft = left - span
  }, [L])

  const idxNear = React.useCallback(() => {
    const el=listRef.current, cw=cardWRef.current; return Math.round(el.scrollLeft / cw)
  }, [])

  const startSmoothTo = React.useCallback((leftTarget) => {
    const el=listRef.current; if(!el) return
    el.style.scrollSnapType = 'none'
    anim.current.active = true
    clearTimeout(anim.current.timer)
    el.scrollTo({ left: leftTarget, behavior: 'smooth' })
    anim.current.timer = setTimeout(() => {
      anim.current.active = false
      keepLoop()
      el.style.scrollSnapType = 'x mandatory'
    }, 320)
  }, [keepLoop])

  const snapToIndex = React.useCallback((i)=>{
    const el=listRef.current, cw=cardWRef.current; if(!el||!cw) return
    startSmoothTo(i * cw)
  }, [startSmoothTo])

  React.useEffect(()=>{
    const el=listRef.current; if(!el) return
    const st=document.createElement('style'); st.textContent=`
      .no-scrollbar{scrollbar-width:none;-ms-overflow-style:none}
      .no-scrollbar::-webkit-scrollbar{display:none}
      .grabbing{cursor:grabbing !important}
    `; document.head.appendChild(st)

    measure(); centerToMiddle()
    const ro = new ResizeObserver(()=>{ const i=idxNear(); measure(); el.scrollLeft = i*cardWRef.current; keepLoop() })
    ro.observe(el)

    const onScroll = ()=> keepLoop()
    el.addEventListener('scroll', onScroll, { passive:true })

    const onWheel = (e)=>{
      window.__MUTE_SECTIONS_UNTIL__ = Date.now() + 400
      e.preventDefault(); e.stopPropagation()
      const d = Math.abs(e.deltaY)>Math.abs(e.deltaX)?e.deltaY:e.deltaX
      const sign = Math.sign(d)||1
      const base = idxNear(), cw = cardWRef.current
      if (wheelState.current.state === 0){
        wheelState.current.state = 1; wheelState.current.sign = sign
        el.style.scrollSnapType = 'none'
        el.scrollTo({ left: base*cw + sign*0.2*cw, behavior: 'smooth' })
        clearTimeout(wheelState.current.timer)
        wheelState.current.timer = setTimeout(()=>{ snapToIndex(base + sign); wheelState.current.state=0 }, 160)
      } else {
        clearTimeout(wheelState.current.timer)
        snapToIndex(base + wheelState.current.sign)
        wheelState.current.state = 0
      }
    }
    el.addEventListener('wheel', onWheel, { passive:false })

    return ()=>{
      ro.disconnect()
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('wheel', onWheel)
      st.remove()
      clearTimeout(wheelState.current.timer)
      clearTimeout(anim.current.timer)
    }
  }, [L, measure, centerToMiddle, keepLoop, idxNear, snapToIndex])

  const onPointerDown = (e)=>{
    const el=listRef.current; if(!el) return
    const interactive = e.target.closest('a,button,input,textarea,select,[data-no-drag],[contenteditable="true"]')
    drag.current.ignore = !!interactive
    drag.current.active = !drag.current.ignore
    drag.current.movedPx = 0
    drag.current.suppressClick = false
    drag.current.startX = e.clientX
    drag.current.startLeft = el.scrollLeft
    if (!drag.current.ignore){
      window.__LOCAL_DRAG_ACTIVE__ = true
      window.__MUTE_SECTIONS_UNTIL__ = Date.now() + MUTE_AFTER_DRAG_MS
      el.setPointerCapture?.(e.pointerId)
      el.classList.add('grabbing')
      el.style.scrollSnapType = 'none'
    }
  }

  const onPointerMove = (e)=>{
    const el=listRef.current; if(!el || !drag.current.active) return
    const dx = drag.current.startX - e.clientX
    drag.current.movedPx = Math.max(drag.current.movedPx, Math.abs(dx))
    el.scrollLeft = drag.current.startLeft + dx
    if (drag.current.movedPx > 1){ e.preventDefault(); e.stopPropagation() }
  }

  const onPointerUp = (e)=>{
    const el=listRef.current; if(!el) return
    if (drag.current.active){
      el.releasePointerCapture?.(e.pointerId)
      el.classList.remove('grabbing')
      const cw = cardWRef.current
      const delta = drag.current.startX - e.clientX
      const base = idxNear()
      const passed = Math.abs(delta) >= 0.2*cw
      const dir = delta > 0 ? +1 : -1
      drag.current.suppressClick = drag.current.movedPx > 5
      if (passed) snapToIndex(base + dir)
      else snapToIndex(base)
    }
    window.__MUTE_SECTIONS_UNTIL__ = Date.now() + MUTE_AFTER_DRAG_MS
    window.__LOCAL_DRAG_ACTIVE__ = false
    drag.current.active = false
    drag.current.ignore = false
    drag.current.movedPx = 0
  }

  const onClickCapture = (e)=>{
    if (drag.current.suppressClick){ e.preventDefault(); e.stopPropagation(); drag.current.suppressClick=false }
  }

  return (
    <div className="relative" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>
      <div
        ref={listRef}
        className="local-scroll no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 cursor-grab"
        style={{ overscrollBehaviorX:'contain', touchAction:'pan-y', userSelect:'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
        onClickCapture={onClickCapture}
      >
        {[0,1,2].map(copy => (
          <React.Fragment key={copy}>
            {projects.map((p) => (
              <div key={`${copy}-${p.id}`} className="carousel-item snap-start shrink-0 basis-[80vw] md:basis-[60vw] lg:basis-[45vw]">
                <article className="group relative h-[70svh] overflow-hidden rounded-3xl border">
                  <EditableImage
                    src={p.cover}
                    alt={p.title}
                    admin={admin}
                    onChange={(v)=>onMutateProject(p.id,{cover:v})}
                    onMetaChange={(chg)=>onMutateProject(p.id,chg)}
                    onImageClick={()=>{ location.hash = `#project-${p.id}`; }}
                    fit={p.fit||'cover'}
                    height={p.h||Math.min(520, Math.max(240, Math.round(window.innerHeight*0.7)))}
                    widthPct={100}
                    className="absolute inset-0"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/95 via-white/40 to-transparent dark:from-neutral-950/95 dark:via-neutral-950/40"/>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-xl font-semibold">
                      <EditableText admin={admin} value={p.title} onChange={(v)=>onMutateProject(p.id,{title:v})}/>
                    </h3>
                    <p className="mt-2 opacity-80">
                      <EditableText admin={admin} value={p.summary} onChange={(v)=>onMutateProject(p.id,{summary:v})}/>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(p.tags||[]).map((t,i)=>(
                        <span key={i} className="group/tag relative rounded-full bg-neutral-900/10 px-2 py-1 text-xs dark:bg-white/10">
                          <EditableText admin={admin} value={t} onChange={(v)=>{ const next=[...(p.tags||[])]; next[i]=v; onMutateProject(p.id,{tags:next}); }}/>
                          {admin && (
                            <button type="button" onClick={()=>{ const next=[...(p.tags||[])]; next.splice(i,1); onMutateProject(p.id,{tags:next}); }}
                              className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white group-hover/tag:flex">×</button>
                          )}
                        </span>
                      ))}
                      {admin && (
                        <button type="button" onClick={()=>onMutateProject(p.id,{tags:[...(p.tags||[]),'Tag']})} className="rounded-full border px-2 py-1 text-xs opacity-70 hover:opacity-100">+ тег</button>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <a href={`#project-${p.id}`} className="inline-flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-sm shadow backdrop-blur transition hover:scale-105 dark:bg-neutral-900/80">
                        {strings.moreBtn} <ExternalLink className="h-4 w-4"/>
                      </a>
                      {isHttp(p.link) && (
                        <a href={p.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border bg-white/60 px-3 py-2 text-sm backdrop-blur dark:bg-neutral-900/60">
                          {strings.openBtn}
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      <div className="pointer-events-none absolute -left-2 -right-2 top-1/2 flex -translate-y-1/2 justify-between gap-2">
        <button type="button" onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); const cw = cardWRef.current || window.innerWidth*0.6; listRef.current?.scrollBy({left:-cw, behavior:'smooth'}); }}
                className="pointer-events-auto rounded-full bg-white/70 p-2 shadow backdrop-blur hover:scale-105 dark:bg-neutral-900/70"><ChevronLeft/></button>
        <button type="button" onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); const cw = cardWRef.current || window.innerWidth*0.6; listRef.current?.scrollBy({left:cw, behavior:'smooth'}); }}
                className="pointer-events-auto rounded-full bg-white/70 p-2 shadow backdrop-blur hover:scale-105 dark:bg-neutral-900/70"><ChevronRight/></button>
      </div>

      {admin && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-900/5 dark:hover:bg白/10" onClick={onAddProject}>+ Проект</button>
          <button className="rounded-xl border px-4 py-2 text-sm hover:bg-rose-500/10" onClick={onRemoveLast}>− Удалить последний</button>
        </div>
      )}
    </div>
  )
}
