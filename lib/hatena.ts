export async function fetchHatenaCount(url: string): Promise<number> {
  const seed = Array.from(url).reduce((total, character) => {
    return total + character.charCodeAt(0);
  }, 0);

  return seed % 50;
}
