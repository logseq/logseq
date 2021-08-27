(ns frontend.components.command-palette
  (:require [frontend.handler.command-palette :as cp]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]))

(defn get-matched-commands [commands input]
  (search/fuzzy-search commands input :limit 7 :extract-fn :desc))

(defn render-command [{:keys [id desc shortcut]} chosen?]
  [:div
   {:class (when chosen? "chosen")}
   [:span (namespace id)]
   [:span desc]
   [:code shortcut]])

(rum/defcs command-palette <
  (shortcut/disable-all-shortcuts)
  (rum/local "" ::input)
  {:will-unmount (fn [state]
                   (state/set-state! :ui/command-palette-open? false)
                   state)}
  [state {:keys [commands]}]
  (let [input (::input state)]
    [:div#command-palette
     [:input.cp__command-palette-input
      {:type        "text"
       :placeholder "Type a command"
       :auto-focus   true
       :value       @input
       :on-change   (fn [e] (reset! input (util/evalue e)))}]
     (ui/auto-complete
      (get-matched-commands commands @input)
      {:item-render render-command
       :class       "cp__command-palette-results"
       :on-chosen   (fn [{:keys [action]}]
                      (state/set-state! :ui/command-palette-open? false)
                      (action))})]))


(rum/defc command-palette-modal < rum/reactive
  []
  (let [open? (state/sub :ui/command-palette-open?)]
    (when open?
      (state/set-modal! #(command-palette {:commands (cp/get-commands)})))
    nil))
