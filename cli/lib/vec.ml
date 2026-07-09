type 'a t = 'a Rrbvec.t

let empty = Rrbvec.empty
let is_empty = Rrbvec.is_empty
let length = Rrbvec.length
let nth = Rrbvec.nth
let nth_opt = Rrbvec.nth_opt
let map = Rrbvec.map
let mapi = Rrbvec.mapi
let map2 = Rrbvec.map2
let filter = Rrbvec.filter
let filter_map = Rrbvec.filter_map
let concat_map = Rrbvec.concat_map
let fold_left = Rrbvec.fold_left
let fold_right = Rrbvec.fold_right
let exists = Rrbvec.exists
let for_all = Rrbvec.for_all
let find = Rrbvec.find
let find_opt = Rrbvec.find_opt
let find_map = Rrbvec.find_map
let mem = Rrbvec.mem
let iter = Rrbvec.iter
let iteri = Rrbvec.iteri
let rev = Rrbvec.rev
let init = Rrbvec.init
let sort = Rrbvec.sort
let sort_uniq = Rrbvec.sort_uniq
let partition = Rrbvec.partition
let combine = Rrbvec.combine
let append = Rrbvec.append
let to_list = Rrbvec.to_list
let of_array = Rrbvec.of_array
let to_array = Rrbvec.to_array
let push_back = Rrbvec.push_back
let push_front = Rrbvec.push_front
let pop_front = Rrbvec.pop_front
let peek_front = Rrbvec.peek_front
let singleton value = Rrbvec.push_back Rrbvec.empty value
let rev_append values tail = Rrbvec.append (Rrbvec.rev values) tail
let string_concat sep values = String.concat sep (Rrbvec.to_list values)

let hd values =
  match Rrbvec.peek_front values with
  | Some value -> value
  | None -> raise (Failure "hd")

let assoc_opt key values =
  Rrbvec.find_map
    (fun (candidate, value) -> if candidate = key then Some value else None)
    values

let mem_assoc key values =
  Rrbvec.exists (fun (candidate, _) -> candidate = key) values

let remove_assoc key values =
  Rrbvec.filter (fun (candidate, _) -> candidate <> key) values

let to_seq values =
  let len = Rrbvec.length values in
  Seq.unfold
    (fun index ->
      if index >= len then None else Some (Rrbvec.nth values index, index + 1))
    0

let of_seq values =
  Seq.fold_left
    (fun acc value -> Rrbvec.push_back acc value)
    Rrbvec.empty values

let split_on_char sep value =
  let len = String.length value in
  let rec loop start index acc =
    if index = len then
      Rrbvec.push_back acc (String.sub value start (index - start))
    else if value.[index] = sep then
      let acc = Rrbvec.push_back acc (String.sub value start (index - start)) in
      loop (index + 1) (index + 1) acc
    else loop start (index + 1) acc
  in
  loop 0 0 Rrbvec.empty
