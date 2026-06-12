(ns logseq.shui.popup.core
  (:require [dommy.core :as d]
            [io.factorhouse.hsx.core :as hsx]
            [logseq.shui.util :as util :refer [use-atom]]
            [medley.core :as medley]))

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

(declare hide!)

(defn- same-popup-target?
  [^js target ^js target']
  (and target target'
       (or (= target target')
           (and (.-contains target) (.contains target target')))))

(defn- element?
  [target]
  (instance? js/Element target))

(defn- native-event [^js event]
  (or (some-> event (.-nativeEvent)) event))

(defn- event-target [^js event]
  (let [^js native-event (native-event event)]
    (or (some-> event (.-target))
        (some-> native-event (.-target))
        (some-> event (.-currentTarget))
        (some-> native-event (.-currentTarget)))))

(defn- event-related-target [^js event]
  (let [^js native-event (native-event event)]
    (or (some-> event (.-relatedTarget))
        (some-> native-event (.-relatedTarget))
        (some-> event (.-toElement))
        (some-> native-event (.-toElement)))))

(defn- close-targets
  [^js event-details]
  (let [event (some-> event-details (.-event))]
    (remove nil?
            [(some-> event-details (.-trigger))
             (event-related-target event)
             (event-target event)])))

(defn- popup-content-target?
  [target]
  (and (element? target)
       (some? (.closest target ".ui__dropdown-menu-content, .ui__dropdown-menu-sub-content, .ui__popover-content, .ui__context-menu-content, .ui__context-menu-sub-content"))))

(defn- popup-focus-retained?
  [targets]
  (some popup-content-target? targets))

(def ^:private menu-transition-close-reasons
  #{"trigger-hover" "trigger-focus" "list-navigation" "sibling-open"})

(defn- input-target?
  [target]
  (and (element? target)
       (or (instance? js/HTMLInputElement target)
           (instance? js/HTMLTextAreaElement target)
           (instance? js/HTMLSelectElement target)
           (some? (.closest target "[contenteditable='true']")))))

(defn- prevent-base-ui-handler!
  [^js event]
  (when (fn? (.-preventBaseUIHandler event))
    (.preventBaseUIHandler event)))

(defn- menu-key-down-handler
  [content-props disable-menu-handlers?]
  (fn [^js event]
    (some-> content-props :on-key-down (apply [event]))
    (when (or disable-menu-handlers?
              (input-target? (event-target event)))
      (prevent-base-ui-handler! event))))

(defn- stop-toggle-event! [^js event]
  (let [^js native-event (native-event event)]
    (doseq [^js e (distinct (remove nil? [event native-event]))]
      (when (fn? (.-preventDefault e))
        (.preventDefault e))
      (when (fn? (.-stopPropagation e))
        (.stopPropagation e))
      (when (fn? (.-stopImmediatePropagation e))
        (.stopImmediatePropagation e)))))

(defn- clear-selection!
  []
  (some-> js/window
          (.getSelection)
          (.removeAllRanges)))

(defn- consume-toggle-event! [^js event]
  (stop-toggle-event! event)
  (clear-selection!))

(defn- close-canceled?
  [handler ^js event-details]
  (let [native-event (some-> event-details (.-event))
        result (when (fn? handler) (handler native-event))]
    (when (or (false? result)
              (some-> native-event (.-defaultPrevented))
              (some-> event-details (.-isCanceled)))
      (some-> event-details (.cancel))
      true)))

(defn show!
  [^js event content & {:keys [id as-mask? as-dropdown? as-content?
                               focus-trigger? align root-props content-props
                               on-before-hide on-after-hide trigger-id] :as opts}]
  (let [id (or id (gen-id))
        ;; _ (prn :debug :show :id id)
        *target (volatile! nil)
        pointer-event? (or (instance? js/MouseEvent (or (.-nativeEvent event) event))
                           (instance? js/goog.events.BrowserEvent event))
        position (cond
                   (vector? event) event

                   pointer-event?
                   (let [event' (or (.-nativeEvent event) event)]
                     (vreset! *target (some->> [(.-currentTarget event)
                                                 (.-currentTarget event')
                                                 (.-target event')
                                                 (.-target event)]
                                                (filter element?)
                                                first))
                     [(.-clientX event') (.-clientY event')])

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
    (let [target @*target
          opened (some->> (get-popups) (filter #(= id (:id %))) (first))]
      (if opened
        (do
          (consume-toggle-event! event)
          (hide! (:id opened) 0 {:event event})
          (:id opened))
        (do
          (when (element? target)
            (d/set-attr! target "data-popup-active" (if (keyword? id) (name id) (str id))))
          (let [on-before-hide (fn [^js e]
                                 (when (and (not (false? focus-trigger?))
                                            (some? target)
                                            (= js/document (.-ownerDocument target))
                                            (.-isConnected target)
                                            (fn? (.-focus target)))
                                   (js/setTimeout #(.focus target) 16))
                                 (some-> on-before-hide (apply [e])))]
            (upsert-popup!
             (merge opts
                    {:id id :target target
                     :trigger-id trigger-id
                     :open? true :content content :position position
                     :as-dropdown? as-dropdown?
                     :as-content? as-content?
                     :root-props root-props
                     :on-before-hide on-before-hide
                     :on-after-hide on-after-hide
                     :content-props (cond-> content-props
                                      (not (nil? align))
                                      (assoc :align (name align)))}))))))))

(defn hide!
  ([] (when-let [id (some-> (get-popups) (last) :id)] (hide! id 0)))
  ([id] (hide! id 0 {}))
  ([id delay] (hide! id delay {}))
  ([id delay {:keys [_all? ^js event]}]
   ;; (prn :debug :hide id)
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

(defn- virtual-anchor
  [target x y _width height]
  (let [height (if (and (number? height) (> height 0)) height 1)
        rect #js {:x x :y y :left x :top y :right (inc x) :bottom (+ y height)
                  :width 1 :height height}
        anchor #js {:getBoundingClientRect #(js/Object.assign #js {} rect)}]
    (when (element? target)
      (aset anchor "contextElement" target))
    anchor))

(defn- anchor-props
  [content-props target position]
  (let [[x y width height] position]
    {:anchor (virtual-anchor target x y width height)
     :position-method (or (:position-method content-props)
                          (:positionMethod content-props)
                          "fixed")}))

(defn- anchor-height
  [height]
  (if (and (number? height) (> height 0)) height 1))

(hsx/defc x-popup
  [{:keys [id open? content position as-dropdown? as-content? force-popover?
           auto-side? as-mask? _auto-focus? target root-props content-props
           _on-before-hide _on-after-hide]
    :as _props}]
  (when-let [[_x y _width height] position]
    (let [use-menu? (not force-popover?)
          popup-root (if use-menu? dropdown-menu popover)
          popup-content (if use-menu? dropdown-menu-content popover-content)
          auto-side-fn (fn []
                         (let [vh js/window.innerHeight
                               height (anchor-height height)
                               [th bh] [y (- vh (+ y height))]]
                           (if (> bh 280)
                             "bottom"
                             (if (> (- th bh) 100)
                               "top" "bottom"))))
          auto-side? (if (boolean? auto-side?) auto-side? true)
          content-props (cond-> content-props
                          (and (not as-mask?) auto-side?) (assoc :side (auto-side-fn)))
          handle-open-change! (fn [open? ^js e]
                                (some-> root-props (:onOpenChange) (apply [open? e]))
                                (when-not open?
                                  (let [native-event (some-> e (.-event))
                                        reason (some-> e (.-reason))
                                        targets (close-targets e)
                                        target-toggle? (some #(same-popup-target? target %) targets)
                                        focus-retained? (and (= reason "focus-out")
                                                             (popup-focus-retained? targets))
                                        menu-transition? (and use-menu?
                                                              (contains? menu-transition-close-reasons reason))
                                        handler (case reason
                                                  "escape-key" (:onEscapeKeyDown content-props)
                                                  "outside-press" (:onPointerDownOutside content-props)
                                                  nil)]
                                    ;; (prn :debug :id id :reason reason)
                                    (if (or target-toggle?
                                            menu-transition?
                                            focus-retained?)
                                      (some-> e (.cancel))
                                      (when-not (close-canceled? handler e)
                                        (hide! id 1 {:event native-event}))))))]
      (let [disable-menu-handlers? (and use-menu? (not as-dropdown?))
            content-props (cond-> (merge content-props
                                          (anchor-props content-props target position))
                            as-mask?
                            (assoc :data-as-mask true)

                            use-menu?
                            (assoc :on-key-down
                                   (menu-key-down-handler content-props disable-menu-handlers?))

                            disable-menu-handlers?
                            (assoc :on-pointer-move prevent-base-ui-handler!))
             content (if (fn? content)
                       (content (cond-> {:id id}
                                  as-content?
                                  (assoc :content-props content-props))) content)]
        (popup-root
         (merge root-props {:open open?
                            :onOpenChange handle-open-change!})
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
