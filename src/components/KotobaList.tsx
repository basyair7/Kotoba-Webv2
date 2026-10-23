"use client";

import { useEffect, useMemo, useState } from "react";
import { dbModelsRealtime } from "../models/dbModels";
import { withTimeout } from "../lib/withTimeout";
import WordCard from "./WordCard";

type Language = "id" | "en" | "jp";

interface KotobaListProps {
  theme?: "light" | "dark";
  lang: Language;
}

interface Word {
  kanji?: string;
  furigana?: string;
  romaji?: string;
  indonesia?: string;
  chapter: string;
}

const labels = {
  id: {
    selectChapter: "Pilih Bab:",
    loading: "📖 Sedang memuat...",
    search: "Cari kotoba (kanji, hiragana, romaji, arti)...",
    back: "◀ Sebelumnya",
    next: "Selanjutnya ▶",
    page: "Halaman",
    of: "dari",
    from: "Dari",
    select: "Semua",
    error: "Gagal memuat kosakata. Silakan coba lagi.",
    retry: "Coba lagi",
  },
  en: {
    selectChapter: "Select Lesson:",
    loading: "📖 Loading...",
    search: "Search kotoba (kanji, hiragana, romaji, meaning)...",
    back: "◀ Back",
    next: "Next ▶",
    page: "Page",
    of: "of",
    from: "From",
    select: "All",
    error: "Failed to load vocabulary. Please try again.",
    retry: "Retry",
  },
  jp: {
    selectChapter: "課を選択：",
    loading: "📖 読み込み中...",
    search: "言葉を検索（漢字、ひらがな、ローマ字、意味）...",
    back: "◀ 戻る",
    next: "次 ▶",
    page: "ページ",
    of: "/",
    from: "課",
    select: "全部",
    error: "語彙の読み込みに失敗しました。もう一度お試しください。",
    retry: "再試行",
  },
};

const ALL_KEY = "ALL";
const PER_PAGE = 8;

export default function KotobaList({ theme = "light", lang }: KotobaListProps) {
  const [data, setData] = useState<Record<string, Record<string, Omit<Word, "chapter">>> | null>(null);
  const [selectedChapter, setSelectedChapter] = useState(ALL_KEY);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const allData = await withTimeout(
          dbModelsRealtime.getAll(),
          15000,
          "Firebase vocabulary request timed out after 15 seconds.",
        );
        if (!allData || typeof allData !== "object") {
          throw new Error("Firebase returned no vocabulary data.");
        }
        if (!cancelled) {
          setData(allData);
        }
      } catch (error) {
        console.error("Failed to load vocabulary:", error);
        if (!cancelled) {
          setHasError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  const chapters = useMemo(() => Object.keys(data ?? {}), [data]);
  const words = useMemo<Word[]>(() => {
    if (!data) return [];

    const selectedChapters = selectedChapter === ALL_KEY
      ? Object.entries(data)
      : [[selectedChapter, data[selectedChapter] ?? {}] as const];

    return selectedChapters.flatMap(([chapter, entries]) =>
      Object.values(entries).map((word) => ({ ...word, chapter }))
    );
  }, [data, selectedChapter]);

  const filteredWords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return words;

    return words.filter((word) =>
      [word.kanji, word.furigana, word.romaji, word.indonesia]
        .some((value) => value?.toLowerCase().includes(query))
    );
  }, [searchQuery, words]);

  const totalPages = Math.ceil(filteredWords.length / PER_PAGE);
  const currentWords = filteredWords.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        setPage((current) => Math.max(0, current - 1));
      } else if (event.key === "ArrowRight") {
        setPage((current) => Math.min(Math.max(0, totalPages - 1), current + 1));
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [totalPages]);

  const labelsForLanguage = labels[lang];
  const selectBg = theme === "dark"
    ? "bg-gray-700 text-white border-gray-600"
    : "bg-white text-black";
  const buttonBg = theme === "dark"
    ? "bg-gray-700 text-white"
    : "bg-gray-200 text-black";

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center pt-4">
        {labelsForLanguage.loading}
      </div>
    );
  }

  if (hasError) {
    return (
      <div role="alert" className="min-h-screen flex justify-center pt-4">
        <div className="text-center">
          <p>{labelsForLanguage.error}</p>
          <button
            type="button"
            className={`mt-3 rounded px-4 py-2 ${buttonBg}`}
            onClick={() => {
              setLoading(true);
              setHasError(false);
              setRetryCount((count) => count + 1);
            }}
          >
            {labelsForLanguage.retry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-5xl mx-auto p-4 min-h-screen ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
        <label htmlFor="chapter-select" className="font-bold">
          {labelsForLanguage.selectChapter}
        </label>
        <select
          id="chapter-select"
          className={`border p-2 rounded w-full sm:w-auto ${selectBg}`}
          value={selectedChapter}
          onChange={(event) => {
            setSelectedChapter(event.target.value);
            setPage(0);
          }}
        >
          <option value={ALL_KEY}>{labelsForLanguage.select}</option>
          {chapters.map((chapter) => (
            <option value={chapter} key={chapter}>{chapter}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <input
          type="search"
          placeholder={labelsForLanguage.search}
          className={`border p-2 rounded w-full ${selectBg}`}
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setPage(0);
          }}
        />
      </div>

      <div id="display-kotoba" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {currentWords.map((word, index) => (
          <div className="flex flex-col h-full" key={`${word.chapter}-${word.kanji}-${index}`}>
            <WordCard
              jp={word.kanji ?? "??? "}
              furigana={word.furigana ?? ""}
              romaji={word.romaji ?? ""}
              indonesia={word.indonesia ?? ""}
              theme={theme}
              className="flex flex-col h-full justify-between"
            />
            {selectedChapter === ALL_KEY && (
              <p className="text-xs text-gray-400 mt-1">
                {labelsForLanguage.from}: {word.chapter}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-6">
        <button
          type="button"
          className={`px-4 py-2 rounded disabled:opacity-50 ${buttonBg}`}
          disabled={page === 0}
          onClick={() => {
            setPage((current) => Math.max(0, current - 1));
            document.getElementById("display-kotoba")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          {labelsForLanguage.back}
        </button>
        <span className="px-2">
          {labelsForLanguage.page} {totalPages === 0 ? 0 : page + 1} {labelsForLanguage.of} {totalPages}
        </span>
        <button
          type="button"
          className={`px-4 py-2 rounded disabled:opacity-50 ${buttonBg}`}
          disabled={page >= totalPages - 1}
          onClick={() => {
            setPage((current) => Math.min(totalPages - 1, current + 1));
            document.getElementById("display-kotoba")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          {labelsForLanguage.next}
        </button>
      </div>
    </div>
  );
}
