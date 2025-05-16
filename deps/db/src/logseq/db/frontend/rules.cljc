(ns ^:bb-compatible logseq.db.frontend.rules
  "Datalog rules mostly for DB graphs. `rules`
   is the only var also used by file graphs"
  (:require [logseq.db.file-based.rules :as file-rules]))

(def ^:large-vars/data-var rules
  "Rules used mainly in frontend.db.model for both DB and file graphs"
  ;; rule "parent" is optimized for parent node -> child node nesting queries
  {:parent
   '[[(parent ?p ?c)
      [?c :block/parent ?p]]
     [(parent ?p ?c)
      [?t :block/parent ?p]
      (parent ?t ?c)]]

   :class-extends
   '[[(class-extends ?p ?c)
      [?c :logseq.property.class/extends ?p]]
     [(class-extends ?p ?c)
      [?t :logseq.property.class/extends ?p]
      (class-extends ?t ?c)]]

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

(def ^:large-vars/data-var db-query-dsl-rules
  "Rules used by frontend.query.dsl for DB graphs"
  (merge
   (dissoc file-rules/query-dsl-rules :namespace
           :page-property :has-page-property
           :page-tags :all-page-tags)
   rules

   {:between
    '[(between ?b ?start ?end)
      [?b :block/page ?p]
      [?p :block/tags :logseq.class/Journal]
      [?p :block/journal-day ?d]
      [(>= ?d ?start)]
      [(<= ?d ?end)]]

    :existing-property-value
    '[;; non-ref value
      [(existing-property-value ?b ?prop ?val)
       [?prop-e :db/ident ?prop]
       [(missing? $ ?prop-e :db/valueType)]
       [?b ?prop ?val]]
      ;; ref value
      [(existing-property-value ?b ?prop ?val)
       [?prop-e :db/ident ?prop]
       [?prop-e :db/valueType :db.type/ref]
       [?b ?prop ?pv]
       (or [?pv :block/title ?val]
           [?pv :logseq.property/value ?val])]]

    :property-missing-value
    '[(property-missing-value ?b ?prop-e ?default-p ?default-v)
      [?t :logseq.property.class/properties ?prop-e]
      [?prop-e :db/ident ?prop]
      (object-has-class-property? ?b ?prop)
       ;; Notice: `(missing? )` doesn't work here because `de/entity`
       ;; returns the default value if there's no value yet.
      [(get-else $ ?b ?prop "N/A") ?prop-v]
      [(= ?prop-v "N/A")]
      [?prop-e ?default-p ?default-v]]

    :property-scalar-default-value
    '[(property-scalar-default-value ?b ?prop-e ?default-p ?val)
      (property-missing-value ?b ?prop-e ?default-p ?default-v)
      [(missing? $ ?prop-e :db/valueType)]
      [?prop-e ?default-p ?val]]

    :property-default-value
    '[(property-default-value ?b ?prop-e ?default-p ?val)
      (property-missing-value ?b ?prop-e ?default-p ?default-v)
      (or
       [?default-v :block/title ?val]
       [?default-v :logseq.property/value ?val])]

    :property-value
    '[[(property-value ?b ?prop-e ?val)
       [?prop-e :db/ident ?prop]
       (existing-property-value ?b ?prop ?val)]
      [(property-value ?b ?prop-e ?val)
       (or
        (and
         [(missing? $ ?prop-e :db/valueType)]
         (property-scalar-default-value ?b ?prop-e :logseq.property/scalar-default-value ?val))
        (and
         [?prop-e :db/valueType :db.type/ref]
         (property-default-value ?b ?prop-e :logseq.property/default-value ?val)))]]

    :object-has-class-property
    '[(object-has-class-property? ?b ?prop)
      [?prop-e :db/ident ?prop]
      [?t :logseq.property.class/properties ?prop-e]
      [?b :block/tags ?tc]
      (or
       [(= ?t ?tc)]
       (class-extends ?t ?tc))]

    :has-property-or-object-property
    '[(has-property-or-object-property? ?b ?prop)
      [?prop-e :db/ident ?prop]
      (or
       [?b ?prop _]
       (object-has-class-property? ?b ?prop))]

    ;; Checks if a property exists for simple queries. Supports default values
    :has-simple-query-property
    '[(has-simple-query-property ?b ?prop)
      [?prop-e :db/ident ?prop]
      [?prop-e :block/tags :logseq.class/Property]
      (has-property-or-object-property? ?b ?prop)
      (or
       [(missing? $ ?prop-e :logseq.property/public?)]
       [?prop-e :logseq.property/public? true])]

    ;; Same as has-simple-query-property except it returns public and private properties like :block/title
    :has-private-simple-query-property
    '[(has-private-simple-query-property ?b ?prop)
      [?prop-e :db/ident ?prop]
      [?prop-e :block/tags :logseq.class/Property]
      (has-property-or-object-property? ?b ?prop)]

    ;; Checks if a property exists for any features that are not simple queries
    :has-property
    '[(has-property ?b ?prop)
      [?b ?prop _]
      [?prop-e :db/ident ?prop]
      [?prop-e :block/tags :logseq.class/Property]
      (or
       [(missing? $ ?prop-e :logseq.property/public?)]
       [?prop-e :logseq.property/public? true])]

    ;; Checks if a property has a value for any features that are not simple queries
    :property
    '[(property ?b ?prop ?val)
      [?prop-e :db/ident ?prop]
      [?prop-e :block/tags :logseq.class/Property]
      (or
       [(missing? $ ?prop-e :logseq.property/public?)]
       [?prop-e :logseq.property/public? true])
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
            [?pv :logseq.property/value ?val])))]

    ;; Checks if a property has a value for simple queries. Supports default values
    :simple-query-property
    '[(simple-query-property ?b ?prop ?val)
      [?prop-e :db/ident ?prop]
      [?prop-e :block/tags :logseq.class/Property]
      (or
       [(missing? $ ?prop-e :logseq.property/public?)]
       [?prop-e :logseq.property/public? true])
      (property-value ?b ?prop-e ?val)]

    ;; Same as property except it returns public and private properties like :block/title
    :private-simple-query-property
    '[(private-simple-query-property ?b ?prop ?val)
      [?prop-e :db/ident ?prop]
      [?prop-e :block/tags :logseq.class/Property]
      (property-value ?b ?prop-e ?val)]

    :tags
    '[(tags ?b ?tags)
      [?b :block/tags ?t]
      [?t :block/name ?tag]
      [(missing? $ ?b :block/link)]
      [(contains? ?tags ?tag)]]

    :task
    '[(task ?b ?statuses)
      ;; and needed to avoid binding error
      (and (simple-query-property ?b :logseq.property/status ?val)
           [(contains? ?statuses ?val)])]

    :priority
    '[(priority ?b ?priorities)
      ;; and needed to avoid binding error
      (and (simple-query-property ?b :logseq.property/priority ?priority)
           [(contains? ?priorities ?priority)])]}))

