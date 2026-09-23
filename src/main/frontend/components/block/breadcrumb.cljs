(ns frontend.components.block.breadcrumb
  (:require [clojure.string :as string]
            [frontend.components.block.breadcrumb-model :as breadcrumb-model]
            [frontend.components.icon :as icon-component]
            [frontend.context.i18n :refer [t]]
            [frontend.db.hooks :as db-hooks]
            [frontend.handler.route :as route-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.object :as gobj]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [io.factorhouse.hsx.core :as hsx]))

(defn- handle-breadcrumb-activate!
  [config block opts e]
  (cond
    (gobj/get e "shiftKey")
    (do
      (util/stop e)
      (state/sidebar-add-block!
       (state/get-current-repo)
       (:db/id block)
       :block-ref))

    (util/atom? (:navigating-block opts))
    (do
      (util/stop e)
      (reset! (:navigating-block opts) (:block/uuid block)))

    (some? (:sidebar-key config))
    nil

    :else
    (when-let [uuid (:block/uuid block)]
      (-> (or (:on-redirect-to-page config) route-handler/redirect-to-page!)
          (apply [(str uuid)])))))

(hsx/defc breadcrumb-fragment
  [config block label opts]
  [:a {:on-pointer-down (fn [e]
                          (when (some? (:sidebar-key config)) (util/stop e)))
       :on-pointer-up (fn [e]
                        (handle-breadcrumb-activate! config block opts e))}
   label])

(defn- breadcrumb-separator
  [& [k]]
  [:span.opacity-50.px-1
   (cond-> {}
     k (assoc :key k))
   "/"])

(hsx/defc breadcrumb-segment-label
  "Renders the visual label (icon + text) for a breadcrumb segment.
   Icon priority:
     1. code/query/note/quote/math → always show their fixed structural icon
     2. page/block with custom icon → get-node-icon-cp (shows custom icon)
     3. empty block (nil text, no custom icon) → point-filled placeholder
     4. regular page/block with text and no custom icon → no icon"
  [seg entity]
  (let [*label-ref (hooks/use-ref nil)
        [truncated? set-truncated!] (hooks/use-state false)
        text (:text seg)
        seg-type (:type seg)
        has-custom-icon? (some? (:icon seg))
        ;; Structural type icons — always present for code/query/note/quote
        structural-icon (case seg-type
                          :code  (shui/tabler-icon "code" {:size "12" :class "opacity-70"})
                          :query (shui/tabler-icon "search" {:size "12" :class "opacity-70"})
                          :note  (shui/tabler-icon "notes" {:size "12" :class "opacity-70"})
                          :quote (shui/tabler-icon "quote" {:size "12" :class "opacity-70"})
                          :math  (shui/tabler-icon "math-function" {:size "12" :class "opacity-70"})
                          nil)
        node-icon (when (and (nil? structural-icon) entity has-custom-icon?)
                    (icon-component/get-node-icon-cp entity {}))
        ;; Placeholder for empty/untitled blocks with no text and no other icon
        empty-placeholder (when (and (nil? structural-icon) (nil? node-icon) (nil? text))
                            (shui/tabler-icon "point-filled" {:size "12" :class "opacity-70"}))
        icon-node (or structural-icon node-icon empty-placeholder)
        non-blank (fn [s] (when-not (string/blank? s) s))
        full-label (or (non-blank (:full-text seg))
                       (non-blank text))
        set-label-ref! (hooks/use-callback (fn [el] (hooks/set-ref! *label-ref el)) [])]
    (hooks/use-effect!
     (fn []
       (if (or (string/blank? text) (string/blank? full-label))
         (do
           (set-truncated! false)
           nil)
         (let [check! (fn []
                        (if-let [^js el (hooks/deref *label-ref)]
                          (set-truncated! (> (.-scrollWidth el) (.-clientWidth el)))
                          (set-truncated! false)))
               resize-observer (when (some? (.-ResizeObserver js/window))
                                 (js/ResizeObserver. check!))]
           (check!)
           (when-let [^js el (hooks/deref *label-ref)]
             (when resize-observer
               (.observe resize-observer el)
               (when-let [parent (.-parentElement el)]
                 (.observe resize-observer parent))))
           (.addEventListener js/window "resize" check!)
           (fn []
             (.removeEventListener js/window "resize" check!)
             (when resize-observer
               (.disconnect resize-observer))))))
     [text full-label])
    (let [inner [:span.breadcrumb__segment.inline-flex.items-center.min-w-0
                 {:aria-label (when-not text full-label)}
                 (when icon-node
                   [:span.breadcrumb__segment-icon.mr-0.5.shrink-0 icon-node])
                 (when text
                   [:span.breadcrumb__label {:ref set-label-ref!} text])]]
      (if (and (not (string/blank? full-label)) truncated?)
        (ui/tooltip inner full-label {:trigger-props {:as-child true}})
        inner))))

