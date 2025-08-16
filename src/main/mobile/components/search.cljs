(ns mobile.components.search
  "Mobile search"
  (:require [clojure.string :as string]
            [frontend.components.cmdk.core :as cmdk]
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
                          (cmdk/page-item repo block)
                          (cmdk/block-item repo block nil input))) blocks)]
    items))

(rum/defc ^:large-vars/cleanup-todo search
  []
  (let [*ref (hooks/use-ref nil)
        [input set-input!] (hooks/use-state "")
        [focused? set-focused?] (hooks/use-state false)
        [search-result set-search-result!] (hooks/use-state nil)
        [last-input-at set-last-input-at!] (hooks/use-state nil)
        [recents set-recents!] (hooks/use-state (search-handler/get-recents))
        result search-result
        clear! (fn []
                 (set-input! "")
                 (set-search-result! nil))]

    (hooks/use-effect!
     (fn []
       (let [*timeout (atom nil)]
         (when-not (string/blank? input)
           (p/let [result (search-blocks input)]
             (set-search-result! result)
             (when (seq result)
               (reset! *timeout
                       (js/setTimeout
                        (fn []
                          (let [now (util/time-ms)]
                            (when (and last-input-at (>= (- now last-input-at) 2000))
                              (search-handler/add-recent! input)
                              (set-recents! (search-handler/get-recents)))))
                        2000)))))
         #(when-let [timeout @*timeout]
            (js/clearTimeout timeout))))
     [(hooks/use-debounced-value input 150)])

    [:div.app-silk-search-page
     [:div.hd
      {:class (when (or focused?
                        (not (string/blank? input)))
                "input-focused")}
      [:div.relative
       (shui/tabler-icon "search")
       (shui/input
        {:ref *ref
         :placeholder "Search"
         :value input
         :on-focus #(set-focused? true)
         :on-blur #(set-focused? false)
         :on-change (fn [^js e]
                      (let [input (.-value (.-target e))]
                        (set-input! input)
                        (set-last-input-at! (util/time-ms))))})]
      (shui/button
       {:class "cancel"
        :variant :text
        :on-pointer-down
        (fn [e]
          (util/stop e)
          (some-> (rum/deref *ref) (.blur))
          (util/schedule #(clear!)))}
       "Cancel")
      (when-not (string/blank? input)
        [:a.x {:on-click (fn []
                           (clear!)
                           (some-> (rum/deref *ref) (.focus)))}
         (shui/tabler-icon "x" {:size 14})])]

     [:div.bd
      (when (string/blank? input)
        [:<>
         [:div.mb-4
          [:div.px-4.text-sm.text-muted-foreground.border-b
           [:div.flex.flex-item.items-center.justify-between.py-1
            "Recent search"
            (when (seq recents)
              (shui/button
               {:variant :text
                :size :sm
                :class "text-muted-foreground flex justify-end pr-1"
                :on-click (fn []
                            (search-handler/clear-recents!)
                            (set-recents! nil))}
               "Clear all"))]]

          [:ul.px-3
           (for [item recents]
             [:li.flex.gap-1
              {:on-click #(set-input! item)}
              item])]]])

      [:ul.px-3
       {:class (when (and (not (string/blank? input))
                          (seq search-result))
                 "as-results")}
       (for [{:keys [icon text header source-page source-block]} result]
         (let [block (or source-page source-block)]
           [:li.flex.gap-1
            {:on-click (fn []
                         (mobile-state/open-block-modal! block))}
            [:div.flex.flex-col.gap-1.py-1
             (when header
               [:div.opacity-50.text-sm
                header])
             [:div.flex.flex-row.items-start.gap-1
              (when icon (ui/icon icon {:size 15
                                        :class "text-muted-foreground mt-1"}))
              [:div text]]]]))]]]))
