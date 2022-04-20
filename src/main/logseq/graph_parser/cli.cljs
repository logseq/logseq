(ns logseq.graph-parser.cli
  "Main ns for graph parsing CLI"
  (:require [clojure.string :as string]
            [clojure.set :as set]
            [clojure.edn :as edn]
            [clojure.walk :as walk]
            [clojure.data :as data]
            [clojure.pprint :as pprint]
            [datascript.core :as d]
            [datascript.transit :as dt]
            ["fs" :as fs]
            ["child_process" :as child-process]
            [frontend.db-schema :as db-schema]
            [frontend.db.default :as default-db]
            [logseq.graph-parser.config :as config]
            [logseq.graph-parser.extract :as extract]
            [logseq.graph-parser.mldoc :as mldoc]
            [logseq.graph-parser.util :as util]
            [logseq.graph-parser.property :as property]
            [logseq.graph-parser.text :as text]
            [logseq.graph-parser.block :as block]
            [logseq.graph-parser.time-util :as time-util]
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

;; from: frontend.handler.repo
;; =====
(defn- load-pages-metadata!
  "force?: if set true, skip the metadata timestamp range check"
  [conn repo _file-paths files _force?]
  (try
    (let [file (config/get-pages-metadata-path repo)]
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

;; from: frontend.handler.file
(defn reset-file!
  [conn repo-url file content _new-graph?]
  (let [file (cond
                false #_(and electron-local-repo? (or
                                                 util/win32?
                                                 (not= "/" (first file))))
               (str (config/get-repo-dir repo-url) "/" file)

               ; (and (mobile/native-android?) (not= "/" (first file)))
               ; file
               ;
               ; (and (mobile/native-ios?) (not= "/" (first file)))
               ; file

               :else
               file)
        file (util/path-normalize file)
        new? (nil? (d/entity @conn [:file/path file]))]
    (d/transact! conn [{:file/path file :file/content content}])
    (let [format (extract/get-format file)
          file-content [{:file/path file}]
          tx (if (contains? config/mldoc-support-formats format)
               (let [[pages blocks] (extract/extract-blocks-pages repo-url file content)
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
                     pages (extract/with-ref-pages pages blocks)
                     pages-index (map #(select-keys % [:block/name]) pages)]
                 ;; does order matter?
                 (concat file-content pages-index delete-blocks pages block-ids blocks))
               file-content)
          tx (concat tx [(let [t (time-util/time-ms)] ;; TODO use file system timestamp?
                           (cond->
                            {:file/path file}
                            new?
                            (assoc :file/created-at t)))])]
      ;; TODO: Ask is {:new-graph true} needed?
      (d/transact! conn (util/remove-nils tx)))))

;; from: frontend.handler.repo
(defn parse
  "From parse-files-and-create-default-files-inner!"
  [conn repo-url files file-paths]
  (let [support-files (filter
                       (fn [file]
                         (let [format (extract/get-format (:file/path file))]
                           (contains? (set/union #{:edn :css} config/mldoc-support-formats) format)))
                       files)
        _support-files (sort-by :file/path support-files)]
    (doseq [{:file/keys [path content]} support-files]
      (reset-file! conn repo-url path content true))
    (load-pages-metadata! conn repo-url file-paths files true)))

;; Main fns
;; ========

(defn db-start
  []
  (let [db-conn (d/create-conn db-schema/schema)]
    (d/transact! db-conn [{:schema/version db-schema/version}])
    (d/transact! db-conn default-db/built-in-pages)
    (reset! block/conn db-conn)
    db-conn))

(defn- mapify-datoms
  [datoms]
  (reduce (fn [m [e a v]]
            (if (#{:block/created-at :block/updated-at :block/uuid :block/name
                   :block/left :block/page :block/parent :block/namespace
                   ;; TODO: Look at diffs from block refs + timestamps
                   :block/path-refs :block/refs :file/last-modified-at
                   :file/created-at :block/file}
                  a)
              m
              (update m e assoc a v)))
          {}
          datoms))

(defn -main
  [args]
  (let [conn (db-start)
        repo-dir (or (first args)
                     (throw (ex-info "Directory required" {})))
        cached-graph-file (second args)
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
    (prn :DATOMS-COUNT (count (d/datoms @conn :eavt)))
    (when cached-graph-file
      (let [db (dt/read-transit-str (slurp cached-graph-file))
            datoms-actual (-> (mapify-datoms (take 1000 (d/datoms @conn :eavt)))
                              ; (select-keys (range 1 50))
                              vals
                              set)
            datoms-expected (-> (mapify-datoms (take 1000 (d/datoms db :eavt)))
                                ; (select-keys (range 1 50))
                                vals
                                set)]
        (prn :ACTUAL-DATOMS-COUNT (count (d/datoms db :eavt)))

        (fs/writeFileSync "diff.edn"
                          (with-out-str
                            (pprint/pprint {:actual datoms-actual
                                            :expected datoms-expected
                                            :diff (butlast (data/diff datoms-actual datoms-expected))})))))))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))
