(ns frontend.extensions.code.language-registry-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.extensions.code.language-registry :as registry]))

(deftest native-languages-resolve-without-legacy-fallback
  (testing "Common app languages use CM6 native language packages"
    (is (= {:id :javascript
            :source :native
            :package "@codemirror/lang-javascript"
            :entry :javascript}
           (select-keys (registry/language-by-name "javascript")
                        [:id :source :package :entry])))
    (is (= :javascript (:id (registry/language-by-name "js"))))
    (is (= :json (:id (registry/language-by-extension "json"))))
    (is (= :markdown (:id (registry/language-by-name "markdown"))))))

(deftest clojure-family-uses-nextjournal-language-package
  (testing "Logseq-specific Clojure-family blocks are first-class"
    (is (= {:id :clojure
            :source :nextjournal
            :package "@nextjournal/lezer-clojure"
            :entry :parser}
           (select-keys (registry/language-by-name "clojure")
                        [:id :source :package :entry])))
    (is (= :clojure (:id (registry/language-by-name "edn"))))
    (is (= :clojure (:id (registry/language-by-extension "cljs"))))))

(deftest legacy-modes-are-explicit-and-bounded
  (testing "Legacy modes exist only for named gaps in native CM6 coverage"
    (is (true? (registry/legacy-language? "shell")))
    (is (false? (registry/legacy-language? "javascript")))
    (is (= :shell (:id (registry/language-by-name "bash"))))
    (is (nil? (registry/language-by-name "unknown-language")))))

(deftest partial-language-names-resolve-by-substring
  (testing "Partial names resolve to the shortest matching name"
    (is (= :ocaml (:id (registry/language-by-subname "oca"))))
    (is (= :ocaml (:id (registry/language-by-subname "cam"))))
    (is (= :ocaml (:id (registry/language-by-subname "ca"))))
    (is (= :cmake (:id (registry/language-by-subname "cm"))))
    (is (= :scala (:id (registry/language-by-subname "scal")))))
  (testing "Non-matching and degenerate queries stay unresolved"
    (is (nil? (registry/language-by-subname "zzz-not-a-language")))
    (is (nil? (registry/language-by-subname "c")))
    (is (nil? (registry/language-by-subname "")))
    (is (nil? (registry/language-by-subname nil)))))

(deftest descriptor-ids-resolve-through-language-by-name
  (testing "The language picker persists descriptor ids, so every id must
            round-trip through name resolution (e.g. \"ms-sql\", \"vb-net\")"
    (is (= :vb-net (:id (registry/language-by-name "vb-net"))))
    (is (= :common-lisp (:id (registry/language-by-name "common-lisp"))))
    (is (= :angular-template (:id (registry/language-by-name "angular-template"))))
    (is (every? (fn [descriptor]
                  (identical? descriptor
                              (registry/language-by-name (name (:id descriptor)))))
                (registry/supported-languages)))))

(deftest registry-entries-have-unique-lookup-keys
  (testing "Names and file extensions are unambiguous"
    (is (empty? (registry/duplicate-name-keys)))
    (is (empty? (registry/duplicate-extension-keys))))
  (testing "Every descriptor declares a supported source"
    (is (every? registry/valid-language-descriptor?
                (registry/supported-languages)))))
