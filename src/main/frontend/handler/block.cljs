(ns ^:no-doc frontend.handler.block
  (:require [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.impl.entity :as de]
            [dommy.core :as dom]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.model :as db-model]
            [frontend.handler.file-based.property.util :as property-util]
            [frontend.handler.property.util :as pu]
            [frontend.mobile.haptics :as haptics]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.file-based.drawer :as drawer]
            [goog.object :as gobj]
            [logseq.db :as ldb]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.graph-parser.block :as gp-block]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.op]
            [promesa.core :as p]))

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
     (:block.temp/ast-body block))
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

(defn select-block!
  [block-uuid]
  (let [blocks (util/get-blocks-by-id block-uuid)]
    (when (seq blocks)
      (state/exit-editing-and-set-selected-blocks! blocks))))

(defn get-idx-of-order-list-block
  [block order-list-type]
  (let [order-block-fn? (fn [block]
                          (let [type (pu/lookup block :logseq.property/order-list-type)]
                            (= type order-list-type)))
        prev-block-fn   #(some-> (db/entity (:db/id %)) ldb/get-left-sibling)
        prev-block      (prev-block-fn block)]
    (letfn [(order-sibling-list [b]
              (lazy-seq
               (when (order-block-fn? b)
                 (cons b (order-sibling-list (prev-block-fn b))))))
            (order-parent-list [b]
              (lazy-seq
               (when (order-block-fn? b)
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
  (let [type (pu/lookup block :logseq.property/order-list-type)
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
  [repo block content text-range {:keys [container-id direction event pos]}]
  (when block
    (let [container-id (or container-id
                           (state/get-current-editor-container-id)
                           :unknown-container)]
      (state/set-editing! (str "edit-block-" (:block/uuid block)) content block text-range
                          {:db (db/get-db)
                           :container-id container-id :direction direction :event event :pos pos}))
    (mark-last-input-time! repo)))

(defn sanity-block-content
  [repo format content]
  (if (sqlite-util/db-based-graph? repo)
    content
    (-> (property-util/remove-built-in-properties format content)
        (drawer/remove-logbook))))

(defn block-unique-title
  "Multiple pages/objects may have the same `:block/title`.
   Notice: this doesn't prevent for pages/objects that have the same tag or created by different clients."
  [block & {:keys [with-tags? alias]
            :or {with-tags? true}}]
  (if (ldb/built-in? block)
    (:block/title block)
    (let [block-e (cond
                    (de/entity? block)
                    block
                    (uuid? (:block/uuid block))
                    (db/entity [:block/uuid (:block/uuid block)])
                    :else
                    block)
          tags (remove (fn [t]
                         (or (some-> (:block/raw-title block-e) (ldb/inline-tag? t))
                             (ldb/private-tags (:db/ident t))))
                       (map (fn [tag] (if (number? tag) (db/entity tag) tag)) (:block/tags block)))
          title (cond
                  (ldb/class? block)
                  (ldb/get-class-title-with-extends block)

                  (and with-tags? (seq tags))
                  (str (:block/title block)
                       " "
                       (string/join
                        ", "
                        (keep (fn [tag]
                                (when-let [title (:block/title tag)]
                                  (str "#" title)))
                              tags)))
                  :else
                  (:block/title block))]
      (when title
        (str (subs title 0 256)
             (when alias
               (str " -> alias: " alias)))))))

(defn block-title-with-icon
  "Used for select item"
  [block title icon-cp]
  (if-let [icon (:logseq.property/icon block)]
    [:div.flex.flex-row.items-center.gap-1
     (icon-cp icon {:size 14})
     title]
    (or title (:block/title block))))

(defn edit-block!
  [block pos & {:keys [_container-id custom-content tail-len save-code-editor?]
                :or {tail-len 0
                     save-code-editor? true}
                :as opts}]
  (when (and (not config/publishing?) (:block/uuid block))
    (let [repo (state/get-current-repo)]
      (p/do!
       (db-async/<get-block repo (:db/id block) {:children? false})
       (when save-code-editor? (state/pub-event! [:editor/save-code-editor]))
       (when (not= (:block/uuid block) (:block/uuid (state/get-edit-block)))
         (state/clear-edit! {:clear-editing-block? false}))
       (when-let [block-id (:block/uuid block)]
         (let [block (or (db/entity [:block/uuid block-id]) block)
               content (or custom-content (:block/title block) "")
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
               content (sanity-block-content repo (get block :block/format :markdown) content)]
           (state/clear-selection!)
           (edit-block-aux repo block content text-range (assoc opts :pos pos))))))))

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

(let [*timeout (atom nil)]
  (defn indent-outdent-blocks!
    [blocks indent? save-current-block]
    (when-let [timeout *timeout]
      (js/clearTimeout timeout))
    (when (seq blocks)
      (let [blocks-container (when-let [first-selected-node (first (state/get-selection-blocks))]
                               (util/rec-get-blocks-container first-selected-node))
            blocks' (get-top-level-blocks blocks)]
        (p/do!
         (ui-outliner-tx/transact!
          {:outliner-op :move-blocks
           :real-outliner-op :indent-outdent}
          (when save-current-block (save-current-block))
          (outliner-op/indent-outdent-blocks! (get-top-level-blocks blocks')
                                              indent?
                                              {:parent-original (get-first-block-original)
                                               :logical-outdenting? (state/logical-outdenting?)}))
         (when blocks-container
           ;; Update selection nodes to be the new ones
           (reset! *timeout
                   (js/setTimeout
                    #(state/set-selection-blocks! (dom/sel blocks-container ".ls-block.selected") :down)
                    100))))))))

(def *swipe (atom nil))
(def *swiped? (atom false))

(def *touch-start (atom nil))

(defn on-touch-start
  [event uuid]
  (util/stop-propagation event)
  (let [input (state/get-input)
        input-id (state/get-edit-input-id)
        selection-type (.-type (.getSelection js/document))]
    (reset! *touch-start (js/Date.now))
    (when-not (and input
                   (string/ends-with? input-id (str uuid)))
      (state/clear-edit!))
    (when (not= selection-type "Range")
      (when-let [touches (.-targetTouches event)]
        (when (= (.-length touches) 1)
          (let [touch (aget touches 0)
                x (.-clientX touch)
                y (.-clientY touch)]
            (reset! *swipe {:x0 x :y0 y :xi x :yi y :tx x :ty y :direction nil})))))))

(defn on-touch-move
  [^js goog-event]
  (let [event (.-event_ goog-event)]
    (when-let [touches (.-targetTouches event)]
      (let [selection-type (.-type (.getSelection js/document))
            target (.-target event)
            block-container (util/rec-get-node target "ls-block")]
        (when-not (= selection-type "Range")
          (when (or (not (state/editing?))
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
                             (> (. js/Math abs dx) 10)
                             direction)
                    (.preventDefault goog-event)
                    (let [left (if (= direction :right)
                                 (if (>= dx 0) (min dx 48) (max dx 0))
                                 (if (<= dx 0) (- (min (js/Math.abs dx) 48)) (min dx 48)))]
                      (reset! *swiped? true)
                      (dom/set-style! block-container :transform (util/format "translateX(%dpx)" left)))))))))))))

(defn on-touch-end
  [event]
  (util/stop-propagation event)
  (when @*swipe
    (let [target (.-target event)
          swiped? @*swiped?
          {:keys [x0 y0 tx ty]} @*swipe
          dy (- ty y0)
          dx (- tx x0)
          block-container (util/rec-get-node target "ls-block")
          select? (and (> (. js/Math abs dx) (. js/Math abs dy))
                       (> (. js/Math abs dx) 10))]
      (try
        (when (or select? swiped?)
          (dom/set-style! block-container :transform "translateX(0)")
          (when select?
            (if (contains? (set (state/get-selection-block-ids)) (some-> (.getAttribute block-container "blockid") uuid))
              (state/drop-selection-block! block-container)
              (do
                (state/clear-edit!)
                (state/conj-selection-block! block-container nil)))
            (if (seq (state/get-selection-blocks))
              (state/set-state! :mobile/show-action-bar? true)
              (when (:mobile/show-action-bar? @state/state)
                (state/set-state! :mobile/show-action-bar? false)))
            (haptics/haptics)))
        (reset! *swiped? false)
        (catch :default e
          (js/console.error e))
        (finally
          (reset! *swipe nil)
          (reset! *touch-start nil))))))

(defn on-touch-cancel
  [e]
  (reset! *swipe nil)
  (reset! *swiped? nil)
  (reset! *touch-start nil)
  (let [target (.-target e)
        block-container (util/rec-get-node target "ls-block")]
    (dom/set-style! block-container :transform "translateX(0)")))
