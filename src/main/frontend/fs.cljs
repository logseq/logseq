(ns frontend.fs
  "System-component-like ns that provides common file operations for all
  platforms by delegating to implementations of the fs protocol"
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.fs.memory-fs :as memory-fs]
            [frontend.fs.node :as node]
            [frontend.fs.protocol :as protocol]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [logseq.common.path :as path]
            [logseq.common.util :as common-util]
            [promesa.core :as p]))

(defonce memory-backend (memory-fs/->MemoryFs))
(defonce node-backend (node/->Node))

(defn- get-native-backend
  "Native FS backend of current platform"
  []
  (when (util/electron?)
    node-backend))

(defn get-fs
  [dir & {:keys [repo rpath]}]
  (let [repo (or repo (state/get-current-repo))
        bfs-local? (and dir
                        (or (string/starts-with? dir (str "/" config/demo-repo))
                            (string/starts-with? dir config/demo-repo)))
        db-assets? (and
                    (config/db-based-graph? repo)
                    rpath
                    (string/starts-with? rpath "assets/"))]
    (cond
      (and db-assets? (util/electron?))
      node-backend

      db-assets?
      memory-backend

      (nil? dir) ;; global file op, use native backend
      (get-native-backend)

      (string/starts-with? dir "memory://")
      memory-backend

      (and (util/electron?) (not bfs-local?))
      node-backend

      :else
      (throw (ex-info "failed to get fs backend" {:dir dir :repo repo :rpath rpath})))))

(defn mkdir!
  [dir]
  (protocol/mkdir! (get-fs dir) dir))

(defn mkdir-recur!
  [dir]
  (protocol/mkdir-recur! (get-fs dir) dir))

(defn readdir
  "list all absolute paths in dir, absolute"
  [dir & {:keys [path-only?]}]
  (when-not path-only?
    (js/console.error "BUG: (deprecation) path-only? is always true"))
  (p/let [result (protocol/readdir (get-fs dir) dir)
          result (bean/->clj result)]
    (map common-util/path-normalize result)))

(defn unlink!
  "Should move the path to logseq/recycle instead of deleting it."
  [repo fpath opts]
  ;; TODO(andelf): better handle backup here, instead of fs impl
  (protocol/unlink! (get-fs fpath) repo fpath opts))

(defn rmdir!
  "Remove the directory recursively.
   Warning: only run it for browser cache."
  [dir]
  (when-let [fs (get-fs dir)]
    (when (= fs memory-backend)
      (protocol/rmdir! fs dir))))

(defn write-plain-text-file!
  "Use it only for plain-text files, not binary"
  [repo dir rpath content opts]
  (when content
    (let [path (common-util/path-normalize rpath)
          fs-record (get-fs dir {:repo repo
                                 :rpath rpath})]
      (->
       (p/let [opts (assoc opts
                           :error-handler
                           (fn [error]
                             (state/pub-event! [:capture-error {:error error
                                                                :payload {:type :write-file/failed
                                                                          :fs (type fs-record)
                                                                          :user-agent (when js/navigator js/navigator.userAgent)
                                                                          :content-length (count content)}}])))
               _ (protocol/write-file! fs-record repo dir path content opts)])
       (p/catch (fn [error]
                  (log/error :file/write-failed {:dir dir
                                                 :path path
                                                 :error error})
                  ;; Disable this temporarily
                  ;; (js/alert "Current file can't be saved! Please copy its content to your local file system and click the refresh button.")
                  ))))))

;; read-file should return string on all platforms
(defn read-file
  ([dir path]
   (let [fs (get-fs dir)
         options (if (= fs memory-backend)
                   {:encoding "utf8"}
                   {})]
     (read-file dir path options)))
  ([dir path options]
   (protocol/read-file (get-fs dir) dir path options)))

(defn read-file-raw
  [dir path & {:as options}]
  (let [fs (get-fs dir)]
    (protocol/read-file-raw fs dir path options)))

