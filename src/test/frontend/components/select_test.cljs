(ns frontend.components.select-test
  (:require [cljs.test :refer [deftest is]]
            [clojure.walk :as walk]
            [frontend.components.select :as select]
            [frontend.handler.route :as route-handler]
            [frontend.state :as state]))

(defn- hiccup-hrefs
  [x]
  (let [hrefs (atom [])]
    (walk/postwalk
     (fn [node]
       (when (and (map? node) (contains? node :href))
         (swap! hrefs conj (:href node)))
       node)
     x)
    @hrefs))

(deftest graph-open-empty-placeholder-navigates-in-app-test
  (let [closed? (atom false)
        redirects (atom [])
        placeholder (select/graph-open-empty-placeholder identity)]
    (is (= [] (hiccup-hrefs placeholder))
        "Empty-state add-graph must not use href, which Electron can hand to the OS")
    (is (= select/graph-open-empty-placeholder
           (:empty-placeholder (:graph-open (select/select-config)))))
    (with-redefs [state/close-dialog! (fn []
                                        (reset! closed? true))
                  route-handler/redirect-to-all-graphs (fn []
                                                         (swap! redirects conj :graphs))]
      (select/graph-open-add-graph!)
      (is (true? @closed?))
      (is (= [:graphs] @redirects)))))
