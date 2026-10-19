module Resource=Lui_resource
module Loader=Lui_resource_loaders.Image

type owner={url:string;scope:Signal.scope;entry:Lui_scene.image Resource.entry}
type t={cache:Lui_scene.image Resource.t;owners:(int,owner) Hashtbl.t;
  source:string -> Lui_resource_loaders.source;on_change:int -> unit;mutable disposed:bool}

let create ?(executor=Resource.executor_domain) ?(source=Lui_resource_loaders.url) ~on_change () =
  let publish=ref (fun () -> invalid_arg "Image cache is not initialized") in
  let executor job=executor (fun () -> job ();Host.enqueue (fun () -> !publish ())) in
  let cache=Loader.create ~executor () in
  publish:=(fun () -> ignore (Resource.drain cache));
  {cache;owners=Hashtbl.create 16;source;on_change;disposed=false}

let release t retired id = match Hashtbl.find_opt t.owners id with
  | None -> ()
  | Some owner -> Hashtbl.remove t.owners id;retired:=owner.scope::!retired

let sync_node t retired store id =
  let url=if Lui_store.mem store id && Lui_store.kind store id="image" &&
    Lui_store.prop store id "image"=None then Lui_store.string_prop store id "url" else None in
  match url,Hashtbl.find_opt t.owners id with
  | Some url,Some owner when owner.url=url -> ()
  | url,_ ->
      release t retired id;
      Option.iter (fun url ->
        let scope=Signal.scope "native-image" in
        let entry=Loader.request t.cache ~scope ~on_state:(fun entry -> match Resource.state entry with
          | Loading -> ()
          | Ready _ -> t.on_change id
          | Failed error -> Printf.eprintf "[native image] %s: %s\n%!" url error)
          (t.source url) in
        Hashtbl.add t.owners id {url;scope;entry}) url

let sync_batch t store batch =
  if t.disposed then invalid_arg "Image cache is disposed";
  let dropped=ref false and retired=ref [] in
  List.iter (function
    | Lui_protocol.DropNode id | DetachSubtree id -> dropped:=true;release t retired id
    | CreateNode (id,kind) ->
        dropped:=true;release t retired id;if kind=Image then sync_node t retired store id
    | CreateExtension (id,_,_) -> dropped:=true;release t retired id
    | SetProp (id,(UrlValue|ImageIdValue),_) | RemoveProp (id,(UrlValue|ImageIdValue)) -> sync_node t retired store id
    | _ -> ()) batch.Lui_protocol.ops;
  if !dropped then Hashtbl.filter_map_inplace (fun id owner ->
    if Lui_store.mem store id then Some owner
    else (retired:=owner.scope::!retired;None)) t.owners;
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
    Hashtbl.clear t.owners;
    Resource.clear t.cache;Resource.unregister t.cache
  end
