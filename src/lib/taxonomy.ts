/* ------------------------------------------------------------------
   植物分类学核心：二歧检索表、类群特征、生活史阶段、参数默认值
------------------------------------------------------------------ */

export type Venation = "reticulate" | "parallel";
export type Phyllotaxy = "alternate" | "opposite" | "whorled" | "basal";
export type Habit = "erect" | "rosette" | "tufted" | "branched" | "climbing";
export type LeafShape =
  | "ovate"
  | "lanceolate"
  | "elliptic"
  | "obovate"
  | "cordate"
  | "linear"
  | "needle"
  | "fan"
  | "palmate";
export type Corolla = "separate" | "fused" | "composite";
export type Inflorescence = "solitary" | "raceme" | "umbel" | "spike";
export type FruitType =
  | "berry"
  | "drupe"
  | "pome"
  | "capsule"
  | "legume"
  | "aggregate"
  | "nut";
export type ThallusForm = "filament" | "sheet" | "branched";
export type LightPreset = "dawn" | "noon" | "dusk";

export type PlantParams = {
  /* 检索表 */
  hasSeed: boolean;
  hasFruit: boolean;
  venation: Venation;
  hasStemLeaf: boolean;
  hasRoot: boolean;
  seed: number;

  /* 株型 */
  habit: Habit;
  height: number;
  thickness: number;
  woodiness: number;
  stemColor: string;
  nodeCount: number;
  phyllotaxy: Phyllotaxy;

  /* 叶 */
  leafShape: LeafShape;
  leafLobes: number;
  lobeDepth: number;
  leafLength: number;
  leafWidth: number;
  leafCurl: number;
  leafDroop: number;
  leafColor: string;
  leafTipColor: string;

  /* 花（被子植物） */
  petalShape: LeafShape;
  petalCount: number;
  corolla: Corolla;
  flowerSize: number;
  petalColor: string;
  petalColor2: string;
  centerColor: string;
  stamenCount: number;
  inflorescence: Inflorescence;

  /* 果实（被子植物） */
  fruitType: FruitType;
  fruitColor: string;
  fruitSize: number;
  fruitCount: number;

  /* 裸子植物 · 蕨类 · 苔藓 · 藻类 */
  coneSize: number;
  coneColor: string;
  sorusColor: string;
  capsuleColor: string;
  thallusForm: ThallusForm;

  /* 生境 */
  wind: number;
  autoRotate: boolean;
  showLabels: boolean;
  light: LightPreset;
  ground: "soil" | "water" | "rock";
};

export type GroupId =
  | "angio-dicot"
  | "angio-mono"
  | "gymno"
  | "fern"
  | "moss"
  | "algae";

export type PlantGroup = {
  id: GroupId;
  division: string;
  divisionLatin: string;
  klass?: string;
  klassLatin?: string;
  headline: string;
  blurb: string;
  repro: string;
  traits: { k: string; v: string }[];
  caps: {
    seed: boolean;
    trueFlower: boolean;
    fruit: boolean;
    cone: boolean;
    sorus: boolean;
    capsule: boolean;
    leaves: boolean;
    trueRoot: boolean;
    vascular: boolean;
    cotyledon: 0 | 1 | 2 | null;
  };
  stages: { name: string; latin: string; desc: string }[];
  presets: Partial<PlantParams>[];
};

