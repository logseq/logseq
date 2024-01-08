(ns frontend.worker.rtc.core
  "Main ns for rtc related fns"
  (:require-macros
   [frontend.worker.rtc.macro :refer [with-sub-data-from-ws get-req-id get-result-ch]])
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs.core.async :as async :refer [<! >! chan go go-loop]]
            [clojure.set :as set]
            [cognitect.transit :as transit]
            [frontend.worker.async-util :include-macros true :refer [<?]]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.transaction :as outliner-tx]
            [frontend.worker.util :as worker-util]
            [logseq.common.util :as common-util]
            [logseq.common.config :as common-config]
            [malli.core :as m]
            [malli.util :as mu]
            [logseq.db.frontend.property :as db-property]
            [datascript.core :as d]
            [logseq.graph-parser.whiteboard :as gp-whiteboard]
            [frontend.worker.handler.page :as worker-page]
            [frontend.worker.handler.page.rename :as worker-page-rename]
            [frontend.worker.state :as worker-state]
            [logseq.db :as ldb]
            [frontend.worker.rtc.const :as rtc-const]
            [frontend.worker.rtc.op-mem-layer :as op-mem-layer]
            [frontend.worker.rtc.ws :as ws]
            [promesa.core :as p]
            [cljs-bean.core :as bean]))


;;                     +-------------+
;;                     |             |
;;                     |   server    |
;;                     |             |
;;                     +----^----+---+
;;                          |    |
;;                          |    |
;;                          |   rtc-const/data-from-ws-schema
;;                          |    |
;; rtc-const/data-to-ws-schema   |
;;                          |    |
;;                          |    |
;;                          |    |
;;                     +----+----v---+                     +------------+
;;                     |             +--------------------->            |
;;                     |   client    |                     |  indexeddb |
;;                     |             |<--------------------+            |
;;                     +-------------+                     +------------+
;;                                frontend.worker.rtc.op/op-schema

(def state-schema
  "
  | :*graph-uuid                      | atom of graph-uuid syncing now                     |
  | :*repo                            | atom of repo name syncing now                      |
  | :data-from-ws-chan                | channel for receive messages from server websocket |
  | :data-from-ws-pub                 | pub of :data-from-ws-chan, dispatch by :req-id     |
  | :*stop-rtc-loop-chan              | atom of chan to stop <loop-for-rtc                 |
  | :*ws                              | atom of websocket                                  |
  | :*rtc-state                       | atom of state of current rtc progress              |
  | :toggle-auto-push-client-ops-chan | channel to toggle pushing client ops automatically |
  | :*auto-push-client-ops?           | atom to show if it's push client-ops automatically |
  | :force-push-client-ops-chan       | chan used to force push client-ops                 |
"
  [:map {:closed true}
   [:*graph-uuid :any]
   [:*repo :any]
   [:data-from-ws-chan :any]
   [:data-from-ws-pub :any]
   [:*stop-rtc-loop-chan :any]
   [:*ws :any]
   [:*rtc-state :any]
   [:toggle-auto-push-client-ops-chan :any]
   [:*auto-push-client-ops? :any]
   [:force-push-client-ops-chan :any]])
(def state-validator
  (let [validator (m/validator state-schema)]
    (fn [data]
      (if (validator data)
        true
        (prn (mu/explain-data state-schema data))))))

(def rtc-state-schema
  [:enum :open :closed])
(def rtc-state-validator (m/validator rtc-state-schema))

(def transit-w (transit/writer :json))
(def transit-r (transit/reader :json))

(defmulti transact-db! (fn [action & _args] action))

(defmethod transact-db! :delete-blocks [_ & args]
  (outliner-tx/transact!
   {:persist-op? false}
    (apply outliner-core/delete-blocks! args)))

(defmethod transact-db! :move-blocks [_ & args]
  (outliner-tx/transact!
   {:persist-op? false}
   (apply outliner-core/move-blocks! args)))

(defmethod transact-db! :insert-blocks [_ & args]
  (outliner-tx/transact!
   {:persist-op? false}
   (apply outliner-core/insert-blocks! args)))

(defmethod transact-db! :save-block [_ & args]
  (outliner-tx/transact!
   {:persist-op? false}
   (apply outliner-core/save-block! args)))

(defmethod transact-db! :delete-whiteboard-blocks [_ conn block-uuids]
  (ldb/transact! conn
                 (mapv (fn [block-uuid] [:db/retractEntity [:block/uuid block-uuid]]) block-uuids)
                 {:persist-op? false}))

(defmethod transact-db! :upsert-whiteboard-block [_ conn blocks]
  (ldb/transact! conn blocks {:persist-op? false}))

(defn- whiteboard-page-block?
  [block]
  (contains? (set (:block/type block)) "whiteboard"))

(defn- group-remote-remove-ops-by-whiteboard-block
  "return {true [<whiteboard-block-ops>], false [<other-ops>]}"
  [db remote-remove-ops]
  (group-by (fn [{:keys [block-uuid]}]
              (boolean
               (when-let [block (d/entity db [:block/uuid block-uuid])]
                 (whiteboard-page-block? (:block/parent block)))))
            remote-remove-ops))

