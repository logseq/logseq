(ns frontend.components.page
  (:require [rum.core :as rum]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.handler.file :as file]
            [frontend.handler.page :as page-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [clojure.string :as string]
            [frontend.db :as db]
            [dommy.core :as d]
            [frontend.components.block :as block]
            [frontend.components.editor :as editor]
            [frontend.components.reference :as reference]
            [frontend.components.svg :as svg]
            [frontend.extensions.graph-2d :as graph-2d]
            [frontend.ui :as ui]
            [frontend.components.content :as content]
            [frontend.components.project :as project]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.mixins :as mixins]
            [frontend.db-mixins :as db-mixins]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [frontend.utf8 :as utf8]
            [frontend.date :as date]
            [frontend.graph :as graph]
            [frontend.format.mldoc :as mldoc]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs.pprint :as pprint]
            [frontend.context.i18n :as i18n]
            [reitit.frontend.easy :as rfe]))

(defn- get-page-name
  [state]
  (let [route-match (first (:rum/args state))]
    (get-in route-match [:parameters :path :name])))

(defn- get-blocks
  [repo page-name page-original-name block? block-id]
  (when page-name
    (if block?
      (db/get-block-and-children repo block-id)
      (do
        (db/add-page-to-recent! repo page-original-name)
        (db/get-page-blocks repo page-name)))))

(rum/defc page-blocks-cp < rum/reactive
  db-mixins/query
  [repo page file-path page-name page-original-name encoded-page-name sidebar? journal? block? block-id format]
  (let [raw-page-blocks (get-blocks repo page-name page-original-name block? block-id)
        page-blocks (db/with-dummy-block raw-page-blocks format
                      (if (empty? raw-page-blocks)
                        (let [content (db/get-file repo file-path)]
                          {:block/page {:db/id (:db/id page)}
                           :block/file {:db/id (:db/id (:page/file page))}
                           :block/meta
                           (let [file-id (:db/id (:page/file page))]
                             {:start-pos (utf8/length (utf8/encode content))
                              :end-pos nil})}))
                      journal?)
        start-level (or (:block/level (first page-blocks)) 1)
        hiccup-config {:id encoded-page-name
                       :start-level start-level
                       :sidebar? sidebar?
                       :block? block?
                       :editor-box editor/box}
        hiccup (block/->hiccup page-blocks hiccup-config {})]
    (rum/with-key
      (content/content encoded-page-name
                       {:hiccup hiccup
                        :sidebar? sidebar?})
      (str encoded-page-name "-hiccup"))))

(defn contents-page
  [{:page/keys [name original-name file] :as contents}]
  (when-let [repo (state/get-current-repo)]
    (let [format (db/get-page-format name)
          file-path (:file/path file)]
      (page-blocks-cp repo contents file-path name original-name name true false false nil format))))

(defn presentation
  [repo page journal?]
  [:a.opacity-50.hover:opacity-100.ml-4
   {:title "Presentation mode (Powered by Reveal.js)"
    :on-click (fn []
                (state/sidebar-add-block!
                 repo
                 (:db/id page)
                 :page-presentation
                 {:page page
                  :journal? journal?}))}
   svg/slideshow])

(rum/defc today-queries < rum/reactive
  [repo today? sidebar?]
  (when (and today? (not sidebar?))
    (let [queries (state/sub [:config repo :default-queries :journals])]
      (when (seq queries)
        [:div#today-queries.mt-10
         (for [{:keys [title] :as query} queries]
           (rum/with-key
             (block/custom-query {:start-level 2
                                  :attr {:class "mt-10"}
                                  :editor-box editor/box} query)
             (str repo "-custom-query-" (:query query))))]))))

(defn- delete-page!
  [page-name]
  (page-handler/delete! page-name
                        (fn []
                          (notification/show! (str "Page " page-name " was deleted successfully!")
                                              :success)))
  (state/close-modal!)
  (route-handler/redirect-to-home!))

