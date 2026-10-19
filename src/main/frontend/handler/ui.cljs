(ns ^:no-doc frontend.handler.ui
  (:require [clojure.string :as string]
            [dommy.core :as dom]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.handler.assets :as assets-handler]
            [frontend.loader :refer [load]]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [logseq.shui.dialog.core :as shui-dialog]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

;; sidebars
(def *left-sidebar-resized-at (atom (js/Date.now)))
(def *right-sidebar-resized-at (atom (js/Date.now)))

(def ^:private <invoke-db-worker state/<invoke-db-worker)

(defn persist-right-sidebar-width!
  [width]
  (state/set-state! :ui/sidebar-width width)
  (storage/set "ls-right-sidebar-width" width))

(defn restore-right-sidebar-width!
  []
  (when-let [width (storage/get "ls-right-sidebar-width")]
    (state/set-state! :ui/sidebar-width width)))

(defn close-left-sidebar!
  []
  (when-let [elem (gdom/getElement "close-left-bar")]
    (.click elem)))

(defn toggle-right-sidebar!
  []
  (when-not (:ui/sidebar-open? (state/get-state)) (restore-right-sidebar-width!))
  (state/toggle-sidebar-open?!))

(defn persist-right-sidebar-state!
  []
  (let [sidebar-open? (:ui/sidebar-open? (state/get-state))
        data (if sidebar-open? {:blocks (:sidebar/blocks (state/get-state))
                                :collapsed (:ui/sidebar-collapsed-blocks (state/get-state))
                                :open? true} {:open? false})]
    (storage/set "ls-right-sidebar-state" data)))

(defn restore-right-sidebar-state!
  []
  (when-let [data' (storage/get "ls-right-sidebar-state")]
    (let [{:keys [open? collapsed blocks]} data']
      (when open?
        (state/set-state! :ui/sidebar-open? open?)
        (state/set-state! :sidebar/blocks blocks)
        (state/set-state! :ui/sidebar-collapsed-blocks collapsed)
        (restore-right-sidebar-width!)))))

(defn toggle-contents!
  []
  (when-let [current-repo (state/get-current-repo)]
    (let [id "contents"]
      (if (state/sidebar-block-exists? id)
        (state/sidebar-remove-block! id)
        (state/sidebar-add-block! current-repo id :contents)))))

(defn toggle-help!
  []
  (state/toggle! :ui/help-open?))

(defn toggle-settings-modal!
  []
  (when-not (:srs/mode? (state/get-state))
    (state/toggle-settings!)))

(defn re-render-root!
  ([]
   nil)
  ([_opts]
   nil))

(defn highlight-element!
  [fragment]
  (let [id (and
            (> (count fragment) 36)
            (subs fragment (- (count fragment) 36)))]
    (if (and id (util/uuid-string? id))
      (let [elements (util/get-blocks-by-id id)]
        (when (first elements)
          (util/scroll-to-element (gobj/get (first elements) "id")))
        (state/exit-editing-and-set-selected-blocks! elements))
      (when-let [element (gdom/getElement fragment)]
        (util/scroll-to-element fragment)
        (dom/add-class! element "block-highlight")
        (js/setTimeout #(dom/remove-class! element "block-highlight")
                       4000)))))

(defn <get-file-content
  [repo path]
  (state/<invoke-db-worker-when-ready :thread-api/get-file-content repo path))

(defn- <pull-anchor-block
  [repo anchor-id]
  (<invoke-db-worker :thread-api/pull repo [:db/id :block/uuid] [:block/uuid anchor-id]))

(defn- <get-block-parents
  [repo db-id]
  (<invoke-db-worker :thread-api/get-block-parents repo db-id 100))

(defn- expand-collapsed-ancestor!
  "Expands a collapsed ancestor so an anchor target inside it can render.
   Mirrors editor's expand without depending on handler.editor."
  [parent]
  (let [uuid (:block/uuid parent)]
    (when (and uuid
               (or (:block/collapsed? parent)
                   (state/get-block-collapsed uuid)))
      (p/do!
       (ui-outliner-tx/transact!
        {:outliner-op :collapse-expand-blocks}
        (outliner-op/collapse-expand-blocks! [uuid] false))
       (state/set-collapsed-block! uuid false)))))

(defn- wait-for-anchor-element!
  "Polls until the anchor block's row is mounted (lazy children mount
   asynchronously), then scrolls to it and highlights it."
  [anchor attempt]
  (let [id (subs anchor 9)]
    (if (or (not (exists? js/document))
            (seq (util/get-blocks-by-id id)))
      (highlight-element! anchor)
      (when (< attempt 120)
        (js/setTimeout #(wait-for-anchor-element! anchor (inc attempt)) 50)))))

(defn add-style-if-exists!
  []
  (p/let [style (or (state/get-custom-css-link)
                    (when-let [repo (state/get-current-repo)]
                      (<get-file-content repo "logseq/custom.css")))]
    (when style
      (p/let [style (assets-handler/<expand-assets-links-for-db-graph style)]
        (util/add-style! style)))))

(defn reset-custom-css!
  []
  (when-let [el-style (gdom/getElement "logseq-custom-theme-id")]
    (dom/remove! el-style))
  (add-style-if-exists!))

(def *js-execed (atom #{}))

(defn exec-js-if-exists-&-allowed!
  [t]
  (when-let [href (or
                   (state/get-custom-js-link)
                   (config/get-custom-js-path))]
    (let [k (str "ls-js-allowed-" href)
          execed #(swap! *js-execed conj href)
          execed? (contains? @*js-execed href)
          ask-allow #(let [r (js/confirm (t :plugin/custom-js-alert))]
                       (if r
                         (storage/set k (js/Date.now))
                         (storage/set k false))
                       r)
          allowed! (storage/get k)
          should-ask? (or (nil? allowed!)
                          (> (- (js/Date.now) allowed!) 604800000))
          exec-fn #(when-let [scripts (and % (string/trim %))]
                     (when-not (string/blank? scripts)
                       (when (or (not should-ask?) (ask-allow))
                         (try
                           (js/eval scripts)
                           (execed)
                           (catch :default e
                             (js/console.error "[custom js]" e))))))]
      (when (and (not execed?)
                 (not= false allowed!))
        (cond
          (string/starts-with? href "http")
          (when (or (not should-ask?)
                    (ask-allow))
            (load href #(do (js/console.log "[custom js]" href) (execed))))

          :else
          (p/let [script (when-let [repo (state/get-current-repo)]
                           (<get-file-content repo href))]
            (when script
              (exec-fn script))))))))

(defn toggle-wide-mode!
  []
  (storage/set :ui/wide-mode (not (state/get-wide-mode?)))
  (state/toggle-wide-mode!))

;; auto-complete
(defn- reorder-matched
  "Reorder matched if grouped"
  [state]
  (let [matched (:matched state)
        grouped? (get-in state [:opts :grouped?])]
    (if grouped?
      (let [*idx (atom -1)
            inc-idx #(swap! *idx inc)]
        (->>
         (for [[_group matched] (group-by :group matched)]
           (doall (map (fn [item] (inc-idx) item) matched)))
         (apply concat)))
      matched)))

(defn- auto-complete-group-heading
  "Returns the `.ui__ac-group-name` immediately above `element`, if any.

  Slash-command groups render that heading as the previous sibling of the
  focused item's `.menu-link-wrap`."
  [element]
  (when-let [heading (some-> element .-parentElement .-previousElementSibling)]
    (when (some-> heading .-classList (.contains "ui__ac-group-name"))
      heading)))

(defn- auto-complete-scroll-geometry
  "Builds focused-item geometry from `container` and `element` DOM nodes.

  `item-top` is in container scroll coordinates so callers can compute a
  corrected `scrollTop` without depending on `offsetParent`.

  When the focused item starts a group, `item-top` includes the group heading
  so arrowing back to the first command also reveals the label above it."
  [container element]
  (when (and container element)
    (let [container-rect (.getBoundingClientRect container)
          element-rect (.getBoundingClientRect element)
          heading (auto-complete-group-heading element)
          heading-rect (when heading (.getBoundingClientRect heading))
          scroll-top (.-scrollTop container)
          container-top (.-top container-rect)
          element-top (+ scroll-top (- (.-top element-rect) container-top))
          cluster-top (if heading-rect
                        (+ scroll-top (- (.-top heading-rect) container-top))
                        element-top)]
      {:scroll-top scroll-top
       :viewport-height (.-clientHeight container)
       :item-top cluster-top
       :item-height (- (+ element-top (.-height element-rect)) cluster-top)})))

(defn- auto-complete-keep-visible-scroll-top
  "Returns a `scrollTop` that keeps the focused item inside the viewport."
  [{:keys [scroll-top viewport-height item-top item-height]}]
  (let [item-bottom (+ item-top item-height)
        viewport-bottom (+ scroll-top viewport-height)]
    (cond
      (< item-top scroll-top)
      (max 0 item-top)

      (> item-bottom viewport-bottom)
      (max 0 (- item-bottom viewport-height))

      :else
      scroll-top)))

(defn- auto-complete-scroll-into-view!
  "Keeps the highlighted auto-complete item visible in `#ui__ac-inner`.

  Slash-command and search popups scroll that inner list, not the popover
  wrapper. Arrow up/down used to set `scrollTop` on `#ui__ac`'s parent, so
  the chosen row could move out of view."
  [idx]
  (when-let [element (gdom/getElement (str "ac-" idx))]
    (when-let [container (gdom/getElement "ui__ac-inner")]
      (when-let [geometry (auto-complete-scroll-geometry container element)]
        (set! (.-scrollTop container)
              (auto-complete-keep-visible-scroll-top geometry))))))

(defn auto-complete-prev
  [state e]
  (let [current-idx (get state :frontend.ui/current-idx)
        matched (reorder-matched state)]
    (util/stop e)
    (cond
      (>= @current-idx 1)
      (swap! current-idx dec)
      (= @current-idx 0)
      (reset! current-idx (dec (count matched)))
      :else nil)
    (auto-complete-scroll-into-view! @current-idx)))

(defn auto-complete-next
  [state e]
  (let [current-idx (get state :frontend.ui/current-idx)
        matched (reorder-matched state)]
    (util/stop e)
    (let [total (count matched)]
      (if (>= @current-idx (dec total))
        (reset! current-idx 0)
        (swap! current-idx inc)))
    (auto-complete-scroll-into-view! @current-idx)))

(defn auto-complete-complete
  [state e]
  (let [{:keys [on-chosen on-enter]} (:opts state)
        matched (reorder-matched state)
        current-idx (get state :frontend.ui/current-idx)]
    (util/stop e)
    (if (and (seq matched)
             (> (count matched)
                @current-idx))
      (on-chosen (nth matched @current-idx) e)
      (and on-enter (on-enter state)))))

(defn auto-complete-shift-complete
  [state e]
  (let [{:keys [on-chosen on-shift-chosen on-enter]} (:opts state)
        matched (reorder-matched state)
        current-idx (get state :frontend.ui/current-idx)]
    (util/stop e)
    (if (and (seq matched)
             (> (count matched)
                @current-idx))
      ((or on-shift-chosen on-chosen) (nth matched @current-idx) false)
      (and on-enter (on-enter state)))))

(defn toggle-cards!
  []
  (if (shui-dialog/get-dialog :srs)
    (shui/dialog-close!)
    (state/pub-event! [:modal/show-cards])))

(defn open-new-window-or-tab!
  "Open a new Electron window or web tab."
  [target]
  (when target
    (let [{:keys [repo graph-id]} (if (map? target)
                                    target
                                    {:repo target})]
      (if (util/electron?)
        (ipc/ipc "openNewWindow" repo)
        (do
          (when-not (seq graph-id)
            (throw (js/Error. "Missing graph id")))
          (js/window.open (str (let [location (.-location js/window)]
                                 (str (.-origin location) (.-pathname location)))
                               "#/?graph-id=" (js/encodeURIComponent graph-id))
                          "_blank"))))))

(defn toggle-show-empty-hidden-properties!
  []
  (let [editing-block (state/get-edit-block)
        selected-ids (state/get-selection-block-ids)
        block-ids (if editing-block
                    (conj selected-ids (:block/uuid editing-block))
                    selected-ids)
        {:keys [ids mode show?]} (state/get-state :ui/show-empty-and-hidden-properties?)]
    (if (seq block-ids)
      (let [block-ids' (set block-ids)]
        (state/set-state! :ui/show-empty-and-hidden-properties?
                          {:mode :block
                           :ids block-ids'
                           :show? (cond
                                    (= mode :global)
                                    true
                                    (not= ids block-ids')
                                    true
                                    :else
                                    (not show?))}))
      (state/set-state! :ui/show-empty-and-hidden-properties?
                        {:mode :global
                         :show? (if (= mode :block)
                                  true
                                  (not show?))}))))

(defn scroll-to-anchor-block
  [^js ref rows gallery?]
  (when ref
    (let [anchor (get-in (state/get-route-match) [:query-params :anchor])
          anchor-id (when (and anchor (string/starts-with? anchor "ls-block-"))
                      (let [id (subs anchor 9)]
                        (when (util/uuid-string? id)
                          (uuid id))))]
      (when (and ref anchor-id)
        (let [block-ids (mapv (fn [row]
                                (if (uuid? row) row (:block/uuid row)))
                              rows)
              find-idx (fn [anchor-id]
                         (let [idx (.indexOf block-ids anchor-id)]
                           (when (pos? idx) idx)))
              scroll-to-idx! (fn [idx]
                               (js/setTimeout
                                (fn []
                                  (.scrollToIndex ref #js {:index idx})
                                  ;; wait until this block has been rendered.
                                  (wait-for-anchor-element! anchor 0))
                                ;; BUG: grid scrollToIndex not working in useEffect on first render
                                ;; https://github.com/petyosi/react-virtuoso/issues/757
                                (if gallery? 100 0)))]
          (if-let [idx (find-idx anchor-id)]
            (scroll-to-idx! idx)
            (when-let [repo (state/get-current-repo)]
              (p/let [block (<pull-anchor-block repo anchor-id)
                      parents (when-let [db-id (:db/id block)]
                                (<get-block-parents repo db-id))]
                ;; Mount the anchor's ancestor chain through lazy children and
                ;; expand collapsed ancestors so the target row can render.
                (doseq [parent parents]
                  (when (:block/uuid parent)
                    (state/set-state! [:ui/anchor-mount (:block/uuid parent)] true)
                    (expand-collapsed-ancestor! parent)))
                (when-let [idx (some find-idx (map :block/uuid parents))]
                  (scroll-to-idx! idx))))))))))
