(ns frontend.fs.watcher-handler
  "Main ns that handles file watching events from electron's main process"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.fs :as fs]
            [logseq.common.path :as path]
            [frontend.handler.file :as file-handler]
            [frontend.handler.file-based.property :as file-property-handler]
            [frontend.handler.global-config :as global-config-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.state :as state]
            [frontend.util.fs :as fs-util]
            [lambdaisland.glogi :as log]
            [logseq.common.config :as common-config]
            [logseq.common.util.block-ref :as block-ref]
            [promesa.core :as p]
            [frontend.db.async :as db-async]))

;; all IPC paths must be normalized! (via common-util/path-normalize)

(defn- set-missing-block-ids!
  "For every referred block in the content, fix their block ids in files if missing."
  [content]
  (when (string? content)
    (let [missing-blocks (->> (block-ref/get-all-block-ref-ids content)
                              (distinct)
                              (keep model/get-block-by-uuid)
                              (filter (fn [block]
                                        (not= (str (:id (:block/properties block)))
                                              (str (:block/uuid block))))))]
      (when (seq missing-blocks)
        (file-property-handler/batch-set-block-property-aux!
         (mapv
          (fn [b] [(:block/uuid b) :id (str (:block/uuid b))])
          missing-blocks))))))

(defn- handle-add-and-change!
  [repo path content db-content ctime mtime backup?]
  (let [config (state/get-config repo)
        path-hidden-patterns (:hidden config)
        db-last-modified-at (db/get-file-last-modified-at repo path)]
    (when-not (or (and (seq path-hidden-patterns)
                    (common-config/hidden? path path-hidden-patterns))
                  ;; File not changed
                  (= db-last-modified-at mtime))
      (p/let [;; save the previous content in a versioned bak file to avoid data overwritten.
              _ (when backup?
                  (-> (when-let [repo-dir (config/get-local-dir repo)]
                        (file-handler/backup-file! repo-dir path db-content content))
                      (p/catch #(js/console.error "❌ Bak Error: " path %))))

              _ (file-handler/alter-file repo path content {:re-render-root? true
                                                            :from-disk? true
                                                            :fs/event :fs/local-file-change
                                                            :ctime ctime
                                                            :mtime mtime})]
        (set-missing-block-ids! content)))))

(defn handle-changed!
  [type {:keys [dir path content stat global-dir] :as payload}]
  (let [repo (state/get-current-repo)]
    (when dir
      (let [;; Global directory events don't know their originating repo so we rely
          ;; on the client to correctly identify it
            repo (cond
                   global-dir repo
                   :else (config/get-local-repo dir))
            repo-dir (config/get-local-dir repo)
            {:keys [mtime ctime]} stat
            ext (keyword (path/file-ext path))]
        (when (contains? #{:org :md :markdown :css :js :edn :excalidraw :tldr} ext)
          (p/let [db-content (db-async/<get-file repo path)
                  exists-in-db? (not (nil? db-content))
                  db-content (or db-content "")]
            (when (or content (contains? #{"unlink" "unlinkDir" "addDir"} type))
              (cond
                (and (= "unlinkDir" type) dir)
                (state/pub-event! [:graph/dir-gone dir])

                (and (= "addDir" type) dir)
                (state/pub-event! [:graph/dir-back repo dir])

                (contains? (:file/unlinked-dirs @state/state) dir)
                nil

                (and (= "add" type)
                     (not= (string/trim content) (string/trim db-content)))
                (let [backup? (not (string/blank? db-content))]
                  (handle-add-and-change! repo path content db-content ctime mtime backup?))

                (and (= "change" type)
                     (= dir repo-dir)
                     (not (common-config/local-asset? path)))
                (handle-add-and-change! repo path content db-content ctime mtime (not global-dir)) ;; no backup for global dir

                (and (= "unlink" type)
                     exists-in-db?)
                (p/let [dir-exists? (fs/file-exists? dir "")]
                  (when dir-exists?
                    (when-let [page-name (db/get-file-page path)]
                      (println "Delete page: " page-name ", file path: " path ".")
                      (page-handler/<delete! page-name #()))))

          ;; global config handling
                (and (= "change" type)
                     (= dir (global-config-handler/global-config-dir)))
                (when (= path "config.edn")
                  (file-handler/alter-global-file
                   (global-config-handler/global-config-path) content {:from-disk? true}))

                (and (= "change" type)
                     (not exists-in-db?))
                (js/console.error "Can't get file in the db: " path)

                (and (contains? #{"add" "change" "unlink"} type)
                     (string/ends-with? path "logseq/custom.css"))
                (do
                  (println "reloading custom.css")
                  (ui-handler/add-style-if-exists!))

                (contains? #{"add" "change" "unlink"} type)
                nil

                :else
                (log/error :fs/watcher-no-handler {:type type
                                                   :payload payload})))))

      ;; return nil, otherwise the entire db will be transferred by ipc
        nil))))

(defn load-graph-files!
  "This fn replaces the former initial fs watcher"
  [graph]
  (when graph
    (let [repo-dir (config/get-repo-dir graph)]
      ;; read all files in the repo dir, notify if readdir error
      (p/let [db-files' (db-async/<get-files graph)
              db-files (map first db-files')
              [files deleted-files]
              (-> (fs/readdir repo-dir :path-only? true)
                  (p/chain (fn [files]
                             (->> files
                                  (map #(path/relative-path repo-dir %))
                                  (remove #(fs-util/ignored-path? repo-dir %))
                                  (sort-by (fn [f] [(not (string/starts-with? f "logseq/"))
                                                    (not (string/starts-with? f "journals/"))
                                                    (not (string/starts-with? f "pages/"))
                                                    (string/lower-case f)]))))
                           (fn [files]
                             (let [deleted-files (set/difference (set db-files) (set files))]
                               [files
                                deleted-files])))
                  (p/catch (fn [error]
                             (when-not (config/demo-graph? graph)
                               (js/console.error "reading" graph)
                               (state/pub-event! [:notification/show
                                                  {:content (str "The graph " graph " can not be read:" error)
                                                   :status :error
                                                   :clear? false}]))
                             [nil nil])))
              ;; notifies user when large initial change set is detected
              ;; NOTE: this is an estimation, not accurate
              notification-uid (when (or (> (abs (- (count db-files) (count files)))
                                            100)
                                         (> (count deleted-files)
                                            100))
                                 (prn ::init-watcher-large-change-set)
                                 (notification/show! "Loading changes from disk..."
                                                     :info
                                                     false))]
        (prn ::initial-watcher repo-dir {:deleted (count deleted-files)
                                         :total (count files)})
        (p/do!
         (when (seq deleted-files)
           (p/all (map (fn [path]
                         (when-let [page-name (db/get-file-page path)]
                           (println "Delete page: " page-name ", file path: " path ".")
                           (page-handler/<delete! page-name #())))
                       deleted-files)))
         (-> (p/delay 500) ;; workaround for notification ui not showing
             (p/then #(p/all (map (fn [file-rpath]
                                    (p/let [stat (fs/stat repo-dir file-rpath)
                                            content (fs/read-file repo-dir file-rpath)
                                            type (if (db/file-exists? graph file-rpath)
                                                   "change"
                                                   "add")]
                                      (handle-changed! type
                                                       {:dir repo-dir
                                                        :path file-rpath
                                                        :content content
                                                        :stat stat})))
                                  files)))
             (p/then (fn []
                       (when notification-uid
                         (prn ::init-notify)
                         (notification/clear! notification-uid)
                         (state/pub-event! [:notification/show {:content (str "The graph " graph " is loaded.")
                                                                :status :success
                                                                :clear? true}]))))
             (p/catch (fn [error]
                        (js/console.dir error)))))))))
