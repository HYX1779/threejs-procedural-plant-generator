import type { PlantGroup, PlantParams } from "../lib/taxonomy";
import { useI18n, type MessageKey } from "../lib/i18n";

type Row = {
  n: string;
  textKey: MessageKey;
  latin?: string;
  level: number;
  goto?: string;
  resultKey?: MessageKey;
  active: boolean;
  enabled: boolean;
  sel: Partial<PlantParams>;
};

export default function KeyPanel({
  params,
  group,
  onSet,
}: {
  params: PlantParams;
  group: PlantGroup;
  onSet: (patch: Partial<PlantParams>) => void;
}) {
  const { t } = useI18n();
  const seed = params.hasSeed;
  const fruit = params.hasFruit;
  const rows: Row[] = [
    {
      n: "1",
      textKey: "row1",
      latin: "Spermatophyta",
      level: 0,
      goto: "2",
      active: seed,
      enabled: true,
      sel: { hasSeed: true },
    },
    {
      n: "1′",
      textKey: "row1b",
      latin: "Cryptogamae",
      level: 0,
      goto: "4",
      active: !seed,
      enabled: true,
      sel: { hasSeed: false },
    },
    {
      n: "2",
      textKey: "row2",
      latin: "Angiospermae",
      level: 1,
      goto: "3",
      active: seed && fruit,
      enabled: seed,
      sel: { hasSeed: true, hasFruit: true },
    },
    {
      n: "2′",
      textKey: "row2b",
      latin: "Gymnospermae",
      level: 1,
      resultKey: "groupGymno",
      active: seed && !fruit,
      enabled: seed,
      sel: { hasSeed: true, hasFruit: false },
    },
    {
      n: "3",
      textKey: "row3",
      latin: "Dicotyledoneae",
      level: 2,
      resultKey: "groupDicot",
      active: seed && fruit && params.venation === "reticulate",
      enabled: seed && fruit,
      sel: { hasSeed: true, hasFruit: true, venation: "reticulate" },
    },
    {
      n: "3′",
      textKey: "row3b",
      latin: "Monocotyledoneae",
      level: 2,
      resultKey: "groupMono",
      active: seed && fruit && params.venation === "parallel",
      enabled: seed && fruit,
      sel: { hasSeed: true, hasFruit: true, venation: "parallel" },
    },
    {
      n: "4",
      textKey: "row4",
      latin: "Cormophyta",
      level: 0,
      goto: "5",
      active: !seed && params.hasStemLeaf,
      enabled: !seed,
      sel: { hasSeed: false, hasStemLeaf: true },
    },
    {
      n: "4′",
      textKey: "row4b",
      latin: "Thallophyta",
      level: 0,
      resultKey: "groupAlgae",
      active: !seed && !params.hasStemLeaf,
      enabled: !seed,
      sel: { hasSeed: false, hasStemLeaf: false },
    },
    {
      n: "5",
      textKey: "row5",
      latin: "Pteridophyta",
      level: 1,
      resultKey: "groupFern",
      active: !seed && params.hasStemLeaf && params.hasRoot,
      enabled: !seed && params.hasStemLeaf,
      sel: { hasSeed: false, hasStemLeaf: true, hasRoot: true },
    },
    {
      n: "5′",
      textKey: "row5b",
      latin: "Bryophyta",
      level: 1,
      resultKey: "groupMoss",
      active: !seed && params.hasStemLeaf && !params.hasRoot,
      enabled: !seed && params.hasStemLeaf,
      sel: { hasSeed: false, hasStemLeaf: true, hasRoot: false },
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* ---------- 检索表 ---------- */}
      <section className="panel rise p-3.5">
        <header className="mb-3 flex items-baseline justify-between border-b border-line pb-2">
          <h2 className="label-cjk text-[13.5px] text-moss-200">{t("keyTitle")}</h2>
          <span className="font-display text-[10px] italic tracking-wide text-moss-400">{t("keyLatin")}</span>
        </header>
        <ol className="relative">
          <span className="vine-line pointer-events-none absolute left-[13px] top-1 bottom-1 w-px opacity-40" />
          {rows.map((r) => {
            const on = r.active && r.enabled;
            const dim = !r.enabled;
            return (
              <li key={r.n}>
                <button
                  type="button"
                  onClick={() => onSet(r.sel)}
                  className={[
                    "group relative flex w-full items-start gap-2 py-[5px] pl-0 pr-1 text-left transition-all duration-200",
                    dim ? "opacity-30" : "opacity-100",
                    on ? "" : "hover:translate-x-[2px]",
                  ].join(" ")}
                  style={{ marginLeft: r.level * 13 }}
                >
                  <span
                    className={[
                      "numeral relative z-10 mt-[1px] flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border text-[9px] transition-colors",
                      on
                        ? "border-amber-signal bg-amber-signal text-on-accent"
                        : "border-line-strong bg-ink-800 text-moss-400 group-hover:border-leaf-400/70 group-hover:text-leaf-300",
                    ].join(" ")}
                  >
                    {r.n.replace("′", "")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-1.5">
                      <span
                        className={[
                          "text-[11.5px] leading-snug tracking-wide transition-colors",
                          on ? "text-moss-200" : "text-moss-300/75 group-hover:text-moss-200",
                        ].join(" ")}
                      >
                        {r.n.includes("′") && <span className="numeral mr-1 text-[10px] text-amber-signal/70">′</span>}
                        {t(r.textKey)}
                      </span>
                    </span>
                    <span className="mt-[1px] flex items-baseline gap-1.5">
                      {r.latin && <span className="font-display text-[9.5px] italic text-moss-400/80">{r.latin}</span>}
                      {r.goto && (
                        <span className="numeral text-[9.5px] text-moss-400/70">
                          → {r.goto}
                        </span>
                      )}
                      {r.resultKey && (
                        <span
                          className={[
                            "border px-1 py-px font-cjk-display text-[9.5px] tracking-wider transition-colors",
                            on
                              ? "border-leaf-400/60 bg-leaf-400/12 text-leaf-300"
                              : "border-line text-moss-400",
                          ].join(" ")}
                        >
                          {t(r.resultKey)}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ---------- 鉴定结果 ---------- */}
      <section className="panel rise p-3.5" style={{ animationDelay: "80ms" }}>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="numeral text-[10px] tracking-widest text-amber-signal/75">{t("resultLabel")}</span>
          <span className="font-display text-[10px] italic text-moss-400">{group.divisionLatin}</span>
        </div>
        <h3 className="label-cjk text-[19px] leading-tight text-moss-200">{group.division}</h3>
        {group.klass && (
          <p className="mt-0.5 flex items-baseline gap-2">
            <span className="label-cjk text-[13px] text-leaf-300">{group.klass}</span>
            <span className="font-display text-[10px] italic text-moss-400">{group.klassLatin}</span>
          </p>
        )}
        <p className="mt-2 border-l-2 border-amber-signal/50 pl-2.5 text-[11px] leading-relaxed text-moss-300/80">
          {group.headline}
        </p>
        <p className="mt-2.5 text-[11px] leading-[1.75] text-moss-300/65">{group.blurb}</p>

        <ul className="mt-3 space-y-[3px] border-t border-line-soft pt-2.5">
          {group.traits.map((t) => (
            <li key={t.k} className="flex items-baseline gap-1.5 text-[10.5px]">
              <span className="shrink-0 text-moss-400">{t.k}</span>
              <span className="h-px flex-1 translate-y-[-2px] border-b border-dotted border-line-strong" />
              <span className="shrink-0 text-right text-moss-200/90">{t.v}</span>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex items-start gap-2 border-t border-line-soft pt-2.5">
          <svg viewBox="0 0 24 24" className="mt-[1px] h-3.5 w-3.5 shrink-0 text-amber-signal/80" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M12 21c0-6 3-9 8-10-1 6-4 9-8 10Zm0 0C12 15 9 12 4 11c1 6 4 9 8 10Z" />
            <path d="M12 21v-6" />
          </svg>
          <p className="text-[10.5px] leading-relaxed text-moss-300/70">{group.repro}</p>
        </div>
      </section>
    </div>
  );
}
