type 'a t

val empty : 'a t
val init : int -> (int -> 'a) -> 'a t
val of_array : 'a array -> 'a t
val to_array : 'a t -> 'a array
val length : 'a t -> int
val nth : 'a t -> int -> ('a, string) result
val set : 'a t -> int -> 'a -> ('a t, string) result
val push_back : 'a t -> 'a -> 'a t
val map : ('a -> 'b) -> 'a t -> 'b t
val equal : ('a -> 'a -> bool) -> 'a t -> 'a t -> bool
