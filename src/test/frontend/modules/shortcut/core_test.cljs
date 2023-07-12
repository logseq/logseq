(ns frontend.modules.shortcut.core-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
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
          (-> (dh/get-conflicts-by-keys "mod+c" :shortcut.handler/editor-global {:exclude-ids #{:editor/copy} :group-global? true})
              (first) (second) (second) (second) (second))
          :misc/copy))

    (is (->> (dh/get-conflicts-by-keys ["t"])
             (vals)
             (first)
             (vals)
             (map first)
             (every? #(string/starts-with? % "t")))
        "get the conflicts from the only leader key")

    (is (nil? (seq (dh/get-conflicts-by-keys ["g"] :shortcut.handler/cards)))
        "specific handler with the global conflicting key"))

  (testing "parse conflicts from the string binding list"
    (is (= (dh/parse-conflicts-from-binding ["g" "g t"] "g")
           ["g" "g t"]))

    (is (= (dh/parse-conflicts-from-binding ["g" "g t" "t r"] "g t")
           ["g" "g t"]))

    (is (= (dh/parse-conflicts-from-binding ["g" "g t" "t r"] "g x")
           ["g"]))

    (is (= (dh/parse-conflicts-from-binding ["meta+x" "meta+x t" "t r"] "meta+x x")
           ["meta+x"]))))

(comment
  (cljs.test/run-tests))