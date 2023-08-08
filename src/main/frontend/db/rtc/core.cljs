(ns frontend.db.rtc.core
  (:require [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.util :as util]
            [frontend.config :as config]
            [cljs.core.async :as async :refer [<! >! chan go go-loop offer!
                                               poll! timeout]]
            [electron.ipc :as ipc]
            [malli.core :as m]
            [frontend.modules.outliner.transaction :as outliner-tx]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.db :as db]
            [clojure.set :as set]))

(def ws-addr config/RTC-WS-URL)

(defn ws-listen!
  [user-uuid data-from-ws-chan ws-opened-ch]
  (let [ws (js/WebSocket. (util/format ws-addr user-uuid))]
    (set! (.-onopen ws) (fn [_e] (async/close! ws-opened-ch)))
    (set! (.-onmessage ws) (fn [e]
                                     (let [data (js->clj (js/JSON.parse (.-data e)) :keywordize-keys true)]
                                       (offer! data-from-ws-chan data))))

    (set! (.-onclose ws) (fn [_e] (println :ws-stopped)))
    ws))


(defn init-rtc-op-db
  [repo]
  (when (config/db-based-graph? repo)
    (ipc/ipc :rtc/init repo)))


(def state-schema
  "
  | :data-from-ws-chan     | channel for receive messages from server websocket           |
  | :data-from-ws-pub      | pub of :data-from-ws-chan, dispatch by :req-id               |
  | :client-op-update-chan | channel to notify that there're some new operations          |
  | :upload-graph-chan     | channel to receive presigned-upload-s3-url                   |
  | :download-graph-chan   | channel to receive presigned-s3-url to download remote-graph |
  | :ws                    | websocket                                                    |
"
  [:map
   [:data-from-ws-chan :any]
   [:data-from-ws-pub :any]
   [:client-op-update-chan :any]
   [:upload-graph-chan :any]
   [:download-graph-chan :any]
   [:ws :any]])
(def state-validator (m/validator state-schema))

(def data-from-ws-schema
  [:map
   ["req-id" :string]
   ["affected-blocks" {:optional true}
    [:map-of :string
     [:or
      [:map
       ["op" [:= "move"]]
       ["parents" [:sequential :string]]
       ["left" :string]
       ["self" :string]
       ["first-child" :string]
       ["sibling" :string]]
      [:map
       ["op" [:= "remove"]]
       ["block-uuid" :string]]]]]
   ["blocks-env" {:optional true}
    [:map-of :string
     :any]]])
(def data-from-ws-validator (m/validator data-from-ws-schema))



;; TODO: don't use outliner-core/delete-blocks loop to remove blocks,
;;       it is suitable for operations from users(e.g. remove consecutive blocks),
;;       but blocks in remove-ops are scattered, even maybe from different pages
(defn apply-remote-remove-ops
  [_state remove-ops]
  (outliner-tx/transact!
   {:persist-op? false}
   (doseq [op remove-ops]
     (let [block (db/pull [:block/uuid (uuid (get op "block-uuid"))])]
       (outliner-core/delete-blocks! [block] {:children? false})))))

(defn <query-blocks-env
  [block-uuids]
  ;; TODO
  {}
  )

