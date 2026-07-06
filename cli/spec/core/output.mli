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

  val to_string : t -> string
  (** format as table.
      - columns need to be aligned
      - empty row value display as '-'
      - humanize created-at/updated-at *)
end

type _ t =
  | Human : Human_output.t -> human t
  | Edn : Melange_edn_melange.any -> edn t
  | Json : Melange_edn_melange.any -> json t