export const GROUPS: Record<GroupId, PlantGroup> = {
  "angio-dicot": {
    id: "angio-dicot",
    division: "被子植物门",
    divisionLatin: "Angiospermae",
    klass: "双子叶植物纲",
    klassLatin: "Dicotyledoneae",
    headline: "种子有果皮包被 · 网状脉",
    blurb:
      "胚珠藏于子房内，受精后子房发育为果实。胚具两片子叶，叶脉网状分枝，维管束成环状排列并有形成层，故能次生增粗。",
    repro: "双受精 · 虫媒／风媒传粉 · 果实保护并传播种子",
    traits: [
      { k: "种子", v: "有，包被于果皮内" },
      { k: "子叶", v: "2 枚" },
      { k: "叶脉", v: "网状脉" },
      { k: "根系", v: "直根系（主根发达）" },
      { k: "花部", v: "4 或 5 基数" },
      { k: "维管束", v: "环状排列 · 有形成层" },
      { k: "胚乳", v: "多被吸收，子叶肥大" },
    ],
    caps: {
      seed: true,
      trueFlower: true,
      fruit: true,
      cone: false,
      sorus: false,
      capsule: false,
      leaves: true,
      trueRoot: true,
      vascular: true,
      cotyledon: 2,
    },
    stages: [
      { name: "种子", latin: "Semen", desc: "种皮包被胚与胚乳，处于休眠" },
      { name: "萌发", latin: "Germinatio", desc: "胚根突破种皮，子叶出土" },
      { name: "营养生长", latin: "Vegetatio", desc: "茎伸长、网状脉叶片展开" },
      { name: "开花", latin: "Anthesis", desc: "花冠展开，花药散出花粉（花粉粒即雄配子体）" },
      { name: "结实", latin: "Fructus", desc: "子房膨大为果实，果皮包被种子——不散出孢子；开裂干果弹出种子，肉质果转色待动物传播" },
    ],
    presets: [
      { leafShape: "cordate", petalCount: 5, corolla: "separate", fruitType: "berry", habit: "branched" },
      { leafShape: "ovate", petalCount: 4, corolla: "separate", fruitType: "legume", habit: "erect" },
      { leafShape: "palmate", petalCount: 5, corolla: "separate", fruitType: "aggregate", habit: "branched" },
    ],
  },
  "angio-mono": {
    id: "angio-mono",
    division: "被子植物门",
    divisionLatin: "Angiospermae",
    klass: "单子叶植物纲",
    klassLatin: "Monocotyledoneae",
    headline: "种子有果皮包被 · 平行脉",
    blurb:
      "胚仅一枚子叶，叶片主脉平行排列直至叶尖，维管束散生无形成层，故茎不能持续增粗；花部多为 3 基数，根系为须根系。",
    repro: "双受精 · 常风媒（禾本科）或虫媒 · 颖果／浆果",
    traits: [
      { k: "种子", v: "有，包被于果皮内" },
      { k: "子叶", v: "1 枚" },
      { k: "叶脉", v: "平行脉" },
      { k: "根系", v: "须根系（不定根丛生）" },
      { k: "花部", v: "3 基数" },
      { k: "维管束", v: "散生 · 无形成层" },
      { k: "叶基", v: "常具叶鞘抱茎" },
    ],
    caps: {
      seed: true,
      trueFlower: true,
      fruit: true,
      cone: false,
      sorus: false,
      capsule: false,
      leaves: true,
      trueRoot: true,
      vascular: true,
      cotyledon: 1,
    },
    stages: [
      { name: "种子", latin: "Semen", desc: "颖果状，果皮与种皮愈合" },
      { name: "萌发", latin: "Germinatio", desc: "单子叶出土，胚根生出须根" },
      { name: "营养生长", latin: "Vegetatio", desc: "叶鞘抱茎，平行脉叶片抽出" },
      { name: "开花", latin: "Anthesis", desc: "花序抽出，3 基数小花开放，花药散出花粉" },
      { name: "结实", latin: "Fructus", desc: "果实成熟，颖果的果皮与种皮愈合——种子始终由果皮包被，不散出孢子" },
    ],
    presets: [
      { leafShape: "linear", petalCount: 3, corolla: "separate", fruitType: "nut", habit: "tufted", inflorescence: "spike" },
      { leafShape: "lanceolate", petalCount: 6, corolla: "separate", fruitType: "capsule", habit: "erect", inflorescence: "solitary" },
      { leafShape: "elliptic", petalCount: 3, corolla: "fused", fruitType: "berry", habit: "rosette", inflorescence: "umbel" },
    ],
  },
  gymno: {
    id: "gymno",
    division: "裸子植物门",
    divisionLatin: "Gymnospermae",
    klass: "松柏纲",
    klassLatin: "Pinopsida",
    headline: "有种子 · 无果皮包被",
    blurb:
      "胚珠裸露于孢子叶上，没有真正的花与果实；种子成熟后仍暴露于种鳞之间。孢子叶球单性，多为风媒传粉，叶常为针形、条形或鳞形，耐旱耐寒。",
    repro: "孢子叶球（球花）· 风媒传粉 · 种子裸露",
    traits: [
      { k: "种子", v: "有，裸露无果皮" },
      { k: "子叶", v: "多枚（2–18）" },
      { k: "叶形", v: "针形／条形／鳞形" },
      { k: "根系", v: "直根系，主根深扎" },
      { k: "花", v: "无真花，具孢子叶球" },
      { k: "果实", v: "无，球果由种鳞组成" },
      { k: "维管束", v: "环状 · 有形成层，木质部多无导管" },
    ],
    caps: {
      seed: true,
      trueFlower: false,
      fruit: false,
      cone: true,
      sorus: false,
      capsule: false,
      leaves: true,
      trueRoot: true,
      vascular: true,
      cotyledon: null,
    },
    stages: [
      { name: "种子", latin: "Semen", desc: "具翅的裸露种子，随风散布" },
      { name: "萌发", latin: "Germinatio", desc: "主根下扎，多枚子叶轮生展开" },
      { name: "营养生长", latin: "Vegetatio", desc: "针叶簇生，茎木质化增粗" },
      { name: "球花", latin: "Strobilus", desc: "雄球花散出大量花粉，随风飘至雌球花裸露的胚珠" },
      { name: "球果", latin: "Conus", desc: "种鳞木质化张开，具翅种子旋落——种子裸露，无果皮包被" },
    ],
    presets: [
      { leafShape: "needle", habit: "branched", coneSize: 1 },
      { leafShape: "linear", habit: "erect", coneSize: 0.8 },
      { leafShape: "fan", habit: "branched", coneSize: 0.6 },
    ],
  },
  fern: {
    id: "fern",
    division: "蕨类植物门",
    divisionLatin: "Pteridophyta",
    klass: "真蕨纲",
    klassLatin: "Polypodiopsida",
    headline: "无种子 · 有茎叶 · 有真根",
    blurb:
      "有根、茎、叶的分化与维管组织，但不产生种子，以孢子繁殖。孢子体发达，叶背生孢子囊群；萌发后先形成心形原叶体（配子体），受精后长出幼孢子体。",
    repro: "孢子繁殖 · 世代交替（孢子体占优势）· 受精需水",
    traits: [
      { k: "种子", v: "无" },
      { k: "繁殖", v: "孢子囊群（sorus）" },
      { k: "根", v: "真根，生于根状茎" },
      { k: "茎", v: "多为地下根状茎" },
      { k: "叶", v: "大型羽状复叶，幼叶拳卷" },
      { k: "维管组织", v: "有" },
      { k: "配子体", v: "心形原叶体，独立生活" },
    ],
    caps: {
      seed: false,
      trueFlower: false,
      fruit: false,
      cone: false,
      sorus: true,
      capsule: false,
      leaves: true,
      trueRoot: true,
      vascular: true,
      cotyledon: null,
    },
    stages: [
      { name: "孢子", latin: "Spora", desc: "单倍体孢子散落于阴湿处" },
      { name: "原叶体", latin: "Prothallium", desc: "孢子萌发为心形配子体" },
      { name: "幼孢子体", latin: "Sporophytum", desc: "受精后拳卷幼叶展开" },
      { name: "成体", latin: "Frond", desc: "羽状复叶完全展开，植株成熟" },
      { name: "散孢", latin: "Sporulatio", desc: "叶背孢子囊群成熟，环带断裂弹散孢子（无种子、无果皮）" },
    ],
    presets: [
      { leafShape: "lanceolate", nodeCount: 8 },
      { leafShape: "elliptic", nodeCount: 6, leafWidth: 0.22 },
      { leafShape: "ovate", nodeCount: 12, leafLength: 0.36 },
    ],
  },
  moss: {
    id: "moss",
    division: "苔藓植物门",
    divisionLatin: "Bryophyta",
    klass: "藓纲",
    klassLatin: "Bryopsida",
    headline: "无种子 · 有茎叶 · 无真根",
    blurb:
      "有茎叶分化但无维管组织，只有单细胞或单列细胞的假根。配子体发达并为绿色营养体，孢子体（蒴柄＋孢蒴）寄生于配子体上，不能独立生活。",
    repro: "孢子繁殖 · 世代交替（配子体占优势）· 受精需水",
    traits: [
      { k: "种子", v: "无" },
      { k: "根", v: "假根（rhizoid），无吸收组织分化" },
      { k: "茎叶", v: "有，但无维管束" },
      { k: "优势世代", v: "配子体" },
      { k: "孢子体", v: "蒴柄 + 孢蒴，寄生于配子体" },
      { k: "株高", v: "通常 < 10 cm" },
      { k: "生境", v: "阴湿，受精依赖水膜" },
    ],
    caps: {
      seed: false,
      trueFlower: false,
      fruit: false,
      cone: false,
      sorus: false,
      capsule: true,
      leaves: true,
      trueRoot: false,
      vascular: false,
      cotyledon: null,
    },
    stages: [
      { name: "孢子", latin: "Spora", desc: "孢子自蒴口散出，落于湿土" },
      { name: "原丝体", latin: "Protonema", desc: "萌发为丝状原丝体与假根" },
      { name: "配子体", latin: "Gametophytum", desc: "直立茎叶体丛生，顶端生生殖器官" },
      { name: "受精", latin: "Fecundatio", desc: "精子借水膜游至颈卵器" },
      { name: "孢蒴", latin: "Sporogonium", desc: "蒴柄伸长、蒴盖脱落，孢蒴经蒴齿弹散孢子" },
    ],
    presets: [
      { leafShape: "ovate", habit: "tufted", capsuleColor: "#a9743c" },
      { leafShape: "lanceolate", habit: "tufted", capsuleColor: "#8c5a33" },
    ],
  },
  algae: {
    id: "algae",
    division: "藻类植物",
    divisionLatin: "Algae",
    klass: "绿藻门",
    klassLatin: "Chlorophyta",
    headline: "无种子 · 无茎叶 · 无根",
    blurb:
      "低等植物，植物体无根、茎、叶的分化，也没有维管组织，称为叶状体（thallus）。全体细胞均能进行光合作用并产生配子或孢子，生殖器官多为单细胞，受精离不开水。",
    repro: "孢子／配子繁殖 · 无胚 · 世代交替多样",
    traits: [
      { k: "种子", v: "无" },
      { k: "根茎叶", v: "均无分化（叶状体）" },
      { k: "维管组织", v: "无" },
      { k: "生殖器官", v: "单细胞，无保护层" },
      { k: "胚", v: "无胚，合子直接萌发" },
      { k: "生境", v: "淡水／海水／潮湿土壤" },
      { k: "色素", v: "叶绿素 a、b，类胡萝卜素" },
    ],
    caps: {
      seed: false,
      trueFlower: false,
      fruit: false,
      cone: false,
      sorus: false,
      capsule: false,
      leaves: false,
      trueRoot: false,
      vascular: false,
      cotyledon: null,
    },
    stages: [
      { name: "游动孢子", latin: "Zoospora", desc: "具鞭毛的孢子在水中游动" },
      { name: "附着萌发", latin: "Germinatio", desc: "鞭毛脱落，固着并开始分裂" },
      { name: "营养生长", latin: "Vegetatio", desc: "细胞分裂，叶状体／丝状体伸长" },
      { name: "孢子囊", latin: "Sporangium", desc: "顶端细胞转化为生殖结构" },
      { name: "放散", latin: "Dispersio", desc: "孢子囊破裂，释放具鞭毛的游动孢子" },
    ],
    presets: [
      { thallusForm: "filament" },
      { thallusForm: "sheet" },
      { thallusForm: "branched" },
    ],
  },
};

