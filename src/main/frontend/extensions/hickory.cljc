(ns frontend.extensions.hickory
  "A shim for conditional reading of the hickory lib in Node,
   which requires DOM"
  (:require #?(:node-test [lambdaisland.glogi :as log]
               :default   [hickory.core :as hickory])))

#?(:node-test (defn html->hiccup
                [html]
                (log/error :exception "Calling hickory from Node test environment is not expected!"))
   :default (defn html->hiccup
              [html]
              (hickory/as-hiccup (hickory/parse html))))