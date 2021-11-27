(ns frontend.external.roam-test
  (:require [cljs.test :refer [is deftest]]
            [frontend.external.roam :as roam]
            [frontend.external :refer [to-markdown-files]]))

(def minimal-json "
[
 {
  \"create-email\": \"adam@example.com\",
  \"create-time\": 1610708403162,
  \"title\": \"Export JSON\",
  \"children\": [
                  {
                    \"string\": \"Hello, world!\",
                    \"create-email\": \"adam@example.com\",
                    \"create-time\": 1610708405787,
                    \"uid\": \"7c5um7hSz\",
                    \"edit-time\": 1610708415484,
                    \"edit-email\": \"adam@example.com\"}
                ],
  \"edit-time\": 1610708403169,
  \"edit-email\": \"adam@example.com\"}]
")

(deftest json->edn-test
  (is (= [1 {:foo 42, :bar "baz"} 3] (roam/json->edn "[1, {\"foo\": 42, \"bar\": \"baz\"}, 3]"))))

(deftest roam-import-test
  (let [got (to-markdown-files :roam minimal-json {})
        md (first got)]
    (is (= 1 (count got)))
    (is (= "Export JSON" (:title md)))
    (is (:created-at md))
    (is (:last-modified-at md))
    (is (= "---\ntitle: Export JSON\n---\n\n- Hello, world!\n" (:text md)))))
