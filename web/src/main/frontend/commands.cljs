(ns frontend.commands
  (:require [frontend.util :as util]
            [forntend.state :as state]))

(defn ->page-reference
  [page]
  (util/format "[[%s]]" page))

;; Credits to roamresearch.com
(defn commands
  [command-name]
  (get
   (merge
    {"Today" (->page-reference (util/today))
     "Tomorrow" (->page-reference (util/tomorrow))
     "Yesterday" (->page-reference (util/tomorrow))
     "Current Time" (util/get-current-time)
     "Date Picker" [[:date/pick]
                    ]
     "Page Reference" [[:editor/input "[[]]"]
                       [:editor/cursor-back 2]
                       [:search :page]
                       [:insert]
                       [:cursor/move-to-end]]
     "Link" nil
     "Upload a image" nil}
    ;; Allow user to modify or extend, should specify how to extend.
    (:config @state/state))
   command-name))
