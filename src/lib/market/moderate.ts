const BLOCKED = [
  "fuck",
  "shit",
  "cunt",
  "bitch",
  "asshole",
  "bastard",
  "dickhead",
  "nigger",
  "nigga",
  "faggot",
  "retard",
  "slut",
  "whore",
];

export function offensiveLanguage(text: string) {
  const cleaned = text
    .toLowerCase()
    .replace(/[@4]/g, "a")
    .replace(/3/g, "e")
    .replace(/1/g, "i")
    .replace(/0/g, "o")
    .replace(/\$/g, "s")
    .replace(/[^a-z]+/g, "");
  return BLOCKED.some((word) => cleaned.includes(word));
}
