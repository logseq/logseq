(ns frontend.db.rtc.core
  "Main ns for rtc related fns"
  (:require-macros
   [frontend.db.rtc.macro :refer [with-sub-data-from-ws get-req-id get-result-ch]])
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs.core.async :as async :refer [<! chan go go-loop]]
            [cljs.core.async.interop :refer [p->c]]
            [clojure.set :as set]
            [frontend.db :as db]
            [frontend.db.rtc.op :as op]
            [frontend.db.rtc.ws :as ws]
            [frontend.db.rtc.const :as rtc-const]
            [frontend.handler.page :as page-handler]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.transaction :as outliner-tx]
            [frontend.util :as util]
            [malli.core :as m]
            [malli.transform :as mt]
            [malli.util :as mu]))


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
  | :*rtc-state            | atom of state of current rtc progress               |
"
  [:map
   [:user-uuid :string]
   [:*graph-uuid :any]
   [:*repo :any]
   [:data-from-ws-chan :any]
   [:data-from-ws-pub :any]
   [:client-op-update-chan :any]
   [:*stop-rtc-loop-chan :any]
   [:*ws :any]
   [:*rtc-state :any]])
(def state-validator (fn [data] (if ((m/validator state-schema) data)
                                  true
                                  (prn (mu/explain-data state-schema data)))))

(def rtc-state-schema
  [:enum :open :closed])
(def rtc-state-validator (m/validator rtc-state-schema))

(def data-from-ws-decoder (m/decoder rtc-const/data-from-ws-schema mt/string-transformer))

(def data-from-ws-validator (fn [data] (if ((m/validator rtc-const/data-from-ws-schema) data)
                                         true
                                         (prn data))))


(defn apply-remote-remove-ops
  [repo remove-ops]
  (prn :remove-ops remove-ops)
  (doseq [op remove-ops]
    (when-let [block (db/entity repo [:block/uuid (uuid (:block-uuid op))])]
      (outliner-tx/transact!
       {:persist-op? false}
       (outliner-core/delete-blocks! [block] {:children? false}))
      (prn :apply-remote-remove-ops (:block-uuid op)))))

