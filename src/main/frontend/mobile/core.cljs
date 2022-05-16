(ns frontend.mobile.core
  (:require ["@capacitor/app" :refer [^js App]]
            [clojure.string :as string]
            [frontend.fs.capacitor-fs :as fs]
            [frontend.handler.editor :as editor-handler]
            [frontend.mobile.deeplink :as deeplink]
            [frontend.mobile.intent :as intent]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.util :as util]))

(def *url (atom nil))
;; FIXME: `appUrlOpen` are fired twice when receiving a same intent. 
;; The following two variable atoms are used to compare whether
;; they are from the same intent share.
(def *last-shared-url (atom nil))
(def *last-shared-seconds (atom 0))

(defn- ios-init
  "Initialize iOS-specified event listeners"
  []
  (let [path (fs/iOS-ensure-documents!)]
    (println "iOS container path: " path))

  (.addEventListener js/window
                     "load"
                     (fn [_event]
                       (when @*url
                         (js/setTimeout #(deeplink/deeplink @*url)
                                        1000))))

  (.removeAllListeners mobile-util/file-sync)

  (.addListener mobile-util/file-sync "debug"
                (fn [event]
                  (js/console.log "🔄" event))))

(defn- android-init
  "Initialize Android-specified event listeners"
  []
  ;; patch back navigation
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
                       (js/window.history.back)))))

  (.addEventListener js/window "sendIntentReceived"
                       #(intent/handle-received)))

(defn- general-init
  "Initialize event listeners used by both iOS and Android"
  []
  (.addListener App "appUrlOpen"
                (fn [^js data]
                  (when-let [url (.-url data)]
                    (if-not (= (.-readyState js/document) "complete")
                      (reset! *url url)
                      (when-not (and (= @*last-shared-url url)
                                     (<= (- (.getSeconds (js/Date.)) @*last-shared-seconds) 1))
                        (reset! *last-shared-url url)
                        (reset! *last-shared-seconds (.getSeconds (js/Date.)))
                        (deeplink/deeplink url))))))

  (.addListener mobile-util/fs-watcher "watcher"
                (fn [event]
                  (state/pub-event! [:file-watcher/changed event])))

  (.addEventListener js/window "statusTap"
                     #(util/scroll-to-top true))

  (.addListener App "appStateChange"
                (fn [^js state]
                  (when (state/get-current-repo)
                    (let [is-active? (.-isActive state)]
                      (when-not is-active?
                        (editor-handler/save-current-block!)))))))

(defn init! []
  (when (mobile-util/native-android?)
    (android-init))

  (when (mobile-util/native-ios?)
    (ios-init))

  (when (mobile-util/is-native-platform?)
    (general-init)))
