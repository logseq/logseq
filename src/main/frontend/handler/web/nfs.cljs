(ns frontend.handler.web.nfs
  "The File System Access API, https://web.dev/file-system-access/."
  (:require [cljs-bean.core :as bean]
            [promesa.core :as p]
            [goog.object :as gobj]
            [goog.dom :as gdom]
            [frontend.util :as util]
            ["/frontend/utils" :as utils]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.file :as file-handler]
            [frontend.idb :as idb]
            [frontend.state :as state]
            [clojure.string :as string]
            [clojure.set :as set]
            [frontend.ui :as ui]
            [frontend.fs :as fs]
            [frontend.db :as db]
            [frontend.config :as config]
            [lambdaisland.glogi :as log]))

(defn remove-ignore-files
  [files]
  (let [files (remove (fn [f]
                        (string/starts-with? (:file/path f) ".git/"))
                      files)]
    (if-let [ignore-file (some #(when (= (:file/name %) ".gitignore")
                                  %) files)]
      (if-let [file (:file/file ignore-file)]
        (p/let [content (.text file)]
          (when content
            (let [paths (set (file-handler/ignore-files content (map :file/path files)))]
              (when (seq paths)
                (filter (fn [f] (contains? paths (:file/path f))) files)))))
        (p/resolved files))
      (p/resolved files))))

(defn- ->db-files
  [dir-name result]
  (let [result (flatten (bean/->clj result))]
    (map (fn [file]
           (let [handle (gobj/get file "handle")
                 get-attr #(gobj/get file %)
                 path (-> (get-attr "webkitRelativePath")
                          (string/replace-first (str dir-name "/") ""))]
             {:file/name (get-attr "name")
              :file/path path
              :file/last-modified-at (get-attr "lastModified")
              :file/size (get-attr "size")
              :file/type (get-attr "type")
              :file/file file
              :file/handle handle})) result)))

