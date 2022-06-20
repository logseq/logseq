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
(defn open-dev-app
  "Opens dev app when watch process has built main.js"
  [cmd]
  (let [start-time (java.time.Instant/now)]
    (loop [n 1000]
      (if (and (fs/exists? "static/js/main.js")
               (file-modified-later-than? "static/js/main.js" start-time))
        (shell cmd)
        (println "Waiting for app to build..."))
      (Thread/sleep 1000)
      (when-not (or (and (fs/exists? "ios/App/App/public/static/js/main.js")
                      (file-modified-later-than? "ios/App/App/public/static/js/main.js" start-time))
                    (and (fs/exists? "android/App/src/main/assets/public/static/js/main.js")
                      (file-modified-later-than? "android/App/src/main/assets/public/static/js/main.js" start-time)))
        (recur (dec n))))))

(defn open-dev-electron-app
  "Opens dev-electron-app when watch process has built main.js"
  []
  (open-dev-app "yarn dev-electron-app"))

(defn app-watch
  "Watches environment to reload cljs, css and other assets for mobile"
  []
  (doseq [cmd ["bash scripts/set-system-env.sh"
               "yarn clean"
               "yarn app-watch"]]
    (println cmd)
    (shell cmd)))

(defn npx-cap-run-ios
  "Copy assets files to iOS build directory, and run app in Xcode"
  []
  (open-dev-app "npx cap sync ios")
  (shell "npx cap open ios"))

(defn npx-cap-run-android
  "Copy assets files to Android build directory, and run app in Android Studio"
  []
  (open-dev-app "npx cap sync android")
  (shell "npx cap open android"))

(defn run-ios-release
  "Build iOS app release"
  []
  (shell "git checkout capacitor.config.ts")
  (shell "yarn run-ios-release"))

(defn run-android-release
  "Build Android app release"
  []
  (shell "git checkout capacitor.config.ts")
  (shell "yarn run-android-release"))

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
               "bb lang:invalid-translations"]]
    (println cmd)
    (shell cmd)))
