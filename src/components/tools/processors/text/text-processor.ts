export interface TextStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  lines: number;
  sentences: number;
  paragraphs: number;
  readingTimeMinutes: number;
}

export function analyzeText(text: string): TextStats {
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const lines = text === "" ? 0 : text.split("\n").length;
  const sentences =
    text.trim() === "" ? 0 : (text.match(/[^.!?]+[.!?]+/g) || []).length || 1;
  const paragraphs =
    text.trim() === ""
      ? 0
      : text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
  const readingTimeMinutes = Math.ceil(words / 200);

  return {
    words,
    characters,
    charactersNoSpaces,
    lines,
    sentences,
    paragraphs,
    readingTimeMinutes,
  };
}

export function convertCase(
  text: string,
  mode: "upper" | "lower" | "title" | "sentence"
): string {
  switch (mode) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title":
      return text.replace(/\b\w/g, (c) => c.toUpperCase());
    case "sentence":
      return text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
    default:
      return text;
  }
}
