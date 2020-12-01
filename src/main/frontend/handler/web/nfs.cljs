(ns frontend.handler.web.nfs
  "The File System Access API, https://web.dev/file-system-access/."
  (:require [cljs-bean.core :as bean]
            [promesa.core :as p]
            [goog.object :as gobj]
            [goog.dom :as gdom]
            [frontend.util :as util]
            ["/frontend/utils" :as utils]
            [frontend.handler.repo :as repo-handler]
            [frontend.idb :as idb]
            [frontend.state :as state]
            [clojure.string :as string]
            [clojure.set :as set]
            [frontend.ui :as ui]
            [frontend.fs :as fs]
            [frontend.db :as db]
            [frontend.config :as config]
            [lambdaisland.glogi :as log]))

(defn- ->db-files
  [dir-name result]
  (let [result (flatten (bean/->clj result))]
    (map (fn [file]
           (let [handle (gobj/get file "handle")
                 get-attr #(gobj/get file %)
                 path (-> (get-attr "webkitRelativePath")
                          (string/replace-first (str dir-name "/") ""))]
             {:file/path path
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
             root-handle (nth result 0)
             dir-name (gobj/get root-handle "name")
             repo (str config/local-db-prefix dir-name)
             root-handle-path (str config/local-handle-prefix dir-name)
             _ (idb/set-item! root-handle-path root-handle)
             _ (fs/add-nfs-file-handle! root-handle-path root-handle)
             _ (set-files! @path-handles)
             result (nth result 1)
             files (->db-files dir-name result)
             markup-files (filter-markup-and-built-in-files files)]
       (-> (p/all (map (fn [file]
                         (p/let [content (.text (:file/file file))]
                           (assoc file :file/content content))) markup-files))
           (p/then (fn [result]
                     (let [files (map #(dissoc % :file/file) result)]
                       (repo-handler/start-repo-db-if-not-exists! repo {:db-type :local-native-fs})
                       (repo-handler/load-repo-to-db! repo
                                                      {:first-clone? true
                                                       :nfs-files files})

                       (state/add-repo! {:url repo :nfs? true}))))
           (p/catch (fn [error]
                      (log/error :nfs/load-files-error error)))))
     (p/catch (fn [error]
                (log/error :nfs/open-dir-error error))))))

(defn open-file-picker
  "Shows a file picker that lets a user select a single existing file, returning a handle for the selected file. "
  ([]
   (open-file-picker {}))
  ([option]
   (js/window.showOpenFilePicker (bean/->js option))))

(defn get-local-repo
  []
  (when-let [repo (state/get-current-repo)]
    (when (config/local-db? repo)
      repo)))

(defn check-directory-permission!
  [repo]
  (p/let [handle (idb/get-item (str "handle-" repo))]
    (utils/verifyPermission handle true)))

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
                  (check-directory-permission! repo)
                  (close-fn)))]))

(defn trigger-check! []
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
        new-diff (set/difference new-files old-files)
        old-diff (set/difference old-files new-files)
        added (set/difference new-diff old-diff)
        deleted (set/difference old-diff new-diff)
        modified (let [both-exist (set/difference new-diff added)]
                   (when (seq both-exist)
                     (->>
                      (filter (fn [{:file/keys [path last-modified-at]}]
                                (when-let [old-file (some #(when (= (:file/path %) path) %) old-files)]
                                  ;; TODO: the `last-modified-at` attribute in the db is always after
                                  ;; the file in the local file sytem because we transact to the db first and write to the
                                  ;; file system later.
                                  ;; It doesn't mean this is a bug, but it could impact the performance.
                                  (> last-modified-at (:file/last-modified-at old-file))))
                              both-exist)
                      (map :file/path))))]
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
      (p/let [handle (idb/get-item handle-path)
              files-result (utils/getFiles handle true
                                           (fn [path handle]
                                             (swap! path-handles assoc path handle)))
              _ (set-files! @path-handles)
              new-files (->db-files dir-name files-result)
              get-file-f (fn [path files] (some #(when (= (:file/path %) path) %) files))
              {:keys [added modified deleted] :as diffs} (compute-diffs old-files new-files)
              ;; Use the same labels as isomorphic-git
              rename-f (fn [typ col] (mapv (fn [file] {:type typ :path (:file/path file)}) col))
              diffs (concat
                     (rename-f "remove" deleted)
                     (rename-f "add" added)
                     (rename-f "modify" modified))
              _ (when (seq deleted)
                  (p/all (map #(idb/remove-item! (str handle-path (:file/path %))) deleted)))
              added-or-modified (set (concat added modified))
              _ (when (seq added-or-modified)
                  (p/all (map (fn [{:file/keys [path]}]
                                (when-let [handle (get @path-handles path)]
                                  (idb/set-item! (str handle-path path) handle))) added-or-modified)))]
        (-> (p/all (map (fn [file]
                          (when-let [file (get-file-f (:file/path file) new-files)]
                            (p/let [content (.text (:file/file file))]
                              (assoc file :file/content content)))) added-or-modified))
            (p/then (fn [result]
                      (let [files (->> (map #(dissoc % :file/file :file/handle) result)
                                       (remove
                                        (fn [file]
                                          (let [content (:file/content file)
                                                old-content (:file/content (get-file-f (:file/path file) old-files))]
                                            (= content old-content)))))]
                        (when (and (seq diffs) (seq files))
                          (repo-handler/load-repo-to-db! repo
                                                         {:diffs diffs
                                                          :nfs-files files})))))
            (p/catch (fn [error]
                       (log/error :nfs/load-files-error error))))))))

(defn- refresh!
  [repo]
  (reload-dir! repo))
