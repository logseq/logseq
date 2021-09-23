(ns frontend.components.page
  (:require [cljs.pprint :as pprint]
            [clojure.string :as string]
            [frontend.commands :as commands]
            [frontend.components.block :as block]
            [frontend.components.content :as content]
            [frontend.components.editor :as editor]
            [frontend.components.export :as export]
            [frontend.components.hierarchy :as hierarchy]
            [frontend.components.plugins :as plugins]
            [frontend.components.reference :as reference]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.context.i18n :as i18n]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.model :as model]
            [frontend.extensions.graph :as graph]
            [frontend.extensions.pdf.assets :as pdf-assets]
            [frontend.format.mldoc :as mldoc]
            [frontend.handler.common :as common-handler]
            [frontend.handler.config :as config-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.graph :as graph-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.shell :as shell]
            [frontend.mixins :as mixins]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.state :as state]
            [frontend.text :as text]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.object :as gobj]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]))

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
  (let [[_ blocks _ sidebar? preview?](:rum/args state)]
    (when (or sidebar?
              preview?
              (not (contains? #{:home :all-journals} (state/get-current-route))))
      (let [block (first blocks)]
        (when (and (= (count blocks) 1)
                   (string/blank? (:block/content block))
                   (not preview?))
          (editor-handler/edit-block! block :max (:block/format block) (:block/uuid block))))))
  state)

(rum/defc page-blocks-inner <
  {:did-mount open-first-block!
   :did-update open-first-block!}
  [page-name page-blocks hiccup sidebar? preview?]
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

(rum/defc dummy-block
  [page-name]
  [:div.ls-block.flex-1.flex-col.rounded-sm {:style {:width "100%"}}
   [:div.flex.flex-row
    [:div.flex.flex-row.items-center.mr-2.ml-1 {:style {:height 24}}
     [:span.bullet-container.cursor
      [:span.bullet]]]
    [:div.flex.flex-1 {:on-click (fn []
                                   (let [block (editor-handler/insert-first-page-block-if-not-exists! page-name)]
                                     (js/setTimeout #(editor-handler/edit-block! block :max nil (:block/uuid block)) 100)))}
     [:span.opacity-50
      "Click here to edit..."]]]])

(rum/defcs add-button < rum/reactive
  (rum/local false ::show?)
  [state page-name]
  (let [show? (::show? state)]
    [:div.flex-1.flex-col.rounded-sm.add-button
     [:div.flex.flex-row
      [:div.block {:style {:height      24
                           :width       24
                           :margin-left 2}
                   :on-mouse-over (fn [] (reset! show? true))}
       (if (and (not (state/sub [:editor/block])) @show?)
         [:a.add-button-link.block
          {:on-mouse-out (fn [] (reset! show? false))
           :on-click (fn []
                       (when-let [block (editor-handler/api-insert-new-block! "" {:page page-name})]
                         (js/setTimeout #(editor-handler/edit-block! block :max nil (:block/uuid block)) 100)))}
          svg/plus-circle]

         [:span])]]]))

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
          page-empty? (and (not block?) (db/page-empty? repo (:db/id page-e)))
          page-e (if (and page-e (:db/id page-e))
                   {:db/id (:db/id page-e)}
                   page-e)
          page-blocks (get-blocks repo page-name page-original-name block? block-id)]
      (if (empty? page-blocks)
        (dummy-block page-name)
        (let [document-mode? (state/sub :document/mode?)
              hiccup-config (merge
                             {:id (if block? (str block-id) page-name)
                              :block? block?
                              :editor-box editor/box
                              :page page
                              :document/mode? document-mode?}
                             config)
              hiccup-config (common-handler/config-with-document-mode hiccup-config)
              hiccup (block/->hiccup page-blocks hiccup-config {})]
          [:div
           (page-blocks-inner page-name page-blocks hiccup sidebar? preview?)
           (when (and (not block?)
                      (not config/publishing?))
             (add-button page-name))])))))

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
           :class "ui__modal-enter"
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
      [:div
       [:div.sm:flex.sm:items-start
        [:div.mt-3.text-center.sm:mt-0.sm:text-left
         [:h3#modal-headline.text-lg.leading-6.font-medium
          (t :page/rename-to title)]]]

       [:input.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2
        {:auto-focus true
         :default-value title
         :on-change (fn [e]
                      (reset! input (util/evalue e)))}]

       [:div.mt-5.sm:mt-4.sm:flex.sm:flex-row-reverse
        [:span.flex.w-full.rounded-md.shadow-sm.sm:ml-3.sm:w-auto
         [:button.inline-flex.justify-center.w-full.rounded-md.border.border-transparent.px-4.py-2.bg-indigo-600.text-base.leading-6.font-medium.text-white.shadow-sm.hover:bg-indigo-500.focus:outline-none.focus:border-indigo-700.focus:shadow-outline-indigo.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
          {:type "button"
           :class "ui__modal-enter"
           :on-click (fn []
                       (let [value (string/trim @input)]
                         (when-not (string/blank? value)
                           (page-handler/rename! (or title page-name) value)
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
              original-name]])]
         {:default-collapsed? false})]])))

(defn page-menu
  [repo t page page-name page-original-name title journal? public? developer-mode?]
  (let [contents? (= (string/lower-case (str page-name)) "contents")
        links (fn [] (->>
                     [(when-not contents?
                        {:title   (t :page/add-to-favorites)
                         :options {:on-click (fn [] (page-handler/handle-add-page-to-contents! page-original-name))}})

                      {:title "Go to presentation mode"
                       :options {:on-click (fn []
                                             (state/sidebar-add-block!
                                              repo
                                              (:db/id page)
                                              :page-presentation
                                              {:page page}))}}
                      (when (and (not contents?)
                                 (not journal?))
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

                      (when (util/electron?)
                        {:title   (t :page/version-history)
                         :options {:on-click
                                   (fn []
                                     (shell/get-file-latest-git-log page 100))}})

                      (when plugin-handler/lsp-enabled?
                        (for [[_ {:keys [key label] :as cmd} action pid] (state/get-plugins-commands-with-type :page-menu-item)]
                          {:title label
                           :options {:on-click #(commands/exec-plugin-simple-command!
                                                 pid (assoc cmd :page (state/get-current-page)) action)}}))

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
    (ui/dropdown-with-links
     (fn [{:keys [toggle-fn]}]
       [:a.cp__vertical-menu-button
        {:title    "More options"
         :on-click toggle-fn}
        (svg/vertical-dots nil)])
     links
     {:modal-class (util/hiccup->class
                    "origin-top-right.absolute.right-0.top-10.mt-2.rounded-md.shadow-lg.whitespace-nowrap.dropdown-overflow-auto.page-drop-options")
      :z-index     1})))

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
          fmt-journal? (boolean (date/journal-title->int page-name))
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
              {:keys [title] :as properties} (:block/properties page)
              page-name (:block/name page)
              page-original-name (:block/original-name page)
              title (or title page-original-name page-name)
              today? (and
                      journal?
                      (= page-name (string/lower-case (date/journal-name))))
              developer-mode? (state/sub [:ui/developer-mode?])
              public? (true? (:public properties))]
          [:div.flex-1.page.relative
           (merge (if (seq (:block/tags page))
                    (let [page-names (model/get-page-names-by-ids (map :db/id (:block/tags page)))]
                      {:data-page-tags (text/build-data-value page-names)})
                    {})

             {:class (util/classnames [{:is-journals (or journal? fmt-journal?)}])})

           [:div.relative
            (when (and (not sidebar?)
                       (not block?))
              [:div.flex.flex-row.space-between
               [:div.flex-1.flex-row
                [:a.page-title {:on-click (fn [e]
                                            (.preventDefault e)
                                            (when (gobj/get e "shiftKey")
                                              (when-let [page (db/pull repo '[*] [:block/name page-name])]
                                                (state/sidebar-add-block!
                                                 repo
                                                 (:db/id page)
                                                 :page
                                                 {:page page}))))}
                 [:h1.title {:style {:margin-left -2}}
                  (let [title (if page-original-name
                                (if (and (string/includes? page-original-name "[[")
                                         (string/includes? page-original-name "]]"))
                                  (let [ast (mldoc/->edn page-original-name (mldoc/default-config format))]
                                    (block/markup-element-cp {} (ffirst ast)))
                                  page-original-name)
                                (or
                                  page-name
                                  path-page-name))]
                    (if (pdf-assets/hls-file? title)
                      (pdf-assets/human-hls-filename-display title)
                      (if fmt-journal? (date/journal-title->custom-format title) title)))]]]
               (when (not config/publishing?)
                 [:div.flex.flex-row
                  (when plugin-handler/lsp-enabled?
                    (plugins/hook-ui-slot :page-head-actions-slotted nil)
                    (plugins/hook-ui-items :pagebar))

                  (page-menu repo t page page-name page-original-name title
                             journal? public? developer-mode?)])])
            [:div
             (when (and block? (not sidebar?))
               (let [config {:id "block-parent"
                             :block? true}]
                 [:div.mb-4
                  (block/block-parents config repo block-id format true)]))

             ;; blocks
             (let [page (if block?
                          (db/entity repo [:block/uuid block-id])
                          page)]
               (page-blocks-cp repo page {:sidebar? sidebar?}))]]

           (when-not block?
             (today-queries repo today? sidebar?))

           (when-not block?
             (tagged-pages repo page-name))

           ;; referenced blocks
           [:div {:key "page-references"}
            (rum/with-key
              (reference/references route-page-name false)
              (str route-page-name "-refs"))]

           (when-not block?
             [:div
              (when (and
                     (not journal?)
                     (text/namespace-page? route-page-name))
                (hierarchy/structures route-page-name))

              ;; TODO: or we can lazy load them
              (when-not sidebar?
                [:div {:key "page-unlinked-references"}
                 (reference/unlinked-references route-page-name)])])])))))

(defonce layout (atom [js/window.innerWidth js/window.innerHeight]))

(defonce show-journal? (atom false))

;; scrollHeight
(rum/defcs graph-filter-section < (rum/local false ::open?)
  [state title content {:keys [search-filters]}]
  (let [open? (get state ::open?)]
    (when (and (seq search-filters) (not @open?))
      (reset! open? true))
    [:li.relative
     [:div
      [:button.w-full.px-4.py-2.text-left.focus:outline-none {:on-click #(swap! open? not)}
       [:div.flex.items-center.justify-between
        title
        (if @open? (svg/caret-down) (svg/caret-right))]]
      (content open?)]]))

(rum/defc filter-expand-area
  [open? content]
  [:div.relative.overflow-hidden.transition-all.max-h-0.duration-700
   {:style {:max-height (if @open? 400 0)}}
   content])

(defonce *n-hops (atom nil))
(defonce *focus-nodes (atom []))
(defonce *graph-reset? (atom false))
(defonce *journal? (atom nil))
(defonce *orphan-pages? (atom true))
(defonce *builtin-pages? (atom nil))

(rum/defc graph-filters < rum/reactive
  [graph settings n-hops]
  (let [{:keys [layout journal? orphan-pages? builtin-pages?]
         :or {layout "gForce"
              orphan-pages? true}} settings
        journal?' (rum/react *journal?)
        orphan-pages?' (rum/react *orphan-pages?)
        builtin-pages?' (rum/react *builtin-pages?)
        journal? (if (nil? journal?') journal? journal?')
        orphan-pages? (if (nil? orphan-pages?') orphan-pages? orphan-pages?')
        builtin-pages? (if (nil? builtin-pages?') builtin-pages? builtin-pages?')
        set-setting! (fn [key value]
                       (let [new-settings (assoc settings key value)]
                         (config-handler/set-config! :graph/settings new-settings)))
        search-graph-filters (state/sub :search/graph-filters)
        focus-nodes (rum/react *focus-nodes)]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div.absolute.top-4.right-4.graph-filters
       [:div.flex.flex-col
        [:div.shadow-xl.rounded-sm
         [:ul
          (graph-filter-section
           [:span.font-medium "Nodes"]
           (fn [open?]
             (filter-expand-area
              open?
              [:div
               [:p.text-sm.opacity-70.px-4
                (let [c1 (count (:nodes graph))
                      s1 (if (> c1 1) "s" "")
                      ;; c2 (count (:links graph))
                      ;; s2 (if (> c2 1) "s" "")
                      ]
                  ;; (util/format "%d page%s, %d link%s" c1 s1 c2 s2)
                  (util/format "%d page%s" c1 s1)
                  )]
               [:div.p-6
                ;; [:div.flex.items-center.justify-between.mb-2
                ;;  [:span "Layout"]
                ;;  (ui/select
                ;;    (mapv
                ;;     (fn [item]
                ;;       (if (= (:label item) layout)
                ;;         (assoc item :selected "selected")
                ;;         item))
                ;;     [{:label "gForce"}
                ;;      {:label "dagre"}])
                ;;    (fn [value]
                ;;      (set-setting! :layout value))
                ;;    "graph-layout")]
                [:div.flex.items-center.justify-between.mb-2
                 [:span "Journals"]
                 ;; FIXME: why it's not aligned well?
                 [:div.mt-1
                  (ui/toggle journal?
                             (fn []
                               (let [value (not journal?)]
                                 (reset! *journal? value)
                                 (set-setting! :journal? value)))
                             true)]]
                [:div.flex.items-center.justify-between.mb-2
                 [:span "Orphan pages"]
                 [:div.mt-1
                  (ui/toggle orphan-pages?
                             (fn []
                               (let [value (not orphan-pages?)]
                                 (reset! *orphan-pages? value)
                                 (set-setting! :orphan-pages? value)))
                             true)]]
                [:div.flex.items-center.justify-between.mb-2
                 [:span "Built-in pages"]
                 [:div.mt-1
                  (ui/toggle builtin-pages?
                             (fn []
                               (let [value (not builtin-pages?)]
                                 (reset! *builtin-pages? value)
                                 (set-setting! :builtin-pages? value)))
                             true)]]
                (when (seq focus-nodes)
                  [:div.flex.flex-col.mb-2
                   [:p {:title "N hops from selected nodes"}
                    "N hops from selected nodes"]
                   (ui/tippy {:html [:div.pr-3 n-hops]}
                             (ui/slider (or n-hops 10)
                                        {:min 1
                                         :max 10
                                         :on-change #(reset! *n-hops (int %))}))])

                [:a.opacity-70.opacity-100 {:on-click (fn []
                                                        (swap! *graph-reset? not)
                                                        (reset! *focus-nodes [])
                                                        (reset! *n-hops nil)
                                                        (state/clear-search-filters!))}
                 "Reset Graph"]]])))
          (graph-filter-section
           [:span.font-medium "Search"]
           (fn [open?]
             (filter-expand-area
              open?
              [:div.p-6
               (if (seq search-graph-filters)
                 [:div
                  (for [q search-graph-filters]
                    [:div.flex.flex-row.justify-between.items-center.mb-2
                     [:span.font-medium q]
                     [:a.search-filter-close.opacity-70.opacity-100 {:on-click #(state/remove-search-filter! q)}
                      svg/close]])

                  [:a.opacity-70.opacity-100 {:on-click state/clear-search-filters!}
                   "Clear All"]]
                 [:a.opacity-70.opacity-100 {:on-click #(route-handler/go-to-search! :graph)}
                  "Click to search"])]))
           {:search-filters search-graph-filters})]]]])))

(defonce last-node-position (atom nil))
(defn- graph-register-handlers
  [graph focus-nodes n-hops dark?]
  (.on graph "nodeClick"
       (fn [event node]
         (let [x (.-x event)
               y (.-y event)
               drag? (not= [node x y] @last-node-position)]
           (graph/on-click-handler graph node event focus-nodes n-hops drag? dark?))))
  (.on graph "nodeMousedown"
       (fn [event node]
         (reset! last-node-position [node (.-x event) (.-y event)]))))

(rum/defc global-graph-inner < rum/reactive
  [graph settings theme]
  (let [[width height] (rum/react layout)
        dark? (= theme "dark")
        n-hops (rum/react *n-hops)
        reset? (rum/react *graph-reset?)
        focus-nodes (when n-hops (rum/react *focus-nodes))
        graph (if (and (integer? n-hops)
                       (seq focus-nodes)
                       (not (:orphan-pages? settings)))
                (graph-handler/n-hops graph focus-nodes n-hops)
                graph)
        graph (update graph :links (fn [links]
                                     (let [nodes (set (map :id (:nodes graph)))]
                                       (remove (fn [link]
                                                 (and (not (nodes (:source link)))
                                                      (not (nodes (:target link)))))
                                               links))))]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div.relative#global-graph
       (graph/graph-2d {:nodes (:nodes graph)
                        :links (:links graph)
                        :width (- width 24)
                        :height (- height 48)
                        :dark? dark?
                        :register-handlers-fn
                        (fn [graph]
                          (graph-register-handlers graph *focus-nodes *n-hops dark?))
                        :reset? reset?})
       (graph-filters graph settings n-hops)])))

(defn- filter-graph-nodes
  [nodes filters]
  (if (seq filters)
    (let [filter-patterns (map #(re-pattern (str "(?i)" (util/regex-escape %))) filters)]
      (filter (fn [node] (some #(re-find % (:id node)) filter-patterns)) nodes))
    nodes))

(rum/defcs global-graph < rum/reactive
  (mixins/event-mixin
   (fn [state]
     (mixins/listen state js/window "resize"
                    (fn [e]
                      (reset! layout [js/window.innerWidth js/window.innerHeight])))))
  {:will-mount (fn [state]
                 (state/set-search-mode! :graph)
                 state)
   :will-unmount (fn [state]
                   (reset! *n-hops nil)
                   (reset! *focus-nodes [])
                   (state/set-search-mode! :global)
                   state)}
  [state]
  (let [settings (state/sub-graph-config-settings)
        theme (state/sub :ui/theme)
        graph (graph-handler/build-global-graph theme settings)
        search-graph-filters (state/sub :search/graph-filters)
        graph (update graph :nodes #(filter-graph-nodes % search-graph-filters))
        reset? (rum/react *graph-reset?)]
    (global-graph-inner graph settings theme)))

(rum/defc page-graph-inner < rum/static
  [graph dark?]
  [:div.sidebar-item.flex-col
   (graph/graph-2d {:nodes (:nodes graph)
                    :links (:links graph)
                    :width 600
                    :height 600
                    :dark? dark?
                    :register-handlers-fn
                    (fn [graph]
                      (graph-register-handlers graph (atom nil) (atom nil) dark?))})])

(rum/defc page-graph < db-mixins/query rum/reactive
  []
  (let [page (or
              (and (= :page (state/sub [:route-match :data :name]))
                   (state/sub [:route-match :path-params :name]))
              (date/today))
        theme (:ui/theme @state/state)
        dark? (= theme "dark")
        graph (if (util/uuid-string? page)
                (graph-handler/build-block-graph (uuid page) theme)
                (graph-handler/build-page-graph page theme))]
    (when (seq (:nodes graph))
      (page-graph-inner graph dark?))))

(defn- sort-pages-by
  [by-item desc? pages]
  (let [comp (if desc? > <)
        by-item (if (= by-item :block/name)
                  (fn [x] (string/lower-case (:block/name x)))
                  by-item)]
    (sort-by by-item comp pages)))

(rum/defc sortable-title
  [title key by-item desc?]
  [:th
   [:a {:on-click (fn []
                    (reset! by-item key)
                    (swap! desc? not))}
    [:div.flex.items-center
     [:span.mr-1 title]
     (when (= @by-item key)
       [:span
        (if @desc? (svg/caret-down) (svg/caret-up))])]]])

(rum/defcs all-pages < rum/reactive
  (rum/local :block/updated-at ::sort-by-item)
  (rum/local true ::desc?)
  ;; {:did-mount (fn [state]
  ;;               (let [current-repo (state/sub :git/current-repo)]
  ;;                 (js/setTimeout #(db/remove-orphaned-pages! current-repo) 0))
  ;;               state)}
  [state]
  (let [current-repo (state/sub :git/current-repo)
        *sort-by-item (get state ::sort-by-item)
        *desc? (get state ::desc?)]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div.flex-1
       [:h1.title (t :all-pages)]
       (when current-repo
         (let [pages (->> (page-handler/get-all-pages current-repo)
                         (map (fn [page] (assoc page :block/backlinks (count (:block/_refs (db/entity (:db/id page)))))))
                         (sort-pages-by @*sort-by-item @*desc?))]
           [:table.table-auto
            [:thead
             [:tr
              (sortable-title (t :block/name) :block/name *sort-by-item *desc?)
              (sortable-title (t :page/backlinks) :block/backlinks  *sort-by-item *desc?)
              (sortable-title (t :page/created-at) :block/created-at *sort-by-item *desc?)
              (sortable-title (t :page/updated-at) :block/updated-at *sort-by-item *desc?)]]
            [:tbody
             (for [{:block/keys [name created-at updated-at backlinks] :as page} pages]
               [:tr {:key name}
                [:td [:a {:on-click (fn [e]
                                      (let [repo (state/get-current-repo)]
                                        (when (gobj/get e "shiftKey")
                                          (state/sidebar-add-block!
                                           repo
                                           (:db/id page)
                                           :page
                                           {:page (:block/name page)}))))
                          :href (rfe/href :page {:name (:block/name page)})}
                      (block/page-cp {} page)]]
                [:td [:span.text-gray-500.text-sm backlinks]]
                [:td [:span.text-gray-500.text-sm (if created-at
                                                    (date/int->local-time-2 created-at)
                                                    "Unknown")]]
                [:td [:span.text-gray-500.text-sm (if updated-at
                                                    (date/int->local-time-2 updated-at)
                                                    "Unknown")]]])]]))])))
