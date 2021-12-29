(ns frontend.fs.sync
  (:require [frontend.util :as util]
            [cljs.core.async :as async :refer [go timeout go-loop offer! poll! chan <! >!]]
            [cljs.core.async.interop :refer-macros [<p!]]
            [cljs-http.client :as http]
            [frontend.util.persist-var :as persist-var]
            [clojure.string :as string]
            [frontend.state :as state]
            [frontend.config :as config]
            [frontend.fs.macro :refer [err? err->]]
            [frontend.handler.user :as user]
            [frontend.debug :as debug]))

(def ws-addr "wss://og96xf1si7.execute-api.us-east-2.amazonaws.com/production?graphuuid=%s")


(def remote-changes-chan (chan 1))

(def graphs-txid (persist-var/persist-var nil "graphs-txid"))

(defn- ws-stop! [*ws]
  (swap! *ws (fn [o] (assoc o :stop true)))
  (.close (:ws @*ws)))

(defn ws-listen! [graph-uuid *ws]
  (reset! *ws {:ws (js/WebSocket. (util/format ws-addr graph-uuid)) :stop false})
  (set! (.-onopen (:ws @*ws)) #(println (util/format "ws opened: graph '%s'" graph-uuid %)))
  (set! (.-onclose (:ws @*ws)) (fn [e]
                                 (println (util/format "ws close: graph '%s'" graph-uuid e))
                                 (when-not (true? (:stop @*ws))
                                   (go
                                     (timeout 1000)
                                     (println "re-connecting graph" graph-uuid)
                                     (ws-listen! graph-uuid *ws)))))
  (set! (.-onmessage (:ws @*ws)) (fn [e]
                                   (let [data (js->clj (js/JSON.parse (.-data e)) :keywordize-keys true)]
                                     (if-let [v (poll! remote-changes-chan)]
                                       (let [last-txid (:txid v)
                                             current-txid (:txid data)]
                                         (if (> last-txid current-txid)
                                           (offer! remote-changes-chan v)
                                           (offer! remote-changes-chan data)))
                                       (offer! remote-changes-chan data))))))

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

(defprotocol IRSAPI
  (get-local-files-meta [this graph-uuid filepaths] "get local files' metadata: file-size, md5")
  (rename-local-file [this graph-uuid from to])
  (update-local-file [this graph-uuid filepath] "remote -> local")
  (delete-local-file [this graph-uuid filepath])
  (update-remote-file [this graph-uuid filepath] "local -> remote")
  (delete-remote-file [this graph-uuid filepath]))

(defprotocol IRemoteAPI
  (get-remote-all-files-meta [this graph-uuid] "get remote all files' metadata")
  (get-remote-files-meta [this graph-uuid filepaths] "get remote files' metadata")
  (get-remote-graph [this graph-name-opt graph-uuid-opt] "get graph info by GRAPH-NAME-OPT or GRAPH-UUID-OPT")
  (list-remote-graphs [this] "list all remote graphs")
  (get-diff [this graph-uuid from-txid] "get diff from FROM-TXID, return [txns, latest-txid]")
  (create-graph [this graph-name] "create graph"))

(deftype MockRSAPI []
  IRSAPI
  (get-local-files-meta [this graph-uuid filepaths]
    (go (into {} (map (fn [p] [p {:size 0 :md5 0}])) filepaths)))
  (rename-local-file [_ graph-uuid from to]
    (go (println "rename local file:" from "->" to)))
  (update-local-file [_ graph-uuid filepath]
    (go (println "update local file:" filepath)))
  (delete-local-file [_ graph-uuid filepath]
    (go (println "delete local file:" filepath)))
  (update-remote-file [_ graph-uuid filepath]
    (go (println "update remote file:" filepath)))
  (delete-remote-file [_ graph-uuid filepath]
    (go (println "delete remote file:" filepath))))

(def rsapi (->MockRSAPI))

(deftype RemoteAPI []
  Object
  (get-token [this]
    (go
      (or (state/get-auth-access-token)
          (<! (.refresh-token this)))))
  (refresh-token [_]
    (go
      (<! (user/refresh-id-token&access-token))
      (state/get-auth-access-token)))
  (request [this api-name body]
    (let [c (chan)]
      (go
        (let [resp (<! (request api-name body (<! (.get-token this)) #(.refresh-token this)))]
          (if (http/unexceptional-status? (:status resp))
            (get-resp-json-body resp)
            {:err resp :body (get-resp-json-body resp)})))))

  ;; for test
  (update-files [this graph-uuid txid files]
    {:pre [(map? files)
           (number? txid)]}
    (.request this "update_files" {:GraphUUID graph-uuid :TXId txid :Files files}))

  IRemoteAPI
  (get-remote-all-files-meta [this graph-uuid]
    (.request this "get_all_files" {:GraphUUID graph-uuid}))
  (get-remote-files-meta [this graph-uuid filepaths]
    {:pre [(coll? filepaths)]}
    (.request this "get_files_meta" {:GraphUUID graph-uuid :Files filepaths}))
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
      (err->
       (<! (.request this "get_diff" {:GraphUUID graph-uuid :FromTXId from-txid}))
       (:Transactions)
       (as-> txns [txns (:TXId (last txns))]))))

  (create-graph [this graph-name]
    (.request this "create_graph" {:GraphName graph-name})))

(def remoteapi (->RemoteAPI))

(defn- remote-graph-exists? [graph-uuid]
  "200: true
404: false
else: return err resp"
  (go
    (let [r (<! (get-remote-graph remoteapi nil graph-uuid))]
      (if (err? r)
        (if (= 404 (get-in r [:err :status]))
          false
          r)
        true))))

(defn- update-txn [^FileTxnSet filetxnset txn]
  (let [{:keys [TXType TXContent]} txn]
    (case TXType
      "update_files"
      (let [files (string/split-lines TXContent)]
        (reduce #(.update-file ^FileTxnSet %1 %2) filetxnset files))

      "rename_file"
      (let [[from to] (string/split-lines TXContent)]
        (.rename-file filetxnset from to))

      "delete_files"
      (let [files (string/split-lines TXContent)]
        (reduce #(.delete-file ^FileTxnSet %1 %2) filetxnset files)))))

(defn update-txns [filetxnset txns]
  (reduce update-txn filetxnset txns))

(defn- apply-filetxn [graph-uuid ^FileTxn filetxn]
  (when (.renamed? filetxn)
    (rename-local-file rsapi graph-uuid (.-from-path filetxn) (.-to-path filetxn)))
  (when (.updated? filetxn)
    (update-local-file rsapi graph-uuid (.-to-path filetxn)))
  (when (.deleted? filetxn)
    (delete-local-file rsapi graph-uuid (.-to-path filetxn))))

(defn- apply-filetxns [graph-uuid filetxns]
  (go
    (doseq [filetxn filetxns]
      (<! (apply-filetxn graph-uuid filetxn)))))

(defn sync-remote-all-files! [graph-uuid]
  "pull all files' metadata and sync."
  (go
    (err->
     (<! (get-remote-all-files-meta remoteapi graph-uuid))
     (as-> v (prn "get-remote-all-files-meta:") v))))

(comment
  (reset! graphs-txid ["78c7362a-e085-4b8e-9a7b-27e1930fb94b" 0])
  (sync-remote->local!)
  graphs-txid
  )


(defmulti need-sync-remote? (fn [v] (cond
                                      (and (vector? v) (number? (first v)))
                                      :txid

                                      (:err v)
                                      :exceptional-response

                                      (instance? cljs.core.async.impl.channels/ManyToManyChannel v)
                                      :chan)))
(defmethod need-sync-remote? :txid [[txid remote->local-syncer]]
  (let [remote-txid txid
        local-txid (.-txid remote->local-syncer)]
    (or (nil? local-txid)
        (> remote-txid local-txid))))
(defmethod need-sync-remote? :exceptional-response [resp]
  (= 409 (get-in resp [:err :status])))
(defmethod need-sync-remote? :chan [c]
  (go (need-sync-remote? (<! c))))
(defmethod need-sync-remote? :default [_] false)

(defn- remove-dir-prefix [dir path]
  (string/replace path (js/RegExp. (str "^" dir)) ""))

(def local-changes-chan (chan 100))

(deftype FileChangeEvent [type dir path stat])

(defn file-watch-handler
  [type {:keys [dir path content stat] :as payload}]
  (prn "file-watch-handler" type (:path payload) (get-in payload [:stat :mtime]))
  (go (>! local-changes-chan (->FileChangeEvent type dir path stat))))


(defprotocol IRemote->LocalSync
  (sync-remote->local! [this] "return {:err ...} when error occurs")
  (sync-remote->local-all-files! [this] "sync all files, return {:err ...} when error occurs"))

(defprotocol ILocal->RemoteSync
  (reset-ignore-files! [this new] "don't sync ignore-files")
  (ratelimit [this from-chan] "get watched local file-change events from FROM-CHAN,
  return chan returning events with rate limited")
  (sync-local->remote! [this ^FileChangeEvent e]))

(deftype Remote->LocalSyncer [graph-uuid repo ^:mutable txid local->remote-syncer]
  IRemote->LocalSync
  (sync-remote->local! [this]
    (go
      (err->
       (<! (get-diff remoteapi graph-uuid txid))
       (as-> [diff-txns latest-txid]
           (let [filetxnset (update-txns (.-EMPTY FileTxnSet) diff-txns)
                 files-to-ignore (.related-files filetxnset)]
             (reset-ignore-files! local->remote-syncer files-to-ignore)
             (<! (apply-filetxns graph-uuid filetxnset))
                                        ;FIXME: better way to clear ignore-files?
             (go (<! (timeout 5000)) (reset-ignore-files! local->remote-syncer nil))
             ;; persist txid
             (.reset_value! graphs-txid [graph-uuid latest-txid] repo)
             (persist-var/persist-save graphs-txid))))))

  (sync-remote->local-all-files! [this]
    (go
      (err->
       (<! (get-remote-all-files-meta remoteapi graph-uuid))
       (as-> v (or (prn "get-remote-all-files-meta:" v) v))
       ;; TODO
       ))))

(deftype Local->RemoteSyncer [graph-uuid dir-prefix ^:mutable rate ^:mutable ignore-files]
  Object
  (filtered-chan [_ n]
    "check dir-prefix and ignore-files"
    (chan n (filter (fn [^FileChangeEvent e]
                      (and (string/starts-with? (.-dir e) dir-prefix)
                           (not (.has ignore-files (.-path e))))))))

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
                  (update-remote-file rsapi graph-uuid path*)

                  (= "unlink" type)
                  (delete-remote-file rsapi graph-uuid path*)

                  ;; (= "rename" type)
                  ;; (rename-local-file)
                  )]
            (go
              (when (<! (need-sync-remote? r))
                (debug/pprint "need-sync-remote")
                (<! (sync-remote->local! graph-uuid))
                (<! (sync-local->remote! this e))))))))))


(def stop-sync-loop (chan 1))
(defn sync-loop!
  [graph-uuid local->remote-syncer remote->local-syncer]
  (let [*ws (atom nil)  ; reset *ws to false to stop re-connect websocket
        local-chan (ratelimit local->remote-syncer local-changes-chan)]
    (ws-listen! graph-uuid *ws)
    (go-loop []
      (let [{:keys [stop remote local]}
            (async/alt!
              stop-sync-loop {:stop true}
              remote-changes-chan ([v] (println "remote changes:" v) {:remote v})
              local-chan ([v] (println "local changes:" v){:local v})
              :priority true)]
        (cond
          remote
          (if (need-sync-remote? [(:txid remote) remote->local-syncer])
            (let [r (<! (sync-remote->local! remote->local-syncer))]
              (when (err? r)
                (debug/pprint r))))

          local
          (<! (sync-local->remote! local->remote-syncer local)))
        (when-not stop
          (println "recur sync loop")
          (recur))
        (ws-stop! *ws)
        (println "sync loop stop")))))


;;; TODO: watch `user/*login-notify` to start/stop sync loop

(comment
  (def graph-uuid "bc5e1ced-96b1-4418-abea-4536cce9a35f")
  (reset! graphs-txid [graph-uuid 0])
  (def local->remote-syncer (->Local->RemoteSyncer graph-uuid (config/get-repo-dir (state/get-current-repo)) 10000))
  (def remote->local-syncer (->Remote->LocalSyncer graph-uuid (state/get-current-repo) 0 local->remote-syncer))
  (sync-loop! graph-uuid local->remote-syncer remote->local-syncer)

  ;; stop
  (offer! stop-sync-loop 1)
  (poll! stop-sync-loop)
  )
