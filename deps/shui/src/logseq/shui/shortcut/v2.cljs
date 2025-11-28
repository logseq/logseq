(ns logseq.shui.shortcut.v2
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
                   ("alt" "option" "opt" "⌥") (if mac? "Opt" "Alt")
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
                   ("page-up") ""
                   ("page-down") ""
                   ("esc" "escape") "Esc"
                   ("backspace") "Backspace"
                   ("delete") "Delete"
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
   Examples: 'cmd+k', 'shift+cmd+k', 'cmd up'"
  [binding]
  (cond
    (string? binding)
    (string/lower-case (string/trim binding))
    
    (coll? binding)
    (let [first-item (first binding)
          keys (flatten-keys binding)
          normalize-key (fn [k]
                         (cond
                           (string? k) (string/lower-case k)
                           (keyword? k) (name k)
                           (symbol? k) (name k)
                           (number? k) (str k)
                           :else (str k)))]
      (string/join "+" (map normalize-key keys)))
    
    (keyword? binding)
    (name binding)
    
    (symbol? binding)
    (name binding)
    
    :else
    (str binding)))

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

(defn shortcut-press!
  "Central helper to trigger key press animation.
   Finds all nodes with matching data-shortcut-binding and toggles pressed class.
   Optionally highlights parent row.
   
   Args:
   - binding: normalized shortcut binding string (e.g., \"cmd+k\")
   - highlight-row?: if true, also highlights parent row (default: false)"
  ([binding] (shortcut-press! binding false))
  ([binding highlight-row?]
   (let [normalized (normalize-binding binding)
         selector (str "[data-shortcut-binding=\"" normalized "\"]")
         elements (.querySelectorAll js/document selector)]
     (doseq [^js el (array-seq elements)]
       (.add (.-classList el) "shui-shortcut-key-pressed")
       (when highlight-row?
         (let [^js row (or (.closest el ".shui-shortcut-row")
                            (.-parentElement el))]
           (when row
             (.add (.-classList row) "shui-shortcut-row--pressed"))))
       ;; Auto-reset after animation duration
       (js/setTimeout
        (fn []
          (.remove (.-classList el) "shui-shortcut-key-pressed")
          (when highlight-row?
            (let [^js row (or (.closest el ".shui-shortcut-row")
                              (.-parentElement el))]
              (when row
                (.remove (.-classList row) "shui-shortcut-row--pressed")))))
        160)))))

(rum/defc combo-keys
  "Renders combo keys (simultaneous key combinations) with separator."
  [keys binding {:keys [interactive? aria-label aria-hidden? glow?]}]
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
          :aria-hidden (if aria-label "true" "false")
          :tab-index (if interactive? 0 -1)
          :role (when interactive? "button")}
         key-text]))]))

(rum/defc separate-keys
  "Renders separate keys (sequential key presses) with 4px gap."
  [keys binding {:keys [interactive? aria-label aria-hidden? glow?]}]
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
         :aria-hidden (if aria-label "true" "false")
         :tab-index (if interactive? 0 -1)
         :role (when interactive? "button")
         :style {:min-width "fit-content"}}
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

(rum/defc root
  "Main shortcut component with automatic style detection.
   
   Props:
   - :style - :combo, :separate, :compact, or :auto (default: :auto)
   - :interactive? - if true, keys are focusable (default: false)
   - :aria-label - accessibility label for container
   - :aria-hidden? - if true, hides from screen readers (default: false for decorative hints)
   - :animate-on-press? - if true, enables press animation (default: true)
   - :glow? - if true, adds inner glow effect to combo/separate keys (default: true)"
  [shortcut & {:keys [style size theme interactive? aria-label aria-hidden? animate-on-press? glow?]
               :or {style :auto
                    size :xs
                    interactive? false
                    aria-hidden? false
                    animate-on-press? true
                    glow? true}}]
  (when (and shortcut (seq shortcut))
    (let [shortcuts (if (coll? shortcut)
                      (if (every? string? shortcut)
                        [shortcut]  ; single shortcut as vector
                        (if (string? (first shortcut))
                          [shortcut]  ; single shortcut string
                          shortcut))  ; multiple shortcuts
                      (parse-shortcuts shortcut))
          opts {:interactive? interactive?
                :aria-label aria-label
                :aria-hidden? aria-hidden?
                :glow? glow?}]
      (for [[index binding] (map-indexed vector shortcuts)]
        (let [detected-style (if (= style :auto)
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
                     (let [flattened (mapcat #(if (coll? %) % [%]) binding)]
                       (if (every? string? flattened)
                         flattened  ; separate: flat collection like ["cmd" "k"] or ["⇧" "g"]
                         (map str flattened)))  ; convert any non-strings to strings
                     
                     :else
                     [(str binding)])
              render-fn (case detected-style
                          :combo combo-keys
                          :separate separate-keys
                          :compact compact-keys
                          separate-keys)]  ; fallback
          [:span
           {:key (str "shortcut-" index)
            :style {:display "inline-flex"
                    :align-items "center"
                    :min-height "20px"
                    :white-space "nowrap"}}
           (when (< 0 index)
             [:span.text-gray-11.text-sm {:key (str "sep-" index)
                                           :style {:margin "0 4px"}} "|"])
           (render-fn keys binding opts)])))))

