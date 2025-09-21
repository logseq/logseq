(ns electron.find-in-page
  (:require [electron.utils :as utils]
            [cljs-bean.core :as bean]))

(defn find!
  [^js window search option]
  (when window
    (let [contents ^js (.-webContents window)]
      (.findInPage contents search option)
      (.on contents "found-in-page"
           (fn [_event result]
             (utils/send-to-renderer window "foundInPage" (bean/->clj result))))
      true)))

(defn clear!
  [^js window]
  (when window
    (.stopFindInPage ^js (.-webContents window) "clearSelection")))
