(ns frontend.components.settings
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.handler :as handler]
            [frontend.util :as util]
            [clojure.string :as string]))

(rum/defcs set-email < (rum/local "" ::email)
  [state]
  (let [email (get state ::email)]
    [:div.p-8.flex.items-center.justify-center.bg-white
    [:div.w-full.max-w-xs.mx-auto
     [:div
      [:div
       [:h2 "Your email:" ]
       [:span.text-gray-500.text-sm.pl-1 "(Git commit requires)"]
       [:div.mt-2.mb-2.relative.rounded-md.shadow-sm
        [:input#.form-input.block.w-full.pl-2.sm:text-sm.sm:leading-5
         {:autoFocus true
          :on-change (fn [e]
                       (reset! email (util/evalue e)))}]]]]
     (ui/button
       "Submit"
       :on-click
       (fn []
         (handler/set-email! @email)))]]))
