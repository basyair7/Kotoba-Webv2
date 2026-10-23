import type { ButtonHTMLAttributes } from "react";

export default function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`px-2 py-1 border-gray-500 border-2 rounded bg-white hover:bg-gray-200 transition-colors ${props.className ?? ""}`}
    />
  );
}
