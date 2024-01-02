(ns frontend.handler.repo
  "System-component-like ns that manages user's repos/graphs"
  (:refer-clojure :exclude [clone])
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.restore :as db-restore]
            [frontend.fs :as fs]
            [frontend.fs.nfs :as nfs]
            [frontend.handler.file :as file-handler]
            [frontend.handler.repo-config :as repo-config-handler]
            [frontend.handler.common.file :as file-common-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.global-config :as global-config-handler]
            [frontend.idb :as idb]
            [frontend.search :as search]
            [frontend.spec :as spec]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.fs :as util-fs]
            [frontend.util.text :as text-util]
            [frontend.persist-db :as persist-db]
            [promesa.core :as p]
            [shadow.resource :as rc]
            [frontend.db.persist :as db-persist]
            [logseq.graph-parser :as graph-parser]
            [logseq.graph-parser.config :as gp-config]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [electron.ipc :as ipc]
            [cljs-bean.core :as bean]
            [clojure.core.async :as async]
            [frontend.mobile.util :as mobile-util]
            [medley.core :as medley]
            [logseq.common.path :as path]
            [logseq.common.config :as common-config]
            [frontend.db.listener :as db-listener]
            [frontend.db.rtc.op-mem-layer :as op-mem-layer]))

;; Project settings should be checked in two situations:
;; 1. User changes the config.edn directly in logseq.com (fn: alter-file)
;; 2. Git pulls the new change (fn: load-files)

(defn create-contents-file
  [repo-url]
  (spec/validate :repos/url repo-url)
  (p/let [repo-dir (config/get-repo-dir repo-url)
          pages-dir (state/get-pages-directory)
          [org-path md-path] (map #(str pages-dir "/contents." %) ["org" "md"])
          contents-file-exist? (some #(fs/file-exists? repo-dir %) [org-path md-path])]
    (when-not contents-file-exist?
      (let [format (state/get-preferred-format)
            file-rpath (str "pages/" "contents." (config/get-file-extension format))
            default-content (case (name format)
                              "org" (rc/inline "templates/contents.org")
                              "markdown" (rc/inline "templates/contents.md")
                              "")]
        (p/let [_ (fs/mkdir-if-not-exists (path/path-join repo-dir pages-dir))
                file-exists? (fs/create-if-not-exists repo-url repo-dir file-rpath default-content)]
          (when-not file-exists?
            (file-common-handler/reset-file! repo-url file-rpath default-content)))))))

(defn create-custom-theme
  [repo-url]
  (spec/validate :repos/url repo-url)
  (let [repo-dir (config/get-repo-dir repo-url)
        path (str config/app-name "/" config/custom-css-file)
        file-rpath path
        default-content ""]
    (p/let [_ (fs/mkdir-if-not-exists (path/path-join repo-dir config/app-name))
            file-exists? (fs/create-if-not-exists repo-url repo-dir file-rpath default-content)]
      (when-not file-exists?
        (file-common-handler/reset-file! repo-url path default-content)))))

(defn create-dummy-notes-page
  [repo-url content]
  (spec/validate :repos/url repo-url)
  (let [repo-dir (config/get-repo-dir repo-url)
        file-rpath (str (config/get-pages-directory) "/how_to_make_dummy_notes.md")]
    (p/let [_ (fs/mkdir-if-not-exists (path/path-join repo-dir (config/get-pages-directory)))
            _file-exists? (fs/create-if-not-exists repo-url repo-dir file-rpath content)]
      (file-common-handler/reset-file! repo-url file-rpath content))))

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
          file-rpath (path/path-join (config/get-journals-directory) (str file-name "."
                                                                              (config/get-file-extension format)))
          page-exists? (db/entity repo-url [:block/name (util/page-name-sanity-lc title)])
          empty-blocks? (db/page-empty? repo-url (util/page-name-sanity-lc title))]
      (when (or empty-blocks? (not page-exists?))
        (p/let [_ (nfs/check-directory-permission! repo-url)
                _ (fs/mkdir-if-not-exists (path/path-join repo-dir (config/get-journals-directory)))
                file-exists? (fs/file-exists? repo-dir file-rpath)]
          (when-not file-exists?
            (p/let [_ (file-common-handler/reset-file! repo-url file-rpath content)]
              (fs/create-if-not-exists repo-url repo-dir file-rpath content))))))))

