import type { ReactNode } from "react";
import type { LeafShape } from "../lib/taxonomy";
import { useI18n } from "../lib/i18n";

/* ---------------- 叶片轮廓图标 ---------------- */
const GLYPH: Record<LeafShape, string> = {
  ovate: "M12 2 C18 8, 19 18, 12 30 C5 18, 6 8, 12 2 Z",
  lanceolate: "M12 1 C15 9, 15 22, 12 31 C9 22, 9 9, 12 1 Z",
  elliptic: "M12 2 C17 7, 17 25, 12 30 C7 25, 7 7, 12 2 Z",
  obovate: "M12 2 C14.5 8, 19.5 20, 12 30 C4.5 20, 9.5 8, 12 2 Z",
  cordate: "M12 5 C16 1, 21 8, 12 30 C3 8, 8 1, 12 5 Z",
  linear: "M12 2 C13.6 10, 13.6 22, 12 30 C10.4 22, 10.4 10, 12 2 Z",
  needle: "M12 1 L13.1 16 L12 31 L10.9 16 Z",
  fan: "M12 30 C6 24, 3 14, 4.5 7 C8 12, 16 12, 19.5 7 C21 14, 18 24, 12 30 Z",
  palmate: "M12 30 C10.5 22, 4.5 19, 3 12 C7 15.5, 9 12, 9.8 5.5 C11 12, 13 12, 14.2 5.5 C15 12, 17 15.5, 21 12 C19.5 19, 13.5 22, 12 30 Z",
};

export function LeafGlyph({ shape, className = "" }: { shape: LeafShape; className?: string }) {
  return (
    <svg viewBox="0 0 24 32" className={className} fill="none" aria-hidden>
      <path d={GLYPH[shape]} fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.1" />
      <path d="M12 30 L12 4" stroke="currentColor" strokeWidth="0.7" strokeOpacity="0.75" />
    </svg>
  );
}

/* ---------------- 分节标题 ---------------- */
export function SectionTitle({
  n,
  title,
  latin,
  right,
}: {
  n: string;
  title: string;
  latin?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 border-b border-line pb-2">
      <div className="flex items-baseline gap-2.5">
        <span className="numeral text-[11px] text-amber-signal/80">{n}</span>
        <h3 className="label-cjk text-[13px] text-moss-200">{title}</h3>
        {latin && <span className="font-display text-[10px] italic text-moss-400">{latin}</span>}
      </div>
      {right}
    </div>
  );
}

/* ---------------- 滑块 ---------------- */
export function Slider({
  label,
  latin,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  color = "var(--color-leaf-400)",
  fmt,
  disabled = false,
}: {
  label: string;
  latin?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  color?: string;
  fmt?: (v: number) => string;
  disabled?: boolean;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className={`group block select-none ${disabled ? "pointer-events-none opacity-35" : ""}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11.5px] tracking-wide text-moss-200/85 transition-colors group-hover:text-moss-200">
          {label}
          {latin && <span className="ml-1.5 font-display text-[9.5px] italic text-moss-400">{latin}</span>}
        </span>
        <span className="numeral text-[11px] tabular-nums text-amber-signal/85">
          {fmt ? fmt(value) : value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={
          {
            "--pct": `${pct}%`,
            "--fill": color,
          } as React.CSSProperties
        }
      />
    </label>
  );
}

/* ---------------- 分段选择 ---------------- */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  cols = 2,
  showGlyph = false,
}: {
  options: { id: T; name: string; latin?: string }[];
  value: T;
  onChange: (v: T) => void;
  cols?: number;
  showGlyph?: boolean;
}) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={[
              "relative flex items-center gap-2 border px-2 py-1.5 text-left transition-all duration-200",
              on
                ? "border-leaf-400/60 bg-leaf-400/12 text-leaf-300 glow-accent"
                : "border-line bg-wash text-moss-300/80 hover:border-leaf-400/35 hover:bg-accent-wash hover:text-moss-200",
            ].join(" ")}
          >
            {showGlyph && (
              <LeafGlyph shape={o.id as LeafShape} className={`h-6 w-[18px] shrink-0 ${on ? "text-leaf-300" : "text-moss-400"}`} />
            )}
            <span className="min-w-0">
              <span className="block truncate text-[11.5px] leading-tight tracking-wide">{o.name}</span>
              {o.latin && (
                <span className="block truncate font-display text-[9px] italic leading-tight opacity-60">{o.latin}</span>
              )}
            </span>
            {on && <span className="absolute right-1 top-1 h-1 w-1 rounded-full bg-leaf-400 pulse-dot" />}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- 颜色 ---------------- */
export function Swatches({
  label,
  value,
  onChange,
  presets,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  presets: string[];
}) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11.5px] tracking-wide text-moss-200/85">{label}</span>
      <div className="flex items-center gap-1">
        {presets.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={`swatch-ring h-4.5 w-4.5 rounded-[3px] transition-transform duration-150 hover:scale-125 ${
              value.toLowerCase() === c.toLowerCase() ? "ring-1 ring-amber-signal ring-offset-1 ring-offset-ink-800" : ""
            }`}
            style={{ background: c }}
            aria-label={c}
          />
        ))}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="swatch-ring h-4.5 w-4.5 rounded-[3px]"
          aria-label={t("customColor", { label })}
        />
      </div>
    </div>
  );
}

/* ---------------- 开关 ---------------- */
export function Toggle({
  label,
  latin,
  value,
  onChange,
}: {
  label: string;
  latin?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between gap-3 py-1 text-left"
    >
      <span className="text-[11.5px] tracking-wide text-moss-200/85">
        {label}
        {latin && <span className="ml-1.5 font-display text-[9.5px] italic text-moss-400">{latin}</span>}
      </span>
      <span
        className={`relative h-[15px] w-[30px] shrink-0 rounded-full border transition-colors duration-200 ${
          value ? "border-leaf-400/70 bg-leaf-400/25" : "border-line-strong bg-wash-2"
        }`}
      >
        <span
          className={`absolute top-[1.5px] h-[10px] w-[10px] rounded-full transition-all duration-200 ${
            value ? "left-[16px] bg-leaf-300" : "left-[2px] bg-moss-400"
          }`}
        />
      </span>
    </button>
  );
}