export function classify(p: PlantParams): PlantGroup {
  if (p.hasSeed) {
    if (p.hasFruit) return p.venation === "parallel" ? GROUPS["angio-mono"] : GROUPS["angio-dicot"];
    return GROUPS.gymno;
  }
  if (!p.hasStemLeaf) return GROUPS.algae;
  if (p.hasRoot) return GROUPS.fern;
  return GROUPS.moss;
}

/* ---------------- 检索表（二歧）结构 ---------------- */
export type KeyNode = {
  id: string;
  question: string;
  latin?: string;
  hint?: string;
  options: { label: string; sub?: string; next: GroupId | KeyNode }[];
};

/* ---------------- 生活史阶段划分 ---------------- */
export const STAGE_RANGES: [number, number][] = [
  [0.0, 0.16],
  [0.16, 0.34],
  [0.34, 0.62],
  [0.62, 0.82],
  [0.82, 1.0],
];

export function stageIndex(g: number): number {
  for (let i = 0; i < STAGE_RANGES.length; i++) {
    if (g < STAGE_RANGES[i][1]) return i;
  }
  return 4;
}

/* ---------------- 参数默认值 ---------------- */
export const DEFAULT_PARAMS: PlantParams = {
  hasSeed: true,
  hasFruit: true,
  venation: "reticulate",
  hasStemLeaf: true,
  hasRoot: true,
  seed: 20260421,

  habit: "erect",
  height: 1,
  thickness: 0.5,
  woodiness: 0.25,
  stemColor: "#5f8f3f",
  nodeCount: 7,
  phyllotaxy: "alternate",

  leafShape: "ovate",
  leafLobes: 0,
  lobeDepth: 0.5,
  leafLength: 0.62,
  leafWidth: 0.5,
  leafCurl: 0.3,
  leafDroop: 0.25,
  leafColor: "#3f8a3c",
  leafTipColor: "#a9d055",

  petalShape: "ovate",
  petalCount: 5,
  corolla: "separate",
  flowerSize: 0.6,
  petalColor: "#f2b8c6",
  petalColor2: "#ffffff",
  centerColor: "#f2c14e",
  stamenCount: 8,
  inflorescence: "solitary",

  fruitType: "berry",
  fruitColor: "#d4402f",
  fruitSize: 0.6,
  fruitCount: 3,

  coneSize: 0.8,
  coneColor: "#8a6236",
  sorusColor: "#b5762c",
  capsuleColor: "#a9743c",
  thallusForm: "filament",

  wind: 0.5,
  autoRotate: false,
  showLabels: true,
  light: "noon",
  ground: "soil",
};

