(ns frontend.extensions.zotero.extractor-test
  (:require [clojure.edn :as edn]
            [clojure.test :as test :refer [deftest is testing are]]
            [shadow.resource :as rc]
            [frontend.extensions.zotero.extractor :as extractor]))

(def data
  (-> (rc/inline "fixtures/zotero.edn")
      (edn/read-string)))

(deftest extract-test
  (testing "journal article"
    (let [{:keys [page-name properties]}
          (extractor/extract (:journal-article-sample-1 data))]

      (testing "page name prefer citation key"
        (is (= "@efroniHowCombineTreeSearch2019" page-name)))

      (testing "convert date"
        (is (= "[[Feb 17th, 2019]]" (-> properties :date))))

      (testing "convert date"
        (is (= "[[Feb 17th, 2019]]" (-> properties :date))))

      (testing "original title"
        (is (= "How to Combine Tree-Search Methods in Reinforcement Learning" (-> properties :original-title))))

      (testing "double quote when containing comma"
        (is (= "\"arXiv:1809.01843 [cs, stat]\"" (-> properties :publication-title))))

      (testing "skip when containing newline"
        (is (nil? (-> properties :extra))))))

  (testing "another journal article"
    (let [{:keys [_page-name properties]}
          (extractor/extract (:journal-article-sample-2 data))
          authors (count (-> properties :authors))
          tags    (count (-> properties :tags))]

      (testing "authors"
        (is (= 8 authors)))

      (testing "tags"
        ;; tags split by `,` are counted into different tags
        ;; https://github.com/logseq/logseq/commit/435c2110bcc2d30ed743ba31375450f1a705b00b
        (is (= 20 tags)))))

  (testing "book"
    (let [{:keys [page-name properties]}
          (extractor/extract (:book-sample-1 data))]

      (testing "page name"
        (is (= "@1984" page-name)))

      (testing "author"
        (is (= '("George Orwell") (-> properties :authors))))

      (testing "preserve unparsable date"
        (is (= "1984" (-> properties :date))))))

  (testing "newpaper article"
    (let [{:keys [_page-name properties]}
          (extractor/extract (:newspaper-article-sample-1 data))]
      (is (= "A Letter to Our Readers About Digital Subscriptions" (-> properties :original-title)))

      (testing "use parsed date when possible"
        (is (= "[[Mar 28th, 2011]]" (-> properties :date))))))
  
  (testing "zotero imported file path"
    (are [item-key filename open] (= (extractor/zotero-imported-file-macro item-key filename) open)
      "9AUD8MNT" "a.pdf" "{{zotero-imported-file 9AUD8MNT, \"a.pdf\"}}"))

  (testing "zotero linked file path"
    (are [path open] (= (extractor/zotero-linked-file-macro path) open)
      ;; TODO provide some real samples on multiple platforms
      "attachments:abc/def/ghi.pdf" "{{zotero-linked-file \"abc/def/ghi.pdf\"}}"
      ;; Chinese and blank
      "attachments:书籍/人民邮电出版社/NSCA-CPT美国国家体能协会私人教练认证指南 第2版.pdf" "{{zotero-linked-file \"书籍/人民邮电出版社/NSCA-CPT美国国家体能协会私人教练认证指南 第2版.pdf\"}}"))

;; 2022.10.18. Should be deprecated since Hickory is invalid in Node test
;; Skip until we find an alternative
;;   (testing "note"
;;     (let [result (extractor/extract (:note-sample-1 data))]
;;       (is (str/starts-with? result "This study shows"))))
)
