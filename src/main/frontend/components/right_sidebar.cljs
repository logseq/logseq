(ns frontend.components.right-sidebar
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.components.block :as block]
            [frontend.components.onboarding :as onboarding]
            [frontend.components.page :as page]
            [frontend.components.svg :as svg]
            [frontend.context.i18n :as i18n]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.model :as db-model]
            [frontend.extensions.slide :as slide]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.object :as gobj]
            [medley.core :as medley]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]))

(rum/defc toggle
  []
  (when-not (util/mobile?)
    (ui/tippy
      {:html [:div.text-sm.font-medium
              "Shortcut: "
              [:code (util/->platform-shortcut "t r")]]
       :delay 2000
       :hideDelay 1
       :position "left"
       :interactive true
       :arrow true}

      [:a.button.fade-link.toggle
       {:on-click state/toggle-sidebar-open?!}
       (ui/icon "layout-sidebar-right" {:style {:fontSize "20px"}})])))

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

(rum/defc contents < rum/reactive db-mixins/query
  []
  [:div.contents.flex-col.flex.ml-3
   (when-let [contents (db/entity [:block/name "contents"])]
     (page/contents-page contents))])

(defn build-sidebar-item
  [repo idx db-id block-type block-data t]
  (case block-type
    :contents
    [(t :right-side-bar/contents)
     (contents)]

    :help
    [(t :right-side-bar/help) (onboarding/help)]

    :page-graph
    [(str (t :right-side-bar/page-graph))
     (page/page-graph)]

    :block-ref
    (when-let [block (db/entity repo [:block/uuid (:block/uuid (:block block-data))])]
      [(t :right-side-bar/block-ref)
       (let [block (:block block-data)
             block-id (:block/uuid block)
             format (:block/format block)]
         [[:div.ml-2.mt-1
           (block/block-parents {:id     "block-parent"
                                 :block? true} repo block-id {})]
          [:div.ml-2
           (block-cp repo idx block)]])])

    :block
    (when-let [block (db/entity repo [:block/uuid (:block/uuid block-data)])]
      (let [block-id (:block/uuid block-data)
            format (:block/format block-data)]
        [(block/block-parents {:id     "block-parent"
                               :block? true} repo block-id {})
         [:div.ml-2
          (block-cp repo idx block-data)]]))

    :page
    (let [page-name (or (:block/name block-data)
                        db-id)
          page-name (if (integer? db-id)
                      (:block/name (db/entity db-id))
                      page-name)]
      [[:a.page-title {:href     (rfe/href :page {:name page-name})
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
    (cond-> {:on-click on-close
             :style {:margin-right -4}}
      class
      (assoc :class class))
    svg/close]))

(rum/defc sidebar-item < rum/reactive
  [repo idx db-id block-type block-data t]

  (let [item
        (if (= :page block-type)
          (let [lookup-ref (if (number? db-id) db-id [:block/name (string/lower-case db-id)])
                page (db/query-entity-in-component lookup-ref)]
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
               (ui/rotating-arrow collapse?)]
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
    (when page
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

(rum/defcs sidebar-inner <
  (rum/local false ::anim-finished?)
  {:will-mount (fn [state]
                 (js/setTimeout (fn [] (reset! (get state ::anim-finished?) true)) 300)
                 state)}
  [state repo t blocks]
  (let [*anim-finished? (get state ::anim-finished?)]
    [:div.cp__right-sidebar-inner.flex.flex-col.h-full#right-sidebar-container

     (sidebar-resizer)
     [:div.cp__right-sidebar-scrollable
      [:div.cp__right-sidebar-topbar.flex.flex-row.justify-between.items-center.pl-4.pr-2.h-12
       [:div.cp__right-sidebar-settings.hide-scrollbar {:key "right-sidebar-settings"}
        [:div.ml-4.text-sm
         [:a.cp__right-sidebar-settings-btn {:on-click (fn [e]
                                                         (state/sidebar-add-block! repo "contents" :contents nil))}
          (t :right-side-bar/contents)]]

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

       [:div.flex.align-items {:style {:z-index 999
                                       :margin-right 2}}
        (toggle)]]

      [:.sidebar-item-list.flex-1.scrollbar-spacing {:style {:height "100vh"}}
       (if @*anim-finished?
         (for [[idx [repo db-id block-type block-data]] (medley/indexed blocks)]
           (rum/with-key
             (sidebar-item repo idx db-id block-type block-data t)
             (str "sidebar-block-" idx)))
         [:div.p-4
          [:span.font-medium.opacity-50 "Loading ..."]])]]]))

(rum/defcs sidebar < rum/reactive
  [state]
  (let [blocks (state/sub :sidebar/blocks)
        blocks (if (empty? blocks)
                 [[(state/get-current-repo) "contents" :contents nil]]
                 blocks)
        sidebar-open? (state/sub :ui/sidebar-open?)
        repo (state/sub :git/current-repo)
        t (i18n/use-tongue)]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div#right-sidebar.cp__right-sidebar.h-screen
       {:class (if sidebar-open? "open" "closed")}
       (when sidebar-open?
         (sidebar-inner repo t blocks))])))
