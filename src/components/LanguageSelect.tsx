import { LANGS, useI18n } from "../lib/i18n";

export default function LanguageSelect() {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t("langGroup")}
      className="flex items-center divide-x divide-line border border-line bg-wash"
    >
      {LANGS.map((l) => {
        const on = lang === l.id;
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => setLang(l.id)}
            aria-pressed={on}
            title={l.full}
            className={[
              "flex h-7 min-w-[27px] items-center justify-center px-1.5 text-[10.5px] tracking-wide transition-colors duration-200",
              on
                ? "bg-accent-wash text-leaf-300"
                : "text-moss-400 hover:bg-wash-2 hover:text-moss-200",
            ].join(" ")}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
