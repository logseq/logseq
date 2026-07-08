(ns frontend.handler.db-based.property-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.db.async :as db-async]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.state :as state]
            [promesa.core :as p]))

(deftest batch-set-property-closed-value-loads-value-through-worker-test
  (async done
    (let [calls (atom [])
          original-get-property-closed-values db-async/<get-property-closed-values
          original-batch-set-property! db-property-handler/batch-set-property!]
      (set! db-async/<get-property-closed-values
            (fn [repo property-ident]
              (swap! calls conj [:get-property-closed-values repo property-ident])
              (p/resolved [{:db/id 41
                            :block/title "TODO"}
                           {:db/id 42
                            :logseq.property/value "DONE"}])))
      (set! db-property-handler/batch-set-property!
            (fn [block-ids property-id value opts]
              (swap! calls conj [:batch-set block-ids property-id value opts])
              (p/resolved nil)))
      (p/with-redefs [state/get-current-repo (constantly "test")]
        (-> (db-property-handler/batch-set-property-closed-value!
             [#uuid "11111111-1111-1111-1111-111111111111"]
             :logseq.property/status
             "DONE")
            (p/then
             (fn []
               (is (= [[:get-property-closed-values
                        "test"
                        :logseq.property/status]
                       [:batch-set
                        [#uuid "11111111-1111-1111-1111-111111111111"]
                        :logseq.property/status
                        42
                        {:entity-id? true}]]
                      @calls))))
            (p/catch
             (fn [error]
               (is false (str error))))
            (p/finally
             (fn []
               (set! db-async/<get-property-closed-values original-get-property-closed-values)
               (set! db-property-handler/batch-set-property! original-batch-set-property!)
               (done))))))))
