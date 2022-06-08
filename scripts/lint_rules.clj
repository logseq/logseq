#!/usr/bin/env bb

(require '[babashka.deps :as deps])
(deps/add-deps '{:deps {me.tagaholic/dlint {:mvn/version "0.1.0"}
                        io.lambdaforge/datalog-parser {:mvn/version "0.1.11"}}
                 :paths ["src"]})

(ns lint-rules
  "Lint datalog rules for parse-ability and unbound variables"
  (:require [datalog.parser.impl :as parser-impl]
            [dlint.core :as dlint]
            [logseq.db.rules :as rules]))

(defn- lint-unbound-rule [rule]
  (->> (dlint/lint [rule])
       (keep
        (fn [[k v]]
          (when (seq v)
            {:success false :name k :rule rule :unbound-vars v})))))

(defn- lint-rule [rule]
  (try (parser-impl/parse-rule rule)
    {:success true :rule rule}
    (catch Exception e
      {:success false :rule rule :error (.getMessage e)})))

(defn- collect-logseq-rules
  "Collects logseq rules and prepares them for linting"
  []
  (into rules/rules
        (-> rules/query-dsl-rules
            ;; TODO: Update linter to handle false positive on ?str-val
            (dissoc :property)
            vals)))

(defn -main [rules]
  (let [invalid-unbound-rules (->> rules
                                   (mapcat lint-unbound-rule)
                                   (remove :success))
        invalid-rules (->> rules
                           (map lint-rule)
                           (remove :success))
        lint-results (concat invalid-unbound-rules invalid-rules)]
    (if (seq lint-results)
      (do
        (println (count lint-results) "rules failed to lint:")
        (println lint-results)
        (System/exit 1))
      (println (count rules) "datalog rules linted fine!"))))

(when (= *file* (System/getProperty "babashka.file"))
  (-main (collect-logseq-rules)))
