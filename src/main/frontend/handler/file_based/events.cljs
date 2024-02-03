(ns frontend.handler.file-based.events
  "Events that are only for file graphs"
  (:require [clojure.core.async :as async]
            [frontend.context.i18n :refer [t]]
            [frontend.handler.events :as events]
            [frontend.handler.page :as page-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.file-based.nfs :as nfs-handler]
            [frontend.fs.sync :as sync]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]))

(defmethod events/handle :graph/ask-for-re-index [[_ *multiple-windows? ui]]
  ;; *multiple-windows? - if the graph is opened in multiple windows, boolean atom
  ;; ui - custom message to show on asking for re-index
  (if (and (util/atom? *multiple-windows?) @*multiple-windows?)
    (events/handle
     [:modal/show
      [:div
       (when (not (nil? ui)) ui)
       [:p (t :re-index-multiple-windows-warning)]]])
    (events/handle
     [:modal/show
      [:div {:style {:max-width 700}}
       (when (not (nil? ui)) ui)
       [:p (t :re-index-discard-unsaved-changes-warning)]
       (ui/button
        (t :yes)
        :autoFocus "on"
        :class "ui__modal-enter"
        :on-click (fn []
                    (state/close-modal!)
                    (state/pub-event! [:graph/re-index])))]])))

(defmethod events/handle :graph/re-index [[_]]
  ;; Ensure the graph only has ONE window instance
  (async/go
    (async/<! (sync/<sync-stop))
    (repo-handler/re-index!
     nfs-handler/rebuild-index!
     #(do (page-handler/create-today-journal!)
          (events/file-sync-restart!)))))
