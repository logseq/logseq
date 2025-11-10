# Analyse de l'Architecture de Logseq

*Analyse complète de la codebase Logseq - Généré le 2025-11-10*

---

## Table des matières

1. [Vue d'ensemble du projet](#1-vue-densemble-du-projet)
2. [Stack technologique](#2-stack-technologique)
3. [Structure des répertoires](#3-structure-des-répertoires)
4. [Patterns architecturaux](#4-patterns-architecturaux)
5. [Modules et composants clés](#5-modules-et-composants-clés)
6. [Configuration de build et déploiement](#6-configuration-de-build-et-déploiement)
7. [Approche de test](#7-approche-de-test)
8. [Conventions et patterns](#8-conventions-et-patterns)
9. [Décisions architecturales](#9-décisions-architecturales)
10. [Gestion des dépendances](#10-gestion-des-dépendances)
11. [Fonctionnalités spéciales](#11-fonctionnalités-spéciales)
12. [Optimisations de performance](#12-optimisations-de-performance)

---

## 1. Vue d'ensemble du projet

### Qu'est-ce que Logseq ?

**Logseq** est une plateforme open-source de gestion de connaissances axée sur la confidentialité. Il s'agit d'une application sophistiquée de prise de notes basée sur un outliner qui supporte :

- **Graphes basés sur des fichiers** (Markdown/Org-mode)
- **Graphes basés sur une base de données** (SQLite avec DataScript)
- **Annotation de PDF**
- **Gestion de tâches**
- **Fonctionnalités whiteboard/canvas**
- **Écosystème de plugins**
- **Collaboration en temps réel (RTC)**
- **Applications mobile et desktop**

### État actuel

Le projet est actuellement en version beta pour la nouvelle version basée sur une base de données (DB graphs), qui représente une évolution architecturale significative par rapport au système original basé sur des fichiers.

---

## 2. Stack technologique

### 2.1 Langages et frameworks principaux

#### Langages
- **ClojureScript** - Langage principal pour la logique frontend
- **Clojure** - Outillage et scripts backend
- **JavaScript/TypeScript** - Outillage Node.js, pont mobile, workers
- **OCaml** - Bibliothèque de parseur mldoc

#### Framework frontend
- **React 18.3.1** - Rendu de l'interface utilisateur
- **Rum** - Wrapper React en ClojureScript avec gestion d'état améliorée
- **Reitit** - Routage

### 2.2 Base de données et gestion d'état

- **DataScript** - Base de données Datalog en mémoire (version forkée)
  - Localisation : `deps/datascript` (dépendance git)
  - Base de données immuable avec requêtes Datalog
- **SQLite WASM** (@sqlite.org/sqlite-wasm) pour les DB graphs
- **Clojure Atoms** pour la gestion de l'état UI
- **Missionary** - Programmation réactive pour les flux async

### 2.3 Outils de build et bundlers

- **Shadow-CLJS 2.28.23** - Compilation ClojureScript
  - Config : `/shadow-cljs.edn`
  - Cibles multiples : app, mobile, electron, workers, publishing
- **Gulp 4.x** - Pipeline d'assets, copie de fichiers
  - Config : `/gulpfile.js`
- **Webpack 5** - Bundling JavaScript pour workers
  - Config : `/webpack.config.js`
- **Babashka** - Automatisation de tâches et scripting
  - Config : `/bb.edn`

### 2.4 Styling

- **TailwindCSS 3.3.5** - CSS utility-first
  - Config : `/tailwind.config.js`
- **Radix UI Colors** - Couleurs du design system
- **PostCSS** - Traitement CSS

### 2.5 Mobile

- **Capacitor 7.2.0** - Pont natif mobile
  - Config : `/capacitor.config.ts`
  - Support iOS et Android
- **Architecture similaire à React Native** via plugins Capacitor

### 2.6 Bibliothèques clés

| Bibliothèque | Version | Usage |
|--------------|---------|-------|
| Excalidraw | 0.16.1 | Dessins/diagrammes |
| TLDraw | Custom fork | Whiteboards |
| PDF.js | 4.2.67 | Rendu et annotation PDF |
| KaTeX | - | Rendu mathématique |
| CodeMirror | 5 | Éditeur de code |
| Marked.js | - | Parsing Markdown |
| mldoc | 1.5.9 | Parseur de documents (OCaml) |
| isomorphic-git | - | Opérations Git dans le navigateur |
| Hugging Face Transformers | - | Fonctionnalités ML/AI |
| SCI | - | Interpréteur Clojure pour plugins |
| Comlink | - | Communication Web Worker |

---

## 3. Structure des répertoires

```
/home/user/logseq/
├── .github/              # Workflows CI/CD (GitHub Actions)
├── android/              # App mobile Android (Capacitor)
├── ios/                  # App mobile iOS (Capacitor)
├── assets/               # Assets statiques
├── clj-e2e/              # Tests end-to-end (basés sur Clojure)
├── deps/                 # Bibliothèques ClojureScript internes
│   ├── cli/              # Utilitaires CLI
│   ├── common/           # Code partagé entre toutes les plateformes
│   ├── db/               # Couche database (SQLite + DataScript)
│   ├── graph-parser/     # Parseur pour graphes Logseq
│   ├── outliner/         # Opérations et logique outliner
│   ├── publishing/       # Publication de sites statiques
│   └── shui/             # Bibliothèque de composants UI (basée sur shadcn)
├── docs/                 # Documentation développeur
├── libs/                 # Bibliothèques additionnelles
├── packages/             # Packages JavaScript
│   ├── amplify/          # Intégration Amplify
│   ├── tldraw/           # Fork custom de TLDraw
│   └── ui/               # Système de composants UI (TypeScript/React)
├── public/               # Fichiers statiques publics
├── resources/            # Fichiers de ressources copiés vers static/
├── scripts/              # Scripts de build et utilitaires
├── src/                  # Code source principal
│   ├── main/
│   │   ├── electron/     # Code processus principal Electron
│   │   ├── frontend/     # Application frontend principale
│   │   │   ├── common/   # Code commun (worker & frontend)
│   │   │   ├── components/  # Composants React/Rum
│   │   │   ├── db/       # Couche d'interaction database
│   │   │   ├── extensions/  # Modules d'extension (code, excalidraw, tldraw)
│   │   │   ├── handler/  # Gestionnaires d'événements et logique métier
│   │   │   ├── modules/  # Modules de fonctionnalités
│   │   │   ├── worker/   # Code Web Worker (db-worker, inference-worker)
│   │   │   └── ...       # Autres modules frontend
│   │   ├── logseq/       # API Plugin
│   │   └── mobile/       # Code frontend spécifique mobile
│   ├── electron/         # Utilitaires renderer Electron
│   ├── dev-cljs/         # Utilitaires de développement
│   ├── test/             # Tests ClojureScript
│   ├── bench/            # Benchmarks
│   └── resources/        # Classpath de ressources (traductions, etc.)
├── static/               # Répertoire de sortie du build
├── package.json          # Dépendances Node.js
├── deps.edn              # Dépendances Clojure
├── shadow-cljs.edn       # Configuration build ClojureScript
├── bb.edn                # Tâches Babashka
└── ...                   # Fichiers de configuration
```

---

## 4. Patterns architecturaux

### 4.1 Architecture globale : **Monolithe modulaire avec support multi-plateforme**

L'architecture combine :

1. **Architecture événementielle** (pattern handler)
2. **UI basée sur des composants** (composants React/Rum)
3. **Programmation fonctionnelle** (données immuables, fonctions pures)
4. **Architecture basée sur des workers** (déchargement des opérations lourdes)
5. **Moteur de requêtes Datalog** (base de données DataScript)

### 4.2 Pattern Handler

**Localisation :** `/src/main/frontend/handler/`

Les handlers agissent comme des contrôleurs/coordinateurs :
- **Exemples :** `editor.cljs`, `block.cljs`, `page.cljs`, `plugin.cljs`
- **Rôle :** Orchestrer les changements d'état, mises à jour DB, rendu UI

**Pattern typique :**
```clojure
(defn handler-name [args]
  ;; 1. Valider l'entrée
  ;; 2. Mettre à jour la base de données (transact!)
  ;; 3. Mettre à jour l'état UI
  ;; 4. Déclencher les effets de bord (sauvegarde fichier, etc.)
  )
```

### 4.3 Architecture des composants

**Localisation :** `/src/main/frontend/components/`

- Composants Rum (wrapper React avec état réactif)
- Hiérarchie de composants miroir de la structure UI
- Composants notables :
  - `block.cljs` (205KB+ - édition de blocs core)
  - `editor.cljs` (fonctionnalité éditeur)
  - `file_sync.cljs` (UI de synchronisation)
  - Organisation par fonctionnalité (db_based/, file_based/, block/, cmdk/)

**Pattern de composant Rum :**
```clojure
(rum/defc component-name < rum/reactive [props]
  (let [state (rum/react some-atom)]
    [:div ...]))
```

### 4.4 Architecture Worker

**Localisation :** `/src/main/frontend/worker/`

#### db-worker
- **Entrée :** `/src/main/frontend/worker/db_worker.cljs`
- **Fonction :** Gère les opérations de base de données (SQLite/DataScript)
- **Exécution :** SQLite WASM dans Web Worker
- **Communication :** Utilise Comlink pour communiquer avec le thread principal

#### inference-worker
- **Entrée :** `/src/main/frontend/worker/inference_worker.cljs`
- **Fonction :** Gère les opérations ML/AI
- **Exécution :** Modèles Hugging Face

**Rationale :** Décharger les opérations lourdes du thread principal pour maintenir la réactivité de l'interface.

### 4.5 Architecture de la couche Database

**Système à deux niveaux :**

#### 1. DataScript (base de données Datalog en mémoire)
- Modèle Entity-Attribute-Value (EAV)
- Requêtes réactives
- Fork spécifique à Logseq
- Base de données immuable (time-travel, undo/redo)

#### 2. SQLite (stockage persistant pour DB graphs)
- WASM dans le navigateur
- Natif dans Electron
- Géré par db-worker
- Utilise OPFS (Origin Private File System) pour la persistance

### 4.6 Architecture Graph Parser

**Localisation :** `/deps/graph-parser/`

- **Indépendant de la plateforme** (fonctionne dans le navigateur et CLI)
- **Fonction :** Parse les fichiers Markdown/Org-mode
- **Sortie :** Base de données DataScript
- **Parseur :** Utilise mldoc (parseur OCaml)

### 4.7 Gestion de l'état

**Localisation :** `/src/main/frontend/state.cljs`

- **Grand atom centralisé** (fichier 74KB+)
- **Contenu :** État UI, routing, préférences utilisateur
- **Subscriptions :** Rum reactive subscriptions
- **Séparation :** Distinct de l'état database (DataScript)
- **Granularité :** Utilise des cursors pour la réactivité granulaire

---

## 5. Modules et composants clés

### 5.1 Points d'entrée principaux

#### Application Browser/Desktop
```clojure
/src/main/frontend/core.cljs
- Namespace : frontend.core
- Fonctions : init, start, stop
- Initialise : router, root React, plugins
```

#### Application Mobile
```clojure
/src/main/mobile/core.cljs
- Namespace : mobile.core
- Initialisation et routing spécifiques mobile
```

#### Processus principal Electron
```clojure
/src/electron/electron/core.cljs
- Namespace : electron.core
- Gestion : fenêtres, système de fichiers, IPC
```

### 5.2 Modules Database

#### Gestion des connexions DataScript
- `/src/main/frontend/db/conn.cljs`
- `/src/main/frontend/db/conn_state.cljs`

#### Modèles Database
- `/src/main/frontend/db/model.cljs` (20KB+)
  - Fonctions de requête pour blocks, pages, entités

#### Opérations DB Async
- `/src/main/frontend/db/async.cljs` (15KB+)
  - Opérations database async basées sur Missionary

### 5.3 Modules Handler

**Handlers majeurs :**

| Handler | Taille | Fonction |
|---------|--------|----------|
| `editor.cljs` | 172KB+ | Logique d'édition core |
| `block.cljs` | 13KB | Opérations sur les blocs |
| `page.cljs` | 19KB | Opérations sur les pages |
| `plugin.cljs` | 40KB | Gestion des plugins |
| `file_sync.cljs` | 10KB | Synchronisation de fichiers |
| `events.cljs` | 20KB | Gestion d'événements |

### 5.4 Système de plugins

#### API Plugin
```
/src/main/logseq/api.cljs
- Namespace : logseq.api
- Expose les fonctions pour les développeurs de plugins
- Catégories : app, db, editor, plugin, file-based, db-based
```

#### Handler de plugins
```
/src/main/frontend/handler/plugin.cljs
- Gestion du cycle de vie des plugins
- Système de hooks
- Enregistrement de commandes
```

**Cycle de vie d'un plugin :**
1. Charger le manifeste du plugin (package.json)
2. Initialiser l'environnement du plugin (sandboxé)
3. Enregistrer les hooks et commandes
4. Exécuter le code du plugin (via interpréteur SCI)
5. Nettoyage lors du déchargement

### 5.5 Bibliothèques internes (deps/)

#### graph-parser
- Parse les répertoires de graphes
- Convertit les fichiers en DataScript
- Compatible CLI et frontend
- Utilise nbb-logseq pour l'exécution Node.js

#### outliner
- Opérations outliner (déplacer, indenter, désindenter)
- Opérations transactionnelles
- Utilisé par les graphes file et DB

#### db
- Opérations SQLite
- Gestion de schéma
- Création et export de DB graphs

#### shui
- Bibliothèque de composants UI
- Basée sur shadcn
- Composants partagés

---

## 6. Configuration de build et déploiement

### 6.1 Cibles de build Shadow-CLJS

**Configuration :** `/shadow-cljs.edn`

#### :app - Application web principale
- **Entrée :** `frontend.core/init`
- **Modules :** main, code-editor, excalidraw, tldraw
- **Sortie :** `./static/js`
- **Serveur dev :** port 3001

#### :mobile - Application mobile
- **Entrée :** `mobile.core/init`
- **Modules :** main, code-editor
- **Sortie :** `./static/mobile/js`
- **Serveur dev :** port 3002

#### :electron - Processus principal Electron
- **Entrée :** `electron.core/main`
- **Cible :** Script Node.js
- **Sortie :** `static/electron.js`

#### :db-worker - Worker de base de données
- **Entrée :** `frontend.worker.db-worker/init`
- **Cible :** Web Worker
- **Bundle :** SQLite WASM

#### :inference-worker - Worker d'inférence ML
- **Entrée :** `frontend.inference-worker.inference-worker/init`
- **Cible :** Web Worker

#### :publishing - Publication de site statique
- **Entrée :** `frontend.publishing/init`
- **Fonction :** Export de graphes comme sites statiques

#### :test - Runner de tests
- **Entrée :** `frontend.test.frontend-node-test-runner/main`
- **Cible :** Node.js

### 6.2 Scripts de build (package.json)

#### Développement
```bash
yarn watch              # Mode watch pour dev navigateur
yarn electron-watch     # Mode watch pour dev Electron
yarn mobile-watch       # Mode watch pour dev mobile
```

#### Production
```bash
yarn release           # Build production complet
yarn release-app       # App seulement (pas electron/publishing)
yarn release-mobile    # Build production mobile
yarn release-electron  # Build production Electron
```

#### Tests
```bash
yarn test              # Exécuter tests ClojureScript
yarn cljs:lint         # Lint avec clj-kondo
```

### 6.3 Tâches Gulp

**Configuration :** `/gulpfile.js`

- Synchronisation d'assets (copie node_modules assets)
- Traitement CSS (compilation Tailwind)
- Copie de fichiers de ressources
- Watch de fichiers en développement
- Gestion d'assets mobile

### 6.4 Configuration Webpack

**Configuration :** `/webpack.config.js`

- Bundle des dépendances JavaScript des workers
- Deux configurations : AppConfig, MobileConfig
- Bundle db-worker et inference-worker

### 6.5 Tâches Babashka

**Configuration :** `/bb.edn`

Catégories de tâches :

| Catégorie | Exemples |
|-----------|----------|
| Développement | `dev:desktop-watch`, `dev:electron-start` |
| Mobile | `dev:ios-app`, `dev:android-app` |
| Database | `dev:db-query`, `dev:db-transact`, `dev:db-import` |
| Testing | `dev:test`, `dev:e2e-basic-test` |
| Linting | `lint:kondo`, `lint:carve`, `lint:large-vars` |
| Publishing | `dev:publishing` |

### 6.6 Workflows CI/CD

**Localisation :** `/.github/workflows/`

| Workflow | Fonction |
|----------|----------|
| `build-desktop-release.yml` | Builds desktop macOS/Windows/Linux |
| `build-android.yml` | Builds mobile Android |
| `build-ios-release.yml` | Builds mobile iOS |
| `build.yml` | Vérifications CI principales |
| `cli.yml` | Tests CLI |
| `clj-e2e.yml` | Tests end-to-end |
| `graph-parser.yml` | Tests de la bibliothèque parseur |
| `db.yml` | Tests database |

---

## 7. Approche de test

### 7.1 Structure des tests

#### Tests ClojureScript
```
/src/test/frontend/
- Tests unitaires pour divers modules
- Organisation miroir de src/main
- Fichiers de test terminant par _test.cljs
```

#### Tests E2E
```
/clj-e2e/
- Tests end-to-end basés sur Playwright
- Écrits en Clojure
- Utilise babashka pour l'exécution des tests
```

### 7.2 Technologies de test

#### Tests unitaires ClojureScript
- **Framework :** `cljs-test` (intégré)
- **Runner :** `cljs-run-test`
- **Assertions :** Bibliothèque standard cljs.test

#### Tests E2E
- **Framework :** Playwright 1.51.0
- **Accessibilité :** Axe-core
- **Orchestration :** Babashka

#### Linting & Analyse statique
- **clj-kondo** (2024.09.27) - Linting
- **Carve** - Détection de code mort
- **Malli** - Validation de schéma
- **stylelint** - Linting CSS

### 7.3 Exécution des tests

```bash
# Tests unitaires
yarn test                    # Tests ClojureScript
clojure -M:test             # Tests ClojureScript (alternatif)

# Tests E2E
bb dev:e2e-basic-test       # Tests E2E basiques
bb dev:e2e-rtc-extra-test   # Tests E2E spécifiques RTC

# Linting
yarn cljs:lint              # Exécuter clj-kondo
bb lint:carve               # Détection code mort
bb lint:large-vars          # Vérification variables/fonctions volumineuses
```

---

## 8. Conventions et patterns

### 8.1 Conventions d'organisation du code

#### Conventions de namespace
- `frontend.*` - Code frontend
- `electron.*` - Code Electron
- `mobile.*` - Code spécifique mobile
- `logseq.*` - Bibliothèques cross-platform
- `logseq.api.*` - API Plugin
- `logseq.db.*` - Couche database
- `logseq.shui.*` - Composants UI

#### Nommage de fichiers
- `.cljs` - Fichiers ClojureScript
- `.cljc` - Clojure/ClojureScript cross-platform
- `.clj` - Fichiers Clojure (macros, scripts de build)
- `_test.cljs` - Fichiers de test

### 8.2 Patterns de gestion d'état

#### État global
```clojure
(defonce state (atom {...}))  ; Grand atom centralisé
```

#### État Database
- Géré via connexions DataScript
- Requêtes réactives avec Rum
- Cursors pour réactivité fine

#### État Worker
- Atoms d'état séparés dans les workers
- Communication via Comlink
- Opérations thread-safe

### 8.3 Patterns de composants

#### Composants Rum
```clojure
(rum/defc component-name < rum/reactive [props]
  (let [state (rum/react some-atom)]
    [:div ...]))
```

#### Subscriptions réactives
- Utilise le mixin `rum/reactive`
- `rum/react` pour déréférencer les atoms réactifs
- Re-rendu efficace

### 8.4 Patterns de requêtes Database

#### Requêtes DataScript
```clojure
;; Requêtes d'entité
(d/entity db entity-id)

;; Requêtes Datalog
(d/q '[:find ...
       :where ...]
     db)

;; Requêtes Pull
(d/pull db '[*] entity-id)
```

### 8.5 Patterns Async

#### Promesa (Promises)
```clojure
(p/let [result (async-operation)]
  (handle-result result))
```

#### Missionary (Streams réactifs)
```clojure
(m/watch atom)              ; Observer les changements d'atom
(m/flow flow-definition)    ; Définir des flux de données
```

### 8.6 Support multi-graphe

- Connexions DataScript séparées par graphe
- Identification de graphe par URL/chemin du repo
- État isolé par graphe
- Worker maintient plusieurs connexions DB

---

## 9. Décisions architecturales

### 9.1 Choix de ClojureScript

**Rationale :**
- ✅ Immutabilité par défaut (gestion d'état plus sûre)
- ✅ Transformation de données puissante (transducers, etc.)
- ✅ Intégration DataScript (natif Clojure)
- ✅ Développement piloté par REPL
- ✅ Excellente interopérabilité avec l'écosystème JavaScript

**Avantages démontrés :**
- Code plus prévisible et debuggable
- Refactoring plus sûr
- Productivité développeur accrue

### 9.2 Base de données DataScript

**Rationale :**
- ✅ Langage de requête Datalog (expressif et flexible)
- ✅ Base de données immuable (time-travel, undo/redo)
- ✅ Modèle entity-centric (naturel pour données de graphe)
- ✅ Requêtes réactives (mises à jour UI efficaces)
- ✅ Fonctionne dans navigateur et Node.js

**Bénéfices :**
- Requêtes complexes simplifiées
- Historique complet des changements
- Synchronisation UI automatique

### 9.3 Architecture Worker

**Rationale :**
- ✅ Décharger les opérations DB lourdes du thread principal
- ✅ SQLite WASM s'exécute dans worker (non-bloquant)
- ✅ Inférence ML dans worker séparé
- ✅ Meilleure performance et réactivité
- ✅ Utilise OPFS pour la persistance

**Impact :**
- Interface utilisateur fluide même avec grandes bases de données
- Calculs ML sans bloquer l'UI

### 9.4 Architecture hybride File/DB Graph

**Rationale :**
- **File-based :**
  - ✅ L'utilisateur possède ses données
  - ✅ Contrôle de version
  - ✅ Compatibilité
- **DB-based :**
  - ✅ Performance
  - ✅ Collaboration temps réel
  - ✅ Fonctionnalités avancées

**Stratégie :**
- Chemin de migration graduel
- Différents cas d'usage supportés

### 9.5 Monorepo avec bibliothèques internes

**Rationale :**
- ✅ Partage de code entre plateformes (mobile, desktop, CLI)
- ✅ Tests indépendants des bibliothèques
- ✅ Frontières claires (graph-parser, outliner, db)
- ✅ Réutilisable dans d'autres contextes (outils CLI)

**Organisation :**
```
deps/
├── common/        # Partagé par tous
├── graph-parser/  # Parse indépendant
├── outliner/      # Logique métier
├── db/            # Opérations DB
└── shui/          # Composants UI
```

### 9.6 Système de plugins via SCI

**Rationale :**
- ✅ Exécution sandboxée sécurisée
- ✅ Syntaxe Clojure (cohérent avec l'app principale)
- ✅ Pas de problèmes de sécurité eval()
- ✅ Peut exposer une surface d'API contrôlée

**Sécurité :**
- Isolation complète des plugins
- API exposée de manière sélective
- Pas d'accès direct au système de fichiers

### 9.7 Système de build multiple

**Rationale :**
- **Shadow-CLJS** pour ClojureScript (meilleur outil pour CLJS)
- **Gulp** pour pipeline d'assets (mature, flexible)
- **Webpack** pour bundling JS (dépendances worker)
- **Babashka** pour automatisation de tâches (scripting basé Clojure)

**Philosophie :** Utiliser le meilleur outil pour chaque job

---

## 10. Gestion des dépendances

### 10.1 Dépendances ClojureScript (deps.edn)

**Dépendances clés :**

| Dépendance | Type | Usage |
|------------|------|-------|
| Rum | Fork | Wrapper React |
| DataScript | Fork | Base de données |
| Promesa | - | Promises/async |
| Reitit | - | Routing |
| SCI | - | Interpréteur scripting |
| Malli | - | Validation schéma |
| Missionary | - | Programmation réactive |

### 10.2 Dépendances JavaScript (package.json)

**Catégories majeures :**

1. **Écosystème React** (18.3.1)
   - react, react-dom

2. **Capacitor** (pont mobile)
   - @capacitor/core, @capacitor/ios, @capacitor/android

3. **Outils de build**
   - shadow-cljs, webpack, gulp

4. **Bibliothèques UI**
   - excalidraw, tldraw, katex, codemirror

5. **Database**
   - @sqlite.org/sqlite-wasm

6. **ML/AI**
   - @huggingface/transformers

7. **Utilitaires**
   - Bibliothèques de dates, diff, markdown, etc.

### 10.3 Dépendances internes

**Deps locales (monorepo) :**
- `logseq/common` - Utilitaires communs
- `logseq/graph-parser` - Bibliothèque de parseur
- `logseq/outliner` - Opérations outliner
- `logseq/publishing` - Outils de publication
- `logseq/cli` - Utilitaires CLI
- `logseq/shui` - Composants UI

---

## 11. Fonctionnalités spéciales

### 11.1 Whiteboard/Canvas

**Technologie :** Fork custom de TLDraw

**Localisation :** `/packages/tldraw/`

**Intégration :**
- Module code-split dans l'app principale
- Outil de dessin et diagrammes
- Stocké dans la base de données du graphe

### 11.2 Annotation PDF

**Technologie :** PDF.js 4.2.67

**Fonctionnalités :**
- Rendu PDF
- Couche d'annotation custom
- Annotations stockées dans la base de données du graphe
- Highlight, notes, références

### 11.3 Collaboration temps réel (RTC)

**État :** Fonctionnalité alpha

**Architecture :**
- Opérations côté client trackées
- Synchronisé via serveur RTC
- Résolution de conflits
- **Localisation :** `src/main/frontend/handler/db-based/rtc*`

### 11.4 Recherche vectorielle & AI

**Technologies :**
- Hugging Face Transformers
- Embeddings vectoriels pour recherche sémantique
- HNSWLIB WASM pour recherche vectorielle
- **Exécution :** Dans inference-worker

**Capacités :**
- Recherche sémantique de contenu
- Recommandations de contenu
- Auto-complétion intelligente

### 11.5 Synchronisation de fichiers

**Implémentation :** Synchronisation custom

**Fonctionnalités :**
- Fonctionne avec stockage cloud
- Résolution de conflits
- **Localisation :** `src/main/frontend/fs/sync.cljs`

### 11.6 Intégration Git

**Technologie :** isomorphic-git

**Fonctionnalités :**
- Git basé navigateur
- Contrôle de version pour graphes file
- **Localisation :** `src/electron/electron/git.cljs`

### 11.7 Système de plugins

**Caractéristiques :**
- Marketplace de plugins
- Hot-reloading en développement
- Exécution sandboxée
- Surface d'API riche

**Architecture :**
- Chargement dynamique
- Isolation sécurisée (SCI)
- Hooks et commandes
- API étendue

---

## 12. Optimisations de performance

### 12.1 Code splitting

**Stratégie :**
- Modules Shadow-CLJS
- Extensions chargées paresseusement (code-editor, excalidraw, tldraw)
- Réduit la taille du bundle initial

**Bénéfice :**
- Temps de chargement initial réduit
- Meilleure performance perçue

### 12.2 Déchargement vers Workers

**Opérations déchargées :**
- Opérations database dans db-worker
- Inférence ML dans inference-worker
- Parsing lourd de documents

**Impact :**
- Thread UI reste réactif
- Meilleure expérience utilisateur
- Exploitation des multi-cores

### 12.3 Scrolling virtuel

**Technologie :** react-virtuoso

**Fonctionnalité :**
- Pour listes longues
- Rend uniquement les éléments visibles
- Gère efficacement les grands graphes

**Performance :**
- Mémoire constante quelle que soit la taille de la liste
- Scrolling fluide

### 12.4 Cache de requêtes

**Implémentation :**
- Résultats de requêtes DataScript cachés
- Invalidation sur transactions pertinentes
- **Localisation :** `frontend.common.cache`

**Optimisation :**
- Évite les re-calculs
- Mises à jour UI plus rapides

### 12.5 Performance SQLite

**Optimisations :**
- Backend OPFS (plus rapide qu'IndexedDB)
- Schéma optimisé
- Prepared statements
- Indexation appropriée

**Résultat :**
- Requêtes rapides même sur grandes bases
- Écritures performantes

---

## Résumé et ADN de la codebase

### Philosophie architecturale

Logseq est une application sophistiquée de gestion de connaissances construite avec les principes de programmation fonctionnelle au cœur de son architecture. L'architecture démontre :

#### 1. **Développement ClojureScript moderne**
- Exploitation de l'immutabilité
- DataScript pour données de graphe
- Programmation réactive avec Missionary et Rum

#### 2. **Stratégie multi-plateforme**
- Codebase unifié pour web, desktop (Electron), et mobile (Capacitor)
- Partage maximal de code
- Adaptations spécifiques par plateforme minimales

#### 3. **Architecture Worker**
- Déchargement des opérations lourdes pour performance
- SQLite et ML dans workers dédiés
- Interface utilisateur toujours réactive

#### 4. **Extensibilité**
- Système de plugins riche avec sandboxing sécurisé
- API extensive pour développeurs
- Marketplace de plugins

#### 5. **Modèles de données duaux**
- Support graphes file-based (propriété utilisateur)
- Support graphes DB-based (performance et collaboration)
- Migration graduelle possible

#### 6. **Monolithe modulaire**
- Bibliothèques internes permettent réutilisation code
- Frontières claires entre modules
- Testabilité accrue

#### 7. **Fonctionnalités avancées**
- RTC (collaboration temps réel)
- Recherche vectorielle et AI
- Annotation PDF
- Whiteboards
- Git intégré

#### 8. **Expérience développeur**
- Outillage complet (REPL, hot reload, linting, tests)
- Build system sophistiqué
- Documentation extensive

### Points forts de l'architecture

✅ **Séparation des préoccupations claire**
✅ **Typage fort via schémas Malli**
✅ **Tests complets (unitaires et E2E)**
✅ **Performance optimisée**
✅ **Sécurité (plugins sandboxés)**
✅ **Scalabilité (workers, code splitting)**
✅ **Maintenabilité (code fonctionnel, immutabilité)**

### Défis et complexités

⚠️ **Courbe d'apprentissage ClojureScript**
⚠️ **Système de build complexe (multiple outils)**
⚠️ **Gestion de deux modèles de données (file/DB)**
⚠️ **Coordination worker-main thread**

### Conclusion

La codebase Logseq représente une architecture moderne, bien pensée et évolutive qui exploite les forces de la programmation fonctionnelle pour construire une application de gestion de connaissances puissante et performante. L'organisation modulaire, le support multi-plateforme et l'extensibilité via plugins démontrent une vision à long terme et une exécution technique solide.

L'ADN de Logseq repose sur :
- 🧬 **Immutabilité et programmation fonctionnelle**
- 🧬 **Performance via workers et optimisations**
- 🧬 **Extensibilité et écosystème de plugins**
- 🧬 **Propriété des données utilisateur**
- 🧬 **Open-source et communauté**

---

*Document généré par analyse automatisée de la codebase Logseq*
*Version : 2025-11-10*
