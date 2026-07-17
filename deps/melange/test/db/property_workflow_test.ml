open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

type value = Nil | Text of string | Node of (string * value) Rrbvec.t

let node entries = Node (Rrbvec.of_array entries)

let get value field =
  match value with
  | Node entries ->
      Rrbvec.fold_left
        (fun result (key, value) ->
          match result with
          | Some _ -> result
          | None when String.equal key field -> Some value
          | None -> None)
        None entries
      |> Option.value ~default:Nil
  | Nil | Text _ -> Nil

let truthy = function Nil -> false | Text _ | Node _ -> true
let text = function Text value -> value | Nil -> "nil" | Node _ -> "node"

let () =
  Fest.test "DB property workflow selects stored value when title is falsey"
    (fun () ->
      let entity =
        node
          [| ("block/title", Nil); ("logseq.property/value", Text "Stored") |]
      in
      expect_equal "stored content"
        (Property_workflow.value_content_with ~get ~truthy entity)
        (Text "Stored"));
  Fest.test "DB property workflow dereferences built-in reference values"
    (fun () ->
      let status = node [| ("block/title", Text "Todo") |] in
      let block = node [| ("logseq.property/status", status) |] in
      expect_equal "reference content"
        (Property_workflow.lookup_with ~get
           ~has_ref_value:(String.equal "logseq.property/status")
           ~content:(Property_workflow.value_content_with ~get ~truthy)
           block "logseq.property/status")
        (Text "Todo");
      expect_equal "scalar content"
        (Property_workflow.lookup_with ~get
           ~has_ref_value:(fun _ -> false)
           ~content:(Property_workflow.value_content_with ~get ~truthy)
           (node [| ("logseq.property/icon", Text "star") |])
           "logseq.property/icon")
        (Text "star"));
  Fest.test "DB property workflow translates built-in titles with fallback"
    (fun () ->
      let entity =
        node
          [|
            ("db/ident", Text "logseq.property/status");
            ("block/title", Text "Status");
          |]
      in
      let translated =
        Property_workflow.built_in_display_title_with ~get
          ~ident_text:(fun value -> Some (text value))
          ~translate:(fun key -> Text ("translated:" ^ key))
          ~truthy ~value_to_string:text entity
      in
      expect_equal "translated title" translated
        (Text "translated:property.built-in/status");
      let fallback =
        Property_workflow.built_in_display_title_with ~get
          ~ident_text:(fun value -> Some (text value))
          ~translate:(fun _ -> Text "{Missing translation}")
          ~truthy ~value_to_string:text entity
      in
      expect_equal "missing translation fallback" fallback (Text "Status"));
  Fest.test "DB property workflow refreshes the block before lookup" (fun () ->
      let stale = node [| ("db/id", Text "1"); ("value", Text "stale") |] in
      let current = node [| ("db/id", Text "1"); ("value", Text "current") |] in
      let calls = ref Rrbvec.empty in
      let lookup block ident = get block ident in
      expect_equal "current value"
        (Property_workflow.block_property_value_with
           ~entity:(fun database id ->
             calls := Rrbvec.push_back !calls (database, id);
             Some current)
           ~block_id:(fun block -> get block "db/id")
           ~lookup (Some "db") stale "value")
        (Some (Text "current"));
      expect_equal "entity lookup" (Rrbvec.to_array !calls)
        [| ("db", Text "1") |];
      expect_equal "missing database"
        (Property_workflow.block_property_value_with
           ~entity:(fun _ _ -> assert false)
           ~block_id:(fun block -> get block "db/id")
           ~lookup None stale "value")
        None)
