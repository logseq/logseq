(ns frontend.components.diff
  (:require [clojure.string :as string]
            [frontend.diff :as diff]
            [frontend.handler.file :as file]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [medley.core :as medley]
            [rum.core :as rum]))

(defonce disk-value (atom nil))
(defonce db-value (atom nil))

(rum/defc diff-cp
  [diff]
  [:div
   (for [[idx {:keys [added removed value]}] diff]
     (let [bg-color (cond
                      added "#057a55"
                      removed "#d61f69"
                      :else
                      "initial")]
       [:span.diff {:key idx
                    :style {:background-color bg-color}}
        value]))])

(rum/defcs local-file < rum/reactive
  {:will-unmount (fn [state]
                   (reset! disk-value nil)
                   (reset! db-value nil)
                   state)}
  [state repo path disk-content db-content]
  (when (nil? @disk-value)
    (reset! disk-value disk-content)
    (reset! db-value db-content))
  [:div.cp__diff-file
   [:div.cp__diff-file-header
    [:span.cp__diff-file-header-content.pl-1.font-medium
     (str "File " path " has been modified on the disk.")]]
   [:div.p-4
    (when (not= (string/trim disk-content) (string/trim db-content))
      (ui/foldable
       [:span.text-sm.font-medium.ml-1 "Check diff"]
       (fn []
         (let [local-content (or db-content "")
               content (or disk-content "")
               diff (medley/indexed (diff/diff local-content content))
               diff? (some (fn [[_idx {:keys [added removed]}]]
                             (or added removed))
                           diff)]
           (when diff?
             [:div.overflow-y-scroll.flex.flex-col
              [:div {:style {:max-height "65vh"}}
               (diff-cp diff)]])))
       {:default-collapsed? true
        :title-trigger? true}))

    [:hr]

    [:div.flex.flex-col.mt-4.sm:flex-row
     [:div.flex-1
      [:div.mb-2 "On disk:"]
      [:textarea.overflow-auto
       {:value (rum/react disk-value)
        :on-change (fn [e]
                     (reset! disk-value (util/evalue e)))}
       disk-content]
      (ui/button "Select this"
                 :on-click
                 (fn []
                   (when-let [value @disk-value]
                     (file/alter-file repo path value
                                      {:re-render-root? true
                                       :skip-compare? true}))
                   (state/close-modal!)))]

     [:div.flex-1.mt-8.sm:ml-4.sm:mt-0
      [:div.mb-2 "In Logseq:"]
      [:textarea.overflow-auto
       {:value (rum/react db-value)
        :on-change (fn [e]
                     (prn "new-value: " (util/evalue e))
                     (reset! db-value (util/evalue e)))}
       db-content]
      (ui/button "Select this"
                 :on-click
                 (fn []
                   (when-let [value @db-value]
                     (file/alter-file repo path value
                                      {:re-render-root? true
                                       :skip-compare? true}))
                   (state/close-modal!)))]]]])
