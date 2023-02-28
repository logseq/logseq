(ns frontend.components.onboarding
  (:require [frontend.context.i18n :refer [t]]
            [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.state :as state]
            [frontend.components.onboarding.setups :as setups]))

(rum/defc intro
  [onboarding-and-home?]
  (setups/picker onboarding-and-home?))

(defn help
  []
  [:div.help.cp__sidebar-help-docs
   (let [discourse-with-icon [:div.flex-row.inline-flex.items-center
                              [:span.mr-1 (t ::forum-community)]
                              (ui/icon "message-circle" {:style {:font-size 20}})]
         list
         [{:title (t ::usage-heading)
           :children [[[:a
                        {:on-click (fn [] (state/sidebar-add-block! (state/get-current-repo) "shortcut-settings" :shortcut-settings))}
                        [:div.flex-row.inline-flex.items-center
                         [:span.mr-1 (t ::shortcuts)]
                         (ui/icon "command" {:style {:font-size 20}})]]]
                      [(t ::docs) "https://docs.logseq.com/"]
                      [(t ::start) "https://docs.logseq.com/#/page/tutorial"]
                      ["FAQ" "https://docs.logseq.com/#/page/faq"]]}

          {:title (t ::community-heading)
           :children [[(t ::awesome-logseq) "https://github.com/logseq/awesome-logseq"]
                      [(t ::blog) "https://blog.logseq.com"]
                      [discourse-with-icon "https://discuss.logseq.com"]]}

          {:title (t ::development-heading)
           :children [[(t ::roadmap) "https://trello.com/b/8txSM12G/roadmap"]
                      [(t ::bug) "https://github.com/logseq/logseq/issues/new?labels=from:in-app&template=bug_report.yaml"]
                      [(t ::feature) "https://discuss.logseq.com/c/feature-requests/"]
                      [(t ::changelog) "https://docs.logseq.com/#/page/changelog"]]}

          {:title (t ::about-heading)
           :children [[(t ::about) "https://blog.logseq.com/about/"]]}

          {:title (t ::terms-heading)
           :children [[(t ::privacy) "https://blog.logseq.com/privacy-policy/"]
                      [(t ::terms) "https://blog.logseq.com/terms/"]]}]]



     (map (fn [sublist]
            [[:p.mt-4.mb-1 [:b (:title sublist)]]
             [:ul
              (map (fn [[title href]]
                     [:li
                      (if href
                        [:a {:href href :target "_blank"} title]
                        title)])
                (:children sublist))]])
       list))])
