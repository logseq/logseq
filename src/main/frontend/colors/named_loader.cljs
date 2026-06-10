(ns frontend.colors.named-loader
  "Lazy access to the XKCD color-name dictionary. Browser builds ship
   `frontend.colors.named` as the `:colors-named` shadow module and load
   it on demand through this namespace; builds without `:modules` (node
   tests) swap in `frontend.colors.named-loader-eager` via `:ns-aliases`
   in shadow-cljs.edn — `shadow.lazy/loadable` cannot compile there."
  (:require [shadow.lazy :as lazy]))

#_:clj-kondo/ignore
(def ^:private loadable-named-colors
  (lazy/loadable frontend.colors.named/named-colors))

#_:clj-kondo/ignore
(def ^:private loadable-hex->name
  (lazy/loadable frontend.colors.named/hex->name))

(defonce *ready? (atom false))

(defn load!
  "Kick off loading the XKCD color-name module. Idempotent."
  []
  (when-not @*ready?
    (lazy/load loadable-named-colors
               (fn [_] (reset! *ready? true)))))

(defn named-colors
  "The XKCD name->hex map, or nil while the module hasn't loaded."
  []
  (when @*ready? @loadable-named-colors))

(defn named-hex->name
  "Reverse lookup into the XKCD dictionary; nil before the module loads."
  [stripped]
  (when @*ready? (@loadable-hex->name stripped)))
