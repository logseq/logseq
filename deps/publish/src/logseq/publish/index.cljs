(ns logseq.publish.index
  (:require [clojure.string :as string]
            [logseq.publish.model :as publish-model]))

(defn page-refs-from-payload [payload page-eid page-uuid page-title graph-uuid]
  (let [entities (publish-model/datoms->entities (:datoms payload))
        refs (->> entities
                  (mapcat (fn [[_e entity]]
                            (when (and (= (:block/page entity) page-eid)
                                       (not= (:block/uuid entity) page-uuid))
                              (let [block-uuid (some-> (:block/uuid entity) str)
                                    block-content (or (:block/content entity)
                                                      (:block/title entity)
                                                      (:block/name entity)
                                                      "")
                                    block-format (name (or (:block/format entity) :markdown))
                                    refs (:block/refs entity)
                                    refs (if (sequential? refs) refs (when refs [refs]))
                                    targets (->> refs
                                                 (map publish-model/ref-eid)
                                                 (keep #(get entities %))
                                                 distinct)]
                                (when (seq targets)
                                  (map (fn [target-entity]
                                         (let [target-uuid (some-> (:block/uuid target-entity) str)
                                               target-title (publish-model/entity->title target-entity)
                                               target-name (or (:block/name target-entity)
                                                               target-title)
                                               target-name (when target-name
                                                             (string/lower-case (str target-name)))]
                                           {:graph_uuid graph-uuid
                                            :target_page_uuid target-uuid
                                            :target_page_title target-title
                                            :target_page_name target-name
                                            :source_page_uuid (str page-uuid)
                                            :source_page_title page-title
                                            :source_block_uuid block-uuid
                                            :source_block_content block-content
                                            :source_block_format block-format
                                            :updated_at (.now js/Date)}))
                                       targets)))))))]
    (vec refs)))

(defn page-tagged-nodes-from-payload [payload page-eid page-uuid page-title graph-uuid]
  (let [entities (publish-model/datoms->entities (:datoms payload))
        normalize-tags (fn [tags]
                         (let [tags (if (sequential? tags) tags (when tags [tags]))]
                           (->> tags
                                (map publish-model/ref-eid)
                                (keep #(get entities %))
                                (keep (fn [entity]
                                        (when-let [uuid (:block/uuid entity)]
                                          {:tag_page_uuid (str uuid)
                                           :tag_title (publish-model/entity->title entity)})))
                                distinct)))
        page-entity (get entities page-eid)
        page-tags (normalize-tags (:block/tags page-entity))
        page-entries (when (seq page-tags)
                       (map (fn [tag]
                              {:graph_uuid graph-uuid
                               :tag_page_uuid (:tag_page_uuid tag)
                               :tag_title (:tag_title tag)
                               :source_page_uuid (str page-uuid)
                               :source_page_title page-title
                               :source_block_uuid (str page-uuid)
                               :source_block_content nil
                               :source_block_format "page"
                               :updated_at (.now js/Date)})
                            page-tags))
        block-entries (mapcat (fn [[_e entity]]
                                (when (and (= (:block/page entity) page-eid)
                                           (not= (:block/uuid entity) page-uuid)
                                           (not (:logseq.property/created-from-property entity)))
                                  (let [block-uuid (some-> (:block/uuid entity) str)
                                        block-content (or (:block/content entity)
                                                          (:block/title entity)
                                                          (:block/name entity)
                                                          "")
                                        block-format (name (or (:block/format entity) :markdown))
                                        tags (normalize-tags (:block/tags entity))]
                                    (when (seq tags)
                                      (map (fn [tag]
                                             {:graph_uuid graph-uuid
                                              :tag_page_uuid (:tag_page_uuid tag)
                                              :tag_title (:tag_title tag)
                                              :source_page_uuid (str page-uuid)
                                              :source_page_title page-title
                                              :source_block_uuid block-uuid
                                              :source_block_content block-content
                                              :source_block_format block-format
                                              :updated_at (.now js/Date)})
                                           tags)))))
                              entities)]
    (vec (distinct (concat page-entries block-entries)))))
