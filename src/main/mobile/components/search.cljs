(ns mobile.components.search
  "Mobile search"
  (:require [clojure.string :as string]
            [frontend.components.cmdk.core :as cmdk]
            [frontend.db :as db]
            [frontend.handler.block :as block-handler]
            [frontend.handler.search :as search-handler]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.db :as ldb]
            [logseq.shui.hooks :as hooks]
            [mobile.ionic :as ion]
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

(defn- get-recent-pages
  []
  (let [recent-pages (->> (ldb/get-recent-updated-pages (db/get-db))
                          (remove ldb/built-in?))]
    (map (fn [block]
           (let [text (block-handler/block-unique-title block)
                 icon (cmdk/get-page-icon block)]
             {:icon icon
              :icon-theme :gray
              :text text
              :source-block block}))
         recent-pages)))

(rum/defc search
  [*page]
  (let [*ref (hooks/use-ref nil)
        [input set-input!] (hooks/use-state "")
        [search-result set-search-result!] (hooks/use-state nil)
        [last-input-at set-last-input-at!] (hooks/use-state nil)
        [recents set-recents!] (hooks/use-state (search-handler/get-recents))
        result (if (string/blank? input)
                 (get-recent-pages)
                 search-result)]
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
    (ion/page
     {:id "search-tab"
      :ref *page}
     (ion/header
      (ion/toolbar
       (ion/searchbar
        {:ref *ref
         :slot "start"
         :placeholder "Search"
         :value input
         :on-ion-input (fn [^js e]
                         (let [input (.-value (.-detail e))]
                           (set-input! input)
                           (set-last-input-at! (util/time-ms))))})))
     (ion/content
      (when (string/blank? input)
        [:<>
         [:div.mb-4
          [:div.px-4.text-sm.text-muted-foreground.border-b
           [:div.flex.flex-item.items-center.justify-between
            [:div "Recent search"]
            (ion/button
             {:fill "clear"
              :size "small"
              :mode "ios"
              :class "text-muted-foreground"
              :on-click (fn []
                          (search-handler/clear-recents!)
                          (set-recents! nil))}
             "Clear all")]]
          (ion/list
           (for [item recents]
             (ion/item
              {:on-click #(set-input! item)}
              [:div.flex.flex-row.items-center.gap-1
               (ui/icon "search" {:size 15
                                  :class "text-muted-foreground"})
               item])))]

         [:div.px-4.py-2.text-sm.text-muted-foreground.border-b
          "Recent updates"]])
      (ion/list
       (for [{:keys [icon text header source-page source-block]} result]
         (let [block (or source-page source-block)]
           (ion/item
            {:on-click (fn []
                         (mobile-state/open-block-modal! block))}
            [:div.flex.flex-col.gap-1.py-1
             (when header
               [:div.opacity-50.text-sm
                header])
             [:div.flex.flex-row.items-start.gap-1
              (when icon (ui/icon icon {:size 15
                                        :class "text-muted-foreground mt-1"}))
              [:div text]]]))))))))
