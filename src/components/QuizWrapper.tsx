"use client";

import Link from "next/link";
import QuizGame from "./QuizGame";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "../hooks/useTheme";
import { useLocalStorageState } from "../hooks/useLocalStorageState";

type Language = "id" | "en" | "jp";
const LANGUAGES: readonly Language[] = ["id", "en", "jp"];

const labels = {
  id: { title: "🎮 Kuis Kotoba", kotoba: "📚 Daftar Kotoba" },
  en: { title: "🎮 Kotoba Quiz", kotoba: "📚 Kotoba List" },
  jp: { title: "🎮 言葉クイズ", kotoba: "📚 言葉リスト" },
};

export default function QuizWrapper() {
  const { theme, toggleTheme } = useTheme();
  const [lang, setLang] = useLocalStorageState("lang", "id", LANGUAGES);

  return (
    <main className={`p-6 min-h-screen transition-colors duration-300 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      <h1 className="text-3xl font-bold mb-4">{labels[lang].title}</h1>
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        <Link href="/" className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200">
          {labels[lang].kotoba}
        </Link>
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
      <QuizGame theme={theme} lang={lang} />
    </main>
  );
}
