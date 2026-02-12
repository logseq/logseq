(ns frontend.components.icon-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.icon :as icon]))

(deftest normalize-tabs
  (testing "limits tabs and default tab selection"
    (let [{:keys [tabs default-tab has-icon-tab?]}
          (#'icon/normalize-tabs [[:emoji "Emojis"]] nil)]
      (is (= [[:emoji "Emojis"]] tabs))
      (is (= :emoji default-tab))
      (is (false? has-icon-tab?)))))

(deftest emoji-sections
  (testing "includes frequently used before emojis when enabled"
    (let [used [{:id "star" :type :emoji}
                {:id "alert-circle" :type :tabler-icon}]
          emojis [{:id "a"} {:id "b"}]
          sections (#'icon/emoji-sections emojis used true)]
      (is (= ["Frequently used" "Emojis (2)"]
             (map :title sections)))
      (is (= [{:id "star" :type :emoji}]
             (-> sections first :items))))))

(deftest emoji-sections-layout
  (testing "frequently used uses non-virtual list while emojis remain virtual"
    (let [used [{:id "star" :type :emoji}]
          emojis [{:id "a"}]
          sections (#'icon/emoji-sections emojis used true)]
      (is (false? (-> sections first :virtual-list?)))
      (is (true? (-> sections second :virtual-list?))))))
