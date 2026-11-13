import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "zh" | "en" | "ja";

export const LANG_KEY = "phytogenesis-lang";
export const LANGS: { id: Lang; label: string; full: string; htmlLang: string }[] = [
  { id: "zh", label: "中", full: "中文", htmlLang: "zh-CN" },
  { id: "en", label: "EN", full: "English", htmlLang: "en" },
  { id: "ja", label: "日", full: "日本語", htmlLang: "ja" },
];

const META: Record<Lang, { title: string; description: string }> = {
  zh: {
    title: "植物生成器 · PhytoGenesis — 基于分类学的三维植物形态发生",
    description:
      "依照植物分类学检索表（种子·果皮·叶脉·茎叶·根）生成三维植物，并演示种子—发芽—成长—开花—结实的生活史全过程。",
  },
  en: {
    title: "PhytoGenesis — Taxonomic 3D Plant Morphogenesis",
    description:
      "Generate 3D plants from a botanical taxonomic key (seed · pericarp · venation · stem & leaf · root) and watch the life cycle from seed to germination, growth, flowering and fruiting.",
  },
  ja: {
    title: "植物生成器 · PhytoGenesis — 分類学に基づく3D植物形態発生",
    description:
      "植物分類学の検索表（種子・果皮・葉脈・茎葉・根）に従って3D植物を生成し、種子から発芽・成長・開花・結実までの生活史を再現します。",
  },
};

export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "zh" || saved === "en" || saved === "ja") return saved;
  } catch {
    /* localStorage 不可用时退回浏览器语言 */
  }
  const list = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const raw of list) {
    const l = (raw ?? "").toLowerCase();
    if (l.startsWith("zh")) return "zh";
    if (l.startsWith("ja")) return "ja";
    if (l.startsWith("en")) return "en";
  }
  return "zh";
}

