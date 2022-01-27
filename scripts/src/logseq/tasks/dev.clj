(ns logseq.tasks.dev
  "Tasks for development"
  (:require [babashka.fs :as fs]
            [babashka.tasks :refer [shell]]))

(defn watch
  "Watches environment to reload cljs, css and other assets"
  []
  (shell "yarn watch"))

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

;; Thanks to https://gist.github.com/borkdude/35bc0a20bd4c112dec2c5645f67250e3
;; for this idea
(defn electron-dev
  "Start electron dev that includes watching assets and opening dev app"
  []
  (shell "bb run --parallel -dev:electron-dev"))
