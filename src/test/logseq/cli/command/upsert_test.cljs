(ns logseq.cli.command.upsert-test
  (:require [cljs.test :refer [async deftest is]]
            [logseq.cli.command.upsert :as upsert-command]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [promesa.core :as p]))

(deftest test-execute-upsert-tag-create-creates-tag-when-missing
  (async done
    (let [q-calls* (atom 0)
          create-called?* (atom false)
          action {:type :upsert-tag
                  :mode :create
                  :repo "demo-repo"
                  :graph "demo-graph"
                  :name "TagOne"}]
      (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                      (p/resolved (assoc config :base-url "http://example")))
                          transport/invoke (fn [_ method _ args]
                                             (case method
                                               :thread-api/q
                                               (let [[_ [query _]] args
                                                     where (:where query)
                                                     malformed-where? (and (= 1 (count where))
                                                                           (vector? (first where))
                                                                           (> (count (first where)) 3))]
                                                 (if malformed-where?
                                                   (throw (ex-info "Index out of bounds" {:code :http-error}))
                                                   (do
                                                     (swap! q-calls* inc)
                                                     (if (= 1 @q-calls*)
                                                       (p/resolved [])
                                                       (p/resolved [{:db/id 42
                                                                     :block/name "tagone"
                                                                     :block/title "TagOne"
                                                                     :block/tags [{:db/ident :logseq.class/Tag}]}])))))

                                               :thread-api/apply-outliner-ops
                                               (do
                                                 (reset! create-called?* true)
                                                 (p/resolved nil))

                                               (throw (ex-info "unexpected invoke"
                                                               {:method method
                                                                :args args}))))]
            (p/let [result (upsert-command/execute-upsert-tag action {})]
              (is (= :ok (:status result)))
              (is (= [42] (get-in result [:data :result])))
              (is @create-called?*)
              (is (= 2 @q-calls*))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))
