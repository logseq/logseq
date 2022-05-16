(ns frontend.handler.draw
  (:refer-clojure :exclude [load-file])
  (:require [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.fs :as fs]
            [frontend.handler.file :as file-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.graph-parser.config :as gp-config]
            [frontend.fs.protocol :as protocol]
            [promesa.core :as p]))

(defn create-draws-directory!
  [repo]
  (when repo
    (let [repo-dir (config/get-repo-dir repo)]
      (util/p-handle
       (fs/mkdir! (str repo-dir (str "/" gp-config/default-draw-directory)))
       (fn [_result] nil)
       (fn [_error] nil)))))

(defn ls-draws-directory!
  [repo]
  (when repo
    (p/let [repo-dir (config/get-repo-dir repo)
            fs (fs/get-fs repo-dir)
            dir (str repo (str "/" gp-config/default-draw-directory))
            files (protocol/readdir fs dir)]
      files)))

(defn save-draw!
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

(defn load-draw-file
  [file ok-handler]
  (when-let [repo (state/get-current-repo)]
    (util/p-handle
     (file-handler/load-file repo file)
     (fn [content]
       (ok-handler content))
     (fn [error]
       (println "Error loading " file ": "
                error)))))

(defonce default-excalidraw-content
  (util/format
   "{\n  \"type\": \"excalidraw\",\n  \"version\": 2,\n  \"source\": \"%s\",\n  \"elements\": [],\n  \"appState\": {\n    \"viewBackgroundColor\": \"#FFF\",\n    \"gridSize\": null\n  }\n}"
   config/website))

(defonce default-tldraw-content
  (util/format
   ""
   config/website))

(defn- file-name
  [ext]
  (str (date/get-date-time-string-2) ext))

(defn- create-draw-with-default-content
  [current-file content]
  (when-let [repo (state/get-current-repo)]
    (p/let [exists? (fs/file-exists? (config/get-repo-dir repo)
                                     (str gp-config/default-draw-directory current-file))]
      (when-not exists?
        (save-draw! current-file content)))))

(defn initialize-excalidarw-file
  []
  (let [file (file-name ".excalidraw")
        path (str gp-config/default-draw-directory "/" file)
        text (util/format "[[%s]]" path)]
    (p/let [_ (create-draw-with-default-content path default-excalidraw-content)]
      (println "excalidraw file created, " path))
    text))

(defn initialize-tldraw-file
  []
  (let [file (file-name ".tldr")
        path (str gp-config/default-draw-directory "/" file)
        text (util/format "[[%s]]" path)]
    (p/let [_ (create-draw-with-default-content path default-tldraw-content)]
      (println "tldraw file created, " path))
    text))
