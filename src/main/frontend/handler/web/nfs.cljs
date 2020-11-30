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
            [frontend.ui :as ui]
            [frontend.fs :as fs]
            [frontend.config :as config]))

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
             _ (doseq [[path handle] @path-handles]
                 (let [handle-path (str config/local-handle-prefix path)]
                   (idb/set-item! handle-path handle)
                   (fs/add-nfs-file-handle! handle-path handle)))
             result (nth result 1)
             result (flatten (bean/->clj result))
             files (doall
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
                              :file/handle handle})) result))
             markup-files (filter (fn [file]
                                    (contains? config/markup-formats
                                               (keyword (util/get-file-ext (:file/path file)))))
                                  files)]
       (-> (p/all (map (fn [file]
                         (p/let [content (.text (:file/file file))]
                           (assoc file :file/content content))) markup-files))
           (p/then (fn [result]
                     (let [files (map #(dissoc % :file/file) result)]
                       (repo-handler/start-repo-db-if-not-exists! repo {:db-type :local-native-fs})
                       (repo-handler/load-repo-to-db! repo
                                                      {:first-clone? true
                                                       :nfs-files (map :file/path files)
                                                       :nfs-contents (mapv (fn [f] [(:file/path f) (:file/content f)]) files)
                                                       :additional-files-info files})

                       (state/add-repo! {:url repo :nfs? true}))))
           (p/catch (fn [error]
                      (println "Load files content error: ")
                      (js/console.dir error)))))
     (p/catch (fn [error]
                (println "Open directory error: ")
                (js/console.dir error))))))

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
