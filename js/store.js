import { createContent, getContents } from "./api.js";
import { LEGACY_DATA_URL } from "./config.js";
import { clearPageStatus, setPageStatus } from "./ui.js";

async function getLegacyData() {
  const response = await fetch(LEGACY_DATA_URL);
  if (!response.ok) {
    throw new Error(`Impossible de charger les données de secours (HTTP ${response.status}).`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("Le catalogue de secours est invalide.");
  return data;
}

// Le catalogue lit d'abord MockAPI. Le JSON de la Partie 1 reste disponible
// comme solution de secours tant que la collection distante est vide ou indisponible.
export async function getData() {
  try {
    const contents = await getContents();
    if (!Array.isArray(contents)) throw new Error("La réponse MockAPI n'est pas une liste.");
    if (contents.length) {
      clearPageStatus();
      return contents;
    }

    setPageStatus("La collection MockAPI est vide : affichage du catalogue de la Partie 1.", "warning");
    return await getLegacyData();
  } catch (apiError) {
    try {
      const legacyData = await getLegacyData();
      setPageStatus("MockAPI est indisponible : affichage du catalogue de la Partie 1.", "warning");
      return legacyData;
    } catch (legacyError) {
      setPageStatus(`Chargement impossible. ${legacyError.message}`, "error");
      console.error("Erreur de chargement du catalogue :", apiError, legacyError);
      return [];
    }
  }
}

// Import manuel uniquement : cette fonction n'est jamais lancée au chargement.
export async function importData() {
  const legacyData = await getLegacyData();
  if (legacyData.length !== 29) {
    throw new Error(`Import interrompu : 29 contenus étaient attendus, ${legacyData.length} reçus.`);
  }

  const existingContents = await getContents();
  if (!Array.isArray(existingContents)) {
    throw new Error("Import interrompu : impossible de lire la collection MockAPI.");
  }

  const identity = ({ title, type, releaseYear }) =>
    `${String(title ?? "").trim().toLocaleLowerCase("fr")}::${type}::${releaseYear}`;
  const sourceKeys = legacyData.map(identity);
  if (new Set(sourceKeys).size !== sourceKeys.length) {
    throw new Error("Import interrompu : des contenus originaux ont la même identité (titre, type, année).");
  }

  const existingKeys = new Set(existingContents.map(identity));
  const existingCounts = existingContents.reduce((counts, content) => {
    const key = identity(content);
    counts.set(key, (counts.get(key) || 0) + 1);
    return counts;
  }, new Map());
  const preExistingDuplicates = [...existingCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([key]) => key);
  const imported = [];
  const skipped = [];

  for (const { id, ...content } of legacyData) {
    const key = identity(content);
    if (existingKeys.has(key)) {
      skipped.push(content.title);
      continue;
    }

    const created = await createContent(content);
    imported.push(created);
    existingKeys.add(key);
  }

  const verifiedContents = await getContents();
  if (!Array.isArray(verifiedContents)) {
    throw new Error("Vérification après import impossible : la réponse MockAPI n'est pas une liste.");
  }
  const verifiedKeys = new Set(verifiedContents.map(identity));
  const missing = legacyData.filter(content => !verifiedKeys.has(identity(content)));

  if (missing.length) {
    throw new Error(`Vérification après import : ${missing.length} contenu(s) sont absents (${missing.map(item => item.title).join(", ")}).`);
  }

  const valueMatches = (actual, expected) => JSON.stringify(actual) === JSON.stringify(expected);
  const mismatched = legacyData.filter(({ id, ...expected }) => {
    const actual = verifiedContents.find(item => identity(item) === identity(expected));
    return !actual || Object.entries(expected).some(([field, value]) => !valueMatches(actual[field], value));
  });

  if (mismatched.length) {
    throw new Error(`Vérification après import : ces contenus existent mais leurs champs diffèrent de la source : ${mismatched.map(item => item.title).join(", ")}.`);
  }

  // Les IDs MockAPI peuvent différer de ceux du JSON d'origine. Met à jour
  // les favoris enregistrés en local pour qu'ils pointent vers les nouveaux IDs.
  try {
    const favoriteIds = JSON.parse(localStorage.getItem("favoris") || "[]");
    if (Array.isArray(favoriteIds)) {
      const migratedFavorites = favoriteIds.map(favoriteId => {
        const original = legacyData.find(item => String(item.id) === String(favoriteId));
        if (!original) return String(favoriteId);
        const migrated = verifiedContents.find(item => identity(item) === identity(original));
        return migrated ? String(migrated.id) : String(favoriteId);
      });
      localStorage.setItem("favoris", JSON.stringify([...new Set(migratedFavorites)]));
    }
  } catch (error) {
    console.warn("Les contenus ont été importés, mais les favoris locaux n'ont pas pu être migrés.", error);
  }

  return {
    total: legacyData.length,
    imported,
    skipped,
    countAfterImport: verifiedContents.length,
    preExistingDuplicates,
  };
}