(defn apply-remote-remove-ops
  [repo conn date-formatter remove-ops]
  (prn :remove-ops remove-ops)
  (let [{whiteboard-block-ops true other-ops false} (group-remote-remove-ops-by-whiteboard-block @conn remove-ops)]
    (transact-db! :delete-whiteboard-blocks conn (map :block-uuid whiteboard-block-ops))

    (doseq [op other-ops]
      (when-let [block (d/entity @conn [:block/uuid (:block-uuid op)])]
        (transact-db! :delete-blocks repo conn date-formatter [block] {:children? false})
        (prn :apply-remote-remove-ops (:block-uuid op))))))

(defn- insert-or-move-block
  [repo conn block-uuid remote-parents remote-left-uuid move? op-value]
  (when (and (seq remote-parents) remote-left-uuid)
    (let [first-remote-parent (first remote-parents)
          local-parent (d/entity @conn [:block/uuid first-remote-parent])
          whiteboard-page-block? (whiteboard-page-block? local-parent)
          ;; when insert blocks in whiteboard, local-left is ignored
          local-left (when-not whiteboard-page-block? (d/entity @conn [:block/uuid remote-left-uuid]))
          b {:block/uuid block-uuid}
          ;; b-ent (d/entity @conn [:block/uuid (uuid block-uuid-str)])
          ]
      (case [whiteboard-page-block? (some? local-parent) (some? local-left)]
        [false false true]
        (if move?
          (transact-db! :move-blocks repo conn [b] local-left true)
          (transact-db! :insert-blocks repo conn
                        [{:block/uuid block-uuid
                          :block/content ""
                          :block/format :markdown}]
                        local-left {:sibling? true :keep-uuid? true}))

        [false true true]
        (let [sibling? (not= (:block/uuid local-parent) (:block/uuid local-left))]
          (if move?
            (transact-db! :move-blocks repo conn [b] local-left sibling?)
            (transact-db! :insert-blocks repo conn
                          [{:block/uuid block-uuid :block/content ""
                            :block/format :markdown}]
                          local-left {:sibling? sibling? :keep-uuid? true})))

        [false true false]
        (if move?
          (transact-db! :move-blocks repo conn [b] local-parent false)
          (transact-db! :insert-blocks repo conn
                        [{:block/uuid block-uuid :block/content ""
                          :block/format :markdown}]
                        local-parent {:sibling? false :keep-uuid? true}))

        ;; Don't need to insert-whiteboard-block here,
        ;; will do :upsert-whiteboard-block in `update-block-attrs`
        [true true false]
        (when (nil? (:properties op-value))
          ;; when :properties is nil, this block should be treat as normal block
          (if move?
            (transact-db! :move-blocks repo conn [b] local-parent false)
            (transact-db! :insert-blocks repo conn [{:block/uuid block-uuid :block/content "" :block/format :markdown}]
                          local-parent {:sibling? false :keep-uuid? true})))
        [true true true]
        (when (nil? (:properties op-value))
          (let [sibling? (not= (:block/uuid local-parent) (:block/uuid local-left))]
            (if move?
              (transact-db! :move-blocks repo conn [b] local-left sibling?)
              (transact-db! :insert-blocks repo conn [{:block/uuid block-uuid :block/content "" :block/format :markdown}]
                            local-left {:sibling? sibling? :keep-uuid? true}))))

        (throw (ex-info "Don't know where to insert" {:block-uuid block-uuid :remote-parents remote-parents
                                                      :remote-left remote-left-uuid}))))))

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
  "NOTE: some blocks don't have :block/left (e.g. whiteboard blocks)"
  [db block-uuid remote-parents remote-left-uuid]
  (let [local-b (d/entity db [:block/uuid block-uuid])
        remote-parent-uuid (first remote-parents)]
    (cond
      (nil? local-b)
      :not-exist

      (and (nil? (:block/left local-b))
           (not= (:block/uuid (:block/parent local-b)) remote-parent-uuid))
      ;; blocks don't have :block/left
      :wrong-pos

      (and (:block/left local-b)
           (or (not= (:block/uuid (:block/parent local-b)) remote-parent-uuid)
               (not= (:block/uuid (:block/left local-b)) remote-left-uuid)))
      :wrong-pos
      :else nil)))

(defn- upsert-whiteboard-block
  [repo conn {:keys [parents properties] :as _op-value}]
  (let [db @conn
        first-remote-parent (first parents)]
    (when-let [local-parent (d/entity db [:block/uuid first-remote-parent])]
      (let [page-name (:block/name local-parent)
            properties* (transit/read transit-r properties)
            shape-property-id (db-property/get-pid repo db :logseq.tldraw.shape)
            shape (and (map? properties*)
                       (get properties* shape-property-id))]
        (assert (some? page-name) local-parent)
        (assert (some? shape) properties*)
        (transact-db! :upsert-whiteboard-block conn [(gp-whiteboard/shape->block repo db shape page-name)])))))

