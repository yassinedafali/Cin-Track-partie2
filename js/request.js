import { API_BASE_URL, COMMENTS_RESOURCE, CONTENTS_RESOURCE } from "./config.js";

export async function request(path = `/${CONTENTS_RESOURCE}`, options = {}) {
  if (!API_BASE_URL) {
    throw new Error("Endpoint MockAPI non configuré : ajoutez votre URL personnelle dans js/config.js.");
  }

  const apiRoot = API_BASE_URL.replace(/\/+$/, "");
  const route = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${apiRoot}${route}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Erreur API : HTTP ${response.status}${details ? ` — ${details}` : ""}`);
  }

  if (response.status === 204) return null;
  const body = await response.text();
  return body ? JSON.parse(body) : null;
}

const contentsPath = `/${CONTENTS_RESOURCE}`;
const commentsPath = `/${COMMENTS_RESOURCE}`;

export const getContents = () => request(contentsPath);
export const getContent = id => request(`${contentsPath}/${encodeURIComponent(String(id))}`);
export const createContent = content => request(contentsPath, {
  method: "POST",
  body: JSON.stringify(content),
});
export const updateContent = (id, content) => request(`${contentsPath}/${encodeURIComponent(String(id))}`, {
  method: "PUT",
  body: JSON.stringify(content),
});
export const deleteContent = id => request(`${contentsPath}/${encodeURIComponent(String(id))}`, {
  method: "DELETE",
});

export const getComments = () => request(commentsPath);
export const createComment = comment => request(commentsPath, {
  method: "POST",
  body: JSON.stringify(comment),
});
