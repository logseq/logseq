(ns ^:no-doc frontend.handler.block
  (:require
   [clojure.set :as set]
   [clojure.string :as string]
   [clojure.walk :as walk]
   [frontend.db :as db]
   [frontend.db.model :as db-model]
   [frontend.mobile.haptics :as haptics]
   [logseq.outliner.core :as outliner-core]
   [frontend.modules.outliner.ui :as ui-outliner-tx]
   [frontend.state :as state]
   [frontend.util :as util]
   [goog.dom :as gdom]
   [logseq.graph-parser.block :as gp-block]
   [frontend.config :as config]
   [frontend.util.drawer :as drawer]
   [frontend.handler.file-based.property.util :as property-util]
   [frontend.handler.property.util :as pu]
   [dommy.core :as dom]
   [goog.object :as gobj]))

;;  Fns

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

(defn indentable?
  [{:block/keys [parent left]}]
  (when parent
    (not= parent left)))

(defn outdentable?
  [{:block/keys [level] :as _block}]
  (not= level 1))

(defn select-block!
  [block-uuid]
  (let [blocks (js/document.getElementsByClassName (str "id" block-uuid))]
    (when (seq blocks)
      (state/exit-editing-and-set-selected-blocks! blocks))))

(defn get-blocks-refed-pages
  [aliases [block & children]]
  (let [children-refs (mapcat :block/refs children)
        refs (->>
              (:block/path-refs block)
              (concat children-refs)
              (remove #(aliases (:db/id %))))]
    (keep (fn [ref]
            (when (:block/name ref)
              {:db/id (:db/id ref)
               :block/name (:block/name ref)
               :block/original-name (:block/original-name ref)})) refs)))

(defn filter-blocks
  [ref-blocks filters]
  (if (empty? filters)
    ref-blocks
    (let [exclude-ids (->> (keep (fn [page] (:db/id (db/entity [:block/name (util/page-name-sanity-lc page)]))) (get filters false))
                           (set))
          include-ids (->> (keep (fn [page] (:db/id (db/entity [:block/name (util/page-name-sanity-lc page)]))) (get filters true))
                           (set))]
      (cond->> ref-blocks
        (seq exclude-ids)
        (remove (fn [block]
                  (let [ids (set (map :db/id (:block/path-refs block)))]
                    (seq (set/intersection exclude-ids ids)))))

        (seq include-ids)
        (filter (fn [block]
                  (let [ids (set (map :db/id (:block/path-refs block)))]
                    (set/subset? include-ids ids))))))))

(defn get-filtered-ref-blocks-with-parents
  [all-ref-blocks filtered-ref-blocks]
  (when (seq filtered-ref-blocks)
    (let [id->block (zipmap (map :db/id all-ref-blocks) all-ref-blocks)
          get-parents (fn [block]
                        (loop [block block
                               result [block]]
                          (let [parent (id->block (:db/id (:block/parent block)))]
                            (if (and parent (not= (:db/id parent) (:db/id block)))
                              (recur parent (conj result parent))
                              result))))]
      (distinct (mapcat get-parents filtered-ref-blocks)))))

(defn get-idx-of-order-list-block
  [block order-list-type]
  (let [order-block-fn? (fn [block]
                          (let [properties (:block/properties block)
                                type (pu/lookup properties :logseq.order-list-type)]
                            (= type order-list-type)))
        prev-block-fn   #(some->> (:db/id %) (db-model/get-prev-sibling (state/get-current-repo)))
        prev-block      (prev-block-fn block)]
    (letfn [(page-fn? [b] (some-> b :block/name some?))
            (order-sibling-list [b]
              (lazy-seq
                (when (and (not (page-fn? b)) (order-block-fn? b))
                  (cons b (order-sibling-list (prev-block-fn b))))))
            (order-parent-list [b]
              (lazy-seq
                (when (and (not (page-fn? b)) (order-block-fn? b))
                  (cons b (order-parent-list (db-model/get-block-parent (:block/uuid b)))))))]
      (let [idx           (if prev-block
                            (count (order-sibling-list block)) 1)
            order-parents-count (dec (count (order-parent-list block)))
            delta (if (neg? order-parents-count) 0 (mod order-parents-count 3))]
        (cond
          (zero? delta) idx

          (= delta 1)
          (some-> (util/convert-to-letters idx) util/safe-lower-case)

          :else
          (util/convert-to-roman idx))))))

(defn attach-order-list-state
  [config block]
  (let [properties (:block/properties block)
        type (pu/lookup properties :logseq.order-list-type)
        own-order-list-type  (some-> type str string/lower-case)
        own-order-list-index (some->> own-order-list-type (get-idx-of-order-list-block block))]
    (assoc config :own-order-list-type own-order-list-type
                  :own-order-list-index own-order-list-index
                  :own-order-number-list? (= own-order-list-type "number"))))

(defn- text-range-by-lst-fst-line [content [direction pos]]
  (case direction
    :up
    (let [last-new-line (or (string/last-index-of content \newline) -1)
          end (+ last-new-line pos 1)]
      (subs content 0 end))
    :down
    (-> (string/split-lines content)
        first
        (or "")
        (subs 0 pos))))

(defn mark-last-input-time!
  [repo]
  (when repo
    (state/set-editor-last-input-time! repo (util/time-ms))))

(defn- edit-block-aux
  [repo block content block-node text-range {:keys [direction retry-times max-retry-times]
                                             :or {retry-times 0
                                                  max-retry-times 10}
                                             :as opts}]
  (when (and (<= retry-times max-retry-times) block)
    (let [block-node block-node
          block-id (:block/uuid block)
          id-class (str "id" block-id)
          next-edit-node (cond
                           (and block-node (< retry-times max-retry-times))
                           (or
                              ;; up/down
                            (when direction
                              (let [blocks (dom/by-class "ls-block")
                                    idx (.indexOf blocks block-node)]
                                (when idx
                                  (if (= direction :down)
                                    (util/nth-safe blocks (inc idx))
                                    (util/nth-safe blocks (dec idx))))))

                              ;; next
                            (let [id (some-> (dom/attr block-node "blockid") uuid)
                                  link (when id (:link (db/entity [:block/uuid id])))
                                  block-node (if link
                                               (.-previousSibling block-node)
                                               block-node)]
                              (when-let [next (.-nextSibling block-node)]
                                (when (dom/has-class? next id-class)
                                  next)))

                              ;; first child
                            (when-let [first-child (first (dom/sel block-node ".ls-block"))]
                              (when (dom/has-class? first-child id-class)
                                first-child))

                              ;; prev
                            (when-let [prev (.-previousSibling block-node)]
                              (when (dom/has-class? prev id-class)
                                prev)))

                           :else
                           ;; take the first dom node
                           (gdom/getElement (str "ls-block-" (:block/uuid block))))]
      (state/set-editing! "" content block text-range {:ref next-edit-node})
      (if next-edit-node
        (mark-last-input-time! repo)
        (util/schedule (fn [] (edit-block-aux repo block content block-node text-range (update opts :retry-times inc))))))))

(defn edit-block!
  [block pos block-node & {:keys [custom-content tail-len _direction]
                           :or {tail-len 0}
                           :as opts}]
  (when-not config/publishing?
    (when-let [block-id (:block/uuid block)]
      (let [repo (state/get-current-repo)
            block-node (cond
                         (uuid? block-node)
                         nil
                         (string? block-node)
                         (gdom/getElement (string/replace block-node "edit-block" "ls-block"))
                         :else
                         block-node)
            db-graph? (config/db-based-graph? repo)
            block (or (db/entity [:block/uuid block-id]) block)
            content (if (and db-graph? (:block/name block))
                      (:block/original-name block)
                      (or custom-content (:block/content block) ""))
            content-length (count content)
            text-range (cond
                         (vector? pos)
                         (text-range-by-lst-fst-line content pos)

                         (and (> tail-len 0) (>= (count content) tail-len))
                         (subs content 0 (- (count content) tail-len))

                         (or (= :max pos) (<= content-length pos))
                         content

                         :else
                         (subs content 0 pos))
            content (if db-graph?
                      content
                      (-> (property-util/remove-built-in-properties (:block/format block) content)
                          (drawer/remove-logbook)))]
        (state/clear-selection!)
        (edit-block-aux repo block content block-node text-range opts)))))

(defn- get-original-block-by-dom
  [node]
  (when-let [id (some-> node
                        (gobj/get "parentNode")
                        (util/rec-get-node "ls-block")
                        (dom/attr "originalblockid")
                        uuid)]
    (db/entity [:block/uuid id])))

(defn- get-original-block
  "Get the original block from the current editing block or selected blocks"
  [linked-block]
  (cond
    (and
     (= (:block/uuid linked-block)
        (:block/uuid (state/get-edit-block)))
     (state/get-input)) ; editing block
    (get-original-block-by-dom (state/get-input))

    (seq (state/get-selection-blocks))
    (->> (state/get-selection-blocks)
         (remove nil?)
         (keep #(when-let [id (dom/attr % "blockid")]
                  (when (= (uuid id) (:block/uuid linked-block))
                    (when-let [original-id (some-> (dom/attr % "originalblockid") uuid)]
                      (db/entity [:block/uuid original-id])))))
         ;; FIXME: what if there're multiple same blocks in the selection
         first)))

(defn get-top-level-blocks
  "Get only the top level blocks and their original blocks."
  [blocks]
  {:pre [(seq blocks)]}
  (let [level-blocks (outliner-core/blocks-with-level blocks)]
    (->> (filter (fn [b] (= 1 (:block/level b))) level-blocks)
         (map (fn [b]
                (let [original (get-original-block b)]
                  (or (and original (db/entity (:db/id original))) b)))))))

(defn get-current-editing-original-block
  []
  (when-let [input (state/get-input)]
    (get-original-block-by-dom (util/rec-get-node input "ls-block"))))

(defn get-first-block-original
  []
  (or
   (get-current-editing-original-block)
   (when-let [node (some-> (first (state/get-selection-blocks)))]
     (get-original-block-by-dom node))))

(comment
  (defn- get-last-block-original
    [last-top-block]
    (or
     (get-current-editing-original-block)
     (when-let [last-block-node (->> (state/get-selection-blocks)
                                     (filter (fn [node]
                                               (= (dom/attr node "blockid") (str (:block/uuid last-top-block)))))
                                     last)]
       (get-original-block-by-dom last-block-node)))))

(defn indent-outdent-block!
  [block direction]
  (ui-outliner-tx/transact!
   {:outliner-op :move-blocks
    :real-outliner-op :indent-outdent}
   (outliner-core/indent-outdent-blocks! (state/get-current-repo)
                                         (db/get-db false)
                                         (get-top-level-blocks [block])
                                         (= direction :right)
                                         {:get-first-block-original get-first-block-original
                                          :logical-outdenting? (state/logical-outdenting?)})))

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
        (when (or (not @state/*editor-editing-ref)
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
        (catch :default e
          (js/console.error e))
        (finally
          (reset! *show-left-menu? false)
          (reset! *show-right-menu? false)
          (reset! *swipe nil))))))

(defn on-touch-cancel
  [*show-left-menu? *show-right-menu?]
  (reset! *show-left-menu? false)
  (reset! *show-right-menu? false)
  (reset! *swipe nil))
