(ns frontend.colors.named-loader-eager
  "Eager drop-in for `frontend.colors.named-loader` in builds without
   `:modules` (node tests), selected via `:ns-aliases` in shadow-cljs.edn.
   Requires the XKCD dictionary directly, so the loader API behaves as if
   the lazy module were always loaded."
  (:require [frontend.colors.named :as named]))

(defonce *ready? (atom true))

(defn load!
  "No-op: the dictionary is part of the build."
  []
  nil)

(defn named-colors
  []
  named/named-colors)

(defn named-hex->name
  [stripped]
  (named/hex->name stripped))
