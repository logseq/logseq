(ns frontend.components.left-sidebar-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.left-sidebar :as left-sidebar]
            [frontend.components.left-sidebar-util :as sidebar-util]
            [frontend.state :as state]
            [promesa.core :as p]))

(deftest mobile-sidebar-navigation-target-test
  (let [target (fn [matching-selector]
                 #js {:closest (fn [selector]
                                 (when (= matching-selector selector)
                                   #js {}))})]
    (testing "links that navigate away from the mobile sidebar"
      (doseq [selector [".sidebar-navigations a"
                        ".favorites .bd"
                        ".recent .bd"
                        ".nav-header"]]
        (is (true? (sidebar-util/mobile-navigation-target? (target selector)))
            selector)))
    (testing "popup triggers and unrelated sidebar controls"
      (is (false? (sidebar-util/mobile-navigation-target?
                   (target ".dropdown-wrapper"))))
      (is (false? (sidebar-util/mobile-navigation-target? (target nil)))))))

(deftest nav-class-uuids-are-not-loaded-before-db-worker-is-ready
  (let [calls (atom [])]
    (with-redefs [state/<invoke-db-worker (fn [& args]
                                            (swap! calls conj args))]
      (is (nil? (left-sidebar/<load-nav-class-uuids "graph" false)))
      (is (empty? @calls)))))

(deftest nav-class-uuids-are-loaded-after-db-worker-is-ready
  (let [calls (atom [])]
    (with-redefs [state/<invoke-db-worker (fn [api repo selector ident]
                                            (swap! calls conj [api repo selector ident])
                                            (p/resolved {:block/uuid ident}))]
      (let [result (left-sidebar/<load-nav-class-uuids "graph" true)]
        (is (some? result))
        (is (= [[:thread-api/pull "graph" [:block/uuid] :logseq.class/Asset]
                [:thread-api/pull "graph" [:block/uuid] :logseq.class/Task]]
               @calls))))))
