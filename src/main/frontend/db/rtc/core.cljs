(ns frontend.db.rtc.core
  (:require-macros
   [frontend.db.rtc.macro :refer [with-sub-data-from-ws get-req-id get-result-ch]])
  (:require [cljs.core.async :as async :refer [<! chan go go-loop]]
            [cljs.core.async.interop :refer [p->c]]
            [clojure.set :as set]
            [frontend.db :as db]
            [frontend.db.rtc.op :as op]
            [frontend.db.rtc.ws :as ws]
            [frontend.handler.page :as page-handler]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.transaction :as outliner-tx]
            [frontend.util :as util]
            [malli.core :as m]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]))

;;; TODO:
;;; 1. two clients, each one has a page with same name but different block-uuid.
;;;    happens when generating journal page everyday automatically.




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
(def state-validator (m/validator state-schema))

(def rtc-state-schema
  [:enum :open :closed])
(def rtc-state-validator (m/validator rtc-state-schema))

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
       [:content {:optional true} :string]]
      [:map
       [:op [:= "remove"]]
       [:block-uuid :string]]
      [:map
       [:op [:= "update-attrs"]]
       [:parents [:sequential :string]]
       [:left [:maybe :string]]
       [:self :string]
       [:content {:optional true} :string]]
      [:map
       [:op [:= "update-page"]]
       [:self :string]
       [:page-name :string]]
      [:map
       [:op [:= "remove-page"]]
       [:block-uuid :string]]]]]])
(def data-from-ws-validator (m/validator data-from-ws-schema))



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

