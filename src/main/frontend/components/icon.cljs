(ns frontend.components.icon
  (:require ["@emoji-mart/data" :as emoji-data]
            ["emoji-mart" :refer [SearchIndex]]
            ["path" :as node-path]
            [camel-snake-kebab.core :as csk]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.colors :as colors]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.async :as db-async]
            [frontend.db.model :as model]
            [frontend.db.utils :as db-utils]
            [frontend.fs :as fs]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.property :as property-handler]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.functions :refer [debounce]]
            [goog.object :as gobj]
            [logseq.common.config :as common-config]
            [logseq.common.path :as path]
            [logseq.db :as ldb]
            [logseq.db.frontend.asset :as db-asset]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [medley.core :as medley]
            [promesa.core :as p]
            [rum.core :as rum]))

(defonce emojis (vals (bean/->clj (gobj/get emoji-data "emojis"))))

;; Asset picker drag & drop state
(defonce *drag-active? (atom false))
(defonce *drag-depth (atom 0)) ;; Track drag enter/leave depth to prevent flicker
(defonce *asset-picker-open? (atom false))
(defonce *upload-status (atom ""))
(defonce *uploading-files (atom {}))

;; Offscreen canvas for measuring text width (never attached to DOM)
(defonce *text-measure-ctx
  (let [canvas (js/document.createElement "canvas")]
    (.getContext canvas "2d")))

(declare normalize-icon derive-initials derive-avatar-initials
         <search-wikipedia-image <save-url-asset! open-image-asset-picker!)

