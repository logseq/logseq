(ns frontend.react-impls
  "Support different react implements."
  (:require [rum.core :as rum]))

(def react (atom rum/react))
