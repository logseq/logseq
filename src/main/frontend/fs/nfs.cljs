(ns frontend.fs.nfs
  (:require [frontend.fs.protocol :as protocol]
            [frontend.util :as util]
            [clojure.string :as string]
            [frontend.idb :as idb]
            [promesa.core :as p]
            [lambdaisland.glogi :as log]
            [goog.object :as gobj]
            [frontend.db :as db]
            [frontend.config :as config]
            [frontend.state :as state]
            [frontend.handler.notification :as notification]
            ["/frontend/utils" :as utils]))

;; We need to cache the file handles in the memory so that
;; the browser will not keep asking permissions.
(defonce nfs-file-handles-cache (atom {}))

(defn get-nfs-file-handle
  [handle-path]
  (get @nfs-file-handles-cache handle-path))

(defn add-nfs-file-handle!
  [handle-path handle]
  (swap! nfs-file-handles-cache assoc handle-path handle))

(defn remove-nfs-file-handle!
  [handle-path]
  (swap! nfs-file-handles-cache dissoc handle-path))

(defn nfs-saved-handler
  [repo path file]
  (when-let [last-modified (gobj/get file "lastModified")]
    ;; TODO: extract
    (let [path (if (= \/ (first path))
                 (subs path 1)
                 path)]
      ;; Bad code
      (db/set-file-last-modified-at! repo path last-modified))))

(defn verify-permission
  [repo handle read-write?]
  (let [repo (or repo (state/get-current-repo))]
    (p/then
     (utils/verifyPermission handle read-write?)
     (fn []
       (state/set-state! [:nfs/user-granted? repo] true)
       true))))

(defn check-directory-permission!
  [repo]
  (when (config/local-db? repo)
    (p/let [handle (idb/get-item (str "handle/" repo))]
      (when handle
        (verify-permission repo handle true)))))