/* 依类群给出形态默认值，使生成结果符合分类学特征 */
export function groupDefaults(g: PlantGroup, i = 0): Partial<PlantParams> {
  const preset = g.presets[Math.min(i, g.presets.length - 1)] ?? {};
  switch (g.id) {
    case "angio-dicot":
      return {
        habit: "branched",
        phyllotaxy: "alternate",
        leafShape: "ovate",
        leafLobes: 0,
        leafLength: 0.6,
        leafWidth: 0.52,
        leafDroop: 0.22,
        petalCount: 5,
        corolla: "separate",
        inflorescence: "solitary",
        fruitType: "berry",
        ground: "soil",
        ...preset,
      };
    case "angio-mono":
      return {
        habit: "tufted",
        phyllotaxy: "alternate",
        leafShape: "linear",
        leafLength: 0.95,
        leafWidth: 0.16,
        leafDroop: 0.62,
        petalCount: 3,
        corolla: "separate",
        stamenCount: 6,
        inflorescence: "spike",
        fruitType: "nut",
        ground: "soil",
        ...preset,
      };
    case "gymno":
      return {
        habit: "branched",
        woodiness: 0.85,
        thickness: 0.75,
        stemColor: "#6b4b30",
        leafShape: "needle",
        leafLength: 0.34,
        leafWidth: 0.05,
        leafDroop: 0.1,
        phyllotaxy: "whorled",
        nodeCount: 12,
        ground: "soil",
        ...preset,
      };
    case "fern":
      return {
        habit: "rosette",
        phyllotaxy: "basal",
        leafShape: "lanceolate",
        leafLength: 0.5,
        leafWidth: 0.16,
        leafDroop: 0.5,
        nodeCount: 8,
        stemColor: "#4a6b32",
        woodiness: 0.1,
        ground: "soil",
        ...preset,
      };
    case "moss":
      return {
        habit: "tufted",
        height: 0.45,
        leafShape: "ovate",
        leafLength: 0.13,
        leafWidth: 0.07,
        nodeCount: 14,
        stemColor: "#6f8f45",
        leafColor: "#4e8f3a",
        woodiness: 0,
        ground: "rock",
        ...preset,
      };
    case "algae":
      return {
        habit: "erect",
        height: 0.8,
        thallusForm: "filament",
        ground: "water",
        leafColor: "#3f9e6b",
        ...preset,
      };
  }
}

