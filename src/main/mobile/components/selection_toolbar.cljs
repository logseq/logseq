(ns mobile.components.selection-toolbar
  "Selection action bar, activated when swipe on a block"
  (:require [frontend.components.block.comments-model :as comments-model]
            [frontend.db :as db]
            [frontend.context.i18n :refer [t]]
            [frontend.handler.comments :as comments-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.mobile.haptics :as haptics]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.util.url :as url-util]
            [logseq.shui.hooks :as hooks]
            [io.factorhouse.hsx.core :as hsx]))

(defn- dismiss-action-bar!
  []
  (when-let [plugin ^js mobile-util/native-selection-action-bar]
    (.dismiss plugin)))

(defn close-selection-bar!
  []
  (dismiss-action-bar!)
  (state/set-state! :mobile/show-action-bar? false)
  (editor-handler/clear-selection!))

(defn- selected-blocks
  []
  (->> (state/get-selection-block-ids)
       (keep (fn [id]
               (db/entity [:block/uuid id])))))

(defn- selection-actions
  []
  (let [close! close-selection-bar!
        blocks (selected-blocks)
        first-block-id (:block/uuid (first blocks))
        reaction-blocks (mapv #(select-keys % [:block/uuid]) blocks)
        selection-target (first (state/get-selection-blocks))
        comment-targets (comments-model/comment-target-blocks blocks)]
    (vec
     (concat
      [{:id "copy"
        :label (t :ui/copy)
        :system-icon "doc.on.doc"
        :handler (fn []
                   (editor-handler/copy-selection-blocks false)
                   (close!))}
       {:id "outdent"
        :label (t :mobile.toolbar/outdent)
        :system-icon "arrow.left"
        :handler (fn []
                   (editor-handler/on-tab :left))}
       {:id "indent"
        :label (t :mobile.toolbar/indent)
        :system-icon "arrow.right"
        :handler (fn []
                   (editor-handler/on-tab :right))}]
      (when (seq comment-targets)
        [{:id "comment"
          :label (t :mobile.toolbar/comment)
          :system-icon "text.bubble"
          :handler (fn []
                     (comments-handler/add-comment-to-blocks! comment-targets)
                     (close!))}])
      (when (and (seq reaction-blocks) selection-target)
        [{:id "reaction"
          :label (t :mobile.toolbar/reaction)
          :system-icon "face.smiling"
          :handler (fn []
                     (let [opts (if (= 1 (count reaction-blocks))
                                  {:block (first reaction-blocks)
                                   :target selection-target}
                                  {:blocks reaction-blocks
                                   :target selection-target})]
                       (state/pub-event! [:editor/new-reaction opts]))
                     (close!))}])
      [{:id "delete"
        :label (t :ui/delete)
        :system-icon "trash"
        :handler (fn []
                   (editor-handler/cut-selection-blocks false {:mobile-action-bar? true})
                   (close!))}
       {:id "copy-ref"
        :label (t :mobile.toolbar/copy-ref)
        :system-icon "r.square"
        :handler (fn []
                   (editor-handler/copy-block-refs)
                   (close!))}
       {:id "copy-url"
        :label (t :mobile.toolbar/copy-url)
        :system-icon "link"
        :handler (fn []
                   (let [current-repo (state/get-current-repo)
                         tap-f (fn [block-id]
                                 (url-util/get-logseq-graph-uuid-url nil current-repo block-id))]
                     (when first-block-id
                       (editor-handler/copy-block-ref! first-block-id tap-f)))
                   (close!))}
       {:id "unselect"
        :label (t :mobile.toolbar/unselect)
        :system-icon "xmark"
        :handler (fn []
                   (state/clear-selection!)
                   (close!))}]))))

(hsx/defc action-bar
  []
  (let [actions (selection-actions)
        action-ids (mapv :id actions)
        handlers-ref (hooks/use-ref nil)]
    (set! (.-current handlers-ref) (into {} (map (juxt :id :handler) actions)))

    (hooks/use-effect!
     (fn []
       (when (and (mobile-util/native-platform?)
                  mobile-util/native-selection-action-bar)
         (let [listener (.addListener ^js mobile-util/native-selection-action-bar
                                      "action"
                                      (fn [^js e]
                                        (when-let [id (.-id e)]
                                          (when-let [handler (get (.-current handlers-ref) id)]
                                            (haptics/haptics)
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
     [action-ids])

    [:<>]))
