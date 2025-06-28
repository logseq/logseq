(ns frontend.components.library
  "Library page"
  (:require [clojure.string :as string]
            [frontend.components.select :as components-select]
            [frontend.db :as db]
            [frontend.handler.editor :as editor-handler]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [logseq.db :as ldb]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [rum.core :as rum]))

(rum/defc select-pages
  [library-page]
  (let [[result set-result!] (hooks/use-state nil)
        [input set-input!] (hooks/use-state "")
        [selected-choices set-selected-choices!] (hooks/use-state #{})
        items (map (fn [block]
                     {:value (:db/id block)
                      :label (:block/title block)})
                   result)]
    (hooks/use-effect!
     (fn []
       (if (string/blank? input)
         (set-result! nil)
         (p/let [result (search/block-search (state/get-current-repo) input {:enable-snippet? false
                                                                             :built-in? false
                                                                             :page-only? true
                                                                             :library-page-search? true})]
           (set-result! result))))
     [(hooks/use-debounced-value input 200)])
    (components-select/select
     {:items items
      :extract-fn :label
      :extract-chosen-fn :value
      :selected-choices selected-choices
      :on-chosen (fn [chosen selected?]
                   (if selected?
                     (let [last-child (->> (:block/_parent (db/entity (:db/id library-page)))
                                           ldb/sort-by-order
                                           last)
                           target (or last-child library-page)
                           chosen-block (db/entity chosen)]
                       (editor-handler/move-blocks! [chosen-block] target (if last-child true false))
                       (set-selected-choices! (conj selected-choices chosen)))
                     (do
                       (db/transact! (state/get-current-repo)
                                     [[:db/retract chosen :block/parent]]
                                     {:outliner-op :save-block})
                       (set-selected-choices! (disj selected-choices chosen)))))
      :multiple-choices? true
      :input-default-placeholder "Add pages"
      :show-new-when-not-exact-match? false
      :on-input set-input!
      :input-opts {:class "!p-1 !text-sm"}
      :clear-input-on-chosen? false})))

(rum/defc add-pages
  [library-page]
  [:div.ls-add-pages.px-1.mt-4
   (shui/button
    {:variant :secondary
     :size :sm
     :class "text-muted-foreground hover:text-foreground"
     :on-click (fn [e]
                 (shui/popup-show!
                  (.-target e)
                  (fn []
                    [:div {:style {:min-height 120}}
                     (select-pages library-page)])
                  {:align :start}))}
    (ui/icon "plus" {:size 16})
    "Add existing pages to Library")])
