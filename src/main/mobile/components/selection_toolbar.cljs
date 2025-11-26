(ns mobile.components.selection-toolbar
  "Selection action bar, activated when swipe on a block"
  (:require [frontend.db :as db]
            [frontend.handler.editor :as editor-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.util.url :as url-util]
            [logseq.shui.hooks :as hooks]
            [rum.core :as rum]))

(defn- dismiss-action-bar!
  []
  (.dismiss ^js mobile-util/native-selection-action-bar))

(defn close-selection-bar!
  []
  (dismiss-action-bar!)
  (state/set-state! :mobile/show-action-bar? false)
  (editor-handler/clear-selection!))

(defn- selected-block-ids
  []
  (->> (state/get-selection-block-ids)
       (keep (fn [id]
               (some-> (db/entity [:block/uuid id])
                       :block/uuid)))))

(defn- selection-actions
  []
  (let [close! close-selection-bar!]
    [{:id "copy"
      :label "Copy"
      :icon "copy"
      :system-icon "doc.on.doc"
      :handler (fn []
                 (editor-handler/copy-selection-blocks false)
                 (close!))}
     {:id "delete"
      :label "Delete"
      :icon "cut"
      :system-icon "trash"
      :handler (fn []
                 (editor-handler/cut-selection-blocks false {:mobile-action-bar? true})
                 (close!))}
     {:id "copy-ref"
      :label "Copy ref"
      :icon "registered"
      :system-icon "r.square"
      :handler (fn []
                 (editor-handler/copy-block-refs)
                 (close!))}
     {:id "copy-url"
      :label "Copy url"
      :icon "link"
      :system-icon "link"
      :handler (fn []
                 (let [current-repo (state/get-current-repo)
                       tap-f (fn [block-id]
                               (url-util/get-logseq-graph-uuid-url nil current-repo block-id))]
                   (when-let [block-id (first (selected-block-ids))]
                     (editor-handler/copy-block-ref! block-id tap-f)))
                 (close!))}
     {:id "unselect"
      :label "Unselect"
      :icon "x"
      :system-icon "xmark"
      :handler (fn []
                 (state/clear-selection!)
                 (close!))}]))

(rum/defc action-bar
  []
  (let [actions (selection-actions)
        handlers-ref (hooks/use-ref nil)]
    (set! (.-current handlers-ref) (into {} (map (juxt :id :handler) actions)))

    (hooks/use-effect!
     (fn []
       (when (and (mobile-util/native-ios?)
                  mobile-util/native-selection-action-bar)
         (let [listener (.addListener ^js mobile-util/native-selection-action-bar
                                      "action"
                                      (fn [^js e]
                                        (when-let [id (.-id e)]
                                          (prn :debug :id id
                                               :handler (.-current handlers-ref))
                                          (when-let [handler (get (.-current handlers-ref) id)]
                                            (handler)))))
               actions' {:actions (map (fn [{:keys [id label system-icon]}]
                                         {:id id
                                          :title label
                                          :systemIcon system-icon})
                                       actions)}]
           (.present ^js mobile-util/native-selection-action-bar (clj->js actions'))
           (fn []
             (dismiss-action-bar!)
             (cond
               (and listener (.-remove listener)) ((.-remove listener))
               listener (.then listener (fn [^js handle] (.remove handle))))))))
     [])

    [:<>]))
