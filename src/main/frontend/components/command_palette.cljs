(ns frontend.components.command-palette
  (:require [clojure.string :as str]
            [frontend.handler.command-palette :as cp]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]))

(defn get-matched-commands [commands input limit]
  (search/fuzzy-search commands input :limit limit :extract-fn :desc))

(defn render-command [{:keys [id desc shortcut]} chosen?]
  [:div.inline-grid.grid-cols-4.gap-x-4.w-full
   {:class (when chosen? "chosen")}
   [:span.col-span-3 desc]
   [:div.col-span-1.justify-end.tip.flex
    (when (and (keyword? id) (namespace id))
      [:code.opacity-20.bg-transparent (namespace id)])
    [:code.ml-1 shortcut]]])

(rum/defcs command-palette <
  (shortcut/disable-all-shortcuts)
  (rum/local "" ::input)
  {:will-unmount (fn [state]
                   (state/set-state! :ui/command-palette-open? false)
                   state)}
  [state {:keys [commands limit]
          :or {limit 10}}]
  (let [input (::input state)]
    [:div#command-palette.cp__command-palette-main
     [:input.cp__command-palette-input.w-full
      {:type        "text"
       :placeholder "Type a command"
       :auto-focus   true
       :value       @input
       :on-change   (fn [e] (reset! input (util/evalue e)))}]
     [:div.w-full
      (ui/auto-complete
       (if (str/blank? @input)
         (cp/top-commands limit)
         (get-matched-commands commands @input limit))
       {:item-render render-command
        :class       "cp__command-palette-results"
        :on-chosen   (fn [cmd] (cp/invoke-command cmd))})]]))

(rum/defc command-palette-modal < rum/reactive
  []
  (let [open? (state/sub :ui/command-palette-open?)]
    (if open?
      (state/set-modal!
       #(command-palette {:commands (cp/get-commands)})
       {:fullscreen? false
        :close-btn?  false})
      (state/close-modal!))
    nil))
