(ns frontend.db.rtc.core
  (:require-macros
   [frontend.db.rtc.macro :refer [with-sub-data-from-ws get-req-id get-result-ch]])
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
            [frontend.db.rtc.ws :as ws]
            [clojure.set :as set]
            [frontend.state :as state]
            [frontend.db.rtc.op :as op]))


(defn init-rtc-op-db
  [repo]
  (when (config/db-based-graph? repo)
    (ipc/ipc :rtc/init repo)))


(def state-schema
  "
  | :user-uuid             | string                                              |
  | :*graph-uuid           | atom of graph-uuid syncing now                      |
  | :*repo                 | atom of repo name syncing now                       |
  | :data-from-ws-chan     | channel for receive messages from server websocket  |
  | :data-from-ws-pub      | pub of :data-from-ws-chan, dispatch by :req-id      |
  | :client-op-update-chan | channel to notify that there're some new operations |
  | :*ws                   | atom of websocket                                   |
"
  [:map
   [:user-uuid :string]
   [:*graph-uuid :any]
   [:*repo :any]
   [:data-from-ws-chan :any]
   [:data-from-ws-pub :any]
   [:client-op-update-chan :any]
   [:*ws :any]])
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

(defn- push-data-from-ws-handler
  [state push-data-from-ws]
  (prn :push-data-from-ws push-data-from-ws)
  ;; TODO
  )

(defn- client-ops->remote-ops
  [state ops]
  {:pre [(some? @(:*repo state))]}
  (let [repo @(:*repo state)
        [remove-block-uuids-set update-block-uuids-set move-block-uuids-set]
        (loop [[op & other-ops] ops
               remove-block-uuids #{}
               update-block-uuids #{}
               move-block-uuids #{}]
          (if-not op
            [remove-block-uuids update-block-uuids move-block-uuids]
            (case (first op)
              "move"
              (let [block-uuids (set (:block-uuids (second op)))
                    move-block-uuids (set/union move-block-uuids block-uuids)
                    remove-block-uuids (set/difference remove-block-uuids block-uuids)]
                (recur other-ops remove-block-uuids update-block-uuids move-block-uuids))
              "remove"
              (let [block-uuids (set (:block-uuids (second op)))
                    move-block-uuids (set/difference move-block-uuids block-uuids)
                    remove-block-uuids (set/union remove-block-uuids block-uuids)]
                (recur other-ops remove-block-uuids update-block-uuids move-block-uuids))
              "update"
              (let [block-uuid (:block-uuid (second op))
                    update-block-uuids (conj update-block-uuids block-uuid)]
                (recur other-ops remove-block-uuids update-block-uuids move-block-uuids))
              (throw (ex-info "unknown op type" op)))))
        {move-ops "move" remove-ops "remove" _update-ops "update"} (group-by first ops)
        move-block-uuids (->> move-ops
                              (keep (fn [op]
                                      (let [block-uuids (set (:block-uuids (second op)))]
                                        (seq (set/intersection move-block-uuids-set block-uuids)))))
                              (apply concat))
        remove-block-uuids-groups (->> remove-ops
                                       (keep (fn [op]
                                               (let [block-uuids (set (:block-uuids (second op)))]
                                                 (seq (set/intersection remove-block-uuids-set block-uuids))))))
        update-block-uuids (seq update-block-uuids-set)
        move-ops* (keep
                   (fn [block-uuid]
                     (when-let [block (db/entity repo [:block/uuid (uuid block-uuid)])]
                       (let [left-uuid (some-> block :block/left :block/uuid str)
                             parent-uuid (some-> block :block/parent :block/uuid str)]
                         (when (and left-uuid parent-uuid)
                           ["move"
                            {:block-uuid block-uuid :target-uuid left-uuid :sibling? (not= left-uuid parent-uuid)}]))))
                   move-block-uuids)
        remove-ops* (->> remove-block-uuids-groups
                         (keep
                          (fn [block-uuids]
                            (when-let [block-uuids*
                                       (seq (filter
                                             (fn [block-uuid] (not (db/entity repo [:block/uuid (uuid block-uuid)])))
                                             block-uuids))]
                              ["remove" {:block-uuids block-uuids*}]))))
        update-ops* (->> update-block-uuids
                         (keep (fn [block-uuid]
                                 (when-let [b (db/entity repo [:block/uuid (uuid block-uuid)])]
                                   ["update" {:block-uuid block-uuid :content (:block/content b)}]))))]
    [move-ops* remove-ops* update-ops*]))


(defn- <client-op-update-handler
  [state ops t-before]
  {:pre [(some? @(:*graph-uuid state))]}
  (go
    (let [ops-for-remote (client-ops->remote-ops state ops)
          r (with-sub-data-from-ws state
              (<! (ws/<send! state {:action "apply-ops" :graph-uuid @(:*graph-uuid state)
                                    :ops ops-for-remote :t-before t-before}))
              (<! (get-result-ch)))]
      (prn :<client-op-update-handler r))))

(defn <loop-for-rtc
  [state graph-uuid repo]
  {:pre [(state-validator state)
         (some? graph-uuid)
         (some? repo)]}
  (go
    (reset! (:*graph-uuid state) graph-uuid)
    (reset! (:*repo state) repo)
    (let [{:keys [data-from-ws-pub client-op-update-chan]} state
          push-data-from-ws-ch (chan (async/sliding-buffer 100))]
      (with-sub-data-from-ws state
        (<! (ws/<send! @(:*ws state) {:action "register-graph-updates" :req-id (get-req-id) :graph-uuid graph-uuid}))
        (<! (get-result-ch)))
      (async/sub data-from-ws-pub "push-updates" push-data-from-ws-ch)
      (<! (go-loop []
            (let [{:keys [push-data-from-ws client-op-update]}
                  (async/alt!
                    client-op-update-chan {:client-op-update true}
                    push-data-from-ws-ch ([v] {:push-data-from-ws v})
                    :priority true)]
              (cond
                push-data-from-ws
                (do (push-data-from-ws-handler state push-data-from-ws)
                    (recur))
                client-op-update
                (do (prn :client-op-update client-op-update)
                    (recur))
                :else
                nil))))
      (async/unsub data-from-ws-pub "push-updates" push-data-from-ws-ch))))

(defn init-state
  [ws data-from-ws-chan user-uuid]
  (m/parse state-schema
           {:user-uuid user-uuid
            :*graph-uuid (atom nil)
            :*repo (atom nil)
            :data-from-ws-chan data-from-ws-chan
            :data-from-ws-pub (async/pub data-from-ws-chan :req-id)
            :client-op-update-chan (chan)
            :*ws (atom ws)}))


(defn <init
  []
  (go
    (let [data-from-ws-chan (chan (async/sliding-buffer 100))
          ws-opened-ch (chan)
          user-uuid "f92bb5b3-0f72-4a74-9ad8-1793e655c309"
          ws (ws/ws-listen user-uuid data-from-ws-chan ws-opened-ch)]
      (<! ws-opened-ch)
      (init-state ws data-from-ws-chan user-uuid))))

(comment
  (go
    (def global-state (<! (<init))))
  (reset! (:*graph-uuid global-state) "00e016b1-cab1-4eea-bf74-a02d9e4910f8")
  (reset! (:*repo global-state) (state/get-current-repo)))
