import { useMemo, useState } from "react";
import {
  COROLLAS,
  FRUIT_TYPES,
  HABITS,
  INFLORESCENCES,
  LEAF_SHAPES,
  PHYLLOTAXY,
  THALLUS,
  type FruitType,
  type PlantGroup,
  type PlantParams,
} from "../lib/taxonomy";
import { localizeOptions } from "../lib/content-i18n";
import { RichText, useI18n, type MessageKey } from "../lib/i18n";
import { Segmented, Slider, Swatches, Toggle } from "./ui";

const LEAF_COLORS = ["#2f6b2f", "#3f8a3c", "#5aa644", "#8fb63c", "#b9c248", "#c9a03a", "#9c4a2e", "#2f7a5a"];
const PETAL_COLORS = ["#f2b8c6", "#fdfdfd", "#f6e05e", "#e2653f", "#b06ad4", "#ef8fb0", "#d9e24a", "#7fa8e0"];
const FRUIT_COLORS = ["#d4402f", "#e08a1e", "#7a2f8a", "#3f7a2f", "#c9a03a", "#e8d24a", "#8a3b2e"];
const STEM_COLORS = ["#5f8f3f", "#7d9a44", "#7d5a35", "#6b4b30", "#8a7a44"];

function NumSeg({
  options,
  value,
  onChange,
}: {
  options: { v: number; name: string }[];
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={[
            "flex-1 border px-1 py-1 text-[11px] tracking-wide transition-all duration-200",
            o.v === value
              ? "border-leaf-400/60 bg-leaf-400/12 text-leaf-300"
              : "border-line text-moss-300/70 hover:border-leaf-400/35 hover:text-moss-200",
          ].join(" ")}
        >
          {o.name}
        </button>
      ))}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="border border-dashed border-line bg-wash px-2.5 py-2 text-[10.5px] leading-relaxed text-moss-400">
      {children}
    </p>
  );
}

