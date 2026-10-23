"use client";

import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { dbModelsRealtime } from "../models/dbModels";
import { withTimeout } from "../lib/withTimeout";

type Language = "id" | "en" | "jp";
type QuizMode = "jpToId" | "idToJp";

interface Word {
  indonesia: string;
  kanji: string;
  furigana: string;
  dai: string;
}

interface WrongAnswer {
  question: Word;
  selected: Word;
  quizMode: QuizMode;
}

interface QuizGameProps {
  theme?: "light" | "dark";
  lang: Language;
}

const labels = {
  id: {
    title: "Tebak Kotoba",
    dai: "Bab",
    question: "Soal",
    correct: "Benar",
    wrong: "Salah",
    answer: "Jawabanmu",
    correctAnswer: "Jawaban yang benar",
    review: "Mari review ✍️",
    playAgain: "Main lagi",
    quit: "Berhenti",
    quitConfirm: "Yakin mau berhenti?",
    quitText: "Kuis yang sedang berlangsung akan berakhir.",
    result: "Hasil",
    thanks: "Terima kasih atas usahanya!",
    yourScore: "Skormu",
    selectedDai: "Bab yang dipilih",
    select: "Semua",
    total: (n: number) => `Dari total ${n} soal`,
    correctCount: "Jumlah salah",
    wrongCount: "Jumlah salah",
    allCorrect: "Semua benar! Luar biasa! 🎉",
    showFuri: "Tampilkan furigana",
    hideFuri: "Sembunyikan furigana",
    mode1: "Jepang → Indonesia",
    mode2: "Indonesia → Jepang",
    meaning: "Artinya?",
    noData: "Tidak ada data.",
    loading: "Memuat kuis...",
    loadError: "Gagal memuat data kuis. Silakan coba lagi.",
    translateError: "(belum ada terjemahan)",
    cancel: "Batal",
    yes: "Ya, berhenti",
  },
  en: {
    title: "Guess the Kotoba",
    dai: "Chapter",
    question: "Question",
    correct: "Correct",
    wrong: "Wrong",
    answer: "Your Answer",
    correctAnswer: "Correct Answer",
    review: "Let's review ✍️",
    playAgain: "Play Again",
    quit: "Quit",
    quitConfirm: "Are you sure you want to quit?",
    quitText: "The ongoing quiz will end.",
    result: "Result",
    thanks: "Thanks for your effort!",
    yourScore: "Your Score",
    selectedDai: "Selected Chapter",
    select: "All",
    total: (n: number) => `Out of ${n} questions`,
    correctCount: "Correct Answers",
    wrongCount: "Wrong Answers",
    allCorrect: "All correct! Amazing! 🎉",
    showFuri: "Show Furigana",
    hideFuri: "Hide Furigana",
    mode1: "Japanese → Indonesian",
    mode2: "Indonesian → Japanese",
    meaning: "Meaning?",
    noData: "No data.",
    loading: "Loading quiz...",
    loadError: "Failed to load quiz data. Please try again.",
    translateError: "(no translation)",
    cancel: "Cancel",
    yes: "Yes, quit",
  },
  jp: {
    title: "言葉を当てる",
    dai: "課",
    question: "問題",
    correct: "正解",
    wrong: "不正解",
    answer: "あなたの答え",
    correctAnswer: "正しい答え",
    review: "復習しましょう ✍️",
    playAgain: "もう一度プレイ",
    quit: "やめる",
    quitConfirm: "本当にやめますか？",
    quitText: "進行中のクイズが終了します。",
    result: "結果",
    thanks: "お疲れ様でした！",
    yourScore: "あなたのスコア",
    selectedDai: "選択した課",
    select: "全部",
    total: (n: number) => `全 ${n} 問から`,
    correctCount: "正解数",
    wrongCount: "不正解数",
    allCorrect: "全部正解！素晴らしい！ 🎉",
    showFuri: "ふりがなを表示する",
    hideFuri: "ふりがなを隠す",
    mode1: "日本語 → インドネシア語",
    mode2: "インドネシア語 → 日本語",
    meaning: "意味は？",
    noData: "データがありません。",
    loading: "読み込み中...",
    loadError: "クイズデータの読み込みに失敗しました。",
    translateError: "（まだ翻訳がありません）",
    cancel: "キャンセル",
    yes: "はい、やめる",
  },
};

function shuffle<T,>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const otherIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[otherIndex]] = [result[otherIndex], result[index]];
  }
  return result;
}

