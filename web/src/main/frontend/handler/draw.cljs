(ns frontend.handler.draw
  (:refer-clojure :exclude [load-file])
  (:require [frontend.util :as util :refer-macros [profile]]
            [frontend.fs :as fs]
            [promesa.core :as p]
            [frontend.state :as state]
            [frontend.db :as db]
            [frontend.git :as git]
            [frontend.github :as github]
            [frontend.handler.file :as file-handler]
            [frontend.handler.git :as git-handler]
            [cljs-bean.core :as bean]
            [frontend.date :as date]
            [frontend.config :as config]
            [frontend.format :as format]
            [frontend.format.protocol :as protocol]
            [clojure.string :as string]
            [cljs-time.local :as tl]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]))

;; excalidraw
(defn create-draws-directory!
  [repo]
  (let [repo-dir (util/get-repo-dir repo)]
    (util/p-handle
     (fs/mkdir (str repo-dir (str "/" config/default-draw-directory)))
     (fn [_result] nil)
     (fn [_error] nil))))

(defn save-excalidraw!
  [file data ok-handler]
  (let [path (str config/default-draw-directory "/" file)
        repo (state/get-current-repo)]
    (when repo
      (let [repo-dir (util/get-repo-dir repo)]
        (p/let [_ (create-draws-directory! repo)]
          (util/p-handle
           (fs/write-file repo-dir path data)
           (fn [_]
             (util/p-handle
              (git-handler/git-add repo path)
              (fn [_]
                (ok-handler file)
                (let [modified-at (tc/to-long (t/now))]
                  (db/transact! repo
                    [{:file/path path
                      :file/last-modified-at modified-at}
                     {:page/name file
                      :page/file path
                      :page/last-modified-at (tc/to-long (t/now))
                      :page/journal? false}])))))
           (fn [error]
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
