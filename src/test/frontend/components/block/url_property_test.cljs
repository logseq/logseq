(ns frontend.components.block.url-property-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.block :as block]
            [frontend.components.page :as page]
            [frontend.util.entity :as entity]
            [frontend.util.text :as text-util]))

(deftest url-property-validation-effect-deps-include-title-test
  (let [property {:db/id 2 :logseq.property/type :url}
        invalid {:db/id 1
                 :block/title "not-a-url"
                 :logseq.property/created-from-property property}
        valid (assoc invalid :block/title "https://logseq.com")]
    (is (= [1 2 "not-a-url"]
           (#'block/url-property-validation-effect-deps invalid)))
    (is (= [1 2 "https://logseq.com"]
           (#'block/url-property-validation-effect-deps valid)))
    (is (not= (#'block/url-property-validation-effect-deps invalid)
              (#'block/url-property-validation-effect-deps valid))
        "Changing the title must change effect deps so invalid URLs re-validate.")))

(deftest zoomed-url-property-value-hides-sub-block-ux-test
  (testing "URL property values hide leftover children and the add-block control"
    (let [url-value {:block/title "https://logseq.com"
                     :logseq.property/created-from-property {:logseq.property/type :url}}
          text-value {:block/title "text value"
                      :logseq.property/created-from-property {:logseq.property/type :default}}]
      (is (entity/url-property-value? url-value))
      (is (true? (#'page/hide-block-route-add-button? url-value false)))
      (is (false? (#'page/hide-block-route-add-button? text-value false)))
      (is (true? (#'page/hide-block-route-add-button? text-value true))))))

(deftest show-link-treats-poster-urls-as-images-test
  (testing "extension-less Amazon poster URLs render as media, not wrapping external links"
    (let [url "https://m.media-amazon.com/images/M/MV5BNT17G7zk"]
      (is (true? (text-util/image-url? url)))
      (is (true? (#'block/show-link? url url)))))
  (testing "ordinary page URLs stay links"
    (let [url "https://www.imdb.com/title/tt5849986/"]
      (is (false? (text-util/image-url? url)))
      (is (false? (#'block/show-link? url url))))
    (let [url "https://www.themoviedb.org/movie/27205"]
      (is (false? (text-util/image-url? url)))
      (is (false? (#'block/show-link? url url))))))
