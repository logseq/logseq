(ns frontend.extensions.pdf.highlights
  (:require [rum.core :as rum]
            [promesa.core :as p]
            [cljs-bean.core :as bean]
            [medley.core :as medley]
            [frontend.handler.notification :as notification]
            [frontend.extensions.pdf.utils :as pdf-utils]
            [frontend.extensions.pdf.assets :as pdf-assets]
            [frontend.util :as front-utils]
            [frontend.state :as state]
            [frontend.config :as config]
            [frontend.components.svg :as svg]
            [medley.core :as medley]
            [frontend.fs :as fs]
            [clojure.string :as string]))

(defn dd [& args]
  (apply js/console.debug args))

(defn reset-current-pdf!
  []
  (state/set-state! :pdf/current nil))

(rum/defcs pdf-highlight-finder < rum/reactive
  [state ^js viewer]
  (when-let [ref-hl (state/sub :pdf/ref-highlight)]
    ;; delay handle: aim to fix page blink
    (js/setTimeout #(pdf-utils/scroll-to-highlight viewer ref-hl) 100)
    (js/setTimeout #(state/set-state! :pdf/ref-highlight nil) 1000)
    nil))

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
                          (let [width (str (* el-ratio 100) "vw")]
                            (.setProperty (.-style target-el) "width" width)
                            (adjust-main-size! width)))))}}))

              (.styleCursor false)
              (.on "dragstart" #(.. js/document.documentElement -classList (add "is-resizing-buf")))
              (.on "dragend" #(.. js/document.documentElement -classList (remove "is-resizing-buf")))))
        #())
      [])
    [:span.extensions__pdf-resizer {:ref el-ref}]))

