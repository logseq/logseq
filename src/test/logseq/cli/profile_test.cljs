(ns logseq.cli.profile-test
  (:require [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [logseq.cli.profile :as profile]
            [promesa.core :as p]))

(deftest test-create-session
  (testing "disabled profile returns nil session"
    (is (nil? (profile/create-session false))))

  (testing "enabled profile returns session map"
    (let [session (profile/create-session true)]
      (is (map? session))
      (is (some? (:started-ms session))))))

(deftest test-report-aggregates-repeated-stages
  (let [session (profile/create-session true)]
    (profile/time! session "cli.parse-args" (fn [] :ok))
    (profile/time! session "cli.parse-args" (fn [] :ok))
    (profile/time! session "cli.build-action" (fn [] :ok))
    (let [report (profile/report session {:command "graph-list" :status :ok})
          by-stage (into {} (map (juxt :stage identity) (:stages report)))]
      (is (number? (:total-ms report)))
      (is (>= (:total-ms report) 0))
      (is (= "graph-list" (:command report)))
      (is (= :ok (:status report)))
      (is (= 2 (get-in by-stage ["cli.parse-args" :count])))
      (is (= 1 (get-in by-stage ["cli.build-action" :count])))
      (is (= 1 (get-in by-stage ["cli.total" :count]))))))

(deftest test-time-records-stage-when-thunk-throws
  (let [session (profile/create-session true)]
    (try
      (profile/time! session "cli.parse-args" (fn []
                                                 (throw (ex-info "boom" {:code :boom}))))
      (is false "expected exception")
      (catch :default _
        (let [report (profile/report session {:command "graph-list" :status :error})
              by-stage (into {} (map (juxt :stage identity) (:stages report)))]
          (is (= 1 (get-in by-stage ["cli.parse-args" :count]))))))))

(deftest test-render-lines-renders-logical-containment-tree
  (let [lines (profile/render-lines {:command "graph-list"
                                     :status :ok
                                     :total-ms 42
                                     :stages []
                                     :spans [{:stage "cli.total"
                                              :elapsed-ms 42
                                              :started-ms 0
                                              :ended-ms 42
                                              :span-id 0}
                                             {:stage "cli.parse-args"
                                              :elapsed-ms 2
                                              :started-ms 1
                                              :ended-ms 3
                                              :span-id 1}
                                             {:stage "cli.execute-action"
                                              :elapsed-ms 30
                                              :started-ms 5
                                              :ended-ms 35
                                              :span-id 2}
                                             {:stage "transport.invoke:thread-api/q"
                                              :elapsed-ms 8
                                              :started-ms 12
                                              :ended-ms 20
                                              :span-id 3}]})]
    (is (= "42ms command=graph-list status=ok" (first lines)))
    (is (= "stages" (string/trim (second lines))))
    (is (some #(= "42ms └── cli.total" %) lines))
    (is (some #(string/includes? % "├── cli.parse-args") lines))
    (is (some #(string/includes? % "└── cli.execute-action") lines))
    (is (some #(string/includes? % "└── transport.invoke:thread-api/q") lines))
    (is (not-any? #(string/includes? % "[profile]") lines))
    (is (not-any? #(string/includes? % "count=") lines))
    (is (not-any? #(string/includes? % "avg=") lines))))

(deftest test-render-lines-uses-containment-not-stage-prefix
  (let [lines (profile/render-lines {:command "query"
                                     :status :ok
                                     :total-ms 20
                                     :stages []
                                     :spans [{:stage "outer"
                                              :elapsed-ms 20
                                              :started-ms 0
                                              :ended-ms 20
                                              :span-id 0}
                                             {:stage "transport.invoke:thread-api/q"
                                              :elapsed-ms 10
                                              :started-ms 5
                                              :ended-ms 15
                                              :span-id 1}]})]
    (is (some #(= "20ms └── outer" %) lines))
    (is (some #(string/includes? % "└── transport.invoke:thread-api/q") lines))))

(deftest test-render-lines-does-not-merge-identical-stage-calls
  (let [lines (profile/render-lines {:command "query"
                                     :status :ok
                                     :total-ms 30
                                     :stages []
                                     :spans [{:stage "outer"
                                              :elapsed-ms 30
                                              :started-ms 0
                                              :ended-ms 30
                                              :span-id 0}
                                             {:stage "transport.invoke:thread-api/q"
                                              :elapsed-ms 5
                                              :started-ms 5
                                              :ended-ms 10
                                              :span-id 1}
                                             {:stage "transport.invoke:thread-api/q"
                                              :elapsed-ms 5
                                              :started-ms 15
                                              :ended-ms 20
                                              :span-id 2}]})
        q-lines (filter #(string/includes? % "transport.invoke:thread-api/q") lines)]
    (is (= 2 (count q-lines)))
    (is (= ["5ms      ├── transport.invoke:thread-api/q"
            "5ms      └── transport.invoke:thread-api/q"]
           (vec q-lines)))))

(deftest test-render-lines-aligns-tree-column-for-different-durations
  (let [lines (profile/render-lines {:command "query"
                                     :status :ok
                                     :total-ms 120
                                     :stages []
                                     :spans [{:stage "outer"
                                              :elapsed-ms 120
                                              :started-ms 0
                                              :ended-ms 120
                                              :span-id 0}
                                             {:stage "child.short"
                                              :elapsed-ms 2
                                              :started-ms 5
                                              :ended-ms 7
                                              :span-id 1}
                                             {:stage "child.long"
                                              :elapsed-ms 45
                                              :started-ms 10
                                              :ended-ms 55
                                              :span-id 2}]})
        short-line (first (filter #(string/includes? % "child.short") lines))
        long-line (first (filter #(string/includes? % "child.long") lines))]
    (is (some? short-line))
    (is (some? long-line))
    (is (= (string/index-of short-line "├──")
           (string/index-of long-line "└──")))))

(deftest test-time-records-async-stage
  (async done
         (let [session (profile/create-session true)]
           (-> (profile/time! session "transport.invoke:thread-api/q"
                             (fn []
                               (p/delay 5 :ok)))
               (p/then (fn [result]
                         (is (= :ok result))
                         (let [report (profile/report session {:command "query" :status :ok})
                               by-stage (into {} (map (juxt :stage identity) (:stages report)))]
                           (is (= 1 (get-in by-stage ["transport.invoke:thread-api/q" :count]))))))
               (p/then (fn [_]
                         (let [lines (profile/render-lines (profile/report session {:command "query" :status :ok}))]
                           (is (seq lines))
                           (when (seq lines)
                             (is (re-find #"^\d+ms command=query status=ok$" (first lines))))
                           (is (some #(= "stages" (string/trim %)) lines))
                           (is (some #(string/includes? % "transport.invoke:thread-api/q") lines))
                           (done))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))