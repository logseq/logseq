type 'a t = 'a Rrbvec.t

let empty = Rrbvec.empty
let init = Rrbvec.init
let of_array = Rrbvec.of_array
let to_array = Rrbvec.to_array
let length = Rrbvec.length

let index_error values index =
  Printf.sprintf "index %d is outside vector length %d" index (length values)

let nth values index =
  match Rrbvec.nth_opt values index with
  | Some value -> Ok value
  | None -> Error (index_error values index)

let set values index value =
  if index < 0 || index >= length values then Error (index_error values index)
  else Ok (Rrbvec.set values index value)

let push_back = Rrbvec.push_back
let map = Rrbvec.map
let equal = Rrbvec.equal
