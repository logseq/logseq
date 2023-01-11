(ns frontend.components.bug-report
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.components.header :as header]
            [frontend.util :as util]
            [reitit.frontend.easy :as rfe]
            [clojure.string :as string]
            [frontend.handler.notification :as notification]
            [promesa.core :as p]))

(defn retrieve-text-from-clipboard-blob [data]
  (let [type (.-type data)]
    (if (string/includes? type "text/") ;; TODO regex
      (p/let [text (.text data)] [type text]) ;; process it
      (p/let [_ data] [type data]))))

(defn parse-clipboard-obj-data
  "parse dataTransfer or Blobs"
  [data data-type]
  (js/console.log "Parse starts..." (clj->js data) data-type)
  (cond
    (= data-type "Blobs") ;; from clicking the button 
    (->> data
         (map retrieve-text-from-clipboard-blob)
         ;; TODO process images
         (p/all))

    (= data-type "dataTransfer") ;; from Ctrl+V
    (let [types (.-types data)
          result (map (fn [type] [type (.getData data type)]) types)]
      (->> result
           (map (fn [val] (p/let [] val)))
           (p/all)))))

(rum/defc bug-report-tool-clipboard
  "bug report tool for clipboard"
  []
  (let [[clipboard-text set-clipboard-text!] (rum/use-state "") ;; TODO not just these text, should display and collect any other text
        [clipboard-html set-clipboard-html!] (rum/use-state "")
        [result set-result!] (rum/use-state {}) ;; TODO use it
        [step set-step!] (rum/use-state 0)
        on-click-read-data-from-clipboard! (fn []
                                             (-> (p/let [premission (js/navigator.permissions.query (clj->js {:name "clipboard-read"}))]
                                                   (js/console.log premission)
                                                   (when (= (.-state premission) "denied")
                                                     (throw (js/Error "Premission denied")))
                                                   (->  (p/let [clipboard-data (js/navigator.clipboard.read)]
                                                          (js/console.log clipboard-data)
                                                            ;; get ClipboardItems
                                                          (p/let [types (.-types (first clipboard-data))
                                                                  blob-data (p/all (map (fn [type] (p/let [_ (.getType (first clipboard-data) type)] _)) types))]
                                                            (-> blob-data
                                                                (clj->js)
                                                                (js/console.log))
                                                            (set-step! 1)

                                                            (js/console.log (clj->js (parse-clipboard-obj-data blob-data "Blobs")))
                                                            (p/let [result (parse-clipboard-obj-data blob-data "Blobs")
                                                                    result (into {} result)]
                                                              (js/console.log (clj->js result))
                                                              (set-result! result))))))
                                                 (p/catch (fn [err] (notification/show! (str err))))))

        paste-handler! (fn [e]
                         (let [clipboard-data (.-clipboardData e)]
                        ;;    (js/console.log (.-items clipboard-data))
                           (set-step! 1)

                           (p/let [result (parse-clipboard-obj-data clipboard-data "dataTransfer")
                                   result (into {} result)]
                             (js/console.log (clj->js result))
                             (set-result! result))))

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
             [:div.mx-auto "or click this button"]
             [:div.mx-auto (ui/button "Read data from clipboard" :on-click on-click-read-data-from-clipboard!)]))

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

        ;; TODO table component
        [:h2.text-xl "Result"]
        [:div result]

     ;; TODO refactor them to table cp
        [:div "text"]
        [:pre [:code clipboard-text]]
        [:div "text/html"]
        [:pre [:code clipboard-html]] ;; TODO height limit 
        [:div "files"]
     ;; TODO list thire brief info in text
        [:pre [:code clipboard-html]]))]))

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
