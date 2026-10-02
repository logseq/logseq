(* Melange bindings for @dnd-kit/dom 0.5 — the framework-agnostic DOM
   core of dnd-kit (DragDropManager + PointerSensor + Draggable/Droppable
   entities). This is a different API from the React @dnd-kit/core
   package: elements and event payloads flow through as opaque values,
   and the drag lifecycle is consumed through manager.monitor events. *)

type element = Js.Json.t
type manager
type monitor
type draggable
type droppable
type event
type operation

(* ---------- sensors ---------- *)

external pointer_sensor : Js.Json.t = "PointerSensor"
  [@@mel.module "@dnd-kit/dom"]

external keyboard_sensor : Js.Json.t = "KeyboardSensor"
  [@@mel.module "@dnd-kit/dom"]

(* static PointerSensor.configure(options) -> sensor descriptor *)
external sensor_configure : Js.Json.t -> Js.Json.t -> Js.Json.t
  = "configure" [@@mel.send]

external sensor_opts :
  preventActivation:(Js.Json.t -> draggable -> bool) ->
  activationConstraints:(Js.Json.t -> draggable -> Js.Json.t array) ->
  unit ->
  Js.Json.t = "" [@@mel.obj]

external distance_opts : value:float -> unit -> Js.Json.t = "" [@@mel.obj]

(* new PointerActivationConstraints.Distance({value}) *)
external new_distance : Js.Json.t -> Js.Json.t = "Distance"
  [@@mel.new] [@@mel.module "@dnd-kit/dom"]
  [@@mel.scope "PointerActivationConstraints"]

(* ---------- manager ---------- *)

external manager_opts :
  sensors:Js.Json.t array -> unit -> Js.Json.t = "" [@@mel.obj]

external make_manager : Js.Json.t -> manager = "DragDropManager"
  [@@mel.new] [@@mel.module "@dnd-kit/dom"]

external monitor : manager -> monitor = "monitor" [@@mel.get]

(* monitor.addEventListener(name, (event, manager) => ()) -> unlisten *)
(* monitor.addEventListener(name, (event, manager) => ()); the
   returned unlisten handle is intentionally discarded *)
external on :
  monitor ->
  string ->
  (event -> manager -> unit) ->
  unit ->
  unit = "addEventListener" [@@mel.send]

(* ---------- entities ---------- *)

external uuid_data : uuid:string -> unit -> Js.Json.t = "" [@@mel.obj]

external draggable_opts :
  id:string ->
  element:element ->
  data:Js.Json.t ->
  unit ->
  Js.Json.t = "" [@@mel.obj]

external droppable_opts :
  id:string ->
  element:element ->
  data:Js.Json.t ->
  collisionPriority:int ->
  unit ->
  Js.Json.t = "" [@@mel.obj]

external new_draggable : Js.Json.t -> manager -> draggable = "Draggable"
  [@@mel.new] [@@mel.module "@dnd-kit/dom"]

external new_droppable : Js.Json.t -> manager -> droppable = "Droppable"
  [@@mel.new] [@@mel.module "@dnd-kit/dom"]

external destroy_draggable : draggable -> unit = "destroy" [@@mel.send]
external destroy_droppable : droppable -> unit = "destroy" [@@mel.send]

external droppable_element : droppable -> element option = "element"
  [@@mel.get] [@@mel.return nullable]

external entity_uuid : Js.Json.t -> string = "uuid" [@@mel.get]
external entity_data : draggable -> Js.Json.t = "data" [@@mel.get]

(* ---------- event payloads ---------- *)

(* dragstart / dragmove / dragover / dragend event objects *)
external ev_operation : event -> operation = "operation" [@@mel.get]

(* present on every event except dragover *)
external ev_native : event -> Js.Json.t option = "nativeEvent"
  [@@mel.get] [@@mel.return nullable]

external ev_canceled : event -> bool = "canceled" [@@mel.get]

(* DragOperation snapshot fields *)
external op_source : operation -> draggable option = "source"
  [@@mel.get] [@@mel.return nullable]

external op_target : operation -> droppable option = "target"
  [@@mel.get] [@@mel.return nullable]

external op_position : operation -> Js.Json.t = "position" [@@mel.get]
external pos_current : Js.Json.t -> Js.Json.t option = "current"
  [@@mel.get] [@@mel.return nullable]

(* Coordinates / PointerEvent fields on plain objects *)
external pt_x : Js.Json.t -> float = "x" [@@mel.get]
external pt_y : Js.Json.t -> float = "y" [@@mel.get]
external client_y : Js.Json.t -> float = "clientY" [@@mel.get]
external page_x : Js.Json.t -> float = "pageX" [@@mel.get]
