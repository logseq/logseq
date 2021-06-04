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
      [:div.export.w-96
       [:h1.title "Export"]

       [:ul.mr-1
        [:li.mb-4
         [:a.font-medium {:on-click #(export/convert-repo-markdown-v2! current-repo)}
          (t :convert-markdown)]]
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
         [:a.font-medium {:on-click #(export/export-repo-as-edn! current-repo)}
          (t :export-datascript-edn)]]
        [:li.mb-4
         [:a.font-medium {:on-click #(export/export-repo-as-edn-v2! current-repo)}
          (t :export-edn)]]
        [:li.mb-4
         [:a.font-medium {:on-click #(export/export-repo-as-json-v2! current-repo)}
          (t :export-json)]]
        ]
       [:a#download-as-edn.hidden]
       [:a#download-as-edn-v2.hidden]
       [:a#download-as-json-v2.hidden]
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
        [:div.export.w-96
         [:h1.title "Export"]
         [:ul.mr-1
          [:li.mb-4
           [:a.font-medium {:on-click #(export/export-page-as-markdown! page)}
            (t :export-markdown)]]
          [:li.mb-4
           [:a.font-medium {:on-click #(export/export-page-as-opml! page)}
            (t :export-opml)]]
          [:li.mb-4
           [:a.font-medium {:on-click #(export/convert-page-markdown-unordered-list-or-heading! page)}
            (t :convert-markdown)]]]
         [:a#export-page-as-markdown.hidden]
         [:a#export-page-as-opml.hidden]
         [:a#convert-markdown-to-unordered-list-or-heading.hidden]]))))
