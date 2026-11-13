import type { GroupId, PlantGroup } from "./taxonomy";
import type { Anchor } from "./botany";
import type { Lang } from "./i18n";

/* ------------------------------------------------------------------
   类群说明文本（英文 / 日文）
   拉丁学名保持不变，仅翻译展示文本。
------------------------------------------------------------------ */
type GroupPatch = {
  division: string;
  klass?: string;
  headline: string;
  blurb: string;
  repro: string;
  traits: { k: string; v: string }[];
  stages: { name: string; desc: string }[];
};

const GROUP_EN: Record<GroupId, GroupPatch> = {
  "angio-dicot": {
    division: "Angiosperms",
    klass: "Dicotyledons",
    headline: "Seeds enclosed by pericarp · reticulate venation",
    blurb:
      "Ovules are enclosed in an ovary that develops into fruit after fertilization. The embryo has two cotyledons; leaf veins branch into a net; vascular bundles form a ring with a cambium, allowing secondary thickening.",
    repro: "Double fertilization · insect/wind pollination · fruit protects and disperses seeds",
    traits: [
      { k: "Seed", v: "Present, enclosed by pericarp" },
      { k: "Cotyledons", v: "2" },
      { k: "Venation", v: "Reticulate" },
      { k: "Root system", v: "Taproot (dominant primary root)" },
      { k: "Floral parts", v: "4- or 5-merous" },
      { k: "Vascular bundles", v: "In a ring · cambium present" },
      { k: "Endosperm", v: "Mostly absorbed; cotyledons fleshy" },
    ],
    stages: [
      { name: "Seed", desc: "Seed coat encloses embryo and endosperm; dormant" },
      { name: "Germination", desc: "Radicle breaks the seed coat; cotyledons emerge" },
      { name: "Vegetative growth", desc: "Stem elongates; reticulate-veined leaves unfold" },
      { name: "Flowering", desc: "Corolla opens; anthers release pollen (pollen grains are the male gametophytes)" },
      {
        name: "Fruiting",
        desc: "Ovary swells into fruit; pericarp encloses seeds — no spores are released. Dry fruits split open, fleshy fruits change color for animal dispersal",
      },
    ],
  },
  "angio-mono": {
    division: "Angiosperms",
    klass: "Monocotyledons",
    headline: "Seeds enclosed by pericarp · parallel venation",
    blurb:
      "The embryo has a single cotyledon. Leaf veins run parallel to the tip; vascular bundles are scattered without a cambium, so the stem cannot thicken continuously. Floral parts are mostly in threes and roots are fibrous.",
    repro: "Double fertilization · often wind-pollinated (grasses) or insect-pollinated · caryopsis/berry",
    traits: [
      { k: "Seed", v: "Present, enclosed by pericarp" },
      { k: "Cotyledon", v: "1" },
      { k: "Venation", v: "Parallel" },
      { k: "Root system", v: "Fibrous (adventitious roots)" },
      { k: "Floral parts", v: "3-merous" },
      { k: "Vascular bundles", v: "Scattered · no cambium" },
      { k: "Leaf base", v: "Often a sheath clasping the stem" },
    ],
    stages: [
      { name: "Seed", desc: "Caryopsis-like; pericarp fused with seed coat" },
      { name: "Germination", desc: "Single cotyledon emerges; radicle produces fibrous roots" },
      { name: "Vegetative growth", desc: "Leaf sheaths clasp the stem; parallel-veined leaves emerge" },
      { name: "Flowering", desc: "Inflorescence emerges; 3-merous florets open and anthers shed pollen" },
      {
        name: "Fruiting",
        desc: "Fruit ripens; pericarp and seed coat are fused — the seed remains enclosed by pericarp and no spores are released",
      },
    ],
  },
  gymno: {
    division: "Gymnosperms",
    klass: "Conifers",
    headline: "Seeds present · not enclosed by pericarp",
    blurb:
      "Ovules are exposed on sporophylls; there are no true flowers or fruits, and seeds remain exposed between seed scales at maturity. Strobili are unisexual and mostly wind-pollinated; leaves are often needle-like, linear or scale-like, tolerant of drought and cold.",
    repro: "Strobili (cones) · wind pollination · naked seeds",
    traits: [
      { k: "Seed", v: "Present, naked without pericarp" },
      { k: "Cotyledons", v: "Several (2–18)" },
      { k: "Leaf form", v: "Needle / linear / scale-like" },
      { k: "Root system", v: "Taproot, deeply anchored" },
      { k: "Flowers", v: "No true flowers; strobili present" },
      { k: "Fruit", v: "None; cones are made of seed scales" },
      { k: "Vascular bundles", v: "In a ring · cambium present, xylem mostly without vessels" },
    ],
    stages: [
      { name: "Seed", desc: "Winged naked seed, dispersed by wind" },
      { name: "Germination", desc: "Primary root grows down; several cotyledons spread in a whorl" },
      { name: "Vegetative growth", desc: "Needles cluster; stem lignifies and thickens" },
      { name: "Strobilus", desc: "Male strobili release masses of pollen that drift to ovules exposed on female strobili" },
      { name: "Cone", desc: "Seed scales lignify and open; winged seeds spiral down — seeds are naked, with no pericarp" },
    ],
  },
  fern: {
    division: "Ferns",
    klass: "True ferns",
    headline: "No seeds · stems and leaves · true roots",
    blurb:
      "Roots, stems and leaves are differentiated with vascular tissue, but no seeds are produced; reproduction is by spores. The sporophyte is dominant and bears sori on the underside of fronds. After germination a heart-shaped prothallus (gametophyte) forms; after fertilization a young sporophyte grows.",
    repro: "Spore reproduction · alternation of generations (sporophyte dominant) · fertilization needs water",
    traits: [
      { k: "Seed", v: "None" },
      { k: "Reproduction", v: "Sori" },
      { k: "Roots", v: "True roots from a rhizome" },
      { k: "Stem", v: "Mostly an underground rhizome" },
      { k: "Leaves", v: "Large pinnate fronds; young fronds coiled" },
      { k: "Vascular tissue", v: "Present" },
      { k: "Gametophyte", v: "Heart-shaped prothallus, free-living" },
    ],
    stages: [
      { name: "Spore", desc: "Haploid spores settle in damp shade" },
      { name: "Prothallus", desc: "Spores germinate into heart-shaped gametophytes" },
      { name: "Young sporophyte", desc: "After fertilization, coiled young fronds unfurl" },
      { name: "Adult", desc: "Pinnate fronds fully expand; plant matures" },
      { name: "Spore release", desc: "Sori mature on the underside; the annulus ruptures and catapults spores (no seeds, no pericarp)" },
    ],
  },
  moss: {
    division: "Mosses",
    klass: "True mosses",
    headline: "No seeds · stems and leaves · no true roots",
    blurb:
      "Stems and leaves are differentiated but there is no vascular tissue, only unicellular or uniseriate rhizoids. The gametophyte is dominant and photosynthetic; the sporophyte (seta + capsule) is parasitic on it and cannot live independently.",
    repro: "Spore reproduction · alternation of generations (gametophyte dominant) · fertilization needs water",
    traits: [
      { k: "Seed", v: "None" },
      { k: "Roots", v: "Rhizoids, no absorptive tissue differentiation" },
      { k: "Stem & leaves", v: "Present, but no vascular bundles" },
      { k: "Dominant generation", v: "Gametophyte" },
      { k: "Sporophyte", v: "Seta + capsule, parasitic on gametophyte" },
      { k: "Height", v: "Usually < 10 cm" },
      { k: "Habitat", v: "Damp shade; fertilization depends on a water film" },
    ],
    stages: [
      { name: "Spore", desc: "Spores escape from the capsule mouth and land on wet soil" },
      { name: "Protonema", desc: "Germinate into filamentous protonema and rhizoids" },
      { name: "Gametophyte", desc: "Upright leafy shoots grow in tufts; reproductive organs at the tips" },
      { name: "Fertilization", desc: "Sperm swim through a water film to the archegonia" },
      { name: "Capsule", desc: "Seta elongates, operculum falls, and the capsule releases spores through peristome teeth" },
    ],
  },
  algae: {
    division: "Algae",
    klass: "Green algae",
    headline: "No seeds · no stems or leaves · no roots",
    blurb:
      "Lower plants whose body has no root, stem or leaf differentiation and no vascular tissue; the body is called a thallus. All cells can photosynthesize and produce gametes or spores; reproductive organs are mostly unicellular and fertilization requires water.",
    repro: "Spore/gamete reproduction · no embryo · varied alternation of generations",
    traits: [
      { k: "Seed", v: "None" },
      { k: "Root, stem, leaf", v: "Undifferentiated (thallus)" },
      { k: "Vascular tissue", v: "None" },
      { k: "Reproductive organs", v: "Unicellular, without a protective layer" },
      { k: "Embryo", v: "None; the zygote germinates directly" },
      { k: "Habitat", v: "Fresh water / seawater / damp soil" },
      { k: "Pigments", v: "Chlorophyll a and b, carotenoids" },
    ],
    stages: [
      { name: "Zoospore", desc: "Flagellated spores swim in water" },
      { name: "Attachment & germination", desc: "Flagella are lost; the cell attaches and begins to divide" },
      { name: "Vegetative growth", desc: "Cell division elongates the thallus or filament" },
      { name: "Sporangium", desc: "Apical cells transform into reproductive structures" },
      { name: "Release", desc: "Sporangia rupture and release flagellated zoospores" },
    ],
  },
};

