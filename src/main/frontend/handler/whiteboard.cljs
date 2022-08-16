(ns frontend.handler.whiteboard
  (:require [datascript.core :as d]
            [frontend.db.model :as model]
            [frontend.db.utils :as db-utils]
            [frontend.handler.editor :as editor-handler]
            [frontend.modules.outliner.file :as outliner-file]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.graph-parser.extract :as gp-extract]))

;; (defn set-linked-page-or-block!
;;   [page-or-block-id]
;;   (when-let [app ^js (state/get-current-whiteboard)]
;;     (let [shapes (:whiteboard/linked-shapes @state/state)]
;;       (when (and (seq shapes) page-or-block-id)
;;         (let [fs (first shapes)]
;;           (.updateShapes app (clj->js
;;                               [{:id (.-id fs)
;;                                 :logseqLink page-or-block-id}])))))))


;; (defn inside-whiteboard?
;;   [el]
;;   (println el)
;;   (loop [el el]
;;     (cond (nil? el) false
;;           (and (.-classList el) (.. el -classList (contains "whiteboard"))) true
;;           :else (recur (.-parentElement el)))))

(defn get-tldr-app
  []
  js/window.tln)

(defn get-tldr-api
  []
  (when (get-tldr-app) js/tln.api))

(defn tldraw-idle?
  "return true when tldraw is active and idle. nil when tldraw is 
   not active."
  []
  (when-let [^js app (get-tldr-app)]
    (.. app -selectedTool (isIn "idle"))))

(defn- block->shape [block]
  (:block/properties block))

(defn- shape->block [shape page-name idx]
  (let [properties (assoc shape :ls-type :whiteboard-shape :index idx)
        block {:block/page {:block/name (util/page-name-sanity-lc page-name)}
               :block/parent {:block/name page-name}
               :block/properties properties}
        additional-props (gp-extract/with-whiteboard-block-props block page-name)]
    (merge block additional-props)))

(defn- tldr-page->blocks-tx [page-name tldr-data]
  (let [page-name (util/page-name-sanity-lc page-name)
        page-block {:block/name page-name
                    :block/whiteboard? true
                    :block/properties (dissoc tldr-data :shapes)}
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
        delete-blocks (filterv (fn [block]
                                 (not
                                  (or (block-ids (:block/uuid block))
                                      (block-ids (:block/uuid (:block/parent block)))
                                      (not= :whiteboard-shape (:ls-type (:block/properties block))))))
                               existing-blocks)
        delete-blocks-tx (mapv (fn [s] [:db/retractEntity (:db/id s)]) delete-blocks)]
    (concat [page-block] blocks delete-blocks-tx)))

(defn- get-whiteboard-clj [page-name]
  (when (model/page-exists? page-name)
    (let [page-block (model/get-page page-name)
          blocks (model/get-page-blocks-no-cache page-name)]
      [page-block blocks])))

(defn- whiteboard-clj->tldr [page-block blocks shape-id]
  (let [id (str (:block/uuid page-block))
        shapes (->> blocks
                    (map block->shape)
                    (filter #(= :whiteboard-shape (:ls-type %)))
                    (sort-by :index))
        page-properties (:block/properties page-block)
        assets (:assets page-properties)
        page-properties (dissoc page-properties :assets)]
    (clj->js {:currentPageId id
              :assets (or assets #js[])
              :selectedIds (if (not-empty shape-id) #js[shape-id] #js[])
              :pages [(merge page-properties
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
  #js {:currentPageId page-id,
       :selectedIds #js [],
       :pages #js [#js {:id page-id,
                        :name "Page",
                        :shapes #js [],
                        :bindings #js {},
                        :nonce 1}],
       :assets #js []})

(defn get-whiteboard-entity [page-name]
  (db-utils/entity [:block/name (util/page-name-sanity-lc page-name)]))

(defn create-new-whiteboard-page!
  ([]
   (create-new-whiteboard-page! nil))
  ([name]
   (let [name (or name (str (d/squuid)))
         uuid (parse-uuid name)
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

(defn page-name->tldr!
  ([page-name]
   (page-name->tldr! page-name nil))
  ([page-name shape-id]
   (if page-name
     (if-let [[page-block blocks] (get-whiteboard-clj page-name)]
       (whiteboard-clj->tldr page-block blocks shape-id)
       (create-new-whiteboard-page! page-name))
     (create-new-whiteboard-page! nil))))

(defn ->logseq-portal-shape
  [block-id point]
  {:blockType "B"
   :id (str (d/squuid))
   :compact true
   :pageId (str block-id)
   :point point
   :size [400, 0]
   :type "logseq-portal"})

(defn add-new-block-portal-shape!
  "Given the block uuid and the point, add a new shape to the referenced block."
  [block-uuid client-x client-y]
  (let [api (get-tldr-api)
        point (js->clj (.. (get-tldr-app) -viewport (getPagePoint #js[client-x client-y])))
        shape (->logseq-portal-shape block-uuid point)]
    (editor-handler/set-blocks-id! [block-uuid])
    (.createShapes api (clj->js shape))))

(defn add-new-block!
  [page-name content]
  (let [uuid (d/squuid)
        tx {:block/uuid uuid
            :block/content (or content "")
            :block/format :markdown ; fixme
            :block/page {:block/name (util/page-name-sanity-lc page-name)}
            :block/parent {:block/name page-name}}]
    (db-utils/transact! [tx])
    uuid))