(defn create-default-files!
  [repo-url]
  (spec/validate :repos/url repo-url)
  (let [repo-dir (config/get-repo-dir repo-url)]
    (p/do! (fs/mkdir-if-not-exists (path/path-join repo-dir config/app-name))
           (fs/mkdir-if-not-exists (path/path-join repo-dir config/app-name config/recycle-dir))
           (fs/mkdir-if-not-exists (path/path-join repo-dir (config/get-journals-directory)))
           (repo-config-handler/create-config-file-if-not-exists repo-url)
           (create-contents-file repo-url)
           (create-custom-theme repo-url)
           (state/pub-event! [:page/create-today-journal repo-url]))))

(defonce *file-tx (atom nil))

(defn- parse-and-load-file!
  "Accept: .md, .org, .edn, .css"
  [repo-url file {:keys [new-graph? verbose skip-db-transact? extracted-block-ids]
                  :or {skip-db-transact? true}}]
  (try
    (reset! *file-tx
            (file-handler/alter-file repo-url
                                     (:file/path file)
                                     (:file/content file)
                                     (merge {:new-graph? new-graph?
                                             :re-render-root? false
                                             :from-disk? true
                                             :skip-db-transact? skip-db-transact?}
                                            ;; To avoid skipping the `:or` bounds for keyword destructuring
                                            (when (some? extracted-block-ids) {:extracted-block-ids extracted-block-ids})
                                            (when (some? verbose) {:verbose verbose}))))
    (state/set-parsing-state! (fn [m]
                                (update m :finished inc)))
    @*file-tx
    (catch :default e
      (println "Parse and load file failed: " (str (:file/path file)))
      (js/console.error e)
      (state/set-parsing-state! (fn [m]
                                  (update m :failed-parsing-files conj [(:file/path file) e])))
      (state/set-parsing-state! (fn [m]
                                  (update m :finished inc)))
      nil)))

(defn- after-parse
  [repo-url re-render? re-render-opts opts graph-added-chan]
  (when (or (:new-graph? opts) (not (:refresh? opts)))
    (create-default-files! repo-url))
  (when re-render?
    (ui-handler/re-render-root! re-render-opts))
  (state/pub-event! [:graph/added repo-url opts])
  (let [parse-errors (get-in @state/state [:graph/parsing-state repo-url :failed-parsing-files])]
    (when (seq parse-errors)
      (state/pub-event! [:file/parse-and-load-error repo-url parse-errors])))
  (state/reset-parsing-state!)
  (state/set-loading-files! repo-url false)
  (async/offer! graph-added-chan true))

