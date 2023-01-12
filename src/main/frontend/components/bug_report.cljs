(ns frontend.components.bug-report
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.components.header :as header]
            [frontend.util :as util]
            [reitit.frontend.easy :as rfe]
            [clojure.string :as string]
            [frontend.handler.notification :as notification]
            [promesa.core :as p]))


;; TODO how to parse file: 	getAsFile () => URL.createObjectURL (file)
;; TODO how to collect data: Just parse into JSON or edn

;; TODO types vs files


(defn parse-clipboard-data-transfer
  "parse dataTransfer
   
   input: dataTransfer
   
   output: {:types {:type :data} :items {:kind :type} :files {:name :size :type}}"
  [data]
  (js/console.log "Parse starts..." (clj->js data))
  (let [types (.-types data)
        result (map (fn [type] [type (.getData data type)]) types)]
    (js-debugger)
    result))

(rum/defc bug-report-tool-clipboard
  "bug report tool for clipboard"
  []
  (let [[result set-result!] (rum/use-state {}) ;; TODO use it
        [step set-step!] (rum/use-state 0)
        paste-handler! (fn [e]
                         (let [clipboard-data (.-clipboardData e)]
                           (let [result (parse-clipboard-data-transfer clipboard-data)
                                 result (into {} result)]
                             (js/console.log (clj->js result))
                             (set-result! result)
                             (set-step! 1))))

        reset-step! (fn [] ((set-step! 0)
                            (set-result! {})))]

    (rum/use-effect!
     (fn []
       (js/addEventListener "paste" paste-handler!)
       #(js/removeEventListener "paste" paste-handler!))
     [step]) ;; when step === 0

    [:div.flex.flex-col
     (when (= step 0)
       (list [:div.mx-auto "1. Press Ctrl+V / ⌘+V to inspect your clipboard data"]
             [:div.mx-auto "or click here to paste if you are using mobile phone"]
            ;;  [:div.mx-auto (ui/button "Read data from clipboard" :on-click on-click-read-data-from-clipboard!)]

             ;; TODO use a textarea to get paste from mobile
             ))

     (when (= step 1)
       (list
        [:div "Here is the data read from clipboard."]
        [:div.flex.justify-between.items-center.mt-2
         [:div "If it is Okay, you can click the button to copy the result to your clipboard"]
         (ui/button "Copy the result" :on-click (fn [] (notification/show! "Succuessfully copied to clipboard!")))]
        [:div.flex.justify-between.items-center.mt-2
         [:div "Now you can report with the result pasted to your clipboard. Please paste the result to Additional Context. Thanks!"]
         (ui/button "Create an issue" :href header/bug-report-url)]
        [:div.flex.justify-between.items-center.mt-2
         [:div "Something wrong, no problem, click the click to go back previous step"]
         (ui/button "Go back" :on-click reset-step!)]

    ;;     ;; TODO table component 
        [:div "TODO: list parsed result"]
        ;; TODO .types
        ;; TODO type | getData(type)
        [:div "---"]
        [:div (str result)]
        ;; TODO files
        ;; TODO .files list
        ))]))

(rum/defc bug-report-tool-route
  [route-match]
  (let [name (get-in route-match [:parameters :path :tool])]
    ;; TODO cond to render different tools
    [:div.flex.flex-col ;; container
     [:h1.text-2xl.mx-auto.mb-4 (ui/icon "clipboard") " " (string/capitalize name)] ;; TODO a-b-c -> a b c
     (cond
       (= name "clipboard-data-inspector")
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
                                                                               (util/open-url (rfe/href :bug-report-tools {:tool "clipboard-data-inspector"}))))}
      [(ui/icon "clipboard")
       [:div.flex.flex-col.ml-2
        [:div  "Clipboard data inspector"]
        [:div.opacity-60  "Inspect and collect clipboard data for us"]]]]]

    [:div.py-2] ;; TODO divider

    [:div.flex.flex-col
     [:h1.text-2xl "Or..."]
     [:div.opacity-60 "Directly report the bug if there is no tool for you to collect extra information."]
     [:div.flex.mt-4.items-center
      [:div.mr-2 "Click the button to report bug"]
      (ui/button "Go" :href header/bug-report-url)]]]])
