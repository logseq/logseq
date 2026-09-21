(ns logseq.outliner.cut-paste-property-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.db :as ldb]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.op :as outliner-op]
            [logseq.outliner.op.construct :as op-construct]))

(defn- entity-or-ref-map?
  [v]
  (or (de/entity? v)
      (and (map? v) (or (:db/id v) (:block/uuid v)))))

(defn- ->lookup-ref
  [v]
  [:block/uuid (:block/uuid v)])

(defn- clipboard-block
  "Serialize a block the way editor copy/cut does: entity refs become lookup refs."
  [block]
  (-> (into {:db/id (:db/id block)
             :block/uuid (:block/uuid block)}
            (map (fn [k]
                   [k (let [v (get block k)]
                        (cond
                          (entity-or-ref-map? v)
                          (->lookup-ref v)
                          (and (coll? v) (seq v) (every? entity-or-ref-map? v))
                          (set (map ->lookup-ref v))
                          :else
                          v))]))
            (keys block))))

(defn- copied-blocks-for
  [db block include-property-block?]
  (mapv clipboard-block
        (ldb/get-block-and-children db (:block/uuid block)
                                    {:include-property-block? include-property-block?})))

(defn- property-contents
  [value]
  (cond
    (nil? value) nil
    (or (true? value) (false? value)) value
    (de/entity? value)
    (or (:db/ident value)
        (:block/journal-day value)
        (db-property/property-value-content value)
        (:block/uuid value))
    (and (coll? value) (not (map? value)))
    (set (map property-contents value))
    :else value))

(defn- find-source-block
  [db {:keys [block-title]
       :or {block-title "b1"}}]
  (db-test/find-block-by-content db block-title))

(defn- undo-delete!
  [conn block]
  (let [db-before @conn
        block-uuid (:block/uuid block)
        {:keys [tx-data]} (outliner-core/delete-blocks db-before [block] {})
        tx-meta {:outliner-op :delete-blocks
                 :outliner-ops [[:delete-blocks [[block-uuid] {}]]]}
        tx-report (d/with db-before tx-data tx-meta)
        {:keys [inverse-outliner-ops]}
        (op-construct/derive-history-outliner-ops
         db-before (:db-after tx-report) (:tx-data tx-report) tx-meta)]
    (reset! conn (:db-after tx-report))
    (is (seq inverse-outliner-ops)
        "Delete has an inverse op")
    (outliner-op/apply-ops! conn inverse-outliner-ops {})
    inverse-outliner-ops))

(defn- cut-paste!
  [conn block target include-property-block?]
  (let [copied (copied-blocks-for @conn block include-property-block?)]
    (outliner-core/delete-blocks! conn [block] {})
    (outliner-core/insert-blocks! conn copied target
                                  {:sibling? true
                                   :keep-uuid? true
                                   :outliner-op :paste})
    copied))

(defn- assert-properties
  [block expected]
  (doseq [[ident expected-value] expected]
    (is (= expected-value (property-contents (get block ident)))
        (str ident))))

