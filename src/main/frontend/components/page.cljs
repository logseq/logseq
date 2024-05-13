(ns frontend.components.page
  (:require ["/frontend/utils" :as utils]
            [clojure.string :as string]
            [frontend.components.block :as component-block]
            [frontend.components.content :as content]
            [frontend.components.editor :as editor]
            [frontend.components.plugins :as plugins]
            [frontend.components.query :as query]
            [frontend.components.reference :as reference]
            [frontend.components.scheduled-deadlines :as scheduled]
            [frontend.components.icon :as icon-component]
            [frontend.components.db-based.page :as db-page]
            [frontend.components.class :as class-component]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.model :as model]
            [frontend.extensions.graph :as graph]
            [frontend.extensions.pdf.utils :as pdf-utils]
            [frontend.format.mldoc :as mldoc]
            [frontend.handler.common :as common-handler]
            [frontend.handler.config :as config-handler]
            [frontend.handler.dnd :as dnd]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.graph :as graph-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.route :as route-handler]
            [frontend.mixins :as mixins]
            [frontend.mobile.util :as mobile-util]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [logseq.shui.ui :as shui]
            [frontend.util :as util]
            [frontend.util.text :as text-util]
            [goog.object :as gobj]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.common.util :as common-util]
            [logseq.common.util.page-ref :as page-ref]
            [medley.core :as medley]
            [promesa.core :as p]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]
            [frontend.extensions.graph.pixi :as pixi]
            [logseq.db :as ldb]
            [frontend.handler.property.util :as pu]
            [frontend.components.hierarchy :as hierarchy]))

(defn- get-page-name
  [state]
  (let [route-match (first (:rum/args state))]
    (get-in route-match [:parameters :path :name])))

;; Named block links only works on web (and publishing)
(if util/web-platform?
  (defn- get-block-uuid-by-block-route-name
    "Return string block uuid for matching :name and :block-route-name params or
    nil if not found"
    [state]
    ;; Only query if block name is in the route
    (when-let [route-name (get-in (first (:rum/args state))
                            [:parameters :path :block-route-name])]
      (->> (model/get-block-by-page-name-and-block-route-name
             (state/get-current-repo)
             (get-page-name state)
             route-name)
        :block/uuid
        str)))
  (def get-block-uuid-by-block-route-name (constantly nil)))

(defn- get-block
  [page-name-or-uuid]
  (when page-name-or-uuid
    (when-let [block (model/get-page page-name-or-uuid)]
      (model/sub-block (:db/id block)))))

