(* In-process Drive port for the Melange unit-test target -- the `drive`
   package's Model + Session subset, minus the wire-JSON/FFI/live-attach
   halves that need C stubs + unix/threads (unavailable under JS). Mounts
   a real LUI app (view + reducer) against a recording backend and replays
   every patch op into a queryable node Model; events inject through
   Lui_app.dispatch_event -- the same path the web host uses. *)

open Lui_protocol

module Model = struct
  (* Node tree replayed from LUI patch ops. Kinds and props are keyed by
     their wire names (Lui_wire_schema names). *)

  type node =
    { id : int
    ; mutable kind : string (* node_kind_name, or "extension:<identifier>" *)
    ; props : (string, wire_value) Hashtbl.t
    ; mutable parent : int option
    ; mutable children : int list
    }

  type t =
    { nodes : (int, node) Hashtbl.t
    ; mutable generation : int
    ; mutable ops_applied : int (* patch ops replayed — repaint-granularity checks *)
    }

  let create () =
    { nodes = Hashtbl.create 64; generation = 0; ops_applied = 0 }
  let node_count t = Hashtbl.length t.nodes
  let generation t = t.generation

  let new_node id kind =
    { id; kind; props = Hashtbl.create 8; parent = None; children = [] }

  let rec drop t id =
    match Hashtbl.find_opt t.nodes id with
    | None -> ()
    | Some node ->
      List.iter (drop t) node.children;
      (match node.parent with
       | Some pid -> (
         match Hashtbl.find_opt t.nodes pid with
         | Some p ->
           p.children <- List.filter (fun c -> c <> id) p.children
         | None -> ())
       | None -> ());
      Hashtbl.remove t.nodes id

  let insert_child t parent child index =
    match Hashtbl.find_opt t.nodes parent, Hashtbl.find_opt t.nodes child with
    | Some p, Some c ->
      p.children <- List.filter (fun x -> x <> child) p.children;
      let rec insert_at i acc = function
        | [] -> List.rev (child :: acc)
        | rest when i <= 0 -> List.rev_append acc (child :: rest)
        | x :: tl -> insert_at (i - 1) (x :: acc) tl
      in
      p.children <- insert_at index [] p.children;
      c.parent <- Some parent
    | _ -> ()

  let apply_op t = function
    | CreateNode (id, k) ->
      Hashtbl.replace t.nodes id
        (new_node id (Lui_wire_schema.node_kind_name k))
    | CreateExtension (id, identifier, _fp) ->
      Hashtbl.replace t.nodes id (new_node id ("extension:" ^ identifier))
    | DropNode id -> drop t id
    | DetachSubtree id -> drop t id
    | SetProp (id, p, v) -> (
      match Hashtbl.find_opt t.nodes id with
      | Some n -> Hashtbl.replace n.props (Lui_wire_schema.property_name p) v
      | None -> ())
    | RemoveProp (id, p) -> (
      match Hashtbl.find_opt t.nodes id with
      | Some n -> Hashtbl.remove n.props (Lui_wire_schema.property_name p)
      | None -> ())
    | SetExtensionProp (id, name, v) -> (
      match Hashtbl.find_opt t.nodes id with
      | Some n -> Hashtbl.replace n.props name v
      | None -> ())
    | RemoveExtensionProp (id, name) -> (
      match Hashtbl.find_opt t.nodes id with
      | Some n -> Hashtbl.remove n.props name
      | None -> ())
    | InsertChild (parent, child, index) -> insert_child t parent child index
    | RemoveChild (parent, child) -> (
      match (Hashtbl.find_opt t.nodes parent, Hashtbl.find_opt t.nodes child)
      with
      | Some p, Some c ->
        p.children <- List.filter (fun x -> x <> child) p.children;
        c.parent <- None
      | _ -> ())
    | MoveChild (parent, child, index) -> insert_child t parent child index

  let apply_batch t (batch : patch_batch) =
    t.generation <- batch.generation;
    t.ops_applied <- t.ops_applied + List.length batch.ops;
    List.iter (apply_op t) batch.ops

  (* ---------- queries ---------- *)

  type selector =
    | Id of int
    | Kind of string (* matches kind name: "dialog", "text-field", ... *)
    | Ext of string (* extension identifier *)
    | Text of string (* any string prop containing the needle *)
    | Prop of string * wire_value
    | All of selector list (* conjunction: kind:button&text:Save *)

  let all_nodes t =
    let acc = Hashtbl.fold (fun _ n acc -> n :: acc) t.nodes [] in
    List.sort (fun a b -> compare a.id b.id) acc

  let string_prop node name =
    match Hashtbl.find_opt node.props name with
    | Some (StringValue s) -> Some s
    | _ -> None

  let contains_ic hay needle =
    let hay = String.lowercase_ascii hay in
    let needle = String.lowercase_ascii needle in
    let len_s = String.length hay and len_n = String.length needle in
    len_n <= len_s
    &&
    let rec go i =
      i <= len_s - len_n && (String.sub hay i len_n = needle || go (i + 1))
    in
    go 0

  let rec matches node = function
    | Id id -> node.id = id
    | Kind name -> node.kind = name
    | Ext identifier -> node.kind = "extension:" ^ identifier
    | Text needle ->
      Hashtbl.fold
        (fun _ v acc ->
          acc
          ||
          match v with
          | StringValue s -> contains_ic s needle
          | _ -> false)
        node.props false
    | Prop (name, v) -> (
      match Hashtbl.find_opt node.props name with
      | Some v' -> v' = v
      | None -> false)
    | All sels -> List.for_all (matches node) sels

  let find t sel = List.filter (fun n -> matches n sel) (all_nodes t)
  let first t sel = match find t sel with n :: _ -> Some n | [] -> None
  let exists t sel = Option.is_some (first t sel)

  let prop t id name =
    match Hashtbl.find_opt t.nodes id with
    | Some n -> Hashtbl.find_opt n.props name
    | None -> None

  let children t id =
    match Hashtbl.find_opt t.nodes id with
    | Some n -> List.filter_map (fun c -> Hashtbl.find_opt t.nodes c) n.children
    | None -> []

  let string_of_wire_value = function
    | StringValue s -> Printf.sprintf "%S" s
    | BoolValue b -> string_of_bool b
    | IntValue i -> string_of_int i
    | FloatValue f -> string_of_float f

  (* Interesting props to show in dumps / failures. *)
  let describe t node =
    let texts =
      Hashtbl.fold
        (fun k v acc ->
          match v with
          | StringValue s
            when k = "text" || k = "label" || k = "value"
                 || k = "placeholder" || k = "style-class"
                 || k = "accessibility-identifier" ->
            (k ^ "=" ^ Printf.sprintf "%S" s) :: acc
          | _ -> acc)
        node.props []
    in
    let kids = children t node.id |> List.length in
    Printf.sprintf "#%d %s%s%s" node.id node.kind
      (if texts = [] then "" else " " ^ String.concat " " texts)
      (if kids = 0 then "" else Printf.sprintf " (%d children)" kids)

  let dump ?root t =
    let buf = Buffer.create 1024 in
    let rec walk depth node =
      Buffer.add_string buf
        (Printf.sprintf "%s%s\n" (String.make (2 * depth) ' ')
           (describe t node));
      List.iter (walk (depth + 1)) (children t node.id)
    in
    let roots =
      match root with
      | Some id -> List.filter (fun n -> n.id = id) (all_nodes t)
      | None ->
        List.filter
          (fun n ->
            match n.parent with
            | None -> true
            | Some pid -> not (Hashtbl.mem t.nodes pid))
          (all_nodes t)
    in
    List.iter (walk 0) roots;
    Buffer.contents buf

  (* Parse "kind:dialog" | "ext:web-view" | "text:foo" | "id:12" |
     "prop:name=value"; "&" combines conjuncts *)
  let rec selector_of_string s =
    match String.split_on_char '&' s with
    | [ one ] -> selector_one one
    | parts ->
      let sels = List.filter_map selector_one parts in
      if List.length sels = List.length parts then Some (All sels)
      else None

  and selector_one s =
    match String.index_opt s ':' with
    | None -> (
      match int_of_string_opt s with
      | Some id -> Some (Id id)
      | None -> Some (Text s))
    | Some i ->
      let head = String.sub s 0 i in
      let rest = String.sub s (i + 1) (String.length s - i - 1) in
      let unquote v =
        let n = String.length v in
        if n >= 2 && v.[0] = '"' && v.[n - 1] = '"'
        then String.sub v 1 (n - 2)
        else v
      in
      (match head with
       | "id" -> (
         match int_of_string_opt rest with
         | Some i -> Some (Id i)
         | None -> None)
       | "kind" -> Some (Kind rest)
       | "ext" -> Some (Ext rest)
       | "text" -> Some (Text (unquote rest))
       | "prop" -> (
         match String.index_opt rest '=' with
         | Some j ->
           let name = String.sub rest 0 j in
           let v = String.sub rest (j + 1) (String.length rest - j - 1) |> unquote in
           Some (Prop (name, StringValue v))
         | None -> None)
       | _ -> None)