(defn delete-page-dialog
  [page-name]
  (fn [close-fn]
    [:div
     [:div.sm:flex.sm:items-start
      [:div.mx-auto.flex-shrink-0.flex.items-center.justify-center.h-12.w-12.rounded-full.bg-red-100.sm:mx-0.sm:h-10.sm:w-10
       [:svg.h-6.w-6.text-red-600
        {:stroke "currentColor", :view-box "0 0 24 24", :fill "none"}
        [:path
         {:d
          "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
          :stroke-width "2",
          :stroke-linejoin "round",
          :stroke-linecap "round"}]]]
      [:div.mt-3.text-center.sm:mt-0.sm:ml-4.sm:text-left
       [:h3#modal-headline.text-lg.leading-6.font-medium.text-gray-900
        "Are you sure you want to delete this page?"]]]

     [:div.mt-5.sm:mt-4.sm:flex.sm:flex-row-reverse
      [:span.flex.w-full.rounded-md.shadow-sm.sm:ml-3.sm:w-auto
       [:button.inline-flex.justify-center.w-full.rounded-md.border.border-transparent.px-4.py-2.bg-indigo-600.text-base.leading-6.font-medium.text-white.shadow-sm.hover:bg-indigo-500.focus:outline-none.focus:border-indigo-700.focus:shadow-outline-indigo.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
        {:type "button"
         :on-click (fn []
                     (delete-page! page-name))}
        "Yes"]]
      [:span.mt-3.flex.w-full.rounded-md.shadow-sm.sm:mt-0.sm:w-auto
       [:button.inline-flex.justify-center.w-full.rounded-md.border.border-gray-300.px-4.py-2.bg-white.text-base.leading-6.font-medium.text-gray-700.shadow-sm.hover:text-gray-500.focus:outline-none.focus:border-blue-300.focus:shadow-outline-blue.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
        {:type "button"
         :on-click close-fn}
        "Cancel"]]]]))

(rum/defcs rename-page-dialog-inner <
  (rum/local "" ::input)
  [state page-name close-fn]
  (let [input (get state ::input)]
    [:div
     [:div.sm:flex.sm:items-start
      [:div.mt-3.text-center.sm:mt-0.sm:text-left
       [:h3#modal-headline.text-lg.leading-6.font-medium.text-gray-900
        (str "Rename \"" page-name "\" to:")]]]

     [:input.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2
      {:auto-focus true
       :style {:color "#000"}
       :on-change (fn [e]
                    (reset! input (util/evalue e)))}]

     [:div.mt-5.sm:mt-4.sm:flex.sm:flex-row-reverse
      [:span.flex.w-full.rounded-md.shadow-sm.sm:ml-3.sm:w-auto
       [:button.inline-flex.justify-center.w-full.rounded-md.border.border-transparent.px-4.py-2.bg-indigo-600.text-base.leading-6.font-medium.text-white.shadow-sm.hover:bg-indigo-500.focus:outline-none.focus:border-indigo-700.focus:shadow-outline-indigo.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
        {:type "button"
         :on-click (fn []
                     (let [value @input]
                       (let [value (string/trim value)]
                         (when-not (string/blank? value)
                           (page-handler/rename! page-name value)
                           (state/close-modal!)))))}
        "Submit"]]
      [:span.mt-3.flex.w-full.rounded-md.shadow-sm.sm:mt-0.sm:w-auto
       [:button.inline-flex.justify-center.w-full.rounded-md.border.border-gray-300.px-4.py-2.bg-white.text-base.leading-6.font-medium.text-gray-700.shadow-sm.hover:text-gray-500.focus:outline-none.focus:border-blue-300.focus:shadow-outline-blue.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
        {:type "button"
         :on-click close-fn}
        "Cancel"]]]]))

(defn rename-page-dialog
  [page-name]
  (fn [close-fn]
    (rename-page-dialog-inner page-name close-fn)))

(defn tagged-pages
  [repo tag]
  (let [pages (db/get-tag-pages repo tag)]
    (when (seq pages)
      [:div.references.mt-6.flex-1.flex-row
       [:div.content
        (ui/foldable
         [:h2.font-bold.opacity-50 (util/format "Pages tagged with \"%s\"" tag)]
         [:ul.mt-2
          (for [[original-name name] pages]
            [:li {:key (str "tagged-page-" name)}
             [:a {:href (str "/page/" (util/encode-str name))}
              original-name]])])]])))

