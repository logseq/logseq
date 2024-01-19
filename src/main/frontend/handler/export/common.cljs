(ns frontend.handler.export.common
  "common fns for exporting.
  exclude some fns which produce lazy-seq, which can cause strange behaviors
  when use together with dynamic var."
  (:refer-clojure :exclude [map filter mapcat concat remove])
  (:require [cljs.core.match :refer [match]]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.modules.file.core :as outliner-file]
            [frontend.modules.outliner.tree :as outliner-tree]
            [frontend.state :as state]
            [frontend.util :as util :refer [concatv mapcatv removev]]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.util :as gp-util]
            [malli.core :as m]
            [malli.util :as mu]))

;;; TODO: split frontend.handler.export.text related states
(def ^:dynamic *state*
  "dynamic var, state used for exporting"
  {;; current level of Heading, start from 1(same as mldoc), use when `block-ast->simple-ast`
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
   {;; start from 1
    :current-level 1
    :block-ref-replaced? false
    :block&page-embed-replaced? false}

   ;; submap for :newline-after-block internal state
   :newline-after-block
   {:current-block-is-first-heading-block? true}

   ;; export-options submap
   :export-options
   {;; dashes, spaces, no-indent
    :indent-style "dashes"
    :remove-page-ref-brackets? false
    :remove-emphasis? false
    :remove-tags? false
    :remove-properties? true
    :keep-only-level<=N :all
    :newline-after-block false}})

;;; internal utils
(defn- get-blocks-contents
  [repo root-block-uuid]
  (->
   (db/get-block-and-children repo root-block-uuid)
   (outliner-tree/blocks->vec-tree (str root-block-uuid))
   (outliner-file/tree->file-content {:init-level 1})))

(defn get-page-content
  [page]
  (-> page
      db/get-page
      :block/file
      :file/content))

