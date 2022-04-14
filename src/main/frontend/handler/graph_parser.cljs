(ns frontend.handler.graph-parser
  (:require [clojure.string :as string]
            [clojure.set :as set]
            [clojure.edn :as edn]
            [datascript.core :as d]
            ["fs" :as fs]
            ["child_process" :as child-process]
            [frontend.db-schema :as db-schema]
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

;; From other namespace
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

#_(defn alter-file
  [repo path content {:keys [reset? re-render-root? from-disk? skip-compare? new-graph?]
                      :or {reset? true
                           re-render-root? false
                           from-disk? false
                           skip-compare? false}}]
  (let [original-content (get-file repo path)
        write-file! (if from-disk?
                      #(p/resolved nil)
                      #(fs/write-file! repo (config/get-repo-dir repo) path content
                                       (assoc (when original-content {:old-content original-content})
                                              :skip-compare? skip-compare?)))]
    (if reset?
      (do
        (when-let [page-id (db/get-file-page-id path)]
          (db/transact! repo
            [[:db/retract page-id :block/alias]
             [:db/retract page-id :block/tags]]))
        (reset-file! repo path content new-graph?))
      (db/set-file-content! repo path content))
    (util/p-handle (write-file!)
                   (fn [_]
                     (when (= path (config/get-config-path repo))
                       (restore-config! repo true))
                     (when (= path (config/get-custom-css-path repo))
                       (ui-handler/add-style-if-exists!))
                     (when re-render-root? (ui-handler/re-render-root!)))
                   (fn [error]
                     (println "Write file failed, path: " path ", content: " content)
                     (log/error :write/failed error)))))

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

;; Main handler.repo parse fns
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

(defn path-normalize
  "Normalize file path (for reading paths from FS, not required by writting)"
  [s]
  (.normalize s "NFC"))

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

(defonce mldoc-support-formats
  #{:org :markdown :md})

(defn parse
  "From parse-files-and-create-default-files-inner!"
  [conn repo-url files file-paths]
  (let [support-files (filter
                       (fn [file]
                         (let [format (get-format (:file/path file))]
                           (contains? (set/union #{:edn :css} mldoc-support-formats) format)))
                       files)
        _support-files (sort-by :file/path support-files)]
    ;; TODO: Add file content
    #_(doseq [file support-files]
        (alter-file repo-url
                    (:file/path file)
                    (:file/content file)
                    {:new-graph? (:new-graph? opts)
                     :re-render-root? false
                     :from-disk? true
                     :metadata metadata}))
    (load-pages-metadata! conn repo-url file-paths files true)))


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
    (prn (d/q '[:find ?n :where [?b :block/name ?n]]
              @conn))))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))
