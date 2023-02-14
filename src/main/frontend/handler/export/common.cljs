(ns frontend.handler.export.common
  "common fns for exporting."
  (:require
   [cljs.core.match :refer [match]]
   [clojure.string :as string]
   [datascript.core :as d]
   [frontend.db :as db]
   [frontend.handler.export.macro :refer [binding*]]
   [frontend.modules.file.core :as outliner-file]
   [frontend.modules.outliner.tree :as outliner-tree]
   [frontend.state :as state]
   [frontend.util :as util]
   [logseq.graph-parser.mldoc :as gp-mldoc]
   [logseq.graph-parser.util :as gp-util]))


(def ^:dynamic *state*
  "dynamic var, state used for exporting"
  { ;; current level of Heading, start from 1(same as mldoc), use when `block-ast->simple-ast`
   :current-level 1
   ;; emphasis symbol (use when `block-ast->simple-ast`)
   :outside-em-symbol nil
   ;; (use when `block-ast->simple-ast`)
   :indent-after-break-line? false
   ;; TODO: :last-empty-heading? false
   ;;       current:  |  want:
   ;;       -         |  - xxx
   ;;         xxx     |    yyy
   ;;         yyy     |

   ;; this submap is used when replace block-reference, block-embed, page-embed
   :replace-ref-embed
   { ;; start from 1
    :current-level 1
    :block-ref-replaced? false
    :block&page-embed-replaced? false}
   :export-options
   { ;; dashes, spaces, no-indent
    :indent-style "dashes"
    :remove-page-ref-brackets? false
    :remove-emphasis? false
    :remove-tags? false}})

;;; internal utils
(defn- get-blocks-contents
  [repo root-block-uuid]
  (->
   (db/get-block-and-children repo root-block-uuid)
   (outliner-tree/blocks->vec-tree (str root-block-uuid))
   (outliner-file/tree->file-content {:init-level 1})))

(defn- get-page-content
  [repo page]
  (outliner-file/tree->file-content
   (outliner-tree/blocks->vec-tree
    (db/get-page-blocks-no-cache repo page) page) {:init-level 1}))

