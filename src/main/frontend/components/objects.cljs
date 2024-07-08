(ns frontend.components.objects
  "Tagged objects"
  (:require [frontend.components.views :as views]
            [frontend.db :as db]
            [logseq.db :as ldb]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.async :as db-async]
            [frontend.db.model :as db-model]
            [frontend.handler.editor :as editor-handler]
            [frontend.mixins :as mixins]
            [frontend.state :as state]
            [logseq.outliner.property :as outliner-property]
            [promesa.core :as p]
            [rum.core :as rum]))

(defn- get-all-objects
  [class]
  (->> (db-model/get-class-objects (state/get-current-repo) (:db/id class))
       (map (fn [row] (assoc row :id (:db/id row))))))

(defn- add-new-object!
  [class set-data!]
  (p/let [block (editor-handler/api-insert-new-block! ""
                                                      {:page (:block/uuid class)
                                                       :properties {:block/tags (:db/id class)}
                                                       :edit-block? false})
          _ (set-data! (get-all-objects class))]
    (editor-handler/edit-block! (db/entity [:block/uuid (:block/uuid block)]) 0 :unknown-container)))

(defn- get-views
  [class]
  (let [class (db/entity (:db/id class))]
    (-> (filter (fn [b]
                 (= (:db/ident class) (:logseq.property/view-for b)))
               (:block/_parent class))
       (ldb/sort-by-order))))

(rum/defc objects-inner < rum/static
  [config class properties]
  (let [[loading? set-loading?] (rum/use-state nil)
        [view-entity set-view-entity!] (rum/use-state nil)
        [data set-data!] (rum/use-state [])
        columns (views/build-columns config properties)]

    (rum/use-effect!
     (fn []
       (set-loading? true)
       (p/let [_result (db-async/<get-views (state/get-current-repo) (:db/id class))
               views (get-views class)]
         (when-let [view (first views)]
           (set-view-entity! view))
         (p/let [_result (db-async/<get-tag-objects (state/get-current-repo) (:db/id class))]
           (set-data! (get-all-objects class))
           (set-loading? false))))
     [])

    (when (false? loading?)
      (views/view view-entity {:data data
                               :set-data! set-data!
                               :columns columns
                               :add-new-object! #(add-new-object! class set-data!)
                               :create-view! (fn []
                                               (p/let [result (editor-handler/api-insert-new-block! "" {:page (:block/uuid class)
                                                                                                        :properties {:logseq.property/view-for (:db/ident class)}})]
                                                 (let [view (db/entity [:block/uuid (:block/uuid result)])]
                                                   (set-view-entity! view)
                                                   view)))
                               :show-add-property? true
                               :add-property! (fn []
                                                (state/pub-event! [:editor/new-property {:block class
                                                                                         :page-configure? true
                                                                                         :class-schema? true}]))}))))

(rum/defcs objects < rum/reactive db-mixins/query mixins/container-id
  [state class]
  (when class
    (let [class (db/sub-block (:db/id class))
          config {:container-id (:container-id state)}
          properties (outliner-property/get-class-properties class)]
      [:div.ml-2
       (objects-inner config class properties)])))