(defn- filter-markup-and-built-in-files
  [files]
  (filter (fn [file]
            (contains? (set/union config/markup-formats #{:css :edn})
                       (keyword (util/get-file-ext (:file/path file)))))
          files))

(defn- set-files!
  [handles]
  (doseq [[path handle] handles]
    (let [handle-path (str config/local-handle-prefix path)]
      (idb/set-item! handle-path handle)
      (fs/add-nfs-file-handle! handle-path handle))))

(defn ls-dir-files
  []
  (let [path-handles (atom {})]
    (->
     (p/let [result (utils/openDirectory #js {:recursive true}
                                         (fn [path handle]
                                           (swap! path-handles assoc path handle)))
             _ (state/set-loading-files! true)
             root-handle (nth result 0)
             dir-name (gobj/get root-handle "name")
             repo (str config/local-db-prefix dir-name)
             root-handle-path (str config/local-handle-prefix dir-name)
             _ (idb/set-item! root-handle-path root-handle)
             _ (fs/add-nfs-file-handle! root-handle-path root-handle)
             result (nth result 1)
             files (-> (->db-files dir-name result)
                       remove-ignore-files)
             _ (let [file-paths (set (map :file/path files))]
                 (swap! path-handles (fn [handles]
                                       (->> handles
                                            (filter (fn [[path _handle]]
                                                      (contains? file-paths
                                                                 (string/replace-first path (str dir-name "/") ""))))
                                            (into {})))))
             _ (set-files! @path-handles)
             markup-files (filter-markup-and-built-in-files files)]
       (-> (p/all (map (fn [file]
                         (p/let [content (.text (:file/file file))]
                           (assoc file :file/content content))) markup-files))
           (p/then (fn [result]
                     _ (state/set-loading-files! false)
                     (let [files (map #(dissoc % :file/file) result)]
                       (repo-handler/start-repo-db-if-not-exists! repo {:db-type :local-native-fs})
                       (repo-handler/load-repo-to-db! repo
                                                      {:first-clone? true
                                                       :nfs-files files})

                       (state/add-repo! {:url repo :nfs? true}))))
           (p/catch (fn [error]
                      (log/error :nfs/load-files-error error)))))
     (p/catch (fn [error]
                (when (not= "AbortError" (gobj/get error "name"))
                  (log/error :nfs/open-dir-error error)))))))

(defn open-file-picker
  "Shows a file picker that lets a user select a single existing file, returning a handle for the selected file. "
  ([]
   (open-file-picker {}))
  ([option]
   (.showOpenFilePicker js/window (bean/->js option))))

(defn get-local-repo
  []
  (when-let [repo (state/get-current-repo)]
    (when (config/local-db? repo)
      repo)))

(defn ask-permission
  [repo]
  (fn [close-fn]
    [:div
     [:p.text-gray-700
      "Grant native filesystem permission for directory: "
      [:b (config/get-local-dir repo)]]
     (ui/button
      "Grant"
      :on-click (fn []
                  (fs/check-directory-permission! repo)
                  (close-fn)))]))

(defn ask-permission-if-local? []
  (when-let [repo (get-local-repo)]
    (state/set-modal! (ask-permission repo))))

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
    {:added added
     :modified modified
     :deleted deleted}))

(defn- reload-dir!
  [repo]
  (when (and repo (config/local-db? repo))
    (let [old-files (db/get-files-full repo)
          dir-name (config/get-local-dir repo)
          handle-path (str config/local-handle-prefix dir-name)
          path-handles (atom {})]
      (state/set-graph-syncing? true)
      (p/let [handle (idb/get-item handle-path)]
        (when handle
          (p/let [_ (when handle (utils/verifyPermission handle true))
                  files-result (utils/getFiles handle true
                                               (fn [path handle]
                                                 (swap! path-handles assoc path handle)))
                  new-files (-> (->db-files dir-name files-result)
                                remove-ignore-files)
                  _ (let [file-paths (set (map :file/path new-files))]
                      (swap! path-handles (fn [handles]
                                            (->> handles
                                                 (filter (fn [[path _handle]]
                                                           (contains? file-paths
                                                                      (string/replace-first path (str dir-name "/") ""))))
                                                 (into {})))))
                  _ (set-files! @path-handles)
                  get-file-f (fn [path files] (some #(when (= (:file/path %) path) %) files))
                  {:keys [added modified deleted] :as diffs} (compute-diffs old-files new-files)
                  ;; Use the same labels as isomorphic-git
                  rename-f (fn [typ col] (mapv (fn [file] {:type typ :path file}) col))
                  _ (when (seq deleted)
                      (p/all (map (fn [path]
                                    (let [handle-path (str handle-path path)]
                                      (idb/remove-item! handle-path)
                                      (fs/remove-nfs-file-handle! handle-path))) deleted)))
                  added-or-modified (set (concat added modified))
                  _ (when (seq added-or-modified)
                      (p/all (map (fn [path]
                                    (when-let [handle (get @path-handles path)]
                                      (idb/set-item! (str handle-path path) handle))) added-or-modified)))]
            (-> (p/all (map (fn [path]
                              (when-let [file (get-file-f path new-files)]
                                (p/let [content (.text (:file/file file))]
                                  (assoc file :file/content content)))) added-or-modified))
                (p/then (fn [result]
                          (let [files (map #(dissoc % :file/file :file/handle) result)
                                non-modified? (fn [file]
                                                (let [content (:file/content file)
                                                      old-content (:file/content (get-file-f (:file/path file) old-files))]
                                                  (= content old-content)))
                                non-modified-files (->> (filter non-modified? files)
                                                        (map :file/path))
                                modified-files (remove non-modified? files)
                                modified (set/difference (set modified) (set non-modified-files))
                                diffs (concat
                                       (rename-f "remove" deleted)
                                       (rename-f "add" added)
                                       (rename-f "modify" modified))]
                            (when (or (and (seq diffs) (seq modified-files))
                                      (seq diffs) ; delete
)
                              (repo-handler/load-repo-to-db! repo
                                                             {:diffs diffs
                                                              :nfs-files modified-files})))))
                (p/catch (fn [error]
                           (log/error :nfs/load-files-error error)))
                (p/finally (fn [_]
                             (state/set-graph-syncing? false))))))))))

(defn- refresh!
  [repo]
  (when repo
    (reload-dir! repo)))

(defn supported?
  []
  (utils/nfsSupported))
