(ns frontend.handler.tabs
  "Handler for tabs operations"
  (:require [frontend.date :as date]
            [frontend.db :as db]
            [frontend.handler.route :as route-handler]
            [frontend.handler.window :as window-handler]
            [frontend.state :as state]
            [frontend.state.tabs :as tabs-state]
            [frontend.util :as util]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(defn open-tab-by-page!
  "Open a page in a new tab or switch to existing tab"
  [page-uuid-or-name {:keys [new-tab?] :or {new-tab? false}}]
  (when page-uuid-or-name
    (p/let [page (db/get-page page-uuid-or-name)
            page-id (:db/id page)
            page-uuid (:block/uuid page)
            page-name (:block/name page)
            title (:block/title page)]
      (when page
        ;; Always check for existing tab first
        (let [existing-tab (tabs-state/find-tab-by-page (or page-uuid page-name))]
          (if existing-tab
            ;; Switch to existing tab
            (do
              (tabs-state/set-active-tab-id! (:id existing-tab))
              (route-handler/redirect-to-page! (or page-uuid page-name) {:push false :skip-auto-tab? true}))
            ;; Create new tab only if it doesn't exist
            (let [tab-id (tabs-state/add-tab! {:page-id page-id
                                               :page-name page-name
                                               :page-uuid page-uuid
                                               :title (or title page-name (str page-uuid))})]
              (route-handler/redirect-to-page! (or page-uuid page-name) {:push false :skip-auto-tab? true})
              tab-id)))))))

(defn close-tab!
  "Close a tab. If it's the last tab, navigate to Journals page"
  [tab-id]
  (let [active-id (tabs-state/get-active-tab-id)
        tab (tabs-state/get-tab-by-id tab-id)
        tabs (tabs-state/get-tabs)
        tab-index (.indexOf (mapv :id tabs) tab-id)]
    (if (= (count tabs) 1)
      ;; Last tab - navigate to Journals and update tab
      (do
        (tabs-state/update-active-tab! {:page-id nil
                                        :page-name "all-journals"
                                        :page-uuid nil
                                        :title "Journals"})
        (route-handler/redirect! {:to :all-journals}))
      ;; Multiple tabs - close this one and switch to another
      (do
        (tabs-state/remove-tab! tab-id)
        (when (= active-id tab-id)
          (let [remaining-tabs (tabs-state/get-tabs)]
            (when (seq remaining-tabs)
              ;; Navigate to the tab that was before this one, or the first tab
              (let [next-tab-index (if (> tab-index 0)
                                    (dec tab-index)
                                    0)
                    next-tab (nth remaining-tabs next-tab-index nil)]
                (when next-tab
                  (tabs-state/set-active-tab-id! (:id next-tab))
                  ;; Handle special case for all-journals
                  (if (= (:page-name next-tab) "all-journals")
                    (route-handler/redirect! {:to :all-journals})
                    (route-handler/redirect-to-page! 
                     (or (:page-uuid next-tab) (:page-name next-tab))
                     {:push false :skip-auto-tab? true})))))))))))

(defn switch-tab!
  "Switch to a specific tab"
  [tab-id]
  (when-let [tab (tabs-state/get-tab-by-id tab-id)]
    (tabs-state/set-active-tab-id! tab-id)
    ;; Handle special case for all-journals
    (if (= (:page-name tab) "all-journals")
      (route-handler/redirect! {:to :all-journals})
      (route-handler/redirect-to-page! 
       (or (:page-uuid tab) (:page-name tab))
       {:push false :skip-auto-tab? true}))))

(defn close-all-tabs!
  "Close all tabs and navigate to Journals page"
  []
  (when-let [active-id (tabs-state/get-active-tab-id)]
    (when-let [active-tab (tabs-state/get-tab-by-id active-id)]
      (tabs-state/update-active-tab! {:page-id nil
                                      :page-name "all-journals"
                                      :page-uuid nil
                                      :title "Journals"})
      (swap! state/state assoc-in [:tabs/tabs-list] [(assoc active-tab
                                                              :page-id nil
                                                              :page-name "all-journals"
                                                              :page-uuid nil
                                                              :title "Journals")])
      (route-handler/redirect! {:to :all-journals}))))

(defn update-current-tab-title!
  "Update the title of the currently active tab"
  [new-title]
  (when-let [active-id (tabs-state/get-active-tab-id)]
    (tabs-state/update-tab! active-id {:title new-title})))

(defn tabs-enabled?
  "Check if tabs feature is enabled"
  []
  (seq (tabs-state/get-tabs)))

(defn open-journal-in-tab!
  "Open today's journal in a new tab"
  []
  (let [today (date/today)]
    (when today
      (open-tab-by-page! today {:new-tab? true}))))

(defn open-all-journals-in-tab!
  "Open the all-journals page in a new tab or update current tab"
  []
  ;; Check if all-journals tab already exists
  (let [existing-tab (tabs-state/find-tab-by-page "all-journals")
        tabs (tabs-state/get-tabs)]
    (if existing-tab
      ;; Switch to existing tab
      (do
        (tabs-state/set-active-tab-id! (:id existing-tab))
        (route-handler/redirect! {:to :all-journals}))
      ;; Create new tab only if multiple tabs exist, otherwise update current
      (if (> (count tabs) 1)
        (let [tab-id (tabs-state/add-tab! {:page-id nil
                                           :page-name "all-journals"
                                           :page-uuid nil
                                           :title "Journals"})]
          (tabs-state/set-active-tab-id! tab-id)
          (route-handler/redirect! {:to :all-journals})
          tab-id)
        ;; Single tab - just update it
        (do
          (tabs-state/update-active-tab! {:page-id nil
                                          :page-name "all-journals"
                                          :page-uuid nil
                                          :title "Journals"})
          (route-handler/redirect! {:to :all-journals}))))))

(defn switch-to-tab-by-index!
  "Switch to tab by index (1-based, like Chrome). Tab 9 goes to last tab."
  [index]
  (let [tabs (tabs-state/get-tabs)
        tab-count (count tabs)]
    (when (pos? tab-count)
      (let [tab-index (if (= index 9)
                       ;; Cmd+9 goes to last tab
                       (dec tab-count)
                       ;; Otherwise use 0-based index
                       (dec index))]
        (when (and (>= tab-index 0) (< tab-index tab-count))
          (let [tab (nth tabs tab-index)]
            (switch-tab! (:id tab))))))))

(defn close-active-tab!
  "Close the currently active tab. In Electron, closes window when last tab."
  []
  (when-let [active-id (tabs-state/get-active-tab-id)]
    (let [tabs (tabs-state/get-tabs)]
      (if (and (util/electron?) (= (count tabs) 1))
        ;; Last tab in Electron - close the window
        (window-handler/close!)
        ;; Otherwise close the tab normally
        (close-tab! active-id)))))

(defn switch-to-prev-tab!
  "Switch to the previous tab (left). Wraps around to last tab."
  []
  (let [tabs (tabs-state/get-tabs)
        tab-count (count tabs)
        active-id (tabs-state/get-active-tab-id)]
    (when (> tab-count 1)
      (let [current-index (.indexOf (mapv :id tabs) active-id)
            prev-index (if (= current-index 0)
                        (dec tab-count)
                        (dec current-index))
            prev-tab (nth tabs prev-index)]
        (switch-tab! (:id prev-tab))))))

(defn switch-to-next-tab!
  "Switch to the next tab (right). Wraps around to first tab."
  []
  (let [tabs (tabs-state/get-tabs)
        tab-count (count tabs)
        active-id (tabs-state/get-active-tab-id)]
    (when (> tab-count 1)
      (let [current-index (.indexOf (mapv :id tabs) active-id)
            next-index (if (= current-index (dec tab-count))
                        0
                        (inc current-index))
            next-tab (nth tabs next-index)]
        (switch-tab! (:id next-tab))))))
