(ns frontend.handler.web.nfs
  "The File System Access API, https://web.dev/file-system-access/."
  (:require ["/frontend/utils" :as utils]
            [cljs-bean.core :as bean]
            [clojure.core.async :as async]
            [clojure.set :as set]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.encrypt :as encrypt]
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
  [mobile-native? electron? dir-name result]
  (->>
   (cond
     mobile-native?
     (map (fn [{:keys [uri content size mtime]}]
            {:file/path             (gp-util/path-normalize uri)
             :file/last-modified-at mtime
             :file/size             size
             :file/content content})
          result)

     electron?
     (map (fn [{:keys [path stat content]}]
            (let [{:keys [mtime size]} stat]
              {:file/path             (gp-util/path-normalize path)
               :file/last-modified-at mtime
               :file/size             size
               :file/content content}))
          result)

     :else
     (let [result (flatten (bean/->clj result))]
       (map (fn [file]
              (let [handle (gobj/get file "handle")
                    get-attr #(gobj/get file %)
                    path (-> (get-attr "webkitRelativePath")
                             (string/replace-first (str dir-name "/") ""))]
                {:file/name             (get-attr "name")
                 :file/path             (gp-util/path-normalize path)
                 :file/last-modified-at (get-attr "lastModified")
                 :file/size             (get-attr "size")
                 :file/type             (get-attr "type")
                 :file/file             file
                 :file/handle           handle})) result)))
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
  ([ok-handler] (ls-dir-files-with-handler! ok-handler nil))
  ([ok-handler {:keys [empty-dir?-or-pred dir-result-fn]}]
   (let [path-handles (atom {})
         electron? (util/electron?)
         mobile-native? (mobile-util/native-platform?)
         nfs? (and (not electron?)
                   (not mobile-native?))
         *repo (atom nil)]
    ;; TODO: add ext filter to avoid loading .git or other ignored file handlers
     (->
      (p/let [result (if (fn? dir-result-fn)
                       (dir-result-fn {:path-handles path-handles :nfs? nfs?})
                       (fs/open-dir (fn [path handle]
                                      (when nfs?
                                        (swap! path-handles assoc path handle)))))
              _ (when-not (nil? empty-dir?-or-pred)
                  (cond
                    (boolean? empty-dir?-or-pred)
                    (and (not-empty (second result))
                         (throw (js/Error. "EmptyDirOnly")))

                    (fn? empty-dir?-or-pred)
                    (empty-dir?-or-pred result)))
              root-handle (first result)
              dir-name (if nfs?
                         (gobj/get root-handle "name")
                         root-handle)
              repo (str config/local-db-prefix dir-name)
              _ (state/set-loading-files! repo true)
              _ (when-not (or (state/home?) (state/setups-picker?))
                  (route-handler/redirect-to-home! false))]
        (reset! *repo repo)
        (when-not (string/blank? dir-name)
          (p/let [root-handle-path (str config/local-handle-prefix dir-name)
                  _ (when nfs?
                      (idb/set-item! root-handle-path root-handle)
                      (nfs/add-nfs-file-handle! root-handle-path root-handle))
                  result (nth result 1)
                  files (-> (->db-files mobile-native? electron? dir-name result)
                            (remove-ignore-files dir-name nfs?))
                  _ (when nfs?
                      (let [file-paths (set (map :file/path files))]
                        (swap! path-handles (fn [handles]
                                              (->> handles
                                                   (filter (fn [[path _handle]]
                                                             (or
                                                              (contains? file-paths
                                                                         (string/replace-first path (str dir-name "/") ""))
                                                              (let [last-part (last (string/split path "/"))]
                                                                (contains? #{config/app-name
                                                                             gp-config/default-draw-directory
                                                                             (config/get-journals-directory)
                                                                             (config/get-pages-directory)}
                                                                           last-part)))))
                                                   (into {})))))

                      (set-files! @path-handles))
                  markup-files (filter-markup-and-built-in-files files)]
            (-> (p/all (map (fn [file]
                              (p/let [content (if nfs?
                                                (.text (:file/file file))
                                                (:file/content file))
                                      content (encrypt/decrypt content)]
                                (assoc file :file/content content))) markup-files))
                (p/then (fn [result]
                          (p/let [files (map #(dissoc % :file/file) result)
                                  graphs-txid-meta (util-fs/read-graphs-txid-info dir-name)
                                  graph-uuid (and (vector? graphs-txid-meta) (second graphs-txid-meta))]
                            (if-let [exists-graph (state/get-sync-graph-by-uuid graph-uuid)]
                              (state/pub-event!
                               [:notification/show
                                {:content (str "This graph already exists in \"" (:root exists-graph) "\"")
                                 :status :warning}])
                              (do
                                (repo-handler/start-repo-db-if-not-exists! repo)
                                (async/go
                                  (let [_finished? (async/<! (repo-handler/load-repo-to-db! repo
                                                                                            {:new-graph?   true
                                                                                             :empty-graph? (nil? (seq markup-files))
                                                                                             :nfs-files    files}))]
                                    (state/add-repo! {:url repo :nfs? true})
                                    (state/set-loading-files! repo false)
                                    (when ok-handler (ok-handler {:url repo}))
                                    (fs/watch-dir! dir-name)
                                    (db/persist-if-idle! repo))))))))
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
              (and path (fn [{:keys [path-handles nfs?]}]
                          (p/let [files-result (fs/get-files
                                                path
                                                (fn [path handle]
                                                  (when nfs?
                                                    (swap! path-handles assoc path handle))))]
                            [path files-result])))]
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
    {:added    added
     :modified modified
     :deleted  deleted}))

(defn- handle-diffs!
  [repo nfs? old-files new-files handle-path path-handles re-index?]
  (let [get-last-modified-at (fn [path] (some (fn [file]
                                                (when (= path (:file/path file))
                                                  (:file/last-modified-at file)))
                                              new-files))
        get-file-f (fn [path files] (some #(when (= (:file/path %) path) %) files))
        {:keys [added modified deleted]} (compute-diffs old-files new-files)
        ;; Use the same labels as isomorphic-git
        rename-f (fn [typ col] (mapv (fn [file] {:type typ :path file :last-modified-at (get-last-modified-at file)}) col))
        _ (when (and nfs? (seq deleted))
            (let [deleted (doall
                           (-> (map (fn [path] (if (= "/" (first path))
                                                 path
                                                 (str "/" path))) deleted)
                               (distinct)))]
              (p/all (map (fn [path]
                            (let [handle-path (str handle-path path)]
                              (idb/remove-item! handle-path)
                              (nfs/remove-nfs-file-handle! handle-path))) deleted))))
        added-or-modified (set (concat added modified))
        _ (when (and nfs? (seq added-or-modified))
            (p/all (map (fn [path]
                          (when-let [handle (get @path-handles path)]
                            (idb/set-item! (str handle-path path) handle))) added-or-modified)))]
    (-> (p/all (map (fn [path]
                      (when-let [file (get-file-f path new-files)]
                        (p/let [content (if nfs?
                                          (.text (:file/file file))
                                          (:file/content file))
                                content (encrypt/decrypt content)]
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
                      (repo-handler/load-repo-to-db! repo
                                                     {:diffs     diffs
                                                      :nfs-files modified-files
                                                      :refresh? (not re-index?)
                                                      :new-graph? re-index?}))
                    (when (and (util/electron?) (not re-index?))
                      (db/transact! repo new-files))))))))

(defn- reload-dir!
  ([repo]
   (reload-dir! repo false))
  ([repo re-index?]
   (when (and repo (config/local-db? repo))
     (let [old-files (db/get-files-full repo)
           dir-name (config/get-local-dir repo)
           handle-path (str config/local-handle-prefix dir-name)
           path-handles (atom {})
           electron? (util/electron?)
           mobile-native? (mobile-util/native-platform?)
           nfs? (and (not electron?)
                     (not mobile-native?))]
       (when re-index?
         (state/set-graph-syncing? true))
       (->
        (p/let [handle (when-not electron? (idb/get-item handle-path))]
               (when (or handle electron? mobile-native?)   ; electron doesn't store the file handle
                 (p/let [_ (when handle (nfs/verify-permission repo handle true))
                         local-files-result
                         (fs/get-files (if nfs? handle
                                         (config/get-local-dir repo))
                                       (fn [path handle]
                                         (when nfs?
                                           (swap! path-handles assoc path handle))))
                         global-dir (global-config-handler/global-config-dir)
                         global-files-result (if (config/global-config-enabled?)
                                               (fs/get-files global-dir (constantly nil))
                                               [])
                         new-local-files (-> (->db-files mobile-native? electron? dir-name local-files-result)
                                             (remove-ignore-files dir-name nfs?))
                         new-global-files (-> (->db-files mobile-native? electron? global-dir global-files-result)
                                              (remove-ignore-files global-dir nfs?))
                         new-files (concat new-local-files new-global-files)

                         _ (when nfs?
                             (let [file-paths (set (map :file/path new-files))]
                               (swap! path-handles (fn [handles]
                                                     (->> handles
                                                          (filter (fn [[path _handle]]
                                                                    (contains? file-paths
                                                                               (string/replace-first path (str dir-name "/") ""))))
                                                          (into {})))))
                             (set-files! @path-handles))]
                        (handle-diffs! repo nfs? old-files new-files handle-path path-handles re-index?))))
        (p/catch (fn [error]
                   (log/error :nfs/load-files-error repo)
                   (log/error :exception error)))
        (p/finally (fn [_]
                     (state/set-graph-syncing? false))))))))

(defn rebuild-index!
  [repo ok-handler]
  (when repo
    (state/set-nfs-refreshing! true)
    (search/reset-indice! repo)
    (db/remove-conn! repo)
    (db/clear-query-state!)
    (db/start-db-conn! repo)
    (p/let [_ (reload-dir! repo true)
            _ (ok-handler)]
      (state/set-nfs-refreshing! false))))

;; TODO: move to frontend.handler.repo
(defn refresh!
  [repo ok-handler]
  (when (and repo
             (not (state/unlinked-dir? (config/get-repo-dir repo))))
    (state/set-nfs-refreshing! true)
    (p/let [_ (reload-dir! repo)
            _ (ok-handler)]
      (state/set-nfs-refreshing! false))))

(defn supported?
  []
  (or (utils/nfsSupported) (util/electron?)))
