(ns frontend.handler.mobile.swipe
  (:require [goog.dom :as gdom]
            [cljs-bean.core :as bean]
            [frontend.state :as state]
            [frontend.mobile.util :as mobile-util]))

(defn setup-listeners!
  []
  (let [container js/document]
    (.addEventListener container "swiped"
                       (fn [e]
                         (let [target (.-target e)
                               detail (some-> (.-detail e)
                                              (bean/->clj))]
                           (case (:dir detail)
                             "left"
                             (when (state/get-left-sidebar-open?)
                               (state/set-left-sidebar-open! false))
                             "right"
                             (when (and (not (state/get-left-sidebar-open?))
                                        (:yStart detail)
                                        (if (mobile-util/native-android?)
                                          (<= (:yStart detail) 200)
                                          true)
                                        (<= (:xStart detail) 20))
                               (state/set-left-sidebar-open! true))
                             nil))))))