const GROUP_JA: Record<GroupId, GroupPatch> = {
  "angio-dicot": {
    division: "被子植物門",
    klass: "双子葉植物綱",
    headline: "種子は果皮に包まれる · 網状脈",
    blurb:
      "胚珠は子房内にあり、受精後に子房が果実となる。胚は2枚の子葉をもち、葉脈は網状に分枝する。維管束は環状に並び形成層を備えるため二次肥大できる。",
    repro: "重複受精 · 虫媒／風媒 · 果実が種子を保護・散布",
    traits: [
      { k: "種子", v: "有り、果皮に包まれる" },
      { k: "子葉", v: "2枚" },
      { k: "葉脈", v: "網状脈" },
      { k: "根系", v: "直根系（主根が発達）" },
      { k: "花部", v: "4または5基数" },
      { k: "維管束", v: "環状配列 · 形成層あり" },
      { k: "胚乳", v: "多くは吸収され、子葉が肥厚" },
    ],
    stages: [
      { name: "種子", desc: "種皮が胚と胚乳を包み、休眠中" },
      { name: "発芽", desc: "胚根が種皮を破り、子葉が地上に出る" },
      { name: "栄養成長", desc: "茎が伸長し、網状脈の葉が展開する" },
      { name: "開花", desc: "花冠が開き、葯から花粉を放出（花粉粒は雄配偶体）" },
      {
        name: "結実",
        desc: "子房が肥大して果実となり、果皮が種子を包む——胞子は放出しない。裂開する乾果は種子を弾き出し、肉質果は動物散布のため色づく",
      },
    ],
  },
  "angio-mono": {
    division: "被子植物門",
    klass: "単子葉植物綱",
    headline: "種子は果皮に包まれる · 平行脈",
    blurb:
      "胚は子葉を1枚だけもつ。葉脈は主脈が葉先まで平行に走り、維管束は散在して形成層を欠くため、茎は持続的に肥大しない。花部は主に3基数で、根系はひげ根である。",
    repro: "重複受精 · しばしば風媒（イネ科）または虫媒 · 穎果／漿果",
    traits: [
      { k: "種子", v: "有り、果皮に包まれる" },
      { k: "子葉", v: "1枚" },
      { k: "葉脈", v: "平行脈" },
      { k: "根系", v: "ひげ根系（不定根が叢生）" },
      { k: "花部", v: "3基数" },
      { k: "維管束", v: "散在 · 形成層なし" },
      { k: "葉基", v: "しばしば葉鞘が茎を抱く" },
    ],
    stages: [
      { name: "種子", desc: "穎果状で、果皮と種皮が癒合" },
      { name: "発芽", desc: "子葉が1枚出て、胚根からひげ根が生じる" },
      { name: "栄養成長", desc: "葉鞘が茎を抱き、平行脈の葉が抽出する" },
      { name: "開花", desc: "花序が抽出し、3基数の小花が開いて葯から花粉を出す" },
      {
        name: "結実",
        desc: "果実が成熟し、穎果の果皮と種皮が癒合——種子は常に果皮に包まれ、胞子は放出しない",
      },
    ],
  },
  gymno: {
    division: "裸子植物門",
    klass: "マツ綱",
    headline: "種子あり · 果皮に包まれない",
    blurb:
      "胚珠は胞子葉上に裸出し、真の花や果実はない。種子は成熟後も種鱗の間に露出したままである。胞子葉球は単性で主に風媒、葉は針形・線形・鱗片形が多く、乾燥や寒さに強い。",
    repro: "胞子葉球（球花）· 風媒 · 裸出種子",
    traits: [
      { k: "種子", v: "有り、裸出で果皮なし" },
      { k: "子葉", v: "多数（2–18）" },
      { k: "葉形", v: "針形／線形／鱗片形" },
      { k: "根系", v: "直根系で主根が深く張る" },
      { k: "花", v: "真の花はなく、胞子葉球をもつ" },
      { k: "果実", v: "なし、球果は種鱗からなる" },
      { k: "維管束", v: "環状 · 形成層あり、木部は道管を欠くことが多い" },
    ],
    stages: [
      { name: "種子", desc: "翼のある裸出種子が風で散布される" },
      { name: "発芽", desc: "主根が下方へ伸び、複数の子葉が輪生状に開く" },
      { name: "栄養成長", desc: "針葉が束生し、茎が木質化して肥大する" },
      { name: "球花", desc: "雄球花が大量の花粉を放出し、風に乗って雌球花の裸出胚珠に達する" },
      { name: "球果", desc: "種鱗が木質化して開き、翼のある種子が旋回しながら落ちる——種子は裸出で果皮に包まれない" },
    ],
  },
  fern: {
    division: "シダ植物門",
    klass: "真蕨綱",
    headline: "種子なし · 茎葉あり · 真の根あり",
    blurb:
      "根・茎・葉の分化と維管組織をもつが、種子をつくらず胞子で繁殖する。胞子体が発達し、葉裏に胞子嚢群をつける。発芽後は心形の前葉体（配偶体）を形成し、受精後に幼胞子体が育つ。",
    repro: "胞子繁殖 · 世代交代（胞子体が優勢）· 受精に水を要する",
    traits: [
      { k: "種子", v: "なし" },
      { k: "繁殖", v: "胞子嚢群（ソーラス）" },
      { k: "根", v: "真の根、根茎から生じる" },
      { k: "茎", v: "多くは地下の根茎" },
      { k: "葉", v: "大型の羽状複葉、幼葉は巻き込む" },
      { k: "維管組織", v: "あり" },
      { k: "配偶体", v: "心形の前葉体、独立生活" },
    ],
    stages: [
      { name: "胞子", desc: "単相の胞子が陰湿な場所に落下する" },
      { name: "前葉体", desc: "胞子が発芽して心形の配偶体になる" },
      { name: "幼胞子体", desc: "受精後、巻いた幼葉が展開する" },
      { name: "成体", desc: "羽状複葉が完全に展開し、株が成熟する" },
      { name: "胞子放出", desc: "葉裏の胞子嚢群が成熟し、環帯が破れて胞子を弾き飛ばす（種子も果皮もない）" },
    ],
  },
  moss: {
    division: "コケ植物門",
    klass: "蘚綱",
    headline: "種子なし · 茎葉あり · 真の根なし",
    blurb:
      "茎葉の分化はあるが維管組織を欠き、単細胞または単列細胞の仮根のみをもつ。配偶体が発達して緑色の栄養体となり、胞子体（蒴柄＋蒴）は配偶体に寄生して独立生活できない。",
    repro: "胞子繁殖 · 世代交代（配偶体が優勢）· 受精に水を要する",
    traits: [
      { k: "種子", v: "なし" },
      { k: "根", v: "仮根（根毛状）、吸収組織の分化なし" },
      { k: "茎葉", v: "あり、ただし維管束なし" },
      { k: "優勢世代", v: "配偶体" },
      { k: "胞子体", v: "蒴柄＋蒴、配偶体に寄生" },
      { k: "草丈", v: "通常 < 10 cm" },
      { k: "生育地", v: "陰湿、受精は水膜に依存" },
    ],
    stages: [
      { name: "胞子", desc: "胞子が蒴口から散出し、湿った土に落ちる" },
      { name: "原糸体", desc: "発芽して糸状の原糸体と仮根になる" },
      { name: "配偶体", desc: "直立した茎葉体が叢生し、先端に生殖器官をつける" },
      { name: "受精", desc: "精子が水膜を泳いで造卵器に達する" },
      { name: "蒴", desc: "蒴柄が伸び、蒴蓋が外れて蒴が蒴歯から胞子を弾き出す" },
    ],
  },
  algae: {
    division: "藻類植物",
    klass: "緑藻植物門",
    headline: "種子なし · 茎葉なし · 根なし",
    blurb:
      "下等植物で、体は根・茎・葉に分化せず、維管組織もない。これを葉状体（タラス）という。すべての細胞が光合成を行い、配偶子や胞子をつくる。生殖器官は主に単細胞で、受精には水が必要である。",
    repro: "胞子／配偶子繁殖 · 胚なし · 世代交代は多様",
    traits: [
      { k: "種子", v: "なし" },
      { k: "根茎葉", v: "いずれも分化しない（葉状体）" },
      { k: "維管組織", v: "なし" },
      { k: "生殖器官", v: "単細胞で保護層なし" },
      { k: "胚", v: "胚なし、接合子が直接発芽" },
      { k: "生育地", v: "淡水／海水／湿った土壌" },
      { k: "色素", v: "クロロフィル a・b、カロテノイド" },
    ],
    stages: [
      { name: "遊走子", desc: "鞭毛をもつ胞子が水中を泳ぐ" },
      { name: "付着発芽", desc: "鞭毛が脱落し、固着して分裂を始める" },
      { name: "栄養成長", desc: "細胞分裂により葉状体／糸状体が伸長する" },
      { name: "胞子嚢", desc: "頂端細胞が生殖構造に変わる" },
      { name: "放出", desc: "胞子嚢が破れて鞭毛をもつ遊走子を放出する" },
    ],
  },
};

