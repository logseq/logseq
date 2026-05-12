(ns frontend.components.icon
  (:require ["@emoji-mart/data" :as emoji-data]
            ["emoji-mart" :refer [SearchIndex]]
            ["path" :as node-path]
            ["react-colorful" :refer [HexColorPicker]]
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
            [frontend.handler.icon-color :as icon-color]
            [frontend.handler.property :as property-handler]
            [frontend.rum :as r]
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

(defonce hex-color-picker (r/adapt-class HexColorPicker))

(defonce emojis (vals (bean/->clj (gobj/get emoji-data "emojis"))))

;; Asset picker drag & drop state
(defonce *drag-active? (atom false))
(defonce *drag-depth (atom 0)) ;; Track drag enter/leave depth to prevent flicker
(defonce *asset-picker-open? (atom false))
(defonce *upload-status (atom ""))
(defonce *uploading-files (atom {}))

;; ============================================================
;; Icon hover-preview helpers
;;
;; The picker broadcasts hover state to `:ui/icon-hover-preview`,
;; which page-icon readers (sidebar, cmdk, page-title, table rows)
;; consume to render a live preview of what the user is hovering.
;;
;; Two orthogonal preview signals share the same state slot:
;;
;;   :icon  — full icon override from a tile/grid hover
;;            (e.g. hovering the Avatar tile in the Custom tab).
;;   :color — color-only preview from a color-swatch hover.
;;
;; They MUST compose: hovering an avatar tile and then moving onto a
;; color swatch should keep showing the avatar with the previewed
;; color overlaid. Direct `state/set-state!` writes overwrite
;; siblings, so use these helpers instead — they merge fields when
;; the scope (db-id + db-ids) matches the existing preview, and
;; replace otherwise.
;;
;; The envelope carries two independent scopes — primary (`:db-id` +
;; `:property`, optionally `:db-ids` for batch peers) and inheritor
;; (`:inheritor-db-ids` + `:inheritor-property`). The inheritor scope
;; lets a class default-icon edit preview on instance rows
;; (rendering `:logseq.property/icon` via inheritance) WITHOUT
;; matching the class entity's own `:logseq.property/icon` page-title
;; / sidebar icons, which are unrelated to the property under edit.
;; ============================================================

(defn- icon-preview-same-scope?
  "True when `incoming` describes the same picker scope as `current`
  (entity + entity-set). Property is intentionally NOT part of scope
  identity — a class default-icon picker broadcasts under multiple
  properties simultaneously and they all belong to the same picker."
  [current incoming]
  (and current incoming
       (= (:db-id current) (:db-id incoming))
       (= (:db-ids current) (:db-ids incoming))))

(defn- merge-into-icon-preview!
  "Merge `incoming` into `:ui/icon-hover-preview`. If the existing
  preview's scope matches, preserve any sibling visual fields
  (`:icon`/`:color`) so tile and color hovers compose. Otherwise
  replace — different scope means the previous picker is gone or
  unrelated."
  [incoming]
  (state/update-state!
   :ui/icon-hover-preview
   (fn [current]
     (if (icon-preview-same-scope? current incoming)
       (merge current incoming)
       incoming))))

(defn- dissoc-icon-preview-field!
  "Remove `field` from the preview map iff scope matches. If no
  visual fields remain (`:icon` or `:color`), clear the slot
  entirely so receivers fully revert."
  [scope-target field]
  (state/update-state!
   :ui/icon-hover-preview
   (fn [current]
     (when (and current (icon-preview-same-scope? current scope-target))
       (let [next (dissoc current field)]
         (when (or (:icon next) (:color next))
           next))))))

(defn- icon-preview-matches?
  "True when `preview` applies to entity at `entity-id` rendering
  `viewer-property`. Two independent scopes:

   1. Primary — entity matches `:db-id` (singleton) or is in
      `:db-ids` (set, e.g. batch-selected peers), AND viewer-property
      matches `:property`.

   2. Inheritor — entity is in `:inheritor-db-ids`, AND viewer-property
      matches `:inheritor-property`. Used for class default-icon edits
      so instance rows (rendering `:logseq.property/icon` via
      inheritance) preview without dragging in the class entity's own
      `:logseq.property/icon` page-title icon, which is unrelated to
      the default-icon property under edit."
  [preview entity-id viewer-property]
  (let [primary?   (and (= viewer-property (:property preview))
                        (or (= entity-id (:db-id preview))
                            (contains? (:db-ids preview) entity-id)))
        inheritor? (and (:inheritor-property preview)
                        (= viewer-property (:inheritor-property preview))
                        (contains? (:inheritor-db-ids preview) entity-id))]
    (or primary? inheritor?)))

;; Offscreen canvas for measuring text width (never attached to DOM).
;; Lazily constructed so the namespace can load in environments without a DOM
;; (e.g. the :node-test build).
(defonce *text-measure-ctx
  (delay
    (let [canvas (js/document.createElement "canvas")]
      (.getContext canvas "2d"))))

(declare normalize-icon derive-initials derive-avatar-initials derive-abbreviated
         <search-wikipedia-image <save-url-asset! open-image-asset-picker!
         ;; Used by `asset-picker`'s avatar fallback sub-picker — declared
         ;; up front because `icon-search` itself is defined far below
         ;; (after asset-picker), so the call site at the avatar fallback
         ;; needs a forward declare to satisfy the cljs compiler.
         icon-search)

(def ^:private icon-name-acronyms
  "All-caps tokens that should stay uppercase when humanizing tabler icon
   names — without this allowlist `TvOff` would render as `Tv off` instead
   of `TV off`. Keep this small; only well-known global acronyms qualify."
  #{"3D" "2D" "TV" "AI" "URL" "PDF" "USB" "AM" "PM" "GPS" "ID"
    "HTML" "CSS" "JS" "API" "QR" "AC" "DC" "PC" "CPU" "GPU" "RSS"
    "SQL" "XML" "JSON" "SVG" "PNG" "JPG" "GIF" "MP3" "MP4" "WIFI"})

(defn humanize-icon-name
  "Turn a tabler component name into user-facing copy.
     '3dCubeSphere' -> '3D cube sphere'
     'BrandSlack'   -> 'Slack'
     'TvOff'        -> 'TV off'
     'briefcase'    -> 'Briefcase'
   `Brand` is dropped because the brand-name suffix is the meaningful
   token (`BrandSlack` -> `Slack`). Returns an empty string for blank
   input so the caller can string/concat without a nil guard."
  [s]
  (if (string/blank? s)
    ""
    (let [spaced (-> s
                     (string/replace #"([a-z])([A-Z])" "$1 $2")
                     (string/replace #"([A-Z])([A-Z][a-z])" "$1 $2")
                     (string/replace #"([a-zA-Z])(\d)" "$1 $2")
                     (string/replace #"-" " "))
          stripped (string/replace spaced #"(?i)^brand\s+" "")
          tokens (string/split stripped #"\s+")
          normalized (map (fn [t]
                            (let [up (string/upper-case t)]
                              (cond
                                (contains? icon-name-acronyms up) up
                                (re-matches #"\d+[a-zA-Z]+" t) (string/upper-case t)
                                :else (string/lower-case t))))
                          tokens)
          joined (string/join " " normalized)]
      (if (seq joined)
        (str (string/upper-case (subs joined 0 1)) (subs joined 1))
        ""))))

(defn- avatar-fallback-style
  "Build the inline :style map for an avatar fallback chip (the colored
   circle holding initials).

   Design intent: a muted, hue-preserving tint behind crisp picked-color
   text — so the picked hue shows through on the initials, with the bg
   acting as atmospheric framing rather than competing for attention.

   - bg gets `muted-tint`: same hue as picked, low chroma, L bisected to
     ~1.5:1 contrast vs the page surface. Always visibly distinct from
     the surface, never as saturated as the picked color itself.
   - text uses the picked color directly when it reads against the muted
     bg; falls back to `adjust-for-contrast … 3.0` to lift L only when
     needed (e.g. dark picks on a dark surface where the picked color
     would still be invisible against its own muted tint).

   The 3.0 target — rather than 4.5:1 body-text — treats avatar initials
   as decorative identifiers (Slack/Linear/GitHub all do similar). With
   4.5 the lift triggered for hues like tomato/red whose picked color
   sits at ~3.5:1 against their own muted bg, and OKLCh L bisection
   toward white desaturates as it climbs — turning vivid red into dusty
   pink. 3.0 lets those hues pass through as-is while still safely
   lifting truly-dark picks (#1a3d60 etc.) into legibility.

   `bg` and `color` may be hex literals OR theme tokens (`var(--rx-...)`),
   since the picker offers both a custom hex picker and a Radix-token
   palette. Both are resolved to current-theme hex via `colors/->hex` so
   they hit the same OKLCh pipeline; otherwise preset picks would skip
   muting and render as flat saturated discs (bg = text = same token).

   Earlier iteration used a 31.4% alpha treatment, which silently rendered
   dark picks at ~1.1:1 vs surface — invisible. The next iteration went
   solid bg + auto-lifted text, which inverted the hierarchy and made
   vivid picks read as a single solid disc. This version restores the
   original intent with deterministic OKLCh math."
  [{:keys [font-size bg color]}]
  (let [bg-hex (colors/->hex bg)
        color-hex (colors/->hex (or color bg))
        page-bg (when bg-hex
                  (colors/read-bg-var "--ls-primary-background-color"))
        bg' (if (and bg-hex page-bg)
              (colors/muted-tint bg-hex page-bg 1.5)
              bg)
        color' (if (and color-hex bg-hex page-bg)
                 (colors/adjust-for-contrast color-hex bg' 3.0)
                 (or color bg))]
    (cond-> {:font-size font-size :font-weight "500"}
      bg' (assoc :background-color bg')
      color' (assoc :color color'))))

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

(defn- worker-not-ready-err?
  "True when an error from `<make-asset-url` is the db-worker hasn't-finished-
  booting transient (vs. a real failure like a missing file). Worth a longer
  retry window than other errors since the only thing to do is wait."
  [err]
  (string/includes? (str err) "not been initialized"))

;; Retry budgets. Worker-not-ready is a pure timing problem — the call will
;; succeed once the SharedWorker finishes booting — so spend a longer wallclock
;; window on it (~7.5s) at a tighter cadence. Real failures (missing file, etc.)
;; stay on the original 3×1s budget; further retries there don't change the
;; outcome and just delay surfacing the error icon.
(def ^:private worker-not-ready-max-retries 15)
(def ^:private worker-not-ready-delay-ms 500)

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
                                       ;; Worker-not-ready: retry the same ext on a tighter cadence
                                       ;; with a wider budget. Other errors fall through to next ext.
                                       (if (and (worker-not-ready-err? err)
                                                (< attempt worker-not-ready-max-retries))
                                         (js/setTimeout #(try-ext exts (inc attempt)) worker-not-ready-delay-ms)
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
                                   (let [worker-not-ready? (worker-not-ready-err? err)
                                         budget (if worker-not-ready? worker-not-ready-max-retries max-retries)
                                         next-delay (if worker-not-ready? worker-not-ready-delay-ms delay-ms)]
                                     (js/console.error "[DEBUG <load-asset-url!] FAILED" (pr-str {:uuid asset-uuid :attempt n :max budget :worker-not-ready? worker-not-ready? :load-id load-id :error (str err)}))
                                     (if (< n budget)
                                       (js/setTimeout #(attempt (inc n)) next-delay)
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
      ;; Broken/missing asset. Match the visual language of the "pick an image"
      ;; placeholder (icon.cljs:382-394) — bordered tile, transparent fill,
      ;; muted icon — but with a solid border (vs dashed) and a `photo-off`
      ;; glyph to signal "settled but broken" rather than "awaiting input".
      ;; Inner icon sized at 0.45 to match placeholder; the heavy filled
      ;; `bg-gray-04` look it replaced was visually loud at page-icon scale
      ;; (38px) and read as a real piece of chrome rather than a fallback.
      (let [inner (max 8 (int (* size 0.45)))
            inner-px (str inner "px")]
        [:span.ui__icon.image-icon.image-error
         (cond-> {:style {:display "inline-flex"
                          :align-items "center"
                          :justify-content "center"
                          :width (str size "px")
                          :height (str size "px")
                          :border "1px solid var(--rx-gray-07)"
                          :border-radius "5px"
                          :background "var(--rx-gray-03-alpha)"
                          :color "var(--lx-gray-11)"}
                  :title "Image not found - click to replace"}
           on-click-error (assoc :on-click on-click-error
                                 :class "cursor-pointer"))
         (shui/tabler-icon "photo-off" {:size inner
                                        :style {:width inner-px
                                                :height inner-px}})])

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
        shape (or (get avatar-data :shape) :circle)
        fb-type (or (get avatar-data :fallback-type) :letters)
        fb-icon (get avatar-data :fallback-icon)
        display-text (subs avatar-value 0 (min 3 (count avatar-value)))
        ;; Scale font-size with avatar size
        font-size (cond
                    (<= size 16) "8px"
                    (<= size 24) "10px"
                    (<= size 32) "12px"
                    :else "14px")
        icon-size (max 10 (int (* size 0.55)))
        fallback-style (avatar-fallback-style {:font-size font-size
                                               :bg explicit-bg
                                               :color explicit-color})]
    (shui/avatar
     {:style {:width size :height size}
      :data-shape (name shape)}
     ;; Image (shows when loaded, circular with cover fit)
     (when url
       (shui/avatar-image {:src url
                           :style {:object-fit "cover"}
                           :data-shape (name shape)}))
     ;; Fallback (shows while loading, on error, OR when there's no image
     ;; but the avatar still wants to render — Letters, Icon, or Emoji.
     (shui/avatar-fallback
      {:style fallback-style
       :data-shape (name shape)}
      (cond
        (and (= fb-type :icon) (not (string/blank? fb-icon)))
        (shui/tabler-icon fb-icon
                          {:size icon-size
                           :style {:color (:color fallback-style)}})

        (and (= fb-type :emoji) (not (string/blank? fb-icon)))
        [:em-emoji {:id fb-icon
                    :size icon-size
                    :style {:line-height 1}}]

        :else
        display-text)))))

(defn measure-text-width
  "Measure pixel width of text at given font-size using offscreen canvas."
  [text font-size-px]
  (let [ctx @*text-measure-ctx]
    (set! (.-font ctx)
          (str "500 " font-size-px "px Inter, sans-serif"))
    (.-width (.measureText ctx text))))

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

;; Forward declaration: defined near renderable-icon? below; used by `icon`
;; to defensively skip avatar/image asset rendering when the referenced
;; asset block has been deleted.
(declare asset-uuid->entity)

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

               ;; "Pick an image" placeholder shown during icon-picker hover
               ;; preview when the user navigates to the Custom-tab Image
               ;; button. Mirrors Logseq's universal "no icon yet, click to
               ;; add" affordance (plus inside a dashed rounded square),
               ;; signalling awaiting-input rather than a committed photo
               ;; icon. Sized to match the surrounding tabler icons.
               (and (map? normalized) (= :image-placeholder (:type normalized)))
               ;; Pin neutral grays explicitly (override the parent color
               ;; cascade). Image asset icons can't be tinted, so the
               ;; preview shouldn't promise a colored outcome the actual
               ;; commit won't deliver. Matches the Custom-tab Image tile
               ;; (custom-tab-cp:1920-1929) for visual continuity.
               ;;
               ;; Inline width/height on the inner SVG: the page-title's
               ;; CSS forces all svgs inside .ls-page-icon to 38x38,
               ;; ignoring the :size prop. Inline style outranks that
               ;; class selector and lets the plus actually shrink.
               (let [size (or (:size opts) 20)
                     inner (max 8 (int (* size 0.45)))
                     inner-px (str inner "px")]
                 [:span.ui__icon.image-placeholder-icon
                  {:style {:display "inline-flex"
                           :align-items "center"
                           :justify-content "center"
                           :width (str size "px")
                           :height (str size "px")
                           :border "1px dashed var(--rx-gray-08)"
                           :border-radius "5px"
                           :background "var(--rx-gray-03-alpha)"
                           :color "var(--lx-gray-11)"}}
                  (ui/icon "plus" {:size inner
                                   :style {:width inner-px
                                           :height inner-px}})])

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
                 (if (and (string? asset-uuid) (not (string/blank? asset-uuid)))
                   ;; Avatar with image — let avatar-image-cp resolve via the
                   ;; filesystem loader. Don't gate on a renderer-side
                   ;; `db/entity` check: assets hydrate lazily, so a direct
                   ;; navigation can find the entity missing while the file
                   ;; is on disk. The loader retries on transient failures
                   ;; and shui/avatar-fallback (initials) shows underneath
                   ;; until the image lands; if the asset is truly gone the
                   ;; initials persist as the natural error state.
                   (avatar-image-cp asset-uuid asset-type avatar-data opts)
                   ;; Text-only avatar (no image set). Renders either initials
                   ;; or a tabler icon depending on :fallback-type.
                   (let [size (or (:size opts) 20)
                         avatar-value (get avatar-data :value)
                         explicit-bg (get avatar-data :backgroundColor)
                         explicit-color (get avatar-data :color)
                         shape (or (get avatar-data :shape) :circle)
                         fb-type (or (get avatar-data :fallback-type) :letters)
                         fb-icon (get avatar-data :fallback-icon)
                         display-text (subs avatar-value 0 (min 3 (count avatar-value)))
                         ;; Scale font-size with avatar size. The earlier
                         ;; tier capped at 14px past 32px, which left the
                         ;; 38px page-icon and 56px customize-band preview
                         ;; reading as too-small text on too-big tiles.
                         ;; Past 32px we step proportionally (~38–40% of
                         ;; size) so the text fills the chip the way
                         ;; Notion / Linear / Slack avatars do.
                         font-size (cond
                                     (<= size 16) "8px"
                                     (<= size 24) "10px"
                                     (<= size 32) "12px"
                                     (<= size 40) "16px"
                                     (<= size 56) "22px"
                                     :else (str (int (* size 0.4)) "px"))
                         ;; Icon glyph scales to ~55% of the avatar's box.
                         icon-size (max 10 (int (* size 0.55)))
                         fallback-style (avatar-fallback-style {:font-size font-size
                                                                :bg explicit-bg
                                                                :color explicit-color})]
                     (shui/avatar
                      {:style {:width size :height size}
                       :data-shape (name shape)}
                      (shui/avatar-fallback
                       {:style fallback-style
                        :data-shape (name shape)}
                       (cond
                         (and (= fb-type :icon) (not (string/blank? fb-icon)))
                         ;; Icon fallback inherits the foreground color from
                         ;; avatar-fallback-style (which has already been
                         ;; contrast-adjusted against the muted background).
                         (shui/tabler-icon fb-icon
                                           {:size icon-size
                                            :style {:color (:color fallback-style)}})

                         (and (= fb-type :emoji) (not (string/blank? fb-icon)))
                         ;; Emoji fallback: emoji glyphs aren't tintable
                         ;; (they're full-color SVGs), so we don't pass
                         ;; the muted color through. `em-emoji` accepts
                         ;; `:size` directly (same prop emoji-mart's
                         ;; web component reads); matches the icon tier
                         ;; so emoji and tabler glyphs occupy the same
                         ;; footprint inside the avatar.
                         [:em-emoji {:id fb-icon
                                     :size icon-size
                                     :style {:line-height 1}}]

                         :else
                         display-text))))))

               ;; Image with asset — let image-icon-cp resolve via the filesystem
               ;; loader. Don't gate on a renderer-side `db/entity` check:
               ;; assets hydrate lazily into the renderer DataScript, so a
               ;; direct navigation to a page whose icon points at an asset
               ;; can find the entity missing while the file is on disk.
               ;; image-icon-cp retries the load on transient failures and
               ;; shows a `photo-off` icon if the file is truly gone.
               (and (map? normalized) (= :image (:type normalized))
                    (let [u (get-in normalized [:data :asset-uuid])]
                      (and (string? u) (not (string/blank? u)))))
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
        (let [c (or (get-in normalized [:data :color])
                    (some-> icon' :color))
              ;; Display-color: when a real hex is stored, lift contrast vs the
              ;; current page background to WCAG 3:1 (non-text UI threshold).
              ;; CSS-var values (Radix `var(--rx-...)`) are theme-aware
              ;; out-of-band and intentionally bypassed.
              page-bg (when (and c (string/starts-with? c "#"))
                        (colors/read-bg-var "--ls-primary-background-color"))
              display-c (if (and c (not= c "inherit")
                                 (string/starts-with? c "#")
                                 page-bg)
                          (colors/adjust-for-contrast c page-bg 3.0)
                          c)]
          [:span.inline-flex.items-center.ls-icon-color-wrap
           {:class (when (and c (not= c "inherit")) "icon-colored")
            :style {:color (or display-c "inherit")}} item])
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
                  ;; Inherit color + shape + fallback from the class default.
                  ;; normalize-icon downstream applies defaults for any field
                  ;; the class doesn't override.
                  (let [inherited (select-keys (:data default-icon)
                                               [:backgroundColor :color
                                                :shape :fallback-type :fallback-icon])]
                    (cond-> {:type :avatar
                             :data (merge inherited
                                          {:value (derive-avatar-initials (:block/title node-entity))})}
                      (:color inherited) (assoc :color (:color inherited)))))
        :text (when (:block/title node-entity)
                ;; Inherit color + alignment + mode from the class
                ;; default. `:mode` ("initials" | "abbreviated" |
                ;; "custom") drives per-instance derivation:
                ;;   initials   — derive 2-char initials from each
                ;;                instance's title (e.g. "M2")
                ;;   abbreviated— derive a short word-prefix per
                ;;                instance ("Math" for "Math 201")
                ;;   custom     — propagate the class's literal text
                ;;                verbatim (a constant, not a fn)
                ;; Without this, every inheriting row showed
                ;; `derive-initials` regardless of the class's chosen
                ;; style, making the Abbreviated/Custom options
                ;; appear broken at the row level.
                (let [inherited (select-keys (:data default-icon)
                                             [:color :alignment :mode])
                      mode (:mode inherited)
                      title (:block/title node-entity)
                      derived-value (cond
                                      (= mode "abbreviated")
                                      (or (derive-abbreviated title)
                                          (derive-initials title))

                                      (= mode "custom")
                                      (or (get-in default-icon [:data :value])
                                          (derive-initials title))

                                      :else
                                      (derive-initials title))]
                  (cond-> {:type :text
                           :data (merge inherited {:value derived-value})}
                    (:color inherited) (assoc :color (:color inherited)))))
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
        opts' (assoc opts :size effective-size)
        ;; Hover preview from icon-picker — overrides node's icon and/or
        ;; color while the user is hovering tiles in the picker. The state
        ;; can carry `:icon` (full normalized item override), `:color`
        ;; (color override), or both. `:property` scopes the preview so a
        ;; Default-Icon-scoped hover doesn't leak into surfaces that
        ;; render the page-icon (sidebar, cmdk, breadcrumb, etc.).
        ;; Defaults to `:logseq.property/icon` because that's what every
        ;; existing caller of this fn renders.
        preview-property (or (:property opts) :logseq.property/icon)
        preview (state/sub :ui/icon-hover-preview)
        preview-active? (and preview
                             (icon-preview-matches? preview (:db/id entity) preview-property))
        preview-icon (when preview-active? (:icon preview))
        ;; Preview color is only applied when the hover-preview state
        ;; carries an explicit `:color`. Without that guard, a shape- or
        ;; fallback-only hover (which omits `:color`) would clobber the
        ;; avatar's `:backgroundColor` to "inherit" and kill the chip.
        preview-color (when preview-active? (:color preview))
        effective-color (cond
                          preview-color preview-color
                          :else (or (:color node-icon) "inherit"))
        ;; Source icon for the preview overlay: either the previewed icon
        ;; (cross-type swap) or the committed node-icon. Then layer the
        ;; preview color into [:data :color] so the inner `icon` fn renders
        ;; with the preview color — its inline `style: color` would
        ;; otherwise win over our outer wrapper's cascade.
        ;;
        ;; For avatars: also override [:data :backgroundColor], since the
        ;; circle's bg-color is inline and doesn't inherit from `color`.
        base-icon (or preview-icon node-icon)
        effective-node-icon (cond-> base-icon
                              ;; Only mutate when there's an *explicit*
                              ;; preview color — non-color previews
                              ;; (shape, fallback) leave the icon's own
                              ;; colors intact.
                              (and preview-color (map? base-icon))
                              (-> (normalize-icon)
                                  (assoc :color preview-color)
                                  (assoc-in [:data :color] preview-color))

                              (and preview-color
                                   (map? base-icon)
                                   (= :avatar (:type (normalize-icon base-icon))))
                              (assoc-in [:data :backgroundColor] preview-color))
        ;; Lift contrast vs the page background to WCAG 3:1 (non-text UI
        ;; threshold) — same logic the inner `icon` fn applies when called
        ;; with `:color? true`. This wrapper is used by sidebar / right
        ;; panel / cmdk which don't pass `:color?`, so the adjustment must
        ;; happen here too. CSS-var values pass through unchanged.
        page-bg (when (and (string? effective-color)
                           (string/starts-with? effective-color "#"))
                  (colors/read-bg-var "--ls-primary-background-color"))
        display-color (if (and (string? effective-color)
                               (not= effective-color "inherit")
                               (string/starts-with? effective-color "#")
                               page-bg)
                        (colors/adjust-for-contrast effective-color page-bg 3.0)
                        effective-color)]
    (when-not (and (nil? preview-icon)
                   (or (string/blank? node-icon)
                       (and (contains? #{"letter-n" "file"} node-icon)
                            (:not-text-or-page? opts))))
      [:div.icon-cp-container.flex.items-center.justify-center
       {:style {:color display-color}
        :class (str (when photo-icon? "photo-icon")
                    (when (and effective-color (not= effective-color "inherit")) " icon-colored")
                    (when-let [c (:class opts)] (str " " c)))}
       (icon effective-node-icon opts')])))

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
    ;; Avatars get a small post-pass to ensure new fields (:shape,
    ;; :fallback-type, :fallback-icon) have defaults applied — legacy data
    ;; stored before those fields existed would otherwise bypass the
    ;; normalization branch below entirely.
    (and (map? v) (keyword? (:type v)) (contains? v :data))
    (if (= :avatar (:type v))
      (let [explicit-shape (or (get-in v [:data :shape]) (:shape v))
            fb-type (or (get-in v [:data :fallback-type]) (:fallback-type v))
            fb-icon (or (get-in v [:data :fallback-icon]) (:fallback-icon v))
            ;; A nil fb-type defaults to :letters. `:icon` and `:emoji`
            ;; both store their value in `:fallback-icon` (tabler name or
            ;; emoji shortcode) — without a non-blank value the fb is
            ;; unrenderable, so degrade back to `:letters` and let the
            ;; renderer rely on the invariant that `:icon`/`:emoji`
            ;; always carries a non-blank `:fallback-icon`.
            effective-fb-type (cond
                                (nil? fb-type) :letters
                                (and (#{:icon :emoji} fb-type)
                                     (string/blank? fb-icon)) :letters
                                :else fb-type)]
        (cond-> v
          (nil? explicit-shape) (assoc-in [:data :shape] :circle)
          (some? explicit-shape) (assoc-in [:data :shape] explicit-shape)
          true (assoc-in [:data :fallback-type] effective-fb-type)
          (and (#{:icon :emoji} effective-fb-type)
               (not (string/blank? fb-icon)))
          (assoc-in [:data :fallback-icon] fb-icon)))
      v)

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
                      asset-type (or (get-in v [:data :asset-type]) (:asset-type v))
                      ;; Shape: defaults to :circle for backward compat with avatars
                      ;; saved before the shape field existed.
                      shape (or (get-in v [:data :shape]) (:shape v) :circle)
                      ;; Fallback layer: rendered when no image is set.
                      ;; :letters → render the auto-derived initials.
                      ;; :icon    → render :fallback-icon (a tabler icon name).
                      ;; :emoji   → render :fallback-icon (an emoji shortcode).
                      ;; Default :letters; :icon/:emoji without a non-blank
                      ;; :fallback-icon degrade to :letters so the renderer
                      ;; never has to render an empty avatar.
                      fb-type (or (get-in v [:data :fallback-type]) (:fallback-type v))
                      fb-icon (or (get-in v [:data :fallback-icon]) (:fallback-icon v))
                      effective-fb-type (cond
                                          (nil? fb-type) :letters
                                          (and (#{:icon :emoji} fb-type)
                                               (string/blank? fb-icon)) :letters
                                          :else fb-type)]
                  {:type :avatar
                   :id (or id (str "avatar-" value))
                   :label (or label value)
                   :data (cond-> {:value value
                                  :backgroundColor backgroundColor
                                  :color color
                                  :shape shape
                                  :fallback-type effective-fb-type}
                           asset-uuid (assoc :asset-uuid asset-uuid)
                           asset-type (assoc :asset-type asset-type)
                           (and (#{:icon :emoji} effective-fb-type)
                                (not (string/blank? fb-icon)))
                           (assoc :fallback-icon fb-icon))})
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
        ;; Synthetic placeholder type used by the icon-picker hover preview
        ;; when the user navigates to the Custom-tab "Image" button. Has no
        ;; payload — the renderer in `icon` produces a self-contained plus-
        ;; in-dashed-square visual.
        :image-placeholder {:type :image-placeholder
                            :id (or id "image-placeholder")
                            :label "Pick an image"
                            :data {}}
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

(defn- asset-uuid->entity
  "Resolve an asset-uuid (string) to a block entity, or nil if the asset
   was deleted leaving a dangling reference in someone's icon data."
  [asset-uuid]
  (when (and (string? asset-uuid) (not (string/blank? asset-uuid)))
    (try
      (db/entity [:block/uuid (uuid asset-uuid)])
      (catch :default _ nil))))

(defn- heal-dangling-asset-icon
  "If icon-value references a deleted asset, return a healed icon-value.
   - :avatar → strip :asset-uuid/:asset-type, degrades to the text-only avatar
   - :image  → return nil (no text fallback; icon is effectively gone)
   Returns ::no-change if nothing to heal."
  [icon-value]
  (if-not (map? icon-value)
    ::no-change
    (let [asset-uuid (get-in icon-value [:data :asset-uuid])]
      (cond
        (not asset-uuid) ::no-change
        (asset-uuid->entity asset-uuid) ::no-change
        (= :avatar (:type icon-value))
        (update icon-value :data dissoc :asset-uuid :asset-type)
        :else nil))))

(defn renderable-icon?
  "True when icon-value would produce a visible element via `icon`. For :icon type
   this includes verifying that the underlying Tabler component actually exists,
   which catches stored values whose :id no longer resolves (e.g. data saved from a
   stale picker entry before the tabler-icons filter was added).

   For :image/:avatar we trust the presence of an asset-uuid string rather than
   probing the renderer-side entity: assets hydrate lazily, so a synchronous
   `db/entity` check races with cold loads (and would also flap the page-title
   'Add icon' button while the entity is still being fetched). The actual
   render path resolves via the filesystem loader and surfaces error states
   on real failure."
  [icon-value]
  (boolean
   (when-let [normalized (normalize-icon icon-value)]
     (case (:type normalized)
       :none false
       :emoji (not (string/blank? (get-in normalized [:data :value])))
       :icon (when-let [v (get-in normalized [:data :value])]
               (and (exists? js/tablerIcons)
                    (some? (gobj/get js/tablerIcons (str "Icon" (csk/->PascalCase v))))))
       :text (not (string/blank? (get-in normalized [:data :value])))
       :avatar (let [u (get-in normalized [:data :asset-uuid])]
                 (or (and (string? u) (not (string/blank? u)))
                     (not (string/blank? (get-in normalized [:data :value])))))
       :image (let [u (get-in normalized [:data :asset-uuid])]
                (and (string? u) (not (string/blank? u))))
       false))))

(defn get-image-assets
  "Get image assets from frontend Datascript (fast, but may be empty on cold start)"
  []
  (let [image-extensions (set (map name config/image-formats))
        results (db-utils/q '[:find ?uuid ?type ?title ?updated ?checksum ?source-url
                              :where
                              [?e :logseq.property.asset/type ?type]
                              [?e :logseq.property.asset/checksum ?checksum]
                              [?e :block/uuid ?uuid]
                              [(get-else $ ?e :block/title "") ?title]
                              [(get-else $ ?e :block/updated-at 0) ?updated]
                              [(get-else $ ?e :logseq.property.asset/source-url "") ?source-url]])]
    (->> results
         (filter (fn [[_uuid type _title _updated _checksum _source-url]]
                   (contains? image-extensions (some-> type string/lower-case))))
         (sort-by (fn [[_uuid _type _title updated _checksum _source-url]] updated) >)
         ;; Deduplicate by checksum — keep the most recently updated entry
         (medley/distinct-by (fn [[_uuid _type _title _updated checksum _source-url]] checksum))
         (map (fn [[uuid type title _updated checksum source-url]]
                (cond-> {:block/uuid uuid
                         :block/title (if (string/blank? title) (str uuid) title)
                         :logseq.property.asset/type type
                         :logseq.property.asset/checksum checksum}
                  (not (string/blank? source-url))
                  (assoc :logseq.property.asset/source-url source-url)))))))

(defn <get-image-assets
  "Async fetch image assets from DB worker (works on cold start).
   Returns a promise that resolves to a list of asset maps.
   Uses transact-db? false to avoid re-transacting deleted assets back into frontend."
  []
  (when-let [graph (state/get-current-repo)]
    (p/let [results (db-async/<q graph
                                 {:transact-db? false}
                                 '[:find (pull ?e [:block/uuid :block/title :logseq.property.asset/type :logseq.property.asset/checksum :logseq.property.asset/source-url :block/updated-at])
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

(defn- sniff-image-content-type
  "Detect image MIME type from the first bytes of an ArrayBuffer.
   Returns {:content-type String :kind :image|:html|:unknown :ext String?}.
   content-type is a string suitable for valid-image-content-type? and
   content-type->extension. :kind :html distinguishes HTML pages from
   unknown binary blobs so callers can surface a dedicated error."
  [^js array-buffer]
  (let [bytes     (js/Uint8Array. array-buffer)
        len       (.-length bytes)
        b         (fn [i] (when (< i len) (aget bytes i)))
        starts?   (fn [prefix]
                    (and (>= len (count prefix))
                         (every? (fn [[i v]] (= v (b i)))
                                 (map-indexed vector prefix))))
        text-head (when (pos? len)
                    (let [n       (min len 200)
                          ta      (js/Uint8Array. array-buffer 0 n)
                          decoder (js/TextDecoder. "utf-8" #js {:fatal false})]
                      (string/lower-case (.decode decoder ta))))
        trimmed   (some-> text-head string/triml)
        html?     (fn []
                    (and text-head
                         (or (re-find #"<!doctype\s+html" text-head)
                             (re-find #"<html[\s>]" text-head)
                             (re-find #"<head[\s>]" text-head)
                             (re-find #"<body[\s>]" text-head)
                             (string/starts-with? trimmed "<!--"))))
        svg?      (fn []
                    (and text-head
                         (or (re-find #"<\?xml" text-head)
                             (re-find #"<svg[\s>]" text-head))))]
    (cond
      (starts? [0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A])
      {:content-type "image/png" :kind :image :ext "png"}

      (starts? [0xFF 0xD8 0xFF])
      {:content-type "image/jpeg" :kind :image :ext "jpg"}

      (or (starts? [0x47 0x49 0x46 0x38 0x37 0x61])
          (starts? [0x47 0x49 0x46 0x38 0x39 0x61]))
      {:content-type "image/gif" :kind :image :ext "gif"}

      (and (starts? [0x52 0x49 0x46 0x46])
           (= 0x57 (b 8)) (= 0x45 (b 9)) (= 0x42 (b 10)) (= 0x50 (b 11)))
      {:content-type "image/webp" :kind :image :ext "webp"}

      (starts? [0x42 0x4D])
      {:content-type "image/bmp" :kind :image :ext "bmp"}

      (and (= 0x66 (b 4)) (= 0x74 (b 5)) (= 0x79 (b 6)) (= 0x70 (b 7))
           (contains? #{"heic" "heix" "hevc" "hevx" "heim" "heis" "mif1" "msf1"}
                      (str (char (or (b 8) 0)) (char (or (b 9) 0))
                           (char (or (b 10) 0)) (char (or (b 11) 0)))))
      {:content-type "image/heic" :kind :image :ext "heic"}

      (svg?)  {:content-type "image/svg+xml" :kind :image :ext "svg"}
      (html?) {:content-type "text/html" :kind :html}
      :else   {:content-type nil :kind :unknown})))

(defn- read-from-event
  "Synchronously extract an image file or text URL from a ClipboardEvent.
   Returns a promise of {:kind :image :file File} | {:kind :url :url String} | nil.
   Note: the promise may resolve synchronously for image-file events."
  [^js event]
  (if (nil? event)
    (p/resolved nil)
    (let [cd (some-> event .-clipboardData)]
      (if (nil? cd)
        (p/resolved nil)
        (let [files (.-files cd)
              items (.-items cd)]
          (cond
            (and files (pos? (.-length files)))
            (if-let [f (aget files 0)]
              (p/resolved {:kind :image :file f})
              (p/resolved nil))

            :else
            (let [n (if items (.-length items) 0)
                  indices (range n)
                  file-item (some (fn [i]
                                    (let [it (aget items i)]
                                      (when (and it (= "file" (.-kind it)))
                                        (when-let [f (.getAsFile it)]
                                          {:file f}))))
                                  indices)]
              (if file-item
                (p/resolved {:kind :image :file (:file file-item)})
                (let [text-item (some (fn [i]
                                        (let [it (aget items i)]
                                          (when (and it
                                                     (= "string" (.-kind it))
                                                     (= "text/plain" (.-type it)))
                                            it)))
                                      indices)]
                  (if text-item
                    (-> (p/create
                         (fn [resolve _reject]
                           (.getAsString ^js text-item
                                         (fn [s] (resolve s)))))
                        (p/then (fn [s]
                                  (let [trimmed (some-> s string/trim)]
                                    (if (and trimmed
                                             (re-matches #"^https?://\S+$" trimmed))
                                      {:kind :url :url trimmed}
                                      nil)))))
                    (p/resolved nil)))))))))))

(defn- <download-url-asset-via-fetch
  "Browser path: uses js/fetch. Subject to CORS."
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
                                             :size (.-byteLength buffer)
                                             :kind :image})))))
                    (reject (ex-info "Failed to download"
                                     {:kind :http-status :status (.-status response) :url url})))))
         (.catch (fn [^js err]
                   (js/console.error "Download via fetch failed for" url err)
                   ;; In a browser build, TypeError from a CORS-mode fetch almost always
                   ;; means the target blocked cross-origin access. We can't distinguish
                   ;; true network failures from CORS rejections here — the browser
                   ;; deliberately obscures it for security. Treat as :cors in the browser.
                   (let [cors? (instance? js/TypeError err)]
                     (reject (ex-info (if cors? "Cross-origin blocked" "Network error")
                                      {:kind (if cors? :cors :network)
                                       :error (some-> err .-message)
                                       :url url})))))))))

(defn- <download-url-asset-via-ipc
  "Electron path: uses main-process IPC (node-fetch, no CORS).
   Consumes structured {:status :ok :headers :data} response; classifies
   failures by HTTP status and content. Sniffs magic bytes to distinguish
   HTML challenge pages from real images when headers are unreliable."
  [url]
  (-> (ipc/ipc :httpRequest (str (random-uuid))
               #js {:url url
                    :method "GET"
                    :returnType "arraybuffer"
                    :structured true})
      (p/then (fn [^js response]
                (let [status (.-status response)
                      headers (.-headers response)
                      header-content-type (some-> headers (gobj/get "content-type"))
                      data (.-data response)
                      byte-length (if (and data (.-byteLength data))
                                    (.-byteLength data) 0)]
                  (cond
                    (not (<= 200 status 299))
                    (throw (ex-info "HTTP error"
                                    {:kind :http-status
                                     :status status
                                     :content-type header-content-type
                                     :url url}))

                    (zero? byte-length)
                    (throw (ex-info "Empty response"
                                    {:kind :empty
                                     :status status
                                     :url url}))

                    :else
                    (let [sniffed (sniff-image-content-type data)
                          sniff-kind (:kind sniffed)
                          ;; Bytes are authoritative; header is fallback.
                          final-kind (cond
                                       (= :image sniff-kind) :image
                                       (= :html sniff-kind) :html
                                       (and header-content-type
                                            (string/starts-with?
                                             header-content-type "text/html")) :html
                                       (and header-content-type
                                            (string/starts-with?
                                             header-content-type "image/")) :image
                                       :else :unknown)
                          final-content-type (or (:content-type sniffed)
                                                 header-content-type)]
                      {:data data
                       :content-type final-content-type
                       :size byte-length
                       :kind final-kind
                       :status status})))))
      (p/catch (fn [^js err]
                 (js/console.error "Download via IPC failed for" url err)
                 (if (ex-data err)
                   (throw err)
                   (throw (ex-info "Network error"
                                   {:kind :network
                                    :error (some-> err .-message)
                                    :url url})))))))

(defn- <download-url-asset
  "Download image from URL. Returns promise with {:data (ArrayBuffer) :content-type :size :kind}.
   :kind is :image (ok), :html (page, not image), or :unknown (binary, non-image)."
  [url]
  (if (util/electron?)
    (<download-url-asset-via-ipc url)
    (<download-url-asset-via-fetch url)))

;; ============================================================================
;; Asset Saving
;; ============================================================================

(defn- source-meta->properties
  "Build the property map for source-meta keys to write on the asset entity.
   Returns nil when no meta was supplied."
  [{:keys [source-url source-name license attribution]}]
  (let [pairs (cond-> {}
                (and source-url (not (string/blank? source-url)))
                (assoc :logseq.property.asset/source-url source-url)
                (and source-name (not (string/blank? source-name)))
                (assoc :logseq.property.asset/source-name source-name)
                (and license (not (string/blank? license)))
                (assoc :logseq.property.asset/license license)
                (and attribution (not (string/blank? attribution)))
                (assoc :logseq.property.asset/attribution attribution))]
    (when (seq pairs) pairs)))

(defn save-image-asset!
  "Save an image file as an asset using api-insert-new-block! approach.
   Creates the asset as a child of the Asset class page (like tag tables do),
   avoiding journal entries.
   Optional source-meta map: {:source-url, :source-name, :license, :attribution}
   is persisted as additional asset properties when provided."
  ([repo file] (save-image-asset! repo file nil))
  ([repo ^js file source-meta]
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
               block-id (ldb/new-block-id)
               extra-props (source-meta->properties source-meta)]
         (js/console.log "[DEBUG save-image-asset!] creating"
                         (pr-str {:block-id block-id :ext ext :size size
                                  :repo-dir repo-dir :asset-dir asset-dir-rpath
                                  :write-path (str asset-dir-rpath "/" block-id "." ext)
                                  :source-meta? (some? extra-props)}))
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
                           :properties (merge {:block/tags (:db/id asset-class)
                                               :logseq.property.asset/type ext
                                               :logseq.property.asset/checksum checksum
                                               :logseq.property.asset/size size}
                                              extra-props)
                           :edit-block? false})]
             (let [entity (db/entity [:block/uuid (:block/uuid block)])]
               (js/console.log "[DEBUG save-image-asset!] done"
                               (pr-str {:block-uuid (str (:block/uuid block))
                                        :entity-found? (some? entity)
                                        :entity-type (:logseq.property.asset/type entity)}))
               entity))))))))

(defn <save-url-asset!
  "Download image from URL and save as asset. Returns promise with asset entity.
   Optional source-meta map propagates attribution metadata to the asset entity."
  ([repo url asset-name] (<save-url-asset! repo url asset-name nil))
  ([repo url asset-name source-meta]
   (p/let [{:keys [data content-type size kind]} (<download-url-asset url)]
     ;; Validate kind / content-type
     (cond
       (= :html kind)
       (throw (ex-info "URL is a webpage" {:kind :html-page :content-type content-type}))

       (= :unknown kind)
       (throw (ex-info "Unknown content type" {:kind :unknown :content-type content-type}))

       (not (valid-image-content-type? content-type))
       (throw (ex-info "Not an image" {:kind :not-image :content-type content-type}))

       (and size (> size max-url-asset-size))
       (throw (ex-info "File too large" {:kind :too-large :size size :max max-url-asset-size})))
     ;; Create a File object from the ArrayBuffer
     (let [ext (or (content-type->extension content-type) "png")
           filename (str asset-name "." ext)
           blob (js/Blob. #js [data] #js {:type content-type})
           file (js/File. #js [blob] filename #js {:type content-type})]
       ;; Delegate to existing save function
       (save-image-asset! repo file source-meta)))))

;; ============================================================================
;; Web Image Search (Wikipedia Commons)
;; ============================================================================

;; The legacy "Always add without asking" preference is meaningless now that
;; clicks commit directly. Drop the lingering localStorage key once per app
;; load so it doesn't sit around as a footgun for future debugging.
(defonce ^:private web-image-skip-confirm-cleanup
  (try (storage/remove "ls-web-image-skip-confirm") (catch :default _ nil)))

(def ^:private license-name->spdx
  "Static map of Commons LicenseShortName values to SPDX identifiers."
  {"CC0" "CC0-1.0"
   "CC0 1.0" "CC0-1.0"
   "CC BY 1.0" "CC-BY-1.0"
   "CC BY 2.0" "CC-BY-2.0"
   "CC BY 2.5" "CC-BY-2.5"
   "CC BY 3.0" "CC-BY-3.0"
   "CC BY 4.0" "CC-BY-4.0"
   "CC BY-SA 1.0" "CC-BY-SA-1.0"
   "CC BY-SA 2.0" "CC-BY-SA-2.0"
   "CC BY-SA 2.5" "CC-BY-SA-2.5"
   "CC BY-SA 3.0" "CC-BY-SA-3.0"
   "CC BY-SA 4.0" "CC-BY-SA-4.0"
   "CC BY-NC 3.0" "CC-BY-NC-3.0"
   "CC BY-NC 4.0" "CC-BY-NC-4.0"
   "CC BY-NC-SA 3.0" "CC-BY-NC-SA-3.0"
   "CC BY-NC-SA 4.0" "CC-BY-NC-SA-4.0"
   "GFDL" "GFDL-1.3-or-later"
   "Public domain" "Public-Domain"})

(defn- license->spdx
  "Normalize a Commons LicenseShortName to an SPDX-style identifier.
   Falls back to space→dash replacement for unknown values."
  [license]
  (when (and license (not (string/blank? license)))
    (or (license-name->spdx license)
        ;; Fallback: trim, replace internal spaces with dashes
        (-> license string/trim (string/replace #"\s+" "-")))))

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

(defn- strip-html
  "Strip HTML tags and decode common entities from an extmetadata string.
   Wikipedia Commons returns Artist/Credit fields as wikitext-rendered HTML."
  [s]
  (when (and s (string? s))
    (-> s
        (string/replace #"<[^>]+>" "")
        (string/replace #"&amp;" "&")
        (string/replace #"&lt;" "<")
        (string/replace #"&gt;" ">")
        (string/replace #"&quot;" "\"")
        (string/replace #"&#39;" "'")
        (string/replace #"&nbsp;" " ")
        string/trim)))

(defn- source-name-for
  "Map source keyword to display name."
  [source]
  (case source
    :wikipedia "Wikipedia"
    :wikipedia-commons "Wikimedia Commons"
    "Web"))

(defn- build-attribution
  "Pre-render a TASL credit string. Returns nil when there's nothing useful
   to attribute (e.g. Wikipedia PageImages with no metadata)."
  [{:keys [title author source license]}]
  (let [source-display (source-name-for source)
        has-title? (and title (not (string/blank? title)))]
    (cond
      (and has-title? author license)
      (str title " by " author " (" source-display ", " license ")")

      (and has-title? author)
      (str title " by " author " (" source-display ")")

      (and has-title? license)
      (str title " (" source-display ", " license ")")

      has-title?
      (str title " (" source-display ")")

      :else nil)))

(defn- <search-wikipedia-image
  "Fetch the main/best image for a Wikipedia article via PageImages API.
   Returns a promise resolving to one of:
     {:status :ok :image image-or-nil}  — request succeeded; image may be nil
     {:status :error}                    — network/fetch failed"
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
                      (resolve {:status :error}))))
           (.then (fn [data]
                    (when data
                      (let [pages (some-> data
                                          (gobj/getValueByKeys "query" "pages")
                                          js->clj)
                            page (first (vals pages))]
                        (if-let [original (get page "original")]
                          (resolve {:status :ok
                                    :image {:url (get original "source")
                                            :thumb-url (get-in page ["thumbnail" "source"])
                                            :title query
                                            :source :wikipedia
                                            :license nil ; PageImages doesn't return license
                                            :license-desc nil
                                            :author nil
                                            :source-url (str "https://en.wikipedia.org/wiki/"
                                                             (js/encodeURIComponent query))}})
                          (resolve {:status :ok :image nil}))))))
           (.catch (fn [_err]
                     (resolve {:status :error}))))))))

(defn- <search-commons-images
  "Search Wikimedia Commons for images matching query.
   Returns a promise resolving to one of:
     {:status :ok :images [...]}  — request succeeded; vector may be empty
     {:status :error}              — network/fetch failed"
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
                    "&iiextmetadatafilter=Artist|Credit|LicenseShortName|LicenseUrl|UsageTerms"
                    "&iiurlwidth=200"
                    "&format=json"
                    "&origin=*")]
       (-> (js/fetch url #js {:method "GET"
                              :mode "cors"
                              :credentials "omit"})
           (.then (fn [^js response]
                    (if (.-ok response)
                      (.json response)
                      (resolve {:status :error}))))
           (.then (fn [data]
                    (when data
                      (let [pages (some-> data
                                          (gobj/getValueByKeys "query" "pages")
                                          js->clj
                                          vals)]
                        (resolve
                         {:status :ok
                          :images
                          (->> pages
                               (map (fn [page]
                                      (let [imageinfo (first (get page "imageinfo"))
                                            ext (get imageinfo "extmetadata")
                                            license-raw (get-in ext ["LicenseShortName" "value"])
                                            license-spdx (license->spdx license-raw)
                                            artist-html (or (get-in ext ["Artist" "value"])
                                                            (get-in ext ["Credit" "value"]))
                                            author (strip-html artist-html)
                                            title (-> (get page "title" "")
                                                      (string/replace #"^File:" "")
                                                      (string/replace #"\.[^.]+$" ""))]
                                        {:url (get imageinfo "url")
                                         :thumb-url (get imageinfo "thumburl")
                                         :title title
                                         :source :wikipedia-commons
                                         :license license-spdx
                                         :license-desc (license->description license-raw)
                                         :author (when-not (string/blank? author) author)
                                         :source-url (get imageinfo "descriptionurl")})))
                               (filter :url)
                               vec)})))))
           (.catch (fn [_err]
                     (resolve {:status :error}))))))))

(defn- <search-web-images
  "Combined web image search. Returns up to 5 images from Wikipedia + Commons.
   Wikipedia PageImages result is prioritized (slot 1), Commons fills remaining.
   Returns a promise resolving to {:images [...] :network-error? boolean}.
   network-error? is true only when BOTH inner searches failed; partial
   network failure is silent (we still surface whatever succeeded)."
  [query]
  (when-not (string/blank? query)
    (p/let [;; Fire both requests in parallel
            [wiki-result commons-result] (p/all [(<search-wikipedia-image query)
                                                 (<search-commons-images query 5)])
            wiki-error? (= :error (:status wiki-result))
            commons-error? (= :error (:status commons-result))
            wiki-image (when-not wiki-error? (:image wiki-result))
            commons-images (if commons-error? [] (:images commons-result))]
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
        {:images (vec (take 5 combined))
         :network-error? (and wiki-error? commons-error?)}))))

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
                      ;; @tabler/icons-react exports icon components (IconFoo) alongside
                      ;; utility functions (e.g. createReactComponent). Drop anything that
                      ;; isn't an icon component — otherwise they surface as phantom entries
                      ;; in search, render empty, and corrupt the icon property when picked.
                      (filter #(string/starts-with? (name %) "Icon"))
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
  [icon-item {:keys [on-chosen hover on-tile-hover! highlighted-id ghost-highlighted-id wave]}]
  (let [icon-id (get-in icon-item [:data :value])
        icon-name (or (:label icon-item) icon-id)
        color (get-in icon-item [:data :color])
        icon-id' (when icon-id (cond-> icon-id (string? icon-id) (string/replace " " "")))
        my-id (:id icon-item)
        item-shape (cond-> {:type :tabler-icon
                            :id icon-id'
                            :value icon-id'}
                     color (assoc :color color))]
    [:button.w-9.h-9.transition-opacity
     (when icon-id'
       {:key icon-id'
        :tabIndex "-1"
        :data-item-id my-id
        :class (cond
                 (= my-id highlighted-id) "is-highlighted"
                 (= my-id ghost-highlighted-id) "is-ghost-highlighted")
        :style (when wave {"--r" (:r wave) "--c" (:c wave)})
        :title icon-name
        :on-click (fn [e] (on-chosen e item-shape))
        :on-mouse-over (fn []
                         (some-> hover (reset! item-shape))
                         (some-> on-tile-hover! (apply [item-shape])))
        :on-mouse-out #()})
     (when icon-id'
       (ui/icon icon-id' {:size 24}))]))

(rum/defc emoji-cp < rum/static
  [icon-item {:keys [on-chosen hover on-tile-hover! highlighted-id ghost-highlighted-id wave]}]
  (let [emoji-id (get-in icon-item [:data :value])
        emoji-name (or (:label icon-item) emoji-id)
        my-id (:id icon-item)
        item-shape {:type :emoji :id emoji-id :name emoji-name}]
    [:button.text-2xl.w-9.h-9.transition-opacity
     {:tabIndex "-1"
      :data-item-id my-id
      :class (cond
               (= my-id highlighted-id) "is-highlighted"
               (= my-id ghost-highlighted-id) "is-ghost-highlighted")
      :style (when wave {"--r" (:r wave) "--c" (:c wave)})
      :title emoji-name
      :on-click (fn [e] (on-chosen e item-shape))
      :on-mouse-over (fn []
                       (some-> hover (reset! item-shape))
                       (some-> on-tile-hover! (apply [item-shape])))
      :on-mouse-out #()}
     [:em-emoji {:id emoji-id
                 :style {:line-height 1}}]]))

(rum/defc text-cp < rum/static
  [icon-item {:keys [on-chosen hover on-tile-hover! highlighted-id ghost-highlighted-id wave]}]
  (let [text-value (get-in icon-item [:data :value])
        text-color (get-in icon-item [:data :color])
        my-id (:id icon-item)
        display-text (if (> (count text-value) 8)
                       (subs text-value 0 8)
                       text-value)
        item-shape {:type :text
                    :data (cond-> {:value text-value}
                            text-color (assoc :color text-color))}]
    [:button.w-9.h-9.transition-opacity.text-sm.font-medium
     {:tabIndex "-1"
      :data-item-id my-id
      :class (cond
               (= my-id highlighted-id) "is-highlighted"
               (= my-id ghost-highlighted-id) "is-ghost-highlighted")
      :style (when wave {"--r" (:r wave) "--c" (:c wave)})
      :title text-value
      :on-click (fn [e] (on-chosen e item-shape))
      :on-mouse-over (fn []
                       (some-> hover (reset! item-shape))
                       (some-> on-tile-hover! (apply [item-shape])))
      :on-mouse-out #()}
     display-text]))

(rum/defc avatar-cp < rum/static
  [icon-item {:keys [on-chosen hover on-tile-hover! highlighted-id ghost-highlighted-id wave]}]
  (let [avatar-value (get-in icon-item [:data :value])
        backgroundColor (or (get-in icon-item [:data :backgroundColor])
                            (colors/variable :gray :09))
        color (or (get-in icon-item [:data :color])
                  (colors/variable :gray :09))
        my-id (:id icon-item)
        display-text (subs avatar-value 0 (min 3 (count avatar-value)))
        item-shape {:type :avatar
                    :data {:value avatar-value
                           :backgroundColor backgroundColor
                           :color color}}]
    [:button.w-9.h-9.transition-opacity.flex.items-center.justify-center
     {:tabIndex "-1"
      :data-item-id my-id
      :title avatar-value
      :style (when wave {"--r" (:r wave) "--c" (:c wave)})
      :class (str "p-0 border-0 bg-transparent cursor-pointer"
                  (cond
                    (= my-id highlighted-id) " is-highlighted"
                    (= my-id ghost-highlighted-id) " is-ghost-highlighted"))
      :on-click (fn [e] (on-chosen e item-shape))
      :on-mouse-over (fn []
                       (some-> hover (reset! item-shape))
                       (some-> on-tile-hover! (apply [item-shape])))
      :on-mouse-out #()}
     (shui/avatar
      {:class "w-7 h-7"}
      (shui/avatar-fallback
       {:style (avatar-fallback-style {:font-size "12px"
                                       :bg backgroundColor
                                       :color color})}
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
                                        (vec (map-indexed
                                              (fn [c-idx item]
                                                (render-fn item (assoc opts :wave {:r idx :c c-idx})))
                                              icons)))))}

              searching?
              (assoc :custom-scroll-parent (some-> (rum/deref *el-ref) (.closest ".bd-scroll"))))))
         [:div.its
          (map-indexed
           (fn [i item]
             (render-fn item (assoc opts :wave {:r (quot i 9) :c (mod i 9)})))
           icon-items)]))]))

(rum/defc emojis-cp < rum/static
  [emojis* opts]
  (let [icon-items (map (fn [emoji]
                          {:type :emoji
                           :id (:id emoji)
                           :label (or (:name emoji) (:id emoji))
                           :data {:value (:id emoji)}})
                        emojis*)]
    (pane-section "Emojis" icon-items (assoc opts :show-header? false))))

(rum/defc icons-cp < rum/static
  [icons opts]
  (let [icon-items (map (fn [icon-name]
                          {:type :icon
                           :id (str "icon-" icon-name)
                           :label icon-name
                           :data {:value icon-name}})
                        icons)]
    (pane-section "Icons" icon-items (assoc opts :show-header? false))))

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
  (let [v2-items (storage/get :ui/ls-icons-used-v2)
        items (if (seq v2-items)
                v2-items
                ;; Migrate from legacy format
                (let [legacy-items (storage/get :ui/ls-icons-used)]
                  (if (seq legacy-items)
                    (let [normalized (map normalize-icon legacy-items)]
                      (storage/set :ui/ls-icons-used-v2 normalized)
                      normalized)
                    [])))]
    ;; Drop entries that no longer resolve (e.g. residue from the phantom
    ;; tabler-icons-react utility exports that used to appear in search).
    (filter renderable-icon? items)))

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

(rum/defc custom-tab-cp < rum/reactive
  "Combined tab showing Text, Avatar, and Image options side by side"
  [*q page-title *color *view *asset-picker-initial-mode icon-value opts]
  (let [query @*q
        ;; Text item
        text-value (if (string/blank? query)
                     (let [title (or page-title
                                     (some-> (state/get-current-page)
                                             (db/get-page)
                                             (:block/title)))]
                       (derive-initials title))
                     (subs query 0 (min 8 (count query))))
        ;; Live color preview during hover/keyboard nav over color
        ;; swatches in the picker's color popover. Without this, the
        ;; page-title icon updates live (it reads `:ui/icon-hover-preview`
        ;; via `get-node-icon-cp`) while the Text/Avatar tiles in the
        ;; Custom tab stay locked to the committed color — a confusing
        ;; mismatch the user can hit mid-pick. Same scope-match logic
        ;; the asset-picker tile uses (db-id + property) so a Default
        ;; Icon picker doesn't bleed previews into a sibling page-title
        ;; picker on the same entity.
        preview-target-db-id (:preview-target-db-id opts)
        preview-target-db-ids (:preview-target-db-ids opts)
        scope-property (or (:property opts) :logseq.property/icon)
        hover-preview-state (state/sub :ui/icon-hover-preview)
        hover-color-match? (and hover-preview-state
                                (icon-preview-matches? hover-preview-state preview-target-db-id scope-property))
        hover-color (when hover-color-match?
                      (let [c (:color hover-preview-state)]
                        (when (and c (not (string/blank? c)) (not= c "inherit"))
                          c)))
        committed-color (when-not (string/blank? @*color) @*color)
        ;; Hover wins over committed so the tiles tint live; on
        ;; mouse-leave the hover-preview clears and the committed
        ;; color re-emerges.
        selected-color (or hover-color committed-color)
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
        on-chosen (:on-chosen opts)
        highlighted-id (:highlighted-id opts)
        on-tile-hover! (:on-tile-hover! opts)
        ;; In default-icon mode (used by tag class default-icon row), Text and
        ;; Image tiles commit immediately rather than drilling into sub-pickers.
        ;; Avatar still opens the asset-picker since avatars need an image.
        default-icon? (:default-icon? opts)
        ;; Mouse-hover preview broadcast: pass the synthesized preview item
        ;; the page-icon should render for each button. Keyboard hover
        ;; broadcasts `:custom-*` markers and relies on icon-search's
        ;; translation; here we pass the resolved item directly.
        image-placeholder-item {:type :image-placeholder :id "image-placeholder"}]
    [:div.custom-tab-content
     ;; Text option
     (when text-item
       [:button.custom-tab-item
        {:data-item-id "custom-text"
         :tabIndex "-1"
         :class (when (= "custom-text" highlighted-id) "is-highlighted")
         :on-click (if default-icon?
                     #(when on-chosen (on-chosen % text-item))
                     #(reset! *view :text-picker))
         :on-mouse-over (fn [] (some-> on-tile-hover! (apply [text-item])))}
        [:div.custom-tab-item-preview {:aria-hidden "true"}
         (icon text-item {:size 32})]
        [:span.custom-tab-item-label "Text"]])

     ;; Avatar option. In page-icon context: commits the synthesized initials
     ;; avatar immediately and lands on the asset-picker's Avatar tab so the
     ;; user can pick a face image. In default-icon (class) context: commits
     ;; only the type-without-image; each instance auto-derives its own
     ;; initials from its own title via get-node-icon, so binding a specific
     ;; face would be the wrong shape for the class default.
     (when avatar-item
       [:button.custom-tab-item
        {:data-item-id "custom-avatar"
         :tabIndex "-1"
         :class (when (= "custom-avatar" highlighted-id) "is-highlighted")
         :on-click (if default-icon?
                     #(when on-chosen (on-chosen % avatar-item))
                     (fn [e]
                       (when on-chosen (on-chosen e avatar-item true))
                       (reset! *asset-picker-initial-mode :avatar)
                       (reset! *view :asset-picker)))
         :on-mouse-over (fn [] (some-> on-tile-hover! (apply [avatar-item])))}
        [:div.custom-tab-item-preview {:aria-hidden "true"}
         (icon avatar-item {:size 32})]
        [:span.custom-tab-item-label "Avatar"]])

     ;; Image option — commits the placeholder icon immediately so the page
     ;; icon stays as the plus+dashed placeholder while the asset-picker
     ;; opens. Picking an image inside the asset-picker replaces the
     ;; placeholder; backing out keeps it.
     [:button.custom-tab-item
      {:data-item-id "custom-image"
       :tabIndex "-1"
       :class (when (= "custom-image" highlighted-id) "is-highlighted")
       :on-click (if default-icon?
                   ;; Default-icon context: commit placeholder and close.
                   ;; Per-instance images are auto-derived elsewhere.
                   (fn [e] (when on-chosen (on-chosen e image-placeholder-item)))
                   (fn [e]
                     (when on-chosen (on-chosen e image-placeholder-item true))
                     (reset! *asset-picker-initial-mode :image)
                     (reset! *view :asset-picker)))
       :on-mouse-over (fn [] (some-> on-tile-hover! (apply [image-placeholder-item])))}
      [:div.custom-tab-item-preview {:aria-hidden "true"}
       [:span.image-tile-placeholder
        {:style {:width 32
                 :height 32
                 :border "1px dashed var(--rx-gray-08)"
                 :border-radius "3px"
                 :display "flex"
                 :align-items "center"
                 :justify-content "center"
                 :background "var(--rx-gray-03-alpha)"}}
        (shui/tabler-icon "photo" {:size 20 :style {:color "var(--lx-gray-11)"}})]]
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
  [state asset {:keys [on-chosen avatar-context selected? item-id highlighted? ghost-highlighted?]}]
  (let [url @(::url state)
        error? @(::error state)
        asset-type (:logseq.property.asset/type asset)
        asset-uuid (:block/uuid asset)
        asset-title (or (:block/title asset) (str asset-uuid))
        avatar-mode? (some? avatar-context)]
    [:button.image-asset-item
     {:title asset-title
      :data-item-id item-id
      :class (util/classnames [{:avatar-mode avatar-mode?
                                :selected selected?
                                :ghost-asset error?
                                :is-highlighted highlighted?
                                :is-ghost-highlighted ghost-highlighted?}])
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

(rum/defc web-image-card-content
  "Pure-render preview block: blurred-bg + sharp overlay + maximize button +
   title + source · license + license badge. Used as the tooltip content for
   web-image tiles. No buttons, no checkbox — clicking the tile commits."
  [{:keys [url thumb-url title license license-desc source]}]
  (let [source-text (str (case source
                           :wikipedia "From: Wikipedia"
                           :wikipedia-commons "From: Wikipedia Commons"
                           "From: Web")
                         (when license (str " · " license)))
        display-url (or thumb-url url)
        use-blur? (should-use-blur-bg? display-url)]
    [:div.web-image-card
     [:div.preview-image
      (when use-blur?
        [:img.blur-bg {:src display-url :alt ""}])
      [:img.preview-img {:src display-url
                         :alt (str title " from " (case source
                                                    :wikipedia "Wikipedia"
                                                    :wikipedia-commons "Wikipedia Commons"
                                                    "Web"))}]
      [:button.maximize-btn
       {:on-pointer-down (fn [e]
                           ;; Stop the click bubbling to the underlying tile.
                           ;; Without this, opening the maximize popover would
                           ;; also commit the image to the page-icon.
                           (.stopPropagation e))
        :on-click (fn [e]
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
     [:div.content-wrapper
      [:div.image-info
       [:div.image-title (or title "Web image")]
       [:div.image-source {:style {:color "var(--lx-gray-11)"}} source-text]
       (when license-desc
         [:div.license-badge license-desc])]]]))

(rum/defc web-image-item
  "Renders a single web image thumbnail with external indicator and rich
   hover card. Hover (or keyboard focus) reveals title + source + license
   + larger preview + maximize affordance. Click commits."
  [{:keys [url thumb-url title license license-desc source] :as web-image}
   {:keys [on-click avatar-mode? item-id highlighted? ghost-highlighted? saved?]}]
  (let [display-url (or thumb-url url)
        ;; Carry full info through the trigger button's aria-label so screen-
        ;; reader users get title + license + source without entering the card.
        ;; When the asset is already in the user's library, lead the label with
        ;; "Saved:" so AT users get the same signal the green badge gives
        ;; sighted users.
        aria (str (if saved? "Saved: " "Add image: ")
                  (or title "Web image")
                  (when license (str ", " license))
                  (when license-desc
                    (when-not license (str ", " license-desc)))
                  ", from "
                  (case source
                    :wikipedia "Wikipedia"
                    :wikipedia-commons "Wikimedia Commons"
                    "the web"))]
    (shui/tooltip-provider
     ;; 400ms first-hover delay matches NN/g rich-tooltip guidance and the
     ;; existing color-picker hover timings; 100ms on subsequent hovers gives
     ;; instant swap when arrowing/hovering between sibling tiles.
     {:delay-duration 400 :skip-delay-duration 100}
     (shui/tooltip
      (shui/tooltip-trigger
       {:as-child true}
       [:button.web-image-item
        {:data-item-id item-id
         :aria-label aria
         :class (util/classnames [{:avatar-mode avatar-mode?
                                   :is-highlighted highlighted?
                                   :is-ghost-highlighted ghost-highlighted?}])
         :on-click (fn [e] (on-click e web-image))}
        (if display-url
          [:img {:src display-url :loading "lazy" :alt ""}]
          [:div.bg-gray-04.animate-pulse])
        ;; Corner badge. Default = globe (web provenance). When this image is
        ;; already saved as a local asset (matched by source-url), swap to a
        ;; green check so the user sees at a glance which results they already
        ;; have. Click semantics on the parent route saved tiles to the
        ;; existing asset instead of re-downloading.
        (if saved?
          [:div.saved-badge
           (shui/tabler-icon "check" {:size 10})]
          [:div.external-badge
           (shui/tabler-icon "world" {:size 10})])
        ;; Touch-only license byline. CSS toggles via @media (hover: none) so
        ;; touch users see attribution without a hover affordance.
        (when (or license license-desc)
          [:div.touch-byline
           (str (case source
                  :wikipedia-commons "Commons"
                  :wikipedia "Wikipedia"
                  "Web")
                (when license (str " · " license)))])])
      (shui/tooltip-content
       {:side "top" :align "center" :class "web-image-card-popup"
        :side-offset 8 :collision-padding 8}
       (web-image-card-content web-image))))))

(rum/defcs web-images-section < rum/reactive
  (rum/local nil ::images)
  (rum/local true ::loading?)
  (rum/local nil ::current-query)
  ;; True when the latest fetch reported a network error (both Wikipedia and
  ;; Commons calls failed). Cleared when a fresh fetch begins.
  (rum/local false ::search-error?)
  ;; Generation counter — responses whose id no longer matches are stale
  ;; (e.g. a "do" prefix response arriving after "donald trump" was issued)
  ;; and must not overwrite the current images.
  (rum/local 0 ::request-id)
  {:did-mount (fn [state]
                (let [[{:keys [query *result-sink]}] (:rum/args state)
                      *images (::images state)
                      *loading? (::loading? state)
                      *current-query (::current-query state)
                      *request-id (::request-id state)
                      *search-error? (::search-error? state)
                      publish! (fn [results error?]
                                 (reset! *images results)
                                 (reset! *search-error? (boolean error?))
                                 (when *result-sink (reset! *result-sink (vec results))))]
                  (when-not (string/blank? query)
                    (reset! *current-query query)
                    (reset! *loading? true)
                    (reset! *search-error? false)
                    (let [my-id (swap! *request-id inc)]
                      (-> (<search-web-images query)
                          (p/then (fn [{:keys [images network-error?]}]
                                    (when (= my-id @*request-id)
                                      (publish! images network-error?)
                                      (reset! *loading? false))))
                          (p/catch (fn [_err]
                                     (when (= my-id @*request-id)
                                       (publish! [] true)
                                       (reset! *loading? false))))))))
                state)
   :did-update (fn [state]
                 (let [[{:keys [query *result-sink]}] (:rum/args state)
                       *images (::images state)
                       *loading? (::loading? state)
                       *current-query (::current-query state)
                       *request-id (::request-id state)
                       *search-error? (::search-error? state)
                       current-query @*current-query
                       publish! (fn [results error?]
                                  (reset! *images results)
                                  (reset! *search-error? (boolean error?))
                                  (when *result-sink (reset! *result-sink (vec results))))]
                   ;; Only refetch if query changed
                   (when (and (not= query current-query)
                              (not (string/blank? query)))
                     (reset! *current-query query)
                     (reset! *loading? true)
                     (reset! *search-error? false)
                     (let [my-id (swap! *request-id inc)]
                       (-> (<search-web-images query)
                           (p/then (fn [{:keys [images network-error?]}]
                                     (when (= my-id @*request-id)
                                       (publish! images network-error?)
                                       (reset! *loading? false))))
                           (p/catch (fn [_err]
                                      (when (= my-id @*request-id)
                                        (publish! [] true)
                                        (reset! *loading? false))))))))
                 state)}
  "Renders the web images section with loading states.
   query: search query (page title or user input)
   on-select: callback when user selects a web image
   avatar-context: if set, picker is in avatar mode
   *result-sink: optional atom to publish current results to (for parent
     keyboard-nav)
   highlighted-id: stable id of currently-highlighted tile (string), or nil
   ghost-highlighted-id: stable id of the ghost-highlighted tile (hint that
     Enter-from-search will pick this one), or nil"
  [state {:keys [query on-select avatar-context user-typing?
                 highlighted-id ghost-highlighted-id saved-source-urls]}]
  (let [*images (::images state)
        *loading? (::loading? state)
        *current-query (::current-query state)
        *search-error? (::search-error? state)
        images (rum/react *images)
        ;; `saved-source-urls` is a set of source URLs for assets the user has
        ;; already downloaded locally. We don't filter those tiles out — hiding
        ;; them on a 5-wide row collapses the layout and reads as a broken
        ;; search when the user has saved 3 of the top hits. Instead, the per-
        ;; tile `saved?` flag swaps the corner globe overlay for a green check
        ;; badge, and the click routes through the existing asset (no redownload).
        loading? (rum/react *loading?)
        current-query (rum/react *current-query)
        search-error? (rum/react *search-error?)
        ;; `pending?` captures two transition states where skeletons should
        ;; show even though `loading?` hasn't flipped yet:
        ;; 1. `user-typing?` — user has typed but the 500ms debounce hasn't
        ;;    caught up yet; no fetch has been issued.
        ;; 2. `(not= query current-query)` — parent passed a new query but
        ;;    `:did-update` hasn't yet set `*loading? true`.
        pending? (or user-typing?
                     (and (not (string/blank? query))
                          (not= query current-query)))
        show-loading? (or loading? pending?)
        avatar-mode? (some? avatar-context)
        web-expanded? (get (rum/react *section-states) "Web images" true)]
    ;; Hide only when a settled fetch returned no results AND there was no
    ;; network error. During any transition we keep the section mounted and
    ;; show skeletons so the layout below doesn't jump. When the network
    ;; failed and we have nothing to show, we surface an inline error.
    (when-not (and (not show-loading?) (not search-error?) (empty? images))
      [:div.pane-section.web-images-section
       ;; Section header with info icon
       [:div.section-header-row
        (section-header {:title "Web images"
                         :count (when-not show-loading? (count images))
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
           [:div
            [:div.text-sm.font-medium "Images from Wikipedia Commons"]
            [:div.text-xs.opacity-70.mt-1 "Check licensing before commercial use."]])))]

       ;; Image grid (or inline network-error message)
       (when web-expanded?
         (cond
           (and search-error? (not show-loading?) (empty? images))
           [:div.web-images-error
            (shui/tabler-icon "wifi-off" {:size 14})
            [:span "Couldn't reach Wikipedia. Check your connection."]]

           :else
           [:div.asset-picker-grid.web-images-row
            {:class (when avatar-mode? "avatar-mode")}
            (if show-loading?
              ;; Loading skeletons — inherit avatar-mode so they render as circles
              (for [i (range 5)]
                [:div.web-image-placeholder
                 {:key (str "skeleton-" i)
                  :class (when avatar-mode? "avatar-mode")}
                 (shui/skeleton {:class "w-full h-full rounded"})])
              ;; Actual images
              (for [web-image images
                    :let [web-id (str "web-" (:url web-image))
                          saved? (and (seq saved-source-urls)
                                      (contains? saved-source-urls (:source-url web-image)))]]
                (rum/with-key
                  (web-image-item
                   web-image
                   {:item-id web-id
                    :highlighted? (= highlighted-id web-id)
                    :ghost-highlighted? (= ghost-highlighted-id web-id)
                    ;; True when this tile's source-url matches a locally saved
                    ;; asset. Drives the green "saved" badge (vs the default
                    ;; globe) and lets the parent's on-select route the click
                    ;; to the existing asset instead of re-downloading.
                    :saved? saved?
                  ;; Click commits directly. The hover card already showed the
                  ;; user the preview + license; a modal confirmation is excise
                  ;; work given click-to-revert is one click away.
                    :on-click (fn [e img] (on-select e img))
                    :avatar-mode? avatar-mode?})
                  web-id)))]))])))

;; ============================================================================
;; URL Asset Save Error Copy
;; ============================================================================

(defn- url-save-error-copy
  "Map an ex-info thrown by the URL-save path to user-facing copy."
  [^js err]
  (let [data (ex-data err)
        kind (:kind data)]
    (case kind
      :html-page
      "That link is a webpage, not an image. Right-click the image itself and copy image address."

      :not-image
      (str "That URL isn't an image"
           (when-let [ct (:content-type data)] (str " (" ct ")"))
           ". Try a direct image link.")

      :too-large
      (str "Image exceeds " (/ (:max data) 1024 1024) "MB size limit.")

      :unknown
      "Couldn't tell what that URL is. Try saving the image and uploading directly."

      :http-status
      (let [status (:status data)]
        (case status
          401 "That image requires sign-in. Save it locally and upload instead."
          402 "That page is paywalled. Save the image to your computer first."
          403 "That site refused the download. Save the image locally and upload."
          404 "That URL doesn't exist anymore."
          429 "Too many requests to that site. Try again in a moment."
          (str "Server returned " status ". Save the image manually and upload.")))

      :empty
      "The server closed the connection without sending data. Try again in a moment."

      :cors
      "Your browser blocked that URL (cross-origin). Try the desktop app for broader URL support, or save the image and upload it directly."

      :network
      "Couldn't reach that URL. Check your connection, or the site may be offline."

      ;; Default — preserve ex-message for unclassified errors
      (or (ex-message err) "Failed to download image."))))

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

(defn- <read-from-async-api
  "Async read from the system clipboard via navigator.clipboard.read().
   Returns a promise resolving to:
   {:kind :image :file File}
   {:kind :url   :url   \"https://...\"}
   {:kind :none}
   {:kind :error :error err}"
  []
  (if (and js/navigator (.-clipboard js/navigator) (.-read (.-clipboard js/navigator)))
    (-> (p/let [items (.read (.-clipboard js/navigator))
                items-arr (js->clj items)
                first-item (first items-arr)]
          (if (nil? first-item)
            {:kind :none}
            (p/let [types (js->clj (.-types ^js first-item))
                    image-type (some #(when (string/starts-with? % "image/") %) types)]
              (cond
                image-type
                (p/let [blob (.getType ^js first-item image-type)
                        ext (last (string/split image-type #"/"))
                        filename (str "clipboard-" (.now js/Date) "." ext)
                        file (js/File. #js [blob] filename #js {:type image-type})]
                  {:kind :image :file file})

                (some #(= % "text/plain") types)
                (p/let [blob (.getType ^js first-item "text/plain")
                        text (.text blob)
                        trimmed (when text (string/trim text))]
                  (if (and trimmed (re-matches #"^https?://\S+$" trimmed))
                    {:kind :url :url trimmed}
                    {:kind :none}))

                :else
                {:kind :none}))))
        (p/catch (fn [err] {:kind :error :error err})))
    (p/resolved {:kind :error :error (js/Error. "Clipboard API not available")})))

(defn- <read-clipboard-image
  "Read an image or URL from the clipboard.
   If `event` is provided, prefer its synchronous clipboardData (covers Finder
   file pastes, which the Async Clipboard API cannot see). Falls back to
   navigator.clipboard.read() otherwise.
   Returns promise of:
     {:kind :image :file File}
     {:kind :url   :url String}
     {:kind :none}
     {:kind :error :error js/Error}"
  ([] (<read-clipboard-image nil))
  ([^js event]
   (-> (read-from-event event)
       (p/then (fn [result]
                 (if (some? result)
                   result
                   ;; Fall back to async API.
                   (<read-from-async-api)))))))

;; Forward declarations: defined later in the file (near the icon-picker)
;; but consumed here by the asset-picker. Without these, CLJS emits direct
;; namespace property references at compile time and the call sites blow up
;; at runtime with "undefined" — which manifests as the entire enclosing
;; subtree (e.g. the topbar action group) failing to render.
(declare keyboard-nav-controller)
(declare color-picker)

(rum/defcs asset-picker < rum/reactive db-mixins/query
  (rum/local "" ::search-q)
  (rum/local true ::loading?) ;; Start with loading state
  (rum/local nil ::loaded-assets) ;; Cached assets loaded async
  (rum/local nil ::web-query-debounced) ;; Debounced web search query
  (rum/local :avatar ::mode) ;; :avatar | :image — live tab state, seeded in :will-mount
  (rum/local false ::customize-expanded?) ;; Avatar customize band open/closed
  ;; Controlled open state for the Fallback dropdown menu (the chip's
  ;; menu that contains Letters / Icon… options). Controlled so we can
  ;; programmatically close the whole menu chain after a sub-picker
  ;; commit (Radix cascade-closes the sub-content when the parent
  ;; closes). Without this, the user picks an icon in the sub-picker
  ;; and the Fallback dropdown stays open until they manually click
  ;; out — confusing and slow.
  (rum/local false ::fallback-menu-open?)
  (rum/local nil ::paste-handler) ;; Holds latest clipboard-paste closure for the DOM listener
  ;; Keyboard-nav state, parallels the icon-picker's model.
  (rum/local :search ::focus-region)    ;; :search | :grid
  (rum/local nil    ::highlighted-index) ;; flat index into computed flat-items
  (rum/local nil    ::web-images-result) ;; web-images-section publishes its current images here
  ;; Monotonic counter for web-image saves. Captured per-click; only the
  ;; latest captured id applies its on-chosen — so a quick A→B sequence ends
  ;; up showing B regardless of resolution order.
  (rum/local 0      ::web-image-save-id)
  ;; Optimistic mirror of the just-committed icon. Set synchronously in the
  ;; on-chosen* wrapper so the avatar tile renders the new value during the
  ;; ~30-50ms window before the SharedWorker entity write lands and
  ;; `current-icon` (a model/sub-block-derived prop) catches up. Without
  ;; this, the tile briefly flashes the previous icon/color after Enter or
  ;; click — same race the icon-picker solves with its `pending-icon`
  ;; rum/use-state. Cleared in :will-remount when `current-icon` changes,
  ;; matching icon-picker's `(use-effect! ... [icon-value])` semantics.
  (rum/local nil    ::pending-icon)
  ;; Create a single stable debounced setter. Must live in state (not the
   ;; render `let`) so the debounce timer persists across renders — otherwise
   ;; every keystroke gets a fresh timer and no debouncing happens, causing
   ;; stale partial-prefix searches to race. Runs as :will-mount (not :init)
   ;; because rum/local installs its atoms during :will-mount.
  {:will-mount (fn [state]
                 (let [*web-query-debounced (::web-query-debounced state)
                       *mode (::mode state)
                       {:keys [current-icon avatar-context initial-mode]} (first (:rum/args state))
                       initial-mode (cond
                                      ;; Caller-provided initial mode wins
                                      ;; (e.g., Custom-tab Avatar/Image tiles
                                      ;; want to land on a specific tab even
                                      ;; when no current-icon hints at it).
                                      (#{:avatar :image} initial-mode)   initial-mode
                                      (= :image  (:type current-icon))   :image
                                      (= :avatar (:type current-icon))   :avatar
                                      (some?     avatar-context)         :avatar
                                      :else                              :avatar)]
                   (reset! *mode initial-mode)
                   (assoc state ::update-web-query!
                          (debounce (fn [q] (reset! *web-query-debounced q)) 500)
                          ::search-input-ref (rum/create-ref))))
   :did-mount (fn [state]
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

                ;; Pre-warm the customize-band's expanded layout. The
                ;; first expand from compact dropped frames because the
                ;; expanded layout (cb-rail-wrap visible at 39px, avatar
                ;; at 56px, cb-content at 14px padding + 14px gap) had
                ;; never been computed before the user clicked. We
                ;; briefly set `data-expanded` (with a `data-prewarming`
                ;; sibling that suppresses every transition under the
                ;; zone — see icon.css), force a synchronous reflow via
                ;; `offsetHeight`, then revert. The browser keeps the
                ;; expanded layout's box geometry warm; the user's first
                ;; real click hits a hot cache and the morph runs at 60fps.
                (when-let [^js zone (some-> (rum/dom-node state)
                                            (.querySelector ".avatar-customize-zone"))]
                  (.setAttribute zone "data-prewarming" "")
                  (.setAttribute zone "data-expanded" "true")
                  (.-offsetHeight zone)
                  (.removeAttribute zone "data-expanded")
                  (.-offsetHeight zone)
                  (.removeAttribute zone "data-prewarming"))

                ;; Attach a paste listener to the picker root so ⌘V anywhere in
                ;; the modal routes through the render-time clipboard handler.
                (let [node (rum/dom-node state)
                      listener (fn [^js e]
                                 (let [target (.-target e)
                                       tag (some-> target .-tagName string/lower-case)
                                       in-input? (contains? #{"input" "textarea"} tag)
                                       clipboard-data (.-clipboardData e)
                                       items (some-> clipboard-data .-items)
                                       has-image? (when items
                                                    (some (fn [i]
                                                            (let [it (aget items i)]
                                                              (and it
                                                                   (some-> it .-type
                                                                           (string/starts-with? "image/")))))
                                                          (range (.-length items))))]
                                   (when (or has-image? (not in-input?))
                                     (.preventDefault e)
                                     (when-let [h @(::paste-handler state)]
                                       (h e)))))]
                  (.addEventListener node "paste" listener)
                  (assoc state ::paste-listener listener)))
   :will-remount (fn [old-state new-state]
                   ;; Clear the optimistic ::pending-icon mirror once the
                   ;; entity-derived `current-icon` prop changes — i.e., the
                   ;; SharedWorker write has landed and model/sub-block
                   ;; refreshed. Mirrors icon-picker's
                   ;; `(use-effect! ... [icon-value])` reset.
                   (let [old-icon (:current-icon (first (:rum/args old-state)))
                         new-icon (:current-icon (first (:rum/args new-state)))]
                     (when (not= old-icon new-icon)
                       (reset! (::pending-icon new-state) nil)))
                   new-state)
   :will-unmount (fn [state]
                   ;; Remove paste listener first (best-effort — node may be gone)
                   (when-let [listener (::paste-listener state)]
                     (try
                       (when-let [node (rum/dom-node state)]
                         (.removeEventListener node "paste" listener))
                       (catch :default _ nil)))
                   ;; Track picker closed state
                   (reset! *asset-picker-open? false)

                   state)}
  [state {:keys [on-chosen on-back on-delete del-btn? current-icon avatar-context page-title
                 *color preview-target-db-id preview-target-db-ids preview-inheritor-db-ids property]
          :or {property :logseq.property/icon}}]
  (let [*search-q (::search-q state)
        *loading? (::loading? state)
        *loaded-assets (::loaded-assets state)
        *web-query-debounced (::web-query-debounced state)
        ;; Optimistic local mirror — see ::pending-icon comment in mixins.
        *pending-icon      (::pending-icon state)
        pending-icon       (rum/react *pending-icon)
        ;; Wrap on-chosen so every commit primes the optimistic mirror
        ;; *before* the (async, ~30-50ms) entity write fires. The tile reads
        ;; `pending-icon` ahead of the stale `current-icon` prop, so there's
        ;; no flash of the previous value between commit and entity refresh.
        on-chosen* (fn [e v & rest]
                     (reset! *pending-icon v)
                     (apply on-chosen e v rest))
        ;; Keyboard-nav state
        *focus-region      (::focus-region state)
        *highlighted-index (::highlighted-index state)
        *web-images-result (::web-images-result state)
        *web-image-save-id (::web-image-save-id state)
        *search-input-ref  (::search-input-ref state)
        web-images         (rum/react *web-images-result)
        highlighted-idx    (rum/react *highlighted-index)
        loading? (rum/react *loading?)
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
        *mode (::mode state)
        mode (rum/react *mode)
        avatar-mode? (= :avatar mode)
        ;; Stable avatar "template" used both when synthesizing an avatar from
        ;; an :image icon and when the caller didn't supply an avatar-context.
        synthesized-avatar-context
        (or avatar-context
            {:type :avatar
             :id (str "avatar-" (or page-title "page"))
             :label (or page-title "")
             :data {:value (derive-avatar-initials (or page-title ""))
                    :backgroundColor "#6B7280"
                    :color "#6B7280"}})
        ;; Child components read `(some? avatar-context)` to decide circle vs
        ;; square; flip that live from the active tab.
        effective-avatar-context (when avatar-mode? synthesized-avatar-context)
        ;; Avatar shape (`:circle` | `:rounded-rect`) for cropping the
        ;; asset-grid tiles in lockstep with the avatar tile. Reads in
        ;; precedence:
        ;;  1. Customize-band Shape-row hover-preview — broadcasts a
        ;;     synthetic icon with the previewed shape so the grid
        ;;     tiles re-crop live while the user is hovering Circle /
        ;;     Rectangle in the Shape sub-menu.
        ;;  2. Optimistic `pending-icon` mirror — covers the ~50ms
        ;;     window after commit before `current-icon` (the entity
        ;;     prop) refreshes.
        ;;  3. Committed `current-icon` — the entity-derived value.
        ;; Falls back to `:circle` so the existing avatar-mode rules
        ;; keep applying when no avatar context is active.
        ;; Shared envelope for every preview broadcast in this picker
        ;; (color popover, shape/fallback hover, sub-picker tile hover).
        ;; Centralized so each broadcaster passes the SAME scope —
        ;; receivers gate on it to ignore previews from other pickers.
        ;; Two scopes (see icon.cljs `icon-preview-matches?` doc):
        ;;   primary — `:db-id` / `:db-ids` rendering `:property`
        ;;   inheritor — `:inheritor-db-ids` rendering `:inheritor-property`
        preview-base-target (cond-> {:property property}
                              preview-target-db-id (assoc :db-id preview-target-db-id)
                              (seq preview-target-db-ids) (assoc :db-ids (set preview-target-db-ids))
                              (seq preview-inheritor-db-ids)
                              (assoc :inheritor-property :logseq.property/icon
                                     :inheritor-db-ids (set preview-inheritor-db-ids)))
        hover-preview-state (state/sub :ui/icon-hover-preview)
        hover-shape-match? (and hover-preview-state
                                (icon-preview-matches? hover-preview-state preview-target-db-id property))
        hover-shape (when hover-shape-match?
                      (get-in hover-preview-state [:icon :data :shape]))
        avatar-source-icon (or (when (= :avatar (:type pending-icon)) pending-icon)
                               (when (= :avatar (:type current-icon)) current-icon))
        current-shape (or hover-shape
                          (get-in avatar-source-icon [:data :shape])
                          :circle)
        ;; Tab click handler. Persists an in-place :type flip when the current
        ;; icon already has an asset; otherwise it's a local preview only.
        on-mode-change
        (fn [new-mode]
          (when (not= new-mode @*mode)
            (reset! *mode new-mode)
            ;; The color trigger is rendered Avatar-mode-only, so its
            ;; trigger button vanishes when the user toggles to Image. The
            ;; popover lives in a portal and won't auto-close on trigger
            ;; unmount; dismiss it explicitly by id so it doesn't orphan
            ;; over an unrelated topbar.
            (when (= new-mode :image)
              (shui/popup-hide! :asset-picker-color))
            (when-let [asset-uuid (get-in current-icon [:data :asset-uuid])]
              (let [asset-type (get-in current-icon [:data :asset-type])
                    image-data {:asset-uuid asset-uuid :asset-type asset-type}
                    next-icon (case new-mode
                                :image {:type :image
                                        :id (str "image-" asset-uuid)
                                        :label (or (:label current-icon) "")
                                        :data image-data}
                                :avatar {:type :avatar
                                         :id (or (:id synthesized-avatar-context)
                                                 (str "avatar-" asset-uuid))
                                         :label (or (:label current-icon)
                                                    (:label synthesized-avatar-context))
                                         :data (merge (:data synthesized-avatar-context)
                                                      image-data)})]
                (on-chosen* nil next-icon true)))))
        ;; Stable debounced web-query setter (created once in :init)
        update-web-query! (::update-web-query! state)
        ;; SVG detection helper - checks if URL is an SVG file
        svg-url?
        (fn [url]
          (and (string? url)
               (string/ends-with? (string/lower-case url) ".svg")))

        ;; Download + save path. Called from `handle-web-image-select` when no
        ;; local asset matches the web image's source-url. Defined first so
        ;; the dispatcher below can close over it.
        handle-web-image-download
        (fn [repo url thumb-url title source license author source-url]
          (let [;; Use PNG thumbnail for SVGs (avoids blob rendering issues)
                ;; Fall back to original URL for non-SVGs or if no thumbnail
                download-url (if (and (svg-url? url) thumb-url)
                               thumb-url ; PNG thumbnail for SVG
                               url) ; Original for other formats
                asset-name (or title "web-image")
                source-name (source-name-for source)
                attribution (build-attribution {:title title :author author
                                                :source source :license license})
                source-meta (cond-> {}
                              source-url   (assoc :source-url source-url)
                              source-name  (assoc :source-name source-name)
                              license      (assoc :license license)
                              attribution  (assoc :attribution attribution))
                ;; Capture save-id for race protection. A later click supersedes
                ;; this one's on-chosen so the icon reflects the LAST pick, even
                ;; if saves resolve out of order.
                my-save-id (swap! *web-image-save-id inc)]
            (-> (<save-url-asset! repo download-url asset-name source-meta)
                (p/then (fn [asset-entity]
                          (when (and asset-entity
                                     (= my-save-id @*web-image-save-id))
                            ;; Track as recently used
                            (add-used-asset! (:block/uuid asset-entity))
                            ;; Refresh asset list
                            (p/let [updated-assets (<get-image-assets)]
                              (reset! *loaded-assets (or (seq updated-assets) [])))
                            ;; Select the new asset
                            (let [image-data {:asset-uuid (str (:block/uuid asset-entity))
                                              :asset-type (:logseq.property.asset/type asset-entity)}]
                              (on-chosen* nil
                                          (if (= :avatar mode)
                                            {:type :avatar
                                             :id (:id synthesized-avatar-context)
                                             :label (:label synthesized-avatar-context)
                                             :data (merge (:data synthesized-avatar-context) image-data)}
                                            {:type :image
                                             :id (str "image-" (:block/uuid asset-entity))
                                             :label (or (:block/title asset-entity) "")
                                             :data image-data}))))))
                (p/catch (fn [err]
                           ;; Only show error for the latest save attempt;
                           ;; superseded saves fail silently to avoid double
                           ;; toasts on rapid successive picks.
                           (when (= my-save-id @*web-image-save-id)
                             (shui/toast! (url-save-error-copy err) :error)))))))

        ;; Click dispatcher for the web-image grid. Splits between two paths:
        ;;
        ;; - Already-saved fast path: when the web image's source-url matches
        ;;   an asset already in `assets`, route the click to that asset
        ;;   without re-downloading. The green "saved" badge on the tile is
        ;;   the visible promise of this — re-fetching would create an orphan
        ;;   duplicate.
        ;; - Fresh download: otherwise, fall through to `handle-web-image-download`
        ;;   which downloads the image, writes the asset, and selects it.
        handle-web-image-select
        (fn [_e web-image]
          (let [repo (state/get-current-repo)
                {:keys [url thumb-url title source license author source-url]} web-image
                existing-asset (when (and source-url (not (string/blank? source-url)))
                                 (some #(when (= source-url
                                                 (:logseq.property.asset/source-url %))
                                          %)
                                       assets))]
            (if existing-asset
              (let [image-data {:asset-uuid (str (:block/uuid existing-asset))
                                :asset-type (:logseq.property.asset/type existing-asset)}]
                (add-used-asset! (:block/uuid existing-asset))
                (on-chosen* nil
                            (if (= :avatar mode)
                              {:type :avatar
                               :id (:id synthesized-avatar-context)
                               :label (:label synthesized-avatar-context)
                               :data (merge (:data synthesized-avatar-context) image-data)}
                              {:type :image
                               :id (str "image-" (:block/uuid existing-asset))
                               :label (or (:block/title existing-asset) "")
                               :data image-data})))
              (handle-web-image-download repo url thumb-url title source license author source-url))))

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
                                     (on-chosen* nil
                                                 (if (= :avatar mode)
                                                   {:type :avatar
                                                    :id (:id synthesized-avatar-context)
                                                    :label (:label synthesized-avatar-context)
                                                    :data (merge (:data synthesized-avatar-context) image-data)}
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
                            (process-upload files))))

        ;; Feature detection for Async Clipboard API.
        clipboard-supported?
        (boolean (some-> js/navigator .-clipboard .-read))

        ;; Click the hidden <input type=file> to open the native file picker.
        trigger-upload!
        (fn []
          (when-let [input (js/document.getElementById "asset-upload-input")]
            (.click input)))

        ;; Shared "asset added via URL" side-effect: refresh list + apply icon.
        ;; Used by both the URL pane popup and the clipboard :url branch.
        on-url-asset-entity-added
        (fn [asset-entity]
          ;; Refresh asset list
          (p/let [updated-assets (<get-image-assets)]
            (reset! *loaded-assets (or (seq updated-assets) [])))
          ;; Select the new asset
          (let [image-data {:asset-uuid (str (:block/uuid asset-entity))
                            :asset-type (:logseq.property.asset/type asset-entity)}]
            (on-chosen* nil
                        (if (= :avatar mode)
                          {:type :avatar
                           :id (:id synthesized-avatar-context)
                           :label (:label synthesized-avatar-context)
                           :data (merge (:data synthesized-avatar-context) image-data)}
                          {:type :image
                           :id (str "image-" (:block/uuid asset-entity))
                           :label (or (:block/title asset-entity) "")
                           :data image-data}))))

        ;; Read the system clipboard and route to upload / URL-save / toast.
        handle-clipboard-paste
        (fn self
          ([] (self nil))
          ([^js event]
           ;; Trigger the shortcut-badge press animation (echoes the keystroke
           ;; for ⌘V pastes, provides visual feedback for button clicks too).
           (shui/shortcut-press! "mod+v")
           (-> (p/let [result (<read-clipboard-image event)]
                 (case (:kind result)
                   :image
                   (handle-upload [(:file result)])

                   :url
                   (let [repo (state/get-current-repo)
                         url (:url result)
                         asset-name (extract-filename-from-url url)]
                     (-> (<save-url-asset! repo url asset-name)
                         (p/then (fn [asset-entity]
                                   (when asset-entity
                                     (on-url-asset-entity-added asset-entity))))
                         (p/catch (fn [err]
                                    (shui/toast! (url-save-error-copy err) :error)))))

                   :none
                   (shui/toast! "No image or URL found in clipboard" :warning)

                   :error
                   (shui/toast! "Couldn't read clipboard. Try Upload or Paste URL." :warning)))
               (p/catch (fn [err]
                          (js/console.error "clipboard paste failed" err)
                          (shui/toast! (url-save-error-copy err) :error))))))

        ;; Keep the DOM paste listener pointed at the freshest closure.
        _ (reset! (::paste-handler state) handle-clipboard-paste)]
    [:div.asset-picker
     {:id "asset-picker-modal"
      :class [(when avatar-mode? "avatar-mode")
              (when (rum/react *drag-active?) "drag-active")]
      ;; Cascades shape into the asset-grid tile rules so cropped
      ;; thumbnails match the avatar tile's silhouette. CSS reads
      ;; `[data-avatar-shape="rounded-rect"]` to swap the
      ;; `.avatar-mode` `rounded-full` for the same 22% radius the
      ;; avatar root uses (icon.css:1855-1858). Only present in
      ;; avatar-mode — image-mode tiles keep their default rounded
      ;; squares regardless.
      :data-avatar-shape (when avatar-mode? (name current-shape))
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

     ;; Topbar: back | Avatar/Image tabs | trash, then separator, then search.
     ;; Each focusable stop carries `data-topbar-stop` so the keyboard-nav
     ;; controller can rove DOM focus across them with ArrowLeft/Right.
     [:div.asset-picker-topbar
      [:div.asset-picker-tabrow
       [:div.asset-picker-back
        [:button.back-button
         {:on-click on-back
          :data-topbar-stop "back"}
         (shui/tabler-icon "chevron-left" {:size 16})
         [:span "Back"]]]
       [:div.asset-picker-tabs-slot
        ;; Avatar/Image is a value selector, not a content tab — both modes
        ;; show the same image grid; only the resulting icon's :type/shape
        ;; differs. Render as a pilled segmented control with radiogroup
        ;; ARIA semantics. Manual activation (Enter) is intentional: a mode
        ;; flip writes to the DB when an asset is already selected.
        (ui/segmented-control
         {:options [[:avatar "Avatar"] [:image "Image"]]
          :active mode
          :on-change (fn [m _e] (on-mode-change m))
          :aria-label "Icon rendering mode"
          :button-attrs {:data-topbar-stop "tab"}})]
       ;; Right-side action group. Holds the color trigger (Avatar mode
       ;; only) and the trash button. Bundling them under one grid slot
       ;; keeps the topbar's three-column layout (back / segment / actions)
       ;; intact when the color trigger appears or disappears.
       [:div.asset-picker-topbar-actions
        ;; Color trigger — Avatar mode only. Mirrors the icon-picker's
        ;; topbar trigger (same component, same `*color` atom) so backing
        ;; out updates the parent in lockstep. Hidden in Image mode since
        ;; image assets aren't tinted; an explicit popup-id lets
        ;; on-mode-change dismiss the popover when the user toggles to
        ;; Image while it's open.
        (when (and avatar-mode? *color)
          (color-picker *color
                        (fn [c]
                          ;; Sync first, then commit. The on-chosen wrapper
                          ;; receives the recolored avatar; without the
                          ;; sync, a parent re-render would see stale
                          ;; @*color. Mirrors the icon-picker callback at
                          ;; icon.cljs:5642-5662.
                          (reset! *color c)
                          (let [icon (or (when (= :avatar (:type current-icon)) current-icon)
                                         synthesized-avatar-context)]
                            (on-chosen* nil
                                        (-> icon
                                            (assoc :color c)
                                            (assoc-in [:data :color] c)
                                            (assoc-in [:data :backgroundColor] c))
                                        true)))
                        :on-hover! (when (or preview-target-db-id (seq preview-target-db-ids))
                                     (fn [c]
                                       ;; Additive — preserves any
                                       ;; tile-hover `:icon` so moving
                                       ;; from a tile to a color swatch
                                       ;; keeps the tile shape visible
                                       ;; with the swatch color overlaid.
                                       (merge-into-icon-preview!
                                        (assoc preview-base-target :color c))))
                        :on-hover-end! (when (or preview-target-db-id (seq preview-target-db-ids))
                                         (fn []
                                           (dissoc-icon-preview-field! preview-base-target :color)))
                        :button-attrs {:data-topbar-stop "color"}
                        :popup-id :asset-picker-color))
        (when del-btn?
          (shui/button {:variant :outline :size :sm
                        :data-action "del"
                        :data-topbar-stop "trash"
                        :on-click on-delete}
                       (shui/tabler-icon "trash" {:size 17})))]]
      (shui/separator {:class "my-0 opacity-50"})
      [:div.asset-picker-search
       [:div.search-input
        (shui/tabler-icon "search" {:size 16 :class "ls-icon-search"})
        (shui/input
         {:placeholder "Search images"
          :value search-q
          :auto-focus true
          :ref *search-input-ref
          :on-focus (fn [_]
                      (reset! *focus-region :search)
                      (reset! *highlighted-index nil))
          ;; Auto-route a pasted URL to the asset-fetch path. The root
          ;; paste listener at the picker modal skips when focus is in
          ;; the search input + clipboard is text, so URLs pasted into
          ;; this input would otherwise become an empty fuzzy-filter
          ;; query (the "No matching images" failure mode users hit).
          ;; Detection: scheme prefix regex + `js/URL.` constructor
          ;; (cheap gate first, then strict validate). On match:
          ;; preventDefault stops the URL from entering the input,
          ;; then `<save-url-asset!` runs (which already validates
          ;; MIME, rejects HTML, caps size, follows redirects). On
          ;; failure we restore the URL to the input + toast the
          ;; reason via `url-save-error-copy` so the user can copy /
          ;; edit / paste elsewhere — paste content is never lost.
          :on-paste (fn [^js e]
                      (let [text (some-> e .-clipboardData (.getData "text"))
                            trimmed (some-> text string/trim)
                            url? (and trimmed
                                      (re-matches #"^https?://\S+$" trimmed)
                                      (try (js/URL. trimmed) true
                                           (catch :default _ false)))]
                        (when url?
                          (.preventDefault e)
                          (shui/shortcut-press! "mod+v")
                          (let [repo (state/get-current-repo)
                                asset-name (extract-filename-from-url trimmed)]
                            (-> (<save-url-asset! repo trimmed asset-name)
                                (p/then (fn [asset-entity]
                                          (when asset-entity
                                            (on-url-asset-entity-added asset-entity))))
                                (p/catch (fn [err]
                                           (reset! *search-q trimmed)
                                           (update-web-query! trimmed)
                                           (shui/toast! (url-save-error-copy err) :error))))))))
          :on-change (fn [e]
                       (let [v (util/evalue e)]
                         (reset! *search-q v)
                         (reset! *focus-region :search)
                         (reset! *highlighted-index nil)
                         ;; Update debounced web query
                         (update-web-query! v)))
          :on-key-down (fn [^js e]
                         (let [code (.-keyCode e)]
                           (cond
                             ;; Escape: clear query or close picker (parity with icon-picker).
                             (= code 27)
                             (do (util/stop e)
                                 (if (string/blank? @*search-q)
                                   (shui/popup-hide!)
                                   (do (reset! *search-q "")
                                       (update-web-query! ""))))

                             ;; Up / Shift+Tab: enter the topbar at the active mode tab.
                             (or (= code 38)
                                 (and (= code 9) (.-shiftKey e)))
                             (do (util/stop e)
                                 (reset! *focus-region :topbar)
                                 (reset! *highlighted-index nil)
                                 (when-let [^js cnt (some-> (rum/deref *search-input-ref)
                                                            (.closest ".asset-picker"))]
                                   ;; Land on the active mode tab; fall back to the first
                                   ;; topbar stop if no tab is marked active.
                                   (when-let [el (or (.querySelector cnt
                                                                     "[data-topbar-stop='tab'][data-active='true']")
                                                     (.querySelector cnt "[data-topbar-stop]"))]
                                     (.focus el))))

                             ;; Tab / Down: enter grid at first item.
                             (or (and (= code 9) (not (.-shiftKey e)))
                                 (= code 40))
                             (do (util/stop e)
                                 (reset! *focus-region :grid)
                                 (reset! *highlighted-index 0))

                             ;; Enter: fire the ghost-highlighted first result
                             ;; (first tile in document order that has the ghost class).
                             (= code 13)
                             (when (nil? @*highlighted-index)
                               (when-let [^js cnt (some-> (rum/deref *search-input-ref)
                                                          (.closest ".asset-picker"))]
                                 (when-let [btn (.querySelector cnt ".is-ghost-highlighted")]
                                   (util/stop e)
                                   (.click btn)))))))})]]]

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
           available-expanded? (get section-states "Available assets" true)
           ;; Set of source URLs already saved as assets locally. Threaded into
           ;; web-images-section so each tile knows whether it's a saved image
           ;; and can render the green "saved" badge instead of the default
           ;; globe overlay. Same set is used by handle-web-image-select to
           ;; route saved-tile clicks to the existing asset (no re-download).
           saved-source-urls (->> assets
                                  (keep :logseq.property.asset/source-url)
                                  (remove string/blank?)
                                  set)
           ;; Keyboard navigation: flat-items + sections mirror the icon-picker model.
           ;; Include only sections that are currently rendered and expanded so
           ;; flat indices align with visible DOM buttons. Web tiles that match
           ;; a saved asset stay in the list — they're still visible on screen
           ;; (with the saved badge) so the keyboard cursor must reach them.
           recent-nav-row (when (and recently-used-expanded?
                                     (seq recently-used-row)
                                     (string/blank? search-q))
                            recently-used-row)
           web-nav-list   (when (not (string/blank? effective-web-query))
                            (vec (or web-images [])))
           empty-state?   (and available-expanded?
                               (not loading?)
                               (empty? filtered-assets)
                               (empty? assets))
           search-miss?   (and available-expanded?
                               (not loading?)
                               (empty? filtered-assets)
                               (seq assets)
                               (not (string/blank? search-q)))
           available-nav-list (when (and available-expanded?
                                         (not loading?)
                                         (seq filtered-assets))
                                (vec filtered-assets))
           {:keys [flat-items sections]}
           (let [*items (atom [])
                 *secs  (atom [])
                 add!   (fn [label cols its]
                          (let [its (vec its) c (count its)]
                            (when (pos? c)
                              (swap! *secs conj {:label label :start (count @*items) :count c :cols cols})
                              (swap! *items into its))))]
             (add! "Recently used" 5
                   (map (fn [a] {:type :asset :id (str "recent-" (:block/uuid a))})
                        recent-nav-row))
             (add! "Web images" 5
                   (map (fn [w] {:type :web :id (str "web-" (:url w))})
                        web-nav-list))
             (cond
               (seq available-nav-list)
               (add! "Available assets" 5
                     (map (fn [a] {:type :asset :id (str "asset-" (:block/uuid a))})
                          available-nav-list))

               empty-state?
               (add! "Empty actions" 1
                     (concat
                      (when clipboard-supported? [{:type :clipboard-row :id "clipboard-row"}])
                      [{:type :upload-row :id "upload-row"}])))
             {:flat-items @*items :sections @*secs})
           highlighted-id (when (and highlighted-idx (< highlighted-idx (count flat-items)))
                            (:id (nth flat-items highlighted-idx)))
           ;; Ghost-highlight: when the search input has focus and no tile is
           ;; arrow-selected, preview the first *tile* so Enter picks it.
           ;; Action rows (clipboard / upload) are excluded — Enter from
           ;; search is meant to pick a media item, not fire a CTA.
           ghost-highlighted-id (when (and (= @*focus-region :search)
                                           (nil? highlighted-idx))
                                  (some (fn [it]
                                          (when (#{:asset :web} (:type it))
                                            (:id it)))
                                        flat-items))]
       [:div.bd.bd-scroll
        ;; Invisible controller: attaches a single capture-phase keydown listener
        ;; to .asset-picker and dispatches grid keys into *highlighted-index.
        (keyboard-nav-controller
         {:*focus-region      *focus-region
          :*highlighted-index *highlighted-index
          :*input-ref         *search-input-ref
          :flat-items         flat-items
          :sections           sections
          :container-selector ".asset-picker"
          :topbar-selector    ".asset-picker-topbar [data-topbar-stop]"
          :on-escape          (fn []
                                (if (string/blank? @*search-q)
                                  (shui/popup-hide!)
                                  (reset! *search-q "")))})

        ;; Avatar customize zone — preview tile + (when expanded) Shape/
        ;; Fallback dropdowns + Reset/Done rail. Avatar-mode only; image-mode
        ;; doesn't have a notion of shape (object-fit: contain shows the full
        ;; image with no shape clipping).
        ;;
        ;; Layout intent (matches design artboard 99K-1):
        ;;
        ;;   Resting   — [JK]  Jakob Kühn / Tap to customize…
        ;;   Expanded  — [JK]  Shape    [Circle ⌄]
        ;;                     Fallback [Letters ⌄]      ← future phase
        ;;               -------------------------------
        ;;               ↩ Reset                  Done
        ;;
        ;; Avatar stays anchored on the left in both states; the right column
        ;; swaps between the meta line (resting) and the toggle rows
        ;; (expanded). The avatar itself is the only click target — tapping
        ;; it toggles the expanded state.
        (when avatar-mode?
          (let [expanded? (rum/react (::customize-expanded? state))
                ;; Hover preview from a child sub-picker (Fallback → Icon…
                ;; broadcasts a fully-wrapped avatar via icon-search's
                ;; hover-wrap-fn). When the preview targets *this* page
                ;; and is itself an avatar, overlay it so the band's tile
                ;; mirrors what the page-title shows in lockstep.
                hover-preview (state/sub :ui/icon-hover-preview)
                ;; Hover preview targets *this* picker when both the
                ;; entity and the property scope match. Without the
                ;; property gate, opening the Default Icon picker would
                ;; tint the page-title's separately-mounted asset-picker
                ;; tile (and vice versa).
                hover-match? (and hover-preview
                                  (icon-preview-matches? hover-preview preview-target-db-id property))
                ;; Two flavors of preview to consume:
                ;; 1. Full icon override — broadcast by tile hover/keyboard
                ;;    nav in the fallback sub-picker (icon already wrapped
                ;;    as an avatar via `hover-wrap-fn`).
                ;; 2. Color-only preview — broadcast by color-swatch
                ;;    hover (no `:icon`, only `:color`). For these we
                ;;    overlay the color onto the committed avatar so the
                ;;    tile flashes the previewed tint without losing the
                ;;    current shape/fallback.
                hover-icon-override (when (and hover-match?
                                               (= :avatar (get-in hover-preview [:icon :type])))
                                      (:icon hover-preview))
                hover-color (when hover-match?
                              (let [c (:color hover-preview)]
                                (when (and c (not (string/blank? c)) (not= c "inherit"))
                                  c)))
                ;; Committed (hover-free) base: what the avatar would
                ;; render if no preview were active. Used as the input
                ;; to dropdown-row hover broadcasts so we don't feedback-
                ;; loop a hover-preview onto itself, and as the base for
                ;; the color-only overlay above.
                ;; Read the optimistic ::pending-icon mirror first so the
                ;; tile renders the just-committed value during the brief
                ;; window before the entity-write round-trip lands and
                ;; `current-icon` refreshes. Cleared in :will-remount.
                committed-icon (or (when (and pending-icon (= :avatar (:type pending-icon)))
                                     pending-icon)
                                   (when (= :avatar (:type current-icon)) current-icon)
                                   synthesized-avatar-context)
                hover-icon (or hover-icon-override
                               (when hover-color
                                 (-> committed-icon
                                     (assoc-in [:data :color] hover-color)
                                     (assoc-in [:data :backgroundColor] hover-color))))
                preview-icon (or hover-icon committed-icon)
                current-shape (or (get-in preview-icon [:data :shape]) :circle)
                current-fb-type (or (get-in preview-icon [:data :fallback-type]) :letters)
                current-fb-icon (get-in preview-icon [:data :fallback-icon])
                set-shape! (fn [new-shape]
                             (on-chosen* nil
                                         (assoc-in preview-icon [:data :shape] new-shape)
                                         true))
                ;; All three commit fns clear `:ui/icon-hover-preview`
                ;; (so the asset-picker tile stops reading a stale
                ;; hover-icon and falls back to the freshly-committed
                ;; value) and close the Fallback menu chain via the
                ;; controlled `::fallback-menu-open?` atom. Closing the
                ;; parent menu Radix-cascades the close into the
                ;; sub-content too, so a tile-pick in the sub-picker
                ;; dismisses the entire menu — matching the standard
                ;; "click an item to commit and dismiss" pattern.
                close-fallback-menu! (fn []
                                       (state/set-state! :ui/icon-hover-preview nil)
                                       (reset! (::fallback-menu-open? state) false))
                set-fallback-letters! (fn []
                                        (on-chosen* nil
                                                    (-> preview-icon
                                                        (assoc-in [:data :fallback-type] :letters)
                                                        (update :data dissoc :fallback-icon))
                                                    true)
                                        (close-fallback-menu!))
                set-fallback-icon! (fn [icon-name]
                                     (on-chosen* nil
                                                 (-> preview-icon
                                                     (assoc-in [:data :fallback-type] :icon)
                                                     (assoc-in [:data :fallback-icon] icon-name))
                                                 true)
                                     (close-fallback-menu!))
                set-fallback-emoji! (fn [emoji-id]
                                      (on-chosen* nil
                                                  (-> preview-icon
                                                      (assoc-in [:data :fallback-type] :emoji)
                                                      (assoc-in [:data :fallback-icon] emoji-id))
                                                  true)
                                      (close-fallback-menu!))
                ;; Live preview while hovering Shape / Fallback dropdown
                ;; rows. Broadcast a synthetic avatar (committed config
                ;; with the hovered field changed) into
                ;; `:ui/icon-hover-preview` so the band's tile and the
                ;; page-title trigger render the previewed result without
                ;; committing it. Mouse-leave clears so the avatar
                ;; reverts to the committed state. Same channel the
                ;; fallback sub-picker uses on tile hover.
                preview-shape-on-hover!
                (fn [shape]
                  (when preview-target-db-id
                    (merge-into-icon-preview!
                     (assoc preview-base-target
                            :icon (assoc-in committed-icon [:data :shape] shape)))))
                preview-fallback-on-hover!
                (fn [fb-type]
                  (when preview-target-db-id
                    (let [base committed-icon
                          ;; For Letters: drop fallback-icon so the avatar
                          ;; shows initials. For Icon: prefer the user's
                          ;; previously-picked icon (if any) so hovering
                          ;; "Icon…" previews their actual choice; fall
                          ;; back to a `circle-dashed` placeholder when
                          ;; nothing has been picked yet, signalling
                          ;; "an icon will go here".
                          next-icon (cond
                                      (= fb-type :letters)
                                      (-> base
                                          (assoc-in [:data :fallback-type] :letters)
                                          (update :data dissoc :fallback-icon))

                                      (= fb-type :icon)
                                      (-> base
                                          (assoc-in [:data :fallback-type] :icon)
                                          (assoc-in [:data :fallback-icon]
                                                    (or current-fb-icon "circle-dashed"))))]
                      (merge-into-icon-preview!
                       (assoc preview-base-target :icon next-icon)))))
                clear-preview-on-leave!
                (fn []
                  (when preview-target-db-id
                    (dissoc-icon-preview-field! preview-base-target :icon)))
                reset-style! (fn []
                               ;; Phase 1+2: Reset clears any divergence from
                               ;; the system defaults — shape back to :circle
                               ;; and fallback back to :letters (no icon).
                               (when (or (not= current-shape :circle)
                                         (not= current-fb-type :letters))
                                 (on-chosen* nil
                                             (-> preview-icon
                                                 (assoc-in [:data :shape] :circle)
                                                 (assoc-in [:data :fallback-type] :letters)
                                                 (update :data dissoc :fallback-icon))
                                             true)))
                style-dirty? (or (not= current-shape :circle)
                                 (not= current-fb-type :letters))
                ;; Resting-banner copy: scope on the left ("Default" /
                ;; "Custom"), style descriptor on the right ("Letters,
                ;; circle"). State-as-label per IA design — the avatar
                ;; tile renders the *visual*, the banner answers "where
                ;; does this come from?".
                ;; TODO future: detect class-default inheritance to
                ;; surface "From #Company" as a third scope value.
                has-image? (some? (get-in preview-icon [:data :asset-uuid]))
                ;; Strip image asset data so the avatar tile always
                ;; renders the FALLBACK config (color + shape +
                ;; letters/icon/emoji) — even when an image is layered
                ;; on top in the resolved icon. The descriptor next to
                ;; the tile already says "Image, rectangle" so the
                ;; user knows the image is set; the picked asset is
                ;; visible in the grid below with its selected ring.
                ;; The customize-band's whole purpose is to edit the
                ;; fallback layer, so the tile previews exactly that
                ;; layer in lockstep with the controls — otherwise the
                ;; image hides every fallback edit and the controls
                ;; feel inert.
                fallback-preview-icon (cond-> preview-icon
                                        has-image? (update :data dissoc :asset-uuid :asset-type))
                scope-label (if (or has-image? style-dirty?)
                              "Custom"
                              "Default")
                descriptor-fb (cond
                                has-image? "Image"
                                (and (= current-fb-type :icon) current-fb-icon)
                                (or (not-empty (humanize-icon-name current-fb-icon))
                                    "Icon")
                                (and (= current-fb-type :emoji) current-fb-icon)
                                (or (not-empty
                                     (humanize-icon-name
                                      (string/replace current-fb-icon "_" "-")))
                                    "Emoji")
                                :else "Letters")
                descriptor-shape (case current-shape
                                   :rounded-rect "rectangle"
                                   "circle")
                descriptor (str descriptor-fb ", " descriptor-shape)
                ;; Wrap-fn shared by the Icon… sub-menu's icon-search.
                ;; Each hovered tile broadcasts as an avatar with the
                ;; parent's shape/color/initials so page-icon readers
                ;; render the wrapped avatar during hover, not the bare
                ;; tile. Dispatches on tile :type so emojis also wrap
                ;; with `:fallback-type :emoji` rather than falling back
                ;; to letters.
                fallback-hover-wrap-fn
                (fn [item]
                  (let [glyph-id (or (get-in item [:data :value])
                                     (:id item))
                        kind (cond
                               (= :emoji (:type item)) :emoji
                               (#{:icon :tabler-icon} (:type item)) :icon)]
                    (when (and glyph-id kind)
                      (-> preview-icon
                          (assoc-in [:data :fallback-type] kind)
                          (assoc-in [:data :fallback-icon] glyph-id)))))]
            ;; All inner blocks always render so CSS transitions can run on
            ;; visibility/height changes — the band's gradient, the rail's
            ;; height, and the meta-vs-rows swap all interpolate cleanly. A
            ;; conditional render would mount/unmount on toggle and CSS would
            ;; have nothing to interpolate from.
            [:div.avatar-customize-zone {:data-expanded (when expanded? "true")}
             [:div.cb-content
              [:button.cb-avatar-trigger
               {:type "button"
                :on-click #(swap! (::customize-expanded? state) not)
                :aria-label "Customize avatar"
                :aria-expanded expanded?}
               [:div.preview-avatar
                (icon fallback-preview-icon {:size 56})]]
              [:div.cb-meta-stage
               ;; Resting state: the entire banner is one click target
               ;; that toggles the expanded customize panel. Layout:
               ;;   [scope · descriptor]               [chevron-down]
               ;; State-as-label — `Default · Letters, circle` /
               ;; `Custom · Briefcase, rounded`. Avatar tile remains a
               ;; second click target with the same toggle behavior; the
               ;; chevron rotates 180° on expand.
               [:button.cb-banner
                {:type "button"
                 :on-click #(swap! (::customize-expanded? state) not)
                 :aria-label "Customize avatar"
                 :aria-expanded expanded?
                 :tab-index (if expanded? -1 0)}
                [:div.banner-text
                 [:span.banner-scope scope-label]
                 [:span.banner-sep "·"]
                 [:span.banner-descriptor descriptor]]
                [:span.banner-chevron
                 (shui/tabler-icon "chevron-down" {:size 12})]]
               [:div.cb-rows
                [:div.cb-row
                 [:span.cb-label "Shape"]
                 (shui/dropdown-menu
                  (shui/dropdown-menu-trigger
                   {:as-child true}
                   [:button.cb-chip
                    {:type "button"
                     :data-topbar-stop "shape"
                     :aria-label "Avatar shape"}
                    [:span.cb-chip-glyph
                     (case current-shape
                       :rounded-rect [:span.glyph.glyph-rect]
                       [:span.glyph.glyph-circle])]
                    [:span.cb-chip-label
                     (case current-shape
                       :rounded-rect "Rectangle"
                       "Circle")]
                    (shui/tabler-icon "chevron-down" {:size 11 :class "cb-chip-chevron"})])
                  (shui/dropdown-menu-content
                   {:align "end"
                    ;; Whole-content mouse-leave clears the preview so
                    ;; closing the dropdown without picking reverts the
                    ;; avatar to its committed state. Per-item leave
                    ;; would briefly flash baseline as the cursor moves
                    ;; between rows.
                    :on-mouse-leave clear-preview-on-leave!}
                   ;; `:on-focus` (not `:on-mouse-enter`) — Radix
                   ;; DropdownMenuItem programmatically focuses the
                   ;; highlighted item via `pointermove → item.focus()`
                   ;; (and arrow-key nav does the same), so onFocus
                   ;; fires reliably for both keyboard and mouse. Plain
                   ;; mouseenter is suppressed for the item already
                   ;; under the cursor at open time, which made the
                   ;; first hover silently no-op.
                   ;; Leading tabler icons follow the codebase's canonical
                   ;; dropdown-menu-item pattern (see deps/shui/src/logseq/
                   ;; shui/demo.cljs:18-50): tabler icon as the first
                   ;; child with `scale-90 pr-1 opacity-80` so the icon
                   ;; reads slightly smaller and dimmer than the label.
                   (shui/dropdown-menu-item
                    {:on-click #(set-shape! :circle)
                     :on-focus #(preview-shape-on-hover! :circle)}
                    (shui/tabler-icon "circle" {:class "scale-90 pr-1 opacity-80"})
                    "Circle")
                   (shui/dropdown-menu-item
                    {:on-click #(set-shape! :rounded-rect)
                     :on-focus #(preview-shape-on-hover! :rounded-rect)}
                    (shui/tabler-icon "square-rounded" {:class "scale-90 pr-1 opacity-80"})
                    "Rectangle")))]
                [:div.cb-row
                 [:span.cb-label "Fallback"]
                 (shui/dropdown-menu
                  ;; Controlled open state — see `::fallback-menu-open?`
                  ;; comment above. The map of props goes as the first
                  ;; arg to dropdown-menu, before the trigger/content
                  ;; children.
                  {:open @(::fallback-menu-open? state)
                   :on-open-change #(reset! (::fallback-menu-open? state) %)}
                  (shui/dropdown-menu-trigger
                   {:as-child true}
                   [:button.cb-chip
                    {:type "button"
                     :data-topbar-stop "fallback"
                     :aria-label "Avatar fallback"}
                    ;; Glyph reflects current fallback. Letters → "Aa";
                    ;; Icon → the actual chosen tabler icon; Emoji →
                    ;; the chosen emoji glyph. All sized at 11px for
                    ;; an at-a-glance match against the rendered avatar.
                    [:span.cb-chip-glyph
                     (cond
                       (and (= current-fb-type :icon) current-fb-icon)
                       (shui/tabler-icon current-fb-icon {:size 11})

                       (and (= current-fb-type :emoji) current-fb-icon)
                       [:em-emoji {:id current-fb-icon
                                   :size 11
                                   :style {:line-height 1}}]

                       :else
                       [:span.glyph-letters "Aa"])]
                    [:span.cb-chip-label
                     (cond
                       (and (= current-fb-type :icon) current-fb-icon)
                       (or (not-empty (humanize-icon-name current-fb-icon))
                           "Icon")

                       (and (= current-fb-type :emoji) current-fb-icon)
                       ;; Emoji shortcodes are typically `snake_case`;
                       ;; humanize-icon-name handles dashes but not
                       ;; underscores — replace underscores with spaces
                       ;; first so `white_check_mark` reads as "White
                       ;; check mark", not "White_check_mark".
                       (or (not-empty
                            (humanize-icon-name
                             (string/replace current-fb-icon "_" "-")))
                           "Emoji")

                       :else
                       "Letters")]
                    (shui/tabler-icon "chevron-down" {:size 11 :class "cb-chip-chevron"})])
                  (shui/dropdown-menu-content
                   {:align "end"
                    :on-mouse-leave clear-preview-on-leave!}
                   ;; Same canonical pattern as Shape — tabler icon
                   ;; first, label after. `letter-case` is the closest
                   ;; tabler glyph to the chip's "Aa" cue. `circle-dashed`
                   ;; on the sub-trigger matches the placeholder we
                   ;; broadcast on hover when no fallback-icon has been
                   ;; committed yet, so menu and live-preview agree.
                   (shui/dropdown-menu-item
                    {:on-click set-fallback-letters!
                     :on-focus #(preview-fallback-on-hover! :letters)}
                    (shui/tabler-icon "letter-case" {:class "scale-90 pr-1 opacity-80"})
                    "Letters")
                   ;; Sub-menu pattern (matches content.cljs's "Add reaction"
                   ;; → emoji picker): "Icon…" expands to the side instead
                   ;; of dismissing the parent menu and re-opening a popup
                   ;; underneath. Keeps the user's mental thread on
                   ;; "configuring the fallback" instead of dropping them
                   ;; into a context-less floater.
                   (shui/dropdown-menu-sub
                    (shui/dropdown-menu-sub-trigger
                     {:on-focus #(preview-fallback-on-hover! :icon)}
                     (shui/tabler-icon "circle-dashed" {:class "scale-90 pr-1 opacity-80"})
                     "Icon…")
                    ;; `dropdown-menu-sub-content` ships with `p-1` baked
                    ;; into shui's popup-core defaults, AND content.cljs's
                    ;; "Add reaction" pattern wraps its picker in another
                    ;; `[:div.p-1]` — stacking the two yields 8px of total
                    ;; gutter. Override the outer one to 0 with `!p-0`
                    ;; (the popup's own border/shadow already separates
                    ;; the surface from the page) and keep the inner
                    ;; `[:div.p-1]` so the picker's chrome doesn't read
                    ;; cramped against the rounded popup edge.
                    (shui/dropdown-menu-sub-content
                     {:class "!p-0"
                      ;; Radix's FocusScope runs its auto-focus pass
                      ;; *synchronously* inside `onOpenAutoFocus`. Calling
                      ;; `preventDefault` alone leaves focus on whatever
                      ;; the browser's autoFocus pass picked (a tab
                      ;; button — the first focusable in our DOM order),
                      ;; not the search input. The cleanest fix is to
                      ;; ride Radix's own focus-management window:
                      ;; preventDefault to stop the container auto-aim,
                      ;; then synchronously focus the search input from
                      ;; the same handler. We're still inside FocusScope's
                      ;; mount tick, so this lands as the canonical
                      ;; initial-focus and no later pass overrides it.
                      ;; (Researched in Radix's react-focus-scope source —
                      ;; `focusFirst` runs inline, no internal setTimeout
                      ;; or rAF, so a `setTimeout 0` from a `:did-mount`
                      ;; can't reliably win the race.)
                      :onOpenAutoFocus (fn [^js e]
                                         (.preventDefault e)
                                         (when-let [^js content (.-currentTarget e)]
                                           (when-let [^js input (.querySelector content
                                                                                "input.icon-search-input")]
                                             (.focus input))))}
                     [:div.p-1
                      (icon-search
                       {:on-chosen (fn [_e icon & _rest]
                                     ;; Dispatch on the tile's :type so
                                     ;; emojis route to set-fallback-emoji!
                                     ;; (which writes :fallback-type :emoji)
                                     ;; and tabler icons route to the
                                     ;; existing :icon path.
                                     (let [glyph-id (or (get-in icon [:data :value])
                                                        (:id icon))]
                                       (cond
                                         (and (= :emoji (:type icon)) glyph-id)
                                         (set-fallback-emoji! glyph-id)

                                         (and (#{:icon :tabler-icon} (:type icon)) glyph-id)
                                         (set-fallback-icon! glyph-id))))
                        ;; "All" lets the user start typing and search
                        ;; emojis + icons together — common case where
                        ;; the user knows the keyword (e.g. "smile") but
                        ;; doesn't care which kind of glyph it lands on.
                        ;; Non-icon/non-emoji tiles inside the All tab
                        ;; (text/avatar/image) are silently ignored by
                        ;; the on-chosen dispatch above — they don't
                        ;; map to a meaningful avatar fallback.
                        :allowed-tabs [:all :icon :emoji]
                        :icon-value (when (and (#{:icon :emoji} current-fb-type) current-fb-icon)
                                      {:type (if (= :emoji current-fb-type) :emoji :icon)
                                       :data {:value current-fb-icon}})
                        ;; Mirror the parent avatar's color into the sub-
                        ;; picker so the icon grid tints match the avatar
                        ;; the user is configuring. `@*color` is the
                        ;; *in-flight* color from the asset-picker's color
                        ;; swatch (set the moment the user picks a swatch,
                        ;; before any commit hits the avatar's `:data`).
                        ;; Falls back to the avatar's stored color and
                        ;; lets icon-search's own preset/storage logic win
                        ;; only if both are blank.
                        :initial-color (or (some-> *color deref
                                                   (#(when (and % (not= % "inherit")) %)))
                                           (get-in preview-icon [:data :color]))
                        :page-title page-title
                        :preview-target-db-id preview-target-db-id
                        :hover-wrap-fn fallback-hover-wrap-fn
                        ;; Propagate the asset-picker's property scope to
                        ;; the sub-picker so its hover broadcasts go to
                        ;; the same surface (e.g. when editing the class
                        ;; default-icon, the sub-picker's icon-grid hovers
                        ;; reach only the Default Icon field, not the
                        ;; page-title icon).
                        :property property
                        ;; Suppress the picker's own color swatch and
                        ;; delete button — the parent asset-picker
                        ;; already owns both for the whole avatar, and
                        ;; duplicates here can drift / cause bad states
                        ;; (e.g. deleting the avatar from a sub-picker
                        ;; that's only configuring its fallback).
                        :color-btn? false
                        :del-btn? false})]))))]]]]
             [:div.cb-rail-wrap
              [:div.cb-rail
               [:button.lx-toolbar-action.lx-toolbar-reset-link
                {:type "button"
                 :on-click reset-style!
                 :data-topbar-stop "reset"
                 :disabled (not style-dirty?)
                 :aria-label "Reset to default"
                 :tab-index (if expanded? 0 -1)}
                (shui/tabler-icon "rotate" {:size 12})
                [:span "Reset"]]
               [:button.lx-toolbar-action.cb-done
                {:type "button"
                 :on-click #(reset! (::customize-expanded? state) false)
                 :data-topbar-stop "done"
                 :aria-label "Close customize panel"
                 :tab-index (if expanded? 0 -1)}
                [:span "Done"]]]]]))

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
              (for [asset recently-used-row
                    :let [item-id (str "recent-" (:block/uuid asset))]]
                (rum/with-key
                  (image-asset-item asset {:on-chosen on-chosen
                                           :avatar-context effective-avatar-context
                                           :selected? (= (str (:block/uuid asset)) current-asset-uuid)
                                           :item-id item-id
                                           :highlighted? (= highlighted-id item-id)
                                           :ghost-highlighted? (= ghost-highlighted-id item-id)})
                  item-id))])])

        ;; "Web images" section - Wikipedia Commons images
        (when-not (string/blank? effective-web-query)
          (web-images-section
           {:query effective-web-query
            ;; True on the first keystroke, before the 500ms debounce has
            ;; caught web-query up to search-q. Lets the child switch to
            ;; skeletons immediately instead of waiting for the debounce.
            :user-typing? (and (not (string/blank? search-q))
                               (not= search-q web-query))
            :avatar-context effective-avatar-context
            :on-select handle-web-image-select
            :*result-sink *web-images-result
            :highlighted-id highlighted-id
            :ghost-highlighted-id ghost-highlighted-id
            :saved-source-urls saved-source-urls}))

        ;; "Available assets" section — header is hidden when there are no
        ;; assets at all (the action rows below communicate the zero state on
        ;; their own). The header reappears as soon as the user has assets,
        ;; including during search, where "· 0" conveys "no matches".
        [:div.pane-section
         (when (seq assets)
           (section-header {:title "Available assets"
                            :count asset-count
                            :expanded? available-expanded?
                            :on-toggle #(swap! *section-states update "Available assets" (fn [v] (if (nil? v) false (not v))))}))

         ;; Asset grid. While loading we render an empty grid; the web-image
         ;; skeletons + sync-asset placeholder cover the brief gap, so a
         ;; second spinner here would just add noise.
         (when available-expanded?
           [:div.asset-picker-grid
            {:class (when avatar-mode? "avatar-mode")}
            (cond
              loading?
              nil

              (seq filtered-assets)
              (for [asset filtered-assets
                    :let [item-id (str "asset-" (:block/uuid asset))]]
                (rum/with-key
                  (image-asset-item asset {:on-chosen on-chosen
                                           :avatar-context effective-avatar-context
                                           :selected? (= (str (:block/uuid asset)) current-asset-uuid)
                                           :item-id item-id
                                           :highlighted? (= highlighted-id item-id)
                                           :ghost-highlighted? (= ghost-highlighted-id item-id)})
                  item-id))

              :else
              (if (and (seq assets) (not (string/blank? search-q)))
                ;; Search returned no results
                [:div.asset-picker-empty
                 (shui/tabler-icon "search-off" {:size 32})
                 [:span.text-sm "No matching images"]]
                ;; No assets uploaded yet — show action rows instead of a placeholder
                [:div.asset-picker-empty-actions
                 (when clipboard-supported?
                   [:button.asset-picker-empty-row
                    {:type "button"
                     :data-item-id "clipboard-row"
                     :class (util/classnames
                             [{:is-highlighted (= highlighted-id "clipboard-row")
                               :is-ghost-highlighted (= ghost-highlighted-id "clipboard-row")}])
                     :on-click (fn [_] (handle-clipboard-paste))}
                    [:div.row-icon (shui/tabler-icon "clipboard" {:size 22})]
                    [:div.row-body
                     [:div.row-title "Paste from clipboard"]
                     [:div.row-subtitle "An image, or a link to one"]]
                    [:div.row-shortcut
                     (shui/shortcut "mod+v" {:style :combo})]])

                 ;; Upload row: keyboard-nav clicks the button via data-item-id,
                 ;; which propagates to the <label for> and fires the hidden input.
                 [:label.asset-picker-empty-row
                  {:for "asset-upload-input"
                   :role "button"
                   :data-item-id "upload-row"
                   :tab-index 0
                   :class (util/classnames
                           [{:is-highlighted (= highlighted-id "upload-row")
                             :is-ghost-highlighted (= ghost-highlighted-id "upload-row")}])}
                  [:div.row-icon (shui/tabler-icon "folder" {:size 22})]
                  [:div.row-body
                   [:div.row-title "Add from your computer"]
                   [:div.row-subtitle "Browse or drop a file in"]]
                  [:div.row-chevron (shui/tabler-icon "chevron-right" {:size 16})]]]))])]])

     ;; Hidden file input lives at the top level so both the empty-state
     ;; "Add from your computer" row and the footer-hint "browse" link can
     ;; reference it via <label for="asset-upload-input">.
     [:input#asset-upload-input.hidden
      {:type "file"
       :accept "image/*"
       :multiple true
       :on-change (fn [e]
                    (let [files (array-seq (.-files (.-target e)))]
                      (handle-upload files)))}]

     ;; Footer hint — only when we have assets or are loading. Zero-state
     ;; replaces this bar with the empty-state rows above.
     (when (or loading? (seq @*loaded-assets))
       [:div.asset-picker-footer-hint
        [:span.tip-label "Tip:"]
        [:span.tip-body
         (if (util/mobile?)
           ;; Phone: every verb is a real control. iOS Safari won't deliver
           ;; paste events to the popover root reliably, so paste-a-link is
           ;; a button that calls handle-clipboard-paste directly (mirrors
           ;; the empty-state clipboard-row).
           [:<>
            [:button.tip-link
             {:type "button"
              :on-click (fn [_] (handle-clipboard-paste))}
             "Paste a link"]
            ", "
            [:label.tip-link {:for "asset-upload-input" :tab-index 0} "browse"]
            ", or "
            [:label.tip-link {:tab-index 0}
             [:input.hidden
              {:type "file"
               :accept "image/*"
               :capture "environment"
               :on-change (fn [e]
                            (let [files (array-seq (.. e -target -files))]
                              (handle-upload files)))}]
             "take a picture"]]
           ;; Desktop / iPad: passive hint. Drop + paste rely on the
           ;; existing global handlers attached to the picker root.
           [:<>
            "Drop an image, paste a link, or "
            [:label.tip-link {:for "asset-upload-input" :tab-index 0} "browse"]
            " "
            [:span.tip-sep "·"]
            " "
            (shui/shortcut "mod+v" {:style :combo})])]])]))

(defn open-image-asset-picker!
  "Opens the asset picker popup for selecting an image icon.
   Used for clickable placeholders and error states in image icons."
  [^js e page-id page-title current-icon]
  (shui/popup-show!
   (.-target e)
   (fn [{:keys [id]}]
     (asset-picker
      {:on-chosen (fn [_e icon-data & [keep-popup?]]
                    (when icon-data
                      (property-handler/set-block-property!
                       page-id :logseq.property/icon icon-data))
                    (when-not keep-popup?
                      (shui/popup-hide! id)))
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
      ;; Custom tab always shows its 3 buttons (search doesn't apply — Custom
      ;; is for entering a *new* text/avatar/image, not searching presets).
      (= tab :custom)
      {:items [{:type :custom-text :id "custom-text"}
               {:type :custom-avatar :id "custom-avatar"}
               {:type :custom-image :id "custom-image"}]
       :sections [{:start 0 :count 3 :cols 3}]}

      ;; Search results active. Tabs are content-type categories — keep the
      ;; query persistent across tabs but only show matches that fit the
      ;; current tab's type. :all shows both, :emoji only emoji matches,
      ;; :icon only icon matches. (Custom is handled above.)
      (seq result)
      (let [tab-allows-emojis? (contains? #{:all :emoji} tab)
            tab-allows-icons?  (contains? #{:all :icon} tab)]
        (build-sections
         {:label "Emojis"
          :items (when (and tab-allows-emojis?
                            (seq (:emojis result))
                            (get section-states "Emojis" true))
                   (:emojis result))
          :cols 9}
         {:label "Icons"
          :items (when (and tab-allows-icons?
                            (seq (:icons result))
                            (get section-states "Icons" true))
                   (:icons result))
          :cols 9}))

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
  "Unified keyboard navigation controller for picker-style popovers.
   Manages three tab stops: :tabs, :search, :grid.
   Highlighting is React-props-driven (no DOM attribute manipulation).

   Options:
     :*focus-region      — atom holding :search | :grid | :tabs | nil
     :*highlighted-index — atom holding flat index into :flat-items (or nil)
     :*input-ref         — ref to the search input
     :flat-items         — flat seq of items with stable :id each
     :sections           — seq of {:start :count :cols :label} maps
     :*virtuoso-ref      — optional virtuoso scroll-container ref
     :*tab               — optional tab atom (icon-picker only; enables ⌥⌘1/2/3
                           section-collapse and the :tabs-region rove)
     :container-selector — CSS selector of the scoping root (default
                           `.cp__emoji-icon-picker`). Tile lookups and the
                           keydown listener are scoped to this ancestor.
     :on-escape          — called for Escape in the :tabs region (default
                           `shui/popup-hide!`)
     :topbar-selector    — optional CSS selector for a heterogeneous toolbar
                           (e.g. `.asset-picker-topbar [data-topbar-stop]`).
                           When set, the controller honors a `:topbar`
                           focus-region: ArrowLeft/Right rove DOM focus across
                           the matched elements, Enter clicks the focused one,
                           ArrowDown/Tab/Escape return to search, Shift+Tab
                           jumps to the grid (if any)."
  [{:keys [*focus-region *highlighted-index *tab *input-ref flat-items sections
           *virtuoso-ref container-selector on-escape topbar-selector]
    :or {container-selector ".cp__emoji-icon-picker"
         on-escape          shui/popup-hide!}}]
  (let [*el-ref (rum/use-ref nil)
        get-cnt #(some-> (rum/deref *el-ref) (.closest container-selector))

        focus-search! (fn []
                        (reset! *focus-region :search)
                        (reset! *highlighted-index nil)
                        (some-> (rum/deref *input-ref) (.focus)))

        focus-grid! (fn [idx]
                      (let [idx (or idx 0)
                            idx (min idx (max 0 (dec (count flat-items))))]
                        (reset! *focus-region :grid)
                        (reset! *highlighted-index idx)
                        ;; Move DOM focus to the new tile so activeElement
                        ;; matches `.is-highlighted` — keeps the WAI-APG
                        ;; roving-focus pattern (single visible ring on the
                        ;; current tile) and ensures Enter/Space target the
                        ;; right button. data-item-id is rendered on every
                        ;; tile regardless of highlight state, so the lookup
                        ;; works against the current DOM without waiting for
                        ;; a re-render.
                        (when-let [cnt (get-cnt)]
                          (when (< idx (count flat-items))
                            (let [item-id (:id (nth flat-items idx))]
                              (when-let [^js btn (.querySelector cnt (str "[data-item-id='" item-id "']"))]
                                (.focus btn)))))))

        focus-tabs! (fn [& [tab-id]]
                      ;; If the picker provided a topbar-selector, use the
                      ;; richer :topbar region (DOM rove across all topbar
                      ;; stops). Otherwise fall back to the legacy :tabs
                      ;; region (atom-mutation-only).
                      (reset! *focus-region (if topbar-selector :topbar :tabs))
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
                               (do (util/stop e) (on-escape)))))

        ;; Topbar region: heterogeneous mix of buttons (e.g. back, mode tabs,
        ;; trash, color swatch). Uses real DOM focus + click semantics. When
        ;; arrow-rove lands on a [role=tab] element, also auto-click so tabs
        ;; auto-activate (matches icon-picker's existing tabs-region behavior);
        ;; non-tab stops only move focus and require Enter to commit.
        handle-topbar-keys
        (fn [^js e]
          (when-let [cnt (and topbar-selector (get-cnt))]
            (let [code   (.-keyCode e)
                  stops  (vec (array-seq (.querySelectorAll cnt topbar-selector)))
                  active js/document.activeElement
                  idx    (.indexOf stops active)
                  tab? (fn [^js el] (= (.getAttribute el "role") "tab"))
                  focus! (fn [^js el]
                           (when el
                             (.focus el)
                             (when (tab? el) (.click el))))]
              (cond
                ;; Right: next stop (no wrap; stop at edge)
                (= code 39)
                (do (util/stop e)
                    (when (and (>= idx 0) (< (inc idx) (count stops)))
                      (focus! (nth stops (inc idx)))))

                ;; Left: prev stop (no wrap; stop at edge)
                (= code 37)
                (do (util/stop e)
                    (when (pos? idx)
                      (focus! (nth stops (dec idx)))))

                ;; Enter / Space: native click on focused stop
                (or (= code 13) (= (.-key e) " "))
                (do (util/stop e)
                    (when (>= idx 0) (.click (nth stops idx))))

                ;; Down / Tab: return to search
                (or (= code 40) (and (= code 9) (not (.-shiftKey e))))
                (do (util/stop e) (focus-search!))

                ;; Shift+Tab: jump into grid if any, else back to search
                (and (= code 9) (.-shiftKey e))
                (do (util/stop e)
                    (if (pos? (count flat-items))
                      (focus-grid! 0)
                      (focus-search!)))

                ;; Escape: return to search (parity with grid)
                (= code 27)
                (do (util/stop e) (focus-search!))))))

        ;; Refs for latest handler versions (avoids stale closures)
        *grid-handler-ref (hooks/use-ref handle-grid-keys)
        _ (set! (.-current *grid-handler-ref) handle-grid-keys)
        *tabs-handler-ref (hooks/use-ref handle-tabs-keys)
        _ (set! (.-current *tabs-handler-ref) handle-tabs-keys)
        *topbar-handler-ref (hooks/use-ref handle-topbar-keys)
        _ (set! (.-current *topbar-handler-ref) handle-topbar-keys)

        keydown-handler
        (hooks/use-callback
         (fn [^js e]
           (let [region @*focus-region
                 code (.-keyCode e)]
             (if (and *tab (.-metaKey e) (.-altKey e))
               ;; ⌥⌘1/2/3 toggle section collapse on the All tab (icon-picker only)
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
                 :grid   ((.-current *grid-handler-ref) e)
                 :tabs   ((.-current *tabs-handler-ref) e)
                 :topbar ((.-current *topbar-handler-ref) e)
                 nil))))
         [])]

    ;; Scroll highlighted item into view (highlighting itself is React-props-driven)
    (hooks/use-effect!
     (fn []
       (when-let [idx @*highlighted-index]
         (if-let [virt (some-> *virtuoso-ref deref)]
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

(defn- preset-hex?
  "True when `hex` (any color-picker stored value) matches one of the
   preset values. Preset values are themselves CSS-var strings (e.g.
   `var(--rx-indigo-10)`) when sourced from `colors/variable`, so a
   plain `=` is sufficient."
  [hex preset-values]
  (boolean (and hex (some #(= hex %) preset-values))))

(defn- custom-active?
  "True when the current color is set, non-default, and doesn't match
   any of the named presets — i.e. a custom hex picked through the
   rainbow tile."
  [color preset-values]
  (boolean (and color
                (not= color "inherit")
                (not (preset-hex? color preset-values)))))

(rum/defc color-swatches-popover
  "Popover content for the color-picker. Renders the **control column**
   (Default tile + custom-rainbow tile) on the left, a 1px vertical rule,
   then a 4×2 preset grid on the right. Auto-focuses the currently-
   selected swatch on open. Arrow keys walk the DOM-order swatch list
   linearly (Home/End jump to ends); the visual layout is responsible
   for putting the right neighbour in the right slot."
  [{:keys [colors color set-color! set-hover! on-select!
           on-hover! on-hover-end!
           on-custom-click! custom-active? picker-open?]}]
  (let [*parent (rum/use-ref nil)
        ;; Split entries: first is Default (no value), rest are presets
        default-entry (first colors)
        preset-entries (vec (rest colors))
        ;; Build a 4-wide row layout: 4 + 4 = 8 presets. Pad shorter rows.
        cols 4
        rows (partition-all cols preset-entries)
        render-preset
        (fn [{value :value label :label hint :hint :as _entry}]
          (let [active? (= value color)
                swatch-key (or value "none")]
            (shui/tooltip-provider
             {:key swatch-key :delay-duration 300}
             (shui/tooltip
              (shui/tooltip-trigger
               {:as-child true}
               [:button.color-swatch
                {:role "radio"
                 :aria-checked (str active?)
                 :aria-label label
                 ;; Roving tabindex: only one element is in the tab
                 ;; order at a time. Active preset wins, otherwise we
                 ;; defer to the control col tiles.
                 :tab-index (if active? "0" "-1")
                 :class (when active? "is-selected")
                 :style (when value {"--swatch-color" value})
                 :on-mouse-enter (fn []
                                   (set-hover! {:color value})
                                   (some-> on-hover! (apply [value])))
                 :on-focus (fn []
                             (set-hover! {:color value})
                             (some-> on-hover! (apply [value])))
                 :on-click (fn []
                             (set-color! value)
                             (set-hover! nil)
                             (some-> on-hover-end! (apply []))
                             (some-> on-select! (apply [value]))
                             (shui/popup-hide!))}
                [:span.swatch-fill {:style {:background-color value}}]])
              (shui/tooltip-content
               {:side "top" :align "center" :show-arrow true}
               [:div.text-center
                [:div.font-medium label]
                (when hint
                  [:div.text-xs.mt-0.5
                   {:style {:color "var(--lx-gray-11)"}}
                   hint])])))))]

    ;; On mount: land focus on (1) selected preset, (2) custom-rainbow
    ;; if custom is active, (3) Default tile, (4) first focusable.
    ;; Deferred a tick so it runs after Radix's onOpenAutoFocus.
    (hooks/use-effect!
     (fn []
       (js/setTimeout
        (fn []
          (when-let [^js parent (rum/deref *parent)]
            (when-let [^js btn (or (.querySelector parent ".color-swatch.is-selected")
                                   (when custom-active?
                                     (.querySelector parent ".color-swatch--custom"))
                                   (.querySelector parent ".color-swatch"))]
              (.focus btn))))
        0))
     [])

    [:div.color-picker-presets
     {:role "radiogroup"
      :aria-label "Icon color"
      :ref *parent
      :on-mouse-leave (fn []
                        (set-hover! nil)
                        (some-> on-hover-end! (apply [])))
      :on-key-down
      (fn [^js e]
        (when-let [^js parent (rum/deref *parent)]
          (let [code      (.-keyCode e)
                ;; All swatch stops in DOM order: control[0..1] then
                ;; preset[0..7], grouped 4-per-row.
                stops     (vec (array-seq (.querySelectorAll parent ".color-swatch")))
                n         (count stops)
                active    js/document.activeElement
                idx       (.indexOf stops active)
                go!       (fn [^js el] (some-> el .focus))
                in-ctl?   (fn [i] (and (>= i 0) (< i 2)))
                in-grid?  (fn [i] (and (>= i 2) (< i n)))
                ;; Preset zone is laid out 4-wide, so col = (i-2) mod 4
                ;; and row = (i-2) div 4. There are exactly 2 preset rows.
                preset-row (fn [i] (quot (- i 2) cols))
                preset-col (fn [i] (mod  (- i 2) cols))]
            (cond
              ;; ── Right ─────────────────────────────────────────────
              (= code 39)
              (do (util/stop e)
                  (cond
                    ;; Control col → enter same-row preset col 0
                    (in-ctl? idx)
                    (let [target (+ 2 (* idx cols))]
                      (when (< target n) (go! (nth stops target))))
                    ;; Preset → next stop within the row, wrap at row end
                    (in-grid? idx)
                    (let [row (preset-row idx)
                          col (preset-col idx)
                          next-col (mod (inc col) cols)
                          target (+ 2 (* row cols) next-col)]
                      (when (< target n) (go! (nth stops target))))
                    :else
                    (go! (nth stops (mod (inc (max idx -1)) n)))))

              ;; ── Left ──────────────────────────────────────────────
              (= code 37)
              (do (util/stop e)
                  (cond
                    ;; Preset col 0 → jump to same-row control tile
                    (and (in-grid? idx) (zero? (preset-col idx)))
                    (go! (nth stops (preset-row idx)))
                    ;; Other preset → previous in-row
                    (in-grid? idx)
                    (let [row (preset-row idx)
                          col (preset-col idx)
                          prev-col (mod (dec col) cols)
                          target (+ 2 (* row cols) prev-col)]
                      (go! (nth stops target)))
                    ;; Control col → wrap to last preset of the row
                    (in-ctl? idx)
                    (let [target (+ 2 (* idx cols) (dec cols))]
                      (when (< target n) (go! (nth stops target))))
                    :else
                    (go! (nth stops (mod (dec (if (>= idx 0) idx n)) n)))))

              ;; ── Down ──────────────────────────────────────────────
              (= code 40)
              (do (util/stop e)
                  ;; When the picker pane is open, ArrowDown from the
                  ;; bottom row (or from the Custom tile) hops into the
                  ;; hex input rather than wrapping. Lets keyboard users
                  ;; flow swatches → hex without leaving via Tab.
                  (let [hop-to-pane!
                        (fn []
                          (and picker-open?
                               (when-let [^js root (.closest parent ".color-picker-popover")]
                                 (when-let [^js inp (.querySelector root ".color-picker-hex-input")]
                                   (.focus inp)
                                   true))))]
                    (cond
                      ;; Default → Custom (toggle within control col)
                      (= idx 0) (go! (nth stops 1))
                      ;; Custom → hop to hex input if pane open, else wrap
                      (= idx 1) (when-not (hop-to-pane!) (go! (nth stops 0)))
                      ;; Preset row 0 → preset row 1, same column
                      (and (in-grid? idx) (= 0 (preset-row idx)))
                      (let [target (+ 2 cols (preset-col idx))]
                        (when (< target n) (go! (nth stops target))))
                      ;; Preset row 1 → hop to hex input if open, else wrap
                      (and (in-grid? idx) (= 1 (preset-row idx)))
                      (when-not (hop-to-pane!)
                        (go! (nth stops (+ 2 (preset-col idx)))))
                      :else
                      (go! (nth stops (mod (inc (max idx -1)) n))))))

              ;; ── Up ────────────────────────────────────────────────
              (= code 38)
              (do (util/stop e)
                  (cond
                    (= idx 0) (go! (nth stops 1))
                    (= idx 1) (go! (nth stops 0))
                    (and (in-grid? idx) (= 1 (preset-row idx)))
                    (go! (nth stops (+ 2 (preset-col idx))))
                    (and (in-grid? idx) (= 0 (preset-row idx)))
                    (let [target (+ 2 cols (preset-col idx))]
                      (when (< target n) (go! (nth stops target))))
                    :else
                    (go! (nth stops (mod (dec (if (>= idx 0) idx n)) n)))))

              ;; Home: first
              (= code 36)
              (do (util/stop e) (go! (first stops)))

              ;; End: last
              (= code 35)
              (do (util/stop e) (go! (last stops)))))))}

     ;; Control column: Default tile (top), custom-rainbow tile (bottom)
     [:div.control-col
      ;; Default — corresponds to the original first entry (`:value nil`)
      (let [{value :value label :label hint :hint} default-entry
            active? (and (= value color) (not custom-active?))]
        (shui/tooltip-provider
         {:delay-duration 300}
         (shui/tooltip
          (shui/tooltip-trigger
           {:as-child true}
           [:button.color-swatch.color-swatch--default
            {:role "radio"
             :aria-checked (str active?)
             :aria-label label
             :tab-index (if active? "0" "-1")
             :class (when active? "is-selected")
             :on-mouse-enter (fn []
                               (set-hover! {:color value})
                               (some-> on-hover! (apply [value])))
             :on-focus (fn []
                         (set-hover! {:color value})
                         (some-> on-hover! (apply [value])))
             :on-click (fn []
                         (set-color! value)
                         (set-hover! nil)
                         (some-> on-hover-end! (apply []))
                         (some-> on-select! (apply [value]))
                         (shui/popup-hide!))}
            [:span.swatch-empty
             (shui/tabler-icon "slash" {:size 14})]])
          (shui/tooltip-content
           {:side "top" :align "center" :show-arrow true}
           [:div.text-center
            [:div.font-medium label]
            (when hint
              [:div.text-xs.mt-0.5
               {:style {:color "var(--lx-gray-11)"}}
               hint])]))))

      ;; Custom — opens the picker pane. aria-expanded reflects pane state.
      (shui/tooltip-provider
       {:delay-duration 300}
       (shui/tooltip
        (shui/tooltip-trigger
         {:as-child true}
         [:button.color-swatch.color-swatch--custom
          {:role "radio"
           :aria-checked (str (boolean custom-active?))
           :aria-label "Custom color"
           :aria-expanded (str (boolean picker-open?))
           :tab-index (if custom-active? "0" "-1")
           :class (when custom-active? "is-selected")
           :on-click (fn [] (some-> on-custom-click! (apply [])))
           :on-key-down (fn [^js e]
                          (when (or (= (.-key e) "Enter")
                                    (= (.-key e) " "))
                            (.preventDefault e)
                            (some-> on-custom-click! (apply []))))}
          [:span.swatch-fill.swatch-fill--rainbow]])
        (shui/tooltip-content
         {:side "top" :align "center" :show-arrow true}
         [:div.text-center
          [:div.font-medium "Custom color"]
          [:div.text-xs.mt-0.5
           {:style {:color "var(--lx-gray-11)"}}
           "Pick any hex"]])))]

     ;; Vertical 1px rule between control col and preset grid
     [:div.divider-rule]

     ;; 4-wide × 2-row preset grid
     [:div.preset-grid
      (for [[r-idx row] (map-indexed vector rows)]
        [:div.preset-grid__row {:key (str "row-" r-idx)}
         (for [entry row]
           (render-preset entry))])]]))

;; Forward declaration: `color-picker-pane` (next) renders `recents-lane`
;; conditionally inside its body, but the recents-lane defn lives below
;; for readability. Declaring silences the :undeclared-var warning.
(declare recents-lane)

(rum/defc color-picker-pane
  "Custom-color picker pane shown below the swatch grid when the user
   clicks the rainbow tile. Hosts a hex input + react-colorful's
   HexColorPicker (combined SV pad + hue slider). Animates open/close
   via the CSS-Grid 0fr↔1fr trick."
  [{:keys [color hex-input set-hex-input!
           hex-invalid? set-hex-invalid!
           set-hover! on-hover! on-hover-end!
           on-commit! on-escape!
           recents
           open?]}]
  (let [*hex-ref (rum/use-ref nil)
        *pane-ref (rum/use-ref nil)
        *pad-ref (rum/use-ref nil)
        ;; Resolve the typed value once. `:hex` is the canonical hex when
        ;; resolution succeeds (any kind of match). `picked` reflects only
        ;; exact-resolvable values for purposes of contrast indicator.
        resolved (colors/resolve-color hex-input)
        active-color (or (:hex resolved) color "#a1b2c3")
        ;; Compute the contrast-adjusted hex for BOTH light and dark themes
        ;; against canonical surfaces. This lets the indicator surface how
        ;; the pick will render in EACH mode, not just the current one — so
        ;; the user notices cross-theme issues at pick time.
        picked (:hex resolved)
        both-themes (when picked (colors/adjust-for-both-themes picked))
        adjusted? (boolean (:differs? both-themes))
        ;; Ghost suffix: alphabetically-first XKCD prefix completion. nil
        ;; when input is empty / hex / exact match / no candidate.
        ghost (colors/prefix-completion hex-input)
        ;; Capture the input's resolved CSS font shorthand once after mount.
        ;; Used by `colors/measure-text-px` to position the ghost <span>.
        [input-font set-input-font!] (rum/use-state nil)]
    ;; When the pane opens, autofocus the hex input.
    (hooks/use-effect!
     (fn []
       (when open?
         (js/setTimeout
          (fn []
            (when-let [^js el (rum/deref *hex-ref)]
              (.focus el)
              (.select el)))
          80)))
     [open?])
    ;; Capture the input's computed font once on mount so the ghost can be
    ;; measured with pixel-perfect alignment.
    (hooks/use-effect!
     (fn []
       (when-let [^js el (rum/deref *hex-ref)]
         (set-input-font! (.-font (js/getComputedStyle el)))))
     [])
    ;; Strip react-colorful's two interactive sliders (SV pad + hue) from
    ;; the Tab order. The library hard-codes `tabIndex={0}` on them and
    ;; offers no prop to opt out. Mouse/touch interaction is unaffected.
    ;; Keyboard users navigate swatches → hex → recents directly via
    ;; Tab/Shift+Tab and arrow shortcuts; the pad is mouse/touch only.
    (hooks/use-effect!
     (fn []
       (when-let [^js root (rum/deref *pad-ref)]
         (doseq [^js node (array-seq (.querySelectorAll root ".react-colorful__interactive"))]
           (.setAttribute node "tabindex" "-1"))))
     [])
    ;; Tab guard for the collapse animation. The pane stays in the DOM
    ;; while CSS Grid animates from 1fr→0fr, so its hex input + pad +
    ;; recents would otherwise remain in the focus tree even when not
    ;; visible. `inert` removes them; toggling via effect keeps the
    ;; data-open transition in sync.
    (hooks/use-effect!
     (fn []
       (when-let [^js el (rum/deref *pane-ref)]
         (set! (.-inert el) (not open?))))
     [open?])
    [:div.color-picker-pane
     {:ref *pane-ref
      :data-open (str (boolean open?))}
     [:div.color-picker-pane__inner
      ;; Hex input row
      [:div.color-picker-hex-row
       [:input.color-picker-hex-input
        {:ref *hex-ref
         :type "text"
         :value (or hex-input "")
         :placeholder "#A1B2C3"
         :spell-check false
         :auto-complete "off"
         :aria-label "Hex color"
         :aria-invalid (str (boolean hex-invalid?))
         :class (when hex-invalid? "is-invalid")
         :on-change (fn [^js e]
                      (let [v (.. e -target -value)
                            r (colors/resolve-color v)]
                        (set-hex-input! v)
                        ;; Mid-typing: clear invalid flag if the new value
                        ;; could still become a valid hex on commit.
                        (when hex-invalid?
                          (set-hex-invalid! false))
                        ;; Live-preview when the value resolves (any match
                        ;; kind: hex, css, exact, OR prefix). Prefix matches
                        ;; preview but won't commit until promoted/exact.
                        ;; `set-hover!` drives the picker grid's local
                        ;; tint; `on-hover!` propagates to the page icon
                        ;; rendered outside the popover.
                        (when-let [hex (:hex r)]
                          (set-hover! {:color hex})
                          (some-> on-hover! (apply [hex])))))
         :on-blur (fn [_e]
                    (let [r (colors/resolve-color hex-input)]
                      (if (and r (contains? #{:hex :css :exact} (:match r)))
                        (do (set-hex-input! (:hex r))
                            (set-hex-invalid! false))
                        (when (and hex-input
                                   (not (string/blank? hex-input)))
                          (set-hex-invalid! true)))))
         :on-key-down (fn [^js e]
                        (cond
                          (= (.-key e) "Enter")
                          (let [r (colors/resolve-color hex-input)]
                            (if (and r (contains? #{:hex :css :exact} (:match r)))
                              (do (.preventDefault e)
                                  (set-hex-input! (:hex r))
                                  (set-hex-invalid! false)
                                  (some-> on-commit! (apply [(:hex r)])))
                              (set-hex-invalid! true)))

                          (= (.-key e) "Escape")
                          (do (.preventDefault e)
                              (some-> on-escape! (apply [])))

                          ;; Tab promotes ghost to full match (when ghost
                          ;; visible). When no ghost, default Tab (focus
                          ;; next) is preserved.
                          (and (= (.-key e) "Tab")
                               (not (.-shiftKey e))
                               (some? ghost))
                          (let [full (:full ghost)
                                hex (:hex ghost)]
                            (.preventDefault e)
                            (set-hex-input! full)
                            (set-hex-invalid! false)
                            (when hex
                              (set-hover! {:color hex})
                              (some-> on-hover! (apply [hex]))))

                          ;; ArrowRight at end of input promotes ghost.
                          ;; Otherwise default cursor move is preserved.
                          (and (= (.-key e) "ArrowRight")
                               (some? ghost)
                               (let [^js el (.-target e)]
                                 (and (= (.-selectionStart el)
                                         (.-selectionEnd el))
                                      (= (.-selectionStart el)
                                         (count hex-input)))))
                          (let [full (:full ghost)
                                hex (:hex ghost)]
                            (.preventDefault e)
                            (set-hex-input! full)
                            (set-hex-invalid! false)
                            (when hex
                              (set-hover! {:color hex})
                              (some-> on-hover! (apply [hex]))))

                          ;; ArrowUp → focus the swatches grid. Lands on
                          ;; the active swatch when one is selected, else
                          ;; the custom-rainbow tile. Single-line input
                          ;; has no meaningful Up cursor target, so we
                          ;; reclaim the key for cross-region nav.
                          (= (.-key e) "ArrowUp")
                          (when-let [^js root (some-> (.-target e)
                                                      (.closest ".color-picker-popover"))]
                            (when-let [^js btn (or (.querySelector root ".color-swatch.is-selected")
                                                   (.querySelector root ".color-swatch--custom"))]
                              (.preventDefault e)
                              (.focus btn)))

                          ;; ArrowDown → focus the first recent. Skips
                          ;; the SV pad / hue slider (which sit outside
                          ;; the Tab order). No-op when no recents exist.
                          (and (= (.-key e) "ArrowDown") (seq recents))
                          (when-let [^js root (some-> (.-target e)
                                                      (.closest ".color-picker-popover"))]
                            (when-let [^js btn (.querySelector root
                                                               ".color-picker-recents__row .color-swatch--recent")]
                              (.preventDefault e)
                              (.focus btn)))))}]
       ;; Ghost suffix: muted suggestion text rendered after the typed
       ;; value when a prefix completion exists. Hidden when the input is
       ;; in an invalid state to avoid noise.
       (when (and ghost (not hex-invalid?))
         (let [typed-width (when input-font
                             (colors/measure-text-px input-font (or hex-input "")))]
           [:span.color-picker-hex-input-ghost
            {:aria-hidden "true"
             :style (when typed-width
                      {:left (str "calc(10px + " typed-width "px)")})}
            (:suffix ghost)]))
       ;; Contrast indicator: visible when the picked hex would render
       ;; differently in EITHER light or dark theme. Shows a half-pie
       ;; preview — left half = dark mode rendered color, right half =
       ;; light mode rendered color — matching the recents lane's split
       ;; swatch motif. Tooltip explains both adjusted hexes.
       (when adjusted?
         (let [{:keys [light dark]} both-themes
               picked-name (some-> picked colors/hex->name colors/humanize-name)]
           (shui/tooltip-provider
            {:delay-duration 200}
            (shui/tooltip
             (shui/tooltip-trigger
              {:as-child true}
              [:span.color-picker-contrast-indicator
               {:aria-label (str (or picked-name picked)
                                 " — contrast adjusted: dark "
                                 dark ", light " light)}
               [:span.contrast-split-swatch
                {:style {"--dark-color" dark
                         "--light-color" light}}]])
             (shui/tooltip-content
              {:side "top" :align "center" :show-arrow true}
              [:div
               ;; Title: picked color name if reverse-lookup hits, else
               ;; the generic "Contrast adjusted".
               [:div.text-sm.font-medium (or picked-name "Contrast adjusted")]
               [:div.text-xs.opacity-70.mt-1
                [:div.flex.items-center.gap-1.5
                 [:span.contrast-tooltip-dot {:style {:background-color dark}}]
                 [:span "Dark "] [:span.font-mono dark]]
                [:div.flex.items-center.gap-1.5.mt-0.5
                 [:span.contrast-tooltip-dot {:style {:background-color light}}]
                 [:span "Light "] [:span.font-mono light]]]])))))]

      ;; SV pad + Hue slider via react-colorful's HexColorPicker
      [:div.color-picker-pad-row
       {:ref *pad-ref}
       (hex-color-picker
        {:color active-color
         :on-change (fn [^js hex]
                      (let [hex (string/lower-case hex)]
                        (set-hex-input! hex)
                        (set-hex-invalid! false)
                        ;; `set-hover!` drives the picker grid's local
                        ;; tint; `on-hover!` propagates the live drag
                        ;; preview to the page icon outside the popover.
                        (set-hover! {:color hex})
                        (some-> on-hover! (apply [hex]))))
         :on-mouse-up (fn [_e]
                        (when-let [hex (colors/parse-hex hex-input)]
                          (some-> on-commit! (apply [hex]))))
         :on-touch-end (fn [_e]
                         (when-let [hex (colors/parse-hex hex-input)]
                           (some-> on-commit! (apply [hex]))))})]
      ;; Recents lane lives inside the pane so it shares the popover bg
      ;; pocket and animates in/out with the pane reveal.
      (when (seq recents)
        (recents-lane
         {:recents recents
          :hex-input hex-input
          :set-hover! set-hover!
          :on-hover! on-hover!
          :on-select! on-commit!
          :on-escape! on-escape!
          :on-up! (fn []
                    (when-let [^js el (rum/deref *hex-ref)]
                      (.focus el)
                      (.select el)))
          :on-down! (fn []
                      (when-let [^js root (some-> (rum/deref *pane-ref)
                                                  (.closest ".color-picker-popover"))]
                        (when-let [^js btn (or (.querySelector root ".color-swatch.is-selected")
                                               (.querySelector root ".color-swatch--custom")
                                               (.querySelector root ".color-swatch"))]
                          (.focus btn))))}))]]))

(rum/defc recents-lane
  "Horizontal row of up to 6 recently-used custom colors. Header label
   matches existing pane-section typography (12px Inter Medium muted).

   Keyboard model: roving tabindex (one Tab stop into the row, arrows
   rove within). ArrowUp leaves to the hex input; ArrowDown wraps to
   the swatches grid (closing the vertical loop). Escape collapses the
   pane back to the swatches grid."
  [{:keys [recents hex-input on-select! set-hover! on-hover!
           on-escape! on-up! on-down!]}]
  (when (seq recents)
    (let [*parent (rum/use-ref nil)
          ;; Active recent index for roving tabindex. Default 0 so the
          ;; first Tab into the row lands on the leftmost swatch.
          [active-idx set-active-idx!] (rum/use-state 0)]
      [:div.color-picker-recents
       [:div.color-picker-recents__header "Recently used"]
       [:div.color-picker-recents__row
        {:ref *parent
         :role "radiogroup"
         :aria-label "Recently used colors"
         :on-key-down
         (fn [^js e]
           (when-let [^js parent (rum/deref *parent)]
             (let [stops   (vec (array-seq (.querySelectorAll parent ".color-swatch--recent")))
                   n       (count stops)
                   ;; Recents flex-wrap into rows of 7 (CSS-driven). Detect
                   ;; the visual row width by counting how many leading
                   ;; stops share the first stop's offsetTop — robust even
                   ;; if the row width changes later.
                   cols    (if (zero? n)
                             0
                             (let [first-top (.-offsetTop ^js (first stops))]
                               (count (take-while #(= (.-offsetTop ^js %) first-top) stops))))
                   focused js/document.activeElement
                   idx     (max 0 (.indexOf stops focused))
                   row     (if (pos? cols) (quot idx cols) 0)
                   col     (if (pos? cols) (mod idx cols) idx)
                   row-start (* row cols)
                   row-end   (min (+ row-start cols) n)
                   row-width (- row-end row-start)
                   go!     (fn [i]
                             (set-active-idx! i)
                             (some-> ^js (nth stops i) .focus))]
               (cond
                 ;; Left/Right wrap WITHIN the current row only.
                 (= (.-key e) "ArrowLeft")
                 (do (util/stop e)
                     (go! (+ row-start (mod (dec col) row-width))))

                 (= (.-key e) "ArrowRight")
                 (do (util/stop e)
                     (go! (+ row-start (mod (inc col) row-width))))

                 (= (.-key e) "Home")
                 (do (util/stop e) (go! 0))

                 (= (.-key e) "End")
                 (do (util/stop e) (go! (dec n)))

                 ;; ArrowUp: previous row at same column, or escape to
                 ;; hex input when already in the top row.
                 (= (.-key e) "ArrowUp")
                 (do (util/stop e)
                     (if (pos? row)
                       (go! (+ (* (dec row) cols) col))
                       (some-> on-up! (apply []))))

                 ;; ArrowDown: next row at same column (clamped to last
                 ;; available when the row is partial), or escape to the
                 ;; swatches grid when there's no row below.
                 (= (.-key e) "ArrowDown")
                 (let [next-row-start (* (inc row) cols)]
                   (util/stop e)
                   (if (< next-row-start n)
                     (let [next-row-end (min (+ next-row-start cols) n)]
                       (go! (min (+ next-row-start col) (dec next-row-end))))
                     (some-> on-down! (apply []))))

                 ;; Escape collapses the pane (same callback the hex
                 ;; input uses) so the user can back out of the picker
                 ;; from any region.
                 (= (.-key e) "Escape")
                 (do (util/stop e) (some-> on-escape! (apply [])))))))}
        (for [[i hex] (map-indexed vector recents)]
          (let [{:keys [light dark differs?]} (or (colors/adjust-for-both-themes hex)
                                                  {:light hex :dark hex :differs? false})
                picked-name (some-> hex colors/hex->name colors/humanize-name)
                checked? (and hex-input (= hex hex-input))]
            (shui/tooltip-provider
             {:key hex :delay-duration 300}
             (shui/tooltip
              (shui/tooltip-trigger
               {:as-child true}
               [:button.color-swatch.color-swatch--recent
                {:role "radio"
                 :aria-checked (str (boolean checked?))
                 :aria-label (or picked-name hex)
                 :tab-index (if (= i active-idx) "0" "-1")
                 :class (when checked? "is-selected")
                 :on-mouse-enter (fn []
                                   (when set-hover!
                                     (set-hover! {:color hex}))
                                   (some-> on-hover! (apply [hex])))
                 :on-focus (fn []
                             (set-active-idx! i)
                             (when set-hover!
                               (set-hover! {:color hex}))
                             (some-> on-hover! (apply [hex])))
                 :on-click (fn [] (some-> on-select! (apply [hex])))}
                ;; Half-pie split: left half = dark-mode rendering, right
                ;; half = light-mode rendering. When picked needs no
                ;; adjustment in either mode, both halves match and the
                ;; swatch reads as a solid circle.
                [:span.swatch-fill
                 {:class (when differs? "is-split")
                  :style {"--dark-color" dark
                          "--light-color" light}}]])
              (shui/tooltip-content
               {:side "top" :align "center" :show-arrow true}
               [:div.text-center
                ;; Title: humanized name when reverse-lookup hits, else
                ;; the picked hex itself.
                [:div.font-medium (or picked-name hex)]
                ;; Dual-mode hex display only when the picked color
                ;; renders differently across themes.
                (when differs?
                  [:div.text-xs.opacity-70.mt-0.5
                   [:div.flex.items-center.gap-1.justify-center
                    [:span.font-mono dark] [:span "·"] [:span.font-mono light]]])])))))]])))

(rum/defc color-picker-popover
  "Whole popover body: swatch grid + animated picker pane + recents lane.
   Owns the local picker-mode / hex-input / hex-invalid? / recents state
   so it survives across pane open/close and recent-color picks while
   the popup remains mounted."
  [{:keys [colors color set-color! set-hover!
           on-select! on-hover! on-hover-end!]}]
  (let [preset-values (->> colors (map :value) (filter some?) vec)
        custom? (custom-active? color preset-values)
        [picker-mode set-picker-mode!] (rum/use-state (if custom? :custom :presets))
        [hex-input set-hex-input!]     (rum/use-state (when custom? color))
        [hex-invalid? set-hex-invalid!] (rum/use-state false)
        [recents set-recents!]         (rum/use-state [])
        open? (= picker-mode :custom)
        ;; Ref captures the latest hex-input + committed color so the unmount
        ;; cleanup sees current values (the cleanup closure has empty deps).
        *latest (rum/use-ref nil)
        commit! (fn [hex]
                  (icon-color/add-recent! hex)
                  (set-recents! (icon-color/get-recents))
                  (set-color! hex)
                  (set-hover! nil)
                  (some-> on-hover-end! (apply []))
                  (some-> on-select! (apply [hex]))
                  (shui/popup-hide!))
        focus-rainbow! (fn []
                         (js/setTimeout
                          (fn []
                            (when-let [^js btn (js/document.querySelector
                                                ".color-swatch--custom")]
                              (.focus btn)))
                          0))]
    ;; Refresh recents on mount.
    (hooks/use-effect!
     (fn []
       (set-recents! (icon-color/get-recents)))
     [])
    ;; Track the latest hex-input + color for the unmount cleanup.
    (hooks/use-effect!
     (fn []
       (rum/set-ref! *latest {:hex-input hex-input :color color}))
     [hex-input color])
    ;; Commit pending hex on unmount (e.g. user dragged the SV pad then
    ;; clicked outside the popover without releasing inside it — the
    ;; on-mouse-up never fires for outside-bounds releases since react-
    ;; colorful uses document-level pointer listeners).
    (hooks/use-effect!
     (fn []
       (fn []
         (let [{:keys [hex-input color]} (rum/deref *latest)
               hex (colors/parse-hex hex-input)]
           (when (and hex (not= hex color))
             (icon-color/add-recent! hex)
             (set-color! hex)
             (some-> on-select! (apply [hex]))))))
     [])
    [:div.color-picker-popover
     (color-swatches-popover
      {:colors colors
       :color color
       :set-color! set-color!
       :set-hover! set-hover!
       :on-select! on-select!
       :on-hover! on-hover!
       :on-hover-end! on-hover-end!
       :custom-active? custom?
       :picker-open? open?
       :on-custom-click! (fn []
                           (set-picker-mode! (if open? :presets :custom)))})
     (color-picker-pane
      {:color (when custom? color)
       :hex-input hex-input
       :set-hex-input! set-hex-input!
       :hex-invalid? hex-invalid?
       :set-hex-invalid! set-hex-invalid!
       :set-hover! set-hover!
       :on-hover! on-hover!
       :on-hover-end! on-hover-end!
       :on-commit! commit!
       :on-escape! (fn []
                     (set-picker-mode! :presets)
                     (set-hex-invalid! false)
                     (focus-rainbow!))
       :recents recents
       :open? open?})]))

(rum/defc color-picker
  [*color on-select! & {:keys [on-hover! on-hover-end! button-attrs after-close! popup-id]}]
  (let [;; Defensive: never let the CSS sentinel "inherit" leak into React state.
        initial-color (let [v @*color] (when (and v (not= v "inherit")) v))
        [color, set-color!] (rum/use-state initial-color)
        [hover, set-hover!] (rum/use-state nil)
        ;; hover is nil = not hovering, or {:color X} where X may be nil ("no color")
        effective-color (if hover (:color hover) color)
        *el (rum/use-ref nil)
        palette [{:value nil :label "Default"
                  :hint "Inherits the surrounding text color"}
                 {:value (colors/variable :gray :10)   :label "Gray"}
                 {:value (colors/variable :indigo :10) :label "Indigo"}
                 {:value (colors/variable :cyan :10)   :label "Cyan"}
                 {:value (colors/variable :green :10)  :label "Green"}
                 {:value (colors/variable :orange :10) :label "Orange"}
                 {:value (colors/variable :tomato :10) :label "Tomato"}
                 {:value (colors/variable :pink :10)   :label "Pink"}
                 {:value (colors/variable :red :10)    :label "Red"}]
        content-fn (fn []
                     (color-picker-popover
                      {:colors palette
                       :color color
                       :set-color! set-color!
                       :set-hover! set-hover!
                       :on-select! on-select!
                       :on-hover! on-hover!
                       :on-hover-end! on-hover-end!}))]
    ;; Display effect on the picker root — fires for both hover and committed
    ;; color. Combined with the per-cell `--r`/`--c` `transition-delay` in CSS,
    ;; every change to the var (hover preview OR commit) plays the diagonal
    ;; wave across the grid. Rapid hover sweeps gracefully retarget mid-flight
    ;; because each cell's delay holds its current value until activation.
    (hooks/use-effect!
     (fn []
       (when-let [^js picker (some-> (rum/deref *el) (.closest ".cp__emoji-icon-picker"))]
         ;; Contrast surface = the popover's elevated background (one level
         ;; above the page bg). The icon-picker grid renders against this
         ;; surface, so contrast must be measured here, not against the page.
         (let [raw        (if (string/blank? effective-color) "inherit" effective-color)
               popover-bg (colors/read-bg-var "--ls-secondary-background-color")
               c          (if (and (string/starts-with? raw "#") popover-bg)
                            (colors/adjust-for-contrast raw popover-bg 3.0)
                            raw)]
           (.setProperty (.-style picker) "--ls-color-icon-preset" c)
           (if (= c "inherit")
             (.remove (.-classList picker) "icon-colored")
             (.add (.-classList picker) "icon-colored")))))
     [effective-color])
    ;; Commit effect — only fires on actual selection. Persists + propagates to *color.
    (hooks/use-effect!
     (fn []
       (let [c (if (string/blank? color) "inherit" color)]
         (storage/set :ls-icon-color-preset c))
       (reset! *color color))
     [color])
    ;; Cleanup — clear external preview when picker unmounts.
    (hooks/use-effect!
     (fn []
       (fn []
         (some-> on-hover-end! (apply []))))
     [])

    [:button.color-picker-trigger
     (merge button-attrs
            {:ref *el
             :on-click (fn [^js e]
                         (shui/popup-show!
                          (.-target e) content-fn
                          (cond-> {;; Disable shui's own focus-restore (a 16ms
                                   ;; setTimeout in popup/core.cljs:107-111 that
                                   ;; .focuses `.closest("[tabindex='0']")` of
                                   ;; the trigger). For our color trigger that
                                   ;; resolves to the active tab in the icon
                                   ;; picker's topbar (roving tabindex), which
                                   ;; would override the picker's manual focus
                                   ;; placement after color commit.
                                   :focus-trigger? false
                                   :content-props
                                   {:side "bottom"
                                    :side-offset 6
                                    ;; Also prevent Radix's default focus-restore
                                    ;; on close. By default it focuses *shui's*
                                    ;; hidden floating trigger button (rendered
                                    ;; at body level), outside the icon picker
                                    ;; subtree → capture-phase keydown listener
                                    ;; stops receiving arrow keys.
                                    :onCloseAutoFocus (fn [^js e]
                                                        (.preventDefault e)
                                                        (some-> after-close! (apply [])))}}
                            ;; Caller-supplied id lets external code dismiss
                            ;; this popover by name (e.g. asset-picker hides
                            ;; it when the user toggles segment to Image).
                            popup-id (assoc :id popup-id))))})
     (if color
       ;; Mirror the recents-lane swatch: when the picked color renders
       ;; differently in light vs dark themes, split the trigger fill into
       ;; a half-pie (dark left / light right) so the cross-mode behavior
       ;; is visible at a glance — even before the popover is opened.
       (let [{:keys [light dark differs?]} (or (colors/adjust-for-both-themes color)
                                               {:light color :dark color :differs? false})]
         [:span.color-picker-fill
          {:class (when differs? "is-split")
           :style {:background-color (when-not differs? color)
                   "--dark-color" dark
                   "--light-color" light}}])
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

(rum/defc icon-hover-effects
  "Phantom function-component hosting React hooks for icon-hover-preview.
   `icon-search` is a class component (rum/defcs + rum/reactive mixin) and
   can't host hooks itself, so the lifecycle effects live here. Renders nil.

   - On `current-id` change → broadcast hovered item or clear when invalid.
     Deps on `current-id` (a stable string) so refires when flat-items
     shift under a stable index — section collapse, search refilter.
   - On unmount → clear preview. Catches every popover-close path
     (Esc, click-outside, commit, programmatic) without threading a
     callback through Radix's onCloseAutoFocus."
  [{:keys [current-id current-item broadcast! clear!]}]
  (hooks/use-effect!
   (fn []
     (if current-item
       (broadcast! current-item)
       (clear!)))
   [current-id])
  (hooks/use-effect!
   (fn [] (fn [] (clear!)))
   [])
  nil)

(rum/defcs ^:large-vars/cleanup-todo icon-search < rum/reactive db-mixins/query
  (rum/local "" ::q)
  (rum/local nil ::result)
  (rum/local :search ::focus-region)
  (rum/local nil ::highlighted-index)
  (rum/local :all ::tab)
  (rum/local false ::input-focused?)
  (rum/local nil ::virtuoso-ref)
  (rum/local :icon-picker ::view) ;; Default view, updated in :will-mount for avatars/images
  (rum/local nil ::asset-picker-initial-mode) ;; Optional :avatar | :image override when navigating from Custom tab tiles
  ;; Holds the result of an async worker fetch for "all instances of
  ;; the class being edited", used by the class default-icon picker
  ;; to broadcast hover-preview to inheriting instance rows. Fetched
  ;; in :will-mount because the main-thread conn doesn't have the
  ;; full instance set (Logseq partial-replicates from worker) — so
  ;; sync `(:block/_tags class)` access returns empty.
  (rum/local nil ::fetched-inheritor-ids)
  {:will-mount (fn [s]
                 (let [opts (first (:rum/args s))
                       icon-value (:icon-value opts)
                       normalized (normalize-icon icon-value)
                       *view (::view s)
                       *tab (::tab s)
                       *fetched-inheritor-ids (::fetched-inheritor-ids s)
                       ;; Prefer current icon's color; fall back to last-used preset.
                       ;; "inherit" is a CSS-layer sentinel (--ls-color-icon-preset),
                       ;; not a real color — drop it before it reaches React state.
                       denull #(when (and % (not= % "inherit")) %)
                       icon-color (denull (get-in normalized [:data :color]))
                       ;; `initial-color` lets a parent (e.g. the avatar
                       ;; customize band's "Icon…" sub-picker) seed the
                       ;; color atom so the picker grid renders in the
                       ;; parent's chosen tint instead of the last-used
                       ;; preset. Takes precedence over icon-value's
                       ;; color so a sub-picker for an icon-less avatar
                       ;; still inherits the avatar's color.
                       initial-color (denull (:initial-color opts))
                       stored (denull (storage/get :ls-icon-color-preset))
                       ;; If the caller restricts the available tabs (e.g.
                       ;; the avatar customize band's icon-fallback sub-picker
                       ;; passes `:allowed-tabs [:all :emoji :icon]` to drop
                       ;; the Custom tab), seed `*tab` to the first allowed
                       ;; entry so we don't land on a hidden tab.
                       allowed (some-> (:allowed-tabs opts) set)
                       ;; For class default-icon edits, fetch the inheriting
                       ;; instance ids from the worker — main-thread conn
                       ;; doesn't have them. Resolves into the local atom;
                       ;; the render reads via `(rum/react)` so re-render
                       ;; fires when the promise lands.
                       preview-target-db-id (:preview-target-db-id opts)
                       property (or (:property opts) :logseq.property/icon)]
                   ;; Avatar/image icons open asset picker, text icons open text-picker
                   (when (contains? #{:avatar :image :text} (:type normalized))
                     (reset! *view (if (= :text (:type normalized)) :text-picker :asset-picker)))
                   (when (and allowed (not (allowed @*tab)))
                     (reset! *tab (first allowed)))
                   (when (and preview-target-db-id
                              (= property :logseq.property.class/default-icon)
                              (not (seq (:preview-inheritor-db-ids opts))))
                     (-> (db-async/<get-tag-objects (state/get-current-repo) preview-target-db-id)
                         (p/then (fn [instances]
                                   (reset! *fetched-inheritor-ids
                                           (->> instances
                                                (remove :logseq.property/icon)
                                                (map :db/id)
                                                set
                                                not-empty))))
                         (p/catch (fn [_] nil))))
                   (assoc s ::color (atom (or initial-color icon-color stored))
                          ::input-ref (rum/create-ref)
                          ::result-ref (rum/create-ref))))
   :did-mount (fn [s]
                ;; Belt-and-braces for non-Radix call sites where the
                ;; picker is opened as a free-floating popup (`shui/popup-show!`
                ;; rather than `dropdown-menu-sub-content`). The Radix
                ;; sub-menu path now focuses synchronously via
                ;; `onOpenAutoFocus` (see avatar fallback wiring at
                ;; icon.cljs:~3850), which is more reliable than racing
                ;; FocusScope on a `setTimeout 0`. This `:did-mount` is a
                ;; safety net so existing call sites that don't pass
                ;; their own focus handoff still get the input focused.
                (js/setTimeout
                 (fn []
                   (when-let [^js input (rum/deref (::input-ref s))]
                     (when (not= js/document.activeElement input)
                       (.focus input))))
                 0)
                ;; Apply the initial color tint to the picker root so the
                ;; icon grid renders in the parent's color even when the
                ;; color-picker swatch is suppressed (e.g. the avatar
                ;; fallback sub-picker passes `:color-btn? false`). The
                ;; visible tint is driven by the `--ls-color-icon-preset`
                ;; CSS variable + the `icon-colored` class — both are
                ;; normally set by the color-picker swatch's use-effect
                ;; (icon.cljs:~5530); replicate that here on first paint
                ;; so a `:color-btn? false` picker still picks up the
                ;; caller's `:initial-color`.
                (let [c @(::color s)]
                  (when (and c (not (string/blank? c)) (not= c "inherit"))
                    (js/setTimeout
                     (fn []
                       (when-let [^js input (rum/deref (::input-ref s))]
                         (when-let [^js picker (.closest input ".cp__emoji-icon-picker")]
                           (.setProperty (.-style picker) "--ls-color-icon-preset" c)
                           (.add (.-classList picker) "icon-colored"))))
                     0)))
                s)}
  [state {:keys [on-chosen del-btn? icon-value page-title preview-target-db-id preview-target-db-ids
                 preview-inheritor-db-ids
                 allowed-tabs hover-wrap-fn color-btn? property]
          :or {color-btn? true
               ;; `property` scopes hover-preview broadcasts so two pickers
               ;; on the same entity but different properties (e.g.
               ;; page-title's `:logseq.property/icon` and class
               ;; default-icon's `:logseq.property.class/default-icon`)
               ;; don't leak previews into each other's surfaces. Default
               ;; to `:logseq.property/icon` because that's the dominant
               ;; case; callers editing other fields pass their own.
               property :logseq.property/icon}
          :as opts}]
  ;; `color-btn?` defaults to true so existing call sites are unchanged;
  ;; the avatar fallback sub-picker passes `:color-btn? false` because
  ;; the parent asset-picker already exposes a color swatch for the
  ;; whole avatar (and `del-btn?` is similarly suppressed).
  (let [*q (::q state)
        *result (::result state)
        *tab (::tab state)
        *color (::color state)
        *input-focused? (::input-focused? state)
        *view (::view state)
        *asset-picker-initial-mode (::asset-picker-initial-mode state)
        *input-ref (::input-ref state)
        *result-ref (::result-ref state)
        *virtuoso-ref (::virtuoso-ref state)
        result @*result
        ;; Live preview broadcast: writes the hovered icon (mouse hover or
        ;; keyboard nav) into the global :ui/icon-hover-preview slot, which
        ;; the page-icon readers (get-node-icon-cp, icon-picker-trigger-icon)
        ;; sub. Carries `@*color` along so the previewed icon shows in the
        ;; user's pending tint, not the icon's stored color.
        ;;
        ;; Allow-list of types whose render path can produce a meaningful
        ;; page icon.
        previewable-tile-type? #{:icon :tabler-icon :emoji :text :avatar :image :image-placeholder}
        ;; Custom-tab buttons broadcast the *synthesized* preview item
        ;; that the button itself renders (mirrors custom-tab-cp:1865-
        ;; 1929), not the navigational marker. Keyboard hover on "Text"
        ;; previews the page icon as the same Pe-style text icon shown in
        ;; the button; "Avatar" → the PE circle; "Image" → a photo glyph.
        ;; Synthesized inline so we avoid plumbing values out of custom-
        ;; tab-cp (which is a child component).
        derived-title (or page-title
                          (some-> (state/get-current-page) (db/get-page) (:block/title)))
        custom-text-value (if (string/blank? @*q)
                            (derive-initials derived-title)
                            (subs @*q 0 (min 8 (count @*q))))
        custom-avatar-value (if (string/blank? @*q)
                              (derive-avatar-initials derived-title)
                              (subs @*q 0 (min 3 (count @*q))))
        custom-bg (or (when-not (string/blank? @*color) @*color)
                      (colors/variable :gray :09))
        custom-fg (or (when-not (string/blank? @*color) @*color)
                      (colors/variable :gray :09))
        custom-preview-items
        {:custom-text   (when custom-text-value
                          {:type :text
                           :id (str "text-" custom-text-value)
                           :label custom-text-value
                           :data (cond-> {:value custom-text-value}
                                   (not (string/blank? @*color)) (assoc :color @*color))})
         :custom-avatar (when custom-avatar-value
                          {:type :avatar
                           :id (str "avatar-" custom-avatar-value)
                           :label custom-avatar-value
                           :data {:value custom-avatar-value
                                  :backgroundColor custom-bg
                                  :color custom-fg}})
         ;; Image has no concrete asset yet (clicking the button opens the
         ;; asset-picker), so we preview Logseq's universal "no icon yet,
         ;; click to add" placeholder — plus inside a dashed rounded
         ;; square. Avoids reading as a committed photo-themed icon.
         :custom-image  {:type :image-placeholder
                         :id "image-placeholder"}}
        ;; Derive the inheritor set via async worker query. The
        ;; main-thread conn is a partial subset of the worker's data
        ;; — instances aren't eagerly loaded, so `(:block/_tags
        ;; class)` returns empty here even when the worker has them.
        ;; Mirrors the precedent at `value.cljs:1131`.
        ;; Caller-passed `:preview-inheritor-db-ids` still wins so
        ;; explicit batch flows (selection toolbar) can override.
        *fetched-inheritor-ids (::fetched-inheritor-ids state)
        derived-inheritor-db-ids (or (not-empty (set preview-inheritor-db-ids))
                                     (rum/react *fetched-inheritor-ids))
        preview-targets-set? (or preview-target-db-id
                                 (seq preview-target-db-ids)
                                 (seq derived-inheritor-db-ids))
        ;; Every preview write carries `:property` so readers in
        ;; different fields editing the same entity (page-title icon vs
        ;; class default-icon) can isolate by property. Default
        ;; `:logseq.property/icon` matches the implicit scope of
        ;; sidebar / cmdk / page-title rendering — unscoped callers
        ;; keep working as before.
        ;;
        ;; Two independent scopes:
        ;;   PRIMARY    — `:db-id` (singleton) or `:db-ids` (set of
        ;;                peers, e.g. batch-select). `:property` is
        ;;                the property they all render.
        ;;   INHERITOR  — `:inheritor-db-ids` carries entities that
        ;;                inherit from the primary entity but render
        ;;                a DIFFERENT property. Used by the class
        ;;                default-icon picker: the class itself is
        ;;                primary (rendering `:logseq.property.class/default-icon`),
        ;;                instances are inheritors (rendering
        ;;                `:logseq.property/icon`, falling back through
        ;;                `get-node-icon`'s inheritance).
        ;;
        ;; Splitting the two scopes keeps the class entity's OWN
        ;; `:logseq.property/icon` (page-title, sidebar) outside the
        ;; preview — it's a different property than what's under edit
        ;; and shouldn't tint when the user is editing default-icon.
        preview-base-target (cond-> {:property property}
                              preview-target-db-id (assoc :db-id preview-target-db-id)
                              (seq preview-target-db-ids) (assoc :db-ids (set preview-target-db-ids))
                              (seq derived-inheritor-db-ids)
                              (assoc :inheritor-property :logseq.property/icon
                                     :inheritor-db-ids (set derived-inheritor-db-ids)))
        clear-tile-hover!
        (fn []
          (when preview-targets-set?
            ;; Drop only the `:icon` field — keep any active `:color`
            ;; from the color popover so moving the mouse off a tile
            ;; into the color swatches doesn't wipe the color overlay
            ;; on the way. `dissoc-icon-preview-field!` clears the
            ;; whole slot when no visual fields remain, so cleanup is
            ;; still complete when neither tile nor color is active.
            (dissoc-icon-preview-field! preview-base-target :icon)))
        broadcast-tile-hover!
        (fn [item]
          ;; Custom-tab navigational markers (:custom-text/:custom-avatar/
          ;; :custom-image) map to the synthesized preview items above.
          ;; Everything else falls through with its own type.
          ;; When `hover-wrap-fn` is set (sub-picker context, e.g. avatar
          ;; fallback), it transforms each tile into the shape the
          ;; *parent* picker wants to preview — so a bare tabler-icon
          ;; tile broadcasts as a fully-wrapped avatar with the parent's
          ;; shape/color/initials. Without the wrap, page-icon readers
          ;; would render the bare icon during hover, defeating the
          ;; live-preview affordance.
          (let [resolved (or (get custom-preview-items (:type item)) item)
                wrapped (or (when hover-wrap-fn (hover-wrap-fn resolved))
                            resolved)]
            (cond
              (not (previewable-tile-type? (:type wrapped)))
              (clear-tile-hover!)

              preview-targets-set?
              (let [normalized (normalize-icon wrapped)]
                ;; Merge — preserves any active `:color` from a color
                ;; popover hover so the previewed tile reads with the
                ;; previewed tint. Without the merge, the color slot
                ;; would clobber on every tile hover and the user
                ;; would lose their color preview while picking.
                (merge-into-icon-preview!
                 (cond-> preview-base-target
                   normalized (assoc :icon normalized)
                   (not (string/blank? @*color)) (assoc :color @*color)))))))
        ;; When the picker is opened against an entity, derive del-btn? reactively
        ;; from the live entity. The static del-btn? prop is captured in the popup
        ;; closure and goes stale across keep-popup? flows (e.g. picking a color
        ;; on an inherited icon, which writes the icon to the entity for the first
        ;; time). Treat the :none sentinel (set on delete) as "no icon".
        ;; `property` selects the right entity attribute — `:logseq.property/icon`
        ;; for page-icon pickers, `:logseq.property.class/default-icon` for the
        ;; class default-icon picker. Without this, a default-icon picker would
        ;; read the unrelated `:logseq.property/icon` and stay stale across commits.
        del-btn? (if preview-target-db-id
                   (let [icon (some-> (model/sub-block preview-target-db-id) (get property))]
                     (and icon (not= (:type icon) :none)))
                   del-btn?)
        ;; Same staleness problem applies to icon-value itself. shui's popup
        ;; stores the content-fn in a global atom and never replaces it after
        ;; popup-show! — so any data this component would have *received as a
        ;; prop* is frozen at popup-open time. In-popup writes (color picker,
        ;; shape dropdown, fallback toggle, etc.) update the entity but never
        ;; flow back into this picker until the popup closes. Reading via
        ;; model/sub-block here subscribes to the entity reactively, so each
        ;; entity update triggers a re-render of icon-search and refreshes the
        ;; downstream asset-picker's preview tile + Shape chip + body grid.
        icon-value (if preview-target-db-id
                     (or (some-> (model/sub-block preview-target-db-id)
                                 ;; Pick the right entity attribute based on
                                 ;; scope — `:logseq.property/icon` for the
                                 ;; page-icon picker, `:logseq.property.class/
                                 ;; default-icon` for the class default-icon
                                 ;; picker. The Default Icon commit writes to
                                 ;; the latter, so without this lookup the
                                 ;; reactive override returned the unrelated
                                 ;; `:logseq.property/icon` (often nil or the
                                 ;; old page-icon value) and the asset-picker
                                 ;; tile + Fallback chip stayed frozen at the
                                 ;; pre-edit state.
                                 (get property))
                         icon-value)
                     icon-value)
        normalized-icon-value (normalize-icon icon-value)
        opts (assoc opts
                    :input-focused? @*input-focused?
                    :*virtuoso-ref *virtuoso-ref
                    :on-tile-hover! broadcast-tile-hover!
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
        ;; Use `rum/react` (not bare deref) so changes to
        ;; `*highlighted-index` from `keyboard-nav-controller` arrow-key
        ;; handlers re-render icon-search. Without this, `highlighted-id`
        ;; below was computed once at popup-show and never refreshed —
        ;; the phantom `icon-hover-effects` component (which broadcasts
        ;; the highlighted item to `:ui/icon-hover-preview`) never saw a
        ;; fresh `current-id`, so keyboard nav silently no-op'd while
        ;; mouse hover worked. One subscription is enough; the other
        ;; reads can stay as bare derefs once the component is hooked up.
        highlighted-idx (rum/react *highlighted-index)
        section-states @*section-states
        {flat-items :items sections :sections} (compute-flat-items @*tab result section-states)
        highlighted-id (when-let [idx highlighted-idx]
                         (when (< idx (count flat-items))
                           (:id (nth flat-items idx))))
        highlighted-section (when-let [idx highlighted-idx]
                              (when-let [si (section-for-index idx sections)]
                                (:label (nth sections si))))
        ghost-highlighted-id (when (and (= @*focus-region :search)
                                        (nil? highlighted-idx)
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
                    (clear-tile-hover!)
                    (set! (. input -value) "")
                    (util/schedule
                     (fn []
                       (when (not= js/document.activeElement input)
                         (.focus input))
                       (util/scroll-to (rum/deref *result-ref) 0 false))))]
    (case @*view
      :asset-picker
      ;; Level 2: Asset Picker view
      (asset-picker {:on-chosen (fn [e icon-data & [keep-popup?]]
                                  ;; Forward keep-popup? upstream so non-final
                                  ;; commits (color picker, shape dropdown,
                                  ;; future fallback toggle) don't auto-close
                                  ;; the popover. Without this, every dropdown
                                  ;; selection in the customize band would
                                  ;; dismiss the picker — actively user-hostile
                                  ;; when comparing options.
                                  ((:on-chosen opts) e icon-data keep-popup?)
                                  (when-not keep-popup?
                                    (reset! *view :icon-picker)))
                     :on-back #(reset! *view :icon-picker)
                     :on-delete #(on-chosen nil)
                     :del-btn? del-btn?
                     :current-icon normalized-icon-value
                     :avatar-context (when (= :avatar (:type normalized-icon-value))
                                       normalized-icon-value)
                     ;; Custom-tab tile clicks set this so the asset-picker
                     ;; lands on the requested tab; otherwise nil and it
                     ;; falls back to current-icon / avatar-context cues.
                     :initial-mode @*asset-picker-initial-mode
                     :page-title page-title
                     ;; Threaded so the asset-picker can host its own color
                     ;; trigger (Avatar mode only) without diverging state —
                     ;; it observes and writes the same atom the icon-picker's
                     ;; topbar trigger uses, so backing out reflects the new
                     ;; color in the parent immediately.
                     :*color *color
                     ;; Same db-id used by the icon-picker for live hover
                     ;; preview of icon/color on the page-icon. Threading it
                     ;; here lets the asset-picker's color trigger drive the
                     ;; same preview state.
                     :preview-target-db-id preview-target-db-id
                     :preview-target-db-ids preview-target-db-ids
                     :preview-inheritor-db-ids preview-inheritor-db-ids
                     ;; Property scope for hover-preview isolation —
                     ;; flows down so asset-picker's own preview writes
                     ;; (Shape/Fallback hovers, color swatch) carry the
                     ;; same scope and target only the right surfaces.
                     :property property})

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

       ;; Phantom component hosting hover-preview lifecycle hooks.
       ;; Renders nothing; lives here because icon-search itself can't
       ;; host React hooks (class component via rum/reactive mixin).
       (icon-hover-effects
        {:current-id   highlighted-id
         :current-item (when (and highlighted-idx
                                  (< highlighted-idx (count flat-items)))
                         (nth flat-items highlighted-idx))
         :broadcast!   broadcast-tile-hover!
         :clear!       clear-tile-hover!})

       ;; Topbar: tabs + separator + search
       [:div.icon-picker-topbar
        [:div.tabs-section {:role "tablist"}
         (tab-observer @*tab {:q @*q :*result *result})
         (keyboard-nav-controller
          {:*focus-region      *focus-region
           :*highlighted-index *highlighted-index
           :*tab               *tab
           :*input-ref         *input-ref
           :flat-items         flat-items
           :sections           sections
           :*virtuoso-ref      *virtuoso-ref
           :topbar-selector    ".cp__emoji-icon-picker .tabs-section [data-topbar-stop]"})
         (ui/tab-items
          {:tabs (let [all-tabs [[:all "All"] [:emoji "Emojis"]
                                 [:icon "Icons"] [:custom "Custom"]]]
                   (if-let [allowed (some-> allowed-tabs set)]
                     (filterv (fn [[id _]] (allowed id)) all-tabs)
                     all-tabs))
           :active @*tab
           :on-change (fn [id ^js e]
                        (reset! *tab id)
                        (reset! *highlighted-index nil)
                        ;; Only return focus to search for genuine mouse
                        ;; clicks. Programmatic .click() from keyboard
                        ;; arrow-rove (handle-topbar-keys auto-activate)
                        ;; has e.detail = 0; real clicks are >= 1. Keeps
                        ;; arrow nav inside the topbar region.
                        ;;
                        ;; Move DOM focus to the input alongside the
                        ;; region reset — otherwise the keyboard-nav-
                        ;; controller routes the next keypress to the
                        ;; :search branch (which is no-op) while the
                        ;; input itself can't fire its own on-key-down
                        ;; because it isn't focused.
                        (when (and e (pos? (.-detail e)))
                          (reset! *focus-region :search)
                          (some-> (rum/deref *input-ref) (.focus))))
           :button-attrs {:data-topbar-stop "tab"}})
         [:div.tab-actions
          ;; Color picker — gated by `color-btn?` so sub-picker call
          ;; sites (e.g. avatar fallback) can suppress it. The parent
          ;; picker already owns the avatar's color, and a duplicate
          ;; here can drift from the parent's value.
          (when color-btn?
            (color-picker *color (fn [c]
                                 ;; Synchronously update *color before calling
                                 ;; on-chosen. The on-chosen wrapper above re-applies
                                 ;; @*color over `m`, so without this it would over-
                                 ;; write the freshly-picked color with the previous
                                 ;; one (color-picker's React state hasn't propagated
                                 ;; to the *color atom yet — its useEffect runs after
                                 ;; this synchronous callback).
                                   (reset! *color c)
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
                                                        (assoc-in [:data :backgroundColor] c)) true)))
                        ;; After Radix's FocusScope unmounts (the popover
                        ;; close), restore focus to the highlighted tile so
                        ;; activeElement matches `.is-highlighted`. Running
                        ;; in :after-close! (not on-select!) bypasses
                        ;; Radix's FocusScope trap which would otherwise
                        ;; undo the focus while the popover is mounted.
                          :after-close! (fn []
                                          (let [^js cnt (some-> (rum/deref *input-ref) (.closest ".cp__emoji-icon-picker"))
                                                idx @*highlighted-index
                                                btn (when (and idx cnt)
                                                      (.querySelector cnt "button.is-highlighted"))]
                                            (cond
                                            ;; Highlighted icon present — restore focus to
                                            ;; the tile so the user resumes where they left
                                            ;; off in the grid.
                                              btn
                                              (do (reset! *focus-region :grid)
                                                  (.focus btn))

                                            ;; No highlight to return to (e.g. user opened
                                            ;; the color picker without first navigating to
                                            ;; an icon). Fall back to the search input so
                                            ;; focus stays *inside* the picker container —
                                            ;; the capture-phase keydown listener only fires
                                            ;; for keys whose target is in the subtree, so
                                            ;; without this fallback the picker would appear
                                            ;; visually open but reject all keys.
                                              cnt
                                              (do (reset! *focus-region :search)
                                                  (some-> (rum/deref *input-ref) (.focus))))))
                          :on-hover! (when (or preview-target-db-id (seq preview-target-db-ids))
                                       (fn [c]
                                         ;; Additive — preserves any
                                         ;; `:icon` from a tile hover
                                         ;; so the previewed tile shows
                                         ;; with the previewed color
                                         ;; overlaid.
                                         (merge-into-icon-preview!
                                          (assoc preview-base-target :color c))))
                          :on-hover-end! (when (or preview-target-db-id (seq preview-target-db-ids))
                                           (fn []
                                             (dissoc-icon-preview-field! preview-base-target :color)))
                          :button-attrs {:data-topbar-stop "color"}))
          ;; delete button
          (when del-btn?
            (shui/button {:variant :outline :size :sm :data-action "del"
                          :data-topbar-stop "trash"
                          :on-click #(on-chosen nil)}
                         (shui/tabler-icon "trash" {:size 17})))]]

        (shui/separator {:class "my-0 icon-picker-separator"})

        [:div.search-section
         [:div.search-input
          (shui/tabler-icon "search" {:size 16})
          [(shui/input
            {:auto-focus true
             :class "icon-search-input"
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

                                ;; Up Arrow / Shift+Tab: move to topbar at the active tab
                                (or (= code 38)
                                    (and (= code 9) (.-shiftKey e)))
                                (do (util/stop e)
                                    (reset! *focus-region :topbar)
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
         :class (or (some-> @*tab (name)) "other")
         ;; Mouse leaves the grid region → clear hover preview. Catches
         ;; the case where a tile gets unmounted (Virtuoso scroll, search
         ;; refilter) while the mouse is still inside the popover, so its
         ;; on-mouse-out never fires.
         ;;
         ;; Skip the clear when the cursor is heading INTO a Radix
         ;; popover (the color picker is portal'd to body and lives
         ;; inside `[data-radix-popper-content-wrapper]`). Without
         ;; this, the tile preview wipes the moment the mouse crosses
         ;; the grid edge to reach a color swatch — and the resulting
         ;; color hover lands on the committed icon instead of the
         ;; tile the user just had previewed. The check lets the
         ;; preview persist across the grid→popover transition; full
         ;; cleanup still runs on commit and on picker unmount.
         :on-mouse-leave (fn [^js e]
                           ;; `relatedTarget` can be `null` (mouse left
                           ;; the window) OR a non-Element node (text
                           ;; node when crossing certain DOM boundaries
                           ;; in some browsers). Guard with `instanceof
                           ;; js/Element` before calling `.closest`,
                           ;; which is Element-only.
                           (let [related (.-relatedTarget e)
                                 to-popover? (and related
                                                  (instance? js/Element related)
                                                  (.closest related "[data-radix-popper-content-wrapper]"))]
                             (when-not to-popover?
                               (clear-tile-hover!))))}
        [:div.content-pane
         ;; Custom tab always shows its own content (Text/Avatar/Image buttons)
         (if (= @*tab :custom)
           (custom-tab-cp *q page-title *color *view *asset-picker-initial-mode icon-value opts)
           ;; Other tabs: show search results if present, else show tab content.
           ;; Tabs scope the search results by content type — :all shows both,
           ;; :emoji only emojis, :icon only icons. Mirrors the same gate in
           ;; compute-flat-items so the visible grid and the keyboard-nav
           ;; flat-items list stay in sync.
           (if (seq result)
             (let [section-states (rum/react *section-states)
                   tab-allows-emojis? (contains? #{:all :emoji} @*tab)
                   tab-allows-icons?  (contains? #{:all :icon} @*tab)
                   has-emojis? (and tab-allows-emojis? (seq (:emojis result)))
                   has-icons?  (and tab-allows-icons?  (seq (:icons result)))]
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

(rum/defc icon-picker-trigger-icon < rum/reactive
  "Reactive sub-component so the trigger icon re-renders on hover-preview changes
  without forcing the parent (which uses React hooks) into a class component.
  `property` scopes the preview match — defaults to `:logseq.property/icon`
  so existing callers keep their behavior; property/value.cljs's
  `default-icon-row` passes `:logseq.property.class/default-icon` so its
  trigger only reflects previews from a Default-Icon-scoped picker."
  [icon-value preview-target-db-id icon-props & [property]]
  (let [property (or property :logseq.property/icon)
        preview (when preview-target-db-id (state/sub :ui/icon-hover-preview))
        preview-active? (and preview
                             (icon-preview-matches? preview preview-target-db-id property))
        preview-icon (when preview-active? (:icon preview))
        ;; Source: previewed icon (cross-type swap) or the committed value.
        ;; Both go through the same color-overlay path below.
        base-value (or preview-icon icon-value)
        ;; IMPORTANT: pre-normalize before mutating. The icon fn's normalize-icon
        ;; early-exits when :data is present, so adding [:data :color] to a non-
        ;; unified shape (e.g. {:type :icon :id "house"} with no :data :value)
        ;; bypasses normalization and the render cond fails → icon disappears.
        ;; Only apply the color override when the preview state carries
        ;; an *explicit* `:color`. Earlier this branch fell back to
        ;; "inherit" whenever any preview was active, which clobbered an
        ;; avatar's `:backgroundColor` to "inherit" — killing the
        ;; visible chip — even for shape/fallback-only previews that
        ;; don't intend to change color. Now: a non-color preview keeps
        ;; the avatar's own `:backgroundColor`/`:color` from `:data`.
        preview-color (when preview-active? (:color preview))
        effective-icon-value (if (and preview-active? (map? base-value))
                               (let [normalized (normalize-icon base-value)
                                     avatar? (= :avatar (:type normalized))]
                                 (cond-> normalized
                                   preview-color (assoc-in [:data :color] preview-color)
                                   (and preview-color avatar?)
                                   (assoc-in [:data :backgroundColor] preview-color)))
                               base-value)]
    (icon effective-icon-value (merge {:color? true} icon-props))))

(rum/defc icon-picker
  [icon-value {:keys [empty-label disabled? initial-open? del-btn? on-chosen icon-props popup-opts button-opts page-title preview-target-db-id preview-target-db-ids preview-inheritor-db-ids default-icon? property]
               :or {property :logseq.property/icon}}]
  (let [*trigger-ref (rum/use-ref nil)
        ;; Optimistic post-commit override. Holds the just-committed
        ;; icon-value during the ~15ms SharedWorker round-trip between
        ;; the DB write and the entity update propagating back via the
        ;; reactive read chain. Without this, the page-icon trigger
        ;; reader falls back to the (still-old) entity for that window
        ;; and visibly flashes the previous icon.
        ;;
        ;; Cleared automatically by the use-effect below when icon-value
        ;; (passed by parent) catches up — Logseq's hooks/use-effect!
        ;; uses Clojure value equality (logseq.shui.hooks/memo-deps), so
        ;; the dep [icon-value] fires when the map's *content* changes,
        ;; not on every render reference flip.
        [pending-icon set-pending-icon!] (rum/use-state nil)
        _ (hooks/use-effect!
           (fn [] (set-pending-icon! nil))
           [icon-value])
        effective-icon-value (or pending-icon icon-value)
        normalized-icon-value (normalize-icon effective-icon-value)
        content-fn
        (if config/publishing?
          (constantly [])
          (fn [{:keys [id]}]
            (icon-search
             {:on-chosen (fn [e icon-value keep-popup?]
                           ;; Set the optimistic local mirror BEFORE the
                           ;; async DB write fires. Lives at this
                           ;; outermost wrapper so every commit path
                           ;; benefits (custom-tab tiles, search-result
                           ;; tiles, asset-picker image picks, text-
                           ;; picker close commits) — they all funnel
                           ;; through this on-chosen.
                           (set-pending-icon! icon-value)
                           (on-chosen e icon-value)
                           (when-not (true? keep-popup?) (shui/popup-hide! id)))
              :icon-value normalized-icon-value
              :page-title page-title
              :del-btn? del-btn?
              :preview-target-db-id preview-target-db-id
              :preview-target-db-ids preview-target-db-ids
              :preview-inheritor-db-ids preview-inheritor-db-ids
              :default-icon? default-icon?
              :property property})))]
    (hooks/use-effect!
     (fn []
       (when initial-open?
         (js/setTimeout #(some-> (rum/deref *trigger-ref) (.click)) 32)))
     [initial-open?])

    ;; NOTE: an earlier auto-heal use-effect ran `heal-dangling-asset-icon` on
    ;; every `[icon-value]` change and called `on-chosen` with the healed value
    ;; (nil for :image, stripped data for :avatar). On page reload the asset
    ;; entity often isn't hydrated into the renderer's conn yet — the lookup
    ;; raced and returned nil, so the heal nuked the icon and persisted the
    ;; loss. The renderer already shows nothing when the asset is genuinely
    ;; missing (icon.cljs:478-482) without mutating the stored value, which
    ;; lets a slow-hydrating asset reappear once it lands. If a user wants to
    ;; clear a permanently dangling icon they can use the trash affordance.

    ;; trigger — render from `effective-icon-value` so the just-committed
    ;; icon shows immediately, before the entity reactive read catches up.
    (let [has-icon? (some? effective-icon-value)]
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
         (if (vector? effective-icon-value) ; hiccup
           effective-icon-value
           (icon-picker-trigger-icon effective-icon-value preview-target-db-id icon-props property))
         (or empty-label "Empty"))))))
