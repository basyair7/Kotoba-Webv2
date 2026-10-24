"use client";

import KotobaList from "./KotobaList";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "../hooks/useTheme";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { Analytics } from "@vercel/analytics/next";

type Language = "id" | "en" | "jp";
const LANGUAGES: readonly Language[] = ["id", "en", "jp"];

const labels = {
  id: { title: "📚 Daftar Kotoba", quiz: "🎮 Kuis Kotoba" },
  en: { title: "📚 Kotoba List", quiz: "🎮 Kotoba Quiz" },
  jp: { title: "📚 言葉リスト", quiz: "🎮 言葉クイズ" },
};

export default function KotobaWrapper() {
  const { theme, toggleTheme } = useTheme();
  const [lang, setLang] = useLocalStorageState("lang", "id", LANGUAGES);

  return (
    <main className={`p-4 transition-colors duration-300 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      <Analytics/>
      <h1 className="text-3xl font-bold mb-4">{labels[lang].title}</h1>
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        <a href="/quiz" className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200">
          {labels[lang].quiz}
        </a>
        <label className="flex items-center gap-2">
          <span className="sr-only">Language</span>
          <select
            className={`border p-2 rounded ${theme === "dark" ? "bg-gray-700 text-white border-gray-600" : "bg-white text-black"}`}
            value={lang}
            onChange={(event) => setLang(event.target.value as Language)}
          >
            <option value="id">🇮🇩 Indonesia</option>
            <option value="jp">🇯🇵 日本語</option>
          </select>
        </label>
      </div>
      <KotobaList theme={theme} lang={lang} />
    </main>
  );
}
