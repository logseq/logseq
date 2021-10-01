(ns frontend.mobile.util
  (:require ["@capacitor/core" :refer [Capacitor registerPlugin]]
            ["@capacitor/splash-screen" :refer [SplashScreen]]))

(defn platform []
  (.getPlatform Capacitor))

(defn is-native-platform? []
  (.isNativePlatform Capacitor))

(defn convert-file-src [path-str]
  (.convertFileSrc Capacitor path-str))

(defn is-plugin-available? [name]
  (.isPluginAvailable Capacitor name))

(defonce folder-picker (registerPlugin "FolderPicker"))

(defn hide-splash []
  (.hide SplashScreen))
