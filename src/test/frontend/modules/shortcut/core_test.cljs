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

    ;; A plain leader key in the same handler must block existing chords that
    ;; start with that leader, otherwise those chords become dormant at runtime.
    (let [leader-conflicts (->> (dh/get-conflicts-by-keys ["t"])
                                (vals)
                                (mapcat vals)
                                (map first)
                                (set))]
      (is (contains? leader-conflicts "t n"))
      (is (contains? leader-conflicts "t b")))

    ;; mod+c should find :editor/copy (exact match). Because the keymap dialog
    ;; checks co-active handlers together, it must also surface same-handler
    ;; chord-prefix clashes that would otherwise leave chords dormant at
    ;; runtime.
    (let [conflicts (dh/get-conflicts-by-keys
                     "mod+c" :shortcut.handler/global-prevent-default
                     {:group-global? true})
          all-ids (->> (vals conflicts)
                       (mapcat vals)
                       (mapcat #(keys (second %)))
                       (set))]
      (is (contains? all-ids :editor/copy)
          "exact match is a blocking conflict")
      (is (contains? all-ids :sidebar/clear)
          "same-handler chord prefix mod+c mod+c must block assignment")
      (is (contains? all-ids :search/re-index)
          "same-handler chord prefix mod+c mod+s must block assignment"))

    ;; On the SAME handler instance, a simple key and a chord with the same
    ;; leading stroke cannot coexist. The UI must still block these assignments
    ;; because runtime registration will otherwise silently leave the chord
    ;; dormant.
    (let [same-handler-conflicts (dh/get-conflicts-by-keys
                                  "mod+c" :shortcut.handler/global-prevent-default
                                  {:group-global? false})
          all-ids (->> (vals same-handler-conflicts)
                       (mapcat vals)
                       (mapcat #(keys (second %)))
                       (set))]
      (is (contains? all-ids :sidebar/clear)
          "same-handler chord prefix mod+c mod+c must block assignment")
      (is (contains? all-ids :search/re-index)
          "same-handler chord prefix mod+c mod+s must block assignment"))

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

(deftest test-partition-conflicts-by-type
  (testing "mod+c partitions into exact and prefix conflicts"
    (let [conflicts (dh/get-conflicts-by-keys
                     "mod+c" :shortcut.handler/global-prevent-default
                     {:group-global? true})
          {:keys [exact prefix]} (dh/partition-conflicts-by-type conflicts "mod+c")
          exact-ids (->> (vals exact) (mapcat vals) (mapcat #(keys (second %))) (set))
          prefix-ids (->> (vals prefix) (mapcat vals) (mapcat #(keys (second %))) (set))]
      (is (contains? exact-ids :editor/copy)
          "editor/copy is an exact match for mod+c")
      (is (contains? prefix-ids :sidebar/clear)
          "sidebar/clear (mod+c mod+c) is a prefix conflict")
      (is (contains? prefix-ids :search/re-index)
          "search/re-index (mod+c mod+s) is a prefix conflict")
      (is (not (contains? exact-ids :sidebar/clear))
          "sidebar/clear should NOT be in exact")
      (is (not (contains? prefix-ids :editor/copy))
          "editor/copy should NOT be in prefix")))

  (testing "conflict-has-exact? returns true when exact matches exist"
    (let [conflicts (dh/get-conflicts-by-keys
                     "mod+c" :shortcut.handler/global-prevent-default
                     {:group-global? true})]
      (is (true? (dh/conflict-has-exact? conflicts "mod+c")))))

  (testing "conflict-has-exact? returns false for prefix-only"
    ;; "t" on global-prevent-default has chord conflicts (t n, t b) but no exact match
    (let [conflicts (dh/get-conflicts-by-keys
                     "t" :shortcut.handler/global-prevent-default
                     {:exclude-ids #{} :group-global? false})]
      (is (false? (dh/conflict-has-exact? conflicts "t"))))))

(deftest test-same-handler-prefix-detection
  (testing "prefix conflicts are only detected within the same handler"
    ;; Prefix overlaps only cause chord dormancy on the SAME Closure handler
    ;; instance. Cross-handler prefixes work fine because each handler has
    ;; its own independent key tree and state machine.
    (let [conflicts (dh/get-conflicts-by-keys
                     "t" :shortcut.handler/global-prevent-default
                     {:exclude-ids #{} :group-global? true})
          all-keys (->> (vals conflicts) (mapcat vals) (map first) (set))]
      ;; Same-handler chords (global-prevent-default has t n, t b) — detected
      (is (contains? all-keys "t n"))
      (is (contains? all-keys "t b"))
      ;; Cross-handler chords from global-non-editing-only — NOT detected
      ;; because they're on a different handler and still work at runtime
      (is (not (contains? all-keys "t d"))
          "t d from global-non-editing-only should NOT be detected (cross-handler)")
      (is (not (contains? all-keys "t r"))
          "t r from global-non-editing-only should NOT be detected (cross-handler)"))))

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
