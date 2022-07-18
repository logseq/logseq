(ns frontend.handler.whiteboard
  (:require [frontend.state :as state]
            [frontend.db :as db]
            [clojure.string :as string]))

;; FIXME: embed /draw should be supported too
(defn whiteboard-mode?
  []
  (= (state/get-current-route) :whiteboard))

(defn create-page!
  [page-title]
  (when-let [app ^js (state/get-current-whiteboard)]
    (when-not (string/blank? page-title)
      (.createShapes app (clj->js
                          [{:id (str "logseq-portal-" page-title)
                            :type "logseq-portal"
                            :pageId page-title}])))))

(defn set-linked-page-or-block!
  [page-or-block-id]
  (when-let [app ^js (state/get-current-whiteboard)]
    (let [shapes (:whiteboard/linked-shapes @state/state)]
      (when (and (seq shapes) page-or-block-id)
        (let [fs (first shapes)]
          (.updateShapes app (clj->js
                              [{:id (.-id fs)
                                :logseqLink page-or-block-id}])))))))

;; (set! (. js/window -foo) (page-name->tldr "edn-test"))
