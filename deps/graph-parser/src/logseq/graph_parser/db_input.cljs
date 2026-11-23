(ns logseq.graph-parser.db-input
  "Parses DB graph editor input with explicit graph and reference context."
  (:require [clojure.string :as string]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.db.frontend.content :as db-content]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.text :as text]))

(defn- remove-empty-refs [refs] (remove nil? refs))

(defn- standalone-display-block
  [block]
  (let [raw-title (:block/title block)
        title (when (string? raw-title) (string/trim raw-title))
        display-markup? (and title
                             (or (re-find #"(?s)^```.*```$" title)
                                 (re-find #"(?s)^\$\$.*\$\$$" title)))
        ast-body (when display-markup?
                   (or (:block.temp/ast-body block)
                       (map first (gp-mldoc/->db-edn title :markdown))))
        [ast-node] ast-body
        [node-type node-data] ast-node]
    (if (= 1 (count ast-body))
      (case node-type
        "Src"
        (let [{:keys [language lines]} node-data]
          (cond-> (assoc block
                         :block/title (string/replace (apply str lines) #"\r?\n$" "")
                         :logseq.property.node/display-type :code)
            (not-empty language)
            (assoc :logseq.property.code/lang language)))

        "Displayed_Math"
        (assoc block
               :block/title (string/trim node-data)
               :logseq.property.node/display-type :math)

        block)
      block)))

(defn math-block-formula
  "The formula of a title written as 1 display math ($$E=mc^2$$), nil for any
  other title. A math block's title is the formula alone; a save of the
  editor's text from before the block became a math block brings the $$ back."
  [title]
  (let [block (standalone-display-block {:block/title title})]
    (when (= :math (:logseq.property.node/display-type block))
      (:block/title block))))

(defn extract-blocks
  "Extracts DB editor blocks from `ast` with explicit parsing context.

  | Option | Meaning |
  | --- | --- |
  | `:user-config` | Graph settings used by property extraction. |
  | `:date-formatter` | Journal title format. |
  | `:page-name` | Page containing the extracted blocks. |

  Other extraction options follow [[logseq.graph-parser.block/extract-blocks]]."
  [ast content format options]
  (map (fn [block]
         (let [block (standalone-display-block block)
               heading (get-in block [:block/properties :heading])
               heading (when (or (true? heading) (and (integer? heading) (<= 1 heading 6))) heading)]
           (cond-> (dissoc block :block/format :block/properties :block/macros :block/properties-order
                           :block/scheduled :block/deadline :block/marker :block/priority
                           :block/properties-text-values :block/invalid-properties)
             heading (assoc :logseq.property/heading heading))))
       (gp-block/extract-blocks ast content format (assoc options :block-pattern common-config/block-pattern
                                                          :db-graph-mode? true))))

(defn parse-block
  "Parses one DB editor block without reading frontend state.

  | Option | Meaning |
  | --- | --- |
  | `:repo` | Graph identifier for mldoc configuration. |
  | `:user-config` | Graph settings passed to extraction. |
  | `:date-formatter` | Journal title format. |
  | `:extract-blocks` | Optional extraction wrapper, used by Desktop error reporting. |"
  [{:block/keys [title format] block-uuid :block/uuid :as block} options]
  (when-not (string/blank? title)
    (let [block (dissoc block :block/pre-block?)
          format (or format :markdown)
          parse-config (gp-mldoc/get-default-config (:repo options) format)
          ;; Disable extraction for display-type blocks as there isn't a reason to have
          ;; it enabled yet and can cause visible bugs when '#' is used
          blocks (if (:logseq.property.node/display-type block)
                   [block]
                   (let [ast (gp-mldoc/->edn title parse-config)]
                     ((or (:extract-blocks options) extract-blocks) ast title format options)))
          new-block (first blocks)
          block (cond-> (merge block new-block)
                  true
                  (dissoc :block/format))
          block (dissoc block :block.temp/ast-body :block/level)]
      (if block-uuid (assoc block :block/uuid block-uuid) block))))

(defn- use-cached-refs
  [refs block cached-refs]
  (let [refs (remove #(= (:block/uuid block) (:block/uuid %)) refs)
        title->ref (zipmap (map :block/title cached-refs) cached-refs)]
    (map (fn [x]
           (if-let [ref (and (map? x) (title->ref (:block/title x)))]
             (assoc ref :block.temp/original-page-name
                    (:block.temp/original-page-name x))
             x))
         refs)))

(defn- markdown-heading-level
  [content]
  (when-let [heading (some->> content
                              string/triml
                              (re-find #"^(#{1,6})\s+"))]
    (count (second heading))))

(defn- normalize-markdown-heading?
  [block]
  (not (contains? #{:code :math} (:logseq.property.node/display-type block))))

(defn- markdown-hashtag-link-target
  [target]
  (when (and (string? target)
             (string/starts-with? target "#"))
    (let [page-name (-> target (subs 1) text/page-ref-un-brackets!)]
      (when-not (string/blank? page-name)
        page-name))))

(defn- tag-page?
  [page]
  (some #(= :logseq.class/Tag (:db/ident %)) (:block/tags page)))

(defn- ref-dedupe-key
  [ref]
  (cond
    (and (vector? ref) (= :block/uuid (first ref)))
    [:block/uuid (second ref)]

    (map? ref)
    (if-let [block-uuid (:block/uuid ref)]
      [:block/uuid block-uuid]
      ref)

    :else
    ref))

(defn- existing-markdown-hashtag-link-refs
  [ast cached-refs]
  (let [title->ref (zipmap (map :block/title cached-refs) cached-refs)]
    (->> ast
         (tree-seq coll? seq)
         (keep (fn [form]
                 (when (and (vector? form)
                            (= "Link" (first form))
                            (map? (second form)))
                   (let [[url-type target] (:url (second form))]
                     (when (= "Search" url-type)
                       (when-let [page (some-> target markdown-hashtag-link-target title->ref)]
                         (when (tag-page? page)
                           page)))))))
         (map #(select-keys % [:db/id :block/uuid :block/title :block/name :db/ident :block/tags]))
         (common-util/distinct-by-last-wins :block/uuid))))

(defn parse-block-input
  "Parses DB editor input with explicit graph and reference context.

  | Option | Meaning |
  | --- | --- |
  | `:repo` | DB graph identifier for mldoc configuration. |
  | `:user-config` | Graph configuration used for property parsing. |
  | `:date-formatter` | Journal title formatter. |
  | `:cached-refs` | Previously resolved entities or selected editor references. |
  | `:resolve-refs` | Resolver called with references, their AST and parsed tags. |
  | `:parse-block` | Optional block parser wrapper, used by Desktop error reporting. |
  | `:extract-blocks` | Optional extraction wrapper passed through the default block parser. |"
  [{:block/keys [title level] :as block} options]
  (let [block (if (nil? title)
                block
                (let [title (if (= :math (:logseq.property.node/display-type block))
                              (or (math-block-formula title) title)
                              title)
                      heading-level (when (normalize-markdown-heading? block)
                                      (markdown-heading-level title))
                      title (if heading-level
                              (common-util/clear-markdown-heading (string/triml title))
                              title)
                      ast (gp-mldoc/->edn (:repo options) (string/trim title) :markdown)
                      first-elem-type (first (ffirst ast))
                      block-with-title? (gp-mldoc/block-with-title? first-elem-type)
                      content' (str common-config/block-pattern (if block-with-title? " " "\n") title)
                      cached-refs (:cached-refs options)
                      hashtag-link-refs (existing-markdown-hashtag-link-refs ast cached-refs)
                      parsed-block ((or (:parse-block options) parse-block) (assoc block :block/title content') options)
                      new-display-block? (and (nil? (:logseq.property.node/display-type block))
                                              (contains? #{:code :math}
                                                         (:logseq.property.node/display-type parsed-block)))
                      block' (-> (merge block
                                        parsed-block
                                        {:block/title (if new-display-block?
                                                        (:block/title parsed-block)
                                                        title)}
                                        (when heading-level
                                          {:logseq.property/heading heading-level}))
                                 (dissoc :block/format))]
                  (update block' :block/refs
                          (fn [refs]
                            (->> (concat (-> refs
                                             remove-empty-refs
                                             (use-cached-refs block cached-refs))
                                         hashtag-link-refs)
                                 (remove nil?)
                                 (common-util/distinct-by-last-wins ref-dedupe-key)
                                 (#((:resolve-refs options) % ast (:block/tags block'))))))))
        title' (db-content/title-ref->id-ref (or (get block :block/title) title) (:block/refs block))
        result (-> block
                   (merge (if level {:block/level level} {}))
                   (assoc :block/title title'))]
    result))
