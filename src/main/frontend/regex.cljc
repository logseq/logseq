(ns ^:no-doc frontend.regex
  (:require [clojure.string :as string]))

(def re-specials #"([\-\/\\\^\$\*\+\?\.\(\)\|\[\]\{\}])")

(defn escape
  "Escapes regex characters in string, e.g., 'C++' -> 'C\\+\\+'."
  [s]
  ; NOTE: In Clojure, the replace string should be "\\\\$1".
  (string/replace s re-specials "\\$1"))
