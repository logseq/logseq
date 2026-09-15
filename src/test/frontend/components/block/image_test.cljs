(ns frontend.components.block.image-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.block.image :as block-image]))

(deftest effective-image-metadata-test
  (testing "uses block resize metadata for network images"
    (is (= {:alt "image"
            :width 480}
           (block-image/effective-image-metadata
            {:block {:logseq.property.asset/resize-metadata {:width 480}}}
            nil
            {:alt "image"}))))

  (testing "asset block resize metadata has priority for local assets"
    (is (= {:width 720}
           (block-image/effective-image-metadata
            {:block {:logseq.property.asset/resize-metadata {:width 480}}}
            {:logseq.property.asset/resize-metadata {:width 720}}
            nil)))))

(deftest image-or-fallback-uses-a-link-when-load-fails
  (let [src "https://m.media-amazon.com/images/M/MV5BNTE17G7k.jpg"
        fallback (block-image/image-or-fallback
                  {:src src
                   :title "Poster"
                   :load-failed? true})]
    (is (= :a.asset-image-fallback.external-link (first fallback)))
    (is (= src (get-in fallback [1 :href])))
    (is (= "Poster" (last fallback))))
  (let [on-error (fn [_])
        image (block-image/image-or-fallback
               {:src "https://example.com/poster.jpg"
                :title "Poster"
                :load-failed? false
                :on-error on-error
                :metadata {:alt "poster"}})]
    (is (= :img.rounded-sm.relative.fade-in.fade-in-faster (first image)))
    (is (= "https://example.com/poster.jpg" (:src (second image))))
    (is (= on-error (:on-error (second image))))))
