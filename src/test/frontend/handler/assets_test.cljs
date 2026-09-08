(ns frontend.handler.assets-test
  (:require [cljs.test :refer [async deftest is testing]]
            [frontend.config :as config]
            [frontend.fs :as fs]
            [frontend.handler.assets :as assets]
            [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]))

(defn- uint8->vec
  [^js payload]
  (js->clj (js/Array.from payload)))

(deftest coerce-array-buffer-to-uint8-test
  (let [source (js/Uint8Array. #js [1 2 3])
        output (#'assets/->uint8 (.-buffer source))]
    (is (instance? js/Uint8Array output))
    (is (= [1 2 3] (uint8->vec output)))))

(deftest coerce-array-buffer-view-to-uint8-test
  (let [source (js/Uint8Array. #js [9 8 7 6])
        view (js/DataView. (.-buffer source) 1 2)
        output (#'assets/->uint8 view)]
    (is (instance? js/Uint8Array output))
    (is (= [8 7] (uint8->vec output)))))

(deftest coerce-buffer-like-object-to-uint8-test
  (let [buffer-like #js {:type "Buffer"
                         :data #js [10 11 12]}
        output (#'assets/->uint8 buffer-like)]
    (is (instance? js/Uint8Array output))
    (is (= [10 11 12] (uint8->vec output)))))

(deftest coerce-buffer-like-map-to-uint8-test
  (let [buffer-like {"type" "Buffer"
                     "data" [13 14 15]}
        output (#'assets/->uint8 buffer-like)]
    (is (instance? js/Uint8Array output))
    (is (= [13 14 15] (uint8->vec output)))))

(deftest coerce-buffer-like-object-with-seq-data-to-uint8-test
  (let [buffer-like #js {:type "Buffer"
                         :data [16 17 18]}
        output (#'assets/->uint8 buffer-like)]
    (is (instance? js/Uint8Array output))
    (is (= [16 17 18] (uint8->vec output)))))

(deftest coerce-indexed-byte-object-to-uint8-test
  (let [buffer-like #js {"0" 19
                         "1" 20
                         "2" 21}
        output (#'assets/->uint8 buffer-like)]
    (is (instance? js/Uint8Array output))
    (is (= [19 20 21] (uint8->vec output)))))

(deftest coerce-indexed-byte-map-to-uint8-test
  (let [buffer-like {"0" 22
                     "1" 23
                     "2" 24}
        output (#'assets/->uint8 buffer-like)]
    (is (instance? js/Uint8Array output))
    (is (= [22 23 24] (uint8->vec output)))))

(deftest get-all-assets-does-not-readdir-missing-assets-dir
  (async done
    (let [readdir-calls (atom 0)
          original-assets-root config/get-current-repo-assets-root
          original-stat fs/stat
          original-readdir fs/readdir]
      (set! config/get-current-repo-assets-root (constantly "/tmp/graph/assets"))
      (set! fs/stat (fn [path]
                      (is (= "/tmp/graph/assets" path))
                      (p/rejected (js/Error. "ENOENT"))))
      (set! fs/readdir (fn [& _args]
                         (swap! readdir-calls inc)
                         (p/rejected (js/Error. "readdir should not be called"))))
      (-> (p/let [result (assets/<get-all-assets)]
            (is (= [] result))
            (is (zero? @readdir-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! config/get-current-repo-assets-root original-assets-root)
                       (set! fs/stat original-stat)
                       (set! fs/readdir original-readdir)
                       (done)))))))

(deftest resolve-asset-real-path-url-electron-test
  (with-redefs [util/electron? (constantly true)
                config/get-repo-dir (constantly "/Users/charlie/graph")]
    (is (= "assets:///Users/charlie/graph/assets/test.png"
           (#'assets/resolve-asset-real-path-url "some-repo" "assets/test.png")))))

(deftest normalize-asset-resource-url-electron-test
  (with-redefs [util/electron? (constantly true)]
    (is (= "assets:///Users/charlie/graph/assets/test.png"
           (assets/normalize-asset-resource-url "/Users/charlie/graph/assets/test.png")))))

(deftest normalize-asset-resource-url-electron-windows-test
  (with-redefs [util/electron? (constantly true)
                util/win32? true]
    (is (= "assets:///C/logseq__colon/Users/charlie/graph/assets/test.png"
           (assets/normalize-asset-resource-url "C:/Users/charlie/graph/assets/test.png")))))

(deftest make-asset-url-electron-test
  (async done
    (with-redefs [util/electron? (constantly true)
                  config/get-repo-dir (constantly "/Users/charlie/graph")]
      (-> (assets/<make-asset-url "assets/test.png")
          (p/then (fn [url]
                    (is (= "assets:///Users/charlie/graph/assets/test.png" url))
                    (done)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))
                     (done)))))))

(deftest make-asset-url-electron-windows-test
  (async done
    (with-redefs [util/electron? (constantly true)
                  util/win32? true
                  config/get-repo-dir (constantly "C:/Users/charlie/graph")]
      (-> (assets/<make-asset-url "assets/test.png")
          (p/then (fn [url]
                    (is (= "assets:///C/logseq__colon/Users/charlie/graph/assets/test.png" url))
                    (done)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))
                     (done)))))))

(deftest asset-protocol-url->media-url-keeps-electron-assets-protocol-test
  (with-redefs [util/electron? (constantly true)]
    (let [url "assets:///C/logseq__colon/Users/charlie/graph/assets/test.mp3"]
      (is (= url
             (assets/asset-protocol-url->media-url url))))))

(deftest local-file-iframe-src->assets-url-electron-test
  (testing "file:// and graph-relative assets rewrite to assets://; remote srcs stay unchanged"
    (with-redefs [util/electron? (constantly true)
                  state/get-current-repo (constantly "some-repo")
                  config/get-repo-dir (constantly "/Users/charlie/graph")]
      (is (= "assets:///Users/charlie/graph/assets/foo.html"
             (assets/local-file-iframe-src->assets-url
              "file:///Users/charlie/graph/assets/foo.html")))
      (is (= "assets:///Users/charlie/graph/assets/foo.html"
             (assets/local-file-iframe-src->assets-url "./assets/foo.html")))
      (is (= "assets:///Users/charlie/graph/assets/foo.html"
             (assets/local-file-iframe-src->assets-url "assets/foo.html")))
      (is (nil? (assets/local-file-iframe-src->assets-url "//example.com/foo.html")))
      (is (nil? (assets/local-file-iframe-src->assets-url "https://example.com/foo.html")))
      (is (nil? (assets/local-file-iframe-src->assets-url "http://localhost:8080/foo.html")))
      (is (nil? (assets/local-file-iframe-src->assets-url "javascript:alert(1)")))
      (is (nil? (assets/local-file-iframe-src->assets-url "assets:///Users/charlie/graph/assets/foo.html"))))))

(deftest local-file-iframe-src->assets-url-electron-windows-test
  (with-redefs [util/electron? (constantly true)]
    (is (= "assets:///C/logseq__colon/dev/work/notes/assets/foo.html"
           (assets/local-file-iframe-src->assets-url
            "file:///C:/dev/work/notes/assets/foo.html")))))

(deftest local-file-iframe-src->assets-url-non-electron-test
  (with-redefs [util/electron? (constantly false)]
    (is (nil? (assets/local-file-iframe-src->assets-url
               "file:///Users/charlie/graph/assets/foo.html")))))

(deftest rewrite-local-file-iframe-srcs-electron-test
  (testing "rewrites only iframe file:// srcs and leaves other tags/urls intact"
    (with-redefs [util/electron? (constantly true)]
      (is (= "<iframe src=\"assets:///Users/charlie/graph/assets/foo.html\" width=\"100%\"></iframe>"
             (assets/rewrite-local-file-iframe-srcs
              "<iframe src=\"file:///Users/charlie/graph/assets/foo.html\" width=\"100%\"></iframe>")))
      (is (= (str "<iframe src=\"assets:///C/logseq__colon/dev/work/notes/radian-arc-length.html\" "
                  "width=\"100%\" height=\"720\" style=\"border: 0;\" "
                  "title=\"Interactive explanation of radians using arc length and radius\"></iframe>")
             (assets/rewrite-local-file-iframe-srcs
              (str "<iframe src=\"file:///C:/dev/work/notes/radian-arc-length.html\" "
                   "width=\"100%\" height=\"720\" style=\"border: 0;\" "
                   "title=\"Interactive explanation of radians using arc length and radius\"></iframe>"))))
      (is (= "<iframe src='assets:///Users/charlie/graph/assets/foo.html'></iframe>"
             (assets/rewrite-local-file-iframe-srcs
              "<iframe src='file:///Users/charlie/graph/assets/foo.html'></iframe>")))
      (is (= (str "<iframe src=\"https://example.com/a.html\"></iframe>"
                  "<iframe src=\"assets:///Users/charlie/graph/assets/foo.html\"></iframe>")
             (assets/rewrite-local-file-iframe-srcs
              (str "<iframe src=\"https://example.com/a.html\"></iframe>"
                   "<iframe src=\"file:///Users/charlie/graph/assets/foo.html\"></iframe>"))))
      (is (= "<img src=\"file:///Users/charlie/graph/assets/foo.png\">"
             (assets/rewrite-local-file-iframe-srcs
              "<img src=\"file:///Users/charlie/graph/assets/foo.png\">")))
      (is (= "<iframe srcdoc=\"<p>hi</p>\"></iframe>"
             (assets/rewrite-local-file-iframe-srcs
              "<iframe srcdoc=\"<p>hi</p>\"></iframe>"))))))

(deftest rewrite-local-file-iframe-srcs-non-electron-test
  (with-redefs [util/electron? (constantly false)]
    (is (= "<iframe src=\"file:///Users/charlie/graph/assets/foo.html\"></iframe>"
           (assets/rewrite-local-file-iframe-srcs
            "<iframe src=\"file:///Users/charlie/graph/assets/foo.html\"></iframe>")))))
