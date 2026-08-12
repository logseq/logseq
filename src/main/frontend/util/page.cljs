(ns frontend.util.page
  "Provides util fns for page blocks"
  (:require [frontend.state :as state]
            [frontend.util :as util]))

(defn get-current-page-uuid
  "Fetch the current page's uuid with same approach as get-current-page-id"
  []
  (let [current-page (state/get-current-page)]
    (or (when (and (string? current-page)
                   (util/uuid-string? current-page))
          (uuid current-page))
        (get-in (first (state/get-editor-args)) [:block :block/page :block/uuid]))))

(defn get-current-page-id
  "Fetches the current page id. Looks up page based on latest route and if
  nothing is found, gets page of last edited block"
  []
  (or (get-in (first (state/get-editor-args)) [:block :block/page :db/id])
      (get-in (first (state/get-editor-args)) [:block :db/id])))
