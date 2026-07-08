(ns ^:no-doc frontend.handler.journal
  (:require [frontend.date :as date]
            [frontend.handler.route :as route-handler]
            [frontend.handler.page :as page-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [promesa.core :as p]
            [frontend.db.async :as db-async]))

(defn- redirect-to-journal!
  [page]
  (when page
    (p/let [repo (state/get-current-repo)
            _ (db-async/<get-block repo page :children? false)
            exists? (db-async/<page-exists? repo page #{:logseq.class/Journal})]
     (if exists?
       (route-handler/redirect! {:to          :page
                                 :path-params {:name page}})
       (page-handler/<create! page)))))

(defn go-to-tomorrow!
  []
  (redirect-to-journal! (date/tomorrow)))

(defn- <get-current-journal
  []
  (let [current-page (state/get-current-page)]
    (p/let [block (when current-page
                    (db-async/<get-block (state/get-current-repo) current-page {:children? false}))]
      (or (some-> block :block/title date/journal-title->long)
          (util/time-ms)))))

(defn go-to-prev-journal!
  []
  (p/let [current-journal (<get-current-journal)
          day (tc/from-long current-journal)
          page (date/journal-name (t/minus day (t/days 1)))]
    (redirect-to-journal! page)))

(defn go-to-next-journal!
  []
  (p/let [current-journal (<get-current-journal)
          day (tc/from-long current-journal)
          page (date/journal-name (t/plus day (t/days 1)))]
    (redirect-to-journal! page)))
