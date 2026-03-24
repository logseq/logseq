(ns logseq.cli.command.show-test
  (:require ["fs" :as fs]
            [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [logseq.cli.command.show :as show-command]
            [logseq.cli.transport :as transport]
            [promesa.core :as p]))

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

(deftest test-merge-fetched-property-value
  (let [merge-value #'show-command/merge-fetched-property-value]
    (testing "first value is kept as scalar"
      (is (= "Step 1" (merge-value nil "Step 1"))))

    (testing "second distinct value upgrades scalar to vector"
      (is (= ["Step 1" "Step 2"]
             (merge-value "Step 1" "Step 2"))))

    (testing "additional values are appended"
      (is (= ["Step 1" "Step 2" "Step 3"]
             (merge-value ["Step 1" "Step 2"] "Step 3"))))

    (testing "duplicate values are deduplicated"
      (is (= ["Step 1" "Step 2"]
             (merge-value ["Step 1" "Step 2"] "Step 2"))))))

(deftest test-fetch-user-properties-formats-datetime
  (let [fetch #'show-command/fetch-user-properties
        call-count (atom 0)
        mock-invoke (fn [_ _method _ _args]
                      (let [call-idx (swap! call-count inc)]
                        (p/resolved
                         (case call-idx
                           ;; First call: idents-query returns property idents with types
                           1 [[:user.property/title :default]
                              [:user.property/due :datetime]
                              [:user.property/count :number]]
                           ;; Second call: props-query returns raw values
                           2 [[10 :user.property/title "hello"]
                              [10 :user.property/due 1774267200000]
                              [10 :user.property/count 42]]
                           []))))]
    (async done
           (-> (p/with-redefs [transport/invoke mock-invoke]
                 (p/let [result (fetch {} "demo" [10])]
                   (testing "datetime value is converted to ISO string"
                     (is (string? (get-in result [10 :user.property/due])))
                     (is (string/includes? (get-in result [10 :user.property/due]) "2026-03-23")))
                   (testing "non-datetime number is left as-is"
                     (is (= 42 (get-in result [10 :user.property/count]))))
                   (testing "string value is left as-is"
                     (is (= "hello" (get-in result [10 :user.property/title]))))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))
