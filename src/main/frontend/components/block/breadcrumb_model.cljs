(ns frontend.components.block.breadcrumb-model
  "Pure logic for breadcrumb segment model and visibility algorithm.
   No rendering, no component dependencies.
   Converts page/block entities into flat segment maps, then applies a
   display-budget algorithm to determine which segments are visible and
   which are folded into an ellipsis."
  (:require [clojure.string :as string]
            [logseq.db.frontend.content :as db-content]))

;; ---------------------------------------------------------------------------
;; Text normalization
;; ---------------------------------------------------------------------------

(def ^:private max-segment-text-length 160)

(defn- truncate-segment-text
  [text]
  (when-not (string/blank? text)
    (if (> (count text) max-segment-text-length)
      (str (subs text 0 max-segment-text-length) "…")
      text)))

(defn- normalized-lines
  "Returns trimmed non-empty lines from a string."
  [s]
  (when (string? s)
    (->> (string/split-lines s)
         (map string/trim)
         (remove string/blank?))))

(defn- markdown-fence-line?
  [line]
  (boolean (re-matches #"^\s*```.*" line)))

(defn- org-boundary-line?
  [line]
  (boolean (re-matches #"(?i)^\s*#\+(BEGIN|END)_\w+.*" line)))

(defn- query-line?
  [line]
  (boolean (re-matches #"(?is)^\s*\{\{query\b.*\}\}\s*$" line)))

(defn- structural-marker-line?
  [line]
  (or (markdown-fence-line? line)
      (org-boundary-line? line)
      (query-line? line)))

(defn- strip-code-comment-marker
  [line]
  (when-let [[_ text] (re-matches #"^\s*(?:;;|//|#|--)\s+(.+)$" line)]
    text))

(defn- useful-query-line?
  [line]
  (not (query-line? line)))

(defn- strip-markdown-markup
  "Removes common markdown markup from a line, returning plain text."
  [line]
  (-> line
      ;; headings: ## Title -> Title
      (string/replace #"^\s*#{1,6}\s+" "")
      ;; bold: **text** or __text__
      (string/replace #"\*\*(.+?)\*\*" "$1")
      (string/replace #"__(.+?)__" "$1")
      ;; italic: *text* or _text_  (simple non-greedy)
      (string/replace #"\*([^*]+?)\*" "$1")
      (string/replace #"_([^_]+?)_" "$1")
      ;; inline code: `code`
      (string/replace #"`(.+?)`" "$1")
      ;; links: [text](url)
      (string/replace #"\[(.+?)\]\(.+?\)" "$1")
      ;; query block wrapper
      (string/replace #"\{\{query[^}]*\}\}" "")
      ;; org-mode begin/end markers
      (string/replace #"(?i)#\+BEGIN_\w+" "")
      (string/replace #"(?i)#\+END_\w+" "")
      string/trim))

(defn- resolve-uuid-refs
  [entity text]
  ;; Breadcrumb renderers hydrate title refs before displaying when possible.
  ;; Keep unresolved UUID refs unchanged for partial entities or fallback paths.
  (or (when (and (string? text)
                 (re-find db-content/id-ref-pattern text))
        (db-content/recur-replace-uuid-in-block-title
         (assoc entity :block/title text)
         10))
      text))

(defn normalize-breadcrumb-text
  "Extracts a short plain-text label from block raw-title.
   Returns at most max-segment-text-length characters of the first
   non-empty line (plus a trailing ellipsis if truncated).
   Does NOT invoke mldoc parse or markup rendering."
  [raw-title]
  (let [line (some (fn [line]
                     (when-not (structural-marker-line? line)
                       line))
                   (normalized-lines raw-title))
        cleaned (when line (strip-markdown-markup line))]
    (truncate-segment-text cleaned)))

(defn- first-content-line
  [raw-title]
  (some (fn [line]
          (when-not (structural-marker-line? line)
            line))
        (normalized-lines raw-title)))

(defn- breadcrumb-label-line
  [raw-title block-type]
  (when (string? raw-title)
    (case block-type
      :code
      (some strip-code-comment-marker (normalized-lines raw-title))

      :query
      (some (fn [line]
              (when (and (not (structural-marker-line? line))
                         (useful-query-line? line))
                line))
            (normalized-lines raw-title))

      (:note :quote)
      (first-content-line raw-title)

      (first-content-line raw-title))))

(defn- normalize-breadcrumb-line
  [entity line]
  (let [line (resolve-uuid-refs entity line)
        cleaned (when line (strip-markdown-markup line))]
    (truncate-segment-text cleaned)))

(defn- normalize-typed-breadcrumb-text
  [entity raw-title block-type]
  (normalize-breadcrumb-line entity (breadcrumb-label-line raw-title block-type)))

;; ---------------------------------------------------------------------------
;; Block type detection
;; ---------------------------------------------------------------------------

(defn detect-block-type
  "Detects the semantic type of a block based on its raw title/content.
   Returns :page, :code, :query, :note, :quote, or :block."
  [raw-title page?]
  (if page?
    :page
    (when (string? raw-title)
      (let [trimmed (string/trim raw-title)]
        (cond
          (or (string/starts-with? trimmed "```")
              (re-find #"(?i)#\+BEGIN_SRC" trimmed))
          :code

          (some query-line? (normalized-lines raw-title))
          :query

          (re-find #"(?i)#\+BEGIN_NOTE" trimmed)
          :note

          (re-find #"(?i)#\+BEGIN_QUOTE" trimmed)
          :quote

          :else
          :block)))))

;; ---------------------------------------------------------------------------
;; Segment model
;; ---------------------------------------------------------------------------

;; DB Query class idents — standard Query plus Cards (which extends Query).
(def ^:private query-class-idents
  #{:logseq.class/Query :logseq.class/Cards})

(defn- entity-tags->block-type
  "Returns :query if entity has a Query-family tag (:logseq.class/Query or
   :logseq.class/Cards). Returns nil otherwise."
  [entity]
  (when (some (fn [t]
                (query-class-idents (or (:db/ident t) t)))
              (:block/tags entity))
    :query))

(defn- display-type->block-type
  "Maps a DB :logseq.property.node/display-type keyword to a breadcrumb type.
   Returns nil when display-type is not a recognised structural type."
  [display-type]
  (case display-type
    :code  :code
    :quote :quote
    :math  :math
    nil))

(defn block->breadcrumb-segment
  "Converts a page or block entity map to a breadcrumb segment map.

   Segment keys:
     :db/id         - DataScript entity id
     :block/uuid    - block uuid
     :type          - :page | :block | :code | :query | :note | :quote | :math
     :text          - short plain-text label (may be nil for empty blocks)
     :full-text     - full normalized single-line text for title/aria-label
     :title-ref-ids - UUID refs from the source line that can become the label
     :icon          - icon value from :logseq.property/icon, or nil
     :page?         - true for page segments"
  [entity]
  (when entity
    (let [page? (some? (:block/name entity))
          raw-title (or (:block/raw-title entity) (:block/title entity))
          ;; DB version: structural type is stored in :logseq.property.node/display-type
          ;; (Code/Quote/Math blocks) or inferred from :block/tags (Query family).
          ;; org-mode markers like #+BEGIN_SRC in raw-title are also recognised as
          ;; a valid fallback since that rendering form is still supported.
          db-display-type (display-type->block-type (:logseq.property.node/display-type entity))
          tag-type (when-not page? (entity-tags->block-type entity))
          block-type (or db-display-type tag-type (detect-block-type raw-title page?))
          title-line (when-not page?
                       (breadcrumb-label-line raw-title block-type))
          text (if page?
                 (or (:block/title entity) (:block/name entity))
                 (normalize-typed-breadcrumb-text entity raw-title block-type))
          full-text (if page?
                      (or (:block/title entity) (:block/name entity) "")
                      (or text ""))
          icon (:logseq.property/icon entity)]
      {:db/id (:db/id entity)
       :block/uuid (:block/uuid entity)
       :type block-type
       :text text
       :full-text full-text
       :title-ref-ids (when (and (not page?) (string? title-line))
                        (db-content/get-matched-ids title-line))
       :icon icon
       :page? page?})))

(defn segments->full-title
  "Joins segment texts into a / separated path string for use in
   title attribute or aria-label."
  [segments]
  (->> segments
       (map #(or (:text %) (:full-text %)))
       (remove string/blank?)
       (string/join " / ")))

;; ---------------------------------------------------------------------------
;; Variant options
;; ---------------------------------------------------------------------------

(def ^:private variant-defaults
  {:block-page    {:max-visible 4 :nearest-count 2 :load-depth 16}
   :app-header    {:max-visible 4 :nearest-count 1 :load-depth 4}
   :search-result {:max-visible 3 :nearest-count 1 :load-depth 4}
   :inline        {:max-visible 3 :nearest-count 1 :load-depth 8}
   :native-search {:max-visible 2 :nearest-count 1 :load-depth 3}})

(defn variant-options
  "Returns display options for a given variant keyword.
   Falls back to :inline defaults if variant is unknown.
   Merges with any extra-opts map provided."
  [variant & [extra-opts]]
  (merge (get variant-defaults variant (:inline variant-defaults))
         extra-opts))

;; ---------------------------------------------------------------------------
;; Visibility algorithm
;; ---------------------------------------------------------------------------

(defn build-breadcrumb-view
  "Applies the visibility budget to a sequence of segments.

   `segments` are ordered from root (page) to nearest parent — the same
   order returned by db/get-block-parents (root first).

   Options:
     :show-page?     - include the page segment (default true)
     :max-visible    - max total visible segments (default 4)
     :nearest-count  - always show this many nearest-parent segments (default 2)

   Returns:
     {:visible-prefix  [seg ...]   ; first segments that fit (includes page)
      :hidden          [seg ...]   ; middle segments folded into ellipsis
      :visible-suffix  [seg ...]   ; nearest parent(s) always visible
      :overflow?       bool}       ; true when any segments are hidden"
  [segments {:keys [show-page? max-visible nearest-count]
             :or {show-page? true max-visible 4 nearest-count 2}}]
  (let [segs (if show-page? (vec segments) (vec (rest segments)))
        total (count segs)]
    (cond
      (zero? total)
      {:visible-prefix [] :hidden [] :visible-suffix [] :overflow? false}

      (<= total max-visible)
      {:visible-prefix segs :hidden [] :visible-suffix [] :overflow? false}

      :else
      ;; Strategy:
      ;;  - Prefix: keep the first segment (page or earliest ancestor)
      ;;  - Suffix: keep the nearest `nearest-count` segments
      ;;  - Hidden: everything in between
      (let [keep-first 1
            suffix-count (min nearest-count (- total keep-first))
            prefix (vec (take keep-first segs))
            suffix (vec (take-last suffix-count segs))
            hidden (vec (subvec segs keep-first (- total suffix-count)))]
        {:visible-prefix prefix
         :hidden hidden
         :visible-suffix suffix
         :overflow? true}))))
