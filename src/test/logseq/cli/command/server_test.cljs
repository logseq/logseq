(ns logseq.cli.command.server-test
  (:require [cljs.test :refer [async deftest is]]
            [logseq.cli.command.server :as server-command]
            [logseq.cli.server :as cli-server]
            [logseq.cli.version :as cli-version]
            [promesa.core :as p]))

(deftest compute-revision-mismatches-uses-exact-string-compare
  (let [compute-revision-mismatches #'server-command/compute-revision-mismatches
        mismatch (compute-revision-mismatches
                  "cli-rev"
                  [{:repo "graph-a" :revision "cli-rev"}
                   {:repo "graph-b" :revision "cli-rev-dirty"}])]
    (is (= "cli-rev" (:cli-revision mismatch)))
    (is (= ["graph-b"]
           (mapv :repo (:servers mismatch))))))

(deftest execute-list-attaches-human-mismatch-metadata
  (async done
         (-> (p/with-redefs [cli-version/revision (fn [] "cli-rev")
                             cli-server/list-servers (fn [_]
                                                       (p/resolved [{:repo "graph-a"
                                                                     :revision "cli-rev"}
                                                                    {:repo "graph-b"
                                                                     :revision "worker-rev"}]))]
               (server-command/execute-list {:type :server-list} {}))
             (p/then (fn [result]
                       (is (= :ok (:status result)))
                       (is (= 2 (count (get-in result [:data :servers]))))
                       (is (= "cli-rev"
                              (get-in result [:human :server-list :revision-mismatch :cli-revision])))
                       (is (= ["graph-b"]
                              (mapv :repo (get-in result [:human :server-list :revision-mismatch :servers]))))))
             (p/catch (fn [e]
                        (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest execute-list-omits-mismatch-when-revisions-match
  (async done
         (-> (p/with-redefs [cli-version/revision (fn [] "cli-rev")
                             cli-server/list-servers (fn [_]
                                                       (p/resolved [{:repo "graph-a"
                                                                     :revision "cli-rev"}]))]
               (server-command/execute-list {:type :server-list} {}))
             (p/then (fn [result]
                       (is (= :ok (:status result)))
                       (is (nil? (get-in result [:human :server-list :revision-mismatch])))))
             (p/catch (fn [e]
                        (is false (str "unexpected error: " e))))
             (p/finally done))))
