(ns logseq.cli.common.file
  "Convert blocks to file content. Used for frontend exports and CLI"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.common.util :as common-util]
            [logseq.db.frontend.class :as db-class]
            [logseq.db :as ldb]
            [logseq.db.frontend.db :as db-db]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.outliner.tree :as otree]))

(defn- indented-block-content
  [content spaces-tabs]
  (let [lines (string/split-lines content)]
    (string/join (str "\n" spaces-tabs) lines)))

(defn- ->string-content
  [v]
  (cond
    (string? v) v
    (nil? v) ""
    (number? v) (str v)
    (boolean? v) (str v)
    :else ""))

(defn- tag->obsidian-hashtag
  [tag]
  (when-let [title (:block/title tag)]
    (let [tag-title (-> title
                        string/trim
                        (string/replace #"\s+" "-"))]
      (when-not (string/blank? tag-title)
        (str "#" tag-title)))))

(defn- asset->attachment-rel-path
  [asset]
  (when (ldb/asset? asset)
    (let [asset-uuid (:block/uuid asset)
          asset-type (some-> (:logseq.property.asset/type asset)
                             str
                             (string/replace #"^\." ""))]
      (when asset-uuid
        (str "../Attachments/" asset-uuid
             (when-not (string/blank? asset-type)
               (str "." asset-type)))))))

(defn- asset->embed-markdown
  [asset]
  (when-let [path (asset->attachment-rel-path asset)]
    (str "![](" path ")")))

(defn- asset->embed-markdown-with-alias
  [asset alias]
  (when-let [path (asset->attachment-rel-path asset)]
    (str "![" alias "](" path ")")))

(defn- uuid->obsidian-ref
  [db uuid-str]
  (when (and (string? uuid-str) (common-util/uuid-string? uuid-str))
    (when-let [ent (d/entity db [:block/uuid (uuid uuid-str)])]
      (cond
        (ldb/page? ent)
        (let [page-name (or (:block/title ent) "Unknown")]
          (str "[[" page-name "]]"))
        (ldb/asset? ent)
        (asset->embed-markdown ent)
        :else
        (let [page-name (or (get-in ent [:block/page :block/title]) "Unknown")]
          (str "![["
               page-name
               "#^" uuid-str
               "]]"))))))

(def ^:private uuid-page-ref-re
  #"\[\[([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\]\]")

(def ^:private uuid-block-ref-re
  #"\(\(([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\)\)")

(def ^:private alias-inline-block-ref-re
  #"\[([^\]]+)\]\(\(\(([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\)\)\)")

(def ^:private alias-ref-style-block-ref-re
  #"\[([^\]]+)\]\[\(\(([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\)\)\]")

(defn- uuid->obsidian-ref-with-alias
  [db uuid-str alias]
  (when (and (string? uuid-str) (common-util/uuid-string? uuid-str))
    (when-let [ent (d/entity db [:block/uuid (uuid uuid-str)])]
      (cond
        (ldb/page? ent)
        (let [page-name (or (:block/title ent) "Unknown")]
          (str "[[" page-name "|" alias "]]"))
        (ldb/asset? ent)
        (asset->embed-markdown-with-alias ent alias)
        :else
        (let [page-name (or (get-in ent [:block/page :block/title]) "Unknown")]
          (str "![["
               page-name
               "#^" uuid-str
               "|" alias
               "]]"))))))

(defn- replace-uuid-refs-with-obsidian-refs
  [db s]
  (if (string? s)
    (-> s
        ;; [alias](((uuid)))
        (string/replace alias-inline-block-ref-re
                        (fn [[full alias uuid-str]]
                          (or (uuid->obsidian-ref-with-alias db uuid-str alias) full)))
        ;; [alias][((uuid))]
        (string/replace alias-ref-style-block-ref-re
                        (fn [[full alias uuid-str]]
                          (or (uuid->obsidian-ref-with-alias db uuid-str alias) full)))
        ;; [[uuid]]
        (string/replace uuid-page-ref-re
                        (fn [[full uuid-str]]
                          (or (uuid->obsidian-ref db uuid-str) full)))
        ;; ((uuid))
        (string/replace uuid-block-ref-re
                        (fn [[full uuid-str]]
                          (or (uuid->obsidian-ref db uuid-str) full))))
    s))

(declare property-value->markdown)

(defn- property-key->markdown
  [db k]
  (let [strip-random-suffix
        (fn [kw]
          (let [n (name kw)
                ns (namespace kw)]
            (if (and (string? ns)
                     (re-find #"^(user\.property|plugin\.property)(\.|$)" ns)
                     (re-find #"-[A-Za-z][A-Za-z0-9_-]{7}$" n))
              (string/replace n #"-[A-Za-z][A-Za-z0-9_-]{7}$" "")
              n)))]
    (if-not (keyword? k)
      (str k)
      (if-let [prop-ent (d/entity db [:db/ident k])]
        (or (when (string? (:block/title prop-ent)) (:block/title prop-ent))
            (strip-random-suffix k))
        (strip-random-suffix k)))))

(defn- property-value->markdown
  [db v]
  (cond
    (de/entity? v)
    (cond
      ;; Prefer scalar property value for property-created entities.
      (contains? v :logseq.property/value)
      (property-value->markdown db (:logseq.property/value v))

      ;; Preserve page refs as wikilinks.
      (and (string? (:block/title v)) (ldb/page? v))
      (str "[[" (:block/title v) "]]")

      ;; For non-page entities, prefer literal title (avoid internal uuid links).
      (string? (:block/title v))
      (replace-uuid-refs-with-obsidian-refs db (:block/title v))

      (:db/ident v)
      (property-key->markdown db (:db/ident v))

      (:block/uuid v)
      (or (uuid->obsidian-ref db (str (:block/uuid v)))
          (str (:block/uuid v)))

      :else (str v))

    (set? v)
    (->> v
         (map #(property-value->markdown db %))
         (remove string/blank?)
         sort
         (string/join ", "))

    (sequential? v)
    (->> v
         (map #(property-value->markdown db %))
         (remove string/blank?)
         (string/join ", "))

    (keyword? v) (name v)
    (nil? v) ""
    (string? v) (replace-uuid-refs-with-obsidian-refs db v)
    :else (str v)))

;; ---------------------------------------------------------------------------
;; Obsidian frontmatter & tag-header (Stage 1)
;; ---------------------------------------------------------------------------

(defn- empty-placeholder-property-value?
  [db v]
  (or (= :logseq.property/empty-placeholder v)
      (and (integer? v) (pos? v)
           (= :logseq.property/empty-placeholder (:db/ident (d/entity db v))))
      (and (de/entity? v)
           (= :logseq.property/empty-placeholder (:db/ident v)))
      (and (map? v)
           (= :logseq.property/empty-placeholder (:db/ident v)))))

(defn- normalize-frontmatter-value
  [db v]
  (cond
    (nil? v) nil
    (set? v) (let [v' (->> v
                           (remove #(empty-placeholder-property-value? db %))
                           vec)]
               (when (seq v') v'))
    (sequential? v) (let [v' (->> v
                                  (remove #(empty-placeholder-property-value? db %))
                                  vec)]
                      (when (seq v') v'))
    (empty-placeholder-property-value? db v) nil
    :else v))

(defn- exportable-page-property?
  [k]
  (and (keyword? k)
       (not (contains? db-property/public-db-attribute-properties k))
       (not (contains? #{:logseq.property/created-from-property
                         :logseq.property/created-by-ref
                         :logseq.property.class/extends
                         :logseq.property/built-in?
                         :logseq.property/hide?
                         :logseq.property/publishing-public?
                         :logseq.property.publish/published-url}
                       k))
       (let [n (namespace k)]
         (not (contains? #{"logseq.property.asset"
                           "logseq.property.embedding"
                           "logseq.property.history"
                           "logseq.property.table"
                           "logseq.property.view"}
                         n)))))

(defn- collect-page-properties
  "Collect page properties including class-derived defaults.
   Inlines the class-property resolution (replaces outliner-property dependency)."
  [db page]
  (let [own-properties (db-property/properties page)
        ;; Inline class-property resolution using db layer only
        classes (->> (:block/tags page)
                     (sort-by :block/name))
        class-parents (db-db/get-classes-parents classes)
        all-classes (->> (concat classes class-parents)
                         (filter (fn [cls]
                                   (seq (:logseq.property.class/properties cls)))))
        class-property-idents (->> (mapcat (fn [cls]
                                             (:logseq.property.class/properties cls))
                                           all-classes)
                                   (map :db/ident)
                                   distinct)
        class-derived-properties
        (->> class-property-idents
             (keep (fn [ident]
                     (let [property (d/entity db ident)
                           explicit? (contains? own-properties ident)
                           value (if explicit?
                                   (get own-properties ident)
                                   (or (:logseq.property/scalar-default-value property)
                                       (:logseq.property/default-value property)))
                           value' (normalize-frontmatter-value db value)]
                       (when (some? value')
                         [ident value']))))
             (into {}))
        own-properties'
        (->> own-properties
             (keep (fn [[k v]]
                     (let [v' (normalize-frontmatter-value db v)]
                       (when (some? v')
                         [k v']))))
             (into {}))]
    ;; explicit properties should override class-derived defaults
    (merge class-derived-properties own-properties')))

(defn- yaml-key
  [k]
  (let [s (str k)]
    (if (re-matches #"^[A-Za-z0-9_-]+$" s)
      s
      (str "\"" (string/replace s "\"" "\\\"") "\""))))

(defn- obsidian-frontmatter-value
  "Like property-value->markdown but tuned for YAML frontmatter.
   Key difference: extracts :logseq.property/value from entity refs,
   which fixes values stored as entity refs (e.g. URLs, enum choices)."
  [db v]
  (cond
    (de/entity? v)
    (cond
      ;; Extract scalar property value from property-created entities.
      (contains? v :logseq.property/value)
      (obsidian-frontmatter-value db (:logseq.property/value v))

      ;; Keep absolute URLs as plain scalar strings in frontmatter.
      (and (string? (:block/title v))
           (re-matches #"(?i)^[a-z][a-z0-9+.-]*://.+" (:block/title v)))
      (:block/title v)

      ;; Page refs as wikilinks
      (and (string? (:block/title v)) (ldb/page? v))
      (str "[[" (:block/title v) "]]")

      ;; Non-page entity with title
      (string? (:block/title v))
      (:block/title v)

      ;; Ident keyword
      (:db/ident v)
      (property-key->markdown db (:db/ident v))

      ;; UUID fallback
      (:block/uuid v)
      (str "[[" (:block/uuid v) "]]")

      :else (str v))

    (set? v)
    (->> v
         (map #(obsidian-frontmatter-value db %))
         (remove string/blank?)
         sort
         (string/join ", "))

    (sequential? v)
    (->> v
         (map #(obsidian-frontmatter-value db %))
         (remove string/blank?)
         (string/join ", "))

    (keyword? v) (name v)
    (nil? v) ""
    :else (str v)))

(defn- yaml-value
  [db v]
  (cond
    (number? v) (str v)
    (boolean? v) (str v)
    (nil? v) "null"
    :else
    (let [s (obsidian-frontmatter-value db v)]
      (cond
        ;; Keep absolute URLs unquoted
        (re-matches #"(?i)^[a-z][a-z0-9+.-]*://.+" s)
        s

        (or (string/blank? s)
            (string/includes? s "[[")
            (string/includes? s ":")
            (string/includes? s "\"")
            (string/includes? s "\n")
            (string/starts-with? s "[")
            (string/starts-with? s "{")
            (string/includes? s ","))
        (str "\"" (string/replace s "\"" "\\\"") "\"")

        :else
        s))))

(defn- build-page-frontmatter
  [db page-title]
  (when-let [page (ldb/get-page db page-title)]
    (let [lines (->> (collect-page-properties db page)
                     (filter (fn [[k _]] (exportable-page-property? k)))
                     (sort-by (fn [[k _]] (str k)))
                     (map (fn [[k v]]
                            (str (yaml-key (property-key->markdown db k))
                                 ": " (yaml-value db v))))
                     (remove #(string/ends-with? % ": \"\"")))]
      (when (seq lines)
        (str "---\n" (string/join "\n" lines) "\n---\n\n")))))

(defn- build-page-tag-header
  [db page-title]
  (when-let [page (ldb/get-page db page-title)]
    (let [hashtags (->> (:block/tags page)
                        (remove #(db-class/disallowed-inline-tags (:db/ident %)))
                        (keep tag->obsidian-hashtag)
                        distinct)]
      (when (seq hashtags)
        (str (string/join " " hashtags) "\n\n")))))

(defn- task-block?
  [db block-ent]
  (when-let [task-class (d/entity db :logseq.class/Task)]
    (ldb/class-instance? task-class block-ent)))

(defn- task-done?
  [db block-ent]
  (let [status (:logseq.property/status block-ent)
        status-ent (cond
                     (de/entity? status) status
                     (map? status) status
                     (integer? status) (d/entity db status)
                     :else nil)
        status-ident (:db/ident status-ent)
        status-title (some-> (:block/title status-ent) string/lower-case)]
    (or (true? (:logseq.property/choice-checkbox-state status-ent))
        (= status-ident :logseq.property/status.done)
        (= status-title "done"))))

(defn- exportable-block-property?
  [k {:keys [task-instance?]}]
  (and (keyword? k)
       (not (contains? db-property/public-db-attribute-properties k))
       (not (contains?
             #{:logseq.property/created-from-property
               :logseq.property/created-by-ref
               :logseq.property/heading
               :logseq.property/built-in?
               :logseq.property/asset
               :logseq.property/ls-type
               :logseq.property.pdf/hl-image
               :logseq.property.asset/last-visit-page
               :logseq.property.asset/remote-metadata
               :logseq.property.asset/resize-metadata
               :logseq.property.embedding/hnsw-label-updated-at}
             k))
       (not (and task-instance? (= k :logseq.property/status)))
       (let [n (namespace k)]
         (not (contains? #{"logseq.property.history" "logseq.property.table"} n)))))

(defn- block-properties->lines
  [db block-ent]
  (let [task-instance? (task-block? db block-ent)]
    (->> (db-property/properties block-ent)
         (filter (fn [[k _]] (exportable-block-property? k {:task-instance? task-instance?})))
         (sort-by (fn [[k _]] (str k)))
         (map (fn [[k v]]
                (let [k* (property-key->markdown db k)
                      v* (property-value->markdown db v)]
                  (when-not (string/blank? v*)
                    (str k* ":: " v*)))))
         (remove nil?))))

(defn- get-obsidian-referenced-block-uuids
  [db]
  (try
    (->> (d/q '[:find [?target-uuid ...]
                :where
                [?src :block/refs ?target]
                [?target :block/page _]
                [?target :block/uuid ?target-uuid]]
              db)
         set)
    (catch :default _
      #{})))

(defn- transform-content
  [db b level {:keys [heading-to-list?]} context]
  (let [heading (:logseq.property/heading b)
        block-ent (d/entity db (:db/id b))
        obsidian-mode? (true? (:obsidian-mode? context))
        referenced-block-uuids (:obsidian-referenced-block-uuids context)
        ;; When the block itself is an asset, render as embed markdown.
        asset-embed (when (and obsidian-mode? (ldb/asset? block-ent))
                      (asset->embed-markdown block-ent))
        raw-title (or asset-embed
                      (when (string? (:block/raw-title block-ent)) (:block/raw-title block-ent))
                      (when (string? (:block/title block-ent)) (:block/title block-ent))
                      "")
        title* (if obsidian-mode?
                 ;; Stage 1 should resolve uuid refs while the authoritative db
                 ;; is available. Stage 2 may run with a different db view.
                 (replace-uuid-refs-with-obsidian-refs
                  db
                  (db-content/id-ref->title-ref raw-title (:block/refs block-ent)
                                                :db db
                                                :replace-block-id? false
                                                :replace-pages-with-same-name? false))
                 ;; Non-Obsidian mode keeps previous behavior.
                 (db-content/recur-replace-uuid-in-block-title block-ent))
        title (or (when (string? title*) title*)
                  (when (string? (:block/title block-ent)) (:block/title block-ent))
                  raw-title
                  "")
        inline-extra-tags (when obsidian-mode?
                            (->> (:block/tags block-ent)
                                 (remove #(db-class/disallowed-inline-tags (:db/ident %)))
                                 (remove #(db-db/inline-tag? raw-title %))
                                 (keep tag->obsidian-hashtag)
                                 distinct))
        block-id-suffix (when (and obsidian-mode?
                                   (:block/uuid block-ent)
                                   (contains? referenced-block-uuids (:block/uuid block-ent)))
                          (str " ^" (:block/uuid block-ent)))
        title-line (cond-> title
                     (seq inline-extra-tags)
                     (str " " (string/join " " inline-extra-tags))
                     block-id-suffix
                     (str block-id-suffix))
        property-lines (when obsidian-mode?
                         (block-properties->lines db block-ent))
        task-instance? (and obsidian-mode? (task-block? db block-ent))
        task-checked? (and task-instance? (task-done? db block-ent))
        content (if (seq property-lines)
                  (str title-line "\n"
                       (string/join "\n" (map #(str "  " %) property-lines)))
                  title-line)
        content (let [level' (if (and heading-to-list? heading)
                                (if (> heading 1)
                                  (dec heading)
                                  heading)
                                level)
                      base-indent (->>
                                   (repeat (dec level') (:export-bullet-indentation context))
                                   (apply str))
                      [prefix spaces-tabs]
                      (if task-instance?
                        [(str base-indent (if task-checked? "- [x]" "- [ ]"))
                         (str base-indent "  ")]
                        [(str base-indent "-") (str base-indent "  ")])
                      content* (->string-content content)
                      content* (if heading-to-list?
                                 (-> (string/replace content* #"^\s?#+\s+" "")
                                     (string/replace #"^\s?#+\s?$" ""))
                                 content*)
                      new-content (indented-block-content (string/trim content*) spaces-tabs)
                      sep (if (string/blank? new-content)
                            ""
                            " ")]
                  (str prefix sep new-content))]
    content))

(defn- tree->file-content-aux
  [db tree {:keys [init-level link] :as opts} context]
  (let [block-contents (transient [])]
    (loop [[f & r] tree level init-level]
      (if (nil? f)
        (->> block-contents persistent! flatten (remove nil?))
        (let [page? (nil? (:block/page f))
              content (if (and page? (not link)) nil (transform-content db f level opts context))
              new-content
              (if-let [children (seq (:block/children f))]
                (cons content (tree->file-content-aux db children {:init-level (inc level)} context))
                [content])]
          #_:clj-kondo/ignore
          (conj! block-contents new-content)
          (recur r level))))))

(defn tree->file-content
  [db tree opts context]
  (->> (tree->file-content-aux db tree opts context) (string/join "\n")))

(defn block->content
  "Converts a block including its children (recursively) to plain-text."
  [db root-block-uuid tree->file-opts context]
  (assert (uuid? root-block-uuid))
  (let [context (if (and (:obsidian-mode? context)
                         (nil? (:obsidian-referenced-block-uuids context)))
                  (assoc context :obsidian-referenced-block-uuids
                         (get-obsidian-referenced-block-uuids db))
                  context)
        init-level (or (:init-level tree->file-opts)
                       (if (ldb/page? (d/entity db [:block/uuid root-block-uuid]))
                         0
                         1))
        blocks* (d/pull-many db '[*] (keep :db/id (ldb/get-block-and-children db root-block-uuid)))
        blocks (if (:obsidian-mode? context)
                 (vec blocks*)
                 (mapv #(db-content/update-block-content db % (:db/id %)) blocks*))
        tree (otree/blocks->vec-tree db blocks (str root-block-uuid))]
    (tree->file-content db tree
                        (assoc tree->file-opts :init-level init-level)
                        context)))

(defn get-all-page->content
  "Exports a graph's pages as tuples of page name and page content"
  [db options]
  (let [options (if (:obsidian-mode? options)
                  (assoc options :obsidian-referenced-block-uuids
                         (get-obsidian-referenced-block-uuids db))
                  options)
        page-ids (->> (concat
                       (d/datoms db :avet :block/name)
                       (d/datoms db :avet :block/journal-day))
                      (keep :e)
                      distinct)
        pages (keep #(d/entity db %) page-ids)
        filter-fn (fn [ent]
                    (or (not (:logseq.property/built-in? ent))
                        (contains? sqlite-create-graph/built-in-pages-names (:block/title ent))))
        page-title (fn [e]
                     (or (when (string? (:block/title e)) (:block/title e))
                         (when (string? (:block/name e)) (:block/name e))
                         (str (:block/uuid e))))]
    (->> pages
         (filter filter-fn)
         (mapv (fn [e]
                 (let [title (page-title e)
                       content (block->content db (:block/uuid e) {} options)]
                   (if (:obsidian-mode? options)
                     [title {:content content
                             :frontmatter (build-page-frontmatter db title)
                             :tag-header (build-page-tag-header db title)}]
                     [title content])))))))
