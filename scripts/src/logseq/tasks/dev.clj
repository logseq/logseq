(ns logseq.tasks.dev
  "Tasks for general development. For desktop or mobile development see their
  namespaces"
  (:require [babashka.tasks :refer [shell]]
            [clojure.java.io :as io]
            [clojure.pprint :as pp]
            [clojure.edn :as edn]))

(defn lint
  "Run all lint tasks
  - clj-kondo lint
  - carve lint for unused vars
  - lint for vars that are too large
  - lint invalid translation entries"
  []
  (doseq [cmd ["clojure -M:clj-kondo --parallel --lint src --cache false"
               "bb lint:carve"
               "bb lint:large-vars"
               "bb lang:validate-translations"
               "bb lint:ns-docstrings"]]
    (println cmd)
    (shell cmd)))


(defn gen-malli-kondo-config
  "Generate clj-kondo type-mismatch config from malli schema
  .clj-kondo/metosin/malli-types/config.edn"
  []
  (let [config-edn ".clj-kondo/metosin/malli-types/config.edn"
        compile-cmd "clojure -M:cljs compile gen-malli-kondo-config"]
    (println compile-cmd)
    (shell compile-cmd)
    (println "generate kondo config: " config-edn)
    (io/make-parents config-edn)
    (let [config (with-out-str
                   (pp/pprint (edn/read-string (:out (shell {:out :string} "node ./static/gen-malli-kondo-config.js")))))]
      (spit config-edn config))))
