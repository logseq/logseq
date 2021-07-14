(ns frontend.extensions.pdf.impls
  (:require [rum.core :as rum]
            [promesa.core :as p]
            [frontend.extensions.pdf.utils :as pdf-utils]))

(defonce ACTIVE_FILE "https://phx-nine.vercel.app/clojure-hopl-iv-final.pdf")

(rum/defc viewer
  [^js pdf-document]

  (let [*el-ref (rum/create-ref)
        [state, set-state!] (rum/use-state {:viewer nil :bus nil :link nil})
        [sel-state, set-sel-state!] (rum/use-state {:range nil :collapsed nil :point nil})]

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
                      #(set-state! {:viewer viewer :bus event-bus :link link-service})))

        ;;TODO: destroy
       #())
     [])

    ;; selection context menu
    (rum/use-effect!
     (fn []
       (when-let [^js sel-range (and (not (:collapsed sel-state)) (:range sel-state))]
         (when-let [page-info (pdf-utils/get-page-from-range sel-range)]
           (when-let [sel-rects (pdf-utils/get-range-rects<-page-cnt sel-range (:page-el page-info))]
             (let [^js point (:point sel-state)]

                ;; TODO: debug
               (js/console.debug "[Range] ====> [" page-info "]" (.toString sel-range) point)
               (js/console.debug "[Rects] ====>" sel-rects))))))

     [(:range sel-state)])

    ;; interaction events
    (rum/use-effect!
     (fn []
       (when-let [^js viewer (:viewer state)]
         (let [^js el (rum/deref *el-ref)

               fn-ready
               (fn []
                 (set! (. viewer -currentScaleValue) "auto"))

               fn-selection-ok
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

           (doto (.-eventBus viewer)
             (.on "pagesinit" fn-ready))

           (doto el
             (.addEventListener "mousedown" fn-selection))

           #(do
              (doto (.-eventBus viewer)
                (.off "pagesinit" fn-ready))

              (doto el
                (.removeEventListener "mousedown" fn-selection))))))

     [(:viewer state)])

    [:div.extensions__pdf-viewer {:ref *el-ref}
     [:div.pdfViewer "viewer pdf"]]))

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
       (viewer (:pdf-document state)))
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