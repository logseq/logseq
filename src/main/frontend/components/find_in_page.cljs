(ns frontend.components.find-in-page
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.handler.search :as search-handler]
            [goog.dom :as gdom]
            [goog.functions :refer [debounce]]
            [frontend.mixins :as mixins]))

(defn find-in-page!
  []
  (search-handler/electron-find-in-page!))

(defonce debounced-search (debounce find-in-page! 500))

(defn enter-to-search
  [e]
  (when (and (= (.-code e) "Enter")
             (not (state/editing?)))
    (let [shift? (.-shiftKey e)]
      (state/set-state! [:ui/find-in-page :backward?] shift?)
      (debounced-search))))

(rum/defc search-inner <
  (mixins/event-mixin
   (fn [state]
     (mixins/hide-when-esc-or-outside
      state
      :node (gdom/getElement "search-in-page")
      :on-hide (fn []
                 (search-handler/electron-exit-find-in-page!)))))
  [{:keys [matches searching? match-case? q]}]
  [:div#search-in-page.flex.flex-row.absolute.top-2.right-4.shadow-lg.px-2.py-1.faster-fade-in.items-center
   [:div.flex.w-48
    (when searching? (ui/loading nil))
    [:input#search-in-page-input.form-input.block.sm:text-sm.sm:leading-5.my-2.border-none.mr-4.outline-none
     {:auto-focus true
      :style {:visibility (when searching? "hidden")}
      :type (if searching? "password" "text")
      :placeholder "Find in page"
      :aria-label "Find in page"
      :value q
      :on-key-down enter-to-search
      :on-change (fn [e]
                   (let [value (util/evalue e)]
                     (state/set-state! [:ui/find-in-page :q] value)
                     
                       (debounced-search)))}]]
   [:div.px-4.text-sm.opacity-80
    (:activeMatchOrdinal matches 0)
    "/"
    (:matches matches 0)]

   (ui/button
    (ui/icon "letter-case")
    :on-click (fn []
                (state/update-state! [:ui/find-in-page :match-case?] not)
                (debounced-search))
    :intent "link"
    :small? true
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
