(ns logseq.tasks.dev.mobile
  "Tasks for mobile development"
  (:require [babashka.tasks :refer [shell]]
            [babashka.fs :as fs]
            [clojure.string :as string]
            [logseq.tasks.util :as task-util]))

(defn- open-dev-app
  "Opens mobile app when watch process has built main.js"
  [cmd]
  (let [start-time (java.time.Instant/now)]
    (loop [n 1000]
      (if (and (fs/exists? "static/js/main.js")
               (task-util/file-modified-later-than? "static/js/main.js" start-time))
        (shell cmd)
        (println "Waiting for app to build..."))
      (Thread/sleep 1000)
      (when-not (or (and (fs/exists? "ios/App/App/public/static/js/main.js")
                      (task-util/file-modified-later-than? "ios/App/App/public/static/js/main.js" start-time))
                    (and (fs/exists? "android/App/src/main/assets/public/static/js/main.js")
                      (task-util/file-modified-later-than? "android/App/src/main/assets/public/static/js/main.js" start-time)))
        (recur (dec n))))))

(defn- set-system-env
  "Updates capacitor.config.ts serve url with IP from ifconfig"
  []
  (let [ip (string/trim (:out (shell {:out :string} "ipconfig getifaddr en0")))
        logseq-app-server-url (format "%s://%s:%s" "http" ip "3001")]
    (println "Server URL:" logseq-app-server-url)
    (shell "git checkout capacitor.config.ts")
    (let [new-body (-> (slurp "capacitor.config.ts")
                       (string/replace "// , server:" " , server:")
                       (string/replace "//    url:" "    url:")
                       (string/replace "process.env.LOGSEQ_APP_SERVER_URL"
                                       (pr-str logseq-app-server-url))
                       (string/replace "//    cleartext:" "    cleartext:")
                       (string/replace "// }" " }"))]
      (spit "capacitor.config.ts" new-body))))


(defn app-watch
  "Watches environment to reload cljs, css and other assets for mobile"
  []
  (println "set-system-env")
  (set-system-env)
  (doseq [cmd ["yarn clean"
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
