(ns frontend.components.git
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [clojure.string :as string]
            [frontend.handler.shell :as shell]))

(rum/defcs set-git-username-and-email <
  (rum/local "" ::username)
  (rum/local "" ::email)
  [state]
  (let [username (get state ::username)
        email (get state ::email)]
    [:div.container
     [:div.text-lg.mb-4 "Git requires to setup your username and email address."]
     [:div.sm:flex.sm:items-start
      [:div.mt-3.text-center.sm:mt-0.sm:text-left
       [:h3#modal-headline.leading-6.font-medium
        "Your username:"]]]

     [:input.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2.mb-4
      {:auto-focus true
       :on-change (fn [e]
                    (reset! username (util/evalue e)))}]

     [:div.sm:flex.sm:items-start
      [:div.mt-3.text-center.sm:mt-0.sm:text-left
       [:h3#modal-headline.leading-6.font-medium
        "Your email address:"]]]

     [:input.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2
      {:on-change (fn [e]
                    (reset! email (util/evalue e)))}]

     [:div.mt-5.sm:mt-4.sm:flex.sm:flex-row-reverse
      [:span.flex.w-full.rounded-md.shadow-sm.sm:ml-3.sm:w-auto
       [:button.inline-flex.justify-center.w-full.rounded-md.border.border-transparent.px-4.py-2.bg-indigo-600.text-base.leading-6.font-medium.text-white.shadow-sm.hover:bg-indigo-500.focus:outline-none.focus:border-indigo-700.focus:shadow-outline-indigo.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
        {:type "button"
         :on-click (fn []
                     (let [username @username
                           email @email]
                       (when (and (not (string/blank? username))
                                  (not (string/blank? email)))
                         (shell/set-git-username-and-email username email))))}
        "Submit"]]]]))
