(ns ^:bb-compatible logseq.db.frontend.rules
  "Datalog rules for use with logseq.db.frontend.schema")

(def ^:large-vars/data-var rules
  "Rules used mainly in frontend.db.model"
  ;; rule "parent" is optimized for parent node -> child node nesting queries
  {:namespace
   '[[(namespace ?p ?c)
      [?c :block/namespace ?p]]
     [(namespace ?p ?c)
      [?t :block/namespace ?p]
      (namespace ?t ?c)]]

   :class-parent
   '[[(class-parent ?p ?c)
      [?c :class/parent ?p]]
     [(class-parent ?p ?c)
      [?t :class/parent ?p]
      (class-parent ?t ?c)]]

   :alias
   '[[(alias ?e2 ?e1)
      [?e2 :block/alias ?e1]]
     [(alias ?e2 ?e1)
      [?e1 :block/alias ?e2]]
     [(alias ?e1 ?e3)
      [?e1 :block/alias ?e2]
      [?e2 :block/alias ?e3]]
     [(alias ?e3 ?e1)
      [?e1 :block/alias ?e2]
      [?e2 :block/alias ?e3]]]})

;; Rules writing advice
;; ====================
;; Select rules carefully, as it is critical for performance.
;; The rules have different clause order and resolving directions.
;; Clause order Reference:
;; https://docs.datomic.com/on-prem/query/query-executing.html#clause-order
;; Recursive optimization Reference:
;; https://stackoverflow.com/questions/42457136/recursive-datalog-queries-for-datomic-really-slow
;; Should optimize for query the descendents of a block
;; Quote:
;; My theory is that your rules are not written in a way that Datalog can optimize for this read pattern - probably resulting in a traversal of all the entities. I suggest to rewrite them as follows:
;; [[(ubersymbol ?c ?p)
;;   (?c :ml/parent ?p)]
;;  [(ubersymbol ?c ?p)
;;   ;; we bind a child of the ancestor, instead of a parent of the descendant
;;   (?c1 :ml/parent ?p)
;;   (ubersymbol ?c ?c1)]]

;; This way of writing the ruleset is optimized to find the descendants of some node. The way you originally wrote it is optimized to find the anscestors of some node.

;; from https://stackoverflow.com/questions/43784258/find-entities-whose-ref-to-many-attribute-contains-all-elements-of-input
;; Quote:
;; You're tackling the general problem of 'dynamic conjunction' in Datomic's Datalog.
;; Write a dynamic Datalog query which uses 2 negations and 1 disjunction or a recursive rule
;; Datalog has no direct way of expressing dynamic conjunction (logical AND / 'for all ...' / set intersection).
;; However, you can achieve it in pure Datalog by combining one disjunction
;; (logical OR / 'exists ...' / set union) and two negations, i.e
;; (For all ?g in ?Gs p(?e,?g)) <=> NOT(Exists ?g in ?Gs, such that NOT(p(?e, ?g)))

;; [(matches-all ?e ?a ?vs)
;;  [(first ?vs) ?v0]
;;  [?e ?a ?v0]
;;  (not-join [?e ?vs]
;;            [(identity ?vs) [?v ...]]
;;            (not-join [?e ?v]
;;                      [?e ?a ?v]))]

(def ^:large-vars/data-var query-dsl-rules
  "Rules used by frontend.db.query-dsl for file graphs. The symbols ?b and ?p
  respectively refer to block and page. Do not alter them as they are
  programmatically built by the query-dsl ns"
  {:page-property
   '[(page-property ?p ?key ?val)
     [?p :block/name]
     [?p :block/properties ?prop]
     [(get ?prop ?key) ?v]
     (or [(= ?v ?val)] [(contains? ?v ?val)])]

   :has-page-property
   '[(has-page-property ?p ?key)
     [?p :block/name]
     [?p :block/properties ?prop]
     [(get ?prop ?key)]]

   :task
   '[(task ?b ?markers)
     [?b :block/marker ?marker]
     [(contains? ?markers ?marker)]]

   :priority
   '[(priority ?b ?priorities)
     [?b :block/priority ?priority]
     [(contains? ?priorities ?priority)]]

   :page-tags
   '[(page-tags ?p ?tags)
     [?p :block/tags ?t]
     [?t :block/name ?tag]
     [(contains? ?tags ?tag)]]

   :all-page-tags
   '[(all-page-tags ?p)
     [_ :block/tags ?p]]

   :between
   '[(between ?b ?start ?end)
     [?b :block/page ?p]
     [?p :block/type "journal"]
     [?p :block/journal-day ?d]
     [(>= ?d ?start)]
     [(<= ?d ?end)]]

   :has-property
   '[(has-property ?b ?prop)
     [?b :block/properties ?bp]
     [(missing? $ ?b :block/name)]
     [(get ?bp ?prop)]]

   :block-content
   '[(block-content ?b ?query)
     [?b :block/title ?content]
     [(clojure.string/includes? ?content ?query)]]

   :page
   '[(page ?b ?page-name)
     [?b :block/page ?bp]
     [?bp :block/name ?page-name]]

   :namespace
   '[(namespace ?p ?namespace)
     [?p :block/namespace ?parent]
     [?parent :block/name ?namespace]]

   :property
   '[(property ?b ?key ?val)
     [?b :block/properties ?prop]
     [(missing? $ ?b :block/name)]
     [(get ?prop ?key) ?v]
     [(str ?val) ?str-val]
     (or [(= ?v ?val)]
         [(contains? ?v ?val)]
         ;; For integer pages that aren't strings
         [(contains? ?v ?str-val)])]

   :page-ref
   '[(page-ref ?b ?page-name)
     [?b :block/path-refs ?br]
     [?br :block/name ?page-name]]})

