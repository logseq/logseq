(ns frontend.util.block
  "Provides block related functionality"
  (:require [dommy.core :as dom]
            [frontend.util :as util]))

(defn get-block-id
  "Retrives the block id from the dom element"
  [block-el]
  (dom/attr block-el "data-block-id"))

(defn get-block-ids
  [blocks]
  (->> blocks
       (remove nil?)
       (keep #(when-let [id (get-block-id %)]
                (uuid id)))
       (distinct)))

(defn should-select-block?
  "Checks if the block belongs to the same page and container"
  [first-selected-block block]
  (if first-selected-block
    (let [container (util/get-block-container first-selected-block)
          first-selected-block-id (get-block-id first-selected-block)
          first-selected-block ((resolve 'frontend.db.model/get-block-by-uuid) first-selected-block-id)
          page-id (get-in first-selected-block [:block/page :db/id])]
      (and (= container (util/get-block-container block))
           (= page-id (get-in ((resolve 'frontend.db.model/get-block-by-uuid) (get-block-id block))
                              [:block/page :db/id]))))
    true))