(hsx/defc breadcrumb-segment-row
  [config block opts effective-variant]
  (let [block-id (or (:block/uuid block) (:db/id block))
        loaded-block (db-hooks/use-block block-id)
        block' (breadcrumb-model/with-breadcrumb-ref-titles
                (or loaded-block block) (:ref-titles opts))
        segment (breadcrumb-model/block->breadcrumb-segment block')]
    (when segment
      (let [label (breadcrumb-segment-label segment block')]
        (if (or (:disabled? opts) (= effective-variant :search-result))
          label
          (breadcrumb-fragment config block' label opts))))))

(hsx/defc breadcrumb-dropdown-row
  [config block-uuid ref-titles opts]
  (let [entity (some-> (db-hooks/use-block block-uuid)
                       (breadcrumb-model/with-breadcrumb-ref-titles ref-titles))
        segment (breadcrumb-model/block->breadcrumb-segment entity)]
    (when segment
      (shui/dropdown-menu-item
       {:on-click (when-not (:disabled? opts)
                    #(handle-breadcrumb-activate! config entity opts %))}
       (breadcrumb-segment-label segment entity)))))

(hsx/defc breadcrumb-search-overflow-tooltip
  [title]
  (ui/tooltip
   [:span.opacity-40.px-0.5.text-xs
    {:role "button"
     :tab-index 0
     :aria-label (t :breadcrumb/more-ancestors)}
    "···"]
   title
   {:trigger-props {:as-child true}}))

(hsx/defc breadcrumb-overflow-content
  [config target-uuid opts vopts show-page?]
  (when-let [breadcrumb-data
             (db-hooks/use-resource [:block-breadcrumb target-uuid 1000])]
    (let [view (breadcrumb-model/build-breadcrumb-view
                (:ancestor-uuids breadcrumb-data)
                (assoc vopts :show-page? show-page?))
          hidden-uuids (:hidden view)
          ref-titles (:ref-titles breadcrumb-data)]
      (shui/dropdown-menu-content
       {:class "max-h-[min(50vh,420px)] overflow-y-auto"}
       (for [block-uuid hidden-uuids]
         ^{:key (str block-uuid)}
         [:<> (breadcrumb-dropdown-row config block-uuid ref-titles opts)])))))

(hsx/defc breadcrumb-overflow-dropdown
  "Renders an ellipsis button that exposes hidden ancestor segments in a dropdown."
  [config target-uuid opts vopts show-page?]
  (let [open? (hooks/use-memo #(atom false) [])
        [open-value?] (hooks/use-atom open?)]
    (shui/dropdown-menu
     {:open open-value?
      :on-open-change #(reset! open? %)}
     (ui/tooltip
      (shui/dropdown-menu-trigger
       {:as-child true}
       [:button.breadcrumb__overflow.opacity-60.hover:opacity-100.px-0.5.text-xs
        {:aria-label (t :breadcrumb/more-ancestors)}
        "···"])
      (t :breadcrumb/more-ancestors)
      {:trigger-props {:as-child true}})
     (when open-value?
       (breadcrumb-overflow-content
        config target-uuid opts vopts show-page?)))))

;; "block-id - uuid of the target block of breadcrumb. page uuid is also acceptable"
(hsx/defc breadcrumb-aux
  [config target-uuid {:keys [show-page? indent? end-separator? _navigating-block variant header?]
                       :or {show-page? true}
                       :as opts}
   breadcrumb-ancestors]
  (let [;; Derive effective variant from explicit :variant opt or legacy config flags
        effective-variant (or variant
                              (cond
                                header?           :app-header
                                (:search? config) :search-result
                                (:list-view? config) :inline
                                :else :block-page))
        vopts (breadcrumb-model/variant-options effective-variant)
        view (breadcrumb-model/build-breadcrumb-view breadcrumb-ancestors
                                                     (assoc vopts :show-page? show-page?))
        {visible-prefix-raw :visible-prefix
         visible-suffix-raw :visible-suffix
         overflow? :overflow?} view
        config (assoc config
                      :breadcrumb? true
                      :disable-preview? true)
        render-seg (fn [group block]
                     ^{:key (str group "-seg-" (:block/uuid block))}
                     [:<> (breadcrumb-segment-row
                           config block opts effective-variant)])
        render-segs (fn [group blocks]
                      (mapcat (fn [idx block]
                                (if (zero? idx)
                                  [(render-seg group block)]
                                  [(breadcrumb-separator (str group "-sep-" idx))
                                   (render-seg group block)]))
                              (cljs.core/range)
                              blocks))]
    (when (or (seq visible-prefix-raw) (seq visible-suffix-raw))
      [:div.breadcrumb.block-parents
       {:class (str " breadcrumb--" (name effective-variant)
                    (when-not (or (:search? config) (:list-view? config)) " my-2")
                    (when indent? " ml-4"))}
       (when (and (false? (:top-level? config)) (seq breadcrumb-ancestors))
         (breadcrumb-separator "leading-sep"))
       ;; visible prefix (page + early ancestors)
       (render-segs "prefix" visible-prefix-raw)
       ;; overflow indicator
       (when overflow?
         (concat
          [(breadcrumb-separator "overflow-sep")]
          [^{:key "overflow"}
           [:<> (if (= effective-variant :search-result)
                  (breadcrumb-search-overflow-tooltip (t :breadcrumb/more-ancestors))
                  (breadcrumb-overflow-dropdown
                   config target-uuid opts vopts show-page?))]]))
       ;; visible suffix (nearest parents)
       (when (seq visible-suffix-raw)
         (concat
          [(breadcrumb-separator "suffix-leading-sep")]
          (render-segs "suffix" visible-suffix-raw)))
       (when end-separator? (breadcrumb-separator "end-sep"))])))

(hsx/defc subscribed-breadcrumb
  [config block-id opts]
  (when-let [breadcrumb-data (db-hooks/use-resource [:block-breadcrumb block-id 16])]
    (let [breadcrumb-ancestors (breadcrumb-model/resource-ancestors breadcrumb-data)]
      (when (seq breadcrumb-ancestors)
        (breadcrumb-aux config block-id
                        (assoc opts :ref-titles (:ref-titles breadcrumb-data))
                        breadcrumb-ancestors)))))

(defn breadcrumb
  [config _repo block-id {:keys [block] :as opts}]
  (if (contains? block :block.temp/breadcrumb)
    (when-let [breadcrumb-ancestors (seq (:block.temp/breadcrumb block))]
      (breadcrumb-aux config block-id opts breadcrumb-ancestors))
    (subscribed-breadcrumb config block-id opts)))