export const LEAF_SHAPES: { id: LeafShape; name: string; latin: string }[] = [
  { id: "ovate", name: "卵形", latin: "ovatus" },
  { id: "lanceolate", name: "披针形", latin: "lanceolatus" },
  { id: "elliptic", name: "椭圆形", latin: "ellipticus" },
  { id: "obovate", name: "倒卵形", latin: "obovatus" },
  { id: "cordate", name: "心形", latin: "cordatus" },
  { id: "linear", name: "线形", latin: "linearis" },
  { id: "needle", name: "针形", latin: "acicularis" },
  { id: "fan", name: "扇形", latin: "flabellatus" },
  { id: "palmate", name: "掌状裂", latin: "palmatilobus" },
];

export const FRUIT_TYPES: { id: FruitType; name: string; latin: string; note: string }[] = [
  { id: "berry", name: "浆果", latin: "bacca", note: "果肉多汁，中内果皮肉质" },
  { id: "drupe", name: "核果", latin: "drupa", note: "外果皮薄，内果皮坚硬成核" },
  { id: "pome", name: "梨果", latin: "pomum", note: "花托与子房壁共同肉质化" },
  { id: "capsule", name: "蒴果", latin: "capsula", note: "干果，成熟开裂散出多数种子" },
  { id: "legume", name: "荚果", latin: "legumen", note: "单心皮，沿背腹两缝线开裂" },
  { id: "aggregate", name: "聚合果", latin: "apocarpium", note: "一朵花内多个离生心皮" },
  { id: "nut", name: "颖果／瘦果", latin: "caryopsis", note: "果皮与种皮愈合，不开裂" },
];

