(ns logseq.shui.shortcut.v1
  (:require [clojure.string :as string]
            [goog.userAgent]
            [logseq.shui.base.core :as shui.base]
            [rum.core :as rum]))

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

(defn- parse-shortcuts
  [s]
  (->> (string/split s #" \| ")
       (map (fn [x]
              (->> (string/split x #" ")
                   (map #(if (string/includes? % "+")
                           (string/split % #"\+")
                           %)))))))

(rum/defc part
  [ks size {:keys [interactive?]}]
  (let [tiles (map print-shortcut-key ks)
        interactive? (true? interactive?)]
    (shui.base/button {:variant (if interactive? :default :text)
                       :class (str "bg-gray-03 text-gray-10 px-1.5 py-0 leading-4 h-5 rounded font-normal "
                                   (if interactive?
                                     "hover:bg-gray-04 active:bg-gray-03 hover:text-gray-12"
                                     "bg-transparent cursor-default active:bg-gray-03 hover:text-gray-11 opacity-80"))
                       :size size}
                      (for [[index tile] (map-indexed vector tiles)]
                        [:span {:key index}
                         [:<>
                          (when (< 0 index)
                            [:span.ui__button__tile-separator])
                          [:span.ui__button__tile tile]]]))))

(rum/defc root
  [shortcut & {:keys [size theme interactive?]
               :or {size :xs
                    interactive? true
                    theme :gray}}]
  (when (seq shortcut)
    (let [shortcuts (if (coll? shortcut)
                      [shortcut]
                      (parse-shortcuts shortcut))
          opts {:interactive? interactive?}]
      (for [[index binding] (map-indexed vector shortcuts)]
        [:span
         {:key (str index)}
         (when (< 0 index)
           [:span.text-gray-11.text-sm {:key "sep"} "|"])
         (if (coll? (first binding))                        ; + included
           (for [[idx ks] (map-indexed vector binding)]
             (rum/with-key
               (part ks size opts)
               (str "part-" idx)))
           (part binding size opts))]))))
