(ns frontend.fs
  "System-component-like ns that provides common file operations for all
  platforms by delegating to implementations of the fs protocol"
  (:require [cljs-bean.core :as bean]
            [frontend.config :as config]
            [frontend.fs.nfs :as nfs]
            [frontend.fs.node :as node]
            [frontend.fs.capacitor-fs :as capacitor-fs]
            [frontend.fs.memory-fs :as bfs]
            [frontend.mobile.util :as mobile-util]
            [frontend.fs.protocol :as protocol]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]
            [frontend.db :as db]
            [frontend.fs2.path :as fs2-path]
            [clojure.string :as string]
            [frontend.state :as state]
            [logseq.graph-parser.util :as gp-util]
            [electron.ipc :as ipc]))

(defonce nfs-backend (nfs/->Nfs))
(defonce memory-backend (bfs/->Bfs))
(defonce node-backend (node/->Node))
(defonce mobile-backend (capacitor-fs/->Capacitorfs))

(defn local-db?
  [dir]
  (and (string? dir)
       (config/local-db? (subs dir 1))))

(defn get-fs
  [dir]
  (let [bfs-local? (or (string/starts-with? dir "/local")
                       (string/starts-with? dir "local"))]
    (cond
      (string/starts-with? dir "memory://")
      (do
        ; (prn ::debug-using-memory-backend)
        memory-backend)

      (and (util/electron?) (not bfs-local?))
      node-backend

      (mobile-util/native-platform?)
      mobile-backend

      (local-db? dir)
      nfs-backend

      :else
      memory-backend)))

(defn mkdir!
  [dir]
  (protocol/mkdir! (get-fs dir) dir))

(defn mkdir-recur!
  [dir]
  (protocol/mkdir-recur! (get-fs dir) dir))

(defn readdir
  [dir & {:keys [path-only?]}]
  (p/let [result (protocol/readdir (get-fs dir) dir)
          result (bean/->clj result)]
    (let [result (if (and path-only? (map? (first result)))
                   (map :path result)
                   result)]
      (map gp-util/path-normalize result))))

(defn unlink!
  "Should move the path to logseq/recycle instead of deleting it."
  [repo fpath opts]
  (protocol/unlink! (get-fs fpath) repo fpath opts))

(defn rmdir!
  "Remove the directory recursively.
   Warning: only run it for browser cache."
  [dir]
  (when-let [fs (get-fs dir)]
    (when (= fs memory-backend)
      (protocol/rmdir! fs dir))))

;; TODO(andelf): distingush from graph file writing and global file write
(defn write-file!
  [repo dir rpath content opts]
  (when content
    (let [path (gp-util/path-normalize rpath)
          fs-record (get-fs dir)]
      (->
       (p/let [opts (assoc opts
                           :error-handler
                           (fn [error]
                             (state/pub-event! [:capture-error {:error error
                                                                :payload {:type :write-file/failed
                                                                          :fs (type fs-record)
                                                                          :user-agent (when js/navigator js/navigator.userAgent)
                                                                          :content-length (count content)}}])))
               _ (protocol/write-file! (get-fs dir) repo dir path content opts)])
       (p/catch (fn [error]
                  (log/error :file/write-failed {:dir dir
                                                 :path path
                                                 :error error})
                  ;; Disable this temporarily
                  ;; (js/alert "Current file can't be saved! Please copy its content to your local file system and click the refresh button.")
                  ))))))

(defn read-file
  ([dir path]
   (let [fs (get-fs dir)
         options (if (= fs memory-backend)
                   {:encoding "utf8"}
                   {})]
     (read-file dir path options)))
  ([dir path options]
   (protocol/read-file (get-fs dir) dir path options)))

(defn rename!
  [repo old-path new-path]
  (let [new-path (gp-util/path-normalize new-path)]
    (cond
                                        ; See https://github.com/isomorphic-git/lightning-fs/issues/41
      (= old-path new-path)
      (p/resolved nil)

      :else
      (let [[old-path new-path]
            (map #(if (or (util/electron?) (mobile-util/native-platform?))
                    %
                    (str (config/get-repo-dir repo) "/" %))
                 [old-path new-path])]
        (protocol/rename! (get-fs old-path) repo old-path new-path)))))

