(ns logseq.db.frontend.property.type-mutation-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.db.test.helper :as db-test]))

(def ^:private db
  (delay
    @(db-test/create-conn-with-blocks
      {:pages-and-blocks [{:page {:block/title "Page"}
                           :blocks [{:block/title "not a url"}
                                    {:block/title "https://logseq.com"}]}]})))

(defn- validate-fn [prop-type]
  (last (get db-property-type/built-in-validation-schemas prop-type)))

;; Fails if, in `url-entity?`, `if` becomes `if-not`.
(deftest url-entity-strict-unless-skipped-test
  (let [url? (validate-fn :url)
        text-id (:db/id (db-test/find-block-by-content @db "not a url"))
        url-id (:db/id (db-test/find-block-by-content @db "https://logseq.com"))]
    (is (url? @db url-id {}))
    (is (not (url? @db text-id {})) "a text block is not a url value")
    (is (url? @db text-id {:skip-strict-url-validate? true})
        "skipping strict validation accepts any titled block")))

;; Fails if, in `text-entity?`, `and` becomes `or`.
(deftest text-entity-needs-a-page-test
  (let [text? (validate-fn :default)
        page-id (:db/id (db-test/find-page-by-title @db "Page"))
        block-id (:db/id (db-test/find-block-by-content @db "not a url"))]
    (is (text? @db block-id {}))
    (is (not (text? @db page-id {})) "a page is not a text block value")))
