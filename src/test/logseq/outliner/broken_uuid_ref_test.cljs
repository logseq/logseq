(ns logseq.outliner.broken-uuid-ref-test
  "Tests for [[uuid]] refs to entities that don't exist. save-block can't run
  under nbb (entities have no collection ops there), so these live in the cljs
  test suite instead of deps/outliner."
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]))

(deftest save-block-keeps-missing-uuid-ref-as-broken-ref
  ;; mirrors the frontend parse of [[<uuid>]] when the entity doesn't exist:
  ;; the title is rewritten to [[<generated-uuid>]] and refs contain both the
  ;; generated page map and a [:block/uuid <uuid>] lookup that resolves to nil
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "original"}]}])
        missing-uuid (random-uuid)
        gen-uuid (random-uuid)
        parsed-ref {:block/type "page"
                    :block/name (str missing-uuid)
                    :block/title (str missing-uuid)
                    :block/uuid gen-uuid}
        target (db-test/find-block-by-content @conn "original")
        {:keys [tx-data]} (outliner-core/save-block
                           @conn
                           {:db/id (:db/id target)
                            :block/title (str "text [[" gen-uuid "]]")
                            :block/raw-title (str "text [[" gen-uuid "]]")
                            :block/refs [parsed-ref [:block/uuid missing-uuid]]}
                           {})]
    (d/transact! conn tx-data)
    (let [block (d/entity @conn (:db/id target))]
      (is (= (str "text [[" missing-uuid "]]") (:block/title block)))
      (is (empty? (:block/refs block)))
      (is (nil? (d/entity @conn [:block/uuid missing-uuid]))))))
