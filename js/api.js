// Façade métier conservée pour les imports du catalogue, de l'administration
// et de la modal. Les routes HTTP sont centralisées dans request.js.
export {
  request,
  getContents,
  getContent,
  createContent,
  updateContent,
  deleteContent,
  getComments,
  createComment,
} from "./request.js";
