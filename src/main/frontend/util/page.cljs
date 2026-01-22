(ns frontend.util.page
  "Provides util fns for page blocks"
  (:require [frontend.db :as db]
            [frontend.state :as state]))

(defn get-current-page-uuid
  "Fetch the current page's uuid with same approach as get-current-page-id"
  []
  (or (:block/uuid (db/get-page (state/get-current-page)))
      (get-in (first (state/get-editor-args)) [:block :block/page :block/uuid])))

(defn get-current-page-id
  "Fetches the current page id. Looks up page based on latest route and if
  nothing is found, gets page of last edited block"
  []
  (let [page-name (state/get-current-page)]
    (:db/id (db/get-page page-name))))