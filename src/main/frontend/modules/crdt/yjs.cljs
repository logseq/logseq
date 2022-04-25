(ns frontend.modules.crdt.yjs
  (:require ["yjs" :as y]
            ["y-websocket" :as y-ws]
            [goog.object :as gobj]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.util :as util]
            [frontend.state :as state]
            [cljs-bean.core :as bean]
            [frontend.modules.crdt.outliner :as outliner]
            [frontend.modules.outliner.pipeline :as outliner-pipeline]
            [clojure.edn :as edn]
            [clojure.walk :as walk]))

;; TODO: Replace Y.Map with Y.Array because Y.Map has large metadata overhead
;; https://discuss.yjs.dev/t/map-metadata-overhead/492
;; {graph {:local {:doc Y.Doc :map Y.Map}
;;         :remote {:doc Y.Doc :map Y.Map}}}
(defonce *state (atom {}))

(defonce YDoc (gobj/get y "Doc"))

(defn merge-doc [doc1 doc2]
  (let [s1 (y/encodeStateVector doc1)
        s2 (y/encodeStateVector doc2)
        d1 (y/encodeStateAsUpdate doc1 s2)
        d2 (y/encodeStateAsUpdate doc2 s1)]
    (y/applyUpdate doc1 d2)
    (y/applyUpdate doc2 d1)))

(defn sync-doc [local remote]
  (.on remote "update" (fn [update]
                         (y/applyUpdate local update)))
  (.on local "update" (fn [update]
                        (y/applyUpdate remote update))))

(defn get-local-doc
  [graph]
  (get-in @*state [graph :local :doc]))

(defn get-local-map
  [graph]
  (get-in @*state [graph :local :map]))

(defn get-remote-doc
  [graph]
  (get-in @*state [graph :remote :doc]))

(defn get-remote-map
  [graph]
  (get-in @*state [graph :remote :map]))

(defn unobserve-local-map!
  [graph f]
  (when-let [ym (get-local-map graph)]
    (.unobserve ym f)))

(defn observe-local-map!
  [graph f]
  (let [ym (get-local-map graph)]
    (.observe ym f)))

(defn handle-local-updates!
  [graph]
  (fn [event]
    (when-not (.-local (.-transaction event)) ; ignore local changes
      (let [ym (get-local-map graph)
            changed-keys (.-keysChanged event)
            changes (map
                      (fn [uuid-str item]
                        (let [v (.get ym uuid-str)]
                          (if v
                            {:action :upsert
                             :block (edn/read-string v)}
                            {:action :delete
                             :block-id (uuid uuid-str)})))
                      changed-keys)]
        (state/pub-event! [:graph/merge-remote-changes graph changes event])))))

(defn- get-page-blocks-uuids [db page-id]
  (->> (d/datoms db :avet :block/page page-id)
       (map (fn [d] (:block/uuid (d/entity db (:e d)))))))

(defn- replace-db-id-with-block-uuid
  [tx-report block]
  (walk/postwalk (fn [f]
                   (if (and (map? f)
                            (= 1 (count f))
                            (:db/id f))
                     (let [block-uuid (or (:block/uuid (d/entity (:db-before tx-report) (:db/id f)))
                                          (:block/uuid (d/entity (:db-after tx-report) (:db/id f))))]
                       (if block-uuid
                         [:block/uuid block-uuid]
                         (throw (ex-info "Can't resolve entity in both db-before and db-after"
                                         {:block block
                                          :f f}))))
                     f))
                 block))

(defn- transact-blocks!
  [tx-report graph pages blocks]
  (let [ydoc (get-local-doc graph)
        ymap (get-local-map graph)]
    ;; bundle changes to minimize numbers of messages sent
    (.transact ydoc
     (fn []
       (doseq [block (util/distinct-by-last-wins :block/uuid (concat pages blocks))]
         (let [k (str (:block/uuid block))]
           (if (:db/deleted? block)
             (.delete ymap k)
             ;; FIXME: construct a Y.Map from `block`
             (let [block (->> (dissoc block :db/id)
                              (replace-db-id-with-block-uuid tx-report))
                   value (pr-str block)]
               (.set ymap k value)))))
       (doseq [page pages]
         (when (:db/deleted? page)
           (let [block-uuids (get-page-blocks-uuids (:db-before tx-report) (:db/id page))]
             (doseq [block-uuid block-uuids]
               (.delete ymap (str block-uuid))))))))))

(defn save-db-changes-to-yjs!
  "Save datascript changes to yjs."
  [graph {:keys [pages blocks tx-report]}]
  ;; TODO: core.async batch updates
  (when-not (:skip-remote-sync? (:tx-meta tx-report))
    (transact-blocks! tx-report graph pages blocks)))

(defn register-db-listener!
  []
  (outliner-pipeline/register-listener! :sync-crdt-with-db save-db-changes-to-yjs!))

(defn start-yjs-docs! [graph]
  (let [{:keys [local remote]} @*state]
    (when-let [doc-remote (:doc local)]
      (.destroy doc-remote))
    (when-let [doc-local (:doc local)]
      (.destroy doc-local))
    (unobserve-local-map! graph (handle-local-updates! graph))

    (let [doc-local (new YDoc)
          doc-remote (new YDoc)]
      (reset! *state {graph {:local {:doc doc-local
                                     :map (.getMap doc-local graph)}
                             :remote {:doc doc-remote
                                      :map (.getMap doc-remote graph)}}})
      (register-db-listener!)
      (merge-doc doc-local doc-remote)
      (sync-doc doc-local doc-remote)
      (observe-local-map! graph (handle-local-updates! graph)))))

;; doc map for each graph
;; {block-uuid {:block/uuid :block/name :block/parent :block/left :block/content}}

(defonce *server-conn (atom nil))

(defn setup-sync-server! [server-address graph user]
  (when (and (not (string/blank? server-address))
             (not (string/blank? graph))
             (not (string/blank? user)))
    (println "setup-sync-server! " {:server-address server-address
                                    :graph graph
                                    :user user})
    (when @*server-conn
      (.disconnect @*server-conn))

    (start-yjs-docs! graph)

    (reset! *server-conn (y-ws/WebsocketProvider. server-address graph (get-remote-doc graph)))))

(defn server-connected? []
  (and (some? @*server-conn)
       (.-wsconnected ^js @*server-conn)))

(defn debug-sync!
  []
  (let [server-address "ws://192.168.2.179:1234"]
    (setup-sync-server! server-address (frontend.state/get-current-repo)
                        (str (random-uuid)))))

(comment
  (frontend.db/set-key-value (state/get-current-repo) :db-type :db-only)
  )
