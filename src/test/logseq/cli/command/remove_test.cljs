(ns logseq.cli.command.remove-test
  (:require [cljs.test :refer [async deftest is]]
            [logseq.cli.command.remove :as remove-command]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [promesa.core :as p]))

(deftest test-execute-remove-block-rejects-page-entity
  (async done
    (let [delete-called?* (atom false)
          action {:type :remove-block
                  :repo "demo-repo"
                  :graph "demo-graph"
                  :ids [190]
                  :multi-id? false}]
      (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                      (p/resolved (assoc config :base-url "http://example")))
                          transport/invoke (fn [_ method _ args]
                                             (case method
                                               :thread-api/pull
                                               (p/resolved {:db/id 190
                                                            :block/uuid (random-uuid)
                                                            :block/name "some-page"})

                                               :thread-api/apply-outliner-ops
                                               (do (reset! delete-called?* true)
                                                   (p/resolved nil))

                                               (throw (ex-info "unexpected invoke"
                                                               {:method method :args args}))))]
            (p/let [result (remove-command/execute-remove-block action {})]
              (is (= :error (:status result))
                  "should return error for page entity")
              (is (= :invalid-target (get-in result [:error :code])))
              (is (false? @delete-called?*)
                  "delete must not be called for page entity")))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-remove-block-multi-id-all-pages-returns-error
  (async done
    (let [delete-called?* (atom false)
          action {:type :remove-block
                  :repo "demo-repo"
                  :graph "demo-graph"
                  :ids [190]
                  :multi-id? true}]
      (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                      (p/resolved (assoc config :base-url "http://example")))
                          transport/invoke (fn [_ method _ _]
                                             (case method
                                               :thread-api/pull
                                               (p/resolved {:db/id 190
                                                            :block/uuid (random-uuid)
                                                            :block/name "some-page"})

                                               :thread-api/apply-outliner-ops
                                               (do (reset! delete-called?* true)
                                                   (p/resolved nil))

                                               (throw (ex-info "unexpected invoke" {:method method}))))]
            (p/let [result (remove-command/execute-remove-block action {})]
              (is (= :error (:status result)))
              (is (= :invalid-target (get-in result [:error :code])))
              (is (false? @delete-called?*))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-remove-block-by-id-uses-uuid-in-delete-op
  (async done
    (let [captured-ops* (atom nil)
          block-uuid (uuid "00000000-0000-0000-0000-000000000190")
          action {:type :remove-block
                  :repo "demo-repo"
                  :graph "demo-graph"
                  :ids [190]
                  :multi-id? false}]
      (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                      (p/resolved (assoc config :base-url "http://example")))
                          transport/invoke (fn [_ method _ args]
                                             (case method
                                               :thread-api/pull
                                               (p/resolved {:db/id 190
                                                            :block/uuid block-uuid})

                                               :thread-api/apply-outliner-ops
                                               (let [[_repo ops _opts] args]
                                                 (reset! captured-ops* ops)
                                                 (p/resolved nil))

                                               (throw (ex-info "unexpected invoke"
                                                               {:method method :args args}))))]
            (p/let [result (remove-command/execute-remove-block action {})]
              (is (= :ok (:status result)))
              (is (= [[:delete-blocks [[block-uuid] {}]]]
                     @captured-ops*))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))
