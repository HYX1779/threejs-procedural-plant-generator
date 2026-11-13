import * as THREE from "three";

/* ------------------ 颜色小工具 ------------------ */
export function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16,
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbToHex(r: number, g: number, b: number) {
  const c = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}
export function mix(a: string, b: string, t: number) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(
    r1 + (r2 - r1) * t,
    g1 + (g2 - g1) * t,
    b1 + (b2 - b1) * t,
  );
}
export function shade(hex: string, amt: number) {
  return amt >= 0 ? mix(hex, "#ffffff", amt) : mix(hex, "#000000", -amt);
}

/* ------------------ 纹理缓存 ------------------ */
const cache = new Map<string, THREE.CanvasTexture>();
function cached(key: string, size: [number, number], draw: (ctx: CanvasRenderingContext2D) => void) {
  const hit = cache.get(key);
  if (hit) return hit;
  const cv = document.createElement("canvas");
  cv.width = size[0];
  cv.height = size[1];
  const ctx = cv.getContext("2d")!;
  draw(ctx);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  if (cache.size > 90) {
    const first = cache.keys().next().value as string;
    cache.get(first)?.dispose();
    cache.delete(first);
  }
  cache.set(key, tex);
  return tex;
}

function speckle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  count: number,
  colors: string[],
  size = 2,
  seed = 7,
) {
  let s = seed;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colors[i % colors.length];
    const r = (0.4 + rnd() * 0.9) * size;
    ctx.globalAlpha = 0.05 + rnd() * 0.12;
    ctx.beginPath();
    ctx.arc(rnd() * w, rnd() * h, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export type VeinKind = "parallel" | "reticulate" | "radial" | "none";

/* ------------------ 叶片纹理（含叶脉） ------------------ */
export function leafTexture(opts: {
  vein: VeinKind;
  base: string;
  tip: string;
  veinColor?: string;
  lobes?: number;
  seed?: number;
}) {
  const key = `leaf|${opts.vein}|${opts.base}|${opts.tip}|${opts.veinColor ?? ""}|${opts.lobes ?? 0}|${opts.seed ?? 0}`;
  const W = 256;
  const H = 512;
  return cached(key, [W, H], (ctx) => {
    // 基色渐变：叶基 → 叶尖
    const grad = ctx.createLinearGradient(0, H, 0, 0);
    grad.addColorStop(0, shade(opts.base, -0.16));
    grad.addColorStop(0.35, opts.base);
    grad.addColorStop(1, opts.tip);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 两侧边缘略深（叶缘）
    const edge = ctx.createLinearGradient(0, 0, W, 0);
    edge.addColorStop(0, "rgba(0,0,0,0.30)");
    edge.addColorStop(0.16, "rgba(0,0,0,0)");
    edge.addColorStop(0.84, "rgba(0,0,0,0)");
    edge.addColorStop(1, "rgba(0,0,0,0.30)");
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, W, H);

    // 高光带
    const gloss = ctx.createLinearGradient(0, 0, W * 0.6, H);
    gloss.addColorStop(0, "rgba(255,255,255,0.10)");
    gloss.addColorStop(0.5, "rgba(255,255,255,0)");
    ctx.fillStyle = gloss;
    ctx.fillRect(0, 0, W, H);

    const vc = opts.veinColor ?? shade(opts.base, 0.42);
    speckle(ctx, W, H, 220, [shade(opts.base, 0.2), shade(opts.base, -0.25)], 3, opts.seed ?? 11);

    ctx.lineCap = "round";

    // 中脉（主脉）
    if (opts.vein !== "none") {
      ctx.strokeStyle = vc;
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(W / 2, H * 0.99);
      ctx.quadraticCurveTo(W / 2 + 3, H * 0.5, W / 2, H * 0.02);
      ctx.stroke();
    }

    if (opts.vein === "parallel") {
      const n = 9;
      for (let i = 0; i < n; i++) {
        const t = (i + 1) / (n + 1);
        const dx = (t - 0.5) * W * 0.94;
        ctx.strokeStyle = vc;
        ctx.globalAlpha = 0.34 + 0.24 * (1 - Math.abs(t - 0.5) * 2);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(W / 2 + dx * 0.16, H * 0.985);
        ctx.bezierCurveTo(
          W / 2 + dx * 1.06,
          H * 0.72,
          W / 2 + dx * 1.04,
          H * 0.28,
          W / 2 + dx * 0.1,
          H * 0.02,
        );
        ctx.stroke();
      }
      // 极细横向联络脉
      ctx.globalAlpha = 0.1;
      ctx.lineWidth = 0.8;
      for (let y = 12; y < H; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y + 3);
        ctx.stroke();
      }
    } else if (opts.vein === "reticulate") {
      // 侧脉
      const n = 8;
      for (let i = 0; i < n; i++) {
        const y0 = H * (0.9 - (i / n) * 0.8);
        const spread = (0.34 + (i / n) * 0.6) * W * 0.5;
        for (const s of [-1, 1]) {
          ctx.strokeStyle = vc;
          ctx.globalAlpha = 0.5;
          ctx.lineWidth = 2.2 - i * 0.14;
          ctx.beginPath();
          ctx.moveTo(W / 2, y0);
          ctx.bezierCurveTo(
            W / 2 + s * spread * 0.5,
            y0 - H * 0.05,
            W / 2 + s * spread * 0.85,
            y0 - H * 0.11,
            W / 2 + s * spread,
            y0 - H * 0.19,
          );
          ctx.stroke();
          // 三级细脉
          ctx.globalAlpha = 0.22;
          ctx.lineWidth = 0.9;
          for (let k = 1; k <= 3; k++) {
            const tt = k / 4;
            const bx = W / 2 + s * spread * tt;
            const by = y0 - H * 0.19 * tt * tt - H * 0.05 * tt;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + s * spread * 0.22, by - H * 0.055);
            ctx.stroke();
          }
        }
      }
      // 网脉纹理
      ctx.globalAlpha = 0.13;
      ctx.lineWidth = 0.7;
      let s = 3;
      const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
      for (let i = 0; i < 190; i++) {
        const x = rnd() * W;
        const y = rnd() * H;
        const len = 6 + rnd() * 20;
        const ang = rnd() * Math.PI;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(
          x + Math.cos(ang) * len * 0.5,
          y + Math.sin(ang) * len * 0.5 - 4,
          x + Math.cos(ang) * len,
          y + Math.sin(ang) * len,
        );
        ctx.stroke();
      }
    } else if (opts.vein === "radial") {
      const n = 11;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1) - 0.5;
        ctx.strokeStyle = vc;
        ctx.globalAlpha = 0.42;
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.moveTo(W / 2, H * 0.99);
        ctx.lineTo(W / 2 + t * W * 1.0, H * 0.02);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.12;
      ctx.lineWidth = 0.8;
      for (let y = H * 0.9; y > 0; y -= H * 0.11) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.quadraticCurveTo(W / 2, y - H * 0.03, W, y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  });
}

