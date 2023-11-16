(ns logseq.shui.button.button-story
  (:require [logseq.shui.button.v2 :as shui-button]
            [logseq.shui.util :as shui-utils]
            [logseq.shui.ui :as ui]
            [rum.core :as rum]))

(rum/defc Button' []
  [:div.flex.items-center.justify-center

   (let [[open? set-open!] (rum/use-state false)
         [selected set-selected!] (rum/use-state nil)
         {:keys [toast]} (ui/use-toast)
         fruits ["🍎 Apple" "🍐 Pear"]]
     ;; debug dropdown
     (ui/dropdown-menu
       {:default-open open?}
       ;; trigger
       (ui/dropdown-menu-trigger
         {:as-child true}
         (ui/button
           {:variant  :outline
            :class    "space-x-1.5 group"
            :size     "sm"
            :on-click #(set-open! (not open?))}
           [:b (or selected "Pick a fruit")]
           [:b.opacity-50.group-active:opacity-100
            (ui/tabler-icon "selector")]))

       ;; dropdown menu content
       (ui/dropdown-menu-content {:class "w-56" :align :start}
         (ui/dropdown-menu-label "Fruits")
         (ui/dropdown-menu-separator)
         (for [it fruits
               :let [selected? (= selected it)]]
           (ui/dropdown-menu-checkbox-item
             {:key       it
              :checked   selected?
              :on-select (fn []
                           (let [*id (atom nil)]
                             (reset! *id
                               (toast {:title       it
                                       :variant     :a
                                       :description "this is description..."
                                       :action
                                       ;((rum/defc A' [] [:b "close"]))
                                       (ui/button
                                         {:size     :sm
                                          :variant  :destructive
                                          :on-click #(let [^js f (.-dismiss ^js @*id)] (f))}
                                         "Bye")})))
                           (set-selected! it))}
             [:span it]
             (ui/dropdown-menu-shortcut "⌘S"))))
       ))])

(def ^:export default
  #js {:title     "CLJS/Button"
       :component Button'
       :args      {:children (fn [] [:a "1"])}
       })

(def ^:export ShuiButton
  #js {:render
       (rum/defc ShuiButton' []
         [:<>
          ;; demo
          (Button')
          (ui/toaster-installer)])})





