(ns frontend.fs.watcher-handler
  "Main ns that handles file watching events from electron's main process"
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.handler.editor :as editor]
            [frontend.handler.file :as file-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.ui :as ui-handler]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.util.block-ref :as block-ref]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]
            [frontend.state :as state]
            [frontend.encrypt :as encrypt]
            [frontend.fs :as fs]))

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
  (p/let [
          ;; save the previous content in a versioned bak file to avoid data overwritten.
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
    (let [path (gp-util/path-normalize path)
          ;; Global directory events don't know their originating repo so we rely
          ;; on the client to correctly identify it
          repo (if global-dir (state/get-current-repo) (config/get-local-repo dir))
          pages-metadata-path (config/get-pages-metadata-path)
          {:keys [mtime]} stat
          db-content (or (db/get-file repo path) "")]
      (when (and (or content (contains? #{"unlink" "unlinkDir" "addDir"} type))
                 (not (encrypt/content-encrypted? content))
                 (not (:encryption/graph-parsing? @state/state)))
        (cond
          (and (= "unlinkDir" type) dir)
          (state/pub-event! [:graph/dir-gone dir])

          (and (= "addDir" type) dir)
          (state/pub-event! [:graph/dir-back repo dir])

          (contains? (:file/unlinked-dirs @state/state) dir)
          nil

          (and (= "add" type)
               (not= (string/trim content) (string/trim db-content))
               (not= path pages-metadata-path))
          (let [backup? (not (string/blank? db-content))]
            (handle-add-and-change! repo path content db-content mtime backup?))

          (and (= "change" type)
               (not (db/file-exists? repo path)))
          (js/console.error "Can't get file in the db: " path)

          (and (= "change" type)
               (not= (string/trim content) (string/trim db-content))
               (not= path pages-metadata-path))
          (when-not (and
                     (string/includes? path (str "/" (config/get-journals-directory) "/"))
                     (or
                      (= (string/trim content)
                         (string/trim (or (state/get-default-journal-template) "")))
                      (= (string/trim content) "-")
                      (= (string/trim content) "*")))
            (handle-add-and-change! repo path content db-content mtime true))

          (and (= "unlink" type)
               (db/file-exists? repo path))
          (p/let [dir-exists? (fs/file-exists? dir "")]
                 (when dir-exists?
                   (when-let [page-name (db/get-file-page path)]
                     (println "Delete page: " page-name ", file path: " path ".")
                     (page-handler/delete! page-name #() :delete-file? false))))

          (and (contains? #{"add" "change" "unlink"} type)
               (string/ends-with? path "logseq/custom.css"))
          (do
            (println "reloading custom.css")
            (ui-handler/add-style-if-exists!))

          ;; When metadata is added to watcher, update timestamps in db accordingly
          ;; This event is not triggered on re-index
          ;; Persistent metadata is gold standard when db is offline, so it's forced
          (and (contains? #{"add"} type)
               (= path pages-metadata-path))
          (p/do! (repo-handler/update-pages-metadata! repo content true))

          ;; Change is triggered by external changes, so update to the db
          ;; Don't forced update when db is online, but resolving conflicts
          (and (contains? #{"change"} type)
               (= path pages-metadata-path))
          (p/do! (repo-handler/update-pages-metadata! repo content false))

          (contains? #{"add" "change" "unlink"} type)
          nil

          :else
          (log/error :fs/watcher-no-handler {:type type
                                             :payload payload})))

      ;; return nil, otherwise the entire db will be transfered by ipc
      nil)))
