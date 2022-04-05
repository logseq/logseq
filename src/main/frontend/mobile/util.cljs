(ns frontend.mobile.util
  (:require ["@capacitor/core" :refer [Capacitor registerPlugin]]
            ["@capacitor/splash-screen" :refer [SplashScreen]]
            [clojure.string :as string]))

(defn platform []
  (.getPlatform Capacitor))

(defn is-native-platform? []
  (.isNativePlatform Capacitor))

(defn native-ios? []
  (and (is-native-platform?)
       (= (platform) "ios")))

(defn native-android? []
  (and (is-native-platform?)
       (= (platform) "android")))

(defn convert-file-src [path-str]
  (.convertFileSrc Capacitor path-str))

(defonce folder-picker (registerPlugin "FolderPicker"))
(when (native-ios?)
  (defonce download-icloud-files (registerPlugin "DownloadiCloudFiles"))
  (defonce ios-file-container (registerPlugin "FileContainer")))
;; NOTE: both iOS and android share the same FsWatcher API
(when (is-native-platform?)
  (defonce fs-watcher (registerPlugin "FsWatcher")))

(defn sync-icloud-repo [repo-dir]
  (let [repo-name (-> (string/split repo-dir "Documents/")
                      last
                      string/trim
                      js/decodeURI)]
    (.syncGraph download-icloud-files
                (clj->js {:graph repo-name}))))

(defn hide-splash []
  (.hide SplashScreen))

(def idevice-info
  (atom
   {:iPadPro12.9    {:width 1024 :height 1366 :statusbar 40}
    :iPadPro11      {:width 834  :height 1194 :statusbar 40}
    :iPadPro10.5    {:width 834  :height 1112 :statusbar 40}
    :iPadAir10.5    {:width 834  :height 1112 :statusbar 40}
    :iPadAir10.9    {:width 820  :height 1180 :statusbar 40}
    :iPad10.2       {:width 810  :height 1080 :statusbar 40}
    :iPadPro9.7     {:width 768  :height 1024 :statusbar 40}
    :iPadmini9.7    {:width 768  :height 1024 :statusbar 40}
    :iPadAir9.7     {:width 768  :height 1024 :statusbar 40}
    :iPad9.7        {:width 768  :height 1024 :statusbar 40}
    :iPadmini8.3        {:width 744  :height 1133 :statusbar 40}
    :iPhone7Plus        {:width 476  :height 847  :statusbar 20}
    :iPhone6sPlus   {:width 476  :height 847  :statusbar 20}
    :iPhone6Plus        {:width 476  :height 847  :statusbar 20}
    :iPhone13ProMax {:width 428  :height 926  :statusbar 47}
    :iPhone12ProMax {:width 428  :height 926  :statusbar 47}
    :iPhone11ProMax {:width 414  :height 896  :statusbar 44}
    :iPhone11       {:width 414  :height 896  :statusbar 48}
    :iPhoneXSMax        {:width 414  :height 896  :statusbar 48}
    :iPhoneXR       {:width 414  :height 896  :statusbar 48}
    :iPhone8Plus        {:width 414  :height 736  :statusbar 20}
    :iPhone13Pro        {:width 390  :height 844  :statusbar 47}
    :iPhone13       {:width 390  :height 844  :statusbar 47}
    :iPhone12       {:width 390  :height 844  :statusbar 47}
    :iPhone12Pro        {:width 390  :height 844  :statusbar 47}
    :iPhone11Pro        {:width 375  :height 812  :statusbar 44}
    :iPhoneXS       {:width 375  :height 812  :statusbar 44}
    :iPhoneX        {:width 375  :height 812  :statusbar 44}
    :iPhone8        {:width 375  :height 667  :statusbar 20}
    :iPhone7        {:width 375  :height 667  :statusbar 20}
    :iPhone6s       {:width 375  :height 667  :statusbar 20}
    :iPhone6        {:width 375  :height 667  :statusbar 20}
    :iPhone13mini   {:width 375  :height 812  :statusbar 44}
    :iPhone12mini   {:width 375  :height 812  :statusbar 44}
    :iPhoneSE4      {:width 320  :height 568  :statusbar 20}
    :iPodtouch5     {:width 320  :height 568  :statusbar 20}}))

(defn get-idevice-model
  []
  (when (native-ios?)
    (let [width (.-width js/screen)
          height (.-height js/screen)
          landscape? (> width height)
          [width height] (if landscape? [height width] [width height])]
      [(case [width height]
         [320 568] "iPhoneSE4"
         [375 667] "iPhone8"
         [375 812] "iPhoneX"
         [390 844] "iPhone12"
         [414 736] "iPhone8Plus"
         [414 896] "iPhone11"
         [428 926] "iPhone13ProMax"
         [476 847] "iPhone7Plus"
         [744 1133] "iPadmini8.3"
         [768 1024] "iPad9.7"
         [810 1080] "iPad10.2"
         [820 1180] "iPad10.9"
         [834 1112] "iPadAir10.5"
         [834 1194] "iPadPro11"
         [1024 1366] "iPadPro12.9"
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

(defn get-idevice-statusbar-height
  []
  (let [[model landscape?] (get-idevice-model)
        model (when-not (= model "Not a known Apple device!")
                (keyword model))]
    (if (and model landscape?)
      20
      (:statusbar (model @idevice-info)))))