/* ------------------ 花瓣纹理 ------------------ */
export function petalTexture(base: string, tip: string, radial = false) {
  const key = `petal|${base}|${tip}|${radial}`;
  const W = 128;
  const H = 128;
  return cached(key, [W, H], (ctx) => {
    const g = radial
      ? ctx.createRadialGradient(W / 2, H, 4, W / 2, H, H * 1.1)
      : ctx.createLinearGradient(0, H, 0, 0);
    g.addColorStop(0, base);
    g.addColorStop(1, tip);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = shade(base, 0.35);
    ctx.globalAlpha = 0.28;
    for (let i = 0; i < 12; i++) {
      const x = (i / 11) * W;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2 + (x - W / 2) * 0.05, H);
      ctx.lineTo(x, radial ? H * 0.05 : 0);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}

/* ------------------ 树皮 / 茎 ------------------ */
export function barkTexture(base: string) {
  const key = `bark|${base}`;
  return cached(key, [256, 256], (ctx) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 260; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      ctx.strokeStyle = shade(base, Math.random() > 0.5 ? 0.14 : -0.18);
      ctx.globalAlpha = 0.1 + Math.random() * 0.2;
      ctx.lineWidth = 0.6 + Math.random() * 1.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 6, y + 6 + Math.random() * 26);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}

/* ------------------ 地面 / 基质 ------------------ */
export function groundTexture(kind: "soil" | "water" | "rock") {
  const key = `ground|${kind}`;
  return cached(key, [512, 512], (ctx) => {
    if (kind === "soil") {
      ctx.fillStyle = "#3a2a1c";
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 4200; i++) {
        ctx.fillStyle = ["#4a3624", "#2b1e14", "#584231", "#6b5138"][i % 4];
        ctx.globalAlpha = 0.25 + Math.random() * 0.5;
        const r = 0.6 + Math.random() * 2.6;
        ctx.beginPath();
        ctx.arc(Math.random() * 512, Math.random() * 512, r, 0, 7);
        ctx.fill();
      }
    } else if (kind === "rock") {
      ctx.fillStyle = "#4b4a44";
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = ["#5c5b53", "#3a3a35", "#6d6b60", "#57634c"][i % 4];
        ctx.globalAlpha = 0.2 + Math.random() * 0.55;
        const r = 1 + Math.random() * 7;
        ctx.beginPath();
        ctx.arc(Math.random() * 512, Math.random() * 512, r, 0, 7);
        ctx.fill();
      }
      // 苔痕
      for (let i = 0; i < 220; i++) {
        ctx.fillStyle = "#5d7a3a";
        ctx.globalAlpha = 0.1 + Math.random() * 0.25;
        ctx.beginPath();
        ctx.arc(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 12, 0, 7);
        ctx.fill();
      }
    } else {
      const g = ctx.createLinearGradient(0, 0, 512, 512);
      g.addColorStop(0, "#123038");
      g.addColorStop(0.5, "#1b4a52");
      g.addColorStop(1, "#0e262c");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = "rgba(190,240,255,0.10)";
      for (let i = 0; i < 90; i++) {
        ctx.lineWidth = 0.8 + Math.random() * 2;
        ctx.beginPath();
        const y = Math.random() * 512;
        ctx.moveTo(0, y);
        for (let x = 0; x <= 512; x += 32)
          ctx.lineTo(x, y + Math.sin((x + i * 40) * 0.03) * 7);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  });
}

/* ------------------ 场景背景 ------------------ */
export function backdropTexture(preset: "dawn" | "noon" | "dusk", scheme: "light" | "dark" = "dark") {
  const key = `bg|${scheme}|${preset}`;
  // 512 已足够：背景是低频径向渐变，512 相比 1024 省下约 75% 显存
  const S = 512;
  const tex = cached(key, [S, S], (ctx) => {
    const palettes: Record<"light" | "dark", Record<string, [string, string, string]>> = {
      dark: {
        dawn: ["#2a2032", "#171219", "#0b080e"],
        noon: ["#2c2335", "#18121c", "#0a070d"],
        dusk: ["#2b2029", "#181015", "#0a0709"],
      },
      light: {
        dawn: ["#ddcfe2", "#ebe2ee", "#f5eff6"],
        noon: ["#e7dcea", "#f1eaf3", "#f7f2f8"],
        dusk: ["#e2d5dd", "#eee5ea", "#f6f0f3"],
      },
    };
    const [c0, c1, c2] = palettes[scheme][preset];
    const g = ctx.createRadialGradient(S * 0.55, S * 0.24, S * 0.04, S / 2, S / 2, S * 0.74);
    g.addColorStop(0, c0);
    g.addColorStop(0.45, c1);
    g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    // 细颗粒（数量随尺寸缩放）
    const grains = Math.round((S * S) / 400);
    for (let i = 0; i < grains; i++) {
      ctx.fillStyle = scheme === "light" ? "rgba(93,63,81,0.05)" : "rgba(255,255,255,0.035)";
      ctx.fillRect(Math.random() * S, Math.random() * S, 1.2, 1.2);
    }
  });
  // 背景贴图不需要 mipmap 与各向异性过滤
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.anisotropy = 1;
  return tex;
}

/* ------------------ 种子 / 孢子 ------------------ */
export function seedTexture(base: string) {
  const key = `seed|${base}`;
  return cached(key, [128, 128], (ctx) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = shade(base, Math.random() > 0.5 ? 0.16 : -0.2);
      ctx.globalAlpha = 0.2 + Math.random() * 0.4;
      ctx.beginPath();
      ctx.ellipse(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 3, 0.6 + Math.random(), Math.random() * 3, 0, 7);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}