(rum/defc pdf-highlights-ctx-menu
  [^js viewer {:keys [highlight vw-pos point]}
   {:keys [clear-ctx-tip! add-hl! upd-hl! del-hl!]}]

  (let [mounted (rum/use-ref false)]
    (rum/use-effect!
      (fn []
        (let [cb #(if-not (rum/deref mounted)
                    (rum/set-ref! mounted true)
                    (clear-ctx-tip!))]
          (js/document.addEventListener "click" cb)
          #(js/document.removeEventListener "click" cb)))
      [clear-ctx-tip!]))

  ;; TODO: precise position
  ;;(when-let [
  ;;page-bounding (and highlight (pdf-utils/get-page-bounding viewer (:page highlight)))
  ;;])

  (let [head-height 0                                       ;; 48 temp
        top (- (+ (:y point) (.. viewer -container -scrollTop)) head-height)
        left (:x point)
        id (:id highlight)
        content (:content highlight)]

    [:ul.extensions__pdf-hls-ctx-menu
     {:style    {:top top :left left}
      :on-click (fn [^js/MouseEvent e]
                  (when-let [action (.. e -target -dataset -action)]
                    (case action
                      "ref"
                      (pdf-assets/copy-hl-ref! highlight)

                      "copy"
                      (do
                        (front-utils/copy-to-clipboard! (:text content))
                        (pdf-utils/clear-all-selection))

                      "del"
                      (do
                        (del-hl! highlight)
                        (pdf-assets/del-ref-block! highlight))

                      ;; colors
                      (let [properties {:color action}]
                        (if-not id
                          ;; add highlight
                          (let [highlight (merge highlight
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


     (and id [:li.item {:data-action "ref"} "Copy ref"])

     [:li.item {:data-action "copy"} "Copy text"]

     (and id [:li.item {:data-action "del"} "Delete"])
     ]))

(rum/defc pdf-highlights-text-region
  [^js viewer vw-hl hl
   {:keys [show-ctx-tip!]}]

  (let [id (:id hl)
        {:keys [rects]} (:position vw-hl)
        {:keys [color]} (:properties hl)]
    [:div.extensions__pdf-hls-text-region
     {:on-click
      (fn [e]
        (let [x (.-clientX e)
              y (.-clientY e)]

          (show-ctx-tip! viewer hl {:x x :y y})))}

     (map-indexed
       (fn [idx rect]
         [:div.hls-text-region-item
          {:key        idx
           :style      rect
           :data-color color}])
       rects)]))

(rum/defc pdf-highlights-region-container
  [^js viewer page-hls ops]

  [:div.hls-region-container
   (for [hl page-hls]
     (let [vw-hl (update-in hl [:position] #(pdf-utils/scaled-to-vw-pos viewer %))]
       (rum/with-key (pdf-highlights-text-region viewer vw-hl hl ops) (:id hl))
       ))])

(rum/defc pdf-highlights
  [^js el ^js viewer initial-hls loaded-pages {:keys [set-dirty-hls!]}]

  (let [^js doc (.-ownerDocument el)
        ^js win (.-defaultView doc)
        *mounted (rum/use-ref false)
        [sel-state, set-sel-state!] (rum/use-state {:range nil :collapsed nil :point nil})
        [highlights, set-highlights!] (rum/use-state initial-hls)
        [tip-state, set-tip-state!] (rum/use-state {:highlight nil :vw-pos nil :point nil})
        clear-ctx-tip! #(set-tip-state! {})
        show-ctx-tip! (fn [^js viewer hl point]
                        (let [vw-pos (pdf-utils/scaled-to-vw-pos viewer (:position hl))]
                          (set-tip-state! {:highlight hl :vw-pos vw-pos :point point})))

        add-hl! (fn [hl] (when (:id hl)
                           ;; fix js object
                           (let [highlights (pdf-utils/fix-nested-js highlights)]
                             (set-highlights! (conj highlights hl)))))

        upd-hl! (fn [hl]
                  (let [highlights (pdf-utils/fix-nested-js highlights)]
                    (when-let [[target-idx] (medley/find-first
                                              #(= (:id (second %)) (:id hl))
                                              (medley/indexed highlights))]
                      (set-highlights! (assoc-in highlights [target-idx] hl)))))

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
          (when-let [page-info (pdf-utils/get-page-from-range sel-range)]
            (when-let [sel-rects (pdf-utils/get-range-rects<-page-cnt sel-range (:page-el page-info))]
              (let [page (int (:page-number page-info))
                    ^js point (:point sel-state)
                    ^js bounding (pdf-utils/get-bounding-rect sel-rects)
                    vw-pos {:bounding bounding :rects sel-rects :page page}
                    sc-pos (pdf-utils/vw-to-scaled-pos viewer vw-pos)]

                ;; TODO: debug
                ;;(dd "[VW x SC] ====>" vw-pos sc-pos)
                ;;(dd "[Range] ====> [" page-info "]" (.toString sel-range) point)
                ;;(dd "[Rects] ====>" sel-rects " [Bounding] ====>" bounding)


                (let [hl {:id         nil
                          :page       page
                          :position   sc-pos
                          :content    {:text (.toString sel-range)}
                          :properties {}}]

                  ;; show context menu
                  (set-tip-state! {:highlight hl
                                   :vw-pos    vw-pos
                                   :point     point})))))))

      [(:range sel-state)])

    ;; render hls
    (rum/use-effect!
      (fn []
        (dd "[rebuild highlights] " (count highlights))

        (when-let [grouped-hls (and (sequential? highlights) (group-by :page highlights))]
          (doseq [page loaded-pages]
            (when-let [^js/HTMLDivElement hls-layer (pdf-utils/resolve-hls-layer! viewer page)]
              (let [page-hls (get grouped-hls page)]

                (rum/mount
                  ;; TODO: area & text hls
                  (pdf-highlights-region-container viewer page-hls {:show-ctx-tip! show-ctx-tip!})

                  hls-layer)))))

        ;; destroy
        #())
      [loaded-pages highlights])

    [:div.extensions__pdf-highlights-cnt

     ;; hl context tip menu
     (if (:highlight tip-state)
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
     (pdf-highlight-finder viewer)]))

(rum/defc pdf-outline-item
  [^js viewer {:keys [title items href parent dest] :as node}]
  (let [has-child? (seq items)]

    [:div.extensions__pdf-outline-item
     {:class (if has-child? "has-children")}
     [:div.inner
      [:a
       {:href      "javascript:;"
        :data-dest (js/JSON.stringify (bean/->js dest))
        :on-click  (fn []
                     (when-let [^js dest (and dest (bean/->js dest))]
                       (.goToDestination (.-linkService viewer) dest)))}
       [:span title]]]

     ;; children
     (when has-child?
       [:div.children
        (map-indexed
          (fn [idx itm]
            (let [parent (str parent "-" idx)]
              (rum/with-key
                (pdf-outline-item viewer (merge itm {:parent parent})) parent))) items)])]))

(rum/defc pdf-outline
  [^js viewer hide!]
  (when-let [^js pdf-doc (and viewer (.-pdfDocument viewer))]
    (let [*el-outline (rum/use-ref nil)
          [outline-data, set-outline-data!] (rum/use-state [])]

      (rum/use-effect!
        (fn []
          (p/catch
            (p/let [^js data (.getOutline pdf-doc)]
              (when-let [data (and data (.map data (fn [^js it]
                                                     (set! (.-href it) (.. viewer -linkService (getDestinationHash (.-dest it))))
                                                     it)))])
              (set-outline-data! (bean/->clj data)))

            (fn [e]
              (js/console.error "[Load outline Error]" e))))
        [pdf-doc])

      (rum/use-effect!
        (fn []
          (let [el-outline (rum/deref *el-outline)
                cb (fn [^js e]
                     (and (= e.which 27) (hide!)))]

            (js/setTimeout #(.focus el-outline))
            (.addEventListener el-outline "keyup" cb)
            #(.removeEventListener el-outline "keyup" cb)))
        [])

      [:div.extensions__pdf-outline-wrap
       {:on-click (fn [^js/MouseEvent e]
                    (let [target (.-target e)]
                      (when-not (.contains (rum/deref *el-outline) target)
                        (hide!))))}

       [:div.extensions__pdf-outline
        {:ref       *el-outline
         :tab-index -1}
        (if (seq outline-data)
          [:section
           (map-indexed (fn [idx itm]
                          (rum/with-key
                            (pdf-outline-item viewer (merge itm {:parent idx}))
                            idx))
                        outline-data)]
          [:section.is-empty "No outlines"])]])))

(rum/defc pdf-toolbar
  [^js viewer]
  (let [[outline-visible?, set-outline-visible!] (rum/use-state false)]
    [:div.extensions__pdf-toolbar
     [:div.inner
      [:div.r.flex

       ;; zoom
       [:a.button
        {:on-click (partial pdf-utils/zoom-out-viewer viewer)}
        (svg/zoom-out 18)]

       [:a.button
        {:on-click (partial pdf-utils/zoom-in-viewer viewer)}
        (svg/zoom-in 18)]

       [:a.button
        {:on-click #(set-outline-visible! (not outline-visible?))}
        (svg/view-list 16)]

       [:a.button
        {:on-click #(state/set-state! :pdf/current nil)}
        "close"]]]

     ;; contents outline
     (when outline-visible? (pdf-outline viewer #(set-outline-visible! false)))]))

(rum/defc pdf-viewer
  [url initial-hls ^js pdf-document ops]

  (dd "==== render pdf-viewer ====")

  (let [*el-ref (rum/create-ref)
        [state, set-state!] (rum/use-state {:viewer nil :bus nil :link nil :el nil})
        [ano-state, set-ano-state!] (rum/use-state {:loaded-pages []})]

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
                                     :removePageBorders    true})]
               (. link-service setDocument pdf-document)
               (. link-service setViewer viewer)

               ;; TODO: debug
               (set! (. js/window -lsPdfViewer) viewer)

               (p/then (. viewer setDocument pdf-document)
                       #(set-state! {:viewer viewer :bus event-bus :link link-service :el el})))

        ;;TODO: destroy
        #(.destroy pdf-document))
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
                  (set! (. viewer -currentScaleValue) "auto"))]

            (doto (.-eventBus viewer)
              (.on "pagesinit" fn-page-ready)
              (.on "textlayerrendered" fn-textlayer-ready))

            #(do
               (doto (.-eventBus viewer)
                 (.off "pagesinit" fn-page-ready)
                 (.off "textlayerrendered" fn-textlayer-ready))))))

      [(:viewer state)
       (:loaded-pages ano-state)])

    [:div.extensions__pdf-viewer-cnt
     [:div.extensions__pdf-viewer {:ref *el-ref}
      [:div.pdfViewer "viewer pdf"]
      [:div.pp-holder]]

     (if-let [^js viewer (:viewer state)]
       [(rum/with-key
          (pdf-highlights
            (:el state) viewer
            initial-hls (:loaded-pages ano-state)
            ops) "pdf-highlights")

        (rum/with-key (pdf-toolbar viewer) "pdf-toolbar")
        (rum/with-key (pdf-resizer viewer) "pdf-resizer")])]))

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
                    ;;:cMapUrl       "./js/pdfjs/cmaps/"
                    :cMapUrl       "https://cdn.jsdelivr.net/npm/pdfjs-dist@2.8.335/cmaps/"
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
        (dd "[ERROR loader]" (:error state)))
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
  [pdf-current]
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
      [pdf-current])

    [:div#pdf-layout-container.extensions__pdf-container
     (if (and prepared pdf-current ready)
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

(rum/defcs playground < rum/reactive
  [state]
  (let [pdf-current (state/sub :pdf/current)]
    [:div.extensions__pdf-playground

     (playground-effects (not (nil? pdf-current)))

     (when pdf-current
       (js/ReactDOM.createPortal
         (pdf-container pdf-current)
         (js/document.querySelector "#app-single-container")))]))