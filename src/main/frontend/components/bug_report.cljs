(ns frontend.components.bug-report
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.components.header :as header]
            [frontend.util :as util]
            [reitit.frontend.easy :as rfe]
            [clojure.string :as string]
            [frontend.handler.notification :as notification]
            [frontend.context.i18n :refer [t]]))

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
                                    (notification/show! (t :bug-report/inspector-page-copy-notif)))

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
       (list [:div.mx-auto (t :bug-report/inspector-page-desc-1)]
             [:div.mx-auto (t :bug-report/inspector-page-desc-2)]
             ;; for mobile
             [:input.form-input.is-large.transition.duration-150.ease-in-out {:type "text" :placeholder (t :bug-report/inspector-page-placeholder)}]
             [:div.flex.justify-between.items-center.mt-2
              [:div (t :bug-report/inspector-page-tip)]
              (ui/button (t :bug-report/inspector-page-btn-back) :on-click #(util/open-url (rfe/href :bug-report)))]))

     (when (= step 1)
       (list
        [:div (t :bug-report/inspector-page-desc-clipboard)]
        [:div.flex.justify-between.items-center.mt-2
         [:div (t :bug-report/inspector-page-desc-copy)]
         (ui/button (t :bug-report/inspector-page-btn-copy) :on-click #(copy-result-to-clipboard! (js/JSON.stringify (clj->js result) nil 2)))]
        [:div.flex.justify-between.items-center.mt-2
         [:div (t :bug-report/inspector-page-desc-create-issue)]
         (ui/button (t :bug-report/inspector-page-btn-create-issue) :href header/bug-report-url)]
        [:div.flex.justify-between.items-center.mt-2
         [:div (t :bug-report/inspector-page-tip)]
         (ui/button (t :bug-report/inspector-page-btn-back) :on-click reset-step!)]

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
     [:h1.text-3xl.ml-2 (t :bug-report/main-title)]]
    [:div.opacity-60 (t :bug-report/main-desc)]]
   [:div.cp__bug-report-reporter.rounded-lg.p-8.mt-8
    [:h1.text-2xl (t :bug-report/section-clipboard-title)]
    [:div.opacity-60 (t :bug-report/section-clipboard-desc)]
    (report-item-button (t :bug-report/section-clipboard-btn-title)
                 (t :bug-report/section-clipboard-btn-desc)
                 "clipboard"
                 {:on-click #(util/open-url (rfe/href :bug-report-tools {:tool "clipboard-data-inspector"}))})
    [:div.py-2] ;; divider
    [:div.flex.flex-col
     [:h1.text-2xl (t :bug-report/section-issues-title)]
     [:div.opacity-60 (t :bug-report/section-issues-desc)]
     (report-item-button (t :bug-report/section-issues-btn-title) (t :bug-report/section-issues-btn-desc) "message-report" {:on-click #(util/open-url header/bug-report-url)})]]])
