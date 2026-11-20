
export function initFilter(data, onResults) {

    const search = document.getElementById("search-film");
    const filter = document.getElementById("filter-status");
    const clear = document.getElementById("clear-btn");

    let debounceTimer;

    function searchAndFilter() {
        clearTimeout(debounceTimer);
        if (!search || !filter) return;

        let recherche = search.value.trim().toLowerCase();
        let valeur = filter.value;

        let resultats = data.filter(film => {

            return String(film.title ?? "").trim().toLowerCase().includes(recherche)
                && (valeur === "all" || valeur === film.type);

        });

        onResults(resultats);
    }

    search?.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(searchAndFilter, 250);
    });

    filter?.addEventListener("change", searchAndFilter);

    clear?.addEventListener("click", () => {
        clearTimeout(debounceTimer);

        search.value = "";
        filter.value = "all";

        searchAndFilter();
    });
}
