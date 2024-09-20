(ns frontend.handler.file-based.events
  "Events that are only for file graphs"
  (:require [clojure.core.async :as async]
            [clojure.set :as set]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.handler.events :as events]
            [frontend.handler.page :as page-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.file-based.nfs :as nfs-handler]
            [frontend.handler.common :as common-handler]
            [frontend.handler.property :as property-handler]
            [frontend.fs.sync :as sync]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.config :as config]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(defmethod events/handle :graph/ask-for-re-index [[_ *multiple-windows? ui]]
  ;; *multiple-windows? - if the graph is opened in multiple windows, boolean atom
  ;; ui - custom message to show on asking for re-index
  (if (and (util/atom? *multiple-windows?) @*multiple-windows?)
    (shui/dialog-open!
      [:div
       (when (not (nil? ui)) ui)
       [:p (t :re-index-multiple-windows-warning)]])

    (shui/dialog-open!
      [:div {:style {:max-width 700}}
       (when (not (nil? ui)) ui)
       [:p (t :re-index-discard-unsaved-changes-warning)]
       [:div.flex.justify-end.pt-2
        (ui/button
          (t :yes)
          :autoFocus "on"
          :class "ui__modal-enter"
          :on-click (fn []
                      (shui/dialog-close!)
                      (state/pub-event! [:graph/re-index])))]])))

(defmethod events/handle :graph/re-index [[_]]
  ;; Ensure the graph only has ONE window instance
  (when (config/local-file-based-graph? (state/get-current-repo))
    (async/go
     (async/<! (sync/<sync-stop))
     (repo-handler/re-index!
      nfs-handler/rebuild-index!
      #(do (page-handler/create-today-journal!)
           (events/file-sync-restart!))))))

(defn set-block-query-properties!
  [block-id all-properties key add?]
  (when-let [block (db/entity [:block/uuid block-id])]
    (let [query-properties (get-in block [:block/properties :query-properties])
          repo (state/get-current-repo)
          query-properties (some-> query-properties
                                   (common-handler/safe-read-string "Parsing query properties failed"))
          query-properties (if (seq query-properties)
                             query-properties
                             all-properties)
          query-properties (if add?
                             (distinct (conj query-properties key))
                             (remove #{key} query-properties))
          query-properties (vec query-properties)]
      (if (seq query-properties)
        (property-handler/set-block-property! repo block-id
                                              :query-properties
                                              (str query-properties))
        (property-handler/remove-block-property! repo block-id :query-properties)))))

(defonce *query-properties (atom {}))
(rum/defc query-properties-settings-inner < rum/reactive
  {:will-unmount (fn [state]
                   (reset! *query-properties {})
                   state)}
  [block shown-properties all-properties]
  (let [query-properties (rum/react *query-properties)]
    [:div
     [:h1.font-semibold.-mt-2.mb-2.text-lg (t :query/config-property-settings)]
     [:a.flex
      {:title "Refresh list of columns"
       :on-click
       (fn []
         (reset! *query-properties {})
         (property-handler/remove-block-property! (state/get-current-repo) (:block/uuid block) :query-properties))}
      (ui/icon "refresh")]
     (for [property all-properties]
       (let [property-value (get query-properties property)
             shown? (if (nil? property-value)
                      (contains? shown-properties property)
                      property-value)]
         [:div.flex.flex-row.my-2.justify-between.align-items
          [:div (name property)]
          [:div.mt-1 (ui/toggle shown?
                                (fn []
                                  (let [value (not shown?)]
                                    (swap! *query-properties assoc property value)
                                    (set-block-query-properties!
                                     (:block/uuid block)
                                     all-properties
                                     property
                                     value)))
                                true)]]))]))

(defn query-properties-settings
  [block shown-properties all-properties]
  (fn [_close-fn]
    (query-properties-settings-inner block shown-properties all-properties)))

(defmethod events/handle :modal/set-query-properties [[_ block all-properties]]
  (let [query-properties (get-in block [:block/properties :query-properties])
        block-properties (some-> query-properties
                                 (common-handler/safe-read-string "Parsing query properties failed"))
        shown-properties (if (seq block-properties)
                           (set block-properties)
                           (set all-properties))
        shown-properties (set/intersection (set all-properties) shown-properties)]
    (shui/dialog-open!
      (query-properties-settings block shown-properties all-properties)
      {})))
