(* logseq.graph-parser.schema.mldoc — Malli schema for mldoc AST.

   In cljs the schemas are malli vector data consumed only by dev-time
   function instrumentation ({:malli/schema [:=> ...]} on export fns);
   there is no production caller. Here they are typed OCaml values over
   the Wire domain (what Mldoc.*Json yields via Json.parse), plus a small
   validator so the port stays checkable. Keywords in cljs ASTs arrive as
   strings in the JSON form, so :keyword/:qualified-keyword accept both
   Wire.Keyword and Wire.String. *)

type schema =
  | SPrim of prim
  | SEnum of Wire.t list
  | SEq of Wire.t
  | SMap of map_entry list
  | SOr of schema list
  | STuple of schema list
  (* :cat / :catn match a sequence elementwise; catn only labels the
     positions, so both validate identically to a tuple. *)
  | SCat of schema list
  | SSeq of schema
  | SMaybe of schema
  | SRef of string
  (* [:schema {:registry {...}} inner] — refs resolve through the
     nearest enclosing registry, then outer ones. *)
  | SSchema of (string * schema) list * schema

and prim =
  | PAny
  | PInt
  | PString
  | PBoolean
  | PKeyword
  | PQualKeyword
  | PMapT

and map_entry =
  { me_key : string
  ; me_optional : bool
  ; me_schema : schema
  }

(* cljs field-optional-and-maybe-nil *)
let field_optional_and_maybe_nil key s =
  { me_key = key; me_optional = true; me_schema = SMaybe s }

let entry key s = { me_key = key; me_optional = false; me_schema = s }

let rec validate (reg : (string * schema) list) (s : schema) (v : Wire.t) : bool =
  match s with
  | SPrim prim -> validate_prim prim v
  | SEnum values -> List.exists (fun e -> e = v) values
  | SEq expected -> expected = v
  | SMap entries ->
      (match v with
       | Wire.Map _ ->
           List.for_all
             (fun e ->
               match Wire.get e.me_key v with
               | None -> e.me_optional
               | Some value -> validate reg e.me_schema value)
             entries
       | _ -> false)
  | SOr schemas -> List.exists (fun s -> validate reg s v) schemas
  | STuple schemas | SCat schemas ->
      (match v with
       | Wire.Array items | Wire.List items ->
           List.length items = List.length schemas
           && List.for_all2 (validate reg) schemas items
       | _ -> false)
  | SSeq schema ->
      (match v with
       | Wire.Array items | Wire.List items ->
           List.for_all (validate reg schema) items
       | _ -> false)
  | SMaybe schema ->
      (match v with
       | Wire.Nil -> true
       | _ -> validate reg schema v)
  | SRef name ->
      (match List.assoc_opt name reg with
       | Some schema -> validate reg schema v
       | None -> false)
  | SSchema (entries, inner) ->
      validate (entries @ reg) inner v

and validate_prim prim (v : Wire.t) : bool =
  match prim, v with
  | PAny, _ -> true
  | PInt, Wire.Int _ | PInt, Wire.Int64 _ -> true
  | PInt, Wire.Float f -> Float.equal f (Float.of_int (Int.of_float f))
  | PString, Wire.String _ -> true
  | PBoolean, Wire.Bool _ -> true
  | PKeyword, Wire.Keyword _ -> true
  (* JSON-parsed ASTs carry keywords as strings *)
  | PKeyword, Wire.String _ -> true
  | PQualKeyword, Wire.Keyword s | PQualKeyword, Wire.String s ->
      String.contains s '/'
  | PMapT, Wire.Map _ -> true
  | _ -> false

let validate s v = validate [] s v

(* ---------- schema definitions (1:1 with the cljs namespace) ---------- *)

let pos_schema = SMap [ entry "start_pos" (SPrim PInt); entry "end_pos" (SPrim PInt) ]

let nested_link_schema =
  SSchema
    ( [ ( "mldoc/nested-link"
        , SMap
            [ entry "content" (SPrim PString)
            ; entry "children"
                (SSeq
                   (SOr
                      [ STuple [ SEq (Wire.String "Label"); SPrim PString ]
                      ; STuple [ SEq (Wire.String "Nested_link"); SRef "mldoc/nested-link" ]
                      ]))
            ] )
      ]
    , SRef "mldoc/nested-link" )

let timestamp_schema =
  SMap
    [ entry "date"
        (SMap
           [ entry "year" (SPrim PInt)
           ; entry "month" (SPrim PInt)
           ; entry "day" (SPrim PInt)
           ])
    ; entry "wday" (SPrim PString)
    ; field_optional_and_maybe_nil "time"
        (SMap [ entry "hour" (SPrim PInt); entry "min" (SPrim PInt) ])
    ; field_optional_and_maybe_nil "repetition" (SPrim PAny)
    ; entry "active" (SPrim PBoolean)
    ]

let time_range_schema =
  SMap
    [ entry "start" (SRef "mldoc/timestamp"); entry "stop" (SRef "mldoc/timestamp") ]

