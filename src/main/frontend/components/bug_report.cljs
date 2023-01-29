(ns frontend.components.bug-report
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.components.header :as header]
            [frontend.util :as util]
            [reitit.frontend.easy :as rfe]
            [clojure.string :as string]
            [frontend.handler.notification :as notification]))

(defn parse-clipboard-data-transfer
  "parse dataTransfer

   input: dataTransfer

   output: {:types {:type :data} :items {:kind :type} :files {:name :size :type}}"
  [data]
  (let [items (.-items data)
        types (.-types data)
        files (.-files data)]
    (conj
     {:items (->> items
                  (map (fn [item] {:kind (.-kind item) :type (.-type item)}))
                  (conj))}
     {:types (->> types
                  (map (fn [type] {:type type :data (.getData data type)}))
                  (conj))}
     {:files (->> files
                  (map (fn [file] {:name (.-name file) :type (.-type file) :size (.-size file)}))
                  (conj))})))

(rum/defc clipboard-data-inspector
  "bug report tool for clipboard"
  []
  (let [[result set-result!] (rum/use-state {})
        [step set-step!] (rum/use-state 0)
        paste-handler! (fn [e]
                         (let [clipboard-data (.-clipboardData e)
                               result (parse-clipboard-data-transfer clipboard-data)
                               result (into {} result)]
                           (set-result! result)
                           (set-step! 1)))

        copy-result-to-clipboard! (fn [result]
                                    (util/copy-to-clipboard! result)
                                    (notification/show! "Copied to clipboard!"))

        reset-step! (fn []
                      (set-step! 0)
                      (set-result! {}))]

    (rum/use-effect!
     (fn []
       (cond (= step 0) (js/addEventListener "paste" paste-handler!))
       (fn [] (cond (= step 0) (js/removeEventListener "paste" paste-handler!))))
     [step]) ;; when step === 0

    [:div.flex.flex-col
     (when (= step 0)
       (list [:div.mx-auto "Press Ctrl+V / ⌘+V to inspect your clipboard data"]
             [:div.mx-auto "or click here to paste if you are using the mobile version"]
             ;; for mobile
             [:input.form-input.is-large.transition.duration-150.ease-in-out {:type "text" :placeholder "Long press here to paste if you are on mobile"}]
             [:div.flex.justify-between.items-center.mt-2
              [:div "Something wrong? No problem, click to go back to the previous step."]
              (ui/button "Go back" :on-click #(util/open-url (rfe/href :bug-report)))]))

     (when (= step 1)
       (list
        [:div "Here is the data read from clipboard."]
        [:div.flex.justify-between.items-center.mt-2
         [:div "If this is okay to share, click the copy button."]
         (ui/button "Copy the result" :on-click #(copy-result-to-clipboard! (js/JSON.stringify (clj->js result) nil 2)))]
        [:div.flex.justify-between.items-center.mt-2
         [:div "Now you can report the result pasted to your clipboard. Please paste the result in the 'Additional Context' section and state where you copied the original content from. Thanks!"]
         (ui/button "Create an issue" :href header/bug-report-url)]
        [:div.flex.justify-between.items-center.mt-2
         [:div "Something wrong? No problem, click to go back to the previous step."]
         (ui/button "Go back" :on-click reset-step!)]

        [:pre.whitespace-pre-wrap [:code (js/JSON.stringify (clj->js result) nil 2)]]))]))

(rum/defc bug-report-tool-route
  [route-match]
  (let [name (get-in route-match [:parameters :path :tool])]
    [:div.flex.flex-col ;; container
     [:h1.text-2xl.mx-auto.mb-4 (ui/icon "clipboard") " " (-> name (string/replace #"-" " ") (string/capitalize))]
     (cond ;; TODO any fallback?
       (= name "clipboard-data-inspector")
       (clipboard-data-inspector))]))

(rum/defc report-item-button
  [title description icon-name {:keys [on-click]}]
   [:a.cp__bug-report-item-button.flex.items-center.px-4.py-2.my-2.rounded-lg {:on-click on-click}
    [(ui/icon icon-name)
     [:div.flex.flex-col.ml-2
      [:div title]
      [:div.opacity-60 description]]]])

(rum/defc bug-report
  []
  [:div.flex.flex-col
   [:div.flex.flex-col.items-center
    [:div.flex.items-center.mb-2
     (ui/icon "bug")
     [:h1.text-3xl.ml-2 "Bug report"]]
    [:div.opacity-60 "Can you help us out by submitting a bug report? We'll get it sorted out as soon as we can."]]
   [:div.cp__bug-report-reporter.rounded-lg.p-8.mt-8
    [:h1.text-2xl "Is the bug you encountered related to these features?"]
    [:div.opacity-60 "You can use these handy tools to give us additional information."]
    (report-item-button "Clipboard helper"
                 "Inspect and collect clipboard data"
                 "clipboard"
                 {:on-click #(util/open-url (rfe/href :bug-report-tools {:tool "clipboard-data-inspector"}))})
    [:div.py-2] ;; divider
    [:div.flex.flex-col
     [:h1.text-2xl "Or..."]
     [:div.opacity-60 "If there are no tools available for you to gather additional information, please report the bug directly."]
     (report-item-button "Submit a bug report" "Help Make Logseq Better!" "message-report" {:on-click #(util/open-url header/bug-report-url)})]]])
