(ns frontend.modules.shortcut.utils
  (:require [clojure.string :as str]
            [frontend.util :as util])
  (:import [goog.ui KeyboardShortcutHandler]))

(defn safe-parse-string-binding
  [binding]
  (try
    (KeyboardShortcutHandler/parseStringShortcut binding)
    (catch js/Error e
      (js/console.warn "[shortcuts] parse key error: " e) binding)))

(defn mod-key [binding]
  (str/replace binding #"(?i)mod"
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
          (str/replace #"[;=-\[\]'\(\)\~\→\←\⇧]" #(get keynames %))
          (str/replace #"\s+" " ")
          (mod-key)
          (str/lower-case)))))

(defn decorate-namespace [k]
  (let [n (name k)
        ns (namespace k)]
    (keyword (str "command." ns) n)))

(defn decorate-binding [binding]
  (when (or (string? binding)
            (sequential? binding))
    (-> (if (string? binding) binding (str/join "+" binding))
        (str/replace "mod" (if util/mac? "⌘" "ctrl"))
        (str/replace "meta" (if util/mac? "⌘" "⊞ win"))
        (str/replace "alt" (if util/mac? "opt" "alt"))
        (str/replace "shift+/" "?")
        (str/replace "left" "←")
        (str/replace "right" "→")
        (str/replace "up" "↑")
        (str/replace "down" "↓")
        (str/replace "shift" "⇧")
        (str/replace "open-square-bracket" "[")
        (str/replace "close-square-bracket" "]")
        (str/replace "equals" "=")
        (str/replace "semicolon" ";")
        (str/lower-case))))
