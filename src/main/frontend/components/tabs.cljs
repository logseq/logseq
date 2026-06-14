(ns frontend.components.tabs
  "Tab bar component for page tabs"
  (:require [frontend.handler.tabs :as tabs-handler]
            [frontend.state :as state]
            [frontend.state.tabs :as tabs-state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [io.factorhouse.hsx.core :as hsx]
            [logseq.shui.hooks :as hooks]))

;; --- auto-hide typing state ---

(defonce ^:private typing? (atom false))
(defonce ^:private hide-timer (atom nil))

(defn- editor-element? [el]
  (when el
    (or (= (.-tagName el) "TEXTAREA")
        (= (.-tagName el) "INPUT")
        (= (.-contentEditable el) "true"))))

(defn- reveal-tabs! []
  (when @hide-timer (js/clearTimeout @hide-timer) (reset! hide-timer nil))
  (reset! typing? false))

(defn- on-doc-focusin [e]
  ;; Only start the countdown when tabs are still visible.
  ;; Once hidden, focusin/focusout (Enter, block clicks) must not reveal them.
  (when (and (editor-element? (.-target e)) (not @typing?))
    (when @hide-timer (js/clearTimeout @hide-timer))
    (reset! hide-timer
      (js/setTimeout
        (fn []
          (reset! typing? true)
          (reset! hide-timer nil))
        3000))))

(defn- on-doc-keydown [e]
  ;; Ctrl/Cmd combos are tab-switching shortcuts — reveal if hidden
  (when (and @typing? (or (.-ctrlKey e) (.-metaKey e)))
    (reveal-tabs!)))

(defn- on-doc-pointerdown [e]
  ;; Any interaction inside the left sidebar should reveal tabs
  (when @typing?
    (when-let [sidebar (.getElementById js/document "left-sidebar")]
      (when (.contains sidebar (.-target e))
        (reveal-tabs!)))))

(defn- on-tabs-mouse-enter [_e]
  (when @typing?
    (reveal-tabs!)))

;; --- drag helpers ---

(defn- compute-target-index [drag-index offset-x stride tabs-count]
  (-> (+ drag-index (js/Math.round (/ offset-x stride)))
      (max 0)
      (min (dec tabs-count))))

(defn- tab-shift [tab-index drag-index target-index stride]
  (cond
    (and (> target-index drag-index)
         (> tab-index drag-index)
         (<= tab-index target-index))
    (- stride)
    (and (< target-index drag-index)
         (< tab-index drag-index)
         (>= tab-index target-index))
    stride
    :else 0))

;; --- components ---

(hsx/defc tab-item
  [tab active? index drag-state set-drag-state! tabs-count]
  (let [title        (or (:title tab) "Untitled")
        drag-index   (:drag-index drag-state)
        dragging?    (= drag-index index)
        offset-x     (:offset-x drag-state 0)
        stride       (:stride drag-state 122)
        target-index (when drag-index
                       (compute-target-index drag-index offset-x stride tabs-count))
        shift        (when (and drag-index (not dragging?))
                       (tab-shift index drag-index target-index stride))]
    [:div.tab-item
     {:key   (:id tab)
      :class (str (when active? "active ")
                  (when dragging? "chrome-dragging"))
      :style (cond
               dragging?
               {:transform  (str "translateX(" offset-x "px)")
                :transition "none"
                :z-index    10
                :position   "relative"}
               (and shift (not= shift 0))
               {:transform (str "translateX(" shift "px)")}
               :else nil)
      :on-pointer-down
      (fn [e]
        (when (zero? (.-button e))
          (let [el     (.-currentTarget e)
                rect   (.getBoundingClientRect el)
                tw     (.-width rect)
                next   (.-nextElementSibling el)
                prev   (.-previousElementSibling el)
                stride (cond
                         next (- (.-left (.getBoundingClientRect next)) (.-left rect))
                         prev (- (.-left rect) (.-left (.getBoundingClientRect prev)))
                         :else (+ tw 2))]
            (.setPointerCapture el (.-pointerId e))
            (set-drag-state! {:drag-index index
                              :drag-id    (:id tab)
                              :start-x    (.-clientX e)
                              :offset-x   0
                              :tab-width  tw
                              :stride     stride}))))
      :on-pointer-move
      (fn [e]
        (when (= (:drag-index drag-state) index)
          (set-drag-state! (assoc drag-state :offset-x (- (.-clientX e) (:start-x drag-state))))))
      :on-pointer-up
      (fn [_e]
        (when (= (:drag-index drag-state) index)
          (let [{:keys [drag-index offset-x stride]} drag-state
                target    (compute-target-index drag-index offset-x stride tabs-count)
                was-drag? (> (js/Math.abs offset-x) 5)]
            (when (not= target drag-index)
              (tabs-state/reorder-tabs! drag-index target))
            (set-drag-state! (if was-drag? {:was-drag? true} {})))))
      :on-pointer-cancel
      (fn [_e]
        (set-drag-state! {}))
      :on-click
      (fn [e]
        (util/stop e)
        (if (:was-drag? drag-state)
          (set-drag-state! {})
          (tabs-handler/switch-tab! (:id tab))))}
     [:div.tab-title {:title title} title]
     [:div.tab-close
      {:on-pointer-down (fn [e] (.stopPropagation e))
       :on-click        (fn [e]
                          (util/stop e)
                          (tabs-handler/close-tab! (:id tab)))}
      (ui/icon "x" {:size 14})]]))

(hsx/defc tab-bar
  []
  (let [[drag-state set-drag-state!] (hooks/use-state {})
        tabs          (state/use-sub :tabs/tabs-list)
        active-tab-id (state/use-sub :tabs/active-tab-id)
        auto-hide?    (state/use-sub :ui/auto-hide-tabs-typing?)
        [is-typing?]  (hooks/use-atom typing?)
        hidden?       (and auto-hide? is-typing?)]
    (hooks/use-effect!
     (fn []
       (.addEventListener js/document "focusin" on-doc-focusin)
       (.addEventListener js/document "keydown" on-doc-keydown)
       (.addEventListener js/document "pointerdown" on-doc-pointerdown)
       (fn []
         (.removeEventListener js/document "focusin" on-doc-focusin)
         (.removeEventListener js/document "keydown" on-doc-keydown)
         (.removeEventListener js/document "pointerdown" on-doc-pointerdown)
         (when @hide-timer (js/clearTimeout @hide-timer) (reset! hide-timer nil))
         (reset! typing? false)))
     [])
    [:div.tabs-container
     {:class          (when hidden? "tabs-typing-hidden")
      :on-mouse-enter (when auto-hide? on-tabs-mouse-enter)}
     [:div.tabs-bar
      (map-indexed
        (fn [idx tab]
          (tab-item tab (= (:id tab) active-tab-id) idx drag-state set-drag-state! (count (or tabs []))))
        (or tabs []))]]))