(def rules-dependencies
  "For db graphs, a map of rule names and the rules they depend on. If this map
  becomes long or brittle, we could do scan rules for their deps with something
  like find-rules-in-where"
  {:task #{:simple-query-property}
   :priority #{:simple-query-property}
   :property-missing-value #{:object-has-class-property}
   :has-property-or-object-property #{:object-has-class-property}
   :object-has-class-property #{:class-extends}
   :has-simple-query-property #{:has-property-or-object-property}
   :has-private-simple-query-property #{:has-property-or-object-property}
   :property-default-value #{:existing-property-value :property-missing-value}
   :property-scalar-default-value #{:existing-property-value :property-missing-value}
   :property-value #{:property-default-value :property-scalar-default-value}
   :simple-query-property #{:property-value}
   :private-simple-query-property #{:property-value}})

(defn- get-full-deps
  [deps rules-deps]
  (loop [deps' deps
         result #{}]
    (if (seq deps')
      (recur (mapcat rules-deps deps')
             (into result deps'))
      result)))

(defn extract-rules
  "Given a rules map and the rule names to extract, returns a vector of rules to
  be passed to datascript.core/q. Can handle rules with multiple or single clauses.
  Takes following options:
   * :deps - A map of rule names to their dependencies. Only one-level of dependencies are resolved.
   No dependencies are detected by default though we could add it later e.g. find-rules-in-where"
  ([rules-m] (extract-rules rules-m (keys rules-m)))
  ([rules-m rules' & {:keys [deps]}]
   (let [rules-with-deps (if (map? deps)
                           (get-full-deps rules' deps)
                           rules')]
     (vec
      (mapcat #(let [val (rules-m %)]
                 ;; if vector?, rule has multiple clauses
                 (if (vector? (first val)) val [val]))
              rules-with-deps)))))
