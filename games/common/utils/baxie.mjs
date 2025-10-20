
export function formatSkillName(str, split = '\n') {
  // Insert space before capital letters
  const spaced = str.replace(/([a-z])([A-Z])/g, '$1 $2');

  // Split into words
  const words = spaced.split(' ');

  // Capitalize each word
  const capitalizedWords = words.map(
    word => word.charAt(0).toUpperCase() + word.slice(1)
  );

  // If more than one word, split into two lines
  if (capitalizedWords.length > 1) {
    return `${capitalizedWords[0]}${split}${capitalizedWords.slice(1).join(' ')}`;
  }

  // Otherwise just return the single capitalized word
  return capitalizedWords[0];
}