function createOptions(words: Word[], currentIndex: number): Word[] {
  const correctWord = words[currentIndex];
  if (!correctWord) return [];
  const otherWords = shuffle(words.filter((_, index) => index !== currentIndex))
    .slice(0, 2);
  return shuffle([...otherWords, correctWord]);
}

export default function QuizGame({ theme = "light", lang }: QuizGameProps) {
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [options, setOptions] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedDai, setSelectedDai] = useState("all");
  const [daiList, setDaiList] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [answered, setAnswered] = useState(false);
  const [quizMode, setQuizMode] = useState<QuizMode>("idToJp");
  const [isFinished, setIsFinished] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [showFurigana, setShowFurigana] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const answeringRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadWords() {
      try {
        const data = await withTimeout(
          dbModelsRealtime.getAll(),
          15000,
          "Firebase quiz request timed out after 15 seconds.",
        );
        if (!data || typeof data !== "object") {
          throw new Error("Firebase returned no vocabulary data.");
        }

        const parsed: Word[] = [];
        for (const [dai, items] of Object.entries(data)) {
          if (!items || typeof items !== "object") continue;
          for (const value of Object.values(items as Record<string, Record<string, unknown>>)) {
            parsed.push({
              kanji: typeof value.kanji === "string" ? value.kanji : "???",
              furigana: typeof value.furigana === "string" ? value.furigana : "",
              indonesia: typeof value.indonesia === "string"
                ? value.indonesia
                : labels[lang].translateError,
              dai,
            });
          }
        }

        if (cancelled) return;
        const shuffledWords = shuffle(parsed);
        const chapters = [...new Set(parsed.map((word) => word.dai))];
        const savedChapter = localStorage.getItem("selectedDai");
        const chapter = savedChapter === "all" || chapters.includes(savedChapter ?? "")
          ? savedChapter ?? "all"
          : "all";
        const savedMode = localStorage.getItem("quizMode");
        const mode: QuizMode = savedMode === "jpToId" || savedMode === "idToJp"
          ? savedMode
          : "idToJp";
        const savedFurigana = localStorage.getItem("showFurigana");
        const showFuri = savedFurigana === "true";
        const savedProgress = localStorage.getItem("quizProgress");
        let initialWords = shuffle(
          chapter === "all"
            ? shuffledWords
            : shuffledWords.filter((word) => word.dai === chapter),
        );
        let initialIndex = 0;
        let initialCorrect = 0;
        let initialWrong = 0;
        let initialWrongAnswers: WrongAnswer[] = [];

        if (savedProgress) {
          try {
            const progress = JSON.parse(savedProgress) as {
              words?: Word[];
              currentIndex?: number;
              correctCount?: number;
              wrongCount?: number;
              wrongAnswers?: WrongAnswer[];
            };
            if (Array.isArray(progress.words) && progress.words.every((word) =>
              word && typeof word.kanji === "string" && typeof word.indonesia === "string"
            )) {
              initialWords = progress.words;
              initialIndex = Math.min(
                Math.max(0, progress.currentIndex ?? 0),
                Math.max(0, initialWords.length - 1),
              );
              initialCorrect = progress.correctCount ?? 0;
              initialWrong = progress.wrongCount ?? 0;
              initialWrongAnswers = Array.isArray(progress.wrongAnswers)
                ? progress.wrongAnswers
                : [];
            }
          } catch (error) {
            console.error("Failed to restore quiz progress:", error);
          }
        }

        setAllWords(shuffledWords);
        setDaiList(chapters);
        setSelectedDai(chapter);
        setQuizMode(mode);
        setShowFurigana(showFuri);
        setWords(initialWords);
        setCurrentIndex(initialIndex);
        setCorrectCount(initialCorrect);
        setWrongCount(initialWrong);
        setWrongAnswers(initialWrongAnswers);
        setOptions(createOptions(initialWords, initialIndex));
        setInitialized(true);
      } catch (error) {
        console.error("Failed to load quiz vocabulary:", error);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadWords();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem("quizMode", quizMode);
    localStorage.setItem("selectedDai", selectedDai);
    localStorage.setItem("showFurigana", JSON.stringify(showFurigana));
    localStorage.setItem("quizProgress", JSON.stringify({
      currentIndex,
      correctCount,
      wrongCount,
      wrongAnswers,
      words,
    }));
  }, [
    initialized,
    quizMode,
    selectedDai,
    showFurigana,
    currentIndex,
    correctCount,
    wrongCount,
    wrongAnswers,
    words,
  ]);

  function resetQuiz(baseList: Word[]) {
    const shuffledWords = shuffle(baseList);
    setWords(shuffledWords);
    setCurrentIndex(0);
    setOptions(createOptions(shuffledWords, 0));
    setCorrectCount(0);
    setWrongCount(0);
    setFeedback("");
    setAnswered(false);
    setIsFinished(false);
    setWrongAnswers([]);
    answeringRef.current = false;
  }

  function handleChapterChange(chapter: string) {
    setSelectedDai(chapter);
    const filtered = chapter === "all"
      ? allWords
      : allWords.filter((word) => word.dai === chapter);
    resetQuiz(filtered);
  }

  function handleModeChange(mode: QuizMode) {
    setQuizMode(mode);
    const filtered = selectedDai === "all"
      ? allWords
      : allWords.filter((word) => word.dai === selectedDai);
    resetQuiz(filtered);
  }

  function handleAnswer(selected: Word) {
    const correctWord = words[currentIndex];
    if (!correctWord || answeringRef.current || answered || isFinished) return;
    answeringRef.current = true;
    setAnswered(true);

    const isCorrect = quizMode === "jpToId"
      ? selected.indonesia === correctWord.indonesia
      : selected.kanji === correctWord.kanji;

    if (isCorrect) {
      setCorrectCount((count) => count + 1);
      setFeedback(`${labels[lang].correct} 🎉`);
    } else {
      setWrongCount((count) => count + 1);
      setWrongAnswers((answers) => [
        ...answers,
        { question: correctWord, selected, quizMode },
      ]);
      setFeedback(
        `${labels[lang].wrong}! ${labels[lang].correctAnswer}: ${
          quizMode === "jpToId"
            ? correctWord.indonesia
            : `${correctWord.kanji}${showFurigana && correctWord.furigana ? `「${correctWord.furigana}」` : ""}`
        }`,
      );
    }

    window.setTimeout(() => {
      const nextIndex = currentIndex + 1;
      if (nextIndex < words.length) {
        setCurrentIndex(nextIndex);
        setOptions(createOptions(words, nextIndex));
        setFeedback("");
        setAnswered(false);
      } else {
        setIsFinished(true);
      }
      answeringRef.current = false;
    }, 1200);
  }

  const labelsForLanguage = labels[lang];
  const cardStyle = `${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"} p-6 max-w-xl mx-auto rounded-lg shadow-md`;
  const actionButtonStyle = `px-4 py-2 rounded text-white ${theme === "dark" ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-500 hover:bg-blue-600"}`;
  const renderKanji = (word: Word) =>
    `${word.kanji}${showFurigana && word.furigana ? `「${word.furigana}」` : ""}`;

  if (loading) {
    return <div className="min-h-screen flex justify-center p-4">{labelsForLanguage.loading}</div>;
  }

  if (loadError) {
    return <div role="alert" className="min-h-screen flex justify-center p-4">{labelsForLanguage.loadError}</div>;
  }

  if (words.length === 0) {
    return <div className="min-h-screen flex justify-center p-4">{labelsForLanguage.noData}</div>;
  }

  if (isFinished) {
    const score = Math.round((correctCount / words.length) * 100);
    return (
      <section className={cardStyle}>
        <h2 className="text-2xl font-bold mb-4">{labelsForLanguage.result}</h2>
        <h3 className="text-xl font-semibold mb-4">{labelsForLanguage.thanks}</h3>
        <h3 className="mb-2 text-lg">{labelsForLanguage.yourScore}:</h3>
        <p className="text-3xl font-extrabold mb-4">{score}%</p>
        <p className="mb-2">{labelsForLanguage.selectedDai}: {selectedDai === "all" ? labelsForLanguage.select : selectedDai}</p>
        <p className="mb-2">{labelsForLanguage.total(words.length)}</p>
        <p className="mb-2">{labelsForLanguage.correctCount}: {correctCount}</p>
        <p className="mb-4">{labelsForLanguage.wrongCount}: {wrongCount}</p>

        {wrongAnswers.length > 0
          ? (
            <div className="mt-4">
              <h3 className="text-xl font-semibold mb-2">{labelsForLanguage.review}</h3>
              <ul className="space-y-3">
                {wrongAnswers.map((item, index) => (
                  <li
                    key={`${item.question.kanji}-${index}`}
                    className={`p-3 border rounded ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-red-50 border-red-200"}`}
                  >
                    <p className="text-xl">
                      <strong>{labelsForLanguage.question}: </strong>
                      {item.quizMode === "jpToId" ? renderKanji(item.question) : item.question.indonesia}
                    </p>
                    <p className="text-red-400">
                      {labelsForLanguage.answer}: {item.quizMode === "jpToId" ? item.selected.indonesia : renderKanji(item.selected)}
                    </p>
                    <p className="text-green-400">
                      {labelsForLanguage.correctAnswer}: {item.quizMode === "jpToId" ? item.question.indonesia : renderKanji(item.question)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )
          : score === 100 && <p className="mt-4 text-green-400 font-bold">{labelsForLanguage.allCorrect}</p>}

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => resetQuiz(words)} className={actionButtonStyle}>
            {labelsForLanguage.playAgain}
          </button>
          {wrongAnswers.length > 0 && (
            <button
              type="button"
              className="px-4 py-2 rounded-md border bg-gray-200 text-black"
              onClick={() => setShowFurigana((current) => !current)}
            >
              {showFurigana ? labelsForLanguage.hideFuri : labelsForLanguage.showFuri}
            </button>
          )}
        </div>
      </section>
    );
  }

  const currentWord = words[currentIndex];
  if (!currentWord) return null;

  return (
    <section className={cardStyle}>
      <h2 className="text-2xl font-bold mb-4">{labelsForLanguage.title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        <select
          aria-label={labelsForLanguage.dai}
          value={selectedDai}
          onChange={(event) => handleChapterChange(event.target.value)}
          className={`p-2 border rounded ${theme === "dark" ? "bg-gray-700 border-gray-600" : ""}`}
        >
          <option value="all">{labelsForLanguage.select}</option>
          {daiList.map((chapter) => <option value={chapter} key={chapter}>{chapter}</option>)}
        </select>
        <select
          aria-label="Quiz mode"
          value={quizMode}
          onChange={(event) => handleModeChange(event.target.value as QuizMode)}
          className={`p-2 border rounded ${theme === "dark" ? "bg-gray-700 border-gray-600" : ""}`}
        >
          <option value="jpToId">{labelsForLanguage.mode1}</option>
          <option value="idToJp">{labelsForLanguage.mode2}</option>
        </select>
      </div>

      <p className="mb-2">{labelsForLanguage.question} {currentIndex + 1} / {words.length}</p>
      {selectedDai === "all" && <p className="mb-2">{labelsForLanguage.dai}: {currentWord.dai}</p>}
      <p className="mb-4 font-semibold">
        <span className={theme === "dark" ? "text-green-400" : "text-green-600"}>{labelsForLanguage.correct}: {correctCount}</span>
        {" | "}
        <span className={theme === "dark" ? "text-red-400" : "text-red-600"}>{labelsForLanguage.wrong}: {wrongCount}</span>
      </p>

      <div className="mb-4">
        <button
          type="button"
          className="text-2xl font-bold mb-2 text-left"
          onClick={() => setShowFurigana((current) => !current)}
          aria-label={labelsForLanguage.showFuri}
        >
          {quizMode === "jpToId" ? renderKanji(currentWord) : currentWord.indonesia}
        </button>
        <p className="flex items-center gap-2">
          {labelsForLanguage.meaning}
          {feedback && (
            <span className={`font-semibold ${feedback.startsWith(labelsForLanguage.correct) ? "text-green-500" : "text-red-400"}`}>
              {feedback}
            </span>
          )}
        </p>
      </div>

      <div className="space-y-4">
        {options.map((option, index) => (
          <button
            type="button"
            key={`${option.indonesia}-${index}`}
            onClick={() => handleAnswer(option)}
            className={`w-full p-4 rounded-lg text-white text-2xl ${theme === "dark" ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-500 hover:bg-blue-600"}`}
            disabled={answered}
          >
            {quizMode === "jpToId"
              ? option.indonesia || "(kosong)"
              : renderKanji(option)}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
          onClick={async () => {
            const result = await Swal.fire({
              icon: "warning",
              title: labelsForLanguage.quitConfirm,
              text: labelsForLanguage.quitText,
              showCancelButton: true,
              confirmButtonText: labelsForLanguage.yes,
              cancelButtonText: labelsForLanguage.cancel,
              customClass: {
                confirmButton: "bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded",
                cancelButton: "bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded ml-2",
              },
              buttonsStyling: false,
            });

            if (result.isConfirmed) {
              setIsFinished(true);
            }
          }}
        >
          {labelsForLanguage.quit}
        </button>
        <button
          type="button"
          aria-pressed={showFurigana}
          onClick={() => setShowFurigana((current) => !current)}
          className={`px-4 py-2 border rounded transition-colors ${
            showFurigana
              ? "bg-blue-600 text-white border-blue-600"
              : theme === "dark"
              ? "bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
              : "bg-white text-black border-gray-300 hover:bg-gray-100"
          }`}
        >
          {showFurigana ? labelsForLanguage.hideFuri : labelsForLanguage.showFuri}
        </button>
      </div>
    </section>
  );
}
