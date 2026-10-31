(ns logseq.outliner.save-block-uuid-tag-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.test.helper :as db-test]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.outliner.op :as outliner-op]))

(defn- frontend-parsed-block
  "Mirrors frontend.handler.db-based.editor/wrap-parse-block: the title is
  parsed without a db and its refs are replaced with [[uuid]] before save."
  [block-uuid title]
  (let [content (str "- " title)
        ast (gp-mldoc/->edn content (gp-mldoc/default-config :markdown))
        parsed (first (gp-block/extract-blocks ast content :markdown
                                               {:block-pattern "-"
                                                :date-formatter date-time-util/default-journal-title-formatter
                                                :db-graph-mode? true}))]
    {:block/uuid block-uuid
     :block/title (db-content/title-ref->id-ref title (:block/refs parsed))
     :block/refs (:block/refs parsed)
     :block/tags (:block/tags parsed)}))

(deftest save-block-with-uuid-named-tag
  ;; `#t[[<uuid>]]` parses into a tag "t[[<uuid>]]" plus a tag named by the
  ;; bare uuid string, and `#[[<uuid>]]` into a tag named by the uuid string.
  ;; No page is created for a uuid-named ref, so the tag of the same name must
  ;; not be written as a half-made class entity.
  (doseq [[desc title-fn tag-titles-fn]
          [["tag with the block's own [[uuid]] inside"
            (fn [own _other] (str "#t[[" own "]]"))
            (fn [own _other] [(str "t[[" own "]]")])]
           ["tag with another block's [[uuid]] inside"
            (fn [_own other] (str "#t[[" other "]]"))
            (fn [_own other] [(str "t[[" other "]]")])]
           ["tag that is the block's own uuid"
            (fn [own _other] (str "#[[" own "]]"))
            (constantly [])]
           ["tag that is another block's uuid"
            (fn [_own other] (str "#[[" other "]]"))
            (constantly [])]
           ["tag that is a missing uuid"
            (fn [_own _other] (str "#[[" (random-uuid) "]]"))
            (constantly [])]]]
    (testing desc
      (let [conn (db-test/create-conn-with-blocks
                  [{:page {:block/title "page1"}
                    :blocks [{:block/title "host"}
                             {:block/title "other"}]}])
            host-uuid (:block/uuid (db-test/find-block-by-content @conn "host"))
            other-uuid (:block/uuid (db-test/find-block-by-content @conn "other"))
            title (title-fn host-uuid other-uuid)]
        (outliner-op/apply-ops!
         conn
         [[:save-block [(frontend-parsed-block host-uuid title) nil]]]
         {})
        (let [host (d/entity @conn [:block/uuid host-uuid])]
          (is (= (tag-titles-fn host-uuid other-uuid)
                 (map :block/title (:block/tags host))))
          (is (every? ldb/class? (:block/tags host)))
          (is (empty? (filter #(common-util/uuid-string? (:v %))
                              (d/datoms @conn :avet :block/name)))
              "No entity is named by a bare uuid string"))))))
