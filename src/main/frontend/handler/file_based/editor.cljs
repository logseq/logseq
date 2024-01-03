(ns frontend.handler.file-based.editor
  "File-based graph implementation"
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.commands :as commands]
            [frontend.format.block :as block]
            [frontend.db :as db]
            [frontend.format.mldoc :as mldoc]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.state :as state]
            [frontend.modules.outliner.transaction :as outliner-tx]
            [frontend.util :as util]
            [frontend.util.clock :as clock]
            [frontend.util.drawer :as drawer]
            [frontend.util.marker :as marker]
            [frontend.handler.property.file :as property-file]
            [frontend.handler.file-based.property :as file-property-handler]
            [frontend.handler.file-based.property.util :as property-util]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.util.block-ref :as block-ref]))

(defn- remove-non-existed-refs!
  [refs]
  (remove (fn [x] (or
                   (and (vector? x)
                        (= :block/uuid (first x))
                        (nil? (db/entity x)))
                   (nil? x))) refs))

(defn- with-marker-time
  [content block format new-marker old-marker]
  (if (and (state/enable-timetracking?) new-marker)
    (try
      (let [logbook-exists? (and (:block/body block) (drawer/get-logbook (:block/body block)))
            new-marker (string/trim (string/lower-case (name new-marker)))
            old-marker (when old-marker (string/trim (string/lower-case (name old-marker))))
            new-content (cond
                          (or (and (nil? old-marker) (or (= new-marker "doing")
                                                         (= new-marker "now")))
                              (and (= old-marker "todo") (= new-marker "doing"))
                              (and (= old-marker "later") (= new-marker "now"))
                              (and (= old-marker new-marker "now") (not logbook-exists?))
                              (and (= old-marker new-marker "doing") (not logbook-exists?)))
                          (clock/clock-in format content)

                          (or
                           (and (= old-marker "doing") (= new-marker "todo"))
                           (and (= old-marker "now") (= new-marker "later"))
                           (and (contains? #{"now" "doing"} old-marker)
                                (= new-marker "done")))
                          (clock/clock-out format content)

                          :else
                          content)]
        new-content)
      (catch :default _e
        content))
    content))

(defn- with-timetracking
  [block value]
  (if (and (state/enable-timetracking?)
           (not= (:block/content block) value))
    (let [format (:block/format block)
          new-marker (last (util/safe-re-find (marker/marker-pattern format) (or value "")))
          new-value (with-marker-time value block format
                      new-marker
                      (:block/marker block))]
      new-value)
    value))

(defn wrap-parse-block
  [{:block/keys [content format left page uuid level pre-block?] :as block
    :or {format :markdown}}]
  (let [repo (state/get-current-repo)
        block (or (and (:db/id block) (db/pull (:db/id block))) block)
        block (merge block
                     (block/parse-title-and-body uuid format pre-block? (:block/content block)))
        properties (:block/properties block)
        properties (if (and (= format :markdown)
                            (number? (:heading properties)))
                     (dissoc properties :heading)
                     properties)
        real-content (:block/content block)
        content (if (and (seq properties) real-content (not= real-content content))
                  (property-file/with-built-in-properties-when-file-based repo properties content format)
                  content)
        content (drawer/with-logbook block content)
        content (with-timetracking block content)
        first-block? (= left page)
        ast (mldoc/->edn (string/trim content) format)
        first-elem-type (first (ffirst ast))
        first-elem-meta (second (ffirst ast))
        properties? (contains? #{"Property_Drawer" "Properties"} first-elem-type)
        markdown-heading? (and (= format :markdown)
                               (= "Heading" first-elem-type)
                               (nil? (:size first-elem-meta)))
        block-with-title? (mldoc/block-with-title? first-elem-type)
        content (string/triml content)
        content (string/replace content (block-ref/->block-ref uuid) "")
        [content content'] (cond
                             (and first-block? properties?)
                             [content content]

                             markdown-heading?
                             [content content]

                             :else
                             (let [content' (str (config/get-block-pattern format) (if block-with-title? " " "\n") content)]
                               [content content']))
        block (assoc block
                     :block/content content'
                     :block/format format)
        block (apply dissoc block (remove #{:block/pre-block?} db-schema/retract-attributes))
        block (block/parse-block block)
        block (if (and first-block? (:block/pre-block? block))
                block
                (dissoc block :block/pre-block?))
        block (update block :block/refs remove-non-existed-refs!)
        block (if (and left (not= (:block/left block) left)) (assoc block :block/left left) block)
        new-properties (merge
                        (select-keys properties (file-property-handler/hidden-properties))
                        (:block/properties block))]
    (-> block
        (dissoc :block.temp/top?
                :block.temp/bottom?)
        (assoc :block/content content
               :block/properties new-properties)
        (merge (if level {:block/level level} {})))))

(defn properties-block
  [repo properties format page]
  (let [content (property-file/insert-properties-when-file-based repo format "" properties)
        refs (gp-block/get-page-refs-from-properties properties
                                                     (db/get-db (state/get-current-repo))
                                                     (state/get-date-formatter)
                                                     (state/get-config))]
    {:block/pre-block? true
     :block/uuid (db/new-block-id)
     :block/properties properties
     :block/properties-order (keys properties)
     :block/refs refs
     :block/left page
     :block/format format
     :block/content content
     :block/parent page
     :block/page page}))

(defn- set-block-property-aux!
  [block-or-id key value]
  (when-let [block (cond (string? block-or-id) (db/entity [:block/uuid (uuid block-or-id)])
                         (uuid? block-or-id) (db/entity [:block/uuid block-or-id])
                         :else block-or-id)]
    (let [format (:block/format block)
          content (:block/content block)
          properties (:block/properties block)
          properties (if (nil? value)
                       (dissoc properties key)
                       (assoc properties key value))
          content (if (nil? value)
                    (property-util/remove-property format key content)
                    (property-util/insert-property format content key value))
          content (property-util/remove-empty-properties content)]
      {:block/uuid (:block/uuid block)
       :block/properties properties
       :block/properties-order (or (keys properties) [])
       :block/content content})))

(defn- set-heading-aux!
  [block-id heading]
  (let [block (db/pull [:block/uuid block-id])
        format (:block/format block)
        old-heading (get-in block [:block/properties :heading])]
    (if (= format :markdown)
      (cond
        ;; nothing changed
        (or (and (nil? old-heading) (nil? heading))
            (and (true? old-heading) (true? heading))
            (= old-heading heading))
        nil

        (or (and (nil? old-heading) (true? heading))
            (and (true? old-heading) (nil? heading)))
        (set-block-property-aux! block :heading heading)

        (and (or (nil? heading) (true? heading))
             (number? old-heading))
        (let [block' (set-block-property-aux! block :heading heading)
              content (commands/clear-markdown-heading (:block/content block'))]
          (merge block' {:block/content content}))

        (and (or (nil? old-heading) (true? old-heading))
             (number? heading))
        (let [block' (set-block-property-aux! block :heading nil)
              properties (assoc (:block/properties block) :heading heading)
              content (commands/set-markdown-heading (:block/content block') heading)]
          (merge block' {:block/content content :block/properties properties}))

        ;; heading-num1 -> heading-num2
        :else
        (let [properties (assoc (:block/properties block) :heading heading)
              content (-> block
                          :block/content
                          commands/clear-markdown-heading
                          (commands/set-markdown-heading heading))]
          {:block/uuid (:block/uuid block)
           :block/properties properties
           :block/content content}))
      (set-block-property-aux! block :heading heading))))

(defn batch-set-heading! [block-ids heading]
  (outliner-tx/transact!
   {:outliner-op :save-block}
   (doseq [block-id block-ids]
     (when-let [block (set-heading-aux! block-id heading)]
       (outliner-core/save-block! (state/get-current-repo) (db/get-db false)
                                  (state/get-date-formatter)
                                  block)))))

(defn set-blocks-id!
  "Persist block uuid to file if the uuid is valid, and it's not persisted in file.
   Accepts a list of uuids."
  [block-ids]
  (let [block-ids (remove nil? block-ids)
        col (map (fn [block-id]
                   (when-let [block (db/entity [:block/uuid block-id])]
                     (when-not (:block/pre-block? block)
                       [block-id :id (str block-id)])))
                 block-ids)
        col (remove nil? col)]
    (file-property-handler/batch-set-block-property-aux! col)))