(defn root-block-uuids->content
  [repo root-block-uuids]
  (let [contents (mapv #(get-blocks-contents repo %) root-block-uuids)]
    (string/join "\n" (mapv string/trim-newline contents))))

(declare remove-block-ast-pos Properties-block-ast?)

(defn- block-uuid->ast
  [block-uuid]
  (let [block (into {} (db/get-block-by-uuid block-uuid))
        content (outliner-file/tree->file-content [block] {:init-level 1})
        format :markdown]
    (when content
      (removev Properties-block-ast?
               (mapv remove-block-ast-pos
                     (gp-mldoc/->edn content (gp-mldoc/default-config format)))))))

(defn- block-uuid->ast-with-children
  [block-uuid]
  (let [content (get-blocks-contents (state/get-current-repo) block-uuid)
        format :markdown]
    (when content
      (removev Properties-block-ast?
               (mapv remove-block-ast-pos
                     (gp-mldoc/->edn content (gp-mldoc/default-config format)))))))

(defn- page-name->ast
  [page-name]
  (let [content (get-page-content page-name)
        format :markdown]
    (when content
      (removev Properties-block-ast?
               (mapv remove-block-ast-pos
                     (gp-mldoc/->edn content (gp-mldoc/default-config format)))))))

(defn- update-level-in-block-ast-coll
  [block-ast-coll origin-level]
  (mapv
   (fn [block-ast]
     (let [[ast-type ast-content] block-ast]
       (if (= ast-type "Heading")
         [ast-type (update ast-content :level #(+ (dec %) origin-level))]
         block-ast)))
   block-ast-coll))

(defn- plain-indent-inline-ast
  [level & {:keys [spaces] :or {spaces "  "}}]
  ["Plain" (str (reduce str (repeat (dec level) "\t")) spaces)])

(defn- mk-paragraph-ast
  [inline-coll meta]
  (with-meta ["Paragraph" inline-coll] meta))

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
  [repo]
  (let [db (db/get-db repo)]
    (->> (d/q '[:find ?fp
                :where
                [?e :block/file ?f]
                [?f :file/path ?fp]] db)
         (mapv (fn [[file-path]]
                 [file-path
                  (db/get-file file-path)])))))

(defn- get-md-file-contents
  [repo]
  (filterv (fn [[path _]]
             (let [path (string/lower-case path)]
               (re-find #"\.(?:md|markdown)$" path)))
           (get-file-contents repo)))

(defn get-file-contents-with-suffix
  [repo]
  (let [db (db/get-db repo)
        md-files (get-md-file-contents repo)]
    (->>
     md-files
     (mapv (fn [[path content]] {:path path :content content
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
        (mapcatv
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
  (mapcatv
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
        (mapv
         (fn [col]
           (mapcatv
            #(match [%]
               [["Link" {:url ["Block_ref" block-uuid]}]]
               (let [[[_ {title-inline-coll :title}]]
                     (block-uuid->ast (uuid block-uuid))]
                 (set! *state* (assoc-in *state* [:replace-ref-embed :block-ref-replaced?] true))
                 title-inline-coll)
               :else [%])
            col))
         header)
        groups*
        (mapv
         (fn [group]
           (mapv
            (fn [row]
              (mapv
               (fn [col]
                 (mapcatv
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
      (mk-paragraph-ast (replace-block-reference-in-paragraph ast-content) (meta block-ast))

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
  (binding [*state* *state*]
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
  [inline-coll meta]
  (let [current-level (get-in *state* [:replace-ref-embed :current-level])]
    (loop [[inline & other-inlines] inline-coll
           current-paragraph-inlines []
           just-after-embed? false
           blocks (transient [])]
      (if-not inline
        (let [[first-block & other-blocks] (persistent!
                                            (if (seq current-paragraph-inlines)
                                              (conj! blocks ["Paragraph" current-paragraph-inlines])
                                              blocks))]
          (if first-block
            (apply vector (with-meta first-block meta) other-blocks)
            []))
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
  (binding [*state* (update-in *state* [:replace-ref-embed :current-level] inc)]
    (mapv
     (fn [{block-ast-coll :content sub-items :items :as item}]
       (assoc item
              :content (mapcatv replace-block&page-embeds block-ast-coll)
              :items (replace-block&page-embeds-in-list-helper sub-items)))
     list-items)))

(defn- replace-block&page-embeds-in-list
  [list-items]
  [["List" (replace-block&page-embeds-in-list-helper list-items)]])

(defn- replace-block&page-embeds-in-quote
  [block-ast-coll]
  (->> block-ast-coll
       (mapcatv replace-block&page-embeds)
       (vector "Quote")
       vector))

(defn- replace-block&page-embeds
  [block-ast]
  (let [[ast-type ast-content] block-ast]
    (case ast-type
      "Heading"
      (replace-block&page-embeds-in-heading ast-content)
      "Paragraph"
      (replace-block&page-embeds-in-paragraph ast-content (meta block-ast))
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
                     (concatv block-ast-coll-to-replace-references block-ast-coll-replaced)
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

(defn Properties-block-ast?
  [[tp _]]
  (= tp "Properties"))


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
        (mk-paragraph-ast inline-coll {:origin-ast heading-ast}))
      heading-ast)))

(defn keep-only-level<=n
  [block-ast-coll n]
  (-> (reduce
       (fn [{:keys [result-ast-tcoll accepted-heading] :as r} ast]
         (let [[heading-type {level :level}] ast
               is-heading?                   (= heading-type "Heading")]
           (cond
             (and (not is-heading?) accepted-heading)
             {:result-ast-tcoll (conj! result-ast-tcoll ast) :accepted-heading accepted-heading}

             (and (not is-heading?) (not accepted-heading))
             r

             (and is-heading? (<= level n))
             {:result-ast-tcoll (conj! result-ast-tcoll ast) :accepted-heading true}

             (and is-heading? (> level n))
             {:result-ast-tcoll result-ast-tcoll :accepted-heading false})))
       {:result-ast-tcoll  (transient []) :accepted-heading false}
       block-ast-coll)
      :result-ast-tcoll
      persistent!))


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

(defn remove-prefix-spaces-in-Plain
  [inline-coll]
  (:r
   (reduce
    (fn [{:keys [r after-break-line?]} ast]
      (let [[ast-type ast-content] ast]
        (case ast-type
          "Plain"
          (let [trimmed-content (string/triml ast-content)]
            (if after-break-line?
              (if (empty? trimmed-content)
                {:r r :after-break-line? false}
                {:r (conj r ["Plain" trimmed-content]) :after-break-line? false})
              {:r (conj r ast) :after-break-line? false}))
          ("Break_Line" "Hard_Break_Line")
          {:r (conj r ast) :after-break-line? true}
        ;; else
          {:r (conj r ast) :after-break-line? false})))
    {:r [] :after-break-line? true}
    inline-coll)))

;;; inline transformers (ends)

;;; walk on block-ast, apply inline transformers

(defn- walk-block-ast-helper
  [inline-coll map-fns-on-inline-ast mapcat-fns-on-inline-ast fns-on-inline-coll]
  (->>
   (reduce (fn [inline-coll f] (f inline-coll)) inline-coll fns-on-inline-coll)
   (mapv #(reduce (fn [inline-ast f] (f inline-ast)) % map-fns-on-inline-ast))
   (mapcatv #(reduce
              (fn [inline-ast-coll f] (mapcatv f inline-ast-coll)) [%] mapcat-fns-on-inline-ast))))

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
  [{:keys [map-fns-on-inline-ast mapcat-fns-on-inline-ast fns-on-inline-coll] :as fns}
   block-ast]
  (let [[ast-type ast-content] block-ast]
    (case ast-type
      "Paragraph"
      (mk-paragraph-ast
       (walk-block-ast-helper ast-content map-fns-on-inline-ast mapcat-fns-on-inline-ast fns-on-inline-coll)
       (meta block-ast))
      "Heading"
      (let [{:keys [title]} ast-content]
        ["Heading"
         (assoc ast-content
                :title
                (walk-block-ast-helper title map-fns-on-inline-ast mapcat-fns-on-inline-ast fns-on-inline-coll))])
      "List"
      ["List" (walk-block-ast-for-list ast-content map-fns-on-inline-ast mapcat-fns-on-inline-ast)]
      "Quote"
      ["Quote" (mapv (partial walk-block-ast fns) ast-content)]
      "Footnote_Definition"
      (let [[name contents] (rest block-ast)]
        ["Footnote_Definition"
         name (walk-block-ast-helper contents map-fns-on-inline-ast mapcat-fns-on-inline-ast fns-on-inline-coll)])
      "Table"
      (let [{:keys [header groups]} ast-content
            header* (mapv
                     #(walk-block-ast-helper % map-fns-on-inline-ast mapcat-fns-on-inline-ast fns-on-inline-coll)
                     header)
            groups* (mapv
                     (fn [group]
                       (mapv
                        (fn [row]
                          (mapv
                           (fn [col]
                             (walk-block-ast-helper col map-fns-on-inline-ast mapcat-fns-on-inline-ast fns-on-inline-coll))
                           row))
                        group))
                     groups)]
        ["Table" (assoc ast-content :header header* :groups groups*)])

       ;; else
      block-ast)))

;;; walk on block-ast, apply inline transformers (ends)

;;; simple ast
(def simple-ast-malli-schema
  (mu/closed-schema
   [:or
    [:map
     [:type [:= :raw-text]]
     [:content :string]]
    [:map
     [:type [:= :space]]]
    [:map
     [:type [:= :newline]]
     [:line-count :int]]
    [:map
     [:type [:= :indent]]
     [:level :int]
     [:extra-space-count :int]]]))

(defn raw-text [& contents]
  {:type :raw-text :content (reduce str contents)})
(def space {:type :space})
(defn newline* [line-count]
  {:type :newline :line-count line-count})
(defn indent [level extra-space-count]
  {:type :indent :level level :extra-space-count extra-space-count})

(defn- simple-ast->string
  [simple-ast]
  {:pre [(m/validate simple-ast-malli-schema simple-ast)]}
  (case (:type simple-ast)
    :raw-text (:content simple-ast)
    :space " "
    :newline (reduce str (repeat (:line-count simple-ast) "\n"))
    :indent (reduce str (concatv (repeat (:level simple-ast) "\t")
                                 (repeat (:extra-space-count simple-ast) " ")))))

(defn- merge-adjacent-spaces&newlines
  [simple-ast-coll]
  (loop [r                             (transient [])
         last-ast                      nil
         last-raw-text-space-suffix?   false
         last-raw-text-newline-suffix? false
         [simple-ast & other-ast-coll] simple-ast-coll]
    (if (nil? simple-ast)
      (persistent! (if last-ast (conj! r last-ast) r))
      (let [tp            (:type simple-ast)
            last-ast-type (:type last-ast)]
        (case tp
          :space
          (if (or (contains? #{:space :newline :indent} last-ast-type)
                  last-raw-text-space-suffix?
                  last-raw-text-newline-suffix?)
            ;; drop this :space
            (recur r last-ast last-raw-text-space-suffix? last-raw-text-newline-suffix? other-ast-coll)
            (recur (if last-ast (conj! r last-ast) r) simple-ast false false other-ast-coll))

          :newline
          (case last-ast-type
            (:space :indent) ;; drop last-ast
            (recur r simple-ast false false other-ast-coll)
            :newline
            (let [last-newline-count (:line-count last-ast)
                  current-newline-count (:line-count simple-ast)
                  kept-ast (if (> last-newline-count current-newline-count) last-ast simple-ast)]
              (recur r kept-ast false false other-ast-coll))
            :raw-text
            (if last-raw-text-newline-suffix?
              (recur r last-ast last-raw-text-space-suffix? last-raw-text-newline-suffix? other-ast-coll)
              (recur (if last-ast (conj! r last-ast) r) simple-ast false false other-ast-coll))
            ;; no-last-ast
            (recur r simple-ast false false other-ast-coll))

          :indent
          (case last-ast-type
            (:space :indent)            ; drop last-ast
            (recur r simple-ast false false other-ast-coll)
            :newline
            (recur (if last-ast (conj! r last-ast) r) simple-ast false false other-ast-coll)
            :raw-text
            (if last-raw-text-space-suffix?
              ;; drop this :indent
              (recur r last-ast last-raw-text-space-suffix? last-raw-text-newline-suffix? other-ast-coll)
              (recur (if last-ast (conj! r last-ast) r) simple-ast false false other-ast-coll))
            ;; no-last-ast
            (recur r simple-ast false false other-ast-coll))

          :raw-text
          (let [content         (:content simple-ast)
                empty-content?  (empty? content)
                first-ch        (first content)
                last-ch         (let [num (count content)]
                                  (when (pos? num)
                                    (nth content (dec num))))
                newline-prefix? (some-> first-ch #{"\r" "\n"} boolean)
                newline-suffix? (some-> last-ch #{"\n"} boolean)
                space-prefix?   (some-> first-ch #{" "} boolean)
                space-suffix?   (some-> last-ch #{" "} boolean)]
            (cond
              empty-content?            ;drop this raw-text
              (recur r last-ast last-raw-text-space-suffix? last-raw-text-newline-suffix? other-ast-coll)
              newline-prefix?
              (case last-ast-type
                (:space :indent :newline) ;drop last-ast
                (recur r simple-ast space-suffix? newline-suffix? other-ast-coll)
                :raw-text
                (recur (if last-ast (conj! r last-ast) r) simple-ast space-suffix? newline-suffix? other-ast-coll)
                ;; no-last-ast
                (recur r simple-ast space-suffix? newline-suffix? other-ast-coll))
              space-prefix?
              (case last-ast-type
                (:space :indent)        ;drop last-ast
                (recur r simple-ast space-suffix? newline-suffix? other-ast-coll)
                (:newline :raw-text)
                (recur (if last-ast (conj! r last-ast) r) simple-ast space-suffix? newline-suffix? other-ast-coll)
                ;; no-last-ast
                (recur r simple-ast space-suffix? newline-suffix? other-ast-coll))
              :else
              (recur (if last-ast (conj! r last-ast) r) simple-ast space-suffix? newline-suffix? other-ast-coll))))))))

(defn simple-asts->string
  [simple-ast-coll]
  (->> simple-ast-coll
       merge-adjacent-spaces&newlines
       merge-adjacent-spaces&newlines
       (mapv simple-ast->string)
       string/join))

;;; simple ast (ends)


;;; TODO: walk the hiccup tree,
;;; and call escape-html on all its contents
;;;


;;; walk the hiccup tree,
;;; and call escape-html on all its contents (ends)
