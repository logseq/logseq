(ns frontend.handler.draw
  "Provides util handler fns for drawing"
  (:refer-clojure :exclude [load-file])
  (:require [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.fs :as fs]
            [frontend.handler.file :as file-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.graph-parser.config :as gp-config]
            [promesa.core :as p]))

(defn create-draws-directory!
  [repo]
  (when repo
    (let [repo-dir (config/get-repo-dir repo)]
      (util/p-handle
       (fs/mkdir! (str repo-dir (str "/" gp-config/default-draw-directory)))
       (fn [_result] nil)
       (fn [_error] nil)))))

(defn save-excalidraw!
  [file data]
  (let [path file
        repo (state/get-current-repo)]
    (when repo
      (let [repo-dir (config/get-repo-dir repo)]
        (->
         (p/do!
          (create-draws-directory! repo)
          (fs/write-file! repo repo-dir path data nil)
          (db/transact! repo
                        [{:file/path path
                          :block/name (util/page-name-sanity-lc file)
                          :block/file {:file/path path}
                          :block/journal? false}]))
         (p/catch (fn [error]
                    (prn "Write file failed, path: " path ", data: " data)
                    (js/console.dir error))))))))

(defn load-excalidraw-file
  [file ok-handler]
  (when-let [repo (state/get-current-repo)]
    (util/p-handle
     (file-handler/load-file repo file)
     (fn [content]
       (ok-handler content))
     (fn [error]
       (println "Error loading " file ": "
                error)))))

(defonce default-content
  (util/format
   "{\n  \"type\": \"excalidraw\",\n  \"version\": 2,\n  \"source\": \"%s\",\n  \"elements\": [],\n  \"appState\": {\n    \"viewBackgroundColor\": \"#FFF\",\n    \"gridSize\": null\n  }\n}"
   config/website))

(defn file-name
  []
  (str (date/get-date-time-string-2) ".excalidraw"))

(defn create-draw-with-default-content
  [current-file]
  (when-let [repo (state/get-current-repo)]
    (p/let [exists? (fs/file-exists? (config/get-repo-dir repo)
                                     (str gp-config/default-draw-directory current-file))]
      (when-not exists?
        (save-excalidraw! current-file default-content)))))
