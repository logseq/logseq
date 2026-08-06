(ns mobile.render-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.rfx :as rfx]
            [mobile.render :as mobile-render]))

(deftest app-root-installs-rfx-provider-test
  (let [app-element #js {:component "app"}
        provider-element #js {:component "provider"}]
    (with-redefs [rfx/provider (fn [child]
                                (is (identical? app-element child))
                                provider-element)]
      (is (identical? provider-element
                      (mobile-render/app-root app-element))))))
