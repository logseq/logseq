open Datalog_form

type entry = { name : string; body : t }
type dependency = { name : string; dependencies : string Rrbvec.t }

let make_entry name body = { name; body }

let make_dependency name dependencies =
  { name; dependencies = Rrbvec.of_array dependencies }

let rules =
  Rrbvec.of_array
    [|
      make_entry "parent"
        (vector_form
           [|
             vector_form
               [|
                 list_form [| symbol "parent"; symbol "?p"; symbol "?c" |];
                 vector_form
                   [| symbol "?c"; keyword "block/parent"; symbol "?p" |];
               |];
             vector_form
               [|
                 list_form [| symbol "parent"; symbol "?p"; symbol "?c" |];
                 vector_form
                   [| symbol "?t"; keyword "block/parent"; symbol "?p" |];
                 list_form [| symbol "parent"; symbol "?t"; symbol "?c" |];
               |];
           |]);
      make_entry "class-extends"
        (vector_form
           [|
             vector_form
               [|
                 list_form
                   [| symbol "class-extends"; symbol "?p"; symbol "?c" |];
                 vector_form
                   [|
                     symbol "?c";
                     keyword "logseq.property.class/extends";
                     symbol "?p";
                   |];
               |];
             vector_form
               [|
                 list_form
                   [| symbol "class-extends"; symbol "?p"; symbol "?c" |];
                 vector_form
                   [|
                     symbol "?t";
                     keyword "logseq.property.class/extends";
                     symbol "?p";
                   |];
                 list_form
                   [| symbol "class-extends"; symbol "?t"; symbol "?c" |];
               |];
           |]);
      make_entry "alias"
        (vector_form
           [|
             vector_form
               [|
                 list_form [| symbol "alias"; symbol "?e2"; symbol "?e1" |];
                 vector_form
                   [| symbol "?e2"; keyword "block/alias"; symbol "?e1" |];
               |];
             vector_form
               [|
                 list_form [| symbol "alias"; symbol "?e2"; symbol "?e1" |];
                 vector_form
                   [| symbol "?e1"; keyword "block/alias"; symbol "?e2" |];
               |];
           |]);
      make_entry "self-ref"
        (vector_form
           [|
             list_form [| symbol "self-ref"; symbol "?b"; symbol "?ref" |];
             vector_form [| symbol "?b"; keyword "block/refs"; symbol "?ref" |];
           |]);
      make_entry "has-ref"
        (vector_form
           [|
             vector_form
               [|
                 list_form [| symbol "has-ref"; symbol "?b"; symbol "?r" |];
                 vector_form
                   [| symbol "?b"; keyword "block/refs"; symbol "?r" |];
               |];
             vector_form
               [|
                 list_form [| symbol "has-ref"; symbol "?b"; symbol "?r" |];
                 list_form [| symbol "parent"; symbol "?p"; symbol "?b" |];
                 vector_form
                   [| symbol "?p"; keyword "block/refs"; symbol "?r" |];
               |];
           |]);
    |]

