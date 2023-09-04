(ns frontend.handler.web.nfs
  "The File System Access API, https://web.dev/file-system-access/."
  (:require ["/frontend/utils" :as utils]
            [clojure.set :as set]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.fs :as fs]
            [frontend.fs.nfs :as nfs]
            [frontend.handler.common :as common-handler]
            [frontend.handler.global-config :as global-config-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.route :as route-handler]
            [frontend.idb :as idb]
            [frontend.mobile.util :as mobile-util]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.fs :as util-fs]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [logseq.graph-parser.util :as gp-util]
            [promesa.core :as p]
            [logseq.common.path :as path]))

(defn remove-ignore-files
  [files dir-name nfs?]
  (let [files (remove (fn [f]
                        (let [path (:file/path f)]
                          (or (string/starts-with? path ".git/")
                              (string/includes? path ".git/")
                              (and (util-fs/ignored-path? (if nfs? "" dir-name) path)
                                   (not= (:file/name f) ".gitignore")))))
                      files)]
    (if-let [ignore-file (some #(when (= (:file/name %) ".gitignore")
                                  %) files)]
      (if-let [file (:file/file ignore-file)]
        (p/let [content (.text file)]
          (when content
            (let [paths (set (common-handler/ignore-files content (map :file/path files)))]
              (when (seq paths)
                (filter (fn [f] (contains? paths (:file/path f))) files)))))
        (p/resolved files))
      (p/resolved files))))

(defn- ->db-files
  ;; TODO(andelf): rm nfs? parameter
  [result nfs?]
  (->>
   (cond
     ;; TODO(andelf): use the same structure for both fields
     (mobile-util/native-platform?)
     (map (fn [{:keys [path content size mtime]}]
            {:file/path             (gp-util/path-normalize path)
             :file/last-modified-at mtime
             :file/size             size
             :file/content content})
          result)

     (util/electron?)
     (map (fn [{:keys [path stat content]}]
            (let [{:keys [mtime size]} stat]
              {:file/path             (gp-util/path-normalize path)
               :file/last-modified-at mtime
               :file/size             size
               :file/content content}))
          result)

     nfs?
     (map (fn [{:keys [path content size mtime type] :as file-obj}]
            (merge file-obj
                   {:file/path             (gp-util/path-normalize path)
                    :file/last-modified-at mtime
                    :file/size             size
                    :file/type             type
                    :file/content content}))
          result)

     :else ;; NFS backend
     result)
   (sort-by :file/path)))

