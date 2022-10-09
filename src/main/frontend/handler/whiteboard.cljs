(ns frontend.handler.whiteboard
  "Whiteboard related handlers"
  (:require [datascript.core :as d]
            [dommy.core :as dom]
            [frontend.db.model :as model]
            [frontend.db.utils :as db-utils]
            [frontend.handler.route :as route-handler]
            [frontend.modules.outliner.core :as outliner]
            [frontend.modules.outliner.file :as outliner-file]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.graph-parser.whiteboard :as gp-whiteboard]))

(defn shape->block [shape page-name idx]
  (let [properties {:ls-type :whiteboard-shape
                    :logseq.tldraw.shape (assoc shape :index idx)}
        block {:block/page {:block/name (util/page-name-sanity-lc page-name)}
               :block/parent {:block/name page-name}
               :block/properties properties}
        additional-props (gp-whiteboard/with-whiteboard-block-props block page-name)]
    (merge block additional-props)))

(defn- tldr-page->blocks-tx [page-name tldr-data]
  (let [page-name (util/page-name-sanity-lc page-name)
        page-entity (model/get-page page-name)
        page-block (merge {:block/name page-name
                           :block/type "whiteboard"
                           :block/properties {:ls-type :whiteboard-page
                                              :logseq.tldraw.page (dissoc tldr-data :shapes)}}
                          (when page-entity (select-keys page-entity [:block/created-at])))
        page-block (outliner/block-with-timestamps page-block)
        ;; todo: use get-paginated-blocks instead?
        existing-blocks (model/get-page-blocks-no-cache (state/get-current-repo)
                                                        page-name
                                                        {:pull-keys '[:db/id
                                                                      :block/uuid
                                                                      :block/properties [:ls-type]
                                                                      {:block/parent [:block/uuid]}]})
        shapes (:shapes tldr-data)
        ;; we should maintain the order of the shapes in the page
        ;; bring back/forward is depending on this ordering
        blocks (map-indexed (fn [idx shape] (shape->block shape page-name idx)) shapes)
        block-ids (->> shapes
                       (map (fn [shape] (when (= (:blockType shape) "B")
                                          (uuid (:pageId shape)))))
                       (concat (map :block/uuid blocks))
                       (remove nil?)
                       (set))
        ;; delete blocks when all of the following are false
        ;; - the block is not in the new blocks list
        ;; - the block's parent is not in the new block list
        ;; - the block is not a shape block 
        delete-blocks (filterv (fn [block]
                                 (not
                                  (or (block-ids (:block/uuid block))
                                      (block-ids (:block/uuid (:block/parent block)))
                                      (not (gp-whiteboard/shape-block? block)))))
                               existing-blocks)
        delete-blocks-tx (mapv (fn [s] [:db/retractEntity (:db/id s)]) delete-blocks)]
    (concat [page-block] blocks delete-blocks-tx)))

(defn- get-whiteboard-clj [page-name]
  (when (model/page-exists? page-name)
    (let [page-block (model/get-page page-name)
          ;; fixme: can we use cache?
          blocks (model/get-page-blocks-no-cache page-name)]
      [page-block blocks])))

