(ns frontend.components.icon-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.icon :as icon]))

;; Pre-existing tests for `normalize-tabs` and `emoji-sections` were removed
;; in this commit because those private helpers no longer exist in
;; frontend.components.icon (the file has been refactored several times since
;; the tests were written). Phase 1 of the avatar-shape-and-fallback work adds
;; the avatar-shape coverage below; broader test backfill is tracked outside
;; this PR.

(deftest normalize-icon-avatar-shape
  (testing "legacy avatars without :shape default to :circle (backward compat)"
    (let [normalized (icon/normalize-icon {:type :avatar :data {:value "JK"}})]
      (is (= :circle (get-in normalized [:data :shape])))
      (is (= "JK" (get-in normalized [:data :value])))))

  (testing "avatars preserve :shape :rounded-rect when stored"
    (let [normalized (icon/normalize-icon
                      {:type :avatar :data {:value "AC" :shape :rounded-rect}})]
      (is (= :rounded-rect (get-in normalized [:data :shape])))))

  (testing "avatars preserve :shape :circle when explicitly set"
    (let [normalized (icon/normalize-icon
                      {:type :avatar :data {:value "X" :shape :circle}})]
      (is (= :circle (get-in normalized [:data :shape])))))

  (testing "shape is read-through from a top-level :shape key (legacy shape)"
    ;; defensive: some older serializations stored :shape outside :data
    (let [normalized (icon/normalize-icon
                      {:type :avatar :shape :rounded-rect :data {:value "X"}})]
      (is (= :rounded-rect (get-in normalized [:data :shape])))))

  (testing "shape coexists with color + image without disturbing them"
    (let [normalized (icon/normalize-icon
                      {:type :avatar
                       :data {:value "X"
                              :shape :rounded-rect
                              :color "#FF802B"
                              :backgroundColor "#FF802B"
                              :asset-uuid "abc-123"
                              :asset-type "png"}})]
      (is (= :rounded-rect (get-in normalized [:data :shape])))
      (is (= "#FF802B"     (get-in normalized [:data :color])))
      (is (= "#FF802B"     (get-in normalized [:data :backgroundColor])))
      (is (= "abc-123"     (get-in normalized [:data :asset-uuid])))
      (is (= "png"         (get-in normalized [:data :asset-type]))))))
