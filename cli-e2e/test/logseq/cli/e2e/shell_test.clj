(ns logseq.cli.e2e.shell-test
  (:require [clojure.test :refer [deftest is testing]]
            [logseq.cli.e2e.shell :as shell]))

(deftest preserves-the-exact-command-string
  (let [captured (atom nil)
        command "node static/logseq-cli.js --graph 'Graph With Space' --help"
        result (shell/run! {:cmd command
                            :dir "/repo"
                            :executor (fn [cmd opts]
                                        (reset! captured {:cmd cmd
                                                          :opts opts})
                                        {:exit 0
                                         :out "ok"
                                         :err ""})})]
    (is (= command (:cmd result)))
    (is (= command (:cmd @captured)))
    (is (= "/repo" (get-in @captured [:opts :dir])))))

(deftest shell-failures-include-command-context
  (let [command "node static/logseq-cli.js completion fish"]
    (try
      (shell/run! {:cmd command
                   :executor (fn [_ _]
                               {:exit 2
                                :out ""
                                :err "unsupported shell"})})
      (is false "Expected shell/run! to throw")
      (catch clojure.lang.ExceptionInfo ex
        (is (= command (:cmd (ex-data ex))))
        (is (= 2 (:exit (ex-data ex))))
        (is (= "unsupported shell" (:err (ex-data ex))))))))

(deftest allow-failure-returns-result-without-throwing
  (let [command "node static/logseq-cli.js graph info --graph missing"
        result (shell/run! {:cmd command
                            :throw? false
                            :executor (fn [_ _]
                                        {:exit 1
                                         :out "failed"
                                         :err "missing"})})]
    (is (= command (:cmd result)))
    (is (= 1 (:exit result)))
    (is (= "failed" (:out result)))
    (is (= "missing" (:err result)))))
