(ns frontend.components.right-sidebar
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.components.svg :as svg]
            [frontend.components.page :as page]
            [frontend.components.block :as block]
            [frontend.extensions.graph-2d :as graph-2d]
            [frontend.components.onboarding :as onboarding]
            [frontend.handler.route :as route-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.graph :as graph-handler]
            [frontend.state :as state]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.util :as util]
            [frontend.date :as date]
            [medley.core :as medley]
            [clojure.string :as string]
            [frontend.extensions.slide :as slide]
            [cljs-bean.core :as bean]
            [goog.object :as gobj]
            [frontend.graph :as graph]
            [frontend.context.i18n :as i18n]
            [reitit.frontend.easy :as rfe]
            [frontend.db-mixins :as db-mixins]
            [frontend.config :as config]))

(rum/defc toggle
  []
  (when-not (util/mobile?)
    [:a.opacity-50.hover:opacity-100.ml-4 {:on-click state/toggle-sidebar-open?!}
    (svg/menu)]))

(rum/defc block-cp < rum/reactive
  [repo idx block]
  (let [id (:block/uuid block)]
    (page/page {:parameters  {:path {:name (str id)}}
                :sidebar?    true
                :sidebar/idx idx
                :repo        repo})))

(rum/defc page-cp < rum/reactive
  [repo page-name]
  (page/page {:parameters {:path {:name page-name}}
              :sidebar?   true
              :repo       repo}))

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
      [:div.sidebar-item.flex-col
       (graph-2d/graph
        (graph/build-graph-opts
         graph dark?
         {:width  600
          :height 600}))])))

