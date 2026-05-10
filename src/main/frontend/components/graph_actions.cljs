(ns frontend.components.graph-actions
  (:require [frontend.db :as db]
            [frontend.handler.route :as route-handler]
            [frontend.state :as state]
            [logseq.shui.ui :as shui]))

(defn redirect-to-node!
  [node]
  (when-let [node-ref (or (:uuid node) (:block/uuid node))]
    (route-handler/redirect-to-page! node-ref)))

(defn open-node-in-sidebar!
  [node]
  (when-let [db-id (:db-id node)]
    (state/sidebar-add-block! (state/get-current-repo)
                              db-id
                              (if (:page? node) :page :block))))

(defn- node-preview-ref
  [node]
  (or (some-> (:uuid node) str)
      (some-> (:db-id node) db/entity :block/uuid str)
      (when (:page? node)
        (:label node))))

(defn preview-node!
  [node event]
  (when node
    (let [page-name (node-preview-ref node)
          page-preview-option (cond->
                                {:repo (state/get-current-repo)
                                 :page-name page-name
                                 :scroll-container (some-> js/document
                                                           (.querySelector ".ls-preview-popup"))
                                 :preview? true}
                                (:db-id node)
                                (assoc :db/id (:db-id node)))
          content (fn []
                    [:div.tippy-wrapper.as-page
                     {:tab-index -1
                      :style {:width "100%"
                              :max-height "min(760px, calc(100vh - 64px))"
                              :overflow "auto"
                              :text-align "left"
                              :font-weight "normal"
                              :padding-bottom 64}}
                     (when-let [page-cp (state/get-page-blocks-cp)]
                       (page-cp page-preview-option))])]
      (shui/popup-show! [(.-clientX event) (.-clientY event)]
                        content
                        {:id :graph-node-preview
                         :root-props {:modal false}
                         :content-props {:class "ls-preview-popup"
                                         :style {:width "min(1120px, calc(100vw - 16px))"
                                                 :max-width "none"
                                                 :color "var(--lx-gray-12, var(--ls-primary-text-color))"
                                                 :background-color "var(--lx-gray-01, var(--ls-primary-background-color))"}
                                         :onInteractOutside (fn [^js e] (.preventDefault e))}
                         :as-dropdown? false
                         :force-popover? true}))))

(defn activate-node!
  [node event]
  (if (.-shiftKey event)
    (open-node-in-sidebar! node)
    (redirect-to-node! node)))
