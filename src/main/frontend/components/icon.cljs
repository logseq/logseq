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
            [frontend.context.i18n :as i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.model :as model]
            [frontend.db.utils :as db-utils]
            [frontend.extensions.lightbox :as lightbox]
            [frontend.fs :as fs]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.icon-color :as icon-color]
            [frontend.handler.property :as property-handler]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.functions :refer [debounce]]
            [goog.object :as gobj]
            [io.factorhouse.hsx.core :as hsx]
            [lambdaisland.glogi :as log]
            [logseq.common.config :as common-config]
            [logseq.common.path :as path]
            [logseq.db :as ldb]
            [logseq.db.frontend.asset :as db-asset]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [medley.core :as medley]
            [promesa.core :as p]))

(defn hex-color-picker [props] [:> HexColorPicker props])

(defonce emojis (vals (bean/->clj (gobj/get emoji-data "emojis"))))

;; Drag/upload and section-collapse state was previously module-global —
;; two picker instances open simultaneously (e.g. sidebar + main view) would
;; cross-talk their drag highlights, upload progress, and asset-picker-open
;; flag, plus the OUTER icon-search root and INNER asset-picker overlapped
;; on the shared `*drag-active?` even within a single session. State now
;; lives in component-local atoms (via use-memo) on each owning component
;; (asset-picker + icon-search), so each mount gets its own atoms and the
;; React unmount drops them automatically.

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

(defn- reset-picker-transient-state!
  "Clear every transient/optimistic atom that should not survive a
   trash-button click. Picker-instance atoms are passed explicitly
   because the picker's component-local atoms aren't reachable from
   outside the component; global state is cleared unconditionally.

   Fixes the race where an in-flight `<save-image-asset!` resolves
   AFTER a delete click and writes back to `::pending-icon`, leaving
   a phantom placeholder. Also kills any active hover-preview overlay
   so the deleted icon doesn't briefly ghost back via the preview
   pipeline."
  [{:keys [*pending-icon *asset-picker-initial-mode *upload-status]}]
  (state/set-state! :ui/icon-hover-preview nil)
  (some-> *pending-icon (reset! nil))
  (some-> *asset-picker-initial-mode (reset! nil))
  (some-> *upload-status (reset! "")))

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

;; Grid column counts. Used by the virtualized icon grid, section
;; `:cols` declarations, and the diagonal-wave row/col indices. Single
;; source of truth so the layout, virtualization, and color wave all
;; stay in lockstep.
(def ^:private icon-grid-cols 9)
(def ^:private custom-tab-cols 3)
(def ^:private asset-search-grid-cols 5)

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
      (letfn [(try-ext [exts attempt]
                (if (empty? exts)
                  (when-not (stale?)
                    (reset! *error true))
                  (let [ext (first exts)
                        file (str asset-uuid "." ext)
                        asset-path (path/path-join (str "../" common-config/local-assets-dir) file)]
                    (-> (assets-handler/<make-asset-url asset-path)
                        (p/then (fn [url]
                                  (when-not (stale?)
                                    (reset! *error false)
                                    (reset! *url url))))
                        (p/catch (fn [err]
                                   (when-not (stale?)
                                     ;; Worker-not-ready: retry the same ext on a tighter cadence
                                     ;; with a wider budget. Other errors fall through to next ext.
                                     (if (and (worker-not-ready-err? err)
                                              (< attempt worker-not-ready-max-retries))
                                       (js/setTimeout #(try-ext exts (inc attempt)) worker-not-ready-delay-ms)
                                       (try-ext (rest exts) 0)))))))))]
        (try-ext common-image-extensions 0))
      ;; Known extension — retry with delay on failure
      (let [file (str asset-uuid "." asset-type)
            asset-path (path/path-join (str "../" common-config/local-assets-dir) file)]
        (letfn [(attempt [n]
                  (-> (assets-handler/<make-asset-url asset-path)
                      (p/then (fn [url]
                                (when-not (stale?)
                                  (reset! *error false)
                                  (reset! *url url))))
                      (p/catch (fn [err]
                                 (when-not (stale?)
                                   (let [worker-not-ready? (worker-not-ready-err? err)
                                         budget (if worker-not-ready? worker-not-ready-max-retries max-retries)
                                         next-delay (if worker-not-ready? worker-not-ready-delay-ms delay-ms)]
                                     (if (< n budget)
                                       (js/setTimeout #(attempt (inc n)) next-delay)
                                       (reset! *error true))))))))]
          (attempt 0))))))

(hsx/defc image-icon-cp
  "Renders an image icon by loading the asset URL asynchronously.
   Tries common extensions if asset-type is unknown.
   Accepts optional :on-click-error callback in opts for error state clicks."
  [asset-uuid asset-type-arg opts]
  (let [*url (hooks/use-memo #(atom nil) [])
        *error (hooks/use-memo #(atom false) [])
        *loaded-uuid (hooks/use-memo #(atom nil) [])
        *load-id (hooks/use-memo #(atom 0) [])
        [url] (hooks/use-atom *url)
        [load-error?] (hooks/use-atom *error)
        ;; Re-render on any main-thread tx so we can react to retractions.
        ;; `model/sub-block` can't drive this — the worker's affected-keys
        ;; pipeline (worker/react.cljs:63-67) calls `(d/entity db-after id)`,
        ;; which returns nil for retracted entities, so no `[::block id]`
        ;; is emitted and subscriptions on retracted entities never fire.
        ;; `:db/latest-transacted-entity-uuids` (modules/outliner/pipeline.cljs:56-58)
        ;; flips on every tx and is the reliable retraction signal.
        latest-tx (state/use-sub :db/latest-transacted-entity-uuids)
        ;; Render decision is driven purely by load outcome: URL set →
        ;; image; load-error → fallback; otherwise → loading placeholder.
        ;; Entity presence is *not* part of this gate — on cold reload
        ;; the asset block hasn't transacted into the main-thread DB yet
        ;; even though the file loads fine from the worker, so gating
        ;; the URL on `(db/entity …)` masks a working blob URL with the
        ;; image-error fallback until an unrelated query hydrates the block.
        ;; Retraction is handled in the effect below by watching
        ;; `latest-tx :deleted-ids` and clearing `*url`.
        error? load-error?
        size (or (:size opts) 20)
        on-click-error (:on-click-error opts)]
    ;; Load on mount + on uuid change; clear+reload on retraction.
    ;; (was Rum :did-mount + :did-update)
    (hooks/use-effect!
     (fn []
       (let [asset-type (or asset-type-arg (get-asset-type-from-db asset-uuid))]
         (cond
           (and asset-uuid (not= @*loaded-uuid asset-uuid))
           (do (reset! *loaded-uuid asset-uuid)
               (<load-asset-url! *url *error asset-uuid asset-type
                                 {:try-extensions? (nil? asset-type)
                                  :*load-id *load-id}))
           (and asset-uuid (string? asset-uuid) @*url
                (let [uuid-val (try (uuid asset-uuid) (catch :default _ nil))
                      deleted (some-> latest-tx :deleted-ids)]
                  (and uuid-val deleted (contains? deleted uuid-val))))
           (do (reset! *url nil)
               (reset! *error false)
               (<load-asset-url! *url *error asset-uuid asset-type
                                 {:try-extensions? (nil? asset-type)
                                  :*load-id *load-id}))))
       js/undefined)
     [asset-uuid asset-type-arg latest-tx])
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
                          :color "var(--lx-gray-11, var(--ls-primary-text-color, var(--rx-gray-11)))"}
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
                     (reset! *url nil)
                     (reset! *error true))
         :style {:width "100%"
                 :height "100%"
                 :object-fit "contain"
                 :display "block"}}]]

      :else
      [:span.ui__icon.image-icon.bg-gray-04.animate-pulse
       {:style {:width size :height size}}])))

