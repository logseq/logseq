(ns frontend.components.block.image-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.block.image :as block-image]
            [frontend.util :as util]))

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

(deftest remote-image-url?-test
  (is (true? (block-image/remote-image-url? "https://example.com/poster.jpg")))
  (is (true? (block-image/remote-image-url? "http://example.com/poster.jpg")))
  (is (false? (block-image/remote-image-url? "blob:http://localhost/abc")))
  (is (false? (block-image/remote-image-url? "file:///tmp/poster.jpg")))
  (is (false? (block-image/remote-image-url? nil))))

(deftest image-or-fallback-uses-a-link-when-load-fails
  (let [src "https://m.media-amazon.com/images/M/MV5BNTE17G7k.jpg"
        fallback (block-image/image-or-fallback
                  {:src src
                   :title "Poster"
                   :load-failed? true})]
    (is (= :a.asset-image-fallback.external-link (first fallback)))
    (is (= src (get-in fallback [1 :href])))
    (is (= util/stop-propagation (get-in fallback [1 :on-click])))
    (is (= util/stop-propagation (get-in fallback [1 :on-pointer-down])))
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
    (is (= on-error (:on-error (second image)))))
  (let [blob-src "blob:http://localhost/drag-drop"
        image (block-image/image-or-fallback
               {:src blob-src
                :title "drag-drop-regression"
                :load-failed? true
                :on-error (fn [_])})]
    (is (= :img.rounded-sm.relative.fade-in.fade-in-faster (first image)))
    (is (= blob-src (:src (second image))))
    (is (nil? (:on-error (second image)))
        "Local blob assets keep the img and do not attach on-error."))))