const zh = {
  /* ---------- 页首 ---------- */
  appTitle: "植 物 生 成 器",
  appSubtitle: "基于分类学检索表的三维形态发生台 · THREE.JS",
  specimenNo: "标本号 {no}",
  reseed: "重新播种",
  randomize: "随机变异",
  viewportHint: "拖拽旋转 · 滚轮缩放 · 空格播放 · 1–5 跳转阶段 · R 随机",
  stageLatin: "STADIUM VITAE",

  /* ---------- 主题 ---------- */
  themeGroup: "配色模式",
  themeSystem: "跟随系统",
  themeLight: "日间",
  themeDark: "夜间",
  themeSystemTitle: "跟随系统配色",
  themeLightTitle: "日间配色",
  themeDarkTitle: "夜间配色",

  /* ---------- 语言 ---------- */
  langGroup: "语言",

  /* ---------- 检索表 ---------- */
  keyTitle: "分 类 检 索 表",
  keyLatin: "Clavis diagnostica",
  resultLabel: "RESULT",
  row1: "植物体产生种子，以种子繁殖",
  row1b: "植物体不产生种子，以孢子繁殖",
  row2: "种子有果皮包被，具真正的花与果实",
  row2b: "种子裸露于种鳞，无果皮、无真花",
  row3: "叶脉网状，胚具 2 枚子叶，直根系",
  row3b: "叶脉平行，胚具 1 枚子叶，须根系",
  row4: "植物体有茎、叶的分化",
  row4b: "无根茎叶分化，植物体为叶状体",
  row5: "有真正的根与维管组织，叶背生孢子囊群",
  row5b: "无真根，仅具假根，无维管组织",
  groupGymno: "裸子植物门",
  groupDicot: "双子叶植物纲",
  groupMono: "单子叶植物纲",
  groupAlgae: "藻类植物",
  groupFern: "蕨类植物门",
  groupMoss: "苔藓植物门",

  /* ---------- 器官面板 · 标签页 ---------- */
  tabHabit: "株型",
  tabLeaf: "叶",
  tabRepro: "繁殖器官",
  tabSite: "生境",

  /* ---------- 株型 ---------- */
  habitTitle: "生长习性与分枝",
  heightLabel: "株高",
  stemThickness: "茎粗",
  woodiness: "木质化程度",
  stemColor: "茎色",
  herb: "草本",
  subshrub: "亚灌木",
  shrub: "灌木",
  tree: "乔木",
  phyllotaxisTitle: "叶序与节数",
  leavesPerShoot: "每枝叶片数",
  monocotLeafNote: "单子叶植物叶片常二列互生、基部具叶鞘抱茎，叶脉平行至叶尖。",
  thallusTitle: "藻体形态",
  thallusSize: "藻体大小",
  algaeHabitNote: "藻类为低等植物：无根、茎、叶分化，无维管组织，全体细胞均可光合作用。",

  /* ---------- 叶 ---------- */
  leafShapeTitle: "叶形",
  leafMarginTitle: "叶缘与裂刻",
  entire: "全缘",
  lobes3: "3 裂",
  lobes5: "5 裂",
  lobes7: "7 裂",
  lobeDepth: "裂刻深度",
  leafLength: "叶片长",
  leafWidth: "叶片宽",
  leafCurl: "叶面卷曲",
  leafDroop: "先端下垂",
  leafColorTitle: "叶色",
  leafBaseColor: "叶基色",
  leafTipColor: "叶尖色",
  venationLabel: "叶脉：",
  venParallelMono: "平行脉（单子叶）",
  venReticDicot: "网状脉（双子叶）",
  venGymno: "单脉／平行脉（裸子）",
  venFern: "网状脉（蕨类）",
  venationTail: " —— 由检索表决定，纹理实时生成于叶面。",
  noLeavesTitle: "藻类植物无叶的分化。",
  noLeavesBody:
    "植物体为叶状体（thallus），可在「株型」页调整藻体形态与大小；色素体形态因类群而异（如水绵的螺旋带状叶绿体）。",

  /* ---------- 繁殖器官 ---------- */
  corollaTitle: "花冠类型",
  petalCount: "花瓣／花被片数",
  countUnit: " 枚",
  flowerBaseLabel: "花部基数：",
  monoBase: "3 基数（单子叶）",
  dicotBase: "4–5 基数（双子叶）",
  flowerBaseTail: "，与叶脉、子叶数共同构成分类依据。",
  petalTitle: "花瓣形态与花色",
  flowerDiameter: "花径",
  stamenCount: "雄蕊数",
  petalColor: "花瓣色",
  petalTipColor: "瓣尖色",
  centerColor: "花心／花药",
  fruitTitle: "果实（果皮包被种子）",
  fruitDiameter: "果径",
  ripeFruitColor: "成熟果色",
  fruitDynamicsTitle: "结实期动态",
  fruitNoteLead:
    "被子植物**不产生孢子**：花粉只在**开花期**由花药散出；进入**结实期**后，种子始终由**果皮**包被 —— ",
  fruitNoteCapsule: "当前为[[开裂干果]]，成熟时果瓣张开、弹出种子（可见种子旋落）。",
  fruitNoteNut: "当前为[[颖果／瘦果]]，果皮与种皮愈合、不开裂，整粒随风或动物带走。",
  fruitNoteFleshy: "当前为[[肉质果]]，成熟时转色变亮，借动物取食传播，不散出任何微粒。",
  coneTitle: "孢子叶球与球果",
  coneSize: "球果大小",
  coneScaleColor: "种鳞色",
  coneNote:
    "裸子植物**无真正的花与果实**：球花期雄球花散出花粉（风媒），花粉直落裸露胚珠；球果期种鳞木质化张开，__具翅种子旋落__—— 种子裸露、始终没有果皮包被，这与被子植物截然不同。",
  sorusTitle: "孢子囊群",
  sorusColor: "孢子囊群色",
  pinnaCount: "羽片数量",
  pinnaUnit: " 对",
  sorusNote:
    "蕨类以**孢子**繁殖：叶背边缘着生孢子囊群，成熟时囊群弹散孢子；孢子萌发为心形**原叶体**（配子体），受精后发育为新孢子体。",
  capsuleTitle: "孢蒴（孢子体）",
  capsuleColor: "孢蒴色",
  tuftDensity: "株丛密度",
  leafUnit: " 枚叶",
  capsuleNote:
    "苔藓的**孢子体**（蒴柄＋孢蒴）寄生于绿色配子体上，不能独立生活；孢蒴成熟后蒴盖脱落，借齿列弹散孢子。无真根，仅有**假根**固着。",
  algaeReproTitle: "生殖",
  algaeReproNote:
    "藻类生殖器官多为**单细胞**，合子不形成胚而直接萌发为新一代藻体；游动孢子具鞭毛，可在水中游动。成熟阶段可见顶端孢子囊放散孢子。",

  /* ---------- 生境 ---------- */
  lightTitle: "光照",
  dawn: "晨光",
  noon: "正午",
  dusk: "黄昏",
  substrateTitle: "基质",
  soil: "土壤",
  rock: "岩面",
  water: "水体",
  substrateNoteAlgae: "藻类需生活于水中；建议基质设为「水体」。",
  substrateNoteMoss: "苔藓与蕨类的受精过程离不开水，喜阴湿环境。",
  substrateNoteSeed: "种子植物的受精已摆脱对水的依赖，可分布于干旱环境。",
  dynamicsTitle: "动态",
  windLabel: "风力",
  autoRotate: "自动旋转",
  organLabels: "器官标注",

  /* ---------- 时间轴 ---------- */
  pause: "暂停",
  play: "播放",
  loop: "循环",
  loopTitle: "循环播放生活史",
  speed: "速度",

  /* ---------- 控件 ---------- */
  customColor: "自定义{label}",
} as const;

