(ns frontend.handler.page-test
  (:require [cljs.test :refer [async deftest is testing]]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.handler.page :as page-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]))

(deftest create-today-journal-runs-after-loading-finishes
  (async done
         (testing "a check skipped during graph loading is retried once loading ends"
           (let [original-state @state/state
                 creates (atom [])
                 created (p/deferred)]
             (try
               (reset! state/state (assoc original-state
                                          :graph/loading? true
                                          :graph/importing nil))
               (-> (p/with-redefs [config/publishing? false
                                   date/today (constantly "Jul 6th, 2026")
                                   util/page-name-sanity-lc (fn [title] title)
                                   db/get-today-journal-page (constantly nil)
                                   page-handler/<create!
                                   (fn [title opts]
                                     (swap! creates conj [title opts])
                                     (p/resolve! created true)
                                     (p/resolved {:block/title title}))
                                   plugin-handler/hook-plugin-app (fn [& _] nil)]
                     (page-handler/create-today-journal!)
                     (is (empty? @creates)
                         "loading blocks the immediate create")
                     (swap! state/state assoc :graph/loading? false)
                     created)
                   (p/then
                    (fn []
                      (is (= [["Jul 6th, 2026"
                               {:redirect? false
                                :split-namespace? false
                                :today-journal? true}]]
                             @creates))
                      (done)))
                   (p/finally
                     (fn []
                       (reset! state/state original-state))))
               (catch :default e
                 (reset! state/state original-state)
                 (throw e)))))))
