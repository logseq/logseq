(ns frontend.handler.history-test
  (:require [clojure.test :refer [deftest is]]
            [frontend.handler.history :as history]
            [frontend.state :as state]
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
