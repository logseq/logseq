(ns logseq.shui.shortcut.v1
  (:require [clojure.string :as string]
            [logseq.shui.button.v2 :as button]
            [rum.core :as rum]
            [goog.userAgent]))

(def mac? goog.userAgent/MAC)
(defn print-shortcut-key [key]
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
                   (nil) ""
                   (name key)))]
    (if (= (count result) 1)
      result
      (string/capitalize result))))

(defn to-string [input]
  (cond
    (string? input) input
    (keyword? input) (name input)
    (symbol? input) (name input)
    (number? input) (str input)
    (uuid? input) (str input)
    (nil? input) ""
    :else (pr-str input)))

(defn- parse-shortcuts
  [s]
  (->> (string/split s #" \| ")
       (map (fn [x]
              (->> (string/split x #" ")
                   (map #(if (string/includes? % "+")
                           (string/split % #"\+")
                           %)))))))

(rum/defc part
  [context theme ks size]
  (button/root {:theme theme
                :interactive false
                :tiled true
                :tiles (map print-shortcut-key ks)
                :size size
                :mused true}
               context))

(rum/defc root
  [shortcut context & {:keys [size theme]
                       :or {size :sm
                            theme :gray}}]
  (when (seq shortcut)
    (let [shortcuts (if (coll? shortcut)
                      [shortcut]
                      (parse-shortcuts shortcut))]
      (for [[index binding] (map-indexed vector shortcuts)]
        [:<>
         (when (< 0 index)
           [:div.text-gray-11.text-sm "|"])
         (if (coll? (first binding))   ; + included
           (for [ks binding]
             (part context theme ks size))
           (part context theme binding size))]))))