type Key = keyof typeof zh;
export type MessageKey = Key;

const en: Record<Key, string> = {
  appTitle: "PLANT GENERATOR",
  appSubtitle: "A 3D morphogenesis studio driven by taxonomic keys · THREE.JS",
  specimenNo: "Specimen No. {no}",
  reseed: "Reseed",
  randomize: "Randomize",
  viewportHint: "Drag to orbit · Scroll to zoom · Space to play · 1–5 to jump · R to randomize",
  stageLatin: "STADIUM VITAE",

  themeGroup: "Color scheme",
  themeSystem: "System",
  themeLight: "Light",
  themeDark: "Dark",
  themeSystemTitle: "Follow system color scheme",
  themeLightTitle: "Light color scheme",
  themeDarkTitle: "Dark color scheme",

  langGroup: "Language",

  keyTitle: "TAXONOMIC KEY",
  keyLatin: "Clavis diagnostica",
  resultLabel: "RESULT",
  row1: "Plant body produces seeds and reproduces by seeds",
  row1b: "Plant body does not produce seeds; reproduces by spores",
  row2: "Seeds enclosed by a pericarp; true flowers and fruits present",
  row2b: "Seeds exposed on seed scales; no pericarp, no true flowers",
  row3: "Reticulate venation; embryo with 2 cotyledons; taproot",
  row3b: "Parallel venation; embryo with 1 cotyledon; fibrous roots",
  row4: "Plant body has differentiated stems and leaves",
  row4b: "No root, stem or leaf differentiation; body is a thallus",
  row5: "True roots and vascular tissue; sori on the underside of fronds",
  row5b: "No true roots, only rhizoids; no vascular tissue",
  groupGymno: "Gymnosperms",
  groupDicot: "Dicotyledons",
  groupMono: "Monocotyledons",
  groupAlgae: "Algae",
  groupFern: "Ferns",
  groupMoss: "Mosses",

  tabHabit: "Habit",
  tabLeaf: "Leaf",
  tabRepro: "Reproduction",
  tabSite: "Habitat",

  habitTitle: "Growth habit & branching",
  heightLabel: "Height",
  stemThickness: "Stem diameter",
  woodiness: "Woodiness",
  stemColor: "Stem color",
  herb: "Herbaceous",
  subshrub: "Subshrub",
  shrub: "Shrub",
  tree: "Tree",
  phyllotaxisTitle: "Phyllotaxy & node count",
  leavesPerShoot: "Leaves per shoot",
  monocotLeafNote:
    "Monocot leaves are often distichous and alternate, with a sheath clasping the stem; veins run parallel to the tip.",
  thallusTitle: "Thallus form",
  thallusSize: "Thallus size",
  algaeHabitNote:
    "Algae are lower plants: no root, stem or leaf differentiation, no vascular tissue, and every cell can photosynthesize.",

  leafShapeTitle: "Leaf shape",
  leafMarginTitle: "Margin & lobing",
  entire: "Entire",
  lobes3: "3-lobed",
  lobes5: "5-lobed",
  lobes7: "7-lobed",
  lobeDepth: "Sinus depth",
  leafLength: "Leaf length",
  leafWidth: "Leaf width",
  leafCurl: "Leaf curl",
  leafDroop: "Tip droop",
  leafColorTitle: "Leaf color",
  leafBaseColor: "Base color",
  leafTipColor: "Tip color",
  venationLabel: "Venation: ",
  venParallelMono: "parallel (monocot)",
  venReticDicot: "reticulate (dicot)",
  venGymno: "single / parallel (gymnosperm)",
  venFern: "reticulate (fern)",
  venationTail: " — determined by the taxonomic key; the texture is generated on the leaf surface in real time.",
  noLeavesTitle: "Algae have no differentiated leaves.",
  noLeavesBody:
    "The plant body is a thallus. Adjust its form and size on the Habit tab; plastid shape varies by group (for example, the spiral chloroplasts of Spirogyra).",

  corollaTitle: "Corolla type",
  petalCount: "Petals / tepals",
  countUnit: "",
  flowerBaseLabel: "Floral merosity: ",
  monoBase: "3-merous (monocot)",
  dicotBase: "4–5-merous (dicot)",
  flowerBaseTail: ", which together with venation and cotyledon number forms the classification basis.",
  petalTitle: "Petal shape & color",
  flowerDiameter: "Flower diameter",
  stamenCount: "Stamens",
  petalColor: "Petal color",
  petalTipColor: "Petal tip color",
  centerColor: "Center / anthers",
  fruitTitle: "Fruit (seed enclosed by pericarp)",
  fruitDiameter: "Fruit diameter",
  ripeFruitColor: "Ripe fruit color",
  fruitDynamicsTitle: "Fruiting dynamics",
  fruitNoteLead:
    "Angiosperms **do not produce spores**: pollen is shed from anthers only during **flowering**. In the **fruiting** stage the seed remains enclosed by the **pericarp** — ",
  fruitNoteCapsule: "the current fruit is a [[dry dehiscent fruit]]; at maturity the valves open and eject seeds (visible as they spiral down).",
  fruitNoteNut: "the current fruit is a [[caryopsis / achene]]; pericarp and seed coat are fused and do not open, so the whole grain is carried by wind or animals.",
  fruitNoteFleshy: "the current fruit is [[fleshy]]; it brightens at maturity and is dispersed by animals feeding on it, releasing no particles.",
  coneTitle: "Strobili & cones",
  coneSize: "Cone size",
  coneScaleColor: "Seed-scale color",
  coneNote:
    "Gymnosperms **have no true flowers or fruits**: during the strobilus stage male cones shed pollen (wind-borne) that lands directly on naked ovules; at the cone stage the seed scales lignify and open, and __winged seeds spiral down__ — the seeds stay naked and are never enclosed by a pericarp, unlike angiosperms.",
  sorusTitle: "Sori",
  sorusColor: "Sorus color",
  pinnaCount: "Pinnae",
  pinnaUnit: "",
  sorusNote:
    "Ferns reproduce by **spores**: sori sit along the underside margins of fronds and burst to release spores at maturity. Spores germinate into a heart-shaped **prothallus** (gametophyte), which after fertilization grows into a new sporophyte.",
  capsuleTitle: "Capsule (sporophyte)",
  capsuleColor: "Capsule color",
  tuftDensity: "Cushion density",
  leafUnit: " leaves",
  capsuleNote:
    "The moss **sporophyte** (seta + capsule) is parasitic on the green gametophyte and cannot live independently. When the capsule matures the operculum falls and peristome teeth flick the spores out. There are no true roots, only **rhizoids** for anchorage.",
  algaeReproTitle: "Reproduction",
  algaeReproNote:
    "Algal reproductive organs are mostly **unicellular**; the zygote forms no embryo and germinates directly into a new thallus. Zoospores bear flagella and swim in water. In the mature stage, apical sporangia release spores.",

  lightTitle: "Light",
  dawn: "Dawn",
  noon: "Noon",
  dusk: "Dusk",
  substrateTitle: "Substrate",
  soil: "Soil",
  rock: "Rock",
  water: "Water",
  substrateNoteAlgae: "Algae must live in water; setting the substrate to Water is recommended.",
  substrateNoteMoss: "Fertilization in mosses and ferns requires water; both favor damp, shaded habitats.",
  substrateNoteSeed: "Seed plants have freed fertilization from water and can occupy dry habitats.",
  dynamicsTitle: "Dynamics",
  windLabel: "Wind",
  autoRotate: "Auto-rotate",
  organLabels: "Organ labels",

  pause: "Pause",
  play: "Play",
  loop: "Loop",
  loopTitle: "Loop the life cycle",
  speed: "Speed",

  customColor: "Custom {label}",
};

