include Rrbvec

let string_concat sep values = String.concat sep (to_list values)

let split_on_char sep value =
  let len = String.length value in
  let rec loop start index acc =
    if index = len then push_back acc (String.sub value start (index - start))
    else if value.[index] = sep then
      let acc = push_back acc (String.sub value start (index - start)) in
      loop (index + 1) (index + 1) acc
    else loop start (index + 1) acc
  in
  loop 0 0 empty
