(ns logseq.outliner.property-value-blocks-review-test
  "Text value blocks and choices: who holds a value block, what happens to it
  when it's replaced, and what a value that matches no choice does."
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.common.view :as db-view]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.property :as outliner-property]))

(defn- block-uuid
  [conn title]
  (:block/uuid (db-test/find-block-by-content @conn title)))

(defn- block-value
  [conn title property-id]
  (get (d/entity @conn [:block/uuid (block-uuid conn title)]) property-id))

(defn- value-blocks-by-holders
  "The value blocks of `property-id` as [content number-of-nodes-holding-it]"
  [conn property-id]
  (let [property (d/entity @conn property-id)]
    (->> (d/datoms @conn :avet :logseq.property/created-from-property (:db/id property))
         (map #(d/entity @conn (:e %)))
         (map (fn [value]
                [(db-property/property-value-content value)
                 (count (d/datoms @conn :avet property-id (:db/id value)))]))
         frequencies)))

(deftest add-existing-values-to-closed-values-converts-every-copy
  (testing "Each node holding the text of a value that becomes a choice holds the choice"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:color {:logseq.property/type :default}}
                 :pages-and-blocks [{:page {:block/title "page1"}
                                     :blocks [{:block/title "A"} {:block/title "B"} {:block/title "C"}]}]})]
      (doseq [[title value] [["A" "red"] ["B" "red"] ["C" "blue"]]]
        (outliner-property/set-block-property! conn [:block/uuid (block-uuid conn title)] :user.property/color value))
      ;; The Add choice popup lists get-property-values, one entry per label
      (let [values (db-view/get-property-values @conn :user.property/color {})]
        (outliner-property/add-existing-values-to-closed-values!
         conn :user.property/color (map (comp :block/uuid :value) values)))
      (let [choice-ids (set (map :db/id (:block/_closed-value-property (d/entity @conn :user.property/color))))]
        (is (= 2 (count choice-ids)))
        (doseq [title ["A" "B" "C"]]
          (is (contains? choice-ids (:db/id (block-value conn title :user.property/color)))
              (str title " holds a choice"))))
      (is (= "red" (db-property/property-value-content (block-value conn "B" :user.property/color))))
      (is (= {["red" 2] 1 ["blue" 1] 1} (value-blocks-by-holders conn :user.property/color))
          "The other copy of red is deleted")
      (is (empty? (:errors (db-validate/validate-local-db! @conn))))))

  (testing "A node holding the text of a choice that already exists holds that choice"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:color {:logseq.property/type :default}}
                 :pages-and-blocks [{:page {:block/title "page1"}
                                     :blocks [{:block/title "A"} {:block/title "B"}]}]})]
      (outliner-property/set-block-property! conn [:block/uuid (block-uuid conn "A")] :user.property/color "red")
      (outliner-property/set-block-property! conn [:block/uuid (block-uuid conn "B")] :user.property/color "blue")
      (outliner-property/upsert-closed-value! conn :user.property/color {:value "red"})
      ;; The popup leaves out the values whose label is already a choice
      (outliner-property/add-existing-values-to-closed-values!
       conn :user.property/color [(:block/uuid (block-value conn "B" :user.property/color))])
      (let [choices (:block/_closed-value-property (d/entity @conn :user.property/color))
            choice-ids (set (map :db/id choices))]
        (is (= #{"red" "blue"} (set (map db-property/property-value-content choices))))
        (is (contains? choice-ids (:db/id (block-value conn "A" :user.property/color)))
            "A holds the red choice")
        (is (= "red" (db-property/property-value-content (block-value conn "A" :user.property/color)))))
      (is (empty? (:errors (db-validate/validate-local-db! @conn)))))))

(deftest batch-set-property-with-another-node-text-value-copies-it
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:color {:logseq.property/type :default}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "A"} {:block/title "X"} {:block/title "Y"} {:block/title "Z"}]}]})
        value-of #(block-value conn % :user.property/color)]
    (outliner-property/set-block-property! conn [:block/uuid (block-uuid conn "A")] :user.property/color "red")
    ;; Batch editing lists get-property-values and passes the chosen value's id
    (let [red-id (-> (db-view/get-property-values @conn :user.property/color {}) first :value :db/id)]
      (outliner-property/batch-set-property! conn [(block-uuid conn "X") (block-uuid conn "Y")]
                                             :user.property/color red-id {:entity-id? true})
      (outliner-property/set-block-property! conn [:block/uuid (block-uuid conn "Z")] :user.property/color red-id)
      (testing "Each node gets a value block of its own with the same text"
        (doseq [title ["X" "Y" "Z"]]
          (is (= "red" (db-property/property-value-content (value-of title))))
          (is (not= red-id (:db/id (value-of title))))
          (is (= (block-uuid conn title) (:block/uuid (:block/parent (value-of title))))))
        (is (= red-id (:db/id (value-of "A")))))
      (testing "Setting a node's own value block again keeps it"
        (outliner-property/batch-set-property! conn [(block-uuid conn "A")] :user.property/color red-id {:entity-id? true})
        (is (= red-id (:db/id (value-of "A"))))))
    (testing "Deleting the node whose value was picked keeps the other nodes' values"
      (outliner-core/delete-blocks! conn [(d/entity @conn [:block/uuid (block-uuid conn "A")])] {})
      (doseq [title ["X" "Y" "Z"]]
        (is (= "red" (some-> (value-of title) db-property/property-value-content)))))))