function Block({ title, latin, children }: { title: string; latin?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-baseline gap-2">
        <span className="h-[5px] w-[5px] rotate-45 bg-amber-signal/70" />
        <h4 className="label-cjk text-[12px] text-moss-200">{title}</h4>
        {latin && <span className="font-display text-[9.5px] italic text-moss-400">{latin}</span>}
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

const TABS: { id: "habit" | "leaf" | "repro" | "site"; nameKey: MessageKey; latin: string }[] = [
  { id: "habit", nameKey: "tabHabit", latin: "Habitus" },
  { id: "leaf", nameKey: "tabLeaf", latin: "Folium" },
  { id: "repro", nameKey: "tabRepro", latin: "Organa reproductiva" },
  { id: "site", nameKey: "tabSite", latin: "Habitat" },
];

export default function OrganPanel({
  params,
  group,
  onSet,
}: {
  params: PlantParams;
  group: PlantGroup;
  onSet: (patch: Partial<PlantParams>) => void;
}) {
  const { lang, t } = useI18n();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("leaf");
  const caps = group.caps;
  const p = params;

  const habits = useMemo(() => localizeOptions(HABITS, lang), [lang]);
  const phyllotaxy = useMemo(() => localizeOptions(PHYLLOTAXY, lang), [lang]);
  const thallus = useMemo(() => localizeOptions(THALLUS, lang), [lang]);
  const leafShapes = useMemo(() => localizeOptions(LEAF_SHAPES, lang), [lang]);
  const petalShapes = useMemo(
    () => leafShapes.filter((s) => s.id !== "needle" && s.id !== "palmate"),
    [leafShapes],
  );
  const corollas = useMemo(() => localizeOptions(COROLLAS, lang), [lang]);
  const inflorescences = useMemo(() => localizeOptions(INFLORESCENCES, lang), [lang]);
  const fruitTypes = useMemo(() => localizeOptions(FRUIT_TYPES, lang), [lang]);

  const lightOptions = useMemo(
    () =>
      [
        { id: "dawn" as const, name: t("dawn"), latin: "aurora" },
        { id: "noon" as const, name: t("noon"), latin: "meridies" },
        { id: "dusk" as const, name: t("dusk"), latin: "vesper" },
      ],
    [t],
  );
  const groundOptions = useMemo(
    () =>
      [
        { id: "soil" as const, name: t("soil"), latin: "humus" },
        { id: "rock" as const, name: t("rock"), latin: "rupes" },
        { id: "water" as const, name: t("water"), latin: "aqua" },
      ],
    [t],
  );

  const woodFmt = (v: number) =>
    v < 0.25 ? t("herb") : v < 0.6 ? t("subshrub") : v < 0.85 ? t("shrub") : t("tree");

  const venationKey: MessageKey =
    caps.seed && p.hasFruit
      ? p.venation === "parallel"
        ? "venParallelMono"
        : "venReticDicot"
      : group.id === "gymno"
        ? "venGymno"
        : "venFern";

  const fruitNoteKey: MessageKey =
    p.fruitType === "capsule" || p.fruitType === "legume"
      ? "fruitNoteCapsule"
      : p.fruitType === "nut"
        ? "fruitNoteNut"
        : "fruitNoteFleshy";

  return (
    <section className="panel rise flex min-h-0 flex-1 flex-col" style={{ animationDelay: "140ms" }}>
      <div className="flex shrink-0 border-b border-line">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            type="button"
            onClick={() => setTab(tb.id)}
            className={[
              "group relative flex-1 px-1 pb-2 pt-2.5 transition-colors",
              tab === tb.id ? "text-leaf-300" : "text-moss-400 hover:text-moss-200",
            ].join(" ")}
          >
            <span className="label-cjk block text-[12px] leading-tight">{t(tb.nameKey)}</span>
            <span className="block truncate font-display text-[8.5px] italic opacity-70">{tb.latin}</span>
            <span
              className={[
                "absolute bottom-0 left-2 right-2 h-[2px] origin-left transition-transform duration-300",
                tab === tb.id ? "scale-x-100 bg-amber-signal" : "scale-x-0 bg-moss-400 group-hover:scale-x-100",
              ].join(" ")}
            />
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3.5">
        {/* ---------------- 株型 ---------------- */}
        {tab === "habit" && (
          <>
            {group.id !== "algae" && (
              <Block title={t("habitTitle")} latin="habitus">
                <Segmented options={habits} value={p.habit} onChange={(v) => onSet({ habit: v })} cols={3} />
                <Slider label={t("heightLabel")} latin="altura" value={p.height} min={0.35} max={1.7} onChange={(v) => onSet({ height: v })} fmt={(v) => `${(v * 2.35).toFixed(2)} m`} />
                <Slider label={t("stemThickness")} latin="crassitudo" value={p.thickness} min={0.1} max={1.4} onChange={(v) => onSet({ thickness: v })} />
                <Slider
                  label={t("woodiness")}
                  latin="lignum"
                  value={p.woodiness}
                  min={0}
                  max={1}
                  onChange={(v) => onSet({ woodiness: v })}
                  fmt={woodFmt}
                />
                <Swatches label={t("stemColor")} value={p.stemColor} onChange={(v) => onSet({ stemColor: v })} presets={STEM_COLORS} />
              </Block>
            )}
            {caps.leaves && (
              <Block title={t("phyllotaxisTitle")} latin="phyllotaxis">
                <Segmented options={phyllotaxy} value={p.phyllotaxy} onChange={(v) => onSet({ phyllotaxy: v })} cols={2} />
                <Slider
                  label={t("leavesPerShoot")}
                  latin="numerus"
                  value={p.nodeCount}
                  min={2}
                  max={16}
                  step={1}
                  onChange={(v) => onSet({ nodeCount: Math.round(v) })}
                  fmt={(v) => v.toFixed(0)}
                />
                {p.venation === "parallel" && caps.seed && <Note>{t("monocotLeafNote")}</Note>}
              </Block>
            )}
            {group.id === "algae" && (
              <Block title={t("thallusTitle")} latin="thallus">
                <Segmented options={thallus} value={p.thallusForm} onChange={(v) => onSet({ thallusForm: v })} cols={3} />
                <Slider label={t("thallusSize")} value={p.height} min={0.4} max={1.5} onChange={(v) => onSet({ height: v })} />
                <Note>{t("algaeHabitNote")}</Note>
              </Block>
            )}
          </>
        )}

        {/* ---------------- 叶 ---------------- */}
        {tab === "leaf" && (
          <>
            {caps.leaves ? (
              <>
                <Block title={t("leafShapeTitle")} latin="forma folii">
                  <Segmented
                    options={leafShapes}
                    value={p.leafShape}
                    onChange={(v) => onSet({ leafShape: v })}
                    cols={3}
                    showGlyph
                  />
                </Block>
                <Block title={t("leafMarginTitle")} latin="margo">
                  <NumSeg
                    options={[
                      { v: 0, name: t("entire") },
                      { v: 3, name: t("lobes3") },
                      { v: 5, name: t("lobes5") },
                      { v: 7, name: t("lobes7") },
                    ]}
                    value={p.leafLobes}
                    onChange={(v) => onSet({ leafLobes: v })}
                  />
                  <Slider label={t("lobeDepth")} latin="sinus" value={p.lobeDepth} min={0} max={1} onChange={(v) => onSet({ lobeDepth: v })} disabled={p.leafLobes === 0} />
                  <Slider label={t("leafLength")} value={p.leafLength} min={0.12} max={1.5} onChange={(v) => onSet({ leafLength: v })} fmt={(v) => `${(v * 12).toFixed(1)} cm`} />
                  <Slider label={t("leafWidth")} value={p.leafWidth} min={0.03} max={1.1} onChange={(v) => onSet({ leafWidth: v })} fmt={(v) => `${(v * 12).toFixed(1)} cm`} />
                  <Slider label={t("leafCurl")} latin="curl" value={p.leafCurl} min={-0.6} max={1.4} onChange={(v) => onSet({ leafCurl: v })} />
                  <Slider label={t("leafDroop")} latin="nutans" value={p.leafDroop} min={0} max={1.2} onChange={(v) => onSet({ leafDroop: v })} />
                </Block>
                <Block title={t("leafColorTitle")} latin="color">
                  <Swatches label={t("leafBaseColor")} value={p.leafColor} onChange={(v) => onSet({ leafColor: v })} presets={LEAF_COLORS} />
                  <Swatches label={t("leafTipColor")} value={p.leafTipColor} onChange={(v) => onSet({ leafTipColor: v })} presets={LEAF_COLORS} />
                  <Note>
                    <RichText text={`${t("venationLabel")}**${t(venationKey)}**${t("venationTail")}`} />
                  </Note>
                </Block>
              </>
            ) : (
              <Note>
                <b className="text-moss-200">{t("noLeavesTitle")}</b>
                <br />
                {t("noLeavesBody")}
              </Note>
            )}
          </>
        )}

        {/* ---------------- 繁殖器官 ---------------- */}
        {tab === "repro" && (
          <>
            {caps.trueFlower && (
              <>
                <Block title={t("corollaTitle")} latin="corolla">
                  <Segmented options={corollas} value={p.corolla} onChange={(v) => onSet({ corolla: v })} cols={3} />
                  <Segmented
                    options={inflorescences}
                    value={p.inflorescence}
                    onChange={(v) => onSet({ inflorescence: v })}
                    cols={2}
                  />
                  <Slider
                    label={t("petalCount")}
                    value={p.petalCount}
                    min={3}
                    max={16}
                    step={1}
                    onChange={(v) => onSet({ petalCount: Math.round(v) })}
                    fmt={(v) => `${v.toFixed(0)}${t("countUnit")}`}
                  />
                  <Note>
                    <RichText
                      text={`${t("flowerBaseLabel")}**${t(
                        p.venation === "parallel" && group.id === "angio-mono" ? "monoBase" : "dicotBase",
                      )}**${t("flowerBaseTail")}`}
                    />
                  </Note>
                </Block>
                <Block title={t("petalTitle")} latin="petalum">
                  <Segmented
                    options={petalShapes}
                    value={p.petalShape}
                    onChange={(v) => onSet({ petalShape: v })}
                    cols={4}
                    showGlyph
                  />
                  <Slider label={t("flowerDiameter")} latin="diameter" value={p.flowerSize} min={0.15} max={1.4} onChange={(v) => onSet({ flowerSize: v })} fmt={(v) => `${(v * 7).toFixed(1)} cm`} />
                  <Slider
                    label={t("stamenCount")}
                    latin="stamina"
                    value={p.stamenCount}
                    min={0}
                    max={24}
                    step={1}
                    onChange={(v) => onSet({ stamenCount: Math.round(v) })}
                    fmt={(v) => `${v.toFixed(0)}${t("countUnit")}`}
                  />
                  <Swatches label={t("petalColor")} value={p.petalColor} onChange={(v) => onSet({ petalColor: v })} presets={PETAL_COLORS} />
                  <Swatches label={t("petalTipColor")} value={p.petalColor2} onChange={(v) => onSet({ petalColor2: v })} presets={PETAL_COLORS} />
                  <Swatches label={t("centerColor")} value={p.centerColor} onChange={(v) => onSet({ centerColor: v })} presets={["#f2c14e", "#e08a1e", "#8a5a2a", "#f6e05e", "#c9683a"]} />
                </Block>
                <Block title={t("fruitTitle")} latin="fructus">
                  <div className="grid grid-cols-2 gap-1.5">
                    {fruitTypes.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => onSet({ fruitType: f.id as FruitType })}
                        className={[
                          "border px-2 py-1.5 text-left transition-all duration-200",
                          p.fruitType === f.id
                            ? "border-amber-signal/60 bg-amber-signal/10 text-amber-signal"
                            : "border-line text-moss-300/80 hover:border-amber-signal/35 hover:text-moss-200",
                        ].join(" ")}
                      >
                        <span className="block text-[11.5px] leading-tight">{f.name}</span>
                        <span className="block font-display text-[9px] italic opacity-60">{f.latin}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] leading-relaxed text-moss-400">
                    {fruitTypes.find((f) => f.id === p.fruitType)?.note}
                  </p>
                  <Slider label={t("fruitDiameter")} value={p.fruitSize} min={0.2} max={1.5} onChange={(v) => onSet({ fruitSize: v })} fmt={(v) => `${(v * 5).toFixed(1)} cm`} />
                  <Swatches label={t("ripeFruitColor")} value={p.fruitColor} onChange={(v) => onSet({ fruitColor: v })} presets={FRUIT_COLORS} />
                </Block>
                <Block title={t("fruitDynamicsTitle")} latin="dispersio seminum">
                  <Note>
                    <RichText text={`${t("fruitNoteLead")}${t(fruitNoteKey)}`} />
                  </Note>
                </Block>
              </>
            )}

            {caps.cone && (
              <Block title={t("coneTitle")} latin="strobilus">
                <Slider label={t("coneSize")} value={p.coneSize} min={0.3} max={1.8} onChange={(v) => onSet({ coneSize: v })} fmt={(v) => `${(v * 6).toFixed(1)} cm`} />
                <Swatches label={t("coneScaleColor")} value={p.coneColor} onChange={(v) => onSet({ coneColor: v })} presets={["#8a6236", "#6b4b30", "#a9803f", "#5d4a33", "#b08a52"]} />
                <Note>
                  <RichText text={t("coneNote")} />
                </Note>
              </Block>
            )}

            {caps.sorus && (
              <Block title={t("sorusTitle")} latin="sorus">
                <Swatches label={t("sorusColor")} value={p.sorusColor} onChange={(v) => onSet({ sorusColor: v })} presets={["#b5762c", "#8a5a2a", "#c9a03a", "#5d4a33", "#d08a3a"]} />
                <Slider label={t("pinnaCount")} value={p.nodeCount} min={3} max={16} step={1} onChange={(v) => onSet({ nodeCount: Math.round(v) })} fmt={(v) => `${v.toFixed(0)}${t("pinnaUnit")}`} />
                <Note>
                  <RichText text={t("sorusNote")} />
                </Note>
              </Block>
            )}

            {caps.capsule && (
              <Block title={t("capsuleTitle")} latin="sporogonium">
                <Swatches label={t("capsuleColor")} value={p.capsuleColor} onChange={(v) => onSet({ capsuleColor: v })} presets={["#a9743c", "#8c5a33", "#c99a4a", "#6b4b30", "#7d8f45"]} />
                <Slider label={t("tuftDensity")} value={p.nodeCount} min={4} max={16} step={1} onChange={(v) => onSet({ nodeCount: Math.round(v) })} fmt={(v) => `${v.toFixed(0)}${t("leafUnit")}`} />
                <Note>
                  <RichText text={t("capsuleNote")} />
                </Note>
              </Block>
            )}

            {group.id === "algae" && (
              <Block title={t("algaeReproTitle")} latin="reproductio">
                <Note>
                  <RichText text={t("algaeReproNote")} />
                </Note>
              </Block>
            )}
          </>
        )}

        {/* ---------------- 生境 ---------------- */}
        {tab === "site" && (
          <>
            <Block title={t("lightTitle")} latin="lux">
              <Segmented
                options={lightOptions}
                value={p.light}
                onChange={(v) => onSet({ light: v })}
                cols={3}
              />
            </Block>
            <Block title={t("substrateTitle")} latin="substratum">
              <Segmented
                options={groundOptions}
                value={p.ground}
                onChange={(v) => onSet({ ground: v })}
                cols={3}
              />
              <Note>
                {group.id === "algae"
                  ? t("substrateNoteAlgae")
                  : group.id === "moss" || group.id === "fern"
                    ? t("substrateNoteMoss")
                    : t("substrateNoteSeed")}
              </Note>
            </Block>
            <Block title={t("dynamicsTitle")} latin="motus">
              <Slider label={t("windLabel")} latin="ventus" value={p.wind} min={0} max={1.6} onChange={(v) => onSet({ wind: v })} />
              <Toggle label={t("autoRotate")} latin="rotatio" value={p.autoRotate} onChange={(v) => onSet({ autoRotate: v })} />
              <Toggle label={t("organLabels")} latin="notae" value={p.showLabels} onChange={(v) => onSet({ showLabels: v })} />
            </Block>
          </>
        )}
      </div>
    </section>
  );
}
