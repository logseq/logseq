(ns frontend.handler.common.config-edn-test
  (:require [clojure.test :refer [is testing deftest]]
            [clojure.string :as string]
            [frontend.handler.common.config-edn :as config-edn-common-handler]
            [frontend.schema.handler.global-config :as global-config-schema]
            [frontend.schema.handler.repo-config :as repo-config-schema]
            [frontend.handler.notification :as notification]))

(defn- validation-config-error-for
  [config-body schema]
  (let [error-message (atom nil)]
    (with-redefs [notification/show! (fn [msg _] (reset! error-message msg))]
      (is (= false
             (config-edn-common-handler/validate-config-edn "config.edn" config-body schema)))
      (str @error-message))))

(deftest validate-config-edn
  (testing "Valid cases"
    (is (= true
           (config-edn-common-handler/validate-config-edn
            "config.edn" "{:preferred-workflow :todo}" global-config-schema/Config-edn))
        "global config.edn")

    (is (= true
           (config-edn-common-handler/validate-config-edn
            "config.edn" "{:preferred-workflow :todo}" repo-config-schema/Config-edn))
        "repo config.edn"))

  (doseq [[file-type schema] {"global config.edn" global-config-schema/Config-edn
                              "repo config.edn" repo-config-schema/Config-edn}]
    (testing (str "Invalid cases for " file-type)
      (is (string/includes?
           (validation-config-error-for ":export/bullet-indentation :two-spaces" schema)
           "wrapped in {}")
          (str "Not a map for " file-type))

      (is (string/includes?
           (validation-config-error-for "{:preferred-workflow :todo" schema)
           "Failed to read")
          (str "Invalid edn for " file-type))

      (is (string/includes?
           (validation-config-error-for "{:start-of-week 7}" schema)
           "has the following errors")
          (str "Invalid map for " file-type)))))
