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
