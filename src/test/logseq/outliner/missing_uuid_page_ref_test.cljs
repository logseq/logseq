(ns logseq.outliner.missing-uuid-page-ref-test
  "Saving [[<uuid-with-no-entity>]] must not emit :block/uuid nil (db-test#1372)."
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.handler.db-based.editor :as db-editor-handler]
            [frontend.state :as state]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.op :as outliner-op]
            [logseq.outliner.page :as outliner-page]))

(def ^:private missing-uuid-title "00000000-0000-4000-8000-000000000001")

(defn- missing-uuid-page-ref
  [parsed-uuid]
  {:block/type "page"
   :block/name missing-uuid-title
   :block/title missing-uuid-title
   :block/uuid parsed-uuid})

(deftest save-block-missing-uuid-page-ref-does-not-throw
  (testing "saving [[<uuid-with-no-entity>]] persists plain text instead of rejecting the tx"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "host"}]}])
          host (db-test/find-block-by-content @conn "host")
          parsed-uuid (random-uuid)]
      (is (nil? (outliner-page/create @conn missing-uuid-title {:uuid parsed-uuid})))
      (outliner-core/save-block! conn
                                 {:block/uuid (:block/uuid host)
                                  :block/title (page-ref/->page-ref parsed-uuid)
                                  :block/raw-title (page-ref/->page-ref parsed-uuid)
                                  :block/refs [(missing-uuid-page-ref parsed-uuid)]})
      (let [saved (d/entity @conn (:db/id host))]
        (is (= missing-uuid-title (:block/title saved)))
        (is (empty? (map :block/uuid (:block/refs saved))))
        (is (nil? (d/entity @conn [:block/uuid (parse-uuid missing-uuid-title)])))))))

(deftest wrap-parse-then-save-missing-uuid-page-ref
  (testing "the editor parse payload for UUID host [[<uuid>]] persists the typed uuid"
    (with-redefs [state/get-state (constantly [])]
      (let [conn (db-test/create-conn-with-blocks
                  [{:page {:block/title "page1"}
                    :blocks [{:block/title "host"}]}])
            host (db-test/find-block-by-content @conn "host")
            parsed (db-editor-handler/wrap-parse-block
                    {:block/uuid (:block/uuid host)
                     :block/title (str "UUID host [[" missing-uuid-title "]]")})]
        (is (some (fn [ref]
                    (and (vector? ref)
                         (= :block/uuid (first ref))
                         (= (parse-uuid missing-uuid-title) (second ref))))
                  (:block/refs parsed))
            "parser also emits a typed-uuid lookup ref that must not be transacted")
        (outliner-core/save-block! conn parsed)
        (let [saved (d/entity @conn (:db/id host))]
          (is (= (str "UUID host " missing-uuid-title) (:block/title saved)))
          (is (empty? (map :block/uuid (:block/refs saved))))
          (is (nil? (d/entity @conn [:block/uuid (parse-uuid missing-uuid-title)]))))))))

(deftest save-block-new-page-keeps-id-ref
  (testing "saving [[New Page]] as an id-ref does not rewrite the uuid to plain text"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "host"}]}])
          host (db-test/find-block-by-content @conn "host")
          parsed-uuid (random-uuid)]
      (outliner-core/save-block! conn
                                 {:block/uuid (:block/uuid host)
                                  :block/title (str "See " (page-ref/->page-ref parsed-uuid))
                                  :block/raw-title (str "See " (page-ref/->page-ref parsed-uuid))
                                  :block/refs [{:block/type "page"
                                                :block/name "new page"
                                                :block/title "New Page"
                                                :block/uuid parsed-uuid}]})
      (let [saved (d/entity @conn (:db/id host))
            page (ldb/get-page @conn "new page")]
        (is (some? page))
        (is (= (str "See " (page-ref/->page-ref (:block/uuid page)))
               (:block/title saved)))
        (is (= [(:block/uuid page)] (map :block/uuid (:block/refs saved))))))))

(deftest wrap-parse-then-save-new-page-ref-keeps-link
  (testing "[[New Page]] still persists as an id-ref after save"
    (with-redefs [state/get-state (constantly [])]
      (let [conn (db-test/create-conn-with-blocks
                  [{:page {:block/title "page1"}
                    :blocks [{:block/title "host"}]}])
            host (db-test/find-block-by-content @conn "host")
            parsed (db-editor-handler/wrap-parse-block
                    {:block/uuid (:block/uuid host)
                     :block/title "See [[Project Alpha]]"})]
        (outliner-core/save-block! conn parsed)
        (let [saved (d/entity @conn (:db/id host))
              page (ldb/get-page @conn "project alpha")
              title (:block/title saved)]
          (is (some? page))
          (is (or (= (str "See " (page-ref/->page-ref (:block/uuid page))) title)
                  (= "See [[Project Alpha]]" title))
              (str "must remain a page link, not plain text: " (pr-str title)))
          (is (not= (str "See " (:block/uuid page)) title)
              "must not persist the new page uuid as plain text")
          (is (= [(:block/uuid page)] (map :block/uuid (:block/refs saved)))))))))

(deftest apply-ops-missing-uuid-save-does-not-block-sibling-insert
  (testing "a refused/nil page create must not fail an unrelated insert in the same apply-ops batch"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "host"}]}])
          host (db-test/find-block-by-content @conn "host")
          parsed-uuid (random-uuid)
          inserted-uuid (random-uuid)]
      (outliner-op/apply-ops!
       conn
       [[:save-block [{:block/uuid (:block/uuid host)
                       :block/title (page-ref/->page-ref parsed-uuid)
                       :block/raw-title (page-ref/->page-ref parsed-uuid)
                       :block/refs [(missing-uuid-page-ref parsed-uuid)]}
                      {}]]
        [:insert-blocks [[{:block/uuid inserted-uuid
                           :block/title "sibling insert"}]
                         (:block/uuid host)
                         {:sibling? true
                          :keep-uuid? true}]]]
       {})
      (let [saved (d/entity @conn (:db/id host))
            inserted (d/entity @conn [:block/uuid inserted-uuid])]
        (is (= missing-uuid-title (:block/title saved)))
        (is (= "sibling insert" (:block/title inserted)))))))
