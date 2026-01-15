(ns frontend.components.block-image-editor
  "Block image editor component for cropping and rotating images."
  (:require
   [frontend.context.i18n :refer [t]]
   [frontend.fs :as fs]
   [frontend.handler.assets :as assets-handler]
   [frontend.handler.db-based.property :as db-property-handler]
   [frontend.handler.notification :as notification]
   [frontend.state :as state]
   [frontend.util :as util]
   [logseq.common.path :as path]
   [logseq.shui.hooks :as hooks]
   [logseq.shui.ui :as shui]
   [promesa.core :as p]
   [rum.core :as rum]))

;; ============================================================================
;; Canvas utilities
;; ============================================================================

(defn- create-image
  "Create an image element from a URL and return a promise."
  [url]
  (p/create
   (fn [resolve reject]
     (let [img (js/Image.)]
       (set! (.-crossOrigin img) "anonymous")
       (set! (.-onload img) #(resolve img))
       (set! (.-onerror img) #(reject (js/Error. (str "Failed to load image: " url))))
       (set! (.-src img) url)))))

(defn- apply-rotation
  "Apply rotation to an image and return a canvas.
   Rotation is in degrees (0, 90, 180, 270, etc.)"
  [img rotation]
  (let [canvas (js/document.createElement "canvas")
        ctx (.getContext canvas "2d")
        width (.-naturalWidth img)
        height (.-naturalHeight img)
        ;; For 90 or 270 degree rotation, swap width and height
        swap? (odd? (js/Math.abs (/ rotation 90)))
        canvas-width (if swap? height width)
        canvas-height (if swap? width height)]
    (set! (.-width canvas) canvas-width)
    (set! (.-height canvas) canvas-height)
    ;; Move to center, rotate, then draw
    (.translate ctx (/ canvas-width 2) (/ canvas-height 2))
    (.rotate ctx (* rotation (/ js/Math.PI 180)))
    (.drawImage ctx img (/ width -2) (/ height -2))
    canvas))

(defn- apply-crop
  "Apply crop to a canvas and return a new canvas.
   crop: {:x :y :width :height} in pixels"
  [source-canvas crop]
  (let [{:keys [x y width height]} crop
        canvas (js/document.createElement "canvas")
        ctx (.getContext canvas "2d")]
    (set! (.-width canvas) width)
    (set! (.-height canvas) height)
    (.drawImage ctx source-canvas x y width height 0 0 width height)
    canvas))

(defn- canvas->blob
  "Convert canvas to blob."
  [canvas mime-type quality]
  (p/create
   (fn [resolve _reject]
     (.toBlob canvas
              (fn [blob] (resolve blob))
              mime-type
              quality))))

(defn- process-image
  "Apply rotation and crop to an image, return a blob."
  [image-src rotation crop]
  (p/let [img (create-image image-src)
          rotated-canvas (apply-rotation img rotation)
          final-canvas (if crop
                         (apply-crop rotated-canvas crop)
                         rotated-canvas)]
    (canvas->blob final-canvas "image/png" 0.92)))

(defn- save-edited-image!
  "Save the edited image, replacing the original asset."
  [repo asset-block image-src rotation crop on-complete]
  (p/let [blob (process-image image-src rotation crop)
          _ (when-not blob
              (throw (js/Error. "Failed to create image blob")))
          ;; Get asset info
          asset-uuid (:block/uuid asset-block)
          asset-type (or (:logseq.property.asset/type asset-block) "png")
          ;; Prepare file path
          [repo-dir asset-dir-rpath] (assets-handler/ensure-assets-dir! repo)
          file-rpath (str asset-dir-rpath "/" asset-uuid "." (name asset-type))
          ;; Write the file
          buffer (.arrayBuffer blob)]
    (if (util/electron?)
      (p/do!
       (js/window.apis.writeFile repo (path/path-join repo-dir file-rpath) buffer)
       (p/let [checksum (assets-handler/get-file-checksum blob)]
         (db-property-handler/set-block-properties!
          (:db/id asset-block)
          {:logseq.property.asset/checksum checksum
           :logseq.property.asset/resize-metadata nil}))
       (notification/show! (t :asset/image-saved) :success)
       (when on-complete (on-complete)))
      ;; Web version
      (p/let [content (js/Uint8Array. buffer)]
        (fs/write-plain-text-file! repo repo-dir file-rpath content nil)
        (p/let [checksum (assets-handler/get-file-checksum blob)]
          (db-property-handler/set-block-properties!
           (:db/id asset-block)
           {:logseq.property.asset/checksum checksum
            :logseq.property.asset/resize-metadata nil}))
        (notification/show! (t :asset/image-saved) :success)
        (when on-complete (on-complete))))))

;; ============================================================================
;; Crop selection component
;; ============================================================================

(rum/defc crop-overlay
  "Draggable crop selection overlay."
  [_container-ref image-size crop set-crop!]
  (let [[dragging set-dragging!] (rum/use-state nil)
        [start-pos set-start-pos!] (rum/use-state nil)
        [start-crop set-start-crop!] (rum/use-state nil)

        {:keys [display-width display-height]} image-size
        {:keys [x y width height]} crop

        ;; Clamp values to valid range
        clamp (fn [v min-v max-v] (max min-v (min max-v v)))

        handle-mouse-down (fn [e action]
                            (.preventDefault e)
                            (.stopPropagation e)
                            (set-dragging! action)
                            (set-start-pos! {:x (.-clientX e) :y (.-clientY e)})
                            (set-start-crop! crop))

        handle-mouse-move (fn [e]
                            (when (and dragging start-pos start-crop)
                              (let [dx (- (.-clientX e) (:x start-pos))
                                    dy (- (.-clientY e) (:y start-pos))
                                    {:keys [x y width height]} start-crop]
                                (case dragging
                                  :move
                                  (set-crop! {:x (clamp (+ x dx) 0 (- display-width width))
                                              :y (clamp (+ y dy) 0 (- display-height height))
                                              :width width
                                              :height height})

                                  :resize-se
                                  (let [new-w (clamp (+ width dx) 50 (- display-width x))
                                        new-h (clamp (+ height dy) 50 (- display-height y))]
                                    (set-crop! {:x x :y y :width new-w :height new-h}))

                                  :resize-nw
                                  (let [new-x (clamp (+ x dx) 0 (- (+ x width) 50))
                                        new-y (clamp (+ y dy) 0 (- (+ y height) 50))
                                        new-w (- (+ x width) new-x)
                                        new-h (- (+ y height) new-y)]
                                    (set-crop! {:x new-x :y new-y :width new-w :height new-h}))

                                  :resize-ne
                                  (let [new-y (clamp (+ y dy) 0 (- (+ y height) 50))
                                        new-w (clamp (+ width dx) 50 (- display-width x))
                                        new-h (- (+ y height) new-y)]
                                    (set-crop! {:x x :y new-y :width new-w :height new-h}))

                                  :resize-sw
                                  (let [new-x (clamp (+ x dx) 0 (- (+ x width) 50))
                                        new-w (- (+ x width) new-x)
                                        new-h (clamp (+ height dy) 50 (- display-height y))]
                                    (set-crop! {:x new-x :y y :width new-w :height new-h}))

                                  nil))))

        handle-mouse-up (fn [_e]
                          (set-dragging! nil)
                          (set-start-pos! nil)
                          (set-start-crop! nil))]

    ;; Add global mouse event listeners when dragging
    (hooks/use-effect!
     (fn []
       (when dragging
         (js/document.addEventListener "mousemove" handle-mouse-move)
         (js/document.addEventListener "mouseup" handle-mouse-up))
       (fn []
         (js/document.removeEventListener "mousemove" handle-mouse-move)
         (js/document.removeEventListener "mouseup" handle-mouse-up)))
     [dragging])

    [:<>
     ;; Dark overlay outside crop area (4 rectangles)
     [:div.absolute.bg-black.bg-opacity-50
      {:style {:top 0 :left 0 :width "100%" :height y}}]
     [:div.absolute.bg-black.bg-opacity-50
      {:style {:top (+ y height) :left 0 :width "100%" :bottom 0}}]
     [:div.absolute.bg-black.bg-opacity-50
      {:style {:top y :left 0 :width x :height height}}]
     [:div.absolute.bg-black.bg-opacity-50
      {:style {:top y :left (+ x width) :right 0 :height height}}]

     ;; Crop area border
     [:div.absolute.border-2.border-white.cursor-move
      {:style {:top y :left x :width width :height height}
       :on-mouse-down #(handle-mouse-down % :move)}

      ;; Grid lines
      [:div.absolute.border-white.border-opacity-30
       {:style {:top "33.33%" :left 0 :right 0 :border-top-width 1}}]
      [:div.absolute.border-white.border-opacity-30
       {:style {:top "66.66%" :left 0 :right 0 :border-top-width 1}}]
      [:div.absolute.border-white.border-opacity-30
       {:style {:top 0 :bottom 0 :left "33.33%" :border-left-width 1}}]
      [:div.absolute.border-white.border-opacity-30
       {:style {:top 0 :bottom 0 :left "66.66%" :border-left-width 1}}]

      ;; Resize handles (corners)
      [:div.absolute.w-4.h-4.bg-white.cursor-nw-resize
       {:style {:top -8 :left -8}
        :on-mouse-down #(handle-mouse-down % :resize-nw)}]
      [:div.absolute.w-4.h-4.bg-white.cursor-ne-resize
       {:style {:top -8 :right -8}
        :on-mouse-down #(handle-mouse-down % :resize-ne)}]
      [:div.absolute.w-4.h-4.bg-white.cursor-sw-resize
       {:style {:bottom -8 :left -8}
        :on-mouse-down #(handle-mouse-down % :resize-sw)}]
      [:div.absolute.w-4.h-4.bg-white.cursor-se-resize
       {:style {:bottom -8 :right -8}
        :on-mouse-down #(handle-mouse-down % :resize-se)}]]]))

;; ============================================================================
;; Main editor component
;; ============================================================================

(rum/defc editor-content
  "Image editor modal content with crop and rotation controls."
  [asset-block {:keys [src]}]
  (let [[rotation set-rotation!] (rum/use-state 0)
        [crop set-crop!] (rum/use-state nil)
        [crop-enabled? set-crop-enabled!] (rum/use-state false)
        [image-size set-image-size!] (rum/use-state nil)
        [saving? set-saving!] (rum/use-state false)
        container-ref (rum/use-ref nil)

        ;; The src is already a blob URL or file path
        image-src src

        handle-rotate-left! (fn []
                              (set-rotation! #(- % 90))
                              ;; Reset crop when rotating
                              (set-crop! nil)
                              (set-crop-enabled! false))

        handle-rotate-right! (fn []
                               (set-rotation! #(+ % 90))
                               ;; Reset crop when rotating
                               (set-crop! nil)
                               (set-crop-enabled! false))

        handle-image-load (fn [e]
                            (let [img (.-target e)
                                  container (rum/deref container-ref)
                                  container-width (when container (.-offsetWidth container))
                                  natural-w (.-naturalWidth img)
                                  natural-h (.-naturalHeight img)
                                  ;; Calculate display size to fit container
                                  max-height 400
                                  scale (min 1
                                             (/ (or container-width 600) natural-w)
                                             (/ max-height natural-h))
                                  display-w (* natural-w scale)
                                  display-h (* natural-h scale)]
                              (set-image-size! {:natural-width natural-w
                                                :natural-height natural-h
                                                :display-width display-w
                                                :display-height display-h
                                                :scale scale})))

        toggle-crop! (fn []
                       (if crop-enabled?
                         (do (set-crop-enabled! false)
                             (set-crop! nil))
                         (when image-size
                           (let [{:keys [display-width display-height]} image-size
                                 ;; Default crop: center 80% of image
                                 margin-x (* display-width 0.1)
                                 margin-y (* display-height 0.1)]
                             (set-crop! {:x margin-x
                                         :y margin-y
                                         :width (- display-width (* 2 margin-x))
                                         :height (- display-height (* 2 margin-y))})
                             (set-crop-enabled! true)))))

        handle-save! (fn []
                       (when (and image-size (not saving?))
                         (set-saving! true)
                         (let [{:keys [scale]} image-size
                               ;; Convert display crop coordinates to natural image coordinates
                               actual-crop (when crop
                                             {:x (js/Math.round (/ (:x crop) scale))
                                              :y (js/Math.round (/ (:y crop) scale))
                                              :width (js/Math.round (/ (:width crop) scale))
                                              :height (js/Math.round (/ (:height crop) scale))})]
                           (-> (save-edited-image!
                                (state/get-current-repo)
                                asset-block
                                image-src
                                rotation
                                actual-crop
                                (fn []
                                  (shui/dialog-close!)
                                  (state/pub-event! [:ui/re-render-root])))
                               (p/catch (fn [err]
                                          (js/console.error err)
                                          (notification/show! (str "Error: " (.-message err)) :error)))
                               (p/finally #(set-saving! false))))))

        handle-cancel! (fn []
                         (shui/dialog-close!))]

    [:div.block-image-editor
     ;; Image container
     [:div.image-container.relative.flex.justify-center.items-center
      {:ref container-ref
       :style {:background "#1a1a1a"
               :border-radius "8px"
               :min-height "200px"
               :max-height "400px"
               :overflow "hidden"}}

      ;; Image with rotation transform
      [:div.relative
       {:style {:transform (str "rotate(" rotation "deg)")
                :transition "transform 0.3s ease"}}
       [:img
        {:src image-src
         :style {:max-width "100%"
                 :max-height "400px"
                 :display "block"}
         :on-load handle-image-load}]

       ;; Crop overlay (only when crop mode is enabled and no rotation for simplicity)
       (when (and crop-enabled? crop image-size (= rotation 0))
         (crop-overlay container-ref image-size crop set-crop!))]]

     ;; Controls
     [:div.editor-controls.pt-4.space-y-3
      ;; Rotation controls
      [:div.flex.items-center.gap-3
       [:span.text-sm.opacity-70.w-20 (t :asset/rotation)]
       [:div.flex.items-center.gap-2.flex-1
        (shui/button
         {:variant :outline
          :size :sm
          :on-click handle-rotate-left!}
         [:span.flex.items-center.gap-1
          (shui/tabler-icon "rotate-2")
          "-90°"])
        (shui/button
         {:variant :outline
          :size :sm
          :on-click handle-rotate-right!}
         [:span.flex.items-center.gap-1
          (shui/tabler-icon "rotate-clockwise-2")
          "+90°"])
        [:span.text-sm.opacity-50.ml-2 (str rotation "°")]]]

      ;; Crop toggle
      [:div.flex.items-center.gap-3
       [:span.text-sm.opacity-70.w-20 (t :asset/crop)]
       (shui/button
        {:variant (if crop-enabled? :default :outline)
         :size :sm
         :disabled (not= rotation 0)
         :on-click toggle-crop!}
        [:span.flex.items-center.gap-1
         (shui/tabler-icon "crop")
         (if crop-enabled? (t :asset/crop-cancel) (t :asset/crop-start))])
       (when (not= rotation 0)
         [:span.text-sm.opacity-50.ml-2 "(Reset rotation to crop)"])]]

     ;; Action buttons
     [:div.flex.justify-end.gap-2.pt-4.border-t.mt-4
      (shui/button
       {:variant :outline
        :on-click handle-cancel!}
       (t :cancel))
      (shui/button
       {:disabled (or saving? (and (= rotation 0) (nil? crop)))
        :on-click handle-save!}
       (if saving?
         [:span.flex.items-center.gap-2
          (shui/tabler-icon "loader-2" {:class "animate-spin"})
          (t :saving)]
         (t :save)))]]))
