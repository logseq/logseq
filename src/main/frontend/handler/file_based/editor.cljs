(ns frontend.handler.file-based.editor
  "File-based graph implementation"
  (:require [clojure.string :as string]
            [frontend.commands :as commands]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.format.block :as block]
            [frontend.format.mldoc :as mldoc]
            [frontend.handler.block :as block-handler]
            [frontend.handler.file-based.property :as file-property-handler]
            [frontend.handler.file-based.property.util :as property-util]
            [frontend.handler.file-based.repeated :as repeated]
            [frontend.handler.file-based.status :as status]
            [frontend.handler.property.file :as property-file]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.file-based.clock :as clock]
            [frontend.util.file-based.drawer :as drawer]
            [logseq.common.util :as common-util]
            [logseq.common.util.block-ref :as block-ref]
            [logseq.db :as ldb]
            [logseq.db.frontend.schema :as db-schema]))

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
      (let [logbook-exists? (and (:block.temp/ast-body block) (drawer/get-logbook (:block.temp/ast-body block)))
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
           (not= (:block/title block) value))
    (let [format (get block :block/format :markdown)
          new-marker (last (util/safe-re-find (status/marker-pattern format) (or value "")))
          new-value (with-marker-time value block format
                      new-marker
                      (:block/marker block))]
      new-value)
    value))

(defn wrap-parse-block
  [{:block/keys [title format uuid level pre-block?] :as block
    :or {format :markdown}}]
  (let [repo (state/get-current-repo)
        block (or (and (:db/id block) (db/pull (:db/id block))) block)
        page (:block/page block)
        block (merge block
                     (block/parse-title-and-body uuid format pre-block? (:block/title block)))
        properties (:block/properties block)
        properties (if (and (= format :markdown)
                            (number? (:heading properties)))
                     (dissoc properties :heading)
                     properties)
        real-content (:block/title block)
        content (if (and (seq properties) real-content (not= real-content title))
                  (property-file/with-built-in-properties-when-file-based repo properties title format)
                  title)
        content (drawer/with-logbook block content)
        content (with-timetracking block content)
        first-block? (= (:block/uuid (ldb/get-first-child (db/get-db) (:db/id page)))
                        (:block/uuid block))
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
                     :block/title content'
                     :block/format format)
        block (apply dissoc block (remove #{:block/pre-block?} db-schema/retract-attributes))
        block (block/parse-block block)
        block (if (and first-block? (:block/pre-block? block))
                block
                (dissoc block :block/pre-block?))
        block (update block :block/refs remove-non-existed-refs!)
        new-properties (merge
                        (select-keys properties (file-property-handler/hidden-properties))
                        (:block/properties block))]
    (-> block
        (dissoc :block.temp/top?
                :block.temp/bottom?)
        (assoc :block/title content
               :block/properties new-properties)
        (merge (if level {:block/level level} {})))))

(defn- set-block-property-aux!
  [block-or-id key value]
  (when-let [block (cond (string? block-or-id) (db/entity [:block/uuid (uuid block-or-id)])
                         (uuid? block-or-id) (db/entity [:block/uuid block-or-id])
                         :else block-or-id)]
    (let [format (get block :block/format :markdown)
          content (:block/title block)
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
       :block/title content})))

(defn- set-heading-aux!
  [block-id heading]
  (let [block (db/pull [:block/uuid block-id])
        format (get block :block/format :markdown)
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
              content (commands/clear-markdown-heading (:block/title block'))]
          (merge block' {:block/title content}))

        (and (or (nil? old-heading) (true? old-heading))
             (number? heading))
        (let [block' (set-block-property-aux! block :heading nil)
              properties (assoc (:block/properties block) :heading heading)
              content (commands/file-based-set-markdown-heading (:block/title block') heading)]
          (merge block' {:block/title content :block/properties properties}))

        ;; heading-num1 -> heading-num2
        :else
        (let [properties (assoc (:block/properties block) :heading heading)
              content (-> block
                          :block/title
                          commands/clear-markdown-heading
                          (commands/file-based-set-markdown-heading heading))]
          {:block/uuid (:block/uuid block)
           :block/properties properties
           :block/title content}))
      (set-block-property-aux! block :heading heading))))

(defn batch-set-heading! [block-ids heading]
  (ui-outliner-tx/transact!
   {:outliner-op :save-block}
   (doseq [block-id block-ids]
     (when-let [block (set-heading-aux! block-id heading)]
       (outliner-op/save-block! block {:retract-attributes? false})))))

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

(defn valid-dsl-query-block?
  "Whether block has a valid dsl query."
  [block]
  (->> (:block/macros (db/entity (:db/id block)))
       (some (fn [macro]
               (let [properties (:block/properties macro)
                     macro-name (:logseq.macro-name properties)
                     macro-arguments (:logseq.macro-arguments properties)]
                 (when-let [query-body (and (= "query" macro-name) (not-empty (string/join " " macro-arguments)))]
                   (seq (:query
                         (try
                           (query-dsl/parse-query query-body)
                           (catch :default _e
                             nil))))))))))

(defn valid-custom-query-block?
  "Whether block has a valid custom query."
  [block]
  (let [entity (db/entity (:db/id block))
        content (:block/title entity)]
    (when content
      (when (and (string/includes? content "#+BEGIN_QUERY")
                 (string/includes? content "#+END_QUERY"))
        (let [ast (mldoc/->edn (string/trim content) (get entity :block/format :markdown))
              q (mldoc/extract-first-query-from-ast ast)]
          (some? (:query (common-util/safe-read-map-string q))))))))

(defn update-timestamps-content!
  [{:block/keys [repeated? marker format] :as block} content]
  (if repeated?
    (let [scheduled-ast (block-handler/get-scheduled-ast block)
          deadline-ast (block-handler/get-deadline-ast block)
          content (some->> (filter repeated/repeated? [scheduled-ast deadline-ast])
                           (map (fn [ts]
                                  [(repeated/timestamp->text ts)
                                   (repeated/next-timestamp-text ts)]))
                           (reduce (fn [content [old new]]
                                     (string/replace content old new))
                                   content))
          content (string/replace-first
                   content marker
                   (case marker
                     "DOING"
                     "TODO"

                     "NOW"
                     "LATER"

                     marker))
          content (clock/clock-out format content)
          content (drawer/insert-drawer
                   format content "logbook"
                   (util/format (str (if (= :org format) "-" "*")
                                     " State \"DONE\" from \"%s\" [%s]")
                                marker
                                (date/get-date-time-string-3)))]
      content)
    content))