(defonce last-route (atom :home))
;; A page is just a logical block
(rum/defcs page < rum/reactive
  {:did-mount (fn [state]
                (ui-handler/scroll-and-highlight! state)
                ;; only when route changed
                (when (not= @last-route (state/get-current-route))
                  (editor-handler/open-last-block! false))
                (reset! last-route (state/get-current-route))
                state)
   :did-update (fn [state]
                 (ui-handler/scroll-and-highlight! state)
                 state)}
  [state {:keys [repo] :as option}]
  (let [current-repo (state/sub :git/current-repo)
        repo (or repo current-repo)
        encoded-page-name (or (get-page-name state)
                              (state/get-current-page))
        page-name (string/lower-case (util/url-decode encoded-page-name))
        path-page-name page-name
        marker-page? (util/marker? page-name)
        priority-page? (contains? #{"a" "b" "c"} page-name)
        format (db/get-page-format page-name)
        journal? (db/journal-page? page-name)
        block? (util/uuid-string? page-name)
        block-id (and block? (uuid page-name))
        sidebar? (:sidebar? option)]
    (rum/with-context [[t] i18n/*tongue-context*]
      (cond
        priority-page?
        [:div.page
         [:h1.title
          (str "Priority \"" (string/upper-case page-name) "\"")]
         [:div.ml-2
          (reference/references page-name false true)]]

        marker-page?
        [:div.page
         [:h1.title
          (string/upper-case page-name)]
         [:div.ml-2
          (reference/references page-name true false)]]

        :else
        (let [route-page-name page-name
              page (if block?
                     (->> (:db/id (:block/page (db/entity repo [:block/uuid block-id])))
                          (db/entity repo))
                     (db/entity repo [:page/name page-name]))
              properties (:page/properties page)
              page-name (:page/name page)
              page-original-name (:page/original-name page)
              file (:page/file page)
              file-path (and (:db/id file) (:file/path (db/entity repo (:db/id file))))
              today? (and
                      journal?
                      (= page-name (string/lower-case (date/journal-name))))
              developer-mode? (state/sub [:ui/developer-mode?])
              published? (= "true" (:published properties))
              public? (= "true" (:public properties))]
          [:div.flex-1.page.relative
           [:div.relative
            (when (and (not block?)
                       (not sidebar?)
                       (not config/publishing?))

              (let [links (->>
                           [(when file
                              {:title (t :page/re-index)
                               :options {:on-click (fn []
                                                     (file/re-index! file))}})
                            {:title (t :page/add-to-contents)
                             :options {:on-click (fn [] (page-handler/handle-add-page-to-contents! page-original-name))}}
                            {:title (t :page/rename)
                             :options {:on-click #(state/set-modal! (rename-page-dialog page-name))}}
                            {:title (t :page/delete)
                             :options {:on-click #(state/set-modal! (delete-page-dialog page-name))}}
                            {:title (t (if public? :page/make-private :page/make-public))
                             :options {:on-click #(page-handler/update-public-attribute!
                                                   page-name
                                                   (if public? false true))}}
                            {:title (t :page/publish)
                             :options {:on-click (fn []
                                                   (page-handler/publish-page! page-name project/add-project))}}
                            {:title (t :page/publish-as-slide)
                             :options {:on-click (fn []
                                                   (page-handler/publish-page-as-slide! page-name project/add-project))}}
                            (when published?
                              {:title (t :page/unpublish)
                               :options {:on-click (fn []
                                                     (page-handler/unpublish-page! page-name))}})
                            (when developer-mode?
                              {:title "(Dev) Show page data"
                               :options {:on-click (fn []
                                                     (let [page-data (with-out-str (pprint/pprint (db/pull (:db/id page))))]
                                                       (println page-data)
                                                       (notification/show!
                                                        [:div
                                                         [:pre.code page-data]
                                                         [:br]
                                                         (ui/button "Copy to clipboard"
                                                                    :on-click #(.writeText js/navigator.clipboard page-data))]
                                                        :success
                                                        false)))}})]
                           (remove nil?))]
                (when (seq links)
                  (ui/dropdown-with-links
                   (fn [{:keys [toggle-fn]}]
                     [:a.opacity-70.hover:opacity-100
                      {:style {:position "absolute"
                               :right 0
                               :top 20}
                       :title "More options"
                       :on-click toggle-fn}
                      (svg/vertical-dots {:class (util/hiccup->class "opacity-50.hover:opacity-100.h-5.w-5")})])
                   links
                   {:modal-class (util/hiccup->class
                                  "origin-top-right.absolute.right-0.top-10.mt-2.rounded-md.shadow-lg.whitespace-no-wrap.dropdown-overflow-auto.page-drop-options")
                    :z-index 1}))))
            (when (and (not sidebar?)
                       (not block?))
              [:a {:on-click (fn [e]
                               (util/stop e)
                               (when (gobj/get e "shiftKey")
                                 (when-let [page (db/pull repo '[*] [:page/name page-name])]
                                   (state/sidebar-add-block!
                                    repo
                                    (:db/id page)
                                    :page
                                    {:page page}))))}
               [:h1.title {:style {:margin-left -2}}
                (if page-original-name
                  (if (and (string/includes? page-original-name "[[")
                           (string/includes? page-original-name "]]"))
                    (let [ast (mldoc/->edn page-original-name (mldoc/default-config format))]
                      (block/markup-element-cp {} (ffirst ast)))
                    page-original-name)
                  (or
                   page-name
                   path-page-name))]])
            [:div
             [:div.content
              (when (and file-path
                         (not sidebar?)
                         (not block?)
                         (not (state/hide-file?))
                         (not config/publishing?))
                [:div.text-sm.ml-1.mb-4.flex-1 {:key "page-file"}
                 [:span.opacity-50 (t :file/file)]
                 [:a.bg-base-2.p-1.ml-1 {:style {:border-radius 4}
                                         :href (str "/file/" (util/url-encode file-path))}
                  file-path]])]

             (when (and block? (not sidebar?))
               [:div.mb-4
                (block/block-parents repo block-id format)])

             ;; blocks
             (page-blocks-cp repo page file-path page-name page-original-name encoded-page-name sidebar? journal? block? block-id format)]]

           (when-not block?
             (today-queries repo today? sidebar?))

           (tagged-pages repo page-name)

           ;; referenced blocks
           [:div {:key "page-references"}
            (reference/references route-page-name false)]

           [:div {:key "page-unlinked-references"}
            (reference/unlinked-references route-page-name)]])))))

(defonce layout (atom [js/window.outerWidth js/window.outerHeight]))

(defonce graph-ref (atom nil))
(defonce show-journal? (atom false))
(defonce dot-mode? (atom false))

(rum/defcs global-graph < rum/reactive
  [state]
  (let [theme (state/sub :ui/theme)
        sidebar-open? (state/sub :ui/sidebar-open?)
        [width height] (rum/react layout)
        dark? (= theme "dark")
        graph (db/build-global-graph theme (rum/react show-journal?))
        dot-mode-value? (rum/react dot-mode?)]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div.relative#global-graph
       (if (seq (:nodes graph))
         (graph-2d/graph
          (graph/build-graph-opts
           graph
           dark?
           dot-mode-value?
           {:width (if (and (> width 1280) sidebar-open?)
                     (- width 24 600)
                     (- width 24))
            :height (- height 120)
            :ref (fn [v] (reset! graph-ref v))
            :ref-atom graph-ref}))
         [:div.ls-center.mt-20
          [:p.opacity-70.font-medium "Empty"]])
       [:div.absolute.top-5.left-5
        [:div.flex.flex-col
         [:a.text-sm.font-medium
          {:on-click (fn [_e]
                       (swap! show-journal? not))}
          (str (t :page/show-journals)
               (if @show-journal? " (ON)"))]
         [:a.text-sm.font-medium.mt-4
          {:title (if @dot-mode?
                    (t :page/show-name)
                    (t :page/hide-name))
           :on-click (fn [_e]
                       (swap! dot-mode? not))}
          (str (t :dot-mode)
               (if @dot-mode? " (ON)"))]]]])))

(rum/defc all-pages < rum/reactive
  ;; {:did-mount (fn [state]
  ;;               (let [current-repo (state/sub :git/current-repo)]
  ;;                 (js/setTimeout #(db/remove-orphaned-pages! current-repo) 0))
  ;;               state)}
  []
  (let [current-repo (state/sub :git/current-repo)]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div.flex-1
       [:h1.title (t :all-pages)]
       (when current-repo
         (let [pages (db/get-pages-with-modified-at current-repo)]
           [:table.table-auto
            [:thead
             [:tr
              [:th (t :page/name)]
              [:th (t :file/last-modified-at)]]]
            [:tbody
             (for [[page modified-at] pages]
               (let [encoded-page (util/encode-str page)]
                 [:tr {:key encoded-page}
                  [:td [:a {:on-click (fn [e]
                                        (util/stop e)
                                        (let [repo (state/get-current-repo)
                                              page (db/pull repo '[*] [:page/name (string/lower-case page)])]
                                          (when (gobj/get e "shiftKey")
                                            (state/sidebar-add-block!
                                             repo
                                             (:db/id page)
                                             :page
                                             {:page page}))))
                            :href (rfe/href :page {:name encoded-page})}
                        page]]
                  [:td [:span.text-gray-500.text-sm
                        (if (zero? modified-at)
                          (t :file/no-data)
                          (date/get-date-time-string
                           (t/to-default-time-zone (tc/to-date-time modified-at))))]]]))]]))])))

(rum/defcs new < rum/reactive
  (rum/local "" ::title)
  (mixins/event-mixin
   (fn [state]
     (mixins/on-enter state
                      :node (gdom/getElement "page-title")
                      :on-enter (fn []
                                  (let [title @(get state ::title)]
                                    (when-not (string/blank? title)
                                      (page-handler/create! title)))))))
  [state]
  (rum/with-context [[t] i18n/*tongue-context*]
    (let [title (get state ::title)]
      [:div#page-new.flex-1.flex-col {:style {:flex-wrap "wrap"}}
       [:div.mt-10.mb-2 {:style {:font-size "1.5rem"}}
        (t :page/new-title)]
       [:input#page-title.focus:outline-none.ml-1.text-gray-900
        {:style {:border "none"
                 :font-size "1.8rem"
                 :max-width 300}
         :auto-focus true
         :auto-complete "off"
         :on-change (fn [e]
                      (reset! title (util/evalue e)))}]])))
