import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import KeyPanel from "./components/KeyPanel";
import LanguageSelect from "./components/LanguageSelect";
import OrganPanel from "./components/OrganPanel";
import PlantScene, { type FrameBus, type SceneControl } from "./components/PlantScene";
import Timeline from "./components/Timeline";
import ThemeToggle from "./components/ThemeToggle";
import {
  DEFAULT_PARAMS,
  binomial,
  classify,
  groupDefaults,
  specimenNo,
  type PlantParams,
} from "./lib/taxonomy";
import { applyPref, readPref, type ThemePref } from "./lib/theme";
import { useI18n } from "./lib/i18n";
import { localizeGroup } from "./lib/content-i18n";

const ROMAN = ["I", "II", "III", "IV", "V"];

function createBus(): FrameBus {
  const listeners = new Set<(g: number, s: number) => void>();
  return {
    listeners,
    emit(g, s) {
      listeners.forEach((f) => f(g, s));
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
  };
}

const LEAF_POOL = ["#2f6b2f", "#3f8a3c", "#5aa644", "#8fb63c", "#b9c248", "#2f7a5a", "#4c8a4a"];
const PETAL_POOL = ["#f2b8c6", "#fdfdfd", "#f6e05e", "#e2653f", "#b06ad4", "#ef8fb0", "#d9e24a", "#7fa8e0"];
const FRUIT_POOL = ["#d4402f", "#e08a1e", "#7a2f8a", "#3f7a2f", "#c9a03a", "#e8d24a"];

export default function App() {
  const { lang, t } = useI18n();
  const [params, setParams] = useState<PlantParams>(DEFAULT_PARAMS);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(true);
  const [theme, setTheme] = useState<ThemePref>(readPref);

  useEffect(() => {
    applyPref(theme);
  }, [theme]);

  // 跟随系统时，系统明暗切换立即同步
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyPref("system", false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const control = useRef<SceneControl>({ seek: null, growth: 0 });
  const bus = useRef<FrameBus>(createBus());
  const stageNumRef = useRef<HTMLSpanElement>(null);
  const stageNameRef = useRef<HTMLSpanElement>(null);
  const stageBarRef = useRef<HTMLSpanElement>(null);

  const rawGroup = useMemo(() => classify(params), [params]);
  const group = useMemo(() => localizeGroup(rawGroup, lang), [rawGroup, lang]);
  const name = useMemo(() => binomial(params, rawGroup), [params, rawGroup]);
  const no = useMemo(() => specimenNo(params.seed), [params.seed]);

  useEffect(() => {
    let last = -1;
    return bus.current.subscribe((g, s) => {
      if (stageBarRef.current) stageBarRef.current.style.transform = `scaleX(${g})`;
      if (s !== last) {
        last = s;
        if (stageNumRef.current) stageNumRef.current.textContent = ROMAN[s];
        if (stageNameRef.current) stageNameRef.current.textContent = group.stages[s]?.name ?? "";
      }
    });
  }, [group]);

  const onSet = useCallback((patch: Partial<PlantParams>) => {
    setParams((prev) => {
      const merged: PlantParams = { ...prev, ...patch };
      const gNew = classify(merged);
      const gOld = classify(prev);
      if (gNew.id !== gOld.id) {
        const presetIdx = merged.seed % gNew.presets.length;
        Object.assign(merged, groupDefaults(gNew, presetIdx), patch);
        if (gNew.id === "algae") merged.ground = "water";
        else if (merged.ground === "water") merged.ground = "soil";
        if (gNew.id === "moss") {
          merged.habit = "tufted";
          merged.height = Math.min(merged.height, 0.5);
        }
        if (gNew.caps.trueFlower) {
          merged.petalCount = gNew.id === "angio-mono" ? 3 : 5;
        }
      }
      return merged;
    });
  }, []);

  const reseed = useCallback(() => {
    control.current.seek = 0;
    control.current.growth = 0;
    setPlaying(true);
  }, []);

  const randomize = useCallback(() => {
    const seed = Math.floor(Math.random() * 999999) + 1;
    const hasSeed = Math.random() < 0.66;
    const hasFruit = hasSeed ? Math.random() < 0.8 : false;
    const venation = Math.random() < 0.42 ? ("parallel" as const) : ("reticulate" as const);
    const hasStemLeaf = Math.random() < 0.82;
    const hasRoot = Math.random() < 0.58;
    let base: PlantParams = {
      ...DEFAULT_PARAMS,
      seed,
      hasSeed,
      hasFruit,
      venation,
      hasStemLeaf,
      hasRoot,
    };
    const g = classify(base);
    base = { ...base, ...groupDefaults(g, Math.floor(Math.random() * g.presets.length)) };
    const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
    base.leafColor = pick(LEAF_POOL);
    base.leafTipColor = pick(LEAF_POOL);
    base.stemColor = pick(["#5f8f3f", "#7d9a44", "#7d5a35", "#6b4b30"]);
    if (g.caps.trueFlower) {
      base.petalColor = pick(PETAL_POOL);
      base.petalColor2 = pick(PETAL_POOL);
      base.centerColor = pick(["#f2c14e", "#e08a1e", "#8a5a2a", "#f6e05e"]);
      base.fruitColor = pick(FRUIT_POOL);
      base.petalCount = g.id === "angio-mono" ? pick([3, 6]) : pick([4, 5, 5, 8]);
      base.stamenCount = g.id === "angio-mono" ? pick([3, 6]) : pick([5, 8, 10, 16]);
    }
    base.wind = 0.2 + Math.random() * 0.9;
    base.height = 0.6 + Math.random() * 0.8;
    base.seed = seed;
    setParams(base);
    control.current.seek = 0;
    control.current.growth = 0;
    setPlaying(true);
  }, []);

  const seek = useCallback((v: number) => {
    control.current.seek = v;
  }, []);

  /* 键盘：空格播放/暂停，←→ 逐帧，1–5 跳转阶段，R 随机 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const g = control.current.growth;
      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((v) => !v);
      } else if (e.key === "ArrowRight") {
        seek(Math.min(1, g + 0.02));
      } else if (e.key === "ArrowLeft") {
        seek(Math.max(0, g - 0.02));
      } else if (e.key >= "1" && e.key <= "5") {
        const i = Number(e.key) - 1;
        seek([0, 0.17, 0.35, 0.63, 0.83][i] + 0.005);
      } else if (e.key.toLowerCase() === "r") {
        randomize();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [seek, randomize]);

  return (
    <div className="bg-lab flex min-h-screen flex-col lg:h-screen lg:overflow-hidden">
      {/* ---------------- 页首 ---------------- */}
      <header className="rise relative z-20 flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 border-b border-line bg-header px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="relative flex h-9 w-9 items-center justify-center border border-leaf-400/35 bg-accent-wash">
            <svg viewBox="0 0 24 32" className="h-6 w-6 text-leaf-400 drift" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M12 30V10" />
              <path d="M12 16C12 9 8 5 2 5c0 7 4 11 10 11Z" fill="currentColor" fillOpacity="0.22" />
              <path d="M12 20c0-6 3.4-9.4 9-9.4 0 6-3.4 9.4-9 9.4Z" fill="currentColor" fillOpacity="0.16" />
            </svg>
          </span>
          <div className="leading-tight">
            <h1 className="label-cjk text-[17px] text-moss-200">
              {t("appTitle")}
              <span className="ml-2 font-display text-[11px] font-light italic tracking-[0.18em] text-amber-signal/80">
                PHYTOGENESIS
              </span>
            </h1>
            <p className="mt-[1px] text-[10px] tracking-[0.14em] text-moss-400">
              {t("appSubtitle")}
            </p>
          </div>
        </div>

        <div className="hidden h-8 w-px bg-line md:block" />

        <div className="min-w-0 leading-tight">
          <p className="truncate font-display text-[15px] italic text-moss-200">{name}</p>
          <p className="truncate text-[9.5px] tracking-[0.12em] text-moss-400">
            {group.division}
            {group.klass ? ` · ${group.klass}` : ""} · {t("specimenNo", { no })}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <LanguageSelect />
          <span className="mx-0.5 hidden h-6 w-px bg-line sm:block" />
          <ThemeToggle value={theme} onChange={setTheme} />
          <span className="mx-0.5 hidden h-6 w-px bg-line sm:block" />
          <button
            type="button"
            onClick={reseed}
            className="group flex items-center gap-1.5 border border-line px-2.5 py-1.5 text-[11px] tracking-wide text-moss-300 transition-all duration-200 hover:border-leaf-400/55 hover:bg-leaf-400/8 hover:text-leaf-300"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 transition-transform duration-500 group-hover:-rotate-180" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" />
            </svg>
            {t("reseed")}
          </button>
          <button
            type="button"
            onClick={randomize}
            className="group flex items-center gap-1.5 border border-amber-signal/50 bg-amber-signal/10 px-3 py-1.5 text-[11px] tracking-wide text-amber-signal transition-all duration-200 hover:bg-amber-signal/20 hover:glow-amber"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-90" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" />
              <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" />
              <circle cx="12" cy="12" r="1.2" fill="currentColor" />
            </svg>
            {t("randomize")}
          </button>
        </div>
      </header>

      {/* ---------------- 主体 ---------------- */}
      <main className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[336px_minmax(0,1fr)_326px] lg:overflow-hidden">
        <aside className="order-2 min-h-0 lg:order-1 lg:overflow-y-auto lg:pr-1">
          <KeyPanel params={params} group={group} onSet={onSet} />
        </aside>

        <section className="order-1 flex min-h-0 flex-col gap-3 lg:order-2">
          <div className="panel relative min-h-[58vh] flex-1 overflow-hidden lg:min-h-0">
            <PlantScene params={params} control={control.current} playing={playing} speed={speed} loop={loop} bus={bus.current} lang={lang} />

            {/* 阶段读数 */}
            <div className="pointer-events-none absolute left-3 top-3 z-10 select-none">
              <div className="flex items-start gap-2.5">
                <span
                  ref={stageNumRef}
                  className="numeral text-[34px] font-light leading-none text-amber-signal/90 [text-shadow:0_0_24px_var(--stage-glow)]"
                >
                  I
                </span>
                <span className="mt-1 leading-tight">
                  <span ref={stageNameRef} className="label-cjk block text-[13px] text-moss-200">
                    {group.stages[0]?.name ?? ""}
                  </span>
                  <span className="block text-[9px] tracking-[0.2em] text-moss-400">{t("stageLatin")}</span>
                </span>
              </div>
              <span className="mt-1.5 block h-px w-[132px] origin-left bg-line">
                <span ref={stageBarRef} className="block h-px w-full origin-left bg-amber-signal" style={{ transform: "scaleX(0)" }} />
              </span>
            </div>

            {/* 类群徽记 */}
            <div className="pointer-events-none absolute right-3 top-3 z-10 max-w-[52%] text-right select-none">
              <p className="font-display text-[13px] italic leading-tight text-moss-200/90">{group.divisionLatin}</p>
              <p className="text-[10px] tracking-[0.1em] text-moss-400">
                {group.klassLatin ?? group.headline}
              </p>
            </div>

            {/* 标本框角饰与暗角 */}
            <div className="pointer-events-none absolute inset-0 z-[3] viewport-vignette" />
            {["left-2 top-2 border-l border-t", "right-2 top-2 border-r border-t", "left-2 bottom-2 border-b border-l", "right-2 bottom-2 border-b border-r"].map(
              (c) => (
                <span key={c} className={`pointer-events-none absolute z-[4] h-3.5 w-3.5 border-leaf-400/35 ${c}`} />
              ),
            )}

            {/* 提示与比例尺 */}
            <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-2 text-[9.5px] tracking-[0.12em] text-moss-400/80">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.4">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3" />
              </svg>
              {t("viewportHint")}
            </div>
            <div className="pointer-events-none absolute bottom-3 right-3 z-10 flex items-end gap-1.5 text-moss-400/80">
              <span className="numeral text-[9px] tracking-widest">10 cm</span>
              <span className="relative block h-[7px] w-[54px] border-x border-b border-line-strong">
                <span className="absolute left-1/2 top-0 h-full w-px bg-line-strong" />
              </span>
            </div>
          </div>

          <Timeline
            group={group}
            bus={bus.current}
            playing={playing}
            setPlaying={setPlaying}
            speed={speed}
            setSpeed={setSpeed}
            loop={loop}
            setLoop={setLoop}
            onSeek={seek}
            params={params}
          />
        </section>

        <aside className="order-3 flex min-h-0 lg:overflow-hidden">
          <div className="flex max-h-[72vh] w-full min-w-0 flex-col lg:max-h-none lg:min-h-0 lg:flex-1">
            <OrganPanel params={params} group={group} onSet={onSet} />
          </div>
        </aside>
      </main>
    </div>
  );
}
