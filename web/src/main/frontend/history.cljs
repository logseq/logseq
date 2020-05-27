(ns frontend.history
  (:require [frontend.state :as state]))

(def state-keys
  #{:route-match
    :search/q
    :search/result
    :ui/theme
    :ui/toggle-state
    :ui/collapsed-headings
    :ui/sidebar-collapsed-blocks
    :editor/show-page-search?
    :editor/show-date-picker?
    :editor/show-input nil
    :editor/last-saved-cursor nil
    :editor/editing? nil
    :editor/content {}
    :editor/heading nil
    :cursor-range nil
    :cursor-pos nil
    :selection/mode false
    :selection/headings nil
    :custom-context-menu/show? false
    :sidebar/blocks '()})

;; Undo && Redo
;; We need to track several states:
;; 1. frontend.state/state.
;; 2. Datascript dbs (include the files db).
;; 3. Git files

;; db -> history sequence
(defonce history
  (atom {}))

(defn add-history!
  [k value]
  (when (and k value)
    (swap! history update k conj value)))

(def ^:const history-limit 100)
