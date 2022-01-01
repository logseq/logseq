(ns frontend.fs.sync
  (:require [cljs-http.client :as http]
            [cljs.core.async :as async :refer [go timeout go-loop offer! poll! chan <! >!]]
            [cljs.core.async.interop :refer [p->c]]
            [clojure.set :as set]
            [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.debug :as debug]
            [frontend.fs.macro :refer [exception-> exception->>]]
            [frontend.handler.user :as user]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.persist-var :as persist-var]))

;;; TODO: watch `user/*login-notify` to start/stop sync loop
;;; TODO: add some spec validate


(def ws-addr "wss://og96xf1si7.execute-api.us-east-2.amazonaws.com/production?graphuuid=%s")


(def graphs-txid (persist-var/persist-var nil "graphs-txid"))

(def *graph-base-path-map
  "graph-uuid -> {:repo <repo> :base-path <base-path>}"
  (volatile! {}))

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
  (let [remote-changes-chan (chan 1)]
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

(deftype FileTxn [from-path to-path updated deleted seq-id]
  Object
  (rename [_ to]
    (FileTxn. from-path to updated false seq-id))
  (update [_]
    (FileTxn. from-path to-path true false seq-id))
  (delete [_]
    (FileTxn. from-path to-path false true seq-id))
  (renamed? [_]
    (not= from-path to-path))
  (updated? [_] updated)
  (deleted? [_] deleted)
  IEquiv
  (-equiv [coll ^FileTxn other]
    (and (= from-path (.-from-path other))
         (= to-path (.-to-path other))
         (= updated (.-updated other))
         (= deleted (.-deleted other))
         (= seq-id (.-seq-id other))))

  IComparable
  (-compare [this ^FileTxn other]
    (compare seq-id (.-seq-id other)))

  IPrintWithWriter
  (-pr-writer [coll w opts]
    (write-all w "#FileTxn[\"" from-path "\" -> \"" to-path
               "\" (updated? " updated ", renamed? " (.renamed? coll) ", deleted? " (.deleted? coll)
               ", seq-id " seq-id ")]")))


(deftype FileNotFoundErr [when file])
(deftype FileTxnSet [to-path-file-map seq-id]
  Object
  (rename-file [_ from to]
    (if-let [^FileTxn file (some-> (get to-path-file-map from) (as-> f (and (not (.deleted? f)) f)))]
      (let [next-file (.rename file to)]
        (-> to-path-file-map
            (-dissoc (.-to-path file))
            (-conj [to next-file])
            (FileTxnSet. seq-id)))
      (throw (->FileNotFoundErr :rename-file from))))

  (update-file [_ to]
    (if-let [file (get to-path-file-map to)]
      (let [next-file (.update file)]
        (FileTxnSet. (assoc to-path-file-map to next-file) seq-id))
      (FileTxnSet. (assoc to-path-file-map to (->FileTxn to to true false seq-id)) (inc seq-id))))

  (delete-file [_ to]
    (if-let [file (get to-path-file-map to)]
      (let [next-file (.delete file)]
        (FileTxnSet. (assoc to-path-file-map to next-file) seq-id))
      (throw (->FileNotFoundErr :delete-file to))))

  (related-files [_]
    (->> (vals to-path-file-map)
         (map (fn [^FileTxn v] [(.-from-path v) (.-to-path v)]))
         (flatten)
         (into #{})))

  ILookup
  (-lookup [coll to-path]
    (-lookup coll to-path nil))
  (-lookup [coll to-path not-found]
    (-lookup to-path-file-map to-path not-found))

  ICollection
  (-conj [coll ^FileTxn v]
    (conj to-path-file-map [(.-to-path v) v]))

  ISet
  (-disjoin [coll ^FileTxn v]
    (FileTxnSet. (-dissoc to-path-file-map (.-to-path v)) seq-id))

  ISeqable
  (-seq [coll]
    (some->
     (vals to-path-file-map)
     (sort)
     (seq)))

  IPrintWithWriter
  (-pr-writer [o w opts]
    (if-let [vals (vals to-path-file-map)]
      (-pr-writer vals w opts)
      (write-all w "()"))))

(set! (.-EMPTY FileTxnSet) (FileTxnSet. {} 0))

(defn- remove-dir-prefix [dir path]
  (string/replace path (js/RegExp. (str "^" dir)) ""))

(defn- remove-user-graph-uuid-prefix
  "<user-uuid>/<graph-uuid>/path -> path"
  [path]
  (let [parts (string/split path "/")]
    (if (and (< 2 (count parts))
               (= 36 (count (parts 0)))
               (= 36 (count (parts 1))))
      (string/join "/" (drop 2 parts))
      path)))

(deftype FileMetadata [size etag path last-modified remote? ^:mutable normalized-path]
  Object
  (get-normalized-path [this]
    (when-not normalized-path
      (set! normalized-path
            (cond-> path
              (string/starts-with? path "/") (string/replace-first "/" "")
              remote? (remove-user-graph-uuid-prefix))))
    normalized-path)

  IEquiv
  (-equiv [o ^FileMetadata other]
    (and (= size (.-size other))
         (= (.get-normalized-path o) (.get-normalized-path other))
         (= etag (.-etag other))))

  IPrintWithWriter
  (-pr-writer [coll w opts]
    (write-all w (str {:size size :etag etag :path path :remote? remote?}))))


(defprotocol IRSAPI
  (get-local-files-meta [this graph-uuid base-path filepaths] "get local files' metadata")
  (get-local-all-files-meta [this graph-uuid base-path] "get all local files' metadata")
  (rename-local-file [this graph-uuid base-path from to])
  (update-local-files [this graph-uuid base-path filepaths] "remote -> local")
  (delete-local-files [this graph-uuid base-path filepaths])
  (update-remote-file [this graph-uuid base-path filepath local-txid] "local -> remote, return err or txid")
  (delete-remote-files [this graph-uuid base-path filepaths local-txid] "return err or txid"))

(defprotocol IRemoteAPI
  (get-remote-all-files-meta [this graph-uuid] "get all remote files' metadata")
  (get-remote-files-meta [this graph-uuid filepaths] "get remote files' metadata")
  (get-remote-graph [this graph-name-opt graph-uuid-opt] "get graph info by GRAPH-NAME-OPT or GRAPH-UUID-OPT")
  (list-remote-graphs [this] "list all remote graphs")
  ;; TODO: get-diff api's result should contain files' etag(md5),
  ;;       used to avoid remote->local-files causing local->remote sync again(because of file-watcher)
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

(deftype RSAPI []
  IToken
  (get-token [this]                     ;TODO: use access-token
    (go
      (or (state/get-auth-id-token)
          (<! (.refresh-token this)))))
  (refresh-token [_]
    (go
      (<! (user/refresh-id-token&access-token))
      (state/get-auth-id-token)))
  IRSAPI
  (get-local-all-files-meta [this graph-uuid base-path]
    (go
      (let [r (<! (p->c (ipc/ipc "get-local-all-files-meta" graph-uuid base-path)))]
        (if (instance? ExceptionInfo r)
          r
          (->> r
               js->clj
               (map (fn [[path metadata]]
                      (->FileMetadata (get metadata "size") (get metadata "md5") path nil false nil)))
               set)))))
  (get-local-files-meta [this graph-uuid base-path filepaths]
    (go
      (let [r (<! (p->c (ipc/ipc "get-local-files-meta" graph-uuid base-path filepaths)))]
        (if (instance? ExceptionInfo r)
          r
          (->> r
               js->clj
               (map (fn [[path metadata]]
                      (->FileMetadata (get metadata "size") (get metadata "md5") path nil false nil))))))))
  (rename-local-file [_ graph-uuid base-path from to]
    (p->c (ipc/ipc "rename-local-file" graph-uuid base-path from to)))
  (update-local-files [this graph-uuid base-path filepaths]
    (println "update-local-files" graph-uuid base-path filepaths)
    (go
      (let [r (<! (p->c (ipc/ipc "update-local-files" graph-uuid base-path filepaths (<! (get-token this)))))]
        (when (state/developer-mode?) (check-files-exists base-path filepaths))
        r)))

  (delete-local-files [_ graph-uuid base-path filepaths]
    (go
      (let [r (<! (p->c (ipc/ipc "delete-local-files" graph-uuid base-path filepaths)))]
        (when (state/developer-mode?) (check-files-not-exists base-path filepaths))
        r)))

  (update-remote-file [this graph-uuid base-path filepath local-txid]
    (go
      (<! (p->c (ipc/ipc "update-remote-file" graph-uuid base-path filepath local-txid (<! (get-token this)))))))

  (delete-remote-files [this graph-uuid base-path filepaths local-txid]
    (go
      (<! (p->c (ipc/ipc "delete-remote-files" graph-uuid base-path filepaths local-txid (<! (get-token this))))))))


(def rsapi (->RSAPI))

(deftype RemoteAPI []
  Object

  (request [this api-name body]
    (let [c (chan)]
      (go
        (let [resp (<! (request api-name body (<! (get-token this)) #(refresh-token this)))]
          (if (http/unexceptional-status? (:status resp))
            (get-resp-json-body resp)
            (ex-info "request failed"
                     {:err resp :body (get-resp-json-body resp)}))))))

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
      (exception->>
       (<! (.request this "get_all_files" {:GraphUUID graph-uuid}))
       (:Objects)
       (map #(->FileMetadata (:Size %)
                             (:ETag %)
                             (:Key %)
                             (:LastModified %)
                             true nil))
       set)))

  (get-remote-files-meta [this graph-uuid filepaths]
    {:pre [(coll? filepaths)]}
    (go
      (exception->>
       (<! (.request this "get_files_meta" {:GraphUUID graph-uuid :Files filepaths}))
       (:Files)
       (map #(->FileMetadata (:Size %)
                             (:ETag %)
                             (:FilePath %)
                             (:LastModified %)
                             true nil))
       (into #{}))))

  (get-remote-graph [this graph-name-opt graph-uuid-opt]
    {:pre [(or graph-name-opt graph-uuid-opt)]}
    (.request this "get_graph" (cond-> {}
                                 (seq graph-name-opt)
                                 (assoc :GraphName graph-name-opt)
                                 (seq graph-uuid-opt)
                                 (assoc :GraphUUID graph-uuid-opt))))
  (list-remote-graphs [this]
    (.request this "list_graphs"))
  (get-diff [this graph-uuid from-txid]
    (go
      (exception->
       (<! (.request this "get_diff" {:GraphUUID graph-uuid :FromTXId from-txid}))
       (:Transactions)
       (as-> txns [txns (:TXId (last txns))]))))

  (create-graph [this graph-name]
    (.request this "create_graph" {:GraphName graph-name})))

(def remoteapi (->RemoteAPI))



(defn- remote-graph-exists?
  "200: true
  404: false
  else: return err resp"
  [graph-uuid]
  (go
    (let [r (<! (get-remote-graph remoteapi nil graph-uuid))]
      (if (instance? ExceptionInfo r)
        (if (= 404 (get-in (ex-data r) [:err :status]))
          false
          r)
        true))))

(defn- update-txn [^FileTxnSet filetxnset txn]
  (let [{:keys [TXType TXContent]} txn]
    (let [files (->> (string/split-lines TXContent)
                     (mapv #(remove-user-graph-uuid-prefix %)))]
      (case TXType
        "update_files"
        (reduce #(.update-file ^FileTxnSet %1 %2) filetxnset files)

        "rename_file"
        (let [[from to] files]
          (.rename-file filetxnset from to))

        "delete_files"
        (reduce #(.delete-file ^FileTxnSet %1 %2) filetxnset files)))))

(defn update-txns [filetxnset txns]
  (reduce update-txn filetxnset txns))

(defn- apply-filetxn [graph-uuid base-path ^FileTxn filetxn]
  (cond
    (.renamed? filetxn)
    (rename-local-file rsapi graph-uuid base-path (.-from-path filetxn) (.-to-path filetxn))

    (.updated? filetxn)
    (update-local-files rsapi graph-uuid base-path [(.-to-path filetxn)])

    (.deleted? filetxn)
    (delete-local-files rsapi graph-uuid base-path [(.-to-path filetxn)])))

(defn- apply-filetxns [graph-uuid base-path filetxns]
  (go
    (loop [filetxns filetxns]
      (when filetxns
        (let [r (<! (apply-filetxn graph-uuid base-path (first filetxns)))]
          (if (instance? ExceptionInfo r)
            r
            (recur (next filetxns))))))))

(defn sync-remote-all-files!
  "pull all files' metadata and sync."
  [graph-uuid]
  (go
    (exception->
     (<! (get-remote-all-files-meta remoteapi graph-uuid))
     (as-> v (prn "get-remote-all-files-meta:") v))))

(comment
  (reset! graphs-txid ["78c7362a-e085-4b8e-9a7b-27e1930fb94b" 0])
  (sync-remote->local!)
  graphs-txid
  )


(defmulti need-sync-remote? (fn [v] (cond
                                      (= :max v)
                                      :max

                                      (and (vector? v) (number? (first v)))
                                      :txid

                                      (and (instance? ExceptionInfo v))
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



(def local-changes-chan (chan 100))

(deftype FileChangeEvent [type dir path stat]
  IPrintWithWriter
  (-pr-writer [coll w opts]
    (write-all w (str {:type type :base-path dir :path path}))))

(defn file-watch-handler
  [type {:keys [dir path _content stat] :as payload}]
  (prn "file-watch-handler" type (:path payload) (get-in payload [:stat :mtime]))
  (go (>! local-changes-chan (->FileChangeEvent type dir path stat))))


(defprotocol IRemote->LocalSync
  (sync-remote->local! [this] "return ExceptionInfo when error occurs")
  (sync-remote->local-all-files! [this] "sync all files, return ExceptionInfo when error occurs"))

(defprotocol ILocal->RemoteSync
  (reset-ignore-files! [this new] "don't sync ignore-files")
  (ratelimit [this from-chan] "get watched local file-change events from FROM-CHAN,
  return chan returning events with rate limited")
  (sync-local->remote! [this ^FileChangeEvent e])
  (sync-local->remote-all-files! [this] "compare all local files to remote ones, sync if not equal.
  ensure local-txid = remote-txid before calling this func"))

(deftype Remote->LocalSyncer [graph-uuid base-path repo *txid ^:mutable local->remote-syncer]
  Object
  (set-local->remote-syncer! [_ s] (set! local->remote-syncer s))
  IRemote->LocalSync
  (sync-remote->local! [_]
    (go
      (let [r
            (exception->
             (<! (get-diff remoteapi graph-uuid @*txid))
             (as-> [diff-txns latest-txid]
                 (let [filetxnset (update-txns (.-EMPTY FileTxnSet) diff-txns)
                       files-to-ignore (.related-files filetxnset)]
                   (reset-ignore-files! local->remote-syncer files-to-ignore)
                   (prn "filetxnset" filetxnset)
                   (when-not (instance? ExceptionInfo (<! (apply-filetxns graph-uuid base-path filetxnset)))
                     (reset! *txid latest-txid)
                     ;; persist txid
                     (.reset_value! graphs-txid [graph-uuid latest-txid] repo)
                     (persist-var/persist-save graphs-txid))
                                        ;FIXME: better way to clear ignore-files?
                   (go (<! (timeout 5000)) (reset-ignore-files! local->remote-syncer nil)))))]
        (if (instance? ExceptionInfo r)
          {:unknown r}
          {:succ true}))))

  (sync-remote->local-all-files! [this]
    (go
      (exception->
       (<! (get-remote-all-files-meta remoteapi graph-uuid))
       (as-> v (or (prn "get-remote-all-files-meta:" v) v))
       ;; TODO
       ))))

(deftype Local->RemoteSyncer [graph-uuid base-path
                              ^:mutable rate ^:mutable ignore-files *txid ^:mutable remote->local-syncer]
  Object
  (filtered-chan [_ n]
    "check base-path and ignore-files"
    (chan n (filter (fn [^FileChangeEvent e]
                      (and (string/starts-with? (.-dir e) base-path)
                           (not (.has ignore-files (.-path e))))))))

  (set-remote->local-syncer! [_ s] (set! remote->local-syncer s))

  ILocal->RemoteSync
  (reset-ignore-files! [_ new] (set! ignore-files new))
  (ratelimit [this from-chan]
    (let [c (.filtered-chan this 10000)]
      (go-loop [timeout-c (timeout rate)
                tcoll (transient [])]
        (let [{:keys [timeout e]}
              (async/alt! timeout-c {:timeout true}
                          from-chan ([e] {:e e}))]
          (cond
            timeout
            (do
              (<! (async/onto-chan! c (persistent! tcoll) false))
              (recur (async/timeout rate) (transient [])))

            (some? e)
            (do
              (conj! tcoll e)
              (recur timeout-c tcoll))

            (nil? e)
            (do
              (println "close ratelimit chan")
              (async/close! c)))))
      c))

  (sync-local->remote! [this ^FileChangeEvent e]
    (let [type (.-type e)
          path (.-path e)]
      (when (and (some? path)
                 (not (string/ends-with? path "logseq/graphs-txid.edn")))
        (println "sync-local->remote!" e)
        (let [path* (remove-dir-prefix (.-dir e) path)]
          (let [r
                (cond
                  (or (= "add" type) (= "change" type))
                  (update-remote-file rsapi graph-uuid base-path path* @*txid)

                  (= "unlink" type)
                  (delete-remote-files rsapi graph-uuid base-path [path*] @*txid)

                  ;; (= "rename" type)
                  ;; (rename-local-file)
                  )]
            (go
              (let [r* (<! r)]
                (cond
                  (need-sync-remote? r*)
                  {:need-sync-remote true}

                  (true? r*)            ; succ
                  (do
                    (swap! *txid inc)
                    {:succ true})

                  :else
                  {:unknown r*}))))))))

  (sync-local->remote-all-files! [this]
    (go
      (let [remote-all-files-meta-c (get-remote-all-files-meta remoteapi graph-uuid)
            local-all-files-meta-c (get-local-all-files-meta rsapi graph-uuid base-path)
            remote-all-files-meta (<! remote-all-files-meta-c)
            local-all-files-meta (<! local-all-files-meta-c)
            diff-local-files (set/difference local-all-files-meta remote-all-files-meta)
            change-events (mapv #(->FileChangeEvent "change" base-path (.get-normalized-path ^FileMetadata %) nil)
                                diff-local-files)]
        (loop [es change-events]
          (if-not es
            {:succ true}
            (let [e (first es)
                  {:keys [succ need-sync-remote unknown] :as r} (<! (sync-local->remote! this e))]
              (cond
                succ (recur (next es))

                (or need-sync-remote unknown) r))))))))


(def stop-sync-loop (chan 1))
(defn sync-loop!
  [graph-uuid local->remote-syncer remote->local-syncer full-sync-chan]
  (let [*ws (atom nil)  ; reset *ws to false to stop re-connect websocket
        local-chan (ratelimit local->remote-syncer local-changes-chan)
        remote-changes-chan (ws-listen! graph-uuid *ws)]
    (offer! remote-changes-chan :max)   ; trigger a remote sync
    (go-loop []
      (let [{:keys [stop remote local full-sync]}
            (async/alt!
              stop-sync-loop {:stop true}
              remote-changes-chan ([v] (println "remote changes:" v) {:remote v})
              local-chan ([v] (println "local changes:" v) {:local v})
              full-sync-chan {:full-sync true}
              :priority true)]
        (cond
          remote
          (if (need-sync-remote? [(:txid remote) remote->local-syncer])
            (let [r (<! (sync-remote->local! remote->local-syncer))]
              (when (instance? ExceptionInfo r)
                (debug/pprint r))))

          full-sync
          (do
            (<! (sync-remote->local-all-files! remote->local-syncer))
            (<! (sync-local->remote-all-files! local->remote-syncer)))

          local
          (<! (sync-local->remote! local->remote-syncer local)))
        (when-not stop
          (println "recur sync loop")
          (recur))
        (ws-stop! *ws)
        (println "sync loop stop")))))




(comment
  (def graph-uuid "bc5e1ced-96b1-4418-abea-4536cce9a35f")
  (def *txid (atom 38))
  (reset! graphs-txid [graph-uuid @*txid])
  (vswap! *graph-base-path-map assoc graph-uuid {:repo (state/get-current-repo)
                                                 :base-path (config/get-repo-dir (state/get-current-repo))})
  (def local->remote-syncer (->Local->RemoteSyncer graph-uuid
                                                   (:base-path (@*graph-base-path-map graph-uuid))
                                                   10000
                                                   #{} *txid nil))
  (def remote->local-syncer (->Remote->LocalSyncer graph-uuid
                                                   (:base-path (@*graph-base-path-map graph-uuid))
                                                   (:repo (@*graph-base-path-map graph-uuid))
                                                   *txid nil))
  (.set-remote->local-syncer! local->remote-syncer remote->local-syncer)
  (.set-local->remote-syncer! remote->local-syncer local->remote-syncer)

  (def r (sync-local->remote-all-files! local->remote-syncer))
  (poll! r)
  (sync-loop! graph-uuid local->remote-syncer remote->local-syncer)

  ;; stop
  (offer! stop-sync-loop 1)
  (poll! stop-sync-loop)

  )


(deftype SyncManager [graph-uuid base-path local->remote-syncer remote->local-syncer
                      full-sync-chan stop-sync-chan local-changes-chan ^:mutable ratelimit-local-changes-chan
                      *txid ^:mutable state ^:mutable _remote-change-chan ^:mutable _*ws]
  Object
  (schedule [this next-state & args]
    (set! state next-state)
    (go
      (case state
        ::idle
        (<! (.idle this))
        ::local->remote
        (<! (.local->remote this args))
        ::remote->local
        (<! (.remote->local this nil))
        ::full-sync
        (<! (.full-sync this))
        ::remote->local->>full-sync
        (<! (.remote->local this ::full-sync))
        ::stop
        (.stop this))))

  (start [this]
    (set! _*ws (atom nil))
    (set! _remote-change-chan (ws-listen! graph-uuid _*ws))
    (set! ratelimit-local-changes-chan (ratelimit local->remote-syncer local-changes-chan))
    (.schedule this ::idle))

  (stop [this]
    (ws-stop! _*ws)
    (debug/pprint ["stop sync-manager, graph-uuid" graph-uuid "base-path" base-path]))

  (idle [this]
    (go
      (let [{:keys [stop full-sync remote local]}
            (async/alt!
              stop-sync-chan {:stop true}
              full-sync-chan {:full-sync true}
              _remote-change-chan ([v] (debug/pprint "remote changes:" v) {:remote v})
              ratelimit-local-changes-chan ([v] (debug/pprint "local changes:" v) {:local v})
              :priority true)]
        (cond
          stop
          (<! (.schedule this ::stop))
          full-sync
          (<! (.schedule this ::full-sync))
          remote
          (<! (.schedule this ::remote->local))
          local
          (<! (.schedule this ::local->remote))))))

  (full-sync [this]
    (go
      (let [{:keys [succ need-sync-remote unknown]}
            (<! (sync-local->remote-all-files! local->remote-syncer))]
        (cond
          succ
          (.schedule this ::idle)
          need-sync-remote
          (.schedule this ::remote->local->>full-sync)
          unknown
          (do
            (debug/pprint "full-sync" unknown)
            (.schedule this ::idle))))))

  (remote->local [this next-state]
    (go
      (let [{:keys [succ unknown]}
            (<! (sync-remote->local! remote->local-syncer))]
        (cond
          succ
          (.schedule this (or next-state ::idle))

          unknown
          (.schedule this ::idle)))))

  (local->remote [this [^FileChangeEvent local-change]]
    (go
      (let [{:keys [succ need-sync-remote unknown]}
            (<! (sync-local->remote! local->remote-syncer local-change))]
        (cond
          succ
          (.schedule this ::idle)

          need-sync-remote
          (.schedule this ::remote->local)

          unknown
          (do
            (debug/pprint "local->remote" unknown)
            (.schedule this ::idle)))))))


(defn sync-manager [graph-uuid base-path repo txid full-sync-chan stop-sync-chan local-changes-chan]
  (let [*txid (atom txid)
        local->remote-syncer (->Local->RemoteSyncer graph-uuid
                                                    base-path
                                                    10000
                                                    #{} *txid nil)
        remote->local-syncer (->Remote->LocalSyncer graph-uuid
                                                    base-path
                                                    repo *txid nil)]
    (.set-remote->local-syncer! local->remote-syncer remote->local-syncer)
    (.set-local->remote-syncer! remote->local-syncer local->remote-syncer)
    (->SyncManager graph-uuid base-path local->remote-syncer remote->local-syncer full-sync-chan stop-sync-chan
                   local-changes-chan nil *txid nil nil nil)))
