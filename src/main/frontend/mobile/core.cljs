(ns frontend.mobile.core
  (:require [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            ["@capacitor/app" :refer [^js App]]
            ["@capacitor/keyboard" :refer [^js Keyboard]]
            ;; ["@capacitor/keyboard" :refer [^js Keyboard]]
            #_:clj-kondo/ignore
            ["@capacitor/status-bar" :refer [^js StatusBar]]
            [frontend.mobile.intent :as intent]
            [clojure.string :as string]
            [frontend.fs.capacitor-fs :as fs]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.user :as user-handler]
            [frontend.util :as util]))

(defn- ios-init
  []
  (let [path (fs/iOS-ensure-documents!)]
    (println "iOS container path: " path))

  ;; Keyboard watcher
  ;; (.addListener Keyboard "keyboardWillShow"
  ;;               #(state/pub-event! [:mobile/keyboard-will-show]))
)

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
    (ios-init)
    (.removeAllListeners mobile-util/file-sync)

    (.addListener App "appUrlOpen"
                  (fn [^js data]
                    (when-let [url (.-url data)]
                      ;; TODO: handler other logseq:// URLs
                      (when (string/starts-with? url "logseq://auth-callback")
                        (let [parsed-url (js/URL. url)
                              code (.get (.-searchParams parsed-url) "code")]
                          (user-handler/login-callback code))))))

    (.addListener mobile-util/file-sync "debug"
                  (fn [event]
                    (js/console.log "🔄" event))))

  (when (mobile-util/native-platform?)
    (.addListener mobile-util/fs-watcher "watcher"
                  (fn [event]
                    (state/pub-event! [:file-watcher/changed event])))

    (.addEventListener js/window "statusTap"
                       #(util/scroll-to-top true))

    (.addListener App "appStateChange"
                  (fn [^js state]
                    (when (state/get-current-repo)
                      (let [is-active? (.-isActive state)]
                        (when is-active?
                          (editor-handler/save-current-block!))))))

    (.addListener Keyboard "keyboardWillShow"
                  (fn [^js info]
                    (let [keyboard-height (.-keyboardHeight info)]
                      (state/pub-event! [:mobile/keyboard-will-show keyboard-height]))))

    (.addListener Keyboard "keyboardWillHide"
                  (fn []
                    (state/pub-event! [:mobile/keyboard-will-hide])))
    
    (.addEventListener js/window "sendIntentReceived"
                       #(intent/handle-received))))
