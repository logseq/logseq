(ns frontend.extensions.video-test
  (:require [cljs.test :refer [are deftest is]]
            [frontend.extensions.video :as video]))

(deftest get-matched-video-recognizes-supported-sites
  (are [url provider id] (let [match (video/get-matched-video url)]
                           (and (= provider (video/matched-video-provider match))
                                (= id (nth match 5))))
    "https://www.youtube.com/watch?v=gG7bkadYfdU" :youtube "gG7bkadYfdU"
    "https://www.youtube.com/shorts/gG7bkadYfdU" :youtube "gG7bkadYfdU"
    "https://www.youtube-nocookie.com/embed/gG7bkadYfdU" :youtube-nocookie "gG7bkadYfdU"
    "https://m.youtube.com/shorts/gG7bkadYfdU?feature=share" :youtube "gG7bkadYfdU"
    "https://www.bilibili.com/video/BV1JN4y127nk" :bilibili "BV1JN4y127nk"
    "https://vimeo.com/123456789" :vimeo "123456789"
    "https://www.loom.com/share/1234567890abcdef" :loom "1234567890abcdef"))

(deftest video-embed-preserves-youtube-url-and-id-behavior
  (is (= {:render :youtube-player
          :id "gG7bkadYfdU"
          :aspect-ratio [16 9]}
         (video/matched-video-embed "gG7bkadYfdU" :youtube)))
  (is (= {:render :youtube-player
          :id "gG7bkadYfdU"
          :start "10"
          :aspect-ratio [16 9]}
         (video/matched-video-embed "https://www.youtube.com/watch?v=gG7bkadYfdU&t=10")))
  (is (= :iframe
         (:render (video/matched-video-embed "https://www.youtube-nocookie.com/embed/gG7bkadYfdU"))))
  (is (= {:render :iframe
          :src "https://www.youtube-nocookie.com/embed/gG7bkadYfdU?t=10"
          :aspect-ratio [16 9]}
         (video/matched-video-embed "https://www.youtube-nocookie.com/embed/gG7bkadYfdU?t=10" :youtube))))

(deftest video-embed-builds-bilibili-src-from-url-and-id
  (is (= {:render :iframe
          :src "https://player.bilibili.com/player.html?bvid=BV1JN4y127nk&high_quality=1&autoplay=0"
          :aspect-ratio [16 9]}
         (video/matched-video-embed "https://www.bilibili.com/video/BV1JN4y127nk")))
  (is (= {:render :iframe
          :src "https://player.bilibili.com/player.html?bvid=BV1JN4y127nk&high_quality=1&autoplay=0"
          :aspect-ratio [16 9]}
         (video/matched-video-embed "BV1JN4y127nk" :bilibili)))
  (is (= {:render :iframe
          :src "https://player.bilibili.com/player.html?bvid=BV1JN4y127nk&high_quality=1&autoplay=0&p=2&t=10"
          :aspect-ratio [16 9]}
         (video/matched-video-embed "https://www.bilibili.com/video/BV1JN4y127nk?p=2&t=10"))))

(deftest video-embed-builds-vimeo-src-from-url-and-id
  (is (= {:render :iframe
          :src "https://player.vimeo.com/video/123456789"
          :aspect-ratio [16 9]}
         (video/matched-video-embed "https://vimeo.com/123456789")))
  (is (= {:render :iframe
          :src "https://player.vimeo.com/video/123456789"
          :aspect-ratio [16 9]}
         (video/matched-video-embed "123456789" :vimeo))))
