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
            [frontend.util :as util]
            [frontend.config :as config]
            [logseq.shui.ui :as shui]))

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
