(ns frontend.extensions.pdf.highlights
  (:require [rum.core :as rum]
            [promesa.core :as p]
            [cljs-bean.core :as bean]
            [frontend.handler.notification :as notification]
            [frontend.extensions.pdf.utils :as pdf-utils]))

(defonce ACTIVE_FILE "https://phx-nine.vercel.app/clojure-hopl-iv-final.pdf")

(defn dd [& args]
  (apply js/console.debug args))

(rum/defc pdf-highlights-ctx-menu
  [^js viewer {:keys [highlight vw-pos point]}
   clear-tip! add-hl! del-hl!]

  (let [mounted (rum/use-ref false)]
    (rum/use-effect!
      (fn []
        (let [cb #(if-not (rum/deref mounted)
                    (rum/set-ref! mounted true)
                    (clear-tip!))]
          (js/document.addEventListener "click" cb)
          #(js/document.removeEventListener "click" cb)))
      [clear-tip!]))

  ;; TODO: precise position
  (when-let [page-bounding (and highlight (pdf-utils/get-page-bounding viewer (:page highlight)))]
    (let [head-height 48                                    ;; temp
          top (- (+ (:y point) (.. viewer -container -scrollTop)) head-height)
          left (:x point)]

      [:ul.extensions__pdf-hls-ctx-menu
       {:style    {:top top :left left}
        :on-click (fn [^js/MouseEvent e]
                    (when-let [action (.. e -target -dataset -action)]
                      (case action
                        "copy"
                        (do
                          (dd action)
                          (pdf-utils/clear-all-selection))

                        "del" (dd action)

                        ;; colors
                        (if-not (:id highlight)
                          ;; add highlight
                          (do
                            (add-hl! (merge highlight
                                            {:id         (pdf-utils/gen-id)
                                             :properties {:color action}}))
                            (pdf-utils/clear-all-selection))
                          ;; update highlight
                          (dd "update hl=>" highlight))))
                    (clear-tip!))}

       [:li.item-colors
        (for [it ["yellow", "blue", "green", "red", "purple"]]
          [:a {:key it :data-color it :data-action it} it])]

       [:li.item {:data-action "copy"} "Copy text"]
       [:li.item {:data-action "del"} "Delete"]
       ])))

(rum/defc pdf-highlights-text-region
  [{:keys [id position properties]}]

  (let [{:keys [rects bounding]} position
        {:keys [color]} properties]
    [:div.extensions__pdf-hls-text-region
     {:on-click
      (fn []
        (notification/show! (str "HL#" id) :success))}
     (map-indexed
       (fn [idx rect]
         [:div.hls-text-region-item
          {:key        idx
           :style      rect
           :data-color color}])
       rects)]))

(rum/defc pdf-highlights-region-container
  [^js viewer page-hls]

  [:div.hls-region-container
   (for [hl page-hls]
     (let [hl (update-in hl [:position] #(pdf-utils/scaled-to-vw-pos viewer %))]
       (rum/with-key (pdf-highlights-text-region hl) (:id hl))
       ))])

(rum/defc pdf-highlights
  [^js el ^js viewer initial-hls loaded-pages]

  (let [[sel-state, set-sel-state!] (rum/use-state {:range nil :collapsed nil :point nil})
        [highlights, set-highlights!] (rum/use-state initial-hls)
        [tip-state, set-tip-state!] (rum/use-state {:highlight nil :vw-pos nil :point nil})
        clear-tip! #(set-tip-state! {})
        add-hl! (fn [hl] (if (:id hl) (set-highlights! (conj highlights hl))))
        del-hl! (fn [id] (if id (set-highlights! (remove #(= id (:id %) highlights)))))]

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
                                                #js {:once true})))]

          ;;(doto (.-eventBus viewer))

          (doto el
            (.addEventListener "mousedown" fn-selection))

          ;; destroy
          #(do
             ;;(doto (.-eventBus viewer))

             (doto el
               (.removeEventListener "mousedown" fn-selection)))))

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
                (js/console.debug "[VW x SC] ====>" vw-pos sc-pos)
                (js/console.debug "[Range] ====> [" page-info "]" (.toString sel-range) point)
                (js/console.debug "[Rects] ====>" sel-rects " [Bounding] ====>" bounding)


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
        (js/console.debug "[rebuild highlights] " (count highlights))

        (when-let [grouped-hls (and (seq highlights) (group-by :page highlights))]
          (doseq [page loaded-pages]
            (when-let [^js/HTMLDivElement hls-layer (pdf-utils/resolve-hls-layer! viewer page)]
              (when-let [page-hls (get grouped-hls page)]

                (rum/mount
                  ;; TODO: area & text hls
                  (pdf-highlights-region-container viewer page-hls)

                  hls-layer)
                )
              )))

        ;; destroy
        #())
      [loaded-pages highlights])

    [:div.extensions__pdf-highlights

     ;; hl context tip menu
     (if (:highlight tip-state)
       (js/ReactDOM.createPortal
         (pdf-highlights-ctx-menu
           viewer tip-state
           clear-tip!
           add-hl!
           del-hl!)
         (.querySelector el ".pp-holder")))

     [:pre
      (js/JSON.stringify (bean/->js highlights) nil 2)]]))

(rum/defc pdf-viewer
  [url initial-hls ^js pdf-document]

  (js/console.debug "==== render pdf-viewer ====")

  (let [*el-ref (rum/create-ref)
        [state, set-state!] (rum/use-state {:viewer nil :bus nil :link nil :el nil})
        [ano-state, set-ano-state!] (rum/use-state {:loaded-pages []})
        [hls-state, set-hls-state!] (rum/use-state {:dirties 0})]

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
        #())
      [])

    ;; highlights & annotations
    (rum/use-effect!
      (fn []
        (js/console.debug "[rebuild loaded pages] " (:loaded-pages ano-state))
        ;;(set-hls-state! (update-in hls-state [:dirties] inc))
        ;; destroy
        #())
      [(:loaded-pages ano-state)])

    ;; interaction events
    (rum/use-effect!
      (fn []
        (js/console.debug "[rebuild interaction events]" (:viewer state))

        (when-let [^js viewer (:viewer state)]
          (let [^js el (rum/deref *el-ref)

                fn-textlayer-ready
                (fn [^js p]
                  (js/console.debug "text layer ready" p)
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

     (if (:viewer state)
       (pdf-highlights
         (:el state) (:viewer state)
         initial-hls
         (:loaded-pages ano-state)))]))

(rum/defc pdf-loader
  [url]
  (let [*doc-ref (rum/use-ref nil)
        [state set-state!] (rum/use-state {:error nil :pdf-document nil :status nil})]

    ;; load
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
                       #(do (js/console.log "+++" %)
                            (set-state! {:pdf-document %})))
                     #(set-state! {:error %}))
            #(set-state! {:status :completed}))

          #()))
      [url])

    [:div.extensions__pdf-loader {:ref *doc-ref}
     (if (= (:status state) :loading)
       [:h1 "Downloading PDF #" url]
       (pdf-viewer url [] (:pdf-document state)))
     [:h3 (str (:error state))]]))

(rum/defc container
  []
  (let [[prepared set-prepared!] (rum/use-state false)]

    ;; load assets
    (rum/use-effect!
      (fn []
        (p/then
          (pdf-utils/load-base-assets$)
          (fn [] (set-prepared! true))))
      [])

    [:div.extensions__pdf-container.flex
     (if prepared
       (pdf-loader ACTIVE_FILE))]))

(rum/defc playground
  []
  [:div.extensions__pdf-playground
   (container)])