(ns frontend.handler.whiteboard
  (:require [clojure.string :as string]
            [frontend.db.model :as model]
            [frontend.db.utils :as db-utils]
            [frontend.modules.outliner.file :as outliner-file]
            [frontend.state :as state]
            [datascript.core :as d]))

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

(defonce default-tldr
  #js {:currentPageId "page1",
       :selectedIds #js [],
       :pages #js [#js {:id "page",
                        :name "Page",
                        :shapes #js [],
                        :bindings #js {},
                        :nonce 1}],
       :assets #js []})

(defn create-new-whiteboard-page!
  ([name]
   (model/transact-tldr! name default-tldr)
   (let [uuid (or (parse-uuid name) (d/squuid))
         entity (db-utils/entity [:block/name name])]
     (outliner-file/sync-to-file entity)
     (db-utils/transact! [{:db/id (:db/id entity) :block/uuid uuid}]))))
