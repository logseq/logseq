(ns frontend.components.block.video-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.block.video :as block-video]
            [io.factorhouse.hsx.core :as hsx]))

(defn- macro-inline
  [name & arguments]
  ["Macro" {:name name
            :arguments (vec arguments)}])

(deftest video-macro-inline-segments-split-video-macros
  (let [youtube (macro-inline "youtube" "youtube-id")
        vimeo (macro-inline "vimeo" "https://vimeo.com/123")
        segments (block-video/video-inline-segments
                  [["Plain" "front "]
                   youtube
                   ["Plain" " middle "]
                   vimeo
                   ["Plain" " back"]])]
    (is (= [{:type :inline
             :items [["Plain" "front "]]}
            {:type :video
             :item youtube}
            {:type :inline
             :items [["Plain" " middle "]]}
            {:type :video
             :item vimeo}
            {:type :inline
             :items [["Plain" " back"]]}]
           segments))))

(deftest video-macro-inline-segments-keep-non-video-macros-inline
  (testing "Only video providers become block-level segments"
    (let [query (macro-inline "query" "(task TODO)")
          segments (block-video/video-inline-segments
                    [["Plain" "front "]
                     query
                     ["Plain" " back"]])]
      (is (= [{:type :inline
               :items [["Plain" "front "]
                       query
                       ["Plain" " back"]]}]
             segments)))))

(deftest video-macro-segment-hiccup-sets-react-wrapper-keys
  (let [youtube (macro-inline "youtube" "dQw4w9WgXcQ")
        nodes (vec
               (block-video/video-inline-segments-cp
                (fn [_item] [:span.video-child])
                (fn [items] (map (fn [item] [:span.inline-child (pr-str item)]) items))
                [["Plain" "front "]
                 youtube
                 ["Plain" " back"]]))
        react-elements (mapv hsx/create-element nodes)]
    (testing "Generated hiccup carries key on the wrapper attrs"
      (is (= ["video-inline-text-0"
              "video-macro-youtube-dQw4w9WgXcQ"
              "video-inline-text-2"]
             (mapv #(get (second %) :key) nodes))))

    (testing "HSX passes wrapper attrs key into React element identity"
      (is (= ["video-inline-text-0"
              "video-macro-youtube-dQw4w9WgXcQ"
              "video-inline-text-2"]
             (mapv #(.-key %) react-elements))))))

(deftest video-macro-key-stays-stable-when-text-is-inserted-before-video
  (let [youtube (macro-inline "youtube" "dQw4w9WgXcQ")
        video-nodes (fn [items]
                      (->> (block-video/video-inline-segments-cp
                            (fn [_item] [:span.video-child])
                            (fn [items] (map (fn [item] [:span.inline-child (pr-str item)]) items))
                            items)
                           (filter #(= :div.video-embed-block (first %)))
                           vec))
        without-prefix (video-nodes [youtube
                                     ["Plain" " back"]])
        with-prefix (video-nodes [["Plain" "front "]
                                  youtube
                                  ["Plain" " back"]])]
    (is (= ["video-macro-youtube-dQw4w9WgXcQ"]
           (mapv #(get (second %) :key) without-prefix)))
    (is (= ["video-macro-youtube-dQw4w9WgXcQ"]
           (mapv #(get (second %) :key) with-prefix)))))

(deftest video-macro-width-argument-parses-and-updates-width
  (testing "Only positive numeric w= arguments are treated as video widths"
    (is (= 420 (block-video/video-width ["dQw4w9WgXcQ" "w=420"])))
    (is (nil? (block-video/video-width ["dQw4w9WgXcQ" "w=0"])))
    (is (nil? (block-video/video-width ["dQw4w9WgXcQ" "w=abc"]))))

  (testing "Updating width keeps the video id first and removes stale width arguments"
    (is (= ["dQw4w9WgXcQ" "w=320"]
           (block-video/set-video-width-argument ["dQw4w9WgXcQ"] 320)))
    (is (= ["dQw4w9WgXcQ" "w=480"]
           (block-video/set-video-width-argument ["dQw4w9WgXcQ" "w=320"] 480)))
    (is (= ["dQw4w9WgXcQ"]
           (block-video/set-video-width-argument ["dQw4w9WgXcQ" "w=320"] nil)))))

(deftest video-macro-width-content-update-targets-current-macro
  (testing "A width update only changes the selected matching occurrence"
    (is (= "{{youtube a}} {{youtube a, w=300}}"
           (block-video/update-video-macro-width-in-content
            "{{youtube a}} {{youtube a}}"
            {:name "youtube" :arguments ["a"] :occurrence 1}
            300))))

  (testing "Resetting width removes only the current macro w= argument"
    (is (= "front {{youtube a, w=200}} middle {{youtube a}} back"
           (block-video/update-video-macro-width-in-content
            "front {{youtube a, w=200}} middle {{youtube a, w=300}} back"
            {:name "youtube" :arguments ["a"] :occurrence 1}
            nil))))

  (testing "The video key ignores w= so resize updates do not force remounts"
    (is (= (block-video/video-macro-key (macro-inline "youtube" "a" "w=200"))
           (block-video/video-macro-key (macro-inline "youtube" "a" "w=300"))))))
