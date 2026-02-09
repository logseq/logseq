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

;; Tracks page IDs for which we've attempted auto-fetch of Wikipedia avatars.
;; Using a local atom instead of a DB property to avoid migration issues.
;; This resets on app restart, allowing retry for previously failed fetches.
(defonce *avatar-fetch-attempted (atom #{}))

;; Tracks page IDs for which we've attempted auto-fetch of Wikipedia images (for :image type).
(defonce *image-fetch-attempted (atom #{}))

;; Rate-limiting queue for Wikipedia API fetches
;; Prevents hammering the API when many pages need fetching
(defonce *wikipedia-fetch-queue (atom #queue []))
(defonce *wikipedia-fetch-processing? (atom false))

;; Asset picker drag & drop state
(defonce *drag-active? (atom false))
(defonce *drag-depth (atom 0))  ;; Track drag enter/leave depth to prevent flicker
(defonce *asset-picker-open? (atom false))
(defonce *upload-status (atom ""))
(defonce *uploading-files (atom {}))

(def wikipedia-fetch-delay-ms
  "Delay between Wikipedia API requests to avoid rate limiting"
  200)

(defn- process-wikipedia-fetch-queue!
  "Process queued Wikipedia fetches with delays between each request.
   Runs asynchronously, processing one item at a time."
  []
  (when-not @*wikipedia-fetch-processing?
    (reset! *wikipedia-fetch-processing? true)
    (letfn [(process-next []
              (if-let [fetch-fn (peek @*wikipedia-fetch-queue)]
                (do
                  (swap! *wikipedia-fetch-queue pop)
                  (p/let [_ (fetch-fn)]
                    (js/setTimeout process-next wikipedia-fetch-delay-ms)))
                (reset! *wikipedia-fetch-processing? false)))]
      (process-next))))

(defn enqueue-wikipedia-fetch!
  "Add a fetch operation to the rate-limited queue.
   The fetch-fn should be a zero-arg function that returns a promise."
  [fetch-fn]
  (swap! *wikipedia-fetch-queue conj fetch-fn)
  (process-wikipedia-fetch-queue!))

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

(defn- try-load-image-with-extensions!
  "Try loading image with common extensions until one works"
  [asset-uuid extensions *url *error *loaded-for]
  (if (empty? extensions)
    ;; No more extensions to try, mark as error
    (reset! *error true)
    ;; Try current extension
    (let [ext (first extensions)
          file (str asset-uuid "." ext)
          asset-path (path/path-join (str "../" common-config/local-assets-dir) file)]
      (-> (assets-handler/<make-asset-url asset-path)
          (p/then (fn [url]
                    ;; Success! Store the URL
                    (reset! *loaded-for [asset-uuid ext])
                    (reset! *url url)))
          (p/catch (fn [_]
                     ;; Failed, try next extension
                     (try-load-image-with-extensions! asset-uuid (rest extensions) *url *error *loaded-for)))))))

(defn- load-image-url!
  "Load image URL for an asset, updating the url/error atoms.
   If asset-type is nil, tries common image extensions."
  [asset-uuid asset-type *url *error *loaded-for]
  (when (and asset-uuid
             (not= @*loaded-for [asset-uuid asset-type]))
    (reset! *loaded-for [asset-uuid asset-type])
    (reset! *url nil)
    (reset! *error false)
    (if asset-type
      ;; Known extension - load directly
      (let [file (str asset-uuid "." asset-type)
            asset-path (path/path-join (str "../" common-config/local-assets-dir) file)]
        (-> (assets-handler/<make-asset-url asset-path)
            (p/then #(reset! *url %))
            (p/catch #(reset! *error true))))
      ;; Unknown extension - try common ones
      (try-load-image-with-extensions! asset-uuid common-image-extensions *url *error *loaded-for))))

(rum/defcs image-icon-cp < rum/reactive
  (rum/local nil ::url)
  (rum/local false ::error)
  (rum/local nil ::loaded-uuid)
  {:did-mount (fn [state]
                (let [[asset-uuid asset-type-arg _opts] (:rum/args state)
                      asset-type (or asset-type-arg
                                     (get-asset-type-from-db asset-uuid))
                      *url (::url state)
                      *error (::error state)
                      *loaded-uuid (::loaded-uuid state)]
                  ;; Only load if not already loaded for this uuid
                  (when (and asset-uuid (not= @*loaded-uuid asset-uuid))
                    (reset! *loaded-uuid asset-uuid)
                    (load-image-url! asset-uuid asset-type *url *error (atom nil))))
                state)
   :did-update (fn [state]
                 (let [[asset-uuid asset-type-arg _opts] (:rum/args state)
                       *loaded-uuid (::loaded-uuid state)]
                   ;; Only reload if asset-uuid changed
                   (when (and asset-uuid (not= @*loaded-uuid asset-uuid))
                     (let [asset-type (or asset-type-arg
                                          (get-asset-type-from-db asset-uuid))
                           *url (::url state)
                           *error (::error state)]
                       (reset! *loaded-uuid asset-uuid)
                       (reset! *url nil)
                       (reset! *error false)
                       (load-image-url! asset-uuid asset-type *url *error (atom nil)))))
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
  {:did-mount (fn [state]
                (let [[asset-uuid asset-type _avatar-data _opts] (:rum/args state)
                      *url (::url state)
                      *error (::error state)
                      *loaded-for (::loaded-for state)]
                  (load-image-url! asset-uuid asset-type *url *error *loaded-for))
                state)
   :did-update (fn [state]
                 (let [[asset-uuid asset-type _avatar-data _opts] (:rum/args state)
                       *loaded-for (::loaded-for state)]
                   (when (not= @*loaded-for [asset-uuid asset-type])
                     (let [*url (::url state)
                           *error (::error state)]
                       (load-image-url! asset-uuid asset-type *url *error *loaded-for))))
                 state)}
  "Renders an avatar with an image, with initials as fallback.
   Uses shui/avatar for circular display with object-fit: cover."
  [state _asset-uuid _asset-type avatar-data opts]
  (let [url @(::url state)
        ;; Size from opts, default to 20px
        size (or (:size opts) 20)
        ;; Fallback data from avatar
        avatar-value (get avatar-data :value "")
        backgroundColor (or (get avatar-data :backgroundColor)
                            (colors/variable :gray :09))
        color (or (get avatar-data :color)
                  (colors/variable :gray :09))
        display-text (subs avatar-value 0 (min 3 (count avatar-value)))
        bg-color-rgba (convert-bg-color-to-rgba backgroundColor)
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
      {:style {:background-color bg-color-rgba
               :font-size font-size
               :font-weight "500"
               :color color}}
      display-text))))

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
                     display-text (if (> (count text-value) 8)
                                    (subs text-value 0 8)
                                    text-value)
                     size (or (:size opts) 20)
                     ;; Scale font-size with icon size
                     font-size (cond
                                 (<= size 16) "10px"
                                 (<= size 24) "12px"
                                 (<= size 32) "14px"
                                 :else "16px")]
                 [:span.inline-flex.items-center.justify-center.flex-shrink-0
                  [:span.font-medium.text-center.whitespace-nowrap
                   {:style (cond-> {:font-size font-size}
                             text-color (assoc :color text-color))}
                   display-text]])

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
                         backgroundColor (or (get avatar-data :backgroundColor)
                                             (colors/variable :gray :09))
                         color (or (get avatar-data :color)
                                   (colors/variable :gray :09))
                         display-text (subs avatar-value 0 (min 3 (count avatar-value)))
                         bg-color-rgba (convert-bg-color-to-rgba backgroundColor)
                         ;; Scale font-size with avatar size
                         font-size (cond
                                     (<= size 16) "8px"
                                     (<= size 24) "10px"
                                     (<= size 32) "12px"
                                     :else "14px")]
                     (shui/avatar
                      {:style {:width size :height size}}
                      (shui/avatar-fallback
                       {:style {:background-color bg-color-rgba
                                :font-size font-size
                                :font-weight "500"
                                :color color}}
                       display-text)))))

               ;; Image with asset - use image icon component
               (and (map? normalized) (= :image (:type normalized)) (get-in normalized [:data :asset-uuid]))
               (let [asset-uuid (get-in normalized [:data :asset-uuid])
                     asset-type (get-in normalized [:data :asset-type])]
                 (image-icon-cp asset-uuid asset-type opts))

               ;; Image without asset (empty state) - show subtle placeholder
               ;; This is shown when inherited from default-icon before auto-fetch completes
               (and (map? normalized) (= :image (:type normalized)) (get-in normalized [:data :empty?]))
               (let [size (or (:size opts) 20)]
                 [:span.ui__icon.image-icon.empty-image-placeholder.cursor-pointer
                  {:style {:width size
                           :height size
                           :border "1px dashed var(--lx-gray-06)"
                           :border-radius "2px"
                           :background "var(--lx-gray-02)"}
                   :title "Click to set image"}])

               ;; Legacy format support (fallback if normalization failed)
               (and (map? icon') (= :emoji (:type icon')) (:id icon'))
               [:span.ui__icon
                [:em-emoji (merge {:id (:id icon')
                                   :style {:line-height 1}}
                                  opts)]]

               (and (map? icon') (= :tabler-icon (:type icon')) (:id icon'))
               (ui/icon (:id icon') opts)

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
        ;; Check for default-icon on tags (unified icon inheritance)
        default-icon (some (fn [tag]
                             (:logseq.property.class/default-icon tag))
                           sorted-tags)]
    (cond
      ;; 1. Explicit "no icon" override - hide icon even if inherited
      (= :none (:type block-icon))
      nil

      ;; 2. Instance's own icon takes precedence
      block-icon
      block-icon

      ;; 3. Resolve from tag's default-icon (unified inheritance)
      default-icon
      (case (:type default-icon)
        :avatar (when (:block/title node-entity)
                  {:type :avatar
                   :data {:value (derive-avatar-initials (:block/title node-entity))}})
        :text (when (:block/title node-entity)
                {:type :text
                 :data {:value (derive-initials (:block/title node-entity))}})
        ;; Image type: return marker indicating inherited image without asset yet
        ;; This triggers the empty placeholder and auto-fetch behavior
        :image {:type :image
                :data {:empty? true}}
        ;; For tabler-icon and emoji, use the stored icon value directly
        default-icon)

      ;; 4. Type-based defaults (for classes, properties, pages, etc.)
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

;; ============================================================================
;; Auto-Fetch Wikipedia Avatar
;; ============================================================================

(defn- should-auto-fetch-avatar?
  "Check if we should auto-fetch a Wikipedia image for this page's avatar.
   Returns true if:
   - Auto-fetch is enabled in config
   - The page has a title
   - The page hasn't been attempted before (tracked in local atom)
   - The page doesn't already have a custom icon with an image"
  [page-entity]
  (let [page-id (:db/id page-entity)
        config (state/get-config)
        ;; Check new unified flag first, fall back to old flag for migration
        feature-enabled? (or (:feature/auto-fetch-wikipedia-images? config)
                             (:feature/auto-fetch-avatar-images? config))
        has-title? (some? (:block/title page-entity))
        not-attempted? (not (contains? @*avatar-fetch-attempted page-id))
        no-existing-asset? (not (get-in (:logseq.property/icon page-entity) [:data :asset-uuid]))
        result (and feature-enabled? has-title? not-attempted? no-existing-asset?)]
    (js/console.log "[auto-fetch-avatar] Checking conditions:"
                    "\n  feature-enabled?" feature-enabled?
                    "\n  has-title?" has-title? "(" (:block/title page-entity) ")"
                    "\n  not-attempted?" not-attempted?
                    "\n  no-existing-asset?" no-existing-asset?
                    "\n  RESULT:" result)
    result))

(defn- <auto-fetch-avatar-image!
  "Fetch Wikipedia image for a page and set it as the avatar icon.
   Marks the page as attempted in local atom regardless of success/failure."
  [page-entity]
  (let [repo (state/get-current-repo)
        page-id (:db/id page-entity)
        title (:block/title page-entity)]
    ;; Mark as attempted first (prevents re-fetch on re-render)
    (swap! *avatar-fetch-attempted conj page-id)
    ;; Try to fetch the image
    (p/let [image-data (<search-wikipedia-image title)]
      (when (and image-data (:url image-data))
        (p/let [asset (<save-url-asset! repo (:url image-data)
                                        (str "avatar-" (subs title 0 (min 30 (count title)))))]
          (when asset
            (property-handler/set-block-property!
             page-id
             :logseq.property/icon
             {:type :avatar
              :data {:value (derive-avatar-initials title)
                     :asset-uuid (str (:block/uuid asset))
                     :asset-type (:logseq.property.asset/type asset)}})))))))

(rum/defc auto-fetch-avatar-effect < rum/static
  "Effect component that triggers auto-fetch for avatar images.
   Renders nothing, just runs the side effect on mount."
  [page-entity]
  (js/console.log "[auto-fetch-avatar] Effect component mounted for:" (:block/title page-entity))
  (hooks/use-effect!
   (fn []
     (js/console.log "[auto-fetch-avatar] Effect running for:" (:block/title page-entity))
     (when (should-auto-fetch-avatar? page-entity)
       (js/console.log "[auto-fetch-avatar] Starting fetch for:" (:block/title page-entity))
       (<auto-fetch-avatar-image! page-entity))
     js/undefined)
   [(:db/id page-entity)])
  nil)

;; ============================================================================
;; Auto-Fetch Wikipedia Image (for :image type default icon)
;; ============================================================================

(defn- should-auto-fetch-image?
  "Check if we should auto-fetch a Wikipedia image for this page's icon.
   Returns true if:
   - Auto-fetch is enabled in config
   - The page has a title
   - The page hasn't been attempted before (tracked in *image-fetch-attempted atom)
   - The page doesn't already have a custom icon with an image

   Note: Wikidata pages are prevented from auto-fetch by adding their page ID to
   *image-fetch-attempted BEFORE redirect in cmdk/core.cljs :create-from-wikidata"
  [page-entity]
  (let [page-id (:db/id page-entity)
        config (state/get-config)
        ;; Check unified flag (same as avatar)
        feature-enabled? (or (:feature/auto-fetch-wikipedia-images? config)
                             (:feature/auto-fetch-avatar-images? config))
        has-title? (some? (:block/title page-entity))
        not-attempted? (not (contains? @*image-fetch-attempted page-id))
        no-existing-asset? (not (get-in (:logseq.property/icon page-entity) [:data :asset-uuid]))
        result (and feature-enabled? has-title? not-attempted? no-existing-asset?)]
    (js/console.log "[auto-fetch-image] Checking conditions:"
                    "\n  feature-enabled?" feature-enabled?
                    "\n  has-title?" has-title? "(" (:block/title page-entity) ")"
                    "\n  not-attempted?" not-attempted?
                    "\n  no-existing-asset?" no-existing-asset?
                    "\n  RESULT:" result)
    result))

(defn- <auto-fetch-image!
  "Fetch Wikipedia image for a page and set it as the icon.
   Marks the page as attempted in local atom regardless of success/failure.
   Uses rate-limited queue to prevent API overload."
  [page-entity]
  (let [repo (state/get-current-repo)
        page-id (:db/id page-entity)
        title (:block/title page-entity)]
    ;; Mark as attempted first (prevents re-fetch on re-render)
    (swap! *image-fetch-attempted conj page-id)
    ;; Enqueue the fetch operation (rate-limited)
    (enqueue-wikipedia-fetch!
     (fn []
       (p/let [image-data (<search-wikipedia-image title)]
         (when (and image-data (:url image-data))
           (p/let [asset (<save-url-asset! repo (:url image-data)
                                           (str "image-" (subs title 0 (min 30 (count title)))))]
             (when asset
               (property-handler/set-block-property!
                page-id
                :logseq.property/icon
                {:type :image
                 :data {:asset-uuid (str (:block/uuid asset))
                        :asset-type (:logseq.property.asset/type asset)}})))))))))

(rum/defc auto-fetch-image-effect < rum/static
  "Effect component that triggers auto-fetch for image icons.
   Renders nothing, just runs the side effect on mount.
   Uses rate-limited queue to prevent API overload."
  [page-entity]
  (js/console.log "[auto-fetch-image] Effect component mounted for:" (:block/title page-entity))
  (hooks/use-effect!
   (fn []
     (js/console.log "[auto-fetch-image] Effect running for:" (:block/title page-entity))
     (when (should-auto-fetch-image? page-entity)
       (js/console.log "[auto-fetch-image] Enqueuing fetch for:" (:block/title page-entity))
       (<auto-fetch-image! page-entity))
     js/undefined)
   [(:db/id page-entity)])
  nil)

(rum/defc empty-image-icon-cp
  "Renders a clickable empty image placeholder that opens the asset picker.
   Used for pages with inherited :image default-icon that haven't fetched/set an image yet."
  [page-entity opts]
  (let [size (or (:size opts) 20)
        page-title (:block/title page-entity)
        page-id (:db/id page-entity)]
    [:span.ui__icon.image-icon.empty-image-placeholder.cursor-pointer
     {:style {:width size
              :height size
              :border "1px dashed var(--lx-gray-06)"
              :border-radius "2px"
              :background "var(--lx-gray-02)"}
      :title "Click to set image"
      :on-click (fn [^js e]
                  (open-image-asset-picker! e page-id page-title nil))}]))

(rum/defc get-node-icon-cp < rum/reactive db-mixins/query
  [node-entity opts]
  (let [;; Get fresh entity using db/sub-block to make it reactive to property changes
        ;; Only subscribe if we have a db-id (optimization: avoid unnecessary subscriptions)
        fresh-entity (when-let [db-id (:db/id node-entity)]
                       (or (model/sub-block db-id) node-entity))
        entity (or fresh-entity node-entity)
        opts' (merge {:size 14} opts)
        node-icon (cond
                    (:own-icon? opts)
                    (get entity :logseq.property/icon)
                    (:link? opts)
                    "arrow-narrow-right"
                    :else
                    (get-node-icon entity))
        ;; Check if this is an avatar that might need auto-fetch:
        ;; - It's an avatar type
        ;; - It doesn't have an asset-uuid (text-only avatar)
        ;; - The entity is a page (not a block)
        is-auto-fetchable-avatar? (and (= :avatar (:type node-icon))
                                       (not (get-in node-icon [:data :asset-uuid]))
                                       (ldb/page? entity))
        ;; Check if this is an image that might need auto-fetch:
        ;; - It's an image type with empty? marker (inherited from default-icon)
        ;; - The entity is a page (not a block)
        is-auto-fetchable-image? (and (= :image (:type node-icon))
                                      (get-in node-icon [:data :empty?])
                                      (ldb/page? entity))
        ;; Check if this is an image icon with an asset (for error click handling)
        is-image-with-asset? (and (= :image (:type node-icon))
                                  (get-in node-icon [:data :asset-uuid])
                                  (ldb/page? entity))
        ;; Click handler for image error state - opens asset picker
        open-asset-picker-for-error
        (when is-image-with-asset?
          (fn [^js e]
            (open-image-asset-picker! e (:db/id entity) (:block/title entity) node-icon)))
        ;; Add error click handler to opts for image icons
        opts' (if open-asset-picker-for-error
                (assoc opts' :on-click-error open-asset-picker-for-error)
                opts')]
    (when-not (or (string/blank? node-icon) (and (contains? #{"letter-n" "file"} node-icon) (:not-text-or-page? opts)))
      [:<>
       ;; Auto-fetch effect for avatars without images
       (when is-auto-fetchable-avatar?
         (auto-fetch-avatar-effect entity))
       ;; Auto-fetch effect for images (inherited from default-icon)
       (when is-auto-fetchable-image?
         (auto-fetch-image-effect entity))
       ;; Icon rendering
       [:div.icon-cp-container.flex.items-center.justify-center
        (merge {:style {:color (or (:color node-icon) "inherit")}}
               (select-keys opts [:class]))
        ;; For empty images, use the clickable placeholder component
        (if is-auto-fetchable-image?
          (empty-image-icon-cp entity opts')
          (icon node-icon opts'))]])))

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
        :text {:type :text
               :id (or id (str "text-" value))
               :label (or label value)
               :data (cond-> {:value value}
                       color (assoc :color color))}
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
        results (db-utils/q '[:find ?uuid ?type ?title ?updated
                              :where
                              [?e :logseq.property.asset/type ?type]
                              [?e :block/uuid ?uuid]
                              [(get-else $ ?e :block/title "") ?title]
                              [(get-else $ ?e :block/updated-at 0) ?updated]])]
    (->> results
         (filter (fn [[_uuid type _title _updated]]
                   (contains? image-extensions (some-> type string/lower-case))))
         (sort-by (fn [[_uuid _type _title updated]] updated) >)
         (map (fn [[uuid type title _updated]]
                {:block/uuid uuid
                 :block/title (if (string/blank? title) (str uuid) title)
                 :logseq.property.asset/type type})))))

(defn <get-image-assets
  "Async fetch image assets from DB worker (works on cold start).
   Returns a promise that resolves to a list of asset maps."
  []
  (when-let [graph (state/get-current-repo)]
    (p/let [results (db-async/<q graph
                                 {:transact-db? true}
                                 '[:find (pull ?e [:block/uuid :block/title :logseq.property.asset/type :block/updated-at])
                                   :where
                                   [?e :logseq.property.asset/type ?type]])]
      (let [image-extensions (set (map name config/image-formats))
            ;; Results from pull queries come as [[{map}] [{map}] ...], extract the maps
            assets (map (fn [r] (if (vector? r) (first r) r)) results)]
        (->> assets
             (filter (fn [asset]
                       (contains? image-extensions
                                  (some-> (:logseq.property.asset/type asset) string/lower-case))))
             (sort-by :block/updated-at >))))))

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
  (p/let [[repo-dir asset-dir-rpath] (assets-handler/ensure-assets-dir! repo)
          file-name (node-path/basename (.-name file))
          file-name-without-ext* (db-asset/asset-name->title file-name)
          file-name-without-ext (if (= file-name-without-ext* "image")
                                  (date/get-date-time-string-2)
                                  file-name-without-ext*)
          checksum (assets-handler/get-file-checksum file)
          size (.-size file)
          ext (db-asset/asset-path->type file-name)
          asset-class (db/entity :logseq.class/Asset)
          block-id (ldb/new-block-id)]
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
                      :properties {:block/tags (:db/id asset-class)
                                   :logseq.property.asset/type ext
                                   :logseq.property.asset/checksum checksum
                                   :logseq.property.asset/size size}
                      :edit-block? false})]
        (db/entity [:block/uuid (:block/uuid block)])))))

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
  [icon-item {:keys [on-chosen hover]}]
  (let [icon-id (get-in icon-item [:data :value])
        icon-name (or (:label icon-item) icon-id)
        color (get-in icon-item [:data :color])
        icon-id' (when icon-id (cond-> icon-id (string? icon-id) (string/replace " " "")))]
    [:button.w-9.h-9.transition-opacity
     (when icon-id'
       {:key icon-id'
        :tabIndex "0"
        :title icon-name
        :on-click (fn [e]
                    ;; Use legacy format like emoji-cp for consistent normalization
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
  [icon-item {:keys [on-chosen hover]}]
  (let [emoji-id (get-in icon-item [:data :value])
        emoji-name (or (:label icon-item) emoji-id)]
    [:button.text-2xl.w-9.h-9.transition-opacity
     (cond->
      {:tabIndex "0"
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
  [icon-item {:keys [on-chosen hover]}]
  (let [text-value (get-in icon-item [:data :value])
        text-color (get-in icon-item [:data :color])
        display-text (if (> (count text-value) 8)
                       (subs text-value 0 8)
                       text-value)]
    [:button.w-9.h-9.transition-opacity.text-sm.font-medium
     (cond->
      {:tabIndex "0"
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
  [icon-item {:keys [on-chosen hover]}]
  (let [avatar-value (get-in icon-item [:data :value])
        backgroundColor (or (get-in icon-item [:data :backgroundColor])
                            (colors/variable :gray :09))
        color (or (get-in icon-item [:data :color])
                  (colors/variable :gray :09))
        display-text (subs avatar-value 0 (min 3 (count avatar-value)))
        bg-color-rgba (convert-bg-color-to-rgba backgroundColor)]
    [:button.w-9.h-9.transition-opacity.flex.items-center.justify-center
     (cond->
      {:tabIndex "0"
       :title avatar-value
       :class "p-0 border-0 bg-transparent cursor-pointer"
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
  [{:keys [title count total-count expanded? keyboard-hint on-toggle input-focused? simple?]}]
  [:div.section-header.text-xs.py-1.5.px-3.flex.justify-between.items-center.gap-2.bg-gray-02.h-8
   {:style {:color "var(--lx-gray-11)"}}
   ;; Left: Title · total-count · Chevron (chevron and count hidden in simple mode)
   [:div.flex.items-center.gap-1.select-none
    (when-not simple? {:class "cursor-pointer"
                       :on-click on-toggle})
    [:span.font-bold title]
    (when (and (not simple?) (or total-count count))
      [:<>
       [:span "·"]
       [:span {:style {:font-size "0.7rem"}}
        (or total-count count)]])
    (when-not simple?
      (ui/icon (if expanded? "chevron-down" "chevron-right") {:size 14}))]

   [:div.flex-1] ; Spacer

   ;; Right: Hide/Show with keyboard shortcut (fades out when input is focused)
   (when keyboard-hint
     [:div.flex.gap-1.items-center.text-xs.opacity-50.transition-all.duration-200
      {:class (when input-focused? "!opacity-0")
       :style {:pointer-events (if input-focused? "none" "auto")}}
      (if expanded? "Hide" "Show")
      (shui/shortcut keyboard-hint {:style :compact})])])

(rum/defc pane-section
  [label icon-items & {:keys [collapsible? keyboard-hint total-count searching? virtual-list? render-item-fn expanded? input-focused? show-header?]
                       :or {virtual-list? true collapsible? false expanded? true input-focused? false show-header? true}
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
     ;; Use new collapsible header when collapsible? is true
     (when show-header?
       (if collapsible?
         (section-header {:title label
                          :count (count icon-items)
                          :total-count total-count
                          :expanded? expanded?
                          :keyboard-hint keyboard-hint
                          :on-toggle toggle-fn
                          :input-focused? input-focused?})
         ;; Simple header (current style) for non-collapsible
         [:div.hd.px-1.pb-1.leading-none
          [:strong.text-xs.font-medium.text-gray-07.dark:opacity-80 label]]))

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
     :on-hover (:on-hover opts))))

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
     :on-hover (:on-hover opts))))

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
        ;; Image item - check if current icon is an image
        current-image-icon (when (= :image (:type (normalize-icon icon-value)))
                             (normalize-icon icon-value))
        on-chosen (:on-chosen opts)]
    [:div.custom-tab-content
     ;; Text option
     (when text-item
       [:button.custom-tab-item
        {:on-click #(on-chosen % text-item)}
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

     ;; Image option - clicking navigates to asset picker
     [:button.custom-tab-item
      {:on-click #(reset! *view :asset-picker)}
      [:div.custom-tab-item-preview
       (if current-image-icon
         (icon current-image-icon {:size 32})
         (shui/tabler-icon "photo" {:size 24 :class "text-gray-08"}))]
      [:span.custom-tab-item-label "Image"]]]))

(rum/defcs image-asset-item < rum/reactive
  (rum/local nil ::url)
  (rum/local false ::error)
  {:did-mount (fn [state]
                (let [[asset _opts] (:rum/args state)
                      *url (::url state)
                      *error (::error state)
                      asset-type (:logseq.property.asset/type asset)
                      asset-uuid (:block/uuid asset)]
                  (when (and asset-uuid asset-type)
                    (let [file (str asset-uuid "." asset-type)
                          asset-path (path/path-join (str "../" common-config/local-assets-dir) file)]
                      (-> (assets-handler/<make-asset-url asset-path)
                          (p/then #(reset! *url %))
                          (p/catch (fn [_err]
                                     ;; Mark as error so we don't show ghost placeholder
                                     (reset! *error true)))))))
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
    ;; Don't render ghost assets (db entry exists but file doesn't)
    (when-not error?
      [:button.image-asset-item
       {:title asset-title
        :class (util/classnames [{:avatar-mode avatar-mode?
                                  :selected selected?}])
        :on-click (fn [e]
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
                                    :data image-data}))))}
       (if url
         [:img {:src url :loading "lazy"}]
         [:div.bg-gray-04.animate-pulse])])))

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
        skip-confirm? (get-web-image-skip-confirm)]
    ;; Don't render section if no query or empty results after loading
    (when-not (and (not loading?) (empty? images) (not (string/blank? query)))
      [:div.pane-section.web-images-section
       ;; Section header with info icon
       [:div.section-header-row
        (section-header {:title "Web images"
                         :count (when-not loading? (count images))
                         :expanded? true})
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
              (str "web-" (:url web-image)))))]])))

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
                  ;; Use sync data as immediate placeholder (avoids spinner if we have partial data)
                  (when (seq sync-assets)
                    (reset! *loaded-assets sync-assets)
                    (reset! *loading? false))
                  ;; Always fire async query to ensure complete asset list
                  (-> (<get-image-assets)
                      (p/then (fn [async-assets]
                                (when @*asset-picker-open?
                                  (reset! *loaded-assets (vec async-assets))
                                  (reset! *loading? false))))
                      (p/catch (fn [_err]
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
                               thumb-url  ; PNG thumbnail for SVG
                               url)       ; Original for other formats
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
                             ;; Update ARIA status
                             (reset! *upload-status
                                     (str "Uploading " (count image-files) " image"
                                          (when (not= 1 (count image-files)) "s")))

                             (p/let [entities (p/all (map #(save-image-asset! repo %) image-files))]
                               (p/let [updated-assets (<get-image-assets)]
                                 (reset! *loaded-assets (or (seq updated-assets) [])))

                               ;; Show feedback notification
                               (let [uploaded-count (count (remove nil? entities))]
                                 (cond
                                   (and (pos? uploaded-count) (empty? rejected-files))
                                   (shui/toast! (str "Uploaded " uploaded-count " image"
                                                     (when (not= 1 uploaded-count) "s"))
                                                :success)

                                   (and (pos? uploaded-count) (seq rejected-files))
                                   (shui/toast! (str "Uploaded " uploaded-count " image"
                                                     (when (not= 1 uploaded-count) "s")
                                                     ". Skipped " (count rejected-files)
                                                     " file" (when (not= 1 (count rejected-files)) "s")
                                                     " (not images)")
                                                :warning)

                                   :else
                                   (shui/toast! (str "No valid images to upload. Skipped "
                                                     (count rejected-files) " file"
                                                     (when (not= 1 (count rejected-files)) "s"))
                                                :error)))

                               ;; Update completion status
                               (reset! *upload-status
                                       (str "Upload complete. " (count (remove nil? entities)) " images added"))

                               ;; Clear status after 3 seconds
                               (js/setTimeout #(reset! *upload-status "") 3000)

                               (when-let [first-asset (first (remove nil? entities))]
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
                                                 :data image-data}))))))))

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
                       ;; Increment depth counter - activate on first enter
                       (swap! *drag-depth inc)
                       (when (= @*drag-depth 1)
                         (reset! *drag-active? true)))
      :on-drag-over (fn [e]
                      ;; CRITICAL: Must preventDefault to allow drop
                      (.preventDefault e)
                      (.stopPropagation e))
      :on-drag-leave (fn [e]
                       (.preventDefault e)
                       (.stopPropagation e)
                       ;; Decrement depth counter - deactivate when leaving completely
                       (swap! *drag-depth dec)
                       (when (<= @*drag-depth 0)
                         (reset! *drag-depth 0)
                         (reset! *drag-active? false)))
      :on-drop (fn [e]
                 (.preventDefault e)
                 (.stopPropagation e)
                 ;; Reset state immediately
                 (reset! *drag-depth 0)
                 (reset! *drag-active? false)
                 (let [files (array-seq (.. e -dataTransfer -files))]
                   (handle-upload files)))}

     ;; ARIA live region for status announcements
     [:div.sr-only
      {:role "status"
       :aria-live "polite"
       :aria-atomic "true"}
      (rum/react *upload-status)]

     ;; Drag overlay hint - shown when dragging files
     (when @*drag-active?
       [:div.drag-overlay-hint
        (shui/tabler-icon "photo-up" {:size 40})
        [:span "Drop images to upload"]])

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
           recently-used-count (count recently-used-row)]
       [:div.bd.bd-scroll
        ;; "Recently used" section - shows current + recently used in one row (only when not searching)
        (when (and (seq recently-used-row) (string/blank? search-q))
          [:div.pane-section
           (section-header {:title "Recently used"
                            :count recently-used-count
                            :expanded? true})
           [:div.asset-picker-grid.recently-used-row
            {:class (when avatar-mode? "avatar-mode")}
            (for [asset recently-used-row]
              (rum/with-key
                (image-asset-item asset {:on-chosen on-chosen
                                         :avatar-context avatar-context
                                         :selected? (= (str (:block/uuid asset)) current-asset-uuid)})
                (str "recent-" (:block/uuid asset))))]])

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
                          :expanded? true})

         ;; Asset grid
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
            [:div.flex.flex-col.items-center.justify-center.h-32.text-gray-08
             (shui/tabler-icon "photo-off" {:size 32})
             [:span.text-sm.mt-2 "No image assets found"]
             [:span.text-xs.mt-1 "Upload an image to get started"]])]]])

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
   Used by empty-image-icon-cp and get-node-icon-cp for clickable placeholders/error states."
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
        section-states (rum/react *section-states)]
    [:div.all-pane.pb-2
     ;; Recently used - collapsible
     (when (seq used-items)
       (pane-section "Recently used" used-items
                     (assoc opts
                            :collapsible? true
                            :keyboard-hint "alt mod 1"
                            :expanded? (get section-states "Recently used" true))))

     ;; Emojis - collapsible
     (pane-section "Emojis"
                   emoji-items
                   (assoc opts
                          :collapsible? true
                          :keyboard-hint "alt mod 2"
                          :total-count (count emojis)
                          :expanded? (get section-states "Emojis" true)))

     ;; Icons - collapsible
     (pane-section "Icons"
                   icon-items
                   (assoc opts
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

(rum/defc keyboard-shortcut-observer
  [tab input-focused?]
  (hooks/use-effect!
   (fn []
     ;; Register shortcuts whenever on "All" tab (works for both normal view and search results)
     (when (= tab :all)
       (let [handler (fn [^js e]
                       ;; Don't trigger shortcuts when input is focused or target is an input
                       (when (and (.-metaKey e)
                                  (.-altKey e)
                                  (not @input-focused?)
                                  (not= "INPUT" (.-tagName (.-target e))))
                         (case (.-keyCode e)
                           49 (do ; Option+Command+1 -> Toggle "Recently used"
                                (swap! *section-states update "Recently used" (fn [v] (if (nil? v) false (not v))))
                                (util/stop e))
                           50 (do ; Option+Command+2 -> Toggle "Emojis"
                                (swap! *section-states update "Emojis" (fn [v] (if (nil? v) false (not v))))
                                (util/stop e))
                           51 (do ; Option+Command+3 -> Toggle "Icons"
                                (swap! *section-states update "Icons" (fn [v] (if (nil? v) false (not v))))
                                (util/stop e))
                           nil)))]
         (.addEventListener js/document "keydown" handler false)
         #(.removeEventListener js/document "keydown" handler false))))
   [tab])
  nil)

(rum/defc select-observer
  [*input-ref]
  (let [*el-ref (rum/use-ref nil)
        *items-ref (rum/use-ref [])
        *current-ref (rum/use-ref [-1])
        set-current! (fn [idx node] (set! (. *current-ref -current) [idx node]))
        get-cnt #(some-> (rum/deref *el-ref) (.closest ".cp__emoji-icon-picker"))
        focus! (fn [idx dir]
                 (let [items (rum/deref *items-ref)
                       ^js popup (some-> (get-cnt) (.-parentNode))
                       idx (loop [n idx]
                             (if (false? (nth items n nil))
                               (recur (+ n (if (= dir :prev) -1 1))) n))]
                   (if-let [node (nth items idx nil)]
                     (do (.focus node #js {:preventScroll true :focusVisible true})
                         (.scrollIntoView node #js {:block "center"})
                         (when popup (set! (. popup -scrollTop) 0))
                         (set-current! idx node))
                     (do (.focus (rum/deref *input-ref)) (set-current! -1 nil)))))
        down-handler!
        (hooks/use-callback
         (fn [^js e]
           (let []
             (if (= 13 (.-keyCode e))
                ;; enter
               (some-> (second (rum/deref *current-ref)) (.click))
               (let [[idx _node] (rum/deref *current-ref)]
                 (case (.-keyCode e)
                    ;;left
                   37 (focus! (dec idx) :prev)
                    ;; tab & right
                   (9 39) (focus! (inc idx) :next)
                    ;; up
                   38 (do (focus! (- idx 9) :prev) (util/stop e))
                    ;; down
                   40 (do (focus! (+ idx 9) :next) (util/stop e))
                   :dune))))) [])]

    (hooks/use-effect!
     (fn []
        ;; calculate items
       (let [^js sections (.querySelectorAll (get-cnt) ".pane-section")
             items (map #(some-> (.querySelectorAll % ".its > button") (js/Array.from) (js->clj)) sections)
             step 9
             items (map #(let [count (count %)
                               m (mod count step)]
                           (if (> m 0) (concat % (repeat (- step m) false)) %)) items)]
         (set! (. *items-ref -current) (flatten items))
         (focus! 0 :next))

        ;; handlers
       (let [^js cnt (get-cnt)]
         (.addEventListener cnt "keydown" down-handler! false)
         #(.removeEventListener cnt "keydown" down-handler!)))
     [])
    [:span.absolute.hidden {:ref *el-ref}]))

(rum/defc color-picker
  [*color on-select!]
  (let [[color, set-color!] (rum/use-state @*color)
        *el (rum/use-ref nil)
        content-fn (fn []
                     ;; Use Radix color variables for consistency with design system
                     (let [colors [(colors/variable :gray :09)
                                   (colors/variable :indigo :09)
                                   (colors/variable :cyan :09)
                                   (colors/variable :green :09)
                                   (colors/variable :orange :09)
                                   (colors/variable :tomato :09)
                                   (colors/variable :pink :09)
                                   (colors/variable :red :09)
                                   nil]]
                       [:div.color-picker-presets
                        (for [c colors]
                          (shui/button
                           {:on-click (fn [] (set-color! c)
                                        (some-> on-select! (apply [c]))
                                        (shui/popup-hide!))
                            :size :sm :variant :outline
                            :class "it" :style {:background-color c}}
                           (if c "" (shui/tabler-icon "minus" {:class "scale-75 opacity-70"}))))]))]
    (hooks/use-effect!
     (fn []
       (when-let [^js picker (some-> (rum/deref *el) (.closest ".cp__emoji-icon-picker"))]
         (let [color (if (string/blank? color) "inherit" color)]
           (.setProperty (.-style picker) "--ls-color-icon-preset" color)
           (storage/set :ls-icon-color-preset color)))
       (reset! *color color))
     [color])

    (shui/button {:size :sm
                  :ref *el
                  :class "color-picker"
                  :on-click (fn [^js e] (shui/popup-show! (.-target e) content-fn {:content-props {:side "bottom" :side-offset 6}}))
                  :variant :outline}
                 [:strong {:style {:color (or color "inherit")}}
                  (shui/tabler-icon "palette")])))

(rum/defcs ^:large-vars/cleanup-todo icon-search < rum/reactive
  (rum/local "" ::q)
  (rum/local nil ::result)
  (rum/local false ::select-mode?)
  (rum/local :all ::tab)
  (rum/local false ::input-focused?)
  (rum/local :icon-picker ::view) ;; Default view, updated in :will-mount for avatars/images
  {:will-mount (fn [s]
                 (let [opts (first (:rum/args s))
                       icon-value (:icon-value opts)
                       normalized (normalize-icon icon-value)
                       *view (::view s)]
                   ;; Avatar and image icons open asset picker directly for image selection
                   (when (contains? #{:avatar :image} (:type normalized))
                     (reset! *view :asset-picker))
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
        result @*result
        normalized-icon-value (normalize-icon icon-value)
        opts (assoc opts
                    :input-focused? @*input-focused?
                    :on-chosen (fn [e m]
                                 (let [icon-item (normalize-icon m)
                                       can-have-color? (contains? #{:icon :avatar :text} (:type icon-item))
                                       ;; Update color if user selected one from picker
                                       m' (if (and can-have-color? (not (string/blank? @*color)))
                                            (cond-> m
                                              ;; For icons and text: set color
                                              (or (= :icon (:type icon-item))
                                                  (= :text (:type icon-item)))
                                              (assoc-in [:data :color] @*color)

                                              ;; For avatars: set both color (text) and backgroundColor
                                              (= :avatar (:type icon-item))
                                              (-> (assoc-in [:data :color] @*color)
                                                  (assoc-in [:data :backgroundColor] @*color)))
                                            m)]
                                   (and on-chosen (on-chosen e m'))
                                   (when (:type icon-item) (add-used-item! icon-item)))))
        *select-mode? (::select-mode? state)
        reset-q! #(when-let [^js input (rum/deref *input-ref)]
                    (reset! *q "")
                    (reset! *result {})
                    (reset! *select-mode? false)
                    (set! (. input -value) "")
                    (util/schedule
                     (fn []
                       (when (not= js/document.activeElement input)
                         (.focus input))
                       (util/scroll-to (rum/deref *result-ref) 0 false))))]
    (if (= @*view :asset-picker)
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
      ;; Level 1: Icon Picker view
      [:div.cp__emoji-icon-picker
       {:data-keep-selection true}

       ;; Topbar: tabs + separator + search
       [:div.icon-picker-topbar
        [:div.tabs-section
         (tab-observer @*tab {:q @*q :*result *result})
         (keyboard-shortcut-observer @*tab *input-focused?)
         (when @*select-mode?
           (select-observer *input-ref))
         (let [tabs [[:all "All"] [:emoji "Emojis"] [:icon "Icons"] [:custom "Custom"]]]
           (for [[id label] tabs
                 :let [active? (= @*tab id)]]
             [:button.tab-item
              {:key (name id)
               :data-text label
               :data-active (when active? "true")
               :on-mouse-down (fn [e]
                                (util/stop e)
                                (reset! *tab id))}
              label]))
         [:div.tab-actions
          ;; color picker (always visible)
          (color-picker *color (fn [c]
                                 (cond
                                   (or (= :icon (:type normalized-icon-value))
                                       (= :text (:type normalized-icon-value)))
                                   (on-chosen nil (assoc-in normalized-icon-value [:data :color] c) true)

                                   (= :avatar (:type normalized-icon-value))
                                   (on-chosen nil (-> normalized-icon-value
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
             :on-focus #(do (reset! *select-mode? false)
                            (reset! *input-focused? true))
             :on-blur #(reset! *input-focused? false)
             :on-key-down (fn [^js e]
                            (case (.-keyCode e)
                              ;; esc
                              27 (do (util/stop e)
                                     (if (string/blank? @*q)
                                       (shui/popup-hide!)
                                       (reset-q!)))
                              38 (do (util/stop e))
                              (9 40) (do
                                       (reset! *select-mode? true)
                                       (util/stop e))
                              :dune))
             :on-change (debounce
                         (fn [e]
                           (reset! *q (util/evalue e))
                           (reset! *select-mode? false)
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
             (let [section-states (rum/react *section-states)]
               [:div.flex.flex-1.flex-col.search-result
                ;; Emojis section
                (when (seq (:emojis result))
                  (pane-section
                   "Emojis"
                   (:emojis result)
                   (assoc opts
                          :collapsible? true
                          :keyboard-hint "alt mod 2"
                          :total-count (count (:emojis result))
                          :virtual-list? false
                          :expanded? (get section-states "Emojis" true))))

                ;; Icons section
                (when (seq (:icons result))
                  (pane-section
                   "Icons"
                   (:icons result)
                   (assoc opts
                          :collapsible? true
                          :keyboard-hint "alt mod 3"
                          :total-count (count (:icons result))
                          :virtual-list? false
                          :expanded? (get section-states "Icons" true))))])
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
