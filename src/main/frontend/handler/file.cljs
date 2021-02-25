(ns frontend.handler.file
  (:refer-clojure :exclude [load-file])
  (:require [frontend.util :as util :refer-macros [profile]]
            [frontend.fs :as fs]
            [frontend.fs.nfs :as nfs]
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
            [cljs.core.async.interop :refer-macros [<p!]]
            [goog.object :as gobj]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [frontend.utf8 :as utf8]
            ["/frontend/utils" :as utils]))

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
                            (common-handler/get-config repo-url))]
     (when config-content
       (let [old-project (:project (state/get-config))
             new-config (common-handler/reset-config! repo-url config-content)]
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
          config-content (load-file repo-url
                                    (config/get-config-path repo-url))
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
  (let [electron-local-repo? (and (util/electron?)
                                  (config/local-db? repo-url))
        ;; FIXME: store relative path in db
        file (cond
               (and electron-local-repo?
                    util/win32?
                    (utils/win32 file))
               file

               (and electron-local-repo? (or
                                          util/win32?
                                          (not= "/" (first file))))
               (str (config/get-repo-dir repo-url) "/" file)

               :else
               file)
        new? (nil? (db/entity [:file/path file]))]
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
                             {:file/path file}
                             new?
                             (assoc :file/created-at t)))])]
      (db/transact! repo-url tx))))

;; TODO: Remove this function in favor of `alter-files`
(defn alter-file
  [repo path content {:keys [reset? re-render-root? add-history? update-status? from-disk?]
                      :or {reset? true
                           re-render-root? false
                           add-history? true
                           update-status? false
                           from-disk? false}}]
  (let [edit-block (state/get-edit-block)
        original-content (db/get-file-no-sub repo path)
        write-file! (if from-disk?
                      #(p/resolved nil)
                      #(fs/write-file! repo (config/get-repo-dir repo) path content (when original-content {:old-content original-content})))]
    (if reset?
      (do
        (when-let [page-id (db/get-file-page-id path)]
          (db/transact! repo
            [[:db/retract page-id :page/alias]
             [:db/retract page-id :page/tags]]))
        (reset-file! repo path content))
      (db/set-file-content! repo path content))
    (util/p-handle (write-file!)
                   (fn [_]
                     (when-not from-disk?
                       (git-handler/git-add repo path update-status?))
                     (when (= path (config/get-config-path repo))
                       (restore-config! repo true))
                     (when (= path (config/get-custom-css-path repo))
                       (ui-handler/add-style-if-exists!))
                     (when re-render-root? (ui-handler/re-render-root!))
                     (when (and add-history? original-content)
                       (history/add-history! repo [[path original-content content]])))
                   (fn [error]
                     (println "Write file failed, path: " path ", content: " content)
                     (log/error :write/failed error)))))

(defn set-file-content!
  [repo path new-content]
  (alter-file repo path new-content {:reset? false
                                     :re-render-root? false}))

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
  [repo files {:keys [add-history? update-status? git-add-cb reset? update-db? chan chan-callback resolved-handler]
               :or {add-history? true
                    update-status? true
                    reset? false
                    update-db? true}
               :as opts}]
  ;; old file content
  (let [file->content (let [paths (map first files)]
                        (zipmap paths
                                (map (fn [path] (db/get-file-no-sub repo path)) paths)))]
    ;; update db
    (when update-db?
      (doseq [[path content] files]
        (if reset?
          (reset-file! repo path content)
          (db/set-file-content! repo path content))))

    (when-let [chan (state/get-file-write-chan)]
      (let [chan-callback (:chan-callback opts)]
        (async/put! chan [repo files opts file->content])
        (when chan-callback
          (chan-callback))))))

(defn alter-files-handler!
  [repo files {:keys [add-history? update-status? git-add-cb reset? chan]
               :or {add-history? true
                    update-status? true
                    reset? false}} file->content]
  (let [write-file-f (fn [[path content]]
                       (let [original-content (get file->content path)]
                         (-> (p/let [_ (nfs/check-directory-permission! repo)]
                               (fs/write-file! repo (config/get-repo-dir repo) path content
                                               {:old-content original-content}))
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
                  (when chan
                    (async/put! chan true))))
        (p/catch (fn [error]
                   (println "Alter files failed:")
                   (js/console.error error)
                   (async/put! chan false))))))

(defn remove-file!
  [repo file]
  (when-not (string/blank? file)
    (->
     (p/let [_ (or (config/local-db? repo) (git/remove-file repo file))
             result (fs/unlink! (config/get-repo-path repo file) nil)]
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
                (js/console.error "error: " err))))))

(defn re-index!
  [file]
  (when-let [repo (state/get-current-repo)]
    (let [path (:file/path file)
          content (db/get-file path)]
      (alter-file repo path content {:re-render-root? true}))))

;; TODO: batch writes, how to deal with file history?
(defn run-writes-chan!
  []
  (let [chan (state/get-file-write-chan)]
    (async/go-loop []
      (let [args (async/<! chan)]
        ;; return a channel
        (<p! (apply alter-files-handler! args)))
      (recur))
    chan))

(defn watch-for-local-dirs!
  []
  (when (util/electron?)
    (let [repos (->> (state/get-repos)
                     (filter (fn [repo]
                               (config/local-db? (:url repo)))))
          directories (map (fn [repo] (config/get-repo-dir (:url repo))) repos)]
      (doseq [dir directories]
        (fs/watch-dir! dir)))))

(defn create-metadata-file
  [repo-url encrypted?]
  (let [repo-dir (config/get-repo-dir repo-url)
        path (str config/app-name "/" config/metadata-file)
        file-path (str "/" path)
        default-content (if encrypted? "{:db/encrypted? true}" "{}")]
    (p/let [_ (fs/mkdir-if-not-exists (str repo-dir "/" config/app-name))
            file-exists? (fs/create-if-not-exists repo-url repo-dir file-path default-content)]
      (when-not file-exists?
        (reset-file! repo-url path default-content)
        (git-handler/git-add repo-url path)))))
