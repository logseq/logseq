(ns frontend.handler.db-based.editor
  "DB-based graph implementation"
  (:require [clojure.string :as string]
            [frontend.commands :as commands]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.format.block :as block]
            [frontend.format.mldoc :as mldoc]
            [frontend.handler.common.config-edn :as config-edn-common-handler]
            [frontend.handler.property :as property-handler]
            [frontend.handler.property.util :as pu]
            [frontend.handler.repo-config :as repo-config-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.schema.handler.repo-config :as repo-config-schema]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.db.frontend.content :as db-content]
            [logseq.outliner.op]
            [promesa.core :as p]))

(defn- remove-non-existed-refs!
  [refs]
  (remove (fn [x] (or
                   (and (vector? x)
                        (= :block/uuid (first x))
                        (nil? (db/entity x)))
                   (and (map? x)
                        (util/uuid-string? (:block/title x))
                        (:block/uuid x)
                        (nil? (db/entity [:block/uuid (:block/uuid x)])))
                   (nil? x))) refs))

(defn- use-cached-refs!
  [refs block]
  (let [refs (remove #(= (:block/uuid block) (:block/uuid %)) refs)
        cached-refs (->> @(:editor/block-refs @state/state)
                         (concat (map (fn [ref]
                                        (select-keys ref [:db/id :block/uuid :block/title]))
                                      (:block/refs (db/entity (:db/id block)))))
                         (util/distinct-by-last-wins :block/uuid))
        title->ref (zipmap (map :block/title cached-refs) cached-refs)]
    (map (fn [x]
           (if-let [ref (and (map? x) (title->ref (:block/title x)))]
             ref
             x))
         refs)))

(defn wrap-parse-block
  [{:block/keys [title level] :as block}]
  (let [block (or (and (:db/id block) (db/entity (:db/id block))) block)
        block (if (nil? title)
                block
                (let [ast (mldoc/->edn (string/trim title) :markdown)
                      first-elem-type (first (ffirst ast))
                      block-with-title? (mldoc/block-with-title? first-elem-type)
                      content' (str (config/get-block-pattern :markdown) (if block-with-title? " " "\n") title)
                      parsed-block (block/parse-block (assoc block :block/title content'))
                      block' (merge block parsed-block {:block/title title})]
                  (update block' :block/refs
                          (fn [refs]
                            (-> refs
                                remove-non-existed-refs!
                                (use-cached-refs! block))))))
        result (-> block
                   (merge (if level {:block/level level} {}))
                   (assoc :block/title
                          (db-content/refs->special-id-ref (:block/title block) (:block/refs block))))]
    result))

(defn save-file!
  "This fn is the db version of file-handler/alter-file"
  [path content]
  (let [file-valid? (if (= path "logseq/config.edn")
                      (do (config-edn-common-handler/detect-deprecations path content {:db-graph? true})
                          (config-edn-common-handler/validate-config-edn path content repo-config-schema/Config-edn))
                      true)]

    (when file-valid?
      (p/do!
       (db/transact! [{:file/path path
                       :file/content content
                       :file/created-at (js/Date.)
                       :file/last-modified-at (js/Date.)}])
      ;; Post save
       (cond (= path "logseq/config.edn")
             (p/let [_ (repo-config-handler/restore-repo-config! (state/get-current-repo) content)]
               (state/pub-event! [:shortcut/refresh]))
             (= path "logseq/custom.css")
             (ui-handler/add-style-if-exists!))))))

(defn- set-heading-aux!
  [block-id heading]
  (let [block (db/pull [:block/uuid block-id])
        old-heading (pu/lookup (:block/properties block) :logseq.property/heading)]
    (cond
      ;; nothing changed for first two cases
      (or (and (nil? old-heading) (nil? heading))
          (and (true? old-heading) (true? heading))
          (= old-heading heading))
      nil

      (or (and (nil? old-heading) (true? heading))
          (and (true? old-heading) (nil? heading)))
      nil

      (and (or (nil? heading) (true? heading))
           (number? old-heading))
      (let [content (commands/clear-markdown-heading (:block/title block))]
        {:block/title content
         :block/uuid (:block/uuid block)})

      (and (or (nil? old-heading) (true? old-heading))
           (number? heading))
      (let [content (commands/set-markdown-heading (:block/title block) heading)]
        {:block/title content
         :block/uuid (:block/uuid block)})

        ;; heading-num1 -> heading-num2
      :else
      (let [content (-> block
                        :block/title
                        commands/clear-markdown-heading
                        (commands/set-markdown-heading heading))]
        {:block/uuid (:block/uuid block)
         :block/title content}))))

(defn batch-set-heading!
  [repo block-ids heading]
  (ui-outliner-tx/transact!
   {:outliner-op :save-block}
   (doseq [block (keep #(set-heading-aux! % heading) block-ids)]
     (outliner-op/save-block! block))
   (property-handler/batch-set-block-property! repo block-ids :logseq.property/heading heading)))
