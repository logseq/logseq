(ns frontend.handler.db-based.property-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.db.async :as db-async]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.state :as state]
            [promesa.core :as p]))

(deftest set-block-property-resolves-numeric-block-id-test
  (async done
    (let [block-uuid #uuid "11111111-1111-1111-1111-111111111111"
          calls (atom [])
          original-get-block db-async/<get-block
          original-set-block-property! outliner-op/set-block-property!]
      (set! db-async/<get-block
            (fn [repo id opts]
              (swap! calls conj [:get-block repo id opts])
              (p/resolved {:block/uuid block-uuid})))
      (set! outliner-op/set-block-property!
            (fn [block-id property-id value]
              (swap! calls conj [:set-block-property block-id property-id value])))
      (-> (p/with-redefs [state/get-current-repo (constantly "test")]
            (db-property-handler/set-block-property!
             197 :logseq.property.asset/last-visit-page 1))
          (p/then
           (fn []
             (is (= [[:get-block "test" 197 {:children? false}]
                     [:set-block-property block-uuid :logseq.property.asset/last-visit-page 1]]
                    @calls))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally
           (fn []
             (set! db-async/<get-block original-get-block)
             (set! outliner-op/set-block-property! original-set-block-property!)
             (done)))))))

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