(defn- update-block-attrs
  [repo conn date-formatter block-uuid {:keys [parents properties _content] :as op-value}]
  (let [key-set (set/intersection
                 (conj rtc-const/general-attr-set :content)
                 (set (keys op-value)))]
    (when (seq key-set)
      (let [first-remote-parent (first parents)
            local-parent (d/entity @conn [:block/uuid first-remote-parent])
            whiteboard-page-block? (whiteboard-page-block? local-parent)]
        (cond
          (and whiteboard-page-block? properties)
          (upsert-whiteboard-block repo conn op-value)

          :else
          (let [b-ent (d/entity @conn [:block/uuid block-uuid])
                new-block
                (cond-> (d/entity @conn (:db/id b-ent))
                  (and (contains? key-set :content)
                       (not= (:content op-value)
                             (:block/content b-ent))) (assoc :block/content (:content op-value))
                  (contains? key-set :updated-at)     (assoc :block/updated-at (:updated-at op-value))
                  (contains? key-set :created-at)     (assoc :block/created-at (:created-at op-value))
                  (contains? key-set :alias)          (assoc :block/alias (some->> (seq (:alias op-value))
                                                                                   (map (partial vector :block/uuid))
                                                                                   (d/pull-many @conn [:db/id])
                                                                                   (keep :db/id)))
                  (contains? key-set :type)           (assoc :block/type (:type op-value))
                  (contains? key-set :schema)         (assoc :block/schema (transit/read transit-r (:schema op-value)))
                  (contains? key-set :tags)           (assoc :block/tags (some->> (seq (:tags op-value))
                                                                                  (map (partial vector :block/uuid))
                                                                                  (d/pull-many @conn [:db/id])
                                                                                  (filter :db/id)))
                  (contains? key-set :properties)     (assoc :block/properties
                                                             (transit/read transit-r (:properties op-value))))]
            (transact-db! :save-block repo conn date-formatter new-block)))))))

(defn apply-remote-move-ops
  [repo conn date-formatter sorted-move-ops]
  (prn :sorted-move-ops sorted-move-ops)
  (doseq [{:keys [parents left self] :as op-value} sorted-move-ops]
    (let [r (check-block-pos @conn self parents left)]
      (case r
        :not-exist
        (insert-or-move-block repo conn self parents left false op-value)
        :wrong-pos
        (insert-or-move-block repo conn self parents left true op-value)
        nil                             ; do nothing
        nil)
      (update-block-attrs repo conn date-formatter self op-value)
      (prn :apply-remote-move-ops self r parents left))))


(defn apply-remote-update-ops
  [repo conn date-formatter update-ops]
  (prn :update-ops update-ops)
  (doseq [{:keys [parents left self] :as op-value} update-ops]
    (when (and parents left)
      (let [r (check-block-pos @conn self parents left)]
        (case r
          :not-exist
          (insert-or-move-block repo conn self parents left false op-value)
          :wrong-pos
          (insert-or-move-block repo conn self parents left true op-value)
          nil)))
    (update-block-attrs repo conn date-formatter self op-value)
    (prn :apply-remote-update-ops self)))

(defn apply-remote-update-page-ops
  [repo conn date-formatter update-page-ops]
  (let [config (worker-state/get-config repo)]
    (doseq [{:keys [self page-name original-name] :as op-value} update-page-ops]
      (let [old-page-original-name (:block/original-name (d/entity @conn [:block/uuid self]))
            exist-page (d/entity @conn [:block/name page-name])
            create-opts {:create-first-block? false
                         :uuid self :persist-op? false}]
        (cond
          ;; same name but different uuid
          ;; remote page has same block/name as local's, but they don't have same block/uuid.
          ;; 1. rename local page's name to '<origin-name>-<ms-epoch>-Conflict'
          ;; 2. create page, name=<origin-name>, uuid=remote-uuid
          (and exist-page (not= (:block/uuid exist-page) self))
          (do (worker-page-rename/rename! repo conn config original-name (common-util/format "%s-%s-CONFLICT" original-name (tc/to-long (t/now))))
              (worker-page/create! repo conn config original-name create-opts))

          ;; a client-page has same uuid as remote but different page-names,
          ;; then we need to rename the client-page to remote-page-name
          (and old-page-original-name (not= old-page-original-name original-name))
          (worker-page-rename/rename! repo conn config old-page-original-name original-name {:persist-op? false})

          ;; no such page, name=remote-page-name, OR, uuid=remote-block-uuid
          ;; just create-page
          :else
          (worker-page/create! repo conn config original-name create-opts))

        (update-block-attrs repo conn date-formatter self op-value)))))

(defn apply-remote-remove-page-ops
  [repo conn remove-page-ops]
  (doseq [op remove-page-ops]
    (when-let [page-name (:block/name (d/entity @conn [:block/uuid (:block-uuid op)]))]
      (worker-page/delete! repo conn page-name nil {:redirect-to-home? false :persist-op? false}))))