end

module Session = struct
  (* Minimal driver surface shared by the in-process session and the FFI
     target: scenarios only need these three. *)
  type driver =
    { tree : Model.t
    ; send_event : event -> unit
    ; poll : unit -> unit
    }

  type ('model, 'action) t =
    { app : ('model, 'action) Lui_app.reducer_app
    ; tree : Model.t
    ; drain : unit -> 'action list
    }

  let mount ?(drain = fun () -> []) ?registry ~profile ~initial ~reducer
      ~view () =
    let tree = Model.create () in
    let backend =
      { backend_profile = profile
      ; apply_batch = (fun b -> Model.apply_batch tree b; true)
      }
    in
    let app =
      match registry with
      | Some r -> Lui_app.create_with_extensions backend r initial reducer view
      | None -> Lui_app.create backend initial reducer view
    in
    ignore (Lui_app.start app);
    ignore (Lui_app.flush app);
    { app; tree; drain }

  let flush s = ignore (Lui_app.flush s.app)

  (* drain external actions, then ALWAYS flush: event handlers are run by
     the scheduler during flush, so skipping it leaves effects queued. *)
  let poll s =
    List.iter (fun a -> ignore (Lui_app.send s.app a)) (s.drain ());
    flush s

  let dispatch s ev =
    ignore (Lui_app.dispatch_event s.app ev);
    poll s

  let press s node = dispatch s (Press node)
  let long_press s node = dispatch s (LongPress node)
  let double_press s node = dispatch s (DoublePress node)
  let text_changed s node text = dispatch s (TextChanged (node, text))
  let submit s node = dispatch s (Submit node)
  let dismiss s node = dispatch s (Dismiss node)
  let appear s node = dispatch s (Appear node)
  let toggle s node checked = dispatch s (ToggleChanged (node, checked))
  let change s node = dispatch s (Change node)
  let value_changed s node v = dispatch s (ValueChanged (node, v))

  let extension_event s ~node ~identifier ~name ~fields =
    dispatch s (ExtensionEvent (node, identifier, name, fields))

  let read_model s = Lui_app.model s.app
  let root_node s = Lui_app.root_node s.app

  let driver s =
    { tree = s.tree
    ; send_event = (fun ev -> dispatch s ev)
    ; poll = (fun () -> poll s)
    }

  let dispose s = ignore (Lui_app.dispose s.app)

  (* Resolve a selector to a single node, erroring with a tree dump. *)
  let resolve (d : driver) sel =
    match Model.first d.tree sel with
    | Some n -> n
    | None ->
      failwith
        (Printf.sprintf "drive: no node matches selector; tree:\n%s"
           (Model.dump d.tree))
end

type driver = Session.driver
