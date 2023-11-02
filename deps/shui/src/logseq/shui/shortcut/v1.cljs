(ns logseq.shui.shortcut.v1
  (:require [clojure.string :as string]
            [logseq.shui.button.v2 :as button]
            [rum.core :as rum]))

(defn print-shortcut-key [key]
  (case key
    ("cmd" "command" "mod" "⌘") "⌘"
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
    ("tab") ""
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
  [shortcut context]
  [:<>
   (for [[index option] (map-indexed vector (string/split shortcut #" \| "))]
     [:<>
      (when (< 0 index)
        [:div.text-gray-11.text-sm "|"])
      (for [sequence (string/split option #" ")
            :let [text (->> (string/split sequence #"\+")
                            (map print-shortcut-key)
                            (apply str))]]
        (button/root {:theme :gray
                      :interactive false
                      :text (string/upper-case (to-string text))
                      :tiled true
                      :size :sm
                      :mused true}
                     context))])])
