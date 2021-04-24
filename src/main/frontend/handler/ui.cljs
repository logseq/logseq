(ns frontend.handler.ui
  (:require [dommy.core :as dom]
            [frontend.state :as state]
            [frontend.db :as db]
            [rum.core :as rum]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [frontend.util :as util :refer-macros [profile]]))

;; sidebars
(defn close-left-sidebar!
  []
  (when-let [elem (gdom/getElement "close-left-bar")]
    (.click elem)))

(defn hide-right-sidebar
  []
  (state/hide-right-sidebar!))

(defn show-right-sidebar
  []
  (state/open-right-sidebar!))

(defn toggle-right-sidebar!
  []
  (state/toggle-sidebar-open?!))

(defn toggle-contents!
  []
  (when-let [current-repo (state/get-current-repo)]
    (let [id "contents"]
      (if (state/sidebar-block-exists? id)
        (state/sidebar-remove-block! id)
        (state/sidebar-add-block! current-repo id :contents nil)))))

(defn toggle-help!
  []
  (when-let [current-repo (state/get-current-repo)]
    (let [id "help"]
      (if (state/sidebar-block-exists? id)
        (state/sidebar-remove-block! id)
        (state/sidebar-add-block! current-repo id :help nil)))))

(defn toggle-settings-modal!
  []
  (state/toggle-settings!))

;; FIXME: re-render all embedded blocks since they will not be re-rendered automatically


(defn re-render-root!
  ([]
   (re-render-root! {}))
  ([{:keys [clear-all-query-state?]
     :or {clear-all-query-state? false}}]
   (when-let [component (state/get-root-component)]
     (if clear-all-query-state?
       (db/clear-query-state!)
       (db/clear-query-state-without-refs-and-embeds!))
     (rum/request-render component)
     (doseq [component (state/get-custom-query-components)]
       (rum/request-render component)))))

(defn re-render-file!
  []
  (when-let [component (state/get-file-component)]
    (when (= :file (state/get-current-route))
      (rum/request-render component))))

(defn highlight-element!
  [fragment]
  (let [id (and
            (> (count fragment) 36)
            (subs fragment (- (count fragment) 36)))]
    (if (and id (util/uuid-string? id))
      (let [elements (array-seq (js/document.getElementsByClassName id))]
        (when (first elements)
          (util/scroll-to-element (gobj/get (first elements) "id")))
        (doseq [element elements]
          (dom/add-class! element "block-highlight")
          (js/setTimeout #(dom/remove-class! element "block-highlight")
                         4000)))
      (when-let [element (gdom/getElement fragment)]
        (util/scroll-to-element fragment)
        (dom/add-class! element "block-highlight")
        (js/setTimeout #(dom/remove-class! element "block-highlight")
                       4000)))))

(defn scroll-and-highlight!
  [state]
  (if-let [fragment (util/get-fragment)]
    (highlight-element! fragment))
  state)

(defn add-style-if-exists!
  []
  (when-let [style (or
                    (state/get-custom-css-link)
                    (db/get-custom-css)
                    ;; (state/get-custom-css-link)
)]
    (util/add-style! style)))

(defn toggle-wide-mode!
  []
  (let [wide? (state/get-wide-mode?)
        elements (array-seq (js/document.getElementsByClassName "cp__sidebar-main-content"))
        max-width (if wide? "var(--ls-main-content-max-width)" "100%")]
    (when-let [element (first elements)]
      (dom/set-style! element :max-width max-width))
    (state/toggle-wide-mode!)))

;; auto-complete
(defn auto-complete-prev
  [state e]
  (let [current-idx (get state :frontend.ui/current-idx)
        matched (first (:rum/args state))]
    (util/stop e)
    (js/console.log "go prev" current-idx)
    (cond
      (>= @current-idx 1)
      (swap! current-idx dec)
      (= @current-idx 0)
      (reset! current-idx (dec (count matched)))
      :else nil)
    (when-let [element (gdom/getElement (str "ac-" @current-idx))]
      (let [ac-inner (gdom/getElement "ui__ac-inner")
            element-top (gobj/get element "offsetTop")
            scroll-top (- (gobj/get element "offsetTop") 360)]
        (set! (.-scrollTop ac-inner) scroll-top)))))

(defn auto-complete-next
  [state e]
  (let [current-idx (get state :frontend.ui/current-idx)
        matched (first (:rum/args state))]
    (util/stop e)
    (js/console.log "go next" current-idx "##matched" matched)
    (let [total (count matched)]
      (if (>= @current-idx (dec total))
        (reset! current-idx 0)
        (swap! current-idx inc)))
    (when-let [element (gdom/getElement (str "ac-" @current-idx))]
      (let [ac-inner (gdom/getElement "ui__ac-inner")
            scroll-top (- (gobj/get element "offsetTop") 360)]
        (set! (.-scrollTop ac-inner) scroll-top)))))

(defn auto-complete-complete
  [state e]
  (let [[matched {:keys [on-chosen on-enter]}] (:rum/args state)
        current-idx (get state :frontend.ui/current-idx)]
    (util/stop e)
    (if (and (seq matched)
             (> (count matched)
                @current-idx))
      (on-chosen (nth matched @current-idx) false)
      (and on-enter (on-enter state)))))
