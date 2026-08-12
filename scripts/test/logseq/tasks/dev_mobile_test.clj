(ns logseq.tasks.dev-mobile-test
  (:require [clojure.test :refer [deftest is run-tests]]
            [logseq.tasks.dev.mobile :as mobile]))

(deftest dev-server-url-keeps-mobile-assets-relative-to-mobile-path
  (is (= "https://192.0.2.1:3002/mobile/"
         (mobile/dev-server-url "192.0.2.1"))))

(defn -main
  [& _]
  (let [{:keys [fail error]} (run-tests 'logseq.tasks.dev-mobile-test)]
    (System/exit (+ fail error))))
