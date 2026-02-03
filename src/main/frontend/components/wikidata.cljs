(ns frontend.components.wikidata
  "Wikidata API client for semantic entity import.
   Enables searching Wikidata for entities and importing them as Logseq pages
   with appropriate class tags, icons, and properties."
  (:require [clojure.string :as string]
            [goog.object :as gobj]
            [promesa.core :as p]
            [frontend.state :as state]
            [frontend.config :as config]
            [frontend.db :as db]
            [logseq.db :as ldb]))

;; =============================================================================
;; Constants & Configuration
;; =============================================================================

(def wikidata-api-url "https://www.wikidata.org/w/api.php")
(def commons-api-url "https://commons.wikimedia.org/w/api.php")

(def wikidata-search-debounce-ms
  "Debounce delay for Wikidata search to avoid API spam"
  400)

(def wikidata-fetch-delay-ms
  "Delay between Wikidata entity fetch requests"
  200)

(def wikidata-search-limit
  "Maximum number of search results to fetch"
  10)

(def wikidata-request-timeout-ms
  "Timeout for Wikidata API requests"
  5000)

;; =============================================================================
;; Entity Type Mapping
;; =============================================================================

(def wikidata-type->class
  "Maps Wikidata Q-IDs (instance-of values) to Logseq class definitions.
   Each value is {:ident :db/ident, :title \"Display Name\"}"
  {;; Creative works
   "Q571"     {:ident :user.class/book       :title "Book"}
   "Q7725634" {:ident :user.class/book       :title "Book"}           ; literary work
   "Q11424"   {:ident :user.class/film       :title "Film"}
   "Q482994"  {:ident :user.class/album      :title "Album"}
   "Q134556"  {:ident :user.class/song       :title "Song"}
   "Q5398426" {:ident :user.class/tv-series  :title "TV Series"}
   "Q7889"    {:ident :user.class/video-game :title "Video Game"}
   ;; Organizations
   "Q4830453" {:ident :user.class/company    :title "Company"}
   "Q6881511" {:ident :user.class/enterprise :title "Enterprise"}
   "Q7275"    {:ident :user.class/state      :title "State"}
   "Q515"     {:ident :user.class/city       :title "City"}
   ;; People
   "Q5"       {:ident :user.class/person     :title "Person"}
   ;; Software
   "Q7397"    {:ident :user.class/software   :title "Software"}
   "Q35127"   {:ident :user.class/website    :title "Website"}
   ;; Other
   "Q15416"   {:ident :user.class/tv-channel :title "TV Channel"}
   "Q41298"   {:ident :user.class/magazine   :title "Magazine"}
   "Q5633421" {:ident :user.class/newspaper  :title "Newspaper"}})

(def class->image-property
  "Maps Logseq class idents to the preferred Wikidata image property.
   P154 = logo, P18 = image (portrait/cover/poster), P41 = flag"
  {:user.class/company    "P154"  ; logo
   :user.class/enterprise "P154"  ; logo
   :user.class/software   "P154"  ; logo
   :user.class/website    "P154"  ; logo
   :user.class/tv-channel "P154"  ; logo
   :user.class/newspaper  "P154"  ; logo
   :user.class/person     "P18"   ; portrait
   :user.class/book       "P18"   ; cover
   :user.class/film       "P18"   ; poster
   :user.class/album      "P18"   ; cover
   :user.class/tv-series  "P18"   ; poster
   :user.class/video-game "P18"   ; cover art
   :user.class/magazine   "P18"   ; cover
   :user.class/song       "P18"   ; cover
   :user.class/city       nil     ; no image fetch for cities
   :user.class/state      "P41"}) ; flag

(def class->default-icon
  "Maps class titles to their default icon configuration.
   Used when auto-creating classes and for preview rendering in search results.
   nil = no default icon (use system default)"
  {"Person"     {:type :avatar}
   "Company"    {:type :image}
   "Enterprise" {:type :image}
   "Software"   {:type :image}
   "Website"    {:type :image}
   "TV Channel" {:type :image}
   "Newspaper"  {:type :image}
   "Book"       {:type :image}
   "Film"       {:type :image}
   "Album"      {:type :image}
   "TV Series"  {:type :image}
   "Video Game" {:type :image}
   "Magazine"   {:type :image}
   "Song"       nil  ; no default icon
   "City"       {:type :tabler-icon :id "map-pin"}
   "State"      {:type :image}})

(def default-image-property
  "Default image property to try when class has no specific mapping"
  "P154")

(def fallback-image-property
  "Fallback image property when primary fails"
  "P18")

;; =============================================================================
;; Property Mapping (Wikidata -> Logseq)
;; =============================================================================

(def wikidata-property->logseq
  "Maps Wikidata property IDs to Logseq property definitions"
  {"P50"  {:ident :user.property/author       :title "Author"       :type :node}
   "P577" {:ident :user.property/published    :title "Published"    :type :datetime}
   "P123" {:ident :user.property/publisher    :title "Publisher"    :type :node}
   "P136" {:ident :user.property/genre        :title "Genre"        :type :default}
   "P112" {:ident :user.property/founder      :title "Founder"      :type :node}
   "P571" {:ident :user.property/founded      :title "Founded"      :type :datetime}
   "P159" {:ident :user.property/headquarters :title "Headquarters" :type :node}
   "P856" {:ident :user.property/website      :title "Website"      :type :url}
   "P17"  {:ident :user.property/country      :title "Country"      :type :node}
   "P495" {:ident :user.property/origin       :title "Country of Origin" :type :node}
   "P364" {:ident :user.property/language     :title "Language"     :type :node}
   "P57"  {:ident :user.property/director     :title "Director"     :type :node}
   "P58"  {:ident :user.property/screenwriter :title "Screenwriter" :type :node}
   "P162" {:ident :user.property/producer     :title "Producer"     :type :node}
   "P175" {:ident :user.property/performer    :title "Performer"    :type :node}})

;; =============================================================================
;; Preview Icon Type Resolution
;; =============================================================================

(defn get-class-default-icon
  "Get the default icon for an existing class by title.
   Returns nil if class doesn't exist or has no default-icon set."
  [class-title]
  (when-let [class-entity (db/get-case-page class-title)]
    (when (ldb/class? class-entity)
      (:logseq.property.class/default-icon class-entity))))

(defn get-preview-icon-type
  "Get the icon type for a Wikidata entity preview in search results.
   Strategy:
   1. Check if class already exists with custom default-icon → use that
   2. Fall back to hardcoded mapping
   Returns icon spec like {:type :avatar} or {:type :image} or nil"
  [class-title]
  (or (get-class-default-icon class-title)
      (get class->default-icon class-title)))

(defn should-fetch-preview-image?
  "Determine if we should fetch an image for this class during search preview.
   Returns true for :avatar and :image types, false for :tabler-icon or nil."
  [icon-spec]
  (when icon-spec
    (contains? #{:avatar :image} (:type icon-spec))))

(defn derive-avatar-initials
  "Derive initials from a label for avatar display.
   'Donald Trump' → 'DT', 'Google' → 'GO'"
  [label]
  (when (and label (not (string/blank? label)))
    (let [words (string/split (string/trim label) #"\s+")]
      (if (> (count words) 1)
        ;; Multi-word: first letter of first two words
        (string/upper-case
         (str (subs (first words) 0 1)
              (subs (second words) 0 1)))
        ;; Single word: first two characters
        (string/upper-case
         (subs (first words) 0 (min 2 (count (first words)))))))))

;; =============================================================================
;; Rate Limiting Queue
;; =============================================================================

(defonce ^:private *wikidata-fetch-queue (atom #queue []))
(defonce ^:private *wikidata-fetch-processing? (atom false))

(defn- process-wikidata-fetch-queue!
  "Process queued Wikidata fetches with delays between each request."
  []
  (when-not @*wikidata-fetch-processing?
    (reset! *wikidata-fetch-processing? true)
    (letfn [(process-next []
              (if-let [fetch-fn (peek @*wikidata-fetch-queue)]
                (do
                  (swap! *wikidata-fetch-queue pop)
                  (-> (fetch-fn)
                      (p/finally
                        #(js/setTimeout process-next wikidata-fetch-delay-ms))))
                (reset! *wikidata-fetch-processing? false)))]
      (process-next))))

(defn enqueue-wikidata-fetch!
  "Add a fetch function to the rate-limited queue"
  [fetch-fn]
  (swap! *wikidata-fetch-queue conj fetch-fn)
  (process-wikidata-fetch-queue!))

;; =============================================================================
;; HTTP Utilities
;; =============================================================================

(defn- <fetch-json
  "Fetch JSON from URL with CORS and timeout handling.
   Returns promise with parsed JSON or nil on error."
  [url]
  (p/create
   (fn [resolve _reject]
     (let [timeout-id (js/setTimeout
                       #(resolve nil)
                       wikidata-request-timeout-ms)]
       (-> (js/fetch url #js {:method "GET"
                              :mode "cors"
                              :credentials "omit"})
           (.then (fn [^js response]
                    (js/clearTimeout timeout-id)
                    (if (.-ok response)
                      (.json response)
                      (resolve nil))))
           (.then (fn [data]
                    (when data
                      (resolve (js->clj data :keywordize-keys false)))))
           (.catch (fn [_err]
                     (js/clearTimeout timeout-id)
                     (resolve nil))))))))

(defn- build-url
  "Build URL with query parameters"
  [base-url params]
  (str base-url "?"
       (string/join "&"
                    (map (fn [[k v]]
                           (str (name k) "=" (js/encodeURIComponent (str v))))
                         params))))

;; =============================================================================
;; Wikidata Search API
;; =============================================================================

(defn <search-wikidata-entities
  "Search Wikidata for entities matching query.
   Returns promise with vector of entity results:
   [{:qid \"Q95\" :label \"Google\" :description \"American company\" :url \"...\"}]"
  ([query] (<search-wikidata-entities query "en"))
  ([query language]
   (when-not (string/blank? query)
     (let [url (build-url wikidata-api-url
                          {:action "wbsearchentities"
                           :search query
                           :language language
                           :uselang language
                           :type "item"
                           :limit wikidata-search-limit
                           :format "json"
                           :origin "*"})]
       (p/let [data (<fetch-json url)]
         (when data
           (->> (get data "search" [])
                (mapv (fn [item]
                        {:qid (get item "id")
                         :label (get item "label")
                         :description (get item "description")
                         :url (get item "concepturi")
                         :match-type (get-in item ["match" "type"])})))))))))

(defn <search-multilingual
  "Search Wikidata in user's language and English, deduplicate by Q-ID.
   Prefers user's language labels when available."
  [query]
  (let [user-lang (or (state/sub :preferred-language) "en")
        search-en? (not= user-lang "en")]
    (p/let [;; Search in user's language
            user-results (<search-wikidata-entities query user-lang)
            ;; Optionally search in English too
            en-results (if search-en?
                         (<search-wikidata-entities query "en")
                         [])
            ;; Merge: user language first, then English (deduplicated)
            seen-qids (set (map :qid user-results))
            additional-en (remove #(contains? seen-qids (:qid %)) en-results)]
      (vec (concat user-results additional-en)))))

;; =============================================================================
;; Wikidata Entity Fetch API
;; =============================================================================

(defn <fetch-wikidata-entity
  "Fetch full entity data from Wikidata by Q-ID.
   Returns promise with entity data including claims, labels, descriptions."
  ([qid] (<fetch-wikidata-entity qid "en"))
  ([qid language]
   (when qid
     (let [url (build-url wikidata-api-url
                          {:action "wbgetentities"
                           :ids qid
                           :languages (str language "|en")
                           :props "claims|labels|descriptions"
                           :format "json"
                           :origin "*"})]
       (p/let [data (<fetch-json url)]
         (when data
           (get-in data ["entities" qid])))))))

;; =============================================================================
;; Entity Type Resolution
;; =============================================================================

(defn- parse-p31-values
  "Extract P31 (instance-of) Q-IDs from entity claims"
  [entity-data]
  (let [p31-claims (get-in entity-data ["claims" "P31"] [])]
    (->> p31-claims
         (map (fn [claim]
                {:qid (get-in claim ["mainsnak" "datavalue" "value" "id"])
                 :rank (get claim "rank" "normal")}))
         (filter :qid))))

(defn select-best-type
  "Select the best Logseq class for entity based on P31 values.
   Strategy: filter to mapped types, prefer 'preferred' rank, then 'normal'."
  [p31-values]
  (let [;; Filter to types we have mapped
        mapped-items (->> p31-values
                          (filter #(contains? wikidata-type->class (:qid %))))
        ;; Group by rank
        by-rank (group-by :rank mapped-items)
        ;; Prefer preferred > normal > deprecated
        best (or (first (get by-rank "preferred"))
                 (first (get by-rank "normal"))
                 (first mapped-items))]
    (when best
      (get wikidata-type->class (:qid best)))))

(defn entity->class
  "Determine the Logseq class for a Wikidata entity"
  [entity-data]
  (let [p31-values (parse-p31-values entity-data)]
    (select-best-type p31-values)))

;; =============================================================================
;; Image Resolution
;; =============================================================================

(defn- parse-wikidata-time
  "Parse Wikidata time format '+2015-09-02T00:00:00Z' to js/Date"
  [time-string]
  (when time-string
    (let [iso-string (string/replace time-string #"^\+" "")]
      (try
        (js/Date. iso-string)
        (catch :default _ nil)))))

(defn- get-current-image-claim
  "Select the current image claim from a list, considering temporal qualifiers.
   Returns the claim with no end date or future end date, preferring 'preferred' rank."
  [claims]
  (let [now (js/Date.)
        with-dates (map (fn [claim]
                          (let [end-qual (get-in claim ["qualifiers" "P582" 0 "datavalue" "value" "time"])
                                end-date (parse-wikidata-time end-qual)
                                rank (get claim "rank" "normal")]
                            {:claim claim
                             :rank rank
                             :end-date end-date
                             ;; Current if no end date or end date in future
                             :is-current? (or (nil? end-date) (> (.getTime end-date) (.getTime now)))}))
                        claims)
        current-claims (filter :is-current? with-dates)
        ;; Prefer preferred rank among current
        preferred (filter #(= "preferred" (:rank %)) current-claims)
        best (or (first preferred)
                 (first current-claims)
                 (first with-dates))]
    (:claim best)))

(defn- extract-image-filename
  "Extract image filename from entity's P154 (logo) or P18 (image) claims"
  [entity-data property-id]
  (let [claims (get-in entity-data ["claims" property-id] [])
        best-claim (get-current-image-claim claims)]
    (get-in best-claim ["mainsnak" "datavalue" "value"])))

(defn- svg-url?
  "Check if URL points to an SVG file"
  [url]
  (and (string? url)
       (string/ends-with? (string/lower-case url) ".svg")))

(defn <resolve-commons-image
  "Resolve a Wikimedia Commons filename to an actual image URL.
   Filenames from Wikidata are like 'Google 2015 logo.svg',
   this resolves to the full Commons URL.

   For SVG files, returns the thumbnail URL (rasterized PNG) instead,
   since SVG files can be corrupted when saved as binary assets."
  [filename]
  (when-not (string/blank? filename)
    (let [url (build-url commons-api-url
                         {:action "query"
                          :titles (str "File:" filename)
                          :prop "imageinfo"
                          :iiprop "url|mime"
                          :iiurlwidth 400  ;; Request 400px thumbnail for SVGs
                          :format "json"
                          :origin "*"})]
      (p/let [data (<fetch-json url)]
        (when data
          (let [pages (get-in data ["query" "pages"])
                page (first (vals pages))
                imageinfo (first (get page "imageinfo"))
                original-url (get imageinfo "url")
                thumb-url (get imageinfo "thumburl")
                mime-type (get imageinfo "mime")]
            (when imageinfo
              ;; Use thumbnail for SVGs to avoid corruption when saving
              ;; Thumbnails are always rasterized (PNG)
              (let [use-thumb? (or (svg-url? original-url)
                                   (= mime-type "image/svg+xml"))
                    final-url (if (and use-thumb? thumb-url)
                                thumb-url
                                original-url)]
                (when use-thumb?
                  (js/console.log "[wikidata] Using thumbnail for SVG:" filename
                                  "\n  Original:" original-url
                                  "\n  Thumbnail:" thumb-url))
                {:url final-url
                 :original-url original-url
                 :thumb-url thumb-url
                 :is-svg? (boolean use-thumb?)
                 :filename filename}))))))))

(defn <get-entity-image-url
  "Get image URL for a specific property from entity data.
   Returns just the URL string or nil."
  [entity-data property-id]
  (p/let [filename (extract-image-filename entity-data property-id)
          result (when filename (<resolve-commons-image filename))]
    (:url result)))

(defn <get-entity-image
  "Get the appropriate image URL for an entity based on its class.
   Uses P154 (logo) for companies/software, P18 (image) for people/books/etc."
  [entity-data class-info]
  (let [class-ident (:ident class-info)
        primary-prop (or (get class->image-property class-ident)
                         default-image-property)
        fallback-prop (if (= primary-prop "P154") "P18" "P154")]
    (p/let [;; Try primary property first
            primary-filename (extract-image-filename entity-data primary-prop)
            primary-result (when primary-filename
                             (<resolve-commons-image primary-filename))]
      (if primary-result
        (assoc primary-result :property primary-prop)
        ;; Fall back to alternate property
        (p/let [fallback-filename (extract-image-filename entity-data fallback-prop)
                fallback-result (when fallback-filename
                                  (<resolve-commons-image fallback-filename))]
          (when fallback-result
            (assoc fallback-result :property fallback-prop)))))))

;; =============================================================================
;; Property Value Extraction
;; =============================================================================

(defn- extract-entity-ref-value
  "Extract entity reference (Q-ID and label) from a wikibase-item claim"
  [claim entity-data]
  (let [qid (get-in claim ["mainsnak" "datavalue" "value" "id"])]
    ;; Note: To get the label, we'd need to fetch the referenced entity
    ;; For now, return just the Q-ID; the caller can resolve labels if needed
    {:qid qid}))

(defn- extract-time-value
  "Extract time value from a time-type claim, return as epoch ms"
  [claim]
  (let [time-str (get-in claim ["mainsnak" "datavalue" "value" "time"])
        date (parse-wikidata-time time-str)]
    (when date
      (.getTime date))))

(defn- extract-string-value
  "Extract simple string value from claim"
  [claim]
  (get-in claim ["mainsnak" "datavalue" "value"]))

(defn- extract-quantity-value
  "Extract numeric quantity from claim"
  [claim]
  (let [amount-str (get-in claim ["mainsnak" "datavalue" "value" "amount"])]
    (when amount-str
      (js/parseFloat (string/replace amount-str #"^\+" "")))))

(defn extract-property-value
  "Extract the value from a Wikidata claim based on its datatype"
  [claim]
  (let [datatype (get-in claim ["mainsnak" "datatype"])]
    (case datatype
      "wikibase-item" (extract-entity-ref-value claim nil)
      "time" (extract-time-value claim)
      "quantity" (extract-quantity-value claim)
      "url" (extract-string-value claim)
      "string" (extract-string-value claim)
      "monolingualtext" (get-in claim ["mainsnak" "datavalue" "value" "text"])
      ;; Default: try to get string value
      (extract-string-value claim))))

(defn extract-mapped-properties
  "Extract all properties from entity that have Logseq mappings.
   Returns map of {:property-id {:logseq-info ... :values [...]}}"
  [entity-data]
  (let [claims (get entity-data "claims" {})]
    (->> wikidata-property->logseq
         (map (fn [[prop-id logseq-info]]
                (let [prop-claims (get claims prop-id [])
                      values (->> prop-claims
                                  (map extract-property-value)
                                  (filter some?)
                                  vec)]
                  (when (seq values)
                    [prop-id {:logseq logseq-info
                              :values values}]))))
         (filter some?)
         (into {}))))

;; =============================================================================
;; High-Level API
;; =============================================================================

(defn <search-and-enrich
  "Search for entities and enrich with type information.
   Returns results with class info included."
  [query]
  (p/let [results (<search-multilingual query)]
    (->> results
         (mapv (fn [result]
                 ;; Note: We don't have full entity data at search time,
                 ;; so we can't determine class yet. That happens on selection.
                 (assoc result :source :wikidata))))))

(defn <fetch-full-entity
  "Fetch complete entity data with class, image, and properties resolved.
   This is called when user selects an entity to import."
  [qid]
  (let [user-lang (or (state/sub :preferred-language) "en")]
    (p/let [entity-data (<fetch-wikidata-entity qid user-lang)]
      (when entity-data
        (let [class-info (entity->class entity-data)
              labels (get entity-data "labels" {})
              descriptions (get entity-data "descriptions" {})
              ;; Prefer user's language, fall back to English
              label (or (get-in labels [user-lang "value"])
                        (get-in labels ["en" "value"]))
              description (or (get-in descriptions [user-lang "value"])
                              (get-in descriptions ["en" "value"]))]
          (p/let [image-info (<get-entity-image entity-data class-info)
                  properties (extract-mapped-properties entity-data)]
            {:qid qid
             :label label
             :description description
             :class class-info
             :image image-info
             :properties properties
             :raw-entity entity-data}))))))

;; =============================================================================
;; Class Name Matching Utilities
;; =============================================================================

(defn normalize-class-name
  "Normalize class name for matching (lowercase, singular form)"
  [name]
  (when name
    (let [lower (string/lower-case (string/trim name))]
      ;; Simple singular/plural handling
      (cond
        (string/ends-with? lower "ies")
        (str (subs lower 0 (- (count lower) 3)) "y")

        (and (string/ends-with? lower "s")
             (not (string/ends-with? lower "ss")))
        (subs lower 0 (dec (count lower)))

        :else lower))))

(defn class-names-match?
  "Check if two class names match (case-insensitive, singular/plural tolerant)"
  [name1 name2]
  (= (normalize-class-name name1)
     (normalize-class-name name2)))

;; =============================================================================
;; Search Result Image Enrichment
;; =============================================================================

(defonce ^:private *image-fetch-cancel-token (atom nil))

(defn cancel-image-fetches!
  "Cancel any pending image fetch operations.
   Call this when search input changes to avoid stale image loads."
  []
  (when-let [token @*image-fetch-cancel-token]
    (reset! token true))
  (reset! *image-fetch-cancel-token (atom false)))

(defn- get-image-property-for-class
  "Get the appropriate Wikidata image property ID for a class title.
   Returns nil if no image should be fetched (e.g., City)."
  [class-title]
  (when class-title
    (let [;; Find the class ident from our mappings
          class-ident (some (fn [[_ {:keys [title ident]}]]
                              (when (class-names-match? title class-title)
                                ident))
                            wikidata-type->class)]
      (if class-ident
        (get class->image-property class-ident default-image-property)
        ;; Fallback for unknown classes
        default-image-property))))

(defn <fetch-search-result-image
  "Fetch the image URL for a single Wikidata search result.
   Returns promise with {:qid qid :image-url url :class-title title} or nil on failure.

   Parameters:
   - qid: Wikidata entity ID (e.g., 'Q22686')
   - cancel-token: Atom that when set to true, causes early return"
  [qid cancel-token]
  (let [user-lang (or (state/sub :preferred-language) "en")]
    (p/let [;; Check cancellation before starting
            _ (when @cancel-token
                (throw (ex-info "Cancelled" {:cancelled true})))
            ;; Fetch entity data
            entity-data (<fetch-wikidata-entity qid user-lang)]
      (when (and entity-data (not @cancel-token))
        (let [;; Determine class from entity
              class-info (entity->class entity-data)
              class-title (:title class-info)
              icon-spec (get-preview-icon-type class-title)]
          (when (should-fetch-preview-image? icon-spec)
            (let [;; Get appropriate image property
                  image-prop (get-image-property-for-class class-title)]
              (when image-prop
                (p/let [;; Check cancellation again
                        _ (when @cancel-token
                            (throw (ex-info "Cancelled" {:cancelled true})))
                        ;; Get the image URL
                        image-url (<get-entity-image-url entity-data image-prop)]
                  (when (and image-url (not @cancel-token))
                    {:qid qid
                     :image-url image-url
                     :class-title class-title
                     :icon-type (:type icon-spec)}))))))))))

(defn <enrich-search-results-with-images
  "Enrich search results with image URLs for preview display.
   Fetches images in background using rate-limited queue.

   Parameters:
   - results: Vector of search result maps (must have :id field with Q-ID)
   - on-result: Callback (fn [qid image-info]) called as each image loads

   Returns a promise that resolves when all fetches complete (or are cancelled).
   Call cancel-image-fetches! when search input changes."
  [results on-result]
  (js/console.log "[wikidata-debug] Starting image enrichment for" (count results) "results")
  ;; Cancel any previous fetch operations
  (cancel-image-fetches!)
  (let [cancel-token (atom false)]
    ;; Store the token so it can be cancelled later
    (reset! *image-fetch-cancel-token cancel-token)
    ;; Process each result through the rate-limited queue
    (p/let [fetch-results
            (p/all
             (for [{:keys [id] :as result} results
                   :when id]
               (-> (<fetch-search-result-image id cancel-token)
                   (p/then (fn [image-info]
                             (when (and image-info (not @cancel-token))
                               (on-result (:qid image-info) image-info))
                             image-info))
                   (p/catch (fn [err]
                              ;; Silently ignore cancellation errors
                              (when-not (and (ex-data err)
                                             (:cancelled (ex-data err)))
                                (js/console.warn "[wikidata] Image fetch failed:" err))
                              nil)))))]
      ;; Return count of successful fetches
      (count (filter some? fetch-results)))))
