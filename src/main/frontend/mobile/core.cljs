(ns frontend.mobile.core
  (:require [frontend.mobile.util :as mobile-util]
            ["@capacitor/app" :refer [^js App]]
            [reitit.frontend.easy :as rfe]
            [clojure.string :as string]))


(defn init!
  []
  ;; patch back navigation
  (when (mobile-util/native-android?)
    (.addListener App "backButton"
                  #(let [href js/window.location.href]
                     (if (or (string/ends-with? href "#/")
                             (string/ends-with? href "/"))
                       (.exitApp App)
                       (js/window.history.back))))))
