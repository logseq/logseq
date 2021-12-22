(ns frontend.mobile.core
  (:require [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            ["@capacitor/app" :refer [^js App]]
            ["@capacitor/keyboard" :refer [^js Keyboard]]
            [reitit.frontend.easy :as rfe]
            [clojure.string :as string]
            [frontend.handler.notification :as notification]
            [frontend.fs.capacitor-fs :as fs]))

(defn init!
  []
  ;; patch back navigation
  (when (mobile-util/native-android?)
    (.addListener App "backButton"
                  #(let [href js/window.location.href]
                     (when (true? (cond
                                    (state/get-left-sidebar-open?)
                                    (state/set-left-sidebar-open! false)

                                    (state/settings-open?)
                                    (state/close-settings!)

                                    (state/modal-opened?)
                                    (state/close-modal!)

                                    :else true))

                       (if (or (string/ends-with? href "#/")
                               (string/ends-with? href "/")
                               (not (string/includes? href "#/")))
                         (.exitApp App)
                         (js/window.history.back))))))
  (when (mobile-util/native-ios?)
    (let [path (fs/iOS-ensure-documents!)]
      (println "iOS container path: " path))
    ;; keyboard watcher
    (let [*pre-open? (volatile! nil)]
      (.addListener Keyboard "keyboardWillShow" #(when (state/get-left-sidebar-open?)
                                                   (state/set-left-sidebar-open! false)
                                                   (vreset! *pre-open? true)))
      (.addListener Keyboard "keyboardDidHide" #(when (true? @*pre-open?)
                                                  (state/set-left-sidebar-open! true)
                                                  (vreset! *pre-open? nil))))))
