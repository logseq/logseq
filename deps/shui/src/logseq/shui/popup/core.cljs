(ns logseq.shui.popup.core
  (:require [dommy.core :as d]
            [io.factorhouse.hsx.core :as hsx]
            [logseq.shui.util :as util :refer [use-atom]]
            [medley.core :as medley]
            ))

;; ui
(def button (util/ui-wrap "Button"))
(def popover (util/ui-wrap "Popover"))
(def popover-trigger (util/ui-wrap "PopoverTrigger"))
(def popover-content (util/ui-wrap "PopoverContent"))
(def popover-arrow (util/ui-wrap "PopoverArrow"))
(def popover-close (util/ui-wrap "PopoverClose"))
(def popover-remove-scroll (util/ui-wrap "PopoverRemoveScroll"))
(def dropdown-menu (util/ui-wrap "DropdownMenu"))
(def dropdown-menu-trigger (util/ui-wrap "DropdownMenuTrigger"))
(def dropdown-menu-content (util/ui-wrap "DropdownMenuContent"))
(def dropdown-menu-arrow (util/ui-wrap "DropdownMenuArrow"))
(def dropdown-menu-group (util/ui-wrap "DropdownMenuGroup"))
(def dropdown-menu-item (util/ui-wrap "DropdownMenuItem"))
(def dropdown-menu-checkbox-item (util/ui-wrap "DropdownMenuCheckboxItem"))
(def dropdown-menu-radio-group (util/ui-wrap "DropdownMenuRadioGroup"))
(def dropdown-menu-radio-item (util/ui-wrap "DropdownMenuRadioItem"))
(def dropdown-menu-label (util/ui-wrap "DropdownMenuLabel"))
(def dropdown-menu-separator (util/ui-wrap "DropdownMenuSeparator"))
(def dropdown-menu-shortcut (util/ui-wrap "DropdownMenuShortcut"))
(def dropdown-menu-portal (util/ui-wrap "DropdownMenuPortal"))
(def dropdown-menu-sub (util/ui-wrap "DropdownMenuSub"))
(def dropdown-menu-sub-content (util/ui-wrap "DropdownMenuSubContent"))
(def dropdown-menu-sub-trigger (util/ui-wrap "DropdownMenuSubTrigger"))

