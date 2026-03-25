(ns frontend.handler.history-test
  (:require [clojure.test :refer [deftest is]]
            [frontend.db :as db]
            [frontend.handler.editor :as editor]
            [frontend.handler.history :as history]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.db :as ldb]))

(deftest restore-cursor-and-state-prefers-ui-state-test
  (let [pause-calls (atom [])
        app-state-calls (atom [])
        cursor-calls (atom [])]
    (with-redefs [state/set-state! (fn [k v]
                                     (swap! pause-calls conj [k v]))
                  ldb/read-transit-str (fn [_]
                                         {:old-state {:route-data {:to :page}}
                                          :new-state {:route-data {:to :home}}})
                  history/restore-app-state! (fn [app-state]
                                               (swap! app-state-calls conj app-state))
                  history/restore-cursor! (fn [data]
                                            (swap! cursor-calls conj data))]
      (#'history/restore-cursor-and-state!
       {:ui-state-str "ui-state"
        :undo? true
        :editor-cursors [{:block-uuid (random-uuid)}]})
      (is (= [[:history/paused? true]
              [:history/paused? false]]
             @pause-calls))
      (is (= [{:route-data {:to :page}}]
             @app-state-calls))
      (is (empty? @cursor-calls)))))

(deftest restore-cursor-and-state-falls-back-to-cursor-test
  (let [pause-calls (atom [])
        app-state-calls (atom [])
        cursor-calls (atom [])]
    (with-redefs [state/set-state! (fn [k v]
                                     (swap! pause-calls conj [k v]))
                  history/restore-app-state! (fn [app-state]
                                               (swap! app-state-calls conj app-state))
                  history/restore-cursor! (fn [data]
                                            (swap! cursor-calls conj data))]
      (#'history/restore-cursor-and-state!
       {:ui-state-str nil
        :undo? false
        :editor-cursors [{:block-uuid (random-uuid)
                          :start-pos 1
                          :end-pos 2}]})
      (is (= [[:history/paused? true]
              [:history/paused? false]]
             @pause-calls))
      (is (empty? @app-state-calls))
      (is (= 1 (count @cursor-calls)))
      (is (nil? (:ui-state-str (first @cursor-calls))))
      (is (= false (:undo? (first @cursor-calls)))))))

(deftest restore-cursor-prefers-block-selection-test
  (let [selection-calls (atom [])
        edit-calls (atom [])]
    (with-redefs [util/get-blocks-by-id (fn [block-id]
                                          (case block-id
                                            #uuid "00000000-0000-0000-0000-000000000001" [:node-1]
                                            #uuid "00000000-0000-0000-0000-000000000002" [:node-2]
                                            nil))
                  state/exit-editing-and-set-selected-blocks! (fn [blocks direction]
                                                                (swap! selection-calls conj [blocks direction]))
                  editor/edit-block! (fn [& args]
                                       (swap! edit-calls conj args))
                  db/pull (constantly nil)]
      (#'history/restore-cursor!
       {:undo? true
        :editor-cursors [{:selected-block-uuids [#uuid "00000000-0000-0000-0000-000000000001"
                                                 #uuid "00000000-0000-0000-0000-000000000002"]
                          :selection-direction :down}]})
      (is (= [[[:node-1 :node-2] :down]]
             @selection-calls))
      (is (empty? @edit-calls)))))

(deftest restore-cursor-selection-falls-back-to-editor-cursor-test
  (let [selection-calls (atom [])
        edit-calls (atom [])
        block-uuid #uuid "00000000-0000-0000-0000-000000000003"]
    (with-redefs [util/get-blocks-by-id (constantly nil)
                  state/exit-editing-and-set-selected-blocks! (fn [blocks direction]
                                                                (swap! selection-calls conj [blocks direction]))
                  editor/edit-block! (fn [& args]
                                       (swap! edit-calls conj args))
                  db/pull (fn [[_lookup-k id]]
                            (when (= block-uuid id)
                              {:db/id 42
                               :block/uuid block-uuid}))]
      (#'history/restore-cursor!
       {:undo? false
        :editor-cursors [{:selected-block-uuids [#uuid "00000000-0000-0000-0000-000000000001"]
                          :selection-direction :up
                          :block-uuid block-uuid
                          :container-id 99
                          :start-pos 1
                          :end-pos 3}]})
      (is (empty? @selection-calls))
      (is (= [[{:db/id 42
                :block/uuid block-uuid}
               3
               {:container-id 99
                :custom-content nil}]]
             @edit-calls)))))
