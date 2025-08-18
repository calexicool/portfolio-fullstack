/* eslint-disable */
import React, { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { Sun, Moon, MessageSquare, Mail, Settings, Pencil, Instagram } from "lucide-react";
import CustomCursor from "./components/CustomCursor";
import Background3D from "./components/Background3D";
import EditableText from "./components/EditableText";
import EditableImage from "./components/EditableImage";
import Lightbox from "./components/Lightbox";
const Comments = React.lazy(() => import("./components/Comments"));
import ProjectsCarousel from "./components/ProjectsCarousel";
import useInfiniteSections from "./hooks/useInfiniteSections";
import { getContent, saveContent, getMe } from "./api/client";
import CMSPanel from "./components/CMSPanel";
import { EditModeProvider, useEditMode } from "./store/editMode";

/** Телеграм-иконка (брендовой в lucide нет) */
function TelegramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
      <path d="M9.18 15.3 9.36 19c.33 0 .47-.15.64-.34l1.53-1.47 3.18 2.34c.58.32 1 .15 1.15-.54l2.09-9.85c.19-.86-.33-1.26-.88-1.04L4.38 11.4c-.84.33-.83.79-.15.99l3.58 1.12 8.32-5.25c.39-.24.75-.11.45.13l-7.4 6.9z" fill="currentColor"/>
    </svg>
  );
}

const DEFAULT = {
  site: { name: "Mikhail Myatishkin", role: "Business Analyst / Product" },
  socials: {
    email: "calexicool@ya.ru",
    instagram: "https://instagram.com/forevercalex",
    telegram: "https://t.me/plucarism",
  },
  strings: {
    heroProjectsBtn: "Проекты",
    heroWriteBtn: "Написать",
    heroScrollHint: "Колесо/тачпад — плавный скролл →",
    heroCommentsHint: "Комментарии в конце",
    projectsTitle: "Проекты",
    photosTitle: "Фото",
    commentsTitle: "Комментарии",
    moreBtn: "Подробнее",
    openBtn: "Открыть",
  },
  hero: {
    title: "Привет! Я BA с фокусом на пользовательских сценариях",
    subtitle: "Здесь — мои проекты и заметки.",
  },
  about: {
    title: "Обо мне",
    text: "Работаю с требованиями, BPMN/UML, историями и прототипами.",
    skills: ["BPMN/UML", "User Stories", "Backlog", "Wireframing", "CJM", "SQL", "Figma"],
    photo:
      "https://images.unsplash.com/photo-1513245543132-31f507417b26?q=80&w=1200&auto=format&fit=crop",
  },
  projects: [],
  photos: ["https://images.unsplash.com/photo-1513245543132-31f507417b26?q=80&w=1200&auto=format&fit=crop"],
};

function Section({ id, children }) {
  return (
    <section
      id={id}
      className="w-screen shrink-0 p-6 md:p-10 lg:p-14 xl:p-20"
      style={{ height: "100svh" }}
    >
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  );
}

