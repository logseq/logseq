(ns frontend.components.whiteboard
  (:require [datascript.core :as d]
            [frontend.components.page :as page]
            [frontend.db.model :as model]
            [frontend.handler.route :as route-handler]
            [frontend.handler.whiteboard :refer [create-new-whiteboard-page!
                                                 page-name->tldr]]
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
  [name]
  (let [loaded? (rum/react tldraw-loaded?)
        draw-component (when loaded?
                         (resolve 'frontend.extensions.tldraw/tldraw-app))]
    (when draw-component
      (draw-component name))))

(rum/defc tldraw-preview < rum/reactive
  {:init (fn [state]
           (p/let [_ (loader/load :tldraw)]
             (reset! tldraw-loaded? true))
           state)}
  [tldr]
  (let [loaded? (rum/react tldraw-loaded?)
        generate-preview (when loaded?
                           (resolve 'frontend.extensions.tldraw/generate-preview))]
    (when generate-preview
      (generate-preview tldr))))

(rum/defc dashboard-card
  [page-name]
  (let [tldr (page-name->tldr page-name)]
    [:div.rounded.text-lg.cursor-pointer.color-level.flex.flex-col.gap-1.overflow-hidden.dashboard-card
     {:on-mouse-down
      (fn [e]
        (util/stop e)
        (route-handler/redirect-to-whiteboard! page-name))}
     [:div.truncate.bg-white.px-4.py-1.dashboard-card-title page-name]
     [:div.p-4.h-64.flex.justify-center
      (tldraw-preview tldr)]]))

(rum/defc whiteboard-dashboard
  []
  (let [whiteboard-names (model/get-all-whiteboard-names (state/get-current-repo))]
    [:div.p-4
     (ui/button "Create new whiteboard"
                :small? true
                :on-click (fn [e]
                            (util/stop e)
                            (route-handler/redirect-to-whiteboard! (d/squuid) true)))
     [:div.gap-8.py-4.grid.grid-cols-4.grid-rows-auto
      (for [whiteboard-name whiteboard-names]
        [:<> {:key whiteboard-name} (dashboard-card whiteboard-name)])]]))

(rum/defc whiteboard
  [route-match]
  (let [name (get-in route-match [:parameters :path :name])
        new? (get-in route-match [:parameters :query :new?])]

    (rum/use-effect! (fn [_]
                       (when new? (create-new-whiteboard-page! name))
                       nil)
                     [name])

    [:div.absolute.w-full.h-full

     ;; makes sure the whiteboard will not cover the borders
     {:key name
      :style {:padding "0.5px" :z-index 0}}

     [:span.inline-flex.absolute.color-level.text-xl.m-2.px-2
      {:key name
       :style {:z-index 2000 :color "var(--ls-title-text-color, #222)"}}

      (page/page-title name [:<>
                             [:span.text-gray-500.ti.ti-artboard.mr-1
                              {:style {:font-size "0.9em"}}]]
                       name nil false)]

     (tldraw-app name)]))
