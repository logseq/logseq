(ns ^:no-doc frontend.handler.journal
  (:require [frontend.date :as date]
            [frontend.handler.route :as route-handler]
            [frontend.handler.page :as page-handler]
            [frontend.state :as state]
            [promesa.core :as p]
            [frontend.db.async :as db-async]))

(defn- redirect-to-journal-day!
  "Opens the journal page of `journal-day`, found by `:block/journal-day`, and
  creates it when the day has no journal page yet."
  [journal-day]
  (when journal-day
    (p/let [page (db-async/<get-journal-page-by-day (state/get-current-repo) journal-day)]
      (if-let [page-uuid (:block/uuid page)]
        (route-handler/redirect! {:to          :page
                                  :path-params {:name (str page-uuid)}})
        (page-handler/<create! (date/journal-day->journal-name journal-day))))))

(defn go-to-tomorrow!
  []
  (redirect-to-journal-day! (date/journal-day-plus (date/today-journal-day) 1)))

(defn- <get-current-journal-day
  []
  (let [current-page (state/get-current-page)]
    (p/let [block (when current-page
                    (db-async/<get-block (state/get-current-repo) current-page {:children? false}))]
      (or (:block/journal-day block)
          (date/today-journal-day)))))

(defn go-to-prev-journal!
  []
  (p/let [current-day (<get-current-journal-day)]
    (redirect-to-journal-day! (date/journal-day-plus current-day -1))))

(defn go-to-next-journal!
  []
  (p/let [current-day (<get-current-journal-day)]
    (redirect-to-journal-day! (date/journal-day-plus current-day 1))))
