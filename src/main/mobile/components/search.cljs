(ns mobile.components.search
  "Mobile search"
  (:require [clojure.string :as string]
            [frontend.components.cmdk.core :as cmdk]
            [frontend.handler.route :as route-handler]
            [frontend.handler.search :as search-handler]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [mobile.state :as mobile-state]
            [promesa.core :as p]
            [rum.core :as rum]))

(defn- search-blocks
  [input]
  (p/let [repo (state/get-current-repo)
          blocks (search/block-search repo input
                                      {:limit 100 :built-in? true})
          blocks (remove nil? blocks)
          blocks (search/fuzzy-search blocks input {:limit 100
                                                    :extract-fn :block/title})
          items (keep (fn [block]
                        (if (:page? block)
                          (assoc (cmdk/page-item repo block) :page? true)
                          (cmdk/block-item repo block nil input))) blocks)]
    items))

(rum/defc ^:large-vars/cleanup-todo search
  []
  (let [[input set-input!] (mobile-state/use-search-input)
        [search-result set-search-result!] (hooks/use-state nil)
        [last-input-at _set-last-input-at!] (mobile-state/use-search-last-input-at)
        [recents set-recents!] (hooks/use-state (search-handler/get-recents))
        result search-result]

    (hooks/use-effect!
     (fn []
       (when-not (string/blank? input)
         (let [*timeout (atom nil)]
           (p/let [result (search-blocks input)]
             (set-search-result! (or result []))
             (when (seq result)
               (reset! *timeout
                       (js/setTimeout
                        (fn []
                          (let [now (util/time-ms)]
                            (when (and last-input-at (>= (- now last-input-at) 2000))
                              (search-handler/add-recent! input)
                              (set-recents! (search-handler/get-recents)))))
                        2000))))
           #(when-let [timeout @*timeout]
              (js/clearTimeout timeout)))))
     [(hooks/use-debounced-value input 150)])

    [:div.app-search
     (when (and (string/blank? input) (seq recents))
       [:div
        [:div.px-2.font-medium.text-muted-foreground
         [:div.flex.flex-item.items-center.justify-between.mt-2
          "Recent"
          (shui/button
           {:variant :text
            :size :sm
            :class "text-muted-foreground flex justify-end pr-1"
            :on-click (fn []
                        (search-handler/clear-recents!)
                        (set-recents! nil))}
           "Clear")]]

        (for [item recents]
          [:div
           (ui/menu-link
            {:on-click #(set-input! item)}
            item)])])
     (if (seq result)
       [:ul
        {:class (when (and (not (string/blank? input))
                           (seq search-result))
                  "as-results")}
        (for [{:keys [page? icon text header source-block]} result]
          (let [block source-block]
            [:li.flex.gap-1
             {:on-click (fn []
                          (when-let [id (:block/uuid block)]
                            (route-handler/redirect-to-page! (str id))))}
             [:div.flex.flex-col.gap-1.py-1
              (when header
                [:div.opacity-60
                 header])
              [:div.flex.flex-row.items-start.gap-1
               (when (and page? icon) (ui/icon icon {:size 15
                                                     :class "text-muted-foreground mt-1"}))
               [:div text]]]]))]
       (when (= result [])
         (when-not (string/blank? input)
           [:div.font-medium.text-muted-foreground
            "No results"])))]))
