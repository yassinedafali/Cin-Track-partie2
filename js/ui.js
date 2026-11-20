export function setPageStatus(message, state = "info") {
  const status = document.getElementById("catalog-status");
  if (!status) return;

  status.textContent = message;
  status.classList.remove("hidden", "text-red-200", "text-amber-200", "text-gray-200");
  status.classList.add(
    state === "error" ? "text-red-200" : state === "warning" ? "text-amber-200" : "text-gray-200"
  );
}

export function clearPageStatus() {
  const status = document.getElementById("catalog-status");
  if (!status) return;
  status.textContent = "";
  status.classList.add("hidden");
}

export function showNotice(element, message, state = "error") {
  if (!element) return;
  element.textContent = message;
  element.className = `notice notice--${state}`;
}

export function clearNotice(element, hiddenClass = "is-hidden") {
  if (!element) return;
  element.textContent = "";
  element.className = `notice ${hiddenClass}`;
}
