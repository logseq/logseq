(ns logseq.tasks.dev
  "Tasks for development"
  (:require [babashka.fs :as fs]
            [babashka.tasks :refer [shell]]))

(defn watch
  "Watches environment to reload cljs, css and other assets"
  []
  (shell "yarn electron-watch"))

(defn- file-modified-later-than?
  [file comparison-instant]
  (pos? (.compareTo (fs/file-time->instant (fs/last-modified-time file))
                    comparison-instant)))

;; Works whether yarn clean has been run before or not
(defn open-dev-electron-app
  "Opens dev-electron-app when watch process has built main.js"
  []
  (let [start-time (java.time.Instant/now)]
    (dotimes [_n 1000]
             (if (and (fs/exists? "static/js/main.js")
                      (file-modified-later-than? "static/js/main.js" start-time))
               (shell "yarn dev-electron-app")
               (println "Waiting for app to build..."))
             (Thread/sleep 1000))))


(defn lint
  "Run all lint tasks
  - clj-kondo lint
  - carve lint for unused vars
  - lint for vars that are too large
  - lint invalid translation entries
  - Lint datalog rules"
  []
  (doseq [cmd ["clojure -M:clj-kondo --parallel --lint src"
               "scripts/carve.clj"
               "scripts/large_vars.clj"
               "bb lang:invalid-translations"
               "scripts/lint_rules.clj"]]
    (println cmd)
    (shell cmd)))
