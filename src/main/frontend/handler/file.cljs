(ns frontend.handler.file
  (:refer-clojure :exclude [load-file])
  (:require [frontend.util :as util :refer-macros [profile]]
            [frontend.fs :as fs]
            [promesa.core :as p]
            [frontend.state :as state]
            [frontend.db :as db]
            [frontend.git :as git]
            [frontend.handler.common :as common-handler]
            [frontend.handler.git :as git-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.route :as route-handler]
            [cljs-bean.core :as bean]
            [frontend.config :as config]
            [frontend.format :as format]
            [clojure.string :as string]
            [frontend.history :as history]
            [frontend.handler.project :as project-handler]))

(defn load-file
  [repo-url path]
  (->
   (p/let [content (fs/read-file (util/get-repo-dir repo-url) path)]
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
     (let [format (format/get-format file)]
       (contains? formats format)))
   files))

(defn- only-supported-formats
  [files]
  (keep-formats files (config/supported-formats)))

(defn- only-text-formats
  [files]
  (keep-formats files (config/text-formats)))

(defn- only-image-formats
  [files]
  (keep-formats files (config/img-formats)))

(defn- hidden?
  [path patterns]
  (let [path (if (and (string? path)
                      (= \/ (first path)))
               (subs path 1)
               path)]
    (some (fn [pattern]
           (let [pattern (if (and (string? pattern)
                                  (not= \/ (first pattern)))
                           (str "/" pattern)
                           pattern)]
             (string/starts-with? (str "/" path) pattern))) patterns)))

(defn restore-config!
  ([repo-url project-changed-check?]
   (restore-config! repo-url nil project-changed-check?))
  ([repo-url config-content project-changed-check?]
   (let [old-project (:project (state/get-config))
         new-config (db/reset-config! repo-url config-content)]
     (when project-changed-check?
       (let [new-project (:project new-config)
             project-name (:name old-project)]
         (when-not (= new-project old-project)
           (project-handler/sync-project-settings! project-name new-project)))))))

(defn load-files
  [repo-url]
  (state/set-cloning? false)
  (state/set-state! :repo/loading-files? true)
  (p/let [files (git/list-files repo-url)
          files (bean/->clj files)
          config-content (load-file repo-url (str config/app-name "/" config/config-file))
          files (if config-content
                  (let [config (restore-config! repo-url config-content true)]
                    (if-let [patterns (seq (:hidden config))]
                      (remove (fn [path] (hidden? path patterns)) files)
                      files))
                  files)]
    (only-supported-formats files)))

(defn load-files-contents!
  [repo-url files ok-handler]
  (let [images (only-image-formats files)
        files (only-text-formats files)]
    (-> (p/all (load-multiple-files repo-url files))
        (p/then (fn [contents]
                  (ok-handler
                   (cond->
                    (zipmap files contents)

                     (seq images)
                     (merge (zipmap images (repeat (count images) "")))))))
        (p/catch (fn [error]
                   (println "load files failed: ")
                   (js/console.dir error))))))

(defn alter-file
  [repo path content {:keys [reset? re-render-root? add-history? update-status?]
                      :or {reset? true
                           re-render-root? false
                           add-history? true
                           update-status? false}}]
  (let [original-content (db/get-file-no-sub repo path)]
    (if reset?
      (do
        (when-let [page-id (db/get-file-page-id path)]
          (db/transact! repo
                        [[:db/retract page-id :page/alias]
                         [:db/retract page-id :page/tags]]))
        (db/reset-file! repo path content))
      (db/set-file-content! repo path content))
    (util/p-handle
     (fs/write-file (util/get-repo-dir repo) path content)
     (fn [_]
       (git-handler/git-add repo path update-status?)
       (when (= path (str config/app-name "/" config/config-file))
         (restore-config! repo true))
       (when (= path (str config/app-name "/" config/custom-css-file))
         (ui-handler/add-style-if-exists!))
       (when re-render-root? (ui-handler/re-render-root!))
       (when add-history?
         (history/add-history! repo [[path original-content content]])))
     (fn [error]
       (println "Write file failed, path: " path ", content: " content)
       (js/console.error error)))))

(defn create!
  ([path]
   (create! path ""))
  ([path content]
   (when-let [repo (state/get-current-repo)]
     (when (and path content)
       (p/let [_ (alter-file repo path content {:reset? false
                                                :re-render-root? false
                                                :update-status? true})]
         (route-handler/redirect! {:to :file
                                   :path-params {:path path}})))))  )

(defn alter-files
  ([repo files]
   (alter-files repo files {}))
  ([repo files {:keys [add-history? update-status? git-add-cb reset?]
                :or {add-history? true
                     update-status? true
                     reset? false}}]
   (let [files-tx (mapv (fn [[path content]]
                          (let [original-content (db/get-file-no-sub repo path)]
                            [path original-content content])) files)
         write-file-f (fn [[path content]]
                        (if reset?
                          (db/reset-file! repo path content)
                          (db/set-file-content! repo path content))
                        (util/p-handle
                         (fs/write-file (util/get-repo-dir repo) path content)
                         (fn [_])
                         (fn [error]
                           (println "Write file failed, path: " path ", content: " content)
                           (js/console.error error))))
         git-add-f (fn [_result]
                     (let [add-helper
                           (fn []
                             (doall
                              (map
                               (fn [[path content]]
                                 (git-handler/git-add repo path update-status?))
                               files)))]
                       (-> (p/all (add-helper))
                           (p/then (fn [_]
                                     (when git-add-cb
                                       (git-add-cb))))
                           (p/catch (fn [error]
                                      (println "Git add failed:")
                                      (js/console.error error)))))
                     (ui-handler/re-render-file!)
                     (when add-history?
                       (history/add-history! repo files-tx)))]
     (-> (p/all (doall (map write-file-f files)))
         (p/then git-add-f)
         (p/catch (fn [error]
                    (println "Alter files failed:")
                    (js/console.error error)))))))

(defn remove-file!
  [repo file]
  (when-not (string/blank? file)
    (->
     (p/let [_ (git/remove-file repo file)
             result (fs/unlink (str (util/get-repo-dir repo)
                                    "/"
                                    file)
                               nil)]
       (when-let [file (db/entity repo [:file/path file])]
         (common-handler/check-changed-files-status)
         (let [file-id (:db/id file)
               page-id (db/get-file-page-id (:file/path file))
               tx-data (map
                        (fn [db-id]
                          [:db.fn/retractEntity db-id])
                        (remove nil? [file-id page-id]))]
           (when (seq tx-data)
             (db/transact! repo tx-data)))))
     (p/catch (fn [err]
                (prn "error: " err))))))

(defn re-index!
  [file]
  (when-let [repo (state/get-current-repo)]
    (let [path (:file/path file)
          content (db/get-file path)]
      (alter-file repo path content {:re-render-root? true}))))
