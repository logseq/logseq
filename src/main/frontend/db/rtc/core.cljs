(ns frontend.db.rtc.core
  (:require-macros
   [frontend.db.rtc.macro :refer [with-sub-data-from-ws get-req-id get-result-ch]])
  (:require [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.util :as util]
            [frontend.config :as config]
            [cljs.core.async :as async :refer [<! >! chan go go-loop offer!
                                               poll! timeout]]
            [cljs.core.async.interop :refer [p->c]]
            [electron.ipc :as ipc]
            [malli.core :as m]
            [frontend.modules.outliner.transaction :as outliner-tx]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.db :as db]
            [frontend.db.rtc.ws :as ws]
            [clojure.set :as set]
            [frontend.state :as state]
            [frontend.db.rtc.op :as op]
            [frontend.db.rtc.full-upload-download-graph :as full-upload-download-graph]))




(def state-schema
  "
  | :user-uuid             | string                                              |
  | :*graph-uuid           | atom of graph-uuid syncing now                      |
  | :*repo                 | atom of repo name syncing now                       |
  | :data-from-ws-chan     | channel for receive messages from server websocket  |
  | :data-from-ws-pub      | pub of :data-from-ws-chan, dispatch by :req-id      |
  | :client-op-update-chan | channel to notify that there're some new operations |
  | :*stop-rtc-loop-chan   | atom of chan to stop <loop-for-rtc                  |
  | :*ws                   | atom of websocket                                   |
"
  [:map
   [:user-uuid :string]
   [:*graph-uuid :any]
   [:*repo :any]
   [:data-from-ws-chan :any]
   [:data-from-ws-pub :any]
   [:client-op-update-chan :any]
   [:*stop-rtc-loop-chan :any]
   [:*ws :any]])
(def state-validator (m/validator state-schema))

(def data-from-ws-schema
  [:map
   [:req-id :string]
   [:t {:optional true} :int]
   [:affected-blocks {:optional true}
    [:map-of :keyword
     [:or
      [:map
       [:op [:= "move"]]
       [:parents [:sequential :string]]
       [:left [:maybe :string]]
       [:self :string]
       [:first-child [:maybe :string]]
       [:sibling [:maybe :string]]
       [:content {:optional true} :string]]
      [:map
       [:op [:= "remove"]]
       [:block-uuid :string]]
      [:map
       [:op [:= "update-attrs"]]
       [:parents [:sequential :string]]
       [:left [:maybe :string]]
       [:self :string]
       [:first-child [:maybe :string]]
       [:sibling [:maybe :string]]
       [:content {:optional true} :string]]]]]])
(def data-from-ws-validator (m/validator data-from-ws-schema))



;; TODO: don't use outliner-core/delete-blocks loop to remove blocks,
;;       it is suitable for operations from users(e.g. remove consecutive blocks),
;;       but blocks in remove-ops are scattered, even maybe from different pages
(defn apply-remote-remove-ops
  [state remove-ops]
  {:pre [(some? @(:*repo state))]}
  (let [repo @(:*repo state)]
    (prn :remove-ops remove-ops)
    (doseq [op remove-ops]
      (when-let [block (db/entity repo [:block/uuid (uuid (:block-uuid op))])]
        (outliner-tx/transact!
         {:persist-op? false}
         (outliner-core/delete-blocks! [block] {:children? false}))
        (prn :apply-remote-remove-ops (:block-uuid op))))))

(defn <query-blocks-env
  [block-uuids]
  ;; TODO
  {}
  )

