(ns logseq.tasks.dev
  "Tasks for general development. For desktop or mobile development see their
  namespaces"
  (:require [babashka.process :refer [shell]]
            [babashka.fs :as fs]
            [logseq.tasks.util :as task-util]
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

(defn build-publishing-frontend
  "Builds frontend release publishing asset when files have changed"
  [& _args]
  (if-let [_files (and (not (System/getenv "SKIP_ASSET"))
                       (seq (set (fs/modified-since (fs/file "static/js/publishing/main.js")
                                                    (fs/glob "." "{src/main,deps/graph-parser/src}/**")))))]
    (do
      (println "Building publishing js asset...")
      (shell "clojure -M:cljs release publishing"))
    (println "Publishing js asset is up to date")))

(defn publishing-backend
  "Builds publishing backend and copies over supporting frontend assets"
  [& args]
  (apply shell {:dir "scripts"}
         "yarn -s nbb-logseq -cp src -m logseq.tasks.dev.publishing"
         (into ["static"] args)))

(defn watch-publishing-frontend
  [& _args]
  (shell "clojure -M:cljs watch publishing"))

(defn watch-publishing-backend
  "Builds publishing backend once watch-publishing-frontend has built initial frontend"
  [& args]
  (let [start-time (java.time.Instant/now)]
    (Thread/sleep 3000)
    (loop [n 1000]
      (if (and (fs/exists? "static/js/publishing/main.js")
               (task-util/file-modified-later-than? "static/js/publishing/main.js" start-time))
        (apply publishing-backend args)
        (do (println "Waiting for publishing frontend to build...")
            (Thread/sleep 1000)
            (recur (inc n)))))))