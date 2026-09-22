(* Port of logseq.clj-fractional-indexing (used by
   logseq.db.common.order/db-order). Original algorithm:
   https://github.com/rocicorp/fractional-indexing *)

let base62_digits =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

let get_integer_length (head : char) : int =
  if head >= 'a' && head <= 'z' then Char.code head - Char.code 'a' + 2
  else if head >= 'A' && head <= 'Z' then Char.code 'Z' - Char.code head + 2
  else invalid_arg (Printf.sprintf "invalid order key head: %c" head)

let validate_integer (s : string) : unit =
  if String.length s <> get_integer_length s.[0] then
    invalid_arg ("invalid integer part of order key: " ^ s)

let str_slice ?(fin : int option) (s : string) (start : int) : string =
  let n = String.length s in
  let fin = match fin with Some f -> f | None -> n in
  if n >= start && n >= fin && fin > start then String.sub s start (fin - start)
  else ""

let get_integer_part (key : string) : string =
  let len = get_integer_length key.[0] in
  if len > String.length key then invalid_arg ("invalid order key: " ^ key)
  else str_slice key 0 ~fin:len

let validate_order_key (key : string) (digits : string) : unit =
  if key = "A" ^ String.make 26 digits.[0] then
    invalid_arg ("invalid order key: " ^ key);
  let i = get_integer_part key in
  let f = str_slice key (String.length i) in
  if String.length f > 0 && f.[String.length f - 1] = digits.[0] then
    invalid_arg ("invalid order key: " ^ key)

let index_of (digits : string) (c : char) : int =
  match String.index_opt digits c with
  | Some i -> i
  | None -> invalid_arg "digit not in alphabet"

(* cljs reduce over reversed digits with carry *)
let increment_integer (x : string) (digits : string) : string option =
  validate_integer x;
  let head = x.[0] in
  let digs = String.sub x 1 (String.length x - 1) in
  let carry = ref true in
  let diff = ref [] in
  for i = String.length digs - 1 downto 0 do
    if !carry then begin
      let d = index_of digits digs.[i] + 1 in
      if d = String.length digits then
        diff := digits.[0] :: !diff
      else begin
        carry := false;
        diff := digits.[d] :: !diff
      end
    end
  done;
  (* !diff is already in forward order (prepended while iterating
     right-to-left); cljs keeps the untouched prefix then the suffix. *)
  let digs' =
    String.sub digs 0 (String.length digs - List.length !diff)
    ^ (List.to_seq !diff |> String.of_seq)
  in
  if !carry then
    if head = 'Z' then Some ("a" ^ String.make 1 digits.[0])
    else if head = 'z' then None
    else
      let h = Char.chr (Char.code head + 1) in
      let digs'' =
        if h > 'a' then digs' ^ String.make 1 digits.[0]
        else if String.length digs' > 0
        then String.sub digs' 0 (String.length digs' - 1)
        else digs'
      in
      Some (String.make 1 h ^ digs'')
  else Some (String.make 1 head ^ digs')

let decrement_integer (x : string) (digits : string) : string option =
  validate_integer x;
  let head = x.[0] in
  let digs = String.sub x 1 (String.length x - 1) in
  let borrow = ref true in
  let acc = ref [] in
  for i = String.length digs - 1 downto 0 do
    if !borrow then begin
      let d = index_of digits digs.[i] - 1 in
      if d = -1 then acc := digits.[String.length digits - 1] :: !acc
      else begin
        borrow := false;
        acc := digits.[d] :: !acc
      end
    end else
      (* cljs appends the untouched digit once borrow is resolved *)
      acc := digs.[i] :: !acc
  done;
  (* !acc holds every digit in forward order = cljs new-digs *)
  let combined = List.to_seq !acc |> String.of_seq in
  if !borrow then
    if head = 'a' then Some ("Z" ^ String.make 1 (digits.[String.length digits - 1]))
    else if head = 'A' then None
    else
      let h = Char.chr (Char.code head - 1) in
      let digs'' =
        if h < 'Z' then combined ^ String.make 1 (digits.[String.length digits - 1])
        else if String.length combined > 0
        then String.sub combined 0 (String.length combined - 1)
        else combined
      in
      Some (String.make 1 h ^ digs'')
  else Some (String.make 1 head ^ combined)

let rec midpoint (a : string) (b : string option) (digits : string) : string =
  let zero = digits.[0] in
  (match b with
   | Some b when String.compare a b >= 0 ->
       invalid_arg (a ^ " >= " ^ b)
   | _ -> ());
  (match b with
   | Some b when
       (String.length a > 0 && a.[String.length a - 1] = zero)
       || (String.length b > 0 && b.[String.length b - 1] = zero) ->
       invalid_arg " trailing zero"
   | _ -> ());
  let n =
    match b with
    | None -> None
    | Some b ->
        let rec first_diff i =
          if i >= String.length b then None
          else if (if i < String.length a then a.[i] else zero) <> b.[i]
          then Some i
          else first_diff (i + 1)
        in
        first_diff 0
  in
  match n with
  | Some n when n > 0 ->
      (match b with
       | Some b ->
           str_slice b 0 ~fin:n
           ^ midpoint (str_slice a n) (Some (str_slice b n)) digits
       | None -> assert false)
  | _ ->
      let digit_a =
        if String.length a > 0 then index_of digits a.[0] else 0
      in
      let digit_b =
        match b with
        | Some b -> index_of digits b.[0]
        | None -> String.length digits
      in
      if digit_b - digit_a > 1 then
        String.make 1 digits.[int_of_float (Float.of_int (digit_a + digit_b) *. 0.5 +. 0.5)]
      else
        (match b with
         | Some b when String.length b > 1 -> str_slice b 0 ~fin:1
         | _ ->
             String.make 1 digits.[digit_a]
             ^ midpoint (str_slice a 1) None digits)

let generate_key_between ?(digits : string = base62_digits)
    (a : string option) (b : string option) : string =
  (match a with Some a -> validate_order_key a digits | None -> ());
  (match b with Some b -> validate_order_key b digits | None -> ());
  (match (a, b) with
   | Some a, Some b when String.compare a b >= 0 ->
       invalid_arg (a ^ " >= " ^ b)
   | _ -> ());
  let result =
    match (a, b) with
    | None, None -> "a" ^ String.make 1 digits.[0]
    | None, Some b ->
        let ib = get_integer_part b in
        let fb = str_slice b (String.length ib) in
        if ib = "A" ^ String.make 26 digits.[0] then
          ib ^ midpoint "" (Some fb) digits
        else if String.compare ib b < 0 then
          ib ^ midpoint "" (Some fb) digits
        else
          (match decrement_integer ib digits with
           | Some res -> res
           | None -> invalid_arg "cannot decrement any more")
    | Some a, None ->
        let ia = get_integer_part a in
        let fa = str_slice a (String.length ia) in
        (match increment_integer ia digits with
         | Some i -> i
         | None -> ia ^ midpoint fa None digits)
    | Some a, Some b ->
        let ia = get_integer_part a in
        let fa = str_slice a (String.length ia) in
        let ib = get_integer_part b in
        let fb = str_slice b (String.length ib) in
        if ia = ib then ia ^ midpoint fa (Some fb) digits
        else
          (match increment_integer ia digits with
           | None -> invalid_arg "cannot increment any more"
           | Some i ->
               if String.compare i b < 0 then i
               else ia ^ midpoint fa None digits)
  in
  (match (a, b) with
   | Some a, _ when String.compare a result >= 0 ->
       invalid_arg "generate-key-between failed"
   | _, Some b when String.compare result b >= 0 ->
       invalid_arg "generate-key-between failed"
   | _ -> ());
  result

let rec generate_n_keys_between ?(digits : string = base62_digits)
    (a : string option) (b : string option) (n : int) : string list =
  match n with
  | _ when n = 0 -> []
  | _ when n = 1 -> [ generate_key_between ~digits a b ]
  | _ when b = None ->
      let rec go col =
        if List.length col >= n then col
        else
          let last = match List.rev col with l :: _ -> Some l | [] -> a in
          go (col @ [ generate_key_between ~digits last b ])
      in
      go []
  | _ when a = None ->
      let rec go col =
        if List.length col >= n then col
        else
          let last = match List.rev col with l :: _ -> Some l | [] -> b in
          go (col @ [ generate_key_between ~digits a last ])
      in
      List.rev (go [])
  | _ ->
      let mid = n / 2 in
      let c = generate_key_between ~digits a b in
      generate_n_keys_between ~digits a (Some c) mid
      @ [ c ]
      @ generate_n_keys_between ~digits (Some c) b (n - mid - 1)

(* db-order/gen-key *)
(* db-order/*max-key — global highest key seen; 0-arity gen-key starts
   from it instead of nil so keys stay monotonic across calls. *)
let max_key : string option ref = ref None

let reset_max_key ?(max_key_atom = max_key) (key : string option) : unit =
  match key with
  | Some k ->
    (match !max_key_atom with
     | Some cur when String.compare k cur <= 0 -> ()
     | _ -> max_key_atom := Some k)
  | None -> ()

(* cljs gen-key 2-arity: explicit start (nil means nil, not *max-key);
   always updates *max-key. *)
let gen_key ?(max_key_atom = max_key) (start : string option) (end_ : string option)
    : string =
  let k = generate_key_between start end_ in
  reset_max_key ~max_key_atom (Some k);
  k

(* cljs gen-key 0/1-arity: starts from *max-key when start not given. *)
let gen_key_from_max ?(max_key_atom = max_key) ?(end_ : string option) () : string =
  gen_key ~max_key_atom !max_key_atom end_

let gen_n_keys ?(max_key_atom = max_key) (n : int) (start : string option)
    (end_ : string option) : string list =
  let ks =
    generate_n_keys_between start end_ n |> fun l ->
    List.filteri (fun i _ -> i < n) l
  in
  (match List.rev ks with
   | last :: _ -> reset_max_key ~max_key_atom (Some last)
   | [] -> ());
  ks

(* db-order/get-max-order — last :block/order value in the avet index. *)
let get_max_order db : string option =
  match Seq.uncons (Datascript.rseek_datoms db Avet ~a:"block/order" ()) with
  | Some (d, _) -> (match d.Datascript.v with String s -> Some s | _ -> None)
  | None -> None
