import { useEffect, useRef } from "react";
import { STAGE_RANGES, type PlantGroup, type PlantParams } from "../lib/taxonomy";
import { useI18n } from "../lib/i18n";
import type { FrameBus } from "./PlantScene";

const ICONS = [
  // 种子 / 孢子
  <path key="0" d="M12 3c4 3.2 6 6.6 6 9.6A6 6 0 0 1 6 12.6C6 9.6 8 6.2 12 3Zm0 5v9" />,
  // 萌发
  <path key="1" d="M12 21v-7m0 0c0-3 2-5 5-5 0 3-2 5-5 5Zm0 0c0-2.6-1.8-4.4-4.4-4.4C7.6 15 9.4 17 12 14ZM8 21h8" />,
  // 营养生长
  <path key="2" d="M12 21V8m0 3C12 7 9 4 4 4c0 5 3 8 8 8Zm0-2c0-4 3-7 8-7 0 5-3 7-8 7Z" />,
  // 开花
  <path key="3" d="M12 21v-6m0-2a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Zm0-5.2V3.4M9.6 10.6 5.2 8.2m8.4 2.4 4.4-2.4M9.6 13 5.2 15.4m8.4-2.4 4.4 2.4" />,
  // 结实
  <path key="4" d="M12 21v-5m0 0a4.6 4.6 0 1 0 0-9.2 4.6 4.6 0 0 0 0 9.2Zm0-9.2c1.4-1 3-1.2 4.6-.6M9 13.4c1.8.8 4.2.8 6 0" />,
];

