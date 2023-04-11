(ns frontend.util.page
  "Provides util fns for page blocks"
  (:require [frontend.state :as state]
            [frontend.util :as util]
            [frontend.db :as db]))

(defn get-current-page-name
  "Fetch the current page's original name with same approach as get-current-page-id"
  []
  (or (state/get-current-page)
      (state/get-current-whiteboard)
      (get-in (first (state/get-editor-args)) [:block :block/page :block/original-name])))

(defn get-current-page-id
  "Fetches the current page id. Looks up page based on latest route and if
  nothing is found, gets page of last edited block"
  []
  (let [page-name (some-> (or (state/get-current-page) (state/get-current-whiteboard))
                          util/page-name-sanity-lc)]
    (or (and page-name (:db/id (db/entity [:block/name page-name])))
        (get-in (first (state/get-editor-args)) [:block :block/page :db/id]))))

(defn get-editing-page-id
  "Fetch the editing page id. If there is an edit-input-id set, we are probably still 
   on editing mode"
  []
  (if (or (state/editing?) (state/get-edit-input-id))
    (get-in (first (state/get-editor-args)) [:block :block/page :db/id])
    (get-current-page-id)))

(defn get-page-file-rpath
  "Gets the file path of a page. If no page is given, detects the current page.
Returns nil if no file path is found or no page is detected or given"
  ([]
   (when-let [page-id (get-current-page-id)]
     (get-in (db/entity page-id) [:block/file :file/path])))
  ([page-name]
   (when-let [page-name' (some-> page-name util/page-name-sanity-lc)]
     (get-in (db/entity [:block/name page-name']) [:block/file :file/path]))))
