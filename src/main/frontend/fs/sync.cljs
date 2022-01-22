(ns frontend.fs.sync
  (:require [cljs-http.client :as http]
            [cljs-time.core :as t]
            [cljs.core.async :as async :refer [go timeout go-loop offer! poll! chan <! >!]]
            [cljs.core.async.interop :refer [p->c]]
            [clojure.set :as set]
            [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.debug :as debug]
            [frontend.handler.user :as user]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.persist-var :as persist-var]
            [rum.core :as rum]
            [cljs.core.async.impl.channels]))

;;; Commentary
;; file-sync related local files/dirs:
;; - logseq/graphs-txid.edn
;;   this file contains graph-uuid & transaction-id
;;   graph-uuid: the unique identifier of the graph on the server
;;   transaction-id: sync progress of local files
;; - logseq/version-files
;;   downloaded version-files
;; files included by `get-ignore-files` will not be synchronized.
;; files in these `get-monitored-dirs` dirs will be synchronized.
;;
;; sync strategy:
;; - when toggle file-sync on, trigger a full-sync first,
;;   full-sync will compare local-files with remote-files (by md5 & size),
;;   and upload new-added-files to remote server.
;; - full-sync will be triggered after 20min of idle
;; - every 20s will flush local changes, and sync to remote


;; TODO: add some spec validate
;; TODO: use access-token instead of id-token
;; TODO: update-remote-file failed when pagename contains whitespace

(def ws-addr "wss://og96xf1si7.execute-api.us-east-2.amazonaws.com/production?graphuuid=%s")


(def graphs-txid (persist-var/persist-var nil "graphs-txid"))

(defn- update-graphs-txid! [latest-txid graph-uuid repo]
  (persist-var/-reset-value! graphs-txid [graph-uuid latest-txid] repo)
  (persist-var/persist-save graphs-txid))


(defn- ws-stop! [*ws]
  (swap! *ws (fn [o] (assoc o :stop true)))
  (.close (:ws @*ws)))