(defn recent-pages
  []
  (let [pages (->> (db/get-key-value :recent/pages)
                   (remove nil?)
                   (remove #(= (string/lower-case %) "contents")))]
    [:div.recent-pages.text-sm.flex-col.flex.ml-3.mt-2
     (if (seq pages)
       (for [page pages]
         [:a.mb-1 {:key      (str "recent-page-" page)
                   :href     (rfe/href :page {:name page})
                   :on-click (fn [e]
                               (when (gobj/get e "shiftKey")
                                 (when-let [page (db/pull [:block/name (string/lower-case page)])]
                                   (state/sidebar-add-block!
                                    (state/get-current-repo)
                                    (:db/id page)
                                    :page
                                    {:page page}))
                                 (.preventDefault e)))}
          page]))]))

(rum/defc contents < rum/reactive db-mixins/query
  []
  [:div.contents.flex-col.flex.ml-3
   (when-let [contents (db/entity [:block/name "contents"])]
     (page/contents-page contents))])

(defn build-sidebar-item
  [repo idx db-id block-type block-data t]
  (case block-type
    :contents
    [(or (state/get-favorites-name)
         (t :right-side-bar/favorites))
     (contents)]

    :recent
    [(t :right-side-bar/recent) (recent-pages)]

    :help
    [(t :right-side-bar/help) (onboarding/help)]

    :page-graph
    [(str (t :right-side-bar/page-graph))
     (page-graph)]

    :block-ref
    (when-let [block (db/entity repo [:block/uuid (:block/uuid (:block block-data))])]
      [(t :right-side-bar/block-ref)
       (let [block (:block block-data)
             block-id (:block/uuid block)
             format (:block/format block)]
         [[:div.ml-2.mt-1
           (block/block-parents {:id     "block-parent"
                                 :block? true} repo block-id format)]
          [:div.ml-2
           (block-cp repo idx block)]])])

    :block
    (when-let [block (db/entity repo [:block/uuid (:block/uuid block-data)])]
      (let [block-id (:block/uuid block-data)
            format (:block/format block-data)]
        [(block/block-parents {:id     "block-parent"
                               :block? true} repo block-id format)
         [:div.ml-2
          (block-cp repo idx block-data)]]))

    :page
    (let [page-name (:block/name block-data)]
      [[:a {:href     (rfe/href :page {:name page-name})
            :on-click (fn [e]
                        (when (gobj/get e "shiftKey")
                          (.preventDefault e)))}
        (db-model/get-page-original-name page-name)]
       [:div.ml-2
        (page-cp repo page-name)]])

    :page-presentation
    (let [page-name (get-in block-data [:page :block/name])
          journal? (:journal? block-data)
          blocks (db/get-page-blocks repo page-name)
          blocks (if journal?
                   (rest blocks)
                   blocks)
          sections (block/build-slide-sections blocks {:id          "slide-reveal-js"
                                                       :slide?      true
                                                       :sidebar?    true
                                                       :page-name   page-name})]
      [[:a {:href (rfe/href :page {:name page-name})}
        (db-model/get-page-original-name page-name)]
       [:div.ml-2.slide.mt-2
        (slide/slide sections)]])

    ["" [:span]]))

(defn close
  ([on-close]
   (close nil on-close))
  ([class on-close]
   [:a.close.opacity-50.hover:opacity-100.flex.items-center
    (cond-> {:on-click on-close}
      class
      (assoc :class class))
    svg/close]))

(rum/defc sidebar-item < rum/reactive
  [repo idx db-id block-type block-data t]
  (let [item
        (if (= :page block-type)
          (let [page (db/query-entity-in-component db-id)]
            (when (seq page)
              (build-sidebar-item repo idx db-id block-type page t)))
          (build-sidebar-item repo idx db-id block-type block-data t))]
    (when item
      (let [collapse? (state/sub [:ui/sidebar-collapsed-blocks db-id])]
        [:div.sidebar-item.content.color-level.px-4.shadow-lg
         (let [[title component] item]
           [:div.flex.flex-col
            [:div.flex.flex-row.justify-between
             [:div.flex.flex-row.justify-center
              [:a.opacity-50.hover:opacity-100.flex.items-center.pr-1
               {:on-click #(state/sidebar-block-toggle-collapse! db-id)}
               (if collapse?
                 (svg/caret-right)
                 (svg/caret-down))]
              [:div.ml-1.font-medium
               title]]
             (close #(state/sidebar-remove-block! idx))]
            [:div {:class (if collapse? "hidden" "initial")}
             component]])]))))

(defn- get-page
  [match]
  (let [route-name (get-in match [:data :name])
        page (case route-name
               :page
               (get-in match [:path-params :name])

               :file
               (get-in match [:path-params :path])

               (date/journal-name))]
    (if page
      (string/lower-case page))))

(defn get-current-page
  []
  (let [match (:route-match @state/state)
        theme (:ui/theme @state/state)]
    (get-page match)))

(rum/defc sidebar-resizer
  []
  (let [el-ref (rum/use-ref nil)]
    (rum/use-effect!
     (fn []
       (when-let [el (and (fn? js/window.interact) (rum/deref el-ref))]
         (-> (js/interact el)
             (.draggable
              (bean/->js
               {:listeners
                {:move
                 (fn [^js/MouseEvent e]
                   (let [width js/document.documentElement.clientWidth
                         offset (.-left (.-rect e))
                         right-el-ratio (- 1 (.toFixed (/ offset width) 6))
                         right-el-ratio (cond
                                          (< right-el-ratio 0.2) 0.2
                                          (> right-el-ratio 0.7) 0.7
                                          :else right-el-ratio)
                         right-el (js/document.getElementById "right-sidebar")]
                     (when right-el
                       (let [width (str (* right-el-ratio 100) "%")]
                         (.setProperty (.-style right-el) "width" width)))))}}))
             (.styleCursor false)
             (.on "dragstart" #(.. js/document.documentElement -classList (add "is-resizing-buf")))
             (.on "dragend" #(.. js/document.documentElement -classList (remove "is-resizing-buf")))))
       #())
     [])
    [:span.resizer {:ref el-ref}]))

(rum/defcs sidebar < rum/reactive
  [state]
  (let [blocks (state/sub :sidebar/blocks)
        blocks (if (empty? blocks)
                 [[(state/get-current-repo) "contents" :contents nil]]
                 blocks)
        sidebar-open? (state/sub :ui/sidebar-open?)
        repo (state/sub :git/current-repo)
        match (state/sub :route-match)
        theme (state/sub :ui/theme)
        t (i18n/use-tongue)]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div#right-sidebar.cp__right-sidebar.h-screen
       {:class (if sidebar-open? "open" "closed")}
       (if sidebar-open?
         [:div.cp__right-sidebar-inner.flex.flex-col.h-full#right-sidebar-container

          (sidebar-resizer)
          [:div.cp__right-sidebar-scollable
           [:div.cp__right-sidebar-topbar.flex.flex-row.justify-between.items-center.px-4.h-12
           [:div.cp__right-sidebar-settings.hide-scrollbar {:key "right-sidebar-settings"}
            [:div.ml-4.text-sm
             [:a.cp__right-sidebar-settings-btn {:on-click (fn [e]
                                                             (state/sidebar-add-block! repo "contents" :contents nil))}
              (or (state/get-favorites-name)
                  (t :right-side-bar/favorites))]]

            [:div.ml-4.text-sm
             [:a.cp__right-sidebar-settings-btn {:on-click (fn [_e]
                                                             (state/sidebar-add-block! repo "recent" :recent nil))}

              (t :right-side-bar/recent)]]

            [:div.ml-4.text-sm
             [:a.cp__right-sidebar-settings-btn {:on-click (fn []
                                                             (when-let [page (get-current-page)]
                                                               (state/sidebar-add-block!
                                                                repo
                                                                (str "page-graph-" page)
                                                                :page-graph
                                                                page)))}
              (t :right-side-bar/page)]]

            [:div.ml-4.text-sm
             [:a.cp__right-sidebar-settings-btn {:on-click (fn [_e]
                                                             (state/sidebar-add-block! repo "help" :help nil))}
              (t :right-side-bar/help)]]]

           (when sidebar-open?
             [:div.flex.align-items {:style {:z-index 999
                                             :margin-right 2}}
              (toggle)])]

           [:.sidebar-item-list.flex-1
            (for [[idx [repo db-id block-type block-data]] (medley/indexed blocks)]
              (rum/with-key
                (sidebar-item repo idx db-id block-type block-data t)
                (str "sidebar-block-" idx)))]]])])))
