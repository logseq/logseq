(ns frontend.components.whiteboard
  "Whiteboard related components"
  (:require [cljs.math :as math]
            [frontend.components.page :as page]
            [frontend.components.reference :as reference]
            [frontend.context.i18n :refer [t]]
            [frontend.db.model :as model]
            [frontend.handler.route :as route-handler]
            [frontend.handler.user :as user-handler]
            [frontend.handler.whiteboard :as whiteboard-handler]
            [frontend.rum :refer [use-bounding-client-rect use-click-outside]]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [promesa.core :as p]
            [rum.core :as rum]
            [shadow.loader :as loader]))

(defonce tldraw-loaded? (atom false))
(rum/defc tldraw-app < rum/reactive
  {:init (fn [state]
           (p/let [_ (loader/load :tldraw)]
             (reset! tldraw-loaded? true))
           state)}
  [name shape-id]
  (let [loaded? (rum/react tldraw-loaded?)
        draw-component (when loaded?
                         (resolve 'frontend.extensions.tldraw/tldraw-app))]
    (when draw-component
      (draw-component name shape-id))))

;; TODO: make it reactive to db changes
(rum/defc tldraw-preview < rum/reactive
  {:init (fn [state]
           (p/let [_ (loader/load :tldraw)]
             (reset! tldraw-loaded? true))
           state)}
  [page-name]
  (let [loaded? (rum/react tldraw-loaded?)
        tldr (whiteboard-handler/page-name->tldr! page-name)
        generate-preview (when loaded?
                           (resolve 'frontend.extensions.tldraw/generate-preview))]
    (when generate-preview
      (generate-preview tldr))))

(rum/defc dropdown
  [label children show? outside-click-hander]
  (let [[anchor-ref anchor-rect] (use-bounding-client-rect show?)
        [content-ref content-rect] (use-bounding-client-rect show?)
        offset-x (when (and anchor-rect content-rect)
                   (let [offset-x (+ (* 0.5 (- (.-width anchor-rect) (.-width content-rect)))
                                     (.-x anchor-rect))
                         vp-w (.-innerWidth js/window)
                         right (+ offset-x (.-width content-rect) 16)
                         offset-x (if (> right vp-w) (- offset-x (- right vp-w)) offset-x)]
                     offset-x))
        offset-y (when (and anchor-rect content-rect)
                   (+ (.-y anchor-rect) (.-height anchor-rect) 8))
        click-outside-ref (use-click-outside outside-click-hander)
        [d-open set-d-open] (rum/use-state false)
        _ (rum/use-effect! (fn [] (js/setTimeout #(set-d-open show?) 100))
                           [show?])]
    [:div.dropdown-anchor {:ref anchor-ref}
     label
     (ui/portal
      [:div.fixed.shadow-lg.color-level.px-2.rounded-lg.transition.md:w-64.lg:w-128.overflow-auto
       {:ref (juxt content-ref click-outside-ref)
        :style {:opacity (if d-open 1 0)
                :pointer-events (if d-open "auto" "none")
                :transform (str "translateY(" (if d-open 0 10) "px)")
                :min-height "40px"
                :max-height "420px"
                :left offset-x
                :top offset-y}} children])]))

(rum/defc page-refs-count < rum/static
  ([page-name classname]
   (page-refs-count page-name classname nil))
  ([page-name classname render-fn]
   (let [page-entity (model/get-page page-name)
         block-uuid (:block/uuid page-entity)
         ref (rum/use-ref nil)
         refs-count (count (:block/_refs page-entity))
         [open-flag set-open-flag] (rum/use-state 0)
         open? (not= open-flag 0)
         d-open-flag (rum/use-memo #(util/debounce 200 set-open-flag) [])]
     ;; TODO: move click outside to the utility? 
     (rum/use-effect!
      (let [listener (fn [e]
                       (when (and (.-current ref)
                                  (not (.contains (.-current ref) (.-target e))))
                         (d-open-flag 0)))]
        (.addEventListener js/document.body "mousedown" listener true)
        #(.removeEventListener js/document.body "mousedown" listener))
      [ref])
     (when (> refs-count 0)
       (dropdown
        [:div.flex.items-center.gap-2.whiteboard-page-refs-count
         {:class (str classname (when open? " open"))
          :on-mouse-enter (fn [] (d-open-flag #(if (= % 0) 1 %)))
          :on-mouse-leave (fn [] (d-open-flag #(if (= % 2) % 0)))
          :on-click (fn [e]
                      (util/stop e)
                      (d-open-flag (fn [o] (if (not= o 2) 2 0))))}
         [:div.open-page-ref-link refs-count]
         (when render-fn (render-fn open?))]
        (reference/block-linked-references block-uuid)
        open?
        #(set-open-flag 0))))))

(defn- get-page-display-name
  [page-name]
  (let [page-entity (model/get-page page-name)]
    (or
     (get-in page-entity [:block/properties :title] nil)
     (:block/original-name page-entity)
     page-name)))

;; This is not accurate yet
(defn- get-page-human-update-time
  [page-name]
  (let [page-entity (model/get-page page-name)
        {:block/keys [updated-at created-at]} page-entity]
    (str (if (= created-at updated-at) "Created " "Edited ")
         (util/time-ago (js/Date. updated-at)))))

(rum/defc dashboard-preview-card
  [page-name {:keys [checked on-checked-change show-checked?]}]
  [:div.dashboard-card.dashboard-preview-card.cursor-pointer.hover:shadow-lg
   {:data-checked checked
    :style {:filter (if (and show-checked? (not checked)) "opacity(0.5)" "none")}
    :on-click
    (fn [e]
      (util/stop e)
      (if show-checked?
        (on-checked-change (not checked))
        (route-handler/redirect-to-whiteboard! page-name)))}
   [:div.dashboard-card-title
    [:div.flex.w-full.items-center
     [:div.dashboard-card-title-name.font-bold
      (if (parse-uuid page-name)
        [:span.opacity-50 (t :untitled)]
        (get-page-display-name page-name))]
     [:div.flex-1]
     [:div.dashboard-card-checkbox
      {:tab-index -1
       :style {:visibility (when show-checked? "visible")}
       :on-click util/stop-propagation}
      (ui/checkbox {:checked checked
                    :on-change (fn [] (on-checked-change (not checked)))})]]
    [:div.flex.w-full.opacity-50
     [:div (get-page-human-update-time page-name)]
     [:div.flex-1]
     (page-refs-count page-name nil)]]
   [:div.p-4.h-64.flex.justify-center
    (tldraw-preview page-name)]])

(rum/defc dashboard-create-card
  []
  [:div.dashboard-card.dashboard-create-card.cursor-pointer#tl-create-whiteboard
   {:on-click
    (fn [e]
      (util/stop e)
      (whiteboard-handler/create-new-whiteboard-and-redirect!))}
   (ui/icon "plus")
   [:span.dashboard-create-card-caption.select-none
    "New whiteboard"]])

(rum/defc whiteboard-dashboard
  []
  (if (state/enable-whiteboards?)
    (let [whiteboards (->> (model/get-all-whiteboards (state/get-current-repo))
                           (sort-by :block/updated-at)
                           reverse)
          whiteboard-names (map :block/name whiteboards)
          [ref rect] (use-bounding-client-rect)
          [container-width] (when rect [(.-width rect) (.-height rect)])
          cols (cond (< container-width 600) 1
                     (< container-width 900) 2
                     (< container-width 1200) 3
                     :else 4)
          total-whiteboards (count whiteboards)
          empty-cards (- (max (* (math/ceil (/ (inc total-whiteboards) cols)) cols) (* 2 cols))
                         (inc total-whiteboards))
          [checked-page-names set-checked-page-names] (rum/use-state #{})
          has-checked? (not-empty checked-page-names)]
      [:<>
       [:h1.select-none.flex.items-center.whiteboard-dashboard-title.title
        [:div "All whiteboards"
         [:span.opacity-50
          (str " · " total-whiteboards)]]
        [:div.flex-1]
        (when has-checked?
          [:button.ui__button.m-0.py-1.inline-flex.items-center.bg-red-800
           {:on-click
            (fn []
              (state/set-modal! (page/batch-delete-dialog
                                 (map (fn [name]
                                        (some (fn [w] (when (= (:block/name w) name) w)) whiteboards))
                                      checked-page-names)
                                 false route-handler/redirect-to-whiteboard-dashboard!)))}
           [:span.flex.gap-2.items-center
            [:span.opacity-50 (ui/icon "trash" {:style {:font-size 15}})]
            (t :delete)
            [:span.opacity-50
             (str " · " (count checked-page-names))]]])]
       [:div
        {:ref ref}
        [:div.gap-8.grid.grid-rows-auto
         {:style {:visibility (when (nil? container-width) "hidden")
                  :grid-template-columns (str "repeat(" cols ", minmax(0, 1fr))")}}
         (dashboard-create-card)
         (for [whiteboard-name whiteboard-names]
           [:<> {:key whiteboard-name}
            (dashboard-preview-card whiteboard-name
                                    {:show-checked? has-checked?
                                     :checked (boolean (checked-page-names whiteboard-name))
                                     :on-checked-change (fn [checked]
                                                          (set-checked-page-names (if checked
                                                                               (conj checked-page-names whiteboard-name)
                                                                               (disj checked-page-names whiteboard-name))))})])
         (for [n (range empty-cards)]
           [:div.dashboard-card.dashboard-bg-card {:key n}])]]])
    [:div "This feature is not publicly available yet."]))

(rum/defc whiteboard-page
  [name block-id]
  [:div.absolute.w-full.h-full.whiteboard-page

   ;; makes sure the whiteboard will not cover the borders
   {:key name
    :style {:padding "0.5px" :z-index 0
            :transform "translateZ(0)"
            :text-rendering "geometricPrecision"
            :-webkit-font-smoothing "subpixel-antialiased"}}

   [:div.whiteboard-page-title-root
    [:span.whiteboard-page-title
     {:style {:color "var(--ls-primary-text-color)"
              :user-select "none"}}
     (page/page-title name
                      [:span.tie.tie-whiteboard
                       {:style {:font-size "0.9em"}}]
                      (get-page-display-name name)
                      nil
                      false)]

    (page-refs-count name
                     "text-md px-3 py-2 cursor-default whiteboard-page-refs-count"
                     (fn [open?] [:<> "References" (ui/icon (if open? "references-hide" "references-show")
                                                            {:extension? true})]))]
   (tldraw-app name block-id)])

(rum/defc whiteboard-route
  [route-match]
  (when (user-handler/alpha-user?)
    (let [name (get-in route-match [:parameters :path :name])
          {:keys [block-id]} (get-in route-match [:parameters :query])]
      (whiteboard-page name block-id))))
