(ns frontend.util.page
  "Provides util fns for page blocks"
  (:require [frontend.state :as state]
            [frontend.util :as util]
            [frontend.db :as db]))

(defn get-current-page-name
  "Fetch the current page's original name with same approach as get-current-page-id"
  []
  (or (:block/title (db/get-page (state/get-current-page)))
      (get-in (first (state/get-editor-args)) [:block :block/page :block/title])))

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

(defn get-latest-edit-page-id
  "Fetch the editing page id. If there is an edit-input-id set, we are probably still
   on editing mode"
  []
  (or
    (get-in (first (state/get-editor-args)) [:block :block/page :db/id])
    ;; not found
    (get-current-page-id)))

(defn get-page-file-rpath
  "Gets the file path of a page. If no page is given, detects the current page.
Returns nil if no file path is found or no page is detected or given"
  ([]
   (when-let [page-id (get-current-page-id)]
     (get-in (db/entity page-id) [:block/file :file/path])))
  ([page-name]
   (when-let [page-name' (some-> page-name util/page-name-sanity-lc)]
     (get-in (db/get-page page-name') [:block/file :file/path]))))
