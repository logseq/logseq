(ns frontend.mobile.audio-recorder-test
  (:require [cljs.test :refer [is testing]]
            [frontend.handler.notification :as notification]
            [frontend.mobile.audio-recorder :as audio-recorder]
            [frontend.test.helper :include-macros true :refer [deftest-async]]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(deftest-async start-recording-shows-warning-when-microphone-permission-denied
  (testing "Shows actionable warning and closes recorder popup when mic permission is denied"
    (let [warning (atom nil)
          popup-hidden? (atom false)]
      (p/with-redefs
       [notification/show! (fn [content & _]
                             (reset! warning content))
        shui/popup-hide! (fn []
                           (reset! popup-hidden? true))]
        (p/let [_ (audio-recorder/start-recording! #js {:startRecording
                                                        (fn []
                                                          (p/rejected (js/Error. "Error accessing the microphone: Permission denied")))})]
          (is (string? @warning))
          (is (re-find #"Settings" @warning))
          (is (true? @popup-hidden?)))))))

(deftest-async start-recording-does-not-show-warning-for-non-permission-errors
  (testing "Avoids permission warning for unrelated start recording failures"
    (let [warning (atom nil)
          popup-hidden? (atom false)]
      (p/with-redefs
       [notification/show! (fn [content & _]
                             (reset! warning content))
        shui/popup-hide! (fn []
                           (reset! popup-hidden? true))]
        (p/let [_ (audio-recorder/start-recording! #js {:startRecording
                                                        (fn []
                                                          (p/rejected (js/Error. "Error: No microphone device found")))})]
          (is (nil? @warning))
          (is (false? @popup-hidden?)))))))