(defn- convert-bg-color-to-rgba
  "Convert background color to rgba format with opacity ~0.314.
   Handles hex colors, CSS variables, and rgba colors."
  [backgroundColor]
  (cond
   ;; Hex color - convert to rgba with opacity
    (and (string? backgroundColor)
         (string/starts-with? backgroundColor "#")
         (= (count (string/replace backgroundColor #"^#" "")) 6))
    (let [hex (string/replace backgroundColor #"^#" "")
          r (js/parseInt (subs hex 0 2) 16)
          g (js/parseInt (subs hex 2 4) 16)
          b (js/parseInt (subs hex 4 6) 16)]
      (str "rgba(" r "," g "," b ",0.314)"))
   ;; Already rgba - update opacity to 0.314
    (and (string? backgroundColor)
         (string/includes? backgroundColor "rgba"))
    (string/replace backgroundColor #",\s*[\d.]+\)$" ",0.314)")
   ;; CSS variable - use color-mix to apply opacity
    (and (string? backgroundColor)
         (string/starts-with? backgroundColor "var("))
    (str "color-mix(in srgb, " backgroundColor " 31.4%, transparent)")
   ;; Default: use as-is (might be a color name or other format)
    :else backgroundColor))

(defn- get-asset-type-from-db
  "Get asset type from DB using a direct Datalog query.
   This works even when db/entity returns nil due to lazy loading."
  [asset-uuid]
  (when (and asset-uuid (string? asset-uuid))
    (try
      (let [parsed-uuid (uuid asset-uuid)
            result (db-utils/q '[:find ?type .
                                 :in $ ?uuid
                                 :where
                                 [?e :block/uuid ?uuid]
                                 [?e :logseq.property.asset/type ?type]]
                               parsed-uuid)]
        result)
      (catch :default _e
        nil))))

(def ^:private common-image-extensions
  "Common image extensions to try when asset-type is unknown"
  ["png" "jpg" "jpeg" "gif" "webp" "svg" "bmp" "ico"])

(defn- <load-asset-url!
  "Resolve an asset blob URL, retrying on transient failures (e.g. db-worker not ready).
   When asset-type is nil and :try-extensions? is true, tries common image extensions.
   Pass :*load-id atom (per-component) to guard against stale retries overwriting a newer load.
   Without :*load-id, no staleness check is performed (safe for single-load components)."
  [*url *error asset-uuid asset-type {:keys [max-retries delay-ms try-extensions? *load-id]
                                      :or {max-retries 3 delay-ms 1000 try-extensions? false}}]
  (let [load-id (when *load-id (swap! *load-id inc))
        stale? (if *load-id
                 #(not= load-id @*load-id)
                 (constantly false))]
    (reset! *url nil)
    (reset! *error false)
    (if (and (not asset-type) try-extensions?)
      ;; Unknown extension — try common ones sequentially
      (do
        (js/console.log "[DEBUG <load-asset-url!] trying extensions" (pr-str {:uuid asset-uuid :load-id load-id}))
        (letfn [(try-ext [exts attempt]
                  (if (empty? exts)
                    (when-not (stale?)
                      (js/console.error "[DEBUG <load-asset-url!] all extensions failed" (pr-str {:uuid asset-uuid :load-id load-id}))
                      (reset! *error true))
                    (let [ext (first exts)
                          file (str asset-uuid "." ext)
                          asset-path (path/path-join (str "../" common-config/local-assets-dir) file)]
                      (-> (assets-handler/<make-asset-url asset-path)
                          (p/then (fn [url]
                                    (when-not (stale?)
                                      (js/console.log "[DEBUG <load-asset-url!] OK via ext" (pr-str {:uuid asset-uuid :ext ext :load-id load-id :url (subs (str url) 0 80)}))
                                      (reset! *error false)
                                      (reset! *url url))))
                          (p/catch (fn [err]
                                     (if (stale?)
                                       (js/console.log "[DEBUG <load-asset-url!] stale, aborting" (pr-str {:uuid asset-uuid :load-id load-id}))
                                       ;; If this was a worker-not-ready error and we have retries left, delay and retry same ext
                                       (if (and (< attempt max-retries)
                                                (string/includes? (str err) "not been initialized"))
                                         (js/setTimeout #(try-ext exts (inc attempt)) delay-ms)
                                         ;; Otherwise try next extension
                                         (try-ext (rest exts) 0)))))))))]
          (try-ext common-image-extensions 0)))
      ;; Known extension — retry with delay on failure
      (let [file (str asset-uuid "." asset-type)
            asset-path (path/path-join (str "../" common-config/local-assets-dir) file)]
        (js/console.log "[DEBUG <load-asset-url!]" (pr-str {:uuid asset-uuid :type asset-type :path asset-path :load-id load-id}))
        (letfn [(attempt [n]
                  (-> (assets-handler/<make-asset-url asset-path)
                      (p/then (fn [url]
                                (when-not (stale?)
                                  (js/console.log "[DEBUG <load-asset-url!] OK" (pr-str {:uuid asset-uuid :attempt n :load-id load-id :url (subs (str url) 0 80)}))
                                  (reset! *error false)
                                  (reset! *url url))))
                      (p/catch (fn [err]
                                 (if (stale?)
                                   (js/console.log "[DEBUG <load-asset-url!] stale, aborting" (pr-str {:uuid asset-uuid :load-id load-id}))
                                   (do
                                     (js/console.error "[DEBUG <load-asset-url!] FAILED" (pr-str {:uuid asset-uuid :attempt n :max max-retries :load-id load-id :error (str err)}))
                                     (if (< n max-retries)
                                       (js/setTimeout #(attempt (inc n)) delay-ms)
                                       (reset! *error true))))))))]
          (attempt 0))))))

(rum/defcs image-icon-cp < rum/reactive
  (rum/local nil ::url)
  (rum/local false ::error)
  (rum/local nil ::loaded-uuid)
  (rum/local 0 ::load-id)
  {:did-mount (fn [state]
                (let [[asset-uuid asset-type-arg _opts] (:rum/args state)
                      asset-type (or asset-type-arg
                                     (get-asset-type-from-db asset-uuid))
                      *url (::url state)
                      *error (::error state)
                      *loaded-uuid (::loaded-uuid state)]
                  (when (and asset-uuid (not= @*loaded-uuid asset-uuid))
                    (reset! *loaded-uuid asset-uuid)
                    (<load-asset-url! *url *error asset-uuid asset-type
                                      {:try-extensions? (nil? asset-type)
                                       :*load-id (::load-id state)})))
                state)
   :did-update (fn [state]
                 (let [[asset-uuid asset-type-arg _opts] (:rum/args state)
                       *loaded-uuid (::loaded-uuid state)]
                   (when (and asset-uuid (not= @*loaded-uuid asset-uuid))
                     (let [asset-type (or asset-type-arg
                                          (get-asset-type-from-db asset-uuid))
                           *url (::url state)
                           *error (::error state)]
                       (reset! *loaded-uuid asset-uuid)
                       (<load-asset-url! *url *error asset-uuid asset-type
                                         {:try-extensions? (nil? asset-type)
                                          :*load-id (::load-id state)}))))
                 state)}
  "Renders an image icon by loading the asset URL asynchronously.
   Tries common extensions if asset-type is unknown.
   Accepts optional :on-click-error callback in opts for error state clicks."
  [state asset-uuid _asset-type-arg opts]
  (let [url @(::url state)
        error? @(::error state)
        size (or (:size opts) 20)
        on-click-error (:on-click-error opts)]
    (cond
      error?
      [:span.ui__icon.image-icon.image-error.bg-gray-04.flex.items-center.justify-center.cursor-pointer
       (cond-> {:style {:width size :height size}
                :title "Image not found - click to replace"}
         on-click-error (assoc :on-click on-click-error))
       (shui/tabler-icon "photo-off" {:size (* size 0.6)})]

      url
      [:span.ui__icon.image-icon.flex.items-center.justify-center
       {:style {:width size :height size}}
       [:img
        {:src url
         :loading "lazy"
         :on-error (fn [_e]
                     (reset! (::url state) nil)
                     (reset! (::error state) true))
         :style {:width "100%"
                 :height "100%"
                 :object-fit "contain"
                 :display "block"}}]]

      :else
      [:span.ui__icon.image-icon.bg-gray-04.animate-pulse
       {:style {:width size :height size}}])))

(rum/defcs avatar-image-cp < rum/reactive
  (rum/local nil ::url)
  (rum/local false ::error)
  (rum/local nil ::loaded-for)
  (rum/local 0 ::load-id)
  {:did-mount (fn [state]
                (let [[asset-uuid asset-type _avatar-data _opts] (:rum/args state)
                      *url (::url state)
                      *error (::error state)
                      *loaded-for (::loaded-for state)]
                  (when (and asset-uuid (not= @*loaded-for [asset-uuid asset-type]))
                    (reset! *loaded-for [asset-uuid asset-type])
                    (<load-asset-url! *url *error asset-uuid asset-type
                                      {:try-extensions? (nil? asset-type)
                                       :*load-id (::load-id state)})))
                state)
   :did-update (fn [state]
                 (let [[asset-uuid asset-type _avatar-data _opts] (:rum/args state)
                       *loaded-for (::loaded-for state)]
                   (when (and asset-uuid (not= @*loaded-for [asset-uuid asset-type]))
                     (let [*url (::url state)
                           *error (::error state)]
                       (reset! *loaded-for [asset-uuid asset-type])
                       (<load-asset-url! *url *error asset-uuid asset-type
                                         {:try-extensions? (nil? asset-type)
                                          :*load-id (::load-id state)}))))
                 state)}
  "Renders an avatar with an image, with initials as fallback.
   Uses shui/avatar for circular display with object-fit: cover."
  [state _asset-uuid _asset-type avatar-data opts]
  (let [url @(::url state)
        ;; Size from opts, default to 20px
        size (or (:size opts) 20)
        ;; Fallback data from avatar
        avatar-value (get avatar-data :value "")
        explicit-bg (get avatar-data :backgroundColor)
        explicit-color (get avatar-data :color)
        display-text (subs avatar-value 0 (min 3 (count avatar-value)))
        ;; Scale font-size with avatar size
        font-size (cond
                    (<= size 16) "8px"
                    (<= size 24) "10px"
                    (<= size 32) "12px"
                    :else "14px")]
    (shui/avatar
     {:style {:width size :height size}}
     ;; Image (shows when loaded, circular with cover fit)
     (when url
       (shui/avatar-image {:src url
                           :style {:object-fit "cover"}}))
     ;; Fallback (shows while loading or on error)
     (shui/avatar-fallback
      {:style (cond-> {:font-size font-size
                       :font-weight "500"}
                explicit-bg
                (assoc :background-color (convert-bg-color-to-rgba explicit-bg))
                explicit-color
                (assoc :color explicit-color))}
      display-text))))

(defn measure-text-width
  "Measure pixel width of text at given font-size using offscreen canvas."
  [text font-size-px]
  (set! (.-font *text-measure-ctx)
        (str "500 " font-size-px "px Inter, sans-serif"))
  (.-width (.measureText *text-measure-ctx text)))

(defn svg-text-font-size
  "Compute font-size in viewBox coords (0-100) that makes text fill ~85% width.
   Uses canvas measureText for accuracy across proportional fonts."
  [text]
  (if (string/blank? text)
    72
    (let [target-width 85
          initial-size (cond
                         (<= (count text) 1) 72
                         (<= (count text) 2) 56
                         (<= (count text) 3) 44
                         (<= (count text) 4) 36
                         :else 28)
          measured (measure-text-width text initial-size)
          adjusted (* initial-size (/ target-width measured))]
      (min 80 (max 10 adjusted)))))

(defn smart-split-text
  "Split 5+ char text into two lines at natural boundaries.
   Prefers splitting at spaces, then letters+digits, then midpoint.
   Returns vector of 1 or 2 strings."
  [text]
  (if (<= (count text) 4)
    [text]
    (let [mid (js/Math.ceil (/ (count text) 2))
          ;; Find all space positions using string/index-of
          find-spaces (fn []
                        (loop [idx 0 result []]
                          (let [found (string/index-of text " " idx)]
                            (if (some? found)
                              (recur (inc found) (conj result found))
                              result))))]
      (let [spaces (find-spaces)]
        (if (seq spaces)
          ;; Split at space nearest to midpoint
          (let [best (apply min-key #(js/Math.abs (- % mid)) spaces)]
            [(string/trim (subs text 0 best))
             (string/trim (subs text (inc best)))])
          ;; No spaces: try letters+digits boundary
          (if-let [[_ letters digits] (re-matches #"^([A-Za-z]+)(\d+)$" text)]
            [letters digits]
            ;; Fallback: midpoint
            [(subs text 0 mid) (subs text mid)]))))))

(defn icon
  [icon' & [opts]]
  (let [normalized (or (normalize-icon icon') icon')
        color? (:color? opts)
        opts (dissoc opts :color?)
        item (cond
               ;; Unified shape format
               (and (map? normalized) (= :emoji (:type normalized)) (get-in normalized [:data :value]))
               [:span.ui__icon
                [:em-emoji (merge {:id (get-in normalized [:data :value])
                                   :style {:line-height 1}}
                                  opts)]]

               (and (map? normalized) (= :icon (:type normalized)) (get-in normalized [:data :value]))
               (ui/icon (get-in normalized [:data :value]) opts)

               (and (map? normalized) (= :text (:type normalized)) (get-in normalized [:data :value]))
               (let [text-value (get-in normalized [:data :value])
                     text-color (get-in normalized [:data :color])
                     text-align (get-in normalized [:data :alignment])
                     display-text (if (> (count text-value) 8)
                                    (subs text-value 0 8)
                                    text-value)
                     size (or (:size opts) 20)
                     ;; Always split 5+ char text — icon should look identical at all sizes
                     lines (smart-split-text display-text)
                     multi-line? (> (count lines) 1)
                     ;; Compute font-size in viewBox coords for widest line
                     widest-line (if multi-line?
                                   (apply max-key count lines)
                                   display-text)
                     font-size (svg-text-font-size widest-line)
                     ;; For multi-line, clamp so both lines fit vertically
                     font-size (if (and multi-line? (> (* font-size 2.4) 95))
                                 (/ 95 2.4)
                                 font-size)
                     ;; Dynamic y-positions based on font-size
                     line-spacing (* font-size 1.25)
                     y1 (- 50 (/ line-spacing 2))
                     y2 (+ 50 (/ line-spacing 2))
                     ;; SVG text-anchor from alignment
                     anchor (case text-align "left" "start" "right" "end" "middle")
                     x (case text-align "left" 8 "right" 92 50)
                     fill (or text-color "currentColor")]
                 [:svg {:viewBox "0 0 100 100"
                        :width size :height size
                        :style {:fill fill
                                :flex-shrink 0}}
                  (if multi-line?
                    (list
                     [:text {:x x :y y1 :font-size font-size :font-weight "500"
                             :font-family "Inter, sans-serif"
                             :text-anchor anchor :dominant-baseline "central"}
                      (first lines)]
                     [:text {:x x :y y2 :font-size font-size :font-weight "500"
                             :font-family "Inter, sans-serif"
                             :text-anchor anchor :dominant-baseline "central"}
                      (second lines)])
                    [:text {:x x :y 50 :font-size font-size :font-weight "500"
                            :font-family "Inter, sans-serif"
                            :text-anchor anchor :dominant-baseline "central"}
                     display-text])])

               (and (map? normalized) (= :avatar (:type normalized)) (get-in normalized [:data :value]))
               (let [avatar-data (get normalized :data)
                     asset-uuid (get avatar-data :asset-uuid)
                     asset-type (get avatar-data :asset-type)]
                 (if asset-uuid
                   ;; Avatar with image - use async loading component
                   (avatar-image-cp asset-uuid asset-type avatar-data opts)
                   ;; Text-only avatar
                   (let [size (or (:size opts) 20)
                         avatar-value (get avatar-data :value)
                         explicit-bg (get avatar-data :backgroundColor)
                         explicit-color (get avatar-data :color)
                         display-text (subs avatar-value 0 (min 3 (count avatar-value)))
                         ;; Scale font-size with avatar size
                         font-size (cond
                                     (<= size 16) "8px"
                                     (<= size 24) "10px"
                                     (<= size 32) "12px"
                                     :else "14px")]
                     (shui/avatar
                      {:style {:width size :height size}}
                      (shui/avatar-fallback
                       {:style (cond-> {:font-size font-size
                                        :font-weight "500"}
                                 explicit-bg
                                 (assoc :background-color (convert-bg-color-to-rgba explicit-bg))
                                 explicit-color
                                 (assoc :color explicit-color))}
                       display-text)))))

               ;; Image with asset - use image icon component
               (and (map? normalized) (= :image (:type normalized)) (get-in normalized [:data :asset-uuid]))
               (let [asset-uuid (get-in normalized [:data :asset-uuid])
                     asset-type (get-in normalized [:data :asset-type])]
                 (image-icon-cp asset-uuid asset-type opts))

               ;; Legacy format support (fallback if normalization failed)
               (and (map? icon') (= :emoji (:type icon')) (:id icon'))
               [:span.ui__icon
                [:em-emoji (merge {:id (:id icon')
                                   :style {:line-height 1}}
                                  opts)]]

               (and (map? icon') (= :tabler-icon (:type icon')) (:id icon'))
               (ui/icon (:id icon') (cond-> opts
                                      (#{"property" "child-node" "page-property" "node"} (:id icon'))
                                      (assoc :extension? true)))

               :else nil)]
    (when item
      (if color?
        [:span.inline-flex.items-center.ls-icon-color-wrap
         {:style {:color (or (get-in normalized [:data :color])
                             (some-> icon' :color)
                             "inherit")}} item]
        item))))

(defn get-node-icon
  [node-entity]
  (let [block-icon (get node-entity :logseq.property/icon)
        sorted-tags (sort-by :db/id (:block/tags node-entity))
        ;; Check for default-icon on tags
        default-icon (some :logseq.property.class/default-icon sorted-tags)]
    (cond
      ;; 1. Instance's own icon takes precedence (:none = explicitly deleted, skip inheritance)
      (and block-icon (= :none (:type block-icon)))
      nil

      block-icon
      block-icon

      ;; 2. Resolve from tag's default-icon (unified inheritance)
      default-icon
      (case (:type default-icon)
        :avatar (when (:block/title node-entity)
                  (let [colors (select-keys (:data default-icon) [:backgroundColor :color])]
                    (cond-> {:type :avatar
                             :data (merge colors
                                          {:value (derive-avatar-initials (:block/title node-entity))})}
                      (:color colors) (assoc :color (:color colors)))))
        :text (when (:block/title node-entity)
                (let [colors (select-keys (:data default-icon) [:color])]
                  (cond-> {:type :text
                           :data (merge colors
                                        {:value (derive-initials (:block/title node-entity))})}
                    (:color colors) (assoc :color (:color colors)))))
        ;; Image type: return marker indicating inherited image without asset yet
        :image {:type :image
                :data {:empty? true}}
        ;; For tabler-icon and emoji, use the stored icon value directly
        default-icon)

      ;; 3. Type-based defaults (for classes, properties, pages, etc.)
      :else
      (let [asset-type (:logseq.property.asset/type node-entity)]
        (cond
          (ldb/class? node-entity)
          "hash"
          (ldb/property? node-entity)
          "letter-p"
          (ldb/page? node-entity)
          "file"
          (= asset-type "pdf")
          "book"
          :else
          "point-filled")))))

(rum/defc get-node-icon-cp < rum/reactive db-mixins/query
  [node-entity opts]
  (let [;; Get fresh entity using db/sub-block to make it reactive to property changes
        fresh-entity (when-let [db-id (:db/id node-entity)]
                       (or (model/sub-block db-id) node-entity))
        entity (or fresh-entity node-entity)
        node-icon (cond
                    (:own-icon? opts)
                    (get entity :logseq.property/icon)
                    (:link? opts)
                    "arrow-narrow-right"
                    :else
                    (get-node-icon entity))
        ;; Photo-based custom icons (avatar/image) default to 20px but respect caller's :size.
        ;; Symbolic icons (emoji, tabler, text, defaults) use caller's :size or 14.
        photo-icon? (and (map? node-icon)
                         (contains? #{:avatar :image} (:type node-icon)))
        effective-size (if photo-icon?
                         (or (:size opts) 20)
                         (or (:size opts) 14))
        opts' (assoc opts :size effective-size)]
    (when-not (or (string/blank? node-icon) (and (contains? #{"letter-n" "file"} node-icon) (:not-text-or-page? opts)))
      [:div.icon-cp-container.flex.items-center.justify-center
       {:style {:color (or (:color node-icon) "inherit")}
        :class (str (when photo-icon? "photo-icon")
                    (when-let [c (:class opts)] (str " " c)))}
       (icon node-icon opts')])))

(defn- emoji-char?
  "Check if a string is a single emoji character by checking against known emojis"
  [s]
  (and (string? s)
       (not (string/blank? s))
       (<= (count s) 2) ; emojis are typically 1-2 code units
       (some #(= (:id %) s) emojis)))

(defn- guess-from-value
  "Attempt to guess icon type from map value when type is unknown"
  [m]
  (let [value (or (:value m) (:id m))]
    (when (string? value)
      (if (emoji-char? value)
        {:type :emoji
         :id (str "emoji-" value)
         :label value
         :data {:value value}}
        {:type :icon
         :id (str "icon-" value)
         :label value
         :data {:value value}}))))

(defn normalize-icon
  "Convert various icon formats to unified icon-item shape:
   {:id string, :type :emoji|:icon|:text|:avatar, :label string, :data {:value string, :color string (optional), :backgroundColor string (optional)}}"
  [v]
  (cond
    ;; Already unified shape? (has :data key)
    (and (map? v) (keyword? (:type v)) (contains? v :data)) v

    ;; Legacy map with :type
    (map? v)
    (let [type-kw (cond
                    (keyword? (:type v)) (:type v)
                    (string? (:type v)) (keyword (:type v))
                    :else nil)
          id (or (:id v) (:value v))
          value (or (:value v) (:id v))
          color (:color v)
          label (or (:name v) (:label v) value)]
      (case type-kw
        :emoji {:type :emoji
                :id (or id (str "emoji-" value))
                :label (or label value)
                :data {:value value}}
        :tabler-icon {:type :icon
                      :id (or id (str "icon-" value))
                      :label (or label value)
                      :data (cond-> {:value value}
                              color (assoc :color color))}
        :icon {:type :icon
               :id (or id (str "icon-" value))
               :label (or label value)
               :data (cond-> {:value value}
                       color (assoc :color color))}
        :text (let [alignment (or (get-in v [:data :alignment]) (:alignment v))
                    mode (or (get-in v [:data :mode]) (:mode v))]
                {:type :text
                 :id (or id (str "text-" value))
                 :label (or label value)
                 :data (cond-> {:value value}
                         color (assoc :color color)
                         alignment (assoc :alignment alignment)
                         mode (assoc :mode mode))})
        :avatar (let [backgroundColor (or (:backgroundColor v)
                                          (colors/variable :gray :09))
                      color (or (:color v)
                                (colors/variable :gray :09))
                      ;; Preserve image data if present
                      asset-uuid (or (get-in v [:data :asset-uuid]) (:asset-uuid v))
                      asset-type (or (get-in v [:data :asset-type]) (:asset-type v))]
                  {:type :avatar
                   :id (or id (str "avatar-" value))
                   :label (or label value)
                   :data (cond-> {:value value
                                  :backgroundColor backgroundColor
                                  :color color}
                           asset-uuid (assoc :asset-uuid asset-uuid)
                           asset-type (assoc :asset-type asset-type))})
        :image (let [;; Extract asset-uuid, stripping "image-" prefix if present (from :id fallback)
                     raw-uuid (or (get-in v [:data :asset-uuid]) (:asset-uuid v) value)
                     asset-uuid (if (and (string? raw-uuid) (string/starts-with? raw-uuid "image-"))
                                  (subs raw-uuid 6)
                                  raw-uuid)
                     ;; Try to get asset-type from data, or look up from DB using Datalog query
                     asset-type (or (get-in v [:data :asset-type])
                                    (:asset-type v)
                                    (get-asset-type-from-db asset-uuid))]
                 {:type :image
                  :id (or id (str "image-" asset-uuid))
                  :label (or label asset-uuid)
                  :data {:asset-uuid asset-uuid
                         :asset-type asset-type}})
        ;; Fallback: try to guess from value
        (or (guess-from-value v)
            {:type :icon
             :id (str "icon-" (or value "unknown"))
             :label (or label value "unknown")
             :data {:value (or value "")}})))

    ;; Plain string: detect emoji vs icon name
    (string? v)
    (if (emoji-char? v)
      {:type :emoji
       :id (str "emoji-" v)
       :label v
       :data {:value v}}
      {:type :icon
       :id (str "icon-" v)
       :label v
       :data {:value v}})

    :else nil))

(defn get-image-assets
  "Get image assets from frontend Datascript (fast, but may be empty on cold start)"
  []
  (let [image-extensions (set (map name config/image-formats))
        results (db-utils/q '[:find ?uuid ?type ?title ?updated ?checksum
                              :where
                              [?e :logseq.property.asset/type ?type]
                              [?e :logseq.property.asset/checksum ?checksum]
                              [?e :block/uuid ?uuid]
                              [(get-else $ ?e :block/title "") ?title]
                              [(get-else $ ?e :block/updated-at 0) ?updated]])]
    (->> results
         (filter (fn [[_uuid type _title _updated _checksum]]
                   (contains? image-extensions (some-> type string/lower-case))))
         (sort-by (fn [[_uuid _type _title updated _checksum]] updated) >)
         ;; Deduplicate by checksum — keep the most recently updated entry
         (medley/distinct-by (fn [[_uuid _type _title _updated checksum]] checksum))
         (map (fn [[uuid type title _updated checksum]]
                {:block/uuid uuid
                 :block/title (if (string/blank? title) (str uuid) title)
                 :logseq.property.asset/type type
                 :logseq.property.asset/checksum checksum})))))

(defn <get-image-assets
  "Async fetch image assets from DB worker (works on cold start).
   Returns a promise that resolves to a list of asset maps.
   Uses transact-db? false to avoid re-transacting deleted assets back into frontend."
  []
  (when-let [graph (state/get-current-repo)]
    (p/let [results (db-async/<q graph
                                 {:transact-db? false}
                                 '[:find (pull ?e [:block/uuid :block/title :logseq.property.asset/type :logseq.property.asset/checksum :block/updated-at])
                                   :where
                                   [?e :logseq.property.asset/type ?type]
                                   [?e :logseq.property.asset/checksum _]])]
      (let [image-extensions (set (map name config/image-formats))
            ;; Results from pull queries come as [[{map}] [{map}] ...], extract the maps
            assets (map (fn [r] (if (vector? r) (first r) r)) results)]
        (->> assets
             (filter (fn [asset]
                       (contains? image-extensions
                                  (some-> (:logseq.property.asset/type asset) string/lower-case))))
             ;; Deduplicate by checksum — keep the most recently updated entry
             (sort-by :block/updated-at >)
             (medley/distinct-by :logseq.property.asset/checksum))))))

(defn- write-asset-file!
  "Write an asset file to disk"
  [repo dir file file-rpath]
  (p/let [buffer (.arrayBuffer file)]
    (if (util/electron?)
      (ipc/ipc "writeFile" repo (path/path-join dir file-rpath) buffer)
      ;; web
      (p/let [buffer (.arrayBuffer file)
              content (js/Uint8Array. buffer)]
        (fs/write-plain-text-file! repo dir file-rpath content nil)))))

;; ============================================================================
;; URL Asset Download Helpers
;; ============================================================================

(def ^:private max-url-asset-size
  "Maximum allowed size for URL assets (10MB)"
  (* 10 1024 1024))

(defn- valid-url?
  "Check if string is a valid HTTP/HTTPS URL"
  [url]
  (and (string? url)
       (not (string/blank? url))
       (or (string/starts-with? url "http://")
           (string/starts-with? url "https://"))))

(defn- valid-image-content-type?
  "Check if content-type header indicates an image"
  [content-type]
  (and (string? content-type)
       (string/starts-with? content-type "image/")))

(defn- content-type->extension
  "Convert content-type to file extension"
  [content-type]
  (when (string? content-type)
    (case (string/lower-case content-type)
      "image/png" "png"
      "image/jpeg" "jpg"
      "image/jpg" "jpg"
      "image/gif" "gif"
      "image/webp" "webp"
      "image/svg+xml" "svg"
      "image/bmp" "bmp"
      "image/heic" "heic"
      "image/x-icon" "ico"
      "image/vnd.microsoft.icon" "ico"
      ;; Fallback: extract from content-type (e.g., "image/tiff" -> "tiff")
      (second (re-find #"image/(\w+)" content-type)))))

(defn- extract-filename-from-url
  "Extract a filename from URL path, stripping extension"
  [url]
  (try
    (let [url-obj (js/URL. url)
          pathname (.-pathname url-obj)
          basename (node-path/basename pathname)
          ;; Use db-asset utility to strip extension
          name-without-ext (db-asset/asset-name->title basename)]
      (if (or (string/blank? name-without-ext)
              (= name-without-ext "image"))
        ;; Fallback to timestamp if no meaningful name
        (date/get-date-time-string-2)
        name-without-ext))
    (catch :default _
      (date/get-date-time-string-2))))

(defn- <validate-url-asset
  "Validate URL by making a HEAD request. Returns promise with {:content-type :size} or rejects."
  [url]
  (p/create
   (fn [resolve reject]
     (-> (js/fetch url #js {:method "HEAD"
                            :mode "cors"
                            :credentials "omit"})
         (.then (fn [^js response]
                  (if (.-ok response)
                    (let [content-type (.get (.-headers response) "content-type")
                          content-length (.get (.-headers response) "content-length")
                          size (when content-length (js/parseInt content-length 10))]
                      (resolve {:content-type content-type
                                :size size
                                :url url}))
                    (reject (ex-info "Failed to fetch URL" {:status (.-status response)})))))
         (.catch (fn [err]
                   (reject (ex-info "Network error" {:error (.-message err)}))))))))

(defn- <download-url-asset
  "Download image from URL. Returns promise with {:data (ArrayBuffer) :content-type :size}."
  [url]
  (p/create
   (fn [resolve reject]
     (-> (js/fetch url #js {:method "GET"
                            :mode "cors"
                            :credentials "omit"})
         (.then (fn [^js response]
                  (if (.-ok response)
                    (let [content-type (.get (.-headers response) "content-type")]
                      (-> (.arrayBuffer response)
                          (.then (fn [buffer]
                                   (resolve {:data buffer
                                             :content-type content-type
                                             :size (.-byteLength buffer)})))))
                    (reject (ex-info "Failed to download" {:status (.-status response)})))))
         (.catch (fn [err]
                   (reject (ex-info "Network error" {:error (.-message err)}))))))))

;; ============================================================================
;; Asset Saving
;; ============================================================================

(defn save-image-asset!
  "Save an image file as an asset using api-insert-new-block! approach.
   Creates the asset as a child of the Asset class page (like tag tables do),
   avoiding journal entries."
  [repo ^js file]
  (p/let [file-name (node-path/basename (.-name file))
          file-name-without-ext* (db-asset/asset-name->title file-name)
          file-name-without-ext (if (= file-name-without-ext* "image")
                                  (date/get-date-time-string-2)
                                  file-name-without-ext*)
          checksum (assets-handler/get-file-checksum file)
          existing-asset (some->> checksum (db-async/<get-asset-with-checksum repo))]
    (js/console.log "[DEBUG save-image-asset!]"
                    (pr-str {:file-name file-name :checksum (subs (str checksum) 0 16)
                             :existing? (some? existing-asset)
                             :existing-uuid (when existing-asset (str (:block/uuid existing-asset)))}))
    (if existing-asset
      ;; Reuse existing asset — skip file write and block creation
      existing-asset
      (p/let [[repo-dir asset-dir-rpath] (assets-handler/ensure-assets-dir! repo)
              size (.-size file)
              ext (db-asset/asset-path->type file-name)
              asset-class (db/entity :logseq.class/Asset)
              block-id (ldb/new-block-id)]
        (js/console.log "[DEBUG save-image-asset!] creating"
                        (pr-str {:block-id block-id :ext ext :size size
                                 :repo-dir repo-dir :asset-dir asset-dir-rpath
                                 :write-path (str asset-dir-rpath "/" block-id "." ext)}))
        (when (and ext asset-class)
          ;; Write file to disk
          (p/let [_ (let [file-path (str block-id "." ext)
                          file-rpath (str asset-dir-rpath "/" file-path)]
                      (js/console.log "[DEBUG save-image-asset!] writing file" file-rpath)
                      (write-asset-file! repo repo-dir file file-rpath))
                  _ (js/console.log "[DEBUG save-image-asset!] file written OK, creating block...")
                  ;; Create block using api-insert-new-block! (same approach as tag tables)
                  block (editor-handler/api-insert-new-block!
                         file-name-without-ext
                         {:page (:block/uuid asset-class)
                          :custom-uuid block-id
                          :properties {:block/tags (:db/id asset-class)
                                       :logseq.property.asset/type ext
                                       :logseq.property.asset/checksum checksum
                                       :logseq.property.asset/size size}
                          :edit-block? false})]
            (let [entity (db/entity [:block/uuid (:block/uuid block)])]
              (js/console.log "[DEBUG save-image-asset!] done"
                              (pr-str {:block-uuid (str (:block/uuid block))
                                       :entity-found? (some? entity)
                                       :entity-type (:logseq.property.asset/type entity)}))
              entity)))))))

(defn <save-url-asset!
  "Download image from URL and save as asset. Returns promise with asset entity."
  [repo url asset-name]
  (p/let [{:keys [data content-type size]} (<download-url-asset url)]
    ;; Validate content-type
    (when-not (valid-image-content-type? content-type)
      (throw (ex-info "Not an image" {:content-type content-type})))
    ;; Validate size
    (when (> size max-url-asset-size)
      (throw (ex-info "File too large" {:size size :max max-url-asset-size})))
    ;; Create a File object from the ArrayBuffer
    (let [ext (or (content-type->extension content-type) "png")
          filename (str asset-name "." ext)
          blob (js/Blob. #js [data] #js {:type content-type})
          file (js/File. #js [blob] filename #js {:type content-type})]
      ;; Delegate to existing save function
      (save-image-asset! repo file))))

;; ============================================================================
;; Web Image Search (Wikipedia Commons)
;; ============================================================================

(def ^:private web-image-skip-confirm-key "ls-web-image-skip-confirm")

(defn- get-web-image-skip-confirm
  "Get user preference for skipping web image confirmation"
  []
  (boolean (storage/get web-image-skip-confirm-key)))

(defn- set-web-image-skip-confirm!
  "Set user preference for skipping web image confirmation"
  [skip?]
  (storage/set web-image-skip-confirm-key skip?))

(defn- license->description
  "Convert license code to human-readable description"
  [license]
  (when license
    (let [license-lower (string/lower-case license)]
      (cond
        (or (string/includes? license-lower "public domain")
            (string/includes? license-lower "cc0")
            (string/includes? license-lower "pd"))
        "Free for any use"

        (or (string/includes? license-lower "cc by-nc")
            (string/includes? license-lower "cc-by-nc"))
        "Personal use only"

        (or (string/includes? license-lower "cc by")
            (string/includes? license-lower "cc-by")
            (string/includes? license-lower "gfdl"))
        "Free for commercial use"

        :else
        "Check license terms"))))

(defn- <search-wikipedia-image
  "Fetch the main/best image for a Wikipedia article via PageImages API.
   Returns a promise with image data or nil if not found."
  [query]
  (p/create
   (fn [resolve _reject]
     (let [url (str "https://en.wikipedia.org/w/api.php?"
                    "action=query"
                    "&titles=" (js/encodeURIComponent query)
                    "&prop=pageimages"
                    "&piprop=thumbnail|original"
                    "&pithumbsize=200"
                    "&format=json"
                    "&origin=*")]
       (-> (js/fetch url #js {:method "GET"
                              :mode "cors"
                              :credentials "omit"})
           (.then (fn [^js response]
                    (if (.-ok response)
                      (.json response)
                      (resolve nil))))
           (.then (fn [data]
                    (when data
                      (let [pages (some-> data
                                          (gobj/getValueByKeys "query" "pages")
                                          js->clj)
                            page (first (vals pages))]
                        (if-let [original (get page "original")]
                          (resolve {:url (get original "source")
                                    :thumb-url (get-in page ["thumbnail" "source"])
                                    :title query
                                    :source :wikipedia
                                    :license nil ; PageImages doesn't return license
                                    :license-desc nil})
                          (resolve nil))))))
           (.catch (fn [_err]
                     (resolve nil))))))))

(defn- <search-commons-images
  "Search Wikimedia Commons for images matching query.
   Returns a promise with vector of image data."
  [query limit]
  (p/create
   (fn [resolve _reject]
     (let [url (str "https://commons.wikimedia.org/w/api.php?"
                    "action=query"
                    "&generator=search"
                    "&gsrnamespace=6"
                    "&gsrsearch=" (js/encodeURIComponent query)
                    "&gsrlimit=" limit
                    "&prop=imageinfo"
                    "&iiprop=url|extmetadata"
                    "&iiextmetadatafilter=LicenseShortName"
                    "&iiurlwidth=200"
                    "&format=json"
                    "&origin=*")]
       (-> (js/fetch url #js {:method "GET"
                              :mode "cors"
                              :credentials "omit"})
           (.then (fn [^js response]
                    (if (.-ok response)
                      (.json response)
                      (resolve []))))
           (.then (fn [data]
                    (when data
                      (let [pages (some-> data
                                          (gobj/getValueByKeys "query" "pages")
                                          js->clj
                                          vals)]
                        (resolve
                         (->> pages
                              (map (fn [page]
                                     (let [imageinfo (first (get page "imageinfo"))
                                           license (get-in imageinfo ["extmetadata" "LicenseShortName" "value"])
                                           title (-> (get page "title" "")
                                                     (string/replace #"^File:" "")
                                                     (string/replace #"\.[^.]+$" ""))]
                                       {:url (get imageinfo "url")
                                        :thumb-url (get imageinfo "thumburl")
                                        :title title
                                        :source :wikipedia-commons
                                        :license license
                                        :license-desc (license->description license)})))
                              (filter :url)
                              vec))))))
           (.catch (fn [_err]
                     (resolve []))))))))

(defn- <search-web-images
  "Combined web image search. Returns up to 5 images from Wikipedia + Commons.
   Wikipedia PageImages result is prioritized (slot 1), Commons fills remaining."
  [query]
  (when-not (string/blank? query)
    (p/let [;; Fire both requests in parallel
            [wiki-image commons-images] (p/all [(<search-wikipedia-image query)
                                                (<search-commons-images query 5)])]
      ;; Combine results: Wikipedia first, then Commons (deduplicated)
      (let [wiki-url (:url wiki-image)
            ;; Filter out Commons images that match the Wikipedia image
            filtered-commons (if wiki-url
                               (remove #(= (:url %) wiki-url) commons-images)
                               commons-images)
            ;; Combine and take up to 5
            combined (if wiki-image
                       (cons wiki-image filtered-commons)
                       filtered-commons)]
        (vec (take 5 combined))))))

(defn- search-emojis
  [q]
  (p/let [result (.search SearchIndex q)]
    (->> (bean/->clj result)
         (map (fn [emoji]
                {:type :emoji
                 :id (:id emoji)
                 :label (or (:name emoji) (:id emoji))
                 :data {:value (:id emoji)}})))))

(defonce *tabler-icons (atom nil))
(defn- get-tabler-icons
  []
  (if @*tabler-icons
    @*tabler-icons
    (let [result (->> (keys (bean/->clj js/tablerIcons))
                      (map (fn [k]
                             (-> (string/replace (csk/->Camel_Snake_Case (name k)) "_" " ")
                                 (string/replace-first "Icon " ""))))
                   ;; FIXME: somehow those icons don't work
                      (remove #{"Ab" "Ab 2" "Ab Off"}))]
      (reset! *tabler-icons result)
      result)))

(defn- search-tabler-icons
  [q]
  (->> (search/fuzzy-search (get-tabler-icons) q :limit 100)
       (map (fn [icon-name]
              {:type :icon
               :id (str "icon-" icon-name)
               :label icon-name
               :data {:value icon-name}}))))

(defn- search
  [q tab]
  (p/let [icons (when (not= tab :emoji) (search-tabler-icons q))
          emojis' (when (not= tab :icon) (search-emojis q))]
    {:icons icons
     :emojis emojis'}))

(rum/defc icons-row
  [items]
  [:div.its.icons-row items])

(rum/defc icon-cp < rum/static
  [icon-item {:keys [on-chosen hover highlighted-id ghost-highlighted-id]}]
  (let [icon-id (get-in icon-item [:data :value])
        icon-name (or (:label icon-item) icon-id)
        color (get-in icon-item [:data :color])
        icon-id' (when icon-id (cond-> icon-id (string? icon-id) (string/replace " " "")))
        my-id (:id icon-item)]
    [:button.w-9.h-9.transition-opacity
     (when icon-id'
       {:key icon-id'
        :tabIndex "-1"
        :data-item-id my-id
        :class (cond
                 (= my-id highlighted-id) "is-highlighted"
                 (= my-id ghost-highlighted-id) "is-ghost-highlighted")
        :title icon-name
        :on-click (fn [e]
                    (on-chosen e (cond-> {:type :tabler-icon
                                          :id icon-id'
                                          :value icon-id'}
                                   color (assoc :color color))))
        :on-mouse-over #(some-> hover
                                (reset! (cond-> {:type :tabler-icon
                                                 :id icon-id'
                                                 :value icon-id'}
                                          color (assoc :color color))))
        :on-mouse-out #()})
     (when icon-id'
       (ui/icon icon-id' {:size 24}))]))

(rum/defc emoji-cp < rum/static
  [icon-item {:keys [on-chosen hover highlighted-id ghost-highlighted-id]}]
  (let [emoji-id (get-in icon-item [:data :value])
        emoji-name (or (:label icon-item) emoji-id)
        my-id (:id icon-item)]
    [:button.text-2xl.w-9.h-9.transition-opacity
     (cond->
      {:tabIndex "-1"
       :data-item-id my-id
       :class (cond
                (= my-id highlighted-id) "is-highlighted"
                (= my-id ghost-highlighted-id) "is-ghost-highlighted")
       :title emoji-name
       :on-click (fn [e]
                   (on-chosen e {:type :emoji
                                 :id emoji-id
                                 :name emoji-name}))}
       (not (nil? hover))
       (assoc :on-mouse-over #(reset! hover {:type :emoji
                                             :id emoji-id
                                             :name emoji-name})
              :on-mouse-out #()))
     [:em-emoji {:id emoji-id
                 :style {:line-height 1}}]]))

(rum/defc text-cp < rum/static
  [icon-item {:keys [on-chosen hover highlighted-id ghost-highlighted-id]}]
  (let [text-value (get-in icon-item [:data :value])
        text-color (get-in icon-item [:data :color])
        my-id (:id icon-item)
        display-text (if (> (count text-value) 8)
                       (subs text-value 0 8)
                       text-value)]
    [:button.w-9.h-9.transition-opacity.text-sm.font-medium
     (cond->
      {:tabIndex "-1"
       :data-item-id my-id
       :class (cond
                (= my-id highlighted-id) "is-highlighted"
                (= my-id ghost-highlighted-id) "is-ghost-highlighted")
       :title text-value
       :on-click (fn [e]
                   (on-chosen e {:type :text
                                 :data (cond-> {:value text-value}
                                         text-color (assoc :color text-color))}))}
       (not (nil? hover))
       (assoc :on-mouse-over #(reset! hover {:type :text
                                             :data (cond-> {:value text-value}
                                                     text-color (assoc :color text-color))})
              :on-mouse-out #()))
     display-text]))

(rum/defc avatar-cp < rum/static
  [icon-item {:keys [on-chosen hover highlighted-id ghost-highlighted-id]}]
  (let [avatar-value (get-in icon-item [:data :value])
        backgroundColor (or (get-in icon-item [:data :backgroundColor])
                            (colors/variable :gray :09))
        color (or (get-in icon-item [:data :color])
                  (colors/variable :gray :09))
        my-id (:id icon-item)
        display-text (subs avatar-value 0 (min 3 (count avatar-value)))
        bg-color-rgba (convert-bg-color-to-rgba backgroundColor)]
    [:button.w-9.h-9.transition-opacity.flex.items-center.justify-center
     (cond->
      {:tabIndex "-1"
       :data-item-id my-id
       :title avatar-value
       :class (str "p-0 border-0 bg-transparent cursor-pointer"
                   (cond
                     (= my-id highlighted-id) " is-highlighted"
                     (= my-id ghost-highlighted-id) " is-ghost-highlighted"))
       :on-click (fn [e]
                   (on-chosen e {:type :avatar
                                 :data {:value avatar-value
                                        :backgroundColor backgroundColor
                                        :color color}}))}
       (not (nil? hover))
       (assoc :on-mouse-over #(reset! hover {:type :avatar
                                             :data {:value avatar-value
                                                    :backgroundColor backgroundColor
                                                    :color color}})
              :on-mouse-out #()))
     (shui/avatar
      {:class "w-7 h-7"}
      (shui/avatar-fallback
       {:style {:background-color bg-color-rgba
                :font-size "12px"
                :font-weight "500"
                :color color}}
       display-text))]))

(defn render-item
  "Render an icon-item based on its type"
  [icon-item opts]
  (case (:type icon-item)
    :emoji (emoji-cp icon-item opts)
    :icon (icon-cp icon-item opts)
    :text (text-cp icon-item opts)
    :avatar (avatar-cp icon-item opts)
    nil))

(defn item-render
  [item opts]
  (if (map? item)
    (render-item item opts)
    ;; Legacy support: handle raw strings/old formats
    (let [normalized (normalize-icon item)]
      (if normalized
        (render-item normalized opts)
        nil))))

;; Shared state for section expansion (persists during session)
(defonce *section-states (atom {}))

(rum/defc section-header
  [{:keys [title count total-count expanded? keyboard-hint on-toggle focus-region simple?]}]
  [:div.section-header.text-xs.py-1.5.px-3.flex.justify-between.items-center.gap-2.bg-gray-02.h-8
   {:style {:color "var(--lx-gray-11)"}}
   ;; Left: Title · total-count · Chevron (chevron and count hidden in simple mode)
   [:div.flex.items-center.gap-1.select-none
    (when-not simple? {:class "cursor-pointer"
                       :on-click on-toggle})
    [:span.font-bold title]
    (when (or total-count count)
      [:<>
       [:span "·"]
       [:span {:style {:font-size "0.7rem"}}
        (or total-count count)]])
    (when-not simple?
      (ui/icon (if expanded? "chevron-down" "chevron-right") {:size 14}))]

   [:div.flex-1] ; Spacer

   ;; Right: Hide/Show with keyboard shortcut (visible when navigating grid or tabs, hidden when typing in search)
   (when keyboard-hint
     (let [show-hint? (contains? #{:grid :tabs} focus-region)]
       [:div.flex.gap-1.items-center.text-xs.opacity-50.transition-all.duration-200
        {:class (when-not show-hint? "!opacity-0")
         :style {:pointer-events (if show-hint? "auto" "none")}}
        (if expanded? "Hide" "Show")
        (shui/shortcut keyboard-hint {:style :compact})]))])

(rum/defc pane-section
  [label icon-items & {:keys [collapsible? keyboard-hint total-count searching? virtual-list? render-item-fn expanded? focus-region show-header? *virtuoso-ref]
                       :or {virtual-list? true collapsible? false expanded? true show-header? true}
                       :as opts}]
  (let [*el-ref (rum/use-ref nil)
        render-fn (or render-item-fn render-item)
        toggle-fn (when collapsible?
                    #(swap! *section-states update label (fn [v] (if (nil? v) false (not v)))))]
    [:div.pane-section
     {:ref *el-ref
      :class (util/classnames
              [{:has-virtual-list virtual-list?
                :searching-result searching?}])}
     ;; Section header: collapsible with chevron + shortcut, or simple label-only
     (when show-header?
       (section-header {:title label
                        :count (count icon-items)
                        :total-count total-count
                        :expanded? expanded?
                        :keyboard-hint keyboard-hint
                        :on-toggle toggle-fn
                        :focus-region focus-region
                        :simple? (not collapsible?)}))

     ;; Content - only render if expanded or not collapsible
     (when (or (not collapsible?) expanded?)
       (if virtual-list?
         (let [total (count icon-items)
               step 9
               rows (quot total step)
               mods (mod total step)
               rows (if (zero? mods) rows (inc rows))
               items (vec icon-items)]
           (ui/virtualized-list
            (cond-> {:total-count rows
                     :ref (fn [^js el]
                            (when *virtuoso-ref
                              (reset! *virtuoso-ref el)))
                     :item-content (fn [idx]
                                     (icons-row
                                      (let [last? (= (dec rows) idx)
                                            start (* idx step)
                                            end (* (inc idx) (if (and last? (not (zero? mods))) mods step))
                                            icons (try (subvec items start end)
                                                       (catch js/Error e
                                                         (js/console.error e)
                                                         nil))]
                                        (mapv #(render-fn % opts) icons))))}

              searching?
              (assoc :custom-scroll-parent (some-> (rum/deref *el-ref) (.closest ".bd-scroll"))))))
         [:div.its
          (map #(render-fn % opts) icon-items)]))]))

(rum/defc emojis-cp < rum/static
  [emojis* opts]
  (let [icon-items (map (fn [emoji]
                          {:type :emoji
                           :id (:id emoji)
                           :label (or (:name emoji) (:id emoji))
                           :data {:value (:id emoji)}})
                        emojis*)]
    (pane-section
     "Emojis"
     icon-items
     :show-header? false
     :on-chosen (:on-chosen opts)
     :on-hover (:on-hover opts)
     :*virtuoso-ref (:*virtuoso-ref opts))))

(rum/defc icons-cp < rum/static
  [icons opts]
  (let [icon-items (map (fn [icon-name]
                          {:type :icon
                           :id (str "icon-" icon-name)
                           :label icon-name
                           :data {:value icon-name}})
                        icons)]
    (pane-section
     "Icons"
     icon-items
     :show-header? false
     :on-chosen (:on-chosen opts)
     :on-hover (:on-hover opts)
     :*virtuoso-ref (:*virtuoso-ref opts))))

;; ============================================================================
;; Recently Used Assets
;; ============================================================================

(defn get-used-assets
  "Get list of recently used asset UUIDs from storage"
  []
  (or (storage/get :ui/ls-assets-used) []))

(defn add-used-asset!
  "Add an asset UUID to the recently used list (max 10 items)"
  [asset-uuid]
  (when asset-uuid
    (let [uuid-str (str asset-uuid)
          current (get-used-assets)
          ;; Remove if already exists, then add to front
          filtered (remove #(= % uuid-str) current)
          updated (take 10 (cons uuid-str filtered))]
      (storage/set :ui/ls-assets-used updated))))

;; ============================================================================
;; Recently Used Icons
;; ============================================================================

(defn get-used-items
  []
  (let [v2-items (storage/get :ui/ls-icons-used-v2)]
    (if (seq v2-items)
      v2-items
      ;; Migrate from legacy format
      (let [legacy-items (storage/get :ui/ls-icons-used)]
        (if (seq legacy-items)
          (let [normalized (map normalize-icon legacy-items)]
            (storage/set :ui/ls-icons-used-v2 normalized)
            normalized)
          [])))))

(defn add-used-item!
  [m]
  (let [normalized (normalize-icon m)
        new-type (:type normalized)
        ;; For text and avatar icons, remove all previous instances of that type
        ;; For other icons, only remove exact duplicates
        should-keep? (fn [item]
                       (if (#{:text :avatar} new-type)
                         ;; Remove any existing text/avatar icons
                         (not= (:type item) new-type)
                         ;; Remove exact duplicates for other types
                         (not= normalized item)))
        s (some->> (or (get-used-items) [])
                   (take 24)
                   (filter should-keep?)
                   (cons normalized))]
    (storage/set :ui/ls-icons-used-v2 s)))

(defn derive-initials
  "Derive initials from a page title (max 8 chars)"
  [title]
  (when title
    (let [words (string/split (string/trim title) #"\s+")
          initials (if (> (count words) 1)
                     ;; Take first letter of first two words
                     (str (subs (first words) 0 1)
                          (subs (second words) 0 1))
                     ;; Single word: take first 2 chars
                     (subs (first words) 0 (min 2 (count (first words)))))]
      (subs initials 0 (min 8 (count initials))))))

(defn derive-avatar-initials
  "Derive initials from a page title (max 2-3 chars for avatars, always uppercase)"
  [title]
  (when title
    (let [words (string/split (string/trim title) #"\s+")
          initials (if (> (count words) 1)
                     ;; Take first letter of first two words
                     (str (string/upper-case (subs (first words) 0 1))
                          (string/upper-case (subs (second words) 0 1)))
                     ;; Single word: take first 2 chars and uppercase them
                     (let [word (first words)
                           char-count (min 2 (count word))]
                       (string/upper-case (subs word 0 char-count))))]
      (subs initials 0 (min 3 (count initials))))))

(def ^:private abbreviated-stop-words
  #{"the" "a" "an" "of" "to" "in" "for" "and" "or" "on" "at" "by"
    "from" "with" "about" "into" "how" "what" "my" "your" "this" "that"})

(defn- normalize-word-boundaries
  "Pre-process title to split camelCase, snake_case, and kebab-case into spaces."
  [title]
  (-> title
      (string/replace #"\s*\([^)]*\)\s*" " ")
      (string/replace #"([a-z])([A-Z])" "$1 $2")
      (string/replace "_" " ")
      (string/replace #"(\w)-(\w)" "$1 $2")
      string/trim
      (string/replace #"\s+" " ")))

(defn derive-abbreviated
  "Derive abbreviated form from page title (max 8 chars).
   Returns nil if result equals derive-initials output (to avoid duplicates).
   Examples: 'Software Engineer' -> 'Soft Eng', 'Math 203' -> 'Math 203'"
  [title]
  (when title
    (let [normalized (normalize-word-boundaries (string/trim title))
          max-len 8]
      (when-not (string/blank? normalized)
        (if (<= (count normalized) max-len)
          (let [initials (derive-initials title)]
            (when (not= normalized initials)
              normalized))
          (let [words (string/split normalized #"\s+")]
            (if (<= (count words) 1)
              (let [result (subs (first words) 0 (min max-len (count (first words))))
                    initials (derive-initials title)]
                (when (not= result initials)
                  result))
              (let [significant (if (>= (count words) 3)
                                  (let [filtered (remove #(contains? abbreviated-stop-words
                                                                     (string/lower-case %))
                                                         words)]
                                    (if (>= (count filtered) 2)
                                      (vec filtered)
                                      (vec words)))
                                  (vec words))
                    w1 (first significant)
                    w2 (second significant)
                    joined (str w1 " " w2)
                    text-budget (dec max-len)
                    result (if (<= (count joined) max-len)
                             joined
                             (cond
                               (<= (count w1) 3)
                               (str w1 " " (subs w2 0 (min (count w2)
                                                           (- text-budget (count w1)))))
                               (<= (count w2) 3)
                               (str (subs w1 0 (min (count w1)
                                                    (- text-budget (count w2))))
                                    " " w2)
                               :else
                               (let [half (js/Math.ceil (/ text-budget 2))
                                     len1 (min (count w1) half)
                                     len2 (min (count w2) (- text-budget len1))]
                                 (str (subs w1 0 len1) " " (subs w2 0 len2)))))
                    initials (derive-initials title)]
                (when (not= result initials)
                  result)))))))))

(rum/defc text-tab-cp
  [*q page-title *color opts]
  (let [query @*q
        text-value (if (string/blank? query)
                     ;; Use page-title or fallback to current page
                     (let [title (or page-title
                                     (some-> (state/get-current-page)
                                             (db/get-page)
                                             (:block/title)))]
                       (derive-initials title))
                     ;; Use query (max 8 chars)
                     (subs query 0 (min 8 (count query))))
        ;; Include selected color if available
        selected-color (when-not (string/blank? @*color) @*color)
        icon-item (when text-value
                    {:type :text
                     :id (str "text-" text-value)
                     :label text-value
                     :data (cond-> {:value text-value}
                             selected-color (assoc :color selected-color))})]
    (if icon-item
      (pane-section "Text" [icon-item] (assoc opts :virtual-list? false))
      [:div.pane-section.px-2.py-4
       [:div.text-sm.text-gray-07.dark:opacity-80
        "Enter text or use page initials"]])))

(rum/defc avatar-tab-cp
  [*q page-title *color opts]
  (let [query @*q
        avatar-value (if (string/blank? query)
                       ;; Use page-title or fallback to current page
                       (let [title (or page-title
                                       (some-> (state/get-current-page)
                                               (db/get-page)
                                               (:block/title)))]
                         (derive-avatar-initials title))
                       ;; Use query (max 2-3 chars)
                       (subs query 0 (min 3 (count query))))
        ;; Use selected color if available, otherwise default to gray
        selected-color (when-not (string/blank? @*color) @*color)
        backgroundColor (or selected-color (colors/variable :gray :09))
        color (or selected-color (colors/variable :gray :09))
        icon-item (when avatar-value
                    {:type :avatar
                     :id (str "avatar-" avatar-value)
                     :label avatar-value
                     :data {:value avatar-value
                            :backgroundColor backgroundColor
                            :color color}})]
    (if icon-item
      (pane-section "Avatar" [icon-item] (assoc opts :virtual-list? false))
      [:div.pane-section.px-2.py-4
       [:div.text-sm.text-gray-07.dark:opacity-80
        "Enter initials or use page initials"]])))

(rum/defc custom-tab-cp
  "Combined tab showing Text, Avatar, and Image options side by side"
  [*q page-title *color *view icon-value opts]
  (let [query @*q
        ;; Text item
        text-value (if (string/blank? query)
                     (let [title (or page-title
                                     (some-> (state/get-current-page)
                                             (db/get-page)
                                             (:block/title)))]
                       (derive-initials title))
                     (subs query 0 (min 8 (count query))))
        selected-color (when-not (string/blank? @*color) @*color)
        text-item (when text-value
                    {:type :text
                     :id (str "text-" text-value)
                     :label text-value
                     :data (cond-> {:value text-value}
                             selected-color (assoc :color selected-color))})
        ;; Avatar item
        avatar-value (if (string/blank? query)
                       (let [title (or page-title
                                       (some-> (state/get-current-page)
                                               (db/get-page)
                                               (:block/title)))]
                         (derive-avatar-initials title))
                       (subs query 0 (min 3 (count query))))
        backgroundColor (or selected-color (colors/variable :gray :09))
        color (or selected-color (colors/variable :gray :09))
        avatar-item (when avatar-value
                      {:type :avatar
                       :id (str "avatar-" avatar-value)
                       :label avatar-value
                       :data {:value avatar-value
                              :backgroundColor backgroundColor
                              :color color}})
        on-chosen (:on-chosen opts)]
    [:div.custom-tab-content
     ;; Text option
     (when text-item
       [:button.custom-tab-item
        {:on-click #(reset! *view :text-picker)}
        [:div.custom-tab-item-preview
         (icon text-item {:size 24})]
        [:span.custom-tab-item-label "Text"]])

     ;; Avatar option
     (when avatar-item
       [:button.custom-tab-item
        {:on-click #(on-chosen % avatar-item)}
        [:div.custom-tab-item-preview
         (icon avatar-item {:size 24})]
        [:span.custom-tab-item-label "Avatar"]])

     ;; Image option — always show dashed placeholder with camera icon
     [:button.custom-tab-item
      {:on-click #(reset! *view :asset-picker)}
      [:div.custom-tab-item-preview
       [:span.image-tile-placeholder
        {:style {:width 28
                 :height 28
                 :border "1px dashed var(--rx-gray-08)"
                 :border-radius "3px"
                 :display "flex"
                 :align-items "center"
                 :justify-content "center"
                 :background "var(--rx-gray-03-alpha)"}}
        (shui/tabler-icon "photo" {:size 16 :style {:color "var(--lx-gray-11)"}})]]
      [:span.custom-tab-item-label "Image"]]]))

;; <load-asset-url! is defined near the top of the file (unified loader with retry + extension guessing)

(rum/defcs image-asset-item < rum/reactive
  (rum/local nil ::url)
  (rum/local false ::error)
  {:did-mount (fn [state]
                (let [[asset _opts] (:rum/args state)
                      *url (::url state)
                      *error (::error state)
                      asset-type (:logseq.property.asset/type asset)
                      asset-uuid (:block/uuid asset)]
                  (js/console.log "[DEBUG image-asset-item mount]"
                                  (pr-str {:uuid asset-uuid :type asset-type
                                           :title (:block/title asset)
                                           :has-uuid? (some? asset-uuid)
                                           :has-type? (some? asset-type)}))
                  (if (and asset-uuid asset-type)
                    (<load-asset-url! *url *error asset-uuid asset-type {})
                    (js/console.warn "[DEBUG image-asset-item mount] SKIPPED — missing uuid or type"
                                     (pr-str {:uuid asset-uuid :type asset-type}))))
                state)}
  "Renders a single image asset thumbnail in the asset picker grid.
   When avatar-context is provided, renders circular previews and returns avatar data.
   Returns nil if asset file doesn't exist (ghost asset)."
  [state asset {:keys [on-chosen avatar-context selected?]}]
  (let [url @(::url state)
        error? @(::error state)
        asset-type (:logseq.property.asset/type asset)
        asset-uuid (:block/uuid asset)
        asset-title (or (:block/title asset) (str asset-uuid))
        avatar-mode? (some? avatar-context)]
    [:button.image-asset-item
     {:title asset-title
      :class (util/classnames [{:avatar-mode avatar-mode?
                                :selected selected?
                                :ghost-asset error?}])
      :on-click (fn [e]
                  (if error?
                    ;; Click-to-retry on ghost assets
                    (do (reset! (::error state) false)
                        (<load-asset-url! (::url state) (::error state) asset-uuid asset-type {}))
                    (do
                      ;; Track as recently used
                      (add-used-asset! asset-uuid)
                      (let [image-data {:asset-uuid (str asset-uuid)
                                        :asset-type asset-type}]
                        (on-chosen e
                                   (if avatar-context
                                     ;; Merge image into existing avatar
                                     {:type :avatar
                                      :id (:id avatar-context)
                                      :label (:label avatar-context)
                                      :data (merge (:data avatar-context) image-data)}
                                     ;; Standard image selection
                                     {:type :image
                                      :id (str "image-" asset-uuid)
                                      :label asset-title
                                      :data image-data}))))))
      :disabled false}
     (cond
       error?
       [:div.ghost-asset-placeholder
        {:title "Click to retry loading"}
        (ui/icon "refresh" {:size 16})]
       url
       [:img {:src url
              :loading "lazy"
              :on-error (fn [_e]
                          ;; Blob URL became invalid — mark as error so user can retry
                          (reset! (::url state) nil)
                          (reset! (::error state) true))}]
       :else
       [:div.bg-gray-04.animate-pulse])]))

(rum/defc web-image-item
  "Renders a single web image thumbnail with external indicator and tooltip.
   Shows license description on hover (simplified for glanceability)."
  [{:keys [url thumb-url title license license-desc source] :as web-image}
   {:keys [on-click avatar-mode?]}]
  (let [display-url (or thumb-url url)]
    (shui/tooltip-provider
     {:delay-duration 300}
     (shui/tooltip
      (shui/tooltip-trigger
       {:as-child true}
       [:button.web-image-item
        {:class (util/classnames [{:avatar-mode avatar-mode?}])
         :on-click (fn [e] (on-click e web-image))}
        (if display-url
          [:img {:src display-url :loading "lazy"}]
          [:div.bg-gray-04.animate-pulse])
        ;; External indicator badge
        [:div.external-badge
         (shui/tabler-icon "world" {:size 10})]])
      (shui/tooltip-content
       {:side "top" :align "center" :class "web-image-tooltip-content"
        :show-arrow true :arrow-class-name "web-image-tooltip-arrow"}
       [:div.web-image-tooltip {:style {:text-align "center"}}
        [:div.font-medium (or title "Web image")]
        ;; Show license description only (more glanceable than code)
        (when license-desc
          [:div.text-xs {:style {:color "var(--lx-gray-11)"}} license-desc])])))))

(defn- should-use-blur-bg?
  "Determine if blurred background should be used based on image format.
   SVGs and potentially transparent formats should not use blur."
  [url]
  (let [url-lower (when url (string/lower-case url))
        ;; SVG detection
        is-svg? (and url-lower (string/ends-with? url-lower ".svg"))
        ;; Formats that commonly have transparency (conservative approach)
        likely-transparent? (or (and url-lower (string/ends-with? url-lower ".png"))
                                (and url-lower (string/ends-with? url-lower ".gif"))
                                (and url-lower (string/ends-with? url-lower ".webp")))]
    ;; Use blur only for opaque formats (JPEG, BMP)
    ;; Skip for SVG (uses PNG thumbnail anyway) and potentially transparent formats
    (not (or is-svg? likely-transparent?))))

(rum/defc full-image-view
  "Full image view popover - shows uncropped image with object-fit: contain"
  [{:keys [url on-close]}]
  [:div.full-image-view-pane
   [:div.image-container
    [:img {:src url}]]
   [:button.close-btn
    {:on-click on-close}
    (shui/tabler-icon "x" {:size 16})]])

(rum/defcs web-image-confirm-pane < rum/reactive
  (rum/local false ::skip-confirm)
  (rum/local false ::saving?)
  [state {:keys [web-image on-close on-save avatar-context]}]
  (let [*skip-confirm (::skip-confirm state)
        *saving? (::saving? state)
        skip-confirm? @*skip-confirm
        saving? @*saving?
        {:keys [url thumb-url title license license-desc source]} web-image
        avatar-mode? (some? avatar-context)
        ;; Build source string with optional license code
        source-text (str (case source
                           :wikipedia "From: Wikipedia"
                           :wikipedia-commons "From: Wikipedia Commons"
                           "From: Web")
                         (when license (str " · " license)))
        ;; Determine if we should use blur based on format
        display-url (or thumb-url url)
        use-blur? (should-use-blur-bg? display-url)]
    [:div.web-image-confirm-pane
     ;; Preview image with blur background layer
     [:div.preview-image
      ;; Blurred background image (only for opaque formats)
      (when use-blur?
        [:img.blur-bg {:src display-url}])
      ;; Main image with object-fit: contain
      [:img.preview-img {:src display-url
                         :alt (str title " from " (case source
                                                    :wikipedia "Wikipedia"
                                                    :wikipedia-commons "Wikipedia Commons"
                                                    "Web"))}]
      ;; Maximize button - opens full image view
      [:button.maximize-btn
       {:on-click (fn [e]
                    (.stopPropagation e)
                    (shui/popup-show!
                     (.-target e)
                     (fn [{:keys [id]}]
                       (full-image-view
                        {:url (or thumb-url url)
                         :on-close #(shui/popup-hide! id)}))
                     {:align :center
                      :side "top"
                      :content-props {:class "full-image-view-popup"
                                      :sideOffset 8}}))}
       (shui/tabler-icon "arrows-maximize" {:size 16})]]

     ;; Content wrapper - adds padding back for non-preview content
     [:div.content-wrapper
      ;; Image info
      [:div.image-info
       [:div.image-title (or title "Web image")]
       [:div.image-source {:style {:color "var(--lx-gray-11)"}} source-text]
       ;; License description badge
       (when license-desc
         [:div.license-badge license-desc])]

      ;; Skip confirmation checkbox
      [:label.skip-confirm-checkbox
       (shui/checkbox
        {:checked skip-confirm?
         :on-checked-change #(reset! *skip-confirm %)})
       [:span "Always add without asking"]]

      ;; Action buttons
      [:div.pane-footer
       (shui/button
        {:variant :outline
         :size :sm
         :on-click on-close}
        "Cancel")
       (shui/button
        {:variant :default
         :size :sm
         :disabled saving?
         :on-click (fn []
                     (reset! *saving? true)
                     ;; Save preference if checkbox was checked
                     (when skip-confirm?
                       (set-web-image-skip-confirm! true))
                     ;; Delegate saving to parent
                     (on-save web-image))}
        (if saving?
          [:span.flex.items-center.gap-1
           [:span.animate-spin (shui/tabler-icon "loader-2" {:size 14})]
           "Adding..."]
          "Add to assets"))]]]))

(rum/defcs web-images-section < rum/reactive
  (rum/local nil ::images)
  (rum/local true ::loading?)
  (rum/local nil ::current-query)
  {:did-mount (fn [state]
                (let [[{:keys [query]}] (:rum/args state)
                      *images (::images state)
                      *loading? (::loading? state)
                      *current-query (::current-query state)]
                  (when-not (string/blank? query)
                    (reset! *current-query query)
                    (reset! *loading? true)
                    (-> (<search-web-images query)
                        (p/then (fn [results]
                                  (reset! *images results)
                                  (reset! *loading? false)))
                        (p/catch (fn [_err]
                                   (reset! *images [])
                                   (reset! *loading? false))))))
                state)
   :did-update (fn [state]
                 (let [[{:keys [query]}] (:rum/args state)
                       *images (::images state)
                       *loading? (::loading? state)
                       *current-query (::current-query state)
                       current-query @*current-query]
                   ;; Only refetch if query changed
                   (when (and (not= query current-query)
                              (not (string/blank? query)))
                     (reset! *current-query query)
                     (reset! *loading? true)
                     (-> (<search-web-images query)
                         (p/then (fn [results]
                                   (reset! *images results)
                                   (reset! *loading? false)))
                         (p/catch (fn [_err]
                                    (reset! *images [])
                                    (reset! *loading? false))))))
                 state)}
  "Renders the web images section with loading states.
   query: search query (page title or user input)
   on-select: callback when user selects a web image
   avatar-context: if set, picker is in avatar mode
   on-popover-change: callback when confirmation popover opens/closes"
  [state {:keys [query on-select avatar-context on-popover-change]}]
  (let [*images (::images state)
        *loading? (::loading? state)
        images (rum/react *images)
        loading? (rum/react *loading?)
        avatar-mode? (some? avatar-context)
        skip-confirm? (get-web-image-skip-confirm)
        web-expanded? (get (rum/react *section-states) "Web images" true)]
    ;; Don't render section if no query or empty results after loading
    (when-not (and (not loading?) (empty? images) (not (string/blank? query)))
      [:div.pane-section.web-images-section
       ;; Section header with info icon
       [:div.section-header-row
        (section-header {:title "Web images"
                         :count (when-not loading? (count images))
                         :expanded? web-expanded?
                         :on-toggle #(swap! *section-states update "Web images" (fn [v] (if (nil? v) false (not v))))})
        (shui/tooltip-provider
         {:delay-duration 200}
         (shui/tooltip
          (shui/tooltip-trigger
           {:as-child true}
           [:button.info-icon
            (shui/tabler-icon "info-circle" {:size 14})])
          (shui/tooltip-content
           {:side "top" :show-arrow true}
           [:span "Images from Wikipedia Commons. Check licensing before commercial use."])))]

       ;; Image grid
       (when web-expanded?
         [:div.asset-picker-grid.web-images-row
          {:class (when avatar-mode? "avatar-mode")}
          (if loading?
            ;; Loading skeletons
            (for [i (range 5)]
              [:div.web-image-placeholder {:key (str "skeleton-" i)}
               (shui/skeleton {:class "w-full h-full rounded"})])
            ;; Actual images
            (for [web-image images]
              (rum/with-key
                (web-image-item
                 web-image
                 {:on-click (fn [e img]
                              (if skip-confirm?
                                ;; Skip confirmation, save immediately
                                (on-select e img true)
                                ;; Show confirmation popover
                                (do
                                  (when on-popover-change (on-popover-change true))
                                  (shui/popup-show!
                                   (.-target e)
                                   (fn [{:keys [id]}]
                                     (web-image-confirm-pane
                                      {:web-image img
                                       :avatar-context avatar-context
                                       :on-close (fn []
                                                   (when on-popover-change (on-popover-change false))
                                                   (shui/popup-hide! id))
                                       :on-save (fn [confirmed-img]
                                                  (when on-popover-change (on-popover-change false))
                                                  (shui/popup-hide! id)
                                                  (on-select e confirmed-img false))}))
                                   {:align :center
                                    :side "top"
                                    :content-props {:class "web-image-confirm-popup"
                                                    :sideOffset 8}
                                    :on-after-hide (fn []
                                                     (when on-popover-change (on-popover-change false)))}))))
                  :avatar-mode? avatar-mode?})
                (str "web-" (:url web-image)))))])])))

;; ============================================================================
;; URL Asset Pane (Popover content for "Add asset via URL")
;; ============================================================================

(rum/defcs url-asset-pane < rum/reactive
  (rum/local "" ::url)
  (rum/local "" ::name)
  (rum/local nil ::error)
  (rum/local false ::loading?)
  (rum/local nil ::validated?)
  [state {:keys [on-close on-asset-added]}]
  (let [*url (::url state)
        *name (::name state)
        *error (::error state)
        *loading? (::loading? state)
        *validated? (::validated? state)
        url @*url
        asset-name @*name
        error @*error
        loading? @*loading?
        validated? @*validated?
        url-valid? (valid-url? url)
        can-save? (and url-valid?
                       (not (string/blank? asset-name))
                       (not loading?))

        ;; Validate URL on blur
        validate-url!
        (fn []
          (when (valid-url? url)
            (reset! *loading? true)
            (reset! *error nil)
            (-> (<validate-url-asset url)
                (p/then (fn [{:keys [content-type size]}]
                          (cond
                            (not (valid-image-content-type? content-type))
                            (reset! *error "URL does not point to a supported image format")

                            (and size (> size max-url-asset-size))
                            (reset! *error (str "Image exceeds " (/ max-url-asset-size 1024 1024) "MB size limit"))

                            :else
                            (do
                              (reset! *validated? true)
                              ;; Auto-extract filename if empty
                              (when (string/blank? @*name)
                                (reset! *name (extract-filename-from-url url)))))))
                (p/catch (fn [err]
                           (let [msg (or (ex-message err) "Failed to validate URL")]
                             (if (string/includes? msg "Network")
                               (reset! *error "This website doesn't allow direct downloads. Try using a direct image URL (e.g., ending in .png or .jpg)")
                               (reset! *error msg)))))
                (p/finally #(reset! *loading? false)))))

        ;; Save handler
        handle-save!
        (fn []
          (reset! *loading? true)
          (reset! *error nil)
          (let [repo (state/get-current-repo)]
            (-> (<save-url-asset! repo url asset-name)
                (p/then (fn [asset-entity]
                          (when asset-entity
                            (on-asset-added asset-entity))
                          (on-close)))
                (p/catch (fn [err]
                           (let [msg (ex-message err)]
                             (cond
                               (string/includes? (str msg) "Not an image")
                               (reset! *error "URL does not point to a valid image")

                               (string/includes? (str msg) "too large")
                               (reset! *error "Image exceeds 10MB size limit")

                               (string/includes? (str msg) "Network")
                               (do
                                 (reset! *error nil)
                                 (shui/toast! "Download blocked. Try using a direct image URL" :error))

                               :else
                               (do
                                 (reset! *error nil)
                                 (shui/toast! (str "Failed to download: " msg) :error))))))
                (p/finally #(reset! *loading? false)))))]

    [:div.url-asset-pane
     ;; URL input
     [:div.form-group
      [:label "URL"]
      (shui/input
       {:placeholder "https://example.com/image.png"
        :value url
        :auto-focus true
        :on-change (fn [e]
                     (reset! *url (util/evalue e))
                     (reset! *validated? false)
                     (reset! *error nil))
        :on-blur validate-url!
        :on-key-down (fn [^js e]
                       (when (= 13 (.-keyCode e))
                         (validate-url!)))})]

     ;; Name input
     [:div.form-group
      [:label "Name"]
      (shui/input
       {:placeholder "image"
        :value asset-name
        :on-change #(reset! *name (util/evalue %))})]

     ;; Format note
     [:div.format-note
      "Supported: PNG, JPG, GIF, WebP, SVG, BMP"
      [:br]
      "Max size: 10MB"]

     ;; Error display
     (when error
       [:div.error-message error])

     ;; Action buttons
     [:div.pane-footer
      (shui/button
       {:variant :outline
        :size :sm
        :on-click on-close}
       "Cancel")
      (shui/button
       {:variant :default
        :size :sm
        :disabled (not can-save?)
        :on-click handle-save!}
       (if loading?
         [:span.flex.items-center.gap-1
          [:span.animate-spin (shui/tabler-icon "loader-2" {:size 14})]
          "Saving..."]
         "Save"))]]))

;; ============================================================================
;; Multi-File Upload Preview
;; ============================================================================

(rum/defc multi-file-preview
  [files on-confirm on-cancel]
  (let [image-files (filter #(contains? config/image-formats
                                        (keyword (second (string/split (.-type %) "/"))))
                            files)
        other-files (remove #(contains? config/image-formats
                                        (keyword (second (string/split (.-type %) "/"))))
                            files)]
    [:div.multi-file-preview.p-4.space-y-4
     [:h3.text-base.font-semibold
      (str "Upload " (count image-files) " image" (when (not= 1 (count image-files)) "s") "?")]

     ;; File list
     [:div.space-y-1.max-h-64.overflow-y-auto
      (for [file image-files]
        [:div.text-sm.py-1
         {:key (.-name file)}
         [:span.truncate (.-name file)]])]

     ;; Warning for skipped files
     (when (seq other-files)
       [:div.text-sm.text-yellow-09.bg-yellow-02.rounded.px-3.py-2
        (str "Will skip " (count other-files) " non-image file"
             (when (not= 1 (count other-files)) "s"))])

     ;; Action buttons
     [:div.flex.gap-2.justify-end
      (shui/button {:variant :outline :on-click on-cancel} "Cancel")
      (shui/button {:on-click on-confirm} "Upload")]]))

;; ============================================================================
;; Asset Picker
;; ============================================================================

(rum/defcs asset-picker < rum/reactive db-mixins/query
  (rum/local "" ::search-q)
  (rum/local true ::loading?) ;; Start with loading state
  (rum/local nil ::loaded-assets) ;; Cached assets loaded async
  (rum/local nil ::web-query-debounced) ;; Debounced web search query
  (rum/local false ::popover-open?) ;; Track if any popover is open
  {:did-mount (fn [state]
                ;; Track picker open state
                (reset! *asset-picker-open? true)

                ;; Fetch assets - use sync as placeholder, always fire async for completeness
                (let [*loaded-assets (::loaded-assets state)
                      *loading? (::loading? state)
                      sync-assets (get-image-assets)]
                  (js/console.log "[DEBUG asset-picker mount] sync-assets count:" (count sync-assets)
                                  "sample:" (pr-str (map #(select-keys % [:block/uuid :logseq.property.asset/type :block/title]) (take 3 sync-assets))))
                  ;; Use sync data as immediate placeholder (avoids spinner if we have partial data)
                  (when (seq sync-assets)
                    (reset! *loaded-assets sync-assets)
                    (reset! *loading? false))
                  ;; Always fire async query to ensure complete asset list
                  (-> (<get-image-assets)
                      (p/then (fn [async-assets]
                                (js/console.log "[DEBUG asset-picker mount] async-assets count:" (count async-assets)
                                                "sample:" (pr-str (map #(select-keys % [:block/uuid :logseq.property.asset/type :block/title]) (take 3 async-assets))))
                                (when @*asset-picker-open?
                                  (reset! *loaded-assets (vec async-assets))
                                  (reset! *loading? false))))
                      (p/catch (fn [err]
                                 (js/console.error "[DEBUG asset-picker mount] async query FAILED:" (str err))
                                 (when @*asset-picker-open?
                                   (reset! *loading? false))))))

                state)
   :will-unmount (fn [state]
                   ;; Track picker closed state
                   (reset! *asset-picker-open? false)

                   state)}
  [state {:keys [on-chosen on-back on-delete del-btn? current-icon avatar-context page-title]}]
  (let [*search-q (::search-q state)
        *loading? (::loading? state)
        *loaded-assets (::loaded-assets state)
        *web-query-debounced (::web-query-debounced state)
        *popover-open? (::popover-open? state)
        loading? (rum/react *loading?)
        popover-open? (rum/react *popover-open?)
        ;; Use cached assets if available, otherwise try to get them
        assets (or (rum/react *loaded-assets) [])
        search-q @*search-q
        ;; Web search query: use search input if typing, otherwise use page title
        web-query (rum/react *web-query-debounced)
        effective-web-query (if (string/blank? search-q)
                              (or page-title "")
                              (or web-query page-title ""))
        ;; Extract current image UUID from the icon (works for both :image and :avatar with image)
        current-asset-uuid (or (get-in current-icon [:data :asset-uuid])
                               (when (= :image (:type current-icon))
                                 (get-in current-icon [:data :asset-uuid])))
        ;; Find the current asset from the list
        current-asset (when current-asset-uuid
                        (some #(when (= (str (:block/uuid %)) current-asset-uuid) %)
                              assets))
        ;; Filter assets by search query
        filtered-assets (if (string/blank? search-q)
                          assets
                          (filter (fn [asset]
                                    (let [title (or (:block/title asset) "")]
                                      (string/includes?
                                       (string/lower-case title)
                                       (string/lower-case search-q))))
                                  assets))
        asset-count (count filtered-assets)
        avatar-mode? (some? avatar-context)
        ;; Debounced update of web query
        update-web-query-debounced
        (memoize
         (fn []
           (debounce
            (fn [q] (reset! *web-query-debounced q))
            500)))
        ;; SVG detection helper - checks if URL is an SVG file
        svg-url?
        (fn [url]
          (and (string? url)
               (string/ends-with? (string/lower-case url) ".svg")))

        ;; Handle web image selection (download and save)
        ;; For SVGs, prefer PNG thumbnail to avoid binary corruption issues
        handle-web-image-select
        (fn [_e web-image skip-confirm?]
          (let [repo (state/get-current-repo)
                {:keys [url thumb-url title]} web-image
                ;; Use PNG thumbnail for SVGs (avoids blob rendering issues)
                ;; Fall back to original URL for non-SVGs or if no thumbnail
                download-url (if (and (svg-url? url) thumb-url)
                               thumb-url ; PNG thumbnail for SVG
                               url) ; Original for other formats
                asset-name (or title "web-image")]
            (-> (<save-url-asset! repo download-url asset-name)
                (p/then (fn [asset-entity]
                          (when asset-entity
                            ;; Track as recently used
                            (add-used-asset! (:block/uuid asset-entity))
                            ;; Refresh asset list
                            (p/let [updated-assets (<get-image-assets)]
                              (reset! *loaded-assets (or (seq updated-assets) [])))
                            ;; Select the new asset
                            (let [image-data {:asset-uuid (str (:block/uuid asset-entity))
                                              :asset-type (:logseq.property.asset/type asset-entity)}]
                              (on-chosen nil
                                         (if avatar-context
                                           {:type :avatar
                                            :id (:id avatar-context)
                                            :label (:label avatar-context)
                                            :data (merge (:data avatar-context) image-data)}
                                           {:type :image
                                            :id (str "image-" (:block/uuid asset-entity))
                                            :label (or (:block/title asset-entity) "")
                                            :data image-data}))))))
                (p/catch (fn [err]
                           (shui/toast! (str "Failed to save image: " (ex-message err)) :error))))))
        ;; Process upload (actual upload logic extracted for reuse)
        process-upload (fn [files]
                         (let [repo (state/get-current-repo)
                               image-files (filter (fn [file]
                                                     (let [file-type (.-type file)
                                                           ext (some-> file-type
                                                                       (string/split "/")
                                                                       second
                                                                       keyword)]
                                                       (contains? config/image-formats ext)))
                                                   files)
                               rejected-files (remove (fn [file]
                                                        (let [file-type (.-type file)
                                                              ext (some-> file-type
                                                                          (string/split "/")
                                                                          second
                                                                          keyword)]
                                                          (contains? config/image-formats ext)))
                                                      files)]
                           (when (seq image-files)
                             ;; Check which files already exist (by checksum)
                             (p/let [checksums (p/all (map #(assets-handler/get-file-checksum %) image-files))
                                     existing (p/all (map #(when % (db-async/<get-asset-with-checksum repo %)) checksums))
                                     new-files (vec (keep-indexed (fn [i f] (when-not (nth existing i) f)) image-files))
                                     reused-entities (vec (remove nil? existing))]

                               ;; Update ARIA status
                               (when (seq new-files)
                                 (reset! *upload-status
                                         (str "Uploading " (count new-files) " image"
                                              (when (not= 1 (count new-files)) "s"))))

                               (p/let [new-entities (p/all (map #(save-image-asset! repo %) new-files))
                                       entities (into (vec (remove nil? new-entities)) reused-entities)]
                                 (p/let [updated-assets (<get-image-assets)]
                                   (reset! *loaded-assets (or (seq updated-assets) [])))

                                 ;; Show feedback notification
                                 (let [new-count (count (remove nil? new-entities))
                                       reused-count (count reused-entities)]
                                   (cond
                                     (and (pos? new-count) (zero? reused-count) (empty? rejected-files))
                                     (shui/toast! (str "Uploaded " new-count " image"
                                                       (when (not= 1 new-count) "s"))
                                                  :success)

                                     (and (pos? new-count) (pos? reused-count))
                                     (shui/toast! (str "Uploaded " new-count " new, "
                                                       reused-count " already existed")
                                                  :success)

                                     (and (zero? new-count) (pos? reused-count))
                                     (shui/toast! (str reused-count " image"
                                                       (when (not= 1 reused-count) "s")
                                                       " already existed")
                                                  :success)

                                     (seq rejected-files)
                                     (shui/toast! (str "Skipped " (count rejected-files)
                                                       " file" (when (not= 1 (count rejected-files)) "s")
                                                       " (not images)")
                                                  :error)

                                     :else nil))

                                 ;; Update completion status
                                 (reset! *upload-status
                                         (str "Upload complete. " (count (remove nil? new-entities)) " images added"))

                                 ;; Clear status after 3 seconds
                                 (js/setTimeout #(reset! *upload-status "") 3000)

                                 (when-let [first-asset (first entities)]
                                   (let [image-data {:asset-uuid (str (:block/uuid first-asset))
                                                     :asset-type (:logseq.property.asset/type first-asset)}]
                                     (on-chosen nil
                                                (if avatar-context
                                                  {:type :avatar
                                                   :id (:id avatar-context)
                                                   :label (:label avatar-context)
                                                   :data (merge (:data avatar-context) image-data)}
                                                  {:type :image
                                                   :id (str "image-" (:block/uuid first-asset))
                                                   :label (or (:block/title first-asset) "")
                                                   :data image-data})))))))))

        ;; Handle file upload with smart multi-file preview
        handle-upload (fn [files]
                        (let [file-count (count files)]
                          (if (> file-count 3)
                            ;; Show preview confirmation for >3 files
                            (shui/popup-show!
                             (multi-file-preview
                              files
                              #(do (shui/popup-hide!) (process-upload files))
                              #(shui/popup-hide!))
                             {:align :center
                              :content-props {:class "w-96"}})
                            ;; Auto-upload for 1-3 files
                            (process-upload files))))]
    [:div.asset-picker
     {:id "asset-picker-modal"
      :class [(when avatar-mode? "avatar-mode")
              (when (rum/react *drag-active?) "drag-active")]
      :on-drag-enter (fn [e]
                       (.preventDefault e)
                       (.stopPropagation e)
                       (swap! *drag-depth inc)
                       (when (= @*drag-depth 1)
                         (reset! *drag-active? true)
                         (when-let [bd (.querySelector (.-currentTarget e) ".bd-scroll")]
                           (set! (.. bd -style -overflowY) "hidden"))
                         (when-let [vs (.querySelector (.-currentTarget e) "[data-virtuoso-scroller]")]
                           (set! (.. vs -style -overflowY) "hidden"))))
      :on-drag-over (fn [e]
                      (.preventDefault e)
                      (.stopPropagation e))
      :on-drag-leave (fn [e]
                       (.preventDefault e)
                       (.stopPropagation e)
                       (swap! *drag-depth dec)
                       (when (<= @*drag-depth 0)
                         (reset! *drag-depth 0)
                         (reset! *drag-active? false)
                         (when-let [bd (.querySelector (.-currentTarget e) ".bd-scroll")]
                           (set! (.. bd -style -overflowY) ""))
                         (when-let [vs (.querySelector (.-currentTarget e) "[data-virtuoso-scroller]")]
                           (set! (.. vs -style -overflowY) ""))))
      :on-drop (fn [e]
                 (.preventDefault e)
                 (.stopPropagation e)
                 (reset! *drag-depth 0)
                 (reset! *drag-active? false)
                 (when-let [bd (.querySelector (.-currentTarget e) ".bd-scroll")]
                   (set! (.. bd -style -overflowY) ""))
                 (when-let [vs (.querySelector (.-currentTarget e) "[data-virtuoso-scroller]")]
                   (set! (.. vs -style -overflowY) ""))
                 (let [files (array-seq (.. e -dataTransfer -files))]
                   (handle-upload files)))}

     ;; ARIA live region for status announcements
     [:div.sr-only
      {:role "status"
       :aria-live "polite"
       :aria-atomic "true"}
      (rum/react *upload-status)]

     ;; Drag overlay hint
     (when @*drag-active?
       [:div.drag-overlay-hint
        [:div.corner.tl] [:div.corner.tr]
        [:div.corner.bl] [:div.corner.br]
        (shui/tabler-icon "upload" {:size 26})
        [:div.text-group
         [:span.title "Drop images to upload"]
         [:span.subtitle "PNG, JPG, SVG, GIF, WebP"]]])

     ;; Topbar: back button + search
     [:div.asset-picker-topbar
      [:div.asset-picker-back
       [:button.back-button
        {:on-click on-back}
        (shui/tabler-icon "chevron-left" {:size 16})
        [:span "Back"]]
       ;; Delete button (aligned to right)
       (when del-btn?
         (shui/button {:variant :outline :size :sm :data-action "del"
                       :on-click on-delete}
                      (shui/tabler-icon "trash" {:size 17})))]
      (shui/separator {:class "my-0 opacity-50"})
      [:div.asset-picker-search
       [:div.search-input
        (shui/tabler-icon "search" {:size 16 :class "ls-icon-search"})
        (shui/input
         {:placeholder "Search images"
          :value search-q
          :auto-focus true
          :on-change (fn [e]
                       (let [v (util/evalue e)]
                         (reset! *search-q v)
                         ;; Update debounced web query
                         ((update-web-query-debounced) v)))})]]]

     ;; Body - scrollable content area with top/bottom margin
     (let [;; Get recently used asset UUIDs and resolve to asset entities
           used-uuids (get-used-assets)
           used-assets (->> used-uuids
                            (map (fn [uuid-str]
                                   (some #(when (= (str (:block/uuid %)) uuid-str) %)
                                         assets)))
                            (remove nil?))
           ;; Build the "Recently used" row: current selection first (if not already in list), then recently used
           recently-used-row (if current-asset
                               ;; Put current asset first, then others (excluding current)
                               (take 5 (cons current-asset
                                             (remove #(= (:block/uuid %) (:block/uuid current-asset))
                                                     used-assets)))
                               ;; No current selection, just show recently used
                               (take 5 used-assets))
           recently-used-count (count recently-used-row)
           section-states (rum/react *section-states)
           recently-used-expanded? (get section-states "Recently used" true)
           available-expanded? (get section-states "Available assets" true)]
       [:div.bd.bd-scroll
        ;; "Recently used" section - shows current + recently used in one row (only when not searching)
        (when (and (seq recently-used-row) (string/blank? search-q))
          [:div.pane-section
           (section-header {:title "Recently used"
                            :count recently-used-count
                            :expanded? recently-used-expanded?
                            :on-toggle #(swap! *section-states update "Recently used" (fn [v] (if (nil? v) false (not v))))})
           (when recently-used-expanded?
             [:div.asset-picker-grid.recently-used-row
              {:class (when avatar-mode? "avatar-mode")}
              (for [asset recently-used-row]
                (rum/with-key
                  (image-asset-item asset {:on-chosen on-chosen
                                           :avatar-context avatar-context
                                           :selected? (= (str (:block/uuid asset)) current-asset-uuid)})
                  (str "recent-" (:block/uuid asset))))])])

        ;; "Web images" section - Wikipedia Commons images
        (when-not (string/blank? effective-web-query)
          (web-images-section
           {:query effective-web-query
            :avatar-context avatar-context
            :on-select handle-web-image-select
            :on-popover-change #(reset! *popover-open? %)}))

        ;; "Available assets" section
        [:div.pane-section
         (section-header {:title "Available assets"
                          :count asset-count
                          :expanded? available-expanded?
                          :on-toggle #(swap! *section-states update "Available assets" (fn [v] (if (nil? v) false (not v))))})

         ;; Asset grid
         (when available-expanded?
           [:div.asset-picker-grid
            {:class (when avatar-mode? "avatar-mode")}
            (cond
              loading?
              [:div.flex.flex-col.items-center.justify-center.h-32.text-gray-08
               [:div.animate-spin (shui/tabler-icon "loader-2" {:size 32})]
               [:span.text-sm.mt-2 "Loading assets..."]]

              (seq filtered-assets)
              (for [asset filtered-assets]
                (rum/with-key
                  (image-asset-item asset {:on-chosen on-chosen
                                           :avatar-context avatar-context
                                           :selected? (= (str (:block/uuid asset)) current-asset-uuid)})
                  (str (:block/uuid asset))))

              :else
              (if (and (seq assets) (not (string/blank? search-q)))
                ;; Search returned no results
                [:div.asset-picker-empty
                 (shui/tabler-icon "search-off" {:size 32})
                 [:span.text-sm "No matching images"]]
                ;; No assets uploaded yet
                [:div.asset-picker-empty
                 (shui/tabler-icon "photo" {:size 32})
                 [:span.text-sm "No images yet"]]))])]])

     ;; Action buttons (floating at bottom) - using shui buttons
     [:div.asset-picker-actions
      (shui/button
       {:variant :outline
        :size :sm
        :on-click (fn [^js e]
                    (reset! *popover-open? true)
                    (shui/popup-show!
                     (.-target e)
                     (fn [{:keys [id]}]
                       (url-asset-pane
                        {:on-close (fn []
                                     (reset! *popover-open? false)
                                     (shui/popup-hide! id))
                         :on-asset-added (fn [asset-entity]
                                           ;; Refresh asset list
                                           (p/let [updated-assets (<get-image-assets)]
                                             (reset! *loaded-assets (or (seq updated-assets) [])))
                                           ;; Select the new asset
                                           (let [image-data {:asset-uuid (str (:block/uuid asset-entity))
                                                             :asset-type (:logseq.property.asset/type asset-entity)}]
                                             (on-chosen nil
                                                        (if avatar-context
                                                          {:type :avatar
                                                           :id (:id avatar-context)
                                                           :label (:label avatar-context)
                                                           :data (merge (:data avatar-context) image-data)}
                                                          {:type :image
                                                           :id (str "image-" (:block/uuid asset-entity))
                                                           :label (or (:block/title asset-entity) "")
                                                           :data image-data}))))}))
                     {:align :end
                      :side "top"
                      :content-props {:class "url-asset-pane-popup"
                                      :sideOffset 8}
                      :on-after-hide (fn [] (reset! *popover-open? false))}))}
       (shui/tabler-icon "link" {:size 16})
       [:span "Add image via URL"])
      (shui/button
       {:variant (if popover-open? :secondary :default)
        :size :sm
        :as-child true}
       [:label
        [:input#asset-upload-input.hidden
         {:type "file"
          :accept "image/*"
          :multiple true
          :on-change (fn [e]
                       (let [files (array-seq (.-files (.-target e)))]
                         (handle-upload files)))}]
        [:span "Upload image"]])

      ;; Mobile camera button
      (when (util/mobile?)
        (shui/button
         {:variant :secondary
          :size :sm
          :as-child true}
         [:label
          [:input.hidden
           {:type "file"
            :accept "image/*"
            :capture "environment"
            :on-change (fn [e]
                         (let [files (array-seq (.-files (.-target e)))]
                           (handle-upload files)))}]
          [:div.flex.items-center.gap-2
           (shui/tabler-icon "camera" {:size 16})
           [:span "Take photo"]]]))]]))

(defn open-image-asset-picker!
  "Opens the asset picker popup for selecting an image icon.
   Used for clickable placeholders and error states in image icons."
  [^js e page-id page-title current-icon]
  (shui/popup-show!
   (.-target e)
   (fn [{:keys [id]}]
     (asset-picker
      {:on-chosen (fn [_e icon-data]
                    (when icon-data
                      (property-handler/set-block-property!
                       page-id :logseq.property/icon icon-data))
                    (shui/popup-hide! id))
       :on-back #(shui/popup-hide! id)
       :on-delete nil
       :del-btn? false
       :current-icon current-icon
       :page-title page-title}))
   {:align :start
    :content-props {:class "ls-icon-picker"
                    :onEscapeKeyDown #(.preventDefault %)}}))

(rum/defc all-cp < rum/reactive
  [opts]
  (let [used-items (->> (get-used-items)
                        ;; Filter out text and avatar icons - they're page-contextual
                        ;; and don't make sense to reuse on different pages
                        (remove #(#{:text :avatar} (:type %))))
        emoji-items (->> (take 32 emojis)
                         (map (fn [emoji]
                                {:type :emoji
                                 :id (:id emoji)
                                 :label (or (:name emoji) (:id emoji))
                                 :data {:value (:id emoji)}})))
        icon-items (->> (take 48 (get-tabler-icons))
                        (map (fn [icon-name]
                               {:type :icon
                                :id (str "icon-" icon-name)
                                :label icon-name
                                :data {:value icon-name}})))
        opts (assoc opts :virtual-list? false)
        ;; Read section states reactively
        section-states (rum/react *section-states)
        ;; Scope highlights to only the active section (prevents duplicate highlighting)
        scope-opts (fn [section-label o]
                     (cond-> o
                       (not= section-label (:highlighted-section o))
                       (dissoc :highlighted-id)
                       (not= section-label (:ghost-highlighted-section o))
                       (dissoc :ghost-highlighted-id)))]
    [:div.all-pane.pb-2
     ;; Recently used - collapsible
     (when (seq used-items)
       (pane-section "Recently used" used-items
                     (assoc (scope-opts "Recently used" opts)
                            :collapsible? true
                            :keyboard-hint "alt mod 1"
                            :expanded? (get section-states "Recently used" true))))

     ;; Emojis - collapsible
     (pane-section "Emojis"
                   emoji-items
                   (assoc (scope-opts "Emojis" opts)
                          :collapsible? true
                          :keyboard-hint "alt mod 2"
                          :total-count (count emojis)
                          :expanded? (get section-states "Emojis" true)))

     ;; Icons - collapsible
     (pane-section "Icons"
                   icon-items
                   (assoc (scope-opts "Icons" opts)
                          :collapsible? true
                          :keyboard-hint "alt mod 3"
                          :total-count (count (get-tabler-icons))
                          :expanded? (get section-states "Icons" true)))]))

(rum/defc tab-observer
  "Re-runs the search when tab changes (if there's a query), preserving the search text."
  [tab {:keys [q *result]}]
  (hooks/use-effect!
   (fn []
     ;; Re-run search with existing query for new tab context
     (when-not (string/blank? q)
       (p/let [result (search q tab)]
         (reset! *result result))))
   [tab q])
  nil)

;; ============================================================
;; Keyboard navigation system
;; Three tab stops: :tabs -> :search -> :grid
;; Uses index-based highlighting with data attributes (no DOM focus on grid items)
;; ============================================================

(defn- compute-flat-items
  "Compute the flat navigable item list and section metadata for the current view.
   Returns {:items [icon-item ...] :sections [{:start N :count N :cols N} ...]}."
  [tab result section-states]
  (let [build-sections (fn [& groups]
                         (loop [gs groups offset 0 items [] sections []]
                           (if-let [g (first gs)]
                             (let [its (vec (or (:items g) []))
                                   c (count its)]
                               (if (pos? c)
                                 (recur (rest gs) (+ offset c)
                                        (into items its)
                                        (conj sections {:start offset :count c :cols (:cols g) :label (:label g)}))
                                 (recur (rest gs) offset items sections)))
                             {:items items :sections sections})))]
    (cond
      ;; Search results active
      (seq result)
      (build-sections
       {:label "Emojis" :items (when (and (seq (:emojis result)) (get section-states "Emojis" true))
                                 (:emojis result))
        :cols 9}
       {:label "Icons" :items (when (and (seq (:icons result)) (get section-states "Icons" true))
                                (:icons result))
        :cols 9})

      ;; Custom tab: 3 buttons
      (= tab :custom)
      {:items [{:type :custom-text :id "custom-text"}
               {:type :custom-avatar :id "custom-avatar"}
               {:type :custom-image :id "custom-image"}]
       :sections [{:start 0 :count 3 :cols 3}]}

      ;; All tab: recently used + emojis + icons (non-virtualized, limited items)
      (= tab :all)
      (build-sections
       {:label "Recently used"
        :items (when (get section-states "Recently used" true)
                 (->> (get-used-items)
                      (remove #(#{:text :avatar} (:type %)))))
        :cols 9}
       {:label "Emojis"
        :items (when (get section-states "Emojis" true)
                 (->> (take 32 emojis)
                      (map (fn [emoji]
                             {:type :emoji :id (:id emoji)
                              :label (or (:name emoji) (:id emoji))
                              :data {:value (:id emoji)}}))))
        :cols 9}
       {:label "Icons"
        :items (when (get section-states "Icons" true)
                 (->> (take 48 (get-tabler-icons))
                      (map (fn [icon-name]
                             {:type :icon :id (str "icon-" icon-name)
                              :label icon-name :data {:value icon-name}}))))
        :cols 9})

      ;; Emojis tab: full emoji list
      (= tab :emoji)
      (let [items (vec (map (fn [emoji]
                              {:type :emoji :id (:id emoji)
                               :label (or (:name emoji) (:id emoji))
                               :data {:value (:id emoji)}})
                            emojis))]
        {:items items :sections [{:start 0 :count (count items) :cols 9}]})

      ;; Icons tab: full icon list
      (= tab :icon)
      (let [items (vec (map (fn [icon-name]
                              {:type :icon :id (str "icon-" icon-name)
                               :label icon-name :data {:value icon-name}})
                            (get-tabler-icons)))]
        {:items items :sections [{:start 0 :count (count items) :cols 9}]})

      :else {:items [] :sections []})))

(defn- section-for-index
  "Find which section index contains the given flat index."
  [idx sections]
  (some (fn [[si sec]]
          (when (and (>= idx (:start sec))
                     (< idx (+ (:start sec) (:count sec))))
            si))
        (map-indexed vector sections)))

(defn- move-grid-highlight
  "Section-aware 2D grid navigation.
   Returns new index, or nil to signal 'move to search'."
  [current-index direction sections]
  (when (and (seq sections) (some? current-index))
    (let [total (+ (:start (last sections)) (:count (last sections)))
          si (section-for-index current-index sections)]
      (when si
        (let [sec (nth sections si)
              local-idx (- current-index (:start sec))
              cols (:cols sec)
              row (quot local-idx cols)
              col (rem local-idx cols)
              n-rows (js/Math.ceil (/ (:count sec) cols))
              next-sec (fn [i] (when (< (inc i) (count sections)) (inc i)))
              prev-sec (fn [i] (when (pos? i) (dec i)))]
          (case direction
            :down
            (let [next-row (inc row)]
              (if (< next-row n-rows)
                ;; Next row in this section (clamp to last item for partial rows)
                (min (+ (:start sec) (* next-row cols) col)
                     (+ (:start sec) (dec (:count sec))))
                ;; Jump to next section, same column clamped
                (when-let [nsi (next-sec si)]
                  (let [nsec (nth sections nsi)
                        target-col (min col (dec (min (:cols nsec) (:count nsec))))]
                    (+ (:start nsec) target-col)))))

            :up
            (if (pos? row)
              ;; Previous row in this section
              (+ (:start sec) (* (dec row) cols) col)
              ;; Jump to previous section's last row, same column clamped
              (when-let [psi (prev-sec si)]
                (let [psec (nth sections psi)
                      pcols (:cols psec)
                      last-row (dec (js/Math.ceil (/ (:count psec) pcols)))
                      candidate (+ (:start psec) (* last-row pcols) col)
                      max-idx (+ (:start psec) (dec (:count psec)))]
                  (min candidate max-idx))))

            :right
            (let [next-idx (inc current-index)
                  sec-end (+ (:start sec) (:count sec))]
              (if (< next-idx sec-end)
                next-idx
                (when-let [nsi (next-sec si)]
                  (:start (nth sections nsi)))))

            :left
            (if (> current-index (:start sec))
              (dec current-index)
              (when-let [psi (prev-sec si)]
                (let [psec (nth sections psi)]
                  (+ (:start psec) (dec (:count psec))))))

            :home 0
            :end (dec total)
            nil))))))

(defn- tab-items
  "Returns the ordered tab IDs for keyboard navigation."
  []
  [:all :emoji :icon :custom])

(rum/defc keyboard-nav-controller
  "Unified keyboard navigation controller for the icon picker.
   Manages three tab stops: :tabs, :search, :grid.
   Highlighting is React-props-driven (no DOM attribute manipulation)."
  [*focus-region *highlighted-index *tab *input-ref flat-items sections *virtuoso-ref]
  (let [*el-ref (rum/use-ref nil)
        get-cnt #(some-> (rum/deref *el-ref) (.closest ".cp__emoji-icon-picker"))

        focus-search! (fn []
                        (reset! *focus-region :search)
                        (reset! *highlighted-index nil)
                        (some-> (rum/deref *input-ref) (.focus)))

        focus-grid! (fn [idx]
                      (let [idx (or idx 0)
                            idx (min idx (max 0 (dec (count flat-items))))]
                        (reset! *focus-region :grid)
                        (reset! *highlighted-index idx)))

        focus-tabs! (fn [& [tab-id]]
                      (reset! *focus-region :tabs)
                      (reset! *highlighted-index nil)
                      (when-let [cnt (get-cnt)]
                        (let [selector (if tab-id
                                         (str "[data-tab-id='" (name tab-id) "'].tab-item")
                                         "[data-active='true'].tab-item")]
                          (when-let [tab-el (.querySelector cnt selector)]
                            (.focus tab-el)))))

        select-highlighted! (fn []
                              (when-let [idx @*highlighted-index]
                                (when (< idx (count flat-items))
                                  (let [item-id (:id (nth flat-items idx))]
                                    (when-let [cnt (get-cnt)]
                                      (when-let [btn (.querySelector cnt (str "[data-item-id='" item-id "']"))]
                                        (.click btn)))))))

        handle-grid-keys (fn [^js e]
                           (let [key (.-key e)
                                 code (.-keyCode e)
                                 idx (or @*highlighted-index 0)]
                             (cond
                               (or (= code 13) (= key " "))
                               (do (util/stop e) (select-highlighted!))

                               (= code 27)
                               (do (util/stop e) (focus-search!))

                               (and (= code 9) (not (.-shiftKey e)))
                               (do (util/stop e) (focus-tabs!))

                               (and (= code 9) (.-shiftKey e))
                               (do (util/stop e) (focus-search!))

                               (= code 37) ;; Left
                               (do (util/stop e)
                                   (if-let [new-idx (move-grid-highlight idx :left sections)]
                                     (focus-grid! new-idx)
                                     (focus-search!)))

                               (= code 39) ;; Right
                               (do (util/stop e)
                                   (when-let [new-idx (move-grid-highlight idx :right sections)]
                                     (focus-grid! new-idx)))

                               (= code 38) ;; Up
                               (do (util/stop e)
                                   (if-let [new-idx (move-grid-highlight idx :up sections)]
                                     (focus-grid! new-idx)
                                     (focus-search!)))

                               (= code 40) ;; Down
                               (do (util/stop e)
                                   (when-let [new-idx (move-grid-highlight idx :down sections)]
                                     (focus-grid! new-idx)))

                               (= code 36) ;; Home
                               (do (util/stop e) (focus-grid! 0))

                               (= code 35) ;; End
                               (do (util/stop e) (focus-grid! (dec (count flat-items))))

                               ;; Type-through: printable character -> redirect to search
                               (and (= 1 (count key))
                                    (not (.-metaKey e))
                                    (not (.-ctrlKey e))
                                    (not (.-altKey e)))
                               (focus-search!))))

        handle-tabs-keys (fn [^js e]
                           (let [code (.-keyCode e)
                                 tabs (tab-items)
                                 current-tab @*tab
                                 current-idx (.indexOf tabs current-tab)]
                             (cond
                               (= code 39)
                               (do (util/stop e)
                                   (let [next-idx (mod (inc current-idx) (count tabs))
                                         next-tab (nth tabs next-idx)]
                                     (reset! *tab next-tab)
                                     (focus-tabs! next-tab)))

                               (= code 37)
                               (do (util/stop e)
                                   (let [prev-idx (mod (+ current-idx (dec (count tabs))) (count tabs))
                                         prev-tab (nth tabs prev-idx)]
                                     (reset! *tab prev-tab)
                                     (focus-tabs! prev-tab)))

                               (or (= code 13) (= (.-key e) " "))
                               (do (util/stop e))

                               (or (= code 40) (and (= code 9) (not (.-shiftKey e))))
                               (do (util/stop e) (focus-search!))

                               (and (= code 9) (.-shiftKey e))
                               (do (util/stop e)
                                   (when (pos? (count flat-items))
                                     (focus-grid! 0)))

                               (= code 27)
                               (do (util/stop e) (shui/popup-hide!)))))

        ;; Refs for latest handler versions (avoids stale closures)
        *grid-handler-ref (hooks/use-ref handle-grid-keys)
        _ (set! (.-current *grid-handler-ref) handle-grid-keys)
        *tabs-handler-ref (hooks/use-ref handle-tabs-keys)
        _ (set! (.-current *tabs-handler-ref) handle-tabs-keys)

        keydown-handler
        (hooks/use-callback
         (fn [^js e]
           (let [region @*focus-region]
             (if (and (.-metaKey e) (.-altKey e))
               ;; ⌥⌘1/2/3 toggle section collapse on the All tab
               (when (= @*tab :all)
                 (let [section-name (case (.-keyCode e)
                                      49 "Recently used"
                                      50 "Emojis"
                                      51 "Icons"
                                      nil)]
                   (when section-name
                     (swap! *section-states update section-name (fn [v] (if (nil? v) false (not v))))
                     (reset! *highlighted-index nil)
                     (util/stop e))))
               (case region
                 :grid ((.-current *grid-handler-ref) e)
                 :tabs ((.-current *tabs-handler-ref) e)
                 nil))))
         [])]

    ;; Scroll highlighted item into view (highlighting itself is React-props-driven)
    (hooks/use-effect!
     (fn []
       (when-let [idx @*highlighted-index]
         (if-let [virt @*virtuoso-ref]
           ;; Virtuoso: scroll to row
           (when-let [si (section-for-index idx sections)]
             (let [sec (nth sections si)
                   local-idx (- idx (:start sec))
                   row (quot local-idx (:cols sec))]
               (.scrollToIndex virt #js {:index row :align "center" :behavior "auto"})))
           ;; Non-virtualized: scrollIntoView on the button
           (when-let [cnt (get-cnt)]
             (when (< idx (count flat-items))
               (let [item-id (:id (nth flat-items idx))]
                 (when-let [btn (.querySelector cnt (str "[data-item-id='" item-id "']"))]
                   (.scrollIntoView btn #js {:block "nearest" :behavior "instant"}))))))))
     [@*highlighted-index])

    ;; Attach global keydown handler
    (hooks/use-effect!
     (fn []
       (when-let [cnt (get-cnt)]
         (.addEventListener cnt "keydown" keydown-handler true)
         #(.removeEventListener cnt "keydown" keydown-handler true)))
     [])

    [:span.absolute.hidden {:ref *el-ref}]))

(rum/defc color-picker
  [*color on-select!]
  (let [[color, set-color!] (rum/use-state @*color)
        *el (rum/use-ref nil)
        content-fn (fn []
                     (let [colors [nil
                                   (colors/variable :gray :10)
                                   (colors/variable :indigo :10)
                                   (colors/variable :cyan :10)
                                   (colors/variable :green :10)
                                   (colors/variable :orange :10)
                                   (colors/variable :tomato :10)
                                   (colors/variable :pink :10)
                                   (colors/variable :red :10)]]
                       [:div.color-picker-presets
                        (for [c colors]
                          [:button.color-swatch
                           {:key (or c "none")
                            :class (when (= c color) "is-selected")
                            :on-click (fn [] (set-color! c)
                                        (some-> on-select! (apply [c]))
                                        (shui/popup-hide!))}
                           (if c
                             [:span.swatch-fill {:style {:background-color c}}]
                             [:span.swatch-empty
                              (shui/tabler-icon "slash" {:size 14})])])]))]
    (hooks/use-effect!
     (fn []
       (when-let [^js picker (some-> (rum/deref *el) (.closest ".cp__emoji-icon-picker"))]
         (let [color (if (string/blank? color) "inherit" color)]
           (.setProperty (.-style picker) "--ls-color-icon-preset" color)
           (storage/set :ls-icon-color-preset color)))
       (reset! *color color))
     [color])

    [:button.color-picker-trigger
     {:ref *el
      :on-click (fn [^js e] (shui/popup-show! (.-target e) content-fn {:content-props {:side "bottom" :side-offset 6}}))}
     (if color
       [:span.color-picker-fill {:style {:background-color color}}]
       [:span.color-picker-empty
        (shui/tabler-icon "slash" {:size 12})])]))

(rum/defcs text-picker < rum/reactive
  (rum/local nil ::text-value)
  (rum/local nil ::alignment)
  (rum/local nil ::color)
  (rum/local nil ::mode)
  (rum/local false ::deleted?)
  (rum/local nil ::persist-timer)
  {:will-mount (fn [s]
                 (let [opts (first (:rum/args s))
                       current-icon (:current-icon opts)
                       title (or (:page-title opts)
                                 (some-> (state/get-current-page)
                                         (db/get-page)
                                         (:block/title)))
                       existing-value (get-in current-icon [:data :value])
                       existing-alignment (get-in current-icon [:data :alignment])
                       existing-color (get-in current-icon [:data :color])
                       selected-color (:selected-color opts)
                       existing-mode (get-in current-icon [:data :mode])]
                   (reset! (::text-value s) (or existing-value (derive-initials title)))
                   (reset! (::alignment s) (or existing-alignment "center"))
                   (reset! (::color s) (or existing-color selected-color))
                   (reset! (::mode s) (or existing-mode "initials"))
                   s))
   :will-unmount (fn [s]
                   (when-let [t @(::persist-timer s)]
                     (js/clearTimeout t))
                   (when-not @(::deleted? s)
                     (let [opts (first (:rum/args s))
                           on-chosen (:on-chosen opts)
                           *tv (::text-value s)
                           *al (::alignment s)
                           *co (::color s)
                           *md (::mode s)
                           title (or (:page-title opts)
                                     (some-> (state/get-current-page)
                                             (db/get-page)
                                             (:block/title)))
                           derived (or (derive-initials title) "?")
                           text (if (string/blank? @*tv) derived @*tv)
                           icon-item {:type :text
                                      :id (str "text-" text)
                                      :label text
                                      :data (cond-> {:value text}
                                              @*co (assoc :color @*co)
                                              @*al (assoc :alignment @*al)
                                              @*md (assoc :mode @*md))}]
                       (on-chosen nil icon-item true)
                       (add-used-item! icon-item)))
                   s)}
  [state {:keys [on-chosen on-back on-delete del-btn? page-title]}]
  (let [*text-value (::text-value state)
        *alignment (::alignment state)
        *color (::color state)
        *mode (::mode state)
        *deleted? (::deleted? state)
        title (or page-title
                  (some-> (state/get-current-page)
                          (db/get-page)
                          (:block/title)))
        derived-initials (or (derive-initials title) "?")
        derived-abbreviated (derive-abbreviated title)
        build-icon (fn [text-override]
                     (let [text (or text-override
                                    (if (string/blank? @*text-value) derived-initials @*text-value))]
                       {:type :text
                        :id (str "text-" text)
                        :label text
                        :data (cond-> {:value text}
                                @*color (assoc :color @*color)
                                @*alignment (assoc :alignment @*alignment)
                                @*mode (assoc :mode @*mode))}))
        *persist-timer (::persist-timer state)
        persist! (fn []
                   (when-let [t @*persist-timer]
                     (js/clearTimeout t)
                     (reset! *persist-timer nil))
                   (let [icon-item (build-icon nil)]
                     (on-chosen nil icon-item true)
                     (add-used-item! icon-item)))
        persist-debounced! (fn []
                             (when-let [t @*persist-timer]
                               (js/clearTimeout t))
                             (reset! *persist-timer
                                     (js/setTimeout #(persist!) 300)))
        gallery-options (cond-> [{:mode "initials" :text derived-initials :label "Initials"}]
                          derived-abbreviated
                          (conj {:mode "abbreviated" :text derived-abbreviated :label "Abbreviated"})
                          true
                          (conj {:mode "custom" :text nil :label "Custom"}))
        current-mode @*mode]
    [:div.text-picker
     ;; Topbar
     [:div.text-picker-topbar
      [:div.text-picker-back
       [:button.back-button
        {:on-click (fn []
                     (persist!)
                     (on-back))}
        (shui/tabler-icon "chevron-left" {:size 16})
        [:span "Back"]]
       [:div.text-picker-actions
        (color-picker *color (fn [c]
                               (reset! *color c)
                               (let [text (if (string/blank? @*text-value) derived-initials @*text-value)
                                     icon-item {:type :text
                                                :id (str "text-" text)
                                                :label text
                                                :data (cond-> {:value text}
                                                        c (assoc :color c)
                                                        @*alignment (assoc :alignment @*alignment)
                                                        @*mode (assoc :mode @*mode))}]
                                 (on-chosen nil icon-item true))))
        (when del-btn?
          (shui/button {:variant :outline :size :sm :data-action "del"
                        :on-click (fn []
                                    (reset! *deleted? true)
                                    (on-delete))}
                       (shui/tabler-icon "trash" {:size 17})))]]
      (shui/separator {:class "my-0 opacity-50"})]

     ;; Body
     [:div.text-picker-body
      ;; Gallery row — Initials / Abbreviated / Custom
      [:div.text-picker-gallery
       (for [{:keys [mode text label]} gallery-options]
         (let [selected? (= current-mode mode)
               display-text (if (= mode "custom")
                              (when-not (string/blank? @*text-value)
                                @*text-value)
                              text)]
           [:button.text-picker-gallery-item
            {:key mode
             :class (when selected? "selected")
             :on-click (fn []
                         (reset! *mode mode)
                         (case mode
                           "initials" (reset! *text-value derived-initials)
                           "abbreviated" (reset! *text-value derived-abbreviated)
                           "custom" nil)
                         (persist!))}
            [:div.text-picker-gallery-preview
             (if display-text
               (icon (build-icon display-text) {:size 36})
               (shui/tabler-icon "pencil" {:size 20}))]
            [:span.text-picker-gallery-label label]]))]

      (shui/separator {:class "my-0 opacity-50 -mx-3"})

      ;; Controls row: Text input + Alignment side by side
      [:div.text-picker-controls-row
       ;; Text input
       [:div.text-picker-section.flex-1
        [:label "Text"]
        (shui/input
         {:size "sm"
          :auto-focus true
          :max-length 8
          :placeholder derived-initials
          :value @*text-value
          :on-change (fn [e]
                       (let [v (util/evalue e)]
                         (reset! *text-value v)
                         (when (not= @*mode "custom")
                           (reset! *mode "custom"))
                         (persist-debounced!)))
          :on-blur (fn [_e]
                     (when (string/blank? @*text-value)
                       (reset! *text-value derived-initials)
                       (reset! *mode "initials"))
                     (persist!))})]

       ;; Alignment
       [:div.text-picker-section
        [:label "Alignment"]
        [:div.text-picker-alignment
         (shui/button-group
          (for [align ["left" "center" "right"]
                :let [active? (= @*alignment align)]]
            (shui/button
             {:key align
              :variant (if active? :secondary :outline)
              :size :sm
              :on-click (fn []
                          (reset! *alignment align)
                          (persist!))}
             (shui/tabler-icon (str "align-" align) {:size 16}))))]]]]]))

(rum/defcs ^:large-vars/cleanup-todo icon-search < rum/reactive
  (rum/local "" ::q)
  (rum/local nil ::result)
  (rum/local :search ::focus-region)
  (rum/local nil ::highlighted-index)
  (rum/local :all ::tab)
  (rum/local false ::input-focused?)
  (rum/local nil ::virtuoso-ref)
  (rum/local :icon-picker ::view) ;; Default view, updated in :will-mount for avatars/images
  {:will-mount (fn [s]
                 (let [opts (first (:rum/args s))
                       icon-value (:icon-value opts)
                       normalized (normalize-icon icon-value)
                       *view (::view s)]
                   ;; Avatar/image icons open asset picker, text icons open text-picker
                   (when (contains? #{:avatar :image :text} (:type normalized))
                     (reset! *view (if (= :text (:type normalized)) :text-picker :asset-picker)))
                   (assoc s ::color (atom (storage/get :ls-icon-color-preset)))))}
  [state {:keys [on-chosen del-btn? icon-value page-title] :as opts}]
  (let [*q (::q state)
        *result (::result state)
        *tab (::tab state)
        *color (::color state)
        *input-focused? (::input-focused? state)
        *view (::view state)
        *input-ref (rum/create-ref)
        *result-ref (rum/create-ref)
        *virtuoso-ref (::virtuoso-ref state)
        result @*result
        normalized-icon-value (normalize-icon icon-value)
        opts (assoc opts
                    :input-focused? @*input-focused?
                    :*virtuoso-ref *virtuoso-ref
                    :on-chosen (fn [e m & [keep-popup?]]
                                 (let [icon-item (normalize-icon m)
                                       can-have-color? (contains? #{:icon :avatar :text} (:type icon-item))
                                       ;; Update color if user selected one from picker
                                       ;; Skip for :text — text-picker manages its own color
                                       m' (if (and can-have-color? (not (string/blank? @*color)) (not (= :text (:type icon-item))))
                                            (cond-> m
                                              ;; For icons: set color (top-level for block.cljs select-keys, nested for icon-cp)
                                              (= :icon (:type icon-item))
                                              (-> (assoc :color @*color)
                                                  (assoc-in [:data :color] @*color))

                                              ;; For avatars: set both color (text) and backgroundColor
                                              (= :avatar (:type icon-item))
                                              (-> (assoc :color @*color)
                                                  (assoc-in [:data :color] @*color)
                                                  (assoc-in [:data :backgroundColor] @*color)))
                                            m)]
                                   (and on-chosen (on-chosen e m' keep-popup?))
                                   (when (:type icon-item) (add-used-item! icon-item)))))
        *focus-region (::focus-region state)
        *highlighted-index (::highlighted-index state)
        section-states @*section-states
        {flat-items :items sections :sections} (compute-flat-items @*tab result section-states)
        highlighted-id (when-let [idx @*highlighted-index]
                         (when (< idx (count flat-items))
                           (:id (nth flat-items idx))))
        highlighted-section (when-let [idx @*highlighted-index]
                              (when-let [si (section-for-index idx sections)]
                                (:label (nth sections si))))
        ghost-highlighted-id (when (and (= @*focus-region :search)
                                        (nil? @*highlighted-index)
                                        (pos? (count flat-items)))
                               (:id (first flat-items)))
        ghost-highlighted-section (when ghost-highlighted-id
                                    (:label (first sections)))
        opts (assoc opts
                    :highlighted-id highlighted-id
                    :highlighted-section highlighted-section
                    :ghost-highlighted-id ghost-highlighted-id
                    :ghost-highlighted-section ghost-highlighted-section
                    :focus-region @*focus-region)
        reset-q! #(when-let [^js input (rum/deref *input-ref)]
                    (reset! *q "")
                    (reset! *result {})
                    (reset! *focus-region :search)
                    (reset! *highlighted-index nil)
                    (set! (. input -value) "")
                    (util/schedule
                     (fn []
                       (when (not= js/document.activeElement input)
                         (.focus input))
                       (util/scroll-to (rum/deref *result-ref) 0 false))))]
    (case @*view
      :asset-picker
      ;; Level 2: Asset Picker view
      (asset-picker {:on-chosen (fn [e icon-data]
                                  ((:on-chosen opts) e icon-data)
                                  (reset! *view :icon-picker))
                     :on-back #(reset! *view :icon-picker)
                     :on-delete #(on-chosen nil)
                     :del-btn? del-btn?
                     :current-icon normalized-icon-value
                     :avatar-context (when (= :avatar (:type normalized-icon-value))
                                       normalized-icon-value)
                     :page-title page-title})

      :text-picker
      ;; Level 2: Text Picker view
      (text-picker {:on-chosen (:on-chosen opts)
                    :on-back #(reset! *view :icon-picker)
                    :on-delete #(on-chosen nil)
                    :del-btn? del-btn?
                    :current-icon normalized-icon-value
                    :selected-color @*color
                    :page-title page-title})

      ;; Default - Level 1: Icon Picker view
      [:div.cp__emoji-icon-picker
       {:data-keep-selection true
        :class (when (rum/react *drag-active?) "drag-active")
        :on-drag-enter (fn [e]
                         (.preventDefault e)
                         (.stopPropagation e)
                         (swap! *drag-depth inc)
                         (when (= @*drag-depth 1)
                           (reset! *drag-active? true)
                           ;; Lock scroll behind overlay
                           (when-let [bd (.querySelector (.-currentTarget e) ".bd-scroll")]
                             (set! (.. bd -style -overflowY) "hidden"))
                           (when-let [vs (.querySelector (.-currentTarget e) "[data-virtuoso-scroller]")]
                             (set! (.. vs -style -overflowY) "hidden"))))
        :on-drag-over (fn [e]
                        (.preventDefault e)
                        (.stopPropagation e))
        :on-drag-leave (fn [e]
                         (.preventDefault e)
                         (.stopPropagation e)
                         (swap! *drag-depth dec)
                         (when (<= @*drag-depth 0)
                           (reset! *drag-depth 0)
                           (reset! *drag-active? false)
                           ;; Restore scroll
                           (when-let [bd (.querySelector (.-currentTarget e) ".bd-scroll")]
                             (set! (.. bd -style -overflowY) ""))
                           (when-let [vs (.querySelector (.-currentTarget e) "[data-virtuoso-scroller]")]
                             (set! (.. vs -style -overflowY) ""))))
        :on-drop (fn [e]
                   (.preventDefault e)
                   (.stopPropagation e)
                   (reset! *drag-depth 0)
                   (reset! *drag-active? false)
                   ;; Restore scroll
                   (when-let [bd (.querySelector (.-currentTarget e) ".bd-scroll")]
                     (set! (.. bd -style -overflowY) ""))
                   (when-let [vs (.querySelector (.-currentTarget e) "[data-virtuoso-scroller]")]
                     (set! (.. vs -style -overflowY) ""))
                   (let [files (array-seq (.. e -dataTransfer -files))
                         file (first files)
                         repo (state/get-current-repo)]
                     (when file
                       (let [file-type (.-type file)
                             ext (some-> file-type (string/split "/") second keyword)]
                         (if (contains? config/image-formats ext)
                           (p/let [entity (save-image-asset! repo file)]
                             (when entity
                               (let [image-data {:asset-uuid (str (:block/uuid entity))
                                                 :asset-type (:logseq.property.asset/type entity)}
                                     avatar-ctx (when (= :avatar (:type normalized-icon-value))
                                                  normalized-icon-value)]
                                 (on-chosen nil
                                            (if avatar-ctx
                                              {:type :avatar
                                               :id (:id avatar-ctx)
                                               :label (:label avatar-ctx)
                                               :data (merge (:data avatar-ctx) image-data)}
                                              {:type :image
                                               :id (str "image-" (:block/uuid entity))
                                               :label (or (:block/title entity) "")
                                               :data image-data})))))
                           (shui/toast! "Only image files are supported (PNG, JPG, SVG, GIF, WebP)"
                                        :warning))))))}

       ;; Drag overlay hint
       (when @*drag-active?
         [:div.drag-overlay-hint
          [:div.corner.tl] [:div.corner.tr]
          [:div.corner.bl] [:div.corner.br]
          (shui/tabler-icon "upload" {:size 26})
          [:div.text-group
           [:span.title "Drop to set as icon"]
           [:span.subtitle "PNG, JPG, SVG, GIF, WebP"]]])

       ;; Topbar: tabs + separator + search
       [:div.icon-picker-topbar
        [:div.tabs-section {:role "tablist"}
         (tab-observer @*tab {:q @*q :*result *result})
         (keyboard-nav-controller *focus-region *highlighted-index *tab *input-ref flat-items sections *virtuoso-ref)
         (let [tabs [[:all "All"] [:emoji "Emojis"] [:icon "Icons"] [:custom "Custom"]]]
           (for [[id label] tabs
                 :let [active? (= @*tab id)]]
             [:button.tab-item
              {:key (name id)
               :role "tab"
               :aria-selected (str active?)
               :tabIndex (if active? "0" "-1")
               :data-text label
               :data-tab-id (name id)
               :data-active (when active? "true")
               :on-mouse-down (fn [e]
                                (util/stop e)
                                (reset! *tab id)
                                (reset! *focus-region :search)
                                (reset! *highlighted-index nil))}
              label]))
         [:div.tab-actions
          ;; color picker (always visible)
          (color-picker *color (fn [c]
                                 (cond
                                   (or (= :icon (:type normalized-icon-value))
                                       (= :text (:type normalized-icon-value)))
                                   (on-chosen nil (-> normalized-icon-value
                                                      (assoc :color c)
                                                      (assoc-in [:data :color] c)) true)

                                   (= :avatar (:type normalized-icon-value))
                                   (on-chosen nil (-> normalized-icon-value
                                                      (assoc :color c)
                                                      (assoc-in [:data :color] c)
                                                      (assoc-in [:data :backgroundColor] c)) true))))
          ;; delete button
          (when del-btn?
            (shui/button {:variant :outline :size :sm :data-action "del"
                          :on-click #(on-chosen nil)}
                         (shui/tabler-icon "trash" {:size 17})))]]

        (shui/separator {:class "my-0 icon-picker-separator"})

        [:div.search-section
         [:div.search-input
          (shui/tabler-icon "search" {:size 16})
          [(shui/input
            {:auto-focus true
             :ref *input-ref
             :placeholder "Search emojis, icons, assets..."
             :default-value ""
             :on-focus #(do (reset! *focus-region :search)
                            (reset! *input-focused? true))
             :on-blur #(reset! *input-focused? false)
             :on-key-down (fn [^js e]
                            (let [code (.-keyCode e)]
                              (cond
                                ;; Escape: clear search or close picker
                                (= code 27)
                                (do (util/stop e)
                                    (if (string/blank? @*q)
                                      (shui/popup-hide!)
                                      (reset-q!)))

                                ;; Up Arrow / Shift+Tab: move to tab bar
                                (or (= code 38)
                                    (and (= code 9) (.-shiftKey e)))
                                (do (util/stop e)
                                    (reset! *focus-region :tabs)
                                    (reset! *highlighted-index nil)
                                    (when-let [^js cnt (some-> (rum/deref *input-ref) (.closest ".cp__emoji-icon-picker"))]
                                      (when-let [active-tab (.querySelector cnt "[data-active='true'].tab-item")]
                                        (.focus active-tab))))

                                ;; Tab / Down Arrow: enter grid at first item
                                (or (and (= code 9) (not (.-shiftKey e)))
                                    (= code 40))
                                (do (util/stop e)
                                    (when (pos? (count flat-items))
                                      (reset! *focus-region :grid)
                                      (reset! *highlighted-index 0)))

                                ;; Enter: select ghost-highlighted item (first result)
                                (= code 13)
                                (when (and (nil? @*highlighted-index)
                                           (pos? (count flat-items)))
                                  (let [item (first flat-items)
                                        item-id (:id item)]
                                    (when-let [^js cnt (some-> (rum/deref *input-ref) (.closest ".cp__emoji-icon-picker"))]
                                      (when-let [btn (.querySelector cnt (str "[data-item-id='" item-id "']"))]
                                        (.click btn)
                                        (util/stop e))))))))
             :on-change (debounce
                         (fn [e]
                           (reset! *q (util/evalue e))
                           (reset! *focus-region :search)
                           (reset! *highlighted-index nil)
                           (if (string/blank? @*q)
                             (reset! *result {})
                             (p/let [result (search @*q @*tab)]
                               (reset! *result result))))
                         200)})]
          (when-not (string/blank? @*q)
            [:a.x {:on-click reset-q!} (shui/tabler-icon "x" {:size 14})])]]]

       ;; Body
       [:div.bd.bd-scroll
        {:ref *result-ref
         :class (or (some-> @*tab (name)) "other")}
        [:div.content-pane
         ;; Custom tab always shows its own content (Text/Avatar/Image buttons)
         (if (= @*tab :custom)
           (custom-tab-cp *q page-title *color *view icon-value opts)
           ;; Other tabs: show search results if present, else show tab content
           (if (seq result)
             (let [section-states (rum/react *section-states)
                   has-emojis? (seq (:emojis result))
                   has-icons? (seq (:icons result))]
               (if (or has-emojis? has-icons?)
                 (let [both? (and has-emojis? has-icons?)]
                   [:div.flex.flex-1.flex-col.search-result
                    ;; Emojis section
                    (when has-emojis?
                      (pane-section
                       "Emojis"
                       (:emojis result)
                       (assoc opts
                              :collapsible? both?
                              :keyboard-hint (when both? "alt mod 2")
                              :total-count (count (:emojis result))
                              :virtual-list? false
                              :expanded? (get section-states "Emojis" true))))

                    ;; Icons section
                    (when has-icons?
                      (pane-section
                       "Icons"
                       (:icons result)
                       (assoc opts
                              :collapsible? both?
                              :keyboard-hint (when both? "alt mod 3")
                              :total-count (count (:icons result))
                              :virtual-list? false
                              :expanded? (get section-states "Icons" true))))])
                 ;; Search returned no results
                 [:div.search-empty-state
                  (shui/tabler-icon "search-off" {:size 36})
                  [:span.title "No results found"]
                  [:span.subtitle "Try a different search term"]]))
             [:div.flex.flex-1.flex-col.gap-1
              (case @*tab
                :emoji (emojis-cp emojis opts)
                :icon (icons-cp (get-tabler-icons) opts)
                (all-cp opts))]))]]])))

(rum/defc icon-picker
  [icon-value {:keys [empty-label disabled? initial-open? del-btn? on-chosen icon-props popup-opts button-opts page-title]}]
  (let [*trigger-ref (rum/use-ref nil)
        normalized-icon-value (normalize-icon icon-value)
        content-fn
        (if config/publishing?
          (constantly [])
          (fn [{:keys [id]}]
            (icon-search
             {:on-chosen (fn [e icon-value keep-popup?]
                           (on-chosen e icon-value)
                           (when-not (true? keep-popup?) (shui/popup-hide! id)))
              :icon-value normalized-icon-value
              :page-title page-title
              :del-btn? del-btn?})))]
    (hooks/use-effect!
     (fn []
       (when initial-open?
         (js/setTimeout #(some-> (rum/deref *trigger-ref) (.click)) 32)))
     [initial-open?])

    ;; trigger
    (let [has-icon? (some? icon-value)]
      (shui/button
       (merge
        {:ref *trigger-ref
         :variant :ghost
         :size :sm
         :class (if has-icon? "px-1 leading-none text-muted-foreground hover:text-foreground"
                    "font-normal text-sm px-[0.5px] text-muted-foreground hover:text-foreground")
         :on-click (fn [^js e]
                     (when-not disabled?
                       (shui/popup-show! (.-target e) content-fn
                                         (medley/deep-merge
                                          {:align :start
                                           :id :ls-icon-picker
                                           :content-props {:class "ls-icon-picker"
                                                           :onEscapeKeyDown #(.preventDefault %)}}
                                          popup-opts))))}
        button-opts)
       (if has-icon?
         (if (vector? icon-value) ; hiccup
           icon-value
           (icon icon-value (merge {:color? true} icon-props)))
         (or empty-label "Empty"))))))