const GROUPS_I18N: Record<Exclude<Lang, "zh">, Record<GroupId, GroupPatch>> = {
  en: GROUP_EN,
  ja: GROUP_JA,
};

/** 返回用于界面展示的类群（保留 caps / presets / 拉丁学名） */
export function localizeGroup(group: PlantGroup, lang: Lang): PlantGroup {
  if (lang === "zh") return group;
  const patch = GROUPS_I18N[lang][group.id];
  return {
    ...group,
    division: patch.division,
    klass: patch.klass ?? group.klass,
    headline: patch.headline,
    blurb: patch.blurb,
    repro: patch.repro,
    traits: patch.traits,
    stages: group.stages.map((s, i) => ({
      ...s,
      name: patch.stages[i]?.name ?? s.name,
      desc: patch.stages[i]?.desc ?? s.desc,
    })),
  };
}

/* ------------------------------------------------------------------
   枚举选项名称（叶形、果实、花冠、花序、株型、叶序、藻体）
------------------------------------------------------------------ */
type EnumPatch = { name?: string; note?: string };

const ENUM_EN: Record<string, EnumPatch> = {
  /* 叶形 */
  ovate: { name: "Ovate" },
  lanceolate: { name: "Lanceolate" },
  elliptic: { name: "Elliptic" },
  obovate: { name: "Obovate" },
  cordate: { name: "Cordate" },
  linear: { name: "Linear" },
  needle: { name: "Needle-like" },
  fan: { name: "Fan-shaped" },
  palmate: { name: "Palmate" },
  /* 果实 */
  berry: { name: "Berry", note: "Fleshy and juicy; pericarp mostly soft" },
  drupe: { name: "Drupe", note: "Thin exocarp; hard, stony endocarp" },
  pome: { name: "Pome", note: "Receptacle and ovary wall become fleshy together" },
  capsule: { name: "Capsule", note: "Dry fruit that splits to release many seeds" },
  legume: { name: "Legume", note: "Single carpel, splitting along two sutures" },
  aggregate: { name: "Aggregate", note: "Many free carpels within one flower" },
  nut: { name: "Caryopsis / achene", note: "Pericarp fused with seed coat; does not split" },
  /* 花冠 */
  separate: { name: "Choripetalous" },
  fused: { name: "Sympetalous" },
  composite: { name: "Capitulum" },
  /* 花序 */
  solitary: { name: "Solitary" },
  raceme: { name: "Raceme" },
  umbel: { name: "Umbel" },
  spike: { name: "Spike" },
  /* 株型 */
  erect: { name: "Erect" },
  rosette: { name: "Rosette" },
  tufted: { name: "Tufted" },
  branched: { name: "Branched" },
  climbing: { name: "Climbing" },
  /* 叶序 */
  alternate: { name: "Alternate" },
  opposite: { name: "Opposite" },
  whorled: { name: "Whorled" },
  basal: { name: "Basal" },
  /* 藻体 */
  filament: { name: "Filamentous" },
  sheet: { name: "Sheet-like" },
};

