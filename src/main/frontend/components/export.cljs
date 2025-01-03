(ns frontend.components.export
  (:require ["/frontend/utils" :as utils]
            [cljs-time.core :as t]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.handler.export :as export]
            [frontend.handler.export.html :as export-html]
            [frontend.handler.export.opml :as export-opml]
            [frontend.handler.export.text :as export-text]
            [frontend.handler.notification :as notification]
            [frontend.idb :as idb]
            [frontend.image :as image]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.db :as ldb]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [rum.core :as rum]))

(rum/defcs auto-backup < rum/reactive
  {:init (fn [state]
           (assoc state ::folder (atom (ldb/get-key-value (db/get-db) :logseq.kv/graph-backup-folder))))}
  [state]
  (let [*backup-folder (::folder state)
        backup-folder (rum/react *backup-folder)
        repo (state/get-current-repo)]
    [:div.flex.flex-col.gap-4
     [:div.font-medium.opacity-50
      "Schedule backup"]
     (if backup-folder
       [:div.flex.flex-row.items-center.gap-1.text-sm
        [:div.opacity-50 (str "Backup folder:")]
        backup-folder
        (shui/button
         {:variant :ghost
          :class "!px-1 !py-1"
          :title "Change backup folder"
          :on-click (fn []
                      (p/do!
                       (db/transact! [[:db/retractEntity :logseq.kv/graph-backup-folder]])
                       (reset! *backup-folder nil)))
          :size :sm}
         (ui/icon "edit"))]
       (shui/button
        {:variant :default
         :on-click (fn []
                     (p/let [result (utils/openDirectory #js {:mode "readwrite"})
                             handle (first result)
                             folder-name (.-name handle)]
                       (idb/set-item!
                        (str "handle/" (js/btoa repo) "/" folder-name) handle)
                       (db/transact! [(ldb/kv :logseq.kv/graph-backup-folder folder-name)])
                       (reset! *backup-folder folder-name)))}
        "Set backup folder first"))
     [:div.opacity-50.text-sm
      "Backup will be created every hour."]

     (when backup-folder
       (shui/button
        {:variant :default
         :on-click (fn []
                     (->
                      (p/let [result (export/backup-db-graph repo)]
                        (case result
                          true
                          (notification/show! "Backup successful!" :success)
                          :graph-not-changed
                          (notification/show! "Graph has not been updated since last export." :success)
                          nil)
                        (export/auto-db-backup! repo {:backup-now? false}))
                      (p/catch (fn [error]
                                 (println "Failed to backup.")
                                 (js/console.error error)))))}
        "Backup now"))]))

(rum/defc export
  []
  (when-let [current-repo (state/get-current-repo)]
    (let [db-based? (config/db-based-graph? current-repo)]
      [:div.export
       [:h1.title.mb-8 (t :export)]

       [:div.flex.flex-col.gap-4.ml-1
        (when-not db-based?
          [:div
           [:a.font-medium {:on-click #(export/export-repo-as-edn! current-repo)}
            (t :export-edn)]])
        (when-not db-based?
          [:div
           [:a.font-medium {:on-click #(export/export-repo-as-json! current-repo)}
            (t :export-json)]])
        (when db-based?
          [:div
           [:a.font-medium {:on-click #(export/export-repo-as-sqlite-db! current-repo)}
            (t :export-sqlite-db)]])
        (when db-based?
          [:div
           [:a.font-medium {:on-click #(export/export-repo-as-zip! current-repo)}
            (t :export-zip)]])
        (when db-based?
          [:div
           [:a.font-medium {:on-click #(export/export-repo-as-debug-transit! current-repo)}
            "Export debug transit file"]
           [:p.text-sm.opacity-70 "Any sensitive data will be removed in the exported transit file, you can send it to us for debugging."]])

        (when (util/electron?)
          [:div
           [:a.font-medium {:on-click #(export/download-repo-as-html! current-repo)}
            (t :export-public-pages)]])
        (when-not (or (mobile-util/native-platform?) db-based?)
          [:div
           [:a.font-medium {:on-click #(export-text/export-repo-as-markdown! current-repo)}
            (t :export-markdown)]])
        (when-not (or (mobile-util/native-platform?) db-based?)
          [:div
           [:a.font-medium {:on-click #(export-opml/export-repo-as-opml! current-repo)}
            (t :export-opml)]])
        (when-not (or (mobile-util/native-platform?) db-based?)
          [:div
           [:a.font-medium {:on-click #(export/export-repo-as-roam-json! current-repo)}
            (t :export-roam-json)]])

        (when (and db-based? util/web-platform? (utils/nfsSupported))
          [:div
           [:hr]
           (auto-backup)])]])))

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

(defn- get-zoom-level
  [page-uuid]
  (let [uuid (:block/uuid (db/get-page page-uuid))
        whiteboard-camera (->> (str "logseq.tldraw.camera:" uuid)
                               (.getItem js/sessionStorage)
                               (js/JSON.parse)
                               (js->clj))]
    (or (get whiteboard-camera "zoom") 1)))

(defn- get-image-blob
  [block-uuids-or-page-name {:keys [transparent-bg? x y width height zoom]} callback]
  (let [top-block-id (if (coll? block-uuids-or-page-name) (first block-uuids-or-page-name) block-uuids-or-page-name)
        style (js/window.getComputedStyle js/document.body)
        background (when-not transparent-bg? (.getPropertyValue style "--ls-primary-background-color"))
        page? (and (uuid? top-block-id) (db/page? (db/entity [:block/uuid top-block-id])))
        selector (if page?
                   "#main-content-container"
                   (str "[blockid='" top-block-id "']"))
        container  (js/document.querySelector selector)
        scale (if page? (/ 1 (or zoom (get-zoom-level top-block-id))) 1)
        options #js {:allowTaint true
                     :useCORS true
                     :backgroundColor (or background "transparent")
                     :x (or (/ x scale) 0)
                     :y (or (/ y scale) 0)
                     :width (when width (/ width scale))
                     :height (when height (/ height scale))
                     :scrollX 0
                     :scrollY 0
                     :scale scale
                     :windowHeight (when page?
                                     (.-scrollHeight container))}]
    (-> (js/html2canvas container options)
        (.then (fn [canvas] (.toBlob canvas (fn [blob]
                                              (when blob
                                                (let [img (js/document.getElementById "export-preview")
                                                      img-url (image/create-object-url blob)]
                                                  (set! (.-src img) img-url)
                                                  (callback blob)))) "image/png"))))))

(rum/defcs ^:large-vars/cleanup-todo
  export-blocks < rum/static
  (rum/local false ::copied?)
  (rum/local nil ::text-remove-options)
  (rum/local nil ::text-indent-style)
  (rum/local nil ::text-other-options)
  (rum/local nil ::content)
  {:will-mount (fn [state]
                 (reset! *export-block-type (if (:whiteboard? (last (:rum/args state))) :png :text))
                 (if (= @*export-block-type :png)
                   (do (reset! (::content state) nil)
                       (get-image-blob (first (:rum/args state))
                                       (merge (second (:rum/args state)) {:transparent-bg? false})
                                       (fn [blob] (reset! (::content state) blob))))
                   (reset! (::content state) (export-helper (first (:rum/args state)))))
                 (reset! (::text-remove-options state) (set (state/get-export-block-text-remove-options)))
                 (reset! (::text-indent-style state) (state/get-export-block-text-indent-style))
                 (reset! (::text-other-options state) (state/get-export-block-text-other-options))
                 state)}
  [state root-block-uuids-or-page-uuid {:keys [whiteboard?] :as options}]
  (let [tp @*export-block-type
        *text-other-options (::text-other-options state)
        *text-remove-options (::text-remove-options state)
        *text-indent-style (::text-indent-style state)
        *copied? (::copied? state)
        *content (::content state)]
    [:div.export.resize
     {:class "-m-5"}
     [:div.p-6
      (when-not whiteboard?
        [:div.flex.pb-3
         (ui/button "Text"
                    :class "mr-4 w-20"
                    :on-click #(do (reset! *export-block-type :text)
                                   (reset! *content (export-helper root-block-uuids-or-page-uuid))))
         (ui/button "OPML"
                    :class "mr-4 w-20"
                    :on-click #(do (reset! *export-block-type :opml)
                                   (reset! *content (export-helper root-block-uuids-or-page-uuid))))
         (ui/button "HTML"
                    :class "mr-4 w-20"
                    :on-click #(do (reset! *export-block-type :html)
                                   (reset! *content (export-helper root-block-uuids-or-page-uuid))))
         (when-not (seq? root-block-uuids-or-page-uuid)
           (ui/button "PNG"
                      :class "w-20"
                      :on-click #(do (reset! *export-block-type :png)
                                     (reset! *content nil)
                                     (get-image-blob root-block-uuids-or-page-uuid (merge options {:transparent-bg? false}) (fn [blob] (reset! *content blob))))))])

      (if (= :png tp)
        [:div.flex.items-center.justify-center.relative
         (when (not @*content) [:div.absolute (ui/loading "")])
         [:img {:alt "export preview" :id "export-preview" :class "my-4" :style {:visibility (when (not @*content) "hidden")}}]]

        [:textarea.overflow-y-auto.h-96 {:value @*content :read-only true}])

      (if (= :png tp)
        [:div.flex.items-center
         [:div (t :export-transparent-background)]
         (ui/checkbox {:class "mr-2 ml-4"
                       :on-change (fn [e]
                                    (reset! *content nil)
                                    (get-image-blob root-block-uuids-or-page-uuid (merge options {:transparent-bg? e.currentTarget.checked}) (fn [blob] (reset! *content blob))))})]
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
                  {:style {:visibility (if (= :text tp) "visible" "hidden")}
                   :on-change (fn [e]
                                (let [value (util/evalue e)]
                                  (state/set-export-block-text-indent-style! value)
                                  (reset! *text-indent-style value)
                                  (reset! *content (export-helper root-block-uuids-or-page-uuid))))}
                  (for [{:keys [label value selected]} options]
                    [:option (cond->
                              {:key label
                               :value (or value label)}
                               selected
                               (assoc :selected selected))
                     label])]]
           [:div.flex.items-center
            (ui/checkbox {:class "mr-2"
                          :style {:visibility (if (#{:text :html :opml} tp) "visible" "hidden")}
                          :value (contains? @*text-remove-options :page-ref)
                          :on-change (fn [e]
                                       (state/update-export-block-text-remove-options! e :page-ref)
                                       (reset! *text-remove-options (state/get-export-block-text-remove-options))
                                       (reset! *content (export-helper root-block-uuids-or-page-uuid)))})
            [:div {:style {:visibility (if (#{:text :html :opml} tp) "visible" "hidden")}}
             "[[text]] -> text"]

            (ui/checkbox {:class "mr-2 ml-4"
                          :style {:visibility (if (#{:text :html :opml} tp) "visible" "hidden")}
                          :value (contains? @*text-remove-options :emphasis)
                          :on-change (fn [e]
                                       (state/update-export-block-text-remove-options! e :emphasis)
                                       (reset! *text-remove-options (state/get-export-block-text-remove-options))
                                       (reset! *content (export-helper root-block-uuids-or-page-uuid)))})

            [:div {:style {:visibility (if (#{:text :html :opml} tp) "visible" "hidden")}}
             "remove emphasis"]

            (ui/checkbox {:class "mr-2 ml-4"
                          :style {:visibility (if (#{:text :html :opml} tp) "visible" "hidden")}
                          :value (contains? @*text-remove-options :tag)
                          :on-change (fn [e]
                                       (state/update-export-block-text-remove-options! e :tag)
                                       (reset! *text-remove-options (state/get-export-block-text-remove-options))
                                       (reset! *content (export-helper root-block-uuids-or-page-uuid)))})

            [:div {:style {:visibility (if (#{:text :html :opml} tp) "visible" "hidden")}}
             "remove #tags"]]

           [:div.flex.items-center
            (ui/checkbox {:class "mr-2"
                          :style {:visibility (if (#{:text} tp) "visible" "hidden")}
                          :value (boolean (:newline-after-block @*text-other-options))
                          :on-change (fn [e]
                                       (state/update-export-block-text-other-options!
                                        :newline-after-block (boolean (util/echecked? e)))
                                       (reset! *text-other-options (state/get-export-block-text-other-options))
                                       (reset! *content (export-helper root-block-uuids-or-page-uuid)))})
            [:div {:style {:visibility (if (#{:text} tp) "visible" "hidden")}}
             "newline after block"]

            (ui/checkbox {:class "mr-2 ml-4"
                          :style {:visibility (if (#{:text} tp) "visible" "hidden")}
                          :value (contains? @*text-remove-options :property)
                          :on-change (fn [e]
                                       (state/update-export-block-text-remove-options! e :property)
                                       (reset! *text-remove-options (state/get-export-block-text-remove-options))
                                       (reset! *content (export-helper root-block-uuids-or-page-uuid)))})
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
                             (reset! *content (export-helper root-block-uuids-or-page-uuid))))}
             (for [n (cons "all" (range 1 10))]
               [:option {:key n :value n} n])]]]))

      (when @*content
        [:div.mt-4.flex.flex-row.gap-2
         (ui/button (if @*copied? (t :export-copied-to-clipboard) (t :export-copy-to-clipboard))
                    :class "mr-4"
                    :on-click (fn []
                                (if (= tp :png)
                                  (js/navigator.clipboard.write [(js/ClipboardItem. #js {"image/png" @*content})])
                                  (util/copy-to-clipboard! @*content :html (when (= tp :html) @*content)))
                                (reset! *copied? true)))
         (ui/button (t :export-save-to-file)
                    :on-click #(let [file-name (if (uuid? root-block-uuids-or-page-uuid)
                                                 (-> (db/get-page root-block-uuids-or-page-uuid)
                                                     (util/get-page-title))
                                                 (t/now))]
                                 (utils/saveToFile (js/Blob. [@*content]) (str "logseq_" file-name) (if (= tp :text) "txt" (name tp)))))])]]))
