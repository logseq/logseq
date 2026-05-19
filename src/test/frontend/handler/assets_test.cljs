(ns frontend.handler.assets-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.config :as config]
            [frontend.fs :as fs]
            [frontend.handler.assets :as assets]
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
