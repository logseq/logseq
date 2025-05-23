(ns logseq.e2e.keyboard
  (:require [wally.main :as w]))

(def press w/keyboard-press)

(def enter #(press "Enter"))
(def esc #(press "Escape"))
(def backspace #(press "Backspace"))
(def tab #(press "Tab"))
(def shift+tab #(press "Shift+Tab"))
(def shift+enter #(press "Shift+Enter"))
(def arrow-up #(press "ArrowUp"))
(def arrow-down #(press "ArrowDown"))
