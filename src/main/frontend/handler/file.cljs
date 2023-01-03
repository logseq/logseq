(ns frontend.handler.file
  "Provides util handler fns for files"
  (:refer-clojure :exclude [load-file])
  (:require [frontend.config :as config]
            [frontend.db :as db]
            [frontend.fs :as fs]
            [frontend.fs.nfs :as nfs]
            [frontend.fs.capacitor-fs :as capacitor-fs]
            [frontend.handler.common.file :as file-common-handler]
            [frontend.handler.repo-config :as repo-config-handler]
            [frontend.handler.global-config :as global-config-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.graph-parser.util :as gp-util]
            [electron.ipc :as ipc]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]
            [frontend.mobile.util :as mobile-util]
            [logseq.graph-parser.config :as gp-config]
            ["path" :as path]))

;; TODO: extract all git ops using a channel

(defn load-file
  [repo-url path]
  (->
   (p/let [content (fs/read-file (config/get-repo-dir repo-url) path)]
     content)
   (p/catch
       (fn [e]
         (println "Load file failed: " path)
         (js/console.error e)))))

(defn load-multiple-files
  [repo-url paths]
  (doall
   (mapv #(load-file repo-url %) paths)))

(defn- keep-formats
  [files formats]
  (filter
   (fn [file]
     (let [format (gp-util/get-format file)]
       (contains? formats format)))
   files))

(defn- only-text-formats
  [files]
  (keep-formats files (gp-config/text-formats)))

(defn- only-image-formats
  [files]
  (keep-formats files (gp-config/img-formats)))

(defn load-files-contents!
  [repo-url files ok-handler]
  (let [images (only-image-formats files)
        files (only-text-formats files)]
    (-> (p/all (load-multiple-files repo-url files))
        (p/then (fn [contents]
                  (let [file-contents (cond->
                                        (zipmap files contents)

                                        (seq images)
                                        (merge (zipmap images (repeat (count images) ""))))
                        file-contents (for [[file content] file-contents]
                                        {:file/path (gp-util/path-normalize file)
                                         :file/content content})]
                    (ok-handler file-contents))))
        (p/catch (fn [error]
                   (log/error :nfs/load-files-error repo-url)
                   (log/error :exception error))))))

(defn backup-file!
  "Backup db content to bak directory"
  [repo-url path db-content content]
  (cond
    (util/electron?)
    (ipc/ipc "backupDbFile" repo-url path db-content content)

    (mobile-util/native-platform?)
    (capacitor-fs/backup-file-handle-changed! repo-url path db-content)

    :else
    nil))

(defn- validate-file
  "Returns true if valid and if false validator displays error message. Files
  that are not validated just return true"
  [path content]
  (if (and
       (config/global-config-enabled?)
       (= (path/dirname path) (global-config-handler/global-config-dir)))
    (global-config-handler/validate-config-edn path content)
    true))

(defn- validate-and-write-file
  "Validates and if valid writes file. Returns boolean indicating if file content was valid"
  [repo path content write-file-options]
  (let [original-content (db/get-file repo path)
        path-dir (if (and
                      (config/global-config-enabled?)
                      ;; Hack until we better understand failure in error handler
                      (global-config-handler/global-config-dir-exists?)
                      (= (path/dirname path) (global-config-handler/global-config-dir)))
                   (global-config-handler/global-config-dir)
                   (config/get-repo-dir repo))
        write-file-options' (merge write-file-options
                                   (when original-content {:old-content original-content}))]
    (p/do!
     (if (validate-file path content)
       (do
         (fs/write-file! repo path-dir path content write-file-options')
         true)
       false))))

;; TODO: Remove this function in favor of `alter-files`
(defn alter-file
  [repo path content {:keys [reset? re-render-root? from-disk? skip-compare? new-graph? verbose
                             skip-db-transact?]
                      :or {reset? true
                           re-render-root? false
                           from-disk? false
                           skip-compare? false}}]
  (let [path (gp-util/path-normalize path)
        write-file! (if from-disk?
                      #(p/promise (validate-file path content))
                      #(validate-and-write-file repo path content {:skip-compare? skip-compare?}))
        opts {:new-graph? new-graph?
              :from-disk? from-disk?
              :skip-db-transact? skip-db-transact?}
        result (if reset?
                 (do
                   (when-not skip-db-transact?
                     (when-let [page-id (db/get-file-page-id path)]
                       (db/transact! repo
                                     [[:db/retract page-id :block/alias]
                                      [:db/retract page-id :block/tags]]
                                     opts)))
                   (file-common-handler/reset-file! repo path content (merge opts
                                                                             (when (some? verbose) {:verbose verbose}))))
                 (db/set-file-content! repo path content opts))]
    (util/p-handle (write-file!)
                   (fn [valid-result?]
                     (when re-render-root? (ui-handler/re-render-root!))

                     (cond
                       (= path (config/get-custom-css-path repo))
                       (ui-handler/add-style-if-exists!)

                       (= path (config/get-repo-config-path repo))
                       (p/let [_ (repo-config-handler/restore-repo-config! repo content)]
                              (state/pub-event! [:shortcut/refresh]))

                       (and (config/global-config-enabled?)
                            (= path (global-config-handler/global-config-path))
                            valid-result?)
                       (p/let [_ (global-config-handler/restore-global-config!)]
                              (state/pub-event! [:shortcut/refresh]))))
                   (fn [error]
                     (when (and (config/global-config-enabled?)
                                ;; Global-config not started correctly but don't
                                ;; know root cause yet
                                ;; https://sentry.io/organizations/logseq/issues/3587411237/events/4b5da8b8e58b4f929bd9e43562213d32/events/?cursor=0%3A0%3A1&project=5311485&statsPeriod=14d
                                (global-config-handler/global-config-dir-exists?)
                                (= path (global-config-handler/global-config-path)))
                       (state/pub-event! [:notification/show
                                          {:content (str "Failed to write to file " path)
                                           :status :error}]))

                     (println "Write file failed, path: " path ", content: " content)
                     (log/error :write/failed error)
                     (state/pub-event! [:capture-error
                                        {:error error
                                         :payload {:type :write-file/failed-for-alter-file}}])))
    result))

(defn set-file-content!
  [repo path new-content]
  (alter-file repo path new-content {:reset? false
                                     :re-render-root? false}))

(defn alter-files-handler!
  [repo files {:keys [finish-handler]} file->content]
  (let [write-file-f (fn [[path content]]
                       (when path
                         (let [path (gp-util/path-normalize path)
                               original-content (get file->content path)]
                          (-> (p/let [_ (or
                                         (util/electron?)
                                         (nfs/check-directory-permission! repo))]
                                (fs/write-file! repo (config/get-repo-dir repo) path content
                                                {:old-content original-content}))
                              (p/catch (fn [error]
                                         (state/pub-event! [:notification/show
                                                            {:content (str "Failed to save the file " path ". Error: "
                                                                           (str error))
                                                             :status :error
                                                             :clear? false}])
                                         (state/pub-event! [:capture-error
                                                            {:error error
                                                             :payload {:type :write-file/failed}}])
                                         (log/error :write-file/failed {:path path
                                                                        :content content
                                                                        :error error})))))))
        finish-handler (fn []
                         (when finish-handler
                           (finish-handler)))]
    (-> (p/all (map write-file-f files))
        (p/then (fn []
                  (finish-handler)))
        (p/catch (fn [error]
                   (println "Alter files failed:")
                   (js/console.error error))))))

(defn alter-files
  [repo files {:keys [reset? update-db?]
               :or {reset? false
                    update-db? true}
               :as opts}]
  ;; old file content
  (let [file->content (let [paths (map first files)]
                        (zipmap paths
                                (map (fn [path] (db/get-file repo path)) paths)))]
    ;; update db
    (when update-db?
      (doseq [[path content] files]
        (if reset?
          (file-common-handler/reset-file! repo path content)
          (db/set-file-content! repo path content))))
    (alter-files-handler! repo files opts file->content)))

(defn watch-for-current-graph-dir!
  []
  (when-let [repo (state/get-current-repo)]
    (when-let [dir (config/get-repo-dir repo)]
      ;; An unwatch shouldn't be needed on startup. However not having this
      ;; after an app refresh can cause stale page data to load
      (fs/unwatch-dir! dir)
      (fs/watch-dir! dir))))
