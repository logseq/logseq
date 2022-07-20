(ns frontend.handler.whiteboard
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [frontend.db.model :as model]
            [frontend.db.utils :as db-utils]
            [frontend.modules.outliner.file :as outliner-file]
            [frontend.state :as state]))

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

(defn- block->shape [block]
  (let [properties (:block/properties block)
        uuid (str (:block/uuid block))]
    (merge properties
           ;; Use the block's id as the shape's id.
           {:id uuid})))

(defn- get-shape-refs [shape]
  (when (= "logseq-portal" (:type shape))
    [(select-keys (model/get-page (:pageId shape)) [:db/id])]))

(defn- shape->block [shape page-name]
  (let [properties shape
        block {:block/uuid (uuid (:id properties))
               :block/page {:block/name page-name}
               :block/content "" ;; give it empty string since some block utility requires it
               :block/properties properties}
        refs (get-shape-refs shape)]
    (merge block (when refs {:block/refs refs}))))

(defn- tldr-page->blocks-tx [page-name tldr-data]
  (let [page-block {:block/name page-name
                    :block/whiteboard? true
                    :block/properties (dissoc tldr-data :shapes)}
        existing-blocks (model/get-page-blocks-no-cache page-name)
        blocks (mapv #(shape->block % page-name) (:shapes tldr-data))
        block-ids (set (map :block/uuid blocks))
        delete-shapes (filter (fn [shape]
                                (not (block-ids (:block/uuid shape))))
                              existing-blocks)
        delete-shapes-tx (mapv (fn [s] [:db/retractEntity (:db/id s)]) delete-shapes)]
    (concat [page-block] blocks delete-shapes-tx)))

(defn- get-whiteboard-clj [page-name]
  (let [page-block (model/get-page page-name)
        blocks (model/get-page-blocks-no-cache page-name)]
    [page-block blocks]))

(defn- whiteboard-clj->tldr [page-block blocks]
  (let [shapes (map block->shape blocks)
        page-properties (:block/properties page-block)]
    (clj->js {:currentPageId "page"
              :pages [(merge page-properties
                             {:id "page"
                              :name "page"
                              :shapes shapes})]})))

(defn page-name->tldr [page-name]
  (let [[page-block blocks] (get-whiteboard-clj page-name)]
    (whiteboard-clj->tldr page-block blocks)))

(defn transact-tldr! [page-name tldr]
  (let [{:keys [pages]} (js->clj tldr :keywordize-keys true)
        tx (tldr-page->blocks-tx page-name (first pages))]
    (db-utils/transact! tx)))

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
   (transact-tldr! name default-tldr)
   (let [uuid (or (parse-uuid name) (d/squuid))
         entity (db-utils/entity [:block/name name])]
     (outliner-file/sync-to-file entity)
     (db-utils/transact! [{:db/id (:db/id entity) :block/uuid uuid}]))))
