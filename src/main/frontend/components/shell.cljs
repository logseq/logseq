(ns frontend.components.shell
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.handler.shell :as shell-handler]
            [clojure.string :as string]
            [frontend.mixins :as mixins]
            [promesa.core :as p]))

(defonce *command (atom ""))
(defonce *loading? (atom nil))

(defn- run-command
  []
  (reset! *loading? true)
  (->
   (p/let [_ (when-not (string/blank? @*command)
               (shell-handler/run-command! @*command))]
     (reset! *loading? false))
   (p/finally (fn [] (reset! *loading? false)))))

(rum/defcs shell < rum/reactive
  (mixins/event-mixin
   (fn [state]
     (mixins/on-enter state
                      :on-enter (fn [_state] (run-command)))))
  [state]
  (let [loading? (rum/react *loading?)]
    [:div.flex.flex-col
     [:div
      [:div
       [:div
        [:h1.title
         "Input command"]
        [:div.mt-4.mb-4.relative.rounded-md.shadow-sm
         [:input#run-command.form-input.font-mono.block.w-full.sm:text-sm.sm:leading-5
          {:autoFocus true
           :on-key-down util/stop-propagation
           :placeholder "git commit -m ..."
           :on-change (fn [e]
                        (reset! *command (util/evalue e)))}]]]]
      [:div.flex.flex-row.items-center
       (ui/button "Run" :on-click run-command)
       [:div.ml-4
        (when loading?
          (ui/loading ""))]]]]))
