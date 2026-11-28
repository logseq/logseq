module Resource=Lui_resource
module Loaders=Lui_resource_loaders

type owner={url:string;scope:Signal.scope;entry:Lui_scene.image Resource.entry}
type t={cache:Lui_scene.image Resource.t;owners:(int,owner) Hashtbl.t;
  pending:(int,string) Hashtbl.t;visible:int -> bool;
  source:string -> Lui_resource_loaders.source;on_change:int -> unit;mutable disposed:bool}

let source_of_url url =
  let math_prefix = "logseq-math:" in
  if String.length url > String.length math_prefix &&
     String.sub url 0 (String.length math_prefix) = math_prefix then
    let rest = String.sub url (String.length math_prefix)
      (String.length url - String.length math_prefix) in
    match String.index_opt rest ':' with
    | Some first when first + 1 < String.length rest -> (
        match String.index_from_opt rest (first + 1) ':' with
        | Some second when second + 1 < String.length rest ->
            let display = String.sub rest 0 first in
            let _dark = String.sub rest (first + 1) (second - first - 1) in
            let encoded = String.sub rest (second + 1) (String.length rest - second - 1) in
            let tex = Uri.pct_decode encoded in
            (match Host_math.png_bytes ~dark:(Theme_vars.current_dark ()) ~tex ~display:(display = "1") with
             | Some bytes -> Loaders.Bytes bytes
             | None -> Loaders.Bytes Bytes.empty)
        | _ -> Loaders.Bytes Bytes.empty)
    | _ -> Loaders.Bytes Bytes.empty
  else
    let uri = Uri.of_string url in
    match Uri.scheme uri, Uri.host uri with
    | Some "file", (None | Some "" | Some "localhost") -> Loaders.Path (Uri.pct_decode (Uri.path uri))
    | _ -> Loaders.url url

let create ?(executor=Resource.executor_domain) ?(source=source_of_url) ?(visible=fun _ -> true) ~on_change () =
  let publish=ref (fun () -> invalid_arg "Image cache is not initialized") in
  let executor job=executor (fun () -> job ();Host.enqueue (fun () -> !publish ())) in
  let cache=Resource.create ~executor () in
  publish:=(fun () -> ignore (Resource.drain cache));
  {cache;owners=Hashtbl.create 16;pending=Hashtbl.create 8;visible;source;on_change;disposed=false}

let release t retired id =
  Hashtbl.remove t.pending id;
  match Hashtbl.find_opt t.owners id with
  | None -> ()
  | Some owner ->
      Hashtbl.remove t.owners id;
      retired := owner.scope :: !retired

let sync_node t retired store id =
  let url =
    if Lui_store.mem store id && Lui_store.kind store id = "image"
       && Lui_store.prop store id "image" = None
    then Lui_store.string_prop store id "url"
    else None
  in
  match url, Hashtbl.find_opt t.owners id with
  | Some url, Some owner when owner.url = url -> ()
  | url, _ ->
      release t retired id;
      Option.iter
        (fun url ->
          if Lui_store.string_prop store id "loading" = Some "lazy"
             && not (t.visible id)
          then Hashtbl.replace t.pending id url
          else begin
            Hashtbl.remove t.pending id;
            let scope = Signal.scope "native-image" in
            let source = t.source url in
            let load task =
              match Loaders.bytes_of_source task source with
              | Error _ as error -> error
              | Ok encoded ->
                  if Resource.task_cancelled task then Error "cancelled"
                  else Host_image.decode encoded
            in
            let entry =
              Resource.request t.cache ~scope ~load
                ~on_state:(fun entry ->
                  match Resource.state entry with
                  | Loading -> ()
                  | Ready _ -> t.on_change id
                  | Failed error ->
                      Printf.eprintf "[native image] %s: %s\n%!" url error)
                (Loaders.key_of_source ~kind:"img" source)
            in
            Hashtbl.add t.owners id { url; scope; entry }
          end)
        url

let sync_batch t store batch =
  if t.disposed then invalid_arg "Image cache is disposed";
  let dropped = ref false and retired = ref [] in
  let dirty = Hashtbl.create 8 in
  List.iter
    (function
      | Lui_protocol.DropNode id | DetachSubtree id ->
          dropped := true;
          release t retired id
      | CreateNode (id, kind) ->
          dropped := true;
          release t retired id;
          if kind = Image then Hashtbl.replace dirty id ()
      | CreateExtension (id, _, _) ->
          dropped := true;
          release t retired id
      | SetProp (id, (UrlValue | ImageIdValue | LoadingValue), _)
      | RemoveProp (id, (UrlValue | ImageIdValue | LoadingValue)) ->
          Hashtbl.replace dirty id ()
      | _ -> ())
    batch.Lui_protocol.ops;
  if !dropped then begin
    Hashtbl.filter_map_inplace
      (fun id owner ->
        if Lui_store.mem store id then Some owner
        else (retired := owner.scope :: !retired; None))
      t.owners;
    Hashtbl.filter_map_inplace
      (fun id url -> if Lui_store.mem store id then Some url else None)
      t.pending
  end;
  (* Image constructor patches set url before loading. Deferring the load
     decision until the whole batch is applied keeps a lazy image from
     starting an eager fetch in between those two property ops. *)
  Hashtbl.iter (fun id () -> sync_node t retired store id) dirty;
  List.iter Signal.dispose_scope !retired

let sync_visible t store =
  let ids=Hashtbl.fold (fun id _ acc -> id::acc) t.pending [] in
  let retired=ref [] in
  List.iter (fun id ->
    if Lui_store.mem store id then sync_node t retired store id
    else Hashtbl.remove t.pending id) ids;
  List.iter Signal.dispose_scope !retired


let refresh_math t store =
  let prefix = "logseq-math:" in
  let ids =
    Hashtbl.fold (fun id owner ids ->
      if String.length owner.url >= String.length prefix &&
         String.sub owner.url 0 (String.length prefix) = prefix then id :: ids
      else ids) t.owners []
  in
  let retired = ref [] in
  List.iter (fun id ->
    release t retired id;
    sync_node t retired store id) ids;
  List.iter Signal.dispose_scope !retired

let image_of t id = match Hashtbl.find_opt t.owners id with
  | Some owner -> (match Resource.state owner.entry with Ready image -> Some image | _ -> None)
  | None -> None
let owner_count t=Hashtbl.length t.owners
let resource_count t=Resource.length t.cache

let dispose t =
  if not t.disposed then begin
    t.disposed<-true;
    Hashtbl.iter (fun _ owner -> Signal.dispose_scope owner.scope) t.owners;
    Hashtbl.clear t.owners;Hashtbl.clear t.pending;
    Resource.clear t.cache;Resource.unregister t.cache
  end

(* Export support: scan every image node in the store (virtualization
   only affects layout mounting, not store contents) and start loads
   honoring this instance's visible predicate. *)
let sync_store t store =
  let retired = ref [] in
  Lui_store.iter_preorder store (fun id ->
    if Lui_store.kind store id = "image" then sync_node t retired store id);
  List.iter Signal.dispose_scope !retired

(* Drive load completion without the host event queue so a synchronous
   exporter can wait for images. *)
let pump t = ignore (Resource.drain t.cache)

let loading_count t =
  Hashtbl.fold
    (fun _ owner acc ->
      match Resource.state owner.entry with
      | Resource.Loading -> acc + 1
      | _ -> acc)
    t.owners 0
