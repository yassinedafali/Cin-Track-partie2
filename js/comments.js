import { createComment, getComments } from "./api.js";

const STORAGE_KEY = "cinetrack-comments";

function readLocalComments() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value.filter(comment => comment && typeof comment === "object") : [];
  } catch {
    return [];
  }
}

function writeLocalComments(comments) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
    return true;
  } catch {
    return false;
  }
}

function commentKey(comment) {
  if (comment.createdAt) {
    return `${String(comment.contentId)}|${comment.author}|${comment.text}|${comment.createdAt}`;
  }
  return `id:${String(comment.id)}`;
}

export function getLocalComments(contentId) {
  return readLocalComments().filter(comment => String(comment.contentId) === String(contentId));
}

export function saveLocalComment(comment) {
  const comments = readLocalComments();
  comments.push(comment);
  return writeLocalComments(comments);
}

export function replaceLocalComment(localId, serverComment) {
  if (!serverComment || typeof serverComment !== "object") return false;
  const comments = readLocalComments().filter(comment => String(comment.id) !== String(localId));
  comments.push(serverComment);
  return writeLocalComments(comments);
}

export async function loadComments(contentId) {
  const localComments = readLocalComments();

  try {
    const remoteComments = await getComments();
    if (!Array.isArray(remoteComments)) throw new Error("La réponse des commentaires n'est pas une liste.");

    const relevant = remoteComments.filter(comment => String(comment.contentId) === String(contentId));
    const merged = new Map();
    [...relevant, ...localComments.filter(comment => String(comment.contentId) === String(contentId))]
      .forEach(comment => merged.set(commentKey(comment), comment));

    const allComments = localComments.filter(comment => String(comment.contentId) !== String(contentId));
    const comments = [...merged.values()];
    const storageAvailable = writeLocalComments([...allComments, ...comments]);
    return { comments, apiAvailable: true, storageAvailable };
  } catch (error) {
    return {
      comments: localComments.filter(comment => String(comment.contentId) === String(contentId)),
      apiAvailable: false,
      storageAvailable: true,
      error,
    };
  }
}

export async function syncComment(comment) {
  const { id: localId, ...payload } = comment;
  const serverComment = await createComment(payload);
  if (serverComment && typeof serverComment === "object") replaceLocalComment(localId, serverComment);
  return serverComment;
}
