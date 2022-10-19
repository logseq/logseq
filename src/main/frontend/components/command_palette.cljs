(ns frontend.components.command-palette
  (:require [frontend.handler.command-palette :as cp]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.modules.shortcut.data-helper :as shortcut-helper]
            [frontend.context.i18n :refer [t]]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]
            [clojure.string :as string]))

(defn translate [t {:keys [id desc]}]
  (when id
    (let [desc-i18n (t (shortcut-helper/decorate-namespace id))]
      (if (string/starts-with? desc-i18n "{Missing key")
        desc
        desc-i18n))))

(defn get-matched-commands [commands input limit t]
  (search/fuzzy-search commands input :limit limit :extract-fn (partial translate t)))

(rum/defc render-command
  [{:keys [id shortcut] :as cmd} chosen?]
  (let [first-shortcut (first (string/split shortcut #" \| "))
        desc (translate t cmd)]
    [:div.inline-grid.grid-cols-4.gap-x-4.w-full
     {:class (when chosen? "chosen")}
     [:span.col-span-3 desc]
     [:div.col-span-1.justify-end.tip.flex
      (when (and (keyword? id) (namespace id))
        [:code.opacity-40.bg-transparent (namespace id)])
      (when-not (string/blank? first-shortcut)
        [:code.ml-1 first-shortcut])]]))

(rum/defcs command-palette <
  (shortcut/disable-all-shortcuts)
  (rum/local "" ::input)
  {:will-unmount (fn [state]
                   (state/set-state! :ui/command-palette-open? false)
                   state)}
  [state {:keys [commands limit]
          :or {limit 100}}]
  (let [input (::input state)]
    [:div.cp__palette.cp__palette-main
     [:div.input-wrap
      [:input.cp__palette-input.w-full
       {:type        "text"
        :placeholder (t :command-palette/prompt)
        :auto-focus  true
        :value       @input
        :on-change   (fn [e] (reset! input (util/evalue e)))}]]

     [:div.command-results-wrap
      (ui/auto-complete
       (if (string/blank? @input)
         (cp/top-commands limit)
         (get-matched-commands commands @input limit t))
       {:item-render render-command
        :class       "cp__palette-results"
        :on-chosen   (fn [cmd] (cp/invoke-command cmd))})]]))

(rum/defc command-palette-modal < rum/reactive
  []
  (let [open? (state/sub :ui/command-palette-open?)]
    (when open?
      (state/set-modal!
       #(command-palette {:commands (cp/get-commands)})
       {:fullscreen? false
        :close-btn?  false}))
    nil))
