(ns ^:no-doc frontend.handler.journal
  (:require [frontend.date :as date]
            [frontend.handler.route :as route-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]))

(defn- redirect-to-journal!
  [page]
  (when (and page (state/enable-journals? (state/get-current-repo)))
    (route-handler/redirect! {:to          :page
                              :path-params {:name page}})))

(defn go-to-tomorrow!
  []
  (redirect-to-journal! (date/tomorrow)))

(defn- get-current-journal
  []
  (let [current-page (state/get-current-page)]
    (or (date/journal-title->long current-page)
        (util/time-ms))))

(defn go-to-prev-journal!
  []
  (let [current-journal (get-current-journal)
        day (tc/from-long current-journal)
        page (date/journal-name (t/minus day (t/days 1)))]
    (redirect-to-journal! page)))

(defn go-to-next-journal!
  []
  (let [current-journal (get-current-journal)
        day (tc/from-long current-journal)
        page (date/journal-name (t/plus day (t/days 1)))]
    (redirect-to-journal! page)))
