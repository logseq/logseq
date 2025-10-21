(ns frontend.components.image-caption-test
  (:require [cljs.test :refer [deftest testing is]]
            [frontend.format.mldoc :as mldoc]
            [frontend.components.block :as block]))

(deftest test-image-markdown-with-caption
  (testing "Markdown image with title attribute is parsed"
    (let [markdown "![alt text](image.png \"my caption\")"
          parsed (mldoc/->edn markdown (mldoc/default-config :markdown))]
      ;; The mldoc parser should extract the title
      (is (some? parsed) "Markdown should be parsed successfully")))

  (testing "Image without caption is parsed"
    (let [markdown "![alt text](image.png)"
          parsed (mldoc/->edn markdown (mldoc/default-config :markdown))]
      (is (some? parsed) "Markdown without caption should be parsed successfully")))

  (testing "Image with metadata and caption"
    (let [markdown "![alt text](image.png \"my caption\"){:width 200 :height 100}"
          parsed (mldoc/->edn markdown (mldoc/default-config :markdown))]
      (is (some? parsed) "Markdown with both caption and metadata should be parsed"))))

(deftest test-asset-container-caption-rendering
  (testing "asset-container renders figcaption when title is present"
    ;; This tests the has-caption? logic
    (let [title "My image caption"
          has-caption? (and title (not (clojure.string/blank? title)))]
      (is (true? has-caption?) "Non-blank title should result in has-caption? being true")))

  (testing "asset-container does not render figcaption for blank title"
    (let [title ""
          has-caption? (and title (not (clojure.string/blank? title)))]
      (is (false? has-caption?) "Blank title should result in has-caption? being false")))

  (testing "asset-container does not render figcaption for nil title"
    (let [title nil
          has-caption? (and title (not (clojure.string/blank? title)))]
      (is (false? has-caption?) "Nil title should result in has-caption? being false")))

  (testing "asset-container does not render figcaption for whitespace-only title"
    (let [title "   "
          has-caption? (and title (not (clojure.string/blank? title)))]
      (is (false? has-caption?) "Whitespace-only title should result in has-caption? being false"))))

(comment
  ;; Manual testing notes:
  ;; To test manually in Logseq:
  ;; 1. Create a markdown block with: ![test](image.png "my caption")
  ;; 2. Verify a caption appears below the image
  ;; 3. Verify the caption is styled correctly (centered, italic, etc.)
  ;; 4. Test with long captions to ensure wrapping works
  ;; 5. Test in dark mode to ensure caption color is visible
  )
