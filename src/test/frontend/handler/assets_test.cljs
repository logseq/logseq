(ns frontend.handler.assets-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.handler.assets :as assets]))

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

