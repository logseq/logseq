(* Melange bindings for @tanstack/virtual-core — the element-scroller
   Virtualizer used by the LUI virtual list (deps/ui/src/virt/virt_list.ml).

   Mirrors the options surface Virtuoso relies on: a scroll element, item
   size estimation, offset/rect observers wired to the element, and an
   onChange callback. Item indexes are read off the [data-index] DOM
   attribute (the library's default indexAttribute). *)

type element = Js.Json.t

type t

type options

type item

(* Opaque handles for the library's exported helper functions; they are
   passed through into the options record, never called from OCaml. *)
type fn

external element_scroll : fn = "elementScroll"
  [@@mel.module "@tanstack/virtual-core"]

external observe_element_rect : fn = "observeElementRect"
  [@@mel.module "@tanstack/virtual-core"]

external observe_element_offset : fn = "observeElementOffset"
  [@@mel.module "@tanstack/virtual-core"]

external scroll_to_options :
  ?align:string -> ?behavior:string -> unit -> Js.Json.t = "" [@@mel.obj]

(* scrollToFn/observe* are required by VirtualizerOptions — the
   implementations are the library's own element variants above.
   Multi-argument callbacks inside [mel.obj] are emitted uncurried, so
   JS calls apply all args at once. *)
external options :
  count:int ->
  getScrollElement:(unit -> element Js.Nullable.t) ->
  estimateSize:(int -> float) ->
  scrollToFn:fn ->
  observeElementRect:fn ->
  observeElementOffset:fn ->
  onChange:(t -> bool -> unit) ->
  getItemKey:(int -> string) ->
  overscan:int ->
  scrollMargin:float ->
  (* (element, entry, instance) -> size; entry is the
     ResizeObserverEntry when the library observes resizes, undefined in
     the MutationObserver-driven path *)
  ?measureElement:(element -> Js.Json.t -> t -> float) ->
  unit -> options = "" [@@mel.obj]

external make : options -> t = "Virtualizer"
  [@@mel.new] [@@mel.module "@tanstack/virtual-core"]

(* _didMount returns the cleanup fn; _willUpdate (re)binds the scroll
   element and installs observers. Both run once after mount. *)
external did_mount : t -> (unit -> unit) = "_didMount" [@@mel.send]

external will_update : t -> unit = "_willUpdate" [@@mel.send]

external get_virtual_items : t -> item array = "getVirtualItems"
  [@@mel.send]

(* one VirtualItem slot per index (estimate-filled until measured) —
   lets callers read the offset of an item that isn't rendered *)
external measurements_cache : t -> item array = "measurementsCache"
  [@@mel.get]

external get_total_size : t -> float = "getTotalSize" [@@mel.send]

external is_scrolling : t -> bool = "isScrolling" [@@mel.get]

(* Registers [el] (whose [data-index] attr must be its item index) for
   measurement + resize observation; passing null prunes disconnected
   elements from the cache. *)
external measure_element : t -> element Js.Nullable.t -> unit
  = "measureElement" [@@mel.send]

external scroll_to_index : t -> int -> Js.Json.t -> unit
  = "scrollToIndex" [@@mel.send]

external scroll_to_offset : t -> float -> unit = "scrollToOffset"
  [@@mel.send]

(* VirtualItem fields *)
external item_index : item -> int = "index" [@@mel.get]

external item_key : item -> string = "key" [@@mel.get]

external item_start : item -> float = "start" [@@mel.get]

external item_size : item -> float = "size" [@@mel.get]

external item_end : item -> float = "end" [@@mel.get]
