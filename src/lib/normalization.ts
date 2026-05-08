const polishLetters: Record<string, string> = {
  ą: "a",
  ć: "c",
  ę: "e",
  ł: "l",
  ń: "n",
  ó: "o",
  ś: "s",
  ź: "z",
  ż: "z",
};

export function normalizeAnswer(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[ąćęłńóśźż]/g, (letter) => polishLetters[letter] ?? letter)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