const ENUM_JA: Record<string, EnumPatch> = {
  ovate: { name: "卵形" },
  lanceolate: { name: "披針形" },
  elliptic: { name: "楕円形" },
  obovate: { name: "倒卵形" },
  cordate: { name: "心形" },
  linear: { name: "線形" },
  needle: { name: "針形" },
  fan: { name: "扇形" },
  palmate: { name: "掌状裂" },
  berry: { name: "漿果", note: "果肉は多汁で、果皮は柔らかい" },
  drupe: { name: "核果", note: "外果皮は薄く、内果皮は硬い核となる" },
  pome: { name: "梨果", note: "花托と子房壁がともに肉質化する" },
  capsule: { name: "蒴果", note: "乾果で、熟すと裂開して多数の種子を出す" },
  legume: { name: "莢果", note: "単一の心皮が背腹2縫線で裂開する" },
  aggregate: { name: "集合果", note: "一花に複数の離生心皮" },
  nut: { name: "穎果／痩果", note: "果皮と種皮が癒合し、裂開しない" },
  separate: { name: "離弁花冠" },
  fused: { name: "合弁花冠" },
  composite: { name: "頭状花序" },
  solitary: { name: "単生花" },
  raceme: { name: "総状花序" },
  umbel: { name: "傘形花序" },
  spike: { name: "穂状花序" },
  erect: { name: "直立" },
  rosette: { name: "ロゼット／根生" },
  tufted: { name: "叢生" },
  branched: { name: "分枝" },
  climbing: { name: "攀縁" },
  alternate: { name: "互生" },
  opposite: { name: "対生" },
  whorled: { name: "輪生" },
  basal: { name: "根生" },
  filament: { name: "糸状体" },
  sheet: { name: "葉状体／膜状" },
};