(defn- insert-or-move-block
  [state block-uuid-str remote-parents remote-left-uuid-str content move?]
  {:pre [(some? @(:*repo state))]}
  (when (and (seq remote-parents) remote-left-uuid-str)
    (let [repo @(:*repo state)
          local-left (db/entity repo [:block/uuid (uuid remote-left-uuid-str)])
          first-remote-parent (first remote-parents)
          local-parent (db/entity repo [:block/uuid (uuid first-remote-parent)])
          b {:block/uuid (uuid block-uuid-str)}]
      (case [(some? local-parent) (some? local-left)]
        [false true]
        (prn (:tx-data
              (outliner-tx/transact!
               {:persist-op? false}
               (if move?
                 (outliner-core/move-blocks! [b] local-left true)
                 (outliner-core/insert-blocks! [{:block/uuid (uuid block-uuid-str) :block/content content :block/format :markdown}]
                                               local-left {:sibling? true :keep-uuid? true})))))

        [true true]
        (let [sibling? (not= (:block/uuid local-parent) (:block/uuid local-left))]
          (prn (:tx-data
                (outliner-tx/transact!
                 {:persist-op? false}
                 (if move?
                   (outliner-core/move-blocks! [b] local-left sibling?)
                   (outliner-core/insert-blocks! [{:block/uuid (uuid block-uuid-str) :block/content content
                                                   :block/format :markdown}]
                                                 local-left {:sibling? sibling? :keep-uuid? true}))))))

        [true false]
        (prn (:tx-data
              (outliner-tx/transact!
               {:persist-op? false}
               (if move?
                 (outliner-core/move-blocks! [b] local-parent false)
                 (outliner-core/insert-blocks! [{:block/uuid (uuid block-uuid-str) :block/content content
                                                 :block/format :markdown}]
                                               local-parent {:sibling? false :keep-uuid? true}))))

             [false false])
        (throw (ex-info "Don't know where to insert" {:block-uuid block-uuid-str :remote-parents remote-parents
                                                      :remote-left remote-left-uuid-str}))))))

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

(defn- check-block-pos
  [state block-uuid-str remote-parents remote-left-uuid-str]
  {:pre [(some? @(:*repo state))]}
  (let [repo @(:*repo state)
        local-b (db/entity repo [:block/uuid (uuid block-uuid-str)])
        remote-parent-uuid-str (first remote-parents)]
    (cond
      (nil? local-b)
      :not-exist

      (not (and (= (str (:block/uuid (:block/parent local-b))) remote-parent-uuid-str)
                (= (str (:block/uuid (:block/left local-b))) remote-left-uuid-str)))
      :wrong-pos
      :else nil)))

(defn apply-remote-move-ops
  [state sorted-move-ops]
  (prn :sorted-move-ops sorted-move-ops)
  (doseq [{:keys [parents left self first-child sibling content]}
          sorted-move-ops]
    (case (check-block-pos state self parents left)
      :not-exist
      (insert-or-move-block state self parents left content false)
      :wrong-pos
      (insert-or-move-block state self parents left content true)
      nil                               ; do nothing
      nil)
    (prn :apply-remote-move-ops self)))


(defn apply-remote-update-ops
  [state update-ops]
  {:pre [(some? @(:*repo state))]}
  (let [repo @(:*repo state)]
    (prn :update-ops update-ops)
    (doseq [{:keys [parents left self first-child sibling content]}
            update-ops]
      (let [r (check-block-pos state self parents left)]
        (case r
          :not-exist
          (insert-or-move-block state self parents left content false)
          :wrong-pos
          (insert-or-move-block state self parents left content true)
          nil
          (when content
            (prn (:tx-data
                  (outliner-tx/transact!
                   {:persist-op? false}
                   (outliner-core/save-block! (merge (db/pull repo '[*] [:block/uuid (uuid self)])
                                                     {:block/uuid (uuid self)
                                                      :block/content content
                                                      :block/format :markdown})))))))

        (prn :apply-remote-update-ops r self)))))




(defn <apply-remote-data
  [state data-from-ws]
  {:pre [(data-from-ws-validator data-from-ws)
         (some? @(:*repo state))]}
  (go
    (let [affected-blocks-map (update-keys (:affected-blocks data-from-ws) name)
          remote-t (:t data-from-ws)
          {remove-ops-map "remove" move-ops-map "move" update-ops-map "update-attrs"}
          (update-vals
           (group-by (fn [[_ env]] (get env :op)) affected-blocks-map)
           (partial into {}))
          remove-ops (vals remove-ops-map)
          sorted-move-ops (move-ops-map->sorted-move-ops move-ops-map)
          update-ops (vals update-ops-map)]
      (prn :start-apply-remote-remove-ops)
      (apply-remote-remove-ops state remove-ops)
      (prn :start-apply-remote-move-ops)
      (apply-remote-move-ops state sorted-move-ops)
      (prn :start-apply-remote-update-ops)
      (apply-remote-update-ops state update-ops)
      (<! (p->c (op/<update-local-tx! @(:*repo state) remote-t))))))

(defn- <push-data-from-ws-handler
  [state push-data-from-ws]
  (go (<! (<apply-remote-data state push-data-from-ws))
      (prn :push-data-from-ws push-data-from-ws)))

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
                                   (let [left-uuid (some-> b :block/left :block/uuid str)
                                         parent-uuid (some-> b :block/parent :block/uuid str)]
                                     ["update" {:block-uuid block-uuid
                                                :target-uuid left-uuid :sibling? (not= left-uuid parent-uuid)
                                                :content (:block/content b)}])))))]
    [remove-ops* move-ops* update-ops*]))


