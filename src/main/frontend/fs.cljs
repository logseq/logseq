(ns frontend.fs
  (:require [frontend.util :as util]
            [frontend.config :as config]
            [clojure.string :as string]
            [frontend.idb :as idb]
            [promesa.core :as p]
            [goog.object :as gobj]
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

;; TODO:
;; We need to support several platforms:
;; 1. Chrome native file system API (lighting-fs wip)
;; 2. IndexedDB (lighting-fs)
;; 3. NodeJS
#_(defprotocol Fs
    (mkdir! [this dir])
    (readdir! [this dir])
    (unlink! [this path opts])
    (rename! [this old-path new-path])
    (rmdir! [this dir])
    (read-file [dir path option])
    (write-file! [dir path content])
    (stat [dir path]))

(defn local-db?
  [dir]
  (and (string? dir)
       (config/local-db? (subs dir 1))))

(defn mkdir
  [dir]
  (cond
    (local-db? dir)
    (let [[root new-dir] (rest (string/split dir "/"))
          root-handle (str "handle/" root)]
      (p/let [handle (idb/get-item root-handle)]
        (when (and handle new-dir
                   (not (string/blank? new-dir)))
          (-> (p/let [handle (.getDirectoryHandle ^js handle new-dir
                                                  #js {:create true})
                      handle-path (str root-handle "/" new-dir)
                      _ (idb/set-item! handle-path handle)]
                (add-nfs-file-handle! handle-path handle)
                (println "Stored handle: " (str root-handle "/" new-dir)))
              (p/catch (fn [error]
                         (println "mkdir error: " error)
                         (js/console.error error)))))))

    (and dir js/window.pfs)
    (js/window.pfs.mkdir dir)

    :else
    (println (str "mkdir " dir " failed"))))

(defn readdir
  [dir]
  (cond
    (local-db? dir)
    (let [prefix (str "handle/" dir)
          cached-files (keys @nfs-file-handles-cache)]
      (p/resolved
       (->> (filter #(string/starts-with? % (str prefix "/")) cached-files)
            (map (fn [path]
                   (string/replace path prefix ""))))))

    (and dir js/window.pfs)
    (js/window.pfs.readdir dir)

    :else
    nil))

(defn unlink
  [path opts]
  (cond
    (local-db? path)
    (let [[dir basename] (util/get-dir-and-basename path)]
      (p/let [handle (idb/get-item (str "handle" dir))]
        (.removeEntry ^js handle basename)))

    :else
    (js/window.pfs.unlink path opts)))

(defn rmdir
  "Remove the directory recursively."
  [dir]
  (cond
    (local-db? dir)
    nil

    :else
    (js/window.workerThread.rimraf dir)))

(defn read-file
  ([dir path]
   (read-file dir path (clj->js {:encoding "utf8"})))
  ([dir path option]
   (cond
     (local-db? dir)
     nil

     :else
     (js/window.pfs.readFile (str dir "/" path) option))))

(defn write-file
  [dir path content]
  (cond
    (local-db? dir)
    (let [parts (string/split path "/")
          basename (last parts)
          sub-dir (->> (butlast parts)
                       (remove string/blank?)
                       (string/join "/"))
          handle-path (str "handle/"
                           (subs dir 1)
                           (if sub-dir
                             (str "/" sub-dir)))
          handle-path (if (= "/" (last handle-path))
                        (subs handle-path 0 (dec (count handle-path)))
                        handle-path)
          basename-handle-path (str handle-path "/" basename)
          file-handle-cache (get-nfs-file-handle basename-handle-path)]
      (p/let [file-handle (or file-handle-cache (idb/get-item basename-handle-path))]
        (when-not file-handle-cache
          (add-nfs-file-handle! basename-handle-path file-handle))
        (if file-handle
          (utils/writeFile file-handle content)
          ;; create file handle
          (->
           (p/let [handle (idb/get-item handle-path)]
             (if handle
               (p/let [file-handle (.getFileHandle ^js handle basename #js {:create true})
                       _ (idb/set-item! basename-handle-path file-handle)]
                 (utils/writeFile file-handle content))
               (println "Error: directory handle not exists: " handle-path)))
           (p/catch (fn [error]
                      (println "Write local file failed: " {:path path})
                      (js/console.error error)))))))

    js/window.pfs
    (js/window.pfs.writeFile (str dir "/" path) content)

    :else
    nil))

(defn rename
  [old-path new-path]
  (cond
    (local-db? old-path)
    ;; create new file
    ;; delete old file
    (p/let [[dir basename] (util/get-dir-and-basename old-path)
            [_ new-basename] (util/get-dir-and-basename new-path)
            handle (idb/get-item (str "handle" old-path))
            file (.getFile handle)
            content (.text file)
            _ (write-file dir new-basename content)]
      (unlink old-path nil))

    :else
    (js/window.pfs.rename old-path new-path)))

(defn stat
  [dir path]
  (cond
    (local-db? dir)
    (if-let [file (get-nfs-file-handle (str "handle/"
                                              (string/replace-first dir "/" "")
                                              "/"
                                              (string/replace-first path "/" "")))]
      (p/let [file (.getFile file)]
        (let [get-attr #(gobj/get file %)]
          {:file/last-modified-at (get-attr "lastModified")
           :file/size (get-attr "size")
           :file/type (get-attr "type")}))
      (p/rejected "File not exists"))

    :else
    ;; FIXME: same format
    (js/window.pfs.stat (str dir "/" (string/replace-first path "/" "")))))

(defn create-if-not-exists
  ([dir path]
   (create-if-not-exists dir path ""))
  ([dir path initial-content]
   (let [path (if (util/starts-with? path "/")
                path
                (str "/" path))]
     (util/p-handle
      (stat dir path)
      (fn [_stat] true)
      (fn [error]
        (write-file dir path initial-content)
        false)))))

(defn file-exists?
  [dir path]
  (util/p-handle
   (stat dir path)
   (fn [_stat] true)
   (fn [_e] false)))
