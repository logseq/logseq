(ns frontend.extensions.video-test
  (:require [cljs.test :refer [are deftest is]]
            [frontend.extensions.video :as video]
            [frontend.util.text :as text-util]))

(deftest matched-video-provider-detects-supported-sites
  (are [url provider] (= provider
                         (video/matched-video-provider
                          (text-util/get-matched-video url)))
    "https://www.youtube.com/watch?v=xu9p5ynlhZk" :youtube
    "https://youtu.be/xu9p5ynlhZk" :youtube
    "https://www.youtube-nocookie.com/embed/xu9p5ynlhZk" :youtube
    "https://www.bilibili.com/video/BV1xx411c7mD" :bilibili
    "https://vimeo.com/123456789" :vimeo
    "https://www.loom.com/share/1234567890abcdef" :loom))

(deftest provider-capabilities-mark-timestamp-support
  (is (true? (video/provider-supports? :youtube :timestamp?)))
  (is (false? (video/provider-supports? :bilibili :timestamp?)))
  (is (false? (video/provider-supports? :vimeo :timestamp?)))
  (is (false? (video/provider-supports? :loom :timestamp?))))

(deftest matched-video-aspect-ratio-detects-youtube-shorts
  (are [url ratio] (= ratio
                      (video/matched-video-aspect-ratio
                       (text-util/get-matched-video url)))
    "https://www.youtube.com/watch?v=xu9p5ynlhZk" [16 9]
    "https://www.youtube.com/shorts/xu9p5ynlhZk" [9 16]
    "https://www.bilibili.com/video/BV1xx411c7mD" [16 9]))
