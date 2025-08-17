/* eslint-disable */
import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { Sun, Moon, Mail, MessageSquare, Settings } from 'lucide-react';

import CustomCursor    from './components/CustomCursor';
import Background3D    from './components/Background3D';
import EditableText    from './components/EditableText';
import EditableImage   from './components/EditableImage';
import Lightbox        from './components/Lightbox';
import ProjectsCarousel from './components/ProjectsCarousel';
import ErrorBoundary   from './components/ErrorBoundary';
const Comments = React.lazy(() => import('./components/Comments'));

import useInfiniteSections from './hooks/useInfiniteSections';
import { getContent, saveContent, getMe } from './api/client';

import CMSPanel from './components/CMSPanel';

/* ---------- утилита: дебаунс ---------- */
function useDebounced(delay = 600) {
  const t = useRef();
  return (fn) => {
    clearTimeout(t.current);
    t.current = setTimeout(() => { try { fn?.(); } catch {} }, delay);
  };
}

/* ---------- дефолтные данные ---------- */
const DEFAULT = {
  site:    { name: 'Имя Фамилия', role: 'Business Analyst / Product' },
  socials: { email: 'calexicool@ya.ru', instagram: 'https://instagram.com/forevercalex', telegram: 'https://t.me/plucarism' },
  strings: {
    heroProjectsBtn: 'Проекты',
    heroWriteBtn:    'Написать',
    heroScrollHint:  'Колесо/тачпад — плавный скролл →',
    heroCommentsHint:'Комментарии в конце',
    projectsTitle:   'Проекты',
    photosTitle:     'Фото',
    commentsTitle:   'Комментарии',
    moreBtn:         'Подробнее',
    openBtn:         'Открыть',
  },
  hero:  { title: 'Привет! Я BA с фокусом на пользовательских сценариях', subtitle: 'Здесь — мои проекты и заметки.' },
  about: {
    title: 'Обо мне',
    text:  'Работаю с требованиями, BPMN/UML, историями и прототипами.',
    skills: ['BPMN/UML','User Stories','Backlog','Wireframing','CJM','SQL','Figma'],
    photo:  'https://images.unsplash.com/photo-1513245543132-31f507417b26?q=80&w=1200&auto=format&fit=crop'
  },
  projects: [
    { id:'p1', title:'CRM для студсовета',            summary:'Сбор требований, юзкейсы, прототипы', tags:['BA','Prototype'], cover:'https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=1400&auto=format&fit=crop', link:'', content:'Подробности проекта.' },
    { id:'p2', title:'Сервис записи к наставникам',   summary:'User flow, RICE',                      tags:['BA','Product'],   cover:'https://images.unsplash.com/photo-1529101091764-c3526daf38fe?q=80&w=1400&auto=format&fit=crop', link:'', content:'Тесты и результаты.' },
    { id:'p3', title:'Дашборд кафедры',               summary:'Метрики и макеты',                    tags:['Analytics','Dashboard'], cover:'https://images.unsplash.com/photo-1551281044-8f785ba67e45?q=80&w=1400&auto=format&fit=crop', link:'', content:'Источники данных и макеты.' },
  ],
  photos: [
    { src:'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop', fit:'cover', h:240, w:100 },
    { src:'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1200&auto=format&fit=crop', fit:'cover', h:240, w:100 },
    { src:'https://images.unsplash.com/photo-1517249361621-f11084eb8e28?q=80&w=1200&auto=format&fit=crop', fit:'cover', h:240, w:100 },
  ],
};

/* ---------- служебный секшен ---------- */
function Section({ id, children }) {
  return (
    <section
      id={id}
      className="w-screen shrink-0 p-6 md:p-10 lg:p-14 xl:p-20"
      style={{ height: '100svh' }}
    >
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  );
}

