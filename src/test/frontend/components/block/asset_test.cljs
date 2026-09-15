(ns frontend.components.block.asset-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [frontend.components.block.asset :as block-asset]
            [logseq.db.frontend.asset :as db-asset]))

(deftest link-ext-test
  (testing "falls back to asset type when the URL has no extension"
    (is (= :pdf
           (block-asset/link-ext
            "zotero://select/library/items/QLUSY2JL"
            "zotero://select/library/items/QLUSY2JL"
            {:logseq.property.asset/type "pdf"})))))

(deftest link-file-name-test
  (testing "uses the resolved extension in the displayed file name"
    (is (= "test.pdf"
           (block-asset/link-file-name
            {:block/title "test"}
            :pdf))))
  (testing "does not append an extension that the title already has"
    (is (= "test.pdf"
           (block-asset/link-file-name
            {:block/title "test.pdf"}
            :pdf))))
  (testing "does not display a raw poster URL as the file name"
    (let [url "https://m.media-amazon.com/images/M/MV5BNT17G7zk.jpg?V1_SX300"
          name (block-asset/link-file-name
                {:block/title url
                 :logseq.property.asset/external-url url}
                :jpg)]
      (is (not (re-find #"https://" name)))
      (is (string/includes? name "MV5BNT17G7zk")))))

(deftest asset-relative-path-test
  (testing "builds the graph-relative asset file path from an asset block"
    (let [asset-uuid (random-uuid)]
      (is (= (str "assets/" asset-uuid ".pdf")
             (block-asset/asset-relative-path
              {:block/uuid asset-uuid
               :logseq.property.asset/type "pdf"}))))))

(deftest show-missing-file-warning-test
  (testing "shows missing-file warning for local asset files that are absent"
    (is (true?
         (block-asset/show-missing-file-warning?
          {:block/uuid (random-uuid)
           :logseq.property.asset/type "pdf"}
          false))))
  (testing "does not show missing-file warning while a sync asset has not downloaded yet"
    (is (false?
         (block-asset/show-missing-file-warning?
          {:block/uuid (random-uuid)
           :logseq.property.asset/type "pdf"
           :logseq.property.asset/remote-metadata {:checksum "sha-256-value"
                                                   :type "pdf"}}
          false))))
  (testing "does not show missing-file warning before file existence is known"
    (is (false?
         (block-asset/show-missing-file-warning?
          {:block/uuid (random-uuid)
           :logseq.property.asset/type "pdf"}
          nil)))))

(deftest show-image-placeholder-test
  (testing "shows an image placeholder for remote images that have not downloaded yet"
    (is (true?
         (block-asset/show-image-placeholder?
          {:block/uuid (random-uuid)
           :logseq.property.asset/type "png"
           :logseq.property.asset/remote-metadata {:checksum "sha-256-value"
                                                   :type "png"}}
          false
          false))))
  (testing "does not show an image placeholder for gallery images"
    (is (false?
         (block-asset/show-image-placeholder?
          {:block/uuid (random-uuid)
           :logseq.property.asset/type "png"}
          false
          true)))))

(deftest asset-name->title-from-url-test
  (testing "strips scheme, path, query, and extension from poster URLs"
    (is (= "MV5BNT17G7zk"
           (db-asset/asset-name->title
            "https://m.media-amazon.com/images/M/MV5BNT17G7zk.jpg?V1_SX300"))))
  (testing "keeps the stem when the URL has no extension"
    (is (= "MV5BNT17G7zk"
           (db-asset/asset-name->title
            "https://m.media-amazon.com/images/M/MV5BNT17G7zk"))))
  (testing "still works for ordinary file basenames"
    (is (= "poster"
           (db-asset/asset-name->title "poster.png")))))

(deftest display-asset-title-avoids-raw-urls-test
  (testing "prefers a human title over a URL"
    (is (= "Inception poster"
           (block-asset/display-asset-title
            {:block/title "Inception poster"
             :logseq.property.asset/external-url "https://m.media-amazon.com/images/M/MV5B.jpg"}))))
  (testing "falls back to the URL file stem instead of the full URL"
    (is (= "MV5BNT17G7zk"
           (block-asset/display-asset-title
            {:block/title "https://m.media-amazon.com/images/M/MV5BNT17G7zk.jpg"
             :logseq.property.asset/external-url "https://m.media-amazon.com/images/M/MV5BNT17G7zk.jpg"})))))
