(ns electron.release-warning-test
  (:require [cljs.test :refer [deftest is testing]]
            [electron.release-warning :as release-warning]))

(deftest x64-on-apple-silicon?-test
  (testing "returns true only when an x64 release runs under Apple Silicon translation"
    (is (true? (release-warning/x64-on-apple-silicon?
                {:platform "darwin"
                 :arch "x64"
                 :running-under-arm64-translation? true})))
    (is (false? (release-warning/x64-on-apple-silicon?
                 {:platform "darwin"
                  :arch "arm64"
                  :running-under-arm64-translation? false})))
    (is (false? (release-warning/x64-on-apple-silicon?
                 {:platform "darwin"
                  :arch "x64"
                  :running-under-arm64-translation? false})))
    (is (false? (release-warning/x64-on-apple-silicon?
                 {:platform "win32"
                  :arch "x64"
                  :running-under-arm64-translation? true})))))

(deftest selected-release-url-test
  (testing "prefers stable release link and supports nightly fallback"
    (is (= release-warning/stable-release-url
           (release-warning/selected-release-url 0)))
    (is (= release-warning/nightly-release-url
           (release-warning/selected-release-url 1)))
    (is (nil? (release-warning/selected-release-url 2)))
    (is (nil? (release-warning/selected-release-url nil)))))
