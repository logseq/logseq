(ns logseq.cli.main-test
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [logseq.cli.commands :as commands]
            [logseq.cli.main :as cli-main]
            [logseq.cli.test-helper :as test-helper]
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

(deftest test-profile-output-enabled-for-version
  (async done
    (-> (p/let [result (cli-main/run! ["--profile" "--version"] {:exit? false})
                profile-lines (:profile-lines result)]
          (is (= 0 (:exit-code result)))
          (is (string/includes? (:output result) "Build time: test-build-time"))
          (is (vector? profile-lines))
          (is (seq profile-lines))
          (when (seq profile-lines)
            (is (re-find #"^\d+ms command=version status=ok$" (first profile-lines))))
          (is (some #(= "stages" (string/trim %)) profile-lines))
          (is (some #(string/includes? % "cli.parse-args") profile-lines))
          (is (some #(string/includes? % "cli.total") profile-lines))
          (done))
        (p/catch (fn [e]
                   (is false (str "unexpected error: " e))
                   (done))))))

(deftest test-profile-output-disabled-by-default
  (async done
    (-> (p/let [result (cli-main/run! ["--version"] {:exit? false})]
          (is (= 0 (:exit-code result)))
          (is (nil? (:profile-lines result)))
          (done))
        (p/catch (fn [e]
                   (is false (str "unexpected error: " e))
                   (done))))))

(deftest test-run-profile-lines-enabled
  (async done
    (-> (p/let [result (cli-main/run! ["--profile" "--help"] {:exit? false})
                lines (:profile-lines result)]
          (is (= 0 (:exit-code result)))
          (is (seq lines))
          (when (seq lines)
            (is (re-find #"^\d+ms command=help status=ok$" (first lines))))
          (is (some #(= "stages" (string/trim %)) lines))
          (is (some #(string/includes? % "cli.parse-args") lines))
          (is (some #(string/includes? % "cli.total") lines))
          (is (not-any? #(string/includes? % "[profile]") lines))
          (is (not-any? #(string/includes? % "count=") lines))
          (done))
        (p/catch (fn [e]
                   (is false (str "unexpected error: " e))
                   (done))))))

(deftest test-run-profile-lines-disabled
  (async done
    (-> (p/let [result (cli-main/run! ["--help"] {:exit? false})]
          (is (= 0 (:exit-code result)))
          (is (nil? (:profile-lines result)))
          (done))
        (p/catch (fn [e]
                   (is false (str "unexpected error: " e))
                   (done))))))

(deftest test-main-prints-profile-lines-to-stderr
  (async done
    (let [stderr-writes (atom [])
          stdout-lines (atom [])]
      (-> (test-helper/with-js-property-override
           (.-stderr js/process)
           "write"
           (fn [text]
             (swap! stderr-writes conj text)
             true)
           (fn []
             (p/with-redefs [cli-main/run! (fn [_args]
                                             (p/resolved {:exit-code 0
                                                          :output "ok-output"
                                                          :profile-lines ["1ms command=help status=ok"
                                                                          "    stages"
                                                                          "1ms └── cli"
                                                                          "1ms     └── cli.total"]}))
                             println (fn [& args]
                                       (swap! stdout-lines conj (string/join " " args)))]
               (cli-main/main "--profile" "--help"))))
          (p/then (fn [_]
                    (let [stderr-text (apply str @stderr-writes)]
                      (is (= ["ok-output"] @stdout-lines))
                      (is (string/includes? stderr-text "1ms command=help status=ok"))
                      (is (string/includes? stderr-text "    stages"))
                      (is (string/includes? stderr-text "1ms     └── cli.total"))
                      (done))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))
                     (done)))))))

(deftest test-build-action-sync-error-produces-clean-output
  (async done
         (-> (p/with-redefs [commands/build-action
                             (fn [_ _]
                               (throw (js/Error. "ENOENT: no such file or directory, open 'blah'")))]
               (p/let [result (cli-main/run! ["upsert" "block" "-g" "test" "--blocks-file=blah"])]
                 (is (= 1 (:exit-code result)))
                 (is (string/includes? (:output result) "ENOENT"))
                 (is (string/includes? (:output result) "blah"))
                 (is (not (string/includes? (:output result) "at "))
                     "output should not contain a stack trace")))
             (p/catch (fn [e] (is false (str "unexpected error: " e))))
             (p/finally (fn [] (done))))))