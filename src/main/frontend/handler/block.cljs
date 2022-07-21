(ns frontend.handler.block
  (:require
   [clojure.set :as set]
   [clojure.string :as string]
   [clojure.walk :as walk]
   [frontend.db :as db]
   [frontend.db.model :as db-model]
   [frontend.db.react :as react]
   [frontend.db.utils :as db-utils]
   [frontend.mobile.haptics :as haptics]
   [frontend.modules.outliner.core :as outliner-core]
   [frontend.modules.outliner.transaction :as outliner-tx]
   [frontend.state :as state]
   [frontend.util :as util]
   [goog.dom :as gdom]
   [logseq.graph-parser.block :as gp-block]))

;;  Fns

(defn long-page?
  [repo page-id]
  (>= (db/get-page-blocks-count repo page-id) db-model/initial-blocks-length))

(defn get-block-refs-with-children
  [block]
  (->>
   (tree-seq :block/refs
             :block/children
             block)
   (mapcat :block/refs)
   (distinct)))

(defn filter-blocks
  [repo ref-blocks filters group-by-page?]
  (let [ref-pages-ids (->> (if group-by-page?
                             (mapcat last ref-blocks)
                             ref-blocks)
                           (mapcat (fn [b] (get-block-refs-with-children b)))
                           (concat (when group-by-page? (map first ref-blocks)))
                           (distinct)
                           (map :db/id)
                           (remove nil?))
        ref-pages (db/pull-many repo '[:db/id :block/name] ref-pages-ids)
        ref-pages (zipmap (map :block/name ref-pages) (map :db/id ref-pages))
        exclude-ids (->> (map (fn [page] (get ref-pages page)) (get filters false))
                         (remove nil?)
                         (set))
        include-ids (->> (map (fn [page] (get ref-pages page)) (get filters true))
                         (remove nil?)
                         (set))]
    (if (empty? filters)
      ref-blocks
      (let [filter-f (fn [ref-blocks]
                       (cond->> ref-blocks
                         (seq exclude-ids)
                         (remove (fn [block]
                                   (let [ids (set (concat (map :db/id (get-block-refs-with-children block))
                                                          [(:db/id (:block/page block))]))]
                                     (seq (set/intersection exclude-ids ids)))))

                         (seq include-ids)
                         (remove (fn [block]
                                   (let [page-block-id (:db/id (:block/page block))
                                         ids (set (map :db/id (get-block-refs-with-children block)))]
                                     (if (and (contains? include-ids page-block-id)
                                              (= 1 (count include-ids)))
                                       (not= page-block-id (first include-ids))
                                       (empty? (set/intersection include-ids (set (conj ids page-block-id))))))))))]
        (if group-by-page?
          (->> (map (fn [[p ref-blocks]]
                      [p (filter-f ref-blocks)]) ref-blocks)
               (remove #(empty? (second %))))
          (->> (filter-f ref-blocks)
               (remove nil?)))))))

;; TODO: reduced version
(defn- walk-block
  [block check? transform]
  (let [result (atom nil)]
    (walk/postwalk
     (fn [x]
       (if (check? x)
         (reset! result (transform x))
         x))
     (:block/body block))
    @result))

(defn get-timestamp
  [block typ]
  (walk-block block
              (fn [x]
                (and (gp-block/timestamp-block? x)
                     (= typ (first (second x)))))
              #(second (second %))))

(defn get-scheduled-ast
  [block]
  (get-timestamp block "Scheduled"))

(defn get-deadline-ast
  [block]
  (get-timestamp block "Deadline"))

(defn load-more!
  [db-id start-id]
  (let [repo (state/get-current-repo)
        db (db/get-db repo)
        block (db/entity repo db-id)
        block? (not (:block/name block))
        k (if block?
            :frontend.db.react/block-and-children
            :frontend.db.react/page-blocks)
        query-k [repo k db-id]
        option (cond-> {:limit db-model/step-loading-blocks}
                 block?
                 (assoc :scoped-block-id db-id))
        more-data (->> (db-model/get-paginated-blocks-no-cache db start-id option)
                       (map #(db/pull (:db/id %))))]
    (react/swap-new-result! query-k
                            (fn [result]
                              (->> (concat result more-data)
                                   (util/distinct-by :db/id))))))

(defn indentable?
  [{:block/keys [parent] :as block}]
  (when parent
    (let [parent-block (db-utils/pull (:db/id parent))
          first-child (first
                       (db-model/get-block-immediate-children
                        (state/get-current-repo)
                        (:block/uuid parent-block)))]
      (not= (:db/id block) (:db/id first-child)))))

(defn outdentable?
  [{:block/keys [level] :as _block}]
  (not= level 1))

(defn indent-outdent-block!
  [block direction]
  (outliner-tx/transact!
   {:outliner-op :move-blocks}
   (outliner-core/indent-outdent-blocks! [block] (= direction :right))))

(defn select-block!
  [block-uuid]
  (let [blocks (js/document.getElementsByClassName (str block-uuid))]
    (when (seq blocks)
      (state/exit-editing-and-set-selected-blocks! blocks))))

(def *swipe (atom nil))
(def *touch-start (atom nil))

(defn- target-disable-swipe?
  [target]
  (let [user-defined-tags (get-in (state/get-config)
                                  [:mobile :gestures/disabled-in-block-with-tags])]
    (or (.closest target ".dsl-query")
        (.closest target ".drawer")
        (.closest target ".draw-wrap")
        (some #(.closest target (util/format "[data-refs-self*=%s]" %))
              user-defined-tags))))

(defn on-touch-start
  [event uuid]
  (let [target (.-target event)
        input (state/get-input)
        input-id (state/get-edit-input-id)
        selection-type (.-type (.getSelection js/document))]
    (reset! *touch-start (js/Date.now))
    (when-not (and input
                   (string/ends-with? input-id (str uuid)))
      (state/clear-edit!))
    (when-not (target-disable-swipe? target)
      (when (not= selection-type "Range")
        (when-let [touches (.-targetTouches event)]
          (when (= (.-length touches) 1)
            (let [touch (aget touches 0)
                  x (.-clientX touch)
                  y (.-clientY touch)]
              (reset! *swipe {:x0 x :y0 y :xi x :yi y :tx x :ty y :direction nil}))))))))

(defn on-touch-move
  [event block uuid edit? *show-left-menu? *show-right-menu?]
  (when-let [touches (.-targetTouches event)]
    (let [selection-type (.-type (.getSelection js/document))]
      (when-not (= selection-type "Range")
        (when (or (not (state/sub :editor/editing?))
                  (< (- (js/Date.now) @*touch-start) 600))
          (when (and (= (.-length touches) 1) @*swipe)
            (let [{:keys [x0 xi direction]} @*swipe
                  touch (aget touches 0)
                  tx (.-clientX touch)
                  ty (.-clientY touch)
                  direction (if (nil? direction)
                              (if (> tx x0)
                                :right
                                :left)
                              direction)]
              (swap! *swipe #(-> %
                                 (assoc :tx tx)
                                 (assoc :ty ty)
                                 (assoc :xi tx)
                                 (assoc :yi ty)
                                 (assoc :direction direction)))
              (when (< (* (- xi x0) (- tx xi)) 0)
                (swap! *swipe #(-> %
                                   (assoc :x0 tx)
                                   (assoc :y0 ty))))
              (let [{:keys [x0 y0]} @*swipe
                    dx (- tx x0)
                    dy (- ty y0)]
                (when (and (< (. js/Math abs dy) 30)
                           (> (. js/Math abs dx) 30))
                  (let [left (gdom/getElement (str "block-left-menu-" uuid))
                        right (gdom/getElement (str "block-right-menu-" uuid))]

                    (cond
                      (= direction :right)
                      (do
                        (reset! *show-left-menu? true)
                        (when left
                          (when (>= dx 0)
                            (set! (.. left -style -width) (str dx "px")))
                          (when (< dx 0)
                            (set! (.. left -style -width) (str (max (+ 40 dx) 0) "px")))

                          (let [indent (gdom/getFirstElementChild left)]
                            (when (indentable? block)
                              (if (>= (.-clientWidth left) 40)
                                (set! (.. indent -style -opacity) "100%")
                                (set! (.. indent -style -opacity) "30%"))))))

                      (= direction :left)
                      (do
                        (reset! *show-right-menu? true)
                        (when right
                          (when (<= dx 0)
                            (set! (.. right -style -width) (str (- dx) "px")))
                          (when (> dx 0)
                            (set! (.. right -style -width) (str (max (- 80 dx) 0) "px")))

                          (let [outdent (gdom/getFirstElementChild right)
                                more (when-not edit?
                                       (gdom/getLastElementChild right))]
                            (when (and outdent (outdentable? block))
                              (if (and (>= (.-clientWidth right) 40)
                                       (< (.-clientWidth right) 80))
                                (set! (.. outdent -style -opacity) "100%")
                                (set! (.. outdent -style -opacity) "30%")))

                            (when more
                              (if (>= (.-clientWidth right) 80)
                                (set! (.. more -style -opacity) "100%")
                                (set! (.. more -style -opacity) "30%"))))))
                      :else
                      nil)))))))))))

(defn on-touch-end
  [_event block uuid *show-left-menu? *show-right-menu?]
  (when @*swipe
    (let [left-menu (gdom/getElement (str "block-left-menu-" uuid))
          right-menu (gdom/getElement (str "block-right-menu-" uuid))
          {:keys [x0 tx]} @*swipe
          dx (- tx x0)]
      (try
        (when (> (. js/Math abs dx) 10)
          (cond
            (and left-menu (>= (.-clientWidth left-menu) 40))
            (when (indentable? block)
              (haptics/with-haptics-impact
                (indent-outdent-block! block :right)
                :light))

            (and right-menu (<= 40 (.-clientWidth right-menu) 79))
            (when (outdentable? block)
              (haptics/with-haptics-impact
                (indent-outdent-block! block :left)
                :light))

            (and right-menu (>= (.-clientWidth right-menu) 80))
            (haptics/with-haptics-impact
              (do (state/set-state! :mobile/show-action-bar? true)
                  (state/set-state! :mobile/actioned-block block)
                  (select-block! uuid))
              :light)

            :else
            nil))
        (catch js/Error e
          (js/console.error e))
        (finally
          (reset! *show-left-menu? false)
          (reset! *show-right-menu? false)
          (reset! *swipe nil))))))

(defn on-touch-cancel
  [_event *show-left-menu? *show-right-menu?]
  (reset! *show-left-menu? false)
  (reset! *show-right-menu? false)
  (reset! *swipe nil))