(deftest set-block-property-with-no-matching-choice-is-refused
  (testing "Status"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "task"}]}])
          task-uuid (block-uuid conn "task")
          task #(d/entity @conn [:block/uuid task-uuid])]
      (outliner-property/batch-set-property! conn [task-uuid] :logseq.property/status :logseq.property/status.doing)
      (is (thrown-with-msg? js/Error #"Invalid choice"
                            (outliner-property/set-block-property! conn [:block/uuid task-uuid] :logseq.property/status "Finished")))
      (is (= :logseq.property/status.doing (:db/ident (:logseq.property/status (task)))))
      (is (= #{:logseq.class/Task} (set (map :db/ident (:block/tags (task))))))))

  (testing "A user property with choices"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:color {:logseq.property/type :default
                                      :build/closed-values [{:value "red" :uuid (random-uuid)}
                                                            {:value "blue" :uuid (random-uuid)}]}}
                 :pages-and-blocks [{:page {:block/title "page1"}
                                     :blocks [{:block/title "b1"}]}]})
          b1-uuid (block-uuid conn "b1")]
      (outliner-property/set-block-property! conn [:block/uuid b1-uuid] :user.property/color "red")
      (is (thrown-with-msg? js/Error #"Invalid choice"
                            (outliner-property/set-block-property! conn [:block/uuid b1-uuid] :user.property/color "green")))
      (is (= "red" (db-property/property-value-content (block-value conn "b1" :user.property/color))))
      (testing "and nil still removes the value"
        (outliner-property/set-block-property! conn [:block/uuid b1-uuid] :user.property/color nil)
        (is (nil? (block-value conn "b1" :user.property/color)))))))

(deftest replaced-text-value-blocks-are-deleted
  (testing "batch-set-property! deletes the value block it replaces"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:note {:logseq.property/type :default}}
                 :pages-and-blocks [{:page {:block/title "page1"}
                                     :blocks [{:block/title "b1"} {:block/title "b2"}]}]})
          b1-uuid (block-uuid conn "b1")
          b2-uuid (block-uuid conn "b2")]
      (outliner-property/batch-set-property! conn [b1-uuid b2-uuid] :user.property/note "one")
      (outliner-property/batch-set-property! conn [b1-uuid] :user.property/note "two")
      (is (= {["one" 1] 1 ["two" 1] 1} (value-blocks-by-holders conn :user.property/note)))
      (outliner-property/batch-set-property! conn [b1-uuid b2-uuid] :user.property/note "three")
      (is (= {["three" 1] 2} (value-blocks-by-holders conn :user.property/note)))))

  (testing "batch-set-property! keeps a value block another node still holds"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:color {:logseq.property/type :default
                                      :build/closed-values [{:value "red" :uuid (random-uuid)}
                                                            {:value "blue" :uuid (random-uuid)}]}}
                 :pages-and-blocks [{:page {:block/title "page1"}
                                     :blocks [{:block/title "b1"} {:block/title "b2"}]}]})
          b1-uuid (block-uuid conn "b1")]
      (outliner-property/batch-set-property! conn [b1-uuid (block-uuid conn "b2")] :user.property/color "red")
      (outliner-property/batch-set-property! conn [b1-uuid] :user.property/color "blue")
      (is (= #{"red" "blue"}
             (set (map db-property/property-value-content
                       (:block/_closed-value-property (d/entity @conn :user.property/color)))))
          "Choices are never deleted")
      (is (= "red" (db-property/property-value-content (block-value conn "b2" :user.property/color))))))

  (testing "Removing one of several values deletes its value block"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:items {:logseq.property/type :default :db/cardinality :db.cardinality/many}}
                 :pages-and-blocks [{:page {:block/title "page1"}
                                     :blocks [{:block/title "b1"}]}]})
          b1-uuid (block-uuid conn "b1")]
      (outliner-property/batch-set-property! conn [b1-uuid] :user.property/items ["x" "y"])
      (let [x-id (some #(when (= "x" (:block/title %)) (:db/id %))
                       (block-value conn "b1" :user.property/items))]
        (outliner-property/delete-property-value! conn [:block/uuid b1-uuid] :user.property/items x-id))
      (is (= {["y" 1] 1} (value-blocks-by-holders conn :user.property/items)))
      (is (empty? (:errors (db-validate/validate-local-db! @conn)))))))
