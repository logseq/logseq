(ns frontend.components.popup-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.shui.popup.core :as popup]))

(deftest popup-without-anchor-event-test
  (let [id :popup-without-anchor]
    (is (= id (popup/show! nil (fn [] [:div "Downloading"]) {:id id})))
    (is (some? (popup/get-popup id)))
    (popup/hide! id)))
