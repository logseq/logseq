(ns frontend.react-impls
  "Support different react implements."
  (:require [frontend.util :as util]))

(def react (atom util/react))
