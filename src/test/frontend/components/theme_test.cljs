(ns frontend.components.theme-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.theme :as theme]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.ui :as ui-handler]))

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
