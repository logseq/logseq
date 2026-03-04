(ns frontend.handler.block-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [frontend.handler.block :as block-handler]))

(deftest block-unique-title-no-truncate-when-disabled
  (testing "disable truncate for cmdk path"
    (let [title (apply str (repeat 300 "a"))
          block {:block/title title}
          result (block-handler/block-unique-title block :truncate? false)]
      (is (= title result))
      (is (= 300 (count result))))))

(deftest block-unique-title-keeps-full-tag-label
  (testing "truncate base title before appending tags"
    (let [base-title (apply str (repeat 252 "a"))
          block {:block/title base-title
                 :block/tags [{:db/ident :user.class/example
                               :block/title "example"}]}
          result (block-handler/block-unique-title block)]
      (is (string/starts-with? result base-title))
      (is (string/ends-with? result "#example"))
      (is (> (count result) 256)))))
