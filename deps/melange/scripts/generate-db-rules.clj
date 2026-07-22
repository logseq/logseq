(ns generate-db-rules
  "Generate typed OCaml Datalog rule catalogs from the frozen EDN oracle."
  (:require [clojure.edn :as edn]
            [clojure.string :as string]))

(defn- ocaml-string
  [value]
  (pr-str value))

(declare form->ocaml)

(defn- collection->ocaml
  [constructor values]
  (str "(" constructor " [|"
       (string/join "; " (map form->ocaml values))
       "|])"))

(defn- form->ocaml
  [form]
  (cond
    (symbol? form) (str "(symbol " (ocaml-string (str form)) ")")
    (keyword? form) (str "(keyword " (ocaml-string (subs (str form) 1)) ")")
    (string? form) (str "(string_literal " (ocaml-string form) ")")
    (boolean? form) (str "(bool " form ")")
    (list? form) (collection->ocaml "list_form" form)
    (vector? form) (collection->ocaml "vector_form" form)
    :else (throw (ex-info "Unsupported Datalog form" {:form form}))))

(defn- catalog->ocaml
  [var-name catalog]
  (println (str "let " var-name " ="))
  (println "  Rrbvec.of_array")
  (println "    [|")
  (doseq [[name body] catalog]
    (println (str "      make_entry "
                  (ocaml-string (subs (str name) 1))
                  " "
                  (form->ocaml body)
                  ";")))
  (println "    |]")
  (println))

(defn- dependencies->ocaml
  [dependencies]
  (println "let rules_dependencies =")
  (println "  Rrbvec.of_array")
  (println "    [|")
  (doseq [[name deps] dependencies]
    (println (str "      make_dependency "
                  (ocaml-string (subs (str name) 1))
                  " [|"
                  (string/join "; "
                               (map #(ocaml-string (subs (str %) 1)) deps))
                  "|];")))
  (println "    |]"))

(defn -main
  [& [fixture-path]]
  (let [{:keys [rules db-query-dsl-rules rules-dependencies]}
        (edn/read-string (slurp (or fixture-path "test/fixtures/db_rules.edn")))]
    (println "open Datalog_form")
    (println)
    (println "type entry = { name : string; body : t }")
    (println "type dependency = { name : string; dependencies : string Rrbvec.t }")
    (println)
    (println "let make_entry name body = { name; body }")
    (println)
    (println "let make_dependency name dependencies =")
    (println "  { name; dependencies = Rrbvec.of_array dependencies }")
    (println)
    (catalog->ocaml "rules" rules)
    (catalog->ocaml "db_query_dsl_rules" db-query-dsl-rules)
    (dependencies->ocaml rules-dependencies)))

(apply -main *command-line-args*)
