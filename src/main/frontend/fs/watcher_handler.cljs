(ns frontend.fs.watcher-handler
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.encrypt :as encrypt]
            [frontend.handler.editor :as editor]
            [frontend.handler.extract :as extract]
            [frontend.handler.file :as file-handler]
            [lambdaisland.glogi :as log]
            [electron.ipc :as ipc]
            [promesa.core :as p]
            [frontend.state :as state]))

(defn- set-missing-block-ids!
  [content]
  (when (string? content)
    (doseq [block-id (extract/extract-all-block-refs content)]
      (when-let [block (try
                         (model/get-block-by-uuid block-id)
                         (catch js/Error _e
                           nil))]
        (let [id-property (:id (:block/properties block))]
          (when-not (= (str id-property) (str block-id))
            (editor/set-block-property! block-id "id" block-id)))))))

(defn handle-changed!
  [type {:keys [dir path content stat] :as payload}]
  (when dir
    (let [repo (config/get-local-repo dir)
          {:keys [mtime]} stat
          db-content (or (db/get-file repo path) "")]
      (when (and content
                 (not (encrypt/content-encrypted? content))
                 (not (:encryption/graph-parsing? @state/state)))
        (cond
          (and (= "add" type)
               (not= (string/trim content) (string/trim db-content))
               (not (string/includes? path "logseq/pages-metadata.edn")))
          (p/let [_ (file-handler/alter-file repo path content {:re-render-root? true
                                                                :from-disk? true})]
            (set-missing-block-ids! content)
            (db/set-file-last-modified-at! repo path mtime))

          (and (= "change" type)
               (not (db/file-exists? repo path)))
          (js/console.warn "Can't get file in the db: " path)

          (and (= "change" type)
               (not= (string/trim content) (string/trim db-content))
               (not (string/includes? path "logseq/pages-metadata.edn")))
          (when-not (and
                     (string/includes? path (str "/" (config/get-journals-directory) "/"))
                     (or
                      (= (string/trim content)
                         (string/trim (or (state/get-default-journal-template) "")))
                      (= (string/trim content) "-")
                      (= (string/trim content) "*")))
            (p/let [
                    ;; save the previous content in a bak file to avoid data overwritten.
                    _ (ipc/ipc "backupDbFile" (config/get-local-dir repo) path db-content)
                    _ (file-handler/alter-file repo path content {:re-render-root? true
                                                                  :from-disk? true})]
              (set-missing-block-ids! content)
              (db/set-file-last-modified-at! repo path mtime)))

          (contains? #{"add" "change" "unlink"} type)
          nil

          :else
          (log/error :fs/watcher-no-handler {:type type
                                             :payload payload})))

      ;; return nil, otherwise the entire db will be transfered by ipc
      nil)))
