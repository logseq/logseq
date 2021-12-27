(ns frontend.fs.sync
  (:require [frontend.util :as util]
            [cljs.core.async :as async :refer [go timeout go-loop offer! poll! chan <! >!]]
            [cljs.core.async.interop :refer-macros [<p!]]
            [cljs-http.client :as http]
            [frontend.util.persist-var :as persist-var]
            [clojure.string :as string]
            [frontend.state :as state]
            [frontend.config :as config]
            [frontend.fs.macro :refer [err? err->]]))

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
           (let [token (refresh-token-fn)]
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
    (into {} (map (fn [p] [p {:size 0 :md5 0}])) filepaths))
  (rename-local-file [_ graph-uuid from to]
    (println "rename local file:" from "->" to))
  (update-local-file [_ graph-uuid filepath]
    (println "update local file:" filepath))
  (delete-local-file [_ graph-uuid filepath]
    (println "delete local file:" filepath))
  (update-remote-file [_ graph-uuid filepath]
    (println "update remote file:" filepath))
  (delete-remote-file [_ graph-uuid filepath]
    (println "delete remote file:" filepath)))

(def rsapi (->MockRSAPI))

(deftype RemoteAPI [^:mutable token]
  Object
  (get-token [this]
    (or token (.refresh-token this)))
  (refresh-token [_]
    ;; TODO
    (set! token "<id-token>")
    token)
  (request [this api-name body]
    (let [c (chan)]
      (go
        (let [resp (<! (request api-name body (.get-token this) #(.refresh-token this)))]
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

(def remoteapi (->RemoteAPI nil))

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
  (doseq [filetxn filetxns]
    (apply-filetxn graph-uuid filetxn)))

(defn sync-remote-all-files! [graph-uuid]
  "pull all files' metadata and sync."
  (go
    (err->
     (<! (get-remote-all-files-meta remoteapi graph-uuid))
     (as-> v (prn "get-remote-all-files-meta:") v))))

(defn current-graph-uuid-and-txid []
  @graphs-txid)

(defn sync-remote! [graph-uuid-expect]
  "return {:err ...} when error occurs"
  (go
    (let [[graph-uuid txid] (current-graph-uuid-and-txid)]
      (when (or (nil? graph-uuid) (= graph-uuid graph-uuid-expect))
        (if (some? txid)
          (err->
           (<! (get-diff remoteapi graph-uuid txid))
           (as-> [diff-txns latest-txid]
               (let [filetxnset (update-txns (.-EMPTY FileTxnSet) diff-txns)
                    repo (state/get-current-repo)]
                (apply-filetxns graph-uuid filetxnset)
                (.reset_value! graphs-txid [graph-uuid latest-txid] repo)
                (persist-var/persist-save graphs-txid))))
          (sync-remote-all-files! graph-uuid-expect))))))

(comment
  (reset! graphs-txid ["78c7362a-e085-4b8e-9a7b-27e1930fb94b" 0])
  (sync-remote!)
  graphs-txid
  )


(defn- need-sync-remote? [remote-change]
  (let [remote-txid (:txid remote-change)
        [_ local-txid] (current-graph-uuid-and-txid)]
    (or (nil? local-txid)
        (> remote-txid local-txid))))

(defn- remove-dir-prefix [dir path]
  (string/replace path (js/RegExp. (str "^" dir)) ""))

(def local-changes-chan (chan 100))


(deftype FileChangeEvent [type dir path stat])

(defn file-watch-handler
  [type {:keys [dir path content stat] :as payload}]
  (prn "file-watch-handler" type (:path payload) (get-in payload [:stat :mtime]))
  (go (>! local-changes-chan (->FileChangeEvent type dir path stat))))


(defprotocol ILocal->RemoteSync
  (ratelimit [this from-chan] "get watched local file-change events from FROM-CHAN,
  return chan returning events with rate limited")
  (sync-local->remote! [this ^FileChangeEvent e]))

(deftype Local->RemoteSyncer [graph-uuid dir-prefix ^:mutable rate]
  Object
  (filter-dir-prefix-chan [_ n]
    (chan n (filter (fn [^FileChangeEvent e]
                      (string/starts-with? dir-prefix (.-dir e))))))

  ILocal->RemoteSync
  (ratelimit [this from-chan]
    (let [c (.filter-dir-prefix-chan this 10000)]
      (go-loop [timeout-c (timeout rate)
                tcoll (transient [])]
        (->
         (let [{:keys [timeout e]}
               (async/alt! timeout-c {:timeout true}
                           from-chan ([e] {:e e}))]
           (if timeout
             (do
               (<! (async/onto-chan! c (persistent! tcoll)))
               (recur (timeout rate) (transient [])))
             (do
               (conj! tcoll e)
               (recur timeout-c tcoll))))))
      c))

  (sync-local->remote! [_ ^FileChangeEvent e]
    (let [type (.-type e)
          path (.-path e)]
      (when (and (some? path)
                 (not (string/ends-with? path "logseq/graphs-txid.edn")))
        (cond
          (or (= "add" type) (= "change" type))
          (update-remote-file rsapi graph-uuid path)

          (= "unlink" type)
          (delete-remote-file rsapi graph-uuid path)

          ;; (= "rename" type)
          ;; (rename-local-file)
          )))))


(def stop-sync-loop (chan 1))
(defn sync-loop!
  [graph-uuid local->remote-syncer]
  (let [*ws (atom nil)  ; reset *ws to false to stop re-connect websocket
        local-chan (ratelimit local->remote-syncer local-changes-chan)]
    (ws-listen! graph-uuid *ws)
    (go-loop []
      (let [{:keys [stop remote local]}
            (async/alt!
              stop-sync-loop {:stop true}
              remote-changes-chan ([v] (println "remote changes:" v) {:remote v})
              local-chan ([v] {:local v})
              :priority true)]
        (cond
          remote
          (if (need-sync-remote? remote)
            (let [r (sync-remote! graph-uuid)]
              (when (err? r)
                (offer! stop-sync-loop 1))))

          local
          (sync-local->remote! local->remote-syncer local))
        (when-not stop
          (println "recur sync loop")
          (recur))
        (ws-stop! *ws)
        (println "sync loop stop")))))

(comment
  (def graph-uuid "78c7362a-e085-4b8e-9a7b-27e1930fb94b")
  (reset! graphs-txid [graph-uuid 0])
  (def local->remote-syncer (->Local->RemoteSyncer graph-uuid (config/get-repo-dir (state/get-current-repo)) 10000))
  (sync-loop! graph-uuid local->remote-syncer)

  ;; stop
  (offer! stop-sync-loop 1)
  (poll! stop-sync-loop)
  )
