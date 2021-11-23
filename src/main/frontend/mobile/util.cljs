(ns frontend.mobile.util
  (:require ["@capacitor/core" :refer [Capacitor registerPlugin]]
            ["@capacitor/splash-screen" :refer [SplashScreen]]))

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

(defn is-plugin-available? [name]
  (.isPluginAvailable Capacitor name))

(defonce folder-picker (registerPlugin "FolderPicker"))

(defn hide-splash []
  (.hide SplashScreen))

(defonce idevice-info
  (atom
   {:ipad-pro-12.9  {:width 1024 :height 1194 :statusbar 40}
    :ipad-pro-11    {:width 834  :height 1194 :statusbar 40}
    :iPadPro-9.7	{:width 768  :height 1024 :statusbar 40}
    :iPadmini-9.7   {:width 768  :height 1024 :statusbar 40}
    :iPadAir-10.5   {:width 834  :height 1112 :statusbar 40}
    :iPadAir-9.7	{:width 768  :height 1024 :statusbar 40}
    :iPad-10.2	    {:width 810  :height 1080 :statusbar 40}
    :iPad-9.7	    {:width 768  :height 1024 :statusbar 40}
    :iPhone12ProMax {:width 428  :height 926  :statusbar 47}
    :iPhone12Pro	{:width 390  :height 844  :statusbar 47}
    :iPhone12	    {:width 390  :height 844  :statusbar 47}
    :iPhone12mini   {:width 375  :height 812  :statusbar 44}
    :iPhone11ProMax {:width 414  :height 896  :statusbar 44}
    :iPhone11Pro	{:width 375  :height 812  :statusbar 44}
    :iPhone11	    {:width 414  :height 896  :statusbar 48}
    :iPhoneXSMax	{:width 414  :height 896  :statusbar 48}
    :iPhoneXS	    {:width 375  :height 812  :statusbar 48}
    :iPhoneXR	    {:width 414  :height 896  :statusbar 48}
    :iPhoneX	    {:width 375  :height 812  :statusbar 44}
    :iPhone8Plus	{:width 414  :height 736  :statusbar 20}
    :iPhone8	    {:width 375  :height 667  :statusbar 20}
    :iPhone7Plus	{:width 414  :height 736  :statusbar 20}
    :iPhone7	    {:width 375  :height 667  :statusbar 20}
    :iPhone6sPlus   {:width 414  :height 736  :statusbar 20}
    :iPhone6s	    {:width 375  :height 667  :statusbar 20}
    :iPhone6Plus	{:width 414  :height 736  :statusbar 20}
    :iPhone6	    {:width 375  :height 667  :statusbar 20}
    :iPhoneSE4.7	{:width 375  :height 667  :statusbar 20}
    :iPhoneSE4	    {:width 320  :height 568  :statusbar 20}
    :iPodtouch5th   {:width 320  :height 568  :statusbar 20}}))