(defn- whiteboard-clj->tldr [page-block blocks shape-id]
  (let [id (str (:block/uuid page-block))
        shapes (->> blocks
                    (filter gp-whiteboard/shape-block?)
                    (map gp-whiteboard/block->shape)
                    (sort-by :index))
        tldr-page (gp-whiteboard/page-block->tldr-page page-block)
        assets (:assets tldr-page)
        tldr-page (dissoc tldr-page :assets)]
    (clj->js {:currentPageId id
              :assets (or assets #js[])
              :selectedIds (if (not-empty shape-id) #js[shape-id] #js[])
              :pages [(merge tldr-page
                             {:id id
                              :name "page"
                              :shapes shapes})]})))

(defn transact-tldr! [page-name tldr]
  (let [{:keys [pages assets]} (js->clj tldr :keywordize-keys true)
        page (first pages)
        tx (tldr-page->blocks-tx page-name (assoc page :assets assets))]
    (db-utils/transact! tx)))

(defn get-default-tldr
  [page-id]
  {:currentPageId page-id,
   :selectedIds [],
   :pages [{:id page-id
            :name page-id
            :ls-type :whiteboard-page
            :shapes []
            :bindings {}
            :nonce 1}]
   :assets []})

(defn get-whiteboard-entity [page-name]
  (db-utils/entity [:block/name (util/page-name-sanity-lc page-name)]))

(defn create-new-whiteboard-page!
  ([]
   (create-new-whiteboard-page! nil))
  ([name]
   (let [uuid (or (and name (parse-uuid name)) (d/squuid))
         name (or name (str uuid))
         tldr (get-default-tldr (str uuid))]
     (transact-tldr! name (get-default-tldr (str uuid)))
     (let [entity (get-whiteboard-entity name)
           tx (assoc (select-keys entity [:db/id])
                     :block/uuid uuid)]
       (db-utils/transact! [tx])
       (let [page-entity (get-whiteboard-entity name)]
         (when (and page-entity (nil? (:block/file page-entity)))
           (outliner-file/sync-to-file page-entity))))
     tldr)))

(defn create-new-whiteboard-and-redirect!
  ([]
   (create-new-whiteboard-and-redirect! (str (d/squuid))))
  ([name]
   (create-new-whiteboard-page! name)
   (route-handler/redirect-to-whiteboard! name)))

(defn ->logseq-portal-shape
  [block-id point]
  {:blockType (if (parse-uuid (str block-id)) "B" "P")
   :id (str (d/squuid))
   :compact false
   :pageId (str block-id)
   :point point
   :size [400, 0]
   :type "logseq-portal"})

(defn add-new-block-portal-shape!
  "Given the block uuid, add a new shape to the referenced block.
   By default it will be placed next to the given shape id"
  [block-uuid source-shape & {:keys [link? bottom?]}]
  (let [app (state/active-tldraw-app)
        api (.-api app)
        point (-> (.getShapeById app source-shape)
                  (.-bounds)
                  ((fn [bounds] (if bottom? 
                                  [(.-minX bounds) (+ 64 (.-maxY bounds))]
                                  [(+ 64 (.-maxX bounds)) (.-minY bounds)]))))
        shape (->logseq-portal-shape block-uuid point)]
    (.createShapes api (clj->js shape))
    (when link?
      (.createNewLineBinding api source-shape (:id shape)))))

(defn page-name->tldr!
  ([page-name]
   (page-name->tldr! page-name nil))
  ([page-name shape-id]
   (if page-name
     (if-let [[page-block blocks] (get-whiteboard-clj page-name)]
       (whiteboard-clj->tldr page-block blocks shape-id)
       (create-new-whiteboard-page! page-name))
     (create-new-whiteboard-page! nil))))

(defn- get-whiteboard-blocks
  "Given a page, return all the logseq blocks (exlude all shapes)"
  [page-name]
  (let [blocks (model/get-page-blocks-no-cache page-name)]
    (remove gp-whiteboard/shape-block? blocks)))

(defn- get-last-root-block
  "Get the last root Logseq block in the page. Main purpose is to calculate the new :block/left id"
  [page-name]
  (let [page-id (:db/id (model/get-page page-name))
        blocks (get-whiteboard-blocks page-name)
        root-blocks (filter (fn [block] (= page-id (:db/id (:block/parent block)))) blocks)
        root-block-left-ids (->> root-blocks
                                 (map (fn [block] (get-in block [:block/left :db/id] nil)))
                                 (remove nil?)
                                 (set))
        blocks-with-no-next (remove #(root-block-left-ids (:db/id %)) root-blocks)]
    (when (seq blocks-with-no-next) (first blocks-with-no-next))))

(defn add-new-block!
  [page-name content]
  (let [uuid (d/squuid)
        page-entity (model/get-page page-name)
        last-root-block (or (get-last-root-block page-name) page-entity)
        tx {:block/left (select-keys last-root-block [:db/id])
            :block/uuid uuid
            :block/content (or content "")
            :block/format :markdown ; fixme
            :block/page {:block/name (util/page-name-sanity-lc page-name)}
            :block/parent {:block/name page-name}}]
    (db-utils/transact! [tx])
    uuid))

(defn inside-portal
  [target]
  (dom/closest target ".tl-logseq-cp-container"))

(defn closest-shape
  [target]
  (when-let [shape-el (dom/closest target "[data-shape-id]")]
    (.getAttribute shape-el "data-shape-id")))