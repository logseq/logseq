(ns frontend.extensions.pdf.highlights
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.context.i18n :as i18n]
            [frontend.extensions.pdf.assets :as pdf-assets]
            [frontend.extensions.pdf.utils :as pdf-utils]
            [frontend.handler.notification :as notification]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.rum :refer [use-atom]]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [frontend.ui :as ui]
            [frontend.util :as front-utils]
            [medley.core :as medley]
            [promesa.core :as p]
            [rum.core :as rum]))

(defn dd [& args]
  (apply js/console.debug args))

(def *area-mode? (atom false))
(def *area-dashed? (atom ((fnil identity false) (storage/get (str "ls-pdf-area-is-dashed")))))

(defn reset-current-pdf!
  []
  (state/set-state! :pdf/current nil))

(rum/defcs pdf-highlight-finder
  < rum/static rum/reactive
  [state ^js viewer]
  (when viewer
    (when-let [ref-hl (state/sub :pdf/ref-highlight)]
      ;; delay handle: aim to fix page blink
      (js/setTimeout #(pdf-utils/scroll-to-highlight viewer ref-hl) 100)
      (js/setTimeout #(state/set-state! :pdf/ref-highlight nil) 1000))))

(rum/defc pdf-page-finder < rum/static
  [^js viewer]
  (when viewer
    (when-let [current (:pdf/current @state/state)]
      (let [active-hl (:pdf/ref-highlight @state/state)
            page-key (:filename current)
            last-page (and page-key
                           (front-utils/safe-parse-int (storage/get (str "ls-pdf-last-page-" page-key))))]

        (when (and last-page (nil? active-hl))
          (set! (.-currentPageNumber viewer) last-page)))))
  nil)

(rum/defc pdf-resizer
  [^js viewer]
  (let [el-ref (rum/use-ref nil)
        adjust-main-size!
        (front-utils/debounce
          200 (fn [width]
                (let [root-el js/document.documentElement]
                  (.setProperty (.-style root-el) "--ph-view-container-width" width)
                  (pdf-utils/adjust-viewer-size! viewer))))]

    ;; draggable handler
    (rum/use-effect!
      (fn []
        (when-let [el (and (fn? js/window.interact) (rum/deref el-ref))]
          (-> (js/interact el)
              (.draggable
                (bean/->js
                  {:listeners
                   {:move
                    (fn [^js/MouseEvent e]
                      (let [width js/document.documentElement.clientWidth
                            offset (.-left (.-rect e))
                            el-ratio (.toFixed (/ offset width) 6)
                            target-el (js/document.getElementById "pdf-layout-container")]
                        (when target-el
                          (let [width (str (min (max (* el-ratio 100) 20) 80) "vw")]
                            (.setProperty (.-style target-el) "width" width)
                            (adjust-main-size! width)))))}}))

              (.styleCursor false)
              (.on "dragstart" #(.. js/document.documentElement -classList (add "is-resizing-buf")))
              (.on "dragend" #(.. js/document.documentElement -classList (remove "is-resizing-buf")))))
        #())
      [])
    [:span.extensions__pdf-resizer {:ref el-ref}]))

(rum/defc pdf-highlights-ctx-menu
  [^js viewer
   {:keys [highlight point ^js range]}
   {:keys [clear-ctx-tip! add-hl! upd-hl! del-hl!]}]

  (rum/use-effect!
    (fn []
      (let [cb #(clear-ctx-tip!)]
        (js/setTimeout #(js/document.addEventListener "click" cb))
        #(js/document.removeEventListener "click" cb)))
    [])

  ;; TODO: precise position
  ;;(when-let [
  ;;page-bounding (and highlight (pdf-utils/get-page-bounding viewer (:page highlight)))
  ;;])

  (let [*el (rum/use-ref nil)
        head-height 0                                       ;; 48 temp
        top (- (+ (:y point) (.. viewer -container -scrollTop)) head-height)
        left (:x point)
        id (:id highlight)
        content (:content highlight)]

    (rum/use-effect!
      (fn []
        (let [^js el (rum/deref *el)
              {:keys [x y]} (front-utils/calc-delta-rect-offset el (.closest el ".extensions__pdf-viewer"))]
          (set! (.. el -style -transform)
                (str "translate3d(" (if (neg? x) (- x 5) 0) "px," (if (neg? y) (- y 5) 0) "px" ",0)")))
        #())
      [])

    (rum/with-context
      [[t] i18n/*tongue-context*]

      [:ul.extensions__pdf-hls-ctx-menu
       {:ref      *el
        :style    {:top top :left left}
        :on-click (fn [^js/MouseEvent e]
                    (when-let [action (.. e -target -dataset -action)]
                      (case action
                        "ref"
                        (pdf-assets/copy-hl-ref! highlight)

                        "copy"
                        (do
                          (front-utils/copy-to-clipboard!
                            (or (:text content) (.toString range)))
                          (pdf-utils/clear-all-selection))

                        "link"
                        (do
                          (pdf-assets/goto-block-ref! highlight))

                        "del"
                        (do
                          (del-hl! highlight)
                          (pdf-assets/del-ref-block! highlight)
                          (pdf-assets/unlink-hl-area-image$ viewer (:pdf/current @state/state) highlight))

                        ;; colors
                        (let [properties {:color action}]
                          (if-not id
                            ;; add highlight
                            (let [highlight (merge (if (fn? highlight) (highlight) highlight)
                                                   {:id         (pdf-utils/gen-uuid)
                                                    :properties properties})]
                              (add-hl! highlight)
                              (pdf-utils/clear-all-selection)
                              (pdf-assets/copy-hl-ref! highlight))

                            ;; update highlight
                            (do
                              (upd-hl! (assoc highlight :properties properties)))))))

                    (clear-ctx-tip!))}

       [:li.item-colors
        (for [it ["yellow", "blue", "green", "red", "purple"]]
          [:a {:key it :data-color it :data-action it} it])]


       (and id [:li.item {:data-action "ref"} (t :pdf/copy-ref)])

       (and (not (:image content)) [:li.item {:data-action "copy"} (t :pdf/copy-text)])

       (and id [:li.item {:data-action "link"} (t :pdf/linked-ref)])

       (and id [:li.item {:data-action "del"} (t :delete)])
       ])))

(rum/defc pdf-highlights-text-region
  [^js viewer vw-hl hl
   {:keys [show-ctx-tip!]}]

  (let [id (:id hl)
        {:keys [rects]} (:position vw-hl)
        {:keys [color]} (:properties hl)
        open-tip! (fn [^js/MouseEvent e]
                    (.preventDefault e)
                    (let [x (.-clientX e)
                          y (.-clientY e)]

                      (show-ctx-tip! viewer hl {:x x :y y})))]

    [:div.extensions__pdf-hls-text-region
     {:on-click        open-tip!
      :on-context-menu open-tip!}

     (map-indexed
       (fn [idx rect]
         [:div.hls-text-region-item
          {:key        idx
           :style      rect
           :data-color color}])
       rects)]))

(rum/defc pdf-highlight-area-region
  [^js viewer vw-hl hl
   {:keys [show-ctx-tip! upd-hl!]}]

  (let [*el (rum/use-ref nil)
        *dirty (rum/use-ref nil)
        open-tip! (fn [^js/MouseEvent e]
                    (.preventDefault e)
                    (when-not (rum/deref *dirty)
                      (let [x (.-clientX e)
                            y (.-clientY e)]

                        (show-ctx-tip! viewer hl {:x x :y y}))))]

    ;; resizable
    (rum/use-effect!
      (fn []
        (let [^js el (rum/deref *el)
              ^js it (-> (js/interact el)
                         (.resizable
                           (bean/->js
                             {:edges     {:left true :right true :top true :bottom true}
                              :listeners {:start (fn [^js/MouseEvent e]
                                                   (rum/set-ref! *dirty true))

                                          :end   (fn [^js/MouseEvent e]
                                                   (let [vw-pos (:position vw-hl)
                                                         ^js target (. e -target)
                                                         ^js vw-rect (. e -rect)
                                                         [dx, dy] (mapv #(let [val (.getAttribute target (str "data-" (name %)))]
                                                                           (if-not (nil? val) (js/parseFloat val) 0)) [:x :y])
                                                         to-top (+ (get-in vw-pos [:bounding :top]) dy)
                                                         to-left (+ (get-in vw-pos [:bounding :left]) dx)
                                                         to-w (. vw-rect -width)
                                                         to-h (. vw-rect -height)
                                                         to-vw-pos (update vw-pos :bounding assoc
                                                                           :top to-top
                                                                           :left to-left
                                                                           :width to-w
                                                                           :height to-h)

                                                         to-sc-pos (pdf-utils/vw-to-scaled-pos viewer to-vw-pos)]

                                                     ;; TODO: exception
                                                     (let [hl' (assoc hl :position to-sc-pos)
                                                           hl' (assoc-in hl' [:content :image] (js/Date.now))]

                                                       (p/then
                                                         (pdf-assets/persist-hl-area-image$ viewer
                                                                                            (:pdf/current @state/state)
                                                                                            hl' hl (:bounding to-vw-pos))
                                                         (fn [] (js/setTimeout
                                                                  #(do
                                                                     ;; reset dom effects
                                                                     (set! (.. target -style -transform) (str "translate(0, 0)"))
                                                                     (.removeAttribute target "data-x")
                                                                     (.removeAttribute target "data-y")

                                                                     (upd-hl! hl')) 200))))


                                                     (js/setTimeout #(rum/set-ref! *dirty false))))

                                          :move  (fn [^js/MouseEvent e]
                                                   (let [^js/HTMLElement target (.-target e)
                                                         x (.getAttribute target "data-x")
                                                         y (.getAttribute target "data-y")
                                                         bx (if-not (nil? x) (js/parseFloat x) 0)
                                                         by (if-not (nil? y) (js/parseFloat y) 0)]

                                                     ;; update element style
                                                     (set! (.. target -style -width) (str (.. e -rect -width) "px"))
                                                     (set! (.. target -style -height) (str (.. e -rect -height) "px"))

                                                     ;; translate when resizing from top or left edges
                                                     (let [ax (+ bx (.. e -deltaRect -left))
                                                           ay (+ by (.. e -deltaRect -top))]

                                                       (set! (.. target -style -transform) (str "translate(" ax "px, " ay "px)"))

                                                       ;; cache pos
                                                       (.setAttribute target "data-x" ax)
                                                       (.setAttribute target "data-y" ay))
                                                     ))}
                              :modifiers [;; minimum
                                          (js/interact.modifiers.restrictSize
                                            (bean/->js {:min {:width 60 :height 25}}))]
                              :inertia   true})
                           ))]
          ;; destroy
          #(.unset it)))
      [hl])

    (when-let [vw-bounding (get-in vw-hl [:position :bounding])]
      (let [{:keys [color]} (:properties hl)]
        [:div.extensions__pdf-hls-area-region
         {:ref             *el
          :style           vw-bounding
          :data-color      color
          :on-click        open-tip!
          :on-context-menu open-tip!}]))))

(rum/defc pdf-highlights-region-container
  [^js viewer page-hls ops]

  [:div.hls-region-container
   (for [hl page-hls]
     (let [vw-hl (update-in hl [:position] #(pdf-utils/scaled-to-vw-pos viewer %))]
       (rum/with-key
         (if (get-in hl [:content :image])
           (pdf-highlight-area-region viewer vw-hl hl ops)
           (pdf-highlights-text-region viewer vw-hl hl ops))
         (:id hl))
       ))])

(rum/defc pdf-highlight-area-selection
  [^js viewer {:keys [clear-ctx-tip! show-ctx-tip!] :as ops}]

  (let [^js viewer-clt (.. viewer -viewer -classList)
        *el (rum/use-ref nil)
        *cnt-el (rum/use-ref nil)
        *sta-el (rum/use-ref nil)
        *cnt-rect (rum/use-ref nil)

        [start-coord, set-start-coord!] (rum/use-state nil)
        [end-coord, set-end-coord!] (rum/use-state nil)
        [_ set-area-mode!] (use-atom *area-mode?)

        should-start (fn [^js e]
                       (let [^js target (.-target e)]
                         (when (and (not
                                      (.contains (.-classList target) "extensions__pdf-hls-area-region"))
                                    (.closest target ".page"))
                           (and e (or (.-metaKey e)
                                      (and front-utils/win32? (.-shiftKey e))
                                      @*area-mode?)))))

        reset-coords #(do
                        (set-start-coord! nil)
                        (set-end-coord! nil)
                        (rum/set-ref! *sta-el nil))

        calc-coords (fn [page-x page-y]
                      (when-let [cnt-el (or (rum/deref *cnt-el)
                                            (when-let [cnt-el (.querySelector (.closest (rum/deref *el) ".extensions__pdf-viewer-cnt") ".extensions__pdf-viewer")]
                                              (rum/set-ref! *cnt-el cnt-el) cnt-el))]
                        (let [cnt-rect (rum/deref *cnt-rect)
                              cnt-rect (or cnt-rect (bean/->clj (.toJSON (.getBoundingClientRect cnt-el))))
                              _ (rum/set-ref! *cnt-rect cnt-rect)]

                          {:x (- page-x (:left cnt-rect) (.-scrollLeft cnt-el))
                           :y (-> page-y
                                  (- (:top cnt-rect))
                                  (+ (.-scrollTop cnt-el)))})))

        calc-pos (fn [start end]
                   {:left   (min (:x start) (:x end))
                    :top    (min (:y start) (:y end))
                    :width  (js/Math.abs (- (:x end) (:x start)))
                    :height (js/Math.abs (- (:y end) (:y start)))})

        disable-text-selection! #(js-invoke viewer-clt (if % "add" "remove") "disabled-text-selection")

        fn-move (rum/use-callback
                  (fn [^js/MouseEvent e]
                    (set-end-coord! (calc-coords (.-pageX e) (.-pageY e))))
                  [])]

    (rum/use-effect!
      (fn []
        (when-let [^js/HTMLElement root (.closest (rum/deref *el) ".extensions__pdf-container")]
          (let [fn-start (fn [^js/MouseEvent e]
                           (if (should-start e)
                             (do
                               (rum/set-ref! *sta-el (.-target e))
                               (set-start-coord! (calc-coords (.-pageX e) (.-pageY e)))
                               (disable-text-selection! true)

                               (.addEventListener root "mousemove" fn-move))

                             ;; reset
                             (reset-coords)))

                fn-end (fn [^js/MouseEvent e]
                         (when-let [start-el (rum/deref *sta-el)]
                           (let [end (calc-coords (.-pageX e) (.-pageY e))
                                 pos (calc-pos start-coord end)]

                             (if (and (> (:width pos) 10)
                                      (> (:height pos) 10))

                               (when-let [^js page-el (.closest start-el ".page")]
                                 (let [page-number (int (.-pageNumber (.-dataset page-el)))
                                       page-pos (merge pos {:top  (- (:top pos) (.-offsetTop page-el))
                                                            :left (- (:left pos) (.-offsetLeft page-el))})
                                       vw-pos {:bounding page-pos :rects [] :page page-number}
                                       sc-pos (pdf-utils/vw-to-scaled-pos viewer vw-pos)

                                       point {:x (.-clientX e) :y (.-clientY e)}
                                       hl {:id         nil
                                           :page       page-number
                                           :position   sc-pos
                                           :content    {:text "[:span]" :image (js/Date.now)}
                                           :properties {}}]

                                   ;; ctx tips
                                   (show-ctx-tip! viewer hl point {:reset-fn #(reset-coords)})

                                   ;; export area highlight
                                   ;;(dd "[selection end] :start"
                                   ;;    start-coord ":end" end ":pos" pos
                                   ;;    ":page" page-number
                                   ;;    ":offset" page-pos
                                   ;;    ":vw-pos" vw-pos
                                   ;;    ":sc-pos" sc-pos)
                                   )

                                 (set-area-mode! false))

                               ;; reset
                               (reset-coords)))

                           (disable-text-selection! false)
                           (.removeEventListener root "mousemove" fn-move)))]

            (doto root
              (.addEventListener "mousedown" fn-start)
              (.addEventListener "mouseup" fn-end #js {:once true}))

            ;; destroy
            #(doto root
               (.removeEventListener "mousedown" fn-start)
               (.removeEventListener "mouseup" fn-end)))))
      [start-coord])

    [:div.extensions__pdf-area-selection
     {:ref *el}
     (when (and start-coord end-coord)
       [:div.shadow-rect {:style (calc-pos start-coord end-coord)}])]))

(rum/defc pdf-highlights
  [^js el ^js viewer initial-hls loaded-pages {:keys [set-dirty-hls!]}]

  (let [^js doc (.-ownerDocument el)
        ^js win (.-defaultView doc)
        *mounted (rum/use-ref false)
        [sel-state, set-sel-state!] (rum/use-state {:range nil :collapsed nil :point nil})
        [highlights, set-highlights!] (rum/use-state initial-hls)
        [tip-state, set-tip-state!] (rum/use-state {:highlight nil :vw-pos nil :range nil :point nil :reset-fn nil})

        clear-ctx-tip! (rum/use-callback
                         #(let [reset-fn (:reset-fn tip-state)]
                            (set-tip-state! {})
                            (and (fn? reset-fn) (reset-fn)))
                         [tip-state])

        show-ctx-tip! (fn [^js viewer hl point & ops]
                        (let [vw-pos (pdf-utils/scaled-to-vw-pos viewer (:position hl))]
                          (set-tip-state! (apply merge (list* {:highlight hl :vw-pos vw-pos :point point} ops)))))

        add-hl! (fn [hl] (when (:id hl)
                           ;; fix js object
                           (let [highlights (pdf-utils/fix-nested-js highlights)]
                             (set-highlights! (conj highlights hl)))

                           (when-let [vw-pos (and (pdf-assets/area-highlight? hl)
                                                  (pdf-utils/scaled-to-vw-pos viewer (:position hl)))]
                             ;; exceptions
                             (pdf-assets/persist-hl-area-image$ viewer (:pdf/current @state/state)
                                                                hl nil (:bounding vw-pos)))))

        upd-hl! (fn [hl]
                  (let [highlights (pdf-utils/fix-nested-js highlights)]
                    (when-let [[target-idx] (medley/find-first
                                              #(= (:id (second %)) (:id hl))
                                              (medley/indexed highlights))]
                      (set-highlights! (assoc-in highlights [target-idx] hl))
                      (pdf-assets/update-hl-area-block! hl))))

        del-hl! (fn [hl] (when-let [id (:id hl)] (set-highlights! (into [] (remove #(= id (:id %)) highlights)))))]

    ;; consume dirtied
    (rum/use-effect!
      (fn []
        (if (rum/deref *mounted)
          (set-dirty-hls! highlights)
          (rum/set-ref! *mounted true)))
      [highlights])

    ;; selection events
    (rum/use-effect!
      (fn []
        (let [fn-selection-ok
              (fn [^js/MouseEvent e]
                (let [^js/Selection selection (js/document.getSelection)
                      ^js/Range sel-range (.getRangeAt selection 0)]

                  (cond
                    (.-isCollapsed selection)
                    (set-sel-state! {:collapsed true})

                    (and sel-range (.contains el (.-commonAncestorContainer sel-range)))
                    (set-sel-state! {:collapsed false :range sel-range :point {:x (.-clientX e) :y (.-clientY e)}}))))

              fn-selection
              (fn []
                (let [*dirty (volatile! false)
                      fn-dirty #(vreset! *dirty true)]

                  (js/document.addEventListener "selectionchange" fn-dirty)
                  (js/document.addEventListener "mouseup"
                                                (fn [^js e]
                                                  (and @*dirty (fn-selection-ok e))
                                                  (js/document.removeEventListener "selectionchange" fn-dirty))
                                                #js {:once true})))

              fn-resize
              (partial pdf-utils/adjust-viewer-size! viewer)]

          ;;(doto (.-eventBus viewer))

          (doto el
            (.addEventListener "mousedown" fn-selection))

          (doto win
            (.addEventListener "resize" fn-resize))

          ;; destroy
          #(do
             ;;(doto (.-eventBus viewer))

             (doto el
               (.removeEventListener "mousedown" fn-selection))

             (doto win
               (.removeEventListener "resize" fn-resize)))))

      [viewer])

    ;; selection context menu
    (rum/use-effect!
      (fn []
        (when-let [^js sel-range (and (not (:collapsed sel-state)) (:range sel-state))]
          (let [^js point (:point sel-state)
                hl-fn #(when-let [page-info (pdf-utils/get-page-from-range sel-range)]
                         (when-let [sel-rects (pdf-utils/get-range-rects<-page-cnt sel-range (:page-el page-info))]
                           (let [page (int (:page-number page-info))
                                 ^js bounding (pdf-utils/get-bounding-rect sel-rects)
                                 vw-pos {:bounding bounding :rects sel-rects :page page}
                                 sc-pos (pdf-utils/vw-to-scaled-pos viewer vw-pos)]

                             ;; TODO: debug
                             ;;(dd "[VW x SC] ====>" vw-pos sc-pos)
                             ;;(dd "[Range] ====> [" page-info "]" (.toString sel-range) point)
                             ;;(dd "[Rects] ====>" sel-rects " [Bounding] ====>" bounding)


                             {:id         nil
                              :page       page
                              :position   sc-pos
                              :content    {:text (.toString sel-range)}
                              :properties {}})))]

            ;; show ctx menu
            (set-tip-state! {:highlight hl-fn
                             :range     sel-range
                             :point     point}))))

      [(:range sel-state)])

    ;; render hls
    (rum/use-effect!
      (fn []
        ;;(dd "=== rebuild highlights ===" (count highlights))

        (when-let [grouped-hls (and (sequential? highlights) (group-by :page highlights))]
          (doseq [page loaded-pages]
            (when-let [^js/HTMLDivElement hls-layer (pdf-utils/resolve-hls-layer! viewer page)]
              (let [page-hls (get grouped-hls page)]

                (rum/mount
                  ;; TODO: area & text hls
                  (pdf-highlights-region-container
                    viewer page-hls {:show-ctx-tip! show-ctx-tip!
                                     :upd-hl!       upd-hl!})

                  hls-layer)))))

        ;; destroy
        #())
      [loaded-pages highlights])

    [:div.extensions__pdf-highlights-cnt

     ;; hl context tip menu
     (when (:highlight tip-state)
       (js/ReactDOM.createPortal
         (pdf-highlights-ctx-menu
           viewer tip-state

           {:clear-ctx-tip! clear-ctx-tip!
            :add-hl!        add-hl!
            :del-hl!        del-hl!
            :upd-hl!        upd-hl!})

         (.querySelector el ".pp-holder")))

     ;; debug highlights anchor
     ;;(if (seq highlights)
     ;;  [:ul.extensions__pdf-highlights
     ;;   (for [hl highlights]
     ;;     [:li
     ;;      [:a
     ;;       {:on-click #(pdf-utils/scroll-to-highlight viewer hl)}
     ;;       (str "#" (:id hl) "#  ")]
     ;;      (:text (:content hl))])
     ;;   ])
     ;; refs
     (pdf-highlight-finder viewer)
     (pdf-page-finder viewer)

     ;; area selection container
     (pdf-highlight-area-selection
       viewer
       {:clear-ctx-tip! clear-ctx-tip!
        :show-ctx-tip!  show-ctx-tip!
        :add-hl!        add-hl!
        })]))

(rum/defc pdf-settings
  [^js viewer theme {:keys [hide-settings! select-theme! t]}]

  (let [*el-popup (rum/use-ref nil)
        [area-dashed? set-area-dashed?] (use-atom *area-dashed?)]

    (rum/use-effect!
      (fn []
        (let [el-popup (rum/deref *el-popup)
              cb (fn [^js e]
                   (and (= e.which 27) (hide-settings!)))]

          (js/setTimeout #(.focus el-popup))
          (.addEventListener el-popup "keyup" cb)
          #(.removeEventListener el-popup "keyup" cb)))
      [])

    (rum/use-effect!
      (fn []
        (storage/set "ls-pdf-area-is-dashed" (boolean area-dashed?)))
      [area-dashed?])

    [:div.extensions__pdf-settings.hls-popup-wrap.visible
     {:on-click (fn [^js/MouseEvent e]
                  (let [target (.-target e)]
                    (when-not (.contains (rum/deref *el-popup) target)
                      (hide-settings!))))}

     [:div.extensions__pdf-settings-inner.hls-popup-box
      {:ref       *el-popup
       :tab-index -1}

      [:div.extensions__pdf-settings-item.theme-picker
       (map (fn [it]
              [:button.flex.items-center.justify-center
               {:key it :class it :on-click #(do (select-theme! it) (hide-settings!))}
               (when (= theme it) (svg/check))])
            ["light", "warm", "dark"])]

      [:div.extensions__pdf-settings-item.toggle-input
       [:label (t :pdf/toggle-dashed)]
       (ui/toggle area-dashed? #(set-area-dashed? (not area-dashed?)) true)]
      ]]))

(rum/defc pdf-outline-item
  [^js viewer
   {:keys [title items href parent dest expanded] :as node}
   {:keys [upt-outline-node!] :as ops}]
  (let [has-child? (seq items)
        expanded? (boolean expanded)]

    [:div.extensions__pdf-outline-item
     {:class (front-utils/classnames [{:has-children has-child? :is-expand expanded?}])}
     [:div.inner
      [:a
       {:href      "javascript:void(0);"
        :data-dest (js/JSON.stringify (bean/->js dest))
        :on-click  (fn [^js/MouseEvent e]
                     (let [target (.-target e)]
                       (if (.closest target "i")
                         (let [path (map #(if (re-find #"\d+" %) (int %) (keyword %))
                                         (string/split parent #"\-"))]
                           (.preventDefault e)
                           (upt-outline-node! path {:expanded (not expanded?)}))
                         (when-let [^js dest (and dest (bean/->js dest))]
                           (.goToDestination (.-linkService viewer) dest)))))}

       [:i.arrow svg/arrow-right-v2]
       [:span title]]]

     ;; children
     (when (and has-child? expanded?)
       [:div.children
        (map-indexed
          (fn [idx itm]
            (let [parent (str parent "-items-" idx)]
              (rum/with-key
                (pdf-outline-item
                  viewer
                  (merge itm {:parent parent})
                  ops) parent))) items)])]))

(rum/defc pdf-outline
  [^js viewer visible? set-visible!]
  (when-let [^js pdf-doc (and viewer (.-pdfDocument viewer))]
    (let [*el-outline (rum/use-ref nil)
          [outline-data, set-outline-data!] (rum/use-state [])
          upt-outline-node! (rum/use-callback
                              (fn [path attrs]
                                (set-outline-data! (update-in outline-data path merge attrs)))
                              [outline-data])]

      (rum/use-effect!
        (fn []
          (p/catch
            (p/let [^js data (.getOutline pdf-doc)]
              (when-let [data (and data (.map data (fn [^js it]
                                                     (set! (.-href it) (.. viewer -linkService (getDestinationHash (.-dest it))))
                                                     (set! (.-expanded it) false)
                                                     it)))])
              (set-outline-data! (bean/->clj data)))

            (fn [e]
              (js/console.error "[Load outline Error]" e))))
        [pdf-doc])

      (rum/use-effect!
        (fn []
          (let [el-outline (rum/deref *el-outline)
                cb (fn [^js e]
                     (and (= e.which 27) (set-visible! false)))]

            (js/setTimeout #(.focus el-outline))
            (.addEventListener el-outline "keyup" cb)
            #(.removeEventListener el-outline "keyup" cb)))
        [])

      [:div.extensions__pdf-outline-wrap.hls-popup-wrap
       {:class    (front-utils/classnames [{:visible visible?}])
        :on-click (fn [^js/MouseEvent e]
                    (let [target (.-target e)]
                      (when-not (.contains (rum/deref *el-outline) target)
                        (set-visible! false))))}

       [:div.extensions__pdf-outline.hls-popup-box
        {:ref       *el-outline
         :tab-index -1}
        (if (seq outline-data)
          [:section
           (map-indexed (fn [idx itm]
                          (rum/with-key
                            (pdf-outline-item
                              viewer
                              (merge itm {:parent idx})
                              {:upt-outline-node! upt-outline-node!})
                            idx))
                        outline-data)]
          [:section.is-empty "No outlines"])]])))

(rum/defc docinfo-display
  [info close-fn!]
  [:div#pdf-docinfo.extensions__pdf-doc-info
   [:div.inner-text
    (for [[k v] info
          :let [k (str (string/replace-first (pr-str k) #"^\:" "") "::")]]
      [:p {:key k} [:strong k] "  " [:i (pr-str v)]])]

   [:div.flex.items-center.justify-center.pt-2.pb--2
    (ui/button "Copy all"
               :on-click
               (fn []
                 (let [text (.-innerText (js/document.querySelector "#pdf-docinfo > .inner-text"))
                       text (string/replace-all text #"[\n\t]+" "\n")]
                   (front-utils/copy-to-clipboard! text)
                   (notification/show! "Copied!" :success)
                   (close-fn!))))]])

(defn make-docinfo-in-modal
  [info]
  (fn [close-fn!]
    (docinfo-display info close-fn!)))

(rum/defc pdf-toolbar
  [^js viewer]
  (let [[area-mode? set-area-mode!] (use-atom *area-mode?)
        [outline-visible?, set-outline-visible!] (rum/use-state false)
        [settings-visible?, set-settings-visible!] (rum/use-state false)
        *page-ref (rum/use-ref nil)
        [current-page-num, set-current-page-num!] (rum/use-state 1)
        [total-page-num, set-total-page-num!] (rum/use-state 1)
        [viewer-theme, set-viewer-theme!] (rum/use-state (or (storage/get "ls-pdf-viewer-theme") "light"))]

    ;; themes hooks
    (rum/use-effect!
      (fn []
        (when-let [^js el (js/document.getElementById "pdf-layout-container")]
          (set! (. (. el -dataset) -theme) viewer-theme)
          (storage/set "ls-pdf-viewer-theme" viewer-theme)
          #(js-delete (. el -dataset) "theme")))
      [viewer-theme])

    ;; pager hooks
    (rum/use-effect!
      (fn []
        (when-let [total (and viewer (.-numPages (.-pdfDocument viewer)))]
          (let [^js bus (.-eventBus viewer)
                page-fn (fn [^js evt]
                          (let [^js input (rum/deref *page-ref)
                                num (.-pageNumber evt)]
                            (set! (. input -value) num)
                            (set-current-page-num! num)))]

            (set-total-page-num! total)
            (set-current-page-num! (.-currentPageNumber viewer))
            (.on bus "pagechanging" page-fn)
            #(.off bus "pagechanging" page-fn))))
      [viewer])

    (rum/with-context
      [[t] i18n/*tongue-context*]

      [:div.extensions__pdf-toolbar
       [:div.inner
        [:div.r.flex.buttons

         ;; appearance
         [:a.button
          {:title    "More settings"
           :on-click #(set-settings-visible! (not settings-visible?))}
          (svg/adjustments 18)]

         ;; selection
         [:a.button
          {:title    (str "Area highlight (" (if front-utils/mac? "⌘" "Shift") ")")
           :class    (when area-mode? "is-active")
           :on-click #(set-area-mode! (not area-mode?))}
          (svg/icon-area 18)]

         ;; zoom
         [:a.button
          {:title    "Zoom out"
           :on-click (partial pdf-utils/zoom-out-viewer viewer)}
          (svg/zoom-out 18)]

         [:a.button
          {:title    "Zoom in"
           :on-click (partial pdf-utils/zoom-in-viewer viewer)}
          (svg/zoom-in 18)]

         [:a.button
          {:title    "Outline"
           :on-click #(set-outline-visible! (not outline-visible?))}
          (svg/view-list 16)]

         ;; metadata
         [:a.button.is-info
          {:title    "Document info"
           :on-click #(p/let [ret (pdf-utils/get-meta-data$ viewer)]
                        (state/set-modal! (make-docinfo-in-modal ret)))}
          (svg/icon-info)]

         ;; annotations
         [:a.button
          {:title    "Annotations page"
           :on-click #(pdf-assets/goto-annotations-page! (:pdf/current @state/state))}
          (svg/annotations 16)]

         ;; pager
         [:div.pager.flex.items-center.ml-1

          [:span.nu.flex.items-center.opacity-70
           [:input {:ref            *page-ref
                    :type           "number"
                    :default-value  current-page-num
                    :on-mouse-enter #(.select ^js (.-target %))
                    :on-key-up      (fn [^js e]
                                      (let [^js input (.-target e)
                                            value (front-utils/safe-parse-int (.-value input))]
                                        (when (and (= (.-keyCode e) 13) value (> value 0))
                                          (set! (. viewer -currentPageNumber)
                                                (if (> value total-page-num) total-page-num value)))))}]
           [:small "/ " total-page-num]]

          [:span.ct.flex.items-center
           [:a.button {:on-click #(. viewer previousPage)} (svg/up-narrow)]
           [:a.button {:on-click #(. viewer nextPage)} (svg/down-narrow)]]]

         [:a.button
          {:on-click #(state/set-state! :pdf/current nil)}
          (t :close)]]]

       ;; contents outline
       (pdf-outline viewer outline-visible? set-outline-visible!)

       ;; settings
       (and settings-visible?
            (pdf-settings
              viewer
              viewer-theme
              {:t t
               :hide-settings! #(set-settings-visible! false)
               :select-theme!  #(set-viewer-theme! %)}))])))

(rum/defc pdf-viewer
  [url initial-hls ^js pdf-document ops]

  ;;(dd "==== render pdf-viewer ====")

  (let [*el-ref (rum/create-ref)
        [area-dashed?, set-area-dashed?] (use-atom *area-dashed?)
        [state, set-state!] (rum/use-state {:viewer nil :bus nil :link nil :el nil})
        [ano-state, set-ano-state!] (rum/use-state {:loaded-pages []})
        [page-ready?, set-page-ready!] (rum/use-state false)]

    ;; instant pdfjs viewer
    (rum/use-effect!
      (fn [] (let [^js event-bus (js/pdfjsViewer.EventBus.)
                   ^js link-service (js/pdfjsViewer.PDFLinkService. #js {:eventBus event-bus :externalLinkTarget 2})
                   ^js el (rum/deref *el-ref)
                   ^js viewer (js/pdfjsViewer.PDFViewer.
                                #js {:container            el
                                     :eventBus             event-bus
                                     :linkService          link-service
                                     :enhanceTextSelection true
                                     :textLayerMode        2
                                     :removePageBorders    true})]
               (. link-service setDocument pdf-document)
               (. link-service setViewer viewer)

               ;; TODO: debug
               (set! (. js/window -lsPdfViewer) viewer)

               (p/then (. viewer setDocument pdf-document)
                       #(set-state! {:viewer viewer :bus event-bus :link link-service :el el}))

               ;;TODO: destroy
               (fn []
                 (when-let [last-page (.-currentPageNumber viewer)]
                   (storage/set (str "ls-pdf-last-page-" (front-utils/node-path.basename url)) last-page))

                 (when pdf-document (.destroy pdf-document)))))
      [])

    ;; interaction events
    (rum/use-effect!
      (fn []
        (when-let [^js viewer (:viewer state)]
          (let [^js el (rum/deref *el-ref)

                fn-textlayer-ready
                (fn [^js p]
                  (set-ano-state! {:loaded-pages (conj (:loaded-pages ano-state) (int (.-pageNumber p)))}))

                fn-page-ready
                (fn []
                  (set! (. viewer -currentScaleValue) "auto")
                  (set-page-ready! true))]

            (doto (.-eventBus viewer)
              (.on "pagesinit" fn-page-ready)
              (.on "textlayerrendered" fn-textlayer-ready))

            #(do
               (doto (.-eventBus viewer)
                 (.off "pagesinit" fn-page-ready)
                 (.off "textlayerrendered" fn-textlayer-ready))))))

      [(:viewer state)
       (:loaded-pages ano-state)])

    (let [^js viewer (:viewer state)]
      [:div.extensions__pdf-viewer-cnt
       [:div.extensions__pdf-viewer
        {:ref *el-ref :class (front-utils/classnames [{:is-area-dashed @*area-dashed?}])}
        [:div.pdfViewer "viewer pdf"]
        [:div.pp-holder]

        (when (and page-ready? viewer)
          [(rum/with-key
             (pdf-highlights
               (:el state) viewer
               initial-hls (:loaded-pages ano-state)
               ops) "pdf-highlights")])]

       (when (and page-ready? viewer)
         [(rum/with-key (pdf-resizer viewer) "pdf-resizer")
          (rum/with-key (pdf-toolbar viewer) "pdf-toolbar")])])))

(rum/defc pdf-loader
  [{:keys [url hls-file] :as pdf-current}]
  (let [*doc-ref (rum/use-ref nil)
        [state, set-state!] (rum/use-state {:error nil :pdf-document nil :status nil})
        [hls-state, set-hls-state!] (rum/use-state {:initial-hls nil :latest-hls nil})
        repo-cur (state/get-current-repo)
        repo-dir (config/get-repo-dir repo-cur)
        set-dirty-hls! (fn [latest-hls]                     ;; TODO: incremental
                         (set-hls-state! {:initial-hls [] :latest-hls latest-hls}))]

    ;; load highlights
    (rum/use-effect!
      (fn []
        (p/catch
          (p/let [data (pdf-assets/load-hls-data$ pdf-current)
                  highlights (:highlights data)]
            (set-hls-state! {:initial-hls highlights}))

          ;; error
          (fn [e]
            (js/console.error "[load hls error]" e)
            (set-hls-state! {:initial-hls []})))

        ;; cancel
        #())
      [hls-file])

    ;; cache highlights
    (rum/use-effect!
      (fn []
        (when-let [hls (:latest-hls hls-state)]
          (p/catch
            (pdf-assets/persist-hls-data$ pdf-current hls)

            ;; write hls file error
            (fn [e]
              (js/console.error "[write hls error]" e)))))

      [(:latest-hls hls-state)])

    ;; load document
    (rum/use-effect!
      (fn []
        (let [get-doc$ (fn [^js opts] (.-promise (js/pdfjsLib.getDocument opts)))
              own-doc (rum/deref *doc-ref)
              opts {:url           url
                    :ownerDocument js/document
                    :cMapUrl       "./js/pdfjs/cmaps/"
                    ;;:cMapUrl       "https://cdn.jsdelivr.net/npm/pdfjs-dist@2.8.335/cmaps/"
                    :cMapPacked    true}]

          (p/finally
            (p/catch (p/then
                       (do
                         (set-state! {:status :loading})
                         (get-doc$ (clj->js opts)))
                       #(set-state! {:pdf-document %}))
                     #(set-state! {:error %}))
            #(set-state! {:status :completed}))

          #()))
      [url])

    (rum/use-effect!
      (fn []
        (when-let [error (:error state)]
          (dd "[ERROR loader]" (:error state))
          (case (.-name error)
            "MissingPDFException"
            (do
              (notification/show!
                (str (.-message error) " Is this the correct path?")
                :error
                false)
              (state/set-state! :pdf/current nil)))))
      [(:error state)])

    [:div.extensions__pdf-loader {:ref *doc-ref}
     (let [status-doc (:status state)
           initial-hls (:initial-hls hls-state)]

       (if (or (= status-doc :loading)
               (nil? initial-hls))

         [:div.flex.justify-center.items-center.h-screen.text-gray-500.text-md
          "Downloading PDF file " url]

         [(rum/with-key (pdf-viewer
                          url initial-hls
                          (:pdf-document state)
                          {:set-dirty-hls! set-dirty-hls!}) "pdf-viewer")]))]))

(rum/defc pdf-container
  [{:keys [identity] :as pdf-current}]
  (let [[prepared set-prepared!] (rum/use-state false)
        [ready set-ready!] (rum/use-state false)]

    ;; load assets
    (rum/use-effect!
      (fn []
        (p/then
          (pdf-utils/load-base-assets$)
          (fn [] (set-prepared! true))))
      [])

    ;; refresh loader
    (rum/use-effect!
      (fn []
        (js/setTimeout #(set-ready! true) 100)
        #(set-ready! false))
      [identity])

    [:div#pdf-layout-container.extensions__pdf-container
     (when (and prepared identity ready)
       (pdf-loader pdf-current))]))

(rum/defc playground-effects
  [active]

  (rum/use-effect!
    (fn []
      (let [flg "is-pdf-active"
            ^js cls (.-classList js/document.body)]
        (and active (.add cls flg))

        #(.remove cls flg)))

    [active])
  nil)

(rum/defcs playground
  < rum/static rum/reactive
    (shortcut/mixin :shortcut.handler/pdf)
  [state]
  (let [pdf-current (state/sub :pdf/current)]
    [:div.extensions__pdf-playground

     (playground-effects (not (nil? pdf-current)))

     (when pdf-current
       (js/ReactDOM.createPortal
         (pdf-container pdf-current)
         (js/document.querySelector "#app-single-container")))]))