(defn- filter-markup-and-built-in-files
  [files]
  (filter (fn [file]
            (contains? (set/union config/markup-formats #{:css :edn})
                       (keyword (util/get-file-ext (:file/path file)))))
          files))

(defn- precheck-graph-dir
  "Check graph dir, notify user if:

   - Grame dir name is `logseq`, the same as app, which might cause confusion
   - Graph dir contains a nested graph, which should be avoided
   - Over 10000 files found in graph dir, which might cause performance issues"
  [dir files]
  (when (= (string/lower-case (path/basename dir))
           "logseq")
    (state/pub-event!
     [:notification/show {:content [:div "The folder name "
                                    [:code "logseq"]
                                    " is not suitable for a graph name. Please unlink this graph and choose a different name."]
                          :status :warning
                          :clear?  false}]))
  (when (some #(string/ends-with? (:path %) "/logseq/config.edn") files)
    (state/pub-event!
     [:notification/show {:content "It seems that you are trying to open a Logseq graph folder with nested graph. Please unlink this graph and choose a correct folder."
                          :status :warning
                          :clear? false}]))
  (when (>= (count files) 10000)
    (state/pub-event!
     [:notification/show {:content "It seems that you are trying to open a Logseq graph folder that contains an excessive number of files, This might lead to performance issues."
                          :status :warning
                          :clear? true}])))

;; TODO: extract code for `ls-dir-files` and `reload-dir!`
(defn ls-dir-files-with-handler!
  "Read files from directory and setup repo (for the first time setup a repo)"
  ([ok-handler] (ls-dir-files-with-handler! ok-handler nil))
  ([ok-handler {:keys [on-open-dir dir-result-fn picked-root-fn dir]}]
   (let [electron? (util/electron?)
         mobile-native? (mobile-util/native-platform?)
         nfs? (and (not electron?)
                   (not mobile-native?))
         *repo (atom nil)]
     ;; TODO: add ext filter to avoid loading .git or other ignored file handlers
     (->
      (p/let [result (if (fn? dir-result-fn)
                       (dir-result-fn)
                       (fs/open-dir dir))
              _ (when (fn? on-open-dir)
                  (on-open-dir result))
              root-dir (:path result)
              ;; calling when root picked
              _ (when (fn? picked-root-fn) (picked-root-fn root-dir))
              repo (str config/local-db-prefix root-dir)]
        (state/set-loading-files! repo true)
        (when-not (or (state/home?) (state/setups-picker?))
          (route-handler/redirect-to-home! false))
        (reset! *repo repo)
        (when-not (string/blank? root-dir)
          (p/let [files (:files result)
                  _ (precheck-graph-dir root-dir (:files result))
                  files (-> (->db-files files nfs?)
                            ;; filter again, in case fs backend does not handle this
                            (remove-ignore-files root-dir nfs?))
                  markup-files (filter-markup-and-built-in-files files)]
            (-> files
                (p/then (fn [result]
                          ;; handle graphs txid
                          (p/let [files (mapv #(dissoc % :file/file) result)
                                  graphs-txid-meta (util-fs/read-graphs-txid-info root-dir)
                                  graph-uuid (and (vector? graphs-txid-meta) (second graphs-txid-meta))]
                            (if-let [exists-graph (state/get-sync-graph-by-id graph-uuid)]
                              (state/pub-event!
                               [:notification/show
                                {:content (str "This graph already exists in \"" (:root exists-graph) "\"")
                                 :status :warning}])
                              (p/do! (repo-handler/start-repo-db-if-not-exists! repo)
                                     (when (config/global-config-enabled?)
                                       (global-config-handler/restore-global-config!))
                                     (repo-handler/load-new-repo-to-db! repo
                                                                        {:new-graph?   true
                                                                         :empty-graph? (nil? (seq markup-files))
                                                                         :file-objs    files})
                                     (state/add-repo! {:url repo :nfs? true})
                                     (state/set-loading-files! repo false)
                                     (when ok-handler (ok-handler {:url repo}))
                                     (db/persist-if-idle! repo))))))
                (p/catch (fn [error]
                           (log/error :nfs/load-files-error repo)
                           (log/error :exception error)))))))
      (p/catch (fn [error]
                 (log/error :exception error)
                 (when mobile-native?
                   (state/pub-event!
                    [:notification/show {:content (str error) :status :error}]))
                 (when (contains? #{"AbortError" "Error"} (gobj/get error "name"))
                   (when @*repo (state/set-loading-files! @*repo false))
                   (throw error))))
      (p/finally
        (fn []
          (state/set-loading-files! @*repo false)))))))

(defn ls-dir-files-with-path!
  ([path] (ls-dir-files-with-path! path nil))
  ([path opts]
   (when-let [dir-result-fn
              (and path (fn []
                          (p/let [files-result (fs/open-dir path)]
                            files-result)))]
     (ls-dir-files-with-handler!
      (:ok-handler opts)
      (merge {:dir-result-fn dir-result-fn} opts)))))

(defn- compute-diffs
  [old-files new-files]
  (let [ks [:file/path :file/last-modified-at :file/content]
        ->set (fn [files ks]
                (when (seq files)
                  (->> files
                       (map #(select-keys % ks))
                       set)))
        old-files (->set old-files ks)
        new-files (->set new-files ks)
        file-path-set-f (fn [col] (set (map :file/path col)))
        get-file-f (fn [files path] (some #(when (= (:file/path %) path) %) files))
        old-file-paths (file-path-set-f old-files)
        new-file-paths (file-path-set-f new-files)
        added (set/difference new-file-paths old-file-paths)
        deleted (set/difference old-file-paths new-file-paths)
        modified (->> (set/intersection new-file-paths old-file-paths)
                      (filter (fn [path]
                                (not= (:file/content (get-file-f old-files path))
                                      (:file/content (get-file-f new-files path)))))
                      (set))]
    (prn ::compute-diffs :added (count added) :modified (count modified) :deleted (count deleted))
    {:added    added
     :modified modified
     :deleted  deleted}))

(defn- handle-diffs!
  "Compute directory diffs and (re)load repo"
  [repo nfs? old-files new-files re-index? ok-handler]
  (let [get-last-modified-at (fn [path] (some (fn [file]
                                                (when (= path (:file/path file))
                                                  (:file/last-modified-at file)))
                                              new-files))
        get-file-f (fn [path files] (some #(when (= (:file/path %) path) %) files))
        {:keys [added modified deleted]} (compute-diffs old-files new-files)
        ;; Use the same labels as isomorphic-git
        rename-f (fn [typ col] (mapv (fn [file] {:type typ :path file :last-modified-at (get-last-modified-at file)}) col))
        added-or-modified (set (concat added modified))]
    (-> (p/all (map (fn [path]
                      (when-let [file (get-file-f path new-files)]
                        (p/let [content (if nfs?
                                          (.text (:file/file file))
                                          (:file/content file))]
                          (assoc file :file/content content)))) added-or-modified))
        (p/then (fn [result]
                  (let [files (map #(dissoc % :file/file :file/handle) result)
                        [modified-files modified] (if re-index?
                                                    [files (set modified)]
                                                    (let [modified-files (filter (fn [file] (contains? added-or-modified (:file/path file))) files)]
                                                      [modified-files (set modified)]))
                        diffs (concat
                               (rename-f "remove" deleted)
                               (rename-f "add" added)
                               (rename-f "modify" modified))]
                    (when (or (and (seq diffs) (seq modified-files))
                              (seq diffs))
                      (-> (repo-handler/load-repo-to-db! repo
                                                         {:diffs     diffs
                                                          :nfs-files modified-files
                                                          :refresh? (not re-index?)
                                                          :new-graph? re-index?})
                          (p/then (fn [_state]
                                    (ok-handler)))
                          (p/catch (fn [error]
                                     (js/console.error "load-repo-to-db" error)))))

                    (when (and (util/electron?) (not re-index?))
                      (db/transact! repo new-files))))))))

(defn- reload-dir!
  "Handle refresh and re-index"
  [repo {:keys [re-index? ok-handler]
         :or {re-index? false}}]
  (when (and repo (config/local-db? repo))
    (let [old-files (db/get-files-full repo)
          repo-dir (config/get-local-dir repo)
          handle-path (str "handle/" repo-dir)
          electron? (util/electron?)
          mobile-native? (mobile-util/native-platform?)
          nfs? (and (not electron?)
                    (not mobile-native?))]
      (when re-index?
        (state/set-graph-syncing? true))
      (->
       (p/let [handle (when-not electron? (idb/get-item handle-path))]
         (when (or handle electron? mobile-native?)
           (p/let [_ (when nfs? (nfs/verify-permission repo true))
                   local-files-result (fs/get-files repo-dir)
                   _ (when (config/global-config-enabled?)
                       ;; reload global config into state
                       (global-config-handler/restore-global-config!))
                   new-files (-> (->db-files (:files local-files-result) nfs?)
                                 (remove-ignore-files repo-dir nfs?))]
             (handle-diffs! repo nfs? old-files new-files re-index? ok-handler))))
       (p/catch (fn [error]
                  (log/error :nfs/load-files-error repo)
                  (log/error :exception error)))
       (p/finally (fn [_]
                    (state/set-graph-syncing? false)))))))

(defn rebuild-index!
  [repo ok-handler]
  (let [ok-handler (fn []
                     (ok-handler)
                     (state/set-nfs-refreshing! false))]
    (when repo
      (state/set-nfs-refreshing! true)
      (search/reset-indice! repo)
      (db/remove-conn! repo)
      (db/clear-query-state!)
      (db/start-db-conn! repo)
      (reload-dir! repo {:re-index? true
                         :ok-handler ok-handler}))))

;; TODO: move to frontend.handler.repo
(defn refresh!
  [repo ok-handler]
  (let [ok-handler (fn []
                     (ok-handler)
                     (state/set-nfs-refreshing! false))]
    (when (and repo
               (not (state/unlinked-dir? (config/get-repo-dir repo))))
      (state/set-nfs-refreshing! true)
      (reload-dir! repo {:ok-handler ok-handler}))))

(defn supported?
  []
  (or (utils/nfsSupported) (util/electron?)))
