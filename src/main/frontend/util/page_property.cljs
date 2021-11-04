(ns frontend.util.page-property
  (:require [clojure.string :as string]
            [frontend.db :as db]
            [frontend.handler.ui :as ui-handler]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.file :as outliner-file]
            [frontend.format.mldoc :as mldoc]
            [frontend.state :as state]
            [frontend.util.property :as property]
            [frontend.util :as util]))

(defn- reorder-properties
  [format content]
  (when (string? content)
    (let [ast (mldoc/->edn content (mldoc/default-config format))
          key-exist? (fn [k] (k (last (ffirst ast))))
          build-property-fn (fn [k]
                              (when-let [v (key-exist? k)]
                                (util/format (case format
                                               :org "#+%s: %s"
                                               "%s:: %s")
                                             (name k)
                                             (if (coll? v)
                                               (string/join ", " v)
                                               v))))
          before (remove nil? (map #(build-property-fn %) [:title :alias :aliases]))
          other (reduce (fn [content elem]
                          (string/replace
                           content
                           (re-pattern (case format
                                         :org (str "#\\+" (subs elem 2) "\n*")
                                         (str elem "\n*")))
                           ""))
                        content before)]
      (string/join "\n" (remove #(= "" %)
                                (concat before [other]))))))

(defn insert-property
  [format content key value]
  (when (string? content)
    (let [ast (mldoc/->edn content (mldoc/default-config format))
          key-exists? (fn [k] (boolean (k (last (ffirst ast)))))
          key (if (string? key) (keyword key) key)
          old-value (key (last (ffirst ast)))
          new-value (case key
                      :title value
                      (-> (if (coll? old-value)
                            (concat old-value [value])
                            (conj [old-value] value))
                          (distinct)))
          build-property-fn (fn [value]
                              (util/format (case format
                                             :org "#+%s: %s"
                                             "%s:: %s")
                                           (name key)
                                           (if (coll? value)
                                             (->> (remove nil? value)
                                                  (string/join ", "))
                                             value)))
          old-property-str (when old-value (build-property-fn old-value))
          new-property-str (build-property-fn new-value)]
      (reorder-properties
       format
       (if (key-exists? key)
         (string/replace content old-property-str new-property-str)
         (string/join "\n" (remove #(= "" %)
                            [new-property-str content])))))))

(defn insert-properties
  [format content kvs]
  (let [new-content (reduce
                     (fn [content [k v]]
                       (let [k (if (string? k)
                                 (keyword (-> (string/lower-case k)
                                              (string/replace " " "-")))
                                 k)
                             v (if (coll? v)
                                 (some->>
                                  (seq v)
                                  (distinct)
                                  (string/join ", "))
                                 v)]
                         (insert-property format content k v)))
                     content kvs)]
    (reorder-properties format new-content)))

(defn add-property!
  [page-name key value]
  (when-let [page (db/pull [:block/name (string/lower-case page-name)])]
    (let [repo (state/get-current-repo)
          key (keyword key)
          pre-block (db/get-pre-block repo (:db/id page))
          format (state/get-preferred-format)
          page-id {:db/id (:db/id page)}
          org? (= format :org)
          value (if (contains? #{:filters} key) (pr-str value) value)]
      (if pre-block
        (let [properties (:block/properties pre-block)
              new-properties (assoc properties key value)
              content (:block/content pre-block)
              front-matter? (property/front-matter? content)
              new-content (insert-property format content key value)
              block {:db/id (:db/id pre-block)
                     :block/properties new-properties
                     :block/content new-content
                     :block/page page-id}
              tx [(assoc page-id :block/properties new-properties)
                  block]]
          ;; (util/pprint tx)
          (db/transact! tx)
          (db/refresh! repo {:key :block/change
                             :data [block]}))
        (let [block {:block/uuid (db/new-block-id)
                     :block/left page-id
                     :block/parent page-id
                     :block/page page-id
                     :block/title []
                     :block/content (if org?
                                      (str "#+" (string/upper-case (name key)) ": " value)
                                      (str (name key) ":: " value))
                     :block/format format
                     :block/properties {key value}
                     :block/pre-block? true}]
          (outliner-core/insert-node (outliner-core/block block)
                                     (outliner-core/block page)
                                     false)
          (db/transact! [(assoc page-id :block/properties {key value})])
          (db/refresh! repo {:key :block/change
                             :data [block]})
          (ui-handler/re-render-root!)))
      (outliner-file/sync-to-file page-id))))

