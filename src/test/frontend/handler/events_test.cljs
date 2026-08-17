(ns frontend.handler.events-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.rtc.download-progress :as download-progress]
            [frontend.handler.events :as events]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
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

(deftest graph-sync-context-with-nil-worker-does-not-throw
  (let [previous-worker @state/*db-worker
        handler (get @@#'events/event-definitions :graph/sync-context)]
    (is (fn? handler) ":graph/sync-context should be registered")
    (reset! state/*db-worker nil)
    (try
      (is (nil? (handler [:graph/sync-context]))
          "Sync-context must no-op when the worker is missing instead of crashing All graphs.")
      (finally
        (reset! state/*db-worker previous-worker)))))

(deftest graph-sync-context-invokes-worker-when-ready
  (let [previous-worker @state/*db-worker
        calls (atom [])
        handler (get @@#'events/event-definitions :graph/sync-context)]
    (reset! state/*db-worker (fn [& _] nil))
    (try
      (is (true? @state/db-worker-ready?)
          "A function worker must mark db-worker as ready.")
      (with-redefs [state/<invoke-db-worker
                    (fn [qkw context]
                      (swap! calls conj [qkw context])
                      nil)]
        (handler [:graph/sync-context])
        (is (= 1 (count @calls)))
        (is (= :thread-api/set-context (ffirst @calls))))
      (finally
        (reset! state/*db-worker previous-worker)))))
