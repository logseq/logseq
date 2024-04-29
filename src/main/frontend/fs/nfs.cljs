(ns frontend.fs.nfs
  "Browser File System API based fs implementation.

   Rationale:
   - nfs-file-handles-cache stores all file & directory handle
   - idb stores top-level directory handle
   - readdir/get-files is called by re-index and initial watcher to init all handles"
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
            ["/frontend/utils" :as utils]
            [logseq.graph-parser.util :as gp-util]
            [logseq.common.path :as path]))

;; Cache the file handles in the memory so that
;; the browser will not keep asking permissions.
(defonce nfs-file-handles-cache (atom {}))

(defn- get-nfs-file-handle
  [handle-path]
  (get @nfs-file-handles-cache handle-path))

(defn add-nfs-file-handle!
  [handle-path handle]
  (prn ::DEBUG "add-nfs-file-handle!" handle-path)
  (swap! nfs-file-handles-cache assoc handle-path handle))

(defn remove-nfs-file-handle!
  [handle-path]
  (swap! nfs-file-handles-cache dissoc handle-path))

(defn- nfs-saved-handler
  [repo path file]
  (when-let [last-modified (gobj/get file "lastModified")]
    ;; TODO: extract
    (let [path (if (= \/ (first path))
                 (subs path 1)
                 path)]
      ;; Bad code
      (db/set-file-last-modified-at! repo path last-modified))))

(defn- verify-handle-permission
  [handle read-write?]
  (utils/verifyPermission handle read-write?))

(defn verify-permission
  [repo read-write?]
  (let [repo (or repo (state/get-current-repo))
        repo-dir (config/get-repo-dir repo)
        handle-path (str "handle/" repo-dir)
        handle (get-nfs-file-handle handle-path)]
    (p/then
     (utils/verifyPermission handle read-write?)
     (fn []
       (state/set-state! [:nfs/user-granted? repo] true)
       true))))

(defn check-directory-permission!
  [repo]
  (when (config/local-db? repo)
    (p/let [repo-dir (config/get-repo-dir repo)
            handle-path (str "handle/" repo-dir)
            handle (idb/get-item handle-path)]
      (when handle
        (add-nfs-file-handle! handle-path handle)
        (verify-permission repo true)))))

(defn- contents-matched?
  [disk-content db-content]
  (when (and (string? disk-content) (string? db-content))
    (= (string/trim disk-content) (string/trim db-content))))

(defn- await-permission-granted
  "Guard against File System Access API permission, avoiding early access before granted"
  [repo]
  (if (state/nfs-user-granted? repo)
    (p/resolved true)
    (js/Promise. (fn [resolve reject]
                   (let [timer (atom nil)
                         timer' (js/setInterval (fn []
                                                  (when (state/nfs-user-granted? repo)
                                                    (js/clearInterval @timer)
                                                    (resolve true)))
                                                1000)
                         _ (reset! timer timer')]
                     (js/setTimeout (fn []
                                      (js/clearInterval timer)
                                      (reject false))
                                    100000))))))

(defn await-get-nfs-file-handle
  "for accessing File handle outside, ensuring user granted."
  [repo handle-path]
  (p/do!
   (await-permission-granted repo)
   (get-nfs-file-handle handle-path)))

