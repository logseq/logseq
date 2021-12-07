(ns frontend.handler.mobile.swipe
  (:require [goog.dom :as gdom]
            [cljs-bean.core :as bean]
            [frontend.state :as state]))

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
                             (do
                               (when (state/get-left-sidebar-open?)
                                 (state/set-left-sidebar-open! false)))
                             "right"
                             (do
                               (when (and (not (state/get-left-sidebar-open?))
                                          (:yStart detail)
                                          (<= (:yStart detail) 200))
                                 (state/set-left-sidebar-open! true)))
                             nil))))))
