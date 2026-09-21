(ns logseq.graph-parser.emoji-data
  "Loads the emoji dataset for the importer runtimes."
  #?@(:org.babashka/nbb []
      :cljs [(:require ["@emoji-mart/data" :as emoji-data])]))

#?(:cljs
   (def data
     #?(:org.babashka/nbb (js/require "@emoji-mart/data")
        :cljs emoji-data)))
