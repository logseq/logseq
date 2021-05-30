(ns frontend.components.page
  (:require [rum.core :as rum]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.util.marker :as marker]
            [frontend.tools.html-export :as html-export]
            [frontend.handler.file :as file]
            [frontend.handler.page :as page-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.common :as common-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.graph :as graph-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [clojure.string :as string]
            [frontend.components.block :as block]
            [frontend.components.editor :as editor]
            [frontend.components.reference :as reference]
            [frontend.components.svg :as svg]
            [frontend.components.export :as export]
            [frontend.extensions.graph-2d :as graph-2d]
            [frontend.ui :as ui]
            [frontend.components.content :as content]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.db.utils :as db-utils]
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
            [reitit.frontend.easy :as rfe]
            [frontend.text :as text]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.handler.block :as block-handler]))

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
        (page-handler/add-page-to-recent! repo page-original-name)
        (db/get-page-blocks repo page-name)))))

(defn- open-first-block!
  [state]
  (let [blocks (nth (:rum/args state) 1)
        block (first blocks)]
    (when (and (= (count blocks) 1)
               (string/blank? (:block/content block)))
      (editor-handler/edit-block! block :max (:block/format block) (:block/uuid block))))
  state)

(rum/defc page-blocks-inner <
  {:did-mount open-first-block!
   :did-update open-first-block!}
  [page-name page-blocks hiccup sidebar?]
  [:div.page-blocks-inner
   (rum/with-key
     (content/content page-name
                      {:hiccup   hiccup
                       :sidebar? sidebar?})
     (str page-name "-hiccup"))])

(declare page)

(defn- get-page-format
  [page-name]
  (let [block? (util/uuid-string? page-name)
        block-id (and block? (uuid page-name))
        page (if block-id
               (:block/name (:block/page (db/entity [:block/uuid block-id])))
               page-name)]
    (db/get-page-format page)))

(rum/defc page-blocks-cp < rum/reactive
  db-mixins/query
  [repo page-e {:keys [sidebar? preview?] :as config}]
  (when page-e
    (let [page-name (or (:block/name page-e)
                        (str (:block/uuid page-e)))
          page-original-name (or (:block/original-name page-e) page-name)
          format (get-page-format page-name)
          journal? (db/journal-page? page-name)
          block? (util/uuid-string? page-name)
          block-id (and block? (uuid page-name))
          raw-page-blocks (get-blocks repo page-name page-original-name block? block-id)
          page-e (if (and page-e (:db/id page-e))
                   {:db/id (:db/id page-e)}
                   page-e)
          page-blocks (cond
                        (seq raw-page-blocks)
                        raw-page-blocks

                        page-e
                        (let [empty-block {:block/uuid (db/new-block-id)
                                           :block/left page-e
                                           :block/format format
                                           :block/content ""
                                           :block/parent page-e
                                           :block/unordered true
                                           :block/page page-e}]
                          (when (db/page-empty? repo (:db/id page-e))
                            (db/transact! [empty-block]))
                          [empty-block])

                        :else
                        nil)
          document-mode? (state/sub :document/mode?)
          hiccup-config (merge
                         {:id (if block? (str block-id) page-name)
                          :block? block?
                          :editor-box editor/box
                          :page page
                          :document/mode? document-mode?}
                         config)
          hiccup-config (common-handler/config-with-document-mode hiccup-config)
          hiccup (block/->hiccup page-blocks hiccup-config {})]
      (page-blocks-inner page-name page-blocks hiccup sidebar?))))

(defn contents-page
  [page]
  (when-let [repo (state/get-current-repo)]
    (page-blocks-cp repo page {:sidebar? true})))

