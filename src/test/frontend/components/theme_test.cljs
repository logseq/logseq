(ns frontend.components.theme-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.theme :as theme]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.util :as util]))

(deftest apply-current-graph-changed-skips-when-db-worker-not-ready
  (let [css-calls (atom 0)
        hook-calls (atom [])]
    (with-redefs [ui-handler/reset-custom-css! (fn [] (swap! css-calls inc))
                  plugin-handler/hook-plugin-app (fn [& args] (swap! hook-calls conj args))]
      (theme/apply-current-graph-changed! false)
      (is (zero? @css-calls))
      (is (empty? @hook-calls))
      (theme/apply-current-graph-changed! true)
      (is (= 1 @css-calls))
      (is (= [[:current-graph-changed {}]] @hook-calls)))))

(deftest ensure-route-title-and-label-retries-when-worker-ready
  (let [title-calls (atom [])
        label-calls (atom [])
        loading-titles (atom [])
        route {:data {:name :page}
               :path-params {:name "Page"}}]
    (with-redefs [util/set-title! (fn [title] (swap! loading-titles conj title))
                  route-handler/update-page-title! (fn [r] (swap! title-calls conj r))
                  route-handler/update-page-label! (fn [r] (swap! label-calls conj r))]
      (theme/ensure-route-title-and-label! true false route)
      (is (= 1 (count @loading-titles)))
      (is (empty? @title-calls))
      (is (empty? @label-calls))

      (theme/ensure-route-title-and-label! false false route)
      (theme/ensure-route-title-and-label! nil false route)
      (theme/ensure-route-title-and-label! nil true route)
      (is (empty? @title-calls)
          "Do not apply route chrome until graph restore finishes.")
      (is (empty? @label-calls))

      (theme/ensure-route-title-and-label! false true route)
      (is (= [route] @title-calls))
      (is (= [route] @label-calls)
          "After restore and worker-ready, retry both title and body data-page."))))
