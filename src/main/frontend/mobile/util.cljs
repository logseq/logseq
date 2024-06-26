(ns frontend.mobile.util
  (:require ["@capacitor/core" :refer [Capacitor registerPlugin ^js Plugins]]
            ["@capacitor/splash-screen" :refer [SplashScreen]]
            ["@logseq/capacitor-file-sync" :refer [FileSync]]
            [clojure.string :as string]
            [promesa.core :as p]
            [goog.object :as gobj]))

(defn platform []
  (.getPlatform Capacitor))

(defn native-platform? []
  (.isNativePlatform Capacitor))

(defn native-ios? []
  (and (native-platform?)
       (= (platform) "ios")))

(defn native-android? []
  (and (native-platform?)
       (= (platform) "android")))

(defn convert-file-src [path-str]
  (.convertFileSrc Capacitor path-str))

(defonce folder-picker (registerPlugin "FolderPicker"))
(when (native-ios?)
  (defonce ios-utils (registerPlugin "Utils"))
  (defonce ios-file-container (registerPlugin "FileContainer")))

;; NOTE: both iOS and android share the same API
(when (native-platform?)
  (defonce file-sync FileSync)
  (defonce fs-watcher (registerPlugin "FsWatcher")))

(defn hide-splash []
  (.hide SplashScreen))

(defn get-idevice-model
  []
  (when (native-ios?)
    (let [width (.-width js/screen)
          height (.-height js/screen)
          landscape? (> width height)
          [width height] (if landscape? [height width] [width height])]
      [(case [width height]
         ;; The following list is from:
         ;; - https://useyourloaf.com/blog/ipad-2024-screen-sizes/
         ;; - https://useyourloaf.com/blog/iphone-15-screen-sizes/
         [320 568] "iPhoneSE4"
         [375 667] "iPhone8"
         [375 812] "iPhoneX"
         [390 844] "iPhone12"
         [414 736] "iPhone8Plus"
         [414 896] "iPhone11"
         [428 926] "iPhone13ProMax"
         [476 847] "iPhone7Plus"
         [393 852] "iPhone14Pro"
         [430 932] "iPhone14ProMax"
         [744 1133] "iPadmini8.3"
         [768 1024] "iPad9.7"
         [810 1080] "iPad10.2"
         [820 1180] "iPad10.9"
         [834 1112] "iPadAir10.5"
         [834 1194] "iPadPro11"
         [1024 1366] "iPadPro12.9"
         [1032 1376] "iPadPro13(M4)"
         [834 1210]  "iPadPro11(M4)"
         "Not a known Apple device!")
       landscape?])))

(defn native-iphone-without-notch?
  []
  (when-let [model (get-idevice-model)]
    (string/starts-with? (first model) "iPhone8")))

(defn native-iphone?
  []
  (when-let [model (get-idevice-model)]
    (and (string/starts-with? (first model) "iPhone")
         (not (string/starts-with? (first model) "iPhone8")))))

(defn native-ipad?
  []
  (when-let [model (get-idevice-model)]
    (string/starts-with? (first model) "iPad")))

(defn check-ios-zoomed-display
  "Detect whether iOS device is in Zoom Display"
  []
  (p/let [is-zoomed? (p/chain (.isZoomed ios-utils)
                              #(js->clj % :keywordize-keys true))]
    (when (:isZoomed is-zoomed?)
      (let [^js cl (.-classList js/document.documentElement)]
        (.add cl "is-zoomed-native-ios")))))

(defn in-iCloud-container-path?
  "Check whether `path' is logseq's iCloud container path on iOS"
  [path]
  (string/includes? path "/iCloud~com~logseq~logseq/"))

(defn is-iCloud-container-path?
  "Check whether `path' is iCloud container path on iOS"
  [path]
  (re-matches #"/iCloud~com~logseq~logseq/Documents/?$" path))

(defn app-active?
  "Whether the app is active. This function returns a promise."
  []
  (let [app ^js (gobj/get Plugins "App")]
    (p/let [state (.getState app)]
      (gobj/get state "isActive"))))
