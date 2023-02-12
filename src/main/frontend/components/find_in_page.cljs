(ns frontend.components.find-in-page
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.handler.search :as search-handler :refer [debounced-search, stop-debounced-search!]]
            [goog.object :as gobj]
            [goog.dom :as gdom]
            [frontend.mixins :as mixins]
            [clojure.string :as string]))

(rum/defc search-input
  [q matches]
  (let [*composing? (rum/use-ref false)
        on-change-fn (fn [e]
                       (let [value (util/evalue e)
                             e-type (gobj/getValueByKeys e "type")]
                         (state/set-state! [:ui/find-in-page :q] value)
                         (cond (= e-type "compositionstart")
                               (do (rum/set-ref! *composing? true)
                                   (stop-debounced-search!))

                               (= e-type "compositionend")
                               (rum/set-ref! *composing? false))
                         (when-not (rum/deref *composing?)
                           (debounced-search))))]
    [:div.flex.w-48.relative
     [:input#search-in-page-input.form-input.block.sm:text-sm.sm:leading-5.my-2.border-none.mr-4.outline-none
      {:auto-focus true
       :placeholder "Find in page"
       :aria-label "Find in page"
       :value q
       :on-composition-start on-change-fn
       :on-composition-end on-change-fn
       :on-change on-change-fn}]
     (when-not (string/blank? q)
       (when-let [total (:matches matches)]
         [:div.text-sm.absolute.top-2.right-0.py-2.px-4
          (:activeMatchOrdinal matches 0)
          "/"
          total]))
     [:div#search-in-page-placeholder.absolute.top-2.left-0.p-2.sm:text-sm]]))

(rum/defc search-inner < rum/static
  (mixins/event-mixin
   (fn [state]
     (mixins/hide-when-esc-or-outside
      state
      :node (gdom/getElement "search-in-page")
      :on-hide (fn []
                 (search-handler/electron-exit-find-in-page!)))))
  [{:keys [matches match-case? q]}]
  [:div#search-in-page.flex.flex-row.absolute.top-2.right-4.shadow-lg.px-2.py-1.faster-fade-in.items-center

   (search-input q matches)

   (ui/button
    (ui/icon "letter-case")
    :on-click (fn []
                (state/update-state! [:ui/find-in-page :match-case?] not)
                (debounced-search))
    :intent "link"
    :small? true
    :title "Match case"
    :class (str (when match-case? "active ") "text-lg"))

   (ui/button
    (ui/icon "caret-up")
    :on-click (fn []
                (state/set-state! [:ui/find-in-page :backward?] true)
                (debounced-search))
    :intent "link"
    :small? true
    :class "text-lg"
    :title "Previous result")

   (ui/button
    (ui/icon "caret-down")
    :on-click (fn []
                (state/set-state! [:ui/find-in-page :backward?] false)
                (debounced-search))
    :intent "link"
    :small? true
    :class "text-lg"
    :title "Next result")

   (ui/button
    (ui/icon "x")
    :on-click (fn []
                (search-handler/electron-exit-find-in-page!))
    :intent "link"
    :small? true
    :class "text-lg"
    :title "Close")])

(rum/defc search < rum/reactive
  []
  (let [{:keys [active?] :as opt} (state/sub :ui/find-in-page)]
    (when active?
      (search-inner opt))))
