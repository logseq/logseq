(ns frontend.handler.jump
  "Jump to property key/value"
  (:require [frontend.state :as state]
            [dommy.core :as d]))

(defn clear-jump-hints!
  []
  (dorun (map d/remove! (d/sel ".jtrigger-id"))))

(defn jump-to
  []
  (let [selected-block (first (state/get-selection-blocks))]
    (cond
      selected-block
      (let [triggers (d/sel selected-block ".jtrigger")]
        (when (seq triggers)
          (state/set-state! :editor/jump-data {:mode :property
                                        :triggers (d/sel selected-block ".jtrigger")})
          (doall
           (map-indexed
            (fn [id dom]
              (d/append! dom (-> (d/create-element :span)
                                 (d/set-attr! :class "jtrigger-id text-sm border rounded ml-2 px-1 shadow-xs")
                                 (d/set-text! (str (inc id))))))
            triggers))))

      :else                             ; add block jump support
      nil)))
