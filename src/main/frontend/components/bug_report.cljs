(ns frontend.components.bug-report
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.components.header :as header]
            [frontend.util :as util]
            [reitit.frontend.easy :as rfe]
            [clojure.string :as string]
            [frontend.handler.notification :as notification]
            [promesa.core :as p]))

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

        reset-step! (fn [] ((set-step! 0)
                            (set-result! {})))]

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
             [:input {:type "text"}]))

     (when (= step 1)
       (list
        [:div "Here is the data read from clipboard."]
        [:div.flex.justify-between.items-center.mt-2
         [:div "If it is Okay, click the button to copy the result to your clipboard."]
         (ui/button "Copy the result" :on-click #(copy-result-to-clipboard! (js/JSON.stringify (clj->js result) nil 2)))]
        [:div.flex.justify-between.items-center.mt-2
         [:div "Now you can report the result pasted to your clipboard. Please paste the result to Additional Context and state where you copied the original content from. Thanks!"]
         (ui/button "Create an issue" :href header/bug-report-url)]
        [:div.flex.justify-between.items-center.mt-2
         [:div "Something wrong? No problem, click here to go to the previous step."]
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

(rum/defc bug-report
  []
  [:div.flex.flex-col
   [:div.flex.flex-col.items-center
    [:div.flex.items-center.mb-2
     (ui/icon "bug")
     [:h1.text-3xl.ml-2 "Bug report"]]
    [:div.opacity-60 "We are sorry to hear that you have faced the bug 🐛"]
    [:div.opacity-60 "But you can report it to us and we will try our best to fix it :)"]]
   [:div.rounded-lg.bg-gray-200.p-8.mt-8
    [:h1.text-2xl "Does the bug you faced relate to these fields?"]
    [:div.opacity-60 "More information you feedback to us, more efficient we will fix that bug."]
    [:div.opacity-60 "You can use these handy tools to provide extra information to us."]
    [:div.flex.flex-col
     [:a.flex.items-center.rounded-lg.bg-gray-300.p-2.my-2 {:on-click
                                                            #(util/open-url (rfe/href :bug-report-tools {:tool "clipboard-data-inspector"}))}
      [(ui/icon "clipboard")
       [:div.flex.flex-col.ml-2
        [:div  "Clipboard"]
        [:div.opacity-60  "Inspect and collect clipboard data for us"]]]]]
    [:div.py-2] ;; divider
    [:div.flex.flex-col
     [:h1.text-2xl "Or..."]
     [:div.opacity-60 "Directly report the bug if there is no tool for you to collect extra information."]
     [:div.flex.mt-4.items-center
      [:div.mr-2 "Click the button to report"]
      (ui/button "Go" :href header/bug-report-url)]]]])