(defn align-parent&left
  [block-uuid remote-parents remote-left]
  {:pre [(seq remote-parents) (some? remote-left)]}
  (let [first-remote-parent (first remote-parents)
        local-parent* (db/pull [:block/uuid (uuid first-remote-parent)])
        local-left* (db/pull [:block/uuid (uuid remote-left)])
        self (db/pull [:block/uuid (uuid block-uuid)])
        local-parent (some-> (:db/id (:block/parent self)) (db/pull '[:block/uuid]) :block/uuid str)
        local-left (some-> (:db/id (:block/left self)) (db/pull '[:block/uuid]) :block/uuid str)]
    (if (and local-parent* local-left*
             (or (not= first-remote-parent local-parent)
                 (not= remote-left local-left)))
      (let [[target-block sibling?]
            (if (= first-remote-parent remote-left)
              [local-parent* false]
              [local-left* true])]
        (outliner-tx/transact!
         {:persist-op? false}
         (if self
           (outliner-core/move-blocks! [self] target-block sibling?)
           (outliner-core/insert-blocks! [{:block/uuid (uuid block-uuid)
                                           :block/content (str "from server: " block-uuid)}]
                                         target-block
                                         {:sibling? sibling?
                                          :keep-uuid? true}))))
      (throw (ex-info "TODO: local-parent*, local-left* not exist yet" {})))))

(defn- move-ops-map->sorted-move-ops
  [move-ops-map]
  (let [uuid->dep-uuids (into {} (map (fn [[uuid env]] [uuid (set (conj (:parents env) (:left env)))]) move-ops-map))
        all-uuids (set (keys move-ops-map))
        sorted-uuids
        (loop [r []
               rest-uuids all-uuids
               uuid (first rest-uuids)]
          (if-not uuid
            r
            (let [dep-uuids (uuid->dep-uuids uuid)]
              (if-let [next-uuid (first (set/intersection dep-uuids rest-uuids))]
                (recur r rest-uuids next-uuid)
                (let [rest-uuids* (disj rest-uuids uuid)]
                  (recur (conj r uuid) rest-uuids* (first rest-uuids*)))))))]
    (mapv move-ops-map sorted-uuids)))

(comment
  (def move-ops-map {"2" {:parents ["1"] :left "1" :x "2"}
                     "1" {:parents ["3"] :left nil :x "1"}
                     "3" {:parents [] :left nil :x "3"}})
  (move-ops-map->sorted-move-ops move-ops-map))

(defn apply-remote-move-ops
  [_state sorted-move-ops]
  (outliner-tx/transact!
   {:persist-op? false}
   (doseq [{parents "parents" left "left" self "self" first-child "first-child" sibling "sibling"} sorted-move-ops]
     (align-parent&left self parents left))))

(defn apply-remote-data
  [state data-from-ws]
  {:pre [(data-from-ws-validator data-from-ws)]}
  (let [affected-blocks-map (get data-from-ws "affected-blocks")
        {remove-ops-map "remove" move-ops-map "move"}
        (update-vals
         (group-by (fn [[_ env]] (get env "op")) affected-blocks-map)
         (partial into {}))
        remove-ops (vals remove-ops-map)
        sorted-move-ops (move-ops-map->sorted-move-ops move-ops-map)]
    (apply-remote-remove-ops state remove-ops)
    (apply-remote-move-ops state sorted-move-ops)))

(defn <loop-for-rtc
  [state]
  {:pre [(state-validator state)]}
  (go
    (let [{:keys [data-from-ws-chan client-op-update-chan]} state
          {:keys [data-from-ws client-op-update]}
          (async/alt!
            data-from-ws-chan ([v] {:data-from-ws v})
            client-op-update-chan {:client-op-update true}
            :priority true)]
      (cond
        data-from-ws
        nil
        client-op-update
        nil))))

(defn init-state
  [ws data-from-ws-chan]
  (m/parse state-schema
           {:data-from-ws-chan data-from-ws-chan
            :data-from-ws-pub (async/pub data-from-ws-chan :req-id)
            :client-op-update-chan (chan)
            :upload-graph-chan (chan)
            :download-graph-chan (chan)
            :ws ws}))

(defn <init
  []
  (go
    (let [data-from-ws-chan (chan (async/sliding-buffer 100))
          ws-opened-ch (chan)
          ws (ws-listen! "f92bb5b3-0f72-4a74-9ad8-1793e655c309" data-from-ws-chan ws-opened-ch)]
      (<! ws-opened-ch)
      (init-state ws data-from-ws-chan))))

(comment
  (go
    (def global-state (<! (<init)))))