const ja: Record<Key, string> = {
  appTitle: "植 物 生 成 器",
  appSubtitle: "分類学的検索表による3D形態発生スタジオ · THREE.JS",
  specimenNo: "標本番号 {no}",
  reseed: "再播種",
  randomize: "ランダム変異",
  viewportHint: "ドラッグで回転 · ホイールで拡大 · スペースで再生 · 1–5 で段階移動 · R でランダム",
  stageLatin: "STADIUM VITAE",

  themeGroup: "配色モード",
  themeSystem: "システム",
  themeLight: "ライト",
  themeDark: "ダーク",
  themeSystemTitle: "システム配色に従う",
  themeLightTitle: "ライト配色",
  themeDarkTitle: "ダーク配色",

  langGroup: "言語",

  keyTitle: "分 類 検 索 表",
  keyLatin: "Clavis diagnostica",
  resultLabel: "RESULT",
  row1: "植物体は種子をつくり、種子で繁殖する",
  row1b: "植物体は種子をつくらず、胞子で繁殖する",
  row2: "種子は果皮に包まれ、真の花と果実をもつ",
  row2b: "種子は種鱗上に裸出し、果皮も真の花もない",
  row3: "葉脈は網状、胚に子葉2枚、直根系",
  row3b: "葉脈は平行、胚に子葉1枚、ひげ根系",
  row4: "植物体に茎と葉の分化がある",
  row4b: "根・茎・葉の分化がなく、体は葉状体",
  row5: "真の根と維管組織があり、葉裏に胞子嚢群をつける",
  row5b: "真の根はなく仮根のみ、維管組織なし",
  groupGymno: "裸子植物門",
  groupDicot: "双子葉植物綱",
  groupMono: "単子葉植物綱",
  groupAlgae: "藻類植物",
  groupFern: "シダ植物門",
  groupMoss: "コケ植物門",

  tabHabit: "株型",
  tabLeaf: "葉",
  tabRepro: "繁殖器官",
  tabSite: "生息地",

  habitTitle: "成長習性と分枝",
  heightLabel: "草丈",
  stemThickness: "茎の太さ",
  woodiness: "木質化度",
  stemColor: "茎の色",
  herb: "草本",
  subshrub: "亜低木",
  shrub: "低木",
  tree: "高木",
  phyllotaxisTitle: "葉序と節数",
  leavesPerShoot: "枝あたりの葉数",
  monocotLeafNote: "単子葉植物の葉はしばしば二列互生で、基部の葉鞘が茎を抱き、葉脈は葉先まで平行に走る。",
  thallusTitle: "藻体の形態",
  thallusSize: "藻体の大きさ",
  algaeHabitNote: "藻類は下等植物で、根・茎・葉の分化も維管組織もなく、すべての細胞が光合成できる。",

  leafShapeTitle: "葉形",
  leafMarginTitle: "葉縁と裂刻",
  entire: "全縁",
  lobes3: "3裂",
  lobes5: "5裂",
  lobes7: "7裂",
  lobeDepth: "裂刻の深さ",
  leafLength: "葉身長",
  leafWidth: "葉幅",
  leafCurl: "葉の巻き",
  leafDroop: "先端の垂れ",
  leafColorTitle: "葉色",
  leafBaseColor: "基本色",
  leafTipColor: "先端色",
  venationLabel: "葉脈：",
  venParallelMono: "平行脈（単子葉）",
  venReticDicot: "網状脈（双子葉）",
  venGymno: "単脈／平行脈（裸子）",
  venFern: "網状脈（シダ）",
  venationTail: " —— 検索表により決まり、テクスチャは葉面にリアルタイム生成される。",
  noLeavesTitle: "藻類には葉の分化がない。",
  noLeavesBody:
    "植物体は葉状体（タラス）で、「株型」タブで藻体の形態と大きさを調整できる。色素体の形は類群により異なる（例：アオミドロの螺旋状葉緑体）。",

  corollaTitle: "花冠の型",
  petalCount: "花弁／花被片数",
  countUnit: " 枚",
  flowerBaseLabel: "花部基数：",
  monoBase: "3基数（単子葉）",
  dicotBase: "4–5基数（双子葉）",
  flowerBaseTail: "。葉脈や子葉数とともに分類の根拠となる。",
  petalTitle: "花弁の形と花色",
  flowerDiameter: "花径",
  stamenCount: "雄蕊数",
  petalColor: "花弁色",
  petalTipColor: "花弁先端色",
  centerColor: "花心／葯",
  fruitTitle: "果実（果皮に包まれた種子）",
  fruitDiameter: "果径",
  ripeFruitColor: "成熟果色",
  fruitDynamicsTitle: "結実期の動態",
  fruitNoteLead:
    "被子植物は**胞子をつくらない**：花粉は**開花期**にのみ葯から放出される。**結実期**に入ると、種子は常に**果皮**に包まれる —— ",
  fruitNoteCapsule: "現在は[[裂開する乾果]]で、熟すと果弁が開いて種子を弾き出す（種子が旋回して落ちるのが見える）。",
  fruitNoteNut: "現在は[[穎果／痩果]]で、果皮と種皮が癒合して裂開せず、粒ごと風や動物に運ばれる。",
  fruitNoteFleshy: "現在は[[肉質果]]で、熟すと色づいて明るくなり、動物に食べられて散布される。微粒子は放出しない。",
  coneTitle: "胞子葉球と球果",
  coneSize: "球果の大きさ",
  coneScaleColor: "種鱗の色",
  coneNote:
    "裸子植物は**真の花も果実ももたない**：球花期には雄球花が花粉を放出し（風媒）、花粉は裸出胚珠に直接落ちる。球果期には種鱗が木質化して開き、__翼のある種子が旋回しながら落ちる__——種子は裸出のままで果皮に包まれない。これは被子植物と大きく異なる。",
  sorusTitle: "胞子嚢群",
  sorusColor: "胞子嚢群の色",
  pinnaCount: "羽片数",
  pinnaUnit: " 対",
  sorusNote:
    "シダは**胞子**で繁殖する：葉裏の縁に胞子嚢群がつき、熟すと弾けて胞子を散らす。胞子は発芽して心形の**前葉体**（配偶体）となり、受精後に新しい胞子体へ育つ。",
  capsuleTitle: "蒴（胞子体）",
  capsuleColor: "蒴の色",
  tuftDensity: "株密度",
  leafUnit: " 枚の葉",
  capsuleNote:
    "コケの**胞子体**（蒴柄＋蒴）は緑色の配偶体に寄生し、独立生活できない。蒴が熟すと蒴蓋が外れ、蒴歯が胞子を弾き出す。真の根はなく、**仮根**で固着する。",
  algaeReproTitle: "生殖",
  algaeReproNote:
    "藻類の生殖器官は主に**単細胞**で、接合子は胚をつくらず直接発芽して新しい藻体となる。遊走子は鞭毛をもち水中を泳ぐ。成熟段階では頂端の胞子嚢が胞子を放出する。",

  lightTitle: "光照",
  dawn: "朝",
  noon: "正午",
  dusk: "夕暮れ",
  substrateTitle: "基質",
  soil: "土壌",
  rock: "岩面",
  water: "水中",
  substrateNoteAlgae: "藻類は水中で生活する必要がある。「水中」を推奨。",
  substrateNoteMoss: "コケとシダの受精には水が必要で、陰湿な環境を好む。",
  substrateNoteSeed: "種子植物の受精は水への依存から解放され、乾燥地にも分布できる。",
  dynamicsTitle: "動態",
  windLabel: "風力",
  autoRotate: "自動回転",
  organLabels: "器官ラベル",

  pause: "一時停止",
  play: "再生",
  loop: "ループ",
  loopTitle: "生活史をループ再生",
  speed: "速度",

  customColor: "{label}をカスタム",
};