(defn- insert-or-move-block
  [repo block-uuid-str remote-parents remote-left-uuid-str move?]
  (when (and (seq remote-parents) remote-left-uuid-str)
    (let [local-left (db/entity repo [:block/uuid (uuid remote-left-uuid-str)])
          first-remote-parent (first remote-parents)
          local-parent (db/entity repo [:block/uuid (uuid first-remote-parent)])
          b {:block/uuid (uuid block-uuid-str)}
          ;; b-ent (db/entity repo [:block/uuid (uuid block-uuid-str)])
          ]
      (case [(some? local-parent) (some? local-left)]
        [false true]
        (outliner-tx/transact!
         {:persist-op? false}
         (if move?
           (outliner-core/move-blocks! [b] local-left true)
           (outliner-core/insert-blocks! [{:block/uuid (uuid block-uuid-str) :block/content ""
                                           :block/format :markdown}]
                                         local-left {:sibling? true :keep-uuid? true})))

        [true true]
        (let [sibling? (not= (:block/uuid local-parent) (:block/uuid local-left))]
          (outliner-tx/transact!
           {:persist-op? false}
           (if move?
             (outliner-core/move-blocks! [b] local-left sibling?)
             (outliner-core/insert-blocks! [{:block/uuid (uuid block-uuid-str) :block/content ""
                                             :block/format :markdown}]
                                           local-left {:sibling? sibling? :keep-uuid? true}))))

        [true false]
        (outliner-tx/transact!
         {:persist-op? false}
         (if move?
           (outliner-core/move-blocks! [b] local-parent false)
           (outliner-core/insert-blocks! [{:block/uuid (uuid block-uuid-str) :block/content ""
                                           :block/format :markdown}]
                                         local-parent {:sibling? false :keep-uuid? true})))

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
  [repo block-uuid-str remote-parents remote-left-uuid-str]
  (let [local-b (db/entity repo [:block/uuid (uuid block-uuid-str)])
        remote-parent-uuid-str (first remote-parents)]
    (cond
      (nil? local-b)
      :not-exist

      (not (and (= (str (:block/uuid (:block/parent local-b))) remote-parent-uuid-str)
                (= (str (:block/uuid (:block/left local-b))) remote-left-uuid-str)))
      :wrong-pos
      :else nil)))

(defn- update-block-attrs
  [repo block-uuid op-value]
  (let [key-set (set/intersection
                 (conj rtc-const/general-attr-set :content)
                 (set (keys op-value)))]
    (when (seq key-set)
      (let [b-ent (db/entity repo [:block/uuid block-uuid])
            new-block
            (cond-> (db/pull repo '[*] (:db/id b-ent))
              (and (contains? key-set :content)
                   (not= (:content op-value)
                         (:block/content b-ent))) (assoc :block/content (:content op-value))
              (contains? key-set :updated-at)     (assoc :block/updated-at (:updated-at op-value))
              (contains? key-set :created-at)     (assoc :block/created-at (:created-at op-value))
              (contains? key-set :alias)          (assoc :block/alias (some->> (seq (:alias op-value))
                                                                               (map (partial vector :block/uuid))
                                                                               (db/pull-many repo [:db/id])
                                                                               (keep :db/id)))
              (contains? key-set :type)           (assoc :block/type (:type op-value))
              (contains? key-set :schema)         (assoc :block/schema (:schema op-value))
              (contains? key-set :tags)           (assoc :block/tags (some->> (seq (:tags op-value))
                                                                              (map (partial vector :block/uuid))
                                                                              (db/pull-many repo [:db/id])
                                                                              (keep :db/id))))]
        (outliner-tx/transact!
         {:persist-op? false}
         (outliner-core/save-block! new-block))))))

(defn apply-remote-move-ops
  [repo sorted-move-ops]
  (prn :sorted-move-ops sorted-move-ops)
  (doseq [{:keys [parents left self] :as op-value} sorted-move-ops]
    (let [r (check-block-pos repo self parents left)]
      (case r
        :not-exist
        (insert-or-move-block repo self parents left false)
        :wrong-pos
        (insert-or-move-block repo self parents left true)
        nil                             ; do nothing
        nil)
      (update-block-attrs repo (uuid self) op-value)
      (prn :apply-remote-move-ops self r parents left))))


(defn apply-remote-update-ops
  [repo update-ops]
  (prn :update-ops update-ops)
  (doseq [{:keys [parents left self] :as op-value} update-ops]
    (when (and parents left)
      (let [r (check-block-pos repo self parents left)]
        (case r
          :not-exist
          (insert-or-move-block repo self parents left false)
          :wrong-pos
          (insert-or-move-block repo self parents left true)
          nil)))
    (update-block-attrs repo (uuid self) op-value)
    (prn :apply-remote-update-ops self)))

(defn apply-remote-update-page-ops
  [repo update-page-ops]
  (doseq [{:keys [self page-name] :as op-value } update-page-ops]
    (let [old-page-name (:block/name (db/entity repo [:block/uuid (uuid self)]))
          exist-page (db/entity repo [:block/name page-name])]
      (cond
          ;; same name but different uuid
          ;; remote page has same block/name as local's, but they don't have same block/uuid.
          ;; 1. rename local page's name to '<origin-name>-<ms-epoch>-Conflict'
          ;; 2. create page, name=<origin-name>, uuid=remote-uuid
        (and exist-page (not= (:block/uuid exist-page) (uuid self)))
        (do (page-handler/rename! page-name (util/format "%s-%s-CONFLICT" page-name (tc/to-long (t/now))))
            (page-handler/create! page-name {:redirect? false :create-first-block? false
                                             :uuid (uuid self) :persist-op? false}))

          ;; a client-page has same uuid as remote but different page-names,
          ;; then we need to rename the client-page to remote-page-name
        (and old-page-name (not= old-page-name page-name))
        (page-handler/rename! old-page-name page-name false false)

          ;; no such page, name=remote-page-name, OR, uuid=remote-block-uuid
          ;; just create-page
        :else
        (page-handler/create! page-name {:redirect? false :create-first-block? false
                                         :uuid (uuid self) :persist-op? false}))

      (update-block-attrs repo (uuid self) op-value))))

(defn apply-remote-remove-page-ops
  [repo remove-page-ops]
  (doseq [op remove-page-ops]
    (when-let [page-name (:block/name (db/entity repo [:block/uuid (uuid (:block-uuid op))]))]
      (page-handler/delete! page-name nil {:redirect-to-home? false :persist-op? false}))))


(defn <apply-remote-data
  [repo data-from-ws]
  {:pre [(data-from-ws-validator data-from-ws)]}
  (go
    (let [
          affected-blocks-map (:affected-blocks data-from-ws)
          remote-t (:t data-from-ws)
          local-t (<! (p->c (op/<get-ops&local-tx repo)))]
      (if (<= remote-t local-t)
        (prn ::skip :remote-t remote-t :local-t local-t)
        (let [{remove-ops-map :remove move-ops-map :move update-ops-map :update-attrs
               update-page-ops-map :update-page remove-page-ops-map :remove-page}
              (update-vals
               (group-by (fn [[_ env]] (get env :op)) affected-blocks-map)
               (partial into {}))
              remove-ops (vals remove-ops-map)
              sorted-move-ops (move-ops-map->sorted-move-ops move-ops-map)
              update-ops (vals update-ops-map)
              update-page-ops (vals update-page-ops-map)
              remove-page-ops (vals remove-page-ops-map)]
          (util/profile ::apply-remote-update-page-ops (apply-remote-update-page-ops repo update-page-ops))
          (util/profile ::apply-remote-remove-ops (apply-remote-remove-ops repo remove-ops))
          (util/profile ::apply-remote-move-ops (apply-remote-move-ops repo sorted-move-ops))
          (util/profile ::apply-remote-update-ops (apply-remote-update-ops repo update-ops))
          (util/profile ::apply-remote-remove-page-ops (apply-remote-remove-page-ops repo remove-page-ops))
          (<! (p->c (op/<update-local-tx! repo remote-t))))))))

(defn- <push-data-from-ws-handler
  [repo push-data-from-ws]
  (go (<! (<apply-remote-data repo push-data-from-ws))
      (prn :push-data-from-ws push-data-from-ws)))

(defn- local-ops->remote-ops
  "when verbose?, update ops will contain more attributes"
  [repo sorted-ops _verbose?]
  (let [[remove-block-uuid-set move-block-uuid-set update-page-uuid-set remove-page-uuid-set update-block-uuid->attrs]
        (reduce
         (fn [[remove-block-uuid-set move-block-uuid-set update-page-uuid-set
               remove-page-uuid-set update-block-uuid->attrs]
              op]
           (case (first op)
             "move"
             (let [block-uuids (set (:block-uuids (second op)))
                   move-block-uuid-set (set/union move-block-uuid-set block-uuids)
                   remove-block-uuid-set (set/difference remove-block-uuid-set block-uuids)]
               [remove-block-uuid-set move-block-uuid-set update-page-uuid-set
                remove-page-uuid-set update-block-uuid->attrs])

             "remove"
             (let [block-uuids (set (:block-uuids (second op)))
                   move-block-uuid-set (set/difference move-block-uuid-set block-uuids)
                   remove-block-uuid-set (set/union remove-block-uuid-set block-uuids)]
               [remove-block-uuid-set move-block-uuid-set update-page-uuid-set
                remove-page-uuid-set update-block-uuid->attrs])

             "update-page"
             (let [block-uuid (:block-uuid (second op))
                   update-page-uuid-set (conj update-page-uuid-set block-uuid)]
               [remove-block-uuid-set move-block-uuid-set update-page-uuid-set
                remove-page-uuid-set update-block-uuid->attrs])

             "remove-page"
             (let [block-uuid (:block-uuid (second op))
                   remove-page-uuid-set (conj remove-page-uuid-set block-uuid)]
               [remove-block-uuid-set move-block-uuid-set update-page-uuid-set
                remove-page-uuid-set update-block-uuid->attrs])

             "update"
             (let [{:keys [block-uuid updated-attrs]} (second op)
                   attr-map (update-block-uuid->attrs block-uuid)
                   {{old-alias-add :add old-alias-retract :retract} :alias
                    {old-tags-add :add old-tags-retract :retract}   :tags
                    {old-type-add :add old-type-retract :retract}   :type} attr-map
                   {{new-alias-add :add new-alias-retract :retract} :alias
                    {new-tags-add :add new-tags-retract :retract}   :tags
                    {new-type-add :add new-type-retract :retract}   :type} updated-attrs
                   new-attr-map
                   (cond-> (merge (select-keys updated-attrs [:content :schema])
                                  (select-keys attr-map [:content :schema]))
                     ;; alias
                     (or old-alias-add new-alias-add)
                     (assoc-in [:alias :add] (set/union old-alias-add new-alias-add))
                     (or old-alias-retract new-alias-retract)
                     (assoc-in [:alias :retract] (set/difference (set/union old-alias-retract new-alias-retract)
                                                                 old-alias-add new-alias-add))
                     ;; tags
                     (or old-tags-add new-tags-add)
                     (assoc-in [:tags :add] (set/union old-tags-add new-tags-add))
                     (or old-tags-retract new-tags-retract)
                     (assoc-in [:tags :retract] (set/difference (set/union old-tags-retract new-tags-retract)
                                                                old-tags-add new-tags-add))
                     ;; type
                     (or old-type-add new-type-add)
                     (assoc-in [:type :add] (set/union old-type-add new-type-add))
                     (or old-type-retract new-type-retract)
                     (assoc-in [:type :retract] (set/difference (set/union old-type-retract new-type-retract)
                                                                old-type-add new-type-retract)))
                   update-block-uuid->attrs (assoc update-block-uuid->attrs block-uuid new-attr-map)]
               [remove-block-uuid-set move-block-uuid-set update-page-uuid-set
                remove-page-uuid-set update-block-uuid->attrs])
             (throw (ex-info "unknown op type" op))))
         [#{} #{} #{} #{} {}] sorted-ops)
        move-ops (keep
                  (fn [block-uuid]
                    (when-let [block (db/entity repo [:block/uuid (uuid block-uuid)])]
                      (let [left-uuid (some-> block :block/left :block/uuid str)
                            parent-uuid (some-> block :block/parent :block/uuid str)]
                        (when (and left-uuid parent-uuid)
                          [:move
                           {:block-uuid block-uuid :target-uuid left-uuid :sibling? (not= left-uuid parent-uuid)}]))))
                  move-block-uuid-set)
        remove-block-uuid-set
        (filter (fn [block-uuid] (nil? (db/entity repo [:block/uuid (uuid block-uuid)]))) remove-block-uuid-set)
        remove-ops (when (seq remove-block-uuid-set) [[:remove {:block-uuids remove-block-uuid-set}]])
        update-page-ops (keep (fn [block-uuid]
                                (when-let [page-name (:block/name (db/entity repo [:block/uuid (uuid block-uuid)]))]
                                  [:update-page {:block-uuid block-uuid :page-name page-name}]))
                              update-page-uuid-set)
        remove-page-ops (keep (fn [block-uuid]
                                (when (nil? (db/entity repo [:block/uuid (uuid block-uuid)]))
                                  [:remove-page {:block-uuid block-uuid}]))
                              remove-page-uuid-set)
        update-ops (keep (fn [[block-uuid attr-map]]
                           (when-let [b (db/entity repo [:block/uuid (uuid block-uuid)])]
                             (let [key-set (set (keys attr-map))
                                   left-uuid (some-> b :block/left :block/uuid str)
                                   parent-uuid (some-> b :block/parent :block/uuid str)
                                   attr-alias-map (when (contains? key-set :alias)
                                                    (let [{:keys [add retract]} (:alias attr-map)
                                                          add-uuids (->> add
                                                                         (map (fn [x] [:block/uuid x]))
                                                                         (db/pull-many repo [:block/uuid])
                                                                         (keep :block/uuid)
                                                                         (map str))
                                                          retract-uuids (map str retract)]
                                                      {:add add-uuids :retract retract-uuids}))
                                   attr-type-map (when (contains? key-set :type)
                                                   (let [{:keys [add retract]} (:type attr-map)
                                                         current-type-value (set (:block/type b))
                                                         add (set/intersection add current-type-value)
                                                         retract (set/difference retract current-type-value)]
                                                     {:add add :retract retract}))
                                   attr-tags-map (when (contains? key-set :tags)
                                                   (let [{:keys [add retract]} (:tags attr-map)
                                                         add-uuids (->> add
                                                                        (map (fn [x] [:block/uuid x]))
                                                                        (db/pull-many repo [:block/uuid])
                                                                        (keep :block/uuid)
                                                                        (map str))
                                                         retract-uuids (map str retract)]
                                                     {:add add-uuids :retract retract-uuids}))]
                               [:update
                                (cond-> {:block-uuid block-uuid}
                                  (:block/updated-at b)       (assoc :updated-at (:block/updated-at b))
                                  (:block/created-at b)       (assoc :created-at (:block/created-at b))
                                  (contains? key-set :schema) (assoc :schema (:block/schema b))
                                  attr-type-map               (assoc :type attr-type-map)
                                  attr-alias-map              (assoc :alias attr-alias-map)
                                  attr-tags-map               (assoc :tags attr-tags-map)
                                  (and (contains? key-set :content)
                                       (:block/content b))    (assoc :content (:block/content b))
                                  (and left-uuid parent-uuid) (assoc :target-uuid left-uuid
                                                                     :sibling? (not= left-uuid parent-uuid)))])))
                         update-block-uuid->attrs)]
    [update-page-ops remove-ops move-ops update-ops remove-page-ops]))


(defn- <client-op-update-handler
  [state]
  {:pre [(some? @(:*graph-uuid state))
         (some? @(:*repo state))]}
  (go
    (let [repo @(:*repo state)
          {:keys [ops local-tx]} (<! (p->c (op/<get-ops&local-tx repo)))
          ops* (mapv second ops)
          op-keys (mapv first ops)
          ops-for-remote (apply concat (local-ops->remote-ops repo ops* nil))
          r (with-sub-data-from-ws state
              (<! (ws/<send! state {:req-id (get-req-id)
                                    :action "apply-ops" :graph-uuid @(:*graph-uuid state)
                                    :ops ops-for-remote :t-before (or local-tx 1)}))
              (<! (get-result-ch)))]
      (if-let [remote-ex (:ex-data r)]
        (case (:type remote-ex)
          ;; conflict-update remote-graph, keep these local-pending-ops
          ;; and try to send ops later
          "graph-lock-failed"
          (do (prn :graph-lock-failed)
              nil)
          ;; this case means something wrong in remote-graph data,
          ;; nothing to do at client-side
          "graph-lock-missing"
          (do (prn :graph-lock-missing)
              nil)
          ;; else
          (throw (ex-info "Unavailable" {:remote-ex remote-ex})))
        (do (<! (p->c (op/<clean-ops repo op-keys)))
            (<! (<apply-remote-data repo (data-from-ws-decoder r)))
            (prn :<client-op-update-handler r))))))

(defn <loop-for-rtc
  [state graph-uuid repo]
  {:pre [(state-validator state)
         (some? graph-uuid)
         (some? repo)]}
  (go
    (reset! (:*repo state) repo)
    (reset! (:*rtc-state state) :open)
    (let [{:keys [data-from-ws-pub client-op-update-chan]} state
          push-data-from-ws-ch (chan (async/sliding-buffer 100) (map data-from-ws-decoder))
          stop-rtc-loop-chan (chan)]
      (reset! (:*stop-rtc-loop-chan state) stop-rtc-loop-chan)
      (<! (ws/<ensure-ws-open! state))
      (reset! (:*graph-uuid state) graph-uuid)
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
                (do (<push-data-from-ws-handler repo push-data-from-ws)
                    (recur))
                client-op-update
                (do (<! (<client-op-update-handler state))
                    (recur))
                stop
                (do (ws/stop @(:*ws state))
                    (reset! (:*rtc-state state) :closed))
                :else
                nil))))
      (async/unsub data-from-ws-pub "push-updates" push-data-from-ws-ch))))

(defn- init-state
  [ws data-from-ws-chan user-uuid]
  (m/parse state-schema
           {:*rtc-state (atom :closed :validator rtc-state-validator)
            :user-uuid user-uuid
            :*graph-uuid (atom nil)
            :*repo (atom nil)
            :data-from-ws-chan data-from-ws-chan
            :data-from-ws-pub (async/pub data-from-ws-chan :req-id)
            :*stop-rtc-loop-chan (atom nil)
            :client-op-update-chan (chan 1)
            :*ws (atom ws)}))

(defn <init-state
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
    (def global-state (<! (<init-state))))
  (reset! (:*graph-uuid global-state) debug-graph-uuid)
  (reset! (:*repo global-state) (state/get-current-repo)))
