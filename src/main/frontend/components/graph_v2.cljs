(ns frontend.components.graph-v2
  (:require [frontend.components.graph-actions :as graph-actions]
            [frontend.context.i18n :refer [t]]
            [frontend.extensions.graph :as graph]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [logseq.shui.hooks :as hooks]
            [promesa.core :as p]
            [rum.core :as rum]))

(defn- mode-button
  [current-mode set-view-mode! mode]
  (let [active? (= current-mode mode)]
    (ui/button
     (if (= mode :all-pages)
       (t :graph/view-mode-all-pages)
       (t :graph/view-mode-tags-and-objects))
     :on-click #(set-view-mode! mode)
     :variant (if active? :default :outline)
     :class (str "graph-v2-mode-button" (when active? " is-active")))))

(defn- settings-panel
  [settings-open? set-settings-open! view-mode set-view-mode! graph-data metrics]
  (let [stats (when (and graph-data metrics)
                [:div.graph-v2-settings-stats
                 [:span (t :graph/node-count (count (:nodes graph-data)))]
                 [:span (t :graph/link-count (count (:links graph-data)))]
                 [:span (t :graph/render-time (js/Math.round (:render-ms metrics)))]])]
    [:div.graph-v2-settings
     {:class (when settings-open? "is-open")}
     [:button.graph-v2-settings-dot
      {:aria-label (t :graph/view-mode)
       :title (t :graph/view-mode)
       :on-click #(set-settings-open! (not settings-open?))}
      [:span.graph-v2-settings-dot-core]]
     (when settings-open?
       [:div.graph-v2-settings-panel
        [:div.graph-v2-settings-title (t :graph/view-mode)]
        (mode-button view-mode set-view-mode! :tags-and-objects)
        (mode-button view-mode set-view-mode! :all-pages)
        stats])]))

(rum/defc global-graph
  []
  (let [repo (state/get-current-repo)
        theme (state/sub :ui/theme)
        dark? (= theme "dark")
        [view-mode set-view-mode!] (hooks/use-state :tags-and-objects)
        [settings-open? set-settings-open!] (hooks/use-state false)
        [metrics set-metrics!] (hooks/use-state nil)
        [graph-data set-graph-data!] (hooks/use-state nil)
        [loading? set-loading!] (hooks/use-state true)
        switch-view-mode! (fn [mode]
                            (when (not= mode view-mode)
                              (set-metrics! nil)
                              (set-graph-data! nil)
                              (set-loading! true)
                              (set-view-mode! mode)))]
    (hooks/use-effect!
     (fn []
       (let [cancelled? (atom false)]
         (set-metrics! nil)
         (set-graph-data! nil)
         (set-loading! true)
         (-> (state/<invoke-db-worker :thread-api/build-graph repo {:type :global
                                                                    :theme theme
                                                                    :view-mode view-mode})
             (p/then (fn [result]
                       (when-not @cancelled?
                         (set-graph-data! result)
                         (set-loading! false))))
             (p/catch (fn [error]
                        (js/console.error "Failed to build graph" error)
                        (when-not @cancelled?
                          (set-loading! false)))))
         (fn []
           (reset! cancelled? true))))
     [repo theme view-mode])

    [:div#global-graph.graph-v2-root
     (settings-panel settings-open?
                     set-settings-open!
                     view-mode
                     switch-view-mode!
                     (when-not loading? graph-data)
                     (when-not loading? metrics))

     (if (or loading? (nil? graph-data))
       [:div.graph-v2-loading (t :graph/preparing)]
       (graph/graph-2d {:nodes (:nodes graph-data)
                        :links (:links graph-data)
                        :dark? dark?
                        :view-mode view-mode
                        :on-rendered set-metrics!
                        :on-node-activate graph-actions/activate-node!}))]))
