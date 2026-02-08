(ns frontend.components.block-image-editor
  "Block image editor component for cropping and rotating images."
  (:require
   [clojure.string :as string]
   [frontend.context.i18n :refer [t]]
   [frontend.fs :as fs]
   [frontend.handler.assets :as assets-handler]
   [frontend.handler.db-based.property :as db-property-handler]
   [frontend.handler.notification :as notification]
   [frontend.state :as state]
   [frontend.util :as util]
   [logseq.shui.hooks :as hooks]
   [logseq.shui.ui :as shui]
   [promesa.core :as p]
   [rum.core :as rum]))

;; Only allow editing formats that we can safely encode back to.
(def ^:private editable-image-types #{:png :jpg :jpeg :webp})

(defn- resolve-asset-type
  [asset-block image-src]
  (let [ext (some-> (or (:logseq.property.asset/type asset-block)
                        (some-> image-src util/get-file-ext))
                    name
                    string/lower-case)
        type (some-> ext keyword)]
    {:ext ext :type type}))

(defn editable-image?
  [asset-block image-src]
  (contains? editable-image-types (:type (resolve-asset-type asset-block image-src))))

(defn- asset-type->mime
  [asset-type]
  (case asset-type
    :png "image/png"
    :jpg "image/jpeg"
    :jpeg "image/jpeg"
    :webp "image/webp"
    nil))

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
  [image-src rotation crop mime-type]
  (p/let [img (create-image image-src)
          rotated-canvas (apply-rotation img rotation)
          final-canvas (if crop
                         (apply-crop rotated-canvas crop)
                         rotated-canvas)]
    (canvas->blob final-canvas mime-type 0.92)))

