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
            [frontend.handler.extract :as extract-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.route :as route-handler]
            [cljs-bean.core :as bean]
            [frontend.config :as config]
            [frontend.format :as format]
            [clojure.string :as string]
            [frontend.history :as history]
            [frontend.handler.project :as project-handler]
            [lambdaisland.glogi :as log]
            [clojure.core.async :as async]
            [goog.object :as gobj]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [frontend.utf8 :as utf8]
            ["ignore" :as Ignore]))

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
   (let [config-content (if config-content config-content
                            (db/get-config repo-url))]
     (when config-content
       (let [old-project (:project (state/get-config))
             new-config (db/reset-config! repo-url config-content)]
         (when (and (not (config/local-db? repo-url))
                    project-changed-check?)
           (let [new-project (:project new-config)
                 project-name (:name old-project)]
             (when-not (= new-project old-project)
               (project-handler/sync-project-settings! project-name new-project)))))))))

(defn load-files
  [repo-url]
  (state/set-cloning! false)
  (state/set-loading-files! true)
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
                  (let [file-contents (cond->
                                       (zipmap files contents)

                                        (seq images)
                                        (merge (zipmap images (repeat (count images) ""))))
                        file-contents (for [[file content] file-contents]
                                        {:file/path file
                                         :file/content content})]
                    (ok-handler file-contents))))
        (p/catch (fn [error]
                   (log/error :load-files-error error))))))

(defn reset-file!
  [repo-url file content]
  (let [new? (nil? (db/entity [:file/path file]))]
    (db/set-file-content! repo-url file content)
    (let [format (format/get-format file)
          utf8-content (utf8/encode content)
          file-content [{:file/path file}]
          tx (if (contains? config/mldoc-support-formats format)
               (let [delete-blocks (db/delete-file-blocks! repo-url file)
                     [pages block-ids blocks] (extract-handler/extract-blocks-pages repo-url file content utf8-content)]
                 (concat file-content delete-blocks pages block-ids blocks))
               file-content)
          tx (concat tx [(let [t (tc/to-long (t/now))]
                           (cond->
                               {:file/path file
                                :file/last-modified-at t}
                             new?
                             (assoc :file/created-at t)))])]
      (db/transact! repo-url tx))))

;; TODO: better name to separate from reset-file!
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
        (reset-file! repo path content))
      (db/set-file-content! repo path content))
    (util/p-handle
     (fs/write-file repo (util/get-repo-dir repo) path content {:old-content original-content
                                                                :last-modified-at (db/get-file-last-modified-at repo path)})
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
                                   :path-params {:path path}}))))))

(defn alter-files
  [repo files {:keys [add-history? update-status? git-add-cb reset? update-db?]
               :or {add-history? true
                    update-status? true
                    reset? false
                    update-db? true}
               :as opts}]
  ;; update db
  (when update-db?
    (doseq [[path content] files]
      (if reset?
        (reset-file! repo path content)
        (db/set-file-content! repo path content))))

  (when-let [chan (state/get-file-write-chan)]
    (async/put! chan [repo files opts])))

(defn alter-files-handler!
  [repo files {:keys [add-history? update-status? git-add-cb reset?]
               :or {add-history? true
                    update-status? true
                    reset? false}}]
  (p/let [file->content (let [paths (map first files)]
                          (zipmap paths
                                  (map (fn [path] (db/get-file-no-sub repo path)) paths)))]
    (let [write-file-f (fn [[path content]]
                         (let [original-content (get file->content path)]
                           (-> (p/let [_ (fs/check-directory-permission! repo)]
                                 (fs/write-file repo (util/get-repo-dir repo) path content
                                                {:old-content original-content
                                                 :last-modified-at (db/get-file-last-modified-at repo path)}))
                               (p/catch (fn [error]
                                          (log/error :write-file/failed {:path path
                                                                         :content content
                                                                         :error error}))))))
          git-add-f (fn []
                      (let [add-helper
                            (fn []
                              (map
                               (fn [[path content]]
                                 (git-handler/git-add repo path update-status?))
                               files))]
                        (-> (p/all (add-helper))
                            (p/then (fn [_]
                                      (when git-add-cb
                                        (git-add-cb))))
                            (p/catch (fn [error]
                                       (println "Git add failed:")
                                       (js/console.error error)))))
                      (ui-handler/re-render-file!)
                      (when add-history?
                        (let [files-tx (mapv (fn [[path content]]
                                               (let [original-content (get file->content path)]
                                                 [path original-content content])) files)]
                          (history/add-history! repo files-tx))))]
      (-> (p/all (map write-file-f files))
          (p/then (fn []
                    (git-add-f)
                    ;; TODO: save logseq/metadata
))
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

(defn ignore-files
  [pattern paths]
  (-> (Ignore)
      (.add pattern)
      (.filter (bean/->js paths))
      (bean/->clj)))

;; TODO: batch writes, how to deal with file history?
(defn run-writes-chan!
  []
  (let [chan (state/get-file-write-chan)]
    (async/go-loop []
      (let [args (async/<! chan)]
        (when-let [repo (state/get-current-repo)]
          (when-not (config/local-db? repo)
            (state/set-file-writing! true))
          (p/let [_ (apply alter-files-handler! args)]
            (state/set-file-writing! false)))
        nil)
      (recur))
    chan))