const ENUMS_I18N: Record<Exclude<Lang, "zh">, Record<string, EnumPatch>> = {
  en: ENUM_EN,
  ja: ENUM_JA,
};

/** 本地化枚举选项数组（不改动原数组） */
export function localizeOptions<T extends { id: string; name: string; note?: string }>(
  list: readonly T[],
  lang: Lang,
): T[] {
  if (lang === "zh") return list as T[];
  const patch = ENUMS_I18N[lang];
  return list.map((o) => {
    const p = patch[o.id];
    return p ? { ...o, name: p.name ?? o.name, note: p.note ?? o.note } : o;
  });
}

/* ------------------------------------------------------------------
   三维标注锚点文本
------------------------------------------------------------------ */
const ANCHOR_EN: Record<string, string> = {
  algaeSpore: "Zoospore",
  algaeBody: "Thallus (no root/stem/leaf)",
  algaeSporangium: "Sporangium",
  seed: "Seed",
  spore: "Spore",
  prothallus: "Prothallus",
  protonema: "Protonema",
  rootRhizoid: "Rhizoid",
  rootTap: "Taproot",
  rootFibrous: "Fibrous roots",
  stemFern: "Rhizome / petiole",
  stemMoss: "Stem (no vascular tissue)",
  stem: "Stem",
  leafFern: "Pinnate frond",
  leaf: "Leaf",
  flower: "Flower",
  fruit: "Fruit (pericarp-enclosed)",
  cone: "Strobilus",
  seedNaked: "Naked seed",
  sorus: "Sorus",
  capsule: "Capsule (sporophyte)",
};