(defn- readdir-and-reload-all-handles
  "Return list of filenames"
  [root-dir root-handle]
  (p/let [files (utils/getFiles root-handle
                                true
                                (fn [path entry]
                                  (let [handle-path (str "handle/" path)]
                                    ;; Same for all handles here, even for directories and ignored directories(for backing up)
                                    ;; FileSystemDirectoryHandle or FileSystemFileHandle
                                    (when-not (string/includes? path "/.")
                                      (add-nfs-file-handle! handle-path entry)))))]
    (->> files
         (remove  (fn [file]
                    (let [rpath (string/replace-first (.-webkitRelativePath file) (str root-dir "/") "")
                          ext (util/get-file-ext rpath)]
                      (or  (string/blank? rpath)
                           (string/starts-with? rpath ".")
                           (string/starts-with? rpath "logseq/bak")
                           ; (string/starts-with? rpath "logseq/version-files")
                           (not (contains? #{"md" "org" "excalidraw" "edn" "css"} ext))))))
         (map (fn [file]
                (-> (.-webkitRelativePath file)
                    gp-util/path-normalize))))))


(defn- get-files-and-reload-all-handles
  "Return list of file objects"
  [root-dir root-handle]
  (p/let [files (utils/getFiles root-handle
                                true
                                (fn [path entry]
                                  (let [handle-path (str "handle/" path)]
                                    ;; Same for all handles here, even for directories and ignored directories(for backing up)
                                    ;; FileSystemDirectoryHandle or FileSystemFileHandle
                                    (when-not (string/includes? path "/.")
                                      (add-nfs-file-handle! handle-path entry)))))]
    (p/all (->> files
                (remove  (fn [file]
                           (let [rpath (string/replace-first (.-webkitRelativePath file) (str root-dir "/") "")
                                 ext (util/get-file-ext rpath)]
                             (or  (string/blank? rpath)
                                  (string/starts-with? rpath ".")
                                  (string/starts-with? rpath "logseq/bak")
                                  (string/starts-with? rpath "logseq/version-files")
                                  (not (contains? #{"md" "org" "excalidraw" "edn" "css"} ext))))))
                ;; Read out using .text, Promise<string>
                (map (fn [file]
                       (p/let [content (.text file)]
                         {:name        (.-name file)
                          :path        (-> (.-webkitRelativePath file)
                                           gp-util/path-normalize)
                          :mtime       (.-lastModified file)
                          :size        (.-size file)
                          :type        (.-kind (.-handle file))
                          :content     content
                          :file/file   file
                          :file/handle (.-handle file)})))))))

(defrecord ^:large-vars/cleanup-todo Nfs []
  protocol/Fs
  (mkdir! [_this dir]
    (let [dir (path/path-normalize dir)
          parent-dir (path/parent dir)

          parent-handle-path (str "handle/" parent-dir)]
      (-> (p/let [parent-handle (or (get-nfs-file-handle parent-handle-path)
                                    (idb/get-item parent-handle-path))
                  _ (when parent-handle (verify-handle-permission parent-handle true))]
            (when parent-handle
              (p/let [new-dir-name (path/filename dir)
                      new-handle (.getDirectoryHandle ^js parent-handle new-dir-name
                                                      #js {:create true})
                      handle-path (str "handle/" dir)
                      _ (idb/set-item! handle-path new-handle)]
                (add-nfs-file-handle! handle-path new-handle)
                (println "dir created: " dir))))
          (p/catch (fn [error]
                     (js/console.debug "mkdir error: " error ", dir: " dir)
                     (throw error))))))

  (mkdir-recur! [this dir]
    (protocol/mkdir! this dir))

  (readdir [_this dir]
    ;; This method is only used for repo-dir and version-files dir
    ;; There's no Logseq Sync support for nfs. So assume dir is always a repo dir.
    (p/let [repo-url (str "logseq_local_" dir)
            _ (await-permission-granted repo-url)
            handle-path (str "handle/" dir)
            handle (or (get-nfs-file-handle handle-path)
                       (idb/get-item handle-path))
            _ (when handle
                (verify-handle-permission handle true))
            fpaths (if (string/includes? dir "/")
                     (js/console.error "ERROR: unimpl")
                     (readdir-and-reload-all-handles dir handle))]
      fpaths))

  (unlink! [this repo fpath _opts]
    (let [repo-dir (config/get-repo-dir repo)
          filename (path/filename fpath)
          handle-path (str "handle/" fpath)
          recycle-dir (path/path-join repo-dir config/app-name config/recycle-dir)]
      (->
       (p/let [_ (protocol/mkdir! this recycle-dir)
               handle (get-nfs-file-handle handle-path)
               file (.getFile handle)
               content (.text file)

               bak-handle (get-nfs-file-handle (str "handle/" recycle-dir))
               bak-filename (-> (path/relative-path repo-dir fpath)
                                (string/replace "/" "_")
                                (string/replace "\\" "_"))
               file-handle (.getFileHandle ^js bak-handle bak-filename #js {:create true})
               _ (utils/writeFile file-handle content)

               parent-dir (path/parent fpath)
               parent-handle (get-nfs-file-handle (str "handle/" parent-dir))
               _ (when parent-handle
                   (.removeEntry ^js parent-handle filename))]
         (idb/remove-item! handle-path)
         (remove-nfs-file-handle! handle-path))
       (p/catch (fn [error]
                  (log/error :unlink/path {:path fpath
                                           :error error}))))))

  (rmdir! [_this _dir]
    nil)

  (read-file [_this dir path _options]
    (p/let [fpath (path/path-join dir path)
            handle-path (str "handle/" fpath)]
      (p/let [handle (or (get-nfs-file-handle handle-path)
                         (idb/get-item handle-path))
              local-file (and handle (.getFile handle))]
        (and local-file (.text local-file)))))

  (write-file! [_this repo dir path content opts]
    ;; TODO: file backup handling
    (let [fpath (path/path-join dir path)
          ext (util/get-file-ext path)
          file-handle-path (str "handle/" fpath)]
      (p/let [file-handle (get-nfs-file-handle file-handle-path)]
        (if file-handle
          ;; file exist
          (p/let [local-file (.getFile file-handle)
                  disk-content (.text local-file)
                  db-content (db/get-file repo path)
                  contents-matched? (contents-matched? disk-content db-content)]
            (if (and
                 (not (string/blank? db-content))
                 (not (:skip-compare? opts))
                 (not contents-matched?)
                 (not (contains? #{"excalidraw" "edn" "css"} ext))
                 (not (string/includes? path "/.recycle/")))
              (state/pub-event! [:file/not-matched-from-disk path disk-content content])
              (p/let [_ (verify-permission repo true)
                      _ (utils/writeFile file-handle content)
                      file (.getFile file-handle)]
                (when file
                  (db/set-file-content! repo path content)
                  (nfs-saved-handler repo path file)))))
          ;; file no-exist, write via parent dir handle
          (p/let [basename (path/filename fpath)
                  parent-dir (path/parent fpath)
                  parent-dir-handle-path (str "handle/" parent-dir)
                  parent-dir-handle (get-nfs-file-handle parent-dir-handle-path)]

            (if parent-dir-handle
              ;; create from directory handle
              (p/let [file-handle (.getFileHandle ^js parent-dir-handle basename #js {:create true})
                      _  (add-nfs-file-handle! file-handle-path file-handle)
                      file (.getFile file-handle)
                      text (.text file)]
                (if (string/blank? text)
                  (p/let [;; _ (idb/set-item! file-handle-path file-handle)
                          _ (utils/writeFile file-handle content)
                          file (.getFile file-handle)]
                    (when file
                      (nfs-saved-handler repo path file)))
                  (do
                    (notification/show! (str "The file " path " already exists, please append the content if you need it.\n Unsaved content: \n" content)
                                        :warning
                                        false)
                    (state/pub-event! [:file/alter repo path text]))))

              ;; TODO(andelf): Create parent directory and write
              ;; Normally directory are created layer by layer. So it's safe to leave this unimplemented.
              (js/console.error "TODO: can not create directory hierarchy")))))))

  (rename! [this repo old-path new-path]
    (p/let [repo-dir (config/get-repo-dir repo)
            old-rpath (path/relative-path repo-dir old-path)
            new-rpath (path/relative-path repo-dir new-path)
            old-content (protocol/read-file this repo-dir old-rpath nil)
            _ (protocol/write-file! this repo repo-dir new-rpath old-content nil)
            _ (protocol/unlink! this repo old-path nil)]))

  (stat [_this fpath]
    (if-let [handle (get-nfs-file-handle (str "handle/" fpath))]
      (p/let [_ (verify-handle-permission handle true)
              file (.getFile handle)]
        (let [get-attr #(gobj/get file %)]
          {:last-modified-at (get-attr "lastModified")
           :size (get-attr "size")
           :path fpath
           :type (get-attr "type")}))
      (p/rejected "File not exists")))

  (open-dir [_this _dir]
    (p/let [files (utils/openDirectory #js {:recursive true
                                            :mode "readwrite"}
                                       (fn [path entry]
                                         (let [handle-path (str "handle/" path)]
                                           ;; Same all handles here, even for directories and ignored directories(for backing up)
                                           ;; FileSystemDirectoryHandle or FileSystemFileHandle
                                           (when-not (string/includes? path "/.")
                                             (add-nfs-file-handle! handle-path entry)))))
            dir-handle (first files) ;; FileSystemDirectoryHandle
            dir-name (.-name dir-handle)
            files (->> (next files)
                       (remove  (fn [file]
                                  (let [rpath (.-webkitRelativePath file) ;
                                        ; (string/replace-first (.-webkitRelativePath file) (str dir-name "/") "")
                                        ext (util/get-file-ext rpath)]
                                    (or  (string/blank? rpath)
                                         (string/starts-with? rpath ".")
                                         (string/starts-with? rpath "logseq/bak")
                                         (string/starts-with? rpath "logseq/version-files")
                                         (not (contains? #{"md" "org" "excalidraw" "edn" "css"} ext))))))
                       ;; Read out using .text, Promise<string>
                       (map (fn [file]
                              (js/console.log "handle" file)
                              (p/let [content (.text file)]
                                ;; path content size mtime
                                {:name        (.-name file)
                                 :path        (-> (.-webkitRelativePath file)
                                                  gp-util/path-normalize)
                                 :mtime       (.-lastModified file)
                                 :size        (.-size file)
                                 :type        (.-kind (.-handle file))
                                 :content     content
                                 ;; expose the following, they are used by the file system
                                 :file/file   file
                                 :file/handle (.-handle file)}))))
            files (p/all files)]
      (add-nfs-file-handle! (str "handle/" dir-name) dir-handle)
      (idb/set-item! (str "handle/" dir-name) dir-handle)
      {:path dir-name
       :files files}))

  (get-files [_this dir]
    (when (string/includes? dir "/")
      (js/console.error "BUG: get-files(nfs) only accepts repo-dir"))
    (p/let [handle-path (str "handle/" dir)
            handle (get-nfs-file-handle handle-path)
            files (get-files-and-reload-all-handles dir handle)]
      files))

  (watch-dir! [_this _dir _options]
    nil)

  (unwatch-dir! [_this _dir]
    nil))
