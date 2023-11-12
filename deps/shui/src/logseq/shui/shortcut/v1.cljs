(ns logseq.shui.shortcut.v1
  (:require [clojure.string :as string]
            [logseq.shui.button.v2 :as button]
            [rum.core :as rum]))

(defn print-shortcut-key [key]
  (case key
    ("cmd" "command" "mod" "⌘" "meta") "⌘"
    ("return" "enter" "⏎") "⏎"
    ("shift" "⇧") "⇧"
    ("alt" "option" "opt" "⌥") "⌥"
    ("ctrl" "control" "⌃") "⌃"
    ("space" " ") " "
    ("up" "↑") "↑"
    ("down" "↓") "↓"
    ("left" "←") "←"
    ("right" "→") "→"
    ("disabled" "Disabled") ""
    ("backspace" "delete") ""
    ("tab") "⇥"
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
    ("insert") ""
    ("home") ""
    ("end") ""
    ("page-up") ""
    ("page-down") ""
    (nil) ""
    (name key)))

;; TODO: shortcut component shouldn't worry about this
(defn to-string [input]
  (cond
    (string? input) input
    (keyword? input) (name input)
    (symbol? input) (name input)
    (number? input) (str input)
    (uuid? input) (str input)
    (nil? input) ""
    :else (pr-str input)))

(rum/defc root
  [shortcut context & {:keys [tiled size]
                       :or {tiled true
                            size :sm}}]
  [:<>
   (for [[index option] (map-indexed vector (string/split shortcut #" \| "))]
     [:<>
      (when (< 0 index)
        [:div.text-gray-11.text-sm "|"])
      (let [[system-default option] (if (.startsWith option "system default: ")
                                      [true (subs option 16)]
                                      [false option])]
        [:<>
         (when system-default
           [:div.mr-1.text-xs "System default: "])
         (for [sequence (string/split option #" ")
               :let [text (->> (string/split sequence #"\+")
                               (map print-shortcut-key)
                               (apply str))]]
           (button/root {:theme :gray
                         :interactive false
                         :text (to-string text)
                         :tiled tiled
                         :size size
                         :mused true}
                        context))])])])
