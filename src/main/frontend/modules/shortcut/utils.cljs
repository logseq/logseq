(ns frontend.modules.shortcut.utils
  (:require [clojure.string :as string]
            [frontend.util :as util])
  (:import [goog.ui KeyboardShortcutHandler]))

(defn safe-parse-string-binding
  [binding]
  (try
    (KeyboardShortcutHandler/parseStringShortcut binding)
    (catch js/Error e
      (js/console.warn "[shortcuts] parse key error: " e) binding)))

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
                    "←" "left"
                    "→" "right"
                    "↑"  "up"
                    "↓"  "down"}]
      (-> binding
          (string/replace #"[;=-\[\]'\(\)\~\→\←\⇧]" #(get keynames %))
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
        (string/replace "alt" (if util/mac? "opt" "alt"))
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
