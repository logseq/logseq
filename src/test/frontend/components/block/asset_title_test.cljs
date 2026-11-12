(ns frontend.components.block.asset-title-test
  (:require ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [deftest is testing]]
            [frontend.components.block :as block]
            [goog.object :as gobj]))

(defn- render-static
  [element]
  (let [previous-react (gobj/get js/globalThis "React")]
    (gobj/set js/globalThis "React" react)
    (try
      (.renderToStaticMarkup react-dom-server element)
      (finally
        (if (some? previous-react)
          (gobj/set js/globalThis "React" previous-react)
          (js-delete js/globalThis "React"))))))

(defn- render-title
  "Renders block-title for an asset block of `asset-type` with the renderers it
  chooses between replaced by markers."
  [asset-type]
  (with-redefs [block/asset-cp (fn [_config _block] [:span.asset-link-marker])
                block/block-title-aux (fn [_config _block _opts] [:span.plain-title-marker])]
    (render-static
     (block/block-title {}
                        {:block/uuid (random-uuid)
                         :block/title "report"
                         :logseq.property.asset/type asset-type}
                        {}))))

(deftest non-media-asset-title-renders-as-asset-link-test
  (testing "pdf and other file types are shown through the asset component"
    (doseq [asset-type ["pdf" "txt" "xlsx" "docx"]]
      (let [html (render-title asset-type)]
        (is (re-find #"asset-link-marker" html)
            (str asset-type " asset block renders as a clickable asset link"))
        (is (not (re-find #"plain-title-marker" html))
            (str asset-type " asset block title is not plain text")))))
  (testing "images, audio and video keep the title: their block content renders the media above it"
    (doseq [asset-type ["png" "mp3" "mp4"]]
      (let [html (render-title asset-type)]
        (is (re-find #"plain-title-marker" html)
            (str asset-type " asset block keeps the plain title"))
        (is (not (re-find #"asset-link-marker" html))
            (str asset-type " media is not rendered a second time by the title"))))))