;; {:id :open? false :content nil :position [0 0] :root-props nil :content-props nil}
(defonce ^:private *popups (atom []))
(defonce ^:private *id (atom 0))
(defonce ^:private gen-id #(reset! *id (inc @*id)))
(def *opened-sub-menus (atom #{}))

(defn get-popup
  [id]
  (when id
    (some->> (medley/indexed @*popups)
             (filter #(= id (:id (second %)))) (first))))

(defn get-popups [] @*popups)
(defn get-last-popup [] (last @*popups))

(defn upsert-popup!
  [config]
  (when-let [id (:id config)]
    (if-let [[index config'] (get-popup id)]
      (swap! *popups assoc index (merge config' config))
      (swap! *popups conj config)) id))

(defn update-popup!
  [id ks val]
  (when-let [[index config] (get-popup id)]
    (let [ks (if (coll? ks) ks [ks])
          config (if (nil? val)
                   (medley/dissoc-in config ks)
                   (assoc-in config ks val))]
      (swap! *popups assoc index config))))

(defn detach-popup!
  [id]
  (let [[index config] (get-popup id)]
    (when index
      (swap! *popups #(->> % (medley/remove-nth index) (vec)))
      (let [{:keys [auto-focus? target trigger-id]} config]
        (when (and auto-focus? target)
          (when-let [target (if trigger-id (js/document.getElementById trigger-id) target)]
            (d/add-class! target "ls-popup-closed")
            (.focus target)))))))

(defn show!
  [^js event content & {:keys [id as-mask? as-dropdown? as-content?
                               focus-trigger? align root-props content-props
                               on-before-hide on-after-hide trigger-id] :as opts}]
  (let [id (or id (gen-id))
        *target (volatile! nil)
        position (cond
                   (vector? event) event

                   (or (instance? js/MouseEvent (or (.-nativeEvent event) event))
                       (instance? js/goog.events.BrowserEvent event))
                   (do (vreset! *target (.-target (or (.-nativeEvent event) event)))
                       [(.-clientX event) (.-clientY event)])

                   (instance? js/Element event)
                   (let [^js rect (.getBoundingClientRect event)
                         left (.-left rect)
                         width (.-width rect)
                         height (.-height rect)
                         bottom (.-bottom rect)]
                     (vreset! *target event)
                     [(+ left (case (keyword align)
                                :start 0
                                :end width
                                (/ width 2)))
                      (- (- bottom height)
                        ;; minus default offset
                         (if as-mask? 6 0))
                      width (if as-mask? 1 height)])
                   (and (vector event) (= (count event) 2) (every? integer? event))
                   event
                   :else [0 0])]
    (some-> @*target (d/set-attr! "data-popup-active" (if (keyword? id) (name id) (str id))))
    (let [on-before-hide (fn [^js e]
                           (when-let [^js trigger (and (not (false? focus-trigger?))
                                                       (some-> @*target (.closest "[tabindex='0']")))]
                             (js/setTimeout #(.focus trigger) 16))
                           (some-> on-before-hide (apply [e])))]
      (upsert-popup!
       (merge opts
              {:id id :target (deref *target)
               :trigger-id trigger-id
               :open? true :content content :position position
               :as-dropdown? as-dropdown?
               :as-content? as-content?
               :root-props root-props
               :on-before-hide on-before-hide
               :on-after-hide on-after-hide
               :content-props (cond-> content-props
                                (not (nil? align))
                                (assoc :align (name align)))})))))

(defn hide!
  ([] (when-let [id (some-> (get-popups) (last) :id)] (hide! id 0)))
  ([id] (hide! id 0 {}))
  ([id delay] (hide! id delay {}))
  ([id delay {:keys [_all? ^js event]}]
   (when-let [popup (get-popup id)]
     (let [config (last popup)
           target (:target config)
           f (fn []
               (detach-popup! id)
               (some-> (:on-after-hide config) (apply [])))]
       (when (not (false? (some-> (:on-before-hide config) (apply [event]))))
         (some-> target (d/remove-attr! "data-popup-active"))
         (if (and (number? delay) (> delay 0))
           (js/setTimeout f delay)
           (f)))))))

(defn hide-all!
  []
  (doseq [{:keys [id]} @*popups]
    (hide! id 0 {:all? true})))

(hsx/defc x-popup
  [{:keys [id open? content position as-dropdown? as-content? force-popover?
           auto-side? as-mask? _auto-focus? _target root-props content-props
           _on-before-hide _on-after-hide]
    :as _props}]
  (when-let [[x y _ height] position]
    (let [popup-root (if (not force-popover?) dropdown-menu popover)
          popup-trigger (if (not force-popover?) dropdown-menu-trigger popover-trigger)
          popup-content (if (not force-popover?) dropdown-menu-content popover-content)
          auto-side-fn (fn []
                         (let [vh js/window.innerHeight
                               [th bh] [y (- vh (+ y height))]]
                           (if (> bh 280)
                             "bottom"
                             (if (> (- th bh) 100)
                               "top" "bottom"))))
          auto-side? (if (boolean? auto-side?) auto-side? true)
          content-props (cond-> content-props
                          (and (not as-mask?) auto-side?) (assoc :side (auto-side-fn)))
          handle-key-escape! (fn [^js e]
                               (when-not (false? (some-> content-props (:onEscapeKeyDown) (apply [e])))
                                 (hide! id 1 {:event e})))
          handle-pointer-outside! (fn [^js e]
                                    (when-not (false? (some-> content-props (:onPointerDownOutside) (apply [e])))
                                      (hide! id 1 {:event e})))
          handle-open-change! (fn [open? ^js e]
                                (some-> root-props (:onOpenChange) (apply [open? e]))
                                (when-not open?
                                  (when (= "escape-key" (.-reason e))
                                    (some-> (.-event e) (.preventDefault))
                                    (some-> (.-event e) (.stopPropagation)))
                                  (hide! id 1 {:event e})))]
      (popup-root
       (merge root-props {:open open?
                          :onOpenChange handle-open-change!})
       (popup-trigger
        {:as-child true}
        (button {:class "overflow-hidden fixed p-0 opacity-0"
                 :style {:height (if (and (number? height)
                                          (> height 0))
                                   height 1)
                         :width 1
                         :top y
                         :left x}} ""))
       (let [content-props (cond-> (merge content-props {:onEscapeKeyDown handle-key-escape!
                                                         :onPointerDownOutside handle-pointer-outside!})
                             as-mask?
                             (assoc :data-as-mask true)

                             (and (not force-popover?)
                                  (not as-dropdown?))
                             (assoc :on-key-down (fn [^js e]
                                                   (some-> content-props :on-key-down (apply [e]))
                                                   (set! (. e -defaultPrevented) true))
                                    :on-pointer-move #(set! (. % -defaultPrevented) true)))
             content (if (fn? content)
                       (content (cond-> {:id id}
                                  as-content?
                                  (assoc :content-props content-props))) content)]
         (if as-content?
           content
           (popup-content content-props content)))))))

(hsx/defc install-popups
  []
  (let [[popups _set-popups!] (use-atom *popups)]
    [:<>
     (for [config popups
           :when (and (map? config) (:id config) (not (:all? config)))]
       ^{:key (:id config)}
       [x-popup config])]))
