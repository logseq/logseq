(ns frontend.components.right-sidebar
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.components.block :as block]
            [frontend.components.onboarding :as onboarding]
            [frontend.components.page :as page]
            [frontend.components.svg :as svg]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.model :as db-model]
            [frontend.extensions.slide :as slide]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.handler.ui :as ui-handler]
            [frontend.util :as util]
            [goog.object :as gobj]
            [medley.core :as medley]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]))

(rum/defc toggle
  []
  (when-not (util/mobile?)
    (ui/with-shortcut :ui/toggle-right-sidebar "left"
      [:button.button.icon.fade-link.toggle-right-sidebar
       {:title "Toggle right sidebar"
        :on-click ui-handler/toggle-right-sidebar!}
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

(defn- block-with-breadcrumb
  [repo block idx sidebar-key ref?]
  (let [block-id (:block/uuid block)]
    [[:div.mt-1 {:class (if ref? "ml-8" "ml-1")}
      (block/breadcrumb {:id     "block-parent"
                         :block? true
                         :sidebar-key sidebar-key} repo block-id {})]
     [:div.ml-2
      (block-cp repo idx block)]]))

(defn build-sidebar-item
  [repo idx db-id block-type]
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
    #_:clj-kondo/ignore
    (let [lookup (if (integer? db-id) db-id [:block/uuid db-id])]
      (when-let [block (db/entity repo lookup)]
       [(t :right-side-bar/block-ref)
        (block-with-breadcrumb repo block idx [repo db-id block-type] true)]))

    :block
    #_:clj-kondo/ignore
    (let [lookup (if (integer? db-id) db-id [:block/uuid db-id])]
      (when-let [block (db/entity repo lookup)]
        (block-with-breadcrumb repo block idx [repo db-id block-type] false)))

    :page
    (when-let [page-name (if (integer? db-id)
                           (:block/name (db/entity db-id))
                           db-id)]
      [[:a.page-title {:href     (rfe/href :page {:name page-name})
                       :on-click (fn [e]
                                   (when (gobj/get e "shiftKey")
                                     (.preventDefault e)))}
        (db-model/get-page-original-name page-name)]
       [:div.ml-2
        (page-cp repo page-name)]])

    :page-presentation
    (let [page-name (:block/name (db/entity db-id))]
      [[:a {:href (rfe/href :page {:name page-name})}
        (db-model/get-page-original-name page-name)]
       [:div.ml-2.slide.mt-2
        (slide/slide page-name)]])

    ["" [:span]]))

(defn close
  ([on-close]
   (close nil on-close))
  ([class on-close]
   [:a.close.flex.items-center
    (cond-> {:on-click on-close
             :style {:margin-right -4}}
      class
      (assoc :class class))
    svg/close]))

(rum/defc sidebar-item < rum/reactive
  [repo idx db-id block-type]
  (let [item (build-sidebar-item repo idx db-id block-type)]
    (when item
      (let [collapse? (state/sub [:ui/sidebar-collapsed-blocks db-id])]
        [:div.sidebar-item.content.color-level.px-4.shadow-md
         (let [[title component] item]
           [:div.flex.flex-col
            [:div.flex.flex-row.justify-between
             [:div.flex.flex-row.justify-center
              {:on-click #(state/sidebar-block-toggle-collapse! db-id)}
              [:a.opacity-50.hover:opacity-100.flex.items-center.pr-1
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
  (let [match (:route-match @state/state)]
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
                         (.setProperty (.-style right-el) "width" width)
                         (ui-handler/persist-right-sidebar-width!)))))}}))
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
      [:div.cp__right-sidebar-topbar.flex.flex-row.justify-between.items-center.px-2.h-12
       [:div.cp__right-sidebar-settings.hide-scrollbar.gap-1 {:key "right-sidebar-settings"}
        [:div.text-sm
         [:button.button.cp__right-sidebar-settings-btn {:on-click (fn [_e]
                                                         (state/sidebar-add-block! repo "contents" :contents))}
          (t :right-side-bar/contents)]]

        [:div.text-sm
         [:button.button.cp__right-sidebar-settings-btn {:on-click (fn []
                                                         (when-let [page (get-current-page)]
                                                           (state/sidebar-add-block!
                                                            repo
                                                            page
                                                            :page-graph)))}
          (t :right-side-bar/page-graph)]]

        [:div.text-sm
         [:button.button.cp__right-sidebar-settings-btn {:on-click (fn [_e]
                                                         (state/sidebar-add-block! repo "help" :help))}
          (t :right-side-bar/help)]]]

       [:div
        (toggle)]]

      [:.sidebar-item-list.flex-1.scrollbar-spacing.flex.flex-col.gap-2
       (if @*anim-finished?
         (for [[idx [repo db-id block-type]] (medley/indexed blocks)]
           (rum/with-key
             (sidebar-item repo idx db-id block-type)
             (str "sidebar-block-" idx)))
         [:div.p-4
          [:span.font-medium.opacity-50 "Loading ..."]])]]]))

(rum/defcs sidebar < rum/reactive
  [state]
  (let [blocks (state/sub-right-sidebar-blocks)
        blocks (if (empty? blocks)
                 [[(state/get-current-repo) "contents" :contents nil]]
                 blocks)
        sidebar-open? (state/sub :ui/sidebar-open?)
        repo (state/sub :git/current-repo)]
    [:div#right-sidebar.cp__right-sidebar.h-screen
     {:class (if sidebar-open? "open" "closed")}
     (when sidebar-open?
       (sidebar-inner repo t blocks))]))
