import {
    loadComments,
    saveLocalComment,
    syncComment,
} from "./comments.js";

const info = document.getElementById("info-container");
const closeBtn = document.getElementById("close-modal");
const modale = document.getElementById("modal");
let currentFilm = null;
let visibleComments = [];

function addDetail(parent, label, value) {
    const row = document.createElement("p");
    const name = document.createElement("strong");
    name.textContent = `${label} : `;
    row.append(name, document.createTextNode(value ?? "—"));
    parent.append(row);
}

function showFilmDetails(film) {
    info.replaceChildren();
    const details = document.createElement("section");
    const image = document.createElement("img");
    image.src = film.image || "";
    image.alt = film.title ? `Affiche de ${film.title}` : "Affiche du contenu";
    image.className = "w-full h-64 object-cover rounded-lg";
    details.append(image);

    const title = document.createElement("h3");
    title.className = "text-2xl font-bold mt-4";
    title.textContent = film.title ?? "Sans titre";
    details.append(title);

    addDetail(details, "Type", film.type === "series" ? "Série" : "Film");
    addDetail(details, "Année", film.releaseYear);
    if (film.type === "movie") {
        addDetail(details, "Durée", film.duration != null ? `${film.duration} min` : "—");
    } else {
        const count = Array.isArray(film.seasons) ? film.seasons.length : film.seasons;
        addDetail(details, "Saisons", count ?? "—");
    }
    addDetail(details, "Description", film.description);
    addDetail(details, "Genres", Array.isArray(film.genres) ? film.genres.join(", ") : film.genres);
    addDetail(details, "Réalisateurs", Array.isArray(film.directors) ? film.directors.join(", ") : film.directors);
    addDetail(details, "Pays", Array.isArray(film.productionCountries) ? film.productionCountries.join(", ") : film.productionCountries);
    info.append(details, createCommentsSection());
}

function createCommentsSection() {
    const section = document.createElement("section");
    section.className = "mt-6 border-t border-gray-700 pt-5";

    const heading = document.createElement("h4");
    heading.className = "text-xl font-bold mb-3";
    heading.textContent = "Commentaires";

    const status = document.createElement("p");
    status.id = "comment-status";
    status.className = "text-sm text-gray-300 mb-3";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    const comments = document.createElement("div");
    comments.id = "comments-list";
    comments.className = "space-y-3";

    const ratingSummary = document.createElement("p");
    ratingSummary.id = "comment-rating-summary";
    ratingSummary.className = "mb-3 text-sm text-gray-300";

    const form = document.createElement("form");
    form.id = "comment-form";
    form.noValidate = true;
    form.className = "mt-5 space-y-3";
    form.innerHTML = `
        <h5 class="font-semibold">Ajouter un commentaire</h5>
        <label class="block text-sm" for="comment-author">Votre nom</label>
        <input id="comment-author" name="author" required maxlength="80"
            class="w-full rounded border border-gray-600 bg-gray-800 p-2 text-white" />
        <p id="comment-author-error" class="hidden text-sm text-red-400"></p>
        <label class="block text-sm" for="comment-text">Commentaire</label>
        <textarea id="comment-text" name="text" required maxlength="1000" rows="3"
            class="w-full rounded border border-gray-600 bg-gray-800 p-2 text-white"></textarea>
        <p id="comment-text-error" class="hidden text-sm text-red-400"></p>
        <label class="block text-sm" for="comment-rating">Note (facultative)</label>
        <select id="comment-rating" name="rating" class="rounded border border-gray-600 bg-gray-800 p-2 text-white">
            <option value="">Sans note</option>
            <option value="1">1 / 5</option><option value="2">2 / 5</option>
            <option value="3">3 / 5</option><option value="4">4 / 5</option>
            <option value="5">5 / 5</option>
        </select>
        <button type="submit" class="block rounded bg-red-700 px-4 py-2 font-semibold text-white hover:bg-red-800">
            Publier
        </button>`;

    section.append(heading, status, ratingSummary, comments, form);
    return section;
}

