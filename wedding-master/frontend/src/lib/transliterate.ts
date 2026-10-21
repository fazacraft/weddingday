/**
 * Uzbek Latin <-> Cyrillic transliteration — dependency-free.
 *
 * Barcha sayt matni manba sifatida o'zbek lotinida yozilgan, shuning uchun
 * asosiy yo'nalish `toCyrillic` (lotin -> kiril). `toLatin` esa kiril bilan
 * yozilgan tilaklarni lotin rejimida ko'rsatish uchun kerak.
 *
 * Ikkala funksiya ham idempotent: allaqachon to'g'ri yozuvdagi matnga tegmaydi.
 */

const APOSTROPHES = "'’‘ʻʼ`´ʹ";
const isApos = (ch: string): boolean => ch !== "" && APOSTROPHES.includes(ch);

const LATIN_VOWELS = "aeiou";
const isLatinLetter = (ch: string): boolean => /[a-z]/i.test(ch);
const isCyrLetter = (ch: string): boolean => /[а-яёўқғҳ]/i.test(ch);
const CYR_VOWELS = "аеёиоуэюяў";

/** Matched manba ketma-ketligining registriga qarab natijaga registr beradi. */
function applyCase(source: string, target: string): string {
  const hasLetters = source.toLowerCase() !== source.toUpperCase();
  // Butunlay katta harf (masalan "SH", "A")
  if (hasLetters && source === source.toUpperCase()) {
    return target.toUpperCase();
  }
  // Bosh harf katta (masalan "Sh", "Abbos")
  const first = source.charAt(0);
  if (first === first.toUpperCase() && first !== first.toLowerCase()) {
    return target.charAt(0).toUpperCase() + target.slice(1);
  }
  return target;
}

const LAT_TWO: Record<string, string> = {
  sh: "ш",
  ch: "ч",
  ts: "ц",
  yo: "ё",
  yu: "ю",
  ya: "я",
  ye: "е",
};

const LAT_ONE: Record<string, string> = {
  a: "а", b: "б", c: "с", d: "д", f: "ф", g: "г", h: "ҳ", i: "и",
  j: "ж", k: "к", l: "л", m: "м", n: "н", o: "о", p: "п", q: "қ",
  r: "р", s: "с", t: "т", u: "у", v: "в", x: "х", y: "й", z: "з",
};

/** Uzbek Latin -> Cyrillic */
export function toCyrillic(input: string): string {
  let out = "";
  let i = 0;
  const s = input;

  while (i < s.length) {
    const ch = s[i];
    const lower = ch.toLowerCase();
    const next = s[i + 1] ?? "";
    const nextLower = next.toLowerCase();

    // 1. o' -> ў, g' -> ғ (harf + apostrof)
    if ((lower === "o" || lower === "g") && isApos(next)) {
      out += applyCase(ch, lower === "o" ? "ў" : "ғ");
      i += 2;
      continue;
    }

    // 2. Ikki harfli birikmalar: sh, ch, ts, yo, yu, ya, ye
    // Muhim: "yo'" -> й + ў (masalan "yo'q" -> "йўқ"), shuning uchun "yo" dan
    // keyin apostrof kelsa, uni "yo" (ё) deb emas, "y" + "o'" deb ajratamiz.
    const two = lower + nextLower;
    if (
      LAT_TWO[two] &&
      isLatinLetter(next) &&
      !(two === "yo" && isApos(s[i + 2] ?? ""))
    ) {
      out += applyCase(ch + next, LAT_TWO[two]);
      i += 2;
      continue;
    }

    // 3. 'e' -> so'z boshida yoki unlidan keyin "э", aks holda "е"
    if (lower === "e") {
      const prev = i > 0 ? s[i - 1] : "";
      const atStart = !isLatinLetter(prev);
      const afterVowel = LATIN_VOWELS.includes(prev.toLowerCase());
      out += applyCase(ch, atStart || afterVowel ? "э" : "е");
      i += 1;
      continue;
    }

    // 4. Bitta harf
    if (LAT_ONE[lower]) {
      out += applyCase(ch, LAT_ONE[lower]);
      i += 1;
      continue;
    }

    // 5. Yakka apostrof (tutuq belgisi) -> ъ
    if (isApos(ch)) {
      out += "ъ";
      i += 1;
      continue;
    }

    // Qolganlari (raqam, tinish belgisi, bo'shliq, kiril harflar) — o'zgarmasdan
    out += ch;
    i += 1;
  }

  return out;
}

const CYR_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", ж: "j", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "x", ц: "ts", ч: "ch", ш: "sh",
  ъ: "'", ь: "", э: "e", ю: "yu", я: "ya", ё: "yo", ў: "o'", қ: "q",
  ғ: "g'", ҳ: "h", ы: "i",
};

function applyCaseLatin(source: string, target: string): string {
  const isUpper =
    source !== source.toLowerCase() && source === source.toUpperCase();
  if (!isUpper) return target;
  if (target.length > 1) {
    return target.charAt(0).toUpperCase() + target.slice(1);
  }
  return target.toUpperCase();
}

/** Uzbek Cyrillic -> Latin */
export function toLatin(input: string): string {
  let out = "";
  const s = input;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const lower = ch.toLowerCase();
    const prev = i > 0 ? s[i - 1] : "";

    // 'е' -> so'z boshida yoki unlidan keyin "ye", aks holda "e"
    if (lower === "е") {
      const atStart = !isCyrLetter(prev);
      const afterVowel = CYR_VOWELS.includes(prev.toLowerCase());
      out += applyCaseLatin(ch, atStart || afterVowel ? "ye" : "e");
      continue;
    }

    if (CYR_MAP[lower] !== undefined) {
      out += applyCaseLatin(ch, CYR_MAP[lower]);
    } else {
      out += ch;
    }
  }

  return out;
}
