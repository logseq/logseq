(ns frontend.handler.events-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.rtc.download-progress :as download-progress]
            [frontend.handler.editor :as editor-handler]
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

(deftest refocus-upsert-type-block-test
  (let [source-id #uuid "11111111-1111-1111-1111-111111111111"
        next-id #uuid "22222222-2222-2222-2222-222222222222"
        source-block {:block/uuid source-id}
        converted-block {:block/uuid source-id
                         :logseq.property.node/display-type :code}
        next-block {:block/uuid next-id}
        current-block (atom source-block)
        pending-new-block (atom nil)
        edit-calls (atom [])]
    (with-redefs [state/get-edit-block #(deref current-block)
                  state/get-state (fn [key]
                                    (when (= :editor/pending-new-block key)
                                      @pending-new-block))
                  editor-handler/edit-block! (fn [& args]
                                               (swap! edit-calls conj args))]
      (testing "an active automatic conversion keeps its normal refocus behavior"
        (#'events/refocus-upsert-type-block! source-block converted-block true)
        (is (= [[converted-block :max]] @edit-calls)))

      (testing "a pending new block prevents the old block from reclaiming focus"
        (reset! edit-calls [])
        (reset! pending-new-block {:typed-text "new block text"})
        (#'events/refocus-upsert-type-block! source-block converted-block true)
        (is (empty? @edit-calls)))

      (testing "a newer edit block makes the delayed callback stale"
        (reset! pending-new-block nil)
        (reset! current-block next-block)
        (#'events/refocus-upsert-type-block! source-block converted-block true)
        (is (empty? @edit-calls)))

      (testing "explicit type insertion preserves its existing refocus behavior"
        (#'events/refocus-upsert-type-block! source-block converted-block false)
        (is (= [[converted-block :max]] @edit-calls))))))
