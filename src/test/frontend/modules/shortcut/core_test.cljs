(ns frontend.modules.shortcut.core-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.modules.shortcut.config :as shortcut-config]
            [frontend.modules.shortcut.data-helper :as dh]
            [frontend.util :as util]))

(deftest test-core-basic
  (testing "get handler id"
    (is (= (dh/get-group :editor/copy) :shortcut.handler/editor-global))))

(deftest test-shortcut-conflicts-detection
  (testing "get conflicts with shortcut id")

  (testing "get conflicts with binding keys"
    ;; mod+c should find exactly one outer entry (for the mod+c input key)
    (is (= (count (dh/get-conflicts-by-keys "mod+c")) 1))

    (is (contains?
         (->> (dh/get-conflicts-by-keys
               "mod+c" :shortcut.handler/editor-global
               {:exclude-ids #{:editor/copy} :group-global? true})
              (vals) (mapcat #(vals %)) (some #(when (= (first %) (if util/mac? "meta+c" "ctrl+c")) (second %))))
         :misc/copy))

    ;; Chord-prefix overlaps are NOT blocking conflicts — "t" should not
    ;; find "t n", "t d", etc. since no shortcut has exactly "t" as binding.
    (is (empty? (->> (dh/get-conflicts-by-keys ["t"])
                     (vals)
                     (first)
                     (vals)
                     (map first)))
        "chord-prefix overlaps are not blocking conflicts")

    ;; mod+c should find :editor/copy (exact match) but NOT :sidebar/clear
    ;; (chord prefix mod+c mod+c) — chord prefixes coexist at runtime on
    ;; separate handler instances and should never block assignment.
    (let [conflicts (dh/get-conflicts-by-keys
                     "mod+c" :shortcut.handler/global-prevent-default
                     {:group-global? true})
          all-ids (->> (vals conflicts)
                       (mapcat vals)
                       (mapcat #(keys (second %)))
                       (set))]
      (is (contains? all-ids :editor/copy)
          "exact match is a blocking conflict")
      (is (not (contains? all-ids :sidebar/clear))
          "chord prefix mod+c mod+c is NOT a blocking conflict")
      (is (not (contains? all-ids :search/re-index))
          "chord prefix mod+c mod+s is NOT a blocking conflict"))

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

(deftest test-add-reaction-shortcut
  (testing "add reaction shortcut is configured with p r"
    (is (= ["p r"] (dh/shortcut-binding :editor/add-reaction))))
  (testing "add reaction shortcut belongs to non-editing handler"
    (is (= :shortcut.handler/global-non-editing-only
           (dh/get-group :editor/add-reaction))))
  (testing "add reaction shortcut appears in block-selection category"
    (is (some #{:editor/add-reaction}
              (shortcut-config/get-category-shortcuts :shortcut.category/block-selection)))))

(comment
  (cljs.test/run-tests))