export default function App() {
  /* тема */
  const [theme, setTheme] = useState('dark');
  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') html.classList.add('dark');
    else html.classList.remove('dark');
  }, [theme]);

  /* авторизация/режим редактирования */
  const [me, setMe] = useState(null);
  const [edit, setEdit] = useState(false);
  const [cmsOpen, setCmsOpen] = useState(false);

  useEffect(() => { getMe().then(setMe).catch(()=>setMe(null)); }, []);
  const isAdmin = !!me?.isAdmin;

  /* контент + автосохранение */
  const [content, setContent] = useState(DEFAULT);
  const debounced = useDebounced(600);

  useEffect(() => {
    (async () => {
      try {
        const c = await getContent();
        setContent(c || DEFAULT);
      } catch {
        setContent(DEFAULT);
      }
    })();
  }, []);

  const save = (next) => {
    setContent(next);
    debounced(() => saveContent(next).catch(console.error));
  };

  /* горизонтальный скролл / прогресс */
  const scrollerRef = useRef(null);
  const progressRef = useRef(0);
  const hoverLocalRef = useRef(false);
  const [indexUI, setIndexUI] = useState(0);
  const [progressUI, setProgressUI] = useState(0);

  const { scrollToIndex, scrollToProgress } = useInfiniteSections(
    scrollerRef,
    progressRef,
    { onIndex: setIndexUI, onProgress: setProgressUI, sectionsCount: 5, hoverLocalRef }
  );

  /* лайтбокс фото */
  const [lbIdx, setLbIdx] = useState(-1);
  const closeLB = () => setLbIdx(-1);
  const prevLB  = () => setLbIdx(i => i > 0 ? i - 1 : (content.photos?.length || 1) - 1);
  const nextLB  = () => setLbIdx(i => ((i + 1) % (content.photos?.length || 1)));

  /* секции сайта */
  const sections = useMemo(() => ([
    /* ---------- 1. Главная ---------- */
    <Section id="home" key="home">
      <div className="grid h-full grid-rows-[1fr_auto] gap-10">
        <div className="grid content-center gap-6">
          <h1
            className="relative z-10 text-3xl font-extrabold md:text-5xl text-white"
            style={{ textShadow: '0 6px 24px rgba(0,0,0,.7), 0 0 2px rgba(0,0,0,.9)' }}
          >
            <EditableText
              admin={isAdmin && edit}
              as="h1"
              value={content.hero.title}
              onChange={(v)=>save({ ...content, hero: { ...content.hero, title: v } })}
            />
          </h1>
          <p className="max-w-2xl text-lg text-white/95" style={{ textShadow: '0 4px 18px rgba(0,0,0,.6)' }}>
            <EditableText
              admin={isAdmin && edit}
              value={content.hero.subtitle}
              onChange={(v)=>save({ ...content, hero: { ...content.hero, subtitle: v } })}
            />
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={()=>scrollToIndex(2)}
              className="rounded-2xl bg-white px-5 py-3 text-neutral-900 shadow hover:opacity-90"
            >
              <EditableText
                admin={isAdmin && edit}
                value={content.strings.heroProjectsBtn}
                onChange={(v)=>save({ ...content, strings: { ...content.strings, heroProjectsBtn: v } })}
              />
            </button>

            <a
              href={`mailto:${content.socials.email}`}
              className="rounded-2xl border px-5 py-3 shadow hover:bg-neutral-900/5 dark:hover:bg-white/10"
              data-cursor="hover"
            >
              <Mail className="mr-2 inline h-4 w-4" />
              <EditableText
                admin={isAdmin && edit}
                value={content.strings.heroWriteBtn}
                onChange={(v)=>save({ ...content, strings: { ...content.strings, heroWriteBtn: v } })}
              />
            </a>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-white/90" style={{ textShadow:'0 2px 12px rgba(0,0,0,.6)' }}>
          <div className="flex items-center gap-2">
            <EditableText
              admin={isAdmin && edit}
              value={content.strings.heroScrollHint}
              onChange={(v)=>save({ ...content, strings: { ...content.strings, heroScrollHint: v } })}
            />
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <EditableText
              admin={isAdmin && edit}
              value={content.strings.heroCommentsHint}
              onChange={(v)=>save({ ...content, strings: { ...content.strings, heroCommentsHint: v } })}
            />
          </div>
        </div>
      </div>
    </Section>,

    /* ---------- 2. Обо мне ---------- */
    <Section id="about" key="about">
      <div className="grid h-full grid-rows-[auto_1fr] gap-8">
        <h2 className="text-2xl font-semibold md:text-4xl">
          <EditableText
            admin={isAdmin && edit}
            value={content.about.title}
            onChange={(v)=>save({ ...content, about: { ...content.about, title: v } })}
          />
        </h2>

        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="relative w-full">
            <EditableImage
              admin={isAdmin && edit}
              src={content.about.photo}
              alt="Моё фото"
              onImageClick={()=>{}}
              onChange={(v)=>save({ ...content, about: { ...content.about, photo: v } })}
              fit="cover"
              height={320}
              className="w-full"
            />
          </div>

          <div>
            <EditableText
              admin={isAdmin && edit}
              as="p"
              className="text-lg leading-relaxed opacity-90"
              value={content.about.text}
              onChange={(v)=>save({ ...content, about: { ...content.about, text: v } })}
            />

            <div className="mt-6 flex flex-wrap gap-2">
              {(content.about.skills || []).map((s, i) => (
                <span key={i} className="group relative inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
                  <EditableText
                    value={s}
                    admin={isAdmin && edit}
                    onChange={(v)=>{
                      const next = [...content.about.skills]; next[i] = v;
                      save({ ...content, about: { ...content.about, skills: next } });
                    }}
                  />
                  {(isAdmin && edit) && (
                    <button
                      type="button"
                      className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white group-hover:flex"
                      onClick={()=>{
                        const next = [...content.about.skills]; next.splice(i, 1);
                        save({ ...content, about: { ...content.about, skills: next } });
                      }}
                    >×</button>
                  )}
                </span>
              ))}
              {(isAdmin && edit) && (
                <button
                  type="button"
                  className="rounded-full border px-3 py-1 text-sm opacity-70 hover:opacity-100"
                  onClick={()=>{
                    const next = [...(content.about.skills||[]), 'Новый тег'];
                    save({ ...content, about: { ...content.about, skills: next } });
                  }}
                >+ тег</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Section>,

    /* ---------- 3. Проекты ---------- */
    <Section id="projects" key="projects">
      <div className="grid h-full grid-rows-[auto_1fr] gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold md:text-4xl">
            <EditableText
              admin={isAdmin && edit}
              value={content.strings.projectsTitle}
              onChange={(v)=>save({ ...content, strings: { ...content.strings, projectsTitle: v } })}
            />
          </h2>
        </div>

        <ProjectsCarousel
          projects={content.projects || []}
          strings={content.strings}
          admin={isAdmin && edit}
          onMutateProject={(id, patch) => {
            const next = { ...content, projects: (content.projects || []).map(p => p.id === id ? { ...p, ...patch } : p) };
            save(next);
          }}
          onAddProject={()=>{
            const id = (crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
            const baseCover = content.photos?.[0]?.src || '';
            const next = {
              ...content,
              projects: [...(content.projects||[]), { id, title:'Новый проект', summary:'Описание', tags:['Tag'], cover: baseCover, link:'', content:'Текст' }]
            };
            save(next);
          }}
          onRemoveLast={()=>{
            const next = { ...content, projects: (content.projects||[]).slice(0, -1) };
            save(next);
          }}
          hoverLocalRef={hoverLocalRef}
        />
      </div>
    </Section>,

    /* ---------- 4. Фото ---------- */
    <Section id="photos" key="photos">
      <div className="grid h-full grid-rows-[auto_1fr] gap-6">
        <h2 className="text-2xl font-semibold md:text-4xl">
          <EditableText
            admin={isAdmin && edit}
            value={content.strings.photosTitle}
            onChange={(v)=>save({ ...content, strings: { ...content.strings, photosTitle: v } })}
          />
        </h2>

        <div
          className="columns-2 gap-4 md:columns-3 lg:columns-4"
          onMouseEnter={()=>{hoverLocalRef.current = true;}}
          onMouseLeave={()=>{hoverLocalRef.current = false;}}
        >
          {(content.photos || []).map((p, i) => {
            const photo = typeof p === 'string'
              ? { src: p, fit: 'cover', h: 240, w: 100 }
              : { fit: 'cover', h: 240, w: 100, ...p };
            return (
              <div key={i} className="relative mb-4 w-full break-inside-avoid">
                <EditableImage
                  admin={isAdmin && edit}
                  src={photo.src}
                  alt={'Фото ' + (i+1)}
                  onImageClick={()=>setLbIdx(i)}
                  onChange={(v)=>{
                    const photos = [...(content.photos || [])];
                    photos[i] = { ...photo, src: v };
                    save({ ...content, photos });
                  }}
                  fit={photo.fit}
                  height={photo.h}
                  widthPct={photo.w}
                  onMetaChange={(chg)=>{
                    const photos = [...(content.photos || [])];
                    photos[i] = { ...photo, ...chg };
                    save({ ...content, photos });
                  }}
                />
              </div>
            );
          })}
        </div>

        {(isAdmin && edit) && (
          <div className="mt-2 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-900/5 dark:hover:bg-white/10"
              onClick={()=>{
                const photos = [...(content.photos || []), { src:'', fit:'cover', h:240, w:100 }];
                save({ ...content, photos });
              }}
            >+ Добавить фото</button>

            <button
              type="button"
              className="rounded-xl border px-4 py-2 text-sm hover:bg-rose-500/10"
              onClick={()=>{
                const photos = [...(content.photos || [])].slice(0, -1);
                save({ ...content, photos });
              }}
            >− Удалить последнее</button>
          </div>
        )}
      </div>
    </Section>,

    /* ---------- 5. Комментарии ---------- */
    <Section id="comments" key="comments">
      <h2 className="mb-4 text-2xl font-semibold md:mb-6 md:text-4xl">
        <EditableText
          admin={isAdmin && edit}
          value={content.strings.commentsTitle}
          onChange={(v)=>save({ ...content, strings: { ...content.strings, commentsTitle: v } })}
        />
      </h2>

      <ErrorBoundary>
        <Suspense fallback={<div className="opacity-70">Комментарии загружаются…</div>}>
          <Comments admin={isAdmin && edit} />
        </Suspense>
      </ErrorBoundary>
    </Section>,
  ]), [content, isAdmin, edit]);

  /* отрисовать три раза (бесконечный горизонтальный цикл) */
  const renderTripled = (keyPrefix) => sections.map((s, i) => React.cloneElement(s, { key: `${keyPrefix}-${i}` }));

  return (
    <div className="relative min-h-screen">
      {/* скрыть полосы прокрутки у горизонтального контейнера */}
      <style>{`
        #scroller{scrollbar-width:none;-ms-overflow-style:none}
        #scroller::-webkit-scrollbar{display:none}
      `}</style>

      <Background3D progressRef={progressRef}/>
      <CustomCursor/>

      {/* шапка */}
      <div className="fixed left-0 right-0 top-4 z-40 flex items-center justify-between px-6 md:px-10">
        <div className="flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-2 shadow backdrop-blur dark:bg-neutral-900/90">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"/>
          <span className="font-semibold">
            <EditableText
              admin={isAdmin && edit}
              value={content.site.name}
              onChange={(v)=>save({ ...content, site: { ...content.site, name: v } })}
            />
          </span>
          <span className="hidden text-sm opacity-80 sm:inline">
            <EditableText
              admin={isAdmin && edit}
              value={content.site.role}
              onChange={(v)=>save({ ...content, site: { ...content.site, role: v } })}
            />
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={content.socials.instagram}
            target="_blank"
            className="rounded-xl bg-white/90 p-2 shadow backdrop-blur hover:scale-105 dark:bg-neutral-900/90"
            rel="noreferrer"
            aria-label="Instagram"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="5"/>
              <circle cx="12" cy="12" r="3.5"/>
              <circle cx="17.5" cy="6.5" r="1.5"/>
            </svg>
          </a>

          <a
            href={content.socials.telegram}
            target="_blank"
            className="rounded-xl bg-white/90 p-2 shadow backdrop-blur hover:scale-105 dark:bg-neutral-900/90"
            rel="noreferrer"
            aria-label="Telegram"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <circle cx="12" cy="12" r="10" opacity="0.15"/>
              <path d="M20.5 5.5L4.5 12.5l5.6 1.7 7.1-7.1-5.9 8.4.4 2.9 2.1-2 3-11.9z"/>
            </svg>
          </a>

          <button
            type="button"
            onClick={()=>setTheme(theme==='dark' ? 'light' : 'dark')}
            className="rounded-xl bg-white/90 p-2 shadow backdrop-blur hover:scale-105 dark:bg-neutral-900/90"
            aria-label="Theme"
          >
            {theme==='dark' ? <Sun className="h-5 w-5"/> : <Moon className="h-5 w-5"/>}
          </button>

          <button
            type="button"
            onClick={()=>setCmsOpen(true)}
            className="rounded-xl bg-white/90 p-2 shadow backdrop-blur hover:scale-105 dark:bg-neutral-900/90"
            aria-label="CMS"
          >
            <Settings className="h-5 w-5"/>
          </button>
        </div>
      </div>

      {/* горизонтальная карусель секций */}
      <div
        id="scroller"
        ref={scrollerRef}
        className="flex overflow-x-auto"
        style={{ height: '100svh', scrollSnapType: 'none', overscrollBehaviorX: 'none' }}
      >
        <div className="flex">
          {renderTripled('a')}
          {renderTripled('b')}
          {renderTripled('c')}
        </div>
      </div>

      {/* нижний слайдер прогресса */}
      <div className="fixed bottom-4 left-1/2 z-30 w-[min(90vw,700px)] -translate-x-1/2">
        <input
          type="range"
          min="0"
          max="1"
          step="0.002"
          value={progressUI}
          onInput={(e)=>scrollToProgress(Number(e.currentTarget.value))}
          onChange={(e)=>scrollToProgress(Number(e.currentTarget.value))}
          className="w-full appearance-none bg-transparent"
          aria-label="Навигация по разделам"
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

      {/* CMS-панель */}
      <CMSPanel
        open={cmsOpen}
        onClose={()=>setCmsOpen(false)}
        edit={edit}
        onToggleEdit={(v)=>setEdit(!!v)}
        onAuthed={(user)=>setMe(user)}
      />

      {/* Лайтбокс */}
      <Lightbox
        images={content.photos}
        index={lbIdx}
        onClose={closeLB}
        onPrev={prevLB}
        onNext={nextLB}
      />
    </div>
  );
}
