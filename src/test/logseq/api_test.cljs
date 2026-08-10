(ns logseq.api-test
  (:require [cljs-bean.core :as bean]
            [cljs.test :refer [async use-fixtures deftest is]]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.conn :as conn]
            [frontend.db.utils :as db-utils]
            [frontend.test.helper :as test-helper]
            [logseq.api.block :as api-block]
            [promesa.core :as p]))

(use-fixtures :each {:before #(test-helper/start-test-db! {:build-init-data? false})
                     :after test-helper/destroy-test-db!})

(def ^:private block-pull-selector
  '[:db/id
    :block/uuid
    :block/title
    {:block/refs [:db/id :block/uuid :block/title]}
    {:block/parent [:db/id]}
    {:block/page [:db/id :block/uuid :block/title]}])

(defn- block-by-id
  [test-db id]
  (when-let [entity (db-utils/entity test-db (if (uuid? id) [:block/uuid id] id))]
    (d/pull test-db block-pull-selector (:db/id entity))))

(defn- block-descendants
  [test-db block]
  (letfn [(children [parent]
            (->> (:block/_parent (d/entity test-db (:db/id parent)))
                 (map #(d/pull test-db block-pull-selector (:db/id %)))
                 (mapcat (fn [child] (cons child (children child))))))]
    (vec (children block))))

(defn- <test-get-block-with-children
  [_repo id & _opts]
  (let [test-db (conn/get-db test-helper/test-db)
        block (block-by-id test-db id)]
    (p/resolved {:block block
                 :children (block-descendants test-db block)})))

(defn- <test-get-block
  [_repo id & _opts]
  (p/resolved (block-by-id (conn/get-db test-helper/test-db) id)))

(defn- <test-get-block-immediate-children
  [_repo block-uuid]
  (let [test-db (conn/get-db test-helper/test-db)
        block (block-by-id test-db block-uuid)]
    (p/resolved
     (->> (:block/_parent (d/entity test-db (:db/id block)))
          (mapv #(d/pull test-db block-pull-selector (:db/id %)))))))

(deftest get-block
  (async done
    (db/transact! test-helper/test-db
                  [{:db/id 10000
                    :block/uuid #uuid "4406f839-6410-43b5-87db-25e9b8f54cc0"
                    :block/title "1"}
                   {:db/id 10001
                    :block/uuid #uuid "d9b7b45f-267f-4794-9569-f43d1ce77172"
                    :block/refs #{10000}
                    :block/title "2 [[4406f839-6410-43b5-87db-25e9b8f54cc0]]"}
                   {:db/id 10002
                    :block/uuid #uuid "adae3006-f03e-4814-a1f5-f17f15b86556"
                    :block/parent 10001
                    :block/title "3"}
                   {:db/id 10003
                    :block/uuid #uuid "0c3053c3-2dab-4769-badd-14ce16d8ba8d"
                    :block/parent 10002
                    :block/title "4"}])
    (-> (p/with-redefs [db-async/<get-block <test-get-block
                         db-async/<get-block-immediate-children <test-get-block-immediate-children
                         db-async/<get-block-with-children <test-get-block-with-children]
          (p/let [block-10000 (api-block/get_block 10000 #js {})
                  block-by-string (api-block/get_block "d9b7b45f-267f-4794-9569-f43d1ce77172" #js {})
                  block-by-uuid (api-block/get_block #uuid "d9b7b45f-267f-4794-9569-f43d1ce77172" #js {})
                  block-without-children (api-block/get_block 10001 #js {:includeChildren false})
                  block-with-children (api-block/get_block 10001 #js {:includeChildren true})]
            (is (= (:title (bean/->clj block-10000)) "1"))
            (is (= (:content (bean/->clj block-10000)) "1"))
            (is (= (:title (bean/->clj block-by-string)) "2 [[4406f839-6410-43b5-87db-25e9b8f54cc0]]"))
            (is (= (:fullTitle (bean/->clj block-by-string)) "2 [[1]]"))
            (is (= (:title (bean/->clj block-by-uuid)) "2 [[4406f839-6410-43b5-87db-25e9b8f54cc0]]"))
            (is (= {:id 10001, :title "2 [[4406f839-6410-43b5-87db-25e9b8f54cc0]]", :uuid "d9b7b45f-267f-4794-9569-f43d1ce77172", :children [["uuid" "adae3006-f03e-4814-a1f5-f17f15b86556"]]}
                   (select-keys (js->clj block-without-children :keywordize-keys true)
                                [:id :title :uuid :children])))
            ;; NOTE: `content` key is to be compatible with old APIs
            (is (= {:id 10001, :refs [{:id 10000}], :title "2 [[4406f839-6410-43b5-87db-25e9b8f54cc0]]", :uuid "d9b7b45f-267f-4794-9569-f43d1ce77172", :children [{:id 10002, :parent {:id 10001}, :title "3", :uuid "adae3006-f03e-4814-a1f5-f17f15b86556", :level 1, :children [{:id 10003, :parent {:id 10002}, :title "4", :uuid "0c3053c3-2dab-4769-badd-14ce16d8ba8d", :level 2, :children [], :content "4", :fullTitle "4"}], :content "3", :fullTitle "3"}], :content "2 [[4406f839-6410-43b5-87db-25e9b8f54cc0]]", :fullTitle "2 [[1]]"}
                   (js->clj block-with-children :keywordize-keys true)))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest get-block-includes-descendants-under-collapsed-blocks-test
  (async done
    (let [requested-options (atom nil)
          block {:db/id 10001
                 :block/uuid #uuid "d9b7b45f-267f-4794-9569-f43d1ce77172"
                 :block/title "root"}
          child {:db/id 10002
                 :block/uuid #uuid "adae3006-f03e-4814-a1f5-f17f15b86556"
                 :block/parent {:db/id 10001}
                 :block/title "collapsed"}
          grandchild {:db/id 10003
                      :block/uuid #uuid "0c3053c3-2dab-4769-badd-14ce16d8ba8d"
                      :block/parent {:db/id 10002}
                      :block/title "grandchild"}]
      (-> (p/with-redefs [db-async/<get-block-with-children
                          (fn [_repo _id options]
                            (reset! requested-options options)
                            (p/resolved {:block block
                                         :children [child grandchild]}))]
            (p/let [result (api-block/get_block (:db/id block) #js {:includeChildren true})]
              (is (true? (:include-collapsed-children? @requested-options)))
              (is (= "grandchild"
                     (get-in (js->clj result :keywordize-keys true)
                             [:children 0 :children 0 :title])))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))

#_(cljs.test/run-tests)