const DICT: Record<Lang, Record<Key, string>> = { zh, en, ja };

export type TFn = (key: Key, vars?: Record<string, string | number>) => string;

type I18nValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TFn;
};

const I18nContext = createContext<I18nValue | null>(null);

function applyLang(lang: Lang) {
  const meta = LANGS.find((l) => l.id === lang) ?? LANGS[0];
  document.documentElement.lang = meta.htmlLang;
  document.title = META[lang].title;
  document.querySelector('meta[name="description"]')?.setAttribute("content", META[lang].description);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  useEffect(() => {
    applyLang(lang);
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* 忽略写入失败 */
    }
  }, [lang]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);

  const t = useCallback<TFn>(
    (key, vars) => {
      let out: string = DICT[lang][key] ?? DICT.zh[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) out = out.replace(`{${k}}`, String(v));
      }
      return out;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

/* ------------------------------------------------------------------
   轻量富文本：**主色加粗** / __琥珀加粗__ / [[叶色加粗]]
------------------------------------------------------------------ */
export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__|\[\[[^\]]+\]\])/g).filter(Boolean);
  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**"))
          return (
            <b key={i} className="font-semibold text-moss-200">
              {p.slice(2, -2)}
            </b>
          );
        if (p.startsWith("__") && p.endsWith("__"))
          return (
            <b key={i} className="font-semibold text-amber-signal/90">
              {p.slice(2, -2)}
            </b>
          );
        if (p.startsWith("[[") && p.endsWith("]]"))
          return (
            <b key={i} className="font-semibold text-leaf-300">
              {p.slice(2, -2)}
            </b>
          );
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
}
