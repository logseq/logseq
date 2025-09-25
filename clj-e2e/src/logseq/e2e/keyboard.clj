(ns logseq.e2e.keyboard
  (:require [wally.main :as w]))

(def ^:private mac? (= "Mac OS X" (System/getProperty "os.name")))

(def press w/keyboard-press)

(def enter #(press "Enter"))
(def esc #(press "Escape"))
(def backspace #(press "Backspace"))
(def delete #(press "Delete"))
(def tab #(press "Tab"))
(def shift+tab #(press "Shift+Tab"))
(def shift+enter #(press "Shift+Enter"))
(def shift+arrow-up #(press "Shift+ArrowUp"))
(def shift+arrow-down #(press "Shift+ArrowDown"))

(def arrow-up #(press "ArrowUp"))
(def arrow-down #(press "ArrowDown"))

(def meta+shift+arrow-up #(press (str (if mac? "Meta" "Alt") "+Shift+ArrowUp")))
(def meta+shift+arrow-down #(press (str (if mac? "Meta" "Alt") "+Shift+ArrowDown")))