(defn- save-edited-image!
  "Save the edited image, replacing the original asset."
  [repo asset-block image-src rotation crop on-complete]
  (let [{:keys [ext type]} (resolve-asset-type asset-block image-src)
        mime-type (asset-type->mime type)]
    (when-not (contains? editable-image-types type)
      (throw (js/Error. (t :asset/edit-unsupported))))
    (p/let [blob (process-image image-src rotation crop mime-type)
            _ (when-not blob
                (throw (js/Error. "Failed to create image blob")))
            ;; Get asset info
            asset-uuid (:block/uuid asset-block)
            ;; Prepare file path
            [repo-dir asset-dir-rpath] (assets-handler/ensure-assets-dir! repo)
            file-rpath (str asset-dir-rpath "/" asset-uuid "." ext)
            ;; Write the file
            buffer (.arrayBuffer blob)
            content (js/Uint8Array. buffer)]
      ;; Use fs namespace for both Electron and web
      (p/do!
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

(defn- clamp
  "Clamp value between min and max."
  [v min-v max-v]
  (max min-v (min max-v v)))

(defn- calc-crop-for-action
  "Calculate new crop values based on drag action and delta."
  [action dx dy start-crop display-width display-height]
  (let [{:keys [x y width height]} start-crop]
    (case action
      :move
      {:x (clamp (+ x dx) 0 (- display-width width))
       :y (clamp (+ y dy) 0 (- display-height height))
       :width width :height height}

      :resize-se
      {:x x :y y
       :width (clamp (+ width dx) 50 (- display-width x))
       :height (clamp (+ height dy) 50 (- display-height y))}

      :resize-nw
      (let [new-x (clamp (+ x dx) 0 (- (+ x width) 50))
            new-y (clamp (+ y dy) 0 (- (+ y height) 50))]
        {:x new-x :y new-y
         :width (- (+ x width) new-x)
         :height (- (+ y height) new-y)})

      :resize-ne
      (let [new-y (clamp (+ y dy) 0 (- (+ y height) 50))]
        {:x x :y new-y
         :width (clamp (+ width dx) 50 (- display-width x))
         :height (- (+ y height) new-y)})

      :resize-sw
      (let [new-x (clamp (+ x dx) 0 (- (+ x width) 50))]
        {:x new-x :y y
         :width (- (+ x width) new-x)
         :height (clamp (+ height dy) 50 (- display-height y))})

      start-crop)))

(rum/defc crop-overlay
  "Draggable crop selection overlay."
  < rum/static
  [image-size crop set-crop!]
  (let [[dragging set-dragging!] (rum/use-state nil)
        [start-pos set-start-pos!] (rum/use-state nil)
        [start-crop set-start-crop!] (rum/use-state nil)
        {:keys [display-width display-height]} image-size
        {:keys [x y width height]} crop

        on-pointer-down (fn [e action]
                          (.preventDefault e)
                          (.stopPropagation e)
                          (set-dragging! action)
                          (set-start-pos! {:x (.-clientX e) :y (.-clientY e)})
                          (set-start-crop! crop))

        on-pointer-move (fn [e]
                          (when (and dragging start-pos start-crop)
                            (let [dx (- (.-clientX e) (:x start-pos))
                                  dy (- (.-clientY e) (:y start-pos))
                                  new-crop (calc-crop-for-action dragging dx dy start-crop
                                                                 display-width display-height)]
                              (set-crop! new-crop))))

        on-pointer-up (fn [_e]
                        (set-dragging! nil)
                        (set-start-pos! nil)
                        (set-start-crop! nil))]

    (hooks/use-effect!
     (fn []
       (when dragging
         (js/document.addEventListener "pointermove" on-pointer-move)
         (js/document.addEventListener "pointerup" on-pointer-up))
       #(do (js/document.removeEventListener "pointermove" on-pointer-move)
            (js/document.removeEventListener "pointerup" on-pointer-up)))
     [dragging])

    [:<>
     ;; Dark overlay outside crop area
     [:div.absolute.bg-black.bg-opacity-50 {:style {:top 0 :left 0 :width "100%" :height y}}]
     [:div.absolute.bg-black.bg-opacity-50 {:style {:top (+ y height) :left 0 :width "100%" :bottom 0}}]
     [:div.absolute.bg-black.bg-opacity-50 {:style {:top y :left 0 :width x :height height}}]
     [:div.absolute.bg-black.bg-opacity-50 {:style {:top y :left (+ x width) :right 0 :height height}}]
     ;; Crop area
     [:div.absolute.border-2.border-white.cursor-move
      {:style {:top y :left x :width width :height height :touch-action "none"}
       :on-pointer-down #(on-pointer-down % :move)}
      ;; Grid lines
      [:div.absolute.border-white.border-opacity-30 {:style {:top "33.33%" :left 0 :right 0 :border-top-width 1}}]
      [:div.absolute.border-white.border-opacity-30 {:style {:top "66.66%" :left 0 :right 0 :border-top-width 1}}]
      [:div.absolute.border-white.border-opacity-30 {:style {:top 0 :bottom 0 :left "33.33%" :border-left-width 1}}]
      [:div.absolute.border-white.border-opacity-30 {:style {:top 0 :bottom 0 :left "66.66%" :border-left-width 1}}]
      ;; Resize handles
      [:div.absolute.w-4.h-4.bg-white.cursor-nw-resize {:style {:top -8 :left -8} :on-pointer-down #(on-pointer-down % :resize-nw)}]
      [:div.absolute.w-4.h-4.bg-white.cursor-ne-resize {:style {:top -8 :right -8} :on-pointer-down #(on-pointer-down % :resize-ne)}]
      [:div.absolute.w-4.h-4.bg-white.cursor-sw-resize {:style {:bottom -8 :left -8} :on-pointer-down #(on-pointer-down % :resize-sw)}]
      [:div.absolute.w-4.h-4.bg-white.cursor-se-resize {:style {:bottom -8 :right -8} :on-pointer-down #(on-pointer-down % :resize-se)}]]]))

;; ============================================================================
;; Main editor component - helper functions
;; ============================================================================

(defn- calc-image-display-size
  "Calculate display size to fit image within container."
  [img container]
  (let [container-width (when container (.-offsetWidth container))
        natural-w (.-naturalWidth img)
        natural-h (.-naturalHeight img)
        max-height 400
        scale (min 1
                   (/ (or container-width 600) natural-w)
                   (/ max-height natural-h))]
    {:natural-width natural-w
     :natural-height natural-h
     :display-width (* natural-w scale)
     :display-height (* natural-h scale)
     :scale scale}))

(defn- init-crop-region
  "Initialize crop region to center 80% of image."
  [image-size]
  (let [{:keys [display-width display-height]} image-size
        margin-x (* display-width 0.1)
        margin-y (* display-height 0.1)]
    {:x margin-x
     :y margin-y
     :width (- display-width (* 2 margin-x))
     :height (- display-height (* 2 margin-y))}))

(defn- scale-crop-to-natural
  "Scale display crop coordinates to natural image coordinates."
  [crop scale]
  (when crop
    {:x (js/Math.round (/ (:x crop) scale))
     :y (js/Math.round (/ (:y crop) scale))
     :width (js/Math.round (/ (:width crop) scale))
     :height (js/Math.round (/ (:height crop) scale))}))

;; ============================================================================
;; Main editor UI components
;; ============================================================================

(rum/defc rotation-controls < rum/static
  [rotation on-rotate-left! on-rotate-right!]
  [:div.flex.items-center.gap-3
   [:span.text-sm.opacity-70.w-20 (t :asset/rotation)]
   [:div.flex.items-center.gap-2.flex-1
    (shui/button {:variant :outline :size :sm :on-click on-rotate-left!}
                 [:span.flex.items-center.gap-1 (shui/tabler-icon "rotate-2") "-90°"])
    (shui/button {:variant :outline :size :sm :on-click on-rotate-right!}
                 [:span.flex.items-center.gap-1 (shui/tabler-icon "rotate-clockwise-2") "+90°"])
    [:span.text-sm.opacity-50.ml-2 (str rotation "°")]]])

(rum/defc crop-controls < rum/static
  [crop-enabled? rotation on-toggle!]
  [:div.flex.items-center.gap-3
   [:span.text-sm.opacity-70.w-20 (t :asset/crop)]
   (shui/button
    {:variant (if crop-enabled? :default :outline) :size :sm
     :disabled (not= rotation 0) :on-click on-toggle!}
    [:span.flex.items-center.gap-1 (shui/tabler-icon "crop")
     (if crop-enabled? (t :asset/crop-cancel) (t :asset/crop-start))])
   (when (not= rotation 0) [:span.text-sm.opacity-50.ml-2 "(Reset rotation to crop)"])])

(rum/defc action-buttons < rum/static
  [saving? can-save? on-save! on-cancel!]
  [:div.flex.justify-end.gap-2.pt-4.border-t.mt-4
   (shui/button {:variant :outline :on-click on-cancel!} (t :cancel))
   (shui/button {:disabled (or saving? (not can-save?)) :on-click on-save!}
                (if saving?
                  [:span.flex.items-center.gap-2 (shui/tabler-icon "loader-2" {:class "animate-spin"}) (t :save) "..."]
                  (t :save)))])

;; ============================================================================
;; Main editor component
;; ============================================================================

(rum/defc editor-content
  "Image editor modal content with crop and rotation controls."
  [asset-block {:keys [src reload-asset!]}]
  (let [[rotation set-rotation!] (rum/use-state 0)
        [crop set-crop!] (rum/use-state nil)
        [crop-enabled? set-crop-enabled!] (rum/use-state false)
        [image-size set-image-size!] (rum/use-state nil)
        [saving? set-saving!] (rum/use-state false)
        container-ref (rum/use-ref nil)

        on-rotate! (fn [delta]
                     (set-rotation! #(mod (+ % delta) 360))
                     (set-crop! nil)
                     (set-crop-enabled! false))

        on-image-load (fn [e]
                        (set-image-size! (calc-image-display-size
                                          (.-target e) (rum/deref container-ref))))

        on-toggle-crop! (fn []
                          (if crop-enabled?
                            (do (set-crop-enabled! false) (set-crop! nil))
                            (when image-size
                              (set-crop! (init-crop-region image-size))
                              (set-crop-enabled! true))))

        on-save! (fn []
                   (when (and image-size (not saving?))
                     (set-saving! true)
                     (-> (save-edited-image!
                          (state/get-current-repo) asset-block src rotation
                          (scale-crop-to-natural crop (:scale image-size))
                          #(do (shui/dialog-close!) (some-> reload-asset! (apply []))))
                         (p/catch #(notification/show! (str "Error: " (.-message %)) :error))
                         (p/finally #(set-saving! false)))))

        can-save? (or (not= rotation 0) (some? crop))]

    [:div.block-image-editor
     [:div.image-container.relative.flex.justify-center.items-center
      {:ref container-ref
       :style {:background "#1a1a1a" :border-radius "8px" :min-height "200px" :max-height "400px" :overflow "hidden"}}
      [:div.relative {:style {:transform (str "rotate(" rotation "deg)") :transition "transform 0.3s ease"}}
       [:img {:src src :style {:max-width "100%" :max-height "400px" :display "block"} :on-load on-image-load}]
       (when (and crop-enabled? crop image-size (= rotation 0))
         (crop-overlay image-size crop set-crop!))]]
     [:div.editor-controls.pt-4.space-y-3
      (rotation-controls rotation #(on-rotate! -90) #(on-rotate! 90))
      (crop-controls crop-enabled? rotation on-toggle-crop!)]
     (action-buttons saving? can-save? on-save! shui/dialog-close!)]))
