(ns frontend.components.whiteboard
  "Whiteboard related components"
  (:require [cljs.math :as math]
            [frontend.components.onboarding.quick-tour :as quick-tour]
            [frontend.components.page :as page]
            [frontend.components.reference :as reference]
            [frontend.context.i18n :refer [t]]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.model :as model]
            [frontend.handler.route :as route-handler]
            [frontend.handler.whiteboard :as whiteboard-handler]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.rum :refer [use-bounding-client-rect use-breakpoint]]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [promesa.core :as p]
            [rum.core :as rum]
            [shadow.loader :as loader]
            [frontend.config :as config]
            [frontend.db.async :as db-async]
            [logseq.common.util :as common-util]
            [frontend.db :as db]
            [logseq.shui.ui :as shui]))

(defonce tldraw-loaded? (atom false))
(rum/defc tldraw-app < rum/reactive
  {:init (fn [state]
           (p/let [_ (loader/load :tldraw)]
             (reset! tldraw-loaded? true))
           state)}
  [page-uuid shape-id]
  (let [loaded? (rum/react tldraw-loaded?)
        draw-component (when loaded?
                         (resolve 'frontend.extensions.tldraw/tldraw-app))]
    (when draw-component
      (draw-component page-uuid shape-id))))

(rum/defc tldraw-preview < rum/reactive
  {:init (fn [state]
           (p/let [_ (loader/load :tldraw)]
             (reset! tldraw-loaded? true))
           (let [page-uuid (first (:rum/args state))]
             (db-async/<get-block (state/get-current-repo) page-uuid))
           state)}
  [page-uuid]
  (when page-uuid
    (let [loaded? (rum/react tldraw-loaded?)
          tldr (whiteboard-handler/get-page-tldr page-uuid)
          generate-preview (when loaded?
                             (resolve 'frontend.extensions.tldraw/generate-preview))]
      (when (and generate-preview (not (state/sub-async-query-loading page-uuid)))
        (generate-preview tldr)))))

;; TODO: move to frontend.components.reference
(rum/defcs references-count < rum/reactive db-mixins/query
  (rum/local false ::open?)
  "Shows a references count for any block or page.
   When clicked, a dropdown menu will show the reference details"
  ([state page-name-or-uuid classname]
   (references-count page-name-or-uuid classname nil))
  ([state page-name-or-uuid classname _opts]
   (when page-name-or-uuid
     (let [*open? (::open? state)
           page-entity (model/get-page page-name-or-uuid)
           page (model/sub-block (:db/id page-entity))
           block-uuid (:block/uuid page-entity)
           refs-count (count (:block/_refs page))]
       (when (> refs-count 0)
         (shui/popover
          {:open @*open?
           :on-open-change (fn [o] (reset! *open? o))}
          (shui/popover-trigger
           {}
           (shui/button {:variant :ghost :size :sm
                         :class "opacity-75 hover:opacity-100"}
                        refs-count))
          (shui/popover-content
           {:on-open-auto-focus #(.preventDefault %)}
           (shui/popover-arrow {:class-name "popper-arrow"})
           [:div {:class classname}
            (reference/block-linked-references block-uuid)])))))))

;; This is not accurate yet
(defn- get-page-human-update-time
  [page]
  (let [{:block/keys [updated-at created-at]} page]
    (str (if (= created-at updated-at) (t :whiteboard/dashboard-card-created) (t :whiteboard/dashboard-card-edited))
         (util/time-ago (js/Date. updated-at)))))

(rum/defc dashboard-preview-card
  [whiteboard {:keys [checked on-checked-change show-checked?]}]
  [:div.dashboard-card.dashboard-preview-card.cursor-pointer.hover:shadow-lg
   {:data-checked checked
    :style {:filter (if (and show-checked? (not checked)) "opacity(0.5)" "none")}
    :on-click
    (fn [e]
      (util/stop e)
      (if show-checked?
        (on-checked-change (not checked))
        (route-handler/redirect-to-page! (:block/uuid whiteboard))))}
   [:div.dashboard-card-title
    [:div.flex.w-full.items-center
     [:div.dashboard-card-title-name.font-bold
      (if (common-util/uuid-string? (:block/name whiteboard))
        [:span.opacity-50 (t :untitled)]
        (:block/title whiteboard))]
     [:div.flex-1]
     [:div.dashboard-card-checkbox
      {:tab-index -1
       :style {:visibility (when show-checked? "visible")}
       :on-click util/stop-propagation}
      (ui/checkbox {:value checked
                    :on-change (fn [] (on-checked-change (not checked)))})]]
    [:div.flex.w-full.opacity-50
     [:div (get-page-human-update-time whiteboard)]
     [:div.flex-1]
     (references-count (:block/uuid whiteboard) nil {})]]
   (ui/lazy-visible
    (fn [] [:div.p-4.h-64.flex.justify-center
            (tldraw-preview (:block/uuid whiteboard))]))])

(rum/defc dashboard-create-card
  []
  [:div.dashboard-card.dashboard-create-card.cursor-pointer#tl-create-whiteboard
   {:on-click
    (fn [e]
      (util/stop e)
      (whiteboard-handler/<create-new-whiteboard-and-redirect!))}
   (ui/icon "plus")
   [:span.dashboard-create-card-caption.select-none
    (t :whiteboard/dashboard-card-new-whiteboard)]])

(rum/defc whiteboard-dashboard
  []
  (if (state/enable-whiteboards?)
    (let [whiteboards (->> (model/get-all-whiteboards (state/get-current-repo))
                           (sort-by :block/updated-at)
                           reverse)
          [ref rect] (use-bounding-client-rect)
          [container-width] (when rect [(.-width rect) (.-height rect)])
          cols (cond (< container-width 600) 1
                     (< container-width 900) 2
                     (< container-width 1200) 3
                     :else 4)
          total-whiteboards (count whiteboards)
          empty-cards (- (max (* (math/ceil (/ (inc total-whiteboards) cols)) cols) (* 2 cols))
                         (inc total-whiteboards))
          [checked-page-ids set-checked-page-ids] (rum/use-state #{})
          has-checked? (not-empty checked-page-ids)]
      [:<>
       [:h1.select-none.flex.items-center.whiteboard-dashboard-title.title
        [:div (t :all-whiteboards)
         [:span.opacity-50
          (str " · " total-whiteboards)]]
        [:div.flex-1]
        (when has-checked?
          (ui/button
           (count checked-page-ids)
           {:icon "trash"
            :on-click
            (fn []
              (shui/dialog-open!
                (page/batch-delete-dialog
                  (map (fn [id]
                         (some (fn [w] (when (= (:db/id w) id) w)) whiteboards))
                    checked-page-ids)
                  false
                  (fn []
                    (set-checked-page-ids #{})
                    (route-handler/redirect-to-whiteboard-dashboard!)))))}))]
       [:div
        {:ref ref}
        [:div.gap-8.grid.grid-rows-auto
         {:style {:visibility (when (nil? container-width) "hidden")
                  :grid-template-columns (str "repeat(" cols ", minmax(0, 1fr))")}}
         (when-not config/publishing? (dashboard-create-card))
         (for [whiteboard whiteboards]
           (let [id (:db/id whiteboard)]
             [:<> {:key (str id)}
              (dashboard-preview-card whiteboard
                                      {:show-checked? has-checked?
                                       :checked (boolean (checked-page-ids id))
                                       :on-checked-change (fn [checked]
                                                            (set-checked-page-ids (if checked
                                                                                    (conj checked-page-ids id)
                                                                                    (disj checked-page-ids id))))})]))
         (for [n (range empty-cards)]
           [:div.dashboard-card.dashboard-bg-card {:key n}])]]])
    [:div "This feature is not publicly available yet."]))

(rum/defc whiteboard-page
  [page-uuid block-id]
  (let [[ref bp] (use-breakpoint)
        page (db/entity [:block/uuid page-uuid])]
    [:div.absolute.w-full.h-full.whiteboard-page
     ;; makes sure the whiteboard will not cover the borders
     {:key (str page-uuid)
      :ref ref
      :data-breakpoint (name bp)
      :style {:padding "0.5px" :z-index 0
              :transform "translateZ(0)"
              :text-rendering "geometricPrecision"
              :-webkit-font-smoothing "subpixel-antialiased"}}

     [:div.whiteboard-page-title-root
      {:data-html2canvas-ignore true} ; excludes title component from image export
      [:div.whiteboard-page-title
       {:style {:color "var(--ls-primary-text-color)"
                :user-select "none"}}
       (page/page-title-cp page {:*hover? (atom false)})]

      (references-count (:block/uuid page) "text-md cursor-pointer" {})]
     (tldraw-app page-uuid block-id)]))

(rum/defc whiteboard-route <
  (shortcut/mixin :shortcut.handler/whiteboard false)
  [route-match]
  (let [page-uuid-str (get-in route-match [:parameters :path :name])
        {:keys [block-id]} (get-in route-match [:parameters :query])]
    (when (common-util/uuid-string? page-uuid-str)
      (whiteboard-page (uuid page-uuid-str) block-id))))

(rum/defc onboarding-welcome
  [close-fn]
  [:div.cp__whiteboard-welcome
   [:span.head-bg]

   [:h1.text-2xl.font-bold.flex-col.sm:flex-row
    (t :on-boarding/welcome-whiteboard-modal-title)]

   [:p (t :on-boarding/welcome-whiteboard-modal-description)]

   [:div.pt-6.flex.justify-center.space-x-2.sm:justify-end
    (ui/button (t :on-boarding/welcome-whiteboard-modal-skip)
               :on-click close-fn
               :background "gray"
               :class "opacity-60 skip-welcome")
    (ui/button (t :on-boarding/welcome-whiteboard-modal-start)
               :on-click (fn []
                           (quick-tour/ready
                            (fn []
                              (quick-tour/start-whiteboard)
                              (close-fn)))))]])
