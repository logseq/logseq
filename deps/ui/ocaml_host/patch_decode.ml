(* JSON decoder for the wire patch batches native_embed.ml produces
   via Lui_wire.encode_batch — the mirror of encode_op. The bridge
   hands the host a `[batch, ...]` array; each element decodes to a
   Lui_protocol.patch_batch and applies straight to Lui_host. *)

open Lui_protocol

module J = Yojson.Safe

exception Fail of string

let failf fmt = Printf.ksprintf (fun s -> raise (Fail s)) fmt

let jget (name : string) (j : J.t) : J.t option =
  match j with `Assoc a -> List.assoc_opt name a | _ -> None

let jreq name j =
  match jget name j with
  | Some v -> v
  | None -> failf "missing required field %S in %s" name (J.to_string j)

let jstr name j = J.Util.to_string (jreq name j)

let jint name j =
  match jreq name j with
  | `Int i -> i
  | `Float f -> int_of_float f
  | `String s -> (try int_of_string s with _ -> failf "bad int %S" s)
  | other -> failf "field %S is not an int: %s" name (J.to_string other)

let wire_of_json (j : J.t) : wire_value =
  match j with
  | `String s -> StringValue s
  | `Bool b -> BoolValue b
  | `Int i -> IntValue i
  | `Float f -> FloatValue f
  | `Intlit s -> IntValue (int_of_string s)
  | _ -> failf "invalid wire value %s" (J.to_string j)

let kind_of_name (s : string) : node_kind =
  match
    List.find_opt
      (fun k -> Lui_wire_schema.node_kind_name k = s)
      Lui_wire_schema.all_node_kinds
  with
  | Some k -> k
  | None -> failf "unknown node kind %S" s

let property_of_name (s : string) : property =
  match
    List.find_opt
      (fun p -> Lui_wire_schema.property_name p = s)
      Lui_wire_schema.all_properties
  with
  | Some p -> p
  | None -> failf "unknown property %S" s

let patch_op_of_json (j : J.t) : patch_op =
  let op = jstr "op" j in
  let id () = jint "id" j in
  let prop () = property_of_name (jstr "property" j) in
  match op with
  | "create-node" ->
    CreateNode (id (), kind_of_name (jstr "kind" j))
  | "create-extension" ->
    CreateExtension (id (), jstr "identifier" j, jstr "fingerprint" j)
  | "drop-node" -> DropNode (id ())
  | "detach-subtree" -> DetachSubtree (id ())
  | "set-prop" ->
    SetProp (id (), prop (), wire_of_json (jreq "value" j))
  | "remove-prop" -> RemoveProp (id (), prop ())
  | "set-extension-prop" ->
    SetExtensionProp (id (), jstr "property" j, wire_of_json (jreq "value" j))
  | "remove-extension-prop" ->
    RemoveExtensionProp (id (), jstr "property" j)
  | "insert-child" ->
    InsertChild (jint "parent" j, jint "child" j, jint "index" j)
  | "remove-child" ->
    RemoveChild (jint "parent" j, jint "child" j)
  | "move-child" ->
    MoveChild (jint "parent" j, jint "child" j, jint "index" j)
  | _ -> failf "unknown patch op %S" op

let batch_of_json (j : J.t) : patch_batch =
  { generation = jint "generation" j
  ; ops =
      (match jreq "ops" j with
       | `List ops -> List.map patch_op_of_json ops
       | _ -> failf "\"ops\" must be a list") }

(* The joined "[batch, batch, ...]" the patch callback carries; the
   empty string is the no-work sentinel take_patches emits. *)
let batches_of_string (s : string) : patch_batch list =
  if s = "" then []
  else
    match J.from_string s with
    | `List batches -> List.map batch_of_json batches
    | other -> failf "patch payload is not a batch array: %s"
               (J.to_string other)