(defn- <client-op-update-handler
  [state]
  {:pre [(some? @(:*graph-uuid state))
         (some? @(:*repo state))]}
  (go
    (let [repo @(:*repo state)
          {:keys [ops local-tx]} (<! (p->c (op/<get-ops&local-tx repo)))
          ops* (mapv second ops)
          op-keys (mapv first ops)
          ops-for-remote (apply concat (client-ops->remote-ops state ops*))
          r (with-sub-data-from-ws state
              (<! (ws/<send! state {:req-id (get-req-id)
                                    :action "apply-ops" :graph-uuid @(:*graph-uuid state)
                                    :ops ops-for-remote :t-before (or local-tx 1)}))
              (<! (get-result-ch)))]
      (<! (p->c (op/<clean-ops repo op-keys)))
      (<! (<apply-remote-data state r))
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
          push-data-from-ws-ch (chan (async/sliding-buffer 100))
          stop-rtc-loop-chan (chan)]
      (reset! (:*stop-rtc-loop-chan state) (chan))
      (with-sub-data-from-ws state
        (<! (ws/<send! state {:action "register-graph-updates" :req-id (get-req-id) :graph-uuid graph-uuid}))
        (<! (get-result-ch)))
      (async/sub data-from-ws-pub "push-updates" push-data-from-ws-ch)
      (<! (go-loop []
            (let [{:keys [push-data-from-ws client-op-update stop]}
                  (async/alt!
                    client-op-update-chan {:client-op-update true}
                    push-data-from-ws-ch ([v] {:push-data-from-ws v})
                    stop-rtc-loop-chan {:stop true}
                    :priority true)]
              (cond
                push-data-from-ws
                (do (<push-data-from-ws-handler state push-data-from-ws)
                    (recur))
                client-op-update
                (do (<! (<client-op-update-handler state))
                    (recur))
                stop (prn :stop-loop-for-rtc graph-uuid)
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
            :*stop-rtc-loop-chan (atom nil)
            :client-op-update-chan (chan 1)
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

(defonce debug-state (atom nil))
(defonce debug-graph-uuid "ed4520d5-7985-49bd-a2d7-cf28694e4f03")
(defn ^:export debug-init
  []
  (go
    (let [state (<! (<init))]
      (reset! debug-state state)
      (<! (<loop-for-rtc state debug-graph-uuid (state/get-current-repo)))
      state)))

(defn ^:export debug-stop-rtc-loop
  []
  (async/close! (:*stop-rtc-loop-chan @debug-state)))

(defn ^:export download-graph
  [repo graph-uuid]
  (go
    (let [state (<! (<init))]
      (<! (full-upload-download-graph/<download-graph state repo graph-uuid)))))

(defn ^:export debug-client-push-updates
  []
  (async/put! (:client-op-update-chan @debug-state) true))

(comment
  (go
    (def global-state (<! (<init))))
  (reset! (:*graph-uuid global-state) "ed4520d5-7985-49bd-a2d7-cf28694e4f03")
  (reset! (:*repo global-state) (state/get-current-repo))
  )
