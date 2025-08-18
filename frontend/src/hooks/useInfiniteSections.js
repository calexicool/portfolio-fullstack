// frontend/src/hooks/useInfiniteSections.js
import { useEffect, useRef } from "react";

export default function useInfiniteSections(
  scrollerRef,
  progressRef,
  {
    onIndex,
    onProgress,
    sectionsCount,
    hoverLocalRef,
    snap = true,
    snapThreshold = 0.04, // порог ~4%
    snapIdleMs = 100,     // пауза перед докруткой
    intentPx = 4,         // «намерение» пользователя
    loop = true,          // включаем кольцо
    loopClones = 1        // число комплектов клонов слева/справа (у тебя их целый набор)
  }
) {
  const ticking = useRef(false);
  const snapping = useRef(false);
  const teleporting = useRef(false);
  const lastDir = useRef(0);
  const lastWheelTs = useRef(0);
  const moveAccPx = useRef(0);

  const sectionW = () => scrollerRef.current?.clientWidth ?? 0;
  const SNAP_MS = 360;

  // границы «реального» диапазона с учётом клонов
  const getLoopBounds = (w) => {
    if (!loop) return { start: 0, end: sectionsCount * w };
    const start = loopClones * w;
    const end = (loopClones + sectionsCount) * w;
    return { start, end };
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    // старт в середину (первый реальный слайд)
    const init = () => {
      const w = sectionW();
      if (loop && w > 0) el.scrollLeft = loopClones * w;
      update();
    };

    const update = () => {
      if (!el) return;
      const w = sectionW();
      const { start } = getLoopBounds(w);

      // позиция в «индексах» относительно реального диапазона
      const x = w ? (el.scrollLeft - start) / w : 0;
      const xNorm =
        sectionsCount > 0 ? ((x % sectionsCount) + sectionsCount) % sectionsCount : 0;

      // прогресс 0..1 через реальные секции
      const px = sectionsCount > 1 ? xNorm / (sectionsCount - 1) : 0;
      progressRef.current = Math.max(0, Math.min(1, px));
      onProgress?.(progressRef.current);

      const idx =
        sectionsCount > 1 ? Math.round(xNorm) : 0;
      onIndex?.(Math.max(0, Math.min(sectionsCount - 1, idx)));
    };

    // направленный снэп + плавная «переброска» через границы
    const doSnap = () => {
      if (!snap || snapping.current || teleporting.current) return;
      const now = Date.now();
      if (now - lastWheelTs.current < snapIdleMs) return;

      const w = sectionW();
      if (!w) return;

      const { start, end } = getLoopBounds(w);
      const rel = (el.scrollLeft - start) / w; // позиция в секциях
      const i = Math.floor(rel);
      const f = rel - i;

      // кандидат целевого индекса (может выйти за границы на ±1 — это ок для loop)
      let cand = i;
      if (moveAccPx.current >= intentPx) {
        cand = lastDir.current > 0 ? i + 1 : i - 1;
      } else {
        cand = f >= 0.5 ? i + 1 : i;
      }

      // ——— LOOP WRAP (вперёд): последняя -> клон первой справа -> телепорт в настоящую первую
      if (loop && cand === sectionsCount) {
        const leftCloneFirst = start + sectionsCount * w; // первая секция справа (клон)
        const mirrorFirst = start + 0;                    // настоящая первая
        snapping.current = true;
        el.scrollTo({ left: leftCloneFirst, behavior: "smooth" });
        moveAccPx.current = 0;
        setTimeout(() => {
          teleporting.current = true;
          el.scrollLeft = mirrorFirst; // тихий прыжок
          teleporting.current = false;
          snapping.current = false;
          update();
        }, SNAP_MS);
        return;
      }

      // ——— LOOP WRAP (назад): первая -> клон последней слева -> телепорт в настоящую последнюю
      if (loop && cand === -1) {
        const leftCloneLast = start - 1 * w;             // последняя секция слева (клон)
        const mirrorLast = start + (sectionsCount - 1) * w; // настоящая последняя
        snapping.current = true;
        el.scrollTo({ left: leftCloneLast, behavior: "smooth" });
        moveAccPx.current = 0;
        setTimeout(() => {
          teleporting.current = true;
          el.scrollLeft = mirrorLast;
          teleporting.current = false;
          snapping.current = false;
          update();
        }, SNAP_MS);
        return;
      }

      // обычный снэп внутри реального диапазона
      let target = Math.max(0, Math.min(sectionsCount - 1, cand));

      // «подталкивание» вперёд/назад около порога, чтобы не отбрасывало
      if (lastDir.current > 0 && f > 0 && f < snapThreshold) target = i + 1;
      if (lastDir.current < 0 && f > 1 - snapThreshold && f < 1) target = i;

      const left = start + target * w;
      snapping.current = true;
      el.scrollTo({ left, behavior: "smooth" });
      moveAccPx.current = 0;
      setTimeout(() => (snapping.current = false), SNAP_MS);
    };

    const onScroll = () => {
      // авто-телепорт при ручном длинном проскролле (но не мешаем, если идёт наш снэп)
      if (loop && !snapping.current) {
        const w = sectionW();
        if (w) {
          const { start, end } = getLoopBounds(w);
          const buffer = w * 0.5;
          if (el.scrollLeft <= start - buffer) {
            teleporting.current = true;
            el.scrollLeft += sectionsCount * w; // прыжок вправо
            teleporting.current = false;
          } else if (el.scrollLeft >= end + buffer) {
            teleporting.current = true;
            el.scrollLeft -= sectionsCount * w; // прыжок влево
            teleporting.current = false;
          }
        }
      }

      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        ticking.current = false;
        update();
        // таймер «конца скролла» для доскролла
        setTimeout(doSnap, snapIdleMs);
      });
    };

    const ro = new ResizeObserver(() => {
      const w = sectionW();
      if (!w) return;
      update();
      if (!snapping.current) {
        const { start } = getLoopBounds(w);
        const target = Math.round((el.scrollLeft - start) / w);
        snapping.current = true;
        el.scrollTo({ left: start + target * w, behavior: "smooth" });
        setTimeout(() => (snapping.current = false), 260);
      }
    });

    init();
    ro.observe(el);
    el.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", onScroll);
    };
  }, [
    scrollerRef,
    progressRef,
    onProgress,
    onIndex,
    sectionsCount,
    snap,
    snapThreshold,
    snapIdleMs,
    intentPx,
    loop,
    loopClones
  ]);

  const scrollToProgress = (p) => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = sectionW();
    const { start } = getLoopBounds(w);
    const target = (sectionsCount - 1) * p;
    snapping.current = true;
    el.scrollTo({ left: start + target * w, behavior: "smooth" });
    setTimeout(() => (snapping.current = false), SNAP_MS);
  };

  const scrollToIndex = (i) => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = sectionW();
    const { start } = getLoopBounds(w);
    const idx = Math.max(0, Math.min(sectionsCount - 1, i));
    snapping.current = true;
    el.scrollTo({ left: start + idx * w, behavior: "smooth" });
    setTimeout(() => (snapping.current = false), SNAP_MS);
  };

  // wheel: горизонтальный скролл с инерцией и фиксацией направления/намерения
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const LINE = 32;
    const onWheel = (e) => {
      if (hoverLocalRef?.current) return;
      if (el.scrollWidth <= el.clientWidth) return;

      let raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!raw) return;

      if (e.deltaMode === 1) raw *= LINE;
      else if (e.deltaMode === 2) raw *= el.clientHeight;

      e.preventDefault();
      lastDir.current = Math.sign(raw) || lastDir.current;
      lastWheelTs.current = Date.now();
      moveAccPx.current += Math.abs(raw);

      el.scrollLeft += raw;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [scrollerRef, hoverLocalRef]);

  return { scrollToIndex, scrollToProgress };
}
