import { createContent, deleteContent, getContents, updateContent } from "./api.js";
import { clearNotice, showNotice } from "./ui.js";
import { validateContentForm } from "./validation.js";

const form = document.getElementById("content-form");
const list = document.getElementById("admin-contents-body");
const status = document.getElementById("error");
const typeInput = document.getElementById("type");
const durationInput = document.getElementById("duration");
const seasonsInput = document.getElementById("seasons");
const durationField = document.getElementById("duration-field");
const seasonsField = document.getElementById("seasons-field");
const imageInput = document.getElementById("poster");
const imagePreview = document.getElementById("image-preview");
const yearInput = document.getElementById("releaseYear");
const contentIdInput = document.getElementById("content-id");
const cancelButton = document.getElementById("cancel-btn");
const submitButton = document.getElementById("submit-btn");
let contentsCache = [];

yearInput.max = String(new Date().getFullYear());

function showMessage(message, kind = "error") {
  showNotice(status, message, kind);
}

function clearMessage() {
  clearNotice(status);
}

const errorFields = ["title", "type", "releaseYear", "poster", "duration", "seasons"];

function setFieldError(field, message = "") {
  const input = document.getElementById(field);
  const error = document.getElementById(`${field}-error`);
  error.textContent = message;
  if (message) input.setAttribute("aria-invalid", "true");
  else input.removeAttribute("aria-invalid");
}

function clearFieldErrors() {
  errorFields.forEach(field => setFieldError(field));
}

function syncTypeFields() {
  const isMovie = typeInput.value === "movie";
  durationField.classList.toggle("is-hidden", !isMovie);
  seasonsField.classList.toggle("is-hidden", isMovie);
  durationInput.required = isMovie;
  seasonsInput.required = !isMovie;
  setFieldError(isMovie ? "seasons" : "duration");
}

function splitList(value) {
  return value.split(",").map(item => item.trim()).filter(Boolean);
}

function joinList(value) {
  return Array.isArray(value) ? value.join(", ") : (value ?? "");
}

function renderContents(contents) {
  contentsCache = contents;
  list.replaceChildren();
  document.getElementById("contents-count").textContent = String(contents.length);

  if (!contents.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "table-message";
    cell.textContent = "Aucun contenu n'est enregistré dans MockAPI.";
    row.append(cell);
    list.append(row);
    return;
  }

  const rows = contents.map(content => {
    const row = document.createElement("tr");
    const imageCell = document.createElement("td");
    const titleCell = document.createElement("td");
    const typeCell = document.createElement("td");
    const yearCell = document.createElement("td");
    const actionsCell = document.createElement("td");
    const image = document.createElement("img");

    image.src = content.image || "";
    image.alt = content.title ? `Affiche de ${content.title}` : "Affiche du contenu";
    image.loading = "lazy";
    image.className = "content-image";
    imageCell.className = "image-cell";
    imageCell.append(image);

    titleCell.className = "content-title";
    titleCell.textContent = content.title ?? "Sans titre";
    typeCell.className = "content-type";
    typeCell.textContent = content.type === "series" ? "Série" : "Film";
    yearCell.className = "content-year";
    yearCell.textContent = String(content.releaseYear ?? "—");
    actionsCell.className = "actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.dataset.action = "edit";
    editButton.dataset.id = String(content.id);
    editButton.className = "action-button action-button--edit";
    editButton.setAttribute("aria-label", `Modifier ${content.title ?? "ce contenu"}`);
    editButton.innerHTML = '<i class="fa-solid fa-pen-to-square" aria-hidden="true"></i><span>Modifier</span>';

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = String(content.id);
    deleteButton.className = "action-button action-button--delete";
    deleteButton.setAttribute("aria-label", `Supprimer ${content.title ?? "ce contenu"}`);
    deleteButton.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i><span>Supprimer</span>';

    actionsCell.append(editButton, deleteButton);
    row.append(imageCell, titleCell, typeCell, yearCell, actionsCell);
    return row;
  });
  list.append(...rows);
}

function renderTableMessage(message, kind = "error") {
  list.replaceChildren();
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.colSpan = 5;
  cell.className = `table-message${kind === "error" ? " table-message--error" : ""}`;
  cell.textContent = message;
  row.append(cell);
  list.append(row);
}

async function refreshContents() {
  renderTableMessage("Chargement des contenus depuis MockAPI…", "loading");
  const contents = await getContents();
  if (!Array.isArray(contents)) throw new Error("La réponse de MockAPI n'est pas une liste.");
  renderContents(contents);
  return contents;
}

function resetForm() {
  form.reset();
  clearFieldErrors();
  contentIdInput.value = "";
  document.getElementById("form-title").textContent = "Ajouter un contenu";
  submitButton.textContent = "Ajouter";
  cancelButton.classList.add("is-hidden");
  imagePreview.removeAttribute("src");
  imagePreview.classList.add("is-hidden");
  syncTypeFields();
}

