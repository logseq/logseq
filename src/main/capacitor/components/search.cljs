(ns capacitor.components.search
  (:require [capacitor.ionic :as ion]
            [capacitor.nav :as nav]
            [capacitor.state :as state]
            [clojure.string :as string]
            [dommy.core :as dom]
            [frontend.components.cmdk.core :as cmdk]
            [frontend.search :as search]
            [frontend.state :as fstate]
            [frontend.ui :as ui]
            [logseq.shui.hooks :as hooks]
            [promesa.core :as p]
            [rum.core :as rum]))

(defn- search-blocks
  [input]
  (p/let [repo (fstate/get-current-repo)
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

(rum/defc search
  []
  (let [*ref (hooks/use-ref nil)
        [search-result set-search-result!] (hooks/use-state nil)]
    (ion/page
     {:id "search-tab"}
     (ion/header
      (ion/toolbar
       (ion/searchbar
        {:ref *ref
         :slot "start"
         :placeholder "Search"
         :on-ion-input (fn [^js e]
                         (let [input (.-value (.-detail e))]
                           (when-not (string/blank? input)
                             (p/let [result (search-blocks input)]
                               (set-search-result! result)))))})))
     (ion/content
      (ion/list
       (for [{:keys [icon text header source-page source-block]} search-result]
         (let [block (or source-page source-block)]
           (ion/item
            {:on-click (fn []
                         (state/set-tab! "home")
                         (.select (dom/sel1 "ion-tabs") "home")
                         (nav/nav-to-block! block {}))}
            [:div.flex.flex-col.gap-1.py-1
             (when header
               [:div.opacity-50.text-sm
                header])
             [:div.flex.flex-row.items-center.gap-1
              (when icon (ui/icon icon {:size 14
                                        :class "text-muted-foreground"}))
              [:div text]]]))))))))