export default function Timeline({
  group,
  bus,
  playing,
  setPlaying,
  speed,
  setSpeed,
  loop,
  setLoop,
  onSeek,
  params,
}: {
  group: PlantGroup;
  bus: FrameBus;
  playing: boolean;
  setPlaying: (v: boolean) => void;
  speed: number;
  setSpeed: (v: number) => void;
  loop: boolean;
  setLoop: (v: boolean) => void;
  onSeek: (v: number) => void;
  params: PlantParams;
}) {
  const fillRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const latinRef = useRef<HTMLSpanElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const chipsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastStage = useRef(-1);
  const lastPct = useRef(-1);
  const stages = group.stages;
  const { t } = useI18n();

  useEffect(() => {
    lastStage.current = -1;
  }, [group.id, stages]);

  useEffect(() => {
    return bus.subscribe((g, s) => {
      // 进度条只用 transform（合成层）更新，避免每帧触发布局
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${g.toFixed(4)})`;
      if (knobRef.current) knobRef.current.style.transform = `translate3d(${(g * 100).toFixed(3)}%,0,0)`;
      const pct = Math.round(g * 100);
      if (pct !== lastPct.current) {
        lastPct.current = pct;
        if (pctRef.current) pctRef.current.textContent = String(pct);
      }
      if (s !== lastStage.current) {
        lastStage.current = s;
        const st = stages[s];
        if (st) {
          if (nameRef.current) nameRef.current.textContent = st.name;
          if (latinRef.current) latinRef.current.textContent = st.latin;
          if (descRef.current) descRef.current.textContent = st.desc;
        }
        chipsRef.current.forEach((c, i) => {
          if (!c) return;
          c.dataset.on = i === s ? "1" : "0";
          c.dataset.done = i < s ? "1" : "0";
        });
      }
    });
  }, [bus, stages]);

  const seekFromEvent = (e: React.PointerEvent) => {
    const r = trackRef.current!.getBoundingClientRect();
    const v = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    onSeek(v);
  };

  return (
    <div className="panel rise px-3.5 pb-3 pt-2.5" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center gap-3">
        {/* 播放控制 */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPlaying(!playing)}
            className="group relative flex h-9 w-9 items-center justify-center border border-leaf-400/45 bg-leaf-400/10 text-leaf-300 transition-all duration-200 hover:border-leaf-300 hover:bg-leaf-400/20 hover:glow-accent"
            aria-label={playing ? t("pause") : t("play")}
          >
            {playing ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <rect x="7" y="5" width="3.4" height="14" rx="0.6" />
                <rect x="13.6" y="5" width="3.4" height="14" rx="0.6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="ml-[2px] h-4 w-4" fill="currentColor">
                <path d="M8 5.2v13.6L19 12z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => setLoop(!loop)}
            className={[
              "flex h-9 w-9 items-center justify-center border transition-all duration-200",
              loop
                ? "border-amber-signal/60 bg-amber-signal/12 text-amber-signal"
                : "border-line text-moss-400 hover:border-moss-300/50 hover:text-moss-200",
            ].join(" ")}
            aria-label={t("loop")}
            title={t("loopTitle")}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M4 11a7 7 0 0 1 12-5l3 3M20 13a7 7 0 0 1-12 5l-3-3" />
              <path d="M19 4v5h-5M5 20v-5h5" />
            </svg>
          </button>
        </div>

        {/* 阶段 chips */}
        <div className="hidden flex-1 items-stretch gap-1 md:flex">
          {stages.map((s, i) => (
            <button
              key={s.name}
              ref={(el) => {
                chipsRef.current[i] = el;
              }}
              type="button"
              data-on="0"
              data-done="0"
              onClick={() => onSeek(STAGE_RANGES[i][0] + 0.001)}
              className="stage-chip group relative flex flex-1 flex-col items-center gap-1 border border-line px-1 py-1 transition-colors duration-300 hover:border-leaf-400/40"
            >
              <span className="flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="stage-ico h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  {ICONS[i]}
                </svg>
                <span className="label-cjk stage-name text-[10.5px]">{s.name}</span>
              </span>
              <span className="stage-latin font-display text-[8px] italic opacity-60">{s.latin}</span>
              <span className="stage-bar absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-amber-signal transition-[scale] duration-300" />
            </button>
          ))}
        </div>

        {/* 速度 */}
        <div className="hidden w-[112px] shrink-0 lg:block">
          <SliderMini label={t("speed")} value={speed} min={0.25} max={3} step={0.05} onChange={setSpeed} fmt={(v) => `${v.toFixed(2)}×`} />
        </div>
      </div>

      {/* 进度轨 */}
      <div className="mt-2.5 flex items-center gap-3">
        <div
          ref={trackRef}
          className="group relative h-6 flex-1 cursor-ew-resize touch-none select-none"
          onPointerDown={(e) => {
            dragging.current = true;
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            seekFromEvent(e);
          }}
          onPointerMove={(e) => dragging.current && seekFromEvent(e)}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
        >
          <div className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 bg-track" />
          {STAGE_RANGES.slice(1).map((r) => (
            <span
              key={r[0]}
              className="absolute top-1/2 h-[9px] w-px -translate-y-1/2 bg-line-strong"
              style={{ left: `${r[0] * 100}%` }}
            />
          ))}
          <div
            ref={fillRef}
            className="absolute left-0 top-1/2 h-[3px] w-full origin-left -translate-y-1/2 bg-gradient-to-r from-leaf-400/70 via-leaf-300 to-amber-signal"
            style={{ transform: "scaleX(0)" }}
          />
          <div
            ref={knobRef}
            className="pointer-events-none absolute inset-y-0 left-0 w-full will-change-transform"
            style={{ transform: "translate3d(0,0,0)" }}
          >
            <div className="absolute left-0 top-1/2 h-[13px] w-[13px] -translate-x-1/2 -translate-y-1/2 rotate-45 border border-amber-signal bg-ink-900 glow-amber transition-transform group-hover:scale-110" />
          </div>
        </div>
        <div className="flex shrink-0 items-baseline gap-1">
          <span ref={pctRef} className="numeral w-[26px] text-right text-[13px] tabular-nums text-amber-signal">
            0
          </span>
          <span className="numeral text-[10px] text-moss-400">%</span>
        </div>
      </div>

      {/* 当前阶段说明 */}
      <div className="mt-2 flex items-start gap-2.5 border-t border-line-soft pt-2">
        <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-signal pulse-dot" />
        <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-moss-300/80">
          <span ref={nameRef} className="label-cjk mr-1.5 text-[12px] text-moss-200">
            {stages[0].name}
          </span>
          <span ref={latinRef} className="mr-2 font-display text-[10px] italic text-amber-signal/70">
            {stages[0].latin}
          </span>
          <span ref={descRef}>{stages[0].desc}</span>
        </p>
        <span className="hidden shrink-0 font-display text-[9.5px] italic text-moss-400/70 sm:block">
          {params.hasSeed ? "sporophyte-dominant" : group.id === "moss" ? "gametophyte-dominant" : "haploid-dominant"}
        </span>
      </div>
    </div>
  );
}

function SliderMini({
  label,
  value,
  min,
  max,
  step,
  onChange,
  fmt,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  fmt: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-[10.5px] text-moss-400">{label}</span>
        <span className="numeral text-[10.5px] tabular-nums text-moss-200/85">{fmt(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ "--pct": `${pct}%`, "--fill": "var(--color-amber-signal)" } as React.CSSProperties}
      />
    </label>
  );
}
