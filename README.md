# CinéTrack

**Auteur : Yassine Dafali**

CinéTrack est un catalogue web de films et séries réalisé pour pratiquer JavaScript, les modules ES, la manipulation du DOM et les API REST.

## Fonctionnalités

### Catalogue

- Affichage des films et séries sous forme de cartes.
- Recherche par titre avec filtrage progressif.
- Filtrage par type et pagination.
- Modal de détails avec commentaires, dates et notes.
- Ajout et retrait de favoris, persistés dans `localStorage`.
- Commentaires synchronisés avec MockAPI et conservés localement.

### Administration

- Liste des contenus provenant de MockAPI.
- Ajout avec `POST`, modification avec `PUT` et suppression confirmée avec `DELETE`.
- Validation des champs et prévisualisation de l'image.
- Les genres, réalisateurs et pays de production sont saisis sous forme de listes séparées par des virgules.

## Technologies

- HTML5 et CSS (Tailwind CSS pour le catalogue, feuille CSS dédiée à Admin).
- JavaScript ES modules, Fetch API, `async`/`await`.
- MockAPI pour les contenus et commentaires.
- `localStorage` pour les favoris et une copie locale des commentaires.
- Font Awesome pour les icônes Admin.

## Architecture

```text
.
├── index.html
├── css/
│   └── admin.css
├── img/
└── js/
    ├── Admin.html
    ├── admin.js
    ├── api.js
    ├── comments.js
    ├── config.js
    ├── Favorites.js
    ├── filter.js
    ├── main.js
    ├── modale.js
    ├── render.js
    ├── request.js
    ├── store.js
    ├── ui.js
    └── validation.js
```

- `config.js` contient les routes et l'URL racine MockAPI.
- `request.js` centralise les appels HTTP ; `api.js` expose les fonctions métier.
- `store.js` charge les contenus et contient l'import idempotent des 29 fiches de la Partie 1.
- `main.js`, `filter.js`, `render.js` et `Favorites.js` pilotent le catalogue.
- `modale.js` et `comments.js` affichent et synchronisent les commentaires.
- `admin.js`, `validation.js` et `ui.js` gèrent l'administration, la validation et les messages.

## Configuration MockAPI

La configuration du projet utilise les routes suivantes :

- Contenus : `https://6afaf139730c1d152f32cdeb.mockapi.io/cinitrack/cinemas`
- Commentaires : `https://6afaf139730c1d152f32cdeb.mockapi.io/cinitrack/comments`

Le schéma des contenus comprend `id`, `title`, `image`, `description`, `type`, `releaseYear`, ainsi que `duration` pour un film ou `seasons` pour une série, et les tableaux `genres`, `directors`, `productionCountries`.

Le schéma des commentaires comprend `id`, `contentId`, `author`, `text`, `rating` et `createdAt`.

## Installation et lancement

```bash
git clone https://github.com/yassinedafali/Cin-Track-partie2.git
cd Cin-Track-partie2
```

Ouvrir le dossier dans VS Code et lancer `index.html` avec Live Server. La page Admin est accessible depuis le lien **Admin** dans l'en-tête.

## Vérification manuelle

1. Vérifier que le catalogue charge les contenus, puis essayer la recherche, les filtres, la pagination, les favoris et la modal.
2. Dans Admin, ajouter un film puis une série, modifier un contenu, annuler une modification, puis supprimer un contenu de test après confirmation.
3. Dans la modal, ajouter un commentaire et vérifier sa présence après rechargement.

## Liens

- Dépôt GitHub : [Cin-Track-partie2](https://github.com/yassinedafali/Cin-Track-partie2)
- API MockAPI : configurée dans [`js/config.js`](js/config.js)

**Projet réalisé par Yassine Dafali dans le cadre de la formation YouCode.**
