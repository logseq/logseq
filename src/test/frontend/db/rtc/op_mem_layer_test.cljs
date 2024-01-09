(ns frontend.db.rtc.op-mem-layer-test
  (:require [cljs.test :as t :refer [deftest is testing]]
            [clojure.core.async :as async :refer [<! go]]
            [cljs.core.async.interop :refer [p->c]]
            [frontend.db.rtc.idb-keyval-mock :include-macros true :as idb-keyval-mock]
            [frontend.db.rtc.op-idb-layer :as op-idb-layer]
            [frontend.db.rtc.op-mem-layer :as op-layer]
            #_:clj-kondo/ignore ["/frontend/idbkv" :as idb-keyval]
            [frontend.config :as config]))

(defn- make-db-graph-repo-name
  [s]
  (str config/db-version-prefix s))

(deftest add-ops-to-block-uuid->ops-test
  (testing "case1"
    (let [ops [["move" {:block-uuid "f4abd682-fb9e-4f1a-84bf-5fe11fe7844b" :epoch 1}]
               ["move" {:block-uuid "8e6d8355-ded7-4500-afaa-6f721f3b0dc6" :epoch 2}]]
          {:keys [block-uuid->ops epoch->block-uuid-sorted-map]}
          (op-layer/add-ops-aux (op-layer/ops-coercer ops) {} (sorted-map-by <) {} (sorted-map-by <))]
      (is (= [{#uuid"f4abd682-fb9e-4f1a-84bf-5fe11fe7844b"
               {:move ["move" {:block-uuid #uuid"f4abd682-fb9e-4f1a-84bf-5fe11fe7844b", :epoch 1}]},
               #uuid"8e6d8355-ded7-4500-afaa-6f721f3b0dc6"
               {:move ["move" {:block-uuid #uuid"8e6d8355-ded7-4500-afaa-6f721f3b0dc6", :epoch 2}]}}
              {1 #uuid"f4abd682-fb9e-4f1a-84bf-5fe11fe7844b", 2 #uuid"8e6d8355-ded7-4500-afaa-6f721f3b0dc6"}]
             [block-uuid->ops epoch->block-uuid-sorted-map]))))

  (testing "case2"
    (let [ops [["move" {:block-uuid "f639f13e-ef6f-4ba5-83b4-67527d27cd02" :epoch 1}]
               ["update" {:block-uuid "f639f13e-ef6f-4ba5-83b4-67527d27cd02" :epoch 2
                          :updated-attrs {:content nil}}]
               ["update" {:block-uuid "f639f13e-ef6f-4ba5-83b4-67527d27cd02" :epoch 4
                          :updated-attrs {:type {:add #{"type2" "type3"} :retract #{"type1"}}}}]
               ["update" {:block-uuid "f639f13e-ef6f-4ba5-83b4-67527d27cd02" :epoch 3
                          :updated-attrs {:type {:add #{"type1"}}}}]]
          {:keys [block-uuid->ops epoch->block-uuid-sorted-map]}
          (op-layer/add-ops-aux (op-layer/ops-coercer ops) {} (sorted-map-by <) {} (sorted-map-by <))]
      (is (= [{#uuid"f639f13e-ef6f-4ba5-83b4-67527d27cd02"
               {:move
                ["move" {:block-uuid #uuid"f639f13e-ef6f-4ba5-83b4-67527d27cd02", :epoch 1}],
                :update
                ["update" {:block-uuid #uuid"f639f13e-ef6f-4ba5-83b4-67527d27cd02",
                           :updated-attrs
                           {:content nil, :type {:add #{"type2" "type3"}, :retract #{"type1"}}},
                           :epoch 4}]}}
              {1 #uuid"f639f13e-ef6f-4ba5-83b4-67527d27cd02"}]
             [block-uuid->ops epoch->block-uuid-sorted-map]))))
  (testing "case3: :link"
    (let [ops [["move" {:block-uuid "f639f13e-ef6f-4ba5-83b4-67527d27cd02" :epoch 1}]
               ["update" {:block-uuid "f639f13e-ef6f-4ba5-83b4-67527d27cd02" :epoch 2
                          :updated-attrs {:content nil}}]
               ["update" {:block-uuid "f639f13e-ef6f-4ba5-83b4-67527d27cd02" :epoch 4
                          :updated-attrs {:content nil :link nil}}]]
          {:keys [block-uuid->ops]}
          (op-layer/add-ops-aux (op-layer/ops-coercer ops) {} (sorted-map-by <) {} (sorted-map-by <))]
      (is (= ["update"
              {:block-uuid #uuid "f639f13e-ef6f-4ba5-83b4-67527d27cd02"
               :updated-attrs {:content nil :link nil}
               :epoch 4}]
             (:update (block-uuid->ops #uuid"f639f13e-ef6f-4ba5-83b4-67527d27cd02"))))))
  (testing "case4: update-page then remove-page"
    (let [ops1 [["update-page" {:block-uuid #uuid "65564abe-1e79-4ae8-af60-215826cefea9" :epoch 1}]]
          ops2 [["remove-page" {:block-uuid #uuid "65564abe-1e79-4ae8-af60-215826cefea9" :epoch 2}]]
          {:keys [block-uuid->ops epoch->block-uuid-sorted-map asset-uuid->ops epoch->asset-uuid-sorted-map]}
          (op-layer/add-ops-aux (op-layer/ops-coercer ops1) {} (sorted-map-by <) {} (sorted-map-by <))
          {block-uuid->ops2 :block-uuid->ops}
          (op-layer/add-ops-aux (op-layer/ops-coercer ops2)
                                               block-uuid->ops epoch->block-uuid-sorted-map
                                               asset-uuid->ops epoch->asset-uuid-sorted-map)]
      (is (= {#uuid "65564abe-1e79-4ae8-af60-215826cefea9"
              {:remove-page ["remove-page" {:block-uuid #uuid "65564abe-1e79-4ae8-af60-215826cefea9", :epoch 2}]}}
             block-uuid->ops2)))))

(deftest add-ops-to-asset-uuid->ops-test
  (let [[uuid1 uuid2] (repeatedly random-uuid)
        ops1 [["update-asset" {:asset-uuid uuid1 :epoch 1}]
              ["update-asset" {:asset-uuid uuid2 :epoch 2}]]
        {:keys [asset-uuid->ops]}
        (op-layer/add-ops-aux (op-layer/ops-coercer ops1) {} (sorted-map-by <) {} (sorted-map-by <))]
    (is (= {uuid1 {:update-asset ["update-asset" {:asset-uuid uuid1 :epoch 1}]}
            uuid2 {:update-asset ["update-asset" {:asset-uuid uuid2 :epoch 2}]}}
           asset-uuid->ops))))


(deftest process-test
  (let [repo (make-db-graph-repo-name "process-test")
        ops1 [["move" {:block-uuid "f4abd682-fb9e-4f1a-84bf-5fe11fe7844b" :epoch 1}]
              ["move" {:block-uuid "8e6d8355-ded7-4500-afaa-6f721f3b0dc6" :epoch 2}]]
        ops2 [["update" {:block-uuid "f4abd682-fb9e-4f1a-84bf-5fe11fe7844b" :epoch 3
                         :updated-attrs {:content nil}}]]
        ops3 [["update" {:block-uuid "f4abd682-fb9e-4f1a-84bf-5fe11fe7844b" :epoch 4
                         :updated-attrs {:type {:add #{"type1"}}}}]]]
    (op-layer/init-empty-ops-store! repo)
    (op-layer/new-branch! repo)
    (let [{:keys [current-branch old-branch]} (@@#'op-layer/*ops-store repo)]
      (is (= current-branch old-branch)))
    (op-layer/add-ops! repo ops1)
    (op-layer/add-ops! repo ops2)
    (op-layer/update-local-tx! repo 10)
    (op-layer/update-graph-uuid! repo "b82c6c92-2d0f-4214-9411-3e9bdc2cefa6")
    (let [{:keys [current-branch old-branch]} (@@#'op-layer/*ops-store repo)]
      (is (not= (:local-tx current-branch) (:local-tx old-branch)))
      (is (= {#uuid"f4abd682-fb9e-4f1a-84bf-5fe11fe7844b"
              {:move
               ["move"
                {:block-uuid #uuid"f4abd682-fb9e-4f1a-84bf-5fe11fe7844b", :epoch 1}],
               :update
               ["update"
                {:block-uuid #uuid"f4abd682-fb9e-4f1a-84bf-5fe11fe7844b",
                 :epoch 3,
                 :updated-attrs {:content nil}}]},
              #uuid"8e6d8355-ded7-4500-afaa-6f721f3b0dc6"
              {:move
               ["move"
                {:block-uuid #uuid"8e6d8355-ded7-4500-afaa-6f721f3b0dc6", :epoch 2}]}}
             (:block-uuid->ops current-branch)))
      (is (= {1 #uuid"f4abd682-fb9e-4f1a-84bf-5fe11fe7844b" 2 #uuid"8e6d8355-ded7-4500-afaa-6f721f3b0dc6"}
             (:epoch->block-uuid-sorted-map current-branch))))
    (let [min-epoch-block-ops (op-layer/get-min-epoch-block-ops repo)]
      (is (= {:ops {:move ["move" {:block-uuid #uuid"f4abd682-fb9e-4f1a-84bf-5fe11fe7844b", :epoch 1}]
                    :update ["update" {:block-uuid #uuid"f4abd682-fb9e-4f1a-84bf-5fe11fe7844b", :epoch 3,
                                       :updated-attrs {:content nil}}]}
              :block-uuid #uuid"f4abd682-fb9e-4f1a-84bf-5fe11fe7844b"}
             min-epoch-block-ops)))
    (op-layer/remove-block-ops! repo #uuid"f4abd682-fb9e-4f1a-84bf-5fe11fe7844b")
    (let [{:keys [current-branch]} (@@#'op-layer/*ops-store repo)]
      (is (= {#uuid"8e6d8355-ded7-4500-afaa-6f721f3b0dc6"
              {:move ["move" {:block-uuid #uuid"8e6d8355-ded7-4500-afaa-6f721f3b0dc6", :epoch 2}]}}
             (:block-uuid->ops current-branch)))
      (is (= {2 #uuid"8e6d8355-ded7-4500-afaa-6f721f3b0dc6"}
             (:epoch->block-uuid-sorted-map current-branch))))
    (op-layer/add-ops! repo ops3)
    (let [{:keys [current-branch old-branch]} (@@#'op-layer/*ops-store repo)]
      (is (= {#uuid"8e6d8355-ded7-4500-afaa-6f721f3b0dc6"
              {:move
               ["move"
                {:block-uuid #uuid"8e6d8355-ded7-4500-afaa-6f721f3b0dc6", :epoch 2}]},
              #uuid"f4abd682-fb9e-4f1a-84bf-5fe11fe7844b"
              {:update
               ["update"
                {:block-uuid #uuid"f4abd682-fb9e-4f1a-84bf-5fe11fe7844b",
                 :epoch 4,
                 :updated-attrs {:type {:add #{"type1"}}}}]}}
             (:block-uuid->ops current-branch)))
      (is (= {2 #uuid"8e6d8355-ded7-4500-afaa-6f721f3b0dc6"
              4 #uuid"f4abd682-fb9e-4f1a-84bf-5fe11fe7844b"}
             (:epoch->block-uuid-sorted-map current-branch)))
      (is (= {#uuid"f4abd682-fb9e-4f1a-84bf-5fe11fe7844b"
              {:move
               ["move"
                {:block-uuid #uuid"f4abd682-fb9e-4f1a-84bf-5fe11fe7844b", :epoch 1}],
               :update
               ["update"
                {:block-uuid #uuid"f4abd682-fb9e-4f1a-84bf-5fe11fe7844b",
                 :updated-attrs
                 {:content nil, :type {:add #{"type1"}}},
                 :epoch 4}]},
              #uuid"8e6d8355-ded7-4500-afaa-6f721f3b0dc6"
              {:move
               ["move"
                {:block-uuid #uuid"8e6d8355-ded7-4500-afaa-6f721f3b0dc6", :epoch 2}]}}
             (:block-uuid->ops old-branch)))
      (is (= {1 #uuid"f4abd682-fb9e-4f1a-84bf-5fe11fe7844b"
              2 #uuid"8e6d8355-ded7-4500-afaa-6f721f3b0dc6"}
             (:epoch->block-uuid-sorted-map old-branch)))
      (op-layer/rollback! repo)
      (let [{current-branch* :current-branch} (@@#'op-layer/*ops-store repo)]
        (is (= current-branch* old-branch))))
    (op-layer/remove-ops-store! repo)))



(deftest load-from&sync-to-idb-test
  (t/async
   done
   (idb-keyval-mock/with-reset-idb-keyval-mock reset
     (go
       (let [repo (make-db-graph-repo-name "load-from&sync-to-idb-test")
             ops [["move" {:block-uuid "f639f13e-ef6f-4ba5-83b4-67527d27cd02" :epoch 1}]
                  ["update" {:block-uuid "f639f13e-ef6f-4ba5-83b4-67527d27cd02" :epoch 2
                             :updated-attrs {:content nil}}]
                  ["update" {:block-uuid "f639f13e-ef6f-4ba5-83b4-67527d27cd02" :epoch 4
                             :updated-attrs {:type {:add #{"type2" "type3"} :retract #{"type1"}}}}]
                  ["update" {:block-uuid "f639f13e-ef6f-4ba5-83b4-67527d27cd02" :epoch 3
                             :updated-attrs {:type {:add #{"type1"}}
                                             :tags {:add #{#uuid "b0bed412-ad52-4d87-8a08-80ac537e1b61"}}}}]]]
         (swap! op-idb-layer/stores dissoc repo)
         (op-layer/init-empty-ops-store! repo)
         (op-layer/add-ops! repo ops)
         (op-layer/update-local-tx! repo 1)
         (let [repo-ops-store1 (@@#'op-layer/*ops-store repo)]
           (<! (op-layer/<sync-to-idb-layer! repo))
           (op-layer/remove-ops-store! repo)
           (<! (p->c (op-layer/<init-load-from-indexeddb! repo)))
           (let [repo-ops-store2 (@@#'op-layer/*ops-store repo)]
             (is (= {:current-branch
                     {:block-uuid->ops
                      {#uuid"f639f13e-ef6f-4ba5-83b4-67527d27cd02"
                       {:move
                        ["move"
                         {:epoch 1, :block-uuid #uuid"f639f13e-ef6f-4ba5-83b4-67527d27cd02"}],
                        :update
                        ["update"
                         {:block-uuid #uuid"f639f13e-ef6f-4ba5-83b4-67527d27cd02",
                          :updated-attrs
                          {:content nil,
                           :type {:add #{"type3" "type2"}, :retract #{"type1"}}
                           :tags {:add #{#uuid "b0bed412-ad52-4d87-8a08-80ac537e1b61"}}},
                          :epoch 4}]}},
                      :epoch->block-uuid-sorted-map
                      {1 #uuid"f639f13e-ef6f-4ba5-83b4-67527d27cd02"}
                      :asset-uuid->ops {}
                      :epoch->asset-uuid-sorted-map {}
                      :local-tx 1}}
                    repo-ops-store1))
             (is (= repo-ops-store1 repo-ops-store2)))))
       (reset)
       (done)))))
