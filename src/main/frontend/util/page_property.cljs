(ns ^:no-doc frontend.util.page-property
  (:require [clojure.string :as string]
            [frontend.db :as db]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.file :as outliner-file]
            [frontend.modules.outliner.transaction :as outliner-tx]
            [frontend.state :as state]
            [frontend.util :as util]))

(defn insert-property
  [format content key value]
  (when (and (string? content) (not (string/blank? (name key))))
    (let [key (if (string? key) (keyword key) key)
          key-part (util/format (case format
                                  :org "#+%s: "
                                  "%s:: ") (string/lower-case (name key)))
          new-property-line (str key-part value)
          lines (string/split-lines content)
          key-exists? (atom false)
          lines (doall
                 (map (fn [line]
                        (if (and (string/starts-with?
                                  (string/lower-case line)
                                  (string/lower-case key-part))
                                 (not @key-exists?)) ; only replace the first match
                          (do
                            (reset! key-exists? true)
                            new-property-line)
                          line)) lines))
          lines (if (= lines [""]) nil lines)
          lines (if @key-exists? lines (cons new-property-line lines))]
      (string/join "\n" lines))))

(defn insert-properties
  [format content kvs]
  (reduce
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
   content kvs))

(defn add-property!
  "Sanitized page-name, unsanitized key / value"
  [page-name key value]
  (when-let [page (db/pull [:block/name (util/page-name-sanity-lc page-name)])]
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
              new-content (insert-property format content key value)
              block {:db/id (:db/id pre-block)
                     :block/properties new-properties
                     :block/content new-content
                     :block/page page-id}
              tx [(assoc page-id :block/properties new-properties)
                  block]]
          ;; (util/pprint tx)
          (db/transact! tx))
        (let [block {:block/uuid (db/new-block-id)
                     :block/left page-id
                     :block/parent page-id
                     :block/page page-id
                     :block/content (if org?
                                      (str "#+" (string/upper-case (name key)) ": " value)
                                      (str (name key) ":: " value))
                     :block/format format
                     :block/properties {key value}
                     :block/pre-block? true}
              page-properties-tx [(assoc page-id :block/properties {key value})]]
          (outliner-tx/transact!
            {:outliner-op :insert-blocks
             :additional-tx page-properties-tx}
            (outliner-core/insert-blocks! block page {:sibling? false}))))
      (outliner-file/sync-to-file page-id))))
