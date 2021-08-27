(ns frontend.components.shell
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.handler.shell :as shell-handler]
            [clojure.string :as string]
            [frontend.mixins :as mixins]))

(defn- run-command
  [command]
  (when-not (string/blank? @command)
    (shell-handler/run-command! @command)))

(defonce command (atom ""))


(rum/defcs shell < rum/reactive
  (mixins/event-mixin
   (fn [state]
     (mixins/on-enter state
                      :on-enter (fn [state]
                                  (run-command command)))))
  [state]
  [:div.flex.flex-col
   [:div
    [:div
     [:div
      [:h1.title
       "Input command"]
      [:div.mt-4.mb-4.relative.rounded-md.shadow-sm.max-w-xs
       [:input#run-command.form-input.block.w-full.sm:text-sm.sm:leading-5
        {:autoFocus true
         :on-key-down util/stop-propagation
         :placeholder "git commit -m ..."
         :on-change (fn [e]
                      (reset! command (util/evalue e)))}]]]]
    (ui/button "Run" :on-click #(run-command command))]])