let db_query_dsl_rules =
  Rrbvec.of_array
    [|
      make_entry "has-ref"
        (vector_form
           [|
             vector_form
               [|
                 list_form [| symbol "has-ref"; symbol "?b"; symbol "?r" |];
                 vector_form
                   [| symbol "?b"; keyword "block/refs"; symbol "?r" |];
               |];
             vector_form
               [|
                 list_form [| symbol "has-ref"; symbol "?b"; symbol "?r" |];
                 list_form [| symbol "parent"; symbol "?p"; symbol "?b" |];
                 vector_form
                   [| symbol "?p"; keyword "block/refs"; symbol "?r" |];
               |];
           |]);
      make_entry "class-extends"
        (vector_form
           [|
             vector_form
               [|
                 list_form
                   [| symbol "class-extends"; symbol "?p"; symbol "?c" |];
                 vector_form
                   [|
                     symbol "?c";
                     keyword "logseq.property.class/extends";
                     symbol "?p";
                   |];
               |];
             vector_form
               [|
                 list_form
                   [| symbol "class-extends"; symbol "?p"; symbol "?c" |];
                 vector_form
                   [|
                     symbol "?t";
                     keyword "logseq.property.class/extends";
                     symbol "?p";
                   |];
                 list_form
                   [| symbol "class-extends"; symbol "?t"; symbol "?c" |];
               |];
           |]);
      make_entry "ref-property-value"
        (vector_form
           [|
             vector_form
               [|
                 list_form
                   [|
                     symbol "ref-property-value";
                     symbol "?b";
                     symbol "?prop-e";
                     symbol "?val";
                   |];
                 vector_form
                   [| symbol "?prop-e"; keyword "db/ident"; symbol "?prop" |];
                 vector_form [| symbol "?b"; symbol "?prop"; symbol "?pv" |];
                 list_form [| symbol "ref->val"; symbol "?pv"; symbol "?val" |];
               |];
           |]);
      make_entry "tags"
        (vector_form
           [|
             vector_form
               [|
                 list_form
                   [| symbol "tag-spec->tag"; symbol "?tag"; symbol "?spec" |];
                 vector_form
                   [| list_form [| symbol "number?"; symbol "?spec" |] |];
                 vector_form
                   [|
                     list_form [| symbol "identity"; symbol "?spec" |];
                     symbol "?tag";
                   |];
               |];
             vector_form
               [|
                 list_form
                   [| symbol "tag-spec->tag"; symbol "?tag"; symbol "?spec" |];
                 vector_form
                   [| symbol "?tag"; keyword "block/title"; symbol "?spec" |];
               |];
             vector_form
               [|
                 list_form
                   [| symbol "tag-spec->tag"; symbol "?tag"; symbol "?spec" |];
                 vector_form
                   [| symbol "?tag"; keyword "db/ident"; symbol "?spec" |];
               |];
             vector_form
               [|
                 list_form [| symbol "tags"; symbol "?b"; symbol "?tags" |];
                 vector_form
                   [|
                     list_form [| symbol "identity"; symbol "?tags" |];
                     vector_form [| symbol "?spec"; symbol "..." |];
                   |];
                 list_form
                   [| symbol "tag-spec->tag"; symbol "?tag"; symbol "?spec" |];
                 vector_form
                   [| symbol "?b"; keyword "block/tags"; symbol "?tc" |];
                 list_form
                   [|
                     symbol "or";
                     vector_form
                       [|
                         list_form [| symbol "="; symbol "?tag"; symbol "?tc" |];
                       |];
                     list_form
                       [| symbol "class-extends"; symbol "?tag"; symbol "?tc" |];
                   |];
                 vector_form
                   [|
                     list_form
                       [|
                         symbol "missing?";
                         symbol "$";
                         symbol "?b";
                         keyword "block/link";
                       |];
                   |];
               |];
           |]);
      make_entry "has-simple-query-property"
        (vector_form
           [|
             list_form
               [|
                 symbol "has-simple-query-property"; symbol "?b"; symbol "?prop";
               |];
             vector_form
               [| symbol "?prop-e"; keyword "db/ident"; symbol "?prop" |];
             vector_form
               [|
                 symbol "?prop-e";
                 keyword "block/tags";
                 keyword "logseq.class/Property";
               |];
             list_form
               [|
                 symbol "has-property-or-object-property?";
                 symbol "?b";
                 symbol "?prop";
               |];
             list_form
               [|
                 symbol "or";
                 vector_form
                   [|
                     list_form
                       [|
                         symbol "missing?";
                         symbol "$";
                         symbol "?prop-e";
                         keyword "logseq.property/public?";
                       |];
                   |];
                 vector_form
                   [|
                     symbol "?prop-e";
                     keyword "logseq.property/public?";
                     bool true;
                   |];
               |];
           |]);
      make_entry "has-private-simple-query-property"
        (vector_form
           [|
             list_form
               [|
                 symbol "has-private-simple-query-property";
                 symbol "?b";
                 symbol "?prop";
               |];
             vector_form
               [| symbol "?prop-e"; keyword "db/ident"; symbol "?prop" |];
             vector_form
               [|
                 symbol "?prop-e";
                 keyword "block/tags";
                 keyword "logseq.class/Property";
               |];
             list_form
               [|
                 symbol "has-property-or-object-property?";
                 symbol "?b";
                 symbol "?prop";
               |];
           |]);
      make_entry "scalar-property-with-default"
        (vector_form
           [|
             list_form
               [|
                 symbol "scalar-property-with-default";
                 symbol "?b";
                 symbol "?prop";
                 symbol "?val";
               |];
             vector_form
               [| symbol "?prop-e"; keyword "db/ident"; symbol "?prop" |];
             list_form
               [|
                 symbol "scalar-property-value-with-default";
                 symbol "?b";
                 symbol "?prop-e";
                 symbol "?val";
               |];
             list_form
               [|
                 symbol "or";
                 vector_form
                   [|
                     list_form
                       [|
                         symbol "missing?";
                         symbol "$";
                         symbol "?prop-e";
                         keyword "logseq.property/public?";
                       |];
                   |];
                 vector_form
                   [|
                     symbol "?prop-e";
                     keyword "logseq.property/public?";
                     bool true;
                   |];
               |];
           |]);
      make_entry "self-ref"
        (vector_form
           [|
             list_form [| symbol "self-ref"; symbol "?b"; symbol "?ref" |];
             vector_form [| symbol "?b"; keyword "block/refs"; symbol "?ref" |];
           |]);
      make_entry "scalar-property"
        (vector_form
           [|
             list_form
               [|
                 symbol "scalar-property";
                 symbol "?b";
                 symbol "?prop";
                 symbol "?val";
               |];
             vector_form
               [| symbol "?prop-e"; keyword "db/ident"; symbol "?prop" |];
             list_form
               [|
                 symbol "scalar-property-value";
                 symbol "?b";
                 symbol "?prop-e";
                 symbol "?val";
               |];
             list_form
               [|
                 symbol "or";
                 vector_form
                   [|
                     list_form
                       [|
                         symbol "missing?";
                         symbol "$";
                         symbol "?prop-e";
                         keyword "logseq.property/public?";
                       |];
                   |];
                 vector_form
                   [|
                     symbol "?prop-e";
                     keyword "logseq.property/public?";
                     bool true;
                   |];
               |];
           |]);
      make_entry "parent"
        (vector_form
           [|
             vector_form
               [|
                 list_form [| symbol "parent"; symbol "?p"; symbol "?c" |];
                 vector_form
                   [| symbol "?c"; keyword "block/parent"; symbol "?p" |];
               |];
             vector_form
               [|
                 list_form [| symbol "parent"; symbol "?p"; symbol "?c" |];
                 vector_form
                   [| symbol "?t"; keyword "block/parent"; symbol "?p" |];
                 list_form [| symbol "parent"; symbol "?t"; symbol "?c" |];
               |];
           |]);
      make_entry "private-scalar-property-with-default"
        (vector_form
           [|
             list_form
               [|
                 symbol "private-scalar-property-with-default";
                 symbol "?b";
                 symbol "?prop";
                 symbol "?val";
               |];
             vector_form
               [| symbol "?prop-e"; keyword "db/ident"; symbol "?prop" |];
             vector_form
               [|
                 symbol "?prop-e";
                 keyword "block/tags";
                 keyword "logseq.class/Property";
               |];
             list_form
               [|
                 symbol "scalar-property-value-with-default";
                 symbol "?b";
                 symbol "?prop-e";
                 symbol "?val";
               |];
           |]);
      make_entry "task"
        (vector_form
           [|
             list_form [| symbol "task"; symbol "?b"; symbol "?statuses" |];
             list_form
               [|
                 symbol "ref-property-with-default";
                 symbol "?b";
                 keyword "logseq.property/status";
                 symbol "?val";
               |];
             vector_form
               [|
                 list_form
                   [| symbol "contains?"; symbol "?statuses"; symbol "?val" |];
               |];
           |]);
      make_entry "property"
        (vector_form
           [|
             list_form
               [|
                 symbol "property"; symbol "?b"; symbol "?prop"; symbol "?val";
               |];
             vector_form
               [| symbol "?prop-e"; keyword "db/ident"; symbol "?prop" |];
             vector_form
               [|
                 symbol "?prop-e";
                 keyword "block/tags";
                 keyword "logseq.class/Property";
               |];
             list_form
               [|
                 symbol "or";
                 vector_form
                   [|
                     list_form
                       [|
                         symbol "missing?";
                         symbol "$";
                         symbol "?prop-e";
                         keyword "logseq.property/public?";
                       |];
                   |];
                 vector_form
                   [|
                     symbol "?prop-e";
                     keyword "logseq.property/public?";
                     bool true;
                   |];
               |];
             vector_form [| symbol "?b"; symbol "?prop"; symbol "?pv" |];
             list_form
               [|
                 symbol "or";
                 list_form
                   [|
                     symbol "and";
                     vector_form
                       [|
                         list_form
                           [|
                             symbol "missing?";
                             symbol "$";
                             symbol "?prop-e";
                             keyword "db/valueType";
                           |];
                       |];
                     vector_form
                       [| symbol "?b"; symbol "?prop"; symbol "?val" |];
                   |];
                 list_form
                   [|
                     symbol "and";
                     vector_form
                       [|
                         symbol "?prop-e";
                         keyword "db/valueType";
                         keyword "db.type/ref";
                       |];
                     list_form
                       [|
                         symbol "or";
                         vector_form
                           [|
                             symbol "?pv"; keyword "block/title"; symbol "?val";
                           |];
                         vector_form
                           [|
                             symbol "?pv";
                             keyword "logseq.property/value";
                             symbol "?val";
                           |];
                       |];
                   |];
               |];
           |]);
      make_entry "private-scalar-property"
        (vector_form
           [|
             list_form
               [|
                 symbol "private-scalar-property";
                 symbol "?b";
                 symbol "?prop";
                 symbol "?val";
               |];
             vector_form
               [| symbol "?prop-e"; keyword "db/ident"; symbol "?prop" |];
             vector_form
               [|
                 symbol "?prop-e";
                 keyword "block/tags";
                 keyword "logseq.class/Property";
               |];
             list_form
               [|
                 symbol "scalar-property-value";
                 symbol "?b";
                 symbol "?prop-e";
                 symbol "?val";
               |];
           |]);
      make_entry "ref-property-with-default"
        (vector_form
           [|
             list_form
               [|
                 symbol "ref-property-with-default";
                 symbol "?b";
                 symbol "?prop";
                 symbol "?val";
               |];
             vector_form
               [| symbol "?prop-e"; keyword "db/ident"; symbol "?prop" |];
             list_form
               [|
                 symbol "ref-property-value-with-default";
                 symbol "?b";
                 symbol "?prop-e";
                 symbol "?val";
               |];
             list_form
               [|
                 symbol "or";
                 vector_form
                   [|
                     list_form
                       [|
                         symbol "missing?";
                         symbol "$";
                         symbol "?prop-e";
                         keyword "logseq.property/public?";
                       |];
                   |];
                 vector_form
                   [|
                     symbol "?prop-e";
                     keyword "logseq.property/public?";
                     bool true;
                   |];
               |];
           |]);
      make_entry "block-content"
        (vector_form
           [|
             list_form
               [| symbol "block-content"; symbol "?b"; symbol "?query" |];
             vector_form
               [| symbol "?b"; keyword "block/title"; symbol "?content" |];
             vector_form
               [|
                 list_form
                   [|
                     symbol "clojure.string/includes?";
                     symbol "?content";
                     symbol "?query";
                   |];
               |];
           |]);
      make_entry "property-missing-value"
        (vector_form
           [|
             list_form
               [|
                 symbol "property-missing-value";
                 symbol "?b";
                 symbol "?prop-e";
                 symbol "?default-p";
                 symbol "?default-v";
               |];
             vector_form
               [|
                 symbol "?t";
                 keyword "logseq.property.class/properties";
                 symbol "?prop-e";
               |];
             vector_form
               [| symbol "?prop-e"; keyword "db/ident"; symbol "?prop" |];
             list_form
               [|
                 symbol "object-has-class-property?";
                 symbol "?b";
                 symbol "?prop";
               |];
             vector_form
               [|
                 list_form
                   [|
                     symbol "get-else";
                     symbol "$";
                     symbol "?b";
                     symbol "?prop";
                     string_literal "N/A";
                   |];
                 symbol "?prop-v";
               |];
             vector_form
               [|
                 list_form
                   [| symbol "="; symbol "?prop-v"; string_literal "N/A" |];
               |];
             vector_form
               [| symbol "?prop-e"; symbol "?default-p"; symbol "?default-v" |];
           |]);
      make_entry "between"
        (vector_form
           [|
             list_form
               [|
                 symbol "between"; symbol "?b"; symbol "?start"; symbol "?end";
               |];
             vector_form [| symbol "?b"; keyword "block/page"; symbol "?p" |];
             vector_form
               [|
                 symbol "?p";
                 keyword "block/tags";
                 keyword "logseq.class/Journal";
               |];
             vector_form
               [| symbol "?p"; keyword "block/journal-day"; symbol "?d" |];
             vector_form
               [| list_form [| symbol ">="; symbol "?d"; symbol "?start" |] |];
             vector_form
               [| list_form [| symbol "<="; symbol "?d"; symbol "?end" |] |];
           |]);
      make_entry "page"
        (vector_form
           [|
             list_form [| symbol "page"; symbol "?b"; symbol "?page-name" |];
             vector_form [| symbol "?b"; keyword "block/page"; symbol "?bp" |];
             vector_form
               [| symbol "?bp"; keyword "block/name"; symbol "?page-name" |];
           |]);
      make_entry "object-has-class-property"
        (vector_form
           [|
             list_form
               [|
                 symbol "object-has-class-property?";
                 symbol "?b";
                 symbol "?prop";
               |];
             vector_form
               [| symbol "?prop-e"; keyword "db/ident"; symbol "?prop" |];
             vector_form
               [|
                 symbol "?t";
                 keyword "logseq.property.class/properties";
                 symbol "?prop-e";
               |];
             vector_form [| symbol "?b"; keyword "block/tags"; symbol "?tc" |];
             list_form
               [|
                 symbol "or";
                 vector_form
                   [| list_form [| symbol "="; symbol "?t"; symbol "?tc" |] |];
                 list_form
                   [| symbol "class-extends"; symbol "?t"; symbol "?tc" |];
               |];
           |]);
      make_entry "page-ref"
        (vector_form
           [|
             list_form [| symbol "page-ref"; symbol "?b"; symbol "?ref" |];
             list_form [| symbol "has-ref"; symbol "?b"; symbol "?ref" |];
           |]);
      make_entry "alias"
        (vector_form
           [|
             vector_form
               [|
                 list_form [| symbol "alias"; symbol "?e2"; symbol "?e1" |];
                 vector_form
                   [| symbol "?e2"; keyword "block/alias"; symbol "?e1" |];
               |];
             vector_form
               [|
                 list_form [| symbol "alias"; symbol "?e2"; symbol "?e1" |];
                 vector_form
                   [| symbol "?e1"; keyword "block/alias"; symbol "?e2" |];
               |];
           |]);
      make_entry "priority"
        (vector_form
           [|
             list_form
               [| symbol "priority"; symbol "?b"; symbol "?priorities" |];
             list_form
               [|
                 symbol "ref-property-with-default";
                 symbol "?b";
                 keyword "logseq.property/priority";
                 symbol "?priority";
               |];
             vector_form
               [|
                 list_form
                   [|
                     symbol "contains?";
                     symbol "?priorities";
                     symbol "?priority";
                   |];
               |];
           |]);
      make_entry "ref-property"
        (vector_form
           [|
             list_form
               [|
                 symbol "ref-property";
                 symbol "?b";
                 symbol "?prop";
                 symbol "?val";
               |];
             vector_form
               [| symbol "?prop-e"; keyword "db/ident"; symbol "?prop" |];
             list_form
               [|
                 symbol "ref-property-value";
                 symbol "?b";
                 symbol "?prop-e";
                 symbol "?val";
               |];
             list_form
               [|
                 symbol "or";
                 vector_form
                   [|
                     list_form
                       [|
                         symbol "missing?";
                         symbol "$";
                         symbol "?prop-e";
                         keyword "logseq.property/public?";
                       |];
                   |];
                 vector_form
                   [|
                     symbol "?prop-e";
                     keyword "logseq.property/public?";
                     bool true;
                   |];
               |];
           |]);
      make_entry "has-property"
        (vector_form
           [|
             list_form [| symbol "has-property"; symbol "?b"; symbol "?prop" |];
             vector_form [| symbol "?b"; symbol "?prop"; symbol "_" |];
             vector_form
               [| symbol "?prop-e"; keyword "db/ident"; symbol "?prop" |];
             vector_form
               [|
                 symbol "?prop-e";
                 keyword "block/tags";
                 keyword "logseq.class/Property";
               |];
             list_form
               [|
                 symbol "or";
                 vector_form
                   [|
                     list_form
                       [|
                         symbol "missing?";
                         symbol "$";
                         symbol "?prop-e";
                         keyword "logseq.property/public?";
                       |];
                   |];
                 vector_form
                   [|
                     symbol "?prop-e";
                     keyword "logseq.property/public?";
                     bool true;
                   |];
               |];
           |]);
      make_entry "ref->val"
        (vector_form
           [|
             vector_form
               [|
                 list_form [| symbol "ref->val"; symbol "?pv"; symbol "?val" |];
                 vector_form
                   [| symbol "?pv"; keyword "block/title"; symbol "?val" |];
               |];
             vector_form
               [|
                 list_form [| symbol "ref->val"; symbol "?pv"; symbol "?val" |];
                 vector_form
                   [|
                     symbol "?pv";
                     keyword "logseq.property/value";
                     symbol "?val";
                   |];
               |];
           |]);
      make_entry "scalar-property-value-with-default"
        (vector_form
           [|
             vector_form
               [|
                 list_form
                   [|
                     symbol "scalar-property-value-with-default";
                     symbol "?b";
                     symbol "?prop-e";
                     symbol "?val";
                   |];
                 list_form
                   [|
                     symbol "scalar-property-value";
                     symbol "?b";
                     symbol "?prop-e";
                     symbol "?val";
                   |];
               |];
             vector_form
               [|
                 list_form
                   [|
                     symbol "scalar-property-value-with-default";
                     symbol "?b";
                     symbol "?prop-e";
                     symbol "?val";
                   |];
                 list_form
                   [|
                     symbol "property-missing-value";
                     symbol "?b";
                     symbol "?prop-e";
                     keyword "logseq.property/scalar-default-value";
                     symbol "?val";
                   |];
               |];
           |]);
      make_entry "private-ref-property"
        (vector_form
           [|
             list_form
               [|
                 symbol "private-ref-property";
                 symbol "?b";
                 symbol "?prop";
                 symbol "?val";
               |];
             vector_form
               [| symbol "?prop-e"; keyword "db/ident"; symbol "?prop" |];
             vector_form
               [|
                 symbol "?prop-e";
                 keyword "block/tags";
                 keyword "logseq.class/Property";
               |];
             list_form
               [|
                 symbol "ref-property-value";
                 symbol "?b";
                 symbol "?prop-e";
                 symbol "?val";
               |];
           |]);
      make_entry "has-property-or-object-property"
        (vector_form
           [|
             list_form
               [|
                 symbol "has-property-or-object-property?";
                 symbol "?b";
                 symbol "?prop";
               |];
             vector_form
               [| symbol "?prop-e"; keyword "db/ident"; symbol "?prop" |];
             list_form
               [|
                 symbol "or";
                 vector_form [| symbol "?b"; symbol "?prop"; symbol "_" |];
                 list_form
                   [|
                     symbol "object-has-class-property?";
                     symbol "?b";
                     symbol "?prop";
                   |];
               |];
           |]);
      make_entry "private-ref-property-with-default"
        (vector_form
           [|
             list_form
               [|
                 symbol "private-ref-property-with-default";
                 symbol "?b";
                 symbol "?prop";
                 symbol "?val";
               |];
             vector_form
               [| symbol "?prop-e"; keyword "db/ident"; symbol "?prop" |];
             vector_form
               [|
                 symbol "?prop-e";
                 keyword "block/tags";
                 keyword "logseq.class/Property";
               |];
             list_form
               [|
                 symbol "ref-property-value-with-default";
                 symbol "?b";
                 symbol "?prop-e";
                 symbol "?val";
               |];
           |]);
      make_entry "scalar-property-value"
        (vector_form
           [|
             vector_form
               [|
                 list_form
                   [|
                     symbol "scalar-property-value";
                     symbol "?b";
                     symbol "?prop-e";
                     symbol "?val";
                   |];
                 vector_form
                   [| symbol "?prop-e"; keyword "db/ident"; symbol "?prop" |];
                 vector_form [| symbol "?b"; symbol "?prop"; symbol "?val" |];
               |];
           |]);
      make_entry "ref-property-value-with-default"
        (vector_form
           [|
             vector_form
               [|
                 list_form
                   [|
                     symbol "ref-property-value-with-default";
                     symbol "?b";
                     symbol "?prop-e";
                     symbol "?val";
                   |];
                 list_form
                   [|
                     symbol "ref-property-value";
                     symbol "?b";
                     symbol "?prop-e";
                     symbol "?val";
                   |];
               |];
             vector_form
               [|
                 list_form
                   [|
                     symbol "ref-property-value-with-default";
                     symbol "?b";
                     symbol "?prop-e";
                     symbol "?val";
                   |];
                 list_form
                   [|
                     symbol "property-missing-value";
                     symbol "?b";
                     symbol "?prop-e";
                     keyword "logseq.property/default-value";
                     symbol "?pv";
                   |];
                 list_form [| symbol "ref->val"; symbol "?pv"; symbol "?val" |];
               |];
           |]);
    |]

