(ns logseq.cli.command.list-test
  (:require [cljs.test :refer [async deftest is]]
            [logseq.cli.command.list :as list-command]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [promesa.core :as p]))

(deftest test-execute-list-page-renders-block-ref-labels
  (async done
         (let [ref-uuid "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
               calls* (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                               transport/invoke (fn [_ method _ args]
                                                  (swap! calls* conj {:method method :args args})
                                                  (case method
                                                    :thread-api/cli-list-pages
                                                    [{:db/id 1
                                                      :block/title (str "Project [[" ref-uuid "]]" )}]

                                                    :thread-api/pull
                                                    {:db/id 42
                                                     :block/uuid (uuid ref-uuid)
                                                     :block/title "Home"}

                                                    nil))]
                 (p/let [result (list-command/execute-list-page
                                 {:type :list-page
                                  :repo "demo"
                                  :options {}}
                                 {})]
                   (is (= :ok (:status result)))
                   (is (= [{:db/id 1
                            :block/title "Project [[Home]]"}]
                          (get-in result [:data :items])))
                   (is (= [:thread-api/cli-list-pages :thread-api/pull]
                          (mapv :method @calls*)))
                   (is (= ["demo"
                           [:db/id :block/uuid :block/title :block/name]
                           [:block/uuid (uuid ref-uuid)]]
                          (-> @calls* second :args)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-list-node-renders-title-like-fields-through-block-ref-labels
  (async done
         (let [ref-uuid "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
               calls* (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                               transport/invoke (fn [_ method _ args]
                                                  (swap! calls* conj {:method method :args args})
                                                  (case method
                                                    :thread-api/cli-list-nodes
                                                    [{:db/id 9
                                                      :block/title (str "Task [[" ref-uuid "]]" )
                                                      :block/page-title (str "Page [[" ref-uuid "]]" )
                                                      :node/type "block"
                                                      :block/page-id 2}]

                                                    :thread-api/pull
                                                    {:db/id 100
                                                     :block/uuid (uuid ref-uuid)
                                                     :block/title "Resolved page"}

                                                    nil))]
                 (p/let [result (list-command/execute-list-node
                                 {:type :list-node
                                  :repo "demo"
                                  :options {}}
                                 {})]
                   (is (= :ok (:status result)))
                   (is (= [{:db/id 9
                            :block/title "Task [[Resolved page]]"
                            :block/page-title "Page [[Resolved page]]"
                            :node/type "block"
                            :block/page-id 2}]
                          (get-in result [:data :items])))
                   (is (= [:thread-api/cli-list-nodes :thread-api/pull]
                          (mapv :method @calls*)))
                   (is (= ["demo"
                           [:db/id :block/uuid :block/title :block/name]
                           [:block/uuid (uuid ref-uuid)]]
                          (-> @calls* second :args)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))