function beginEdit(id) {
  // find() garde le rendu du tableau et la sélection fondés sur le même jeu de données.
  const content = contentsCache.find(item => String(item.id) === String(id));
  if (!content) {
    showMessage("Ce contenu n'est plus dans la liste. Actualisez les données et réessayez.");
    return;
  }

  contentIdInput.value = String(content.id);
  document.getElementById("title").value = content.title ?? "";
  typeInput.value = content.type === "series" ? "series" : "movie";
  yearInput.value = content.releaseYear ?? "";
  imageInput.value = content.image ?? "";
  document.getElementById("description").value = content.description ?? "";
  document.getElementById("genres").value = joinList(content.genres);
  document.getElementById("directors").value = joinList(content.directors);
  document.getElementById("productionCountries").value = joinList(content.productionCountries);
  durationInput.value = content.duration ?? "";
  seasonsInput.value = Array.isArray(content.seasons) ? content.seasons.length : (content.seasons ?? "");
  syncTypeFields();

  if (imageInput.value) {
    imagePreview.src = imageInput.value;
    imagePreview.classList.remove("is-hidden");
  } else {
    imagePreview.classList.add("is-hidden");
  }

  document.getElementById("form-title").textContent = `Modifier : ${content.title ?? "contenu"}`;
  submitButton.textContent = "Modifier";
  cancelButton.classList.remove("is-hidden");
  clearMessage();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function buildContentFromForm() {
  const content = {
    title: document.getElementById("title").value.trim(),
    image: imageInput.value.trim(),
    description: document.getElementById("description").value.trim(),
    type: typeInput.value,
    releaseYear: Number(yearInput.value),
    genres: splitList(document.getElementById("genres").value),
    directors: splitList(document.getElementById("directors").value),
    productionCountries: splitList(document.getElementById("productionCountries").value),
  };

  if (content.type === "movie") {
    content.duration = Number(durationInput.value);
  } else {
    const seasonCount = Number(seasonsInput.value);
    content.seasons = Array.from({ length: seasonCount }, (_, index) => index + 1);
  }
  return content;
}

function validateForm() {
  clearFieldErrors();
  const errors = validateContentForm({
    title: document.getElementById("title").value,
    type: typeInput.value,
    releaseYear: yearInput.value,
    image: imageInput.value,
    duration: durationInput.value,
    seasons: seasonsInput.value,
  });

  Object.entries(errors).forEach(([field, message]) => {
    setFieldError(field, message);
  });
  return Object.values(errors).every(message => !message);
}

typeInput.addEventListener("change", syncTypeFields);
syncTypeFields();

errorFields.forEach(field => {
  const input = document.getElementById(field);
  input.addEventListener("input", () => setFieldError(field));
  input.addEventListener("change", () => setFieldError(field));
});

imageInput.addEventListener("input", () => {
  const validUrl = imageInput.validity.valid && imageInput.value.trim();
  imagePreview.classList.toggle("is-hidden", !validUrl);
  if (validUrl) imagePreview.src = imageInput.value.trim();
});
imagePreview.addEventListener("error", () => imagePreview.classList.add("is-hidden"));

cancelButton.addEventListener("click", () => {
  resetForm();
  clearMessage();
});

list.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  if (action === "edit") {
    beginEdit(id);
    return;
  }

  if (action === "delete") {
    const content = contentsCache.find(item => String(item.id) === String(id));
    if (!content || !confirm(`Supprimer « ${content.title} » ?`)) return;

    button.disabled = true;
    try {
      await deleteContent(id);
      contentsCache = contentsCache.filter(item => String(item.id) !== String(id));
    } catch (error) {
      showMessage(`Impossible de supprimer le contenu : ${error.message}`);
      button.disabled = false;
      return;
    }

    if (contentIdInput.value === String(id)) resetForm();
    renderContents(contentsCache);
    showMessage("Le contenu a été supprimé de MockAPI.", "success");
  }
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  clearMessage();

  if (!validateForm()) return;

  const id = contentIdInput.value;
  const content = buildContentFromForm();
  submitButton.disabled = true;
  submitButton.textContent = id ? "Modification…" : "Enregistrement…";

  try {
    if (id) {
      await updateContent(id, content);
    } else {
      await createContent(content);
    }
    resetForm();
    try {
      await refreshContents();
      showMessage(id ? "Le contenu a été modifié dans MockAPI." : "Le contenu a été ajouté à MockAPI.", "success");
    } catch (refreshError) {
      showMessage(`Enregistrement effectué, mais la liste n'a pas pu être actualisée : ${refreshError.message}`, "warning");
    }
  } catch (error) {
    showMessage(`Impossible d'enregistrer le contenu : ${error.message}`);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = contentIdInput.value ? "Modifier" : "Ajouter";
  }
});

refreshContents().catch(error => {
  renderTableMessage(`Chargement depuis MockAPI impossible : ${error.message}`);
  showMessage(`Impossible de charger les contenus : ${error.message}`);
});
