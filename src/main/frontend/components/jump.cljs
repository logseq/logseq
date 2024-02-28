(ns frontend.components.jump
  "Jump to"
  (:require [frontend.state :as state]
            [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler.jump :as jump-handler]))

(defn- exit!
  []
  (state/set-state! :editor/jump-data nil)
  (jump-handler/clear-jump-hints!))

(rum/defcs input <
  (rum/local "" ::q)
  [state {:keys [triggers _mode]}]      ; TODO: jump to block
  (let [*q (::q state)]
    [:div.flex.w-full.relative
     [:input.form-input.block.sm:text-sm.my-2.border-none.outline-none
      {:auto-focus true
       :placeholder "Jump to"
       :aria-label "Jump to"
       :value @*q
       :on-change (fn [e] (reset! *q (util/evalue e)))
       :on-key-down (fn [e]
                      (util/stop-propagation e)
                      (case (util/ekey e)
                        "Enter"
                        (when-let [idx (util/safe-parse-int @*q)]
                          (when (> idx 0)
                            (when-let [elem (nth triggers (dec idx))]
                              (state/clear-selection!)
                              (exit!)
                              (.click elem))))
                        "Escape"
                        (exit!)
                        nil))}]]))

(rum/defc jump < rum/reactive
  []
  (let [data (state/sub :editor/jump-data)]
    (when data
      [:div#bottom-console.flex.flex-1.flex-row.absolute.top-10.right-2.shadow-lg.px-2.py-1.faster-fade-in.items-center

       (input data)])))
