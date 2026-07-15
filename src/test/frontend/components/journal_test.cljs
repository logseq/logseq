(ns frontend.components.journal-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [deftest is]]
            [clojure.string :as string]))

(defn- journal-source
  []
  (.toString
   (fs/readFileSync
    (node-path/join (.cwd js/process) "src/main/frontend/components/journal.cljs")
    "utf8")))

(deftest journals-do-not-hydrate-every-page-before-rendering
  (let [source (journal-source)]
    (is (not (string/includes? source "p/all (map #(db-async/<get-block"))
        "The journal list must render ids and let visible pages load their own windows.")))
