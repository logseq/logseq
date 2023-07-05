(ns frontend.modules.shortcut.core-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.modules.shortcut.data-helper :as dh]))

(deftest test-core-basic
  (testing "get handler id"
    (is (= (dh/get-group :editor/copy) :shortcut.handler/editor-global))))

(deftest test-shortcut-conflicts-detection
  (testing "get conflicts with shortcut id"
    (do ";; TODO"))
  (testing "get conflicts with binding keys"
    (is (= (count (dh/get-conflicts-by-keys "mod+c")) 1))

    (is (contains?
          (-> (dh/get-conflicts-by-keys "mod+c" :shortcut.handler/editor-global #{:editor/copy})
              (first) (second) (second))
          :misc/copy))))

(comment
  (cljs.test/run-tests))