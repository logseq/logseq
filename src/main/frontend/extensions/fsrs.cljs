(ns frontend.extensions.fsrs
  (:require [frontend.db :as db]
            [frontend.handler.property :as property-handler]
            [open-spaced-repetition.cljc-fsrs.core :as fsrs.core]
            [tick.core :as tick]))

(defn- fsrs-card-map->property-fsrs-state
  "Convert card-map to value stored in property"
  [fsrs-card-map]
  (-> fsrs-card-map
      (update :last-repeat tick/inst)
      (update :due tick/inst)))

(defn- property-fsrs-state->fsrs-card-map
  "opposite version of `fsrs-card->property-fsrs-state`"
  [prop-fsrs-state]
  (-> prop-fsrs-state
      (update :last-repeat tick/instant)
      (update :due tick/instant)))

(defn- get-card-map
  "Return nil if block is not #card.
  Return default card-map if :logseq.property/fsrs-state is nil"
  [block-entity]
  (when (some (fn [tag] (= :logseq.class/Card (:db/ident tag))) ;block should contains #Card
              (:block/tags block-entity))
    (or (some-> (:logseq.property/fsrs-state block-entity)
                property-fsrs-state->fsrs-card-map)
        (fsrs.core/new-card!))))

(defn repeat-card!
  [repo block-id rating]
  (let [eid (if (uuid? block-id) [:block/uuid block-id] block-id)
        block-entity (db/entity repo eid)]
    (when-let [card-map (get-card-map block-entity)]
      (let [next-card-map (fsrs.core/repeat-card! card-map rating)]
        (property-handler/set-block-property!
         repo block-id
         :logseq.property/fsrs-state (fsrs-card-map->property-fsrs-state next-card-map))))))
