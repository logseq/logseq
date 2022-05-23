(ns frontend.handler.repo
  (:refer-clojure :exclude [clone])
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.fs :as fs]
            [frontend.fs.nfs :as nfs]
            [frontend.handler.common :as common-handler]
            [frontend.handler.file :as file-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.metadata :as metadata-handler]
            [frontend.idb :as idb]
            [frontend.search :as search]
            [frontend.spec :as spec]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.fs :as util-fs]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]
            [shadow.resource :as rc]
            [frontend.db.persist :as db-persist]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.config :as gp-config]
            [electron.ipc :as ipc]
            [clojure.set :as set]
            [cljs-bean.core :as bean]
            [clojure.core.async :as async]
            [frontend.encrypt :as encrypt]
            [frontend.mobile.util :as mobile-util]))

;; Project settings should be checked in two situations:
;; 1. User changes the config.edn directly in logseq.com (fn: alter-file)
;; 2. Git pulls the new change (fn: load-files)

(defn create-config-file-if-not-exists
  [repo-url]
  (spec/validate :repos/url repo-url)
  (let [repo-dir (config/get-repo-dir repo-url)
        app-dir config/app-name
        dir (str repo-dir "/" app-dir)]
    (p/let [_ (fs/mkdir-if-not-exists dir)]
      (let [default-content config/config-default-content
            path (str app-dir "/" config/config-file)]
        (p/let [file-exists? (fs/create-if-not-exists repo-url repo-dir (str app-dir "/" config/config-file) default-content)]
          (when-not file-exists?
            (file-handler/reset-file! repo-url path default-content)
            (common-handler/reset-config! repo-url default-content)))))))

