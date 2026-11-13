import type { ReactNode } from "react";
import type { ThemePref } from "../lib/theme";
import { useI18n, type MessageKey } from "../lib/i18n";

const OPTIONS: { id: ThemePref; titleKey: MessageKey; icon: ReactNode }[] = [
  {
    id: "system",
    titleKey: "themeSystemTitle",
    icon: (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <rect x="3" y="4.5" width="18" height="12" rx="1.6" />
        <path d="M9 20h6M12 16.5V20" />
      </svg>
    ),
  },
  {
    id: "light",
    titleKey: "themeLightTitle",
    icon: (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />
      </svg>
    ),
  },
  {
    id: "dark",
    titleKey: "themeDarkTitle",
    icon: (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z" />
      </svg>
    ),
  },
];

export default function ThemeToggle({
  value,
  onChange,
}: {
  value: ThemePref;
  onChange: (v: ThemePref) => void;
}) {
  const { t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t("themeGroup")}
      className="flex items-center divide-x divide-line border border-line bg-wash"
    >
      {OPTIONS.map((o) => {
        const on = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={on}
            title={t(o.titleKey)}
            className={[
              "flex h-7 w-7 items-center justify-center transition-colors duration-200",
              on
                ? "bg-accent-wash text-leaf-300"
                : "text-moss-400 hover:bg-wash-2 hover:text-moss-200",
            ].join(" ")}
          >
            {o.icon}
          </button>
        );
      })}
    </div>
  );
}
