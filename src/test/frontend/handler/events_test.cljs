(ns frontend.handler.events-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.rtc.download-progress :as download-progress]
            [frontend.db.async :as db-async]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.events :as events]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.test.helper :include-macros true :refer [deftest-async]]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

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

(deftest-async upsert-type-block-on-a-block-with-text-turns-a-new-block-into-code-test
  (let [source-id #uuid "33333333-3333-3333-3333-333333333333"
        new-id #uuid "44444444-4444-4444-4444-444444444444"
        blocks {1 {:db/id 1 :block/uuid source-id :block/title "hello"}
                new-id {:db/id 2 :block/uuid new-id :block/title ""}}
        calls (atom [])
        record! (fn [call] (swap! calls conj call) nil)
        upsert! (get @@#'events/event-definitions :editor/upsert-type-block)]
    (p/with-redefs [state/get-current-repo (constantly "test-repo")
                    db-async/<get-block (fn [_repo id & _] (p/resolved (get blocks id)))
                    state/<invoke-db-worker (fn [& _] (p/resolved "clojure"))
                    editor-handler/save-current-block! (fn [& _] nil)
                    editor-handler/insert-new-block-aux! (fn [_config block value]
                                                           (record! [:insert (:block/uuid block) value])
                                                           (p/resolved [nil false {:block/uuid new-id}]))
                    db-property-handler/set-block-properties! (fn [id m]
                                                                (record! [:set-properties id m])
                                                                (p/resolved nil))
                    db-property-handler/set-block-property! (fn [id k v]
                                                              (record! [:set-property id k v])
                                                              (p/resolved nil))
                    events/refocus-upsert-type-block! (fn [_source converted _]
                                                        (record! [:refocus (:block/uuid converted)]))]
      (p/do!
       (upsert! [:editor/upsert-type-block {:block {:db/id 1 :block/uuid source-id :block/title "hello"}
                                            :type :code}])
       (p/delay 150)
       (is (= [[:insert source-id ""]
               [:set-properties new-id {:logseq.property.node/display-type :code
                                        :logseq.property.code/lang "clojure"}]
               [:refocus new-id]]
              @calls))))))

(deftest-async upsert-type-block-sets-no-property-when-no-block-is-inserted-test
  (let [source-id #uuid "33333333-3333-3333-3333-333333333333"
        calls (atom [])
        record! (fn [call] (swap! calls conj call) nil)
        upsert! (get @@#'events/event-definitions :editor/upsert-type-block)]
    (p/with-redefs [state/get-current-repo (constantly "test-repo")
                    db-async/<get-block (fn [_repo _id & _] (p/resolved {:db/id 1 :block/uuid source-id :block/title "https://x.y"}))
                    state/<invoke-db-worker (fn [& _] (p/resolved "clojure"))
                    editor-handler/save-current-block! (fn [& _] nil)
                    ;; a single URL value: insert-new-block-aux! skips the insert
                    editor-handler/insert-new-block-aux! (fn [& _] (p/resolved [nil nil nil]))
                    db-property-handler/set-block-properties! (fn [id m] (record! [:set-properties id m]) (p/resolved nil))
                    db-property-handler/set-block-property! (fn [id k v] (record! [:set-property id k v]) (p/resolved nil))
                    events/refocus-upsert-type-block! (fn [& _] nil)]
      (p/do!
       (upsert! [:editor/upsert-type-block {:block {:db/id 1 :block/uuid source-id :block/title "https://x.y"}
                                            :type :code}])
       (p/delay 150)
       (is (= [] @calls) "no block was inserted, so no property is set on a missing block")))))

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
