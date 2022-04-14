(ns frontend.handler.graph-parser
  (:require [clojure.string :as string]
            [clojure.set :as set]
            [clojure.edn :as edn]
            [clojure.walk :as walk]
            [datascript.core :as d]
            ["fs" :as fs]
            ["child_process" :as child-process]
            [frontend.db-schema :as db-schema]
            [frontend.format.mldoc-slim :as mldoc]
            ;; Disable for now since kondo can't pick it up
            ; #?(:org.babashka/nbb [nbb.core :as nbb])
            [nbb.core :as nbb]))

;; Helpers
;; =======

(defn- fline [and-form] (:line (meta and-form)))

(defmacro -spy [line name expr]
  `(let [result# ~expr
         line-str# ~(str "Line " line ":")]
     ;; Subject to elision:
     ;; (log* ~config ~level ~name "=>" result#) ; CLJ-865
     (apply println line-str# [~name "=>" result#])

     ;; NOT subject to elision:
     result#))

(defmacro spy
  "Modified version of taoensso.timbre/spy"
  [expr] `(-spy ~(fline &form) '~expr ~expr))

(defn slurp
  "Like clojure.core/slurp"
  [file]
  (str (fs/readFileSync file)))

(defn sh
  "Run shell cmd synchronously and print to inherited streams by default. Aims
  to be similar to babashka.tasks/shell"
  [cmd opts]
  (child-process/spawnSync (first cmd)
                           (clj->js (rest cmd))
                           (clj->js (merge {:stdio "inherit"} opts))))

;; Copied helpers
;; ==============

;; from: frontend.util
;; =====
(defn remove-nils
  "remove pairs of key-value that has nil value from a (possibly nested) map."
  [nm]
  (walk/postwalk
   (fn [el]
     (if (map? el)
       (into {} (remove (comp nil? second)) el)
       el))
   nm))

(defn path-normalize
  "Normalize file path (for reading paths from FS, not required by writting)"
  [s]
  (.normalize s "NFC"))

(defn distinct-by
  [f col]
  (reduce
   (fn [acc x]
     (if (some #(= (f x) (f %)) acc)
       acc
       (vec (conj acc x))))
   []
   col))

(defn split-last [pattern s]
  (when-let [last-index (string/last-index-of s pattern)]
    [(subs s 0 last-index)
     (subs s (+ last-index (count pattern)) (count s))]))

(defn get-file-ext
  [file]
  (and
   (string? file)
   (string/includes? file ".")
   (some-> (last (string/split file #"\.")) string/lower-case)))

(defn split-namespace-pages
  [title]
  (let [parts (string/split title "/")]
    (loop [others (rest parts)
           result [(first parts)]]
      (if (seq others)
        (let [prev (last result)]
          (recur (rest others)
                 (conj result (str prev "/" (first others)))))
        result))))

(defn remove-boundary-slashes
  [s]
  (when (string? s)
    (let [s (if (= \/ (first s))
              (subs s 1)
              s)]
      (if (= \/ (last s))
        (subs s 0 (dec (count s)))
        s))))

(def windows-reserved-chars #"[:\\*\\?\"<>|]+")

(defn page-name-sanity
  "Sanitize the page-name for file name (strict), for file writting"
  ([page-name]
   (page-name-sanity page-name false))
  ([page-name replace-slash?]
   (let [page (some-> page-name
                      (remove-boundary-slashes)
                      ;; Windows reserved path characters
                      (string/replace windows-reserved-chars "_")
                      ;; for android filesystem compatiblity
                      (string/replace #"[\\#|%]+" "_")
                      (path-normalize))]
     (if replace-slash?
       (string/replace page #"/" ".")
       page))))

(defn page-name-sanity-lc
  "Sanitize the query string for a page name (mandate for :block/name)"
  [s]
  (page-name-sanity (string/lower-case s)))

;; from: frontend.db.model
;; =====
(defn get-all-pages
  [db]
  (d/q
   '[:find [(pull ?page [*]) ...]
     :where
     [?page :block/name]]
   db))

(defn get-file
  ([db path]
   (when-let [conn db]
     (:file/content (d/entity conn [:file/path path])))))

;; from: frontend.handler.common
(defn safe-read-string
  [content error-message-or-handler]
  (try
    ;; reader/read-string
    (edn/read-string content)
    (catch :default e
      (js/console.error e)
      (if (fn? error-message-or-handler)
        (error-message-or-handler e)
        (println error-message-or-handler))
      {})))

;; from: frontend.format
;; ====
(defn normalize
  [format]
  (case (keyword format)
    :md :markdown
    :asciidoc :adoc
    ;; default
    (keyword format)))

(defn get-format
  [file]
  (when file
    (normalize (keyword (string/lower-case (last (string/split file #"\.")))))))

;; from: frontend.config
;; ====
(defonce local-db-prefix "logseq_local_")

(defn get-local-dir
  [s]
  (string/replace s local-db-prefix ""))

(defn get-repo-dir
  [repo-url]
  (cond
    true
    #_(and (util/electron?) (local-db? repo-url))
    (get-local-dir repo-url)

    #_(and (mobile-util/is-native-platform?) (local-db? repo-url))
    #_(let [dir (get-local-dir repo-url)]
      (if (string/starts-with? dir "file:")
        dir
        (str "file:///" (string/replace dir #"^/+" ""))))

    :else
    (str "/"
         (->> (take-last 2 (string/split repo-url #"/"))
              (string/join "_")))))

(defn get-file-path
  "Normalization happens here"
  [repo-url relative-path]
  (when (and repo-url relative-path)
    (let [path (cond
                 true
                 #_(and (util/electron?) (local-db? repo-url))
                 (let [dir (get-repo-dir repo-url)]
                   (if (string/starts-with? relative-path dir)
                     relative-path
                     (str dir "/"
                          (string/replace relative-path #"^/" ""))))

                 (= "/" (first relative-path))
                 (subs relative-path 1)

                 :else
                 relative-path)]
      (path-normalize path))))

(def app-name "logseq")
(def pages-metadata-file "pages-metadata.edn")

(defn get-pages-metadata-path
  [repo]
  (when repo
    (get-file-path repo (str app-name "/" pages-metadata-file))))

(defonce mldoc-support-formats
  #{:org :markdown :md})

(defn mldoc-support?
  [format]
  (contains? mldoc-support-formats (keyword format)))

;; from: frontend.handler.repo
;; =====
(defn- load-pages-metadata!
  "force?: if set true, skip the metadata timestamp range check"
  [conn repo _file-paths files _force?]
  (try
    (let [file (get-pages-metadata-path repo)]
      (when-let [content (some #(when (= (:file/path %) file) (:file/content %)) files)]
        (let [metadata (safe-read-string content "Parsing pages metadata file failed: ")
              ;; pages (get-all-pages repo)
              ;; pages (zipmap (map :block/name pages) pages)
              metadata (->> metadata
                            #_(filter (fn [{:block/keys [name created-at updated-at]}]
                                        (when-let [page (get pages name)]
                                          (and
                                           (>= updated-at created-at) ;; metadata validation
                                           (or force? ;; when force is true, shortcut timestamp range check
                                               (and (or (nil? (:block/created-at page))
                                                        (>= created-at (:block/created-at page)))
                                                    (or (nil? (:block/updated-at page))
                                                        (>= updated-at (:block/created-at page)))))
                                           (or ;; persistent metadata is the gold standard
                                               (not= created-at (:block/created-at page))
                                               (not= updated-at (:block/created-at page)))))))
                            (remove nil?))]
          (when (seq metadata)
            (d/transact! conn metadata)))))
    (catch js/Error e
      (prn e)
      #_(log/error :exception e))))

;; from: frontend.handler.extract
;; ====
(defn with-block-uuid
  [pages]
  (->> (distinct-by :block/name pages)
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

;; from: frontend.util.property
(defn properties-ast?
  [block]
  (and
   (vector? block)
   (contains? #{"Property_Drawer" "Properties"}
              (first block))))

;; from: frontend.text
;; =====

(def page-ref-re-without-nested #"\[\[([^\[\]]+)\]\]")

(defn get-nested-page-name
  [page-name]
  (when-let [first-match (re-find page-ref-re-without-nested page-name)]
    (second first-match)))

(defn namespace-page?
  [p]
  (and (string? p)
       (string/includes? p "/")
       (not (string/starts-with? p "../"))
       (not (string/starts-with? p "./"))
       ;; TODO: Pull in util/url
       #_(not (util/url? p))))

(defonce non-parsing-properties
  (atom #{"background-color" "background_color"}))

;; TODO: Enable most of the property cases
(defn parse-property
  ([k v]
   (parse-property :markdown k v))
  ([_format k v]
   (let [k (name k)
         v (if (or (symbol? v) (keyword? v)) (name v) (str v))
         v (string/trim v)]
     (cond
       ; (contains? (set/union
       ;             #{"title" "filters"}
       ;             (get (state/get-config) :ignored-page-references-keywords)) k)
       ; v

       (= v "true")
       true
       (= v "false")
       false

       ; (and (not= k "alias") (util/safe-re-find #"^\d+$" v))
       ; (util/safe-parse-int v)

       ; (util/wrapped-by-quotes? v) ; wrapped in ""
       ; v

       (contains? @non-parsing-properties (string/lower-case k))
       v

       ; (mldoc/link? format v)
       ; v

       #_:else
       #_(split-page-refs-without-brackets v)))))

;; from: frontend.format.block
;; =====
(defn heading-block?
  [block]
  (and
   (vector? block)
   (= "Heading" (first block))))

(defn convert-page-if-journal
  "Convert journal file name to user' custom date format"
  [original-page-name]
  (when original-page-name
    (let [page-name (page-name-sanity-lc original-page-name)
          ;; TODO: Enable date/* fns
          day false #_(date/journal-title->int page-name)]
     (if day
       (let [original-page-name "" #_(date/int->journal-title day)]
         [original-page-name (page-name-sanity-lc original-page-name) day])
       [original-page-name page-name day]))))

(defn with-parent-and-left
  [page-id blocks]
  (loop [blocks (map (fn [block] (assoc block :block/level-spaces (:block/level block))) blocks)
         parents [{:page/id page-id     ; db id or a map {:block/name "xxx"}
                   :block/level 0
                   :block/level-spaces 0}]
         _sibling nil
         result []]
    (if (empty? blocks)
      (map #(dissoc % :block/level-spaces) result)
      (let [[block & others] blocks
            level-spaces (:block/level-spaces block)
            {:block/keys [uuid level parent] :as last-parent} (last parents)
            parent-spaces (:block/level-spaces last-parent)
            [blocks parents sibling result]
            (cond
              (= level-spaces parent-spaces)        ; sibling
              (let [block (assoc block
                                 :block/parent parent
                                 :block/left [:block/uuid uuid]
                                 :block/level level)
                    parents' (conj (vec (butlast parents)) block)
                    result' (conj result block)]
                [others parents' block result'])

              (> level-spaces parent-spaces)         ; child
              (let [parent (if uuid [:block/uuid uuid] (:page/id last-parent))
                    block (cond->
                            (assoc block
                                  :block/parent parent
                                  :block/left parent)
                            ;; fix block levels with wrong order
                            ;; For example:
                            ;;   - a
                            ;; - b
                            ;; What if the input indentation is two spaces instead of 4 spaces
                            (>= (- level-spaces parent-spaces) 1)
                            (assoc :block/level (inc level)))
                    parents' (conj parents block)
                    result' (conj result block)]
                [others parents' block result'])

              (< level-spaces parent-spaces)
              (cond
                (some #(= (:block/level-spaces %) (:block/level-spaces block)) parents) ; outdent
                (let [parents' (vec (filter (fn [p] (<= (:block/level-spaces p) level-spaces)) parents))
                      left (last parents')
                      blocks (cons (assoc (first blocks)
                                          :block/level (dec level)
                                          :block/left [:block/uuid (:block/uuid left)])
                                   (rest blocks))]
                  [blocks parents' left result])

                :else
                (let [[f r] (split-with (fn [p] (<= (:block/level-spaces p) level-spaces)) parents)
                      left (first r)
                      parent-id (if-let [block-id (:block/uuid (last f))]
                                  [:block/uuid block-id]
                                  page-id)
                      block (cond->
                              (assoc block
                                     :block/parent parent-id
                                     :block/left [:block/uuid (:block/uuid left)]
                                     :block/level (:block/level left)
                                     :block/level-spaces (:block/level-spaces left)))

                      parents' (->> (concat f [block]) vec)
                      result' (conj result block)]
                  [others parents' block result'])))]
        (recur blocks parents sibling result)))))

(defn page-name->map
  "Create a page's map structure given a original page name (string).
   map as input is supported for legacy compatibility.
   with-timestamp?: assign timestampes to the map structure.
    Useful when creating new pages from references or namespaces,
    as there's no chance to introduce timestamps via editing in page"
  ([original-page-name with-id?]
   (page-name->map original-page-name with-id? true))
  ([original-page-name with-id? with-timestamp?]
   (cond
     (and original-page-name (string? original-page-name))
     (let [original-page-name (remove-boundary-slashes original-page-name)
           [original-page-name page-name journal-day] (convert-page-if-journal original-page-name)
           namespace? (and (not (boolean (get-nested-page-name original-page-name)))
                           (namespace-page? original-page-name))
           ;; TODO: Pass db down to this fn
           page-entity (some-> nil (d/entity [:block/name page-name]))]
       (merge
        {:block/name page-name
         :block/original-name original-page-name}
        (when with-id?
          (if page-entity
            {}
            {:block/uuid (d/squuid)}))
        (when namespace?
          (let [namespace (first (split-last "/" original-page-name))]
            (when-not (string/blank? namespace)
              {:block/namespace {:block/name (page-name-sanity-lc namespace)}})))
        (when (and with-timestamp? (not page-entity)) ;; Only assign timestamp on creating new entity
          ;; TODO: add current time with cljs-core
          (let [current-ms 0 #_(util/time-ms)]
            {:block/created-at current-ms
             :block/updated-at current-ms}))
        (if journal-day
          {:block/journal? true
           :block/journal-day journal-day}
          {:block/journal? false})))

     (and (map? original-page-name) (:block/uuid original-page-name))
     original-page-name

     (and (map? original-page-name) with-id?)
     (assoc original-page-name :block/uuid (d/squuid))

     :else
     nil)))

;; from: frontend.handler.extract
;; =====
(defn get-page-name
  [file ast]
  ;; headline
  (let [ast (map first ast)]
    (if (string/includes? file "pages/contents.")
      "Contents"
      (let [first-block (last (first (filter heading-block? ast)))
            property-name (when (and (contains? #{"Properties" "Property_Drawer"} (ffirst ast))
                                     (not (string/blank? (:title (last (first ast))))))
                            (:title (last (first ast))))
            first-block-name (let [title (last (first (:title first-block)))]
                               (and first-block
                                    (string? title)
                                    title))
            file-name (when-let [file-name (last (string/split file #"/"))]
                        (let [result (first (split-last "." file-name))]
                          (if (mldoc-support? (string/lower-case (get-file-ext file)))
                            (string/replace result "." "/")
                            result)))]
        (or property-name
            ;; TODO: Enable arg for :page-name-order config
            (if false #_(= (state/page-name-order) "heading")
              (or first-block-name file-name)
              (or file-name first-block-name)))))))

;; TODO: Actually implementation
(defn extract-blocks
  [& args])

(defn- extract-pages-and-blocks
  #_:clj-kondo/ignore
  [repo-url format ast properties file content]
  (try
    (let [page (get-page-name file ast)
          [_original-page-name page-name _journal-day] (convert-page-if-journal page)
          blocks (->> (extract-blocks ast content false format)
                      (with-parent-and-left {:block/name page-name}))
          ref-pages (atom #{})
          ref-tags (atom #{})
          blocks (map (fn [block]
                        (let [block-ref-pages (seq (:block/refs block))
                              page-lookup-ref [:block/name page-name]
                              block-path-ref-pages (->> (cons page-lookup-ref (seq (:block/path-refs block)))
                                                        (remove nil?))]
                          (when block-ref-pages
                            (swap! ref-pages set/union (set block-ref-pages)))
                          (-> block
                              (dissoc :ref-pages)
                              (assoc :block/format format
                                     :block/page [:block/name page-name]
                                     :block/refs block-ref-pages
                                     :block/path-refs block-path-ref-pages))))
                   blocks)
          page-entity (let [alias (:alias properties)
                            alias (if (string? alias) [alias] alias)
                            aliases (and alias
                                         (seq (remove #(or (= page-name (page-name-sanity-lc %))
                                                           (string/blank? %)) ;; disable blank alias
                                                      alias)))
                            aliases (->>
                                     (map
                                       (fn [alias]
                                         (let [page-name (page-name-sanity-lc alias)
                                               aliases (distinct
                                                        (conj
                                                         (remove #{alias} aliases)
                                                         page))
                                               aliases (when (seq aliases)
                                                         (map
                                                           (fn [alias]
                                                             {:block/name (page-name-sanity-lc alias)})
                                                           aliases))]
                                           (if (seq aliases)
                                             {:block/name page-name
                                              :block/alias aliases}
                                             {:block/name page-name})))
                                       aliases)
                                     (remove nil?))]
                        (cond->
                         (remove-nils
                            (assoc
                             (page-name->map page false)
                             :block/file {:file/path (path-normalize file)}))
                         (seq properties)
                         (assoc :block/properties properties)

                         (seq aliases)
                         (assoc :block/alias aliases)

                         (:tags properties)
                         (assoc :block/tags (let [tags (:tags properties)
                                                  tags (if (string? tags) [tags] tags)
                                                  tags (remove string/blank? tags)]
                                              (swap! ref-tags set/union (set tags))
                                              (map (fn [tag] {:block/name (page-name-sanity-lc tag)
                                                              :block/original-name tag})
                                                   tags)))))
          namespace-pages (let [page (:block/original-name page-entity)]
                            (when (namespace-page? page)
                              (->> (split-namespace-pages page)
                                   (map (fn [page]
                                          (-> (page-name->map page true)
                                              (assoc :block/format format)))))))
          pages (->> (concat
                      [page-entity]
                      @ref-pages
                      (map
                        (fn [page]
                          {:block/original-name page
                           :block/name (page-name-sanity-lc page)})
                        @ref-tags)
                      namespace-pages)
                     ;; remove block references
                     (remove vector?)
                     (remove nil?))
          pages (distinct-by :block/name pages)
          pages (remove nil? pages)
          pages (map (fn [page] (assoc page :block/uuid (d/squuid))) pages)
          blocks (->> (remove nil? blocks)
                      (map (fn [b] (dissoc b :block/title :block/body :block/level :block/children :block/meta :block/anchor))))]
      [pages blocks])
    (catch js/Error e
      (prn e)
      #_(log/error :exception e))))

(defn extract-blocks-pages
  [repo-url file content]
  (if (string/blank? content)
    []
    (let [format (get-format file)
          _ (println "Parsing start: " file)
          ast (mldoc/->edn content (mldoc/default-config format
                                                         ;; {:parse_outline_only? true}
                                                         ))]
      (println "Parsing finished : " file)
      (let [first-block (ffirst ast)
            properties (let [properties (and (properties-ast? first-block)
                                             (->> (last first-block)
                                                  (map (fn [[x y]]
                                                         [x (if (string? y)
                                                              (parse-property format x y)
                                                              y)]))
                                                  (into {})
                                                  (walk/keywordize-keys)))]
                         (when (and properties (seq properties))
                           (if (:filters properties)
                             (update properties :filters
                                     (fn [v]
                                       (string/replace (or v "") "\\" "")))
                             properties)))]
        (extract-pages-and-blocks
         repo-url
         format ast properties
         file content)))))

;; from: frontend.handler.file
(defn reset-file!
  [conn repo-url file content _new-graph?]
  (let [file (cond
               true #_(and electron-local-repo? (or
                                                 util/win32?
                                                 (not= "/" (first file))))
               (str (get-repo-dir repo-url) "/" file)

               ; (and (mobile/native-android?) (not= "/" (first file)))
               ; file
               ;
               ; (and (mobile/native-ios?) (not= "/" (first file)))
               ; file

               :else
               file)
        file (path-normalize file)
        new? (nil? (d/entity @conn [:file/path file]))]
    (d/transact! conn [{:file/path file :file/content content}])
    (let [format (get-format file)
          file-content [{:file/path file}]
          tx (if (contains? mldoc-support-formats format)
               (let [[pages blocks] (extract-blocks-pages repo-url file content)
                     _first-page (first pages)
                     ;; Don't do deletion now
                     delete-blocks []
                     #_(->
                        (concat
                         (db/delete-file-blocks! repo-url file)
                         (when first-page (db/delete-page-blocks repo-url (:block/name first-page))))
                        (distinct))
                     ;; Conflict detection should live elsewhere
                     ; _ (when-let [current-file (page-exists-in-another-file repo-url first-page file)]
                     ;     (when (not= file current-file)
                     ;       (let [error (str "Page already exists with another file: " current-file ", current file: " file)]
                     ;         (state/pub-event! [:notification/show
                     ;                            {:content error
                     ;                             :status :error
                     ;                             :clear? false}]))))
                     block-ids (map (fn [block] {:block/uuid (:block/uuid block)}) blocks)
                     block-refs-ids (->> (mapcat :block/refs blocks)
                                         (filter (fn [ref] (and (vector? ref)
                                                                (= :block/uuid (first ref)))))
                                         (map (fn [ref] {:block/uuid (second ref)}))
                                         (seq))
                     ;; To prevent "unique constraint" on datascript
                     block-ids (set/union (set block-ids) (set block-refs-ids))
                     pages (with-ref-pages pages blocks)
                     pages-index (map #(select-keys % [:block/name]) pages)]
                 ;; does order matter?
                 (concat file-content pages-index delete-blocks pages block-ids blocks))
               file-content)
          ;; TODO: Implement :file/created-at with cljs-time
          tx (concat tx [(let [t 0 #_(tc/to-long (t/now))] ;; TODO: use file system timestamp?
                           (cond->
                            {:file/path file}
                            new?
                            (assoc :file/created-at t)))])]
      ;; TODO: Ask is {:new-graph true} needed?
      (d/transact! conn tx))))

;; from: frontend.handler.repo
(defn parse
  "From parse-files-and-create-default-files-inner!"
  [conn repo-url files file-paths]
  (let [support-files (filter
                       (fn [file]
                         (let [format (get-format (:file/path file))]
                           (contains? (set/union #{:edn :css} mldoc-support-formats) format)))
                       files)
        _support-files (sort-by :file/path support-files)]
    (doseq [{:file/keys [path content]} support-files]
      (reset-file! conn repo-url path content true))
    (load-pages-metadata! conn repo-url file-paths files true)))

;; Main fns
;; ========

(defn db-start
  ;; TODO: Add frontend.db.default/built-in-pages
  []
  (let [db-conn (d/create-conn db-schema/schema)]
    (d/transact! db-conn [{:schema/version db-schema/version}])
    db-conn))

(defn -main
  [args]
  (let [conn (db-start)
        repo-dir (or (first args)
                     (throw (ex-info "Directory required" {})))
        files (->> (str (.-stdout (sh ["git" "ls-files"]
                                      {:cwd repo-dir :stdio nil})))
                   string/split-lines
                   (filter #(re-find #"^(pages|assets|journals|logseq)" %))
                   (map #(str repo-dir "/" %)))
        file-maps (mapv #(hash-map :file/path % :file/content (slurp %)) files)]
    (parse conn
           (str "logseq_local_" repo-dir)
           file-maps
           files)
    (prn :PAGES (d/q '[:find ?n :where [?b :block/name ?n]]
              @conn))
    (prn :DATOMS (count (d/datoms @conn :eavt)))))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))
