(ns frontend.handler.common.config-edn-test
  (:require [clojure.string :as string]
            [clojure.test :refer [is testing deftest]]
            [frontend.context.i18n :as i18n]
            [frontend.handler.common.config-edn :as config-edn-common-handler]
            [frontend.handler.notification :as notification]
            [frontend.schema.handler.global-config :as global-config-schema]
            [frontend.schema.handler.repo-config :as repo-config-schema]
            [reitit.frontend.easy :as rfe]))

(defn- validation-config-error-for
  [config-body schema]
  (let [error-message (atom nil)]
    (with-redefs [notification/show! (fn [msg & _] (reset! error-message msg))
                  rfe/href (constantly "")]
      (is (= false
             (config-edn-common-handler/validate-config-edn "config.edn" config-body schema)))
      (str @error-message))))

(defn- deprecation-warnings-for
  ([config-body]
   (deprecation-warnings-for config-body {}))
  ([config-body {:keys [translate-fn]}]
   (let [error-message (atom nil)]
     (with-redefs [notification/show! (fn [msg & _] (reset! error-message msg))
                   i18n/t (or translate-fn i18n/t)
                   rfe/href (constantly "")]
       (config-edn-common-handler/detect-deprecations "config.edn" config-body)
       (str @error-message)))))

(deftest validate-config-edn
  (testing "Valid cases"
    (is (= true
           (config-edn-common-handler/validate-config-edn
            "config.edn" "{:macros {}}" global-config-schema/Config-edn))
        "global config.edn")

    (is (= true
           (config-edn-common-handler/validate-config-edn
            "config.edn" "{:macros {}}" repo-config-schema/Config-edn))
        "repo config.edn"))

  (doseq [[file-type schema] {"global config.edn" global-config-schema/Config-edn
                              "repo config.edn" repo-config-schema/Config-edn}]
    (testing (str "Invalid cases for " file-type)
      (is (string/includes?
           (validation-config-error-for ":export/bullet-indentation :two-spaces" schema)
           "wrapped in {}")
          (str "Not a map for " file-type))

      (is (string/includes?
           (validation-config-error-for "{:macros" schema)
           "Failed to read")
          (str "Invalid edn for " file-type))

      (is (string/includes?
           (validation-config-error-for "{:start-of-week 7}" schema)
           "has the following errors")
          (str "Invalid map for " file-type))

      (is (string/includes?
           (validation-config-error-for "{:start-of-week 7\n:start-of-week 8}" schema)
           "The key ':start-of-week' is assigned multiple times")))))

(deftest detect-deprecations
  (is (re-find
       #":editor/command-trigger.*is"
       (deprecation-warnings-for "{:editor/command-trigger \",\"}"))
      "Warning when there is a deprecation")

  (is (re-find
       #":preferred-format.*translated deprecation"
       (deprecation-warnings-for
        "{:preferred-format :markdown}"
        {:translate-fn (fn [k & _]
                         (case k
                           :graph.validation/config-preferred-format-warning
                           "translated deprecation"
                           (str "{Missing " k "}")))}))
      "File-only config warnings look up translations by stable reason")

  (is (re-find
       #":pages-directory.*shared deprecation"
       (deprecation-warnings-for
        "{:pages-directory \"pages\"}"
        {:translate-fn (fn [k & _]
                         (case k
                           :graph.validation/config-unused-in-db-graphs-warning
                           "shared deprecation"
                           (str "{Missing " k "}")))}))
      "Repeated DB-graph warnings reuse the shared translation key")

  (is (= "" (deprecation-warnings-for "{}"))
      "No warning when there is no deprecation"))
