// frontend/src/hooks/useInfiniteSections.js
import { useEffect, useRef } from "react";

export default function useInfiniteSections(
  scrollerRef,
  progressRef,
  { onIndex, onProgress, sectionsCount, hoverLocalRef }
) {
  const ticking = useRef(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const total = el.scrollWidth - el.clientWidth;
    const update = () => {
      if (!el) return;
      const p = total > 0 ? el.scrollLeft / total : 0;
      progressRef.current = p;
      onProgress?.(p);
      const idx = Math.round(p * (sectionsCount - 1));
      onIndex?.(idx);
    };
    update();

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        ticking.current = false;
        update();
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el && el.removeEventListener("scroll", onScroll);
  }, [scrollerRef, progressRef, onProgress, onIndex, sectionsCount]);

  const scrollToProgress = (p) => {
    const el = scrollerRef.current;
    if (!el) return;
    const total = el.scrollWidth - el.clientWidth;
    el.scrollTo({ left: total * p, behavior: "smooth" });
  };

  const scrollToIndex = (i) => {
    const el = scrollerRef.current;
    if (!el) return;
    const total = el.scrollWidth - el.clientWidth;
    const p = sectionsCount > 1 ? i / (sectionsCount - 1) : 0;
    el.scrollTo({ left: total * p, behavior: "smooth" });
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onWheel = (e) => {
      if (hoverLocalRef?.current) return; // локальный скролл внутри виджетов
      e.preventDefault();
      el.scrollBy({ left: e.deltaY || e.deltaX, behavior: "smooth" });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el && el.removeEventListener("wheel", onWheel);
  }, [scrollerRef, hoverLocalRef]);

  return { scrollToIndex, scrollToProgress };
}
