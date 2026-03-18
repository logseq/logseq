(ns frontend.modules.shortcut.utils
  (:require [clojure.string :as string]
            [frontend.util :as util]
            [lambdaisland.glogi :as log])
  (:import [goog.ui KeyboardShortcutHandler]))

(def ^:private modifier-order
  {"ctrl" 0 "alt" 1 "meta" 2 "shift" 3})

(def ^:private modifier-aliases
  {"mod"     (if util/mac? "meta" "ctrl")
   "cmd"     "meta"
   "command" "meta"
   "opt"     "alt"
   "option"  "alt"
   "⌥"       "alt"})

(def ^:private modifier-set
  #{"ctrl" "alt" "meta" "shift"})

(defn canonicalize-binding
  "Normalizes a binding string to canonical form:
   - Resolves modifier aliases (mod/cmd/command → meta, opt/option → alt)
   - Sorts modifiers into ctrl+alt+meta+shift order
   - Lowercases everything
   - Handles chord sequences (space-separated steps)"
  [binding]
  (when (string? binding)
    (let [canonicalize-step
          (fn [step]
            (let [parts (map #(get modifier-aliases % %) (string/split step #"\+"))
                  mods  (filter modifier-set parts)
                  keys  (remove modifier-set parts)
                  sorted-mods (sort-by #(get modifier-order % 99) mods)]
              (string/join "+" (concat sorted-mods keys))))
          steps (string/split (-> binding string/trim string/lower-case) #" ")]
      (string/join " " (map canonicalize-step steps)))))

(defn safe-parse-string-binding
  [binding]
  (try
    (KeyboardShortcutHandler/parseStringShortcut binding)
    (catch js/Error e
      (log/warn :shortcut/parse-key-error {:error e :binding binding}) binding)))

(defn mod-key [binding]
  (string/replace binding #"(?i)mod"
                  (if util/mac? "meta" "ctrl")))

(defn undecorate-binding
  [binding]
  (when (string? binding)
    (let [keynames {";" "semicolon"
                    "=" "equals"
                    "-" "dash"
                    "[" "open-square-bracket"
                    "]" "close-square-bracket"
                    "'" "single-quote"
                    "(" "shift+9"
                    ")" "shift+0"
                    "~" "shift+`"
                    "⇧" "shift"
                    "⌥" "alt"
                    "←" "left"
                    "→" "right"
                    "↑"  "up"
                    "↓"  "down"}]
      (-> binding
          (string/replace #"[;=-\[\]'\(\)\~\→\←\⇧⌥]" #(get keynames %))
          (string/replace #"\s+" " ")
          (mod-key)
          (string/lower-case)))))

(defn decorate-namespace [k]
  (let [n (name k)
        ns (namespace k)]
    (keyword (str "command." ns) n)))

(defn decorate-binding [binding]
  (when (or (string? binding)
            (sequential? binding))
    (-> (if (string? binding) binding (string/join "+" binding))
        (string/replace "mod" (if util/mac? "⌘" "ctrl"))
        (string/replace "meta" (if util/mac? "⌘" "⊞ win"))
        (string/replace "alt" (if util/mac? "⌥" "alt"))
        (string/replace "shift+/" "?")
        (string/replace "left" "←")
        (string/replace "right" "→")
        (string/replace "up" "↑")
        (string/replace "down" "↓")
        (string/replace "shift" "⇧")
        (string/replace "open-square-bracket" "[")
        (string/replace "close-square-bracket" "]")
        (string/replace "equals" "=")
        (string/replace "semicolon" ";")
        (string/lower-case))))
