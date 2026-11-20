export function validateContentForm({ title, type, releaseYear, image, duration, seasons }) {
  const year = Number(releaseYear);
  const currentYear = new Date().getFullYear();
  let imageIsValid = false;

  try {
    const url = new URL(String(image).trim());
    imageIsValid = url.protocol === "http:" || url.protocol === "https:";
  } catch {
    imageIsValid = false;
  }

  return {
    title: String(title).trim() ? "" : "Le titre est obligatoire.",
    type: ["movie", "series"].includes(type) ? "" : "Choisissez Film ou Série.",
    releaseYear: Number.isInteger(year) && year >= 1900 && year <= currentYear
      ? "" : `L'année doit être comprise entre 1900 et ${currentYear}.`,
    poster: imageIsValid ? "" : "Saisissez une URL d'image valide (http ou https).",
    duration: type !== "movie" || (Number.isInteger(Number(duration)) && Number(duration) > 0)
      ? "" : "La durée du film doit être un entier supérieur à 0.",
    seasons: type !== "series" || (Number.isInteger(Number(seasons)) && Number(seasons) > 0)
      ? "" : "Le nombre de saisons doit être un entier supérieur à 0.",
  };
}
