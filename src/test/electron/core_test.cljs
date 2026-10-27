(ns electron.core-test
  (:require [cljs.test :refer [async deftest is]]
            [electron.lifecycle :as lifecycle]
            [promesa.core :as p]))

(deftest start-waits-for-asynchronous-teardown
  (async done
    (let [events (atom [])
          teardown-done (p/deferred)
          lifecycle-op (volatile! (p/resolved nil))]
      (lifecycle/enqueue! lifecycle-op
                          #(do
                             (swap! events conj :teardown)
                             teardown-done))
      (lifecycle/enqueue! lifecycle-op #(swap! events conj :setup))
      (-> (p/let [_ (p/delay 0)]
            (is (= [:teardown] @events))
            (p/resolve! teardown-done true)
            (p/delay 0))
          (p/then (fn [_]
                    (is (= [:teardown :setup] @events))))
          (p/finally (fn []
                       (p/resolve! teardown-done true)
                       (done)))))))

(deftest start-continues-after-teardown-failure
  (async done
    (let [events (atom [])
          lifecycle-op (volatile! (p/resolved nil))]
      (lifecycle/enqueue! lifecycle-op
                          #(do
                             (swap! events conj :teardown)
                             (p/rejected (ex-info "teardown failed" {}))))
      (lifecycle/enqueue! lifecycle-op #(swap! events conj :setup))
      (-> (p/let [_ (p/delay 0)]
            (is (= [:teardown :setup] @events)))
          (p/finally (fn []
                       (done)))))))

(defn- fake-contents
  "Web contents that report loading? and keep the did-finish-load listeners."
  [loading? listeners]
  #js {:isLoading (fn [] loading?)
       :once (fn [event f] (swap! listeners conj [event f]))})

(deftest when-loaded-runs-at-once-on-a-loaded-window
  ;; a main-process reload in development sets the updater up again on a window that has already loaded
  (let [ran (atom 0)
        listeners (atom [])]
    (lifecycle/when-loaded! (fake-contents false listeners) #(swap! ran inc))
    (is (= 1 @ran) "a loaded window runs it now")
    (is (empty? @listeners) "and waits for no did-finish-load, which has already fired")))

(deftest when-loaded-waits-for-a-loading-window
  (let [ran (atom 0)
        listeners (atom [])]
    (lifecycle/when-loaded! (fake-contents true listeners) #(swap! ran inc))
    (is (= 0 @ran) "not before the window has loaded")
    (is (= ["did-finish-load"] (map first @listeners)))
    ((second (first @listeners)))
    (is (= 1 @ran) "on did-finish-load")))
