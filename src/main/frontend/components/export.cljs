(ns frontend.components.export
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.handler.export :as export]
            [frontend.state :as state]
            [frontend.context.i18n :as i18n]))

(rum/defc export
  []
  (when-let [current-repo (state/get-current-repo)]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div.export
       [:h1.title "Export"]

       [:ul.mr-1
        (when (util/electron?)
          [:li.mb-4
           [:a.font-medium {:on-click #(export/export-repo-as-html! current-repo)}
            (t :export-public-pages)]])
        [:li.mb-4
         [:a.font-medium {:on-click #(export/export-repo-as-markdown! current-repo)}
          (t :export-markdown)]]
        [:li.mb-4
         [:a.font-medium {:on-click #(export/export-repo-as-opml! current-repo)}
          (t :export-opml)]]
        [:li.mb-4
         [:a.font-medium {:on-click #(export/export-repo-as-edn-v2! current-repo)}
          (t :export-edn)]]
        [:li.mb-4
         [:a.font-medium {:on-click #(export/export-repo-as-json-v2! current-repo)}
          (t :export-json)]]
        [:li.mb-4
         [:a.font-medium {:on-click #(export/export-repo-as-roam-json! current-repo)}
          (t :export-roam-json)]]]
       [:a#download-as-edn-v2.hidden]
       [:a#download-as-json-v2.hidden]
       [:a#download-as-roam-json.hidden]
       [:a#download-as-html.hidden]
       [:a#download-as-zip.hidden]
       [:a#export-as-markdown.hidden]
       [:a#export-as-opml.hidden]
       [:a#convert-markdown-to-unordered-list-or-heading.hidden]])))


(rum/defc export-page
  []
  (when-let [current-repo (state/get-current-repo)]
    (when-let [page (state/get-current-page)]
      (rum/with-context [[t] i18n/*tongue-context*]
        [:div.export
         [:h1.title "Export"]
         [:ul.mr-1
          [:li.mb-4
           [:a.font-medium {:on-click #(export/export-page-as-markdown! page)}
            (t :export-markdown)]]
          [:li.mb-4
           [:a.font-medium {:on-click #(export/export-page-as-opml! page)}
            (t :export-opml)]]]
         [:a#export-page-as-markdown.hidden]
         [:a#export-page-as-opml.hidden]
         [:a#convert-markdown-to-unordered-list-or-heading.hidden]]))))

(def *export-block-type (atom :text))

(def text-indent-style-options [{:label "dashes"
                                 :selected false}
                                {:label "spaces"
                                 :selected false}
                                {:label "no-indent"
                                 :selected false}])

(rum/defcs export-blocks
  < rum/reactive
  (rum/local false ::copied?)
  [state root-block-ids]
  (let [current-repo (state/get-current-repo)
        type (rum/react *export-block-type)
        text-indent-style (state/sub :copy/export-block-text-indent-style)
        text-remove-options (state/sub :copy/export-block-text-remove-options)
        copied? (::copied? state)
        content
        (case type
          :text (export/export-blocks-as-markdown current-repo root-block-ids text-indent-style (into [] text-remove-options))
          :opml (export/export-blocks-as-opml current-repo root-block-ids)
          :html (export/export-blocks-as-html current-repo root-block-ids)
          (export/export-blocks-as-markdown current-repo root-block-ids text-indent-style (into [] text-remove-options)))]
    [:div.export.resize
     [:div
      {:class "mb-2"}
      (ui/button "Text"
                 :class "mr-2 w-20"
                 :on-click #(reset! *export-block-type :text))
      (ui/button "OPML"
                 :class "mr-2 w-20"
                 :on-click #(reset! *export-block-type :opml))
      (ui/button "HTML"
                 :class "w-20"
                 :on-click #(reset! *export-block-type :html))]
     [:textarea.overflow-y-auto.h-96 {:value content}]
     (let [options (->> text-indent-style-options
                        (mapv (fn [opt]
                                (if (= text-indent-style (:label opt))
                                  (assoc opt :selected true)
                                  opt))))]
       [:div [:div.flex.items-center
              [:label.mr-8
               {:style {:visibility (if (= :text type) "visible" "hidden")}}
               "Indentation style:"]
              [:select.block.my-2.text-lg.rounded.border
               {:style     {:padding "0 0 0 12px"
                            :visibility (if (= :text type) "visible" "hidden")}
                :on-change (fn [e]
                             (let [value (util/evalue e)]
                               (state/set-export-block-text-indent-style! value)))}
               (for [{:keys [label value selected]} options]
                 [:option (cond->
                           {:key   label
                            :value (or value label)}
                            selected
                            (assoc :selected selected))
                  label])]]
        [:div.flex.items-center
         (ui/checkbox {:style {:margin-right 6
                               :visibility (if (= :text type) "visible" "hidden")}
                       :checked (contains? text-remove-options :page-ref)
                       :on-change (fn [e]
                                    (state/update-export-block-text-remove-options! e :page-ref))})

         [:div
          {:style {:visibility (if (= :text type) "visible" "hidden")}}
          "[[text]] -> text"]
         (ui/checkbox {:style {:margin-right 6
                               :margin-left 10
                               :visibility (if (= :text type) "visible" "hidden")}
                       :checked (contains? text-remove-options :emphasis)
                       :on-change (fn [e]
                                    (state/update-export-block-text-remove-options! e :emphasis))})

         [:div
          {:style {:visibility (if (= :text type) "visible" "hidden")}}
          "remove emphasis"]]])

     (ui/button (if @copied? "Copied to clipboard!" "Copy to clipboard")
                :on-click (fn []
                            (util/copy-to-clipboard! content (= type :html))
                            (reset! copied? true)))]))
