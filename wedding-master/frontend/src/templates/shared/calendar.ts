import { useEffect, useState } from "react";

export const UZ_MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];
export const UZ_WEEKDAYS = ["DU", "SE", "CHOR", "PAY", "JU", "SHA", "YA"];

/** Dushanbadan boshlanuvchi oy jadvali; 0 — bo'sh katak. */
export function monthGrid(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return null;
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const lead = (first + 6) % 7;
  const total = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = [...Array(lead).fill(0), ...Array.from({ length: total }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(0);
  const weeks: number[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return { label: `${UZ_MONTHS[m - 1]}, ${y}`, weeks, day: d };
}

/** Konvert qopqog'idagi yozuv: "Nikoh to'yi" → ["Sizni", "Nikoh to'yimizga"]. */
export function envelopeLines(eventTitle: string): string[] {
  const title = eventTitle.trim() || "To'yimiz";
  // "Nikoh to'yi" → "Nikoh to'yimizga", boshqa nomlar → "...ga"
  const target = /to'yi$/i.test(title) ? `${title}mizga` : `${title}ga`;
  return ["Sizni", target];
}

export function useCountdown(targetIso: string) {
  const target = new Date(targetIso).getTime();
  const calc = () => {
    const diff = Math.max(0, target - Date.now());
    return {
      done: diff === 0,
      days: Math.floor(diff / 86_400_000),
      hours: Math.floor((diff % 86_400_000) / 3_600_000),
      minutes: Math.floor((diff % 3_600_000) / 60_000),
      seconds: Math.floor((diff % 60_000) / 1000),
    };
  };
  const [left, setLeft] = useState(calc);
  useEffect(() => {
    setLeft(calc());
    const id = window.setInterval(() => setLeft(calc()), 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return left;
}
