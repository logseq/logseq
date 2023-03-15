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
            [logseq.graph-parser.config :as gp-config]
            [logseq.graph-parser.util :as gp-util]
            [promesa.core :as p]))

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

(defn- set-batch!
  [handles]
  (let [handles (map (fn [[path handle]]
                       {:key   path
                        :value handle}) handles)]
    (idb/set-batch! handles)))

(defn- set-files-aux!
  [handles]
  (when (seq handles)
    (let [[h t] (split-at 50 handles)]
      (p/let [_ (p/promise (fn [_]
                             (js/setTimeout (fn []
                                              (p/resolved nil)) 10)))
              _ (set-batch! h)]
        (when (seq t)
          (set-files-aux! t))))))

(defn- set-files!
  [handles]
  (let [handles (map (fn [[path handle]]
                       (let [handle-path (str config/local-handle-prefix path)]
                         [handle-path handle]))
                     handles)]
    (doseq [[path handle] handles]
      (nfs/add-nfs-file-handle! path handle))
    (set-files-aux! handles)))

;; TODO: extract code for `ls-dir-files` and `reload-dir!`
(defn ^:large-vars/cleanup-todo ls-dir-files-with-handler!
  "Read files from directory and setup repo (for the first time setup a repo)"
  ([ok-handler] (ls-dir-files-with-handler! ok-handler nil))
  ([ok-handler {:keys [on-open-dir dir-result-fn picked-root-fn dir]}]
   (let [electron? (util/electron?)
         mobile-native? (mobile-util/native-platform?)
         nfs? (and (not electron?)
                   (not mobile-native?))
         *repo (atom nil)
         dir (or dir nil)]
     ;; TODO: add ext filter to avoid loading .git or other ignored file handlers
     (->
      (p/let [_ (prn :xxx-dir-result-fn dir-result-fn)
              result (if (fn? dir-result-fn)
                       (dir-result-fn {:nfs? nfs?})
                       (fs/open-dir dir))
              _ (when (fn? on-open-dir)
                  (prn ::calling-on-open-dir-fn)
                  (on-open-dir result))
              root-handle (:path result)
              _ (when (fn? picked-root-fn) (picked-root-fn root-handle))
              dir-name root-handle
              repo (str config/local-db-prefix root-handle)]

        (state/set-loading-files! repo true)
        (when-not (or (state/home?) (state/setups-picker?))
          (route-handler/redirect-to-home! false))
        (reset! *repo repo)
        (prn ::begin-hanlding-files dir-name)
        (when-not (string/blank? dir-name)
          (p/let [; handle/logseq_local_dir-name
                  _ (when-let [root-handle-path (and nfs?
                                                     (str config/local-handle-prefix dir-name))]
                      (prn ::saving-handle-to-idb)
                      ; (idb/set-item! root-handle-path (str "handle/" root-handle)))
                      (nfs/save-root-handle-to-idb! repo root-handle))
                 ;      (idb/set-item! root-handle-path (str "handle/" root-handle))
                 ;     ; (nfs/add-nfs-file-handle! root-handle-path root-handle)
                 ;     )
                  files (:files result)
                  files (-> (->db-files files nfs?)
                            ;; NOTE: filter, in case backend does not handle this
                            (remove-ignore-files dir-name nfs?))
                  _ (prn ::remain-files files)
                  markup-files (filter-markup-and-built-in-files files)]
            (-> files
                (p/then (fn [result]
                          ;; handle graphs txid
                          (p/let [files (mapv #(dissoc % :file/file) result)
                                  graphs-txid-meta (util-fs/read-graphs-txid-info dir-name)
                                  graph-uuid (and (vector? graphs-txid-meta) (second graphs-txid-meta))]
                            (if-let [exists-graph (state/get-sync-graph-by-id graph-uuid)]
                              (state/pub-event!
                               [:notification/show
                                {:content (str "This graph already exists in \"" (:root exists-graph) "\"")
                                 :status :warning}])
                              (do
                                (prn ::prepare-load-new-repo files)
                                (repo-handler/start-repo-db-if-not-exists! repo)
                                (prn ::dd (nil? (seq markup-files)))
                                (p/do!
                                 (repo-handler/load-new-repo-to-db! repo
                                                                    {:new-graph?   true
                                                                     :empty-graph? (nil? (seq markup-files))
                                                                     :file-objs    files})
                                 (prn ::debug-2.5)
                                 (state/add-repo! {:url repo :nfs? true})
                                 (prn ::debug-33333)
                                 (state/set-loading-files! repo false)
                                 (when ok-handler (ok-handler {:url repo}))
                                 (db/persist-if-idle! repo)))))))
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
          (prn ::set-loading-files false)
          (state/set-loading-files! @*repo false)))))))

(defn ls-dir-files-with-path!
  ([path] (ls-dir-files-with-path! path nil))
  ([path opts]
   (when-let [dir-result-fn
              (and path (fn [{:keys [nfs?]}]
                          (p/let [files-result (fs/get-files path)]
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
  "Compute directory diffs and handle them."
  [repo nfs? old-files new-files re-index? ok-handler]
  (prn ::handle-diff repo old-files new-files)
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
                      (comment "re-index a local graph is handled here")
                      (-> (repo-handler/load-repo-to-db! repo
                                                         {:diffs     diffs
                                                          :nfs-files modified-files
                                                          :refresh? (not re-index?)
                                                          :new-graph? re-index?})
                          (p/then (fn [state]
                                    (prn :load-repo-to-db! state)
                                    (ok-handler)))
                          (p/catch (fn [error]
                                     (js/console.error "load-repo-to-db" error)))))

                    (when (and (util/electron?) (not re-index?))
                      (db/transact! repo new-files))))))))

(defn- reload-dir!
  "Handle refresh and re-index"
  [repo {:keys [re-index? ok-handler]
         :or {re-index? false}}]
  (prn ::reload-dir)
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
         (prn ::handle handle)
         (when (or handle electron? mobile-native?)
           (p/let [_ (when nfs? (nfs/verify-permission repo true))
                   local-files-result (fs/get-files repo-dir)
                   _ (prn ::reading-local-fils local-files-result)
                   new-files (-> (->db-files (:files local-files-result) nfs?)
                                       (remove-ignore-files repo-dir nfs?))
                   _ (prn ::new-local-files new-files)
                  ;; new-global-files (if (and (config/global-config-enabled?)
                   ;;                          ;; Hack until we better understand failure in frontend.handler.file/alter-file
                    ;;                         (global-config-handler/global-config-dir-exists?))
                     ;;                 (p/let [global-files-result (fs/get-files
                      ;;                                             (global-config-handler/global-config-dir)
                       ;;                                            (constantly nil))
                        ;;                      global-files (-> (->db-files (global-config-handler/global-config-dir) global-files-result)
                         ;;                                      (remove-ignore-files (global-config-handler/global-config-dir) nfs?))]
                          ;;              global-files)
                           ;;           (p/resolved [])) 
                   _ (comment when nfs?
                              (let [file-paths (set (map :file/path new-files))]
                                (swap! path-handles (fn [handles]
                                                      (->> handles
                                                           (filter (fn [[path _handle]]
                                                                     (contains? file-paths
                                                                                (string/replace-first path (str dir-name "/") ""))))
                                                           (into {})))))
                              (set-files! @path-handles))]
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
