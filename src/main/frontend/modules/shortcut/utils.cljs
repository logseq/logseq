(ns frontend.modules.shortcut.utils
  (:require [clojure.string :as str]
            [frontend.util :as util]))


(defn undecorate-binding
  [binding]
  (let [keynames {";" "semicolon"
                  "=" "equals"
                  "-" "dash"
                  "[" "open-square-bracket"
                  "]" "close-square-bracket"
                  "'" "single-quote"
                  "(" "shift+9"
                  ")" "shift+0"
                  "~" "shift+`"}]
    (some-> (str binding)
            (str/lower-case)
            (str/replace #"[;=-\[\]'\(\)\~]" #(get keynames %))
            (str/replace #"\s+" " "))))

(defn decorate-namespace [k]
  (let [n  (name k)
        ns (namespace k)]
    (keyword (str "command." ns) n)))

(defn decorate-binding [binding]
  (-> (if (string? binding) binding (str/join "+" binding))
      (str/replace "mod" (if util/mac? "⌘" "ctrl"))
      (str/replace "alt" (if util/mac? "opt" "alt"))
      (str/replace "shift+/" "?")
      (str/replace "left" "←")
      (str/replace "right" "→")
      (str/replace "shift" "⇧")
      (str/replace "open-square-bracket" "[")
      (str/replace "close-square-bracket" "]")
      (str/lower-case)))