(defn create-contents-file
  [repo-url]
  (spec/validate :repos/url repo-url)
  (p/let [repo-dir (config/get-repo-dir repo-url)
          pages-dir (state/get-pages-directory)
          [org-path md-path] (map #(str "/" pages-dir "/contents." %) ["org" "md"])
          contents-file-exist? (some #(fs/file-exists? repo-dir %) [org-path md-path])]
    (when-not contents-file-exist?
      (let [format (state/get-preferred-format)
            path (str pages-dir "/contents."
                      (config/get-file-extension format))
            file-path (str "/" path)
            default-content (case (name format)
                              "org" (rc/inline "contents.org")
                              "markdown" (rc/inline "contents.md")
                              "")]
        (p/let [_ (fs/mkdir-if-not-exists (str repo-dir "/" pages-dir))
                file-exists? (fs/create-if-not-exists repo-url repo-dir file-path default-content)]
          (when-not file-exists?
            (file-handler/reset-file! repo-url path default-content)))))))

(defn create-custom-theme
  [repo-url]
  (spec/validate :repos/url repo-url)
  (let [repo-dir (config/get-repo-dir repo-url)
        path (str config/app-name "/" config/custom-css-file)
        file-path (str "/" path)
        default-content ""]
    (p/let [_ (fs/mkdir-if-not-exists (str repo-dir "/" config/app-name))
            file-exists? (fs/create-if-not-exists repo-url repo-dir file-path default-content)]
      (when-not file-exists?
        (file-handler/reset-file! repo-url path default-content)))))

(defn create-dummy-notes-page
  [repo-url content]
  (spec/validate :repos/url repo-url)
  (let [repo-dir (config/get-repo-dir repo-url)
        path (str (config/get-pages-directory) "/how_to_make_dummy_notes.md")
        file-path (str "/" path)]
    (p/let [_ (fs/mkdir-if-not-exists (str repo-dir "/" (config/get-pages-directory)))
            _file-exists? (fs/create-if-not-exists repo-url repo-dir file-path content)]
      (file-handler/reset-file! repo-url path content))))

(defn- create-today-journal-if-not-exists
  [repo-url {:keys [content]}]
  (spec/validate :repos/url repo-url)
  (when (state/enable-journals? repo-url)
    (let [repo-dir (config/get-repo-dir repo-url)
          format (state/get-preferred-format repo-url)
          title (date/today)
          file-name (date/journal-title->default title)
          default-content (util/default-content-with-title format)
          template (state/get-default-journal-template)
          template (when (and template
                              (not (string/blank? template)))
                     template)
          content (cond
                    content
                    content

                    template
                    (str default-content template)

                    :else
                    default-content)
          path (str (config/get-journals-directory) "/" file-name "."
                    (config/get-file-extension format))
          file-path (str "/" path)
          page-exists? (db/entity repo-url [:block/name (util/page-name-sanity-lc title)])
          empty-blocks? (db/page-empty? repo-url (util/page-name-sanity-lc title))]
      (when (or empty-blocks? (not page-exists?))
        (p/let [_ (nfs/check-directory-permission! repo-url)
                _ (fs/mkdir-if-not-exists (str repo-dir "/" (config/get-journals-directory)))
                file-exists? (fs/file-exists? repo-dir file-path)]
          (when-not file-exists?
            (p/let [_ (file-handler/reset-file! repo-url path content)]
              (p/let [_ (fs/create-if-not-exists repo-url repo-dir file-path content)]
                (when-not (state/editing?)
                  (ui-handler/re-render-root!)))))
          (when-not (state/editing?)
            (ui-handler/re-render-root!)))))))

(defn create-default-files!
  ([repo-url]
   (create-default-files! repo-url false))
  ([repo-url encrypted?]
   (spec/validate :repos/url repo-url)
   (let [repo-dir (config/get-repo-dir repo-url)]
     (p/let [_ (fs/mkdir-if-not-exists (str repo-dir "/" config/app-name))
             _ (fs/mkdir-if-not-exists (str repo-dir "/" config/app-name "/" config/recycle-dir))
             _ (fs/mkdir-if-not-exists (str repo-dir "/" (config/get-journals-directory)))
             _ (file-handler/create-metadata-file repo-url encrypted?)
             _ (create-config-file-if-not-exists repo-url)
             _ (create-contents-file repo-url)
             _ (create-custom-theme repo-url)]
       (state/pub-event! [:page/create-today-journal repo-url])))))

(defn- load-pages-metadata!
  "force?: if set true, skip the metadata timestamp range check"
  ([repo file-paths files]
   (load-pages-metadata! repo file-paths files false))
  ([repo file-paths files force?]
   (try
     (let [file (config/get-pages-metadata-path)]
       (when (contains? (set file-paths) file)
         (when-let [content (some #(when (= (:file/path %) file) (:file/content %)) files)]
           (let [metadata (common-handler/safe-read-string content "Parsing pages metadata file failed: ")
                 pages (db/get-all-pages repo)
                 pages (zipmap (map :block/name pages) pages)
                 metadata (->>
                           (filter (fn [{:block/keys [name created-at updated-at]}]
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
                                         (not= updated-at (:block/created-at page)))))) metadata)
                           (remove nil?))]
             (when (seq metadata)
               (db/transact! repo metadata))))))
     (catch js/Error e
       (log/error :exception e)))))

(defn update-pages-metadata!
  "update pages meta content -> db. Only accept non-encrypted content!"
  [repo content force?]
  (let [path (config/get-pages-metadata-path)
        files [{:file/path path
                :file/content content}]
        file-paths [path]]
    (util/profile "update-pages-metadata!" (load-pages-metadata! repo file-paths files force?))))

(defn- parse-and-load-file!
  [repo-url file new-graph?]
  (try
    (file-handler/alter-file repo-url
                             (:file/path file)
                             (:file/content file)
                             {:new-graph? new-graph?
                              :re-render-root? false
                              :from-disk? true})
    (catch :default e
      (state/set-parsing-state! (fn [m]
                                  (update m :failed-parsing-files conj [(:file/path file) e])))))
  (state/set-parsing-state! (fn [m]
                              (update m :finished inc))))

(defn- after-parse
  [repo-url files file-paths db-encrypted? re-render? re-render-opts opts graph-added-chan]
  (load-pages-metadata! repo-url file-paths files true)
  (when (or (:new-graph? opts) (not (:refresh? opts)))
    (if (and (not db-encrypted?) (state/enable-encryption? repo-url))
      (state/pub-event! [:modal/encryption-setup-dialog repo-url
                         #(create-default-files! repo-url %)])
      (create-default-files! repo-url db-encrypted?)))
  (when re-render?
    (ui-handler/re-render-root! re-render-opts))
  (state/pub-event! [:graph/added repo-url opts])
  (state/reset-parsing-state!)
  (state/set-loading-files! repo-url false)
  (async/offer! graph-added-chan true))

(defn- parse-files-and-create-default-files-inner!
  [repo-url files delete-files delete-blocks file-paths db-encrypted? re-render? re-render-opts opts]
  (let [support-files (filter
                       (fn [file]
                         (let [format (gp-util/get-format (:file/path file))]
                           (contains? (set/union #{:edn :css} gp-config/mldoc-support-formats) format)))
                       files)
        support-files (sort-by :file/path support-files)
        {journals true non-journals false} (group-by (fn [file] (string/includes? (:file/path file) "journals/")) support-files)
        {built-in true others false} (group-by (fn [file]
                                                 (or (string/includes? (:file/path file) "contents.")
                                                     (string/includes? (:file/path file) ".edn")
                                                     (string/includes? (:file/path file) "custom.css"))) non-journals)
        support-files' (concat (reverse journals) built-in others)
        new-graph? (:new-graph? opts)
        delete-data (->> (concat delete-files delete-blocks)
                         (remove nil?))
        chan (async/to-chan! support-files')
        graph-added-chan (async/promise-chan)]
    (when (seq delete-data) (db/transact! repo-url delete-data))
    (state/set-current-repo! repo-url)
    (state/set-parsing-state! {:total (count support-files')})
    ;; Synchronous for tests for not breaking anything
    (if util/node-test?
      (do
        (doseq [file support-files']
          (state/set-parsing-state! (fn [m]
                                      (assoc m :current-parsing-file (:file/path file))))
          (parse-and-load-file! repo-url file new-graph?))
        (after-parse repo-url files file-paths db-encrypted? re-render? re-render-opts opts graph-added-chan))
      (async/go-loop []
        (if-let [file (async/<! chan)]
          (do
            (state/set-parsing-state! (fn [m]
                                        (assoc m :current-parsing-file (:file/path file))))
            (async/<! (async/timeout 10))
            (parse-and-load-file! repo-url file new-graph?)
            (recur))
          (after-parse repo-url files file-paths db-encrypted? re-render? re-render-opts opts graph-added-chan))))
    graph-added-chan))

(defn- parse-files-and-create-default-files!
  [repo-url files delete-files delete-blocks file-paths db-encrypted? re-render? re-render-opts opts]
  (if db-encrypted?
    (p/let [files (p/all
                   (map (fn [file]
                          (p/let [content (encrypt/decrypt (:file/content file))]
                            (assoc file :file/content content)))
                     files))]
      (parse-files-and-create-default-files-inner! repo-url files delete-files delete-blocks file-paths db-encrypted? re-render? re-render-opts opts))
    (parse-files-and-create-default-files-inner! repo-url files delete-files delete-blocks file-paths db-encrypted? re-render? re-render-opts opts)))

(defn parse-files-and-load-to-db!
  [repo-url files {:keys [delete-files delete-blocks re-render? re-render-opts _refresh?] :as opts
                   :or {re-render? true}}]
  (let [file-paths (map :file/path files)
        metadata-file (config/get-metadata-path)
        metadata-content (some #(when (= (:file/path %) metadata-file)
                                  (:file/content %)) files)
        metadata (when metadata-content
                   (common-handler/read-metadata! metadata-content))
        db-encrypted? (:db/encrypted? metadata)
        db-encrypted-secret (if db-encrypted? (:db/encrypted-secret metadata) nil)]
    (if db-encrypted?
      (let [close-fn #(parse-files-and-create-default-files! repo-url files delete-files delete-blocks file-paths db-encrypted? re-render? re-render-opts opts)]
        (state/set-state! :encryption/graph-parsing? true)
        (state/pub-event! [:modal/encryption-input-secret-dialog repo-url
                           db-encrypted-secret
                           close-fn]))
      (parse-files-and-create-default-files! repo-url files delete-files delete-blocks file-paths db-encrypted? re-render? re-render-opts opts))))

(defn load-repo-to-db!
  [repo-url {:keys [diffs nfs-files refresh? new-graph? empty-graph?]}]
  (spec/validate :repos/url repo-url)
  (route-handler/redirect-to-home!)
  (state/set-parsing-state! {:graph-loading? true})
  (let [config (or (state/get-config repo-url)
                   (when-let [content (some-> (first (filter #(= (config/get-config-path repo-url) (:file/path %)) nfs-files))
                                              :file/content)]
                     (common-handler/read-config content)))
        relate-path-fn (fn [m k]
                         (some-> (get m k)
                                 (string/replace (js/decodeURI (config/get-local-dir repo-url)) "")))
        nfs-files (common-handler/remove-hidden-files nfs-files config #(relate-path-fn % :file/path))
        diffs (common-handler/remove-hidden-files diffs config #(relate-path-fn % :path))
        load-contents (fn [files option]
                        (file-handler/load-files-contents!
                         repo-url
                         files
                         (fn [files-contents]
                           (parse-files-and-load-to-db! repo-url files-contents (assoc option :refresh? refresh?)))))]
    (cond
      (and (not (seq diffs)) nfs-files)
      (parse-files-and-load-to-db! repo-url nfs-files {:new-graph? new-graph?
                                                       :empty-graph? empty-graph?})

      :else
      (when (seq diffs)
        (let [filter-diffs (fn [type] (->> (filter (fn [f] (= type (:type f))) diffs)
                                           (map :path)))
              remove-files (filter-diffs "remove")
              modify-files (filter-diffs "modify")
              add-files (filter-diffs "add")
              delete-files (when (seq remove-files)
                             (db/delete-files remove-files))
              delete-blocks (db/delete-blocks repo-url remove-files true)
              delete-blocks (->>
                             (concat
                              delete-blocks
                              (db/delete-blocks repo-url modify-files false))
                             (remove nil?))
              delete-pages (if (seq remove-files)
                             (db/delete-pages-by-files remove-files)
                             [])
              add-or-modify-files (some->>
                                   (concat modify-files add-files)
                                   (gp-util/remove-nils))
              options {:delete-files (concat delete-files delete-pages)
                       :delete-blocks delete-blocks
                       :re-render? true}]
          (if (seq nfs-files)
            (parse-files-and-load-to-db! repo-url nfs-files
                                         (assoc options
                                                :refresh? refresh?
                                                :re-render-opts {:clear-all-query-state? true}))
            (load-contents add-or-modify-files options)))))))

(defn remove-repo!
  [{:keys [url] :as repo}]
  (let [delete-db-f (fn []
                      (let [graph-exists? (db/get-db url)]
                        (db/remove-conn! url)
                        (db-persist/delete-graph! url)
                        (search/remove-db! url)
                        (state/delete-repo! repo)
                        (when graph-exists? (ipc/ipc "graphUnlinked" repo))))]
    (when (or (config/local-db? url) (= url "local"))
      (p/let [_ (idb/clear-local-db! url)] ; clear file handles
        (delete-db-f)))))

(defn start-repo-db-if-not-exists!
  [repo option]
  (state/set-current-repo! repo)
  (db/start-db-conn! nil repo option))

(defn setup-local-repo-if-not-exists!
  []
  (if js/window.pfs
    (let [repo config/local-repo]
      (p/do! (fs/mkdir-if-not-exists (str "/" repo))
             (state/set-current-repo! repo)
             (db/start-db-conn! nil repo)
             (when-not config/publishing?
               (let [dummy-notes (t :tutorial/dummy-notes)]
                 (create-dummy-notes-page repo dummy-notes)))
             (when-not config/publishing?
               (let [tutorial (t :tutorial/text)
                     tutorial (string/replace-first tutorial "$today" (date/today))]
                 (create-today-journal-if-not-exists repo {:content tutorial})))
             (create-config-file-if-not-exists repo)
             (create-contents-file repo)
             (create-custom-theme repo)
             (state/set-db-restoring! false)
             (ui-handler/re-render-root!)))
    (js/setTimeout setup-local-repo-if-not-exists! 100)))

(defn restore-and-setup-repo!
  "Restore the db of a graph from the persisted data, and setup.
   Create a new conn, or replace the conn in state with a new one.
   me: optional, identity data, can be retrieved from `(state/get-me)` or `nil`"
  ([repo]
   (restore-and-setup-repo! repo (state/get-me)))
  ([repo me]
   (p/let [_ (state/set-db-restoring! true)
           _ (db/restore-graph! repo me)]
     (file-handler/restore-config! repo false)
     ;; Don't have to unlisten the old listerner, as it will be destroyed with the conn
     (db/listen-and-persist! repo)
     (ui-handler/add-style-if-exists!)
     (state/set-db-restoring! false))))

(defn rebuild-index!
  [url]
  (when url
    (search/reset-indice! url)
    (db/remove-conn! url)
    (db/clear-query-state!)
    (-> (p/do! (db-persist/delete-graph! url))
        (p/catch (fn [error]
                   (prn "Delete repo failed, error: " error))))))

(defn re-index!
  [nfs-rebuild-index! ok-handler]
  (route-handler/redirect-to-home!)
  (when-let [repo (state/get-current-repo)]
    (let [local? (config/local-db? repo)]
      (if local?
        (p/let [_ (metadata-handler/set-pages-metadata! repo)]
          (nfs-rebuild-index! repo ok-handler))
        (rebuild-index! repo))
      (js/setTimeout
       (route-handler/redirect-to-home!)
       500))))

(defn persist-db!
  ([]
   (persist-db! {}))
  ([handlers]
   (persist-db! (state/get-current-repo) handlers))
  ([repo {:keys [before on-success on-error]}]
   (->
    (p/do!
     (when before
       (before))
     (metadata-handler/set-pages-metadata! repo)
     (db/persist! repo)
     (when on-success
       (on-success)))
    (p/catch (fn [error]
               (js/console.error error)
               (when on-error
                 (on-error)))))))

(defn broadcast-persist-db!
  "Only works for electron
   Call backend to handle persisting a specific db on other window
   Skip persisting if no other windows is open (controlled by electron)
     step 1. [In HERE]  a window         ---broadcastPersistGraph---->   electron
     step 2.            electron         ---------persistGraph------->   window holds the graph
     step 3.            window w/ graph  --broadcastPersistGraphDone->   electron
     step 4. [In HERE]  a window         <---broadcastPersistGraph----   electron"
  [graph]
  (p/let [_ (ipc/ipc "broadcastPersistGraph" graph)] ;; invoke for chaining promise
    nil))

(defn get-repos
  []
  (p/let [nfs-dbs (db-persist/get-all-graphs)
          nfs-dbs (map (fn [db]
                         {:url db
                          :root (config/get-local-dir db)
                          :nfs? true}) nfs-dbs)
          nfs-dbs (and (seq nfs-dbs)
                       ;; TODO: mobile
                       (cond (util/electron?)
                             (ipc/ipc :inflateGraphsInfo nfs-dbs)

                             (mobile-util/is-native-platform?)
                             (util-fs/inflate-graphs-info nfs-dbs)

                             :else
                             nil))
          nfs-dbs (seq (bean/->clj nfs-dbs))]

         (cond
           (seq nfs-dbs)
           nfs-dbs

           :else
           [{:url config/local-repo
             :example? true}])))

(defn refresh-repos!
  []
  (p/let [repos (get-repos)]
    (state/set-repos! repos)
    repos))

(defn graph-ready!
  "Call electron that the graph is loaded."
  [graph]
  (ipc/ipc "graphReady" graph))
