(ns logseq.cli.main-test
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [logseq.cli.main :as cli-main]
            [promesa.core :as p]))

(deftest test-version-output
  (async done
    (-> (p/let [result (cli-main/run! ["--version"] {:exit? false})]
          (is (= 0 (:exit-code result)))
          (is (string/includes? (:output result) "Build time: test-build-time"))
          (is (string/includes? (:output result) "Revision: test-revision"))
          (done))
        (p/catch (fn [e]
                   (is false (str "unexpected error: " e))
                   (done))))))

(deftest test-help-output-omits-command-list
  (async done
    (-> (p/let [result (cli-main/run! ["--help"] {:exit? false})
                output (:output result)]
          (is (= 0 (:exit-code result)))
          (is (not (string/includes? output "Commands: list page"))))
        (p/catch (fn [e]
                   (is false (str "unexpected error: " e))
                   (done)))
        (p/finally done))))

(deftest test-result->exit-code
  (let [result->exit-code #'cli-main/result->exit-code]
    (is (= 0 (result->exit-code {:status :ok})))
    (is (= 1 (result->exit-code {:status :error})))
    (is (= 7 (result->exit-code {:status :error :exit-code 7})))))
