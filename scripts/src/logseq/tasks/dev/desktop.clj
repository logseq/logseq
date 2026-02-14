(ns logseq.tasks.dev.desktop
  "Tasks for desktop (electron) development"
  (:require [babashka.tasks :refer [shell]]
            [babashka.fs :as fs]
            [logseq.tasks.util :as task-util]))

(defn watch
  "Watches environment to reload cljs, css and other assets"
  []
  (shell "yarn electron-watch"))

(defn- app-server-ready?
  []
  (try
    (let [conn ^java.net.HttpURLConnection (.openConnection (java.net.URL. "http://localhost:3001"))]
      (try
        (.setConnectTimeout conn 500)
        (.setReadTimeout conn 500)
        (.setRequestMethod conn "HEAD")
        (.connect conn)
        (pos? (.getResponseCode conn))
        (finally
          (.disconnect conn))))
    (catch Exception _ false)))

(defn open-dev-electron-app
  "Opens dev-electron-app when watch process has built main.js"
  []
  (let [start-time (java.time.Instant/now)
        open-cmd (or (System/getenv "LOGSEQ_DEV_ELECTRON_CMD")
                     "yarn dev-electron-app")]
    (loop [n 1000]
      (cond
        (zero? n)
        (println "Timed out waiting for app to build.")

        (or (and (fs/exists? "static/js/main.js")
                 (task-util/file-modified-later-than? "static/js/main.js" start-time))
            (app-server-ready?))
        (shell open-cmd)

        :else
        (do
          (println "Waiting for app to build...")
          (Thread/sleep 1000)
          (recur (dec n)))))))
