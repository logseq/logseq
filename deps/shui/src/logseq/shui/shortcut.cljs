(ns logseq.shui.shortcut
  "Unified keyboard shortcut component with three styles: combo, separate, and compact.
   
   Expected shortcut formats:
   - Combo keys (simultaneous): \"shift+cmd\", [\"shift\" \"cmd\"], or [[\"shift\" \"cmd\"]]
   - Separate keys (sequential): [\"cmd\" \"up\"], or [\"cmd\" \"k\"]
   - Compact: same formats but with :style :compact
   
   Platform mapping:
   - :mod or \"mod\" maps to ⌘ on macOS, Ctrl on Windows/Linux
   - Other keys are mapped via print-shortcut-key function"
  (:require [clojure.string :as string]
            [goog.userAgent]
            [rum.core :as rum]))

(def mac? goog.userAgent/MAC)

(defn print-shortcut-key
  "Maps logical keys to display keys, with platform-specific handling.
   Supports :mod for platform-agnostic modifier key.
   Automatically uppercases single letter keys (a-z) while preserving
   multi-character keys like Ctrl, Backspace, Delete, Opt, etc."
  [key]
  (let [result (if (coll? key)
                 (string/join "+" key)
                 (case (if (string? key)
                         (string/lower-case key)
                         key)
                   ("cmd" "command" "mod" "⌘") (if mac? "⌘" "Ctrl")
                   ("meta") (if mac? "⌘" "⊞")
                   ("return" "enter" "⏎") "⏎"
                   ("shift" "⇧") "⇧"
                   ("alt" "option" "opt" "⌥") (if mac? "⌥" "Alt")
                   ("ctrl" "control" "⌃") "Ctrl"
                   ("space" " ") "Space"
                   ("up" "↑") "↑"
                   ("down" "↓") "↓"
                   ("left" "←") "←"
                   ("right" "→") "→"
                   ("tab") "Tab"
                   ("open-square-bracket") "["
                   ("close-square-bracket") "]"
                   ("dash") "-"
                   ("semicolon") ";"
                   ("equals") "="
                   ("single-quote") "'"
                   ("backslash") "\\"
                   ("comma") ","
                   ("period") "."
                   ("slash") "/"
                   ("grave-accent") "`"
                   ("page-up") "PgUp"
                   ("page-down") "PgDn"
                   ("esc" "escape") "Esc"
                   ("backspace") "⌫"
                   ("delete") "Delete"
                   ("caps-lock" "capslock") "⇪"
                   (nil) ""
                   (name key)))
        ;; If result is a single letter (a-z), uppercase it
        ;; Otherwise, capitalize only if it's a single character (for symbols)
        final-result (cond
                       (and (= (count result) 1)
                            (re-matches #"[a-z]" result))
                       (string/upper-case result)

                       (= (count result) 1)
                       result

                       :else
                       (string/capitalize result))]
    final-result))

(defn- flatten-keys
  "Recursively flattens nested collections, preserving strings."
  [coll]
  (mapcat (fn [x]
            (if (and (coll? x) (not (string? x)))
              (flatten-keys x)
              [x]))
          coll))

(defn- normalize-binding
  "Normalizes a shortcut binding to a string format for data attributes.
   Examples: 'cmd+k', 'shift+cmd+k', 'cmd up'
   Handles 'mod' -> 'meta' on Mac, 'ctrl' on Windows/Linux for consistency with shortcut system."
  [binding]
  (let [normalize-key (fn [k]
                        (cond
                          (string? k) (let [lowered (string/lower-case k)]
                                      ;; Convert 'mod' to 'meta' on Mac, 'ctrl' on Windows/Linux
                                      ;; to match what the shortcut system uses
                                        (if (= lowered "mod")
                                          (if mac? "meta" "ctrl")
                                          lowered))
                          (keyword? k) (name k)
                          (symbol? k) (name k)
                          (number? k) (str k)
                          :else (str k)))]
    (cond
      (string? binding)
      (let [trimmed (string/trim binding)
            normalized (string/lower-case trimmed)]
        ;; Normalize modifier aliases to canonical form (meta/ctrl)
        (-> normalized
            (string/replace #"\bmod\b" (if mac? "meta" "ctrl"))
            (string/replace #"\b(?:cmd|command)\b" "meta")
            (string/replace #"(?:\bopt\b|\boption\b|⌥)" "alt")))

      (coll? binding)
      (if (and (coll? (first binding)) (> (count binding) 1) (every? coll? binding))
        ;; Chord sequence: normalize each group separately, join with space
        (string/join " " (map (fn [group]
                                (string/join "+" (map normalize-key (flatten-keys group))))
                              binding))
        ;; Single combo group
        (let [keys (flatten-keys binding)]
          (string/join "+" (map normalize-key keys))))

      (keyword? binding)
      (name binding)

      (symbol? binding)
      (name binding)

      :else
      (str binding))))

(defn- detect-style
  "Automatically detects style from shortcut format.
   Returns :combo, :separate, or :compact"
  [shortcut]
  (cond
    (string? shortcut)
    (if (string/includes? shortcut "+")
      :combo
      :separate)

    (coll? shortcut)
    (let [first-item (first shortcut)]
      (cond
        (coll? first-item) :combo  ; nested collection means combo
        (string/includes? (str first-item) "+") :combo
        :else :separate))

    :else :separate))

(defn- parse-shortcuts
  "Parses shortcut string into structured format.
   Handles ' | ' separator for multiple shortcuts."
  [s]
  (->> (string/split s #" \| ")
       (map (fn [x]
              (->> (string/split x #" ")
                   (map #(if (string/includes? % "+")
                           (string/split % #"\+")
                           %)))))))

(def ^:private press-animation-ms 160)
(def ^:private row-shimmer-ms 750)

(defn- highlight-row!
  "Add or remove the row highlight class on the closest shortcut row ancestor.
   On first trigger, forces a reflow to start the CSS animation.
   On repeated triggers, the class stays applied (no reflow) and the
   removal timer is reset so it fires after the last trigger."
  [^js container add?]
  (when-let [^js row (or (.closest container ".shui-shortcut-row, .shortcut-row")
                         (.-parentElement container))]
    (if add?
      (let [already? (.contains (.-classList row) "shui-shortcut-row--pressed")]
        ;; Cancel any pending removal
        (when-let [t (.-__sweepTimer row)]
          (js/clearTimeout t)
          (set! (.-__sweepTimer row) nil))
        ;; Only force reflow on first trigger to start the animation
        (when-not already?
          (.add (.-classList row) "shui-shortcut-row--pressed"))
        ;; Schedule removal after the last trigger
        (set! (.-__sweepTimer row)
              (js/setTimeout
               (fn []
                 (.remove (.-classList row) "shui-shortcut-row--pressed")
                 (set! (.-__sweepTimer row) nil))
               row-shimmer-ms)))
      (do
        (when-let [t (.-__sweepTimer row)]
          (js/clearTimeout t)
          (set! (.-__sweepTimer row) nil))
        (.remove (.-classList row) "shui-shortcut-row--pressed")))))

(defn- animate-element!
  "Add pressed class, optionally highlight row, then auto-reset after animation.
   Key badge uses a simple clearTimeout+reset pattern to avoid stale removals."
  [^js el ^js container highlight-row?]
  (.add (.-classList el) "shui-shortcut-key-pressed")
  (when highlight-row? (highlight-row! container true))
  ;; Clear any pending badge removal, then schedule a new one
  (when-let [t (.-__badgeTimer el)]
    (js/clearTimeout t))
  (set! (.-__badgeTimer el)
        (js/setTimeout
         (fn []
           (.remove (.-classList el) "shui-shortcut-key-pressed")
           (set! (.-__badgeTimer el) nil))
         press-animation-ms)))

(defn shortcut-press!
  "Central helper to trigger key press animation.
   For combo keys, animates the container (the whole keycap depresses).
   For separate keys, animates individual kbd elements.
   Optionally highlights parent row.

   Args:
   - binding: normalized shortcut binding string (e.g., \"cmd+k\")
   - highlight-row?: if true, also highlights parent row (default: false)"
  ([binding] (shortcut-press! binding false))
  ([binding highlight-row?]
   (let [normalized (normalize-binding binding)
         selector (str "[data-shortcut-binding=\"" normalized "\"]")
         containers (.querySelectorAll js/document selector)]
     (doseq [^js container (array-seq containers)]
       (if (.contains (.-classList container) "shui-shortcut-combo")
         ;; Combo keys: animate the container as a unit (one keycap)
         (animate-element! container container highlight-row?)
         ;; Separate keys: animate each kbd individually
         (let [keys (.querySelectorAll container "kbd.shui-shortcut-key")]
           (if (> (.-length keys) 0)
             (doseq [^js key-el (array-seq keys)]
               (animate-element! key-el container highlight-row?))
             (animate-element! container container highlight-row?))))))))

(rum/defc combo-keys
  "Renders combo keys (simultaneous key combinations) with separator."
  [keys binding {:keys [aria-label aria-hidden? glow?]}]
  (let [key-elements (map print-shortcut-key keys)
        normalized-binding (normalize-binding binding)
        container-class (str "shui-shortcut-combo" (when glow? " shui-shortcut-glow"))
        container-attrs {:class container-class
                         :data-shortcut-binding normalized-binding
                         :style {:white-space "nowrap"}}
        container-attrs (if aria-label
                          (assoc container-attrs :aria-label aria-label)
                          container-attrs)
        container-attrs (if aria-hidden?
                          (assoc container-attrs :aria-hidden "true")
                          container-attrs)]
    [:div container-attrs
     (for [[index key-text] (map-indexed vector key-elements)]
       (list
        (when (< 0 index)
          [:span.shui-shortcut-separator {:key (str "sep-" index)}])
        [:kbd.shui-shortcut-key
         {:key (str "combo-key-" index)
          :aria-hidden (if aria-label "true" "false")}
         key-text]))]))

(rum/defc separate-keys
  "Renders separate keys (sequential key presses) with 4px gap."
  [keys binding {:keys [aria-label aria-hidden? glow?]}]
  (let [key-elements (map print-shortcut-key keys)
        normalized-binding (normalize-binding binding)
        container-class (str "shui-shortcut-separate" (when glow? " shui-shortcut-glow"))
        container-attrs {:class container-class
                         :data-shortcut-binding normalized-binding
                         :style {:white-space "nowrap"
                                 :gap "4px"}}
        container-attrs (if aria-label
                          (assoc container-attrs :aria-label aria-label)
                          container-attrs)
        container-attrs (if aria-hidden?
                          (assoc container-attrs :aria-hidden "true")
                          container-attrs)]
    [:div container-attrs
     (for [[index key-text] (map-indexed vector key-elements)]
       [:kbd.shui-shortcut-key
        {:key (str "separate-key-" index)
         :aria-hidden (if aria-label "true" "false")}
        key-text])]))

(rum/defc compact-keys
  "Renders compact style (text-only, minimal styling)."
  [keys binding {:keys [aria-label aria-hidden?]}]
  (let [key-elements (map print-shortcut-key keys)
        normalized-binding (normalize-binding binding)
        container-attrs {:class "shui-shortcut-compact"
                         :data-shortcut-binding normalized-binding
                         :style {:white-space "nowrap"}}
        container-attrs (if aria-label
                          (assoc container-attrs :aria-label aria-label)
                          container-attrs)
        container-attrs (if aria-hidden?
                          (assoc container-attrs :aria-hidden "true")
                          container-attrs)]
    [:div container-attrs
     (for [[index key-text] (map-indexed vector key-elements)]
       [:span
        {:key (str "compact-key-" index)
         :style {:display "inline-block"
                 :margin-right "2px"}}
        key-text])]))

(rum/defc chord-sequence-keys
  "Renders a chord sequence (multi-step key combinations) with 'then' separators.
   E.g., [['⌘' 'c'] ['⌘' 'r']] renders as: [⌘ C] then [⌘ R]"
  [groups binding {:keys [aria-label aria-hidden? glow? chord-separator]
                   :or {chord-separator "then"}}]
  (let [normalized-binding (normalize-binding binding)
        container-attrs (cond-> {:class "shui-shortcut-chord"
                                 :data-shortcut-binding normalized-binding
                                 :style {:white-space "nowrap"
                                         :display "inline-flex"
                                         :align-items "center"
                                         :gap "8px"}}
                          aria-label (assoc :aria-label aria-label)
                          aria-hidden? (assoc :aria-hidden "true"))]
    [:div container-attrs
     (for [[gi group] (map-indexed vector groups)]
       (list
        (when (> gi 0)
          [:span.shui-shortcut-chord-sep
           {:key (str "chord-sep-" gi)
            :style {:font-size "10px"
                    :opacity 0.45}}
           chord-separator])
        (let [key-elements (map print-shortcut-key group)]
          [:span
           {:key (str "chord-group-" gi)
            :class (str "shui-shortcut-combo" (when glow? " shui-shortcut-glow"))
            :style {:display "inline-flex"
                    :align-items "center"
                    :white-space "nowrap"}}
           (for [[ki key-text] (map-indexed vector key-elements)]
             (list
              (when (< 0 ki)
                [:span.shui-shortcut-separator {:key (str "gsep-" gi "-" ki)}])
              [:kbd.shui-shortcut-key
               {:key (str "chord-key-" gi "-" ki)
                :aria-hidden (if aria-label "true" "false")}
               key-text]))])))]))

(rum/defc root
  "Main shortcut component with automatic style detection.
   
   Props:
   - :style - :combo, :separate, :compact, or :auto (default: :auto)
   - :aria-label - accessibility label for container
   - :aria-hidden? - if true, hides from screen readers (default: false for decorative hints)
   - :glow? - if true, adds inner glow effect to combo/separate keys (default: true)
   - :raw-binding - raw binding format for data-shortcut-binding (for animation matching).
                    If not provided, will normalize from shortcut prop."
  [shortcut & {:keys [style aria-label aria-hidden? glow? raw-binding chord-separator]
               :or {style :auto
                    aria-hidden? false
                    glow? true}}]
  (when (and shortcut (seq shortcut))
    (let [shortcuts (if (coll? shortcut)
                      (if (every? string? shortcut)
                        [shortcut]  ; single shortcut as vector
                        (if (string? (first shortcut))
                          [shortcut]  ; single shortcut string
                          shortcut))  ; multiple shortcuts
                      (parse-shortcuts shortcut))
          opts (cond-> {:aria-label aria-label
                        :aria-hidden? aria-hidden?
                        :glow? glow?}
                 chord-separator (assoc :chord-separator chord-separator))]
      (for [[index binding] (map-indexed vector shortcuts)]
        (let [;; Chord sequence: multiple nested groups like [["⌘" "c"] ["⌘" "r"]]
              chord-sequence? (and (coll? binding)
                                   (> (count binding) 1)
                                   (every? coll? binding))
              detected-style (if (= style :auto)
                               (detect-style binding)
                               style)
              keys (cond
                     (string? binding)
                     (if (string/includes? binding "+")
                       (string/split binding #"\+")  ; combo: "cmd+k" -> ["cmd" "k"]
                       (string/split binding #" "))  ; separate: "cmd k" -> ["cmd" "k"]

                     (and (coll? binding) (coll? (first binding)))
                     (first binding)  ; combo: nested collection like [["shift" "cmd"]]

                     (coll? binding)
                     (let [flattened (mapcat (fn [item]
                                               (cond
                                                 (coll? item) item
                                                 (and (string? item) (string/includes? item "+"))
                                                 (string/split item #"\+")  ; split combo strings like "meta+caps-lock"
                                                 :else [item]))
                                             binding)]
                       (if (every? string? flattened)
                         flattened  ; separate: flat collection like ["cmd" "k"] or ["⇧" "g"]
                         (map str flattened)))  ; convert any non-strings to strings

                     :else
                     [(str binding)])
              ;; Use raw-binding if provided, otherwise normalize from binding
              binding-for-data (if raw-binding
                                 (if (coll? raw-binding)
                                   (if (= (count raw-binding) 1)
                                     (first raw-binding)
                                     raw-binding)
                                   raw-binding)
                                 binding)
              render-fn (case detected-style
                          :combo combo-keys
                          :separate separate-keys
                          :compact compact-keys
                          separate-keys)]  ; fallback
          [:span
           {:key (str "shortcut-" index)
            :style {:display "inline-flex"
                    :align-items "center"
                    :white-space "nowrap"}}
           (when (< 0 index)
             [:span.text-gray-11.text-sm {:key (str "sep-" index)
                                          :style {:margin "0 4px"}} "|"])
           (if chord-sequence?
             (chord-sequence-keys binding binding-for-data opts)
             (render-fn keys binding-for-data opts))])))))