(defn- insert-or-move-block
  [state block-uuid-str remote-parents remote-left-uuid-str content move?]
  {:pre [(some? @(:*repo state))]}
  (when (and (seq remote-parents) remote-left-uuid-str)
    (let [repo @(:*repo state)
          local-left (db/entity repo [:block/uuid (uuid remote-left-uuid-str)])
          first-remote-parent (first remote-parents)
          local-parent (db/entity repo [:block/uuid (uuid first-remote-parent)])
          b {:block/uuid (uuid block-uuid-str)}
          b-ent (db/entity repo [:block/uuid (uuid block-uuid-str)])]
      (case [(some? local-parent) (some? local-left)]
        [false true]
        (outliner-tx/transact!
         {:persist-op? false}
         (if move?
           (do (outliner-core/move-blocks! [b] local-left true)
               (when (and content (not= (:block/content b-ent) content))
                 (outliner-core/save-block! (assoc (db/pull repo '[*] [:block/uuid (uuid block-uuid-str)])
                                                   :block/content content))))
           (outliner-core/insert-blocks! [{:block/uuid (uuid block-uuid-str) :block/content content :block/format :markdown}]
                                         local-left {:sibling? true :keep-uuid? true})))

        [true true]
        (let [sibling? (not= (:block/uuid local-parent) (:block/uuid local-left))]
          (outliner-tx/transact!
           {:persist-op? false}
           (if move?
             (do (outliner-core/move-blocks! [b] local-left sibling?)
                 (when (and content (not= (:block/content b-ent) content))
                   (outliner-core/save-block! (assoc (db/pull repo '[*] [:block/uuid (uuid block-uuid-str)])
                                                     :block/content content))))
             (outliner-core/insert-blocks! [{:block/uuid (uuid block-uuid-str) :block/content content
                                             :block/format :markdown}]
                                           local-left {:sibling? sibling? :keep-uuid? true}))))

        [true false]
        (outliner-tx/transact!
         {:persist-op? false}
         (if move?
           (do (outliner-core/move-blocks! [b] local-parent false)
               (when (and content (not= (:block/content b-ent) content))
                 (outliner-core/save-block! (assoc (db/pull repo '[*] [:block/uuid (uuid block-uuid-str)])
                                                   :block/content content))))
           (outliner-core/insert-blocks! [{:block/uuid (uuid block-uuid-str) :block/content content
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
  (doseq [{:keys [parents left self content]} sorted-move-ops]
    (let [r (check-block-pos state self parents left)]
      (case r
        :not-exist
        (insert-or-move-block state self parents left content false)
        :wrong-pos
        (insert-or-move-block state self parents left content true)
        nil                               ; do nothing
        nil)
      (prn :apply-remote-move-ops self r parents left))))


(defn apply-remote-update-ops
  [state update-ops]
  {:pre [(some? @(:*repo state))]}
  (let [repo @(:*repo state)]
    (prn :update-ops update-ops)
    (doseq [{:keys [parents left self content]}
            update-ops]
      (let [r (check-block-pos state self parents left)]
        (case r
          :not-exist
          (insert-or-move-block state self parents left content false)
          :wrong-pos
          (insert-or-move-block state self parents left content true)
          nil
          (when content
            (outliner-tx/transact!
             {:persist-op? false}
             (outliner-core/save-block! (merge (db/pull repo '[*] [:block/uuid (uuid self)])
                                               {:block/uuid (uuid self)
                                                :block/content content
                                                :block/format :markdown})))))

        (prn :apply-remote-update-ops r self)))))

(defn apply-remote-update-page-ops
  [state update-page-ops]
  {:pre [(some? @(:*repo state))]}
  (let [repo @(:*repo state)]
    (doseq [{:keys [self page-name]} update-page-ops]
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
                                           :uuid (uuid self) :persist-op? false}))))))

(defn apply-remote-remove-page-ops
  [state remove-page-ops]
  {:pre [(some? @(:*repo state))]}
  (let [repo @(:*repo state)]
    (doseq [op remove-page-ops]
      (when-let [page-name (:block/name (db/entity repo [:block/uuid (uuid (:block-uuid op))]))]
        (page-handler/delete! page-name nil {:redirect-to-home? false :persist-op? false})))))


(defn <apply-remote-data
  [state data-from-ws]
  {:pre [(data-from-ws-validator data-from-ws)
         (some? @(:*repo state))]}
  (go
    (let [repo @(:*repo state)
          affected-blocks-map (update-keys (:affected-blocks data-from-ws) name)
          remote-t (:t data-from-ws)
          local-t (<! (p->c (op/<get-ops&local-tx repo)))]
      (if (<= remote-t local-t)
        (prn :skip :remote-t remote-t :local-t local-t)
        (let [{remove-ops-map "remove" move-ops-map "move" update-ops-map "update-attrs"
               update-page-ops-map "update-page" remove-page-ops-map "remove-page"}
              (update-vals
               (group-by (fn [[_ env]] (get env :op)) affected-blocks-map)
               (partial into {}))
              remove-ops (vals remove-ops-map)
              sorted-move-ops (move-ops-map->sorted-move-ops move-ops-map)
              update-ops (vals update-ops-map)
              update-page-ops (vals update-page-ops-map)
              remove-page-ops (vals remove-page-ops-map)]
          (prn :start-apply-remote-update-page-ops)
          (apply-remote-update-page-ops state update-page-ops)
          (prn :start-apply-remote-remove-ops)
          (apply-remote-remove-ops state remove-ops)
          (prn :start-apply-remote-move-ops)
          (apply-remote-move-ops state sorted-move-ops)
          (prn :start-apply-remote-update-ops)
          (apply-remote-update-ops state update-ops)
          (prn :start-apply-remote-remove-page-ops)
          (apply-remote-remove-page-ops state remove-page-ops)
          (<! (p->c (op/<update-local-tx! repo remote-t))))))))

(defn- <push-data-from-ws-handler
  [state push-data-from-ws]
  (go (<! (<apply-remote-data state push-data-from-ws))
      (prn :push-data-from-ws push-data-from-ws)))

(defn- client-ops->remote-ops
  [state ops]
  {:pre [(some? @(:*repo state))]}
  (let [repo @(:*repo state)
        [remove-block-uuids-set update-block-uuids-set move-block-uuids-set update-page-uuids-set remove-page-uuids-set]
        (loop [[op & other-ops] ops
               remove-block-uuids #{}
               update-block-uuids #{}
               move-block-uuids #{}
               update-page-uuids #{}
               remove-page-uuids #{}]
          (if-not op
            [remove-block-uuids update-block-uuids move-block-uuids update-page-uuids remove-page-uuids]
            (case (first op)
              "move"
              (let [block-uuids (set (:block-uuids (second op)))
                    move-block-uuids (set/union move-block-uuids block-uuids)
                    remove-block-uuids (set/difference remove-block-uuids block-uuids)]
                (recur other-ops remove-block-uuids update-block-uuids move-block-uuids update-page-uuids remove-page-uuids))
              "remove"
              (let [block-uuids (set (:block-uuids (second op)))
                    move-block-uuids (set/difference move-block-uuids block-uuids)
                    remove-block-uuids (set/union remove-block-uuids block-uuids)]
                (recur other-ops remove-block-uuids update-block-uuids move-block-uuids update-page-uuids remove-page-uuids))
              "update"
              (let [block-uuid (:block-uuid (second op))
                    update-block-uuids (conj update-block-uuids block-uuid)]
                (recur other-ops remove-block-uuids update-block-uuids move-block-uuids update-page-uuids remove-page-uuids))
              "update-page"
              (let [block-uuid (:block-uuid (second op))
                    update-page-uuids (conj update-page-uuids block-uuid)]
                (recur other-ops remove-block-uuids update-block-uuids move-block-uuids update-page-uuids remove-page-uuids))
              "remove-page"
              (let [block-uuid (:block-uuid (second op))
                    remove-page-uuids (conj remove-page-uuids block-uuid)]
                (recur other-ops remove-block-uuids update-block-uuids move-block-uuids update-page-uuids remove-page-uuids))
              (throw (ex-info "unknown op type" op)))))
        move-block-uuids (seq move-block-uuids-set)
        remove-block-uuids (seq remove-block-uuids-set)
        update-block-uuids (seq update-block-uuids-set)
        update-page-uuids (seq update-page-uuids-set)
        remove-page-uuids (seq remove-page-uuids-set)
        move-ops* (keep
                   (fn [block-uuid]
                     (when-let [block (db/entity repo [:block/uuid (uuid block-uuid)])]
                       (let [left-uuid (some-> block :block/left :block/uuid str)
                             parent-uuid (some-> block :block/parent :block/uuid str)]
                         (when (and left-uuid parent-uuid)
                           ["move"
                            {:block-uuid block-uuid :target-uuid left-uuid :sibling? (not= left-uuid parent-uuid)}]))))
                   move-block-uuids)
        remove-block-uuids* (filter (fn [block-uuid] (nil? (db/entity repo [:block/uuid (uuid block-uuid)]))) remove-block-uuids)
        remove-ops* [["remove" {:block-uuids remove-block-uuids*}]]
        update-ops* (->> update-block-uuids
                         (keep (fn [block-uuid]
                                 (when-let [b (db/entity repo [:block/uuid (uuid block-uuid)])]
                                   (let [left-uuid (some-> b :block/left :block/uuid str)
                                         parent-uuid (some-> b :block/parent :block/uuid str)]
                                     (when (and left-uuid parent-uuid)
                                       ["update" {:block-uuid block-uuid
                                                  :target-uuid left-uuid :sibling? (not= left-uuid parent-uuid)
                                                  :content (:block/content b "")}]))))))
        update-page-ops* (->> update-page-uuids
                              (keep (fn [block-uuid]
                                      (when-let [page-name (:block/name (db/entity repo [:block/uuid (uuid block-uuid)]))]
                                        ["update-page" {:block-uuid block-uuid
                                                        :page-name page-name}]))))
        remove-page-ops* (->> remove-page-uuids
                              (keep (fn [block-uuid]
                                      (let [b (db/entity repo [:block/uuid (uuid block-uuid)])]
                                        (when-not b
                                          ["remove-page" {:block-uuid block-uuid}])))))]
    [update-page-ops* remove-ops* move-ops* update-ops* remove-page-ops*]))


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
          (throw (ex-info "Unavailable" {})))
        (do (<! (p->c (op/<clean-ops repo op-keys)))
            (<! (<apply-remote-data state r))
            (prn :<client-op-update-handler r))))))

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
      (reset! (:*stop-rtc-loop-chan state) stop-rtc-loop-chan)
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
                stop
                (do (ws/stop @(:*ws state))
                    (reset! (:*rtc-state state) :closed))
                :else
                nil))))
      (async/unsub data-from-ws-pub "push-updates" push-data-from-ws-ch))))

(defn init-state
  [ws data-from-ws-chan user-uuid]
  (m/parse state-schema
           {:*rtc-state (atom :open :validator rtc-state-validator)
            :user-uuid user-uuid
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


(comment
  (go
    (def global-state (<! (<init))))
  (reset! (:*graph-uuid global-state) debug-graph-uuid)
  (reset! (:*repo global-state) (state/get-current-repo))
  )