function TopBar({ c, isAdmin, setTheme, theme, onOpenCMS }) {
  const { editMode, setEditMode } = useEditMode();
  return (
    <div className="fixed left-0 right-0 top-4 z-40 flex items-center justify-between px-6 md:px-10">
      <div className="flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-2 shadow backdrop-blur dark:bg-neutral-900/90">
        <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
        <span className="font-semibold">
          <EditableText
            admin={isAdmin && editMode}
            value={c?.site?.name ?? ""}
            onChange={(v) => onOpenCMS("save", { path: ["site", "name"], value: v })}
          />
        </span>
        <span className="hidden text-sm opacity-80 sm:inline">
          <EditableText
            admin={isAdmin && editMode}
            value={c?.site?.role ?? ""}
            onChange={(v) => onOpenCMS("save", { path: ["site", "role"], value: v })}
          />
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Соцсети — вернул */}
        {c?.socials?.instagram && (
          <a
            href={c.socials.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-white/90 p-2 shadow backdrop-blur hover:scale-105 dark:bg-neutral-900/90"
            aria-label="Instagram"
            data-cursor="hover"
          >
            <Instagram className="h-5 w-5" />
          </a>
        )}
        {c?.socials?.telegram && (
          <a
            href={c.socials.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-white/90 p-2 shadow backdrop-blur hover:scale-105 dark:bg-neutral-900/90"
            aria-label="Telegram"
            data-cursor="hover"
          >
            <TelegramIcon />
          </a>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={() => setEditMode(!editMode)}
            className={
              "flex items-center gap-2 rounded-xl px-3 py-2 shadow backdrop-blur " +
              (editMode ? "bg-emerald-500 text-white" : "bg-white/90 dark:bg-neutral-900/90")
            }
            title="Режим редактирования"
          >
            <Pencil className="h-4 w-4" />
            <span className="text-sm">{editMode ? "Редактирование" : "Просмотр"}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-xl bg-white/90 p-2 shadow backdrop-blur hover:scale-105 dark:bg-neutral-900/90"
          aria-label="Theme"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={() => onOpenCMS("open")}
          className="rounded-xl bg-white/90 p-2 shadow backdrop-blur hover:scale-105 dark:bg-neutral-900/90"
          title="CMS"
          aria-label="CMS"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function AppInner() {
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    const html = document.documentElement;
    theme === "dark" ? html.classList.add("dark") : html.classList.remove("dark");
  }, [theme]);

  const [user, setUser] = useState(null);
  const refreshAuth = async () => {
    try {
      const me = await getMe();
      setUser(me);
    } catch {}
  };
  useEffect(() => {
    refreshAuth();
  }, []);
  const roleToEdit = new Set(["owner", "admin", "editor"]);
  const isAdmin = Boolean(user && (user.isAdmin === true || roleToEdit.has(user.role)));

  const [content, setContent] = useState(DEFAULT);
  useEffect(() => {
    (async () => {
      try {
        const c = await getContent();
        if (c && typeof c === "object") setContent({ ...DEFAULT, ...c });
      } catch {
        setContent(DEFAULT);
      }
    })();
  }, []);
  const c = useMemo(() => ({ ...DEFAULT, ...(content || {}) }), [content]);

  const persistByPath = async (path, value) => {
    const next = structuredClone(c);
    let p = next;
    for (let i = 0; i < path.length - 1; i++) p = p[path[i]] ?? (p[path[i]] = {});
    p[path[path.length - 1]] = value;
    setContent(next);
    try {
      await saveContent(next); // бэкенд у тебя уже есть — ок
    } catch (e) {
      console.error(e);
    }
  };

  const [cmsOpen, setCmsOpen] = useState(false);
  const handleCMS = (cmd, payload) => {
    if (cmd === "open") setCmsOpen(true);
    if (cmd === "save") persistByPath(payload.path, payload.value);
  };

  const { editMode } = useEditMode();
  const canEdit = isAdmin && editMode;

  const scrollerRef = useRef(null), progressRef = useRef(0);
  const [pUI, setPUI] = useState(0);
  const [idx, setIdx] = useState(0);
  const hoverLocalRef = useRef(false);

  // --- Секции ---
  const sections = [
    <Section id="home" key="home">
      <div className="grid h-full grid-rows-[1fr_auto] gap-10">
        <div className="grid content-center gap-6">
          <h1
            className="relative z-10 text-3xl font-extrabold md:text-5xl text-white"
            style={{ textShadow: "0 6px 24px rgba(0,0,0,.7), 0 0 2px rgba(0,0,0,.9)" }}
          >
            <EditableText
              admin={canEdit}
              as="h1"
              value={c?.hero?.title ?? ""}
              onChange={(v) => persistByPath(["hero", "title"], v)}
            />
          </h1>
          <p
            className="max-w-2xl text-lg text-white/95"
            style={{ textShadow: "0 4px 18px rgba(0,0,0,.6)" }}
          >
            <EditableText
              admin={canEdit}
              value={c?.hero?.subtitle ?? ""}
              onChange={(v) => persistByPath(["hero", "subtitle"], v)}
            />
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => scrollToIndex(2)}
              className="rounded-2xl bg-white px-5 py-3 text-neutral-900 shadow hover:opacity-90"
            >
              <EditableText
                admin={canEdit}
                value={c?.strings?.heroProjectsBtn ?? "Проекты"}
                onChange={(v) => persistByPath(["strings", "heroProjectsBtn"], v)}
              />
            </button>
            <a
              href={`mailto:${c?.socials?.email ?? ""}`}
              className="rounded-2xl border px-5 py-3 shadow hover:bg-neutral-900/5 dark:hover:bg-white/10"
              data-cursor="hover"
            >
              <Mail className="mr-2 inline h-4 w-4" />
              <EditableText
                admin={canEdit}
                value={c?.strings?.heroWriteBtn ?? "Написать"}
                onChange={(v) => persistByPath(["strings", "heroWriteBtn"], v)}
              />
            </a>
          </div>
        </div>
        <div
          className="flex items-center justify-between text-sm text-white/90"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,.6)" }}
        >
          <div className="flex items-center gap-2">
            <EditableText
              admin={canEdit}
              value={c?.strings?.heroScrollHint ?? ""}
              onChange={(v) => persistByPath(["strings", "heroScrollHint"], v)}
            />
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <EditableText
              admin={canEdit}
              value={c?.strings?.heroCommentsHint ?? ""}
              onChange={(v) => persistByPath(["strings", "heroCommentsHint"], v)}
            />
          </div>
        </div>
      </div>
    </Section>,

    <Section id="about" key="about">
      <div className="grid h-full grid-rows-[auto_1fr] gap-8">
        <h2 className="text-2xl font-semibold md:text-4xl">
          <EditableText
            admin={canEdit}
            value={c?.about?.title ?? ""}
            onChange={(v) => persistByPath(["about", "title"], v)}
          />
        </h2>
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="relative w-full">
            <EditableImage
              admin={canEdit}
              src={c?.about?.photo ?? ""}
              alt="Моё фото"
              onImageClick={() => {}}
              onChange={(v) => persistByPath(["about", "photo"], v)}
              fit="cover"
              height={320}
              className="w-full"
            />
          </div>
          <div>
            <EditableText
              admin={canEdit}
              as="p"
              className="text-lg leading-relaxed opacity-90"
              value={c?.about?.text ?? ""}
              onChange={(v) => persistByPath(["about", "text"], v)}
            />
            <div className="mt-6 flex flex-wrap gap-2">
              {(c?.about?.skills ?? []).map((s, i) => (
                <span
                  key={i}
                  className="group relative inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
                >
                  <EditableText
                    value={s}
                    admin={canEdit}
                    onChange={(v) => {
                      const next = [...(c.about?.skills ?? [])];
                      next[i] = v;
                      persistByPath(["about", "skills"], next);
                    }}
                  />
                  {canEdit && (
                    <button
                      type="button"
                      className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white group-hover:flex"
                      onClick={() => {
                        const next = [...(c.about?.skills ?? [])];
                        next.splice(i, 1);
                        persistByPath(["about", "skills"], next);
                      }}
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
              {canEdit && (
                <button
                  type="button"
                  className="rounded-full border px-3 py-1 text-sm opacity-70 hover:opacity-100"
                  onClick={() => {
                    const next = [...(c.about?.skills ?? []), "Новый тег"];
                    persistByPath(["about", "skills"], next);
                  }}
                >
                  + тег
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Section>,

    <Section id="projects" key="projects">
      <div className="grid h-full grid-rows-[auto_1fr] gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold md:text-4xl">
            <EditableText
              admin={canEdit}
              value={c?.strings?.projectsTitle ?? "Проекты"}
              onChange={(v) => persistByPath(["strings", "projectsTitle"], v)}
            />
          </h2>
        </div>
        <ProjectsCarousel
          projects={c?.projects ?? []}
          strings={c?.strings ?? {}}
          admin={canEdit}
          onMutateProject={(id, patch) => {
            const next = {
              ...c,
              projects: (c.projects ?? []).map((x) => (x.id === id ? { ...x, ...patch } : x)),
            };
            setContent(next);
            saveContent(next).catch(console.error);
          }}
          onAddProject={() => {
            const next = {
              ...c,
              projects: [
                ...(c.projects ?? []),
                {
                  id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
                  title: "Новый проект",
                  summary: "Описание",
                  tags: ["Tag"],
                  cover: c.photos?.[0]?.src || "",
                  link: "",
                  content: "Текст",
                },
              ],
            };
            setContent(next);
            saveContent(next).catch(console.error);
          }}
          onRemoveLast={() => {
            const next = { ...c, projects: (c.projects ?? []).slice(0, -1) };
            setContent(next);
            saveContent(next).catch(console.error);
          }}
          hoverLocalRef={hoverLocalRef}
        />
      </div>
    </Section>,

    <Section id="photos" key="photos">
      <div className="grid h-full grid-rows-[auto_1fr] gap-6">
        <h2 className="text-2xl font-semibold md:text-4xl">
          <EditableText
            admin={canEdit}
            value={c?.strings?.photosTitle ?? "Фото"}
            onChange={(v) => persistByPath(["strings", "photosTitle"], v)}
          />
        </h2>
        <div
          className="columns-2 gap-4 md:columns-3 lg:columns-4"
          onMouseEnter={() => {
            hoverLocalRef.current = true;
          }}
          onMouseLeave={() => {
            hoverLocalRef.current = false;
          }}
        >
          {(c?.photos ?? []).map((p, i) => {
            const photo =
              typeof p === "string"
                ? { src: p, fit: "cover", h: 240, w: 100 }
                : { fit: "cover", h: 240, w: 100, ...p };
            return (
              <div key={i} className="relative mb-4 w-full break-inside-avoid">
                <EditableImage
                  admin={canEdit}
                  src={photo.src}
                  alt={"Фото " + (i + 1)}
                  onImageClick={() => setLbIdx(i)}
                  onChange={(v) => {
                    const photos = [...(c.photos ?? [])];
                    photos[i] = { ...photo, src: v };
                    persistByPath(["photos"], photos);
                  }}
                  fit={photo.fit}
                  height={photo.h}
                  widthPct={photo.w}
                  onMetaChange={(chg) => {
                    const photos = [...(c.photos ?? [])];
                    photos[i] = { ...photo, ...chg };
                    persistByPath(["photos"], photos);
                  }}
                />
              </div>
            );
          })}
        </div>
        {canEdit && (
          <div className="mt-2 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-900/5 dark:hover:bg-white/10"
              onClick={() => {
                const photos = [...(c.photos ?? []), { src: "", fit: "cover", h: 240, w: 100 }];
                persistByPath(["photos"], photos);
              }}
            >
              + Добавить фото
            </button>
            <button
              type="button"
              className="rounded-xl border px-4 py-2 text-sm hover:bg-rose-500/10"
              onClick={() => {
                const photos = [...(c.photos ?? [])].slice(0, -1);
                persistByPath(["photos"], photos);
              }}
            >
              − Удалить последнее
            </button>
          </div>
        )}
      </div>
    </Section>,

    <Section id="comments" key="comments">
      <h2 className="mb-4 text-2xl font-semibold md:text-4xl">
        {c?.strings?.commentsTitle ?? "Комментарии"}
      </h2>
      <Suspense fallback={<div style={{ opacity: 0.7 }}>Комментарии загружаются…</div>}>
        <Comments admin={isAdmin} />
      </Suspense>
    </Section>,
  ];

  const sectionsCount = sections.length;
  const renderTripled = (copyIndex) =>
    sections.map((s, i) => React.cloneElement(s, { key: `${copyIndex}-${i}` }));

  // Подключаем «кольцо» + мягкую докрутку
  const { scrollToIndex, scrollToProgress } = useInfiniteSections(scrollerRef, progressRef, {
    onIndex: setIdx,
    onProgress: setPUI,
    sectionsCount,           // число реальных секций
    hoverLocalRef,
    loop: true,              // кольцо
    loopClones: sectionsCount, // слева и справа по набору клонов (мы рендерим три комплекта)
    snapThreshold: 0.04,     // ~4% порог для докрутки
    intentPx: 4,             // легче переходить вперёд/назад
    snapIdleMs: 90,          // быстрее срабатывает после остановки
  });

  const [lbIdx, setLbIdx] = useState(-1);
  const closeLB = () => setLbIdx(-1);
  const prevLB = () => setLbIdx((i) => (i > 0 ? i - 1 : (c.photos || []).length - 1));
  const nextLB = () => setLbIdx((i) => (i + 1) % (c.photos || []).length);

  return (
    <>
      <style>{`#scroller{scrollbar-width:none;-ms-overflow-style:none}#scroller::-webkit-scrollbar{display:none}`}</style>
      <Background3D progressRef={progressRef} />
      <CustomCursor />

      <TopBar c={c} isAdmin={isAdmin} setTheme={setTheme} theme={theme} onOpenCMS={handleCMS} />

      <div
        id="scroller"
        ref={scrollerRef}
        className="flex overflow-x-auto overflow-y-hidden"
        style={{
          height: "100svh",
          scrollSnapType: "none",
          overscrollBehaviorX: "contain", // чтобы страница снаружи не перехватывала
        }}
      >
        <div className="flex">
          {/* ЛЕВЫЕ клоны */}
          {renderTripled("a")}
          {/* РЕАЛЬНЫЕ */}
          {renderTripled("b")}
          {/* ПРАВЫЕ клоны */}
          {renderTripled("c")}
        </div>
      </div>

      {/* ползунок прогресса */}
      <div className="fixed bottom-4 left-1/2 z-30 w-[min(90vw,700px)] -translate-x-1/2">
        <input
          type="range"
          min="0"
          max="1"
          step="0.002"
          value={pUI}
          onInput={(e) => scrollToProgress(Number(e.currentTarget.value))}
          onChange={(e) => scrollToProgress(Number(e.currentTarget.value))}
          className="w-full appearance-none bg-transparent"
        />
        <style>{`
          input[type=range]{height:24px}
          input[type=range]::-webkit-slider-runnable-track{height:4px;background:rgba(255,255,255,0.7);border-radius:9999px;box-shadow:0 0 0 1px rgba(0,0,0,0.05)}
          .dark input[type=range]::-webkit-slider-runnable-track{background:rgba(23,23,23,0.7)}
          input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;height:18px;width:18px;margin-top:-7px;border-radius:9999px;background:white;box-shadow:0 4px 12px rgba(0,0,0,0.15)}
          .dark input[type=range]::-webkit-slider-thumb{background:#171717;box-shadow:0 4px 12px rgba(0,0,0,0.35)}
          input[type=range]::-moz-range-track{height:4px;background:rgba(255,255,255,0.7);border-radius:9999px}
          .dark input[type=range]::-moz-range-track{background:rgba(23,23,23,0.7)}
          input[type=range]::-moz-range-thumb{height:18px;width:18px;border:none;border-radius:9999px;background:white}
          .dark input[type=range]::-moz-range-thumb{background:#171717}
        `}</style>
      </div>

      <CMSPanel
        open={cmsOpen}
        onClose={() => setCmsOpen(false)}
        onLoggedIn={refreshAuth} // ← важно, чтобы появился карандаш
        user={user}
        setUser={setUser}
      />

      <Lightbox images={c?.photos ?? []} index={lbIdx} onClose={closeLB} onPrev={prevLB} onNext={nextLB} />
    </>
  );
}

export default function App() {
  return (
    <EditModeProvider>
      <AppInner />
    </EditModeProvider>
  );
}