(defn root-block-uuids->content
  [repo root-block-uuids]
  (let [contents (mapv #(get-blocks-contents repo %) root-block-uuids)]
    (string/join "\n" (mapv string/trim-newline contents))))


(declare remove-block-ast-pos)

(defn- block-uuid->ast
  [block-uuid]
  (let [block (into {} (db/get-block-by-uuid block-uuid))
        content (outliner-file/tree->file-content [block] {:init-level 1})
        format :markdown]
    (mapv remove-block-ast-pos
          (gp-mldoc/->edn content (gp-mldoc/default-config format)))))

(defn- block-uuid->ast-with-children
  [block-uuid]
  (let [content (get-blocks-contents (state/get-current-repo) block-uuid)
        format :markdown]
    (mapv remove-block-ast-pos
          (gp-mldoc/->edn content (gp-mldoc/default-config format)))))

(defn- page-name->ast
  [page-name]
  (let [content (get-page-content (state/get-current-repo) page-name)
        format :markdown]
    (mapv remove-block-ast-pos
          (gp-mldoc/->edn content (gp-mldoc/default-config format)))))

(defn- update-level-in-block-ast-coll
  [block-ast-coll origin-level]
  (mapv
   (fn [[ast-type ast-content]]
     (if (= ast-type "Heading")
        [ast-type (update ast-content :level #(+ (dec %) origin-level))]
        [ast-type ast-content]))
   block-ast-coll))

(defn- plain-indent-inline-ast
  [level & {:keys [spaces] :or {spaces "  "}}]
  ["Plain" (str (reduce str (repeat (dec level) "\t")) spaces)])

;;; internal utils (ends)

;;; utils

(defn priority->string
  [priority]
  (str "[#" priority "]"))

(defn- repetition-to-string
  [[[kind] [duration] n]]
  (let [kind (case kind
               "Dotted" "."
               "Plus" "+"
               "DoublePlus" "++")]
    (str kind n (string/lower-case (str (first duration))))))

(defn timestamp-to-string
  [{:keys [date time repetition wday active]}]
  (let [{:keys [year month day]} date
        {:keys [hour min]} time
        [open close] (if active ["<" ">"] ["[" "]"])
        repetition (if repetition
                     (str " " (repetition-to-string repetition))
                     "")
        hour (when hour (util/zero-pad hour))
        min  (when min (util/zero-pad min))
        time (cond
               (and hour min)
               (util/format " %s:%s" hour min)
               hour
               (util/format " %s" hour)
               :else
               "")]
    (util/format "%s%s-%s-%s %s%s%s%s"
                 open
                 (str year)
                 (util/zero-pad month)
                 (util/zero-pad day)
                 wday
                 time
                 repetition
                 close)))
(defn hashtag-value->string
  [inline-coll]
  (reduce str
          (mapv
           (fn [inline]
             (let [[ast-type ast-content] inline]
               (case ast-type
                 "Nested_link"
                 (:content ast-content)
                 "Link"
                 (:full_text ast-content)
                 "Plain"
                 ast-content)))
           inline-coll)))

(defn- get-file-contents
  ([repo]
   (get-file-contents repo {:init-level 1}))
  ([repo file-opts]
   (let [db (db/get-db repo)]
     (->> (d/q '[:find ?n ?fp
                 :where
                 [?e :block/file ?f]
                 [?f :file/path ?fp]
                 [?e :block/name ?n]] db)
          (mapv (fn [[page-name file-path]]
                  [file-path
                   (outliner-file/tree->file-content
                    (outliner-tree/blocks->vec-tree
                     (db/get-page-blocks-no-cache page-name) page-name)
                    file-opts)]))))))

(defn- get-md-file-contents
  [repo]
  #_:clj-kondo/ignore
  (filter (fn [[path _]]
            (let [path (string/lower-case path)]
              (re-find #"\.(?:md|markdown)$" path)))
          (get-file-contents repo {:init-level 1
                                   :heading-to-list? true})))

(defn get-file-contents-with-suffix
  [repo]
  (let [db (db/get-db repo)
        md-files (get-md-file-contents repo)]
    (->>
     md-files
     (map (fn [[path content]] {:path path :content content
                                :names (d/q '[:find [?n ?n2]
                                              :in $ ?p
                                              :where [?e :file/path ?p]
                                              [?e2 :block/file ?e]
                                              [?e2 :block/name ?n]
                                              [?e2 :block/original-name ?n2]] db path)
                                :format (gp-util/get-format path)})))))

;;; utils (ends)


;;; replace block-ref, block-embed, page-embed

(defn- replace-block-reference-in-heading
  [{:keys [title] :as ast-content}]
  (let [inline-coll  title
        inline-coll*
        (mapcat
         #(match [%]
                 [["Link" {:url ["Block_ref" block-uuid]}]]
                 (let [[[_ {title-inline-coll :title}]]
                       (block-uuid->ast (uuid block-uuid))]
                   (set! *state* (assoc-in *state* [:replace-ref-embed :block-ref-replaced?] true))
                   title-inline-coll)

                 :else [%])
         inline-coll)]
    (assoc ast-content :title inline-coll*)))

(defn- replace-block-reference-in-paragraph
  [inline-coll]
  (mapcat
   #(match [%]
      [["Link" {:url ["Block_ref" block-uuid]}]]
      (let [[[_ {title-inline-coll :title}]]
            (block-uuid->ast (uuid block-uuid))]
        (set! *state* (assoc-in *state* [:replace-ref-embed :block-ref-replaced?] true))
        title-inline-coll)
      :else [%])
   inline-coll))


(declare replace-block-references)

(defn- replace-block-reference-in-list
  [list-items]
  (mapv
   (fn [{block-ast-coll :content sub-items :items :as item}]
     (assoc item
            :content (mapv replace-block-references block-ast-coll)
            :items (replace-block-reference-in-list sub-items)))
   list-items))

(defn- replace-block-reference-in-quote
  [block-ast-coll]
  (mapv replace-block-references block-ast-coll))

(defn- replace-block-reference-in-table
  [{:keys [header groups] :as table}]
  (let [header*
        (mapcat
         #(match [%]
            [["Link" {:url ["Block_ref" block-uuid]}]]
            (let [[[_ {title-inline-coll :title}]]
                  (block-uuid->ast (uuid block-uuid))]
              (set! *state* (assoc-in *state* [:replace-ref-embed :block-ref-replaced?] true))
              title-inline-coll)
            :else [%])
         header)
        groups*
        (mapv
         (fn [group]
           (mapv
            (fn [row]
              (mapv
               (fn [col]
                 (mapcat
                  #(match [%]
                     [["Link" {:url ["Block_ref" block-uuid]}]]
                     (let [[[_ {title-inline-coll :title}]]
                           (block-uuid->ast (uuid block-uuid))]
                       (set! *state* (assoc-in *state* [:replace-ref-embed :block-ref-replaced?] true))
                       title-inline-coll)
                     :else [%])
                  col))
               row))
            group))
         groups)]
    (assoc table :header header* :groups groups*)))

(defn- replace-block-references
  [block-ast]
  (let [[ast-type ast-content] block-ast]
    (case ast-type
      "Heading"
      [ast-type (replace-block-reference-in-heading ast-content)]

      "Paragraph"
      [ast-type (replace-block-reference-in-paragraph ast-content)]

      "List"
      [ast-type (replace-block-reference-in-list ast-content)]

      "Quote"
      [ast-type (replace-block-reference-in-quote ast-content)]

      "Table"
      [ast-type (replace-block-reference-in-table ast-content)]
      ;; else
      block-ast)))

(defn- replace-block-references-until-stable
  [block-ast]
  (binding* [*state* *state*]
    (loop [block-ast block-ast]
      (let [block-ast* (replace-block-references block-ast)]
        (if (get-in *state* [:replace-ref-embed :block-ref-replaced?])
          (do (set! *state* (assoc-in *state* [:replace-ref-embed :block-ref-replaced?] false))
              (recur block-ast*))
          block-ast*)))))

(defn- replace-block-embeds-helper
  [current-paragraph-inlines block-uuid blocks-tcoll level]
  (let [block-uuid* (subs block-uuid 2 (- (count block-uuid) 2))
        ast-coll (update-level-in-block-ast-coll
                  (block-uuid->ast-with-children (uuid block-uuid*))
                  level)]
    (cond-> blocks-tcoll
      (seq current-paragraph-inlines)
      (conj! ["Paragraph" current-paragraph-inlines])
      true
      (#(reduce conj! % ast-coll)))))

(defn- replace-page-embeds-helper
  [current-paragraph-inlines page-name blocks-tcoll level]
  (let [page-name* (subs page-name 2 (- (count page-name) 2))
        ast-coll (update-level-in-block-ast-coll
                  (page-name->ast page-name*)
                  level)]
    (cond-> blocks-tcoll
      (seq current-paragraph-inlines)
      (conj! ["Paragraph" current-paragraph-inlines])
      true
      (#(reduce conj! % ast-coll)))))

(defn- replace-block&page-embeds-in-heading
  [{inline-coll :title origin-level :level :as ast-content}]
  (set! *state* (assoc-in *state* [:replace-ref-embed :current-level] origin-level))
  (if (empty? inline-coll)
    ;; it's just a empty Heading, return itself
    [["Heading" ast-content]]
    (loop [[inline & other-inlines] inline-coll
           heading-exist? false
           current-paragraph-inlines []
           r (transient [])]
      (if-not inline
        (persistent!
         (if (seq current-paragraph-inlines)
           (conj! r (if heading-exist?
                      ["Paragraph" current-paragraph-inlines]
                      ["Heading" (assoc ast-content :title current-paragraph-inlines)]))
           r))
        (match [inline]
          [["Macro" {:name "embed" :arguments [block-uuid-or-page-name]}]]
          (cond
            (and (string/starts-with? block-uuid-or-page-name "((")
                 (string/ends-with? block-uuid-or-page-name "))"))
            (do (set! *state* (assoc-in *state* [:replace-ref-embed :block&page-embed-replaced?] true))
                (recur other-inlines true []
                       (replace-block-embeds-helper
                        current-paragraph-inlines block-uuid-or-page-name r origin-level)))
            (and (string/starts-with? block-uuid-or-page-name "[[")
                 (string/ends-with? block-uuid-or-page-name "]]"))
            (do (set! *state* (assoc-in *state* [:replace-ref-embed :block&page-embed-replaced?] true))
                (recur other-inlines true []
                       (replace-page-embeds-helper
                        current-paragraph-inlines block-uuid-or-page-name r origin-level)))
            :else ;; not ((block-uuid)) or [[page-name]], just drop the original ast
            (recur other-inlines heading-exist? current-paragraph-inlines r))

          :else
          (let [current-paragraph-inlines*
                (if (and (empty? current-paragraph-inlines)
                         heading-exist?)
                  (conj current-paragraph-inlines (plain-indent-inline-ast origin-level))
                  current-paragraph-inlines)]
            (recur other-inlines heading-exist? (conj current-paragraph-inlines* inline) r)))))))

(defn- replace-block&page-embeds-in-paragraph
  [inline-coll]
  (let [current-level (get-in *state* [:replace-ref-embed :current-level])]
    (loop [[inline & other-inlines] inline-coll
           current-paragraph-inlines []
           just-after-embed? false
           blocks (transient [])]
      (if-not inline
        (persistent!
         (if (seq current-paragraph-inlines)
           (conj! blocks ["Paragraph" current-paragraph-inlines])
           blocks))
        (match [inline]
          [["Macro" {:name "embed" :arguments [block-uuid-or-page-name]}]]
          (cond
            (and (string/starts-with? block-uuid-or-page-name "((")
                 (string/ends-with? block-uuid-or-page-name "))"))
            (do (set! *state* (assoc-in *state* [:replace-ref-embed :block&page-embed-replaced?] true))
                (recur other-inlines [] true
                       (replace-block-embeds-helper
                        current-paragraph-inlines block-uuid-or-page-name blocks current-level)))
            (and (string/starts-with? block-uuid-or-page-name "[[")
                 (string/ends-with? block-uuid-or-page-name "]]"))
            (do (set! *state* (assoc-in *state* [:replace-ref-embed :block&page-embed-replaced?] true))
                (recur other-inlines [] true
                       (replace-page-embeds-helper
                        current-paragraph-inlines block-uuid-or-page-name blocks current-level)))
            :else ;; not ((block-uuid)) or [[page-name]], just drop the original ast
            (recur other-inlines current-paragraph-inlines false blocks))

          :else
          (let [current-paragraph-inlines*
                (if just-after-embed?
                  (conj current-paragraph-inlines (plain-indent-inline-ast current-level))
                  current-paragraph-inlines)]
            (recur other-inlines (conj current-paragraph-inlines* inline) false blocks)))))))

(declare replace-block&page-embeds)

(defn- replace-block&page-embeds-in-list-helper
  [list-items]
  (binding* [*state* (update-in *state* [:replace-ref-embed :current-level] inc)]
            (mapv
             (fn [{block-ast-coll :content sub-items :items :as item}]
               (assoc item
                      :content (doall (mapcat replace-block&page-embeds block-ast-coll))
                      :items (replace-block&page-embeds-in-list-helper sub-items)))
             list-items)))

(defn- replace-block&page-embeds-in-list
  [list-items]
  [["List" (replace-block&page-embeds-in-list-helper list-items)]])

(defn- replace-block&page-embeds-in-quote
  [block-ast-coll]
  (->> block-ast-coll
       (mapcat replace-block&page-embeds)
       doall
       (vector "Quote")
       vector))

(defn- replace-block&page-embeds
  [block-ast]
  (let [[ast-type ast-content] block-ast]
    (case ast-type
      "Heading"
      (replace-block&page-embeds-in-heading ast-content)
      "Paragraph"
      (replace-block&page-embeds-in-paragraph ast-content)
      "List"
      (replace-block&page-embeds-in-list ast-content)
      "Quote"
      (replace-block&page-embeds-in-quote ast-content)
      "Table"
      ;; TODO: block&page embeds in table are not replaced yet
      [block-ast]
      ;; else
      [block-ast])))

(defn replace-block&page-reference&embed
  "add meta :embed-depth to the embed replaced block-ast,
  to avoid too deep block-ref&embed (or maybe it's a cycle)"
  [block-ast-coll]
  (loop [block-ast-coll block-ast-coll
         result-block-ast-tcoll (transient [])
         block-ast-coll-to-replace-references []
         block-ast-coll-to-replace-embeds []]
    (cond
      (seq block-ast-coll-to-replace-references)
      (let [[block-ast-to-replace-ref & other-block-asts-to-replace-ref]
            block-ast-coll-to-replace-references
            embed-depth (:embed-depth (meta block-ast-to-replace-ref) 0)
            block-ast-replaced (-> (replace-block-references-until-stable block-ast-to-replace-ref)
                                   (with-meta {:embed-depth embed-depth}))]
        (if (>= embed-depth 5)
          ;; if :embed-depth >= 5, dont replace embed for this block anymore
          ;; there is too deep, or maybe it just a ref/embed cycle
          (recur block-ast-coll (conj! result-block-ast-tcoll block-ast-replaced)
                 (vec other-block-asts-to-replace-ref) block-ast-coll-to-replace-embeds)
          (recur block-ast-coll result-block-ast-tcoll (vec other-block-asts-to-replace-ref)
                 (conj block-ast-coll-to-replace-embeds block-ast-replaced))))

      (seq block-ast-coll-to-replace-embeds)
      (let [[block-ast-to-replace-embed & other-block-asts-to-replace-embed]
            block-ast-coll-to-replace-embeds
            embed-depth (:embed-depth (meta block-ast-to-replace-embed) 0)
            block-ast-coll-replaced (->> (replace-block&page-embeds block-ast-to-replace-embed)
                                         (mapv #(with-meta % {:embed-depth (inc embed-depth)})))]
        (if (get-in *state* [:replace-ref-embed :block&page-embed-replaced?])
          (do (set! *state* (assoc-in *state* [:replace-ref-embed :block&page-embed-replaced?] false))
              (recur block-ast-coll result-block-ast-tcoll
                     (reduce conj block-ast-coll-to-replace-references block-ast-coll-replaced)
                     (vec other-block-asts-to-replace-embed)))
          (recur block-ast-coll (reduce conj! result-block-ast-tcoll block-ast-coll-replaced)
                 (vec block-ast-coll-to-replace-references) (vec other-block-asts-to-replace-embed))))

      :else
      (let [[block-ast & other-block-ast] block-ast-coll]
        (if-not block-ast
          (persistent! result-block-ast-tcoll)
          (recur other-block-ast result-block-ast-tcoll
                 (conj block-ast-coll-to-replace-references block-ast)
                 (vec block-ast-coll-to-replace-embeds)))))))

;;; replace block-ref, block-embed, page-embed (ends)

(def remove-block-ast-pos
  "[[ast-type ast-content] _pos] -> [ast-type ast-content]"
  first)

(defn replace-Heading-with-Paragraph
  "works on block-ast
  replace all heading with paragraph when indent-style is no-indent"
  [heading-ast]
  (let [[heading-type {:keys [title marker priority size]}] heading-ast]
    (if (= heading-type "Heading")
      (let [inline-coll
            (cond->> title
              priority (cons ["Plain" (str (priority->string priority) " ")])
              marker (cons ["Plain" (str marker " ")])
              size (cons ["Plain" (str (reduce str (repeat size "#")) " ")])
              true vec)]
        ["Paragraph" inline-coll])
      heading-ast)))


;;; inline transformers

(defn remove-emphasis
  ":mapcat-fns-on-inline-ast"
  [inline-ast]
  (let [[ast-type ast-content] inline-ast]
    (case ast-type
      "Emphasis"
      (let [[_ inline-coll] ast-content]
        inline-coll)
      ;; else
      [inline-ast])))

(defn remove-page-ref-brackets
  ":map-fns-on-inline-ast"
  [inline-ast]
  (let [[ast-type ast-content] inline-ast]
    (case ast-type
      "Link"
      (let [{:keys [url label]} ast-content]
        (if (and (= "Page_ref" (first url))
                 (or (empty? label)
                     (= label [["Plain" ""]])))
          ["Plain" (second url)]
          inline-ast))
      ;; else
      inline-ast)))

(defn remove-tags
  ":mapcat-fns-on-inline-ast"
  [inline-ast]
  (let [[ast-type _ast-content] inline-ast]
    (case ast-type
      "Tag"
      []
      ;; else
      [inline-ast])))

;;; inline transformers (ends)

;;; walk on block-ast, apply inline transformers

(defn- walk-block-ast-helper
  [inline-coll map-fns-on-inline-ast mapcat-fns-on-inline-ast]
  (->>
   inline-coll
   (map #(reduce (fn [inline-ast f] (f inline-ast)) % map-fns-on-inline-ast))
   (mapcat #(reduce (fn [inline-ast-coll f] (mapcat f inline-ast-coll)) [%] mapcat-fns-on-inline-ast))))

(declare walk-block-ast)

(defn- walk-block-ast-for-list
  [list-items map-fns-on-inline-ast mapcat-fns-on-inline-ast]
  (mapv
   (fn [{block-ast-coll :content sub-items :items :as item}]
     (assoc item
            :content
            (mapv
             (partial walk-block-ast
                      {:map-fns-on-inline-ast map-fns-on-inline-ast
                       :mapcat-fns-on-inline-ast mapcat-fns-on-inline-ast})
             block-ast-coll)
            :items
            (walk-block-ast-for-list sub-items map-fns-on-inline-ast mapcat-fns-on-inline-ast)))
   list-items))

(defn walk-block-ast
  [{:keys [map-fns-on-inline-ast mapcat-fns-on-inline-ast] :as fns}
   block-ast]
  (let [[ast-type ast-content] block-ast]
    (case ast-type
      "Paragraph"
      ["Paragraph" (walk-block-ast-helper ast-content map-fns-on-inline-ast mapcat-fns-on-inline-ast)]
      "Heading"
      (let [{:keys [title]} ast-content]
        ["Heading"
         (assoc ast-content
                :title
                (walk-block-ast-helper title map-fns-on-inline-ast mapcat-fns-on-inline-ast))])
      "List"
      ["List" (walk-block-ast-for-list ast-content map-fns-on-inline-ast mapcat-fns-on-inline-ast)]
      "Quote"
      ["Quote" (mapv (partial walk-block-ast fns) ast-content)]
      "Footnote_Definition"
      (let [[name contents] (rest block-ast)]
        ["Footnote_Definition"
         name (walk-block-ast-helper contents map-fns-on-inline-ast mapcat-fns-on-inline-ast)])
      "Table"
       ;; TODO
      block-ast
       ;; else
      block-ast)))

;;; walk on block-ast, apply inline transformers (ends)
