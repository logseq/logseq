(ns frontend.components.page-model-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.page-model :as model]))

(deftest page-body-ready-does-not-wait-for-breadcrumb-test
  (testing "A ready page block is enough to paint the tree"
    (is (true? (model/page-body-ready? {:block/uuid (random-uuid)
                                        :block/title "Parent"})))
    (is (false? (model/page-body-ready? nil)))))

(deftest attach-inline-breadcrumb-is-optional-test
  (let [page {:block/uuid (random-uuid) :block/title "Parent"}]
    (is (= page (model/attach-inline-breadcrumb page nil))
        "Missing breadcrumb must leave the page body renderable")
    (is (= (assoc page :block.temp/breadcrumb [{:block/title "Root"}])
           (model/attach-inline-breadcrumb page [{:block/title "Root"}])))))

(deftest resolve-page-view-keeps-last-ready-while-loading-test
  (let [option {:current-page? true}
        page-uuid (random-uuid)
        other-uuid (random-uuid)
        last-ready {:option {:id "previous"} :page-uuid page-uuid}]
    (is (= {:option option :page-uuid page-uuid}
           (model/resolve-page-view :ready page-uuid option last-ready)))
    (is (= {:option option :page-uuid other-uuid}
           (model/resolve-page-view :ready other-uuid option last-ready))
        "A different ready page replaces the last-ready view")
    (is (= last-ready
           (model/resolve-page-view :loading nil option last-ready))
        "Zoom-back remount must keep the previous page instead of rendering nil")
    (is (nil? (model/resolve-page-view :loading nil option nil)))
    (is (nil? (model/resolve-page-view :ready nil option last-ready))
        "A ready missing page is not-found, not the previous view")
    (is (nil? (model/resolve-page-view :error :boom option last-ready))
        "An error must not restore the previous page")))

(deftest remembered-page-view-stays-on-the-main-route-test
  (let [repo "graph-a"
        view {:option {:id "page"} :page-uuid (random-uuid)}
        cached (model/remember-ready-page-view nil repo {:current-page? true} view)]
    (is (= repo (:repo cached)))
    (is (= view (model/remembered-page-view cached repo {:current-page? true})))
    (is (= view (model/remembered-page-view cached repo {:mobile-page? true})))
    (is (nil? (model/remembered-page-view cached repo {:sidebar? true}))
        "Sidebar pages must not reuse the main-route last-ready view")
    (is (nil? (model/remembered-page-view cached repo {:page-name "plugin-page"}))
        "Plugin page-cp callers must not reuse the main-route last-ready view")
    (is (nil? (model/remembered-page-view cached "graph-b" {:current-page? true})))
    (is (= cached
           (model/remember-ready-page-view cached repo {:sidebar? true} view)))
    (is (= cached
           (model/remember-ready-page-view cached repo {:page-name "plugin-page"} view))
        "Plugin page-cp callers must not steal the main-route last-ready view")
    (is (some? (model/remember-ready-page-view nil repo {:mobile-page? true} view)))
    (is (nil? (model/remember-ready-page-view cached "graph-b" {:current-page? true} nil))
        "A graph switch must drop the previous graph's last-ready view")
    (is (nil? (model/remember-ready-page-view cached "graph-b" {:sidebar? true} view))
        "A graph switch must not keep the previous graph even from sidebar pages")
    (let [next-view {:option {:id "other"} :page-uuid (random-uuid)}
          next-cached (model/remember-ready-page-view cached "graph-b" {:current-page? true} next-view)]
      (is (= "graph-b" (:repo next-cached)))
      (is (= next-view (model/remembered-page-view next-cached "graph-b" {:current-page? true}))))))

(deftest cached-route-page-uuid-skips-identity-when-warm-test
  (let [page-uuid (random-uuid)]
    (is (= page-uuid
           (model/cached-route-page-uuid page-uuid nil :ready)))
    (is (nil? (model/cached-route-page-uuid page-uuid "heading" :ready))
        "Page-block heading routes still resolve through :route-block")
    (is (nil? (model/cached-route-page-uuid page-uuid nil :loading)))
    (is (nil? (model/cached-route-page-uuid page-uuid nil :missing)))
    (is (nil? (model/cached-route-page-uuid "page name" nil :ready)))))
