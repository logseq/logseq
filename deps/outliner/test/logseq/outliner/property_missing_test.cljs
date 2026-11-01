(ns logseq.outliner.property-missing-test
  "Setting a property that does not exist (deleted a moment ago, or never
  created) is refused with the set-block-property error and changes nothing,
  for a text value as for any other."
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.property :as outliner-property]))

(defn- set-error [conn block value]
  (try
    (outliner-property/set-block-property! conn (:db/id block) :user.property/choice value)
    nil
    (catch :default e (ex-message e))))

(deftest a-text-value-for-a-missing-property-is-refused-with-the-set-error
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "page"}
                                   :blocks [{:block/title "b"}]}]})
        block (db-test/find-block-by-content @conn "b")
        before (count (d/datoms @conn :eavt))]
    (is (= "Set block property failed: block or property doesn't exist" (set-error conn block "some text")))
    (is (= before (count (d/datoms @conn :eavt))) "nothing was written")))

(deftest a-number-value-for-a-missing-property-is-refused-with-the-set-error
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "page"}
                                   :blocks [{:block/title "b"}]}]})
        block (db-test/find-block-by-content @conn "b")]
    (is (= "Set block property failed: block or property doesn't exist" (set-error conn block 3)))))
