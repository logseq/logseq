(ns frontend.handler.events-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.rtc.download-progress :as download-progress]
            [frontend.mobile.util :as mobile-util]
            [logseq.shui.ui :as shui]))

(deftest download-graph-progress-surface-test
  (let [calls (atom [])]
    (testing "web mobile uses a centered dialog"
      (with-redefs [mobile-util/native-platform? (constantly false)
                    shui/dialog-open! (fn [& args] (swap! calls conj [:dialog args]))
                    shui/dialog-close! (fn [& args] (swap! calls conj [:dialog-close args]))
                    shui/popup-show! (fn [& args] (swap! calls conj [:popup args]))
                    shui/popup-hide! (fn [& args] (swap! calls conj [:popup-hide args]))]
        (download-progress/show! "My notes")
        (download-progress/hide!)
        (is (= [:dialog :dialog-close] (mapv first @calls)))))
    (testing "native mobile keeps the native popup"
      (reset! calls [])
      (with-redefs [mobile-util/native-platform? (constantly true)
                    shui/dialog-open! (fn [& args] (swap! calls conj [:dialog args]))
                    shui/dialog-close! (fn [& args] (swap! calls conj [:dialog-close args]))
                    shui/popup-show! (fn [& args] (swap! calls conj [:popup args]))
                    shui/popup-hide! (fn [& args] (swap! calls conj [:popup-hide args]))]
        (download-progress/show! "My notes")
        (download-progress/hide!)
        (is (= [:popup :popup-hide] (mapv first @calls)))))))
