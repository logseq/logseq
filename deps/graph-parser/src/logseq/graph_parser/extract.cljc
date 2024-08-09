(ns logseq.graph-parser.extract
  "Handles extraction of blocks, pages and mldoc ast in preparation for db
  transaction"
  ;; Disable clj linters since we don't support clj
  #?(:clj {:clj-kondo/config {:linters {:unresolved-namespace {:level :off}
                                        :unresolved-symbol {:level :off}}}})
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [logseq.graph-parser.text :as text]
            [logseq.common.util :as common-util]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.property :as gp-property]
            [logseq.common.config :as common-config]
            #?(:org.babashka/nbb [logseq.common.log :as log]
               :default [lambdaisland.glogi :as log])
            [logseq.graph-parser.whiteboard :as gp-whiteboard]
            [logseq.db :as ldb]))

(defn- filepath->page-name
  [filepath]
  (when-let [file-name (last (string/split filepath #"/"))]
    (let [result (first (common-util/split-last "." file-name))
          ext (string/lower-case (common-util/get-file-ext filepath))]
      (if (or (common-config/mldoc-support? ext) (= "edn" ext))
        (common-util/safe-decode-uri-component (string/replace result "." "/"))
        result))))

(defn- path->file-name
  ;; Only for internal paths, as they are converted to POXIS already
  ;; https://github.com/logseq/logseq/blob/48b8e54e0fdd8fbd2c5d25b7f1912efef8814714/deps/graph-parser/src/logseq/graph_parser/extract.cljc#L32
  ;; Should be converted to POXIS first for external paths
  [path]
  (if (string/includes? path "/")
    (last (common-util/split-last "/" path))
    path))

(defn- path->file-body
  [path]
  (when-let [file-name (path->file-name path)]
    (if (string/includes? file-name ".")
      (first (common-util/split-last "." file-name))
      file-name)))

(defn- safe-url-decode
  [string]
  (if (string/includes? string "%")
    (some-> string str common-util/safe-decode-uri-component)
    string))

(defn- decode-namespace-underlines
  "Decode namespace underlines to slashed;
   If continuous underlines, only decode at start;
   Having empty namespace is invalid."
  [string]
  (string/replace string "___" "/"))

(defn- make-valid-namespaces
  "Remove those empty namespaces from title to make it a valid page name."
  [title]
  (->> (string/split title "/")
       (remove empty?)
       (string/join "/")))

(defn- tri-lb-title-parsing
  "Parsing file name under the new file name format
   Avoid calling directly"
  [file-name]
  (some-> file-name
          (decode-namespace-underlines)
          (string/replace common-util/url-encoded-pattern safe-url-decode)
          (make-valid-namespaces)))

;; Keep for backward compatibility
;; Rule of dir-ver 0
;; Source: https://github.com/logseq/logseq/blob/e7110eea6790eda5861fdedb6b02c2a78b504cd9/deps/graph-parser/src/logseq/graph_parser/extract.cljc#L35
(defn- legacy-title-parsing
  [file-name-body]
  (let [title (string/replace file-name-body "." "/")]
    (or (common-util/safe-decode-uri-component title) title)))

(defn title-parsing
  "Convert file name in the given file name format to page title"
  [file-name-body filename-format]
  (case filename-format
    :triple-lowbar (tri-lb-title-parsing file-name-body)
    (legacy-title-parsing file-name-body)))

(defn- get-page-name
  "Get page name with overridden order of
     `title::` property
     file name parsing
     first block content
   note: `page-name-order` is deprecated on Apr. 2021
   uri-encoded? - since paths on mobile are uri-encoded, need to decode them first
   filename-format - the format used to parse file name
   "
  [file-path ast uri-encoded? filename-format]
  ;; headline
  (let [ast  (map first ast)
        file (if uri-encoded? (js/decodeURI file-path) file-path)]
    ;; check backward compatibility?
    ;; FIXME: use pre-config dir
    (if (string/starts-with? file "pages/contents.")
      "Contents"
      (let [first-block (last (first (filter gp-block/heading-block? ast)))
            property-name (when (contains? #{"Properties" "Property_Drawer"} (ffirst ast))
                            (let [properties-ast (second (first ast))
                                  properties (zipmap (map (comp keyword string/lower-case first) properties-ast)
                                                     (map second properties-ast))]
                              (:title properties)))
            first-block-name (let [title (last (first (:title first-block)))]
                               (and first-block
                                    (string? title)
                                    title))
            file-name (when-let [result (path->file-body file)]
                        (if (common-config/mldoc-support? (common-util/get-file-ext file))
                          (title-parsing result filename-format)
                          result))]
        (or property-name
            file-name
            first-block-name)))))

(defn- extract-page-alias-and-tags
  [page-m page-name properties]
  (let [alias (:alias properties)
        alias' (if (coll? alias) alias [(str alias)])
        aliases (and alias'
                     (seq (remove #(or (= page-name (common-util/page-name-sanity-lc %))
                                       (string/blank? %)) ;; disable blank alias
                                  alias')))
        aliases' (keep
                  (fn [alias]
                    (let [page-name (common-util/page-name-sanity-lc alias)]
                      {:block/name page-name
                       :block/title alias}))
                  aliases)
        result (cond-> page-m
                 (seq aliases')
                 (assoc :block/alias aliases')

                 (:tags properties)
                 (assoc :block/tags (let [tags (:tags properties)
                                          tags (if (coll? tags) tags [(str tags)])
                                          tags (remove string/blank? tags)]
                                      (map (fn [tag] {:block/name (common-util/page-name-sanity-lc tag)
                                                      :block/title tag})
                                           tags))))]
    (update result :block/properties #(apply dissoc % gp-property/editable-linkable-built-in-properties))))

(defn- build-page-map
  [properties invalid-properties properties-text-values file page page-name {:keys [date-formatter db from-page]}]
  (let [[*valid-properties *invalid-properties]
        ((juxt filter remove)
         (fn [[k _v]] (gp-property/valid-property-name? (str k))) properties)
        valid-properties (into {} *valid-properties)
        invalid-properties (set (->> (map (comp name first) *invalid-properties)
                                     (concat invalid-properties)))
        page-m (->
                (common-util/remove-nils-non-nested
                 (assoc
                  (gp-block/page-name->map page db true date-formatter
                                           :from-page from-page)
                  :block/file {:file/path (common-util/path-normalize file)}))
                (extract-page-alias-and-tags page-name properties))]
    (cond->
      page-m

      (seq valid-properties)
      (assoc :block/properties valid-properties
             :block/properties-text-values (select-keys properties-text-values (keys valid-properties)))

      (seq invalid-properties)
      (assoc :block/invalid-properties invalid-properties))))

(defn- attach-block-ids-if-match
  "If block-ids are provided and match the number of blocks, attach them to blocks
   If block-ids are provided but don't match the number of blocks, WARN and ignore
   If block-ids are not provided (nil), just ignore"
  [block-ids blocks]
  (or (when block-ids
        (if (= (count block-ids) (count blocks))
          (mapv (fn [block-id block]
                  (if (some? block-id)
                    (assoc block :block/uuid (uuid block-id))
                    block))
                block-ids blocks)
          (log/error :gp-extract/attach-block-ids-not-match "attach-block-ids-if-match: block-ids provided, but doesn't match the number of blocks, ignoring")))
      blocks))

;; TODO: performance improvement
(defn- extract-pages-and-blocks
  "uri-encoded? - if is true, apply URL decode on the file path
   options -
     :extracted-block-ids - An atom that contains all block ids that have been extracted in the current page (not yet saved to db)
     :resolve-uuid-fn - Optional fn which is called to resolve uuids of each block. Enables diff-merge
       (2 ways diff) based uuid resolution upon external editing.
       returns a list of the uuids, given the receiving ast, or nil if not able to resolve.
       Implemented in file-common-handler/diff-merge-uuids for IoC
       Called in gp-extract/extract as AST is being parsed and properties are extracted there"
  [format ast properties file content {:keys [date-formatter db filename-format extracted-block-ids resolve-uuid-fn]
                                       :or {extracted-block-ids (atom #{})
                                            resolve-uuid-fn (constantly nil)}
                                       :as options}]
  (assert db "Datascript DB is required")
  (try
    (let [db-based? (ldb/db-based-graph? db)
          page (get-page-name file ast false filename-format)
          [page page-name _journal-day] (gp-block/convert-page-if-journal page date-formatter)
          options' (assoc options :page-name page-name)
          ;; In case of diff-merge (2way) triggered, use the uuids to override the ones extracted from the AST
          override-uuids (resolve-uuid-fn format ast content options')
          blocks (->> (gp-block/extract-blocks ast content format options')
                      (attach-block-ids-if-match override-uuids)
                      (mapv #(gp-block/fix-block-id-if-duplicated! db page-name extracted-block-ids %))
                      ;; FIXME: use page uuid
                      (gp-block/with-parent-and-order {:block/name page-name})
                      (vec))
          ref-pages (atom #{})
          blocks (map (fn [block]
                        (if (= (:block/type block) "macro")
                          block
                          (let [block-ref-pages (seq (:block/refs block))]
                            (when block-ref-pages
                              (swap! ref-pages set/union (set block-ref-pages)))
                            (-> block
                                (dissoc :ref-pages)
                                (assoc :block/format format
                                       :block/page [:block/name page-name]
                                       :block/refs block-ref-pages)))))
                      blocks)
          [properties invalid-properties properties-text-values]
          (if (:block/pre-block? (first blocks))
            [(:block/properties (first blocks))
             (:block/invalid-properties (first blocks))
             (:block/properties-text-values (first blocks))]
            [properties [] {}])
          page-map (build-page-map properties invalid-properties properties-text-values file page page-name (assoc options' :from-page page))
          namespace-pages (when-not db-based?
                            (let [page (:block/title page-map)]
                              (when (text/namespace-page? page)
                                (->> (common-util/split-namespace-pages page)
                                     (map (fn [page]
                                            (-> (gp-block/page-name->map page db true date-formatter)
                                                (assoc :block/format format))))))))
          pages (->> (concat
                      [page-map]
                      @ref-pages
                      namespace-pages)
                     ;; remove block references
                     (remove vector?)
                     (remove nil?)
                     (filter :block/name))
          pages (common-util/distinct-by :block/name pages)
          pages (remove nil? pages)
          pages (map (fn [page]
                       (let [page-id (or (when db
                                           (:block/uuid (ldb/get-page db (:block/name page))))
                                         (d/squuid))]
                         (assoc page :block/uuid page-id)))
                     pages)
          blocks (->> (remove nil? blocks)
                      (map (fn [b] (dissoc b :block.temp/ast-title :block.temp/ast-body :block/level :block/children :block/meta))))]
      [pages blocks])
    (catch :default e
      (log/error :exception e))))

(defn extract
  "Extracts pages, blocks and ast from given file"
  [file-path content {:keys [user-config verbose] :or {verbose true} :as options}]
  (if (string/blank? content)
    []
    (let [format (common-util/get-format file-path)
          _ (when verbose (println "Parsing start: " file-path))
          ast (gp-mldoc/->edn content (gp-mldoc/default-config format
                                        ;; {:parse_outline_only? true}
                                                               ))]
      (when verbose (println "Parsing finished: " file-path))
      (let [first-block (ffirst ast)
            properties (let [properties (and (gp-property/properties-ast? first-block)
                                             (->> (last first-block)
                                                  (map (fn [[x y mldoc-ast]]
                                                         (let [k (if (keyword? x)
                                                                   (subs (str x) 1)
                                                                   x)]
                                                           [(string/lower-case k) (text/parse-property k y mldoc-ast (assoc user-config :format format))])))
                                                  (into {})
                                                  (walk/keywordize-keys)))]
                         (when (and properties (seq properties))
                           (if (:filters properties)
                             (update properties :filters
                                     (fn [v]
                                       (string/replace (or v "") "\\" "")))
                             properties)))
            [pages blocks] (extract-pages-and-blocks format ast properties file-path content options)]
        {:pages pages
         :blocks blocks
         :ast ast}))))

(defn extract-whiteboard-edn
  "Extracts whiteboard page from given edn file
   Whiteboard page edn is a subset of page schema
   - it will only contain a single page (for now). The page properties are stored under :logseq.tldraw.* properties and contain 'bindings' etc
   - blocks will be adapted to tldraw shapes. All blocks's parent is the given page."
  [file content {:keys [verbose] :or {verbose true}}]
  (let [_ (when verbose (println "Parsing start: " file))
        {:keys [pages blocks]} (common-util/safe-read-string content)
        blocks (map
                (fn [block]
                  (-> block
                      (common-util/dissoc-in [:block/parent :block/name])
                      ;; :block/left here for backward compatibility
                      (common-util/dissoc-in [:block/left :block/name])))
                blocks)
        serialized-page (first pages)
        ;; whiteboard edn file should normally have valid :block/title, :block/name, :block/uuid
        page-name (-> (or (:block/name serialized-page)
                          (filepath->page-name file))
                      (common-util/page-name-sanity-lc))
        title (or (:block/title serialized-page)
                  page-name)
        page-block (merge {:block/name page-name
                           :block/title title
                           :block/file {:file/path (common-util/path-normalize file)}}
                          serialized-page
                          ;; Ensure old whiteboards have correct type
                          {:block/type "whiteboard"})
        page-block (gp-whiteboard/migrate-page-block page-block)
        blocks (->> blocks
                    (map gp-whiteboard/migrate-shape-block)
                    (map #(merge % (gp-whiteboard/with-whiteboard-block-props % [:block/uuid (:block/uuid page-block)]))))
        _ (when verbose (println "Parsing finished: " file))]
    {:pages (list page-block)
     :blocks blocks}))

(defn- with-block-uuid
  [pages]
  (->> (common-util/distinct-by :block/name pages)
       (map (fn [page]
              (if (:block/uuid page)
                page
                (assoc page :block/uuid (d/squuid)))))))

(defn with-ref-pages
  [pages blocks]
  (let [ref-pages (->> (mapcat :block/refs blocks)
                       (filter :block/name))]
    (->> (concat pages ref-pages)
         (group-by :block/name)
         vals
         (map (partial apply merge))
         (with-block-uuid))))
