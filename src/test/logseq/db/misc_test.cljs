(ns logseq.db.misc-test
  "These are misc tests for logseq.db dep that must run in cljs"
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.edn :as edn]
            [clojure.string :as string]
            [logseq.db.frontend.db-ident :as db-ident]))

(defn- valid-edn-keyword?
  "Like common-util/valid-edn-keyword? but with kw as argument"
  [kw]
  (try
    (boolean (edn/read-string (str "{" kw " nil}")))
    (catch :default _
      false)))

;; These tests are copied from and kept in sync with logseq.db.frontend.db-ident-test
;; Tests edge cases as described in https://clojure.org/reference/reader#_symbols
(deftest create-db-ident-from-name
  (testing "Symbols begin with a non-numeric character and can contain alphanumeric characters and *, +, !, -, _, ', ?, <, > and ="
    (is (valid-edn-keyword? (db-ident/create-db-ident-from-name "user.property" "f@!{h[#"))
        "Kw created from name containing invalid special characters is valid edn")
    (is (valid-edn-keyword? (db-ident/create-db-ident-from-name "user.property" "foo*+!_'?<>=-"))
        "Kw created from name with all valid special characters is valid edn")
    (is (string/includes? (name (db-ident/create-db-ident-from-name "user.property" "foo*+!_'?<>=-"))
                          "*+!_'?<>=-")
        "Kw created from name with all valid special characters contains all special characters")
    (is (valid-edn-keyword? (db-ident/create-db-ident-from-name "user.property" "2ndCity"))
        "Kw created from name starting with number is valid edn")
    (is (string/starts-with? (name (db-ident/create-db-ident-from-name "user.property" "2ndCity"))
                             "NUM-2nd")
        "Kw created from name starting with number does not start with that number"))

  (testing "All other special characters"
    (is (valid-edn-keyword? (db-ident/create-db-ident-from-name "user.property" ":name"))
        "Kw created from name with ':' is valid edn")
    (is (not (string/includes? (name (db-ident/create-db-ident-from-name "user.property" ":name")) ":"))
        "Kw created from name with ':' doesn't contain ':'")
    (is (valid-edn-keyword? (db-ident/create-db-ident-from-name "user.property" "foo/bar"))
        "Kw created from name with '/' is valid edn")
    (is (not (string/includes? (name (db-ident/create-db-ident-from-name "user.property" "foo/bar")) "/"))
        "Kw created from name with '/' doesn't contain '/'")
    (is (valid-edn-keyword? (db-ident/create-db-ident-from-name "user.property" "foo.bar"))
        "Kw created from name with '.' is valid edn")
    (is (not (string/includes? (name (db-ident/create-db-ident-from-name "user.property" "foo.bar")) "."))
        "Kw created from name with '.' doesn't contain '.'")))