const ANCHOR_JA: Record<string, string> = {
  algaeSpore: "遊走子",
  algaeBody: "葉状体（根・茎・葉なし）",
  algaeSporangium: "胞子嚢",
  seed: "種子",
  spore: "胞子",
  prothallus: "前葉体",
  protonema: "原糸体",
  rootRhizoid: "仮根",
  rootTap: "主根（直根）",
  rootFibrous: "ひげ根",
  stemFern: "根茎／葉柄",
  stemMoss: "茎（維管束なし）",
  stem: "茎",
  leafFern: "羽状複葉",
  leaf: "葉",
  flower: "花",
  fruit: "果実（果皮に包まれる）",
  cone: "胞子葉球",
  seedNaked: "裸出種子",
  sorus: "胞子嚢群",
  capsule: "蒴（胞子体）",
};

const ANCHORS_I18N: Record<Exclude<Lang, "zh">, Record<string, string>> = {
  en: ANCHOR_EN,
  ja: ANCHOR_JA,
};

export function anchorText(anchor: Anchor, lang: Lang): { label: string; sub: string } {
  if (lang === "zh") return { label: anchor.label, sub: anchor.sub };
  return { label: ANCHORS_I18N[lang][anchor.key] ?? anchor.label, sub: anchor.sub };
}
