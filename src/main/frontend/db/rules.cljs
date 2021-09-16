(ns frontend.db.rules)

(def rules
  '[[(parent ?p ?c)
     [?c :block/parent ?p]]
    [(parent ?p ?c)
     [?c :block/parent ?t]
     (parent ?p ?t)]

    [(namespace ?p ?c)
     [?c :block/namespace ?p]]
    [(namespace ?p ?c)
     [?c :block/namespace ?t]
     (namespace ?p ?t)]

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
    ])
