(ns logseq.db.frontend.db-ident-test
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

;; These tests are copied to and should be kept in sync with logseq.db.misc-test
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
        "Kw created from name with '.' doesn't contain '.'"))

  (testing "Non-ASCII letters are kept so typed hashtags get readable idents"
    (doseq [name-string ["исследование" "日本語" "über" "café"]]
      (let [ident (db-ident/create-db-ident-from-name "user.class" name-string)
            ident-name (name ident)]
        (is (qualified-keyword? ident)
            (str "Ident for " name-string " is a qualified keyword"))
        (is (valid-edn-keyword? ident)
            (str "Ident for " name-string " is valid edn"))
        (is (string/includes? ident-name (db-ident/normalize-ident-name-part name-string))
            (str "Ident for " name-string " keeps its letters"))
        (is (not= "" ident-name)
            (str "Ident for " name-string " must not be empty"))))
    (is (= "исследование" (db-ident/normalize-ident-name-part "исследование")))
    (is (= "日本語" (db-ident/normalize-ident-name-part "日本語")))
    (is (= "über" (db-ident/normalize-ident-name-part "über")))
    (is (= "café" (db-ident/normalize-ident-name-part "café")))
    (is (= "u" (db-ident/normalize-ident-name-part "!!"))
        "Names with no allowed characters still produce a non-empty ident part"))))