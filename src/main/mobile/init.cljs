(ns mobile.init
  "Main ns for handling mobile start"
  (:require ["@capacitor/app" :refer [^js App]]
            ["@capacitor/keyboard" :refer [^js Keyboard]]
            ["@capacitor/network" :refer [^js Network]]
            ["@capgo/capacitor-navigation-bar" :refer [^js NavigationBar]]
            [clojure.string :as string]
            [frontend.handler.editor :as editor-handler]
            [frontend.mobile.flows :as mobile-flows]
            [frontend.mobile.intent :as intent]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [logseq.shui.dialog.core :as shui-dialog]
            [mobile.components.ui :as cc-ui]
            [mobile.deeplink :as deeplink]
            [mobile.state :as mobile-state]
            [promesa.core :as p]))

;; FIXME: `appUrlOpen` are fired twice when receiving a same intent.
;; The following two variable atoms are used to compare whether
;; they are from the same intent share.
(def *last-shared-url (atom nil))
(def *last-shared-seconds (atom 0))

(defn- ios-init!
  "Initialize iOS-specified event listeners"
  []
  (mobile-util/check-ios-zoomed-display))

(defn- android-init!
  "Initialize Android-specified event listeners"
  []
  (js/setTimeout
   #(.setNavigationBarColor NavigationBar #js {:color "transparent"}) 128)
  (.addListener App "backButton"
                (fn []
                  (when (false?
                         (cond
                           ;; lightbox
                           (js/document.querySelector ".pswp")
                           (some-> js/window.photoLightbox (.destroy))

                           (shui-dialog/has-modal?)
                           (shui-dialog/close!)

                           (not-empty @mobile-state/*popup-data)
                           (mobile-state/set-popup! nil)

                           (not-empty (state/get-selection-blocks))
                           (editor-handler/clear-selection!)

                           (seq @mobile-state/*modal-blocks)
                           (mobile-state/close-block-modal!)

                           ;; TODO: move ui-related code to mobile events
                           (not-empty (cc-ui/get-modal))
                           (cc-ui/close-modal!)

                           (state/editing?)
                           (editor-handler/escape-editing)

                           :else false))
                    (prn "TODO: handle back button in Android")))))

(defn- app-state-change-handler
  "NOTE: don't add more logic in this listener, use mobile-flows instead"
  [^js state]
  (log/info :app-state-change-handler state
            :app-active? (.-isActive state)
            :worker-client-id @state/*db-worker-client-id)
  (when (state/get-current-repo)
    (let [is-active? (.-isActive state)]
      (if (not is-active?)
        (editor-handler/save-current-block!)
        ;; check whether db-worker is available
        (when-let [client-id @state/*db-worker-client-id]
          (when @state/*db-worker
            (js/navigator.locks.request client-id #js {:mode "exclusive"
                                                       :ifAvailable true}
                                        (fn [lock]
                                          (when lock
                                            ;; lock acquired, meaning the worker has terminated
                                            (js/window.location.reload)))))))))
  (reset! mobile-flows/*mobile-app-state (.-isActive state)))

(defn- general-init!
  "Initialize event listeners used by both iOS and Android"
  []
  (.addListener App "appUrlOpen"
                (fn [^js data]
                  (log/info ::app-url-open data)
                  (p/then
                   state/app-ready-promise
                   (fn []
                     (when-let [url (.-url data)]
                       (when (or
                              (string/starts-with? url "https://logseq.com/mobile/")
                              (string/starts-with? url "logseq://mobile/")
                              (not (and (= @*last-shared-url url)
                                        (<= (- (.getSeconds (js/Date.)) @*last-shared-seconds) 1))))
                         (reset! *last-shared-url url)
                         (reset! *last-shared-seconds (.getSeconds (js/Date.)))
                         (deeplink/deeplink url)))))))

  (.addListener Keyboard "keyboardWillShow"
                (fn [^js info]
                  (let [keyboard-height (.-keyboardHeight info)]
                    (state/pub-event! [:mobile/keyboard-will-show keyboard-height]))))

  (.addListener Keyboard "keyboardWillHide"
                (fn []
                  (state/pub-event! [:mobile/keyboard-will-hide])))

  (.addEventListener js/window "statusTap"
                     #(util/scroll-to-top true))

  (.addListener App "appStateChange" app-state-change-handler)
  (.addListener Network "networkStatusChange" #(reset! mobile-flows/*mobile-network-status %)))

(defn init! []
  (.addEventListener js/window "sendIntentReceived" intent/handle-received)

  ;; handle share for code start
  (intent/handle-received)

  (reset! mobile-flows/*network Network)

  (when (mobile-util/native-android?)
    (android-init!))

  (when (mobile-util/native-ios?)
    (ios-init!))

  (when (mobile-util/native-platform?)
    (general-init!)))

(defn keyboard-hide
  []
  (.hide Keyboard))

(comment
  (defn keyboard-show
    []
    (.show Keyboard)))