let link_schema =
  SMap
    [ entry "url"
        (SOr
           [ SCat [ SEq (Wire.String "File"); SPrim PString ]
           ; SCat [ SEq (Wire.String "Search"); SPrim PString ]
           ; SCat
               [ SEq (Wire.String "Complex")
               ; SMap [ entry "protocol" (SPrim PString); entry "link" (SPrim PString) ]
               ]
           ; SCat [ SEq (Wire.String "Page_ref"); SPrim PString ]
           ; SCat [ SEq (Wire.String "Block_ref"); SPrim PString ]
           ; SCat [ SEq (Wire.String "Embed_data"); SPrim PString ]
           ])
    ; entry "label" (SSeq (SRef "mldoc/inline"))
    ; field_optional_and_maybe_nil "title" (SPrim PString)
    ; entry "full_text" (SPrim PString)
    ; entry "metadata" (SPrim PString)
    ]

let latex_fragment_schema =
  SOr
    [ STuple [ SEq (Wire.String "Inline"); SPrim PString ]
    ; STuple [ SEq (Wire.String "Displayed"); SPrim PString ]
    ]

let seq_inline () = SSeq (SRef "mldoc/inline")

let inline_ast_schema =
  let tag name = SEq (Wire.String name) in
  SSchema
    ( [ ("mldoc/timestamp", timestamp_schema)
      ; ("mldoc/time-range", time_range_schema)
      ; ("mldoc/link", link_schema)
      ; ( "mldoc/inline"
        , SOr
            [ STuple
                [ tag "Emphasis"
                ; STuple
                    [ STuple
                        [ SEnum
                            (List.map
                               (fun s -> Wire.String s)
                               [ "Italic"; "Bold"; "Underline"; "Strike_through"; "Highlight" ])
                        ]
                    ; seq_inline ()
                    ]
                ]
            ; STuple [ tag "Break_Line" ]
            ; STuple [ tag "Hard_Break_Line" ]
            ; STuple [ tag "Verbatim"; SPrim PString ]
            ; STuple [ tag "Code"; SPrim PString ]
            ; STuple [ tag "Tag"; seq_inline () ]
            ; STuple [ tag "Spaces"; SPrim PString ]
            ; STuple [ tag "Plain"; SPrim PString ]
            ; STuple [ tag "Link"; SRef "mldoc/link" ]
            ; STuple [ tag "Nested_link"; nested_link_schema ]
            ; STuple [ tag "Target"; SPrim PString ]
            ; STuple [ tag "Subscript"; seq_inline () ]
            ; STuple [ tag "Superscript"; seq_inline () ]
            ; STuple
                [ tag "Footnote_Reference"
                ; SMap
                    [ entry "id" (SPrim PInt)
                    ; entry "name" (SPrim PString)
                    ; field_optional_and_maybe_nil "definition" (seq_inline ())
                    ]
                ]
            ; STuple
                [ tag "Cookie"
                ; SOr
                    [ STuple [ tag "Percent"; SPrim PInt ]
                    ; SCat [ tag "Absolute"; SPrim PInt; SPrim PInt ]
                    ]
                ]
            ; STuple [ tag "Latex_Fragment"; latex_fragment_schema ]
            ; STuple
                [ tag "Macro"
                ; SMap
                    [ entry "name" (SPrim PString)
                    ; entry "arguments" (SSeq (SPrim PString))
                    ]
                ]
            ; STuple
                [ tag "Entity"
                ; SMap
                    [ entry "name" (SPrim PString)
                    ; entry "latex" (SPrim PString)
                    ; entry "latex_mathp" (SPrim PBoolean)
                    ; entry "html" (SPrim PString)
                    ; entry "ascii" (SPrim PString)
                    ; entry "unicode" (SPrim PString)
                    ]
                ]
            ; STuple
                [ tag "Timestamp"
                ; SOr
                    [ STuple [ tag "Scheduled"; SRef "mldoc/timestamp" ]
                    ; STuple [ tag "Deadline"; SRef "mldoc/timestamp" ]
                    ; STuple [ tag "Date"; SRef "mldoc/timestamp" ]
                    ; STuple [ tag "Closed"; SRef "mldoc/timestamp" ]
                    ; STuple
                        [ tag "Clock"
                        ; SOr
                            [ STuple [ tag "Started"; SRef "mldoc/timestamp" ]
                            ; STuple [ tag "Stopped"; SRef "mldoc/time-range" ]
                            ]
                        ]
                    ; STuple [ tag "Range"; SRef "mldoc/time-range" ]
                    ]
                ]
            ; STuple [ tag "Radio_Target"; SPrim PString ]
            ; STuple [ tag "Export_Snippet"; SPrim PString; SPrim PString ]
            ; STuple
                [ tag "Inline_Source_Block"
                ; SMap
                    [ entry "language" (SPrim PString)
                    ; entry "options" (SPrim PString)
                    ; entry "code" (SPrim PString)
                    ]
                ]
            ; STuple
                [ tag "Email"
                ; SMap
                    [ entry "local_part" (SPrim PString)
                    ; entry "domain" (SPrim PString)
                    ]
                ]
            ; STuple [ tag "Inline_Hiccup"; SPrim PString ]
            ; STuple [ tag "Inline_Html"; SPrim PString ]
            ] )
      ]
    , SRef "mldoc/inline" )

