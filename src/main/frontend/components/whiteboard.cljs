(ns frontend.components.whiteboard
  (:require [datascript.core :as d]
            [frontend.components.page :as page]
            [frontend.components.reference :as reference]
            [frontend.db.model :as model]
            [frontend.handler.route :as route-handler]
            [frontend.handler.whiteboard :as whiteboard-handler]
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

(rum/defc dashboard-card
  [page-name]
  [:div.rounded.text-lg.cursor-pointer.flex.flex-col.gap-1.overflow-hidden.dashboard-card
   {:on-mouse-down
    (fn [e]
      (util/stop e)
      (route-handler/redirect-to-whiteboard! page-name))}
   [:div.truncate.px-4.py-1.dashboard-card-title page-name]
   [:div.p-4.h-64.flex.justify-center
    (tldraw-preview page-name)]])

(rum/defc whiteboard-dashboard
  []
  (let [whiteboard-names (model/get-all-whiteboard-names (state/get-current-repo))]
    [:div.p-4
     (ui/button "Create new whiteboard"
                :small? true
                :on-click (fn [e]
                            (util/stop e)
                            (route-handler/redirect-to-whiteboard! (d/squuid) {:new? true})))
     [:div.gap-8.py-4.grid.grid-rows-auto.md:grid-cols-3.lg:grid-cols-4.grid-cols-1
      (for [whiteboard-name whiteboard-names]
        [:<> {:key whiteboard-name} (dashboard-card whiteboard-name)])]]))

(rum/defc whiteboard-references
  [name]
  (let [uuid (or (parse-uuid name) (:block/uuid (whiteboard-handler/get-whiteboard-entity name)))
        [show set-show] (rum/use-state false)]
    [:div.ml-2
     [:button.border.text-sm.bg-gray-500.text-white.px-2 {:on-click (fn [] (set-show not))} "references"]
     (when show (reference/block-linked-references uuid))]))

(rum/defc whiteboard-page
  [name block-id]
  [:div.absolute.w-full.h-full.whiteboard-page

   ;; makes sure the whiteboard will not cover the borders
   {:key name
    :style {:padding "0.5px" :z-index 0
            :transform "translateZ(0)"
            :text-rendering "geometricPrecision"
            :-webkit-font-smoothing "subpixel-antialiased"}}

   [:div.absolute.p-4.flex.items-start
    {:style {:z-index 2000}}
    [:span.inline-flex.color-level.text-xl.px-2
     {:style {:color "var(--ls-primary-text-color)"}}
     (page/page-title name [:<>
                            [:span.ti.ti-artboard
                             {:style {:font-size "0.9em"}}]]
                      name nil false)]

    (whiteboard-references name)]

   (tldraw-app name block-id)])

(rum/defc whiteboard-route
  [route-match]
  (let [name (get-in route-match [:parameters :path :name])
        {:keys [block-id]} (get-in route-match [:parameters :query])]
    (whiteboard-page name block-id)))
