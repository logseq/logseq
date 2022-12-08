(ns frontend.handler.global-config-test
  (:require [clojure.test :refer [is testing deftest]]
            [frontend.handler.global-config :as global-config-handler]
            [clojure.string :as string]
            [frontend.handler.notification :as notification]))

(defn- validation-config-error-for
  [config-body]
  (let [error-message (atom nil)]
      (with-redefs [notification/show! (fn [msg _] (reset! error-message msg))]
        (is (= false
               (global-config-handler/validate-config-edn "config.edn" config-body)))
        (str @error-message))))

(deftest validate-config-edn
  (testing "Valid cases"
    (is (= true
           (global-config-handler/validate-config-edn
            "config.edn" "{:preferred-workflow :todo}"))))

  (testing "Invalid cases"
    (is (string/includes?
         (validation-config-error-for ":export/bullet-indentation :two-spaces")
         "wrapped in {}"))

    (is (string/includes?
         (validation-config-error-for "{:preferred-workflow :todo")
         "Failed to read"))

    (is (string/includes?
         (validation-config-error-for "{:start-of-week 7}")
         "has the following errors"))))