(defn- ws-listen!*
  [graph-uuid *ws remote-changes-chan]
  (reset! *ws {:ws (js/WebSocket. (util/format ws-addr graph-uuid)) :stop false})
  (set! (.-onopen (:ws @*ws)) #(println (util/format "ws opened: graph '%s'" graph-uuid %)))
  (set! (.-onclose (:ws @*ws)) (fn [e]
                                 (println (util/format "ws close: graph '%s'" graph-uuid e))
                                 (when-not (true? (:stop @*ws))
                                   (go
                                     (timeout 1000)
                                     (println "re-connecting graph" graph-uuid)
                                     (ws-listen!* graph-uuid *ws remote-changes-chan)))))
  (set! (.-onmessage (:ws @*ws)) (fn [e]
                                   (let [data (js->clj (js/JSON.parse (.-data e)) :keywordize-keys true)]
                                     (if-let [v (poll! remote-changes-chan)]
                                       (let [last-txid (:txid v)
                                             current-txid (:txid data)]
                                         (if (> last-txid current-txid)
                                           (offer! remote-changes-chan v)
                                           (offer! remote-changes-chan data)))
                                       (offer! remote-changes-chan data))))))

(defn ws-listen!
  "return channal which output messages from server"
  [graph-uuid *ws]
  (let [remote-changes-chan (chan (async/sliding-buffer 1))]
    (ws-listen!* graph-uuid *ws remote-changes-chan)
    remote-changes-chan))

(defn- get-json-body [body]
  (or (and (map? body) body)
      (or (string/blank? body) nil)
      (js->clj (js/JSON.parse body) :keywordize-keys true)))

(defn- get-resp-json-body [resp]
  (-> resp (:body) (get-json-body)))

(defn- request-once [api-name body token]
  (go
    (let [resp (http/post (str "https://api.logseq.com/file-sync/" api-name)
                          {:oauth-token token
                           :body (js/JSON.stringify (clj->js body))})]
      {:resp (<! resp)
       :api-name api-name
       :body body})))

(defn- request
  ([api-name body token refresh-token-fn] (request api-name body token refresh-token-fn 0))
  ([api-name body token refresh-token-fn retry-count]
   (go
     (let [resp (<! (request-once api-name body token))]
       (if (and
            (= 401 (get-in resp [:resp :status]))
            (= "Unauthorized" (:message (get-json-body (get-in resp [:resp :body])))))
         (do
           (println "will retry after" (min 60000 (* 1000 retry-count)) "ms")
           (<! (timeout (min 60000 (* 1000 retry-count))))
           (let [token (<! (refresh-token-fn))]
             (<! (request api-name body token refresh-token-fn (inc retry-count)))))
         (:resp resp))))))

(defn- remove-dir-prefix [dir path]
  (let [r (string/replace path (js/RegExp. (str "^" dir)) "")]
    (if (string/starts-with? r "/")
      (string/replace-first r "/" "")
      r)))

(defn- remove-user-graph-uuid-prefix
  "<user-uuid>/<graph-uuid>/path -> path"
  [path]
  (let [parts (string/split path "/")]
    (if (and (< 2 (count parts))
               (= 36 (count (parts 0)))
               (= 36 (count (parts 1))))
      (string/join "/" (drop 2 parts))
      path)))

(defprotocol IRelativePath
  (-relative-path [this]))

(defprotocol IStoppable
  (-stop! [this]))
(defprotocol IStopped?
  (-stopped? [this]))
                                        ;from-path, to-path is relative path
(deftype FileTxn [from-path to-path updated deleted txid]
  Object
  (renamed? [_]
    (not= from-path to-path))
  (updated? [_] updated)
  (deleted? [_] deleted)

  IRelativePath
  (-relative-path [_] (remove-user-graph-uuid-prefix to-path))

  IEquiv
  (-equiv [_ ^FileTxn other]
    (and (= from-path (.-from-path other))
         (= to-path (.-to-path other))
         (= updated (.-updated other))
         (= deleted (.-deleted other))))
  IHash
  (-hash [_] (hash [from-path to-path updated deleted]))

  IComparable
  (-compare [_ ^FileTxn other]
    (compare txid (.-txid other)))

  IPrintWithWriter
  (-pr-writer [coll w _opts]
    (write-all w "#FileTxn[\"" from-path "\" -> \"" to-path
               "\" (updated? " updated ", renamed? " (.renamed? coll) ", deleted? " (.deleted? coll)
               ", txid " txid ")]")))

(defn- diff->filetxns
  "convert diff(`get-diff`) to `FileTxn`"
  [{:keys [TXId TXType TXContent]}]
  (let [update? (= "update_files" TXType)
        delete? (= "delete_files" TXType)
        update-or-del-type-xf
        (comp
         (remove empty?)
         (map #(->FileTxn % % update? delete? TXId)))
        filepaths (map js/decodeURIComponent (string/split-lines TXContent))]
    (case TXType
      ("update_files" "delete_files")
      (sequence update-or-del-type-xf filepaths)

      "rename_file"
      (list (->FileTxn (first filepaths) (second filepaths) false false TXId)))))

(defn- distinct-update-filetxns-xf
  "transducer.
  remove duplicate update&delete `FileTxn`s."
  [rf]
  (let [seen-update&delete-filetxns (volatile! #{})]
    (fn
      ([] (rf))
      ([result] (rf result))
      ([result ^FileTxn filetxn]
       (if (and
            (or (.updated? filetxn) (.deleted? filetxn))
            (contains? @seen-update&delete-filetxns filetxn))
         result
         (do (vswap! seen-update&delete-filetxns conj filetxn)
             (rf result filetxn)))))))

(defn- partition-filetxns
  "return transducer.
  partition filetxns, at most N update-filetxns in each partition,
  for delete and rename type, only one filetxn in each partition."
  [n]
  (comp
   (partition-by #(.updated? ^FileTxn %))
   (map (fn [ts]
          (if (some-> (first ts) (.updated?))
            (partition-all n ts)
            (map list ts))))
   cat))

(defn- diffs->partitioned-filetxns
  "return transducer.
  1. diff -> `FileTxn` , see also `get-diff`
  2. distinct redundant update type filetxns
  3. partition filetxns, each partition contains same type filetxns,
     for update type, at most N items in each partition
     for delete & rename type, only 1 item in each partition.
  NOTE: this xf should apply on reversed diffs sequence (sort by txid)"
  [n]
  (comp
    (map diff->filetxns)
    cat
    distinct-update-filetxns-xf
    (partition-filetxns n)))


(deftype FileNotFoundErr [when file])
(deftype FileTxnSet [to-path-file-map seq-id]
  Object
  (rename-file [_ from to]
    (if-let [^FileTxn file (some-> (get to-path-file-map from) (as-> f (and (not (.deleted? f)) f)))]
      (if (.deleted? file)
        (throw (->FileNotFoundErr :rename-file from))
        (let [next-file (.rename file to)]
          (-> to-path-file-map
              (-dissoc (.-to-path file))
              (-conj [to next-file])
              (FileTxnSet. seq-id))))
      (FileTxnSet. (assoc to-path-file-map to (->FileTxn from to false false seq-id)) (inc seq-id))))

  (update-file [_ to]
    (if-let [file (get to-path-file-map to)]
      (let [next-file (.update file)]
        (FileTxnSet. (assoc to-path-file-map to next-file) seq-id))
      (FileTxnSet. (assoc to-path-file-map to (->FileTxn to to true false seq-id)) (inc seq-id))))

  (delete-file [_ to]
    (if-let [file (get to-path-file-map to)]
      (let [next-file (.delete file)]
        (FileTxnSet. (assoc to-path-file-map to next-file) seq-id))
      (FileTxnSet. (assoc to-path-file-map to (->FileTxn to to false true seq-id)) (inc seq-id))))

  ILookup
  (-lookup [coll to-path]
    (-lookup coll to-path nil))
  (-lookup [_ to-path not-found]
    (-lookup to-path-file-map to-path not-found))

  ICollection
  (-conj [_ ^FileTxn v]
    (conj to-path-file-map [(.-to-path v) v]))

  ISet
  (-disjoin [_ ^FileTxn v]
    (FileTxnSet. (-dissoc to-path-file-map (.-to-path v)) seq-id))

  ISeqable
  (-seq [_]
    (some->
     (vals to-path-file-map)
     sort
     seq))

  IPrintWithWriter
  (-pr-writer [_ w opts]
    (if-let [vals (vals to-path-file-map)]
      (-pr-writer vals w opts)
      (write-all w "()"))))

(set! (.-EMPTY FileTxnSet) (FileTxnSet. {} 0))

(deftype FileMetadata [size etag path last-modified remote? ^:mutable normalized-path]
  Object
  (get-normalized-path [_]
    (when-not normalized-path
      (set! normalized-path
            (cond-> path
              (string/starts-with? path "/") (string/replace-first "/" "")
              remote? (remove-user-graph-uuid-prefix))))
    normalized-path)

  IRelativePath
  (-relative-path [_] path)

  IEquiv
  (-equiv [o ^FileMetadata other]
    (and (= size (.-size other))
         (= (.get-normalized-path o) (.get-normalized-path other))
         (= etag (.-etag other))))

  IHash
  (-hash [_] (hash {:size size :etag etag :path path}))

  IPrintWithWriter
  (-pr-writer [_ w _opts]
    (write-all w (str {:size size :etag etag :path path :remote? remote?}))))

(defn- relative-path [o]
  (cond
    (implements? IRelativePath o)
    (-relative-path o)

    (string? o)
    (remove-user-graph-uuid-prefix o)

    :else
    (throw (js/Error. (str "unsupport type " (type o))))))

;;; APIs
;; `RSAPI` call apis through rsapi package, supports operations on files

(defprotocol IRSAPI
  (get-local-files-meta [this graph-uuid base-path filepaths] "get local files' metadata")
  (get-local-all-files-meta [this graph-uuid base-path] "get all local files' metadata")
  (rename-local-file [this graph-uuid base-path from to])
  (update-local-files [this graph-uuid base-path filepaths] "remote -> local")
  (delete-local-files [this graph-uuid base-path filepaths])
  (update-remote-file [this graph-uuid base-path filepath local-txid] "local -> remote, return err or txid")
  (update-remote-files [this graph-uuid base-path filepaths local-txid] "local -> remote, return err or txid")
  (delete-remote-files [this graph-uuid base-path filepaths local-txid] "return err or txid"))

(defprotocol IRemoteAPI
  (get-remote-all-files-meta [this graph-uuid] "get all remote files' metadata")
  (get-remote-files-meta [this graph-uuid filepaths] "get remote files' metadata")
  (get-remote-graph [this graph-name-opt graph-uuid-opt] "get graph info by GRAPH-NAME-OPT or GRAPH-UUID-OPT")
  (get-remote-file-versions [this graph-uuid filepath] "get file's version list")
  (list-remote-graphs [this] "list all remote graphs")
  (get-diff [this graph-uuid from-txid] "get diff from FROM-TXID, return [txns, latest-txid]")
  (create-graph [this graph-name] "create graph"))

(defprotocol IToken
  (get-token [this])
  (refresh-token [this]))

(declare rsapi)
(defn- check-files-exists [base-path file-paths]
  (go
    (let [cause (ex-cause (<! (get-local-files-meta rsapi "" base-path file-paths)))]
      (assert (nil? cause) (str cause base-path file-paths)))))

(defn- check-files-not-exists [base-path file-paths]
  (go
    (let [cause (ex-cause (<! (get-local-files-meta rsapi "" base-path file-paths)))]
      (assert (some? cause)))))

(defn- retry-rsapi [f]
  (go-loop [n 3]
    (let [r (<! (f))]
      (if (and (instance? ExceptionInfo r)
               (string/index-of (str (ex-cause r)) "operation timed out")
               (> n 0))
        (do
          (prn (str "retry(" n ") ..."))
          (recur (dec n)))
        r))))

(deftype RSAPI []
  IToken
  (get-token [this]
    (go
      (or (state/get-auth-id-token)
          (<! (.refresh-token this)))))
  (refresh-token [_]
    (go
      (<! (user/refresh-id-token&access-token))
      (state/get-auth-id-token)))
  IRSAPI
  (get-local-all-files-meta [_ graph-uuid base-path]
    (go
      (let [r (<! (retry-rsapi #(p->c (ipc/ipc "get-local-all-files-meta" graph-uuid base-path))))]
        (if (instance? ExceptionInfo r)
          r
          (->> r
               js->clj
               (map (fn [[path metadata]]
                      (->FileMetadata (get metadata "size") (get metadata "md5") path nil false nil)))
               set)))))
  (get-local-files-meta [_ graph-uuid base-path filepaths]
    (go
      (let [r (<! (retry-rsapi #(p->c (ipc/ipc "get-local-files-meta" graph-uuid base-path filepaths))))]
        (if (instance? ExceptionInfo r)
          r
          (->> r
               js->clj
               (map (fn [[path metadata]]
                      (->FileMetadata (get metadata "size") (get metadata "md5") path nil false nil))))))))
  (rename-local-file [_ graph-uuid base-path from to]
    (retry-rsapi #(p->c (ipc/ipc "rename-local-file" graph-uuid base-path from to))))
  (update-local-files [this graph-uuid base-path filepaths]
    (println "update-local-files" graph-uuid base-path filepaths)
    (go
      (let [token (<! (get-token this))
            r (<! (retry-rsapi
                   #(p->c (ipc/ipc "update-local-files" graph-uuid base-path filepaths token))))]
        (when (state/developer-mode?) (check-files-exists base-path filepaths))
        r)))

  (delete-local-files [_ graph-uuid base-path filepaths]
    (go
      (let [r (<! (retry-rsapi #(p->c (ipc/ipc "delete-local-files" graph-uuid base-path filepaths))))]
        (when (state/developer-mode?) (check-files-not-exists base-path filepaths))
        r)))

  (update-remote-file [this graph-uuid base-path filepath local-txid]
    (go
      (let [token (<! (get-token this))]
        (<! (retry-rsapi
             #(p->c (ipc/ipc "update-remote-file" graph-uuid base-path filepath local-txid token)))))))

  (update-remote-files [this graph-uuid base-path filepaths local-txid]
    (go
      (let [token (<! (get-token this))]
        (<! (retry-rsapi
             #(p->c (ipc/ipc "update-remote-files" graph-uuid base-path filepaths local-txid token)))))))

  (delete-remote-files [this graph-uuid base-path filepaths local-txid]
    (go
      (let [token (<! (get-token this))]
        (<!
         (retry-rsapi
          #(p->c (ipc/ipc "delete-remote-files" graph-uuid base-path filepaths local-txid token))))))))


(def rsapi (->RSAPI))

(deftype RemoteAPI []
  Object

  (request [this api-name body]
    (go
      (let [resp (<! (request api-name body (<! (get-token this)) #(refresh-token this)))]
        (if (http/unexceptional-status? (:status resp))
          (get-resp-json-body resp)
          (ex-info "request failed"
                   {:err resp :body (get-resp-json-body resp)})))))

  ;; for test
  (update-files [this graph-uuid txid files]
    {:pre [(map? files)
           (number? txid)]}
    (.request this "update_files" {:GraphUUID graph-uuid :TXId txid :Files files}))

  IToken
  (get-token [this]
    (go
      (or (state/get-auth-id-token)
          (<! (refresh-token this)))))
  (refresh-token [_]
    (go
      (<! (user/refresh-id-token&access-token))
      (state/get-auth-id-token)))

  IRemoteAPI
  (get-remote-all-files-meta [this graph-uuid]
    (go
      (let [r (<! (.request this "get_all_files" {:GraphUUID graph-uuid}))]
        (if (instance? ExceptionInfo r)
          r
          (into #{} (map
                     #(->FileMetadata (:Size %)
                                      (:ETag %)
                                      (remove-user-graph-uuid-prefix (js/decodeURIComponent (:Key %)))
                                      (:LastModified %)
                                      true nil))
                (:Objects r))))))

  (get-remote-files-meta [this graph-uuid filepaths]
    {:pre [(coll? filepaths)]}
    (go
      (let [encoded-filepaths (map js/encodeURIComponent filepaths)
            r (<! (.request this "get_files_meta" {:GraphUUID graph-uuid :Files encoded-filepaths}))]
        (if (instance? ExceptionInfo r)
          r
          (into #{}
                (map #(->FileMetadata (:Size %)
                                      (:ETag %)
                                      (js/decodeURIComponent (:FilePath %))
                                      (:LastModified %)
                                      true nil))
                (:Files r))))))

  (get-remote-graph [this graph-name-opt graph-uuid-opt]
    {:pre [(or graph-name-opt graph-uuid-opt)]}
    (.request this "get_graph" (cond-> {}
                                 (seq graph-name-opt)
                                 (assoc :GraphName graph-name-opt)
                                 (seq graph-uuid-opt)
                                 (assoc :GraphUUID graph-uuid-opt))))
  (get-remote-file-versions [this graph-uuid filepath]
    (.request this "get_file_version_list" {:GraphUUID graph-uuid :File (js/encodeURIComponent filepath)}))
  (list-remote-graphs [this]
    (.request this "list_graphs"))

  (get-diff [this graph-uuid from-txid]
    ;; TODO: path in transactions should be relative path(now s3 key, which includes graph-uuid and user-uuid)
    (go
      (let [r (<! (.request this "get_diff" {:GraphUUID graph-uuid :FromTXId from-txid}))]
        (if (instance? ExceptionInfo r)
          r
          (-> r :Transactions (as-> txns [txns (:TXId (last txns))]))))))

  (create-graph [this graph-name]
    (.request this "create_graph" {:GraphName graph-name})))

(def remoteapi (->RemoteAPI))

(defn- apply-filetxns
  [graph-uuid base-path filetxns]
  (cond
    (.renamed? (first filetxns))
    (let [filetxn (first filetxns)]
      (assert (= 1 (count filetxns)))
      (rename-local-file rsapi graph-uuid base-path
                         (relative-path (.-from-path filetxn))
                         (relative-path (.-to-path filetxn))))

    (.updated? (first filetxns))
    (update-local-files rsapi graph-uuid base-path (map relative-path filetxns))

    (.deleted? (first filetxns))
    (let [filetxn (first filetxns)]
      (assert (= 1 (count filetxns)))
      (go
        (let [r (<! (delete-local-files rsapi graph-uuid base-path [(relative-path filetxn)]))]
          (if (and (instance? ExceptionInfo r)
                   (string/index-of (str (ex-cause r)) "No such file or directory"))
            true
            r))))))

(defn- apply-filetxns-partitions [^SyncState sync-state graph-uuid base-path filetxns-partitions repo *txid *stopped]
  (go-loop [filetxns-partitions* filetxns-partitions]
    (if @*stopped
      {:stop true}
      (when (seq filetxns-partitions*)
        (let [filetxns (first filetxns-partitions*)
              paths (map relative-path filetxns)
              _ (. sync-state (add-current-remote->local-files! paths))
              r (<! (apply-filetxns graph-uuid base-path filetxns))
              _ (. sync-state (remove-current-remote->local-files! paths))]
          (if (instance? ExceptionInfo r)
            r
            (let [latest-txid (apply max (map #(.-txid ^FileTxn %) filetxns))]
              (reset! *txid latest-txid)
              (update-graphs-txid! latest-txid graph-uuid repo)
              (recur (next filetxns-partitions*)))))))))

(defmulti need-sync-remote? (fn [v] (cond
                                      (= :max v)
                                      :max

                                      (and (vector? v) (number? (first v)))
                                      :txid

                                      (instance? ExceptionInfo v)
                                      :exceptional-response

                                      (instance? cljs.core.async.impl.channels/ManyToManyChannel v)
                                      :chan)))

(defmethod need-sync-remote? :max [_] true)
(defmethod need-sync-remote? :txid [[txid remote->local-syncer]]
  (let [remote-txid txid
        local-txid (.-txid remote->local-syncer)]
    (or (nil? local-txid)
        (> remote-txid local-txid))))

(defmethod need-sync-remote? :exceptional-response [resp]
  (let [data (ex-data resp)
        cause (ex-cause resp)]
    (or
     (and (= (:error data) :promise-error)
          (string/index-of (str cause) "txid_to_validate")) ;FIXME: better rsapi err info
     (= 409 (get-in data [:err :status])))))

(defmethod need-sync-remote? :chan [c]
  (go (need-sync-remote? (<! c))))
(defmethod need-sync-remote? :default [_] false)




;; type = "change" | "add" | "unlink"
(deftype FileChangeEvent [type dir path stat]
  IRelativePath
  (-relative-path [_] (remove-dir-prefix dir path))

  IEquiv
  (-equiv [_ other]
    (and (= dir (.-dir other))
         (= type (.-type other))
         (= path (.-path other))))

  IPrintWithWriter
  (-pr-writer [_ w _opts]
    (write-all w (str {:type type :base-path dir :path path}))))

(defn- partition-file-change-events
  "return transducer.
  partition `FileChangeEvent`s, at most N file-change-events in each partition.
  only one type in a partition."
  [n]
  (comp
   (partition-by (fn [^FileChangeEvent e]
                   (case (.-type e)
                     ("add" "change") :add-or-change
                     "unlink"         :unlink)))
   (map #(partition-all n %))
   cat))

(def local-changes-chan (chan 100))
(defn file-watch-handler
  "file-watcher callback"
  [type {:keys [dir path _content stat] :as _payload}]
  (go
    (when (some-> (state/get-file-sync-state-manager)
                  -stopped?
                  not)
      (>! local-changes-chan (->FileChangeEvent type dir path stat)))))

;;; remote->local syncer & local->remote syncer

(defprotocol IRemote->LocalSync
  (stop-remote->local! [this])
  (sync-remote->local! [this] "return ExceptionInfo when error occurs")
  (sync-remote->local-all-files! [this] "sync all files, return ExceptionInfo when error occurs"))

(defprotocol ILocal->RemoteSync
  (get-ignore-files [this] "ignored-files won't be synced to remote")
  (get-monitored-dirs [this])
  (stop-local->remote! [this])
  (ratelimit [this from-chan] "get watched local file-change events from FROM-CHAN,
  return chan returning events with rate limited")
  (sync-local->remote! [this es] "es is a sequence of `FileChangeEvent`, all items have same type.")
  (sync-local->remote-all-files! [this] "compare all local files to remote ones, sync when not equal.
  if local-txid != remote-txid, return {:need-sync-remote true}"))

(deftype Remote->LocalSyncer [graph-uuid base-path repo *txid ^SyncState sync-state
                              ^:mutable local->remote-syncer *stopped]
  Object
  (set-local->remote-syncer! [_ s] (set! local->remote-syncer s))
  IRemote->LocalSync
  (stop-remote->local! [_] (vreset! *stopped true))
  (sync-remote->local! [_]
    (go
      (let [r
            (let [diff-r (<! (get-diff remoteapi graph-uuid @*txid))]
              (if (instance? ExceptionInfo diff-r)
                diff-r
                (let [[diff-txns latest-txid] diff-r]
                  (when (number? latest-txid)
                    (let [partitioned-filetxns (transduce (diffs->partitioned-filetxns 10)
                                                          (completing (fn [r i] (conj r (reverse i)))) ;reverse
                                                          '()
                                                          (reverse diff-txns))]
                      (prn "partition-filetxns" partitioned-filetxns)
                      ;; TODO: precheck etag
                      (if (empty? (flatten partitioned-filetxns))
                        (do (update-graphs-txid! latest-txid graph-uuid repo)
                            (reset! *txid latest-txid)
                            {:succ true})
                        (<! (apply-filetxns-partitions
                             sync-state graph-uuid base-path partitioned-filetxns repo *txid *stopped))))))))]
        (cond
          (instance? ExceptionInfo r)
          {:unknown r}

          @*stopped
          {:stop true}

          :else
          {:succ true}))))

  (sync-remote->local-all-files! [_] nil))


(defn- file-changed?
  "return true when file changed compared with remote"
  [graph-uuid file-path-without-base-path base-path]
  (go
    (let [remote-meta (first (<! (get-remote-files-meta remoteapi graph-uuid [file-path-without-base-path])))
          local-meta (first (<! (get-local-files-meta rsapi graph-uuid base-path [file-path-without-base-path])))]
      (not= remote-meta local-meta))))

(defn- contains-path? [regexps path]
  (reduce #(when (re-find %2 path) (reduced true)) false regexps))

(deftype Local->RemoteSyncer [graph-uuid base-path repo ^SyncState sync-state
                              ^:mutable rate *txid ^:mutable remote->local-syncer stop-chan ^:mutable stopped]
  Object
  (filter-file-change-events-fn [this]
    (fn [^FileChangeEvent e] (and (instance? FileChangeEvent e)
                                  (string/starts-with? (.-dir e) base-path)
                                  (not (contains-path? (get-ignore-files this) (relative-path e)))
                                  (contains-path? (get-monitored-dirs this) (relative-path e)))))

  (filtered-chan
    ;; "check base-path"
    [this n]
    (chan n (filter (.filter-file-change-events-fn this))))

  (set-remote->local-syncer! [_ s] (set! remote->local-syncer s))

  ILocal->RemoteSync
  (get-ignore-files [_] #{#"logseq/graphs-txid.edn$" #"logseq/bak/.*" #"version-files/.*" #"logseq/\.recycle/.*"
                          #"\.DS_Store$"})
  (get-monitored-dirs [_] #{#"^assets/" #"^journals/" #"^logseq/" #"^pages/"})
  (stop-local->remote! [_]
    (async/close! stop-chan)
    (set! stopped true))

  (ratelimit [this from-chan]
    (let [c (.filtered-chan this 10000)
          filter-e-fn (.filter-file-change-events-fn this)]
      (go-loop [timeout-c (timeout rate)
                tcoll (transient [])]
        (let [{:keys [timeout ^FileChangeEvent e stop]}
              (async/alt! timeout-c {:timeout true}
                          from-chan ([e] {:e e})
                          stop-chan {:stop true})]
          (cond
            stop
            (async/close! c)

            timeout
            (do
              (<! (async/onto-chan! c (distinct (persistent! tcoll)) false))
              (recur (async/timeout rate) (transient [])))

            (some? e)
            (do
              (when (filter-e-fn e)
                (if (= "unlink" (.-type e))
                  (conj! tcoll e)
                  (if (<! (file-changed? graph-uuid (relative-path e) base-path))
                    (conj! tcoll e)
                    (prn "file unchanged" (relative-path e)))))
              (recur timeout-c tcoll))

            (nil? e)
            (do
              (println "close ratelimit chan")
              (async/close! c)))))
      c))

  (sync-local->remote! [this es]
    (if (empty? es)
      {:succ true}
      (let [type (.-type ^FileChangeEvent (first es))
            ignore-files (get-ignore-files this)
            es->paths-xf (comp
                          (map #(relative-path %))
                          (filter #(not (contains-path? ignore-files %))))
            paths (sequence es->paths-xf es)]
        (println "sync-local->remote" paths)
        (let [r (case type
                  ("add" "change")
                  (update-remote-files rsapi graph-uuid base-path paths @*txid)

                  "unlink"
                  (delete-remote-files rsapi graph-uuid base-path paths @*txid))]
          (go
            (let [_ (.add-current-local->remote-files! sync-state paths)
                  r* (<! r)
                  _ (.remove-current-local->remote-files! sync-state paths)]
              (cond
                (need-sync-remote? r*)
                {:need-sync-remote true}

                (number? r*)            ; succ
                (do
                  (println "sync-local->remote! update txid" r*)
                  ;; persist txid
                  (update-graphs-txid! r* graph-uuid repo)
                  (reset! *txid r*)
                  {:succ true})

                :else
                (do
                  (println "sync-local->remote unknown:" r*)
                  {:unknown r*}))))))))

  (sync-local->remote-all-files! [this]
    (go
      (let [remote-all-files-meta-c (get-remote-all-files-meta remoteapi graph-uuid)
            local-all-files-meta-c (get-local-all-files-meta rsapi graph-uuid base-path)
            remote-all-files-meta (<! remote-all-files-meta-c)
            local-all-files-meta (<! local-all-files-meta-c)
            diff-local-files (set/difference local-all-files-meta remote-all-files-meta)
            ignore-files (get-ignore-files this)
            monitored-dirs (get-monitored-dirs this)
            change-events-partitions
            (sequence
             (comp
              ;; convert to FileChangeEvent
              (map #(->FileChangeEvent "change" base-path (.get-normalized-path ^FileMetadata %) nil))
              ;; filter ignore-files & monitored-dirs
              (filter #(let [path (relative-path %)]
                         (and (not (contains-path? ignore-files path))
                              (contains-path? monitored-dirs path))))
              ;; partition FileChangeEvents
              (partition-file-change-events 10))
             diff-local-files)]
        (println "[full-sync]" (count (flatten change-events-partitions)) "files need to sync to remote")
        (loop [es-partitions change-events-partitions]
          (if stopped
            {:stop true}
            (if (empty? es-partitions)
              {:succ true}
              (let [{:keys [succ need-sync-remote unknown] :as r}
                    (<! (sync-local->remote! this (first es-partitions)))]
                (cond
                  succ
                  (recur (next es-partitions))

                  (or need-sync-remote unknown) r)))))))))

;;; sync state
(deftype SyncState [^:mutable state ^:mutable current-local->remote-files ^:mutable current-remote->local-files
                    ^:mutable history]
  Object
  (add-to-history [_ fs]
    (let [now (t/now)]
      (->> fs
           (map (fn [p] {:path p :time now}))
           (apply conj history)
           (set! history))))

  (update-state! [_ v]
    (set! state v)
    (state/set-file-sync-state v))
  (add-current-local->remote-files! [_ fs]
    (set! current-local->remote-files (set/union current-local->remote-files (set fs)))
    (state/set-file-sync-uploading-files current-local->remote-files))
  (add-current-remote->local-files! [_ fs]
    (set! current-remote->local-files (set/union current-remote->local-files (set fs)))
    (state/set-file-sync-downloading-files current-remote->local-files))
  (remove-current-local->remote-files! [this fs]
    (set! current-local->remote-files (set/difference current-local->remote-files (set fs)))
    (.add-to-history this fs)
    (state/set-file-sync-uploading-files current-local->remote-files))
  (remove-current-remote->local-files! [this fs]
    (set! current-remote->local-files (set/difference current-remote->local-files (set fs)))
    (.add-to-history this fs)
    (state/set-file-sync-downloading-files current-remote->local-files))
  (reset-current-local->remote-files! [_]
    (set! current-local->remote-files #{})
    (state/set-file-sync-uploading-files current-local->remote-files))
  (reset-current-remote->local-files! [_]
    (set! current-remote->local-files #{})
    (state/set-file-sync-downloading-files current-remote->local-files))

  IStopped?
  (-stopped? [_] (or (nil? state) (= ::stop state)))

  IPrintWithWriter
  (-pr-writer [_ w opts]
    (let [pr-map {:state state
                  :current-uploading-files current-local->remote-files
                  :current-downloading-files current-remote->local-files}]
      (-pr-writer pr-map w opts))))

;;; put all stuff together

(deftype SyncManager [graph-uuid base-path ^SyncState sync-state
                      ^Local->RemoteSyncer local->remote-syncer ^Remote->LocalSyncer remote->local-syncer
                      full-sync-chan stop-sync-chan remote->local-sync-chan local->remote-sync-chan
                      local-changes-chan ^:mutable ratelimit-local-changes-chan
                      *txid ^:mutable state ^:mutable _remote-change-chan ^:mutable _*ws ^:mutable stopped]
  Object
  (schedule [this next-state & args]
    (println "[SyncManager" graph-uuid "]" (and state (name state)) "->" (and next-state (name next-state)))
    (set! state next-state)
    (.update-state! sync-state next-state)
    (go
      (case state
        ::idle
        (<! (.idle this))
        ::local->remote
        (<! (.local->remote this args))
        ::remote->local
        (<! (.remote->local this nil args))
        ::full-sync
        (<! (.full-sync this))
        ::remote->local=>local->remote
        (<! (.remote->local this ::local->remote args))
        ::remote->local=>full-sync
        (<! (.remote->local this ::full-sync args))
        ::stop
        (-stop! this))))

  (start [this]
    (set! _*ws (atom nil))
    (set! _remote-change-chan (ws-listen! graph-uuid _*ws))
    (set! ratelimit-local-changes-chan (ratelimit local->remote-syncer local-changes-chan))
    (.schedule this ::idle))

  (idle [this]
    (go
      (let [{:keys [stop full-sync ;; trigger-remote trigger-local
                    remote local trigger-full-sync]}
            (async/alt!
              stop-sync-chan {:stop true}
              full-sync-chan {:full-sync true}
              remote->local-sync-chan {:trigger-remote true}
              local->remote-sync-chan {:trigger-local true}
              _remote-change-chan ([v] (println "remote changes:" v) {:remote v})
              ratelimit-local-changes-chan ([v] (println "local changes:" v) {:local v})
              (timeout (* 20 60 1000)) {:trigger-full-sync true}
              :priority true)]
        (cond
          stop
          (<! (.schedule this ::stop))
          (or full-sync trigger-full-sync)
          (<! (.schedule this ::full-sync))
          remote
          (<! (.schedule this ::remote->local remote))
          local
          (<! (.schedule this ::local->remote local))))))

  (full-sync [this]
    (go
      (let [{:keys [succ need-sync-remote unknown stop]}
            (<! (sync-local->remote-all-files! local->remote-syncer))]
        (cond
          succ
          (.schedule this ::idle)
          need-sync-remote
          (.schedule this ::remote->local=>full-sync)
          stop
          (.schedule this ::stop)
          unknown
          (do
            (debug/pprint "full-sync" unknown)
            (.schedule this ::idle))))))

  (remote->local [this next-state [remote-val]]
    (go
      (if (some-> remote-val :txid (<= @*txid))
        (.schedule this ::idle)
        (let [{:keys [succ unknown stop]}
              (<! (sync-remote->local! remote->local-syncer))]
          (cond
            succ
            (.schedule this (or next-state ::idle))
            stop
            (.schedule this ::stop)
            unknown
            (do (prn "remote->local err" unknown)
                (.schedule this ::idle)))))))

  (local->remote [this [^FileChangeEvent local-change]]
    (assert (some? local-change))
    (go
      (let [{:keys [succ need-sync-remote unknown]}
            (<! (sync-local->remote! local->remote-syncer [local-change]))]
        (cond
          succ
          (.schedule this ::idle)

          need-sync-remote
          (.schedule this ::remote->local=>local->remote nil)

          unknown
          (do
            (debug/pprint "local->remote" unknown)
            (.schedule this ::idle))))))
  IStoppable
  (-stop! [_]
    (when-not stopped
      (set! stopped true)
      (ws-stop! _*ws)
      (offer! stop-sync-chan true)
      (stop-local->remote! local->remote-syncer)
      (stop-remote->local! remote->local-syncer)
      (debug/pprint ["stop sync-manager, graph-uuid" graph-uuid "base-path" base-path])
      (.update-state! sync-state ::stop))))


(defn sync-manager [graph-uuid base-path repo txid sync-state full-sync-chan stop-sync-chan
                    remote->local-sync-chan local->remote-sync-chan local-changes-chan]
  (let [*txid (atom txid)
        local->remote-syncer (->Local->RemoteSyncer graph-uuid
                                                    base-path
                                                    repo sync-state
                                                    20000
                                                    *txid nil (chan) false)
        remote->local-syncer (->Remote->LocalSyncer graph-uuid
                                                    base-path
                                                    repo *txid sync-state nil (volatile! false))]
    (.set-remote->local-syncer! local->remote-syncer remote->local-syncer)
    (.set-local->remote-syncer! remote->local-syncer local->remote-syncer)
    (->SyncManager graph-uuid base-path sync-state local->remote-syncer remote->local-syncer
                   full-sync-chan stop-sync-chan
                   remote->local-sync-chan local->remote-sync-chan local-changes-chan nil *txid nil nil nil false)))


(def full-sync-chan (chan 1))
(def stop-sync-chan (chan 1))
(def remote->local-sync-chan (chan))
(def local->remote-sync-chan (chan))


(defn sync-stop []
  (when-let [sm (state/get-file-sync-manager)]
    (println "stopping sync-manager")
    (-stop! sm)))

(defn sync-start []
  (let [graph-uuid (first @graphs-txid)
        txid (second @graphs-txid)
        sync-state (->SyncState nil #{} #{} '())
        sm (sync-manager graph-uuid
                         (config/get-repo-dir (state/get-current-repo)) (state/get-current-repo)
                         txid sync-state full-sync-chan stop-sync-chan remote->local-sync-chan local->remote-sync-chan
                         local-changes-chan)]
    ;; drain `local-changes-chan`
    (->> (repeatedly #(poll! local-changes-chan))
         (take-while identity))
    (poll! stop-sync-chan)

    (.start sm)
    (state/set-file-sync-state-manager sync-state)
    (state/set-file-sync-manager sm)

    (offer! full-sync-chan true)

    ;; watch :network/online?
    (add-watch (rum/cursor state/state :network/online?) "sync-manage"
               (fn [_k _r _o n]
                 (when (false? n)
                   (sync-stop))))
    ;; watch :auth/id-token
    (add-watch (rum/cursor state/state :auth/id-token) "sync-manage"
               (fn [_k _r _o n]
                 (when (nil? n)
                   (sync-stop))))))