(defn- open-root-block!
  [state]
  (let [[_ block _ sidebar? preview?] (:rum/args state)]
    (when (and
           (or preview?
               (not (contains? #{:home :all-journals} (state/get-current-route))))
           (not sidebar?))
      (when (and (string/blank? (:block/content block))
                 (not preview?))
        (editor-handler/edit-block! block :max))))
  state)

(rum/defc page-blocks-inner <
  {:did-mount open-root-block!}
  [page-e blocks config sidebar? whiteboard? _block-uuid]
  (when page-e
    (let [hiccup (component-block/->hiccup blocks config {})]
      [:div.page-blocks-inner {:style {:margin-left (if (or sidebar? whiteboard?) 0 -20)}}
       (rum/with-key
         (content/content (str (:block/uuid page-e))
                          {:hiccup   hiccup
                           :sidebar? sidebar?})
         (str (:block/uuid page-e) "-hiccup"))])))

(declare page)

(if config/publishing?
  (rum/defc dummy-block
    [_page-name]
    [:div])

  (rum/defc dummy-block
    [page-name]
    (let [[hover set-hover!] (rum/use-state false)
          click-handler-fn (fn []
                             (let [block (editor-handler/insert-first-page-block-if-not-exists! page-name {:redirect? false})]
                               (js/setTimeout #(editor-handler/edit-block! block :max) 0)))
          drop-handler-fn (fn [^js event]
                            (util/stop event)
                            (p/let [block-uuids (state/get-selection-block-ids)
                                    lookup-refs (map (fn [id] [:block/uuid id]) block-uuids)
                                    selected (db/pull-many (state/get-current-repo) '[*] lookup-refs)
                                    blocks (if (seq selected) selected [@component-block/*dragging-block])
                                    _ (editor-handler/insert-first-page-block-if-not-exists! page-name {:redirect? false})]
                              (js/setTimeout #(let [target-block (db/entity (:db/id (db/get-page page-name)))]
                                                (dnd/move-blocks event blocks target-block nil :sibling))
                                0)))]
      [:div.ls-block.flex-1.flex-col.rounded-sm
       {:style {:width "100%"
                ;; The same as .dnd-separator
                :border-top (if hover
                              "3px solid #ccc"
                              nil)}}
       [:div.flex.flex-row
        [:div.flex.flex-row.items-center.mr-2.ml-1 {:style {:height 24}}
         [:span.bullet-container.cursor
          [:span.bullet]]]
        (shui/trigger-as :div.flex.flex-1
          {:tabIndex 0
           :on-click click-handler-fn
           :on-drag-enter #(set-hover! true)
           :on-drag-over #(util/stop %)
           :on-drop drop-handler-fn
           :on-drag-leave #(set-hover! false)}
          [:span.opacity-70
           "Click here to edit..."])]])))

(rum/defc add-button
  [args]
  [:div.flex-1.flex-col.rounded-sm.add-button-link-wrap
   {:on-click (fn [] (editor-handler/api-insert-new-block! "" args))
    :on-key-down (fn [e]
                    (when (= "Enter" (util/ekey e))
                      (editor-handler/api-insert-new-block! "" args))
                    (util/stop e))
    :tab-index 0}
   [:div.flex.flex-row
    [:div.block {:style {:height      20
                         :width       20
                         :margin-left 2}}
     [:a.add-button-link.block
      (ui/icon "circle-plus")]]]])

(rum/defcs page-blocks-cp < rum/reactive db-mixins/query
  {:will-mount (fn [state]
                 (let [page-e (second (:rum/args state))
                       page-name (:block/name page-e)]
                   (when (and page-name
                              (db/journal-page? page-name)
                              (>= (date/journal-title->int page-name)
                                  (date/journal-title->int (date/today))))
                     (state/pub-event! [:journal/insert-template page-name])))
                 state)}
  [state _repo page-e {:keys [sidebar? whiteboard?] :as config}]
  (when page-e
    (let [page-name (or (:block/name page-e)
                        (str (:block/uuid page-e)))
          block-id (parse-uuid page-name)
          block? (boolean block-id)
          block (get-block (or (:block/uuid page-e) (:block/name page-e)))
          children (:block/_parent block)]
      (cond
        (and
         (not block?)
         (empty? children))
        (dummy-block page-name)

        :else
        (let [document-mode? (state/sub :document/mode?)
              short-page? (when-not block?
                            (<= (count (:block/_page block)) 200))
              hiccup-config (merge
                              {:id (if block? (str block-id) page-name)
                               :db/id (:db/id block)
                               :block? block?
                               :editor-box editor/box
                               :document/mode? document-mode?
                               :disable-lazy-load? short-page?}
                              config)
              config (common-handler/config-with-document-mode hiccup-config)
              blocks (if block? [block] (db/sort-by-order children block))]
          [:div
           (page-blocks-inner page-e blocks config sidebar? whiteboard? block-id)
           (when-not config/publishing?
             (let [args (if block-id
                          {:block-uuid block-id}
                          {:page page-name})]
               (add-button args)))])))))

(rum/defc today-queries < rum/reactive
  [repo today? sidebar?]
  (when (and today? (not sidebar?))
    (let [queries (get-in (state/sub-config repo) [:default-queries :journals])]
      (when (seq queries)
        [:div#today-queries.mt-10
         (for [query queries]
           (rum/with-key
             (ui/catch-error
               (ui/component-error "Failed default query:" {:content (pr-str query)})
               (query/custom-query (component-block/wrap-query-components
                                     {:attr {:class "mt-10"}
                                      :editor-box editor/box
                                      :page page})
                 query))
             (str repo "-custom-query-" (:query query))))]))))

(rum/defc tagged-pages
  [repo tag tag-original-name]
  (let [[pages set-pages!] (rum/use-state nil)]
    (rum/use-effect!
     (fn []
       (p/let [result (db-async/<get-tag-pages repo (:db/id tag))]
         (set-pages! result)))
     [tag])
    (when (seq pages)
      [:div.references.page-tags.mt-6.flex-1.flex-row
       [:div.content
        (ui/foldable
         [:h2.font-bold.opacity-50 (util/format "Pages tagged with \"%s\"" tag-original-name)]
         [:ul.mt-2
          (for [page (sort-by :block/original-name pages)]
            [:li {:key (str "tagged-page-" (:db/id page))}
             (component-block/page-cp {} page)])]
         {:default-collapsed? false})]])))

(rum/defc page-title-editor < rum/reactive
  [page {:keys [*input-value *title-value *edit? untitled? page-name old-name whiteboard-page?]}]
  (let [input-ref (rum/create-ref)
        collide? #(and (not= (util/page-name-sanity-lc page-name)
                             (util/page-name-sanity-lc @*title-value))
                       (db/page-exists? page-name)
                       (db/page-exists? @*title-value))
        rollback-fn #(let [old-name (if untitled? "" old-name)]
                       (reset! *title-value old-name)
                       (gobj/set (rum/deref input-ref) "value" old-name)
                       (reset! *edit? true)
                       (.focus (rum/deref input-ref)))
        blur-fn (fn [e]
                  (when (common-util/wrapped-by-quotes? @*title-value)
                    (swap! *title-value common-util/unquote-string)
                    (gobj/set (rum/deref input-ref) "value" @*title-value))
                  (cond
                    (or (= old-name @*title-value) (and whiteboard-page? (string/blank? @*title-value)))
                    (reset! *edit? false)

                    (string/blank? @*title-value)
                    (do (when-not untitled? (notification/show! (t :page/illegal-page-name) :warning))
                        (rollback-fn))

                    (collide?)
                    (do (notification/show! (t :page/page-already-exists @*title-value) :error)
                        (rollback-fn))

                    (and (date/valid-journal-title? @*title-value) whiteboard-page?)
                    (do (notification/show! (t :page/whiteboard-to-journal-error) :error)
                        (rollback-fn))

                    :else
                    (p/do!
                     (page-handler/rename! (:block/uuid page) @*title-value)
                     (js/setTimeout #(reset! *edit? false) 100)))
                  (util/stop e))]
    [:input.edit-input.p-0.focus:outline-none.ring-none
     {:type          "text"
      :ref           input-ref
      :auto-focus    true
      :style         {:outline "none"
                      :width "100%"
                      :font-weight "inherit"}
      :auto-complete (if (util/chrome?) "chrome-off" "off") ; off not working here
      :value         (rum/react *input-value)
      :on-change     (fn [^js e]
                       (let [value (util/evalue e)]
                         (reset! *title-value (string/trim value))
                         (reset! *input-value value)))
      :on-blur       blur-fn
      :on-key-down   (fn [^js e]
                       (when (= (gobj/get e "key") "Enter")
                         (blur-fn e)))
      :placeholder   (when untitled? (t :untitled))
      :on-key-up     (fn [^js e]
                       ;; Esc
                       (when (= 27 (.-keyCode e))
                         (reset! *title-value old-name)
                         (reset! *edit? false)))
      :on-focus (fn []
                  (when untitled? (reset! *title-value "")))}]))

(rum/defc page-title-configure
  [*show-page-info?]
  [:div.absolute.-top-4.left-2.fade-in.faster-fade-in
   (shui/button
    {:variant :outline
     :size :xs
     :on-click #(swap! *show-page-info? not)}
    "Configure")])

(rum/defcs ^:large-vars/cleanup-todo page-title < rum/reactive
  (rum/local false ::edit?)
  (rum/local "" ::input-value)
  {:init (fn [state]
           (let [page (first (:rum/args state))
                 original-name (:block/original-name page)
                 *title-value (atom original-name)]
             (assoc state ::title-value *title-value)))}
  [state page {:keys [fmt-journal? preview? *hover? *show-page-info?]}]
  (when page
    (let [page (db/sub-block (:db/id page))
          title (:block/original-name page)]
      (when title
        (let [journal? (ldb/journal-page? page)
              icon (get page (pu/get-pid :logseq.property/icon))
              *title-value (get state ::title-value)
              *edit? (get state ::edit?)
              *input-value (get state ::input-value)
              repo (state/get-current-repo)
              hls-page? (pdf-utils/hls-file? title)
              whiteboard-page? (model/whiteboard-page? page)
              untitled? (and whiteboard-page? (parse-uuid title)) ;; normal page cannot be untitled right?
              title (if hls-page?
                      [:a.asset-ref (pdf-utils/fix-local-asset-pagename title)]
                      (if fmt-journal?
                        (date/journal-title->custom-format title)
                        title))
              old-name title
              db-based? (config/db-based-graph? repo)]
          [:div.ls-page-title.flex.flex-1.flex-row.flex-wrap.w-full.relative.items-center.gap-2
           {:on-mouse-over #(when-not @*edit? (reset! *hover? true))
            :on-mouse-out #(reset! *hover? false)}
           (when icon
             [:div.page-icon
              {:on-pointer-down util/stop-propagation}
              (if (and (map? icon) db-based?)
                (icon-component/icon-picker icon
                                            {:on-chosen (fn [_e icon]
                                                          (db-property-handler/set-block-property!
                                                           (:db/id page)
                                                           (pu/get-pid :logseq.property/icon)
                                                           icon))
                                             :icon-props {:size 38}})
                icon)])
           [:h1.page-title.flex-1.cursor-pointer.gap-1
            {:class (when-not whiteboard-page? "title")
             :on-pointer-down (fn [e]
                                (when (util/right-click? e)
                                  (state/set-state! :page-title/context {:page (:block/original-name page)
                                                                         :page-entity page})))
             :on-click (fn [e]
                         (when-not (= (.-nodeName (.-target e)) "INPUT")
                           (.preventDefault e)
                           (if (gobj/get e "shiftKey")
                             (state/sidebar-add-block!
                              repo
                              (:db/id page)
                              :page)
                             (when (and (not hls-page?)
                                        (not journal?)
                                        (not config/publishing?)
                                        (not (ldb/built-in? page)))
                               (reset! *input-value (if untitled? "" old-name))
                               (reset! *hover? false)
                               (reset! *edit? true)))))}

            (if @*edit?
              (page-title-editor page {:*title-value *title-value
                                       :*edit? *edit?
                                       :*input-value *input-value
                                       :page-name (:block/original-name page)
                                       :old-name old-name
                                       :untitled? untitled?
                                       :whiteboard-page? whiteboard-page?
                                       :preview? preview?})
              [:span.title.block
               {:on-click (fn []
                            (when (and (state/home?) (not preview?))
                              (route-handler/redirect-to-page! (:block/uuid page))))
                :data-value @*input-value
                :data-ref   (:block/original-name page)
                :style      {:opacity (when @*edit? 0)}}
               (let [nested? (and (string/includes? title page-ref/left-brackets)
                                  (string/includes? title page-ref/right-brackets))]
                 (cond untitled? [:span.opacity-50 (t :untitled)]
                       nested? (component-block/map-inline {} (gp-mldoc/inline->edn title (mldoc/get-default-config
                                                                                           (:block/format page))))
                       :else title))])]

           (when (and db-based? @*hover?)
             (page-title-configure *show-page-info?))])))))

(defn- page-mouse-over
  [e *control-show? *all-collapsed?]
  (util/stop e)
  (reset! *control-show? true)
  (let [all-collapsed?
        (->> (editor-handler/all-blocks-with-level {:collapse? true})
          (filter (fn [b] (editor-handler/collapsable? (:block/uuid b))))
          (empty?))]
    (reset! *all-collapsed? all-collapsed?)))

(defn- page-mouse-leave
  [e *control-show?]
  (util/stop e)
  (reset! *control-show? false))

(rum/defcs page-blocks-collapse-control <
  [state title *control-show? *all-collapsed?]
  [:a.page-blocks-collapse-control
   {:id (str "control-" title)
    :on-click (fn [event]
                (util/stop event)
                (if @*all-collapsed?
                  (editor-handler/expand-all!)
                  (editor-handler/collapse-all!))
                (swap! *all-collapsed? not))}
   [:span.mt-6 {:class (if @*control-show?
                         "control-show cursor-pointer" "control-hide")}
    (ui/rotating-arrow @*all-collapsed?)]])

(defn- get-path-page-name
  [state page-name]
  (or page-name
    (get-block-uuid-by-block-route-name state)
    ;; is page name or uuid
    (get-page-name state)
    (state/get-current-page)))

(defn get-page-entity
  [page-name]
  (cond
    (uuid? page-name)
    (db/entity [:block/uuid page-name])

    (common-util/uuid-string? page-name)
    (db/entity [:block/uuid (uuid page-name)])

    :else
    (db/get-page page-name)))

(defn- get-sanity-page-name
  [state page-name]
  (when-let [path-page-name (get-path-page-name state page-name)]
    (util/page-name-sanity-lc path-page-name)))

;; A page is just a logical block
(rum/defcs ^:large-vars/cleanup-todo page-inner < rum/reactive db-mixins/query
  (rum/local false ::all-collapsed?)
  (rum/local false ::control-show?)
  (rum/local nil   ::current-page)
  (rum/local false ::hover-title?)
  (rum/local false ::show-page-info?)
  [state {:keys [repo page-name preview? sidebar? linked-refs? unlinked-refs? config] :as option}]
  (when-let [path-page-name (get-path-page-name state page-name)]
    (let [current-repo (state/sub :git/current-repo)
          repo (or repo current-repo)
          page-name (util/page-name-sanity-lc path-page-name)
          page (get-page-entity page-name)
          block-id (:block/uuid page)
          block? (some? (:block/page page))
          journal? (db/journal-page? page-name)
          db-based? (config/db-based-graph? repo)
          fmt-journal? (boolean (date/journal-title->int page-name))
          whiteboard? (:whiteboard? option) ;; in a whiteboard portal shape?
          whiteboard-page? (model/whiteboard-page? page) ;; is this page a whiteboard?
          route-page-name path-page-name
          page-name (:block/name page)
          page-original-name (:block/original-name page)
          title (or page-original-name page-name)
          today? (and
                  journal?
                  (= page-name (util/page-name-sanity-lc (date/journal-name))))
          *control-show? (::control-show? state)
          *all-collapsed? (::all-collapsed? state)
          block-or-whiteboard? (or block? whiteboard?)
          home? (= :home (state/get-current-route))]
      (when (or page-name block-or-whiteboard?)
        [:div.flex-1.page.relative
         (merge (if (seq (:block/tags page))
                  (let [page-names (map :block/original-name (:block/tags page))]
                    (when (seq page-names)
                      {:data-page-tags (text-util/build-data-value page-names)}))
                  {})

                {:key path-page-name
                 :class (util/classnames [{:is-journals (or journal? fmt-journal?)}])})

         (if (and whiteboard-page? (not sidebar?))
           [:div ((state/get-component :whiteboard/tldraw-preview) (:block/uuid page))] ;; FIXME: this is not reactive
           [:div.relative.grid.gap-4
            (when (and (not sidebar?) (not block?))
              [:div.flex.flex-row.space-between
               (when (or (mobile-util/native-platform?) (util/mobile?))
                 [:div.flex.flex-row.pr-2
                  {:style {:margin-left -15}
                   :on-mouse-over (fn [e]
                                    (page-mouse-over e *control-show? *all-collapsed?))
                   :on-mouse-leave (fn [e]
                                     (page-mouse-leave e *control-show?))}
                  (page-blocks-collapse-control title *control-show? *all-collapsed?)])
               (when (and (not whiteboard?) (ldb/page? page))
                 (page-title page {:journal? journal?
                                   :fmt-journal? fmt-journal?
                                   :preview? preview?
                                   :*hover? (::hover-title? state)
                                   :*show-page-info? (::show-page-info? state)}))
               (when (not config/publishing?)
                 (when config/lsp-enabled?
                   [:div.flex.flex-row
                    (plugins/hook-ui-slot :page-head-actions-slotted nil)
                    (plugins/hook-ui-items :pagebar)]))])

            (when (and db-based? (not block?) (:block/tags page))
              [:div.cursor-pointer
               {:class (if sidebar? "ml-6" "ml-1")}
               (db-page/tags page)])

            (cond
              (and db-based? (not block?))
              (db-page/page-info page (::show-page-info? state))

              (and (not db-based?) (not block?))
              [:div.pb-2])

            [:div
             (when (and block? (not sidebar?) (not whiteboard?))
               (let [config (merge config {:id "block-parent"
                                           :block? true})]
                 [:div.mb-4
                  (component-block/breadcrumb config repo block-id {:level-limit 3})]))

             (when (and db-based? (not block?) (not preview?) (not (::show-page-info? state)))
               (db-page/page-properties-react page {:configure? false}))

                   ;; blocks
             (page-blocks-cp repo page {:sidebar? sidebar? :whiteboard? whiteboard?})]])

         (when today?
           (today-queries repo today? sidebar?))

         (when today?
           (scheduled/scheduled-and-deadlines page-name))

         (when-not block?
           (tagged-pages repo page page-original-name))

               ;; referenced blocks
         (when-not block-or-whiteboard?
           (when (and page (not (false? linked-refs?)))
             [:div {:key "page-references"}
              (rum/with-key
                (reference/references page)
                (str route-page-name "-refs"))]))

         (when (contains? (:block/type page) "class")
           (class-component/class-children page))

         (when-not block-or-whiteboard?
           (when (and (not journal?) (not db-based?))
             (hierarchy/structures route-page-name)))

         (when (and (not (false? unlinked-refs?))
                    (not (or block-or-whiteboard? sidebar? home?)))
           [:div {:key "page-unlinked-references"}
            (reference/unlinked-references page)])]))))

(rum/defcs page < rum/reactive db-mixins/query
  {:init (fn [state]
           (let [page-name (:page-name (first (:rum/args state)))
                 page-name' (get-sanity-page-name state page-name)
                 *loading? (atom true)]
             (p/do!
              (db-async/<get-block (state/get-current-repo) page-name')
              (reset! *loading? false)
              (route-handler/update-page-title-and-label! (state/get-route-match)))
             (assoc state
                    ::page-name page-name'
                    ::loading? *loading?)))}
  [state option]
  (let [loading? (or (rum/react (::loading? state))
                     (when (::page-name state) (state/sub-async-query-loading (::page-name state))))]
    (if loading?
      [:div.space-y-2
                    (shui/skeleton {:class "h-6 w-full"})
                    (shui/skeleton {:class "h-6 w-full"})]
      (rum/with-key
        (page-inner option)
        (or (:page-name option)
            (get-page-name state))))))

(rum/defc contents-page < rum/reactive
  {:init (fn [state]
           (db-async/<get-block (state/get-current-repo) "contents")
           state)}
  [page]
  (when-let [repo (state/get-current-repo)]
    (when-not (state/sub-async-query-loading "contents")
      (page-blocks-cp repo page {:sidebar? true}))))

(defonce layout (atom [js/window.innerWidth js/window.innerHeight]))

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
(defonce *graph-forcereset? (atom false))
(defonce *journal? (atom nil))
(defonce *orphan-pages? (atom true))
(defonce *builtin-pages? (atom nil))
(defonce *excluded-pages? (atom true))
(defonce *show-journals-in-page-graph? (atom nil))
(defonce *created-at-filter (atom nil))
(defonce *link-dist (atom 70))
(defonce *charge-strength (atom -600))
(defonce *charge-range (atom 600))

(rum/defcs simulation-switch < rum/reactive
  [state]
  (let [*simulation-paused? pixi/*simulation-paused?]
    [:div.flex.flex-col.mb-2
     [:p {:title "Pause simulation"}
      "Pause simulation"]
     (ui/toggle
       (rum/react *simulation-paused?)
       (fn []
         (let [paused? @*simulation-paused?]
           (if paused?
             (pixi/resume-simulation!)
             (pixi/stop-simulation!))))
       true)]))

(rum/defc ^:large-vars/cleanup-todo graph-filters < rum/reactive
  [graph settings forcesettings n-hops]
  (let [{:keys [journal? orphan-pages? builtin-pages? excluded-pages?]
         :or {orphan-pages? true}} settings
        {:keys [link-dist charge-strength charge-range]} forcesettings
        journal?' (rum/react *journal?)
        orphan-pages?' (rum/react *orphan-pages?)
        builtin-pages?' (rum/react *builtin-pages?)
        excluded-pages?' (rum/react *excluded-pages?)
        link-dist'  (rum/react *link-dist)
        charge-strength'  (rum/react *charge-strength)
        charge-range'  (rum/react *charge-range)
        journal? (if (nil? journal?') journal? journal?')
        orphan-pages? (if (nil? orphan-pages?') orphan-pages? orphan-pages?')
        builtin-pages? (if (nil? builtin-pages?') builtin-pages? builtin-pages?')
        excluded-pages? (if (nil? excluded-pages?') excluded-pages? excluded-pages?')
        created-at-filter (or (rum/react *created-at-filter) (:created-at-filter settings))
        link-dist (if (nil? link-dist') link-dist link-dist')
        charge-strength (if (nil? charge-strength') charge-strength charge-strength')
        charge-range (if (nil? charge-range') charge-range charge-range')
        set-setting! (fn [key value]
                       (let [new-settings (assoc settings key value)]
                         (config-handler/set-config! :graph/settings new-settings)))
        set-forcesetting! (fn [key value]
                            (let [new-forcesettings (assoc forcesettings key value)]
                              (config-handler/set-config! :graph/forcesettings new-forcesettings)))
        search-graph-filters (state/sub :search/graph-filters)
        focus-nodes (rum/react *focus-nodes)]
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
                  (util/format "%d page%s" c1 s1))]
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
                ;;    (fn [_e value]
                ;;      (set-setting! :layout value))
                ;;    {:class "graph-layout"})]
                [:div.flex.items-center.justify-between.mb-2
                 [:span (t :settings-page/enable-journals)]
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
                [:div.flex.items-center.justify-between.mb-2
                 [:span "Excluded pages"]
                 [:div.mt-1
                  (ui/toggle excluded-pages?
                    (fn []
                      (let [value (not excluded-pages?)]
                        (reset! *excluded-pages? value)
                        (set-setting! :excluded-pages? value)))
                    true)]]
                (when (config/db-based-graph? (state/get-current-repo))
                  [:div.flex.flex-col.mb-2
                   [:p "Created before"]
                   (when created-at-filter
                     [:div (.toDateString (js/Date. (+ created-at-filter (get-in graph [:all-pages :created-at-min]))))])
                   (ui/tippy {:html [:div.pr-3 (str (js/Date. (+ created-at-filter (get-in graph [:all-pages :created-at-min]))))]}
                     ;; Slider keeps track off the range from min created-at to max created-at
                     ;; because there were bugs with setting min and max directly
                     (ui/slider created-at-filter
                       {:min 0
                        :max (- (get-in graph [:all-pages :created-at-max])
                               (get-in graph [:all-pages :created-at-min]))
                        :on-change #(do
                                      (reset! *created-at-filter (int %))
                                      (set-setting! :created-at-filter (int %)))}))])
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
                                                        (reset! *created-at-filter nil)
                                                        (set-setting! :created-at-filter nil)
                                                        (state/clear-search-filters!))}
                 "Reset Graph"]]]))
          {})
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
          {:search-filters search-graph-filters})
        (graph-filter-section
          [:span.font-medium "Forces"]
          (fn [open?]
            (filter-expand-area
              open?
              [:div
               [:p.text-sm.opacity-70.px-4
                (let [c2 (count (:links graph))
                      s2 (if (> c2 1) "s" "")]
                  (util/format "%d link%s" c2 s2))]
               [:div.p-6
                (simulation-switch)

                [:div.flex.flex-col.mb-2
                 [:p {:title "Link Distance"}
                  "Link Distance"]
                 (ui/tippy {:html [:div.pr-3 link-dist]}
                   (ui/slider (/ link-dist 10)
                     {:min 1   ;; 10
                      :max 18  ;; 180
                      :on-change #(let [value (int %)]
                                    (reset! *link-dist (* value 10))
                                    (set-forcesetting! :link-dist (* value 10)))}))]
                [:div.flex.flex-col.mb-2
                 [:p {:title "Charge Strength"}
                  "Charge Strength"]
                 (ui/tippy {:html [:div.pr-3 charge-strength]}
                   (ui/slider (/ charge-strength 100)
                     {:min -10  ;;-1000
                      :max 10   ;;1000
                      :on-change #(let [value (int %)]
                                    (reset! *charge-strength (* value 100))
                                    (set-forcesetting! :charge-strength (* value 100)))}))]
                [:div.flex.flex-col.mb-2
                 [:p {:title "Charge Range"}
                  "Charge Range"]
                 (ui/tippy {:html [:div.pr-3 charge-range]}
                   (ui/slider (/ charge-range 100)
                     {:min 5    ;;500
                      :max 40   ;;4000
                      :on-change #(let [value (int %)]
                                    (reset! *charge-range (* value 100))
                                    (set-forcesetting! :charge-range (* value 100)))}))]

                [:a.opacity-70.opacity-100 {:on-click (fn []
                                                        (swap! *graph-forcereset? not)
                                                        (reset! *link-dist 70)
                                                        (reset! *charge-strength -600)
                                                        (reset! *charge-range 600))}
                 "Reset Forces"]]]))
          {})
        (graph-filter-section
          [:span.font-medium "Export"]
          (fn [open?]
            (filter-expand-area
              open?
              (when-let [canvas (js/document.querySelector "#global-graph canvas")]
                [:div.p-6
                 ;; We'll get an empty image if we don't wrap this in a requestAnimationFrame
                 [:div [:a {:on-click #(.requestAnimationFrame js/window (fn [] (utils/canvasToImage canvas "graph" "png")))} "as PNG"]]])))
          {:search-filters search-graph-filters})]]]]))

(defonce last-node-position (atom nil))
(defn- graph-register-handlers
  [graph focus-nodes n-hops dark?]
  (.on graph "nodeClick"
    (fn [event node]
      (let [x (.-x event)
            y (.-y event)
            drag? (not (let [[last-node last-x last-y] @last-node-position
                             threshold 5]
                         (and (= node last-node)
                           (<= (abs (- x last-x)) threshold)
                           (<= (abs (- y last-y)) threshold))))]
        (graph/on-click-handler graph node event focus-nodes n-hops drag? dark?))))
  (.on graph "nodeMousedown"
    (fn [event node]
      (reset! last-node-position [node (.-x event) (.-y event)]))))

(rum/defc global-graph-inner < rum/reactive
  [graph settings forcesettings theme]
  (let [[width height] (rum/react layout)
        dark? (= theme "dark")
        n-hops (rum/react *n-hops)
        link-dist (rum/react *link-dist)
        charge-strength (rum/react *charge-strength)
        charge-range (rum/react *charge-range)
        reset? (rum/react *graph-reset?)
        forcereset? (rum/react *graph-forcereset?)
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
    [:div.relative#global-graph
     (graph/graph-2d {:nodes (:nodes graph)
                      :links (:links graph)
                      :width (- width 24)
                      :height (- height 48)
                      :dark? dark?
                      :link-dist link-dist
                      :charge-strength charge-strength
                      :charge-range charge-range
                      :register-handlers-fn
                      (fn [graph]
                        (graph-register-handlers graph *focus-nodes *n-hops dark?))
                      :reset? reset?
                      :forcereset? forcereset?})
     (graph-filters graph settings forcesettings n-hops)]))

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
                                (fn [_e]
                                  (reset! layout [js/window.innerWidth js/window.innerHeight])))))
                          {:will-unmount (fn [state]
                                           (reset! *n-hops nil)
                                           (reset! *focus-nodes [])
                                           (state/set-search-mode! :global)
                                           state)}
  [state]
  (let [settings (state/graph-settings)
        forcesettings (state/graph-forcesettings)
        theme (state/sub :ui/theme)
        ;; Needed for query to retrigger after reset
        _reset? (rum/react *graph-reset?)
        graph (graph-handler/build-global-graph theme settings)
        search-graph-filters (state/sub :search/graph-filters)
        graph (update graph :nodes #(filter-graph-nodes % search-graph-filters))]
    (global-graph-inner graph settings forcesettings theme)))

(rum/defc page-graph-inner < rum/reactive
  [_page graph dark?]
  (let [show-journals-in-page-graph? (rum/react *show-journals-in-page-graph?)]
    [:div.sidebar-item.flex-col
     [:div.flex.items-center.justify-between.mb-0
      [:span (t :right-side-bar/show-journals)]
      [:div.mt-1
       (ui/toggle show-journals-in-page-graph? ;my-val;
         (fn []
           (let [value (not show-journals-in-page-graph?)]
             (reset! *show-journals-in-page-graph? value)))
         true)]]

     (graph/graph-2d {:nodes (:nodes graph)
                      :links (:links graph)
                      :width 600
                      :height 600
                      :dark? dark?
                      :register-handlers-fn
                      (fn [graph]
                        (graph-register-handlers graph (atom nil) (atom nil) dark?))})]))

(rum/defc page-graph < db-mixins/query rum/reactive
  []
  (let [page (or
               (and (= :page (state/sub [:route-match :data :name]))
                 (state/sub [:route-match :path-params :name]))
               (date/today))
        theme (:ui/theme @state/state)
        dark? (= theme "dark")
        show-journals-in-page-graph (rum/react *show-journals-in-page-graph?)
        graph (if (util/uuid-string? page)
                (graph-handler/build-block-graph (uuid page) theme)
                (graph-handler/build-page-graph page theme show-journals-in-page-graph))]
    (when (seq (:nodes graph))
      (page-graph-inner page graph dark?))))

(defn- sort-pages-by
  [by-item desc? pages]
  (let [comp (if desc? > <)]
    (sort-by by-item comp pages)))

(rum/defc checkbox-opt
  [key checked opts]

  (let [*input (rum/create-ref)
        indeterminate? (boolean (:indeterminate opts))]

    (rum/use-effect!
     #(set! (.-indeterminate (rum/deref *input)) indeterminate?)
     [indeterminate?])

    [:label {:for key}
     (ui/checkbox
      (merge
       {:checked (boolean checked)
        :ref     *input
        :id      key}
       opts))]))

(rum/defc sortable-title
  [title key by-item desc?]
  [:th
   {:class [(name key)]}
   [:a.fade-link {:on-click (fn []
                              (reset! by-item key)
                              (swap! desc? not))}
    [:span.flex.items-center
     [:span.mr-1 title]
     (when (= @by-item key)
       [:span
        (if @desc? (svg/caret-down) (svg/caret-up))])]]])

(defn batch-delete-dialog
  [pages orphaned-pages? refresh-fn]
  (fn [close-fn]
    [:div
     [:div.sm:flex.items-center
      [:div.mx-auto.flex-shrink-0.flex.items-center.justify-center.h-12.w-12.rounded-full.bg-error.sm:mx-0.sm:h-10.sm:w-10
       [:span.text-error.text-xl
        (ui/icon "alert-triangle")]]
      [:div.mt-3.text-center.sm:mt-0.sm:ml-4.sm:text-left
       [:h3#modal-headline.text-lg.leading-6.font-medium
        (if orphaned-pages?
          (t :remove-orphaned-pages)
          (t :page/delete-confirmation))]]]

     [:table.table-auto.cp__all_pages_table.mt-4
      [:thead
       [:tr.opacity-70
        [:th [:span "#"]]
        [:th [:span (t :block/name)]]
        [:th [:span (t :page/backlinks)]]
        (when-not orphaned-pages? [:th [:span (t :page/created-at)]])
        (when-not orphaned-pages? [:th [:span (t :page/updated-at)]])]]

      [:tbody
       (for [[n {:block/keys [name created-at updated-at backlinks] :as page}] (medley/indexed pages)]
         [:tr {:key name}
          [:td.n.w-12 [:span.opacity-70 (str (inc n) ".")]]
          [:td.name [:a {:href     (rfe/href :page {:name (:block/uuid page)})}
                     (component-block/page-cp {} page)]]
          [:td.backlinks [:span (or backlinks "0")]]
          (when-not orphaned-pages? [:td.created-at [:span (if created-at (date/int->local-time-2 created-at) "Unknown")]])
          (when-not orphaned-pages? [:td.updated-at [:span (if updated-at (date/int->local-time-2 updated-at) "Unknown")]])])]]

     [:div.pt-6.flex.justify-end.gap-4
      (ui/button
       (t :cancel)
       :theme :gray
       :on-click close-fn)

      (ui/button
       (t :yes)
       :on-click (fn []
                   (close-fn)
                   (let [failed-pages (atom [])]
                     (p/let [_ (p/all (map (fn [page]
                                             (page-handler/<delete! (:block/uuid page) nil
                                                                    {:error-handler
                                                                     (fn []
                                                                       (swap! failed-pages conj (:block/name page)))}))
                                           pages))]
                       (if (seq @failed-pages)
                         (notification/show! (t :all-pages/failed-to-delete-pages (string/join ", " (map pr-str @failed-pages)))
                                             :warning false)
                         (notification/show! (t :tips/all-done) :success))))
                   (js/setTimeout #(refresh-fn) 200)))]]))

(rum/defc pagination
  "Pagination component, like `<< <Prev 1/10 Next> >>`.

- current: current page number
- total: total number of items
- per-page: number of items per page
- on-change: callback function when page number changes"
  [& {:keys [current total per-page on-change]
      :or {current 1 per-page 40}}]
  (let [total-pages (int (Math/ceil (/ total per-page)))
        has-prev? (> current 1)
        has-next? (< current total-pages)
        prev-page (if (= 1 current) 1 (dec current))
        next-page (if (= total-pages current) total-pages (inc current))]
    [:div.flex.items-center.select-none
     (when has-prev?
       [[:a.fade-link.flex
         {:on-click #(on-change 1)}
         (ui/icon "chevrons-left")]
        [:a.fade-link.flex.items-center {:on-click #(on-change prev-page)}
         (ui/icon "caret-left") (t :paginates/prev)]])
     [:div.px-2
      [:span (str current "/" total-pages)]]
     (when has-next?
       [[:a.fade-link.flex.items-center {:on-click #(on-change next-page)}
         (t :paginates/next) (ui/icon "caret-right")]
        [:a.fade-link.flex
         {:on-click #(on-change total-pages)}
         (ui/icon "chevrons-right")]])]))

(rum/defcs ^:large-vars/cleanup-todo all-pages < rum/reactive
  (rum/local nil ::pages)
  (rum/local nil ::search-key)
  (rum/local nil ::results-all)
  (rum/local nil ::results)
  (rum/local {} ::checks)
  (rum/local :block/updated-at ::sort-by-item)
  (rum/local true ::desc?)
  (rum/local {:journals? false :page-type ""} ::filters)
  (rum/local nil ::filter-fn)
  (rum/local 1 ::current-page)
  [state]
  (let [current-repo (state/sub :git/current-repo)
        per-page-num 40
        *sort-by-item (get state ::sort-by-item)
        *desc? (::desc? state)
        *filters (::filters state)
        *results (::results state)
        *results-all (::results-all state)
        *checks (::checks state)
        *pages (::pages state)
        *current-page (::current-page state)
        *filter-fn (::filter-fn state)
        *search-key (::search-key state)
        *search-input (rum/create-ref)

        ;; TODO: remove this
        *indeterminate (rum/derived-atom
                        [*checks] ::indeterminate
                        (fn [checks]
                          (when-let [checks (vals checks)]
                            (if (every? true? checks)
                              1 (if (some true? checks) -1 0)))))

        mobile? (util/mobile?)
        total-items (count @*results-all)
        ;; FIXME: "pages" is ambiguous here, it can be either "Logseq pages" or "result pages"
        total-pages (if-not @*results-all 0
                            (js/Math.ceil (/ total-items per-page-num)))
        to-page (fn [page]
                  (when (> total-pages 1)
                    (if (and (> page 0)
                             (<= page total-pages))
                      (reset! *current-page page)
                      (reset! *current-page 1))
                    (js/setTimeout #(util/scroll-to-top))))

        search-key (fn [key]
                     (when-let [key (and key (string/trim key))]
                       (if (and (not (string/blank? key))
                                (seq @*results))
                         (reset! *search-key key)
                         (reset! *search-key nil))))

        refresh-pages #(do
                         (reset! *pages nil)
                         (reset! *current-page 1))]

    [:div.flex-1.cp__all_pages
     [:h1.title (t :all-pages)]

     [:div.text-sm.ml-1.opacity-70.mb-4 (t :paginates/pages total-items)]

     (when current-repo

       ;; all pages
       (when (nil? @*pages)
         (let [pages (->> (page-handler/get-all-pages current-repo)
                          (map-indexed (fn [idx page] (assoc page
                                                             :block/backlinks (count (:block/_refs (db/entity (:db/id page))))
                                                             :block/idx idx))))]
           (reset! *filter-fn
                   (memoize (fn [sort-by-item desc? {:keys [journal? page-type]}]
                              (->> pages
                                   (filter #(and
                                             (or (boolean journal?)
                                                 (= false (boolean (ldb/journal-page? %))))
                                             (or (empty? page-type)
                                                 (contains? (set (:block/type %)) page-type))))
                                   (sort-pages-by sort-by-item desc?)))))
           (reset! *pages pages)))

       ;; filter results
       (when @*filter-fn
         (let [pages (@*filter-fn @*sort-by-item @*desc? @*filters)

               ;; search key
               pages (if-not (string/blank? @*search-key)
                       (search/fuzzy-search pages @*search-key
                                            :limit 20
                                            :extract-fn :block/original-name)
                       pages)

               _ (reset! *results-all pages)

               pages (take per-page-num (drop (* per-page-num (dec @*current-page)) pages))]

           (reset! *checks (into {} (for [{:block/keys [idx]} pages]
                                      [idx (boolean (get @*checks idx))])))
           (reset! *results pages)))

       [:div.cp__all_pages-content
        [:div.actions.pt-4
         {:class (util/classnames [{:has-selected (or (nil? @*indeterminate)
                                                      (not= 0 @*indeterminate))}])}
         [:div.l.flex.items-center
          [:div.actions-wrap
           (ui/button
            (t :delete)
            {:on-click
             (fn []
               (let [selected (filter (fn [[_ v]] v) @*checks)
                     selected (and (seq selected)
                                   (into #{} (for [[k _] selected] k)))]
                 (when-let [pages (and selected (filter #(contains? selected (:block/idx %)) @*results))]
                   (state/set-modal! (batch-delete-dialog pages false #(do
                                                                         (reset! *checks nil)
                                                                         (refresh-pages)))))))
             :icon "trash"
             :variant :destructive
             :icon-props {:size 14}
             :size :sm})]

          [:div.search-wrap.flex.items-center.pl-2
           (let [search-fn (fn []
                             (let [^js input (rum/deref *search-input)]
                               (search-key (.-value input))
                               (reset! *current-page 1)))
                 reset-fn (fn []
                            (let [^js input (rum/deref *search-input)]
                              (set! (.-value input) "")
                              (reset! *search-key nil)))]

             [(ui/button (ui/icon "search")
                         :on-click search-fn
                         :variant :link
                         :size :xs)
              [:input.form-input {:placeholder   (t :search/page-names)
                                  :on-key-up     (fn [^js e]
                                                   (let [^js target (.-target e)]
                                                     (if (string/blank? (.-value target))
                                                       (reset! *search-key nil)
                                                       (cond
                                                         (= 13 (.-keyCode e)) (search-fn)
                                                         (= 27 (.-keyCode e)) (reset-fn)))))
                                  :ref           *search-input
                                  :default-value ""}]

              (when (not (string/blank? @*search-key))
                [:a.cancel {:on-click reset-fn}
                 (ui/icon "x")])])]]

         [:div.r.flex.items-center.justify-between
          [:div
           (ui/select (->> (if (config/db-based-graph? current-repo)
                             ["" "class" "property" "whiteboard" "journal"]
                             ["" "whiteboard"])
                           (map (fn [block-type]
                                  {:label (if (seq block-type) (string/capitalize block-type) "Filter by page type")
                                   :selected (= block-type type)
                                   :disabled config/publishing?
                                   :value block-type})))
                      (fn [_e value]
                        (swap! *filters assoc :page-type value)
                        (when (= "journal" value)
                          (swap! *filters assoc :journal? true))))]
          [:div
           (ui/tippy
            {:html  [:small (t :page/show-journals)]
             :arrow true}
            [:a.button.journal
             {:class    (util/classnames [{:active (boolean (:journal? @*filters))}])
              :on-click #(swap! *filters update :journal? not)}
             (ui/icon "calendar" {:size ui/icon-size})])]

          [:div.paginates
           (pagination :current @*current-page
                       :total total-items
                       :per-page per-page-num
                       :on-change #(to-page %))]

          (ui/dropdown-with-links
           (fn [{:keys [toggle-fn]}]
             [:a.button.fade-link
              {:on-click toggle-fn}
              (ui/icon "dots" {:size ui/icon-size})])
           [{:title (t :remove-orphaned-pages)
             :options {:on-click (fn []
                                   (let [orphaned-pages (model/get-orphaned-pages {})
                                         orphaned-pages? (seq orphaned-pages)]
                                     (if orphaned-pages?
                                       (state/set-modal!
                                        (batch-delete-dialog
                                         orphaned-pages  true
                                         #(do
                                            (reset! *checks nil)
                                            (refresh-pages))))
                                       (notification/show! "Congratulations, no orphaned pages in your graph!" :success))))}
             :icon (ui/icon "file-x")}
            {:title (t :all-files)
             :options {:href (rfe/href :all-files)}
             :icon (ui/icon "files")}]
           {})]]

        [:table.table-auto.cp__all_pages_table
         [:thead
          [:tr
           [:th.selector
            (checkbox-opt "all-pages-select-all"
                          (= 1 @*indeterminate)
                          {:on-change     (fn []
                                            (let [indeterminate? (= -1 @*indeterminate)
                                                  all? (= 1 @*indeterminate)]
                                              (doseq [{:block/keys [idx]} @*results]
                                                (swap! *checks assoc idx (or indeterminate? (not all?))))))
                           :indeterminate (when (= -1 @*indeterminate) "indeterminate")})]
           [:th.icon ""]
           (sortable-title (t :block/name) :block/original-name *sort-by-item *desc?)
           (when-not mobile?
             [(sortable-title (t :page/backlinks) :block/backlinks *sort-by-item *desc?)
              (sortable-title (t :page/created-at) :block/created-at *sort-by-item *desc?)
              (sortable-title (t :page/updated-at) :block/updated-at *sort-by-item *desc?)])]]

         [:tbody
          (for [{:block/keys [idx original-name created-at updated-at backlinks] :as page} @*results]
            (when-not (string/blank? original-name)
              [:tr {:key original-name}
               [:td.selector
                (checkbox-opt (str "label-" idx)
                              (get @*checks idx)
                              {:on-change (fn []
                                            (swap! *checks update idx not))})]
               [:td.icon.w-4.p-0.overflow-hidden
                (when-let [icon (get page (pu/get-pid :logseq.property/icon))]
                  icon)]
               [:td.name [:a {:on-click (fn [e]
                                          (.preventDefault e)
                                          (let [repo (state/get-current-repo)]
                                            (when (gobj/get e "shiftKey")
                                              (state/sidebar-add-block!
                                               repo
                                               (:db/id page)
                                               :page))))
                              :href     (rfe/href :page {:name (:block/uuid page)})}
                          (component-block/page-cp {} page)]]

               (when-not mobile?
                 [[:td.backlinks [:span backlinks]]
                  [:td.created-at [:span (if created-at
                                           (date/int->local-time-2 created-at)
                                           "Unknown")]]
                  [:td.updated-at [:span (if updated-at
                                           (date/int->local-time-2 updated-at)
                                           "Unknown")]]])]))]]

        [:div.flex.justify-end.py-4
         (pagination :current @*current-page
                     :total total-items
                     :per-page per-page-num
                     :on-change #(to-page %))]])]))
