(* The bundled icon table is converted to constants during the build.
   Lookups share those constants without reading or parsing JSON. *)

let rec search name first last =
  if first > last then None else
    let middle = first + (last - first) / 2 in
    let key,value = Icon_data_gen.table.(middle) in
    let comparison = String.compare name key in
    if comparison = 0 then Some value
    else if comparison < 0 then search name first (middle - 1)
    else search name (middle + 1) last

let get name = search name 0 (Array.length Icon_data_gen.table - 1)

let keys () = Array.map fst Icon_data_gen.table

let install () =
  Icon_tabler_data.install
    { get; keys }
