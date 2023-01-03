(ns frontend.fs
  "System-component-like ns that provides common file operations for all
  platforms by delegating to implementations of the fs protocol"
  (:require [cljs-bean.core :as bean]
            [frontend.config :as config]
            [frontend.fs.nfs :as nfs]
            [frontend.fs.node :as node]
            [frontend.fs.capacitor-fs :as capacitor-fs]
            [frontend.fs.bfs :as bfs]
            [frontend.mobile.util :as mobile-util]
            [frontend.fs.protocol :as protocol]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]
            [frontend.db :as db]
            [clojure.string :as string]
            [frontend.state :as state]
            [logseq.graph-parser.util :as gp-util]
            [electron.ipc :as ipc]))

(defonce nfs-record (nfs/->Nfs))
(defonce bfs-record (bfs/->Bfs))
(defonce node-record (node/->Node))
(defonce mobile-record (capacitor-fs/->Capacitorfs))

(defn local-db?
  [dir]
  (and (string? dir)
       (config/local-db? (subs dir 1))))

(defn get-fs
  [dir]
  (let [bfs-local? (or (string/starts-with? dir "/local")
                       (string/starts-with? dir "local"))]
    (cond
      (and (util/electron?) (not bfs-local?))
      node-record

      (mobile-util/native-platform?)
      mobile-record

      (local-db? dir)
      nfs-record

      :else
      bfs-record)))

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
                   (map :uri result)
                   result)]
      (if (and (map? (first result)) (:uri (first result)))
        (map #(update % :uri gp-util/path-normalize) result)
        (map gp-util/path-normalize result)))))

(defn unlink!
  "Should move the path to logseq/recycle instead of deleting it."
  [repo path opts]
  (protocol/unlink! (get-fs path) repo path opts))

(defn rmdir!
  "Remove the directory recursively.
   Warning: only run it for browser cache."
  [dir]
  (when-let [fs (get-fs dir)]
    (when (= fs bfs-record)
      (protocol/rmdir! fs dir))))

(defn write-file!
  [repo dir path content opts]
  (when content
    (let [path (gp-util/path-normalize path)
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
               _ (protocol/write-file! (get-fs dir) repo dir path content opts)]
         (when (= bfs-record fs-record)
           (db/set-file-last-modified-at! repo (config/get-file-path repo path) (js/Date.))))
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
         options (if (= fs bfs-record)
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
  [dir path]
  (protocol/stat (get-fs dir) dir path))

(defn- get-record
  []
  (cond
    (util/electron?)
    node-record

    (mobile-util/native-platform?)
    mobile-record

    :else
    nfs-record))

(defn open-dir
  [dir ok-handler]
  (let [record (get-record)]
    (p/let [result (protocol/open-dir record dir ok-handler)]
      (if (or (util/electron?)
              (mobile-util/native-platform?))
        (let [[dir & paths] (bean/->clj result)]
          [(:path dir) paths])
        result))))

(defn get-files
  [path-or-handle ok-handler]
  (let [record (get-record)
        electron? (util/electron?)
        mobile? (mobile-util/native-platform?)]
    (p/let [result (protocol/get-files record path-or-handle ok-handler)]
      (if (or electron? mobile?)
        (let [result (bean/->clj result)]
          (if electron? (rest result) result))
        result))))

(defn watch-dir!
  ([dir] (watch-dir! dir {}))
  ([dir options] (protocol/watch-dir! (get-record) dir options)))

(defn unwatch-dir!
  [dir]
  (protocol/unwatch-dir! (get-record) dir))

(defn mkdir-if-not-exists
  [dir]
  (->
   (when dir
     (util/p-handle
      (stat dir nil)
      (fn [_stat])
      (fn [_error]
        (mkdir! dir))))
   (p/catch (fn [error] (js/console.error error)))))

(defn create-if-not-exists
  ([repo dir path]
   (create-if-not-exists repo dir path ""))
  ([repo dir path initial-content]
   (let [path (if (util/absolute-path? path) path
                  (if (util/starts-with? path "/")
                    path
                    (str "/" path)))]
     (->
      (p/let [_stat (stat dir path)]
        true)
      (p/catch
       (fn [_error]
         (p/let [_ (write-file! repo dir path initial-content nil)]
           false)))))))

(defn file-exists?
  [dir path]
  (util/p-handle
   (stat dir path)
   (fn [stat] (not (nil? stat)))
   (fn [_e] false)))

(defn file-or-href-exists?
  "It not only accept path, but also href (url encoded path)"
  [dir href]
  (p/let [exist? (file-exists? dir href)
          decoded-href   (gp-util/safe-decode-uri-component href)
          decoded-exist? (when (not= decoded-href href)
                           (file-exists? dir decoded-href))]
    (or exist? decoded-exist?)))

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
