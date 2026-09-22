type t = Re.re

type re_match =
  { groups : string option array
  ; offset : int
  ; last : int }

(* JS \uXXXX escape -> literal UTF-8 bytes (Re.Pcre classes do not
   support \x escapes). Regex metacharacters stay backslash-escaped so
   they keep their literal meaning in both contexts. *)
let translate s =
  let n = String.length s in
  let b = Buffer.create n in
  let is_hex c =
    (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')
  in
  let hex_val i =
    let d c =
      if c >= '0' && c <= '9' then Char.code c - Char.code '0'
      else if c >= 'a' && c <= 'f' then Char.code c - Char.code 'a' + 10
      else Char.code c - Char.code 'A' + 10
    in
    (d s.[i] lsl 12) + (d s.[i + 1] lsl 8) + (d s.[i + 2] lsl 4) + d s.[i + 3]
  in
  let add_codepoint cp =
    if cp < 0x80 then begin
      let c = Char.chr cp in
      if String.contains "[]\\^$.|?*+(){}" c then Buffer.add_char b '\\';
      Buffer.add_char b c
    end else begin
      (* UTF-8 encode *)
      if cp < 0x800 then begin
        Buffer.add_char b (Char.chr (0xC0 lor (cp lsr 6)));
        Buffer.add_char b (Char.chr (0x80 lor (cp land 0x3F)))
      end else if cp < 0x10000 then begin
        Buffer.add_char b (Char.chr (0xE0 lor (cp lsr 12)));
        Buffer.add_char b (Char.chr (0x80 lor ((cp lsr 6) land 0x3F)));
        Buffer.add_char b (Char.chr (0x80 lor (cp land 0x3F)))
      end else begin
        Buffer.add_char b (Char.chr (0xF0 lor (cp lsr 18)));
        Buffer.add_char b (Char.chr (0x80 lor ((cp lsr 12) land 0x3F)));
        Buffer.add_char b (Char.chr (0x80 lor ((cp lsr 6) land 0x3F)));
        Buffer.add_char b (Char.chr (0x80 lor (cp land 0x3F)))
      end
    end
  in
  let rec loop i =
    if i < n then begin
      if
        s.[i] = '\\' && i + 5 < n
        && s.[i + 1] = 'u'
        && is_hex s.[i + 2] && is_hex s.[i + 3] && is_hex s.[i + 4]
        && is_hex s.[i + 5]
      then begin
        add_codepoint (hex_val (i + 2));
        loop (i + 6)
      end else begin
        Buffer.add_char b s.[i];
        loop (i + 1)
      end
    end
  in
  loop 0;
  Buffer.contents b

let compile s =
  Re.compile (Re.Pcre.re ~flags:[ `CASELESS ] (translate s))

let test t s = Re.execp t s

let re_match_of_group g =
  let offset, last = Re.Group.offset g 0 in
  { groups = Array.init (Re.Group.nb_groups g) (Re.Group.get_opt g)
  ; offset
  ; last }

let exec ?(pos = 0) t s =
  Option.map re_match_of_group (Re.exec_opt ~pos t s)

let replace t ~f s =
  match Re.exec_opt t s with
  | None -> s
  | Some g ->
      let match_ = Re.Group.get g 0 in
      let nb = Re.Group.nb_groups g in
      let groups = Array.init nb (fun i -> Re.Group.get_opt g i) in
      let offset, stop = Re.Group.offset g 0 in
      let rep = f ~match_ ~groups ~offset ~input:s in
      String.sub s 0 offset
      ^ rep
      ^ String.sub s stop (String.length s - stop)

let replace_all t ~f s =
  let b = Buffer.create (String.length s) in
  let rec loop pos =
    match Re.exec_opt ~pos t s with
    | None -> Buffer.add_string b (String.sub s pos (String.length s - pos))
    | Some g ->
        let m = re_match_of_group g in
        let match_ =
          match m.groups with [||] -> "" | xs -> Option.value ~default:"" xs.(0)
        in
        Buffer.add_string b (String.sub s pos (m.offset - pos));
        Buffer.add_string b (f ~match_ ~groups:m.groups ~offset:m.offset ~input:s);
        (* empty match: emit one char and advance, as JS /g does *)
        if m.last = m.offset && m.last < String.length s then begin
          Buffer.add_char b s.[m.last];
          loop (m.last + 1)
        end else if m.last > m.offset then loop m.last
  in
  loop 0;
  Buffer.contents b