(hsx/defc avatar-image-cp
  "Renders an avatar with an image, with initials as fallback.
   Uses shui/avatar for circular display with object-fit: cover."
  [asset-uuid asset-type avatar-data opts]
  (let [*url (hooks/use-memo #(atom nil) [])
        *error (hooks/use-memo #(atom false) [])
        *loaded-for (hooks/use-memo #(atom nil) [])
        *load-id (hooks/use-memo #(atom 0) [])
        [url] (hooks/use-atom *url)
        ;; Re-render on every tx so the effect can react to retractions
        ;; (it watches `latest-tx :deleted-ids` and clears `*url`). Render is
        ;; driven purely by load outcome — don't gate on `(db/entity …)`
        ;; presence: on cold reload the asset block hasn't transacted into the
        ;; main-thread DB yet even though the file loads fine from the worker.
        latest-tx (state/use-sub :db/latest-transacted-entity-uuids)
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
    ;; Load on mount + on [uuid type] change; clear+reload on retraction.
    ;; (was Rum :did-mount + :did-update)
    (hooks/use-effect!
     (fn []
       (cond
         (and asset-uuid (not= @*loaded-for [asset-uuid asset-type]))
         (do (reset! *loaded-for [asset-uuid asset-type])
             (<load-asset-url! *url *error asset-uuid asset-type
                               {:try-extensions? (nil? asset-type)
                                :*load-id *load-id}))
         (and asset-uuid (string? asset-uuid) @*url
              (let [uuid-val (try (uuid asset-uuid) (catch :default _ nil))
                    deleted (some-> latest-tx :deleted-ids)]
                (and uuid-val deleted (contains? deleted uuid-val))))
         (do (reset! *url nil)
             (reset! *error false)
             (<load-asset-url! *url *error asset-uuid asset-type
                               {:try-extensions? (nil? asset-type)
                                :*load-id *load-id})))
       js/undefined)
     [asset-uuid asset-type latest-tx])
    (shui/avatar
     {;; Force-remount when the URL transitions absent <-> present.
      ;; Radix's Avatar primitive tracks image-loading status in
      ;; context. Once Avatar.Image reports "loaded", that status
      ;; sticks even after Avatar.Image unmounts — Avatar.Fallback
      ;; reads the status and stays hidden because it thinks the
      ;; image is still loaded. Toggling the key on URL presence
      ;; forces a fresh mount with a clean status machine, so the
      ;; fallback renders the moment the URL clears (e.g. retraction
      ;; clears `*url`) and the image renders afresh when a new URL
      ;; lands.
      :key (if url "with-image" "no-image")
      :style {:width size :height size}
      :data-shape (name shape)}
     ;; Image (shows when loaded, circular with cover fit)
     (when url
       (shui/avatar-image {:src url
                           ;; Decorative: the avatar is always rendered next
                           ;; to its label (page/block title), which the
                           ;; screen reader already announces. Content-
                           ;; bearing alt would double-announce.
                           :alt ""
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
                              result))))
          spaces (find-spaces)]
      (if (seq spaces)
        ;; Split at space nearest to midpoint
        (let [best (apply min-key #(js/Math.abs (- % mid)) spaces)]
          [(string/trim (subs text 0 best))
           (string/trim (subs text (inc best)))])
        ;; No spaces: try letters+digits boundary
        (if-let [[_ letters digits] (re-matches #"^([A-Za-z]+)(\d+)$" text)]
          [letters digits]
          ;; Fallback: midpoint
          [(subs text 0 mid) (subs text mid)])))))

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
                           ;; Themed dashed border (matches Custom-tab image
                           ;; tile — see custom-tab-cp image branch).
                           :border "1px dashed var(--lx-gray-08, var(--ls-border-color, var(--rx-gray-08)))"
                           :border-radius "5px"
                           :background "var(--rx-gray-03-alpha)"
                           :color "var(--lx-gray-11, var(--ls-primary-text-color, var(--rx-gray-11)))"}}
                  (ui/icon "plus" {:size inner
                                   :style {:width inner-px
                                           :height inner-px}})])

               (and (map? normalized) (= :icon (:type normalized)) (get-in normalized [:data :value]))
               (ui/icon (get-in normalized [:data :value]) opts)

               (and (map? normalized) (= :text (:type normalized)) (get-in normalized [:data :value]))
               (let [text-value (get-in normalized [:data :value])
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
                     x (case text-align "left" 8 "right" 92 50)]
                 ;; Fill inherits via `currentColor` so the outer `color?`
                 ;; wrapper's contrast-adjusted color (icon.cljs:772-789,
                 ;; same `colors/adjust-for-contrast` path tabler icons
                 ;; use) actually reaches the text. Previously this branch
                 ;; baked the raw user-picked hex directly into `:fill`,
                 ;; which bypassed the wrapper's adjustment — a `#000000`
                 ;; pick rendered as invisible black on dark themes.
                 [:svg {:viewBox "0 0 100 100"
                        :width size :height size
                        :style {:fill "currentColor"
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

(hsx/defc get-node-icon-cp
  [node-entity opts]
  (let [;; `model/sub-block` wraps `use-query` (a hook), so it must be called
        ;; unconditionally at the top — not inside the `when-let` it used to live
        ;; in. Pass the (possibly nil) db-id; sub-block returns nil for a nil id.
        db-id (:db/id node-entity)
        reactive-block (model/sub-block db-id)
        entity (or (when db-id reactive-block) node-entity)
        node-icon (cond
                    (:own-icon? opts)
                    (get entity :logseq.property/icon)
                    (:link? opts)
                    "arrow-narrow-right"
                    :else
                    (get-node-icon entity))
        ;; Photo-based custom icons (avatar/image) default to 20px but respect caller's :size.
        ;; Callers can also pass `:avatar-size` to override only the photo branch — e.g. a
        ;; table cell can keep tabler glyphs at 16 while letting avatars breathe at 20.
        ;; Symbolic icons (emoji, tabler, text, defaults) use caller's :size or 14.
        photo-icon? (and (map? node-icon)
                         (contains? #{:avatar :image} (:type node-icon)))
        effective-size (if photo-icon?
                         (or (:avatar-size opts) (:size opts) 20)
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
        preview (state/use-sub :ui/icon-hover-preview)
        preview-active? (and preview
                             (icon-preview-matches? preview (:db/id entity) preview-property))
        preview-icon (when preview-active? (:icon preview))
        ;; Preview color is only applied when the hover-preview state
        ;; carries an explicit `:color`. Without that guard, a shape- or
        ;; fallback-only hover (which omits `:color`) would clobber the
        ;; avatar's `:backgroundColor` to "inherit" and kill the chip.
        preview-color (when preview-active? (:color preview))
        ;; Committed text/avatar icons store color at [:data :color]
        ;; (see icon-data-for-storage). Inherited icons from class
        ;; default-icon stamp color at both top-level and [:data :color]
        ;; (see get-node-icon). Read nested first so instance colors
        ;; picked via the text-picker actually reach this wrapper —
        ;; otherwise the outer .icon-cp-container falls back to
        ;; "inherit" and the inner SVG (fill: currentColor) picks up
        ;; the sidebar's muted text color instead of the user's hex.
        effective-color (cond
                          preview-color preview-color
                          :else (or (get-in node-icon [:data :color])
                                    (:color node-icon)
                                    "inherit"))
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

(defn icon-data-for-storage
  "Strip a picker-emitted icon down to fields persisted on a block. Mirrors
   `normalize-icon` (which targets rendering) but inverts intent — keep only
   what the renderer will need to reconstruct the icon, drop ephemeral
   picker state."
  [icon-data]
  (cond
    (= :text (:type icon-data))   {:type :text   :data (:data icon-data)}
    (= :avatar (:type icon-data)) {:type :avatar :data (:data icon-data)}
    (= :image (:type icon-data))  {:type :image  :id (:id icon-data) :data (:data icon-data)}
    :else                         (select-keys icon-data [:id :type :color])))

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
        results (db-utils/q '[:find ?uuid ?type ?title ?updated ?checksum ?source-url ?source-name ?license
                              :where
                              [?e :logseq.property.asset/type ?type]
                              [?e :logseq.property.asset/checksum ?checksum]
                              [?e :block/uuid ?uuid]
                              [(get-else $ ?e :block/title "") ?title]
                              [(get-else $ ?e :block/updated-at 0) ?updated]
                              [(get-else $ ?e :logseq.property.asset/source-url "") ?source-url]
                              [(get-else $ ?e :logseq.property.asset/source-name "") ?source-name]
                              [(get-else $ ?e :logseq.property.asset/license "") ?license]])]
    (->> results
         (filter (fn [[_uuid type & _]]
                   (contains? image-extensions (some-> type string/lower-case))))
         (sort-by (fn [[_uuid _type _title updated & _]] updated) >)
         ;; Deduplicate by checksum — keep the most recently updated entry
         (medley/distinct-by (fn [[_uuid _type _title _updated checksum & _]] checksum))
         (map (fn [[uuid type title _updated checksum source-url source-name license]]
                (cond-> {:block/uuid uuid
                         :block/title (if (string/blank? title) (str uuid) title)
                         :logseq.property.asset/type type
                         :logseq.property.asset/checksum checksum}
                  (not (string/blank? source-url))
                  (assoc :logseq.property.asset/source-url source-url)

                  (not (string/blank? source-name))
                  (assoc :logseq.property.asset/source-name source-name)

                  (not (string/blank? license))
                  (assoc :logseq.property.asset/license license)))))))

(defn <get-image-assets
  "Async fetch image assets from DB worker (works on cold start).
   Returns a promise that resolves to a list of asset maps.
   Uses transact-db? false to avoid re-transacting deleted assets back into frontend."
  []
  (when-let [graph (state/get-current-repo)]
    (p/let [results (db-async/<q graph
                                 {:transact-db? false}
                                 '[:find (pull ?e [:block/uuid :block/title :logseq.property.asset/type :logseq.property.asset/checksum :logseq.property.asset/source-url :logseq.property.asset/source-name :logseq.property.asset/license :block/updated-at])
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
  (let [byte-arr  (js/Uint8Array. array-buffer)
        len       (.-length byte-arr)
        b         (fn [i] (when (< i len) (aget byte-arr i)))
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
                   (log/error :icon/url-asset-fetch-failed {:url url :error err})
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
                 (log/error :icon/url-asset-ipc-failed {:url url :error err})
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

(defn <save-image-asset!
  "Save an image file as an asset using api-insert-new-block! approach.
   Creates the asset as a child of the Asset class page (like tag tables do),
   avoiding journal entries.
   Optional source-meta map: {:source-url, :source-name, :license, :attribution}
   is persisted as additional asset properties when provided."
  ([repo file] (<save-image-asset! repo file nil))
  ([repo ^js file source-meta]
   (p/let [file-name (node-path/basename (.-name file))
           file-name-without-ext* (db-asset/asset-name->title file-name)
           file-name-without-ext (if (= file-name-without-ext* "image")
                                   (date/get-date-time-string-2)
                                   file-name-without-ext*)
           checksum (assets-handler/get-file-checksum file)
           existing-asset (some->> checksum (db-async/<get-asset-with-checksum repo))]
     (if existing-asset
       ;; Reuse existing asset — skip file write and block creation
       existing-asset
       (p/let [[repo-dir asset-dir-rpath] (assets-handler/ensure-assets-dir! repo)
               size (.-size file)
               ext (db-asset/asset-path->type file-name)
               asset-class (db/entity :logseq.class/Asset)
               block-id (ldb/new-block-id)
               extra-props (source-meta->properties source-meta)]
         (when (and ext asset-class)
           ;; Write file to disk
           (p/let [_ (let [file-path (str block-id "." ext)
                           file-rpath (str asset-dir-rpath "/" file-path)]
                       (write-asset-file! repo repo-dir file file-rpath))
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
             (db/entity [:block/uuid (:block/uuid block)]))))))))

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
       (<save-image-asset! repo file source-meta)))))

;; ============================================================================
;; Web Image Search (Wikipedia Commons)
;; ============================================================================

;; The legacy "Always add without asking" preference is meaningless now that
;; clicks commit directly. Drop the lingering localStorage key once per app
;; load so it doesn't sit around as a footgun for future debugging.
#_:clj-kondo/ignore
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

(defn license->description
  "Convert license code to human-readable description. Public so both the
   web-image search path and the asset-block hover preview can consume it."
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
                      ;; csk/->Camel_Snake_Case treats "AB" in IconAB / IconAB2 / IconABOff
                      ;; as an acronym and lowercases the B, producing labels "Ab" / "Ab 2"
                      ;; / "Ab Off". The renderer's reverse lookup (label → tabler key)
                      ;; then expects "IconAb" and misses the real "IconAB" export — so
                      ;; the icon renders empty. Filter them out so they don't surface
                      ;; as broken entries in search. Other consecutive-cap exports
                      ;; (IconEPassport, IconSTurnDown) survive because the second cap
                      ;; is followed by lowercase letters, which preserves the boundary.
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

(defn- search-assets
  "Fuzzy-match local assets by :block/title. `assets` is the per-picker
   in-memory cache (loaded once on mount). No DB query happens here."
  [q assets]
  (when (and (string? q) (not (string/blank? q)) (seq assets))
    (->> (search/fuzzy-search assets q :limit 50 :extract-fn :block/title)
         (map (fn [asset]
                (let [uuid (:block/uuid asset)
                      atype (:logseq.property.asset/type asset)]
                  {:type :image
                   :id (str "image-" uuid)
                   :label (or (:block/title asset) (str uuid))
                   :asset asset
                   :data {:asset-uuid (str uuid)
                          :asset-type atype}}))))))

(defn- search
  [q tab assets opts]
  (p/let [icons (when (not= tab :emoji) (search-tabler-icons q))
          emojis' (when (not= tab :icon) (search-emojis q))
          assets' (when (and (= tab :all)
                             (not (:no-assets? opts)))
                    (search-assets q assets))]
    {:icons icons
     :emojis emojis'
     :assets assets'}))

(hsx/defc icons-row
  [items]
  [:div.its.icons-row items])

(hsx/defc icon-cp
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

(hsx/defc emoji-cp
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

(hsx/defc text-cp
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

(hsx/defc avatar-cp
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

(hsx/defc image-cp
  "Compact image-asset tile for the flex-wrap row layout (recently-used).
   Search-results assets render via a dedicated 5-col grid using
   `image-asset-item` directly — that path bypasses `render-item`."
  [icon-item {:keys [on-chosen hover on-tile-hover! highlighted-id ghost-highlighted-id wave]}]
  (let [asset-uuid (get-in icon-item [:data :asset-uuid])
        asset-type (get-in icon-item [:data :asset-type])
        my-id (:id icon-item)
        item-shape (select-keys icon-item [:type :id :label :data])]
    (when (and (string? asset-uuid) (not (string/blank? asset-uuid)))
      [:button.w-9.h-9.transition-opacity.overflow-hidden.rounded
       {:tabIndex "-1"
        :data-item-id my-id
        :class (cond
                 (= my-id highlighted-id) "is-highlighted"
                 (= my-id ghost-highlighted-id) "is-ghost-highlighted")
        :style (when wave {"--r" (:r wave) "--c" (:c wave)})
        :title (:label icon-item)
        :on-click (fn [e] (on-chosen e item-shape))
        :on-mouse-over (fn []
                         (some-> hover (reset! item-shape))
                         (some-> on-tile-hover! (apply [item-shape])))
        :on-mouse-out #()}
       (image-icon-cp asset-uuid asset-type {:size 32})])))

(defn render-item
  "Render an icon-item based on its type"
  [icon-item opts]
  (case (:type icon-item)
    :emoji (emoji-cp icon-item opts)
    :icon (icon-cp icon-item opts)
    :text (text-cp icon-item opts)
    :avatar (avatar-cp icon-item opts)
    :image (image-cp icon-item opts)
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

(hsx/defc section-header
  [{:keys [title count total-count expanded? keyboard-hint on-toggle focus-region simple? title-extra]}]
  [:div.section-header.text-xs.py-1.5.px-3.flex.justify-between.items-center.gap-2.bg-gray-02.h-8
   {:style {:color "var(--lx-gray-11, var(--ls-primary-text-color, var(--rx-gray-11)))"}}
   ;; Left: Title · (title-extra) · total-count · Chevron
   ;; The toggle handler is wired to the title span and the count/chevron span
   ;; separately — title-extra (e.g. an info-icon tooltip) sits between them
   ;; without a click handler, so clicking it opens its own UI without firing
   ;; `on-toggle`. (Using one cluster-wide handler + stopPropagation on
   ;; title-extra was attempted but didn't reliably stop the bubble through
   ;; Radix-wrapped triggers.)
   [:div.flex.items-center.gap-1.select-none
    [:span.font-bold
     (when-not simple? {:class "cursor-pointer"
                        :on-click on-toggle})
     title]
    (when title-extra title-extra)
    [:span.flex.items-center.gap-1
     (when-not simple? {:class "cursor-pointer"
                        :on-click on-toggle})
     (when (or total-count count)
       [:<>
        [:span "·"]
        [:span {:style {:font-size "0.7rem"}}
         (or total-count count)]])
     (when-not simple?
       (ui/icon (if expanded? "chevron-down" "chevron-right") {:size 14}))]]

   [:div.flex-1] ; Spacer

   ;; Right: Hide/Show with keyboard shortcut. Visible when navigating grid/tabs;
   ;; also revealed on cursor hover via `.section-header:hover .section-header-hint`
   ;; (see icon.css) so mouse users discover the shortcut as they reach for the chevron.
   (when keyboard-hint
     (let [show-hint? (contains? #{:grid :tabs} focus-region)]
       [:div.section-header-hint.flex.gap-1.items-center.text-xs.opacity-50.transition-all.duration-200
        {:class (when-not show-hint? "!opacity-0")
         :style {:pointer-events (if show-hint? "auto" "none")}}
        (if expanded? (t :icon.section-header/hide) (t :icon.section-header/show))
        (shui/shortcut keyboard-hint {:style :compact})]))])

(hsx/defc pane-section
  [label icon-items & {:keys [collapsible? keyboard-hint total-count searching? virtual-list? render-item-fn expanded? focus-region show-header? *virtuoso-ref header-cp]
                       :or {virtual-list? true collapsible? false expanded? true show-header? true}
                       :as opts}]
  (let [*el-ref (hooks/use-ref nil)
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
               step icon-grid-cols
               rows (quot total step)
               mods (mod total step)
               rows (if (zero? mods) rows (inc rows))
               items (vec icon-items)]
           (ui/virtualized-list
            (cond-> {:total-count rows
                     :ref (fn [^js el]
                            (when *virtuoso-ref
                              (reset! *virtuoso-ref el)))
                     ;; Single-scroller layout: Virtuoso delegates
                     ;; scrolling to the nearest `.bd-scroll` ancestor
                     ;; instead of creating its own internal scroller.
                     ;; This keeps `.bd` as the only scroll surface
                     ;; across every picker mode (All / Emojis / Icons /
                     ;; reaction / search), reclaiming the ~6px the
                     ;; inner Virtuoso scrollbar would otherwise eat so
                     ;; the 9-column grid stays at 9. On first render
                     ;; the ref isn't attached yet and this is `nil`;
                     ;; Virtuoso falls back to internal scrolling for
                     ;; one frame, then re-renders with the parent.
                     :custom-scroll-parent (some-> (hooks/deref *el-ref) (.closest ".bd-scroll"))
                     :item-content (fn [idx]
                                     (icons-row
                                      (let [last? (= (dec rows) idx)
                                            start (* idx step)
                                            end (* (inc idx) (if (and last? (not (zero? mods))) mods step))
                                            icons (try (subvec items start end)
                                                       (catch js/Error e
                                                         (log/error :icon/grid-subvec-failed
                                                                    {:start start :end end :count (count items) :error e})
                                                         nil))]
                                        (vec (map-indexed
                                              (fn [c-idx item]
                                                (render-fn item (assoc opts :wave {:r idx :c c-idx})))
                                              icons)))))}

              header-cp
              (assoc :components #js {:Header header-cp}))))
         [:div.its
          (map-indexed
           (fn [i item]
             (render-fn item (assoc opts :wave {:r (quot i icon-grid-cols) :c (mod i icon-grid-cols)})))
           icon-items)]))]))

(def reaction-picker-opts
  "Standard opts for the minimal emoji-only reaction picker. Callers
   `merge` their own `:on-chosen` (and any additional opts) onto this."
  {:allowed-tabs [:emoji]
   :hide-topbar? true
   :show-used? true
   :icon-value nil})

(declare get-used-items)

(hsx/defc emojis-cp
  [emojis* {:keys [show-used?] :as opts}]
  (let [used-emojis (when show-used?
                      (->> (get-used-items)
                           (filterv #(= :emoji (:type %)))))
        has-recents? (seq used-emojis)
        icon-items (map (fn [emoji]
                          {:type :emoji
                           :id (:id emoji)
                           :label (or (:name emoji) (:id emoji))
                           :data {:value (:id emoji)}})
                        emojis*)]
    ;; Recents render as a sibling pane-section above the full grid.
    ;; Single scroll surface (.bd) means a sibling no longer triggers
    ;; a second scrollbar — same compositional pattern as `all-pane`.
    ;; The Emojis header doubles as the visual divider between the two
    ;; sections; suppress it when there are no recents (full picker
    ;; Emojis tab) to keep the picker minimal there.
    [:<>
     (when has-recents?
       (pane-section "Recently used" used-emojis
                     (assoc opts :virtual-list? false)))
     (pane-section "Emojis" icon-items
                   (assoc opts :show-header? has-recents?))]))

(hsx/defc icons-cp
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
        ;; Filter dupes across the WHOLE existing list, not just the first 24
        ;; — otherwise an existing duplicate beyond position 24 stays in storage
        ;; on the next call. Then cons the new pick and cap at 24.
        s (some->> (or (get-used-items) [])
                   (filter should-keep?)
                   (cons normalized)
                   (take 24))]
    (storage/set :ui/ls-icons-used-v2 s)))

(defn derive-initials
  "Derive initials from a page title (max 8 chars). Case is preserved
   from the source. Strips locale-aware honorific prefixes (e.g. 'Dr.',
   'Prof.') before tokenizing, so 'Dr. David Kowalski' yields 'DK'
   instead of 'DD'."
  [title]
  (when title
    (let [title (i18n/strip-leading-honorific title (i18n/preferred-locale))
          words (string/split (string/trim title) #"\s+")
          initials (if (> (count words) 1)
                     ;; Take first letter of first two words
                     (str (subs (first words) 0 1)
                          (subs (second words) 0 1))
                     ;; Single word: take first 2 chars
                     (subs (first words) 0 (min 2 (count (first words)))))]
      (subs initials 0 (min 8 (count initials))))))

(defn derive-avatar-initials
  "Derive initials from a page title (max 2-3 chars for avatars, always
   uppercase). Strips locale-aware honorific prefixes before tokenizing
   so 'Dr. David Kowalski' yields 'DK' instead of 'DD'."
  [title]
  (when title
    (let [title (i18n/strip-leading-honorific title (i18n/preferred-locale))
          words (string/split (string/trim title) #"\s+")
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
   Strips locale-aware honorific prefixes for consistency with derive-initials.
   Examples: 'Software Engineer' -> 'Soft Eng', 'Math 203' -> 'Math 203'"
  [title]
  (when title
    (let [title (i18n/strip-leading-honorific title (i18n/preferred-locale))
          normalized (normalize-word-boundaries (string/trim title))
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

(hsx/defc text-tab-cp
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
        (t :icon.text-tab/empty-prompt)]])))

(hsx/defc avatar-tab-cp
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
        (t :icon.avatar-tab/empty-prompt)]])))

(hsx/defc custom-tab-cp
  "Combined tab showing Text, Avatar, and Image options side by side"
  [*q page-title *color *view *asset-picker-initial-mode _icon-value opts]
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
        _preview-target-db-ids (:preview-target-db-ids opts)
        scope-property (or (:property opts) :logseq.property/icon)
        hover-preview-state (state/use-sub :ui/icon-hover-preview)
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
     ;; Text option. In page-icon context: commits the synthesized
     ;; Initials text-item immediately (mirrors the Avatar/Image
     ;; tiles' commit-on-click pattern), then lands on the
     ;; text-picker so the user can customize mode / text / color /
     ;; alignment. Without the commit-on-click the page icon would
     ;; revert to the prior icon (e.g. an emoji) the instant the
     ;; hover preview cleared on click, since text-picker's
     ;; `:will-mount` doesn't write a preview. Closing the popup
     ;; without further edits would then *also* commit a text icon
     ;; via text-picker's `:will-unmount` — making the de-facto
     ;; semantic "opening text-picker overwrites the prior icon"
     ;; already. Committing on click makes that semantic explicit
     ;; and removes the stale-preview window.
     (when text-item
       [:button.custom-tab-item
        {:data-item-id "custom-text"
         :tabIndex "-1"
         :class (when (= "custom-text" highlighted-id) "is-highlighted")
         :on-click (if default-icon?
                     #(when on-chosen (on-chosen % text-item))
                     (fn [e]
                       (when on-chosen (on-chosen e text-item true))
                       (reset! *view :text-picker)))
         :on-mouse-over (fn [] (some-> on-tile-hover! (apply [text-item])))}
        [:div.custom-tab-item-preview {:aria-hidden "true"}
         ;; `:color? true` wraps the SVG in `.ls-icon-color-wrap` so the
         ;; text-tile preview picks up the user's selected color via
         ;; `currentColor` (avatar and image previews use other paths,
         ;; but text icons rely on this wrapper to colorize their fill).
         (icon text-item {:size 32 :color? true})]
        [:span.custom-tab-item-label (t :icon.mode/text)]])

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
        [:span.custom-tab-item-label (t :icon.mode/avatar)]])

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
                 ;; Themed dashed border via `--ls-border-color` middle
                 ;; step (matches the ghost-highlight outline pattern).
                 :border "1px dashed var(--lx-gray-08, var(--ls-border-color, var(--rx-gray-08)))"
                 :border-radius "3px"
                 :display "flex"
                 :align-items "center"
                 :justify-content "center"
                 :background "var(--rx-gray-03-alpha)"}}
        (shui/tabler-icon "photo" {:size 20 :style {:color "var(--lx-gray-11, var(--ls-primary-text-color, var(--rx-gray-11)))"}})]]
      [:span.custom-tab-item-label (t :icon.mode/image)]]]))

;; <load-asset-url! is defined near the top of the file (unified loader with retry + extension guessing)

(declare web-image-card-content)

(defn- asset->preview-data
  "Normalize an asset block + its resolved blob URL into the shape that
   `web-image-card-content` consumes (the same hover-preview component
   used by the web-image search results). Returns nil when no URL is
   resolved yet — the preview body needs an image to render meaningfully.

   `:source` is derived from `source-name` so the existing case in the
   preview body still routes Wikipedia/Wikimedia Commons to their named
   labels. For other sources we let `source-name` drive the display
   directly (the preview component prefers explicit `source-name` over
   the keyword)."
  [asset url]
  (when url
    (let [source-name (:logseq.property.asset/source-name asset)
          source-url  (:logseq.property.asset/source-url asset)
          license     (:logseq.property.asset/license asset)
          source-kw   (cond
                        (not source-name) nil
                        (re-find #"(?i)wikimedia\s+commons" source-name) :wikipedia-commons
                        (re-find #"(?i)wikipedia" source-name)            :wikipedia
                        :else                                              :other)]
      {:url         url
       :thumb-url   url
       :title       (:block/title asset)
       :source      source-kw
       :source-name source-name
       :source-url  source-url
       :license     license
       :license-desc (license->description license)})))

(hsx/defc image-asset-item
  "Renders a single image asset thumbnail in the asset picker grid.
   When avatar-context is provided, renders circular previews and returns avatar data.
   Returns nil if asset file doesn't exist (ghost asset).

   The button is wrapped in a `shui/tooltip` that surfaces the same
   hover-preview card the web-image lane uses — bigger thumbnail, plus
   `From:` and license badge when the asset has source / license metadata
   (web-downloaded assets do; locally-uploaded assets gracefully degrade
   to image + title only). Preview only renders once the blob URL has
   resolved; ghost assets (load errors) skip it."
  [asset {:keys [on-chosen avatar-context selected? item-id highlighted? ghost-highlighted? variant]}]
  (let [*url (hooks/use-memo #(atom nil) [])
        *error (hooks/use-memo #(atom false) [])
        [url] (hooks/use-atom *url)
        [error?] (hooks/use-atom *error)
        asset-type (:logseq.property.asset/type asset)
        asset-uuid (:block/uuid asset)
        asset-title (or (:block/title asset) (str asset-uuid))
        avatar-mode? (some? avatar-context)
        search-variant? (= variant :search)
        button-hiccup
        [:button.image-asset-item
         {:title asset-title
          :data-item-id item-id
          :class (util/classnames [{:avatar-mode avatar-mode?
                                    :search-variant search-variant?
                                    :selected selected?
                                    ;; Ghost icon is hidden in :search to avoid an ugly
                                    ;; refresh-affordance in a short-lived results grid.
                                    ;; The 3 silent retries still run below the surface;
                                    ;; users see broken tiles as empty slots and skip them.
                                    :ghost-asset (and error? (not search-variant?))
                                    :is-highlighted highlighted?
                                    :is-ghost-highlighted ghost-highlighted?}])
          :on-click (fn [e]
                      (if (and error? (not search-variant?))
                        ;; Click-to-retry on ghost assets (only in the asset-picker
                        ;; surface; search variant doesn't surface the affordance).
                        (do (reset! *error false)
                            (<load-asset-url! *url *error asset-uuid asset-type {}))
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
           (and error? (not search-variant?))
           [:div.ghost-asset-placeholder
            {:title (t :icon.asset/retry-load-tooltip)}
            (ui/icon "refresh" {:size 16})]
           url
           [:img {:src url
                  :loading "lazy"
                  :on-error (fn [_e]
                              ;; Blob URL became invalid — mark as error so user can retry
                              (reset! *url nil)
                              (reset! *error true))}]
           :else
           [:div.bg-gray-04 (when-not search-variant? {:class "animate-pulse"})])]]
    ;; Load the asset thumbnail on mount (was Rum :did-mount).
    (hooks/use-effect!
     (fn []
       (when (and asset-uuid asset-type)
         (<load-asset-url! *url *error asset-uuid asset-type {}))
       js/undefined)
     [asset-uuid asset-type])
    (if-let [preview (and (not error?) (asset->preview-data asset url))]
      ;; Tooltip delay: 200ms in search (fast intent), 400ms in picker (browse intent).
      (shui/tooltip-provider
       {:delay-duration (if search-variant? 200 400) :skip-delay-duration 100}
       (shui/tooltip
        (shui/tooltip-trigger
         {:as-child true}
         button-hiccup)
        (shui/tooltip-content
         {:side "top" :align "center" :class "web-image-card-popup"
          :side-offset 8 :collision-padding 8}
         (web-image-card-content preview))))
      button-hiccup)))

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

(hsx/defc web-image-card-content
  "Pure-render preview block: blurred-bg + sharp overlay + maximize button +
   title + source · license + license badge. Used as the tooltip content for
   web-image tiles AND for asset-block tiles in the recents / available
   lanes (via `asset->preview-data`). No buttons, no checkbox — clicking
   the tile commits.

   Adapts to missing metadata: when `source` and `source-name` are nil
   (e.g. a locally-uploaded asset), the source row is omitted entirely
   rather than rendering a misleading 'From: Web' fallback. The license
   badge already gates on `license-desc`. Result: local uploads render
   image + title only, fitting the card without empty bands."
  [{:keys [url thumb-url title license license-desc source source-name]}]
  (let [source-label (cond
                       source-name source-name
                       (= source :wikipedia) (t :icon.web-images/wikipedia)
                       (= source :wikipedia-commons) (t :icon.web-images/wikipedia-commons)
                       :else nil)
        source-text (when source-label
                      (str "From: " source-label
                           (when license (str " · " license))))
        display-url (or thumb-url url)
        use-blur? (should-use-blur-bg? display-url)]
    [:div.web-image-card
     [:div.preview-image
      (when use-blur?
        [:img.blur-bg {:src display-url :alt ""}])
      [:img.preview-img {:src display-url
                         :alt (if source-label
                                (t :icon.web-images/image-alt-from-source
                                   (or title (t :icon.web-images/image-fallback-title))
                                   source-label)
                                (or title (t :icon.web-images/image-fallback-title)))}]
      [:button.maximize-btn
       {:aria-label (t :icon.web-images/view-full-size)
        :on-pointer-down (fn [e]
                           ;; Stop the click bubbling to the underlying tile.
                           ;; Without this, opening the lightbox would also
                           ;; commit the image to the page-icon.
                           (.stopPropagation e))
        :on-click (fn [e]
                    (.stopPropagation e)
                    ;; The lightbox wrapper (extensions/lightbox.cljs)
                    ;; installs a window-capture pointerdown/click swallow
                    ;; for any target outside `.pswp` for its lifetime, so
                    ;; the asset picker stays visually open behind the
                    ;; lightbox but Radix's dismiss handler never runs
                    ;; and stray clicks don't fall through to the page.
                    ;; PhotoSwipe restores focus to this button on close.
                    ;;
                    ;; Pick the URL we feed to PhotoSwipe with care:
                    ;; - For Wikimedia results, `:url` may be the original
                    ;;   source file (sometimes a PDF or DJVU for scanned
                    ;;   documents). `:thumb-url` is always a server-
                    ;;   rendered JPG. We upscale the thumb URL's
                    ;;   `NNNpx-` segment to a high-res value so the
                    ;;   lightbox loads a large JPG render rather than a
                    ;;   PDF that PhotoSwipe can't display. PDF and DJVU
                    ;;   thumbs use `/pageN-NNNpx-` so we match the size
                    ;;   token without anchoring to the slash.
                    ;;   Wikimedia's PdfHandler caps PDF/DJVU thumbs at
                    ;;   1280px wide; requesting 1600 returns HTTP 400.
                    ;;   Clamp the target accordingly when we detect the
                    ;;   `/pageN-` prefix.
                    ;; - For local blob URLs the regex doesn't match and
                    ;;   `(or url thumb-url)` flows through unchanged.
                    ;; Then PhotoSwipe needs real dimensions (passing 0/0
                    ;; stretches the image without a backdrop). Always
                    ;; probe via `new Image()` after upscaling so the
                    ;; declared dims match the actual image we serve. If
                    ;; the upscaled URL fails — some Wikimedia files
                    ;; don't have every size cached — fall back to the
                    ;; original thumb URL, which we know loaded in the
                    ;; hover preview. Lose resolution to gain a viewable
                    ;; image, rather than showing the "cannot be loaded"
                    ;; placeholder.
                    (let [base-thumb thumb-url
                          pdf-thumb? (and base-thumb
                                          (re-find #"/page\d+-\d+px-" base-thumb))
                          target-px (if pdf-thumb? "1280px-" "1600px-")
                          upscaled (when (and base-thumb
                                              (re-find #"\d+px-" base-thumb))
                                     (string/replace base-thumb
                                                     #"\d+px-"
                                                     target-px))
                          src (or upscaled url thumb-url)
                          open! (fn [s w h]
                                  (lightbox/preview-images!
                                   [{:src s :w w :h h}]))
                          ^js probe (js/Image.)]
                      (set! (.-onload probe)
                            (fn [_] (open! src
                                           (.-naturalWidth probe)
                                           (.-naturalHeight probe))))
                      (set! (.-onerror probe)
                            (fn [_]
                              (if (and base-thumb (not= base-thumb src))
                                (let [^js retry (js/Image.)]
                                  (set! (.-onload retry)
                                        (fn [_] (open! base-thumb
                                                       (.-naturalWidth retry)
                                                       (.-naturalHeight retry))))
                                  (set! (.-onerror retry)
                                        (fn [_] (open! src 1600 1200)))
                                  (set! (.-src retry) base-thumb))
                                (open! src 1600 1200))))
                      (set! (.-src probe) src)))}
       (shui/tabler-icon "arrows-maximize" {:size 16})]]
     [:div.content-wrapper
      [:div.image-info
       [:div.image-title (or title (t :icon.web-images/untitled))]
       (when source-text
         [:div.image-source {:style {:color "var(--lx-gray-11, var(--ls-primary-text-color, var(--rx-gray-11)))"}} source-text])
       (when license-desc
         [:div.license-badge license-desc])]]]))

(hsx/defc web-image-item
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
                  :wikipedia-commons (t :icon.web-images/commons-short)
                  :wikipedia (t :icon.web-images/wikipedia)
                  (t :icon.web-images/web))
                (when license (str " · " license)))])])
      (shui/tooltip-content
       {:side "top" :align "center" :class "web-image-card-popup"
        :side-offset 8 :collision-padding 8}
       (web-image-card-content web-image))))))

(hsx/defc web-images-section
  "Renders the web images section with loading states.
   query: search query (page title or user input)
   on-select: callback when user selects a web image
   avatar-context: if set, picker is in avatar mode
   *result-sink: optional atom to publish current results to (for parent
     keyboard-nav)
   highlighted-id: stable id of currently-highlighted tile (string), or nil
   ghost-highlighted-id: stable id of the ghost-highlighted tile (hint that
     Enter-from-search will pick this one), or nil"
  [{:keys [query on-select avatar-context user-typing?
           highlighted-id ghost-highlighted-id focus-region saved-source-urls *result-sink]}]
  (let [*images (hooks/use-memo #(atom nil) [])
        *loading? (hooks/use-memo #(atom true) [])
        *current-query (hooks/use-memo #(atom nil) [])
        *search-error? (hooks/use-memo #(atom false) [])
        *request-id (hooks/use-memo #(atom 0) [])
        [images] (hooks/use-atom *images)
        ;; `saved-source-urls` is a set of source URLs for assets the user has
        ;; already downloaded locally. We don't filter those tiles out — hiding
        ;; them on a 5-wide row collapses the layout and reads as a broken
        ;; search when the user has saved 3 of the top hits. Instead, the per-
        ;; tile `saved?` flag swaps the corner globe overlay for a green check
        ;; badge, and the click routes through the existing asset (no redownload).
        [loading?] (hooks/use-atom *loading?)
        [current-query] (hooks/use-atom *current-query)
        [search-error?] (hooks/use-atom *search-error?)
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
        web-expanded? (get (first (hooks/use-atom *section-states)) "Web images" true)]
    ;; Fetch web images on mount + when the query changes. (was Rum :did-mount + :did-update)
    (hooks/use-effect!
     (fn []
       (let [publish! (fn [results error?]
                        (reset! *images results)
                        (reset! *search-error? (boolean error?))
                        (when *result-sink (reset! *result-sink (vec results))))]
         (when (and (not (string/blank? query))
                    (not= query @*current-query))
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
       js/undefined)
     [query])
    ;; Hide only when a settled fetch returned no results AND there was no
    ;; network error. During any transition we keep the section mounted and
    ;; show skeletons so the layout below doesn't jump. When the network
    ;; failed and we have nothing to show, we surface an inline error.
    (when-not (and (not show-loading?) (not search-error?) (empty? images))
      [:div.pane-section.web-images-section
       (section-header {:title "Web images"
                        :count (when-not show-loading? (count images))
                        :expanded? web-expanded?
                        :keyboard-hint "alt mod 2"
                        :focus-region focus-region
                        :on-toggle #(swap! *section-states update "Web images" (fn [v] (if (nil? v) false (not v))))
                        :title-extra
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
                            [:div.text-sm.font-medium (t :icon.web-images/info-title)]
                            [:div.text-xs.opacity-70.mt-1 (t :icon.web-images/info-desc)]])))})

       ;; Image grid (or inline network-error message)
       (when web-expanded?
         (cond
           (and search-error? (not show-loading?) (empty? images))
           [:div.web-images-error
            (shui/tabler-icon "wifi-off" {:size 14})
            [:span (t :icon.web-images/network-error)]]

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
                ^{:key web-id}
                [web-image-item
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
                  :avatar-mode? avatar-mode?}]))]))])))

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

(hsx/defc multi-file-preview
  [files on-confirm on-cancel]
  (let [image-files (filter #(contains? config/image-formats
                                        (keyword (second (string/split (.-type %) "/"))))
                            files)
        other-files (remove #(contains? config/image-formats
                                        (keyword (second (string/split (.-type %) "/"))))
                            files)]
    [:div.multi-file-preview.p-4.space-y-4
     [:h3.text-base.font-semibold
      (t :icon.upload/multi-file-confirm-title (count image-files))]

     ;; File list
     [:div.space-y-1.max-h-64.overflow-y-auto
      (for [file image-files]
        [:div.text-sm.py-1
         {:key (.-name file)}
         [:span.truncate (.-name file)]])]

     ;; Warning for skipped files
     (when (seq other-files)
       [:div.text-sm.text-yellow-09.bg-yellow-02.rounded.px-3.py-2
        (t :icon.upload/skip-non-image-warning (count other-files))])

     ;; Action buttons
     [:div.flex.gap-2.justify-end
      (shui/button {:variant :outline :on-click on-cancel} (t :ui/cancel))
      (shui/button {:on-click on-confirm} (t :icon.upload/action))]]))

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

(hsx/defc asset-picker
  [{:keys [on-chosen on-back on-delete del-btn? delete-mode current-icon avatar-context page-title
           *color preview-target-db-id preview-target-db-ids preview-inheritor-db-ids property initial-mode]
    :or {property :logseq.property/icon}}]
  (let [*search-q (hooks/use-memo #(atom "") [])
        *loading? (hooks/use-memo #(atom true) [])
        *loaded-assets (hooks/use-memo #(atom nil) [])
        *web-query-debounced (hooks/use-memo #(atom nil) [])
        *mode (hooks/use-memo #(atom (cond (#{:avatar :image} initial-mode) initial-mode
                                           (= :image (:type current-icon)) :image
                                           (= :avatar (:type current-icon)) :avatar
                                           (some? avatar-context) :avatar
                                           :else :avatar)) [])
        *customize-expanded? (hooks/use-memo #(atom false) [])
        *fallback-menu-open? (hooks/use-memo #(atom false) [])
        *paste-handler (hooks/use-memo #(atom nil) [])
        *focus-region (hooks/use-memo #(atom :search) [])
        *highlighted-index (hooks/use-memo #(atom nil) [])
        *web-images-result (hooks/use-memo #(atom nil) [])
        *web-image-save-id (hooks/use-memo #(atom 0) [])
        *pending-icon (hooks/use-memo #(atom nil) [])
        *drag-active? (hooks/use-memo #(atom false) [])
        *drag-depth (hooks/use-memo #(atom 0) [])
        *asset-picker-open? (hooks/use-memo #(atom false) [])
        *upload-status (hooks/use-memo #(atom "") [])
        *root-ref (hooks/use-ref nil)
        *search-input-ref (hooks/use-ref nil)
        *update-web-query! (hooks/use-memo #(debounce (fn [q] (reset! *web-query-debounced q)) 500) [])
        delete-mode (or delete-mode (if del-btn? :remove :hidden))
        on-chosen* (fn [e v & remaining]
                     (reset! *pending-icon v)
                     (apply on-chosen e v remaining))
        [pending-icon] (hooks/use-atom *pending-icon)
        [web-images] (hooks/use-atom *web-images-result)
        [highlighted-idx] (hooks/use-atom *highlighted-index)
        ;; Subscribe to these atoms unconditionally at the top level (Rules of
        ;; Hooks); the render-site reads below reference these bound values.
        ;; The old code subscribed inside `(when avatar-mode? …)` and a
        ;; results branch, changing hook order across renders.
        section-states (first (hooks/use-atom *section-states))
        customize-expanded? (first (hooks/use-atom *customize-expanded?))
        loading? (first (hooks/use-atom *loading?))
        ;; Use cached assets if available, otherwise try to get them
        assets (or (first (hooks/use-atom *loaded-assets)) [])
        search-q @*search-q
        ;; Web search query: use search input if typing, otherwise use page title
        web-query (first (hooks/use-atom *web-query-debounced))
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
        *mode *mode
        mode (first (hooks/use-atom *mode))
        avatar-mode? (= :avatar mode)
        ;; Stable avatar "template" used both when synthesizing an avatar from
        ;; an :image icon and when the caller didn't supply an avatar-context.
        synthesized-avatar-context
        (or avatar-context
            (let [gray-var (colors/variable :gray :09)
                  gray-hex (or (colors/->hex gray-var) gray-var)]
              {:type :avatar
               :id (str "avatar-" (or page-title "page"))
               :label (or page-title "")
               :data {:value (derive-avatar-initials (or page-title ""))
                      :backgroundColor gray-hex
                      :color gray-hex}}))
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
        hover-preview-state (state/use-sub :ui/icon-hover-preview)
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
        update-web-query! *update-web-query!
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

                               (p/let [new-entities (p/all (map #(<save-image-asset! repo %) new-files))
                                       entities (into (vec (remove nil? new-entities)) reused-entities)]
                                 (p/let [updated-assets (<get-image-assets)]
                                   (reset! *loaded-assets (or (seq updated-assets) [])))

                                 ;; Show feedback notification
                                 (let [new-count (count (remove nil? new-entities))
                                       reused-count (count reused-entities)]
                                   (cond
                                     (and (pos? new-count) (zero? reused-count) (empty? rejected-files))
                                     (shui/toast! (t :icon.upload/uploaded-success new-count)
                                                  :success)

                                     (and (pos? new-count) (pos? reused-count))
                                     (shui/toast! (t :icon.upload/uploaded-mixed-success new-count reused-count)
                                                  :success)

                                     (and (zero? new-count) (pos? reused-count))
                                     (shui/toast! (t :icon.upload/all-existed-success reused-count)
                                                  :success)

                                     (seq rejected-files)
                                     (shui/toast! (t :icon.upload/skipped-non-images-error (count rejected-files))
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
        _trigger-upload!
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
                   (shui/toast! (t :icon.clipboard/no-image-or-url-warning) :warning)

                   :error
                   (shui/toast! (t :icon.clipboard/read-error) :warning)))
               (p/catch (fn [err]
                          (log/error :icon/clipboard-paste-failed {:error err})
                          (shui/toast! (url-save-error-copy err) :error))))))

        ;; Keep the DOM paste listener pointed at the freshest closure.
        _ (reset! *paste-handler handle-clipboard-paste)]
    (hooks/use-effect!
     (fn []
       (reset! *asset-picker-open? true)
       (let [sync-assets (get-image-assets)]
         (when (seq sync-assets)
           (reset! *loaded-assets sync-assets)
           (reset! *loading? false))
         (-> (<get-image-assets)
             (p/then (fn [async-assets]
                       (when @*asset-picker-open?
                         (reset! *loaded-assets (vec async-assets))
                         (reset! *loading? false))))
             (p/catch (fn [_err]
                        (when @*asset-picker-open?
                          (reset! *loading? false))))))
       (when-let [^js zone (some-> (hooks/deref *root-ref) (.querySelector ".avatar-customize-zone"))]
         (.setAttribute zone "data-prewarming" "")
         (.setAttribute zone "data-expanded" "true")
         (.-offsetHeight zone)
         (.removeAttribute zone "data-expanded")
         (.-offsetHeight zone)
         (.removeAttribute zone "data-prewarming"))
       (let [node (hooks/deref *root-ref)
             listener (fn [^js e]
                        (let [target (.-target e)
                              tag (some-> target .-tagName string/lower-case)
                              in-input? (contains? #{"input" "textarea"} tag)
                              clipboard-data (.-clipboardData e)
                              items (some-> clipboard-data .-items)
                              has-image? (when items
                                           (some (fn [k]
                                                   (let [it (aget items k)]
                                                     (and it (some-> it .-type (string/starts-with? "image/")))))
                                                 (range (.-length items))))]
                          (when (or has-image? (not in-input?))
                            (.preventDefault e)
                            (when-let [h @*paste-handler]
                              (h e)))))]
         (when node (.addEventListener node "paste" listener))
         (fn []
           (when (and node listener)
             (try (.removeEventListener node "paste" listener) (catch :default _ nil)))
           (reset! *asset-picker-open? false))))
     [])
    (hooks/use-effect!
     (fn [] (reset! *pending-icon nil) js/undefined)
     [current-icon])
    [:div.asset-picker
     {:id "asset-picker-modal"
      :ref *root-ref
      :class [(when avatar-mode? "avatar-mode")
              (when (first (hooks/use-atom *drag-active?)) "drag-active")]
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
      (first (hooks/use-atom *upload-status))]

     ;; Drag overlay hint
     (when @*drag-active?
       [:div.drag-overlay-hint
        [:div.corner.tl] [:div.corner.tr]
        [:div.corner.bl] [:div.corner.br]
        (shui/tabler-icon "upload" {:size 26})
        [:div.text-group
         [:span.title (t :icon.upload/drop-overlay-title)]
         [:span.subtitle (t :icon.upload/format-list)]]])

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
         [:span (t :icon/back)]]]
       [:div.asset-picker-tabs-slot
        ;; Avatar/Image is a value selector, not a content tab — both modes
        ;; show the same image grid; only the resulting icon's :type/shape
        ;; differs. Render as a pilled segmented control with radiogroup
        ;; ARIA semantics. Manual activation (Enter) is intentional: a mode
        ;; flip writes to the DB when an asset is already selected.
        (ui/segmented-control
         {:options [[:avatar (t :icon.asset-mode/avatar)] [:image (t :icon.asset-mode/image)]]
          :active mode
          :on-change (fn [m _e] (on-mode-change m))
          :aria-label (t :icon.asset-mode/picker-aria-label)
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
                          (let [icon-data (or (when (= :avatar (:type current-icon)) current-icon)
                                              synthesized-avatar-context)]
                            (on-chosen* nil
                                        (-> icon-data
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
        ;; Trash button mirrors the outer icon-picker's three modes (per plan).
        ;; on-delete is the 1-arg shim from icon-search that forwards the action
        ;; keyword through the parent on-chosen. Use `cond` (not `case`) — see
        ;; the outer trash site for the CLJS-case-vs-React-child gotcha.
        (let [trash-icon (shui/tabler-icon "trash" {:size 17})
              reset-and-call (fn [action]
                               (reset-picker-transient-state!
                                {:*pending-icon *pending-icon
                                 :*upload-status *upload-status})
                               (on-delete action))]
          (cond
            (= delete-mode :hidden) nil

            (= delete-mode :remove)
            (shui/button {:variant :outline :size :sm :data-action "del"
                          :data-topbar-stop "trash"
                          :title (t :icon/remove-icon)
                          :aria-label (t :icon/remove-icon)
                          :on-click #(reset-and-call :remove)}
                         trash-icon)

            (= delete-mode :suppress)
            (shui/button {:variant :outline :size :sm :data-action "del"
                          :data-topbar-stop "trash"
                          :title (t :icon/hide-inherited-icon)
                          :aria-label (t :icon/hide-inherited-icon)
                          :on-click #(reset-and-call :remove-entirely)}
                         trash-icon)

            (= delete-mode :two-option)
            (shui/dropdown-menu
             (shui/dropdown-menu-trigger
              {:as-child true}
              (shui/button {:variant :outline :size :sm :data-action "del"
                            :data-topbar-stop "trash"
                            :title (t :icon/remove-icon-options)
                            :aria-label (t :icon/remove-icon-options)
                            :aria-haspopup "menu"}
                           trash-icon))
             (shui/dropdown-menu-content
              {:side "bottom" :align "end"}
              (shui/dropdown-menu-item
               {:on-select #(reset-and-call :revert)}
               (shui/tabler-icon "arrow-back-up" {:size 14 :class "mr-2 opacity-80"})
               (t :icon/revert-to-default))
              (shui/dropdown-menu-item
               {:on-select #(reset-and-call :remove-entirely)}
               (shui/tabler-icon "trash" {:size 14 :class "mr-2 opacity-80"})
               (t :icon/remove-entirely))))))]]
      ;; Reuse icon-picker-separator class so the divider gets the same
      ;; themed treatment as the icon picker's (lx-gray-05 →
      ;; --ls-border-color middle step → themed teal in OG instead of
      ;; the shadcn default's washed-out bg-border at 50% opacity).
      (shui/separator {:class "my-0 icon-picker-separator"})
      [:div.asset-picker-search
       [:div.search-input
        (shui/tabler-icon "search" {:size 16 :class "ls-icon-search"})
        (shui/input
         {:type "search"
          :aria-label (t :icon.asset-search/placeholder)
          :placeholder (t :icon.asset-search/placeholder)
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
                                 (when-let [^js cnt (some-> (hooks/deref *search-input-ref)
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
                               (when-let [^js cnt (some-> (hooks/deref *search-input-ref)
                                                          (.closest ".asset-picker"))]
                                 (when-let [btn (.querySelector cnt ".is-ghost-highlighted")]
                                   (util/stop e)
                                   (.click btn)))))))})
        ;; Rounded-circle clear button (matches icon-search). Visible
        ;; only when the input has content; shares the same on-brand
        ;; affordance instead of letting the browser render its native
        ;; cancel-X (hidden via CSS).
        (when-not (string/blank? search-q)
          [:a.x {:on-click (fn [_]
                             (reset! *search-q "")
                             (update-web-query! "")
                             (some-> (hooks/deref *search-input-ref) (.focus)))}
           (shui/tabler-icon "x" {:size 14})])]]]

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
           _search-miss?  (and available-expanded?
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
          :section-shortcuts  {49 "Recently used" 50 "Web images" 51 "Available assets"}
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
          (let [expanded? customize-expanded?
                ;; Hover preview from a child sub-picker (Fallback → Icon…
                ;; broadcasts a fully-wrapped avatar via icon-search's
                ;; hover-wrap-fn). When the preview targets *this* page
                ;; and is itself an avatar, overlay it so the band's tile
                ;; mirrors what the page-title shows in lockstep.
                ;; Reuses the top-level :ui/icon-hover-preview subscription
                ;; (hover-preview-state) — can't re-subscribe inside this
                ;; `when avatar-mode?` branch (Rules of Hooks).
                hover-preview hover-preview-state
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
                                       (dissoc-icon-preview-field! preview-base-target :icon)
                                       (reset! *fallback-menu-open? false))
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
                              (t :icon.avatar-scope/custom)
                              (t :icon.avatar-scope/default))
                descriptor-fb (cond
                                has-image? (t :icon.mode/image)
                                (and (= current-fb-type :icon) current-fb-icon)
                                (or (not-empty (humanize-icon-name current-fb-icon))
                                    (t :icon.fallback/icon))
                                (and (= current-fb-type :emoji) current-fb-icon)
                                (or (not-empty
                                     (humanize-icon-name
                                      (string/replace current-fb-icon "_" "-")))
                                    (t :icon.fallback/emoji))
                                :else (t :icon.fallback/letters))
                descriptor-shape (case current-shape
                                   :rounded-rect (t :icon.shape/rectangle-descriptor)
                                   (t :icon.shape/circle-descriptor))
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
             ;; Single click target spanning the resting row (avatar +
             ;; meta + Edit). Sits as an invisible overlay above
             ;; `.cb-content` so the avatar and banner text remain a
             ;; clean visual layer underneath while clicks anywhere on
             ;; the row hit one accessible-named <button>. Disabled
             ;; (pointer-events: none, opacity: 0) in the expanded
             ;; state so the dropdown chips inside `.cb-rows` are
             ;; reachable without being nested under a parent button.
             ;; aria-controls links to the expanded panel id below.
             (when-not expanded?
               [:button.cb-row-trigger
                {:type "button"
                 :on-click #(swap! *customize-expanded? not)
                 :aria-label (str scope-label " · " descriptor ". Customize avatar.")
                 :aria-expanded expanded?
                 :aria-controls "asset-picker-cb-rows"}])
             [:div.cb-content
              [:div.cb-avatar-trigger
               {:aria-hidden "true"}
               [:div.preview-avatar
                (icon fallback-preview-icon {:size 56})]]
              [:div.cb-meta-stage
               ;; Resting state: visible banner content. Click target
               ;; lives on `.cb-row-trigger` above (covers this entire
               ;; row). `.cb-banner` is now a presentation-only div —
               ;; not interactive, no aria-expanded — so the row reads
               ;; as one button to assistive tech.
               [:div.cb-banner
                {:aria-hidden "true"}
                [:div.banner-text
                 [:span.banner-scope scope-label]
                 [:span.banner-sep "·"]
                 [:span.banner-descriptor descriptor]]
                [:span.banner-edit (t :icon.avatar-band/edit)]]
               [:div.cb-rows
                {:id "asset-picker-cb-rows"
                 :role "region"
                 :aria-label (t :icon.avatar-band/region-aria-label)}
                [:div.cb-row
                 [:span.cb-label (t :icon.avatar-band/shape-label)]
                 (shui/dropdown-menu
                  (shui/dropdown-menu-trigger
                   {:as-child true}
                   [:button.cb-chip
                    {:type "button"
                     :data-topbar-stop "shape"
                     :aria-label (t :icon.avatar-band/shape-aria-label)}
                    [:span.cb-chip-glyph
                     (case current-shape
                       :rounded-rect [:span.glyph.glyph-rect]
                       [:span.glyph.glyph-circle])]
                    [:span.cb-chip-label
                     (case current-shape
                       :rounded-rect (t :icon.shape/rectangle)
                       (t :icon.shape/circle))]
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
                    (t :icon.shape/circle))
                   (shui/dropdown-menu-item
                    {:on-click #(set-shape! :rounded-rect)
                     :on-focus #(preview-shape-on-hover! :rounded-rect)}
                    (shui/tabler-icon "square-rounded" {:class "scale-90 pr-1 opacity-80"})
                    (t :icon.shape/rectangle))))]
                [:div.cb-row
                 [:span.cb-label (t :icon.avatar-band/fallback-label)]
                 (shui/dropdown-menu
                  ;; Controlled open state — see `::fallback-menu-open?`
                  ;; comment above. The map of props goes as the first
                  ;; arg to dropdown-menu, before the trigger/content
                  ;; children.
                  {:open @*fallback-menu-open?
                   :on-open-change #(reset! *fallback-menu-open? %)}
                  (shui/dropdown-menu-trigger
                   {:as-child true}
                   [:button.cb-chip
                    {:type "button"
                     :data-topbar-stop "fallback"
                     :aria-label (t :icon.avatar-band/fallback-aria-label)}
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
                       [:span.glyph-letters (t :icon.avatar-fallback/letters-glyph)])]
                    [:span.cb-chip-label
                     (cond
                       (and (= current-fb-type :icon) current-fb-icon)
                       (or (not-empty (humanize-icon-name current-fb-icon))
                           (t :icon.fallback/icon))

                       (and (= current-fb-type :emoji) current-fb-icon)
                       ;; Emoji shortcodes are typically `snake_case`;
                       ;; humanize-icon-name handles dashes but not
                       ;; underscores — replace underscores with spaces
                       ;; first so `white_check_mark` reads as "White
                       ;; check mark", not "White_check_mark".
                       (or (not-empty
                            (humanize-icon-name
                             (string/replace current-fb-icon "_" "-")))
                           (t :icon.fallback/emoji))

                       :else
                       (t :icon.fallback/letters))]
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
                    (t :icon.fallback/letters))
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
                     (t :icon.fallback/icon-submenu))
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
                       {:on-chosen (fn [_e icon-data & _rest]
                                     ;; Dispatch on the tile's :type so
                                     ;; emojis route to set-fallback-emoji!
                                     ;; (which writes :fallback-type :emoji)
                                     ;; and tabler icons route to the
                                     ;; existing :icon path.
                                     (let [glyph-id (or (get-in icon-data [:data :value])
                                                        (:id icon-data))]
                                       (cond
                                         (and (= :emoji (:type icon-data)) glyph-id)
                                         (set-fallback-emoji! glyph-id)

                                         (and (#{:icon :tabler-icon} (:type icon-data)) glyph-id)
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
                        ;; Suppress image-asset search results in this sub-picker —
                        ;; a fallback icon for an avatar must be an icon or emoji,
                        ;; not a photo. Without this, typing in the search input
                        ;; would surface user image assets as picks that, when
                        ;; selected, would write nonsensical avatar fallbacks.
                        :no-assets? true
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
                 :aria-label (t :icon.avatar-band/reset-aria-label)
                 :tab-index (if expanded? 0 -1)}
                (shui/tabler-icon "rotate" {:size 12})
                [:span (t :ui/reset)]]
               [:button.lx-toolbar-action.cb-done
                {:type "button"
                 :on-click #(reset! *customize-expanded? false)
                 :data-topbar-stop "done"
                 :aria-label (t :icon.avatar-band/close-aria-label)
                 :tab-index (if expanded? 0 -1)}
                [:span (t :icon.avatar-band/done-button)]]]]]))

        ;; "Recently used" section - shows current + recently used in one row (only when not searching)
        (when (and (seq recently-used-row) (string/blank? search-q))
          [:div.pane-section
           (section-header {:title "Recently used"
                            :count recently-used-count
                            :expanded? recently-used-expanded?
                            :keyboard-hint "alt mod 1"
                            :focus-region @*focus-region
                            :on-toggle #(swap! *section-states update "Recently used" (fn [v] (if (nil? v) false (not v))))})
           (when recently-used-expanded?
             [:div.asset-picker-grid.recently-used-row
              {:class (when avatar-mode? "avatar-mode")}
              (for [asset recently-used-row
                    :let [item-id (str "recent-" (:block/uuid asset))]]
                ^{:key item-id}
                [image-asset-item asset {:on-chosen on-chosen
                                         :avatar-context effective-avatar-context
                                         :selected? (= (str (:block/uuid asset)) current-asset-uuid)
                                         :item-id item-id
                                         :highlighted? (= highlighted-id item-id)
                                         :ghost-highlighted? (= ghost-highlighted-id item-id)}])])])

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
            :focus-region @*focus-region
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
                            :keyboard-hint "alt mod 3"
                            :focus-region @*focus-region
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
                ^{:key item-id}
                [image-asset-item asset {:on-chosen on-chosen
                                         :avatar-context effective-avatar-context
                                         :selected? (= (str (:block/uuid asset)) current-asset-uuid)
                                         :item-id item-id
                                         :highlighted? (= highlighted-id item-id)
                                         :ghost-highlighted? (= ghost-highlighted-id item-id)}])

              :else
              (if (and (seq assets) (not (string/blank? search-q)))
                ;; Search returned no results
                [:div.asset-picker-empty
                 (shui/tabler-icon "search-off" {:size 32})
                 [:span.text-sm (t :icon.asset-search/empty)]]
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
                     [:div.row-title (t :icon.asset/paste-from-clipboard-title)]
                     [:div.row-subtitle (t :icon.asset/paste-from-clipboard-desc)]]
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
                   [:div.row-title (t :icon.asset/add-from-computer-title)]
                   [:div.row-subtitle (t :icon.asset/add-from-computer-desc)]]
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
        [:span.tip-label (t :icon.asset/tip-label)]
        [:span.tip-body
         (if (util/mobile?)
           ;; Phone: every verb is a real control. iOS Safari won't deliver
           ;; paste events to the popover root reliably, so paste-a-link is
           ;; a button that calls handle-clipboard-paste directly (mirrors
           ;; the empty-state clipboard-row).
           (i18n/interpolate-rich-text-node
            (t :icon.asset/tip-mobile)
            [[:button.tip-link
              {:type "button"
               :on-click (fn [_] (handle-clipboard-paste))}
              (t :icon.asset/tip-link-paste)]
             [:label.tip-link {:for "asset-upload-input" :tab-index 0}
              (t :icon.asset/tip-link-browse)]
             [:label.tip-link {:tab-index 0}
              [:input.hidden
               {:type "file"
                :accept "image/*"
                :capture "environment"
                :on-change (fn [e]
                             (let [files (array-seq (.. e -target -files))]
                               (handle-upload files)))}]
              (t :icon.asset/tip-link-take-picture)]])
           ;; Desktop / iPad: passive hint. Drop + paste rely on the
           ;; existing global handlers attached to the picker root.
           [:<>
            (i18n/interpolate-rich-text-node
             (t :icon.asset/tip-desktop)
             [[:label.tip-link {:for "asset-upload-input" :tab-index 0}
               (t :icon.asset/tip-link-browse)]])
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

(hsx/defc all-cp
  [opts]
  (let [used-items (->> (get-used-items)
                        ;; Drop context-dependent types: :text and :avatar derive
                        ;; per-block values (initials etc.) so cross-page recall
                        ;; is meaningless. :image is dropped because the asset
                        ;; may have been deleted/moved (photo-off tiles), and
                        ;; the asset-picker already has its own "Recently used
                        ;; assets" row that's the natural home for image recall.
                        (remove #(#{:text :avatar :image} (:type %))))
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
        section-states (first (hooks/use-atom *section-states))
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

(hsx/defc tab-observer
  "Re-runs the search when tab changes (if there's a query), preserving the search text."
  [tab {:keys [q *result assets no-assets?]}]
  (hooks/use-effect!
   (fn []
     ;; Re-run search with existing query for new tab context
     (when-not (string/blank? q)
       (p/let [result (search q tab assets {:no-assets? no-assets?})]
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
  [tab result section-states & [{:keys [show-used?]}]]
  (let [build-sections (fn [& groups]
                         ;; Skip nil entries (callers may pass `(when cond {...})` as a group).
                         (loop [gs groups offset 0 items [] sections []]
                           (if (seq gs)
                             (let [g (first gs)
                                   its (vec (or (:items g) []))
                                   c (count its)]
                               (if (and g (pos? c))
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
       :sections [{:start 0 :count 3 :cols custom-tab-cols}]}

      ;; Search results active. Tabs are content-type categories — keep the
      ;; query persistent across tabs but only show matches that fit the
      ;; current tab's type. :all shows everything, :emoji only emoji matches,
      ;; :icon only icon matches, Assets section only on :all (since assets
      ;; aren't a category the icon/emoji tabs are scoped to).
      (seq result)
      (let [tab-allows-emojis? (contains? #{:all :emoji} tab)
            tab-allows-icons?  (contains? #{:all :icon} tab)
            tab-allows-assets? (= :all tab)]
        (build-sections
         {:label "Emojis"
          :items (when (and tab-allows-emojis?
                            (seq (:emojis result))
                            (get section-states "Emojis" true))
                   (:emojis result))
          :cols icon-grid-cols}
         {:label "Icons"
          :items (when (and tab-allows-icons?
                            (seq (:icons result))
                            (get section-states "Icons" true))
                   (:icons result))
          :cols icon-grid-cols}
         {:label "Assets"
          :items (when (and tab-allows-assets?
                            (seq (:assets result))
                            (get section-states "Assets" true))
                   (:assets result))
          :cols asset-search-grid-cols}))

      ;; All tab: recently used + emojis + icons (non-virtualized, limited items)
      (= tab :all)
      (build-sections
       {:label "Recently used"
        :items (when (get section-states "Recently used" true)
                 (->> (get-used-items)
                      ;; Drop context-dependent types: :text and :avatar derive
                      ;; per-block values (initials etc.) so cross-page recall
                      ;; is meaningless. :image is dropped because the asset
                      ;; may have been deleted/moved (photo-off tiles), and
                      ;; the asset-picker already has its own "Recently used
                      ;; assets" row that's the natural home for image recall.
                      (remove #(#{:text :avatar :image} (:type %)))))
        :cols icon-grid-cols}
       {:label "Emojis"
        :items (when (get section-states "Emojis" true)
                 (->> (take 32 emojis)
                      (map (fn [emoji]
                             {:type :emoji :id (:id emoji)
                              :label (or (:name emoji) (:id emoji))
                              :data {:value (:id emoji)}}))))
        :cols icon-grid-cols}
       {:label "Icons"
        :items (when (get section-states "Icons" true)
                 (->> (take 48 (get-tabler-icons))
                      (map (fn [icon-name]
                             {:type :icon :id (str "icon-" icon-name)
                              :label icon-name :data {:value icon-name}}))))
        :cols icon-grid-cols})

      ;; Emojis tab: full emoji list, optionally preceded by recently-used
      ;; emojis when :show-used? is true (reaction-picker context).
      ;; Section headers are not user-collapsible on this tab, so don't gate
      ;; on `section-states` — that key is owned by the All tab.
      (= tab :emoji)
      (build-sections
       (when show-used?
         {:label "Recently used"
          :items (->> (get-used-items)
                      (filterv #(= :emoji (:type %))))
          :cols icon-grid-cols})
       {:label "Emojis"
        :items (mapv (fn [emoji]
                       {:type :emoji :id (:id emoji)
                        :label (or (:name emoji) (:id emoji))
                        :data {:value (:id emoji)}})
                     emojis)
        :cols icon-grid-cols})

      ;; Icons tab: full icon list
      (= tab :icon)
      (let [items (vec (map (fn [icon-name]
                              {:type :icon :id (str "icon-" icon-name)
                               :label icon-name :data {:value icon-name}})
                            (get-tabler-icons)))]
        {:items items :sections [{:start 0 :count (count items) :cols icon-grid-cols}]})

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

(hsx/defc keyboard-nav-controller
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
     :*tab               — optional tab atom (icon-picker only; enables the
                           :tabs-region rove and, when set, gates section
                           shortcuts to fire only on the `:all` tab)
     :section-shortcuts  — optional `{keycode label}` map. When set, meta+alt+N
                           toggles the named section in `*section-states`.
                           Icon-search uses {49 \"Recently used\" 50 \"Emojis\" …}
                           and gates on `*tab = :all`; asset-picker uses its
                           own labels and fires unconditionally.
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
           *virtuoso-ref container-selector on-escape topbar-selector
           section-shortcuts]
    :or {container-selector ".cp__emoji-icon-picker"
         on-escape          shui/popup-hide!}}]
  (let [*el-ref (hooks/use-ref nil)
        get-cnt #(some-> (hooks/deref *el-ref) (.closest container-selector))

        focus-search! (fn []
                        (reset! *focus-region :search)
                        (reset! *highlighted-index nil)
                        (some-> (hooks/deref *input-ref) (.focus)))

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
                               (util/stop e)

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
                 _code (.-keyCode e)]
             (if (and section-shortcuts (util/meta-key? e) (.-altKey e)
                      ;; When *tab is wired (icon-picker), restrict to the
                      ;; :all tab — other tabs render only one section. The
                      ;; asset-picker doesn't pass *tab, so the gate becomes
                      ;; a no-op and shortcuts fire whenever the picker has focus.
                      (or (nil? *tab) (= @*tab :all)))
               ;; Alt+meta + 1/2/3(/4) toggles section collapse. Mac: ⌥⌘N —
               ;; Win/Linux: Ctrl+Alt+N. Labels live in `*section-states` and
               ;; are mapped per-picker via `:section-shortcuts`.
               (when-let [section-name (get section-shortcuts (.-keyCode e))]
                 (swap! *section-states update section-name (fn [v] (if (nil? v) false (not v))))
                 (reset! *highlighted-index nil)
                 (util/stop e))
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

(defn- same-color?
  "Semantic equality for two color values that may be hex strings, CSS
   variable expressions (`var(--rx-…)`), or nil. Both sides are
   normalized via `colors/->hex` before comparison so that e.g. a stored
   hex matches the same color expressed as a palette CSS-var.
   - (same-color? nil nil)               => true   (Default tile)
   - (same-color? \"#ec5e41\" \"var(--rx-tomato-10)\") => true
   - (same-color? \"#ff0000\" nil)             => false"
  [a b]
  (cond
    (and (nil? a) (nil? b)) true
    (or  (nil? a) (nil? b)) false
    :else (let [ha (colors/->hex a)
                hb (colors/->hex b)]
            (boolean (and ha hb (= ha hb))))))

(defn- preset-hex?
  "True when `color` matches any of the preset palette values, comparing
   in normalized-hex space so CSS-var swatch values and hex stored
   colors interoperate."
  [color preset-values]
  (boolean (and color (some #(same-color? color %) preset-values))))

(defn- custom-active?
  "True when the current color is set, non-default, and doesn't match
   any of the named presets — i.e. a custom hex picked through the
   rainbow tile."
  [color preset-values]
  (boolean (and color
                (not= color "inherit")
                (not (preset-hex? color preset-values)))))

(hsx/defc color-swatches-popover
  "Popover content for the color-picker. Renders the **control column**
   (Default tile + custom-rainbow tile) on the left, a 1px vertical rule,
   then a 4×2 preset grid on the right. Auto-focuses the currently-
   selected swatch on open. Arrow keys walk the DOM-order swatch list
   linearly (Home/End jump to ends); the visual layout is responsible
   for putting the right neighbour in the right slot."
  [{:keys [colors color set-color! set-hover! on-select!
           on-hover! on-hover-end!
           on-custom-click! picker-open?]
    custom? :custom-active?}]
  (let [*parent (hooks/use-ref nil)
        ;; Split entries: first is Default (no value), rest are presets
        default-entry (first colors)
        preset-entries (vec (rest colors))
        ;; Build a 4-wide row layout: 4 + 4 = 8 presets. Pad shorter rows.
        cols 4
        rows (partition-all cols preset-entries)
        render-preset
        (fn [{value :value label :label hint :hint :as _entry}]
          (let [active? (same-color? value color)
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
                   {:style {:color "var(--lx-gray-11, var(--ls-primary-text-color, var(--rx-gray-11)))"}}
                   hint])])))))]

    ;; On mount: land focus on (1) selected preset, (2) custom-rainbow
    ;; if custom is active, (3) Default tile, (4) first focusable.
    ;; Deferred a tick so it runs after Radix's onOpenAutoFocus.
    (hooks/use-effect!
     (fn []
       (js/setTimeout
        (fn []
          (when-let [^js parent (hooks/deref *parent)]
            (when-let [^js btn (or (.querySelector parent ".color-swatch.is-selected")
                                   (when custom?
                                     (.querySelector parent ".color-swatch--custom"))
                                   (.querySelector parent ".color-swatch"))]
              (.focus btn))))
        0))
     [])

    [:div.color-picker-presets
     {:role "radiogroup"
      :aria-label (t :icon.color/picker-aria-label)
      :ref *parent
      :on-mouse-leave (fn []
                        (set-hover! nil)
                        (some-> on-hover-end! (apply [])))
      :on-key-down
      (fn [^js e]
        (when-let [^js parent (hooks/deref *parent)]
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
            active? (and (same-color? value color) (not custom?))]
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
               {:style {:color "var(--lx-gray-11, var(--ls-primary-text-color, var(--rx-gray-11)))"}}
               hint])]))))

      ;; Custom — opens the picker pane. aria-expanded reflects pane state.
      (shui/tooltip-provider
       {:delay-duration 300}
       (shui/tooltip
        (shui/tooltip-trigger
         {:as-child true}
         [:button.color-swatch.color-swatch--custom
          {:role "radio"
           :aria-checked (str (boolean custom?))
           :aria-label (t :icon.color/custom)
           :aria-expanded (str (boolean picker-open?))
           :tab-index (if custom? "0" "-1")
           :class (when custom? "is-selected")
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
          [:div.font-medium (t :icon.color/custom)]
          [:div.text-xs.mt-0.5
           {:style {:color "var(--lx-gray-11, var(--ls-primary-text-color, var(--rx-gray-11)))"}}
           (t :icon.color/custom-hint)]])))]

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

(def ^:private placeholder-hex
  "Neutral grey-blue used in two no-input surfaces: the hex input's
   placeholder ghost text (\"example of expected format\") and the
   react-colorful SV pad's starting position when no color is set yet.
   The a1/b2/c3 alphabetical pattern is the self-documentation —
   it's a memorable demo value, not a designed color."
  "#a1b2c3")

(hsx/defc color-picker-pane
  "Custom-color picker pane shown below the swatch grid when the user
   clicks the rainbow tile. Hosts a hex input + react-colorful's
   HexColorPicker (combined SV pad + hue slider). Animates open/close
   via the CSS-Grid 0fr↔1fr trick."
  [{:keys [color hex-input set-hex-input!
           hex-invalid? set-hex-invalid!
           set-hover! on-hover! _on-hover-end!
           on-commit! on-escape!
           recents
           open?]}]
  (let [*hex-ref (hooks/use-ref nil)
        *pane-ref (hooks/use-ref nil)
        *pad-ref (hooks/use-ref nil)
        ;; Resolve the typed value once. `:hex` is the canonical hex when
        ;; resolution succeeds (any kind of match). `picked` reflects only
        ;; exact-resolvable values for purposes of contrast indicator.
        resolved (colors/resolve-color hex-input)
        active-color (or (:hex resolved) color placeholder-hex)
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
        [input-font set-input-font!] (hooks/use-state nil)]
    ;; When the pane opens, autofocus the hex input.
    (hooks/use-effect!
     (fn []
       (when open?
         (js/setTimeout
          (fn []
            (when-let [^js el (hooks/deref *hex-ref)]
              (.focus el)
              (.select el)))
          80)))
     [open?])
    ;; Capture the input's computed font once on mount so the ghost can be
    ;; measured with pixel-perfect alignment.
    (hooks/use-effect!
     (fn []
       (when-let [^js el (hooks/deref *hex-ref)]
         (set-input-font! (.-font (js/getComputedStyle el)))))
     [])
    ;; Strip react-colorful's two interactive sliders (SV pad + hue) from
    ;; the Tab order. The library hard-codes `tabIndex={0}` on them and
    ;; offers no prop to opt out. Mouse/touch interaction is unaffected.
    ;; Keyboard users navigate swatches → hex → recents directly via
    ;; Tab/Shift+Tab and arrow shortcuts; the pad is mouse/touch only.
    (hooks/use-effect!
     (fn []
       (when-let [^js root (hooks/deref *pad-ref)]
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
       (when-let [^js el (hooks/deref *pane-ref)]
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
         :placeholder placeholder-hex
         :spell-check false
         :auto-complete "off"
         :aria-label (t :icon.color/hex-aria-label)
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
               {:aria-label (t :icon.color/contrast-aria-label
                               (or picked-name picked) dark light)}
               [:span.contrast-split-swatch
                {:style {"--dark-color" dark
                         "--light-color" light}}]])
             (shui/tooltip-content
              {:side "top" :align "center" :show-arrow true}
              [:div
               ;; Title: picked color name if reverse-lookup hits, else
               ;; the generic "Contrast adjusted".
               [:div.text-sm.font-medium (or picked-name (t :icon.color/contrast-title))]
               [:div.text-xs.opacity-70.mt-1
                [:div.flex.items-center.gap-1.5
                 [:span.contrast-tooltip-dot {:style {:background-color dark}}]
                 [:span (str (t :icon.color/contrast-dark-label) " ")] [:span.font-mono dark]]
                [:div.flex.items-center.gap-1.5.mt-0.5
                 [:span.contrast-tooltip-dot {:style {:background-color light}}]
                 [:span (str (t :icon.color/contrast-light-label) " ")] [:span.font-mono light]]]])))))]

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
          :color color
          :set-hover! set-hover!
          :on-hover! on-hover!
          :on-select! on-commit!
          :on-escape! on-escape!
          :on-up! (fn []
                    (when-let [^js el (hooks/deref *hex-ref)]
                      (.focus el)
                      (.select el)))
          :on-down! (fn []
                      (when-let [^js root (some-> (hooks/deref *pane-ref)
                                                  (.closest ".color-picker-popover"))]
                        (when-let [^js btn (or (.querySelector root ".color-swatch.is-selected")
                                               (.querySelector root ".color-swatch--custom")
                                               (.querySelector root ".color-swatch"))]
                          (.focus btn))))}))]]))

(hsx/defc recents-lane
  "Horizontal row of recently-used custom colors (cap: `frontend.handler.icon-color/max-recents`).
   Header label matches existing pane-section typography (12px Inter Medium muted).

   Keyboard model: roving tabindex (one Tab stop into the row, arrows
   rove within). ArrowUp leaves to the hex input; ArrowDown wraps to
   the swatches grid (closing the vertical loop). Escape collapses the
   pane back to the swatches grid."
  [{:keys [recents hex-input color on-select! set-hover! on-hover!
           on-escape! on-up! on-down!]}]
  (when (seq recents)
    (let [*parent (hooks/use-ref nil)
          ;; Active recent index for roving tabindex. Default 0 so the
          ;; first Tab into the row lands on the leftmost swatch.
          [active-idx set-active-idx!] (hooks/use-state 0)]
      [:div.color-picker-recents
       [:div.color-picker-recents__header (t :icon.color/recents-title)]
       [:div.color-picker-recents__row
        {:ref *parent
         :role "radiogroup"
         :aria-label (t :icon.color/recents-aria-label)
         :on-key-down
         (fn [^js e]
           (when-let [^js parent (hooks/deref *parent)]
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
                checked? (same-color? hex color)]
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

(hsx/defc color-picker-popover
  "Whole popover body: swatch grid + animated picker pane + recents lane.
   Owns the local picker-mode / hex-input / hex-invalid? / recents state
   so it survives across pane open/close and recent-color picks while
   the popup remains mounted."
  [{:keys [colors color set-color! set-hover!
           on-select! on-hover! on-hover-end!]}]
  (let [preset-values (->> colors (map :value) (filter some?) vec)
        ;; Normalize incoming `color` to hex when it arrives as a CSS-variable
        ;; expression (e.g. "var(--rx-gray-09)"). Without this, the swatch
        ;; comparison treats the literal string as a "custom" color and opens
        ;; the SV pad expanded with an unparseable hex-input value.
        color (if (and (string? color)
                       (string/starts-with? color "var("))
                (or (frontend.colors/->hex color) color)
                color)
        custom? (custom-active? color preset-values)
        [picker-mode set-picker-mode!] (hooks/use-state (if custom? :custom :presets))
        [hex-input set-hex-input!]     (hooks/use-state (when custom? color))
        [hex-invalid? set-hex-invalid!] (hooks/use-state false)
        [recents set-recents!]         (hooks/use-state [])
        open? (= picker-mode :custom)
        ;; Ref captures the latest hex-input + committed color so the unmount
        ;; cleanup sees current values (the cleanup closure has empty deps).
        *latest (hooks/use-ref nil)
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
       (hooks/set-ref! *latest {:hex-input hex-input :color color}))
     [hex-input color])
    ;; Commit pending hex on unmount (e.g. user dragged the SV pad then
    ;; clicked outside the popover without releasing inside it — the
    ;; on-mouse-up never fires for outside-bounds releases since react-
    ;; colorful uses document-level pointer listeners).
    (hooks/use-effect!
     (fn []
       (fn []
         (let [{:keys [hex-input color]} (hooks/deref *latest)
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

(hsx/defc color-picker
  [*color on-select! & {:keys [on-hover! on-hover-end! button-attrs after-close! popup-id]}]
  (let [;; Defensive: never let the CSS sentinel "inherit" leak into React state.
        initial-color (let [v @*color] (when (and v (not= v "inherit")) v))
        [color, set-color!] (hooks/use-state initial-color)
        [hover, set-hover!] (hooks/use-state nil)
        ;; hover is nil = not hovering, or {:color X} where X may be nil ("no color")
        effective-color (if hover (:color hover) color)
        *el (hooks/use-ref nil)
        palette [{:value nil :label "Default"
                  :hint "Inherits the surrounding text color"}
                 {:value (colors/variable :gray :09)   :label "Gray"}
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
       (when-let [^js picker (some-> (hooks/deref *el) (.closest ".cp__emoji-icon-picker"))]
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
    ;; Accept hex strings, `var(--rx-…)` palette expressions (so preset swatch
    ;; picks persist with theme-responsive colors), and the "inherit" sentinel.
    ;; Other shapes (free-form CSS vars, arbitrary strings) are rejected so they
    ;; can't poison later picker opens.
    (hooks/use-effect!
     (fn []
       (let [c (if (string/blank? color) "inherit" color)]
         (when (or (= c "inherit")
                   (and (string? c)
                        (or (re-matches #"#[0-9a-fA-F]{6}" c)
                            (re-matches #"var\(--rx-[A-Za-z0-9_-]+\)" c))))
           (storage/set :ls-icon-color-preset c)))
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

(hsx/defc text-picker
  [{:keys [on-chosen on-back on-delete del-btn? delete-mode page-title
           preview-target-db-id preview-target-db-ids preview-inheritor-db-ids property
           current-icon selected-color]}]
  (let [*text-value (hooks/use-memo #(atom nil) [])
        *alignment (hooks/use-memo #(atom nil) [])
        *color (hooks/use-memo #(atom nil) [])
        *mode (hooks/use-memo #(atom nil) [])
        *deleted? (hooks/use-memo #(atom false) [])
        *persist-timer (hooks/use-memo #(atom nil) [])
        _ (hooks/use-atom *text-value)
        _ (hooks/use-atom *alignment)
        _ (hooks/use-atom *color)
        _ (hooks/use-atom *mode)
        _ (hooks/use-atom *deleted?)
        delete-mode (or delete-mode (if del-btn? :remove :hidden))
        title (or page-title
                  (some-> (state/get-current-page)
                          (db/get-page)
                          (:block/title)))
        derived-initials (or (derive-initials title) "?")
        derived-abbreviated (derive-abbreviated title)
        ;; Scope shape for `:ui/icon-hover-preview` writes — same
        ;; structure as the icon-picker's (see icon.cljs:3545) so the
        ;; existing `icon-preview-matches?` filter on the page-icon
        ;; subscriber in `get-node-icon-cp` correctly routes a
        ;; text-picker swatch hover to the right entity.
        scope-property (or property :logseq.property/icon)
        preview-base-target (cond-> {:property scope-property}
                              preview-target-db-id (assoc :db-id preview-target-db-id)
                              (seq preview-target-db-ids) (assoc :db-ids (set preview-target-db-ids))
                              (seq preview-inheritor-db-ids)
                              (assoc :inheritor-property :logseq.property/icon
                                     :inheritor-db-ids (set preview-inheritor-db-ids)))
        ;; Live color preview during hover/keyboard nav over color
        ;; swatches in the color popover. The text-picker subscribes
        ;; here so its gallery preview tiles tint along with the
        ;; page-icon as the user moves over swatches.
        hover-preview-state (state/use-sub :ui/icon-hover-preview)
        hover-color-match? (and hover-preview-state
                                (icon-preview-matches? hover-preview-state preview-target-db-id scope-property))
        hover-color (when hover-color-match?
                      (let [c (:color hover-preview-state)]
                        (when (and c (not (string/blank? c)) (not= c "inherit"))
                          c)))
        committed-color (when-not (string/blank? @*color) @*color)
        ;; Hover wins over committed so the previews tint live; on
        ;; mouse-leave the hover-preview clears and committed re-emerges.
        selected-color (or hover-color committed-color)
        build-icon (fn [text-override]
                     (let [text (or text-override
                                    (if (string/blank? @*text-value) derived-initials @*text-value))]
                       {:type :text
                        :id (str "text-" text)
                        :label text
                        :data (cond-> {:value text}
                                selected-color (assoc :color selected-color)
                                @*alignment (assoc :alignment @*alignment)
                                @*mode (assoc :mode @*mode))}))
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
        ;; Radio behavior: always show ONE tile as selected. If `@*mode`
        ;; is somehow nil or doesn't match any gallery option (e.g.,
        ;; stored icon predates current mode set, or some intermediate
        ;; state cleared it), fall back to "initials" so the picker
        ;; never renders with zero selected tiles.
        valid-modes (set (map :mode gallery-options))
        current-mode (let [m @*mode] (if (valid-modes m) m "initials"))]
    ;; Seed atoms on mount; auto-save on unmount. (was Rum :will-mount + :will-unmount)
    (hooks/use-effect!
     (fn []
       (let [text-icon? (= :text (:type current-icon))
             title (or page-title (some-> (state/get-current-page) (db/get-page) (:block/title)))]
         (reset! *text-value (or (when text-icon? (get-in current-icon [:data :value])) (derive-initials title)))
         (reset! *alignment (or (when text-icon? (get-in current-icon [:data :alignment])) "center"))
         (reset! *color (or (when text-icon? (get-in current-icon [:data :color])) selected-color))
         (reset! *mode (or (when text-icon? (get-in current-icon [:data :mode])) "initials")))
       (fn []
         (when-let [t @*persist-timer] (js/clearTimeout t))
         (when-not @*deleted?
           (let [title (or page-title (some-> (state/get-current-page) (db/get-page) (:block/title)))
                 derived (or (derive-initials title) "?")
                 text (if (string/blank? @*text-value) derived @*text-value)
                 icon-item {:type :text
                            :id (str "text-" text)
                            :label text
                            :data (cond-> {:value text}
                                    @*color (assoc :color @*color)
                                    @*alignment (assoc :alignment @*alignment)
                                    @*mode (assoc :mode @*mode))}]
             (on-chosen nil icon-item true)
             (add-used-item! icon-item)))))
     [])
    [:div.text-picker
     ;; Topbar
     [:div.text-picker-topbar
      [:div.text-picker-back
       [:button.back-button
        {:on-click (fn []
                     (persist!)
                     (on-back))}
        (shui/tabler-icon "chevron-left" {:size 16})
        [:span (t :icon/back)]]
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
                                 (on-chosen nil icon-item true)))
                      :on-hover! (when (or preview-target-db-id (seq preview-target-db-ids))
                                   (fn [c]
                                     (merge-into-icon-preview!
                                      (assoc preview-base-target :color c))))
                      :on-hover-end! (when (or preview-target-db-id (seq preview-target-db-ids))
                                       (fn []
                                         (dissoc-icon-preview-field! preview-base-target :color))))
        ;; Trash button — mirrors the outer icon-picker's three modes.
        ;; ::deleted? must be flipped before any branch so the will-unmount
        ;; doesn't re-commit the about-to-be-deleted text icon.
        (let [trash-icon (shui/tabler-icon "trash" {:size 17})
              flag-delete-and-call (fn [action]
                                     (reset! *deleted? true)
                                     (on-delete action))]
          (cond
            (= delete-mode :hidden) nil

            (= delete-mode :remove)
            (shui/button {:variant :outline :size :sm :data-action "del"
                          :title (t :icon/remove-icon)
                          :aria-label (t :icon/remove-icon)
                          :on-click #(flag-delete-and-call :remove)}
                         trash-icon)

            (= delete-mode :suppress)
            (shui/button {:variant :outline :size :sm :data-action "del"
                          :title (t :icon/hide-inherited-icon)
                          :aria-label (t :icon/hide-inherited-icon)
                          :on-click #(flag-delete-and-call :remove-entirely)}
                         trash-icon)

            (= delete-mode :two-option)
            (shui/dropdown-menu
             (shui/dropdown-menu-trigger
              {:as-child true}
              (shui/button {:variant :outline :size :sm :data-action "del"
                            :title (t :icon/remove-icon-options)
                            :aria-label (t :icon/remove-icon-options)
                            :aria-haspopup "menu"}
                           trash-icon))
             (shui/dropdown-menu-content
              {:side "bottom" :align "end"}
              (shui/dropdown-menu-item
               {:on-select #(flag-delete-and-call :revert)}
               (shui/tabler-icon "arrow-back-up" {:size 14 :class "mr-2 opacity-80"})
               (t :icon/revert-to-default))
              (shui/dropdown-menu-item
               {:on-select #(flag-delete-and-call :remove-entirely)}
               (shui/tabler-icon "trash" {:size 14 :class "mr-2 opacity-80"})
               (t :icon/remove-entirely))))))]]
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
             ;; Use `is-selected`, not `selected` — Logseq's global
             ;; pointerdown handler `frontend.state/dom-clear-selection!`
             ;; strips the bare `selected` class from any DOM node on
             ;; every interaction, treating it as block-selection state.
             :class (when selected? "is-selected")
             :type "button"
             :on-mouse-down (fn [e]
                              ;; Prevent the button from stealing focus from
                              ;; the text input when clicked. Clicking the
                              ;; selected Initials/Abbreviated tile was
                              ;; firing the input's `:on-blur`, which
                              ;; (when the displayed text matched the
                              ;; derived value) sometimes triggered a
                              ;; persist round-trip that re-rendered with
                              ;; a momentarily-inconsistent mode. With
                              ;; preventDefault on mousedown, the focus
                              ;; stays where it was.
                              (.preventDefault e))
             ;; Live preview the mode change on the actual page icon —
             ;; mirrors the asset-picker shape/fallback hover pattern
             ;; (icon.cljs:4367-4396). Writes a full `:icon` override
             ;; into `:ui/icon-hover-preview`; the consumer at
             ;; `get-node-icon-cp` swaps it in for the committed icon
             ;; without touching the DB. Mouse-leave clears the field
             ;; only — sibling `:color` (from concurrent swatch hover)
             ;; is preserved by `dissoc-icon-preview-field!`.
             :on-mouse-enter (when (or preview-target-db-id (seq preview-target-db-ids))
                               (fn []
                                 (let [preview-text (case mode
                                                      "initials" derived-initials
                                                      "abbreviated" derived-abbreviated
                                                      "custom" (if (string/blank? @*text-value)
                                                                 derived-initials
                                                                 @*text-value))
                                       ;; `build-icon` bakes the *current* `@*mode` into
                                       ;; `[:data :mode]`. Override to the hovered mode so
                                       ;; the preview reflects the would-be commit.
                                       preview-icon (-> (build-icon preview-text)
                                                        (assoc-in [:data :mode] mode))]
                                   (merge-into-icon-preview!
                                    (assoc preview-base-target :icon preview-icon)))))
             :on-mouse-leave (when (or preview-target-db-id (seq preview-target-db-ids))
                               (fn []
                                 (dissoc-icon-preview-field! preview-base-target :icon)))
             :on-click (fn []
                         ;; Radio semantic: clicking the already-selected
                         ;; tile is a no-op — skip the same-value
                         ;; `persist!` round-trip to avoid a needless
                         ;; parent re-render.
                         (when (not= mode @*mode)
                           (reset! *mode mode)
                           (case mode
                             "initials" (reset! *text-value derived-initials)
                             "abbreviated" (reset! *text-value derived-abbreviated)
                             "custom" nil)
                           (persist!)
                           (when (= mode "custom")
                             ;; Autofocus the text input when Custom is
                             ;; selected. `setTimeout` waits for the
                             ;; re-render so the input element exists.
                             (js/setTimeout
                              (fn []
                                (when-let [el (some-> js/document
                                                      (.querySelector ".text-picker-section input.ui__input"))]
                                  (.focus el)
                                  (when-let [v @*text-value]
                                    (.setSelectionRange el (count v) (count v)))))
                              30))))}
            [:div.text-picker-gallery-preview
             (if display-text
               ;; `:color? true` wraps the SVG in `.ls-icon-color-wrap`
               ;; so the gallery preview's text picks up the user's
               ;; chosen color via `currentColor` (same fix as the
               ;; Custom-tab Text tile in custom-tab-cp).
               (icon (build-icon display-text) {:size 36 :color? true})
               (shui/tabler-icon "pencil" {:size 20}))]
            [:span.text-picker-gallery-label label]]))]

      ;; Themed via the shared `icon-picker-separator` class instead of
      ;; shadcn's `bg-border opacity-50` default, which fades the line
      ;; to near-invisible in dark OG. `-mx-3` keeps the edge-to-edge
      ;; geometry that the original layout depended on.
      (shui/separator {:class "my-0 -mx-3 icon-picker-separator"})

      ;; Controls row: Text input + Alignment side by side
      [:div.text-picker-controls-row
       ;; Text input
       [:div.text-picker-section.flex-1
        [:label (t :icon.text-picker/text-input-label)]
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
        [:label (t :icon.text-picker/alignment-label)]
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

(hsx/defc icon-hover-effects
  "Phantom function-component hosting React hooks for icon-hover-preview.
   Isolating the hover-preview effects here keys them off `current-id`
   independently of the picker's own render cycle, so they refire on
   hover changes without re-running the whole picker. Renders nil.

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

(defn- compute-delete-mode
  "Classify the picker's delete affordance based on entity + property scope.

   Returns one of:
   - `:two-option` — entity has an own icon AND a class default-icon would
     inherit if the override were retracted. Picker opens a dropdown:
     `[↩ Revert to default]` retracts; `[🗑 Remove entirely]` writes
     `{:type :none}`.
   - `:remove` — entity has an own icon but no class inheritance source
     (or scope is class default-icon itself, which has no inheritance above
     it). Single-click retract.
   - `:suppress` — entity has NO own icon but IS inheriting a class
     default-icon. Single-click writes `{:type :none}` to hide the
     inherited icon on this entity only. Recovery is via the page-title
     'Restore icon' affordance.
   - `:hidden` — nothing to act on: no own icon and no class default
     to suppress, OR entity is already suppressed via `:type :none`
     (restoration lives in the page-title affordance, not here).

   Reads `:block/tags` + `:logseq.property.class/default-icon` so
   `db-mixins/query` registers them as render deps — the trash UI updates
   when a class's default-icon changes."
  [entity property]
  (let [own           (when entity (get entity property))
        none?         (= :none (:type own))
        has-real-own? (and own (not none?))
        scope-page-icon? (= property :logseq.property/icon)
        ;; Inheritance only applies to the page-icon scope. The class
        ;; default-icon picker IS the source — nothing above it.
        class-default (when (and scope-page-icon? entity)
                        (some :logseq.property.class/default-icon
                              (sort-by :db/id (:block/tags entity))))
        tag-icon      (when (and scope-page-icon? entity)
                        (some :logseq.property/icon
                              (sort-by :db/id (:block/tags entity))))
        ;; Class entity whose own icon equals its default-icon — block.cljs's
        ;; sync-clear path at :3974-3980 already handles this as one action.
        synced-class? (and entity
                           (ldb/class? entity)
                           (= own (:logseq.property/icon entity))
                           (= own (:logseq.property.class/default-icon entity)))]
    (cond
      none?                                      :hidden
      ;; No own override but a class default-icon inherits in.
      ;; Single-click "Hide inherited" writes :none sentinel.
      ;; Tag-icon inheritance (a tag's OWN icon, not its class default)
      ;; is intentionally excluded — that's not a "user opted into a
      ;; default" relationship, so suppression has no clear UX story there.
      (and (not has-real-own?) class-default)    :suppress
      (not has-real-own?)                        :hidden
      synced-class?                              :remove
      (or class-default tag-icon)                :two-option
      :else                                      :remove)))

(hsx/defc icon-search
  [{:keys [on-chosen del-btn? icon-value page-title preview-target-db-id preview-target-db-ids
           preview-inheritor-db-ids
           allowed-tabs hover-wrap-fn color-btn? property hide-topbar?]
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
  (let [*q (hooks/use-memo #(atom "") [])
        *result (hooks/use-memo #(atom nil) [])
        *focus-region (hooks/use-memo #(atom :search) [])
        *highlighted-index (hooks/use-memo #(atom nil) [])
        *input-focused? (hooks/use-memo #(atom false) [])
        *virtuoso-ref (hooks/use-memo #(atom nil) [])
        *asset-picker-initial-mode (hooks/use-memo #(atom nil) [])
        *fetched-inheritor-ids (hooks/use-memo #(atom nil) [])
        *drag-active? (hooks/use-memo #(atom false) [])
        *drag-depth (hooks/use-memo #(atom 0) [])
        *loaded-assets (hooks/use-memo #(atom nil) [])
        ;; Seed view/tab/color synchronously (use-memo runs during first
        ;; render) so the picker paints in the right surface/color without a
        ;; flash — replaces the old :will-mount synchronous resets.
        *tab (hooks/use-memo
              #(atom (let [allowed (some-> allowed-tabs set)]
                       (if (and allowed (not (allowed :all))) (first allowed) :all)))
              [])
        *view (hooks/use-memo
               #(atom (let [normalized (normalize-icon icon-value)]
                        (cond
                          (= :text (:type normalized)) :text-picker
                          (contains? #{:avatar :image} (:type normalized)) :asset-picker
                          :else :icon-picker)))
               [])
        *color (hooks/use-memo
                #(atom (let [denull (fn [x] (when (and x (not= x "inherit")) x))
                             normalized (normalize-icon icon-value)
                             icon-color (denull (get-in normalized [:data :color]))
                             initial-color (denull (:initial-color opts))
                             stored (let [raw (denull (storage/get :ls-icon-color-preset))]
                                      (when (and (string? raw)
                                                 (or (re-matches #"#[0-9a-fA-F]{6}" raw)
                                                     (re-matches #"var\(--rx-[A-Za-z0-9_-]+\)" raw)))
                                        raw))]
                         (or initial-color icon-color stored)))
                [])
        *input-ref (hooks/use-ref nil)
        *result-ref (hooks/use-ref nil)
        ;; Async portion of the old :will-mount (asset prefetch + class
        ;; inheritor-id fetch). Runs once post-mount; resets atoms on resolve.
        _ (hooks/use-effect!
           (fn []
             (let [no-assets? (:no-assets? opts)]
               (when-not no-assets?
                 (let [sync-assets (get-image-assets)]
                   (when (seq sync-assets)
                     (reset! *loaded-assets sync-assets)))
                 (-> (<get-image-assets)
                     (p/then (fn [async-assets]
                               (when (some? @*loaded-assets)
                                 (reset! *loaded-assets (vec async-assets)))
                               (when (and (nil? @*loaded-assets) (seq async-assets))
                                 (reset! *loaded-assets (vec async-assets)))))
                     (p/catch (fn [_] nil))))
               (when (and preview-target-db-id
                          (= property :logseq.property.class/default-icon)
                          (not (seq preview-inheritor-db-ids)))
                 (-> (db-async/<get-tag-objects (state/get-current-repo) preview-target-db-id)
                     (p/then (fn [instances]
                               (reset! *fetched-inheritor-ids
                                       (->> instances
                                            (remove :logseq.property/icon)
                                            (map :db/id)
                                            set
                                            not-empty))))
                     (p/catch (fn [_] nil)))))
             js/undefined)
           [])
        ;; Old :did-mount: focus the search input, hold a brief focus-grab
        ;; window against Radix's MenuSubContent refocus, and apply the
        ;; initial color tint to the picker root.
        _ (hooks/use-effect!
           (fn []
             (let [focus-input! (fn []
                                  (when-let [^js input (hooks/deref *input-ref)]
                                    (when (not= js/document.activeElement input)
                                      (.focus input))))]
               (js/setTimeout focus-input! 0)
               (let [done? (atom false)
                     handler (fn [^js e]
                               (when-not @done?
                                 (when-let [^js input (hooks/deref *input-ref)]
                                   (when-let [^js picker (.closest input ".cp__emoji-icon-picker")]
                                     (let [^js tgt (.-target e)]
                                       (when (and (not= tgt input)
                                                  (not (.contains picker tgt)))
                                         (.focus input)))))))]
                 (.addEventListener js/document "focusin" handler true)
                 (js/setTimeout
                  (fn []
                    (reset! done? true)
                    (.removeEventListener js/document "focusin" handler true))
                  300)))
             (let [c @*color]
               (when (and c (not (string/blank? c)) (not= c "inherit"))
                 (js/setTimeout
                  (fn []
                    (when-let [^js input (hooks/deref *input-ref)]
                      (when-let [^js picker (.closest input ".cp__emoji-icon-picker")]
                        (.setProperty (.-style picker) "--ls-color-icon-preset" c)
                        (.add (.-classList picker) "icon-colored"))))
                  0)))
             js/undefined)
           [])
        *q *q
        *result *result
        *tab *tab
        ;; Per-instance drag state for the outer drop zone (see mixin comment).
        *drag-active? *drag-active?
        *drag-depth   *drag-depth
        *color *color
        *input-focused? *input-focused?
        *view *view
        *asset-picker-initial-mode *asset-picker-initial-mode
        *loaded-assets *loaded-assets
        *input-ref *input-ref
        *result-ref *result-ref
        *virtuoso-ref *virtuoso-ref
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
        *fetched-inheritor-ids *fetched-inheritor-ids
        ;; Subscribe unconditionally (Rules of Hooks): the `or` below would
        ;; otherwise short-circuit past the hook when the caller passes ids.
        fetched-inheritor-ids (first (hooks/use-atom *fetched-inheritor-ids))
        derived-inheritor-db-ids (or (not-empty (set preview-inheritor-db-ids))
                                     fetched-inheritor-ids)
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
        ;; Reactively derive both `del-btn?` (a boolean, kept for back-compat
        ;; with downstream callers) and `delete-mode` (a keyword that drives
        ;; the new dropdown UX — see `compute-delete-mode`). Both subscribe
        ;; to the live entity via model/sub-block.
        ;; Subscribe unconditionally (Rules of Hooks): model/sub-block wraps
        ;; use-query, so it can't sit inside a `when`. It's nil-safe for a nil
        ;; id, so a nil preview-target-db-id just yields nil here.
        live-entity (model/sub-block preview-target-db-id)
        delete-mode (if preview-target-db-id
                      (compute-delete-mode live-entity property)
                      (if del-btn? :remove :hidden))
        del-btn? (not= delete-mode :hidden)
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
                     (or (some-> live-entity
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
        *focus-region *focus-region
        *highlighted-index *highlighted-index
        ;; Subscribe via `use-atom` (not bare deref) so changes to
        ;; `*highlighted-index` from `keyboard-nav-controller` arrow-key
        ;; handlers re-render icon-search. Without this, `highlighted-id`
        ;; below was computed once at popup-show and never refreshed —
        ;; the phantom `icon-hover-effects` component (which broadcasts
        ;; the highlighted item to `:ui/icon-hover-preview`) never saw a
        ;; fresh `current-id`, so keyboard nav silently no-op'd while
        ;; mouse hover worked. One subscription is enough; the other
        ;; reads can stay as bare derefs once the component is hooked up.
        highlighted-idx (first (hooks/use-atom *highlighted-index))
        ;; Subscribe at top level (Rules of Hooks): both were read inside the
        ;; `(case @*view …)` :icon-picker branch, so the hook ran only in that
        ;; view — flipping views changed hook order and crashed React.
        drag-active? (first (hooks/use-atom *drag-active?))
        loaded-assets (first (hooks/use-atom *loaded-assets))
        ;; Subscribe at top level (Rules of Hooks); the nested read inside the
        ;; results branch then just derefs the value this subscription tracks.
        section-states (first (hooks/use-atom *section-states))
        {flat-items :items sections :sections} (compute-flat-items @*tab result section-states
                                                                   {:show-used? (:show-used? opts)})
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
        reset-q! #(when-let [^js input (hooks/deref *input-ref)]
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
                       (util/scroll-to (hooks/deref *result-ref) 0 false))))]
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
                     ;; Now 1-arg — the sub-picker's own dropdown supplies the
                     ;; action keyword (:revert | :remove | :remove-entirely).
                     ;; Fall back to :remove if called without an action (defensive).
                     :on-delete (fn [& [action]]
                                  (reset-picker-transient-state!
                                   {:*asset-picker-initial-mode *asset-picker-initial-mode})
                                  (on-chosen nil nil (or action :remove)))
                     :del-btn? del-btn?
                     :delete-mode delete-mode
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
                    :on-delete (fn [& [action]]
                                 (reset-picker-transient-state!
                                  {:*asset-picker-initial-mode *asset-picker-initial-mode})
                                 (on-chosen nil nil (or action :remove)))
                    :del-btn? del-btn?
                    :delete-mode delete-mode
                    :current-icon normalized-icon-value
                    :selected-color @*color
                    :page-title page-title
                    ;; Forward the preview scope so text-picker's color
                    ;; swatches can broadcast `:ui/icon-hover-preview`
                    ;; writes targeted at the right entity (same chain
                    ;; the icon-picker uses to live-tint the page-icon).
                    :preview-target-db-id (:preview-target-db-id opts)
                    :preview-target-db-ids (:preview-target-db-ids opts)
                    :preview-inheritor-db-ids (:preview-inheritor-db-ids opts)
                    :property (:property opts)})

      ;; Default - Level 1: Icon Picker view
      [:div.cp__emoji-icon-picker
       {:data-keep-selection true
        :class (when drag-active? "drag-active")
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
                           (p/let [entity (<save-image-asset! repo file)]
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
                           (shui/toast! (t :icon.upload/non-image-warning)
                                        :warning))))))}

       ;; Drag overlay hint
       (when @*drag-active?
         [:div.drag-overlay-hint
          [:div.corner.tl] [:div.corner.tr]
          [:div.corner.bl] [:div.corner.br]
          (shui/tabler-icon "upload" {:size 26})
          [:div.text-group
           [:span.title (t :icon.upload/drop-icon-overlay-title)]
           [:span.subtitle (t :icon.upload/format-list)]]])

       ;; Phantom component hosting hover-preview lifecycle hooks.
       ;; Renders nothing; isolating these effects keys them off
       ;; `current-id` without re-running the whole picker on each hover.
       (icon-hover-effects
        {:current-id   highlighted-id
         :current-item (when (and highlighted-idx
                                  (< highlighted-idx (count flat-items)))
                         (nth flat-items highlighted-idx))
         :broadcast!   broadcast-tile-hover!
         :clear!       clear-tile-hover!})

       ;; Always-mount invisible controllers. Lifted out of `.tabs-section`
       ;; so they keep working when the topbar is hidden via `:hide-topbar?`
       ;; (reaction pickers). They render nil; mounting them anywhere in
       ;; the picker tree gives keyboard-nav + tab-change side-effects.
       (tab-observer @*tab {:q @*q :*result *result
                            :assets loaded-assets
                            :no-assets? (:no-assets? opts)})
       (keyboard-nav-controller
        {:*focus-region      *focus-region
         :*highlighted-index *highlighted-index
         :*tab               *tab
         :*input-ref         *input-ref
         :flat-items         flat-items
         :sections           sections
         :*virtuoso-ref      *virtuoso-ref
         :section-shortcuts  {49 "Recently used" 50 "Emojis" 51 "Icons" 52 "Assets"}
         :topbar-selector    ".cp__emoji-icon-picker .tabs-section [data-topbar-stop]"})

       ;; Topbar: tabs + separator + search. Whole topbar collapses to
       ;; just the search input when `:hide-topbar?` is true (reactions:
       ;; emoji-only, no tabs, no color picker).
       [:div.icon-picker-topbar
        (when-not hide-topbar?
          [:div.tabs-section {:role "tablist"}
           (ui/tab-items
            {:tabs (let [all-tabs [[:all (t :icon/tab-all)] [:emoji (t :icon/tab-emojis)]
                                   [:icon (t :icon/tab-icons)] [:custom (t :icon/tab-custom)]]]
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
                            (some-> (hooks/deref *input-ref) (.focus))))
             :button-attrs {:data-topbar-stop "tab"}
             :tab-id-prefix "icon-picker"
             :panel-id "icon-picker-panel"})
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
                                            (let [^js cnt (some-> (hooks/deref *input-ref) (.closest ".cp__emoji-icon-picker"))
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
                                                    (some-> (hooks/deref *input-ref) (.focus))))))
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
          ;; delete button — single-click in :remove mode, dropdown in :two-option mode.
          ;; NOTE: use `cond` (not `case`) — CLJS `case` with keyword tests + a
          ;; nil branch + Radix dropdown-menu children somehow leaks a keyword
          ;; into the React child tree. Reproduced specifically on icon-free
          ;; pages (delete-mode = :hidden → case returns nil → still throws
          ;; "Objects are not valid as a React child"). `cond` avoids the bug.
            (let [trash-icon (shui/tabler-icon "trash" {:size 17})
                  reset-and-call (fn [action]
                                   (reset-picker-transient-state!
                                    {:*asset-picker-initial-mode *asset-picker-initial-mode})
                                   (on-chosen nil nil action))]
              (cond
                (= delete-mode :hidden) nil

                (= delete-mode :remove)
                (shui/button {:variant :outline :size :sm :data-action "del"
                              :data-topbar-stop "trash"
                              :title (t :icon/remove-icon)
                              :aria-label (t :icon/remove-icon)
                              :on-click #(reset-and-call :remove)}
                             trash-icon)

                (= delete-mode :suppress)
              ;; Same trash glyph + single click as :remove, but the action
              ;; is :remove-entirely (writes :none) to hide the inherited
              ;; class default-icon on this entity. Tooltip differentiates.
                (shui/button {:variant :outline :size :sm :data-action "del"
                              :data-topbar-stop "trash"
                              :title (t :icon/hide-inherited-icon)
                              :aria-label (t :icon/hide-inherited-icon)
                              :on-click #(reset-and-call :remove-entirely)}
                             trash-icon)

                (= delete-mode :two-option)
                (shui/dropdown-menu
                 (shui/dropdown-menu-trigger
                  {:as-child true}
                  (shui/button {:variant :outline :size :sm :data-action "del"
                                :data-topbar-stop "trash"
                                :title (t :icon/remove-icon-options)
                                :aria-label (t :icon/remove-icon-options)
                                :aria-haspopup "menu"}
                               trash-icon))
                 (shui/dropdown-menu-content
                  {:side "bottom" :align "end"}
                  (shui/dropdown-menu-item
                   {:on-select #(reset-and-call :revert)}
                   (shui/tabler-icon "arrow-back-up" {:size 14 :class "mr-2 opacity-80"})
                   (t :icon/revert-to-default))
                  (shui/dropdown-menu-item
                   {:on-select #(reset-and-call :remove-entirely)}
                   (shui/tabler-icon "trash" {:size 14 :class "mr-2 opacity-80"})
                   (t :icon/remove-entirely))))))]])

        (when-not hide-topbar?
          (shui/separator {:class "my-0 icon-picker-separator"}))

        [:div.search-section
         [:div.search-input
          (shui/tabler-icon "search" {:size 16})
          [(shui/input
            {:auto-focus true
             :class "icon-search-input"
             :ref *input-ref
             :type "search"
             :aria-label (if hide-topbar?
                           (t :icon/search-emojis)
                           (t :icon/search-all-aria-label))
             :placeholder (if hide-topbar?
                            (t :icon/search-emojis)
                            (t :icon/search-all-placeholder))
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
                                    (when-let [^js cnt (some-> (hooks/deref *input-ref) (.closest ".cp__emoji-icon-picker"))]
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
                                    (when-let [^js cnt (some-> (hooks/deref *input-ref) (.closest ".cp__emoji-icon-picker"))]
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
                             (p/let [result (search @*q @*tab
                                                    @*loaded-assets
                                                    {:no-assets? (:no-assets? opts)})]
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
         (cond-> {:id "icon-picker-panel"}
           ;; Pane semantics depend on whether a tablist is rendered.
           ;; When the topbar is hidden (reactions), there's no tab to
           ;; label this panel, so we drop the tabpanel role + linkage —
           ;; the content is just an emoji grid inside the popover.
           (not hide-topbar?)
           (assoc :role "tabpanel"
                  :aria-labelledby (str "icon-picker-tab-" (name @*tab))))
         ;; Custom tab always shows its own content (Text/Avatar/Image buttons)
         (if (= @*tab :custom)
           (custom-tab-cp *q page-title *color *view *asset-picker-initial-mode icon-value opts)
           ;; Other tabs: show search results if present, else show tab content.
           ;; Tabs scope the search results by content type — :all shows both,
           ;; :emoji only emojis, :icon only icons. Mirrors the same gate in
           ;; compute-flat-items so the visible grid and the keyboard-nav
           ;; flat-items list stay in sync.
           (if (seq result)
             (let [section-states @*section-states
                   tab-allows-emojis? (contains? #{:all :emoji} @*tab)
                   tab-allows-icons?  (contains? #{:all :icon} @*tab)
                   tab-allows-assets? (= :all @*tab)
                   has-emojis? (and tab-allows-emojis? (seq (:emojis result)))
                   has-icons?  (and tab-allows-icons?  (seq (:icons result)))
                   has-assets? (and tab-allows-assets? (seq (:assets result)))
                   sections-visible (count (filter true? [has-emojis? has-icons? has-assets?]))
                   collapsible? (> sections-visible 1)]
               (if (or has-emojis? has-icons? has-assets?)
                 [:div.flex.flex-1.flex-col.search-result
                  ;; Emojis section
                  (when has-emojis?
                    (pane-section
                     "Emojis"
                     (:emojis result)
                     (assoc opts
                            :collapsible? collapsible?
                            :keyboard-hint (when collapsible? "alt mod 2")
                            :total-count (count (:emojis result))
                            :virtual-list? false
                            :expanded? (get section-states "Emojis" true))))

                  ;; Icons section
                  (when has-icons?
                    (pane-section
                     "Icons"
                     (:icons result)
                     (assoc opts
                            :collapsible? collapsible?
                            :keyboard-hint (when collapsible? "alt mod 3")
                            :total-count (count (:icons result))
                            :virtual-list? false
                            :expanded? (get section-states "Icons" true))))

                  ;; Assets section — bypasses pane-section for two reasons:
                  ;; (1) the 64px tiles render in a dedicated 5-col grid
                  ;; (.asset-picker-grid) rather than the 36px flex-wrap row
                  ;; that pane-section's `.its` layout produces; (2) the
                  ;; `.pane-section` class sets `color: var(--ls-color-icon-
                  ;; preset)` to tint Tabler SVGs via currentColor — useful
                  ;; for icons/emojis but a bug for image tiles, whose hover
                  ;; border-color rule falls back to currentColor when the
                  ;; undefined `--rx-accent-09` variable is dereferenced. By
                  ;; avoiding `.pane-section` here we match the asset-picker's
                  ;; cascade (neutral hover border, blue selected border).
                  (when has-assets?
                    [:div.assets-search-section
                     (section-header {:title "Assets"
                                      :count (count (:assets result))
                                      :total-count (count (:assets result))
                                      :expanded? (get section-states "Assets" true)
                                      :keyboard-hint (when collapsible? "alt mod 4")
                                      :on-toggle (when collapsible?
                                                   #(swap! *section-states update "Assets"
                                                           (fn [v] (if (nil? v) false (not v)))))
                                      :focus-region @*focus-region
                                      :simple? (not collapsible?)})
                     (when (get section-states "Assets" true)
                       [:div.asset-picker-grid.assets-search-grid
                        (for [item (:assets result)
                              :let [my-id (:id item)
                                    asset (:asset item)]]
                          ^{:key my-id}
                          [image-asset-item asset
                           (assoc opts
                                  :variant :search
                                  :item-id my-id
                                  :highlighted? (= my-id (:highlighted-id opts))
                                  :ghost-highlighted? (= my-id (:ghost-highlighted-id opts)))])])])]
                 ;; Search returned no results
                 [:div.search-empty-state
                  (shui/tabler-icon "search-off" {:size 36})
                  [:span.title (t :icon/search-empty-title)]
                  [:span.subtitle (t :icon/search-empty-desc)]]))
             [:div.flex.flex-1.flex-col.gap-1
              (case @*tab
                :emoji (emojis-cp emojis opts)
                :icon (icons-cp (get-tabler-icons) opts)
                (all-cp opts))]))]]])))

(hsx/defc icon-picker-trigger-icon
  "Reactive sub-component so the trigger icon re-renders on hover-preview changes
  without forcing the parent (which uses React hooks) into a class component.
  `property` scopes the preview match — defaults to `:logseq.property/icon`
  so existing callers keep their behavior; property/value.cljs's
  `default-icon-row` passes `:logseq.property.class/default-icon` so its
  trigger only reflects previews from a Default-Icon-scoped picker."
  [icon-value preview-target-db-id icon-props & [property]]
  (let [property (or property :logseq.property/icon)
        ;; Hook must run unconditionally (was `(when … (state/sub …))`).
        preview (let [p (state/use-sub :ui/icon-hover-preview)]
                  (when preview-target-db-id p))
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

(hsx/defc icon-picker
  [icon-value {:keys [empty-label disabled? initial-open? del-btn? on-chosen icon-props popup-opts button-opts page-title preview-target-db-id preview-target-db-ids preview-inheritor-db-ids default-icon? property]
               :or {property :logseq.property/icon}}]
  (let [*trigger-ref (hooks/use-ref nil)
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
        [pending-icon set-pending-icon!] (hooks/use-state nil)
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
             {:on-chosen (fn [e icon-value & [keep-popup?]]
                           ;; Set the optimistic local mirror BEFORE the
                           ;; async DB write fires. Lives at this
                           ;; outermost wrapper so every commit path
                           ;; benefits (custom-tab tiles, search-result
                           ;; tiles, asset-picker image picks, text-
                           ;; picker close commits) — they all funnel
                           ;; through this on-chosen.
                           (set-pending-icon! icon-value)
                           ;; Forward the third arg as-is — it carries either
                           ;; `keep-popup?` (a bool, for in-picker partial
                           ;; commits) or an `action` keyword (for delete
                           ;; flows like :revert / :remove-entirely). The
                           ;; downstream on-chosen handles both shapes; we
                           ;; just need to NOT drop it.
                           (on-chosen e icon-value keep-popup?)
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
         (js/setTimeout #(some-> (hooks/deref *trigger-ref) (.click)) 32)))
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
         (or empty-label (t :ui/empty)))))))
