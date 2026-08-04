(ns frontend.db.subs-slots
  "Shared slot validation and revision helpers.")

(defn require-revision!
  [label value]
  (when-not (and (integer? value) (not (neg? value)))
    (throw (ex-info (str "Invalid " label) {label value})))
  value)

(defn require-uuid!
  [label value]
  (when-not (uuid? value)
    (throw (ex-info (str "Invalid " label) {label value})))
  value)

(defn require-block!
  [block-uuid block]
  (require-uuid! :block/uuid block-uuid)
  (when-not (= block-uuid (:block/uuid block))
    (throw (ex-info "Block UUID does not match its subscription key"
                    {:block-uuid block-uuid
                     :replacement-uuid (:block/uuid block)})))
  (require-revision! :block/tx-id (:block/tx-id block))
  block)

(defn block-changed?
  [old-block new-block]
  (let [old-tx-id (require-revision! :block/tx-id (:block/tx-id old-block))
        new-tx-id (require-revision! :block/tx-id (:block/tx-id new-block))]
    (not= old-tx-id new-tx-id)))

(defn- ready-slot
  [basis-rev value]
  {:kind :ready
   :basis-rev basis-rev
   :snapshot {:status :ready :value value}})

(defn ready-block-slot
  [basis-rev block]
  (assoc (ready-slot basis-rev block) :tx-id (:block/tx-id block)))

(defn tombstone-slot
  [rev]
  {:kind :tombstone
   :rev rev
   :snapshot {:status :missing}})

(defn ready-children-slot
  [basis-rev parent-tx-id items]
  (assoc (ready-slot basis-rev (mapv first items))
         :tx-id parent-tx-id
         :items items))

(defn ready-resource-slot
  [basis-rev watch-keys value]
  (assoc (ready-slot basis-rev value) :watch-keys watch-keys))

(defn slot-revision
  [slot]
  (max -1
       (or (:basis-rev slot) -1)
       (or (:rev slot) -1)
       (or (:stale-rev slot) -1)))