(defn rename!
  "Rename files, incoming relative path, converted to absolute path"
  [repo old-path new-path]
  (let [new-path (common-util/path-normalize new-path)]
    (cond
      ; See https://github.com/isomorphic-git/lightning-fs/issues/41
      (= old-path new-path)
      (p/resolved nil)

      :else
      (let [repo-dir (config/get-repo-dir repo)
            old-fpath (path/path-join repo-dir old-path)
            new-fpath (path/path-join repo-dir new-path)]
        (protocol/rename! (get-fs old-fpath) repo old-fpath new-fpath)))))

(defn stat
  ([fpath]
   (protocol/stat (get-fs fpath) fpath))
  ([dir path]
   (let [fpath (path/path-join dir path)]
     (protocol/stat (get-fs dir) fpath))))

(defn mkdir-if-not-exists
  [dir]
  (when dir
    (util/p-handle
     (stat dir)
     (fn [_stat])
     (fn [_error]
       (mkdir-recur! dir)))))

(defn copy!
  "Only used by Logseq Sync"
  [repo old-path new-path]
  (cond
    (= old-path new-path)
    (p/resolved nil)

    :else
    (let [[old-path new-path]
          (map #(if (util/electron?)
                  %
                  (str (config/get-repo-dir repo) "/" %))
               [old-path new-path])
          new-dir (path/dirname new-path)]
      (p/let [_ (mkdir-if-not-exists new-dir)]
        (protocol/copy! (get-fs old-path) repo old-path new-path)))))

(defn open-dir
  [dir]
  (let [record (get-native-backend)]
    (p/let [result (protocol/open-dir record dir)]
      (when result
        (let [{:keys [path files]} result
              dir path
              files (mapv (fn [entry]
                            (assoc entry :path (path/relative-path dir (:path entry))))
                          files)]
          {:path path :files files})))))

(defn get-files
  "List all files in the directory, recursively.

   Wrap as {:path string :files []}, using relative path"
  [dir]
  (let [fs-record (get-native-backend)]
    (p/let [files (protocol/get-files fs-record dir)]
      (println ::get-files (count files) "files")
      (let [files (mapv (fn [entry]
                          (assoc entry :path (path/relative-path dir (:path entry))))
                        files)]
        {:path dir :files files}))))

(defn watch-dir!
  ([dir] (watch-dir! dir {}))
  ([dir options] (protocol/watch-dir! (get-fs dir) dir options)))

(defn unwatch-dir!
  [dir]
  (protocol/unwatch-dir! (get-fs dir) dir))

;; FIXME: counterintuitive return value
(defn create-if-not-exists
  "Create a file if it doesn't exist. return false on written, true on already exists"
  ([repo dir path]
   (create-if-not-exists repo dir path ""))
  ([repo dir path initial-content]
   (-> (p/let [_stat (stat dir path)]
         true)
       (p/catch
        (fn [_error]
          (p/let [_ (write-plain-text-file! repo dir path initial-content nil)]
            false))))))

(defn file-exists?
  ([fpath]
   (util/p-handle
    (stat fpath)
    (fn [stat'] (not (nil? stat')))
    (fn [_e] false)))
  ([dir path]
   (util/p-handle
    (stat dir path)
    (fn [stat'] (not (nil? stat')))
    (fn [_e] false))))

(defn asset-href-exists?
  "href is from `make-asset-url`, so it's most likely a full-path"
  [href]
  (p/let [repo-dir (config/get-repo-dir (state/get-current-repo))
          rpath (path/relative-path repo-dir href)
          exist? (file-exists? repo-dir rpath)]
    exist?))

(defn asset-path-normalize
  [path]
  (cond
    (util/electron?)
    (path/url-to-path path)

    :else
    path))

(defn dir-exists?
  [dir]
  (file-exists? dir ""))

(defn backup-db-file!
  [repo path db-content disk-content]
  (when (util/electron?)
    (ipc/ipc "backupDbFile" (config/get-local-dir repo) path db-content disk-content)))
