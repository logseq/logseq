(ns frontend.components.widgets
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [clojure.string :as string]
            [frontend.ui :as ui]))

(rum/defcs add-repo < (rum/local "" ::repo-url)
  [state]
  (let [repo-url (get state ::repo-url)]
    [:div.p-8.flex.items-center.justify-center.bg-white
     [:div.w-full.max-w-xs.mx-auto
      [:div
       [:div
        [:h2 "Import your notes:"]
        [:p.text-sm.text-gray-500.pl-1 "You can import your notes from a repo on Github."]
        [:div.mt-2.mb-2.relative.rounded-md.shadow-sm
         [:input#repo.form-input.block.w-full.sm:text-sm.sm:leading-5
          {:autoFocus true
           :placeholder "https://github.com/username/repo"
           :on-change (fn [e]
                        (reset! repo-url (util/evalue e)))}]]]]
      (ui/button
        "Clone"
        (fn []
          (when (string/starts-with? @repo-url "https://github.com/")
            (handler/clone-and-pull @repo-url)
            (handler/redirect! {:to :home}))))]]))
