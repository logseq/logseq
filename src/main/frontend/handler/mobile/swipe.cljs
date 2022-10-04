(ns ^:no-doc frontend.handler.mobile.swipe
  (:require [cljs-bean.core :as bean]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.mobile.util :as mobile-util]))

(defn setup-listeners!
  []
  (let [container js/document]
    (.addEventListener
     container "swiped"
     (fn [e]
       (let [detail (some-> (.-detail e)
                            (bean/->clj))
             width (.-innerWidth js/window)
             height (.-innerHeight js/window)
             xstart (:xStart detail)
             ystart (:yStart detail)]
         (case (:dir detail)
           "left"
           (cond
             (and (> xstart (/ width 1.2))
                  (not (util/sm-breakpoint?)))
             (when-not (state/sub :ui/sidebar-open?)
               (state/set-state! :ui/sidebar-open? true))

             (if (util/sm-breakpoint?)
               (< xstart (/ width 1.25))
               (< xstart (/ width 2)))
             (when (state/get-left-sidebar-open?)
               (state/set-left-sidebar-open! false))

             :else
             nil)

           "right"
           (cond
             (and (mobile-util/native-android?)
                  (<= ystart (/ height 2)))
             (when-not (state/get-left-sidebar-open?)
               (when (util/sm-breakpoint?)
                 (state/clear-edit!))
               (state/set-left-sidebar-open! true))

             (> xstart (/ width 2))
             (when (state/sub :ui/sidebar-open?)
               (state/set-state! :ui/sidebar-open? false))

             (and (mobile-util/native-ios?)
                  (<= (:xStart detail) 20))
             (when-not (state/get-left-sidebar-open?)
               (when (mobile-util/native-iphone?)
                 (state/clear-edit!))
               (state/set-left-sidebar-open! true))

             :else nil)

           nil))))))
