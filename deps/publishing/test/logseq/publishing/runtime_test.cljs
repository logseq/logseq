(ns logseq.publishing.runtime-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [logseq.publishing.page :as publish-page]
            [logseq.publishing.runtime :as publish-runtime]))

(defn- relative-static-path?
  [asset-path]
  (and (string? asset-path)
       (string/starts-with? asset-path "static/")
       (not (string/starts-with? asset-path "/"))
       (not (string/starts-with? asset-path "http"))))

(defn- attr-values
  [html attr]
  (->> (re-seq (re-pattern (str attr "=\"([^\"]+)\"")) html)
       (mapv second)))

(deftest published-index-html-script-srcs-are-relative
  (testing "hosted export can be served from a plain static root or subpath"
    (let [html (publish-page/index-html "{}" "{}" {:title "t" :name "n"})
          srcs (attr-values html "src")
          hrefs (attr-values html "href")]
      (is (seq srcs) "index.html loads javascript")
      (is (every? relative-static-path? srcs)
          "script src paths are relative static/ paths, not /static or CDN URLs")
      (is (every? relative-static-path? hrefs)
          "stylesheet and icon hrefs are relative static/ paths")
      (is (some #(= "static/js/main.js" %) srcs))
      (is (some #(= "static/js/magic_portal.js" %) srcs)
          "MagicPortal must load before the published db worker starts")
      (is (not-any? #(string/includes? % "react.production") srcs)
          "React UMD files are no longer copied by gulp and must not be referenced")
      (is (not-any? #(string/includes? % "react-dom.production") srcs)
          "ReactDOM UMD files are no longer copied by gulp and must not be referenced")
      (is (not-any? #(string/starts-with? % "/") srcs))
      (is (not-any? #(string/includes? % "asset.logseq.com") srcs)))))

(deftest published-page-scripts-are-relative-and-exist-as-export-assets
  (testing "hosted export can be served from a plain static root or subpath"
    (let [srcs (map :src publish-runtime/page-js-scripts)]
      (is (seq srcs) "index.html loads javascript")
      (is (every? relative-static-path? srcs)
          "script src paths are relative static/ paths, not /static or CDN URLs")
      (is (some #(= "static/js/main.js" %) srcs))
      (is (some #(= "static/js/magic_portal.js" %) srcs)
          "MagicPortal must load before the published db worker starts")
      (is (not-any? #(string/includes? % "react.production") srcs)
          "React UMD files are no longer copied by gulp and must not be referenced")
      (is (not-any? #(string/includes? % "react-dom.production") srcs)
          "ReactDOM UMD files are no longer copied by gulp and must not be referenced")
      (is (not-any? #(string/includes? % "asset.logseq.com") srcs)))))

(deftest hosted-export-requires-worker-and-wasm-files
  (let [files (set publish-runtime/required-js-runtime-files)]
    (is (not (contains? files "main.js")))
    (is (contains? files "db-worker.js"))
    (is (contains? files "db-worker-bundle.js"))
    (is (contains? files "worker.js"))
    (is (contains? files "sqlite3.wasm"))
    (is (contains? files "magic_portal.js"))))