(defn copy!
  [repo old-path new-path]
  (cond
    (= old-path new-path)
    (p/resolved nil)

    :else
    (let [[old-path new-path]
          (map #(if (or (util/electron?) (mobile-util/native-platform?))
                  %
                  (str (config/get-repo-dir repo) "/" %))
               [old-path new-path])]
      (protocol/copy! (get-fs old-path) repo old-path new-path))))

(defn stat
  ([fpath]
   (protocol/stat (get-fs fpath) fpath))
  ([dir path]
   (let [fpath (fs2-path/path-join dir path)]
     (protocol/stat (get-fs dir) fpath))))

(defn- get-native-backend
  "Native FS backend of current platform"
  []
  (cond
    (util/electron?)
    node-backend

    (mobile-util/native-platform?)
    mobile-backend

    :else
    nfs-backend))

(defn open-dir
  [dir ok-handler]
  (let [record (get-native-backend)]
    (p/let [result (protocol/open-dir record dir ok-handler)]
      (if (or (util/electron?)
              (mobile-util/native-platform?))
        (let [{:keys [path files]} result
              dir path
              _ (prn ::open-dir dir)
              files (mapv (fn [entry]
                            (assoc entry :path (fs2-path/relative-path dir (:path entry))))
                          files)]
          (prn :got files)
          {:path dir :files files})
        result))))

(defn list-files
  "List all files in the directory, recursively.
   {:path :files []}"
  [path-or-handle ok-handler]
  (let [fs-record (get-native-backend)]
    (when ok-handler
      (js/console.warn "ok-handler not nil"))
    (p/let [result (protocol/list-files fs-record path-or-handle ok-handler)]
      (prn ::list-files (first result) "....")
      (if (or (util/electron?)
              (mobile-util/native-platform?))
        (let [files result ;; TODO(andelf): rm first item from electron
              dir path-or-handle
              _ (prn ::prepare-rel-path dir)
              files (mapv (fn [entry]
                            ;; (prn ::xx entry)
                            (assoc entry :path (fs2-path/relative-path dir (:path entry))))
                          files)]
          (prn :got files)
          {:path dir :files files})
        result))))

(defn watch-dir!
  ([dir] (watch-dir! dir {}))
  ([dir options] (protocol/watch-dir! (get-fs dir) dir options)))

(defn unwatch-dir!
  [dir]
  (protocol/unwatch-dir! (get-fs dir) dir))

(defn mkdir-if-not-exists
  [dir]
  (->
   (when dir
     (util/p-handle
      (stat dir)
      (fn [_stat])
      (fn [_error]
        (mkdir! dir))))
   (p/catch (fn [error] (js/console.error error)))))

(defn create-if-not-exists
  ([repo dir path]
   (create-if-not-exists repo dir path ""))
  ([repo dir path initial-content]
   (-> (p/let [_stat (stat dir path)]
         true)
       (p/catch
        (fn [_error]
          (p/let [_ (write-file! repo dir path initial-content nil)]
            false))))))

(defn file-exists?
  [dir path]
  (util/p-handle
   (stat dir path)
   (fn [stat] (not (nil? stat)))
   (fn [_e] false)))

(defn asset-href-exists?
  "href is from `make-asset-url`, so it's most likely a full-path"
  [href]
  (p/let [repo-dir (config/get-repo-dir (state/get-current-repo))
          rpath (fs2-path/relative-path repo-dir href)
          exist? (file-exists? repo-dir rpath)]
    (prn ::href-exists href exist?)
    exist?))

(defn dir-exists?
  [dir]
  (file-exists? dir ""))

(defn backup-db-file!
  [repo path db-content disk-content]
  (cond
    (util/electron?)
    (ipc/ipc "backupDbFile" (config/get-local-dir repo) path db-content disk-content)

    (mobile-util/native-platform?)
    (capacitor-fs/backup-file repo :backup-dir path db-content)

    ;; TODO: nfs
    ))
