const wordPattern = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu;

export const countWords = (value: string): number => {
  return value.match(wordPattern)?.length ?? 0;
};