function renderComments(comments) {
    const container = document.getElementById("comments-list");
    if (!container) return;
    container.replaceChildren();

    const ratings = comments
        .map(comment => Number(comment.rating))
        .filter(rating => Number.isFinite(rating) && rating >= 1 && rating <= 5);
    const average = ratings.length
        ? ratings.reduce((total, rating) => total + rating, 0) / ratings.length
        : null;
    const ratingSummary = document.getElementById("comment-rating-summary");
    if (ratingSummary) {
        ratingSummary.textContent = average === null
            ? "Aucune note pour le moment."
            : `Note moyenne : ${average.toFixed(1)}/5 (${ratings.length} avis)`;
    }

    if (!comments.length) {
        const empty = document.createElement("p");
        empty.className = "text-sm text-gray-400";
        empty.textContent = "Aucun commentaire pour le moment.";
        container.append(empty);
        return;
    }

    comments.forEach(comment => {
        const article = document.createElement("article");
        article.className = "rounded-lg border border-gray-700 bg-gray-800/70 p-3";

        const header = document.createElement("div");
        header.className = "flex flex-wrap items-center justify-between gap-2";
        const author = document.createElement("strong");
        author.textContent = comment.author || "Anonyme";
        header.append(author);

        const metadata = [];
        if (comment.createdAt) {
            const date = new Date(comment.createdAt);
            metadata.push(Number.isNaN(date.getTime()) ? String(comment.createdAt) : date.toLocaleDateString("fr-FR"));
        }
        if (comment.rating != null && comment.rating !== "") metadata.push(`Note : ${comment.rating}/5`);
        if (metadata.length) {
            const meta = document.createElement("span");
            meta.className = "text-xs text-gray-400";
            meta.textContent = metadata.join(" · ");
            header.append(meta);
        }

        const text = document.createElement("p");
        text.className = "mt-2 whitespace-pre-wrap text-sm";
        text.textContent = comment.text ?? "";
        article.append(header, text);
        container.append(article);
    });
}

async function refreshComments(contentId) {
    const status = document.getElementById("comment-status");
    if (!status) return;
    status.textContent = "Chargement des commentaires…";

    const result = await loadComments(contentId);
    if (!currentFilm || String(currentFilm.id) !== String(contentId)) return;
    visibleComments = result.comments;
    renderComments(visibleComments);
    status.textContent = result.apiAvailable
        ? (result.storageAvailable ? "" : "Les commentaires sont chargés, mais le stockage local est indisponible.")
        : `L’API des commentaires est indisponible (${result.error.message}). Les commentaires enregistrés sur cet appareil restent visibles.`;
}

export function openModal(film) {
    if (!film || !info || !modale) return;
    currentFilm = film;
    visibleComments = [];
    showFilmDetails(film);
    modale.classList.remove("hidden");
    modale.classList.add("flex");
    refreshComments(String(film.id));
}

export function closeModal() {
    if (!modale) return;
    currentFilm = null;
    modale.classList.add("hidden");
    modale.classList.remove("flex");
}

async function submitComment(event) {
    if (event.target.id !== "comment-form") return;
    event.preventDefault();

    const authorInput = document.getElementById("comment-author");
    const textInput = document.getElementById("comment-text");
    const authorError = document.getElementById("comment-author-error");
    const textError = document.getElementById("comment-text-error");
    const author = authorInput.value.trim();
    const text = textInput.value.trim();
    authorError.textContent = author ? "" : "Le nom est obligatoire.";
    textError.textContent = text ? "" : "Le commentaire est obligatoire.";
    authorError.classList.toggle("hidden", Boolean(author));
    textError.classList.toggle("hidden", Boolean(text));
    if (!author || !text || !currentFilm) return;

    const comment = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        contentId: String(currentFilm.id),
        author,
        text,
        rating: document.getElementById("comment-rating").value
            ? Number(document.getElementById("comment-rating").value)
            : null,
        createdAt: new Date().toISOString(),
    };
    const saved = saveLocalComment(comment);
    visibleComments = [...visibleComments, comment];
    renderComments(visibleComments);
    event.target.reset();

    const status = document.getElementById("comment-status");
    status.textContent = saved
        ? "Commentaire enregistré sur cet appareil. Synchronisation avec MockAPI…"
        : "Le stockage local est indisponible ; tentative de synchronisation avec MockAPI…";

    try {
        await syncComment(comment);
        if (currentFilm && String(currentFilm.id) === comment.contentId) {
            renderComments(visibleComments);
            status.textContent = "Commentaire synchronisé avec MockAPI et sauvegardé localement.";
        }
    } catch (error) {
        if (currentFilm && String(currentFilm.id) === comment.contentId) {
            status.textContent = `Commentaire conservé localement ; synchronisation impossible (${error.message}).`;
        }
    }
}

export function initModal() {
    closeBtn?.addEventListener("click", closeModal);
    modale?.addEventListener("click", event => {
        if (event.target === modale) closeModal();
    });
    info?.addEventListener("submit", submitComment);
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && modale && !modale.classList.contains("hidden")) closeModal();
    });
}
