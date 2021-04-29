(ns frontend.handler.web.nfs
  "The File System Access API, https://web.dev/file-system-access/."
  (:require [cljs-bean.core :as bean]
            [promesa.core :as p]
            [medley.core :as medley]
            [goog.object :as gobj]
            [frontend.util :as util]
            [frontend.handler.common :as common-handler]
            ["/frontend/utils" :as utils]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.route :as route-handler]
            [frontend.idb :as idb]
            [frontend.state :as state]
            [clojure.string :as string]
            [clojure.set :as set]
            [frontend.fs :as fs]
            [frontend.fs.nfs :as nfs]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.config :as config]
            [lambdaisland.glogi :as log]
            [frontend.encrypt :as encrypt]
            [frontend.search :as search]
            [frontend.storage :as storage]))

(defn remove-ignore-files
  [files]
  (let [files (remove (fn [f]
                        (or (string/starts-with? (:file/path f) ".git/")
                            (string/includes? (:file/path f) ".git/")))
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
  [electron? dir-name result]
  (if electron?
    (map (fn [{:keys [path stat content]}]
           (let [{:keys [mtime size]} stat]
             {:file/path             path
              :file/last-modified-at mtime
              :file/size             size
              :file/content content}))
         result)
    (let [result (flatten (bean/->clj result))]
      (map (fn [file]
             (let [handle (gobj/get file "handle")
                   get-attr #(gobj/get file %)
                   path (-> (get-attr "webkitRelativePath")
                            (string/replace-first (str dir-name "/") ""))]
               {:file/name             (get-attr "name")
                :file/path             path
                :file/last-modified-at (get-attr "lastModified")
                :file/size             (get-attr "size")
                :file/type             (get-attr "type")
                :file/file             file
                :file/handle           handle})) result))))

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
  (if (seq handles)
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
(defn ls-dir-files-with-handler!
  [ok-handler]
  (let [path-handles (atom {})
        electron? (util/electron?)
        nfs? (not electron?)]
    ;; TODO: add ext filter to avoid loading .git or other ignored file handlers
    (->
     (p/let [result (fs/open-dir (fn [path handle]
                                   (when nfs?
                                     (swap! path-handles assoc path handle))))
             _ (state/set-loading-files! true)
             _ (when-not (state/home?)
                 (route-handler/redirect-to-home!))
             root-handle (first result)
             dir-name (if nfs?
                        (gobj/get root-handle "name")
                        root-handle)
             repo (str config/local-db-prefix dir-name)
             root-handle-path (str config/local-handle-prefix dir-name)
             _ (when nfs?
                 (idb/set-item! root-handle-path root-handle)
                 (nfs/add-nfs-file-handle! root-handle-path root-handle))
             result (nth result 1)
             files (-> (->db-files electron? dir-name result)
                       remove-ignore-files)
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
                                                                        config/default-draw-directory
                                                                        config/default-journals-directory
                                                                        config/default-pages-directory}
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
                     (let [files (map #(dissoc % :file/file) result)]
                       (repo-handler/start-repo-db-if-not-exists! repo {:db-type :local-native-fs})
                       (repo-handler/load-repo-to-db! repo
                                                      {:first-clone? true
                                                       :nfs-files    files})

                       (state/add-repo! {:url repo :nfs? true})
                       (state/set-loading-files! false)
                       (and ok-handler (ok-handler))
                       (when (util/electron?)
                         (fs/watch-dir! dir-name)))))
           (p/catch (fn [error]
                      (log/error :nfs/load-files-error error)))))
     (p/catch (fn [error]
                (if (contains? #{"AbortError" "Error"} (gobj/get error "name"))
                  (state/set-loading-files! false)
                  (log/error :nfs/open-dir-error error)))))))

(defn- compute-diffs
  [old-files new-files]
  (let [ks [:file/path :file/last-modified-at]
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
        modified (set/difference new-file-paths added)]
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
        {:keys [added modified deleted] :as diffs} (compute-diffs old-files new-files)
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
                        non-modified? (fn [file]
                                        (let [content (:file/content file)
                                              old-content (:file/content (get-file-f (:file/path file) old-files))]
                                          (= content old-content)))
                        non-modified-files (->> (filter non-modified? files)
                                                (map :file/path))
                        [modified-files modified] (if re-index?
                                                    [files (set modified)]
                                                    [(remove non-modified? files) (set/difference (set modified) (set non-modified-files))])
                        diffs (concat
                               (rename-f "remove" deleted)
                               (rename-f "add" added)
                               (rename-f "modify" modified))]
                    (when (or (and (seq diffs) (seq modified-files))
                              (seq diffs))
                      (repo-handler/load-repo-to-db! repo
                                                     {:diffs     diffs
                                                      :nfs-files modified-files}))))))))

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
           nfs? (not electron?)]
       (state/set-graph-syncing? true)
       (->
        (p/let [handle (idb/get-item handle-path)]
          (when (or handle electron?)   ; electron doesn't store the file handle
            (p/let [_ (when handle (nfs/verify-permission repo handle true))
                    files-result (fs/get-files (if nfs? handle
                                                   (config/get-local-dir repo))
                                               (fn [path handle]
                                                 (when nfs?
                                                   (swap! path-handles assoc path handle))))
                    new-files (-> (->db-files electron? dir-name files-result)
                                  remove-ignore-files)
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
                   (log/error :nfs/load-files-error error)))
        (p/finally (fn [_]
                     (state/set-graph-syncing? false))))))))

(defn rebuild-index!
  [repo ok-handler]
  (when repo
    (state/set-nfs-refreshing! true)
    (search/reset-indice! repo)
    (db/remove-conn! repo)
    (db/clear-query-state!)
    (db/start-db-conn! (state/get-me) repo)
    (p/let [_ (reload-dir! repo true)
            _ (ok-handler)]
      (state/set-nfs-refreshing! false))))

(defn refactored-version?
  []
  (:block/name (storage/get :db-schema)))

(defn refresh!
  [repo ok-handler]
  (if (refactored-version?)
    (when repo
      (state/set-nfs-refreshing! true)
      (p/let [_ (reload-dir! repo)
              _ (ok-handler)]
        (state/set-nfs-refreshing! false)))
    (rebuild-index! repo ok-handler)))

(defn supported?
  []
  (or (utils/nfsSupported) (util/electron?)))