let rules_dependencies =
  Rrbvec.of_array
    [|
      make_dependency "has-ref" [| "parent" |];
      make_dependency "ref-property-value" [| "ref->val" |];
      make_dependency "tags" [| "class-extends" |];
      make_dependency "has-simple-query-property"
        [| "has-property-or-object-property" |];
      make_dependency "has-private-simple-query-property"
        [| "has-property-or-object-property" |];
      make_dependency "scalar-property-with-default"
        [| "scalar-property-value-with-default" |];
      make_dependency "scalar-property" [| "scalar-property-value" |];
      make_dependency "private-scalar-property-with-default"
        [| "scalar-property-value-with-default" |];
      make_dependency "task" [| "ref-property-with-default" |];
      make_dependency "private-scalar-property" [| "scalar-property-value" |];
      make_dependency "ref-property-with-default"
        [| "ref-property-value-with-default" |];
      make_dependency "property-missing-value" [| "object-has-class-property" |];
      make_dependency "object-has-class-property" [| "class-extends" |];
      make_dependency "page-ref" [| "has-ref" |];
      make_dependency "priority" [| "ref-property-with-default" |];
      make_dependency "ref-property" [| "ref-property-value" |];
      make_dependency "scalar-property-value-with-default"
        [| "property-missing-value"; "scalar-property-value" |];
      make_dependency "private-ref-property" [| "ref-property-value" |];
      make_dependency "has-property-or-object-property"
        [| "object-has-class-property" |];
      make_dependency "private-ref-property-with-default"
        [| "ref-property-value-with-default" |];
      make_dependency "ref-property-value-with-default"
        [| "ref-property-value"; "property-missing-value" |];
    |]
