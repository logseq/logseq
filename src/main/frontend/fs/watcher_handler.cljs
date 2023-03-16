(ns frontend.fs.watcher-handler
  "Main ns that handles file watching events from electron's main process"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.fs :as fs]
            [logseq.common.path :as path]
            [frontend.handler.editor :as editor]
            [frontend.handler.file :as file-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.fs :as fs-util]
            [lambdaisland.glogi :as log]
            [logseq.graph-parser.config :as gp-config]
            [logseq.graph-parser.util.block-ref :as block-ref]
            [promesa.core :as p]
            [frontend.handler.global-config :as global-config-handler]))

;; all IPC paths must be normalized! (via gp-util/path-normalize)

(defn- set-missing-block-ids!
  [content]
  (when (string? content)
    (doseq [block-id (block-ref/get-all-block-ref-ids content)]
      (when-let [block (try
                         (model/get-block-by-uuid block-id)
                         (catch :default _e
                           nil))]
        (let [id-property (:id (:block/properties block))]
          (when-not (= (str id-property) (str block-id))
            (editor/set-block-property! block-id "id" block-id)))))))

(defn- handle-add-and-change!
  [repo path content db-content mtime backup?]
  (p/let [;; save the previous content in a versioned bak file to avoid data overwritten.
          _ (when backup?
              (-> (when-let [repo-dir (config/get-local-dir repo)]
                    (file-handler/backup-file! repo-dir path db-content content))
                  (p/catch #(js/console.error "❌ Bak Error: " path %))))

          _ (file-handler/alter-file repo path content {:re-render-root? true
                                                        :from-disk? true})]
    (set-missing-block-ids! content)
    (db/set-file-last-modified-at! repo path mtime)))

(defn handle-changed!
  [type {:keys [dir path content stat global-dir] :as payload}]
  (when dir
    (let [;; Global directory events don't know their originating repo so we rely
          ;; on the client to correctly identify it
          repo (cond
                 global-dir (state/get-current-repo)
                 ;; FIXME(andelf): hack for demo graph, demo graph does not bind to local directory
                 (string/starts-with? dir "memory://") "local"
                 :else (config/get-local-repo dir))
          repo-dir (config/get-local-dir repo)
          {:keys [mtime]} stat
          db-content (db/get-file repo path)
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
            (handle-add-and-change! repo path content db-content mtime backup?))

          (and (= "change" type)
               (= dir repo-dir)
               (not= (string/trim content) (string/trim db-content))
               (not (gp-config/local-asset? path)))
          (when-not (and
                     (string/includes? path (str "/" (config/get-journals-directory) "/"))
                     (or
                      (= (string/trim content)
                         (string/trim (or (state/get-default-journal-template) "")))
                      (= (string/trim content) "-")
                      (= (string/trim content) "*")))
            (handle-add-and-change! repo path content db-content mtime (not global-dir))) ;; no backup for global dir

          (and (= "unlink" type)
               exists-in-db?)
          (p/let [dir-exists? (fs/file-exists? dir "")]
            (when dir-exists?
              (when-let [page-name (db/get-file-page path)]
                (println "Delete page: " page-name ", file path: " path ".")
                (page-handler/delete! page-name #() :delete-file? false))))

          ;; global config handling
          (and (= "change" type)
               (= dir (global-config-handler/global-config-dir)))
          (when (= path "config.edn")
            (global-config-handler/set-global-config-state! content))

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
                                             :payload payload})))

      ;; return nil, otherwise the entire db will be transferred by ipc
      nil)))

(defn load-graph-files!
  [graph]
  (when graph
    (let [dir (config/get-repo-dir graph)
          db-files (->> (db/get-files graph)
                        (map first)
                        (filter #(string/starts-with? % (config/get-repo-dir graph))))]
      (p/let [files (fs/readdir dir :path-only? true)
              files (map #(path/relative-path dir %) files)
              files (remove #(fs-util/ignored-path? dir %) files)
              deleted-files (set/difference (set db-files) (set files))]
        (when (seq deleted-files)
          (let [delete-tx-data (->> (db/delete-files deleted-files)
                                    (concat (db/delete-blocks graph deleted-files nil))
                                    (remove nil?))]
            (db/transact! graph delete-tx-data {:delete-files? true})))
        (doseq [file-rpath files]
          (prn ::init-watcher file-rpath)
          (when-let [_ext (util/get-file-ext file-rpath)]
            (->
             (p/let [content (fs/read-file dir file-rpath)
                     stat (fs/stat dir file-rpath)
                     type (if (db/file-exists? graph file-rpath)
                            "change"
                            "add")]
               (handle-changed! type
                                {:dir dir
                                 :path file-rpath
                                 :content content
                                 :stat stat}))
             (p/catch (fn [error]
                        (js/console.dir error))))))))))
