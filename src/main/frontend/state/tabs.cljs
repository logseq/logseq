(ns frontend.state.tabs
  "State management for tabs feature"
  (:require [clojure.string :as string]
            [frontend.state :as state]
            [frontend.util :as util]
            [rum.core :as rum]))

(defn generate-tab-id []
  (str (random-uuid)))

(defn get-tabs []
  (or (get-in @state/state [:tabs/tabs-list]) []))

(defn get-active-tab-id []
  (get-in @state/state [:tabs/active-tab-id]))

(defn sub-tabs []
  "Reactive subscription to tabs list"
  (or (util/react (rum/cursor-in state/state [:tabs/tabs-list])) []))

(defn sub-active-tab-id []
  "Reactive subscription to active tab id"
  (util/react (rum/cursor-in state/state [:tabs/active-tab-id])))

(defn set-active-tab-id! [tab-id]
  (swap! state/state assoc-in [:tabs/active-tab-id] tab-id))

(defn add-tab!
  "Add a new tab. Returns the tab-id."
  [{:keys [page-id page-name page-uuid title]}]
  (let [tab-id (generate-tab-id)
        new-tab {:id tab-id
                 :page-id page-id
                 :page-name page-name
                 :page-uuid page-uuid
                 :title (or title page-name (str page-uuid))
                 :created-at (js/Date.now)}
        current-tabs (get-tabs)]
    (swap! state/state assoc-in [:tabs/tabs-list] (conj current-tabs new-tab))
    (set-active-tab-id! tab-id)
    tab-id))

(defn remove-tab!
  "Remove a tab by id. If it's the active tab, switch to another."
  [tab-id]
  (let [tabs (get-tabs)
        active-id (get-active-tab-id)
        remaining-tabs (filterv #(not= (:id %) tab-id) tabs)]
    (swap! state/state assoc-in [:tabs/tabs-list] remaining-tabs)
    (when (= active-id tab-id)
      (if (seq remaining-tabs)
        (set-active-tab-id! (:id (last remaining-tabs)))
        (set-active-tab-id! nil)))))

(defn get-tab-by-id [tab-id]
  (first (filter #(= (:id %) tab-id) (get-tabs))))

(defn update-tab!
  "Update tab properties"
  [tab-id updates]
  (let [tabs (get-tabs)
        updated-tabs (mapv (fn [tab]
                             (if (= (:id tab) tab-id)
                               (merge tab updates)
                               tab))
                           tabs)]
    (swap! state/state assoc-in [:tabs/tabs-list] updated-tabs)))

(defn find-tab-by-page
  "Find a tab by page-uuid or page-name"
  [page-uuid-or-name]
  (first (filter (fn [tab]
                   (or (= (:page-uuid tab) page-uuid-or-name)
                       (= (:page-name tab) page-uuid-or-name)))
                 (get-tabs))))

(defn init-tabs!
  "Initialize tabs feature with a default tab"
  []
  (when (empty? (get-tabs))
    (let [tab-id (generate-tab-id)
          initial-tab {:id tab-id
                       :page-id nil
                       :page-name "all-journals"
                       :page-uuid nil
                       :title "Journals"
                       :created-at (js/Date.now)}]
      (swap! state/state assoc-in [:tabs/tabs-list] [initial-tab])
      (swap! state/state assoc-in [:tabs/active-tab-id] tab-id))))

(defn update-active-tab!
  "Update the active tab with new page information"
  [{:keys [page-id page-name page-uuid title]}]
  (when-let [active-id (get-active-tab-id)]
    (update-tab! active-id {:page-id page-id
                            :page-name page-name
                            :page-uuid page-uuid
                            :title (or title page-name (str page-uuid))})))
