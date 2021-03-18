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
        (when (util/electron?)
          [:li.mb-4
           [:a.font-medium {:on-click #(export/export-repo-as-html! current-repo)}
            (t :export-public-pages)]])
        [:li.mb-4
         [:a.font-medium {:on-click #(export/export-repo-as-markdown! current-repo)}
          (t :export-markdown)]]
        [:li.mb-4
         [:a.font-medium {:on-click #(export/export-repo-as-edn! current-repo)}
          (t :export-edn)]]]
       [:a#download-as-edn.hidden]
       [:a#download-as-html.hidden]
       [:a#download-as-zip.hidden]
       [:a#export-as-markdown.hidden]])))
