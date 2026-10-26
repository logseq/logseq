(ns frontend.handler.events-test
  (:require [cljs.test :refer [async deftest is testing]]
            [frontend.components.rtc.download-progress :as download-progress]
            [frontend.db.async :as db-async]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.events :as events]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
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

(defn- <run-upsert-type-block!
  "Runs the :editor/upsert-type-block handler for `block` (as typing \"> \" sends it) while the
  db returns `db-block` for it; returns the property writes it made."
  [block db-block]
  (let [handler (get @@#'events/event-definitions :editor/upsert-type-block)
        writes (atom [])]
    (p/let [_ (p/with-redefs [state/get-current-repo (constantly "test-repo")
                              db-async/<get-block (fn [_repo _id & _opts] (p/resolved db-block))
                              state/<invoke-db-worker (fn [& _args] (p/resolved nil))
                              db-property-handler/set-block-property! (fn [& args]
                                                                        (swap! writes conj args)
                                                                        (p/resolved nil))
                              db-property-handler/set-block-properties! (fn [& args]
                                                                          (swap! writes conj args)
                                                                          (p/resolved nil))
                              editor-handler/save-block! (fn [& args]
                                                           (swap! writes conj (cons :save-block args))
                                                           (p/resolved nil))]
                (handler [:editor/upsert-type-block {:block (assoc block :block/title "")
                                                     :type :quote
                                                     :update-current-block? true}]))]
      @writes)))

(deftest upsert-type-block-skips-a-block-that-is-gone-test
  (async done
    (let [block {:db/id 7 :block/uuid #uuid "77777777-7777-7777-7777-777777777777" :block/title ">"}]
      (-> (p/let [gone-writes (<run-upsert-type-block! block nil)
                  present-writes (<run-upsert-type-block! block (assoc block :block/title ""))]
            (is (= [] gone-writes)
                "a block deleted before the conversion runs gets no property write (it would fail in the worker)")
            (is (= [[(:block/uuid block) :logseq.property.node/display-type :quote]] present-writes)
                "a block that is still there is converted"))
          (p/catch (fn [e] (is false (str e))))
          (p/finally done)))))

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
