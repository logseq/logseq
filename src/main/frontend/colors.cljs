(ns frontend.colors
  "Colors used"
  (:require [clojure.string :as string]
            [frontend.colors.css :as css]
            [frontend.colors.named :as named]
            [frontend.util :as util]))

(def color-list [:tomato :red :crimson :pink :plum :purple :violet :indigo :blue :cyan :teal :green :grass :orange])
;(def color-list [:tomato :red :blue])

(defn variable
  ; ([value])
  ([color value] (variable color value false))
  ([color value alpha?]
   (str "var(--rx-" (name color) "-" (cond-> value keyword? name) (if alpha? "-alpha" "") ")")))

(defn parse-css-color->hex
  "Parse a computed CSS color value (hex / hsl(...) / rgb(...)) into a hex
   string. Returns nil for blank or unparsable input."
  [s]
  (when-let [v (some-> s string/trim not-empty)]
    (cond
      (string/starts-with? v "#") v
      (string/starts-with? v "hsl")
      (let [parts (-> v
                      (string/replace #"hsla?\(" "")
                      (string/replace ")" "")
                      (string/replace "%" "")
                      (string/split #"[, ]+"))]
        (when (>= (count parts) 3)
          (let [[h s l] (map js/parseFloat (take 3 parts))]
            (when (and (number? h) (number? s) (number? l))
              (apply util/hsl2hex [h s l])))))
      (string/starts-with? v "rgb")
      (let [parts (-> v
                      (string/replace #"rgba?\(" "")
                      (string/replace ")" "")
                      (string/split #"[, ]+"))]
        (when (>= (count parts) 3)
          (let [[r g b] (map #(js/parseInt %) (take 3 parts))]
            (when (and (number? r) (number? g) (number? b))
              (str "#"
                   (.padStart (.toString r 16) 2 "0")
                   (.padStart (.toString g 16) 2 "0")
                   (.padStart (.toString b 16) 2 "0"))))))
      :else nil)))

;; Memoize getComputedStyle results per CSS variable name.
;;
;; The bg-var pipeline is on the hot path for every colored icon — page
;; lists, cmdk results, and sidebar entries all call into `read-bg-var`
;; through `avatar-fallback-style` / `icon` (color?) / `get-node-icon-cp`.
;; A graph with many tagged pages can render hundreds of icons per frame,
;; each calling `getComputedStyle` synchronously and forcing the style
;; recalc / layout flush phase.
;;
;; Cached values are stable for a given theme. A MutationObserver on
;; `documentElement` watching `data-theme` + `class` invalidates the cache
;; on theme flips (apply-theme-to-dom! writes both there). Observer
;; callbacks fire at the microtask boundary, before React commits the
;; render scheduled by the same set-state! that triggered the flip, so
;; subscribers always see fresh values on the next paint. `contains?`
;; check lets us cache nil too (var unset / unparsable).
(defonce ^:private *bg-var-cache (atom {}))

(defn- invalidate-bg-var-cache! []
  (reset! *bg-var-cache {}))

(defonce ^:private _bg-var-theme-observer
  (when (and (exists? js/MutationObserver) (exists? js/document))
    (let [obs (js/MutationObserver. (fn [_] (invalidate-bg-var-cache!)))]
      (.observe obs js/document.documentElement
                #js {:attributes true
                     :attributeFilter #js ["data-theme" "class"]})
      obs)))

(defn read-bg-var
  "Read a CSS background variable (e.g. \"--ls-primary-background-color\") and
   return its hex value. Tries body first (where Logseq sets theme vars), falls
   back to documentElement. Returns nil if unset/unparsable.

   Cached per theme; cache invalidates on `documentElement` attribute changes
   (data-theme / class), so theme flips are observed without an explicit
   invalidation call."
  [var-name]
  (let [cache @*bg-var-cache]
    (if (contains? cache var-name)
      (get cache var-name)
      (let [pick (fn [^js el]
                   (some-> el js/getComputedStyle (.getPropertyValue var-name) string/trim not-empty))
            value (some-> (or (pick js/document.body)
                              (pick js/document.documentElement))
                          parse-css-color->hex)]
        (swap! *bg-var-cache assoc var-name value)
        value))))

(defn ->hex
  "Resolve any inline CSS color string to its current-theme hex value:
   - hex strings pass through unchanged
   - `var(--name)` references are looked up via the cascade on body
     (so theme tokens like Radix `--rx-orange-10` resolve to whichever
     light/dark hex is active right now)
   - rgb(...)/hsl(...) literals are parsed
   Returns nil for blank/unresolvable input."
  [css-color]
  (when (string? css-color)
    (let [v (string/trim css-color)]
      (cond
        (string/blank? v) nil
        (string/starts-with? v "#") v
        (string/starts-with? v "var(")
        (some-> (re-find #"var\(\s*(--[\w-]+)" v) second read-bg-var)
        :else (parse-css-color->hex v)))))

(defn get-accent-color
  []
  (when-let [color (some-> js/document.documentElement
                           (js/getComputedStyle)
                           (.getPropertyValue "--lx-accent-09"))]
    (when-not (string/blank? color)
      (if (string/starts-with? color "#")
        color
        (let [hsl-color (some-> color
                                (string/replace "hsl(" "")
                                (string/replace ")" "")
                                (string/split ","))]
          (when-let [hsl-color (and (not (string/blank? (first hsl-color)))
                                    (map js/parseFloat hsl-color))]
            (apply util/hsl2hex hsl-color)))))))

;; ----------------------------------------------------------------------------
;; Color math: hex / RGB / OKLab / OKLCH conversions, WCAG contrast helpers
;; ----------------------------------------------------------------------------

(defn- clamp01 [c]
  (cond (< c 0) 0 (> c 1) 1 :else c))

(defn hex->rgb
  "Parse a hex color string into [r g b] floats in [0..1].
   Accepts \"#RGB\", \"#RRGGBB\", \"RRGGBB\", with surrounding whitespace.
   Returns nil for invalid input."
  [hex]
  (when (string? hex)
    (let [s (-> hex string/trim string/lower-case)
          s (cond-> s (string/starts-with? s "#") (subs 1))]
      (cond
        (and (= 3 (count s)) (re-matches #"[0-9a-f]{3}" s))
        (let [c (fn [i] (let [v (js/parseInt (str (nth s i) (nth s i)) 16)]
                          (/ v 255.0)))]
          [(c 0) (c 1) (c 2)])

        (and (= 6 (count s)) (re-matches #"[0-9a-f]{6}" s))
        (let [c (fn [i] (let [v (js/parseInt (subs s i (+ i 2)) 16)]
                          (/ v 255.0)))]
          [(c 0) (c 2) (c 4)])

        :else nil))))

(defn rgb->hex
  "Convert [r g b] (each in [0..1], values clamped) to lowercase \"#rrggbb\"."
  [[r g b]]
  (let [to-byte (fn [c] (-> c clamp01 (* 255) js/Math.round))
        hh (fn [n] (let [s (.toString n 16)]
                     (if (= 1 (count s)) (str "0" s) s)))]
    (str "#" (hh (to-byte r)) (hh (to-byte g)) (hh (to-byte b)))))

(defn srgb->linear
  "sRGB gamma decode (IEC 61966-2-1) for a single channel in [0..1]."
  [c]
  (if (<= c 0.04045)
    (/ c 12.92)
    (js/Math.pow (/ (+ c 0.055) 1.055) 2.4)))

(defn linear->srgb
  "sRGB gamma encode (IEC 61966-2-1) for a single channel in [0..1]."
  [c]
  (if (<= c 0.0031308)
    (* c 12.92)
    (- (* 1.055 (js/Math.pow c (/ 1 2.4))) 0.055)))

(defn rgb->oklab
  "Björn Ottosson's sRGB → OKLab conversion. Input [r g b] in [0..1]."
  [[r g b]]
  (let [rl (srgb->linear r) gl (srgb->linear g) bl (srgb->linear b)
        l (+ (* 0.4122214708 rl) (* 0.5363325363 gl) (* 0.0514459929 bl))
        m (+ (* 0.2119034982 rl) (* 0.6806995451 gl) (* 0.1073969566 bl))
        s (+ (* 0.0883024619 rl) (* 0.2817188376 gl) (* 0.6299787005 bl))
        l' (js/Math.cbrt l) m' (js/Math.cbrt m) s' (js/Math.cbrt s)]
    [(+ (* 0.2104542553 l') (* 0.7936177850 m') (* -0.0040720468 s'))
     (+ (* 1.9779984951 l') (* -2.4285922050 m') (* 0.4505937099 s'))
     (+ (* 0.0259040371 l') (* 0.7827717662 m') (* -0.8086757660 s'))]))

(defn oklab->rgb
  "Björn Ottosson's OKLab → sRGB conversion. Output [r g b] (may be outside [0..1]
   if the OKLab point lies outside the sRGB gamut)."
  [[L a b]]
  (let [l' (+ L (* 0.3963377774 a) (* 0.2158037573 b))
        m' (+ L (* -0.1055613458 a) (* -0.0638541728 b))
        s' (+ L (* -0.0894841775 a) (* -1.2914855480 b))
        l (* l' l' l') m (* m' m' m') s (* s' s' s')
        rl (+ (* 4.0767416621 l) (* -3.3077115913 m) (* 0.2309699292 s))
        gl (+ (* -1.2684380046 l) (* 2.6097574011 m) (* -0.3413193965 s))
        bl (+ (* -0.0041960863 l) (* -0.7034186147 m) (* 1.7076147010 s))]
    [(linear->srgb rl) (linear->srgb gl) (linear->srgb bl)]))

(defn oklab->oklch
  "OKLab → OKLCh. Returns [L C h] with C >= 0 and h in [0..360)."
  [[L a b]]
  (let [C (js/Math.sqrt (+ (* a a) (* b b)))
        h-rad (js/Math.atan2 b a)
        h-deg (* h-rad (/ 180 js/Math.PI))
        h (mod (+ h-deg 360) 360)]
    [L C h]))

(defn oklch->oklab
  "OKLCh → OKLab."
  [[L C h]]
  (let [h-rad (* h (/ js/Math.PI 180))]
    [L (* C (js/Math.cos h-rad)) (* C (js/Math.sin h-rad))]))

(defn relative-luminance
  "WCAG 2.1 relative luminance for an [r g b] triple in [0..1]."
  [[r g b]]
  (+ (* 0.2126 (srgb->linear r))
     (* 0.7152 (srgb->linear g))
     (* 0.0722 (srgb->linear b))))

(defn contrast-ratio
  "WCAG 2.1 contrast ratio between two sRGB colors. Always >= 1."
  [rgb-a rgb-b]
  (let [la (relative-luminance rgb-a)
        lb (relative-luminance rgb-b)
        l1 (max la lb) l2 (min la lb)]
    (/ (+ l1 0.05) (+ l2 0.05))))

(defn- in-srgb?
  "True if every channel of [r g b] sits within [0..1] (small epsilon)."
  [[r g b]]
  (let [eps 1e-6]
    (and (>= r (- 0 eps)) (<= r (+ 1 eps))
         (>= g (- 0 eps)) (<= g (+ 1 eps))
         (>= b (- 0 eps)) (<= b (+ 1 eps)))))

(defn clip-chroma-to-srgb
  "Bisect chroma C until oklch->rgb falls within sRGB gamut. Preserves L and h.
   Max 12 iterations."
  [[L C h]]
  (loop [c C i 0]
    (let [rgb (oklab->rgb (oklch->oklab [L c h]))]
      (cond
        (in-srgb? rgb) [L c h]
        (>= i 12) [L 0 h]
        :else (recur (/ c 2) (inc i))))))

(defn- oklch->hex [[L C h]]
  (let [[L' C' h'] (clip-chroma-to-srgb [L C h])
        rgb (oklab->rgb (oklch->oklab [L' C' h']))
        clamped (mapv clamp01 rgb)]
    (rgb->hex clamped)))

(defn- adjust-for-contrast*
  [picked-hex surface-hex target-ratio]
  (let [picked-rgb (hex->rgb picked-hex)
        surface-rgb (hex->rgb surface-hex)]
    (if (or (nil? picked-rgb) (nil? surface-rgb))
      picked-hex
      (let [current (contrast-ratio picked-rgb surface-rgb)]
        (if (>= current target-ratio)
          picked-hex
          (let [[L C h] (oklab->oklch (rgb->oklab picked-rgb))
                surface-dark? (< (relative-luminance surface-rgb) 0.5)
                ;; lighten if surface dark, darken if light
                ;; bisect L between current and the opposite extreme
                target-L (if surface-dark? 1.0 0.0)]
            (loop [lo (min L target-L)
                   hi (max L target-L)
                   best-L L
                   best-hex picked-hex
                   i 0]
              (if (>= i 12)
                best-hex
                (let [mid (/ (+ lo hi) 2)
                      candidate-hex (oklch->hex [mid C h])
                      candidate-rgb (hex->rgb candidate-hex)
                      ratio (if candidate-rgb
                              (contrast-ratio candidate-rgb surface-rgb)
                              1.0)]
                  (cond
                    (>= ratio target-ratio)
                    ;; meets target — try to pull L back toward original to keep saturation
                    (let [[new-lo new-hi]
                          (if surface-dark?
                            [lo mid] ; can move darker
                            [mid hi])] ; can move lighter
                      (recur new-lo new-hi mid candidate-hex (inc i)))

                    ;; not enough contrast — push further toward target-L
                    surface-dark?
                    (recur mid hi best-L best-hex (inc i))
                    :else
                    (recur lo mid best-L best-hex (inc i))))))))))))

(defn- bounded-memoize
  "Wrap f with a memo cache capped at `max-entries`. When the cap is
   exceeded, drops half the entries in arbitrary order. The hot set
   for our callers (adjust-for-contrast, muted-tint) stays well under
   the cap so eviction is rare; LRU bookkeeping on every hit would
   cost more than the occasional recompute it'd save."
  [f max-entries]
  (let [cache (atom {})]
    (fn [& args]
      (let [k args
            c @cache]
        (if-let [hit (find c k)]
          (val hit)
          (let [v (apply f args)]
            (swap! cache
                   (fn [c']
                     (let [c'' (assoc c' k v)]
                       (if (> (count c'') max-entries)
                         (into {} (take (quot max-entries 2) c''))
                         c''))))
            v))))))

(def ^{:doc "Adjust `picked-hex` toward sufficient WCAG contrast against `surface-hex`.

  - Returns picked-hex unchanged if either input is invalid or contrast
    already meets `target-ratio`.
  - Otherwise bisects OKLCh L (preserving hue and chroma; chroma re-clipped
    to sRGB on every step) toward the surface's opposite end until the ratio
    is met or we exhaust 12 iterations.
  - Falls back to white/black at the appropriate extreme if convergence fails.

  Memoized via a 256-entry LRU cache keyed on [picked surface target]."}
  adjust-for-contrast
  (bounded-memoize adjust-for-contrast* 256))

;; Chroma envelope for muted tints. Picked hue is preserved; chroma is
;; clamped low so the tint reads as "atmospheric hint of hue" rather than
;; a saturated chip. Floor keeps near-grayscale picks from collapsing to
;; pure gray (so a black/white pick still tints the badge differently
;; than an unset one).
(def ^:private muted-tint-max-chroma 0.05)
(def ^:private muted-tint-min-chroma 0.02)

(defn- muted-tint*
  [picked-hex surface-hex target-vs-surface]
  (let [picked-rgb (hex->rgb picked-hex)
        surface-rgb (hex->rgb surface-hex)]
    (if (or (nil? picked-rgb) (nil? surface-rgb))
      picked-hex
      (let [[_ pC pH] (oklab->oklch (rgb->oklab picked-rgb))
            ;; Near-grayscale picks (white, black, neutrals) carry no
            ;; meaningful hue — atan2(0,0) returns 0 (red-ish), which
            ;; would otherwise paint every gray pick the same warm tint.
            ;; Skip the chroma floor in that case so the bg stays
            ;; neutral. Threshold is generous; anything visibly chromatic
            ;; sits well above 0.01.
            achromatic? (< pC 0.01)
            chroma (if achromatic?
                     0.0
                     (-> pC
                         (min muted-tint-max-chroma)
                         (max muted-tint-min-chroma)))
            surface-dark? (< (relative-luminance surface-rgb) 0.5)
            target-L (if surface-dark? 1.0 0.0)
            [surface-L _ _] (oklab->oklch (rgb->oklab surface-rgb))]
        (loop [lo (min surface-L target-L)
               hi (max surface-L target-L)
               best-hex picked-hex
               i 0]
          (if (>= i 12)
            best-hex
            (let [mid (/ (+ lo hi) 2)
                  candidate-hex (oklch->hex [mid chroma pH])
                  candidate-rgb (hex->rgb candidate-hex)
                  ratio (if candidate-rgb
                          (contrast-ratio candidate-rgb surface-rgb)
                          1.0)]
              (cond
                (>= ratio target-vs-surface)
                ;; meets target — pull L back toward surface so the tint
                ;; stays as subtle as it can while still being visible
                (let [[new-lo new-hi]
                      (if surface-dark?
                        [lo mid]
                        [mid hi])]
                  (recur new-lo new-hi candidate-hex (inc i)))

                surface-dark?
                (recur mid hi best-hex (inc i))
                :else
                (recur lo mid best-hex (inc i))))))))))

(def ^{:doc "Mute `picked-hex` into a subtle, hue-preserving tint that sits
  just above `surface-hex` in contrast. Hue is taken from picked, chroma
  is clamped low (atmospheric, not saturated), and L is bisected toward
  the surface to land at exactly `target-vs-surface` (default ~1.5:1).

  Use for the bg of a colored badge whose foreground will display the
  picked color itself — the muted bg gives the badge presence without
  competing with the foreground's hue. For text on top, run the picked
  color through `adjust-for-contrast` against the muted bg.

  Memoized via a 256-entry LRU cache keyed on [picked surface target]."}
  muted-tint
  (bounded-memoize muted-tint* 256))

;; Canonical light/dark page surfaces. Used by `adjust-for-both-themes`
;; to derive both rendering hexes regardless of the active theme — so
;; the picker can show users what their pick will look like in BOTH
;; modes, not just the current one. Approximate values; user-customized
;; themes may differ slightly but the WCAG bisection converges anyway.
(def ^:private canonical-light-bg "#ffffff")
(def ^:private canonical-dark-bg "#1a1a1a")

(defn adjust-for-both-themes
  "Compute the contrast-adjusted hex against both canonical light and
   canonical dark page surfaces. Returns
     {:picked \"#hex\" :light \"#hex\" :dark \"#hex\" :differs? bool}
   where `:differs?` is true when at least one adjusted hex differs from
   the picked input. Returns nil for non-hex inputs (CSS-var values are
   theme-aware out-of-band and don't need this preview)."
  [hex]
  (when (and (string? hex) (string/starts-with? hex "#"))
    (let [light (adjust-for-contrast hex canonical-light-bg 3.0)
          dark (adjust-for-contrast hex canonical-dark-bg 3.0)]
      {:picked hex
       :light light
       :dark dark
       :differs? (or (not= hex light) (not= hex dark))})))

(defn hex->name
  "Reverse lookup: given a hex string (with or without leading '#'),
   return the human-readable color name from the CSS native list
   (preferred — shorter, more recognizable) or the XKCD dictionary,
   or nil if neither matches.

   Returned name is in its canonical lowercase form (e.g. 'gold',
   'dusty rose'); use `humanize-name` to title-case for display."
  [hex]
  (when (string? hex)
    (let [s (-> hex string/trim string/lower-case)
          stripped (cond-> s (string/starts-with? s "#") (subs 1))]
      (when (re-matches #"[0-9a-f]{6}" stripped)
        (or (css/hex->name stripped)
            (named/hex->name stripped))))))

(defn humanize-name
  "Convert an internal lowercase color name to display form. Single-word
   names get their first letter capitalized; multi-word names get title
   case. Examples: 'gold' -> 'Gold', 'dusty rose' -> 'Dusty Rose'."
  [s]
  (when (string? s)
    (->> (string/split s #"\s+")
         (map string/capitalize)
         (string/join " "))))

;; ----------------------------------------------------------------------------
;; Color name resolution (hex / CSS named / XKCD dictionary)
;; ----------------------------------------------------------------------------

(defn parse-hex
  "Validate + normalize a user-typed hex string. Returns canonical
   lowercase \"#rrggbb\" on success, nil on failure. Accepts 3- and
   6-digit forms, with or without leading `#`, surrounding whitespace
   tolerated. Rejects 8-digit (alpha) input — model is opaque."
  [s]
  (when (string? s)
    (let [t (-> s string/trim string/lower-case)
          t (cond-> t (string/starts-with? t "#") (subs 1))]
      (cond
        (re-matches #"[0-9a-f]{3}" t)
        (str "#" (->> t (mapcat #(repeat 2 %)) (apply str)))

        (re-matches #"[0-9a-f]{6}" t)
        (str "#" t)

        :else nil))))

(def ^:private color-blacklist
  "CSS keywords that are NOT colors and must never resolve."
  #{"transparent" "currentcolor" "inherit" "initial" "unset"
    "revert" "revert-layer" "none"})

(defn- normalize-name
  "Lowercase (locale-insensitive), trim, collapse [\\s-]+ to single space.
   Used for dictionary lookups."
  [s]
  (when (string? s)
    (-> s
        string/trim
        ;; Locale-insensitive lowercase via JS toLowerCase with empty locale
        ;; array. Avoids Turkish dotted-İ -> i̇ issue.
        (#(.toLowerCase ^js % #js []))
        (string/replace #"[\s-]+" " "))))

(defn- despace
  "Collapse all whitespace + hyphens out of a normalized name. Used for
   CSS lookup since CSS names have no internal whitespace."
  [s]
  (when (string? s)
    (string/replace s #"[\s-]" "")))

(defn- ->hex-with-hash
  "Take a 6-char hex without '#' and prepend '#'. Returns nil for nil."
  [h]
  (when h (str "#" h)))

(defn- hex-pattern? [s]
  (boolean
   (when (string? s)
     (re-matches #"#?[0-9a-fA-F]{3}|#?[0-9a-fA-F]{6}" s))))

(defn css-named->hex
  "O(1) lookup in the CSS named-color map (148 entries). Returns
   '#rrggbb' or nil. Excludes blacklist."
  [s]
  (when (string? s)
    (let [norm (normalize-name s)]
      (when (and norm (not (contains? color-blacklist norm)))
        (->hex-with-hash (css/css-colors (despace norm)))))))

(defn dict-exact->hex
  "Exact lookup in the XKCD dictionary. Returns '#rrggbb' or nil."
  [s]
  (when (string? s)
    (let [norm (normalize-name s)]
      (when (and norm (not (contains? color-blacklist norm)))
        (->hex-with-hash (named/named-colors norm))))))

(def ^:private *sorted-keys-cache
  "Sorted vector of normalized XKCD keys, computed once. Used for
   alphabetically-first prefix matching."
  (delay (vec (sort (keys named/named-colors)))))

(defn dict-prefix->hex
  "Alphabetically-first XKCD entry whose normalized name starts with `s`.
   Returns {:hex \"#rrggbb\" :name \"matched name\"} or nil.
   Min input length 2."
  [s]
  (when (and (string? s) (>= (count s) 2))
    (let [norm (normalize-name s)]
      (when (and norm
                 (>= (count norm) 2)
                 (not (contains? color-blacklist norm)))
        (when-let [match (->> @*sorted-keys-cache
                              (some #(when (string/starts-with? % norm) %)))]
          {:hex (->hex-with-hash (named/named-colors match))
           :name match})))))

(defn prefix-completion
  "For ghost-suffix rendering. Given partially-typed input, return the
   completion details for the alphabetically-first prefix match.
   Returns {:full \"silver\" :suffix \"ver\" :hex \"#c0c0c0\"} or nil.
   nil when input is empty, < 2 chars, exact match exists, hex pattern,
   or no prefix candidate."
  [s]
  (when (and (string? s)
             (>= (count s) 2)
             (not (hex-pattern? (string/trim s))))
    (let [norm (normalize-name s)]
      (when (and norm
                 (>= (count norm) 2)
                 (not (contains? color-blacklist norm))
                 ;; Skip if input is already an exact match
                 (not (named/named-colors norm))
                 (not (css/css-colors (despace norm))))
        (when-let [match (->> @*sorted-keys-cache
                              (some #(when (string/starts-with? % norm) %)))]
          (let [;; Suffix is what would be added to typed text. Preserve the
                ;; user's typing in case (no auto-uppercase mid-suggestion).
                suffix (subs match (count norm))]
            {:full match
             :suffix suffix
             :hex (->hex-with-hash (named/named-colors match))}))))))

(defn resolve-color
  "Resolve free-text input to a color descriptor.
   Returns:
     {:hex '#rrggbb'
      :match :hex | :var | :css | :exact | :prefix
      :name optional-string  (omitted for :hex and :var)
      :tentative? bool       (only true for :prefix)}
   or nil. Whitespace-only / blacklisted / unparsable -> nil.
   Public boundary."
  [s]
  (when (and (string? s) (<= (count s) 64))
    (let [trimmed (string/trim s)]
      (when (and (seq trimmed)
                 (not (contains? color-blacklist (normalize-name trimmed))))
        (or
         ;; 1. Hex pattern wins
         (when-let [hex (parse-hex trimmed)]
           {:hex hex :match :hex})
         ;; 2. CSS variable expression (e.g. "var(--rx-gray-09)")
         (when (string/starts-with? trimmed "var(")
           (when-let [hex (->hex trimmed)]
             {:hex hex :match :var}))
         ;; 3. CSS named
         (when-let [hex (css-named->hex trimmed)]
           {:hex hex :match :css :name (despace (normalize-name trimmed))})
         ;; 4. Dictionary exact
         (when-let [hex (dict-exact->hex trimmed)]
           {:hex hex :match :exact :name (normalize-name trimmed)})
         ;; 5. Dictionary prefix (tentative)
         (when-let [{:keys [hex name]} (dict-prefix->hex trimmed)]
           {:hex hex :match :prefix :name name :tentative? true}))))))

;; ---- Text width measurement (for ghost positioning) ----

(defonce ^:private *measure-canvas (atom nil))
(defonce ^:private *measure-cache (atom {}))

(defn- ensure-measure-ctx
  "Lazy-init a single offscreen canvas 2D context. Returns the ctx
   (CanvasRenderingContext2D)."
  []
  (or @*measure-canvas
      (let [^js canvas (.createElement js/document "canvas")
            ctx (.getContext canvas "2d")]
        (reset! *measure-canvas ctx)
        ctx)))

(defn measure-text-px
  "Measure rendered width of `text` at the given CSS font shorthand
   (e.g. \"12px Inter, sans-serif\"). Cached per [font text] pair.
   Returns a number in CSS pixels."
  [font text]
  (let [k [font text]]
    (or (get @*measure-cache k)
        (let [^js ctx (ensure-measure-ctx)
              _ (set! (.-font ctx) font)
              w (.-width (.measureText ctx text))]
          (swap! *measure-cache assoc k w)
          ;; Bound cache size to avoid unbounded growth in long sessions.
          (when (> (count @*measure-cache) 512)
            (reset! *measure-cache {k w}))
          w))))
