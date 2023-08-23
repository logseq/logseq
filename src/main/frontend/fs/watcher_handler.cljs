(ns frontend.fs.watcher-handler
  "Main ns that handles file watching events from electron's main process"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.fs :as fs]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.editor.property :as editor-property]
            [frontend.handler.file :as file-handler]
            [frontend.handler.global-config :as global-config-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.fs :as fs-util]
            [lambdaisland.glogi :as log]
            [logseq.common.path :as path]
            [logseq.graph-parser.config :as gp-config]
            [logseq.graph-parser.util.block-ref :as block-ref]
            [promesa.core :as p]))

;; all IPC paths must be normalized! (via gp-util/path-normalize)

(defn- set-missing-block-ids!
  "For every referred block in the content, fix their block ids in files if missing."
  [content]
  (when (string? content)
    (doseq [block-id (block-ref/get-all-block-ref-ids content)]
      (when-let [block (try
                         (model/get-block-by-uuid block-id)
                         (catch :default _e
                           nil))]
        (let [id-property (:id (:block/properties block))]
          (when-not (= (str id-property) (str block-id))
            (editor-property/set-block-property! block-id "id" block-id)))))))

(defn- handle-add-and-change!
  [repo path content db-content mtime backup?]
  (p/let [;; save the previous content in a versioned bak file to avoid data overwritten.
          _ (when backup?
              (-> (when-let [repo-dir (config/get-local-dir repo)]
                    (file-handler/backup-file! repo-dir path db-content content))
                  (p/catch #(js/console.error "❌ Bak Error: " path %))))

          _ (file-handler/alter-file repo path content {:re-render-root? true
                                                        :from-disk? true
                                                        :fs/event :fs/local-file-change})]
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
                                             :payload payload})))

      ;; return nil, otherwise the entire db will be transferred by ipc
      nil)))

(defn preload-graph-homepage-files!
  "Preload the homepage file for the current graph. Return loaded file paths.

   Prerequisites:
   - current graph is set
   - config is loaded"
  []
  (when-let [repo (state/get-current-repo)]
    (when (and (not (state/loading-files? repo))
               (config/local-db? repo))
      (let [repo-dir (config/get-repo-dir repo)
            page-name (if (state/enable-journals? repo)
                        (date/today)
                        (or (:page (state/get-default-home)) "Contents"))
            page-name (util/page-name-sanity-lc page-name)
            file-rpath (or (:file/path (db/get-page-file page-name))
                           (let [format (state/get-preferred-format repo)
                                 ext (config/get-file-extension format)
                                 file-name (if (state/enable-journals? repo)
                                             (date/journal-title->default (date/today))
                                             (or (:page (state/get-default-home)) "contents"))
                                 parent-dir (if (state/enable-journals? repo)
                                              (config/get-journals-directory)
                                              (config/get-pages-directory))]
                             (str parent-dir "/" file-name "." ext)))]
        (prn ::preload-homepage file-rpath)
        (p/let [file-exists? (fs/file-exists? repo-dir file-rpath)
                _ (when file-exists?
                    ;; BUG: avoid active-editing block content overwrites incoming fs changes
                    (editor-handler/escape-editing false))
                file-content (when file-exists?
                               (fs/read-file repo-dir file-rpath))
                file-mtime (when file-exists?
                             (:mtime (fs/stat repo-dir file-rpath)))
                db-empty? (db/page-empty? repo page-name)
                db-content (if-not db-empty?
                             (db/get-file repo file-rpath)
                             "")]
          (p/do!
           (cond
             (and file-exists?
                  db-empty?)
             (handle-add-and-change! repo file-rpath file-content db-content file-mtime false)

             (and file-exists?
                  (not db-empty?)
                  (not= file-content db-content))
             (handle-add-and-change! repo file-rpath file-content db-content file-mtime true))

           (ui-handler/re-render-root!)

           [file-rpath]))))))

(defn load-graph-files!
  "This fn replaces the former initial fs watcher"
  [graph exclude-files]
  (when graph
    (let [repo-dir (config/get-repo-dir graph)
          db-files (->> (db/get-files graph)
                        (map first))
          exclude-files (set (or exclude-files []))]
      ;; read all files in the repo dir, notify if readdir error
      (p/let [[files deleted-files]
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
                               [(->> files
                                     (remove #(contains? exclude-files %)))
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
        (when (seq deleted-files)
          (let [delete-tx-data (->> (db/delete-files deleted-files)
                                    (concat (db/delete-blocks graph deleted-files nil))
                                    (remove nil?))]
            (db/transact! graph delete-tx-data {:delete-files? true})))
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
                       (js/console.dir error))))))))

