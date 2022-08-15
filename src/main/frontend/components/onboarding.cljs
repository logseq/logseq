(ns frontend.components.onboarding
  (:require [frontend.context.i18n :refer [t]]
            [frontend.handler.route :as route-handler]
            [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.components.onboarding.setups :as setups]))

(rum/defc intro
  []
  (setups/picker))

(defn help
  []
  [:div.help.cp__sidebar-help-docs
   (let [discourse-with-icon [:div.flex-row.inline-flex.items-center
                            [:span.mr-1 (t :help/forum-community)]
                            (ui/icon "message-circle" {:style {:font-size 20}})]
         list
         [{:title "Usage"
           :children [[[:a
                        {:on-click (fn [] (route-handler/redirect! {:to :shortcut-setting}))}
                        [:div.flex-row.inline-flex.items-center
                         [:span.mr-1 (t :help/shortcuts)]
                         (ui/icon "command" {:style {:font-size 20}})]]]
                      [(t :help/docs) "https://docs.logseq.com/"]
                      [(t :help/start) "https://docs.logseq.com/#/page/tutorial"]
                      ["FAQ" "https://docs.logseq.com/#/page/faq"]]}
          
          {:title "Community"
           :children [[(t :help/awesome-logseq) "https://github.com/logseq/awesome-logseq"]
                      [(t :help/blog) "https://blog.logseq.com"]
                      [discourse-with-icon "https://discuss.logseq.com"]]}

          {:title "Development"
           :children [[(t :help/roadmap) "https://trello.com/b/8txSM12G/roadmap"]
                      [(t :help/bug) "https://github.com/logseq/logseq/issues/new?labels=from:in-app&template=bug_report.yaml"]
                      [(t :help/feature) "https://discuss.logseq.com/c/feature-requests/"]
                      [(t :help/changelog) "https://docs.logseq.com/#/page/changelog"]]}
          
          {:title "About"
           :children [[(t :help/about) "https://logseq.com/blog/about"]]}

          {:title "Terms"
           :children [[(t :help/privacy) "https://logseq.com/blog/privacy-policy"]
                      [(t :help/terms) "https://logseq.com/blog/terms"]]}]]

          

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