(defn- parse-files-and-create-default-files-inner!
  [repo-url files delete-files delete-blocks re-render? re-render-opts opts]
  (let [supported-files (graph-parser/filter-files files)
        delete-data (->> (concat delete-files delete-blocks)
                         (remove nil?))
        indexed-files (medley/indexed supported-files)
        chan (async/to-chan! indexed-files)
        graph-added-chan (async/promise-chan)
        total (count supported-files)
        large-graph? (> total 1000)
        *page-names (atom #{})
        *page-name->path (atom {})
        *extracted-block-ids (atom #{})]
    (when (seq delete-data) (db/transact! repo-url delete-data {:delete-files? true}))
    (state/set-current-repo! repo-url)
    (state/set-parsing-state! {:total (count supported-files)})
    ;; Synchronous for tests for not breaking anything
    (if util/node-test?
      (do
        (doseq [file supported-files]
          (state/set-parsing-state! (fn [m]
                                      (assoc m
                                             :current-parsing-file (:file/path file))))
          (parse-and-load-file! repo-url file (assoc
                                               (select-keys opts [:new-graph? :verbose])
                                               :skip-db-transact? false)))
        (after-parse repo-url re-render? re-render-opts opts graph-added-chan))
      (async/go-loop [tx []]
        (if-let [item (async/<! chan)]
          (let [[idx file] item
                whiteboard? (gp-config/whiteboard? (:file/path file))
                yield-for-ui? (or (not large-graph?)
                                  (zero? (rem idx 10))
                                  (<= (- total idx) 10)
                                  whiteboard?)]
            (state/set-parsing-state! (fn [m]
                                        (assoc m :current-parsing-file (:file/path file))))

            (when yield-for-ui? (async/<! (async/timeout 1)))

            (let [opts' (-> (select-keys opts [:new-graph? :verbose])
                            (assoc :extracted-block-ids *extracted-block-ids))
                  ;; whiteboards might have conflicting block IDs so that db transaction could be failed
                  opts' (if whiteboard?
                          (assoc opts' :skip-db-transact? false)
                          opts')
                  result (parse-and-load-file! repo-url file opts')
                  page-name (some (fn [x] (when (and (map? x) (:block/original-name x)
                                                     (= (:file/path file) (:file/path (:block/file x))))
                                            (:block/name x))) result)
                  page-exists? (and page-name (get @*page-names page-name))
                  tx' (cond
                        whiteboard? tx
                        page-exists? (do
                                       (state/pub-event! [:notification/show
                                                          {:content [:div
                                                                     (util/format "The file \"%s\" will be skipped because another file \"%s\" has the same page title."
                                                                                  (:file/path file)
                                                                                  (get @*page-name->path page-name))]
                                                           :status :warning
                                                           :clear? false}])
                                       tx)
                        :else (concat tx result))
                  _ (when (and page-name (not page-exists?))
                      (swap! *page-names conj page-name)
                      (swap! *page-name->path assoc page-name (:file/path file)))
                  tx' (if (or whiteboard? (zero? (rem (inc idx) 100)))
                        (do (db/transact! repo-url tx' {:from-disk? true})
                            [])
                        tx')]
              (recur tx')))
          (do
            (when (seq tx) (db/transact! repo-url tx {:from-disk? true}))
            (after-parse repo-url re-render? re-render-opts opts graph-added-chan)))))
    graph-added-chan))

(defn- parse-files-and-create-default-files!
  [repo-url files delete-files delete-blocks re-render? re-render-opts opts]
  (parse-files-and-create-default-files-inner! repo-url files delete-files delete-blocks re-render? re-render-opts opts))

(defn parse-files-and-load-to-db!
  [repo-url files {:keys [delete-files delete-blocks re-render? re-render-opts _refresh?] :as opts
                   :or {re-render? true}}]
  (parse-files-and-create-default-files! repo-url files delete-files delete-blocks re-render? re-render-opts opts))



(defn load-new-repo-to-db!
  "load graph files to db."
  [repo-url {:keys [file-objs new-graph? empty-graph?]}]
  (spec/validate :repos/url repo-url)
  (route-handler/redirect-to-home!)
  (prn ::load-new-repo repo-url :empty-graph? empty-graph? :new-graph? new-graph?)
  (state/set-parsing-state! {:graph-loading? true})
  (let [config (or (when-let [content (some-> (first (filter #(= "logseq/config.edn" (:file/path %)) file-objs))
                                              :file/content)]
                     (repo-config-handler/read-repo-config content))
                   (state/get-config repo-url))
        ;; NOTE: Use config while parsing. Make sure it's the current journal title format
        ;; config should be loaded to state first
        _ (state/set-config! repo-url config)
        ;; remove :hidden files from file-objs, :hidden
        file-objs (common-config/remove-hidden-files file-objs config :file/path)]

    ;; Load to db even it's empty, (will create default files)
    (parse-files-and-load-to-db! repo-url file-objs {:new-graph? new-graph?
                                                     :empty-graph? empty-graph?})
    (state/set-parsing-state! {:graph-loading? false})))



(defn load-repo-to-db!
  [repo-url {:keys [diffs file-objs refresh? new-graph? empty-graph?]}]
  (spec/validate :repos/url repo-url)
  (route-handler/redirect-to-home!)
  (state/set-parsing-state! {:graph-loading? true})
  (let [config (or (when-let [content (some-> (first (filter #(= (config/get-repo-config-path) (:file/path %)) file-objs))
                                              :file/content)]
                     (repo-config-handler/read-repo-config content))
                   (state/get-config repo-url))
        ;; NOTE: Use config while parsing. Make sure it's the current journal title format
        _ (state/set-config! repo-url config)
        nfs-files (common-config/remove-hidden-files file-objs config :file/node-node-path)
        diffs (common-config/remove-hidden-files diffs config :path)
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
                                   (remove nil?))
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
  (let [db-based? (config/db-based-graph? url)
        delete-db-f (fn []
                      (let [current-repo (state/get-current-repo)]
                        (db/remove-conn! url)
                        (db-persist/delete-graph! url)
                        (search/remove-db! url)
                        (state/delete-repo! repo)
                        (if (= current-repo url)
                          (when-let [graph (:url (first (state/get-repos)))]
                            (notification/show! (str "Removed graph "
                                                     (pr-str (text-util/get-graph-name-from-path url))
                                                     ". Redirecting to graph "
                                                     (pr-str (text-util/get-graph-name-from-path url)))
                                                :success)
                            (state/pub-event! [:graph/switch graph {:persist? false}]))
                          (notification/show! (str "Removed graph " (pr-str (text-util/get-graph-name-from-path url))) :success))))]
    (when (or (config/local-file-based-graph? url)
              db-based?
              (config/demo-graph? url))
      (-> (idb/clear-local-db! url)     ; clear file handles
          (p/finally delete-db-f)))))

(defn start-repo-db-if-not-exists!
  [repo & {:as opts}]
  (state/set-current-repo! repo)
  (db/start-db-conn! repo (merge
                           opts
                           {:listen-handler db-listener/listen-and-persist!
                            :db-graph? (config/db-based-graph? repo)})))

(defn- setup-demo-repo-if-not-exists-impl!
  []
  ;; loop query if js/window.pfs is ready, interval 100ms
  (if js/window.pfs
    (let [repo config/demo-repo
          repo-dir (config/get-repo-dir repo)]
      (p/do! (fs/mkdir-if-not-exists repo-dir) ;; create memory://local
             (state/set-current-repo! repo)
             (db/start-db-conn! repo {:listen-handler db-listener/listen-and-persist!})
             (when-not config/publishing?
               (let [dummy-notes (t :tutorial/dummy-notes)]
                 (create-dummy-notes-page repo dummy-notes)))
             (when-not config/publishing?
               (let [tutorial (t :tutorial/text)
                     tutorial (string/replace-first tutorial "$today" (date/today))]
                 (create-today-journal-if-not-exists repo {:content tutorial})))
             (repo-config-handler/create-config-file-if-not-exists repo)
             (create-contents-file repo)
             (create-custom-theme repo)
             (state/set-db-restoring! false)
             (ui-handler/re-render-root!)))
    (p/then (p/delay 100) ;; TODO Junyi remove the string
            setup-demo-repo-if-not-exists-impl!)))

(defn setup-demo-repo-if-not-exists!
  "Setup demo repo, i.e. `demo-repo`"
  []
  ;; ensure `(state/set-db-restoring! false)` at exit
  (-> (setup-demo-repo-if-not-exists-impl!)
      (p/timeout 3000)
      (p/catch (fn []
                 (prn "setup-demo-repo failed! timeout 3000ms")))
      (p/finally (fn []
                   (state/set-db-restoring! false)))))

(defn restore-and-setup-repo!
  "Restore the db of a graph from the persisted data, and setup. Create a new
  conn, or replace the conn in state with a new one."
  [repo]
  (p/do!
   (state/set-db-restoring! true)
   (db-restore/restore-graph! repo)
   (repo-config-handler/restore-repo-config! repo)
   (op-mem-layer/<init-load-from-indexeddb! repo)
   (when (config/global-config-enabled?)
     (global-config-handler/restore-global-config!))
    ;; Don't have to unlisten the old listener, as it will be destroyed with the conn
   (db-listener/listen-and-persist! repo)
   (ui-handler/add-style-if-exists!)
   (state/set-db-restoring! false)))

(defn rebuild-index!
  [url]
  (when-not (state/unlinked-dir? (config/get-repo-dir url))
    (when url
      (search/reset-indice! url)
      (db/remove-conn! url)
      (db/clear-query-state!)
      (-> (p/do! (db-persist/delete-graph! url))
          (p/catch (fn [error]
                     (prn "Delete repo failed, error: " error)))))))

(defn re-index!
  [nfs-rebuild-index! ok-handler]
  (when-let [repo (state/get-current-repo)]
    (state/reset-parsing-state!)
    (let [dir (config/get-repo-dir repo)]
      (when-not (state/unlinked-dir? dir)
       (route-handler/redirect-to-home!)
       (let [local? (config/local-file-based-graph? repo)]
         (if local?
           (nfs-rebuild-index! repo ok-handler)
           (rebuild-index! repo))
         (js/setTimeout
          (route-handler/redirect-to-home!)
          500))))))

(defn get-repos
  []
  (p/let [nfs-dbs (db-persist/get-all-graphs)
          nfs-dbs (map (fn [db]
                         {:url db
                          :root (config/get-local-dir db)
                          :nfs? true}) nfs-dbs)
          nfs-dbs (and (seq nfs-dbs)
                       (cond (util/electron?)
                             (ipc/ipc :inflateGraphsInfo nfs-dbs)

                             (mobile-util/native-platform?)
                             (util-fs/inflate-graphs-info nfs-dbs)

                             :else
                             nfs-dbs))
          nfs-dbs (seq (bean/->clj nfs-dbs))]
    (cond
      (seq nfs-dbs)
      nfs-dbs

      :else
      [{:url config/demo-repo
        :example? true}])))

(defn combine-local-&-remote-graphs
  [demo-repos remote-repos]
  (when-let [repos' (seq (concat (map #(if-let [sync-meta (seq (:sync-meta %))]
                                         (assoc % :GraphUUID (second sync-meta)) %)
                                   demo-repos)
                                 (some->> remote-repos
                                          (map #(assoc % :remote? true)))))]
    (let [repos' (group-by :GraphUUID repos')
          repos'' (mapcat (fn [[k vs]]
                            (if-not (nil? k)
                              [(merge (first vs) (second vs))] vs))
                          repos')]
      (sort-by (fn [repo]
                 (let [graph-name (or (:GraphName repo)
                                      (last (string/split (:root repo) #"/")))]
                   [(:remote? repo) (string/lower-case graph-name)])) repos''))))

(defn get-detail-graph-info
  [url]
  (when-let [graphs (seq (and url (combine-local-&-remote-graphs
                                    (state/get-repos)
                                    (state/get-remote-graphs))))]
    (first (filter #(when-let [url' (:url %)]
                      (= url url')) graphs))))

(defn refresh-repos!
  []
  (p/let [repos (get-repos)
          repos' (combine-local-&-remote-graphs
                  repos
                  (state/get-remote-graphs))]
    (state/set-repos! repos')
    repos'))

(defn graph-ready!
  ;; FIXME: Call electron that the graph is loaded, an ugly implementation for redirect to page when graph is restored
  [graph]
  (when (util/electron?)
    (ipc/ipc "graphReady" graph)))

(defn- create-db [full-graph-name]
  (->
   (p/let [_ (persist-db/<new full-graph-name)
           _ (op-mem-layer/<init-load-from-indexeddb! full-graph-name)
           _ (start-repo-db-if-not-exists! full-graph-name)
           _ (state/add-repo! {:url full-graph-name})
           _ (route-handler/redirect-to-home!)
           initial-data (sqlite-create-graph/build-db-initial-data config/config-default-content)
           _ (db/transact! full-graph-name initial-data)
           _ (repo-config-handler/set-repo-config-state! full-graph-name config/config-default-content)
          ;; TODO: handle global graph
           _ (state/pub-event! [:init/commands])
           _ (state/pub-event! [:page/create (date/today) {:redirect? false}])]
     (js/setTimeout ui-handler/re-render-root! 100)
     (prn "New db created: " full-graph-name))
   (p/catch (fn [error]
              (notification/show! "Create graph failed." :error)
              (js/console.error error)))))

(defn new-db!
  "Handler for creating a new database graph"
  [graph]
  (let [full-graph-name (str config/db-version-prefix graph)
        graph-already-exists? (some #(= (:url %) full-graph-name) (state/get-repos))]
    (if graph-already-exists?
      (state/pub-event! [:notification/show
                         {:content (str "The graph '" graph "' already exists. Please try again with another name.")
                          :status :error}])
      (create-db full-graph-name))))

;; TODO: clean up and merge logic with new-db!
(defn- create-empty-db
  "No today page creation, no redirect to home"
  [full-graph-name]
  (->
   (p/let [_ (persist-db/<new full-graph-name)
           _ (op-mem-layer/<init-load-from-indexeddb! full-graph-name)
           _ (start-repo-db-if-not-exists! full-graph-name)
           _ (state/add-repo! {:url full-graph-name})
           initial-data (sqlite-create-graph/build-db-initial-data config/config-default-content)
           _ (db/transact! full-graph-name initial-data)
           _ (repo-config-handler/set-repo-config-state! full-graph-name config/config-default-content)
          ;; TODO: handle global graph
           _ (state/pub-event! [:init/commands])]
     (prn "New db created: " full-graph-name))
   (p/catch (fn [error]
              (notification/show! "Create graph failed." :error)
              (js/console.error error)))))

(defn new-empty-db!
  "New database graph with empty content, for importing"
  [graph]
   (let [full-graph-name (str config/db-version-prefix graph)
         graph-already-exists? (some #(= (:url %) full-graph-name) (state/get-repos))]
     (if graph-already-exists?
       (state/pub-event! [:notification/show
                          {:content (str "The graph '" graph "' already exists. Please try again with another name.")
                           :status :error}])
       (create-empty-db full-graph-name))))
