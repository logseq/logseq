(ns frontend.handler.whiteboard
  (:require [frontend.state :as state]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [goog.object :as gobj]))

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

(defn- get-page-block [page-name]
  (db/pull '[*] (:db/id (model/get-page page-name))))

(defn- block->shape [block]
  (let [properties (:block/properties block)]
    (merge properties
           ;; Use the block's id as the shape's id.
           {:id (str (:block/uuid block))})))

(defn- shape->block [blocks-by-uuid shape]
  (let [properties shape
        block (get blocks-by-uuid (:id shape))]
    (merge block
           {:properties properties})))

(defn get-whiteboard-cjs [page-name]
  (let [page-block (get-page-block page-name)
        blocks (model/get-page-blocks-no-cache page-name)]
    [page-block blocks]))

(defn whiteboard-cjs->tldr [page-block blocks]
  (let [shapes (map block->shape blocks)
        page-name (:block/name page-block)
        page-properties (:block/properties page-block)]
    (clj->js {:currentPageId page-name
              :pages [(merge page-properties
                             {:id "page"
                              :name "page"
                              :shapes shapes})]})))

(defn page-name->tldr [page-name]
  (let [[page-block blocks] (get-whiteboard-cjs page-name)]
    (whiteboard-cjs->tldr page-block blocks)))

(defn transact-tldr! [page-name tldr]
  (let [[page-block blocks] (get-whiteboard-cjs page-name)
        {:keys [pages]} (js->clj tldr)
        page (first pages) ;; should only contain one page
        shapes (:shapes page)
        blocks-by-uuid (reduce (fn [acc shape]
                                 (assoc (:id shape) shape acc))
                               blocks {})
        blocks (map #(shape->block blocks-by-uuid %) shapes)]
    [page-block blocks]))

;; (set! (. js/window -foo) (page-name->tldr "edn-test"))
