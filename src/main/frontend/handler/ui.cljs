(ns frontend.handler.ui
  (:require [cljs-time.core :refer [plus days weeks]]
            [dommy.core :as dom]
            [frontend.util :as util]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.config :as config]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [frontend.fs :as fs]
            [frontend.loader :refer [load]]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [clojure.string :as string]
            [rum.core :as rum]))

;; sidebars
(defn close-left-sidebar!
  []
  (when-let [elem (gdom/getElement "close-left-bar")]
    (.click elem)))

(defn toggle-left-sidebar!
  []
  (state/set-left-sidebar-open!
    (not (@state/state :ui/left-sidebar-open?))))

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
  (when-not (:srs/mode? @state/state)
    (state/toggle-settings!)))

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
        (state/exit-editing-and-set-selected-blocks! elements))
      (when-let [element (gdom/getElement fragment)]
        (util/scroll-to-element fragment)
        (dom/add-class! element "block-highlight")
        (js/setTimeout #(dom/remove-class! element "block-highlight")
                       4000)))))

(defn add-style-if-exists!
  []
  (when-let [style (or
                    (state/get-custom-css-link)
                    (db-model/get-custom-css)
                    ;; (state/get-custom-css-link)
)]
    (util/add-style! style)))

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
                          (> (- (js/Date.now) allowed!) 604800000))]
      (when (and (not execed?)
                 (not= false allowed!))
        (if (string/starts-with? href "http")
          (when (or (not should-ask?)
                    (ask-allow))
            (load href #(do (js/console.log "[custom js]" href) (execed))))
          (util/p-handle
            (fs/read-file (if (util/electron?) "" (config/get-repo-dir (state/get-current-repo))) href)
            #(when-let [scripts (and % (string/trim %))]
               (when-not (string/blank? scripts)
                 (if (or (not should-ask?) (ask-allow))
                   (try
                     (do
                       (js/eval scripts)
                       (execed))
                     (catch js/Error e
                       (js/console.error "[custom js]" e))))))))))))

(defn toggle-wide-mode!
  []
  (let [wide? (state/get-wide-mode?)
        elements (array-seq (js/document.getElementsByClassName "cp__sidebar-main-content"))
        max-width (if wide? "var(--ls-main-content-max-width)" "var(--ls-main-content-max-width-wide)")]
    (when-let [element (first elements)]
      (dom/set-style! element :max-width max-width))
    (state/toggle-wide-mode!)))

;; auto-complete
(defn auto-complete-prev
  [state e]
  (let [current-idx (get state :frontend.ui/current-idx)
        matched (first (:rum/args state))]
    (util/stop e)
    (cond
      (>= @current-idx 1)
      (swap! current-idx dec)
      (= @current-idx 0)
      (reset! current-idx (dec (count matched)))
      :else nil)
    (when-let [element (gdom/getElement (str "ac-" @current-idx))]
      (let [modal (gobj/get (gdom/getElement "ui__ac") "parentElement")
            height (or (gobj/get modal "offsetHeight") 300)
            scroll-top (- (gobj/get element "offsetTop") (/ height 2))]
        (set! (.-scrollTop modal) scroll-top)))))

(defn auto-complete-next
  [state e]
  (let [current-idx (get state :frontend.ui/current-idx)
        matched (first (:rum/args state))]
    (util/stop e)
    (let [total (count matched)]
      (if (>= @current-idx (dec total))
        (reset! current-idx 0)
        (swap! current-idx inc)))
    (when-let [element (gdom/getElement (str "ac-" @current-idx))]
      (let [modal (gobj/get (gdom/getElement "ui__ac") "parentElement")
            height (or (gobj/get modal "offsetHeight") 300)
            scroll-top (- (gobj/get element "offsetTop") (/ height 2))]
        (set! (.-scrollTop modal) scroll-top)))))

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

(defn auto-complete-shift-complete
  [state e]
  (let [[matched {:keys [on-chosen on-shift-chosen on-enter]}] (:rum/args state)
        current-idx (get state :frontend.ui/current-idx)]
    (util/stop e)
    (if (and (seq matched)
             (> (count matched)
                @current-idx))
      ((or on-shift-chosen on-chosen) (nth matched @current-idx) false)
      (and on-enter (on-enter state)))))

;; date-picker
;; TODO: find a better way
(def *internal-model (rum/cursor state/state :date-picker/date))

(defn- non-edit-input?
  []
  (when-let [elem js/document.activeElement]
    (and (util/input? elem)
         (when-let [id (gobj/get elem "id")]
           (not (string/starts-with? id "edit-block-"))))))

(defn- input-or-select?
  []
  (when-let [elem js/document.activeElement]
    (or (non-edit-input?)
        (util/select? elem))))

(defn- inc-date [date n] (plus date (days n)))

(defn- inc-week [date n] (plus date (weeks n)))

(defn shortcut-complete
  [state e]
  (let [{:keys [on-change deadline-or-schedule?]} (last (:rum/args state))]
    (when (and on-change
               (not (input-or-select?)))
      (when-not deadline-or-schedule?
        (on-change e @*internal-model)))))

(defn shortcut-prev-day
  [_state e]
  (when-not (input-or-select?)
    (util/stop e)
    (swap! *internal-model inc-date -1)))

(defn shortcut-next-day
  [_state e]
  (when-not (input-or-select?)
    (util/stop e)
    (swap! *internal-model inc-date 1)))

(defn shortcut-prev-week
  [_state e]
  (when-not (input-or-select?)
    (util/stop e)
    (swap! *internal-model inc-week -1)))

(defn shortcut-next-week
  [_state e]
  (when-not (input-or-select?)
    (util/stop e)
    (swap! *internal-model inc-week 1)))

(defn toggle-cards!
  []
  (if (:modal/show? @state/state)
    (state/close-modal!)
    (state/pub-event! [:modal/show-cards])))
