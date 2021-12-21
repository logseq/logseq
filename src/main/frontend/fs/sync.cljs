(ns frontend.fs.sync
  (:require [frontend.util :as util]
            [cljs.core.async :as async :refer [go timeout go-loop offer! poll! chan <! >!]]
            [cljs-http.client :as http]
            [frontend.util.persist-var :as persist-var]
            [clojure.string :as string]
            [frontend.state :as state]))

(def ws-addr "wss://og96xf1si7.execute-api.us-east-2.amazonaws.com/production?graphuuid=%s")


(def local-changes-chan (chan 100))

(def remote-changes-chan (chan 1))

(def graphs-txid (persist-var/persist-var nil "graphs-txid"))

(def ws-listen-graphs (atom #{}))

(defn ws-listen! [graph-uuid]
  (let [ws (js/WebSocket. (util/format ws-addr graph-uuid))]
    (set! (.-onopen ws) #(println (util/format "ws opened: graph '%s'" graph-uuid %)))
    (set! (.-onclose ws) (fn [e]
                           (println (util/format "ws close: graph '%s'" graph-uuid e))
                           (when (contains? @ws-listen-graphs graph-uuid)
                             (go
                               (timeout 1000)
                               (println "re-connecting graph" graph-uuid)
                               (ws-listen! graph-uuid)))))
    (set! (.-onmessage ws) (fn [e]
                             (let [data (js->clj (js/JSON.parse (.-data e)) :keywordize-keys true)]
                               (if-let [v (poll! remote-changes-chan)]
                                 (let [last-txid (:txid v)
                                       current-txid (:txid data)]
                                   (if (> last-txid current-txid)
                                     (offer! remote-changes-chan v)
                                     (offer! remote-changes-chan data)))
                                 (offer! remote-changes-chan data)))))
    ws))

(comment
  (reset! ws-listen-graphs (conj @ws-listen-graphs "78c7362a-e085-4b8e-9a7b-27e1930fb94b"))
  (def ws (ws-listen! "78c7362a-e085-4b8e-9a7b-27e1930fb94b"))
  )


(defn- get-json-body [body]
  (or (and (map? body) body)
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
           (if (> retry-count 5)
             (throw (js/Error. (str "retry count > 5, api-name:" api-name)))
             (do
               (println "will retry after" (* 1000 retry-count) "ms")
               (<! (timeout (* 1000 retry-count)))))
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
  (get-local-files-meta [this filepaths] "get local files' metadata: file-size, md5")
  (rename-local-file [this from to])
  (update-local-file [this filepath] "remote -> local")
  (delete-local-file [this filepath])
  (update-remote-file [this filepath] "local -> remote")
  (delete-remote-file [this filepath]))

(defprotocol IRemoteAPI
  (get-remote-all-files-meta [this graph-uuid] "get remote all files' metadata")
  (get-diff [this graph-uuid from-txid] "get diff from FROM-TXID,
  return [txns, latest-txid]"))

(deftype MockRSAPI []
  IRSAPI
  (get-local-files-meta [this filepaths]
    (into {} (map (fn [p] [p {:size 0 :md5 0}])) filepaths))
  (rename-local-file [_ from to]
    (println "rename local file:" from "->" to))
  (update-local-file [_ filepath]
    (println "update local file:" filepath))
  (delete-local-file [_ filepath]
    (println "delete local file:" filepath))
  (update-remote-file [_ filepath]
    (println "update remote file:" filepath))
  (delete-remote-file [_ filepath]
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
  IRemoteAPI
  (get-remote-all-files-meta [this graph-uuid]
    (request "get_all_files" {:GraphUUID graph-uuid} (.get-token this) #(.refresh-token this)))
  (get-diff [this graph-uuid from-txid]
    (go
      (->
       (<! (request "get_diff" {:GraphUUID graph-uuid :FromTXId from-txid} (.get-token this) #(.refresh-token this)))
       (get-resp-json-body)
       (:Transactions)
       ((fn [txns] [txns (:TXId (last txns))]))))))

(def remoteapi (->RemoteAPI nil))

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

(defn- apply-filetxn [^FileTxn filetxn]
  (when (.renamed? filetxn)
    (rename-local-file rsapi (.-from-path filetxn) (.-to-path filetxn)))
  (when (.updated? filetxn)
    (update-local-file rsapi (.-to-path filetxn)))
  (when (.deleted? filetxn)
    (delete-local-file rsapi (.-to-path filetxn))))

(defn- apply-filetxns [filetxns]
  (doseq [filetxn filetxns]
    (apply-filetxn filetxn)))

(defn sync-remote-all-files! [graph-uuid]
  "pull all files' metadata and sync."
  (println "sync remote all files"))

(defn current-graph-uuid-and-txid []
  @graphs-txid)

(defn sync-remote! []
  (go
    (let [[graph-uuid txid] (current-graph-uuid-and-txid)]
      (if (some? txid)
        (try
          (let [[diff-txns latest-txid] (<! (get-diff remoteapi graph-uuid txid))
                filetxnset (update-txns (.-EMPTY FileTxnSet) diff-txns)
                repo (state/get-current-repo)]
            (apply-filetxns filetxnset)
            (.reset_value! graphs-txid [graph-uuid latest-txid] repo)
            (persist-var/persist-save graphs-txid)))
        (sync-remote-all-files! graph-uuid)))))

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


(def stop-sync-loop (chan 1))
(defn sync-loop!
  []
  (go-loop []
    (let [{:keys [stop remote local]}
          (async/alt!
            stop-sync-loop {:stop true}
            remote-changes-chan ([v] (println "remote changes:" v) {:remote v})
            local-changes-chan ([v] (println "local changes:" v) {:local v})
            :priority true)]
      (cond
        remote
        (if (need-sync-remote? remote)
          (sync-remote!))

        local                           ;TODO sync local
        nil)
      (when-not stop
        (println "recur sync loop")
        (recur))
      (println "sync loop stop")
      )))

(comment
  (reset! graphs-txid ["78c7362a-e085-4b8e-9a7b-27e1930fb94b" 0])
  (reset! ws-listen-graphs (conj @ws-listen-graphs "78c7362a-e085-4b8e-9a7b-27e1930fb94b"))
  (def ws (ws-listen! "78c7362a-e085-4b8e-9a7b-27e1930fb94b"))
  (sync-loop!)

  ;; stop
  (offer! stop-sync-loop 1)
  )