(def ^:private closed-choice-uuid #uuid "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")

(def ^:private property-cases
  [{:title "default cardinality-one text"
    :properties {:p1 {:logseq.property/type :default}}
    :block-props {:p1 "value"}
    :expected {:user.property/p1 "value"}}
   {:title "default cardinality-many text"
    :properties {:p-many {:logseq.property/type :default
                          :db/cardinality :many}}
    :block-props {:p-many #{"alpha" "beta"}}
    :expected {:user.property/p-many #{"alpha" "beta"}}}
   {:title "number cardinality-one"
    :properties {:num {:logseq.property/type :number}}
    :block-props {:num 2}
    :expected {:user.property/num 2}}
   {:title "number cardinality-many"
    :properties {:num-many {:logseq.property/type :number
                            :db/cardinality :many}}
    :block-props {:num-many #{3 4}}
    :expected {:user.property/num-many #{3 4}}}
   {:title "url cardinality-one"
    :properties {:link {:logseq.property/type :url}}
    :block-props {:link "https://logseq.com"}
    :expected {:user.property/link "https://logseq.com"}}
   {:title "url cardinality-many"
    :properties {:link-many {:logseq.property/type :url
                             :db/cardinality :many}}
    :block-props {:link-many #{"https://logseq.com" "https://example.com"}}
    :expected {:user.property/link-many #{"https://logseq.com" "https://example.com"}}}
   {:title "checkbox"
    :properties {:done {:logseq.property/type :checkbox}}
    :block-props {:done true}
    :expected {:user.property/done true}}
   {:title "datetime"
    :properties {:when {:logseq.property/type :datetime}}
    :block-props {:when 1700000000000}
    :expected {:user.property/when 1700000000000}}
   {:title "date cardinality-one"
    :properties {:due {:logseq.property/type :date}}
    :extra-pages [{:page {:build/journal 20250203}}]
    :block-props {:due [:build/page {:build/journal 20250203}]}
    :expected {:user.property/due 20250203}}
   {:title "date cardinality-many"
    :properties {:due-many {:logseq.property/type :date
                            :db/cardinality :many}}
    :extra-pages [{:page {:build/journal 20250203}}
                  {:page {:build/journal 20250204}}]
    :block-props {:due-many #{[:build/page {:build/journal 20250203}]
                              [:build/page {:build/journal 20250204}]}}
    :expected {:user.property/due-many #{20250203 20250204}}}
   {:title "node page ref"
    :properties {:page {:logseq.property/type :node}}
    :extra-pages [{:page {:block/title "Linked Page"}}]
    :block-props {:page [:build/page {:block/title "Linked Page"}]}
    :expected {:user.property/page "Linked Page"}}
   {:title "node cardinality-many"
    :properties {:pages {:logseq.property/type :node
                         :db/cardinality :many}}
    :extra-pages [{:page {:block/title "Page A"}}
                  {:page {:block/title "Page B"}}]
    :block-props {:pages #{[:build/page {:block/title "Page A"}]
                           [:build/page {:block/title "Page B"}]}}
    :expected {:user.property/pages #{"Page A" "Page B"}}}
   {:title "asset ref"
    :properties {:cover {:logseq.property/type :asset}}
    :extra-pages [{:page {:block/title "poster"
                          :build/tags [:logseq.class/Asset]}}]
    :block-props {:cover [:build/page {:block/title "poster"}]}
    :expected {:user.property/cover "poster"}}
   {:title "closed-value status"
    :block-props {:logseq.property/status :logseq.property/status.doing}
    :expected {:logseq.property/status :logseq.property/status.doing}}
   {:title "closed-value default choice"
    :properties {:choice {:logseq.property/type :default
                          :build/closed-values [{:uuid closed-choice-uuid :value "red"}]}}
    :block-props {:choice [:block/uuid closed-choice-uuid]}
    :expected {:user.property/choice "red"}}
   {:title "query property value"
    :block-title "query-b1"
    :block-tags [:logseq.class/Query]
    :block-props {:logseq.property/query "(priority High)"}
    :expected {:logseq.property/query "(priority High)"}}])

(defn- create-case-conn
  [{:keys [properties extra-pages block-title block-tags block-props]
    :or {block-title "b1"}}]
  (db-test/create-conn-with-blocks
   (cond-> {:pages-and-blocks
            (into [{:page {:block/title "page1"}
                    :blocks [(cond-> {:block/title block-title
                                      :build/properties block-props}
                               (seq block-tags)
                               (assoc :build/tags block-tags))
                             {:block/title "target"}]}]
                  extra-pages)}
     (seq properties)
     (assoc :properties properties))))

(deftest omitting-property-value-children-throws-missing-entity
  (testing "cut then paste of a text property block without value children matches the original failure"
    (let [conn (create-case-conn (first property-cases))
          block (find-source-block @conn (first property-cases))
          target (db-test/find-block-by-content @conn "target")
          copied (copied-blocks-for @conn block false)
          value-uuid (:block/uuid (:user.property/p1 block))]
      (is (= 1 (count copied))
          "Default copy omits the property-value child")
      (is (uuid? value-uuid))
      (outliner-core/delete-blocks! conn [block] {})
      (is (nil? (d/entity @conn [:block/uuid value-uuid]))
          "Cut hard-retracts the property-value child")
      (is (thrown-with-msg?
           js/Error
           #"Nothing found for entity id"
           (db-test/silence-stderr
            (outliner-core/insert-blocks! conn copied target
                                          {:sibling? true
                                           :keep-uuid? true
                                           :outliner-op :paste})))))))

(deftest cut-paste-restores-all-property-types
  (doseq [{:keys [title expected] :as test-case} property-cases]
    (testing title
      (let [conn (create-case-conn test-case)
            block (find-source-block @conn test-case)
            target (db-test/find-block-by-content @conn "target")
            block-uuid (:block/uuid block)]
        (is (some? block) (str title " source block exists"))
        (cut-paste! conn block target true)
        (let [pasted (d/entity @conn [:block/uuid block-uuid])]
          (is (some? pasted) (str title " pasted"))
          (assert-properties pasted expected))))))

(deftest undo-delete-restores-all-property-types
  (doseq [{:keys [title expected] :as test-case} property-cases]
    (testing title
      (let [conn (create-case-conn test-case)
            block (find-source-block @conn test-case)
            block-uuid (:block/uuid block)]
        (is (some? block) (str title " source block exists"))
        (undo-delete! conn block)
        (let [restored (d/entity @conn [:block/uuid block-uuid])]
          (is (some? restored) (str title " restored"))
          (assert-properties restored expected))))))

(deftest copy-paste-duplicates-text-property-values
  (let [conn (create-case-conn (first property-cases))
        block (find-source-block @conn (first property-cases))
        target (db-test/find-block-by-content @conn "target")
        original-uuid (:block/uuid block)
        original-value-uuid (:block/uuid (:user.property/p1 block))
        copied (copied-blocks-for @conn block true)]
    (outliner-core/insert-blocks! conn copied target
                                  {:sibling? true
                                   :keep-uuid? false
                                   :outliner-op :paste})
    (let [original (d/entity @conn [:block/uuid original-uuid])
          pasted (->> (d/q '[:find [?b ...]
                             :where
                             [?b :block/title "b1"]
                             [?b :block/parent]]
                           @conn)
                      (map #(d/entity @conn %))
                      (remove #(= original-uuid (:block/uuid %)))
                      first)]
      (is (some? original) "Original block remains")
      (is (some? pasted) "Pasted duplicate exists")
      (is (= "value" (property-contents (:user.property/p1 original))))
      (is (= "value" (property-contents (:user.property/p1 pasted))))
      (is (not= original-value-uuid
                (:block/uuid (:user.property/p1 pasted)))
          "Copy duplicates the text property value instead of sharing it"))))

(deftest delete-inverse-includes-property-value-children
  (let [conn (create-case-conn (first property-cases))
        block (find-source-block @conn (first property-cases))
        value-uuid (:block/uuid (:user.property/p1 block))
        inverse (undo-delete! conn block)
        insert-blocks (get-in (first inverse) [1 0])
        insert-uuids (set (map :block/uuid insert-blocks))]
    (is (= :insert-blocks (ffirst inverse)))
    (is (contains? insert-uuids (:block/uuid block)))
    (is (contains? insert-uuids value-uuid)
        "Undo restore payload includes the retracted property-value child")))

(defn- outline-sibling-titles
  [block]
  (->> (ldb/sort-by-order (:block/_parent (:block/parent block)))
       (remove :logseq.property/created-from-property)
       (mapv :block/title)))

(deftest copy-paste-text-property-value-as-regular-block
  (let [conn (create-case-conn (first property-cases))
        block (find-source-block @conn (first property-cases))
        target (db-test/find-block-by-content @conn "target")
        value (:user.property/p1 block)
        original-value-uuid (:block/uuid value)
        copied (copied-blocks-for @conn value true)]
    (outliner-core/insert-blocks! conn copied target
                                  {:sibling? true
                                   :keep-uuid? false
                                   :outliner-op :paste})
    (let [original (d/entity @conn (:db/id block))
          target' (d/entity @conn (:db/id target))
          pasted (->> (ldb/sort-by-order (:block/_parent (:block/parent target')))
                      (remove :logseq.property/created-from-property)
                      (remove #(contains? #{(:block/uuid block) (:block/uuid target)}
                                          (:block/uuid %)))
                      first)]
      (is (= "value" (property-contents (:user.property/p1 original)))
          "Copy leaves the original text property value in place")
      (is (= original-value-uuid (:block/uuid (:user.property/p1 original))))
      (is (some? pasted) "Copied text property value pastes as a visible outline block")
      (is (= "value" (:block/title pasted)))
      (is (nil? (:logseq.property/created-from-property pasted))
          "Pasted value is a regular block, not a hidden property value")
      (is (not= original-value-uuid (:block/uuid pasted)))
      (is (some #{"value"} (outline-sibling-titles target'))))))

(deftest cut-paste-text-property-value-as-regular-block
  (let [conn (create-case-conn (first property-cases))
        block (find-source-block @conn (first property-cases))
        target (db-test/find-block-by-content @conn "target")
        value (:user.property/p1 block)
        value-uuid (:block/uuid value)
        copied (copied-blocks-for @conn value true)]
    (outliner-core/delete-blocks! conn [value] {})
    (outliner-core/insert-blocks! conn copied target
                                  {:sibling? true
                                   :keep-uuid? true
                                   :outliner-op :paste})
    (let [host (d/entity @conn (:db/id block))
          target' (d/entity @conn (:db/id target))
          pasted (d/entity @conn [:block/uuid value-uuid])]
      (is (nil? (property-contents (:user.property/p1 host)))
          "Cut removes the text property value from its host")
      (is (some? pasted) "Cut text property value pastes as a block")
      (is (= "value" (:block/title pasted)))
      (is (nil? (:logseq.property/created-from-property pasted))
          "Cut+paste converts the value into a regular outline block")
      (is (some #{"value"} (outline-sibling-titles target'))))))
