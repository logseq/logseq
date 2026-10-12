(ns frontend.utils-clipboard-test
  (:require ["/frontend/utils" :as utils]
            [cljs.test :refer [deftest is testing]]))

(defn- fake-window
  "A window whose navigator records clipboard writes. permissions-query is the
  browser's navigator.permissions.query."
  [permissions-query]
  (let [writes (atom [])
        record (fn [x] (swap! writes conj x) (js/Promise.resolve nil))]
    {:writes writes
     :window #js {:navigator #js {:permissions #js {:query permissions-query}
                                  :clipboard #js {:write record
                                                  :writeText record}}}}))

(defn- copy!
  [window]
  (some-> (utils/writeClipboard #js {:text "((block-ref))"} window)
          (.catch (fn [_]))))

(deftest write-clipboard-when-permission-query-rejects
  (testing "Firefox and Safari reject a `clipboard-write` permission query; the copy still happens"
    (let [{:keys [writes window]} (fake-window (fn [_] (js/Promise.reject (js/TypeError. "clipboard-write is not a valid permission name"))))]
      (copy! window)
      (is (= 1 (count @writes))))))

(deftest write-clipboard-within-the-user-gesture
  (testing "The write starts synchronously, while the click's user activation lasts (Safari requires it)"
    (let [{:keys [writes window]} (fake-window (fn [_] (js/Promise.resolve #js {:state "granted"})))]
      (copy! window)
      (is (= 1 (count @writes))))))
