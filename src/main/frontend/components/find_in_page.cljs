(ns frontend.components.find-in-page
  (:require [frontend.context.i18n :refer [t]]
            [frontend.ui :as ui]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.handler.search :as search-handler :refer [debounced-search, stop-debounced-search!]]
            [goog.object :as gobj]
            [goog.dom :as gdom]
            [io.factorhouse.hsx.core :as hsx]
            [logseq.shui.hooks :as hooks]
            [clojure.string :as string]))

(hsx/defc search-input
  [q matches]
  (let [*composing? (hooks/use-ref false)
        on-change-fn (fn [e]
                       (let [value (util/evalue e)
                             e-type (gobj/getValueByKeys e "type")]
                         (state/set-state! [:ui/find-in-page :q] value)
                         (cond (= e-type "compositionstart")
                               (do (hooks/set-ref! *composing? true)
                                   (stop-debounced-search!))

                               (= e-type "compositionend")
                               (hooks/set-ref! *composing? false))
                         (when-not (hooks/deref *composing?)
                           (debounced-search))))]
    [:div.flex.w-48.relative
     [:input#search-in-page-input.form-input.block.sm:text-sm.sm:leading-5.my-2.border-none.mr-4.outline-none
      {:auto-focus true
       :placeholder (t :search.find-in-page/input-placeholder)
       :aria-label (t :search.find-in-page/input-placeholder)
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

(hsx/defc search-inner
  [{:keys [matches match-case? q]}]
  (hooks/use-effect!
   (fn []
     (let [hide! (fn [_e] (search-handler/electron-exit-find-in-page!))
           key-handler (fn [e]
                         (when (= 27 (.-keyCode e))
                           (hide! e)))
           mouse-handler (fn [e]
                           (let [node (gdom/getElement "search-in-page")
                                 target (.-target e)]
                             (when (and node
                                        (not (gdom/contains node target))
                                        (not (.contains (.-classList target)
                                                        "ignore-outside-event")))
                               (hide! e))))]
       (.addEventListener js/window "keydown" key-handler)
       (.addEventListener js/window "mousedown" mouse-handler)
       #(do
          (.removeEventListener js/window "keydown" key-handler)
          (.removeEventListener js/window "mousedown" mouse-handler))))
   [])
  [:div#search-in-page.flex.flex-row.absolute.top-10.right-4.shadow-lg.px-2.py-1.faster.fade-in.items-center

   (search-input q matches)

   (ui/button
    (ui/icon "letter-case")
    :on-click (fn []
                (state/update-state! [:ui/find-in-page :match-case?] not)
                (debounced-search))
    :intent "link"
    :small? true
      :title (t :search.find-in-page/match-case)
    :class (str (when match-case? "active ") "text-lg"))

   (ui/button
    (ui/icon "caret-up")
    :on-click (fn []
                (state/set-state! [:ui/find-in-page :backward?] true)
                (debounced-search))
    :intent "link"
    :small? true
    :class "text-lg"
    :title (t :search.find-in-page/previous-result))

   (ui/button
    (ui/icon "caret-down")
    :on-click (fn []
                (state/set-state! [:ui/find-in-page :backward?] false)
                (debounced-search))
    :intent "link"
    :small? true
    :class "text-lg"
    :title (t :search.find-in-page/next-result))

   (ui/button
    (ui/icon "x")
    :on-click (fn []
                (search-handler/electron-exit-find-in-page!))
    :intent "link"
    :small? true
    :class "text-lg"
    :title (t :ui/close))])

(hsx/defc search
  []
  (let [{:keys [active?] :as opt} (state/use-sub :ui/find-in-page)]
    (when active?
      (search-inner opt))))
