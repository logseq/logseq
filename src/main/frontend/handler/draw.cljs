(ns frontend.handler.draw
  (:refer-clojure :exclude [load-file])
  (:require [frontend.util :as util :refer-macros [profile]]
            [frontend.fs :as fs]
            [promesa.core :as p]
            [frontend.state :as state]
            [frontend.db :as db]
            [frontend.handler.file :as file-handler]
            [frontend.handler.git :as git-handler]
            [frontend.date :as date]
            [frontend.config :as config]
            [frontend.storage :as storage]
            [clojure.string :as string]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]))

;; state
(defonce *files (atom nil))
(defonce *current-file (atom nil))
(defonce *current-title (atom ""))
(defonce *file-loading? (atom nil))
(defonce *elements (atom nil))
(defonce *unsaved? (atom false))
(defonce *search-files (atom []))
(defonce *saving-title (atom nil))
(defonce *excalidraw (atom nil))

;; TODO: refactor
(defonce draw-state :draw-state)

(defn get-draw-state []
  (storage/get draw-state))
(defn set-draw-state! [value]
  (storage/set draw-state value))

(defn set-k
  [k v]
  (when-let [repo (state/get-current-repo)]
    (let [state (get-draw-state)]
      (let [new-state (assoc-in state [repo k] v)]
        (set-draw-state! new-state)))))

(defn set-last-file!
  [value]
  (set-k :last-file value))

;; excalidraw
(defn create-draws-directory!
  [repo]
  (when repo
    (let [repo-dir (util/get-repo-dir repo)]
     (util/p-handle
      (fs/mkdir (str repo-dir (str "/" config/default-draw-directory)))
      (fn [_result] nil)
      (fn [_error] nil)))))

(defn save-excalidraw!
  [file data ok-handler]
  (let [path (str config/default-draw-directory "/" file)
        repo (state/get-current-repo)]
    (when repo
      (let [repo-dir (util/get-repo-dir repo)]
        (->
         (p/do!
          (create-draws-directory! repo)
          (fs/write-file repo repo-dir path data)
          (git-handler/git-add repo path)
          (ok-handler file)
          (let [modified-at (tc/to-long (t/now))]
            (db/transact! repo
                          [{:file/path path
                            :file/last-modified-at modified-at}
                           {:page/name file
                            :page/file path
                            :page/last-modified-at (tc/to-long (t/now))
                            :page/journal? false}])))
         (p/catch (fn [error]
                    (prn "Write file failed, path: " path ", data: " data)
                    (js/console.dir error))))))))

(defn get-all-excalidraw-files
  [ok-handler]
  (when-let [repo (state/get-current-repo)]
    (p/let [_ (create-draws-directory! repo)]
      (let [dir (str (util/get-repo-dir repo)
                     "/"
                     config/default-draw-directory)]
        (util/p-handle
         (fs/readdir dir)
         (fn [files]
           (let [files (-> (filter #(string/ends-with? % ".excalidraw") files)
                           (distinct)
                           (sort)
                           (reverse))]
             (ok-handler files)))
         (fn [error]
           (js/console.dir error)))))))

(defn load-excalidraw-file
  [file ok-handler]
  (when-let [repo (state/get-current-repo)]
    (util/p-handle
     (file-handler/load-file repo (str config/default-draw-directory "/" file))
     (fn [content]
       (ok-handler content))
     (fn [error]
       (prn "Error loading " file ": "
            error)))))

(defonce default-content
  (util/format
   "{\n  \"type\": \"excalidraw\",\n  \"version\": 2,\n  \"source\": \"%s\",\n  \"elements\": [],\n  \"appState\": {\n    \"viewBackgroundColor\": \"#FFF\",\n    \"gridSize\": null\n  }\n}"
   config/website))

(defn title->file-name
  [title]
  (when (not (string/blank? title))
    (let [title (string/lower-case (string/replace title " " "-"))]
      (str (date/get-date-time-string-2) "-" title ".excalidraw"))))

(defn create-draw-with-default-content
  [current-file ok-handler]
  (when-let [repo (state/get-current-repo)]
    (p/let [exists? (fs/file-exists? (util/get-repo-dir repo)
                                     (str config/default-draw-directory current-file))]
      (when-not exists?
        (save-excalidraw! current-file default-content
                          (fn [file]
                            (reset! *files
                                    (distinct (conj @*files file)))
                            (reset! *current-file file)
                            (reset! *unsaved? false)
                            (set-last-file! file)
                            (reset! *saving-title nil)
                            (ok-handler)))))))
