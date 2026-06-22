(ns mobile.deeplink-test
  (:require [cljs.test :refer [async deftest is testing]]
            [frontend.handler.graph :as graph-handler]
            [frontend.handler.route :as route-handler]
            [frontend.state :as state]
            [mobile.deeplink :as deeplink]
            [promesa.core :as p]))

(deftest web-page-url-switches-to-graph-id-target
  (async done
    (testing "mobile universal web links resolve graph-id before routing"
      (let [events (atom [])
            redirects (atom [])]
        (p/with-redefs [graph-handler/<get-graph-registry
                        (fn []
                          (p/resolved [{:repo "logseq_db_target"
                                        :graph-name "target"
                                        :graph-id "remote-uuid"}]))
                        state/get-current-repo (constantly "logseq_db_current")
                        state/get-repos (constantly [{:url "logseq_db_target"}])
                        state/pub-event! (fn [event] (swap! events conj event))
                        route-handler/redirect-to-page! (fn [page-id]
                                                          (swap! redirects conj page-id))]
          (-> (deeplink/deeplink "https://logseq.com/page/page-uuid?graph-id=remote-uuid")
              (p/then (fn [] (p/delay 1010)))
              (p/then (fn []
                        (is (= [[:graph/switch "logseq_db_target"]]
                               @events))
                        (is (= ["page-uuid"] @redirects))
                        (done)))
              (p/catch (fn [e]
                         (is false (str e))
                         (done)))))))))

(deftest web-page-url-routes-within-current-graph
  (async done
    (testing "mobile universal web links route when graph-id is already current"
      (let [redirects (atom [])]
        (p/with-redefs [graph-handler/<get-graph-registry
                        (fn []
                          (p/resolved [{:repo "logseq_db_target"
                                        :graph-name "target"
                                        :graph-id "remote-uuid"}]))
                        state/get-current-repo (constantly "logseq_db_target")
                        state/get-repos (constantly [{:url "logseq_db_target"}])
                        route-handler/redirect-to-page! (fn [page-id]
                                                          (swap! redirects conj page-id))]
          (-> (deeplink/deeplink "https://logseq.com/page/page-uuid?graph-id=remote-uuid")
              (p/then (fn [] (p/delay 5)))
              (p/then (fn []
                        (is (= ["page-uuid"] @redirects))
                        (done)))
              (p/catch (fn [e]
                         (is false (str e))
                         (done)))))))))
