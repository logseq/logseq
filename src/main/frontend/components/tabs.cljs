(ns frontend.components.tabs
  "Tab bar component for page tabs"
  (:require [frontend.handler.tabs :as tabs-handler]
            [frontend.state :as state]
            [frontend.state.tabs :as tabs-state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]))

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

(rum/defc tab-item
  [tab active? index drag-state tabs-count]
  (let [title        (or (:title tab) "Untitled")
        ds           @drag-state
        drag-index   (:drag-index ds)
        dragging?    (= drag-index index)
        offset-x     (:offset-x ds 0)
        stride       (:stride ds 122)
        target-index (when drag-index
                       (compute-target-index drag-index offset-x stride tabs-count))
        shift        (when (and drag-index (not dragging?))
                       (tab-shift index drag-index target-index stride))]
    [:div.tab-item
     {:class (str (when active? "active ")
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
            (reset! drag-state {:drag-index index
                                :drag-id    (:id tab)
                                :start-x    (.-clientX e)
                                :offset-x   0
                                :tab-width  tw
                                :stride     stride}))))
      :on-pointer-move
      (fn [e]
        (when (= (:drag-index @drag-state) index)
          (swap! drag-state assoc :offset-x (- (.-clientX e) (:start-x @drag-state)))))
      :on-pointer-up
      (fn [_e]
        (when (= (:drag-index @drag-state) index)
          (let [{:keys [drag-index offset-x stride]} @drag-state
                target    (compute-target-index drag-index offset-x stride tabs-count)
                was-drag? (> (js/Math.abs offset-x) 5)]
            (when (not= target drag-index)
              (tabs-state/reorder-tabs! drag-index target))
            (reset! drag-state (if was-drag? {:was-drag? true} {})))))
      :on-pointer-cancel
      (fn [_e]
        (reset! drag-state {}))
      :on-click
      (fn [e]
        (util/stop e)
        (if (:was-drag? @drag-state)
          (reset! drag-state {})
          (tabs-handler/switch-tab! (:id tab))))}
     [:div.tab-title {:title title} title]
     [:div.tab-close
      {:on-pointer-down (fn [e] (.stopPropagation e))
       :on-click        (fn [e]
                          (util/stop e)
                          (tabs-handler/close-tab! (:id tab)))}
      (ui/icon "x" {:size 14})]]))

(rum/defcs tab-bar < rum/reactive
                     (rum/local {} ::drag-state)
                     {:did-mount    (fn [state]
                                      (.addEventListener js/document "focusin" on-doc-focusin)
                                      (.addEventListener js/document "keydown" on-doc-keydown)
                                      (.addEventListener js/document "pointerdown" on-doc-pointerdown)
                                      state)
                      :will-unmount (fn [state]
                                      (.removeEventListener js/document "focusin" on-doc-focusin)
                                      (.removeEventListener js/document "keydown" on-doc-keydown)
                                      (.removeEventListener js/document "pointerdown" on-doc-pointerdown)
                                      (when @hide-timer (js/clearTimeout @hide-timer) (reset! hide-timer nil))
                                      (reset! typing? false)
                                      state)}
  [state]
  (let [drag-state    (::drag-state state)
        tabs          (tabs-state/sub-tabs)
        active-tab-id (tabs-state/sub-active-tab-id)
        auto-hide?    (state/sub :ui/auto-hide-tabs-typing?)
        is-typing?    (rum/react typing?)
        hidden?       (and auto-hide? is-typing?)]
    [:div.tabs-container
     {:class          (when hidden? "tabs-typing-hidden")
      :on-mouse-enter (when auto-hide? on-tabs-mouse-enter)}
     [:div.tabs-bar
      (map-indexed
        (fn [idx tab]
          (rum/with-key
            (tab-item tab (= (:id tab) active-tab-id) idx drag-state (count tabs))
            (:id tab)))
        tabs)]]))
