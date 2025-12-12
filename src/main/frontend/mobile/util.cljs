(ns frontend.mobile.util
  (:require ["@capacitor/core" :refer [Capacitor registerPlugin]]
            ["@capacitor/splash-screen" :refer [SplashScreen]]
            [clojure.string :as string]
            [goog.dom :as gdom]
            [promesa.core :as p]))

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

(defn plugin-available?
  "Check if a native plugin is available from Capacitor.Plugins."
  [name]
  (boolean (aget (.-Plugins js/Capacitor) name)))

(defonce folder-picker (registerPlugin "FolderPicker"))
(defonce ui-local (registerPlugin "UILocal"))
(defonce native-top-bar (when (and (native-platform?)
                                   (plugin-available? "NativeTopBarPlugin"))
                          (registerPlugin "NativeTopBarPlugin")))
(defonce native-bottom-sheet (when (and (native-platform?)
                                        (plugin-available? "NativeBottomSheetPlugin"))
                               (registerPlugin "NativeBottomSheetPlugin")))
(defonce native-editor-toolbar (when (and (native-platform?)
                                          (plugin-available? "NativeEditorToolbarPlugin"))
                                 (registerPlugin "NativeEditorToolbarPlugin")))
(defonce native-selection-action-bar (when (and (native-platform?)
                                                (plugin-available? "NativeSelectionActionBarPlugin"))
                                       (registerPlugin "NativeSelectionActionBarPlugin")))
(defonce ios-utils (when (native-ios?) (registerPlugin "Utils")))
(defonce android-utils (when (native-android?) (registerPlugin "Utils")))

(defonce ios-content-size-listener nil)

(defn- set-ios-font-scale!
  [scale]
  (let [^js style (.-style js/document.documentElement)
        scale (or scale 1)]
    (.setProperty style "--ls-mobile-font-scale" (str scale))))

(defn sync-ios-content-size!
  "Fetch the current iOS Dynamic Type scale and sync it to CSS variables.
   Also attaches a listener to keep it in sync when the user changes the setting."
  []
  (when (native-ios?)
    (let [apply-scale! (fn [payload]
                         (let [payload (js->clj payload :keywordize-keys true)]
                           (set-ios-font-scale! (:scale payload))))]
      (p/let [payload (p/chain (.getContentSize ^js ios-utils)
                               #(js->clj % :keywordize-keys true))]
        (set-ios-font-scale! (:scale payload)))
      (when (nil? ios-content-size-listener)
        (set! ios-content-size-listener
              (.addListener ^js ios-utils "contentSizeCategoryChanged"
                            (fn [^js payload]
                              (apply-scale! payload))))))))

(defn hide-splash []
  (.hide SplashScreen))

(defn set-ios-interface-style!
  [mode system?]
  (when (native-ios?)
    (p/do!
     (.setInterfaceStyle ^js ios-utils (clj->js {:mode mode
                                                 :system system?})))))

(defn set-android-interface-style!
  [mode system?]
  (when (native-android?)
    (p/do!
     (.setInterfaceStyle ^js android-utils (clj->js {:mode mode
                                                     :system system?})))))

(defn set-native-interface-style!
  "Sync native light/dark/system appearance with Logseq theme mode."
  [mode system?]
  (cond
    (native-ios?) (set-ios-interface-style! mode system?)
    (native-android?) (set-android-interface-style! mode system?)
    :else nil))

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
  (p/let [is-zoomed? (p/chain (.isZoomed ^js ios-utils)
                              #(js->clj % :keywordize-keys true))]
    (when (:isZoomed is-zoomed?)
      (let [^js cl (.-classList js/document.documentElement)]
        (.add cl "is-zoomed-native-ios")))))

(defn in-iCloud-container-path?
  "Check whether `path' is logseq's iCloud container path on iOS"
  [path]
  (string/includes? path "/iCloud~com~logseq~logseq/"))

(defn alert
  "Show a native drop alert on iOS.
   Options: :title or :message (required), :subtitle, :type (info/success/warning/error),
   :icon (SF Symbols name), :icon-color (hex string), :tint-color (alias for icon tint),
   :position (:top/:bottom), :duration (seconds), :accessibility (VoiceOver text)."
  [{:keys [title message subtitle type icon icon-color tint-color position duration accessibility]}]
  (let [title (or title message)
        type-str (cond
                   (keyword? type) (name type)
                   (string? type) type)
        position-str (cond
                       (keyword? position) (name position)
                       (string? position) position)
        payload (cond-> {:title title}
                  subtitle (assoc :subtitle subtitle)
                  type-str (assoc :type type-str)
                  icon (assoc :icon icon)
                  icon-color (assoc :iconColor icon-color)
                  tint-color (assoc :tintColor tint-color)
                  position-str (assoc :position position-str)
                  duration (assoc :duration duration)
                  accessibility (assoc :accessibility accessibility))]
    (cond
      (not title) (p/rejected (js/Error. "title is required"))
      (native-platform?) (.alert ^js ui-local (clj->js payload))
      :else (p/resolved nil))))

(defn hide-alert []
  (if (native-platform?)
    (.hideAlert ^js ui-local)
    (p/resolved nil)))

(def mobile-keyboard-anchor-id "ls-mobile-kb-anchor")
(defonce *hidden-input-timeout (atom nil))
(defn mobile-focus-hidden-input
  []
  (when-let [t @*hidden-input-timeout]
    (js/clearTimeout t))
  (when (native-platform?)
    (when-let [^js anchor (gdom/getElement mobile-keyboard-anchor-id)]
      (reset! *hidden-input-timeout (js/setTimeout #(.blur anchor) 200))
      (.focus anchor))))

(comment
  (defn app-active?
    "Whether the app is active. This function returns a promise."
    []
    (let [app ^js (gobj/get Plugins "App")]
      (p/let [state (.getState app)]
        (gobj/get state "isActive")))))