export const COROLLAS: { id: Corolla; name: string; latin: string }[] = [
  { id: "separate", name: "离瓣花冠", latin: "choripetalous" },
  { id: "fused", name: "合瓣花冠", latin: "sympetalous" },
  { id: "composite", name: "头状花序", latin: "capitulum" },
];

export const INFLORESCENCES: { id: Inflorescence; name: string; latin: string }[] = [
  { id: "solitary", name: "单生花", latin: "flos solitarius" },
  { id: "raceme", name: "总状花序", latin: "racemus" },
  { id: "umbel", name: "伞形花序", latin: "umbella" },
  { id: "spike", name: "穗状花序", latin: "spica" },
];

export const HABITS: { id: Habit; name: string; latin: string }[] = [
  { id: "erect", name: "直立", latin: "erectus" },
  { id: "rosette", name: "莲座／基生", latin: "rosulatus" },
  { id: "tufted", name: "丛生", latin: "caespitosus" },
  { id: "branched", name: "分枝", latin: "ramosus" },
  { id: "climbing", name: "攀援", latin: "scandens" },
];

export const PHYLLOTAXY: { id: Phyllotaxy; name: string; latin: string }[] = [
  { id: "alternate", name: "互生", latin: "alterna" },
  { id: "opposite", name: "对生", latin: "opposita" },
  { id: "whorled", name: "轮生", latin: "verticillata" },
  { id: "basal", name: "基生", latin: "basalia" },
];

export const THALLUS: { id: ThallusForm; name: string; latin: string }[] = [
  { id: "filament", name: "丝状体", latin: "filamentum" },
  { id: "sheet", name: "叶状体／膜状", latin: "thallus" },
  { id: "branched", name: "分枝管状", latin: "ramulosus" },
];

/* ---------------- 伪学名生成（趣味） ---------------- */
const GENUS: Record<GroupId, string[]> = {
  "angio-dicot": ["Rosa", "Quercus", "Prunus", "Camellia", "Acer", "Fragaria"],
  "angio-mono": ["Festuca", "Lilium", "Iris", "Bambusa", "Tulipa", "Oryza"],
  gymno: ["Pinus", "Ginkgo", "Cycas", "Abies", "Sequoia", "Podocarpus"],
  fern: ["Pteridium", "Polypodium", "Adiantum", "Nephrolepis", "Cyathea", "Osmunda"],
  moss: ["Polytrichum", "Sphagnum", "Bryum", "Funaria", "Hypnum", "Marchantia"],
  algae: ["Spirogyra", "Ulva", "Cladophora", "Chara", "Chlorella", "Volvox"],
};

const EPITHET: { re: (p: PlantParams, g: PlantGroup) => boolean; word: string }[] = [
  { re: (p) => p.leafShape === "needle", word: "acicularis" },
  { re: (p) => p.leafShape === "fan", word: "flabellata" },
  { re: (p) => p.leafShape === "palmate", word: "palmata" },
  { re: (p) => p.leafShape === "linear", word: "graminifolia" },
  { re: (p) => p.leafShape === "cordate", word: "cordifolia" },
  { re: (p, g) => g.caps.fruit && p.fruitType === "berry", word: "baccifera" },
  { re: (p, g) => g.caps.fruit && p.fruitType === "legume", word: "leguminosa" },
  { re: (p) => p.petalCount >= 8, word: "multipetala" },
  { re: (p) => p.habit === "climbing", word: "scandens" },
  { re: (p) => p.habit === "rosette", word: "rosulata" },
];

export function binomial(p: PlantParams, g: PlantGroup) {
  const list = GENUS[g.id];
  const genus = list[p.seed % list.length];
  let epithet = "vulgaris";
  for (const e of EPITHET) {
    if (e.re(p, g)) {
      epithet = e.word;
      break;
    }
  }
  if ((p.seed >> 3) % 3 === 0) epithet = epithet.replace(/a$/, "a");
  return `${genus} ${epithet}`;
}

export function specimenNo(seed: number) {
  return `HB-${String(Math.abs(seed) % 9000 + 1000)}-${String(
    (Math.abs(seed) >> 4) % 90 + 10,
  )}`;
}
