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
