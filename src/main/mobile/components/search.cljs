(ns mobile.components.search
  "Mobile search"
  (:require [clojure.string :as string]
            [frontend.components.cmdk.core :as cmdk]
            [frontend.db.async :as db-async]
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
       (when-not (string/blank? input)
         (let [*timeout (atom nil)]
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
                        2000))))
           #(when-let [timeout @*timeout]
              (js/clearTimeout timeout)))))
     [(hooks/use-debounced-value input 150)])

    (hooks/use-effect!
     (fn []
       (if focused?
         (let [input (rum/deref *ref)
               scroll-cnt (some-> input (.closest ".app-silk-index-scroll-content") (.-parentNode))
               handle! (fn [] (some-> input (.blur)))]
           (.addEventListener scroll-cnt "scroll" handle!)
           #(.removeEventListener scroll-cnt "scroll" handle!))
         #()))
     [focused?])

    (hooks/use-effect!
     (fn []
       (js/setTimeout #(some-> (rum/deref *ref) (.focus)) 128)
       #())
     [])

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
         :auto-focus false
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
      (when (and (string/blank? input) (seq recents))
        [:div.mb-4
         [:div.px-4.text-sm.font-medium.text-muted-foreground
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
           [:div.px-2
            (ui/menu-link
             {:on-click #(set-input! item)}
             item)])])

      (if (seq result)
        [:ul.px-3
         {:class (when (and (not (string/blank? input))
                            (seq search-result))
                   "as-results")}
         (for [{:keys [page? icon text header source-block]} result]
           (let [block source-block]
             [:li.flex.gap-1
              {:on-click (fn []
                           (when-let [id (:block/uuid block)]
                             (p/let [block (db-async/<get-block (state/get-current-repo) id
                                                                {:children? false
                                                                 :skip-transact? true
                                                                 :skip-refresh? true})]
                               (when block (mobile-state/open-block-modal! block)))))}
              [:div.flex.flex-col.gap-1.py-1
               (when header
                 [:div.opacity-60.text-sm
                  header])
               [:div.flex.flex-row.items-start.gap-1
                (when (and page? icon) (ui/icon icon {:size 15
                                                      :class "text-muted-foreground mt-1"}))
                [:div text]]]]))]
        (when-not (string/blank? input)
          [:div.px-4.text-muted-foreground
           "No results"]))]]))
