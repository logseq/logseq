(ns ^:no-doc frontend.fs.nfs
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

(defn- contents-matched?
  [disk-content db-content]
  (when (and (string? disk-content) (string? db-content))
    (p/resolved (= (string/trim disk-content) (string/trim db-content)))))

(defrecord ^:large-vars/cleanup-todo Nfs []
  protocol/Fs
  (mkdir! [_this dir]
    (let [parts (->> (string/split dir "/")
                     (remove string/blank?))
          root (->> (butlast parts)
                    (string/join "/"))
          new-dir (last parts)
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

  (readdir [_this dir]
    (let [prefix (str "handle/" dir)
          cached-files (keys @nfs-file-handles-cache)]
      (p/resolved
       (->> (filter #(string/starts-with? % (str prefix "/")) cached-files)
            (map (fn [path]
                   (string/replace path prefix "")))))))

  (unlink! [this repo path _opts]
    (let [[dir basename] (util/get-dir-and-basename path)
          handle-path (str "handle" path)]
      (->
       (p/let [recycle-dir (str "/" repo (util/format "/%s/%s" config/app-name config/recycle-dir))
               _ (protocol/mkdir! this recycle-dir)
               handle (idb/get-item handle-path)
               file (.getFile handle)
               content (.text file)
               handle (idb/get-item (str "handle" dir))
               _ (idb/remove-item! handle-path)
               file-name (-> (string/replace path (str "/" repo "/") "")
                             (string/replace "/" "_")
                             (string/replace "\\" "_"))
               new-path (str recycle-dir "/" file-name)
               _ (protocol/write-file! this repo
                                       "/"
                                       new-path
                                       content nil)]
         (when handle
           (.removeEntry ^js handle basename))
         (remove-nfs-file-handle! handle-path))
       (p/catch (fn [error]
                  (log/error :unlink/path {:path path
                                           :error error}))))))

  (rmdir! [_this _dir]
    ;; TOO dangerious, we should never implement this
    nil)

  (read-file [_this dir path _options]
    (let [handle-path (str "handle" dir "/" path)]
      (p/let [handle (idb/get-item handle-path)
              local-file (and handle (.getFile handle))]
        (and local-file (.text local-file)))))

  (write-file! [_this repo dir path content opts]
    (let [parts (string/split path "/")
          basename (last parts)
          sub-dir (->> (butlast parts)
                       (remove string/blank?)
                       (string/join "/"))
          sub-dir-handle-path (str "handle/"
                                   (subs dir 1)
                                   (when sub-dir
                                     (str "/" sub-dir)))
          handle-path (if (= "/" (last sub-dir-handle-path))
                        (subs sub-dir-handle-path 0 (dec (count sub-dir-handle-path)))
                        sub-dir-handle-path)
          handle-path (string/replace handle-path "//" "/")
          basename-handle-path (str handle-path "/" basename)]
      (p/let [file-handle (idb/get-item basename-handle-path)]
        ;; check file-handle available, remove it when got 'NotFoundError'
        (p/let [test-get-file (when file-handle
                                (p/catch (p/let [_ (.getFile file-handle)] true)
                                         (fn [e]
                                           (js/console.dir e)
                                           (when (= "NotFoundError" (.-name e))
                                             (idb/remove-item! basename-handle-path)
                                             (remove-nfs-file-handle! basename-handle-path))
                                           false)))
                file-handle (if test-get-file file-handle nil)]

          (when file-handle
            (add-nfs-file-handle! basename-handle-path file-handle))
          (if file-handle
            (-> (p/let [local-file (.getFile file-handle)
                        local-content (.text local-file)
                        ext (string/lower-case (util/get-file-ext path))
                        db-content (db/get-file repo path)
                        contents-matched? (contents-matched? local-content (or db-content ""))]
                  (when local-content
                    (if (and
                         (not (string/blank? db-content))
                         (not (:skip-compare? opts))
                         (not contents-matched?)
                         (not (contains? #{"excalidraw" "edn" "css"} ext))
                         (not (string/includes? path "/.recycle/")))
                      (state/pub-event! [:file/not-matched-from-disk path local-content content])
                      (p/let [_ (verify-permission repo file-handle true)
                              _ (utils/writeFile file-handle content)
                              file (.getFile file-handle)]
                        (when file
                          (db/set-file-content! repo path content)
                          (nfs-saved-handler repo path file))))))
                (p/catch (fn [e]
                           (js/console.error e))))
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
                     (do
                       (notification/show! (str "The file " path " already exists, please append the content if you need it.\n Unsaved content: \n" content)
                                          :warning
                                          false)
                       (state/pub-event! [:file/alter repo path text]))))
                 (println "Error: directory handle not exists: " handle-path)))
             (p/catch (fn [error]
                        (println "Write local file failed: " {:path path})
                        (js/console.error error)))))))))

  (rename! [this repo old-path new-path]
    (p/let [parts (->> (string/split new-path "/")
                       (remove string/blank?))
            dir (str "/" (first parts))
            new-path (->> (rest parts)
                          (string/join "/"))
            handle (idb/get-item (str "handle" old-path))
            file (.getFile handle)
            content (.text file)
            _ (protocol/write-file! this repo dir new-path content nil)]
      (protocol/unlink! this repo old-path nil)))
  (stat [_this dir path]
    (if-let [file (get-nfs-file-handle (str "handle/"
                                            (string/replace-first dir "/" "")
                                            path))]
      (p/let [file (.getFile file)]
        (let [get-attr #(gobj/get file %)]
          {:file/last-modified-at (get-attr "lastModified")
           :file/size (get-attr "size")
           :file/type (get-attr "type")}))
      (p/rejected "File not exists")))
  (open-dir [_this _dir ok-handler]
    (utils/openDirectory #js {:recursive true}
                         ok-handler))
  (get-files [_this path-or-handle ok-handler]
    (utils/getFiles path-or-handle true ok-handler))

  (watch-dir! [_this _dir _options]
    nil)

  (unwatch-dir! [_this _dir]
    nil))
