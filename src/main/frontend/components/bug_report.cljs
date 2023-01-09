(ns frontend.components.bug-report 
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.components.header :as header]
            [frontend.util :as util]
            [reitit.frontend.easy :as rfe]
            [clojure.string :as string]))

(rum/defc bug-report-tool-clipboard
          "bug report tool for clipboard"
          [] 
          [:div "TODO"])

(rum/defc bug-report-tool-route
  [route-match]
  (let [name (get-in route-match [:parameters :path :tool])]
    ;; TODO cond to render different tools
    [:div.flex.flex-col ;; container
     [:h1.text-2xl.mx-auto (ui/icon "clipboard") " " (string/capitalize name)]
     (cond
       (= name "clipboard")
       (bug-report-tool-clipboard)

        ;; TODO any fallback?
       )]))

(rum/defc bug-report
  [{:keys []}]
  [:div.flex.flex-col
   [:div.flex.flex-col.items-center
    [:div.flex.items-center.mb-2
     (ui/icon "bug")
     [:h1.text-3xl.ml-2 "Bug report"]]
    [:div.opacity-60 "We are very sorry to hear that you have faced the bug 🐛"]
    [:div.opacity-60 "But you can report it to us and we will try our best to fix that :)"]] 
   [:div.rounded-lg.bg-gray-200.p-8.mt-8
    ;; tool container
    [:h1.text-2xl "Does the bug you faced relate to these fields?"]
    [:div.opacity-60 "More infomation you feedback to us, more efficient we will fix that bug."]
    [:div.opacity-60 "You can use these handy tools to provide extra infomation to us."]
    [:div.flex.flex-col

     [:a.flex.items-center.rounded-lg.bg-gray-300.p-2.my-2 {:on-click (fn [] (let []
                                                                               ;; push clipboard to url
                                                                               (util/open-url (rfe/href :bug-report-tools {:tool "clipboard"}))))}
      [(ui/icon "clipboard")
       [:div.flex.flex-col.ml-2
        [:div  "Clipboard data"]
        [:div.opacity-60  "If you have copy-paste issue"]]]]] 
    
    [:div.py-2] ;; TODO divider
    
    [:div.flex.flex-col
     [:h1.text-2xl "Or..."]
     [:div.opacity-60 "Directly report the bug if there is no tool for you to collect extra information."]
     [:div.flex.mt-4.items-center
      [:div.mr-2 "Click the button to report bug"]
      (ui/button "Go" :href header/bug-report-url)]]]])
