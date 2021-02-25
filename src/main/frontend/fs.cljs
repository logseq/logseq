(ns frontend.fs
  (:require [frontend.util :as util :refer-macros [profile]]
            [frontend.config :as config]
            [clojure.string :as string]
            [promesa.core :as p]
            [lambdaisland.glogi :as log]
            [frontend.fs.protocol :as protocol]
            [frontend.fs.nfs :as nfs]
            [frontend.fs.bfs :as bfs]
            [frontend.fs.node :as node]
            [frontend.db :as db]
            [cljs-bean.core :as bean]
            [frontend.state :as state]
            [frontend.encrypt :as encrypt]))

(defonce nfs-record (nfs/->Nfs))
(defonce bfs-record (bfs/->Bfs))
(defonce node-record (node/->Node))

(defn local-db?
  [dir]
  (and (string? dir)
       (config/local-db? (subs dir 1))))

(defn get-fs
  [dir]
  (let [bfs-local? (or (string/starts-with? dir "/local")
                       (string/starts-with? dir "local"))
        current-repo (state/get-current-repo)
        git-repo? (and current-repo
                       (string/starts-with? current-repo "https://"))]
    (cond
      (and (util/electron?) (not bfs-local?) (not git-repo?))
      node-record

      (local-db? dir)
      nfs-record

      :else
      bfs-record)))

(defn mkdir!
  [dir]
  (protocol/mkdir! (get-fs dir) dir))

(defn readdir
  [dir]
  (protocol/readdir (get-fs dir) dir))

(defn unlink!
  [path opts]
  (protocol/unlink! (get-fs path) path opts))

(defn rmdir!
  "Remove the directory recursively.
   Warning: only run it for browser cache."
  [dir]
  (protocol/rmdir! (get-fs dir) dir))

(defn write-file!
  [repo dir path content opts]
  (when content
    (let [fs-record (get-fs dir)]
      (p/let [metadata-or-css? (or (string/ends-with? path config/metadata-file)
                                  (string/ends-with? path config/custom-css-file))
             content (if metadata-or-css? content (encrypt/encrypt content))]
       (->
        (p/let [_ (protocol/write-file! (get-fs dir) repo dir path content opts)]
          (when (= bfs-record fs-record)
            (db/set-file-last-modified-at! repo (config/get-file-path repo path) (js/Date.))))
        (p/catch (fn [error]
                   (log/error :file/write-failed {:dir dir
                                                  :path path
                                                  :error error})
                   ;; Disable this temporarily
                   ;; (js/alert "Current file can't be saved! Please copy its content to your local file system and click the refresh button.")
                   )))))))

(defn read-file
  ([dir path]
   (let [fs (get-fs dir)
         options (if (= fs bfs-record)
                   {:encoding "utf8"}
                   {})]
     (read-file dir path options)))
  ([dir path options]
   (p/chain (protocol/read-file (get-fs dir) dir path options)
            encrypt/decrypt)))

(defn rename!
  [repo old-path new-path]
  (cond
    ; See https://github.com/isomorphic-git/lightning-fs/issues/41
    (= old-path new-path)
    (p/resolved nil)

    :else
    (protocol/rename! (get-fs old-path) repo old-path new-path)))

(defn stat
  [dir path]
  (protocol/stat (get-fs dir) dir path))

(defn open-dir
  [ok-handler]
  (let [record (if (util/electron?) node-record nfs-record)]
    (p/let [result (protocol/open-dir record ok-handler)]
      (if (util/electron?)
        (let [[dir & paths] (bean/->clj result)]
          [(:path dir) paths])
        result))))

(defn get-files
  [path-or-handle ok-handler]
  (let [record (if (util/electron?) node-record nfs-record)]
    (p/let [result (protocol/get-files record path-or-handle ok-handler)]
      (if (util/electron?)
        (let [result (bean/->clj result)]
          (rest result))
        result))))

(defn watch-dir!
  [dir]
  (protocol/watch-dir! node-record dir))

(defn mkdir-if-not-exists
  [dir]
  (->
   (when dir
     (util/p-handle
      (stat dir nil)
      (fn [_stat])
      (fn [error]
        (mkdir! dir))))
   (p/catch (fn [_error] nil))))

(defn create-if-not-exists
  ([repo dir path]
   (create-if-not-exists repo dir path ""))
  ([repo dir path initial-content]
   (let [path (if (util/starts-with? path "/")
                path
                (str "/" path))]
     (->
      (p/let [stat (stat dir path)]
        true)
      (p/catch
       (fn [_error]
         (p/let [_ (write-file! repo dir path initial-content nil)]
           false)))))))

(defn file-exists?
  [dir path]
  (util/p-handle
   (stat dir path)
   (fn [_stat] true)
   (fn [_e] false)))
