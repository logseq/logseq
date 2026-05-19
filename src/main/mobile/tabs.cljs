(ns mobile.tabs
  "Mobile bottom tab definitions and selection rules.")

(def ^:private tab-definitions
  [{:id "home"
    :title-key :nav/home
    :systemImage "house"
    :role "normal"}
   {:id "graphs"
    :title-key :mobile.tab/graphs
    :systemImage "app.background.dotted"
    :role "normal"}
   {:id "capture"
    :title-key :mobile.tab/capture
    :systemImage "tray"
    :role "normal"}
   {:id "flashcards"
    :title-key :nav/flashcards
    :systemImage "infinity"
    :role "normal"}
   {:id "go to"
    :title-key :mobile.tab/go-to
    :systemImage "square.stack.3d.down.right"
    :role "normal"}])

(def default-tab-ids
  (mapv :id tab-definitions))

(def required-tab-id "home")

(defn max-main-tabs
  [native-iphone?]
  (if native-iphone? 4 5))

(defn available-tabs
  [{:keys [flashcards?]}]
  (cond->> tab-definitions
    (not flashcards?) (remove #(= "flashcards" (:id %)))
    true vec))

(defn selected-tab-ids
  [custom-tab-ids features max-tabs]
  (let [available-ids (set (map :id (available-tabs features)))
        requested-ids (if (seq custom-tab-ids) custom-tab-ids default-tab-ids)
        valid-ids (->> requested-ids
                       distinct
                       (filter available-ids))
        required-ids (cons required-tab-id
                           (remove #(= required-tab-id %) valid-ids))]
    (->> required-ids
         (take max-tabs)
         vec)))

(defn reorder-tab-ids
  [tab-ids dragged-id target-id features max-tabs]
  (let [selected-ids (selected-tab-ids tab-ids features max-tabs)
        selected-id-set (set selected-ids)
        dragged-index (.indexOf selected-ids dragged-id)
        target-index (.indexOf selected-ids target-id)]
    (if (or (= dragged-id required-tab-id)
            (= target-id required-tab-id)
            (= dragged-id target-id)
            (not (contains? selected-id-set dragged-id))
            (not (contains? selected-id-set target-id)))
      selected-ids
      (let [without-dragged (filterv #(not= dragged-id %) selected-ids)]
        (->> without-dragged
             (mapcat
              (fn [id]
                (if (= id target-id)
                  (if (> target-index dragged-index)
                    [id dragged-id]
                    [dragged-id id])
                  [id])))
             vec)))))

(defn tab-configs
  [custom-tab-ids features max-tabs]
  (let [tabs-by-id (zipmap (map :id tab-definitions) tab-definitions)]
    (->> (selected-tab-ids custom-tab-ids features max-tabs)
         (keep tabs-by-id)
         vec)))
