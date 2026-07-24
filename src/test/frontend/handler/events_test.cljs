(ns frontend.handler.events-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.handler.events :as events]
            [frontend.mobile.util :as mobile-util]
            [logseq.shui.ui :as shui]))

(deftest download-graph-progress-surface-test
  (let [show-f (some-> (resolve 'frontend.handler.events/show-download-graph-progress!)
                       deref)
        hide-f (some-> (resolve 'frontend.handler.events/hide-download-graph-progress!)
                       deref)
        calls (atom [])]
    (is (fn? show-f) "Download progress should have a platform-aware presentation")
    (is (fn? hide-f) "Download progress should close its platform-specific presentation")
    (when (and show-f hide-f)
      (testing "web mobile uses a centered dialog"
        (with-redefs [mobile-util/native-platform? (constantly false)
                      shui/dialog-open! (fn [& args] (swap! calls conj [:dialog args]))
                      shui/dialog-close! (fn [& args] (swap! calls conj [:dialog-close args]))
                      shui/popup-show! (fn [& args] (swap! calls conj [:popup args]))
                      shui/popup-hide! (fn [& args] (swap! calls conj [:popup-hide args]))]
          (show-f "My notes")
          (hide-f)
          (is (= [:dialog :dialog-close] (mapv first @calls)))))
      (testing "native mobile keeps the native popup"
        (reset! calls [])
        (with-redefs [mobile-util/native-platform? (constantly true)
                      shui/dialog-open! (fn [& args] (swap! calls conj [:dialog args]))
                      shui/dialog-close! (fn [& args] (swap! calls conj [:dialog-close args]))
                      shui/popup-show! (fn [& args] (swap! calls conj [:popup args]))
                      shui/popup-hide! (fn [& args] (swap! calls conj [:popup-hide args]))]
          (show-f "My notes")
          (hide-f)
          (is (= [:popup :popup-hide] (mapv first @calls))))))))
