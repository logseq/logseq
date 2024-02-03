(ns frontend.components.git
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [promesa.core :as p]
            [frontend.util :as util]
            [clojure.string :as string]
            [frontend.handler.shell :as shell]
            [frontend.handler.file :as file]
            [frontend.state :as state]))

(rum/defcs set-git-username-and-email <
  (rum/local "" ::username)
  (rum/local "" ::email)
  [state]
  (let [username (get state ::username)
        email (get state ::email)]
    [:div.container
     [:div.text-lg.mb-4 "Git requires to setup your username and email address to commit, both of them will be stored locally."]
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

     [:div.mt-5.sm:mt-4.flex
      (ui/button
       "Submit"
       {:on-click (fn []
                    (let [username @username
                          email @email]
                      (when (and (not (string/blank? username))
                                 (not (string/blank? email)))
                        (shell/set-git-username-and-email username email))))})]]))

(rum/defc file-version-selector
  [versions path get-content]
  (let
   [[content set-content!] (rum/use-state  nil)
    [hash  set-hash!] (rum/use-state   "HEAD")]
    (rum/use-effect! (fn [] (p/let [c (get-content hash path)] (set-content! c)) [hash path]))
    [:div.flex
     [:div.overflow-y-auto {:class "w-48 max-h-[calc(85vh_-_4rem)] "}
      [:div.font-bold "File history - " path]
      (for [line  versions]
        (let [[hash title time] (string/split line "$$$")
              hash (subs hash 8)]
          [:div.my-4 {:key hash}
           [:hr]
           [:div.mb-2
            [:a.font-medium.mr-1.block
             {:on-click (fn []  (set-hash!  hash))}
             hash]
            title]
           [:div.opacity-50 time]]))]
     [:div.flex-1.p-4
      [:div.w-full.sm:max-w-lg {:style {:width 700}}
       [:div.font-bold.mb-4 (str path (util/format " (%s)" hash))]
       [:pre content]
       (ui/button "Revert"
                  :on-click (fn []
                              (file/alter-file (state/get-current-repo)
                                               path
                                               content
                                               {:re-render-root? true
                                                :skip-compare? true})))]]]))