(defn filter-remote-data-by-local-unpushed-ops
  "when remote-data request client to move/update/remove/... blocks,
  these updates maybe not needed, because this client just updated some of these blocks,
  so we need to filter these just-updated blocks out, according to the unpushed-local-ops"
  [affected-blocks-map local-unpushed-ops]
  ;; (assert (op-mem-layer/ops-coercer local-unpushed-ops) local-unpushed-ops)
  (reduce
   (fn [affected-blocks-map local-op]
     (case (first local-op)
       "move"
       (let [block-uuid (:block-uuid (second local-op))
             remote-op (get affected-blocks-map block-uuid)]
         (case (:op remote-op)
           :remove (dissoc affected-blocks-map (:block-uuid remote-op))
           :move (dissoc affected-blocks-map (:self remote-op))
           ;; default
           affected-blocks-map))

       "update"
       (let [block-uuid (:block-uuid (second local-op))
             local-updated-attr-set (set (keys (:updated-attrs (second local-op))))]
         (if-let [remote-op (get affected-blocks-map block-uuid)]
           (assoc affected-blocks-map block-uuid
                  (if (#{:update-attrs :move} (:op remote-op))
                    (apply dissoc remote-op local-updated-attr-set)
                    remote-op))
           affected-blocks-map))
       ;;else
       affected-blocks-map))
   affected-blocks-map local-unpushed-ops))

(defn <apply-remote-data
  [repo conn date-formatter data-from-ws]
  (assert (rtc-const/data-from-ws-validator data-from-ws) data-from-ws)
  (go
    (let [remote-t (:t data-from-ws)
          remote-t-before (:t-before data-from-ws)
          local-tx (op-mem-layer/get-local-tx repo)]
      (cond
        (not (and (pos? remote-t)
                  (pos? remote-t-before)))
        (throw (ex-info "invalid remote-data" {:data data-from-ws}))

        (<= remote-t local-tx)
        (prn ::skip :remote-t remote-t :remote-t remote-t-before :local-t local-tx)

        (< local-tx remote-t-before)
        (do (prn ::need-pull-remote-data :remote-t remote-t :remote-t-before remote-t-before :local-t local-tx)
            ::need-pull-remote-data)

        (<= remote-t-before local-tx remote-t)
        (let [affected-blocks-map (:affected-blocks data-from-ws)
              unpushed-ops (op-mem-layer/get-all-ops repo)
              affected-blocks-map* (if unpushed-ops
                                     (filter-remote-data-by-local-unpushed-ops
                                      affected-blocks-map unpushed-ops)
                                     affected-blocks-map)
              {remove-ops-map :remove move-ops-map :move update-ops-map :update-attrs
               update-page-ops-map :update-page remove-page-ops-map :remove-page}
              (update-vals
               (group-by (fn [[_ env]] (get env :op)) affected-blocks-map*)
               (partial into {}))
              remove-ops (vals remove-ops-map)
              sorted-move-ops (move-ops-map->sorted-move-ops move-ops-map)
              update-ops (vals update-ops-map)
              update-page-ops (vals update-page-ops-map)
              remove-page-ops (vals remove-page-ops-map)]
          ;; (state/set-state! [:rtc/remote-batch-tx-state repo]
          ;;                   {:in-transaction? true
          ;;                    :txs []})
          (worker-util/profile :apply-remote-update-page-ops (apply-remote-update-page-ops repo conn date-formatter update-page-ops))
          (worker-util/profile :apply-remote-remove-ops (apply-remote-remove-ops repo conn date-formatter remove-ops))
          (worker-util/profile :apply-remote-move-ops (apply-remote-move-ops repo conn date-formatter sorted-move-ops))
          (worker-util/profile :apply-remote-update-ops (apply-remote-update-ops repo conn date-formatter update-ops))
          (worker-util/profile :apply-remote-remove-page-ops (apply-remote-remove-page-ops repo conn remove-page-ops))
          ;; (let [txs (get-in @state/state [:rtc/remote-batch-tx-state repo :txs])]
          ;;   (worker-util/profile
          ;;    :batch-refresh
          ;;    (react/batch-refresh! repo txs)))
          (op-mem-layer/update-local-tx! repo remote-t))
        :else (throw (ex-info "unreachable" {:remote-t remote-t
                                             :remote-t-before remote-t-before
                                             :local-t local-tx}))))))

(defn- <push-data-from-ws-handler
  [repo conn date-formatter push-data-from-ws]
  (prn :push-data-from-ws push-data-from-ws)
  (go
    (let [r (<! (<apply-remote-data repo conn date-formatter push-data-from-ws))]
      (when (= r ::need-pull-remote-data)
        r))))


(defn- remove-non-exist-block-uuids-in-add-retract-map
  [conn add-retract-map]
  (let [{:keys [add retract]} add-retract-map
        add* (->> add
                  (map (fn [x] [:block/uuid x]))
                  (d/pull-many @conn [:block/uuid])
                  (keep :block/uuid))]
    (cond-> {}
      (seq add*) (assoc :add add*)
      (seq retract) (assoc :retract retract))))

(defmulti local-block-ops->remote-ops-aux (fn [tp & _] tp))

(defmethod local-block-ops->remote-ops-aux :move-op
  [_ & {:keys [parent-uuid left-uuid block-uuid *remote-ops *depend-on-block-uuid-set]}]
  (when parent-uuid
    (let [target-uuid (or left-uuid parent-uuid)
          sibling? (not= left-uuid parent-uuid)]
      (swap! *remote-ops conj [:move {:block-uuid block-uuid :target-uuid target-uuid :sibling? sibling?}])
      (swap! *depend-on-block-uuid-set conj target-uuid))))

(defmethod local-block-ops->remote-ops-aux :update-op
  [_ & {:keys [repo conn block update-op left-uuid parent-uuid *remote-ops]}]
  (let [block-uuid (:block/uuid block)
        attr-map (:updated-attrs (second update-op))
        attr-alias-map (when (contains? attr-map :alias)
                         (remove-non-exist-block-uuids-in-add-retract-map conn (:alias attr-map)))
        attr-tags-map (when (contains? attr-map :tags)
                        (remove-non-exist-block-uuids-in-add-retract-map conn (:tags attr-map)))
        attr-type-map (when (contains? attr-map :type)
                        (let [{:keys [add retract]} (:type attr-map)
                              current-type-value (set (:block/type block))
                              add (set/intersection add current-type-value)
                              retract (set/difference retract current-type-value)]
                          (cond-> {}
                            (seq add)     (assoc :add add)
                            (seq retract) (assoc :retract retract))))
        attr-properties-map (when (contains? attr-map :properties)
                              (let [{:keys [add retract]} (:properties attr-map)
                                    properties (:block/properties block)
                                    add* (into []
                                               (update-vals (select-keys properties add)
                                                            (partial transit/write transit-w)))]
                                (cond-> {}
                                  (seq add*) (assoc :add add*)
                                  (seq retract) (assoc :retract retract))))
        target-uuid (or left-uuid parent-uuid)
        sibling? (not= left-uuid parent-uuid)]
    (swap! *remote-ops conj
           [:update
            (cond-> {:block-uuid block-uuid}
              (:block/updated-at block)       (assoc :updated-at (:block/updated-at block))
              (:block/created-at block)       (assoc :created-at (:block/created-at block))
              (contains? attr-map :schema)    (assoc :schema
                                                     (transit/write transit-w (:block/schema block)))
              attr-alias-map                  (assoc :alias attr-alias-map)
              attr-type-map                   (assoc :type attr-type-map)
              attr-tags-map                   (assoc :tags attr-tags-map)
              attr-properties-map             (assoc :properties attr-properties-map)
              (and (contains? attr-map :content)
                   (:block/content block))
              (assoc :content (:block/content block))
              (and (contains? attr-map :link)
                   (:block/uuid (:block/link block)))
              (assoc :link (:block/uuid (:block/link block)))
              target-uuid                     (assoc :target-uuid target-uuid :sibling? sibling?))])))

(defmethod local-block-ops->remote-ops-aux :update-page-op
  [_ & {:keys [conn block-uuid *remote-ops]}]
  (when-let [{page-name :block/name original-name :block/original-name}
             (d/entity @conn [:block/uuid block-uuid])]
    (swap! *remote-ops conj
           [:update-page {:block-uuid block-uuid
                          :page-name page-name
                          :original-name (or original-name page-name)}])))

(defmethod local-block-ops->remote-ops-aux :remove-op
  [_ & {:keys [conn remove-op *remote-ops]}]
  (when-let [block-uuid (:block-uuid (second remove-op))]
    (when (nil? (d/entity @conn [:block/uuid block-uuid]))
      (swap! *remote-ops conj [:remove {:block-uuids [block-uuid]}]))))

(defmethod local-block-ops->remote-ops-aux :remove-page-op
  [_ & {:keys [conn remove-page-op *remote-ops]}]
  (when-let [block-uuid (:block-uuid (second remove-page-op))]
    (when (nil? (d/entity @conn [:block/uuid block-uuid]))
      (swap! *remote-ops conj [:remove-page {:block-uuid block-uuid}]))))

(defn- local-block-ops->remote-ops
  [repo conn block-ops]
  (let [*depend-on-block-uuid-set (atom #{})
        *remote-ops (atom [])
        {move-op :move remove-op :remove update-op :update update-page-op :update-page remove-page-op :remove-page}
        block-ops]
    (when-let [block-uuid
               (some (comp :block-uuid second) [move-op update-op update-page-op])]
      (when-let [block (d/entity @conn [:block/uuid block-uuid])]
        (let [left-uuid (some-> block :block/left :block/uuid)
              parent-uuid (some-> block :block/parent :block/uuid)]
          (when parent-uuid ; whiteboard blocks don't have :block/left
            ;; remote-move-op
            (when move-op
              (local-block-ops->remote-ops-aux :move-op
                                               :parent-uuid parent-uuid
                                               :left-uuid left-uuid
                                               :block-uuid block-uuid
                                               :*remote-ops *remote-ops
                                               :*depend-on-block-uuid-set *depend-on-block-uuid-set)))
          ;; remote-update-op
          (when update-op
            (local-block-ops->remote-ops-aux :update-op
                                             :repo repo
                                             :conn conn
                                             :block block
                                             :update-op update-op
                                             :parent-uuid parent-uuid
                                             :left-uuid left-uuid
                                             :*remote-ops *remote-ops)))
        ;; remote-update-page-op
        (when update-page-op
          (local-block-ops->remote-ops-aux :update-page-op
                                           :repo repo
                                           :conn conn
                                           :block-uuid block-uuid
                                           :*remote-ops *remote-ops))))
    ;; remote-remove-op
    (when remove-op
      (local-block-ops->remote-ops-aux :remove-op
                                       :repo repo
                                       :conn conn
                                       :remove-op remove-op
                                       :*remote-ops *remote-ops))

    ;; remote-remove-page-op
    (when remove-page-op
      (local-block-ops->remote-ops-aux :remove-page-op
                                       :repo repo
                                       :conn conn
                                       :remove-page-op remove-page-op
                                       :*remote-ops *remote-ops))

    {:remote-ops @*remote-ops
     :depend-on-block-uuids @*depend-on-block-uuid-set}))


(defn gen-block-uuid->remote-ops
  [repo conn & {:keys [n] :or {n 50}}]
  (loop [current-handling-block-ops nil
         current-handling-block-uuid nil
         depend-on-block-uuid-coll nil
         r {}]
    (cond
      (and (empty? current-handling-block-ops)
           (empty? depend-on-block-uuid-coll)
           (>= (count r) n))
      r

      (and (empty? current-handling-block-ops)
           (empty? depend-on-block-uuid-coll))
      (if-let [{min-epoch-block-ops :ops block-uuid :block-uuid} (op-mem-layer/get-min-epoch-block-ops repo)]
        (do (assert (not (contains? r block-uuid)) {:r r :block-uuid block-uuid})
            (op-mem-layer/remove-block-ops! repo block-uuid)
            (recur min-epoch-block-ops block-uuid depend-on-block-uuid-coll r))
        ;; finish
        r)

      (and (empty? current-handling-block-ops)
           (seq depend-on-block-uuid-coll))
      (let [[block-uuid & other-block-uuids] depend-on-block-uuid-coll
            block-ops (op-mem-layer/get-block-ops repo block-uuid)]
        (op-mem-layer/remove-block-ops! repo block-uuid)
        (recur block-ops block-uuid other-block-uuids r))

      (seq current-handling-block-ops)
      (let [{:keys [remote-ops depend-on-block-uuids]}
            (local-block-ops->remote-ops repo conn current-handling-block-ops)]
        (recur nil nil
               (set/union (set depend-on-block-uuid-coll)
                          (op-mem-layer/intersection-block-uuids repo depend-on-block-uuids))
               (assoc r current-handling-block-uuid (into {} remote-ops)))))))

(defn sort-remote-ops
  [block-uuid->remote-ops]
  (let [block-uuid->dep-uuid
        (into {}
              (keep (fn [[block-uuid remote-ops]]
                      (when-let [move-op (get remote-ops :move)]
                        [block-uuid (:target-uuid move-op)])))
              block-uuid->remote-ops)
        all-move-uuids (set (keys block-uuid->dep-uuid))
        sorted-uuids
        (loop [r []
               rest-uuids all-move-uuids
               uuid (first rest-uuids)]
          (if-not uuid
            r
            (let [dep-uuid (block-uuid->dep-uuid uuid)]
              (if-let [next-uuid (get rest-uuids dep-uuid)]
                (recur r rest-uuids next-uuid)
                (let [rest-uuids* (disj rest-uuids uuid)]
                  (recur (conj r uuid) rest-uuids* (first rest-uuids*)))))))
        sorted-move-ops (keep
                         (fn [block-uuid]
                           (some->> (get-in block-uuid->remote-ops [block-uuid :move])
                                    (vector :move)))
                         sorted-uuids)
        remove-ops (keep
                    (fn [[_ remote-ops]]
                      (some->> (:remove remote-ops) (vector :remove)))
                    block-uuid->remote-ops)
        update-ops (keep
                    (fn [[_ remote-ops]]
                      (some->> (:update remote-ops) (vector :update)))
                    block-uuid->remote-ops)
        update-page-ops (keep
                         (fn [[_ remote-ops]]
                           (some->> (:update-page remote-ops) (vector :update-page)))
                         block-uuid->remote-ops)
        remove-page-ops (keep
                         (fn [[_ remote-ops]]
                           (some->> (:remove-page remote-ops) (vector :remove-page)))
                         block-uuid->remote-ops)]
    (concat update-page-ops remove-ops sorted-move-ops update-ops remove-page-ops)))


(defn- <client-op-update-handler
  [state token]
  {:pre [(some? @(:*graph-uuid state))
         (some? @(:*repo state))]}
  (go
    (let [repo @(:*repo state)
          conn @(:*db-conn state)
          date-formatter (:*date-formatter state)]
      (op-mem-layer/new-branch! repo)
      (try
        (let [ops-for-remote (sort-remote-ops (gen-block-uuid->remote-ops repo conn))
              local-tx (op-mem-layer/get-local-tx repo)
              r (<? (ws/<send&receive state {:action "apply-ops" :graph-uuid @(:*graph-uuid state)
                                             :ops ops-for-remote :t-before (or local-tx 1)}))]
          (if-let [remote-ex (:ex-data r)]
            (case (:type remote-ex)
            ;; conflict-update remote-graph, keep these local-pending-ops
            ;; and try to send ops later
              :graph-lock-failed
              (do (prn :graph-lock-failed)
                  (op-mem-layer/rollback! repo)
                  nil)
            ;; this case means something wrong in remote-graph data,
            ;; nothing to do at client-side
              :graph-lock-missing
              (do (prn :graph-lock-missing)
                  (op-mem-layer/rollback! repo)
                  nil)

              :get-s3-object-failed
              (do (prn ::get-s3-object-failed r)
                  (op-mem-layer/rollback! repo)
                  nil)
            ;; else
              (do (op-mem-layer/rollback! repo)
                  (throw (ex-info "Unavailable" {:remote-ex remote-ex}))))
            (do (assert (pos? (:t r)) r)
                (op-mem-layer/commit! repo)
                (<! (<apply-remote-data repo conn date-formatter r))
                (prn :<client-op-update-handler :t (:t r)))))
        (catch :default e
          (prn ::unknown-ex e)
          (op-mem-layer/rollback! repo)
          nil)))))

(defn- make-push-client-ops-timeout-ch
  [repo never-timeout?]
  (if never-timeout?
    (chan)
    (go
      (<! (async/timeout 2000))
      (pos? (op-mem-layer/get-unpushed-block-update-count repo)))))

(defn <loop-for-rtc
  [state graph-uuid repo conn date-formatter & {:keys [loop-started-ch token]}]
  {:pre [(state-validator state)
         (some? graph-uuid)
         (some? repo)]}
  (go
    (reset! (:*repo state) repo)
    (reset! (:*db-conn state) conn)
    (reset! (:*date-formatter state) date-formatter)
    (reset! (:*rtc-state state) :open)
    (let [{:keys [data-from-ws-pub _client-op-update-chan]} state
          push-data-from-ws-ch (chan (async/sliding-buffer 100) (map rtc-const/data-from-ws-coercer))
          stop-rtc-loop-chan (chan)
          *auto-push-client-ops? (:*auto-push-client-ops? state)
          force-push-client-ops-ch (:force-push-client-ops-chan state)
          toggle-auto-push-client-ops-ch (:toggle-auto-push-client-ops-chan state)]
      (reset! (:*stop-rtc-loop-chan state) stop-rtc-loop-chan)
      (<! (ws/<ensure-ws-open! state))
      (reset! (:*graph-uuid state) graph-uuid)
      (with-sub-data-from-ws state
        (<! (ws/<send! state {:action "register-graph-updates" :req-id (get-req-id) :graph-uuid graph-uuid}))
        (<! (get-result-ch)))

      (async/sub data-from-ws-pub "push-updates" push-data-from-ws-ch)
      (when loop-started-ch (async/close! loop-started-ch))
      (<! (go-loop [push-client-ops-ch
                    (make-push-client-ops-timeout-ch repo (not @*auto-push-client-ops?))]
            (let [{:keys [push-data-from-ws client-op-update stop continue]}
                  (async/alt!
                    toggle-auto-push-client-ops-ch {:continue true}
                    force-push-client-ops-ch {:client-op-update true}
                    push-client-ops-ch ([v] (if (and @*auto-push-client-ops? (true? v))
                                              {:client-op-update true}
                                              {:continue true}))
                    push-data-from-ws-ch ([v] {:push-data-from-ws v})
                    stop-rtc-loop-chan {:stop true}
                    :priority true)]
              (cond
                continue
                (recur (make-push-client-ops-timeout-ch repo (not @*auto-push-client-ops?)))

                push-data-from-ws
                (let [r (<! (<push-data-from-ws-handler repo conn date-formatter push-data-from-ws))]
                  (when (= r ::need-pull-remote-data)
                    ;; trigger a force push, which can pull remote-diff-data from local-t to remote-t
                    (async/put! force-push-client-ops-ch true))
                  (recur (make-push-client-ops-timeout-ch repo (not @*auto-push-client-ops?))))

                client-op-update
                ;; FIXME: access token expired
                (let [_ (<! (<client-op-update-handler state token))]
                  (recur (make-push-client-ops-timeout-ch repo (not @*auto-push-client-ops?))))

                stop
                (do (ws/stop @(:*ws state))
                    (reset! (:*rtc-state state) :closed))

                :else
                nil))))
      (async/unsub data-from-ws-pub "push-updates" push-data-from-ws-ch))))


(defn <grant-graph-access-to-others
  [state graph-uuid & {:keys [target-user-uuids target-user-emails]}]
  (go
    (let [r (with-sub-data-from-ws state
              (<! (ws/<send! state (cond-> {:req-id (get-req-id)
                                            :action "grant-access"
                                            :graph-uuid graph-uuid}
                                     target-user-uuids (assoc :target-user-uuids target-user-uuids)
                                     target-user-emails (assoc :target-user-emails target-user-emails))))
              (<! (get-result-ch)))]
      (if-let [ex-message (:ex-message r)]
        (prn ::<grant-graph-access-to-others ex-message (:ex-data r))
        (prn ::<grant-graph-access-to-others :succ)))))

(defn <toggle-auto-push-client-ops
  [state]
  (go
    (swap! (:*auto-push-client-ops? state) not)
    (>! (:toggle-auto-push-client-ops-chan state) true)
    @(:*auto-push-client-ops? state)))

(defn <get-block-content-versions
  [state block-uuid]
  (let [d (p/deferred)]
    (go
      (when (some-> state :*graph-uuid deref)
        (with-sub-data-from-ws state
          (<! (ws/<send! state {:req-id (get-req-id)
                                :action "query-block-content-versions"
                                :block-uuids [block-uuid]
                                :graph-uuid @(:*graph-uuid state)}))
          (let [{:keys [ex-message ex-data versions]} (<! (get-result-ch))]
            (if ex-message
              (do
                (prn ::<get-block-content-versions :ex-message ex-message :ex-data ex-data)
                (p/resolve! nil))
              (p/resolve! (bean/->js versions)))))))
    d))


(defn init-state
  [ws data-from-ws-chan token]
  ;; {:post [(m/validate state-schema %)]}
  {:*rtc-state (atom :closed :validator rtc-state-validator)
   :*graph-uuid (atom nil)
   :*repo (atom nil)
   :*db-conn (atom nil)
   :*token (atom token)
   :*date-formatter (atom nil)
   :data-from-ws-chan data-from-ws-chan
   :data-from-ws-pub (async/pub data-from-ws-chan :req-id)
   :toggle-auto-push-client-ops-chan (chan (async/sliding-buffer 1))
   :*auto-push-client-ops? (atom true :validator boolean?)
   :*stop-rtc-loop-chan (atom nil)
   :force-push-client-ops-chan (chan (async/sliding-buffer 1))
   :*ws (atom ws)})

(defonce *state (atom nil))

(defn get-debug-state
  ([repo]
   (get-debug-state repo @*state))
  ([repo state]
   (let [graph-uuid (op-mem-layer/get-graph-uuid repo)
         local-tx (op-mem-layer/get-local-tx repo)
         unpushed-block-update-count (op-mem-layer/get-unpushed-block-update-count repo)]
     (cond->
      {:graph-uuid graph-uuid
       :local-tx local-tx
       :unpushed-block-update-count unpushed-block-update-count}
       state
       (merge
        {:rtc-state @(:*rtc-state state)
         :ws-state (ws/get-state @(:*ws state))
         :auto-push-updates? (and @*state @(:*auto-push-client-ops? state))})))))

;; FIXME: token might be expired
(defn <init-state
  [token]
  (go
    (let [data-from-ws-chan (chan (async/sliding-buffer 100))
          ws-opened-ch (chan)
          ws (ws/ws-listen token data-from-ws-chan ws-opened-ch)]
      (<! ws-opened-ch)
      (let [state (init-state ws data-from-ws-chan token)]
        (reset! *state state)
        state))))

(defn <start-rtc
  [repo conn token]
  (go
    (let [state (<init-state token)
          config (worker-state/get-config repo)]
      (if-let [graph-uuid (op-mem-layer/get-graph-uuid repo)]
        (<! (<loop-for-rtc state graph-uuid repo conn (common-config/get-date-formatter config)))
        (worker-util/post-message :notification [[:div
                                                  [:p "RTC is not supported for this graph"]]
                                                 :error])))))

(defn <stop-rtc
  []
  (when-let [state @*state]
    (when-let [*chan (:*stop-rtc-loop-chan state)]
     (async/close! @*chan))))

(defn <toggle-sync
  []
  (when-let [state @*state]
    (<toggle-auto-push-client-ops state)))

(defn <get-graphs
  [token]
  (let [d (p/deferred)]
    (go
     (let [state (or @*state (<! (<init-state token)))
           graph-list (with-sub-data-from-ws state
                        (<! (ws/<send! state {:req-id (get-req-id)
                                              :action "list-graphs"}))
                        (:graphs (<! (get-result-ch))))]
       (p/resolve! (bean/->js graph-list))))
    d))

(add-watch *state :notify-main-thread
           (fn [_ _ old new]
             (let [new-state (get-debug-state @(:*repo new) new)
                   old-state (get-debug-state @(:*repo old) old)]
               (when (not= new-state old-state)
                 (worker-util/post-message :rtc-sync-state (bean/->js new-state))))))
