(ns frontend.components.popup-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.shui.popup.core :as shui-popup]))

(deftest popup-without-anchor-event-test
  (let [id :popup-without-anchor]
    (is (= id (shui-popup/show! nil (fn [] [:div "Downloading"]) {:id id})))
    (is (some? (shui-popup/get-popup id)))
    (shui-popup/hide! id)))
