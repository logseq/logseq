(ns frontend.handler.history-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.handler.editor :as editor]
            [frontend.handler.history :as history]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(deftest history-commands-follow-an-in-flight-insertion-test
  (async done
    (let [prepared (p/deferred)
          operations (atom [])
          block {:db/id 1 :block/uuid (random-uuid) :block/title "Cedar"}
          input #js {:value "Cedar"}]
      (-> (p/with-redefs [state/get-current-repo (constantly "logseq_db_order")
                          state/get-state (constantly {})
                          state/set-state! (fn [& _])
                          state/get-edit-input-id (constantly "edit-block")
                          state/clear-editor-action! (fn [])
                          gdom/getElement (constantly input)
                          util/get-selection-start (constantly 5)
                          util/get-selection-end (constantly 5)
                          util/stop (fn [_])
                          editor/leaf-property-value-insert-blocked? (constantly false)
                          editor/block-self-alone-when-insert? (constantly true)
                          editor/save-current-block! (fn [])
                          editor/clear-when-saved! (fn [])
                          editor/insert-new-block-aux!
                          (fn [& _]
                            (p/let [_ prepared]
                              (swap! operations conj :insert)
                              [(p/resolved nil) true block]))
                          state/<invoke-db-worker
                          (fn [api _repo]
                            (swap! operations conj
                                   (case api
                                     :thread-api/undo-redo-undo :undo
                                     :thread-api/undo-redo-redo :redo))
                            (p/resolved {}))
                          history/restore-cursor-and-state! (fn [_])]
            (let [insertion (editor/insert-new-block! {:block block :value "Cedar" :config {}} nil)
                  undo (#'history/undo-aux! nil)
                  redo (#'history/redo-aux! nil)]
              (p/let [_ (p/delay 0)]
                (is (empty? @operations)
                    "History cannot overtake an insertion still preparing its transaction.")
                (p/resolve! prepared nil)
                (p/let [_ (p/all [insertion undo redo])]
                  (is (= [:insert :undo :redo] @operations))))))
          (p/catch (fn [error] (is false (str error))))
          (p/finally (fn []
                       (p/resolve! prepared nil)
                       (done)))))))

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
                                       (swap! edit-calls conj args))]
      (#'history/restore-cursor!
       {:undo? true
        :editor-cursors [{:selected-block-uuids [#uuid "00000000-0000-0000-0000-000000000001"
                                                 #uuid "00000000-0000-0000-0000-000000000002"]
                          :selection-direction :down}]})
      (is (= [[[:node-1 :node-2] :down]]
             @selection-calls))
      (is (empty? @edit-calls)))))

(deftest restore-cursor-selection-falls-back-to-worker-block-test
  (async done
    (let [selection-calls (atom [])
          edit-calls (atom [])
          worker-calls (atom [])
          block-uuid #uuid "00000000-0000-0000-0000-000000000003"]
      (-> (p/with-redefs [util/get-blocks-by-id (constantly nil)
                          state/get-current-repo (constantly "logseq_db_history")
                          state/exit-editing-and-set-selected-blocks! (fn [blocks direction]
                                                                        (swap! selection-calls conj [blocks direction]))
                          state/<invoke-db-worker (fn [& args]
                                                   (swap! worker-calls conj (vec args))
                                                   (p/resolved {:db/id 42
                                                                :block/uuid block-uuid}))
                          editor/edit-block! (fn [& args]
                                               (swap! edit-calls conj args))]
            (p/let [_ (#'history/restore-cursor!
                       {:undo? false
                        :editor-cursors [{:selected-block-uuids [#uuid "00000000-0000-0000-0000-000000000001"]
                                          :selection-direction :up
                                          :block-uuid block-uuid
                                          :container-id 99
                                          :start-pos 1
                                          :end-pos 3}]})]
              (is (empty? @selection-calls))
              (is (= [[:thread-api/pull "logseq_db_history" '[*] [:block/uuid block-uuid]]]
                     @worker-calls))
              (is (= [[{:db/id 42
                        :block/uuid block-uuid}
                       3
                       {:container-id 99
                        :custom-content nil
                        :save-current-block? false}]]
                     @edit-calls))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally done)))))
