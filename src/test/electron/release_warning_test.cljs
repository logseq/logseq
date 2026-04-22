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

(deftest warning-dialog-options-test
  (testing "includes warning text and both stable/nightly actions"
    (let [calls (atom [])
          t (fn [k]
              (swap! calls conj k)
              (name k))
          options (release-warning/warning-dialog-options t)]
      (is (= "warning" (:type options)))
      (is (= ["wrong-release-open-stable"
              "wrong-release-open-nightly"
              "cancel"]
             (:buttons options)))
      (is (= 0 (:defaultId options)))
      (is (= 2 (:cancelId options)))
      (is (= "wrong-release-warning-title" (:message options)))
      (is (= "wrong-release-warning-detail" (:detail options)))
      (is (= [:electron/wrong-release-open-stable
              :electron/wrong-release-open-nightly
              :electron/cancel
              :electron/wrong-release-warning-title
              :electron/wrong-release-warning-detail]
             @calls)))))
