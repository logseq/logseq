(ns frontend.components.export
  (:require [frontend.context.i18n :refer [t]]
            [frontend.handler.export.text :as export-text]
            [frontend.handler.export.html :as export-html]
            [frontend.handler.export.opml :as export-opml]
            [frontend.handler.export :as export]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]))

(rum/defc export
  []
  (when-let [current-repo (state/get-current-repo)]
    [:div.export
     [:h1.title (t :export)]
     [:ul.mr-1
      [:li.mb-4
       [:a.font-medium {:on-click #(export/export-repo-as-edn-v2! current-repo)}
        (t :export-edn)]]
      [:li.mb-4
       [:a.font-medium {:on-click #(export/export-repo-as-json-v2! current-repo)}
        (t :export-json)]]
      (when (util/electron?)
        [:li.mb-4
         [:a.font-medium {:on-click #(export/download-repo-as-html! current-repo)}
          (t :export-public-pages)]])
      (when-not (mobile-util/native-platform?)
        [:li.mb-4
         [:a.font-medium {:on-click #(export-text/export-repo-as-markdown! current-repo)}
          (t :export-markdown)]])
      (when-not (mobile-util/native-platform?)
        [:li.mb-4
         [:a.font-medium {:on-click #(export-opml/export-repo-as-opml! current-repo)}
          (t :export-opml)]])
      (when-not (mobile-util/native-platform?)
        [:li.mb-4
         [:a.font-medium {:on-click #(export/export-repo-as-roam-json! current-repo)}
          (t :export-roam-json)]])]
     [:a#download-as-edn-v2.hidden]
     [:a#download-as-json-v2.hidden]
     [:a#download-as-roam-json.hidden]
     [:a#download-as-html.hidden]
     [:a#download-as-zip.hidden]
     [:a#export-as-markdown.hidden]
     [:a#export-as-opml.hidden]
     [:a#convert-markdown-to-unordered-list-or-heading.hidden]]))


(def *export-block-type (atom :text))

(def text-indent-style-options [{:label "dashes"
                                 :selected false}
                                {:label "spaces"
                                 :selected false}
                                {:label "no-indent"
                                 :selected false}])

(defn- export-helper
  [block-uuids-or-page-name]
  (let [current-repo (state/get-current-repo)
        text-indent-style (state/get-export-block-text-indent-style)
        text-remove-options (set (state/get-export-block-text-remove-options))
        text-other-options (state/get-export-block-text-other-options)
        tp @*export-block-type]
    (case tp
      :text (export-text/export-blocks-as-markdown
             current-repo block-uuids-or-page-name
             {:indent-style text-indent-style :remove-options text-remove-options :other-options text-other-options})
      :opml (export-opml/export-blocks-as-opml
             current-repo block-uuids-or-page-name {:remove-options text-remove-options :other-options text-other-options})
      :html (export-html/export-blocks-as-html
             current-repo block-uuids-or-page-name {:remove-options text-remove-options :other-options text-other-options})
      "")))

(rum/defcs ^:large-vars/cleanup-todo
  export-blocks < rum/static
  (rum/local false ::copied?)
  (rum/local nil ::text-remove-options)
  (rum/local nil ::text-indent-style)
  (rum/local nil ::text-other-options)
  (rum/local nil ::content)
  {:will-mount (fn [state]
                 (let [content (export-helper (last (:rum/args state)))]
                   (reset! (::content state) content)
                   (reset! (::text-remove-options state) (set (state/get-export-block-text-remove-options)))
                   (reset! (::text-indent-style state) (state/get-export-block-text-indent-style))
                   (reset! (::text-other-options state) (state/get-export-block-text-other-options))
                   state))}
  [state root-block-uuids-or-page-name]
  (let [tp @*export-block-type
        *text-other-options (::text-other-options state)
        *text-remove-options (::text-remove-options state)
        *text-indent-style (::text-indent-style state)
        *copied? (::copied? state)
        *content (::content state)]
    [:div.export.resize
     [:div.flex
      {:class "mb-2"}
      (ui/button "Text"
                 :class "mr-4 w-20"
                 :on-click #(do (reset! *export-block-type :text)
                                (reset! *content (export-helper root-block-uuids-or-page-name))))
      (ui/button "OPML"
                 :class "mr-4 w-20"
                 :on-click #(do (reset! *export-block-type :opml)
                                (reset! *content (export-helper root-block-uuids-or-page-name))))
      (ui/button "HTML"
                 :class "w-20"
                 :on-click #(do (reset! *export-block-type :html)
                                (reset! *content (export-helper root-block-uuids-or-page-name))))]
     [:textarea.overflow-y-auto.h-96 {:value @*content :read-only true}]
     (let [options (->> text-indent-style-options
                        (mapv (fn [opt]
                                (if (= @*text-indent-style (:label opt))
                                  (assoc opt :selected true)
                                  opt))))]
       [:div [:div.flex.items-center
              [:label.mr-4
               {:style {:visibility (if (= :text tp) "visible" "hidden")}}
               "Indentation style:"]
              [:select.block.my-2.text-lg.rounded.border.py-0.px-1
               {:style     {:visibility (if (= :text tp) "visible" "hidden")}
                :on-change (fn [e]
                             (let [value (util/evalue e)]
                               (state/set-export-block-text-indent-style! value)
                               (reset! *text-indent-style value)
                               (reset! *content (export-helper root-block-uuids-or-page-name))))}
               (for [{:keys [label value selected]} options]
                 [:option (cond->
                           {:key   label
                            :value (or value label)}
                            selected
                            (assoc :selected selected))
                  label])]]
        [:div.flex.items-center
         (ui/checkbox {:class "mr-2"
                       :style {:visibility (if (#{:text :html :opml} tp) "visible" "hidden")}
                       :checked (contains? @*text-remove-options :page-ref)
                       :on-change (fn [e]
                                    (state/update-export-block-text-remove-options! e :page-ref)
                                    (reset! *text-remove-options (state/get-export-block-text-remove-options))
                                    (reset! *content (export-helper root-block-uuids-or-page-name)))})
         [:div {:style {:visibility (if (#{:text :html :opml} tp) "visible" "hidden")}}
          "[[text]] -> text"]

         (ui/checkbox {:class "mr-2 ml-4"
                       :style {:visibility (if (#{:text :html :opml} tp) "visible" "hidden")}
                       :checked (contains? @*text-remove-options :emphasis)
                       :on-change (fn [e]
                                    (state/update-export-block-text-remove-options! e :emphasis)
                                    (reset! *text-remove-options (state/get-export-block-text-remove-options))
                                    (reset! *content (export-helper root-block-uuids-or-page-name)))})

         [:div {:style {:visibility (if (#{:text :html :opml} tp) "visible" "hidden")}}
          "remove emphasis"]

         (ui/checkbox {:class "mr-2 ml-4"
                       :style {:visibility (if (#{:text :html :opml} tp) "visible" "hidden")}
                       :checked (contains? @*text-remove-options :tag)
                       :on-change (fn [e]
                                    (state/update-export-block-text-remove-options! e :tag)
                                    (reset! *text-remove-options (state/get-export-block-text-remove-options))
                                    (reset! *content (export-helper root-block-uuids-or-page-name)))})

         [:div {:style {:visibility (if (#{:text :html :opml} tp) "visible" "hidden")}}
          "remove #tags"]]

        [:div.flex.items-center
         (ui/checkbox {:class "mr-2"
                       :style {:visibility (if (#{:text} tp) "visible" "hidden")}
                       :checked (boolean (:newline-after-block @*text-other-options))
                       :on-change (fn [e]
                                    (state/update-export-block-text-other-options!
                                     :newline-after-block (boolean (util/echecked? e)))
                                    (reset! *text-other-options (state/get-export-block-text-other-options))
                                    (reset! *content (export-helper root-block-uuids-or-page-name)))})
         [:div {:style {:visibility (if (#{:text} tp) "visible" "hidden")}}
          "newline after block"]

         (ui/checkbox {:class "mr-2 ml-4"
                       :style {:visibility (if (#{:text} tp) "visible" "hidden")}
                       :checked (contains? @*text-remove-options :property)
                       :on-change (fn [e]
                                    (state/update-export-block-text-remove-options! e :property)
                                    (reset! *text-remove-options (state/get-export-block-text-remove-options))
                                    (reset! *content (export-helper root-block-uuids-or-page-name)))})
         [:div {:style {:visibility (if (#{:text} tp) "visible" "hidden")}}
          "remove properties"]]

        [:div.flex.items-center
         [:label.mr-2 {:style {:visibility (if (#{:text :html :opml} tp) "visible" "hidden")}}
          "level <="]
         [:select.block.my-2.text-lg.rounded.border.px-2.py-0
          {:style {:visibility (if (#{:text :html :opml} tp) "visible" "hidden")}
           :value (or (:keep-only-level<=N @*text-other-options) :all)
           :on-change (fn [e]
                        (let [value (util/evalue e)
                              level (if (= "all" value) :all (util/safe-parse-int value))]
                          (state/update-export-block-text-other-options! :keep-only-level<=N level)
                          (reset! *text-other-options (state/get-export-block-text-other-options))
                          (reset! *content (export-helper root-block-uuids-or-page-name))))}
          (for [n (cons "all" (range 1 10))]
            [:option {:key n :value n} n])]]])

     [:div.mt-4
      (ui/button (if @*copied? "Copied to clipboard!" "Copy to clipboard")
                 :on-click (fn []
                             (util/copy-to-clipboard! @*content (when (= tp :html) @*content))
                             (reset! *copied? true)))]]))