(def ^:large-vars/data-var db-query-dsl-rules
  "Rules used by frontend.query.dsl for db graphs"
  (merge
   (dissoc query-dsl-rules :namespace)
   {:page-tags
    '[(page-tags ?p ?tags)
      [?p :block/tags ?t]
      [?t :block/name ?tag]
      [(missing? $ ?p :block/link)]
      [(contains? ?tags ?tag)]]

    :has-page-property
    '[(has-page-property ?p ?prop)
      [?p :block/name]
      [?p ?prop _]
      [?prop-e :db/ident ?prop]
      [?prop-e :block/type "property"]]

    :page-property
    '[(page-property ?p ?prop ?val)
      [?p :block/name]
      [?prop-e :db/ident ?prop]
      [?prop-e :block/type "property"]
      [?p ?prop ?pv]
      (or
       ;; non-ref value
       (and
        [(missing? $ ?prop-e :db/valueType)]
        [?p ?prop ?val])
       ;; ref value
       (and
        [?prop-e :db/valueType :db.type/ref]
        (or [?pv :block/title ?val]
            [?pv :property.value/content ?val])))]

    :has-property
    '[(has-property ?b ?prop)
      [?b ?prop _]
      [(missing? $ ?b :block/name)]
      [?prop-e :db/ident ?prop]
      [?prop-e :block/type "property"]]

    :property
    '[(property ?b ?prop ?val)
      [?prop-e :db/ident ?prop]
      [?prop-e :block/type "property"]
      [?b ?prop ?pv]
      (or
       ;; non-ref value
       (and
        [(missing? $ ?prop-e :db/valueType)]
        [?b ?prop ?val])
       ;; ref value
       (and
        [?prop-e :db/valueType :db.type/ref]
        (or [?pv :block/title ?val]
            [?pv :property.value/content ?val])))
      [(missing? $ ?b :block/name)]]

    :task
    '[(task ?b ?statuses)
      ;; and needed to avoid binding error
      (and (property ?b :logseq.task/status ?val)
           [(contains? ?statuses ?val)])]

    :priority
    '[(priority ?b ?priorities)
      ;; and needed to avoid binding error
      (and (property ?b :logseq.task/priority ?priority)
           [(contains? ?priorities ?priority)])]}))

(def rules-dependencies
  "For db graphs, a map of rule names and the rules they depend on. If this map
  becomes long or brittle, we could do scan rules for their deps with something
  like find-rules-in-where"
  {:task #{:property}
   :priority #{:property}})

(defn extract-rules
  "Given a rules map and the rule names to extract, returns a vector of rules to
  be passed to datascript.core/q. Can handle rules with multiple or single clauses.
  Takes following options:
   * :deps - A map of rule names to their dependencies. Only one-level of dependencies are resolved.
   No dependencies are detected by default though we could add it later e.g. find-rules-in-where"
  ([rules-m] (extract-rules rules-m (keys rules-m)))
  ([rules-m rules & {:keys [deps]}]
   (let [rules-with-deps (concat rules
                                 (when (map? deps)
                                   (mapcat deps rules)))]
     (vec
      (mapcat #(let [val (rules-m %)]
                 ;; if vector?, rule has multiple clauses
                 (if (vector? (first val)) val [val]))
              rules-with-deps)))))
