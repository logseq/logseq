(ns frontend.components.left-sidebar-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.left-sidebar-util :as sidebar-util]
            [frontend.state :as state]
            [logseq.common.uuid :as common-uuid]))

(def ^:private checked-tag-navs
  [:flashcards :all-pages :graph-view :tag/tasks :tag/assets])

(defn- uuids-from-unready-pull
  "What the old one-shot :thread-api/pull effect stored when the worker threw
   or the datascript conn was not ready yet."
  [pulled-classes]
  (zipmap [:logseq.class/Asset :logseq.class/Task]
          (map :block/uuid pulled-classes)))

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

(deftest checked-tag-navs-skip-when-class-uuids-missing-test
  (testing "empty or nil lookup skips Tasks and Assets"
    (is (= [] (sidebar-util/visible-tag-navs checked-tag-navs {})))
    (is (= [] (sidebar-util/visible-tag-navs checked-tag-navs nil))))
  (testing "a nil uuid from an early worker pull also skips the item"
    (is (nil? (sidebar-util/tag-nav-page-uuid
               :tag/tasks
               {:logseq.class/Task nil
                :logseq.class/Asset nil})))
    (is (= [] (sidebar-util/visible-tag-navs
               [:tag/tasks :tag/assets]
               (uuids-from-unready-pull [nil nil])))))
  (testing "partial lookup only mounts the nav whose class uuid exists"
    (let [task-uuid (sidebar-util/built-in-class-uuid :logseq.class/Task)]
      (is (= [:tag/tasks]
             (sidebar-util/visible-tag-navs
              checked-tag-navs
              {:logseq.class/Task task-uuid}))))))

(deftest checked-tag-navs-render-once-class-uuids-exist-test
  (let [task-uuid (sidebar-util/built-in-class-uuid :logseq.class/Task)
        asset-uuid (sidebar-util/built-in-class-uuid :logseq.class/Asset)
        class-ident->uuid {:logseq.class/Task task-uuid
                           :logseq.class/Asset asset-uuid}]
    (is (= task-uuid (sidebar-util/tag-nav-page-uuid :tag/tasks class-ident->uuid)))
    (is (= asset-uuid (sidebar-util/tag-nav-page-uuid :tag/assets class-ident->uuid)))
    (is (= [:tag/tasks :tag/assets]
           (sidebar-util/visible-tag-navs checked-tag-navs class-ident->uuid)))))

(deftest built-in-nav-class-uuids-do-not-need-db-worker-test
  (testing "file graphs have no Task/Asset class pages"
    (is (nil? (sidebar-util/nav-class-ident->uuid false))))
  (testing "db-graph uuids stay available when worker invoke would throw"
    (with-redefs [state/<invoke-db-worker
                  (fn [& _args]
                    (throw (ex-info "db-worker has not been initialized" {})))]
      (let [uuids (sidebar-util/nav-class-ident->uuid true)
            task-uuid (get uuids :logseq.class/Task)
            asset-uuid (get uuids :logseq.class/Asset)]
        (is (= (common-uuid/gen-uuid :db-ident-block-uuid :logseq.class/Task)
               task-uuid))
        (is (= (common-uuid/gen-uuid :db-ident-block-uuid :logseq.class/Asset)
               asset-uuid))
        (is (= [:tag/tasks :tag/assets]
               (sidebar-util/visible-tag-navs [:tag/tasks :tag/assets] uuids))))))
  (testing "an unready conn pull leaves checked tag navs hidden; built-in uuids do not"
    (let [from-pull (uuids-from-unready-pull [nil nil])
          from-idents (sidebar-util/nav-class-ident->uuid true)]
      (is (= [] (sidebar-util/visible-tag-navs [:tag/tasks :tag/assets] from-pull)))
      (is (= [:tag/tasks :tag/assets]
             (sidebar-util/visible-tag-navs [:tag/tasks :tag/assets] from-idents))))))
