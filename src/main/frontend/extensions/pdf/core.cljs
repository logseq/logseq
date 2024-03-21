(ns frontend.extensions.pdf.core
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.components.svg :as svg]
            [frontend.components.block :as block]
            [frontend.context.i18n :refer [t]]
            [frontend.extensions.pdf.assets :as pdf-assets]
            [frontend.extensions.pdf.utils :as pdf-utils]
            [frontend.extensions.pdf.toolbar :refer [pdf-toolbar *area-dashed? *area-mode? *highlight-mode? *highlights-ctx*]]
            [frontend.extensions.pdf.windows :as pdf-windows]
            [frontend.handler.notification :as notification]
            [frontend.config :as config]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.commands :as commands]
            [frontend.rum :refer [use-atom]]
            [frontend.state :as state]
            [frontend.util :as util]
            [medley.core :as medley]
            [promesa.core :as p]
            [rum.core :as rum]
            [frontend.ui :as ui]))

(declare pdf-container system-embed-playground)

(def *highlight-last-color (atom :yellow))

(defn open-external-win! [pdf-current]
  (pdf-windows/open-pdf-in-new-window! system-embed-playground pdf-current))

(defn reset-current-pdf!
  []
  (state/set-state! :pdf/current nil))

(rum/defcs pdf-highlight-finder
  < rum/static rum/reactive
    (rum/local false ::mounted?)
  [state ^js viewer]
  (let [*mounted? (::mounted? state)]
    (when viewer
      (when-let [ref-hl (state/sub :pdf/ref-highlight)]
        ;; delay handle: aim to fix page blink
        (js/setTimeout
         (fn []
           (if (:id ref-hl)
             (pdf-utils/scroll-to-highlight viewer ref-hl)
             (set! (.-currentPageNumber viewer) (or (:page ref-hl) 1))))
         (if @*mounted? 50 500))

        (js/setTimeout
         #(state/set-state! :pdf/ref-highlight nil) 1000)))
    (reset! *mounted? true)))

(rum/defc pdf-page-finder < rum/static
  [^js viewer]
  (rum/use-effect!
   (fn []
     (when viewer
       (when-let [_ (:pdf/current @state/state)]
         (let [active-hl (:pdf/ref-highlight @state/state)]
           (when-not active-hl
             (.on (.-eventBus viewer) (name :restore-last-page)
                  (fn [last-page]
                    (when last-page
                      (set! (.-currentPageNumber viewer) (util/safe-parse-int last-page))))))))))
   [viewer])
  nil)

(rum/defc pdf-resizer
  "Watches for changes in the pdf container's width and adjusts the viewer."
  [^js viewer]
  (let [el-ref   (rum/use-ref nil)
        adjust-main-size!
                 (util/debounce
                  200 (fn [width]
                        (let [root-el js/document.documentElement]
                          (.setProperty (.-style root-el) "--ph-view-container-width" width)
                          (pdf-utils/adjust-viewer-size! viewer))))
        group-id (.-$groupIdentity viewer)]

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
                   (let [width     js/document.documentElement.clientWidth
                         offset    (.-left (.-rect e))
                         el-ratio  (.toFixed (/ offset width) 6)
                         target-el (js/document.getElementById (str "pdf-layout-container_" group-id))]
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

(rum/defc ^:large-vars/data-var pdf-highlights-ctx-menu
  "The contextual menu which appears over a text selection and allows e.g. creating a highlight."
  [^js viewer
   {:keys [highlight point ^js selection]}
   {:keys [clear-ctx-menu! add-hl! upd-hl! del-hl!]}]

  (rum/use-effect!
   (fn []
     (let [cb  #(clear-ctx-menu!)
           doc (pdf-windows/resolve-own-document viewer)]
       (js/setTimeout #(.addEventListener doc "click" cb))
       #(.removeEventListener doc "click" cb)))
   [])

  ;; TODO: precise position
  ;;(when-let [
  ;;page-bounding (and highlight (pdf-utils/get-page-bounding viewer (:page highlight)))
  ;;])

  (let [*el (rum/use-ref nil)
        ^js cnt (.-container viewer)
        head-height 0                                       ;; 48 temp
        top (- (+ (:y point) (.-scrollTop cnt)) head-height)
        left (+ (:x point) (.-scrollLeft cnt))
        id (:id highlight)
        new? (nil? id)
        new-&-highlight-mode? (and @*highlight-mode? new?)
        show-ctx-menu? (and (not new-&-highlight-mode?)
                            (or (not selection) (and selection (state/sub :pdf/auto-open-ctx-menu?))))
        content (:content highlight)
        area? (not (string/blank? (:image content)))
        action-fn! (fn [action clear?]
                     (when-let [action (and action (name action))]
                       (let [highlight (if (fn? highlight) (highlight) highlight)
                             content (:content highlight)]
                         (case action
                           "ref"
                           (pdf-assets/copy-hl-ref! highlight viewer)

                           "copy"
                           (do
                             (util/copy-to-clipboard!
                               (or (:text content) (pdf-utils/fix-selection-text-breakline (.toString selection)))
                               :owner-window (pdf-windows/resolve-own-window viewer))
                             (pdf-utils/clear-all-selection))

                           "link"
                           (pdf-assets/goto-block-ref! highlight)

                           "del"
                           (do
                             (del-hl! highlight)
                             (pdf-assets/del-ref-block! highlight)
                             (pdf-assets/unlink-hl-area-image$ viewer (:pdf/current @state/state) highlight))

                           "hook"
                           :dune

                           ;; colors
                           (let [properties {:color action}]
                             (if-not id
                               ;; add highlight
                               (let [highlight (merge highlight
                                                      {:id         (pdf-utils/gen-uuid)
                                                       :properties properties})]
                                 (add-hl! highlight)
                                 (pdf-utils/clear-all-selection)
                                 (pdf-assets/copy-hl-ref! highlight viewer))

                               ;; update highlight
                               (upd-hl! (assoc highlight :properties properties)))

                             (reset! *highlight-last-color (keyword action)))))

                       (and clear? (js/setTimeout #(clear-ctx-menu!) 68))))]

    (rum/use-effect!
     (fn []
       (if new-&-highlight-mode?
         ;; wait for selection cleared ...
         (js/setTimeout #(action-fn! @*highlight-last-color true) 300)
         (let [^js el (rum/deref *el)
               {:keys [x y]} (util/calc-delta-rect-offset el (.closest el ".extensions__pdf-viewer"))]
           (set! (.. el -style -transform)
                 (str "translate3d(" (if (neg? x) (- x 5) 0) "px," (if (neg? y) (- y 5) 0) "px" ",0)"))))
       #())
     [])

    [:ul.extensions__pdf-hls-ctx-menu
     {:ref      *el
      :style    {:top top
                 :left left
                 :visibility (if show-ctx-menu? "visible" "hidden")}
      :on-click (fn [^js/MouseEvent e]
                  (.stopPropagation e)
                  (when-let [action (.. e -target -dataset -action)]
                    (action-fn! action true)))}

     [:li.item-colors
      (for [it ["yellow", "red", "green", "blue", "purple"]]
        [:a {:key it :data-color it :data-action it} it])]


     (and id [:li.item {:data-action "ref"} (t :pdf/copy-ref)])

     (and (not area?) [:li.item {:data-action "copy"} (t :pdf/copy-text)])

     (and id [:li.item {:data-action "link"} (t :pdf/linked-ref)])

     (and id [:li.item {:data-action "del"} (t :delete)])

     (when (and config/lsp-enabled? (not area?))
       (for [[_ {:keys [key label extras] :as _cmd} action pid]
             (state/get-plugins-commands-with-type :highlight-context-menu-item)]
         [:li.item {:key         key
                    :data-action "hook"
                    :on-click    #(let [highlight (if (fn? highlight) (highlight) highlight)]
                                    (commands/exec-plugin-simple-command!
                                     pid {:key key :content (:content highlight) :point point} action)

                                    (when (true? (:clearSelection extras))
                                      (pdf-utils/clear-all-selection)))}
          label]))
     ]))

(rum/defc pdf-highlights-text-region
  [^js viewer vw-hl hl {:keys [show-ctx-menu!]}]

  (let [{:keys [id]} hl
        {:keys [rects]} (:position vw-hl)
        {:keys [color]} (:properties hl)

        open-ctx-menu!
        (fn [^js/MouseEvent e]
          (.preventDefault e)
          (let [x (.-clientX e)
                y (.-clientY e)]

            (show-ctx-menu! viewer hl {:x x :y y})))

        dragstart-handle!
        (fn [^js e]
          (when-let [^js dt (and id (.-dataTransfer e))]
            (reset! block/*dragging? true)
            (pdf-assets/ensure-ref-block! (state/get-current-pdf) hl)
            (.setData dt "text/plain" (str "((" id "))"))))]

    [:div.extensions__pdf-hls-text-region
     {:id              (str "hl_" id)
      :on-click        open-ctx-menu!
      :on-context-menu open-ctx-menu!}

     (map-indexed
      (fn [idx rect]
        [:div.hls-text-region-item
         {:key           idx
          :style         rect
          :draggable     "true"
          :on-drag-start dragstart-handle!
          :data-color    color}])
      rects)]))

(rum/defc ^:large-vars/cleanup-todo pdf-highlight-area-region
  [^js viewer vw-hl hl {:keys [show-ctx-menu!] :as ops}]

  (let [{:keys [id]}      hl
        *el               (rum/use-ref nil)
        *dirty            (rum/use-ref nil)
        *ops-ref          (rum/use-ref ops)
        open-ctx-menu!    (fn [^js/MouseEvent e]
                            (.preventDefault e)
                            (when-not (rum/deref *dirty)
                              (let [x (.-clientX e)
                                    y (.-clientY e)]

                                (show-ctx-menu! viewer hl {:x x :y y}))))

        dragstart-handle! (fn [^js e]
                            (when-let [^js dt (and id (.-dataTransfer e))]
                              (.setData dt "text/plain" (str "((" id "))"))))
        update-hl!        (fn [hl] (some-> (rum/deref *ops-ref) (:upd-hl!) (apply [hl])))]

    (rum/use-effect!
      (fn []
        (rum/set-ref! *ops-ref ops))
      [ops])

    ;; resizable
    (rum/use-effect!
     (fn []
       (let [^js el (rum/deref *el)
             ^js it (-> (js/interact el)
                        (.resizable
                         (bean/->js
                          {:edges     {:left true :right true :top true :bottom true}
                           :listeners {:start (fn [^js/MouseEvent _e]
                                                (rum/set-ref! *dirty true))

                                       :end   (fn [^js/MouseEvent e]
                                                (let [vw-pos      (:position vw-hl)
                                                      ^js target  (. e -target)
                                                      ^js vw-rect (. e -rect)
                                                      [dx, dy] (mapv #(let [val (.getAttribute target (str "data-" (name %)))]
                                                                        (if-not (nil? val) (js/parseFloat val) 0)) [:x :y])
                                                      to-top      (+ (get-in vw-pos [:bounding :top]) dy)
                                                      to-left     (+ (get-in vw-pos [:bounding :left]) dx)
                                                      to-w        (. vw-rect -width)
                                                      to-h        (. vw-rect -height)
                                                      to-vw-pos   (update vw-pos :bounding assoc
                                                                          :top to-top
                                                                          :left to-left
                                                                          :width to-w
                                                                          :height to-h)

                                                      to-sc-pos   (pdf-utils/vw-to-scaled-pos viewer to-vw-pos)]

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

                                                                (update-hl! hl')) 200))))


                                                  (js/setTimeout #(rum/set-ref! *dirty false))))

                                       :move  (fn [^js/MouseEvent e]
                                                (let [^js/HTMLElement target (.-target e)
                                                      x                      (.getAttribute target "data-x")
                                                      y                      (.getAttribute target "data-y")
                                                      bx                     (if-not (nil? x) (js/parseFloat x) 0)
                                                      by                     (if-not (nil? y) (js/parseFloat y) 0)]

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
                           :modifiers [(js/interact.modifiers.restrict
                                         (bean/->js {:restriction (.closest el ".page")}))]
                           :inertia   true})
                         ))]
         ;; destroy
         #(.unset it)))
     [hl])

    (when-let [vw-bounding (get-in vw-hl [:position :bounding])]
      (let [{:keys [color]} (:properties hl)]
        [:div.extensions__pdf-hls-area-region
         {:id              (str "hl_" id)
          :ref             *el
          :style           vw-bounding
          :data-color      color
          :draggable       "true"
          :on-drag-start   dragstart-handle!
          :on-click        open-ctx-menu!
          :on-context-menu open-ctx-menu!}]))))

(rum/defc pdf-highlights-region-container
  "Displays the highlights over a pdf document."
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

(rum/defc ^:large-vars/cleanup-todo pdf-highlight-area-selection
  [^js viewer {:keys [show-ctx-menu!]}]

  (let [^js viewer-clt          (.. viewer -viewer -classList)
        ^js cnt-el              (.-container viewer)
        *el                     (rum/use-ref nil)
        *start-el               (rum/use-ref nil)
        *cnt-rect               (rum/use-ref nil)
        *page-el                (rum/use-ref nil)
        *page-rect              (rum/use-ref nil)
        *start-xy               (rum/use-ref nil)

        [start, set-start!] (rum/use-state nil)
        [end, set-end!] (rum/use-state nil)
        [_ set-area-mode!] (use-atom *area-mode?)

        should-start            (fn [^js e]
                                  (let [^js target (.-target e)]
                                    (when (and (not (.contains (.-classList target) "extensions__pdf-hls-area-region"))
                                               (.closest target ".page"))
                                      (and e (or (.-metaKey e)
                                                 (.-shiftKey e)
                                                 @*area-mode?)))))

        reset-coords!           #(do
                                   (set-start! nil)
                                   (set-end! nil)
                                   (rum/set-ref! *start-xy nil)
                                   (rum/set-ref! *start-el nil)
                                   (rum/set-ref! *cnt-rect nil)
                                   (rum/set-ref! *page-el nil)
                                   (rum/set-ref! *page-rect nil))

        calc-coords!            (fn [page-x page-y]
                                  (when cnt-el
                                    (let [cnt-rect    (rum/deref *cnt-rect)
                                          cnt-rect    (or cnt-rect (bean/->clj (.toJSON (.getBoundingClientRect cnt-el))))
                                          page-rect   (rum/deref *page-rect)
                                          [start-x, start-y] (rum/deref *start-xy)
                                          dx-left?    (> start-x page-x)
                                          dy-top?     (> start-y page-y)
                                          page-left   (:left page-rect)
                                          page-right  (:right page-rect)
                                          page-top    (:top page-rect)
                                          page-bottom (:bottom page-rect)
                                          _           (rum/set-ref! *cnt-rect cnt-rect)]

                                      {:x (-> page-x
                                              (#(if dx-left?
                                                  (if (< % page-left) page-left %)
                                                  (if (> % page-right) page-right %)))
                                              (+ (.-scrollLeft cnt-el)))
                                       :y (-> page-y
                                              (#(if dy-top?
                                                  (if (< % page-top) page-top %)
                                                  (if (> % page-bottom) page-bottom %)))
                                              (+ (.-scrollTop cnt-el)))})))

        calc-rect               (fn [start end]
                                  {:left   (min (:x start) (:x end))
                                   :top    (min (:y start) (:y end))
                                   :width  (js/Math.abs (- (:x end) (:x start)))
                                   :height (js/Math.abs (- (:y end) (:y start)))})

        disable-text-selection! #(js-invoke viewer-clt (if % "add" "remove") "disabled-text-selection")

        fn-move                 (rum/use-callback
                                  (fn [^js/MouseEvent e]
                                    (set-end! (calc-coords! (.-pageX e) (.-pageY e))))
                                  [])]

    (rum/use-effect!
      (fn []
        (when-let [^js/HTMLElement root cnt-el]
          (let [fn-start (fn [^js/MouseEvent e]
                           (if (should-start e)
                             (let [target (.-target e)
                                   page-el (.closest target ".page")
                                   [x y] [(.-pageX e) (.-pageY e)]]
                               (rum/set-ref! *start-el target)
                               (rum/set-ref! *start-xy [x y])
                               (rum/set-ref! *page-el page-el)
                               (rum/set-ref! *page-rect (some-> page-el (.getBoundingClientRect) (.toJSON) (bean/->clj)))
                               (set-start! (calc-coords! x y))
                               (disable-text-selection! true)

                               (.addEventListener root "mousemove" fn-move))

                             ;; reset
                             (do (reset-coords!)
                                 (disable-text-selection! false))))

                fn-end   (fn [^js/MouseEvent e]
                           (when-let [start-el (rum/deref *start-el)]
                             (let [end  (calc-coords! (.-pageX e) (.-pageY e))
                                   rect (calc-rect start end)]

                               (if (and (> (:width rect) 10)
                                        (> (:height rect) 10))

                                 (when-let [^js page-el (.closest start-el ".page")]
                                   (let [page-number (int (.-pageNumber (.-dataset page-el)))
                                         page-pos    (merge rect {:top  (- (:top rect) (.-offsetTop page-el))
                                                                  :left (- (:left rect) (.-offsetLeft page-el))})
                                         vw-pos      {:bounding page-pos :rects [] :page page-number}
                                         sc-pos      (pdf-utils/vw-to-scaled-pos viewer vw-pos)

                                         point       {:x (.-clientX e) :y (.-clientY e)}
                                         hl          {:id         nil
                                                      :page       page-number
                                                      :position   sc-pos
                                                      :content    {:text "[:span]" :image (js/Date.now)}
                                                      :properties {}}]

                                     ;; ctx tips for area
                                     (show-ctx-menu! viewer hl point {:reset-fn #(reset-coords!)}))

                                   (set-area-mode! false))

                                 ;; reset
                                 (reset-coords!)))

                             (disable-text-selection! false)
                             (.removeEventListener root "mousemove" fn-move)))]

            (doto root
              (.addEventListener "mousedown" fn-start)
              (.addEventListener "mouseup" fn-end #js {:once true}))

            ;; destroy
            #(doto root
               (.removeEventListener "mousedown" fn-start)
               (.removeEventListener "mouseup" fn-end)))))
      [start])

    [:div.extensions__pdf-area-selection
     {:ref *el}
     (when (and start end)
       [:div.shadow-rect {:style (calc-rect start end)}])]))

(rum/defc ^:large-vars/cleanup-todo pdf-highlights
  [^js el ^js viewer initial-hls loaded-pages {:keys [set-dirty-hls!]}]

  (let [^js doc         (.-ownerDocument el)
        ^js win         (.-defaultView doc)
        *mounted        (rum/use-ref false)
        [sel-state, set-sel-state!] (rum/use-state {:selection nil :range nil :collapsed nil :point nil})
        [highlights, set-highlights!] (rum/use-state initial-hls)
        [ctx-menu-state, set-ctx-menu-state!] (rum/use-state {:highlight nil :vw-pos nil :selection nil :point nil :reset-fn nil})

        clear-ctx-menu! (rum/use-callback
                         #(let [reset-fn (:reset-fn ctx-menu-state)]
                            (set-ctx-menu-state! {})
                            (and (fn? reset-fn) (reset-fn)))
                         [ctx-menu-state])

        show-ctx-menu!  (fn [^js viewer hl point & ops]
                          (let [vw-pos (pdf-utils/scaled-to-vw-pos viewer (:position hl))]
                            (set-ctx-menu-state! (apply merge (list* {:highlight hl :vw-pos vw-pos :point point} ops)))))

        add-hl! (fn [hl]
                  (when (:id hl)
                    ;; fix js object
                    (let [highlights (pdf-utils/fix-nested-js highlights)]
                      (set-highlights! (conj highlights hl)))

                    (when-let [vw-pos (and (pdf-assets/area-highlight? hl)
                                           (pdf-utils/scaled-to-vw-pos viewer (:position hl)))]
                      ;; exceptions
                      (pdf-assets/persist-hl-area-image$ viewer (:pdf/current @state/state)
                                                         hl nil (:bounding vw-pos)))))

        upd-hl!         (fn [hl]
                          (let [highlights (pdf-utils/fix-nested-js highlights)]
                            (when-let [[target-idx] (medley/find-first
                                                     #(= (:id (second %)) (:id hl))
                                                     (medley/indexed highlights))]
                              (set-highlights! (assoc-in highlights [target-idx] hl))
                              (pdf-assets/update-hl-block! hl))))

        del-hl!         (fn [hl] (when-let [id (:id hl)] (set-highlights! (into [] (remove #(= id (:id %)) highlights)))))]

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
               (let [^js/Selection selection (.getSelection doc)
                     ^js/Range sel-range     (.getRangeAt selection 0)]

                 (cond
                   (.-isCollapsed selection)
                   (set-sel-state! {:collapsed true})

                   (and sel-range (.contains el (.-commonAncestorContainer sel-range)))
                   ;; NOTE: `Range.toString()` forgets newlines whereas `Selection.toString()`
                   ;; preserves them, so we derive text contents from the selection. However
                   ;; `Document.getSelection()` seems to return the same object across multiple
                   ;; selection changes, so we use the range as the `use-effect!` dep. Thus,
                   ;; we need to store both the selection and the range.
                   (set-sel-state! {:collapsed false :selection selection :range sel-range :point {:x (.-clientX e) :y (.-clientY e)}}))))

             fn-selection
             (fn []
               (let [*dirty   (volatile! false)
                     fn-dirty #(vreset! *dirty true)]

                 (.addEventListener doc "selectionchange" fn-dirty)
                 (.addEventListener doc "mouseup"
                                    (fn [^js e]
                                      (and @*dirty (fn-selection-ok e))
                                      (.removeEventListener doc "selectionchange" fn-dirty))
                                    #js {:once true})))

             fn-resize
             (partial pdf-utils/adjust-viewer-size! viewer)]

         ;;(doto (.-eventBus viewer))

         (when el
           (.addEventListener el "mousedown" fn-selection))

         (when win
           (.addEventListener win "resize" fn-resize))

         ;; destroy
         #(do
            ;;(doto (.-eventBus viewer))

            (when el
              (.removeEventListener el "mousedown" fn-selection))

            (when win
              (.removeEventListener win "resize" fn-resize)))))

     [viewer])

    ;; selection context menu
    (rum/use-effect!
     (fn []
       (when-let [^js/Range sel-range (and (not (:collapsed sel-state)) (:range sel-state))]
         (let [^js point               (:point sel-state)
               ^js/Selection selection (:selection sel-state)
               hl-fn                   #(when-let [page-info (pdf-utils/get-page-from-range sel-range)]
                                          (when-let [sel-rects (pdf-utils/get-range-rects<-page-cnt sel-range (:page-el page-info))]
                                            (let [page         (int (:page-number page-info))
                                                  ^js bounding (pdf-utils/get-bounding-rect sel-rects)
                                                  vw-pos       {:bounding bounding :rects sel-rects :page page}
                                                  sc-pos       (pdf-utils/vw-to-scaled-pos viewer vw-pos)]

                                              {:id         nil
                                               :page       page
                                               :position   sc-pos
                                               :content    {:text (pdf-utils/fix-selection-text-breakline (.toString selection))}
                                               :properties {}})))]

           ;; show ctx menu
           (js/setTimeout (fn []
                            (set-ctx-menu-state! {:highlight hl-fn
                                                  :selection selection
                                                  :point     point})))) 0))

     [(:range sel-state)])

    ;; render hls
    (rum/use-effect!
     (fn []
       (when-let [grouped-hls (and (sequential? highlights) (group-by :page highlights))]
         (doseq [page loaded-pages]
           (when-let [^js/HTMLDivElement hls-layer (pdf-utils/resolve-hls-layer! viewer page)]
             (let [page-hls (get grouped-hls page)]

               (rum/mount
                (pdf-highlights-region-container
                 viewer page-hls {:show-ctx-menu! show-ctx-menu!
                                  :upd-hl!        upd-hl!})

                hls-layer)))))

       ;; destroy
       #())
     [loaded-pages highlights])

    [:div.extensions__pdf-highlights-cnt

     ;; hl context tip menu
     (when-let [_hl (:highlight ctx-menu-state)]
       (js/ReactDOM.createPortal
        (pdf-highlights-ctx-menu viewer ctx-menu-state
                                 {:clear-ctx-menu! clear-ctx-menu!
                                  :add-hl!         add-hl!
                                  :del-hl!         del-hl!
                                  :upd-hl!         upd-hl!})

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

     (pdf-page-finder viewer)

     ;; area selection container
     (pdf-highlight-area-selection
      viewer
      {:clear-ctx-menu! clear-ctx-menu!
       :show-ctx-menu!  show-ctx-menu!
       :add-hl!         add-hl!
       })]))

(rum/defc ^:large-vars/data-var pdf-viewer
  [_url ^js pdf-document {:keys [identity filename initial-hls initial-page initial-error]} ops]

  (let [*el-ref (rum/create-ref)
        [state, set-state!] (rum/use-state {:viewer nil :bus nil :link nil :el nil})
        [ano-state, set-ano-state!] (rum/use-state {:loaded-pages []})
        [page-ready?, set-page-ready!] (rum/use-state false)
        [area-dashed?, _set-area-dashed?] (use-atom *area-dashed?)]

    ;; instant pdfjs viewer
    (rum/use-effect!
     (fn []
       (let [^js event-bus    (js/pdfjsViewer.EventBus.)
             ^js link-service (js/pdfjsViewer.PDFLinkService. #js {:eventBus event-bus :externalLinkTarget 2})
             ^js el           (rum/deref *el-ref)
             ^js viewer       (js/pdfjsViewer.PDFViewer.
                               #js {:container         el
                                    :eventBus          event-bus
                                    :linkService       link-service
                                    :findController    (js/pdfjsViewer.PDFFindController.
                                                        #js {:linkService link-service :eventBus event-bus})
                                    :textLayerMode     2
                                    :annotationMode    2
                                    :removePageBorders true})
             in-system-win?   (boolean (.closest el ".is-system-window"))]

         (set! (.-$groupIdentity viewer) identity)
         (set! (.-$inSystemWindow viewer) in-system-win?)
         (. link-service setDocument pdf-document)
         (. link-service setViewer viewer)

         ;; events
         (doto event-bus
           ;; it must be initialized before set-up document
           (.on "pagesinit"
                (fn []
                  (set! (. viewer -currentScaleValue) "auto")
                  (set-page-ready! true)))

           (.on (name :ls-update-extra-state)
                #(when-let [extra (bean/->clj %)]
                   (apply (:set-hls-extra! ops) [extra]))))

         (p/then (. viewer setDocument pdf-document)
                 #(set-state! {:viewer viewer :bus event-bus :link link-service :el el}))

         ;; TODO: set as active viewer
         (set! (. js/window -lsActivePdfViewer) viewer)

         ;; set initial page
         (js/setTimeout
          #(set! (.-currentPageNumber viewer) initial-page) 16)

         ;; destroy
         (fn []
           (.destroy pdf-document)
           (set! (. js/window -lsActivePdfViewer) nil)
           (.cleanup viewer))))
     [])

    ;; update window title
    (rum/use-effect!
     (fn []
       (when-let [^js viewer (:viewer state)]
         (when (pdf-windows/check-viewer-in-system-win? viewer)
           (some-> (pdf-windows/resolve-own-document viewer)
                   (set! -title filename)))))
     [(:viewer state)])

    ;; interaction events
    (rum/use-effect!
     (fn []
       (when-let [^js viewer (:viewer state)]
         (let [fn-textlayer-ready
               (fn [^js p]
                 (set-ano-state! {:loaded-pages (conj (:loaded-pages ano-state) (int (.-pageNumber p)))}))]

           (doto (.-eventBus viewer)
             (.on "textlayerrendered" fn-textlayer-ready))

           #(do
              (doto (.-eventBus viewer)
                (.off "textlayerrendered" fn-textlayer-ready))))))

     [(:viewer state)
      (:loaded-pages ano-state)])

    (let [^js viewer        (:viewer state)
          in-system-window? (some-> viewer (.-$inSystemWindow))]
      [:div.extensions__pdf-viewer-cnt.visible-scrollbar
       [:div.extensions__pdf-viewer.overflow-x-auto
        {:ref *el-ref :class (util/classnames [{:is-area-dashed area-dashed?}])}
        [:div.pdfViewer "viewer pdf"]
        [:div.pp-holder]

        ;; block hls refs
        (pdf-highlight-finder viewer)

        (when (and page-ready? viewer (not initial-error))
          [(rum/with-key
            (pdf-highlights
             (:el state) viewer
             initial-hls (:loaded-pages ano-state)
             ops) "pdf-highlights")])]

       (when (and page-ready? viewer)
         [(when-not in-system-window?
            (rum/with-key (pdf-resizer viewer) "pdf-resizer"))
          (rum/with-key (pdf-toolbar viewer {:on-external-window! #(open-external-win! (state/get-current-pdf))}) "pdf-toolbar")])])))

(rum/defcs pdf-password-input <
  (rum/local "" ::password)
  [state confirm-fn]
  (let [password (get state ::password)]
    [:div.container
     [:div.text-lg.mb-4 "Password required"]
     [:div.sm:flex.sm:items-start
      [:div.mt-3.text-center.sm:mt-0.sm:text-left
       [:h3#modal-headline.leading-6.font-medium
        "This document is password protected. Please enter a password:"]]]

     [:input.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2.mb-4
      {:auto-focus true
       :on-change (fn [e]
                    (reset! password (util/evalue e)))}]

     [:div.mt-5.sm:mt-4.flex
      (ui/button
        "Submit"
        {:on-click (fn []
                     (let [password @password]
                       (confirm-fn password)))})]]))

(rum/defc ^:large-vars/data-var pdf-loader
  [{:keys [url hls-file identity filename] :as pdf-current}]
  (let [*doc-ref       (rum/use-ref nil)
        [loader-state, set-loader-state!] (rum/use-state {:error nil :pdf-document nil :status nil})
        [hls-state, set-hls-state!] (rum/use-state {:initial-hls nil :latest-hls nil :extra nil :loaded false :error nil})
        [doc-password, set-doc-password!] (rum/use-state nil) ;; use nil to handle empty string
        [initial-page, set-initial-page!] (rum/use-state 1)
        set-dirty-hls! (fn [latest-hls]                     ;; TODO: incremental
                         (set-hls-state! #(merge % {:initial-hls [] :latest-hls latest-hls})))
        set-hls-extra! (fn [extra]
                         (set-hls-state! #(merge % {:extra extra})))]

    ;; current pdf effects
    (rum/use-effect!
     (fn []
       (when pdf-current
         (pdf-assets/ensure-ref-page! pdf-current)))
     [pdf-current])

    ;; load highlights
    (rum/use-effect!
     (fn []
       (p/catch
        (p/let [data (pdf-assets/load-hls-data$ pdf-current)
                {:keys [highlights extra]} data]
          (set-initial-page! (or (when-let [page (:page extra)]
                                   (util/safe-parse-int page)) 1))
          (set-hls-state! {:initial-hls highlights :latest-hls highlights :extra extra :loaded true}))

        ;; error
        (fn [^js e]
          (js/console.error "[load hls error]" e)

          (let [msg (str (util/format "Error: failed to load the highlights file: \"%s\". \n"
                                      (:hls-file pdf-current))
                         e)]
            (notification/show! msg :error)
            (set-hls-state! {:loaded true :error e}))))

       ;; cancel
       #())
     [hls-file])

    ;; cache highlights
    (let [persist-hls-data!
          (rum/use-callback
           (util/debounce
            4000 (fn [latest-hls extra]
                   (pdf-assets/persist-hls-data$
                    pdf-current latest-hls extra))) [pdf-current])]

      (rum/use-effect!
       (fn []
         (when (= :completed (:status loader-state))
           (p/catch
            (when-not (:error hls-state)
              (p/do! (persist-hls-data! (:latest-hls hls-state) (:extra hls-state))))

            ;; write hls file error
            (fn [e]
              (js/console.error "[write hls error]" e)))))

       [(:latest-hls hls-state) (:extra hls-state)]))

    ;; load document
    (rum/use-effect!
     (fn []
       (let [^js loader-el (rum/deref *doc-ref)
             get-doc$      (fn [^js opts] (.-promise (js/pdfjsLib.getDocument opts)))
             opts          {:url           url
                            :password      (or doc-password "")
                            :ownerDocument (.-ownerDocument loader-el)
                            :cMapUrl       "./js/pdfjs/cmaps/"
                            ;:cMapUrl       "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.9.179/cmaps/"
                            :cMapPacked    true}]

         (set-loader-state! {:status :loading})

         (-> (get-doc$ (clj->js opts))
             (p/then (fn [doc]
                       (set-loader-state! {:pdf-document doc :status :completed})))
             (p/catch #(set-loader-state! {:error %})))
         #()))
     [url doc-password])

    (rum/use-effect!
     (fn []
       (when-let [error (:error loader-state)]
         (js/console.error "[PDF loader]" (:error loader-state))
         (case (.-name error)
           "MissingPDFException"
           (do
             (notification/show!
              (str "Error: " (.-message error) "\n Is this the correct path?")
              :error
              false)
             (state/set-state! :pdf/current nil))

           "InvalidPDFException"
           (do
             (notification/show!
              (str "Error: " (.-message error) "\n"
                   "Is this .pdf file corrupted?\n"
                   "Please confirm with external pdf viewer.")
              :error
              false)
             (state/set-state! :pdf/current nil))

           "PasswordException"
           (do
             (set-loader-state! {:error nil})
             (state/set-modal! (fn [close-fn]
                                 (let [on-password-fn
                                       (fn [password]
                                         (close-fn)
                                         (set-doc-password! password))]
                                   (pdf-password-input on-password-fn)))))

           (do
             (notification/show!
              (str "Error: " (.-name error) "\n" (.-message error) "\n"
                   "Please confirm with pdf file resource.")
              :error
              false)
             (state/set-state! :pdf/current nil)))))
     [(:error loader-state)])

    (rum/bind-context
     [*highlights-ctx* hls-state]
     [:div.extensions__pdf-loader {:ref *doc-ref}
      (let [status-doc    (:status loader-state)
            initial-hls   (:initial-hls hls-state)
            initial-error (:error hls-state)]

        (if (= status-doc :loading)

          [:div.flex.justify-center.items-center.h-screen.text-gray-500.text-lg
           svg/loading]

          (when-let [pdf-document (and (:loaded hls-state) (:pdf-document loader-state))]
            [(rum/with-key (pdf-viewer
                            url pdf-document
                            {:identity      identity
                             :filename      filename
                             :initial-hls   initial-hls
                             :initial-page  initial-page
                             :initial-error initial-error}
                            {:set-dirty-hls! set-dirty-hls!
                             :set-hls-extra! set-hls-extra!}) "pdf-viewer")])))])))

(rum/defc pdf-container-outer
  < (shortcut/mixin :shortcut.handler/pdf false)
  [child]
  [:<> child])

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

    [:div.extensions__pdf-container
     {:id (str "pdf-layout-container_" identity)}
     (when (and prepared identity ready)
       (pdf-loader pdf-current))]))

(rum/defc playground-effects
  [active]

  (rum/use-effect!
   (fn []
     (let [flg     "is-pdf-active"
           ^js cls (.-classList js/document.body)]
       (and active (.add cls flg))

       #(.remove cls flg)))

   [active])
  nil)

(rum/defcs default-embed-playground
  < rum/static rum/reactive
  [state]
  (let [pdf-current (state/sub :pdf/current)
        system-win? (state/sub :pdf/system-win?)]
    [:div.extensions__pdf-playground

     (playground-effects (and (not system-win?)
                              (not (nil? pdf-current))))

     (when (and (not system-win?) pdf-current)
       (js/ReactDOM.createPortal
         (pdf-container-outer
           (pdf-container pdf-current))
         (js/document.querySelector "#app-single-container")))]))

(rum/defcs system-embed-playground
  < rum/reactive
  []
  (let [pdf-current (state/sub :pdf/current)]
    (pdf-container pdf-current)))
