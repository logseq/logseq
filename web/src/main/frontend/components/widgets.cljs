(ns frontend.components.widgets
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [clojure.string :as string]
            [frontend.ui :as ui]))

(rum/defcs add-repo < (rum/local "https://github.com/" ::repo-url)
  [state]
  (let [prefix "https://github.com/"
        repo-url (get state ::repo-url)]
    [:div.p-8.flex.items-center.justify-center.bg-white
     [:div.w-full.max-w-xs.mx-auto
      [:div
       [:div
        [:h2 "Specify your repo:"]
        [:div.mt-2.mb-2.relative.rounded-md.shadow-sm
         [:div.absolute.inset-y-0.left-0.pl-3.flex.items-center.pointer-events-none
          [:span.text-gray-500.sm:text-sm.sm:leading-5
           prefix]]
         [:input#repo.form-input.block.w-full.pl-16.sm:pl-14.sm:text-sm.sm:leading-5
          {:autoFocus true
           :placeholder "username/repo"
           :on-change (fn [e]
                        (reset! repo-url (util/evalue e)))
           :style {:padding-left "9.4em"}}]]]]
      (ui/button
        "Clone"
        (fn []
          (handler/clone-and-pull (str prefix @repo-url))))]]))
