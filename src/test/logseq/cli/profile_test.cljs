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
                             (is (string/starts-with? (first lines) "[profile] total=")))
                           (is (some #(string/includes? % "transport.invoke:thread-api/q") lines))
                           (done))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))
