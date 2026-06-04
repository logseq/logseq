type human
type json
type edn

module Mode : sig
  type _ t = Human : human t | Json : json t | Edn : edn t
  and packed = Packed : _ t -> packed

  val default : human t
  val of_string : string -> packed option
  val to_string : 'a t -> string
  val structured : 'a t -> bool
end

module Human_output : sig
  type t

  val create :
    ?headers:string list -> ?footer:string -> rows:string list list -> unit -> t

  val pp : Format.formatter -> t -> unit
  (* format as table.
     - columns need to be aligned
     - empty row value display as '-'
     - humanize created-at/updated-at
  *)
end

type _ t =
  | Human : Human_output.t -> human t
  | Edn : Edn_ocaml.any -> edn t
  | Json : Edn_ocaml.any -> json t