(defrecord Nfs []
  protocol/Fs
  (mkdir! [this dir]
    (let [[root new-dir] (rest (string/split dir "/"))
          root-handle (str "handle/" root)]
      (->
       (p/let [handle (idb/get-item root-handle)
               _ (when handle (verify-permission nil handle true))]
         (when (and handle new-dir
                    (not (string/blank? new-dir)))
           (p/let [handle (.getDirectoryHandle ^js handle new-dir
                                               #js {:create true})
                   handle-path (str root-handle "/" new-dir)
                   _ (idb/set-item! handle-path handle)]
             (add-nfs-file-handle! handle-path handle)
             (println "Stored handle: " (str root-handle "/" new-dir)))))
       (p/catch (fn [error]
                  (js/console.debug "mkdir error: " error ", dir: " dir)
                  (throw error))))))

  (readdir [this dir]
    (let [prefix (str "handle/" dir)
          cached-files (keys @nfs-file-handles-cache)]
      (p/resolved
       (->> (filter #(string/starts-with? % (str prefix "/")) cached-files)
            (map (fn [path]
                   (string/replace path prefix "")))))))

  (unlink! [this path opts]
    (let [[dir basename] (util/get-dir-and-basename path)
          handle-path (str "handle" path)]
      (->
       (p/let [handle (idb/get-item (str "handle" dir))
               _ (idb/remove-item! handle-path)]
         (when handle
           (.removeEntry ^js handle basename))
         (remove-nfs-file-handle! handle-path))
       (p/catch (fn [error]
                  (log/error :unlink/path {:path path
                                           :error error}))))))

  (rmdir! [this dir]
    nil)

  (read-file [this dir path options]
    (let [handle-path (str "handle" dir "/" path)]
      (p/let [handle (idb/get-item handle-path)
              local-file (and handle (.getFile handle))]
        (and local-file (.text local-file)))))

  (write-file! [this repo dir path content opts]
    (let [{:keys [old-content]} opts
          last-modified-at (db/get-file-last-modified-at repo path)
          parts (string/split path "/")
          basename (last parts)
          sub-dir (->> (butlast parts)
                       (remove string/blank?)
                       (string/join "/"))
          sub-dir-handle-path (str "handle/"
                                   (subs dir 1)
                                   (if sub-dir
                                     (str "/" sub-dir)))
          handle-path (if (= "/" (last sub-dir-handle-path))
                        (subs sub-dir-handle-path 0 (dec (count sub-dir-handle-path)))
                        sub-dir-handle-path)
          basename-handle-path (str handle-path "/" basename)]
      (p/let [file-handle (idb/get-item basename-handle-path)]
        (when file-handle
          (add-nfs-file-handle! basename-handle-path file-handle))
        (if file-handle
          (p/let [local-file (.getFile file-handle)
                  local-content (.text local-file)
                  local-last-modified-at (gobj/get local-file "lastModified")
                  current-time (util/time-ms)
                  new? (> current-time local-last-modified-at)
                  new-created? (nil? last-modified-at)
                  not-changed? (= last-modified-at local-last-modified-at)
                  format (-> (util/get-file-ext path)
                             (config/get-file-format))
                  pending-writes (state/get-write-chan-length)
                  draw? (and path (string/ends-with? path ".excalidraw"))]
            (do
              (p/let [_ (verify-permission repo file-handle true)
                      _ (utils/writeFile file-handle content)
                      file (.getFile file-handle)]
                (when file
                  (nfs-saved-handler repo path file))))
            ;; (if (and local-content (or old-content
            ;;                            ;; temporally fix
            ;;                            draw?) new?
            ;;          (or
            ;;           draw?
            ;;           ;; Writing not finished
            ;;           (> pending-writes 0)
            ;;           ;; not changed by other editors
            ;;           not-changed?
            ;;           new-created?))
            ;;   (do
            ;;     (p/let [_ (verify-permission repo file-handle true)
            ;;             _ (utils/writeFile file-handle content)
            ;;             file (.getFile file-handle)]
            ;;       (when file
            ;;         (nfs-saved-handler repo path file))))
            ;;   (do
            ;;     (js/alert (str "The file has been modified on your local disk! File path: " path
            ;;                    ", please save your changes and click the refresh button to reload it."))))
            )
           ;; create file handle
          (->
           (p/let [handle (idb/get-item handle-path)]
             (if handle
               (p/let [_ (verify-permission repo handle true)
                       file-handle (.getFileHandle ^js handle basename #js {:create true})
                       ;; File exists if the file-handle has some content in it.
                       file (.getFile file-handle)
                       text (.text file)]
                 (if (string/blank? text)
                   (p/let [_ (idb/set-item! basename-handle-path file-handle)
                          _ (utils/writeFile file-handle content)
                          file (.getFile file-handle)]
                    (when file
                      (nfs-saved-handler repo path file)))
                   (notification/show! (str "The file " path " already exists, please save your changes and click the refresh button to reload it.")
                    :warning)))
               (println "Error: directory handle not exists: " handle-path)))
           (p/catch (fn [error]
                      (println "Write local file failed: " {:path path})
                      (js/console.error error))))))))

  (rename! [this repo old-path new-path]
    (p/let [[dir basename] (util/get-dir-and-basename old-path)
            [_ new-basename] (util/get-dir-and-basename new-path)
            parts (->> (string/split new-path "/")
                       (remove string/blank?))
            dir (str "/" (first parts))
            new-path (->> (rest parts)
                          (string/join "/"))
            handle (idb/get-item (str "handle" old-path))
            file (.getFile handle)
            content (.text file)
            _ (protocol/write-file! this repo dir new-path content nil)]
      (protocol/unlink! this old-path nil)))
  (stat [this dir path]
    (if-let [file (get-nfs-file-handle (str "handle/"
                                            (string/replace-first dir "/" "")
                                            path))]
      (p/let [file (.getFile file)]
        (let [get-attr #(gobj/get file %)]
          {:file/last-modified-at (get-attr "lastModified")
           :file/size (get-attr "size")
           :file/type (get-attr "type")}))
      (p/rejected "File not exists")))
  (open-dir [this ok-handler]
    (utils/openDirectory #js {:recursive true}
                         ok-handler))
  (get-files [this path-or-handle ok-handler]
    (utils/getFiles path-or-handle true ok-handler))

  ;; TODO:
  (watch-dir! [this dir]
    nil))
