;; FIXME
;; https://github.com/davidsantiago/hickory/issues/17
;; hictory doesnt work in Node
;; (ns frontend.extensions.zotero.extractor-test
;;   (:require [clojure.edn :as edn]
;;             [clojure.test :as test :refer [deftest is testing]]
;;             [shadow.resource :as rc]
;;             [clojure.string :as str]
;;             [frontend.extensions.zotero.extractor :as extractor]))

;; (def data
;;   (-> (rc/inline "fixtures/zotero.edn")
;;       (edn/read-string)))

;; (deftest extract-test
;;   (testing "journal article"
;;     (let [{:keys [page-name properties]}
;;           (extractor/extract (:journal-article-sample-1 data))]

;;       (testing "page name prefer citation key"
;;         (is (= "@efroniHowCombineTreeSearch2019" page-name)))

;;       (testing "convert date"
;;         (is (= "[[Feb 17th, 2019]]" (-> properties :date))))

;;       (testing "convert date"
;;         (is (= "[[Feb 17th, 2019]]" (-> properties :date))))

;;       (testing "original title"
;;         (is (= "How to Combine Tree-Search Methods in Reinforcement Learning" (-> properties :original-title))))

;;       (testing "double quote when containing comma"
;;         (is (= "\"arXiv:1809.01843 [cs, stat]\"" (-> properties :publication-title))))

;;       (testing "skip when containing newline"
;;         (is (nil? (-> properties :extra))))))

;;   (testing "another journal article"
;;     (let [{:keys [page-name properties]}
;;           (extractor/extract (:journal-article-sample-2 data))
;;           authors (count (re-seq #"\[\[" (-> properties :authors)))
;;           tags    (count (re-seq #"\[\[" (-> properties :tags)))]

;;       (testing "authors"
;;         (is (= 8 authors)))

;;       (testing "tags"
;;         (is (= 17 tags)))))

;;   (testing "book"
;;     (let [{:keys [page-name properties]}
;;           (extractor/extract (:book-sample-1 data))]

;;       (testing "page name"
;;         (is (= "@1984" page-name)))

;;       (testing "author"
;;         (is (= "[[George Orwell]]" (-> properties :authors))))

;;       (testing "preserve unparsable date"
;;         (is (= "1984" (-> properties :date))))))

;;   (testing "newpaper article"
;;     (let [{:keys [page-name properties]}
;;           (extractor/extract (:newspaper-article-sample-1 data))]
;;       (is (= "A Letter to Our Readers About Digital Subscriptions" (-> properties :original-title)))

;;       (testing "use parsed date when possible"
;;         (is (= "[[Mar 28th, 2011]]" (-> properties :date))))))

;;   (testing "note"
;;     (let [result (extractor/extract (:note-sample-1 data))]
;;       (is (str/starts-with? result "This study shows")))))