(rum/defc today-queries < rum/reactive
  [repo today? sidebar?]
  (when (and today? (not sidebar?))
    (let [queries (state/sub [:config repo :default-queries :journals])]
      (when (seq queries)
        [:div#today-queries.mt-10
         (for [{:keys [title] :as query} queries]
           (rum/with-key
             (block/custom-query {:attr {:class "mt-10"}
                                  :editor-box editor/box
                                  :page page} query)
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
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div
       [:div.sm:flex.sm:items-start
        [:div.mx-auto.flex-shrink-0.flex.items-center.justify-center.h-12.w-12.rounded-full.bg-red-100.sm:mx-0.sm:h-10.sm:w-10
         [:svg.h-6.w-6.text-red-600
          {:stroke "currentColor", :view-box "0 0 24 24", :fill "none"}
          [:path
           {:d
            "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            :stroke-width "2"
            :stroke-linejoin "round"
            :stroke-linecap "round"}]]]
        [:div.mt-3.text-center.sm:mt-0.sm:ml-4.sm:text-left
         [:h3#modal-headline.text-lg.leading-6.font-medium
          (t :page/delete-confirmation)]]]

       [:div.mt-5.sm:mt-4.sm:flex.sm:flex-row-reverse
        [:span.flex.w-full.rounded-md.shadow-sm.sm:ml-3.sm:w-auto
         [:button.inline-flex.justify-center.w-full.rounded-md.border.border-transparent.px-4.py-2.bg-indigo-600.text-base.leading-6.font-medium.text-white.shadow-sm.hover:bg-indigo-500.focus:outline-none.focus:border-indigo-700.focus:shadow-outline-indigo.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
          {:type "button"
           :on-click (fn []
                       (delete-page! page-name))}
          (t :yes)]]
        [:span.mt-3.flex.w-full.rounded-md.shadow-sm.sm:mt-0.sm:w-auto
         [:button.inline-flex.justify-center.w-full.rounded-md.border.border-gray-300.px-4.py-2.bg-white.text-base.leading-6.font-medium.text-gray-700.shadow-sm.hover:text-gray-500.focus:outline-none.focus:border-blue-300.focus:shadow-outline-blue.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
          {:type "button"
           :on-click close-fn}
          (t :cancel)]]]])))

(rum/defcs rename-page-dialog-inner <
  (shortcut/disable-all-shortcuts)
  (rum/local "" ::input)
  [state title page-name close-fn]
  (let [input (get state ::input)]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div.w-full.sm:max-w-lg.sm:w-96
       [:div.sm:flex.sm:items-start
        [:div.mt-3.text-center.sm:mt-0.sm:text-left
         [:h3#modal-headline.text-lg.leading-6.font-medium
          (t :page/rename-to title)]]]

       [:input.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2
        {:auto-focus true
         :on-change (fn [e]
                      (reset! input (util/evalue e)))}]

       [:div.mt-5.sm:mt-4.sm:flex.sm:flex-row-reverse
        [:span.flex.w-full.rounded-md.shadow-sm.sm:ml-3.sm:w-auto
         [:button.inline-flex.justify-center.w-full.rounded-md.border.border-transparent.px-4.py-2.bg-indigo-600.text-base.leading-6.font-medium.text-white.shadow-sm.hover:bg-indigo-500.focus:outline-none.focus:border-indigo-700.focus:shadow-outline-indigo.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
          {:type "button"
           :on-click (fn []
                       (let [value (string/trim @input)]
                         (when-not (string/blank? value)
                           (page-handler/rename! page-name value)
                           (state/close-modal!))))}
          (t :submit)]]
        [:span.mt-3.flex.w-full.rounded-md.shadow-sm.sm:mt-0.sm:w-auto
         [:button.inline-flex.justify-center.w-full.rounded-md.border.border-gray-300.px-4.py-2.bg-white.text-base.leading-6.font-medium.text-gray-700.shadow-sm.hover:text-gray-500.focus:outline-none.focus:border-blue-300.focus:shadow-outline-blue.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
          {:type "button"
           :on-click close-fn}
          (t :cancel)]]]])))

(defn rename-page-dialog
  [title page-name]
  (fn [close-fn]
    (rename-page-dialog-inner title page-name close-fn)))

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
             [:a {:href (rfe/href :page {:name name})}
              original-name]])] false)]])))

