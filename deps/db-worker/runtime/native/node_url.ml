type t = string

(* js/URL path+search parsing — path before '?', params split on '&'. *)
let parse ~base:_ s = s

let pathname t =
  match String.index_opt t '?' with
  | Some i -> String.sub t 0 i
  | None -> t

let search_param t key =
  match String.index_opt t '?' with
  | None -> None
  | Some i ->
      let params = String.sub t (i + 1) (String.length t - i - 1) in
      let prefix = key ^ "=" in
      let rec find = function
        | [] -> None
        | part :: rest ->
            if String.length part >= String.length prefix
               && String.sub part 0 (String.length prefix) = prefix
            then
              Some (String.sub part (String.length prefix)
                      (String.length part - String.length prefix))
            else find rest
      in
      find (String.split_on_char '&' params)