let list_item_schema =
  SMap
    [ entry "content" (SSeq (SRef "mldoc/block"))
    ; entry "items" (SSeq (SRef "mldoc/list-item"))
    ; field_optional_and_maybe_nil "number" (SPrim PInt)
    ; entry "name" (SSeq (SRef "mldoc/inline"))
    ; field_optional_and_maybe_nil "checkbox" (SPrim PBoolean)
    ; entry "indent" (SPrim PInt)
    ; entry "ordered" (SPrim PBoolean)
    ]

let heading_schema =
  SMap
    [ entry "title" (SSeq (SRef "mldoc/inline"))
    ; entry "tags" (SSeq (SPrim PString))
    ; field_optional_and_maybe_nil "marker" (SPrim PString)
    ; entry "level" (SPrim PInt)
    ; field_optional_and_maybe_nil "numbering" (SSeq (SPrim PInt))
    ; field_optional_and_maybe_nil "priority" (SPrim PString)
    ; entry "anchor" (SPrim PString)
    ; entry "meta" (SPrim PMapT)
    ; field_optional_and_maybe_nil "size" (SPrim PInt)
    ]

let block_ast_schema =
  let tag name = SEq (Wire.String name) in
  SSchema
    ( [ ("mldoc/inline", inline_ast_schema)
      ; ("mldoc/list-item", list_item_schema)
      ; ( "mldoc/block"
        , SOr
            [ STuple [ tag "Paragraph"; SSeq (SRef "mldoc/inline") ]
            ; STuple [ tag "Paragraph_Sep"; SPrim PInt ]
            ; STuple [ tag "Heading"; heading_schema ]
            ; STuple [ tag "List"; SSeq (SRef "mldoc/list-item") ]
            ; STuple [ tag "Directive"; SPrim PString; SPrim PString ]
            ; STuple [ tag "Results" ]
            ; STuple [ tag "Example"; SSeq (SPrim PString) ]
            ; STuple
                [ tag "Src"
                ; SMap
                    [ entry "lines" (SSeq (SPrim PString))
                    ; field_optional_and_maybe_nil "language" (SPrim PString)
                    ; field_optional_and_maybe_nil "options" (SSeq (SPrim PString))
                    ; entry "pos_meta" pos_schema
                    ]
                ]
            ; STuple [ tag "Quote"; SSeq (SRef "mldoc/block") ]
            ; SCat
                [ tag "Export"
                ; SPrim PString
                ; SMaybe (SSeq (SPrim PString))
                ; SPrim PString
                ]
            ; STuple [ tag "CommentBlock"; SSeq (SPrim PString) ]
            ; SCat
                [ tag "Custom"
                ; SPrim PString
                ; SMaybe (SPrim PString)
                ; SSeq (SRef "mldoc/block")
                ; SPrim PString
                ]
            ; STuple [ tag "Latex_Fragment"; latex_fragment_schema ]
            ; SCat
                [ tag "Latex_Environment"
                ; SPrim PString
                ; SMaybe (SPrim PString)
                ; SPrim PString
                ]
            ; STuple [ tag "Displayed_Math"; SPrim PString ]
            ; STuple [ tag "Drawer"; SPrim PString; SSeq (SPrim PString) ]
            ; STuple
                [ tag "Property_Drawer"
                ; SSeq
                    (SCat
                       [ SPrim PString; SPrim PString; SSeq (SRef "mldoc/inline") ])
                ]
            ; STuple
                [ tag "Footnote_Definition"; SPrim PString; SSeq (SRef "mldoc/inline") ]
            ; STuple [ tag "Horizontal_Rule" ]
            ; STuple
                [ tag "Table"
                ; SMap
                    [ field_optional_and_maybe_nil "header"
                        (SSeq (SSeq (SRef "mldoc/inline")))
                    ; entry "groups"
                        (SSeq (SSeq (SSeq (SSeq (SRef "mldoc/inline")))))
                    ; entry "col_groups" (SSeq (SPrim PInt))
                    ]
                ]
            ; STuple [ tag "Comment"; SPrim PString ]
            ; STuple [ tag "Raw_Html"; SPrim PString ]
            ; STuple [ tag "Hiccup"; SPrim PString ]
            (* not from mldoc — from
               logseq.graph-parser.mldoc/collect-page-properties *)
            ; STuple [ tag "Properties"; SSeq (SPrim PAny) ]
            ] )
      ]
    , SRef "mldoc/block" )

let block_ast_with_pos_coll_schema =
  SSeq (SCat [ block_ast_schema; SMaybe pos_schema ])
