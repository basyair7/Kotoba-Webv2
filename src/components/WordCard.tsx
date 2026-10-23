interface WordCardProps {
  jp: string;
  furigana: string;
  romaji: string;
  indonesia: string;
  theme?: "light" | "dark";
  className?: string;
}

export default function WordCard({
  jp,
  furigana,
  romaji,
  indonesia,
  theme = "light",
  className = "",
}: WordCardProps) {
  const bgColor = theme === "dark"
    ? "bg-gray-800 text-white"
    : "bg-white text-black";
  const romajiColor = theme === "dark" ? "text-gray-300" : "text-gray-600";
  const indonesiaColor = theme === "dark" ? "text-green-400" : "text-green-700";

  return (
    <div className={`p-4 rounded-2xl shadow my-2 ${bgColor} ${className}`}>
      <h2 className="text-2xl font-bold">
        {furigana
          ? (
            <ruby>
              {jp}
              <rt className="text-sm text-gray-500">{furigana}</rt>
            </ruby>
          )
          : jp}
      </h2>
      {romaji && <p className={`italic ${romajiColor}`}>{romaji}</p>}
      <p className={indonesiaColor}>{indonesia}</p>
    </div>
  );
}
