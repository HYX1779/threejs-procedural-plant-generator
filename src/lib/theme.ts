export type ThemeMode = "light" | "dark";
export type ThemePref = ThemeMode | "system";

export const THEME_KEY = "phytogenesis-theme";
export const THEME_EVENT = "phytogenesis:theme";

export function systemMode(): ThemeMode {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* localStorage 不可用（隐私模式 / file://）时退回跟随系统 */
  }
  return "system";
}

export function resolveMode(pref: ThemePref): ThemeMode {
  return pref === "system" ? systemMode() : pref;
}

/** 读取当前已生效的配色（首帧脚本已写入 data-theme） */
export function currentMode(): ThemeMode {
  const d = document.documentElement.dataset.theme;
  if (d === "dark" || d === "light") return d;
  return systemMode();
}

export function applyPref(pref: ThemePref, persist = true): ThemeMode {
  const mode = resolveMode(pref);
  const el = document.documentElement;
  el.dataset.theme = mode;
  el.style.colorScheme = mode;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", mode === "dark" ? "#5d3f51" : "#815c94");
  if (persist) {
    try {
      localStorage.setItem(THEME_KEY, pref);
    } catch {
      /* 忽略写入失败 */
    }
  }
  window.dispatchEvent(new CustomEvent<ThemeMode>(THEME_EVENT, { detail: mode }));
  return mode;
}