;; A page is just a logical block
(rum/defcs page < rum/reactive
  [state {:keys [repo page-name preview?] :as option}]
  (when-let [path-page-name (or page-name
                                (get-page-name state)
                                (state/get-current-page))]
    (let [current-repo (state/sub :git/current-repo)
          repo (or repo current-repo)
          page-name (string/lower-case path-page-name)
          block? (util/uuid-string? page-name)
          block-id (and block? (uuid page-name))
          format (let [page (if block-id
                              (:block/name (:block/page (db/entity [:block/uuid block-id])))
                              page-name)]
                   (db/get-page-format page))
          journal? (db/journal-page? page-name)
          sidebar? (:sidebar? option)]
      (rum/with-context [[t] i18n/*tongue-context*]
        (let [route-page-name path-page-name
              page (if block?
                     (->> (:db/id (:block/page (db/entity repo [:block/uuid block-id])))
                          (db/entity repo))
                     (do
                       (when-not (db/entity repo [:block/name page-name])
                         (db/transact! repo [{:block/name page-name
                                              :block/original-name path-page-name
                                              :block/uuid (db/new-block-id)}]))
                       (db/pull [:block/name page-name])))
              _ (when (and (not block?) (db/page-empty? (state/get-current-repo) (:db/id page)))
                  (page-handler/create! page-name {:page-map page
                                                   :redirect? false}))
              {:keys [title] :as properties} (:block/properties page)
              page-name (:block/name page)
              page-original-name (:block/original-name page)
              title (or title page-original-name page-name)
              today? (and
                      journal?
                      (= page-name (string/lower-case (date/journal-name))))
              developer-mode? (state/sub [:ui/developer-mode?])
              public? (true? (:public properties))]
          [:div.flex-1.page.relative (if (seq (:block/tags page))
                                       (let [page-names (model/get-page-names-by-ids (map :db/id (:block/tags page)))]
                                         {:data-page-tags (text/build-data-value page-names)})
                                       {})
           [:div.relative
            (when (and (not sidebar?)
                       (not block?))
              [:div.flex.flex-row.space-between
               [:div.flex-1.flex-row
                [:a {:on-click (fn [e]
                                 (.preventDefault e)
                                 (when (gobj/get e "shiftKey")
                                   (when-let [page (db/pull repo '[*] [:block/name page-name])]
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
                     path-page-name))]]]
               (when (not config/publishing?)
                 (let [contents? (= (string/lower-case (str page-name)) "contents")
                       links (fn [] (->>
                                    [(when-not contents?
                                       {:title   (t :page/add-to-contents)
                                        :options {:on-click (fn [] (page-handler/handle-add-page-to-contents! page-original-name))}})

                                     {:title "Go to presentation mode"
                                      :options {:on-click (fn []
                                                            (state/sidebar-add-block!
                                                             repo
                                                             (:db/id page)
                                                             :page-presentation
                                                             {:page page}))}}
                                     (when-not contents?
                                       {:title   (t :page/rename)
                                        :options {:on-click #(state/set-modal! (rename-page-dialog title page-name))}})

                                     (when-let [file-path (and (util/electron?) (page-handler/get-page-file-path))]
                                       [{:title   (t :page/open-in-finder)
                                         :options {:on-click #(js/window.apis.showItemInFolder file-path)}}
                                        {:title   (t :page/open-with-default-app)
                                         :options {:on-click #(js/window.apis.openPath file-path)}}])

                                     (when-not contents?
                                       {:title   (t :page/delete)
                                        :options {:on-click #(state/set-modal! (delete-page-dialog page-name))}})

                                     (when (state/get-current-page)
                                       {:title   (t :export)
                                        :options {:on-click #(state/set-modal! export/export-page)}})

                                     (when (util/electron?)
                                       {:title   (t (if public? :page/make-private :page/make-public))
                                        :options {:on-click
                                                  (fn []
                                                    (page-handler/update-public-attribute!
                                                     page-name
                                                     (if public? false true))
                                                    (state/close-modal!))}})

                                     (when developer-mode?
                                       {:title   "(Dev) Show page data"
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
                                    (flatten)
                                    (remove nil?)))]
                   [:div.flex.flex-row
                    [:a.opacity-30.hover:opacity-100.page-op.mr-1
                     {:title "Search in current page"
                      :on-click #(route-handler/go-to-search! :page)}
                     svg/search]
                    (ui/dropdown-with-links
                     (fn [{:keys [toggle-fn]}]
                       [:a.cp__vertial-menu-button
                        {:title    "More options"
                         :on-click toggle-fn}
                        (svg/vertical-dots nil)])
                     links
                     {:modal-class (util/hiccup->class
                                    "origin-top-right.absolute.right-0.top-10.mt-2.rounded-md.shadow-lg.whitespace-no-wrap.dropdown-overflow-auto.page-drop-options")
                      :z-index     1})]))])
            [:div
             (when (and block? (not sidebar?))
               (let [config {:id "block-parent"
                             :block? true}]
                 [:div.mb-4
                  (block/block-parents config repo block-id format)]))

             ;; blocks
             (let [page (if block?
                          (db/entity repo [:block/uuid block-id])
                          page)]
               (page-blocks-cp repo page {:sidebar? sidebar?}))]]

           (when-not block?
             (today-queries repo today? sidebar?))

           (tagged-pages repo page-name)

           ;; referenced blocks
           [:div {:key "page-references"}
            (rum/with-key
              (reference/references route-page-name false)
              (str route-page-name "-refs"))]

           ;; TODO: or we can lazy load them
           (when-not sidebar?
             [:div {:key "page-unlinked-references"}
              (reference/unlinked-references route-page-name)])])))))

(defonce layout (atom [js/window.outerWidth js/window.outerHeight]))

(defonce graph-ref (atom nil))
(defonce show-journal? (atom false))

(rum/defcs global-graph < rum/reactive
  (mixins/event-mixin
   (fn [state]
     (mixins/listen state js/window "resize"
                    (fn [e]
                      (reset! layout [js/window.outerWidth js/window.outerHeight])))))
  [state]
  (let [theme (state/sub :ui/theme)
        sidebar-open? (state/sub :ui/sidebar-open?)
        [width height] (rum/react layout)
        dark? (= theme "dark")
        graph (graph-handler/build-global-graph theme (rum/react show-journal?))]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div.relative#global-graph
       (if (seq (:nodes graph))
         (graph-2d/graph
          (graph/build-graph-opts
           graph
           dark?
           {:width (if (and (> width 1280) sidebar-open?)
                     (- width 24 600)
                     (- width 24))
            :height height
            :ref (fn [v] (reset! graph-ref v))
            :ref-atom graph-ref}))
         [:div.ls-center.mt-20
          [:p.opacity-70.font-medium "Empty"]])
       [:div.absolute.top-10.left-5
        [:div.flex.flex-col
         [:a.text-sm.font-medium
          {:on-click (fn [_e]
                       (swap! show-journal? not))}
          (str (t :page/show-journals)
               (if @show-journal? " (ON)"))]]]])))

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
         (let [pages (page-handler/get-pages-with-modified-at current-repo)]
           [:table.table-auto
            [:thead
             [:tr
              [:th (t :block/name)]
              [:th (t :file/last-modified-at)]]]
            [:tbody
             (for [page pages]
               [:tr {:key page}
                [:td [:a {:on-click (fn [e]
                                      (let [repo (state/get-current-repo)
                                            page (db/pull repo '[*] [:block/name (string/lower-case page)])]
                                        (when (gobj/get e "shiftKey")
                                          (state/sidebar-add-block!
                                           repo
                                           (:db/id page)
                                           :page
                                           {:page page}))))
                          :href (rfe/href :page {:name page})}
                      page]]
                [:td [:span.text-gray-500.text-sm
                      (t :file/no-data)]]])]]))])))
