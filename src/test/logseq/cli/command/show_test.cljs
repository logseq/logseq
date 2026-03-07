(ns logseq.cli.command.show-test
  (:require ["fs" :as fs]
            [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [logseq.cli.command.show :as show-command]))

(deftest test-build-action-stdin-id
  (testing "reads id from stdin when id flag is present without a value"
    (let [result (show-command/build-action {:id ""
                                             :id-from-stdin? true
                                             :stdin "42"}
                                            "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (= 42 (get-in result [:action :id])))
      (is (= [42] (get-in result [:action :ids])))
      (is (false? (get-in result [:action :multi-id?])))))

  (testing "reads multi-id vector from stdin"
    (let [result (show-command/build-action {:id ""
                                             :id-from-stdin? true
                                             :stdin "[1 2 3]"}
                                            "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (= [1 2 3] (get-in result [:action :ids])))
      (is (true? (get-in result [:action :multi-id?])))))

  (testing "explicit stdin still overrides id when provided in options"
    (let [result (show-command/build-action {:id "99"
                                             :stdin "[1 2]"}
                                            "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (= [1 2] (get-in result [:action :ids])))
      (is (true? (get-in result [:action :multi-id?])))))

  (testing "pipe stdin does not override explicit id unless stdin mode is requested"
    (let [orig-fstat-sync (.-fstatSync fs)
          orig-read-file-sync (.-readFileSync fs)
          read-count* (atom 0)]
      (set! (.-fstatSync fs)
            (fn [_]
              #js {:isFIFO (fn [] true)
                   :isFile (fn [] false)}))
      (set! (.-readFileSync fs)
            (fn [fd]
              (when (= fd 0)
                (swap! read-count* inc)
                "[1 2]")))
      (try
        (let [result (show-command/build-action {:id "99"}
                                                "logseq_db_demo")]
          (is (true? (:ok? result)))
          (is (= 99 (get-in result [:action :id])))
          (is (= [99] (get-in result [:action :ids])))
          (is (zero? @read-count*)))
        (finally
          (set! (.-fstatSync fs) orig-fstat-sync)
          (set! (.-readFileSync fs) orig-read-file-sync)))))

  (testing "blank stdin falls back to explicit id"
    (let [result (show-command/build-action {:id "99"
                                             :stdin "   "}
                                            "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (= 99 (get-in result [:action :id])))
      (is (= [99] (get-in result [:action :ids])))))

  (testing "blank stdin returns invalid options when id is missing"
    (let [result (show-command/build-action {:id ""
                                             :id-from-stdin? true
                                             :stdin "   "}
                                            "logseq_db_demo")]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))
      (is (string/includes? (get-in result [:error :message]) "id")))))
