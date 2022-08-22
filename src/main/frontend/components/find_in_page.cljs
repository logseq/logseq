(ns frontend.components.find-in-page
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.handler.search :as search-handler]
            [goog.dom :as gdom]
            [goog.functions :refer [debounce]]
            [frontend.mixins :as mixins]
            [clojure.string :as string]))

(defn focus-input!
  []
  (when-let [element ^js (gdom/getElement "search-in-page-input")]
    (.focus element)))

(defn find-in-page!
  []
  (search-handler/electron-find-in-page! focus-input!))

(defonce debounced-search (debounce find-in-page! 500))

(defn- enter-to-search
  [e]
  (when (and (= (.-code e) "Enter")
             (not (state/editing?)))
    (let [shift? (.-shiftKey e)]
      (state/set-state! [:ui/find-in-search :backward?] shift?)
      (search-handler/electron-find-in-page!))))

(rum/defc search-inner <
  {:did-mount (fn [state]
                (js/document.addEventListener "keyup" enter-to-search)
                state)
   :will-unmount (fn [state]
                   (js/document.removeEventListener "keyup" enter-to-search)
                   state)}
  (mixins/event-mixin
   (fn [state]
     (mixins/hide-when-esc-or-outside
      state
      :node (gdom/getElement "search-in-page")
      :on-hide (fn []
                 (search-handler/electron-exit-find-in-page!)))))
  [{:keys [q backward?]}]
  [:div#search-in-page.flex.flex-row.absolute.top-2.right-4.shadow-lg.px-2.py-1.faster-fade-in
   [:div.flex
    [:input#search-in-page-input.form-input.block.w-48.sm:text-sm.sm:leading-5.my-2.border-none.mr-4.outline-none
     {:auto-focus true
      :placeholder "Find in page"
      :on-change (fn [e]
                   (let [value (util/evalue e)]
                     (state/set-state! [:ui/find-in-search :q] value)
                     (debounced-search)))}]]
   (ui/button
     (ui/icon "caret-up" {:style {:font-size 18}})
     :on-click (fn []
                 (state/set-state! [:ui/find-in-search :backward?] true)
                 (search-handler/electron-find-in-page!))
     :intent "link"
     :small? true)

   (ui/button
     (ui/icon "caret-down" {:style {:font-size 18}})
     :on-click (fn []
                 (state/set-state! [:ui/find-in-search :backward?] false)
                 (search-handler/electron-find-in-page!))
     :intent "link"
     :small? true)

   (ui/button
     [:span.px-1 "X"]
     :on-click (fn []
                 (search-handler/electron-exit-find-in-page!))
     :intent "link"
     :small? true)])

(rum/defc search < rum/reactive
  []
  (let [{:keys [active?] :as opt} (state/sub :ui/find-in-search)]
    (when active?
      (search-inner opt))))
