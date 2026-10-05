(* ported from deps/ui/src/core/sprintf.ml — see apple/NOTES.md *)
(* Minimal Printf.sprintf replacement: a small interpreter over the
   CamlinternalFormatBasics fmt GADT covering the directives this
   codebase uses (%s %S %c %C %d %i %u %x %X %o %b %f %e %g %F %Ld %%
   plus padding/precision in literal or argument form). Using
   Stdlib.Printf would drag the full camlinternalFormat interpreter
   (~215KB emitted) into the bundle; this is a ~200-line subset ported
   from camlinternalFormat.ml. Unsupported directives raise
   Invalid_argument at the first sprintf call. *)

open CamlinternalFormatBasics

external format_float : string -> float -> string = "caml_format_float"
external format_int : string -> int -> string = "caml_format_int"
external format_int32 : string -> int32 -> string = "caml_int32_format"
external format_nativeint : string -> nativeint -> string
  = "caml_nativeint_format"
external format_int64 : string -> int64 -> string = "caml_int64_format"

let unsupported what =
  invalid_arg ("Sprintf: unsupported conversion " ^ what)

let fix_padding padty width str =
  let len = String.length str in
  let width, padty =
    ( abs width
    , (* dynamic widths may be negative: pad to the left *)
      if width < 0 then Left else padty )
  in
  if width <= len then str
  else
    let res = Bytes.make width (if padty = Zeros then '0' else ' ') in
    (match padty with
     | Left -> String.blit str 0 res 0 len
     | Right -> String.blit str 0 res (width - len) len
     | Zeros
       when len > 0 && (str.[0] = '+' || str.[0] = '-' || str.[0] = ' ')
       ->
         Bytes.set res 0 str.[0];
         String.blit str 1 res (width - len + 1) (len - 1)
     | Zeros
       when len > 1 && str.[0] = '0' && (str.[1] = 'x' || str.[1] = 'X')
       ->
         Bytes.set res 1 str.[1];
         String.blit str 2 res (width - len + 2) (len - 2)
     | Zeros -> String.blit str 0 res (width - len) len);
    Bytes.unsafe_to_string res

let fix_int_precision prec str =
  let prec = abs prec in
  let len = String.length str in
  match str.[0] with
  | ('+' | '-' | ' ') as c when prec + 1 > len ->
      let res = Bytes.make (prec + 1) '0' in
      Bytes.set res 0 c;
      String.blit str 1 res (prec - len + 2) (len - 1);
      Bytes.unsafe_to_string res
  | '0' when prec + 2 > len && len > 1 && (str.[1] = 'x' || str.[1] = 'X')
    ->
      let res = Bytes.make (prec + 2) '0' in
      Bytes.set res 1 str.[1];
      String.blit str 2 res (prec - len + 4) (len - 2);
      Bytes.unsafe_to_string res
  | '0' .. '9' | 'a' .. 'f' | 'A' .. 'F' when prec > len ->
      let res = Bytes.make prec '0' in
      String.blit str 0 res (prec - len) len;
      Bytes.unsafe_to_string res
  | _ -> str

(* %# conversions insert '_' thousand separators *)
let transform_int_alt iconv s =
  match iconv with
  | Int_Cd | Int_Ci | Int_Cu ->
      let digits =
        let n = ref 0 in
        for i = 0 to String.length s - 1 do
          match String.unsafe_get s i with
          | '0' .. '9' -> incr n
          | _ -> ()
        done;
        !n
      in
      let buf = Bytes.create (String.length s + ((digits - 1) / 3)) in
      let pos = ref 0 in
      let put c =
        Bytes.set buf !pos c;
        incr pos
      in
      let left = ref ((digits mod 3) + 1) in
      for i = 0 to String.length s - 1 do
        match String.unsafe_get s i with
        | '0' .. '9' as c ->
            if !left = 0 then (
              put '_';
              left := 3);
            decr left;
            put c
        | c -> put c
      done;
      Bytes.unsafe_to_string buf
  | _ -> s

let format_of_iconv = function
  | Int_d | Int_Cd -> "%d"
  | Int_pd -> "%+d"
  | Int_sd -> "% d"
  | Int_i | Int_Ci -> "%i"
  | Int_pi -> "%+i"
  | Int_si -> "% i"
  | Int_x -> "%x"
  | Int_Cx -> "%#x"
  | Int_X -> "%X"
  | Int_CX -> "%#X"
  | Int_o -> "%o"
  | Int_Co -> "%#o"
  | Int_u | Int_Cu -> "%u"

let format_of_iconvL = function
  | Int_d | Int_Cd -> "%Ld"
  | Int_pd -> "%+Ld"
  | Int_sd -> "% Ld"
  | Int_i | Int_Ci -> "%Li"
  | Int_pi -> "%+Li"
  | Int_si -> "% Li"
  | Int_x -> "%Lx"
  | Int_Cx -> "%#Lx"
  | Int_X -> "%LX"
  | Int_CX -> "%#LX"
  | Int_o -> "%Lo"
  | Int_Co -> "%#Lo"
  | Int_u | Int_Cu -> "%Lu"

let format_of_iconvl = function
  | Int_d | Int_Cd -> "%ld"
  | Int_pd -> "%+ld"
  | Int_sd -> "% ld"
  | Int_i | Int_Ci -> "%li"
  | Int_pi -> "%+li"
  | Int_si -> "% li"
  | Int_x -> "%lx"
  | Int_Cx -> "%#lx"
  | Int_X -> "%lX"
  | Int_CX -> "%#lX"
  | Int_o -> "%lo"
  | Int_Co -> "%#lo"
  | Int_u | Int_Cu -> "%lu"

let format_of_iconvn = function
  | Int_d | Int_Cd -> "%nd"
  | Int_pd -> "%+nd"
  | Int_sd -> "% nd"
  | Int_i | Int_Ci -> "%ni"
  | Int_pi -> "%+ni"
  | Int_si -> "% ni"
  | Int_x -> "%nx"
  | Int_Cx -> "%#nx"
  | Int_X -> "%nX"
  | Int_CX -> "%#nX"
  | Int_o -> "%no"
  | Int_Co -> "%#no"
  | Int_u | Int_Cu -> "%nu"

let convert_int iconv n =
  transform_int_alt iconv (format_int (format_of_iconv iconv) n)

let convert_int32 iconv n =
  transform_int_alt iconv (format_int32 (format_of_iconvl iconv) n)

let convert_nativeint iconv n =
  transform_int_alt iconv
    (format_nativeint (format_of_iconvn iconv) n)

let convert_int64 iconv n =
  transform_int_alt iconv (format_int64 (format_of_iconvL iconv) n)

let default_float_precision fconv =
  match snd fconv with
  | Float_f | Float_e | Float_E | Float_g | Float_G | Float_h | Float_H
  | Float_CF ->
      -6
  | Float_F -> 12

let char_of_fconv fconv =
  match snd fconv with
  | Float_f -> 'f'
  | Float_e -> 'e'
  | Float_E -> 'E'
  | Float_g -> 'g'
  | Float_G -> 'G'
  | Float_F -> 'F'
  | Float_h -> 'h'
  | Float_H -> 'H'
  | Float_CF -> 'F'

let format_of_fconv fconv prec =
  let symb = char_of_fconv fconv in
  let flag =
    match fst fconv with
    | Float_flag_p -> "+"
    | Float_flag_s -> " "
    | Float_flag_ -> ""
  in
  "%" ^ flag ^ "." ^ string_of_int (abs prec) ^ String.make 1 symb

let convert_float fconv prec x =
  let caml_special_val str =
    match classify_float x with
    | FP_normal | FP_subnormal | FP_zero -> str
    | FP_infinite -> if x < 0.0 then "neg_infinity" else "infinity"
    | FP_nan -> "nan"
  in
  match snd fconv with
  | Float_h | Float_H | Float_CF -> unsupported "%h/%H/%F"
  | Float_F ->
      let str = format_float (format_of_fconv fconv prec) x in
      let len = String.length str in
      let rec is_valid i =
        i < len
        && (match str.[i] with
           | '.' | 'e' | 'E' -> true
           | _ -> is_valid (i + 1))
      in
      caml_special_val (if is_valid 0 then str else str ^ ".")
  | Float_f | Float_e | Float_E | Float_g | Float_G ->
      format_float (format_of_fconv fconv prec) x

let to_caml_string str = "\"" ^ String.escaped str ^ "\""

let caml_char c = "'" ^ Char.escaped c ^ "'"

let rec go : type a c d e f.
    (string -> f) -> Buffer.t -> (a, unit, c, d, e, f) fmt -> a =
  fun k b fmt ->
  match fmt with
  | Char rest ->
      fun c ->
        Buffer.add_char b c;
        go k b rest
  | Caml_char rest ->
      fun c ->
        Buffer.add_string b (caml_char c);
        go k b rest
  | String (pad, rest) -> arg_case k b rest pad (fun s -> s)
  | Caml_string (pad, rest) -> arg_case k b rest pad to_caml_string
  | Int (iconv, pad, prec, rest) ->
      int_case k b rest pad prec convert_int iconv
  | Int32 (iconv, pad, prec, rest) ->
      int_case k b rest pad prec convert_int32 iconv
  | Nativeint (iconv, pad, prec, rest) ->
      int_case k b rest pad prec convert_nativeint iconv
  | Int64 (iconv, pad, prec, rest) ->
      int_case k b rest pad prec convert_int64 iconv
  | Float (fconv, pad, prec, rest) ->
      float_case k b rest pad prec fconv
  | Bool (pad, rest) -> arg_case k b rest pad string_of_bool
  | Flush rest -> go k b rest
  | String_literal (str, rest) ->
      Buffer.add_string b str;
      go k b rest
  | Char_literal (chr, rest) ->
      Buffer.add_char b chr;
      go k b rest
  | Formatting_lit (Escaped_percent, rest) ->
      Buffer.add_char b '%';
      go k b rest
  | Formatting_lit (Escaped_at, rest) ->
      Buffer.add_char b '@';
      go k b rest
  | Formatting_lit (_, rest) -> go k b rest
  | Scan_get_counter (_, rest) ->
      (* printf accepts %l %n %L as %u for backward compatibility *)
      fun n ->
        Buffer.add_string b (format_int "%u" n);
        go k b rest
  | Scan_next_char rest ->
      fun c ->
        Buffer.add_char b c;
        go k b rest
  | Ignored_param _ -> unsupported "%_"
  | Reader _ | Format_arg _ | Format_subst _ | Scan_char_set _
  | Custom _ | Alpha _ | Theta _ | Formatting_gen _ ->
      unsupported "spec"
  | End_of_format -> k (Buffer.contents b)

and arg_case : type x y a c d e f.
    (string -> f) ->
    Buffer.t ->
    (a, unit, c, d, e, f) fmt ->
    (x, y -> a) padding ->
    (y -> string) ->
    x =
  fun k b rest pad trans ->
  match pad with
  | No_padding ->
      fun x ->
        Buffer.add_string b (trans x);
        go k b rest
  | Lit_padding (padty, w) ->
      fun x ->
        Buffer.add_string b (fix_padding padty w (trans x));
        go k b rest
  | Arg_padding padty ->
      fun w x ->
        Buffer.add_string b (fix_padding padty w (trans x));
        go k b rest

and int_case : type x y z a c d e f.
    (string -> f) ->
    Buffer.t ->
    (a, unit, c, d, e, f) fmt ->
    (x, y) padding ->
    (y, z -> a) precision ->
    (int_conv -> z -> string) ->
    int_conv ->
    x =
  fun k b rest pad prec trans iconv ->
  match (pad, prec) with
  | No_padding, No_precision ->
      fun n ->
        Buffer.add_string b (trans iconv n);
        go k b rest
  | No_padding, Lit_precision p ->
      fun n ->
        Buffer.add_string b (fix_int_precision p (trans iconv n));
        go k b rest
  | No_padding, Arg_precision ->
      fun p n ->
        Buffer.add_string b (fix_int_precision p (trans iconv n));
        go k b rest
  | Lit_padding (padty, w), No_precision ->
      fun n ->
        Buffer.add_string b (fix_padding padty w (trans iconv n));
        go k b rest
  | Lit_padding (padty, w), Lit_precision p ->
      fun n ->
        Buffer.add_string b
          (fix_padding padty w (fix_int_precision p (trans iconv n)));
        go k b rest
  | Lit_padding (padty, w), Arg_precision ->
      fun p n ->
        Buffer.add_string b
          (fix_padding padty w (fix_int_precision p (trans iconv n)));
        go k b rest
  | Arg_padding padty, No_precision ->
      fun w n ->
        Buffer.add_string b (fix_padding padty w (trans iconv n));
        go k b rest
  | Arg_padding padty, Lit_precision p ->
      fun w n ->
        Buffer.add_string b
          (fix_padding padty w (fix_int_precision p (trans iconv n)));
        go k b rest
  | Arg_padding padty, Arg_precision ->
      fun w p n ->
        Buffer.add_string b
          (fix_padding padty w (fix_int_precision p (trans iconv n)));
        go k b rest

and float_case : type x y a c d e f.
    (string -> f) ->
    Buffer.t ->
    (a, unit, c, d, e, f) fmt ->
    (x, y) padding ->
    (y, float -> a) precision ->
    float_conv ->
    x =
  fun k b rest pad prec fconv ->
  match (pad, prec) with
  | No_padding, No_precision ->
      fun x ->
        Buffer.add_string b
          (convert_float fconv (default_float_precision fconv) x);
        go k b rest
  | No_padding, Lit_precision p ->
      fun x ->
        Buffer.add_string b (convert_float fconv p x);
        go k b rest
  | No_padding, Arg_precision ->
      fun p x ->
        Buffer.add_string b (convert_float fconv p x);
        go k b rest
  | Lit_padding (padty, w), No_precision ->
      fun x ->
        Buffer.add_string b
          (fix_padding padty w
             (convert_float fconv (default_float_precision fconv) x));
        go k b rest
  | Lit_padding (padty, w), Lit_precision p ->
      fun x ->
        Buffer.add_string b
          (fix_padding padty w (convert_float fconv p x));
        go k b rest
  | Lit_padding (padty, w), Arg_precision ->
      fun p x ->
        Buffer.add_string b
          (fix_padding padty w (convert_float fconv p x));
        go k b rest
  | Arg_padding padty, No_precision ->
      fun w x ->
        Buffer.add_string b
          (fix_padding padty w
             (convert_float fconv (default_float_precision fconv) x));
        go k b rest
  | Arg_padding padty, Lit_precision p ->
      fun w x ->
        Buffer.add_string b
          (fix_padding padty w (convert_float fconv p x));
        go k b rest
  | Arg_padding padty, Arg_precision ->
      fun w p x ->
        Buffer.add_string b
          (fix_padding padty w (convert_float fconv p x));
        go k b rest

let ksprintf k (Format (fmt, _) : ('a, unit, 'r, 'r) format4) : 'a =
  go k (Buffer.create 64) fmt

let sprintf fmt = ksprintf (fun s -> s) fmt

let bprintf buf fmt = ksprintf (Buffer.add_string buf) fmt

let fprintf oc fmt = ksprintf (Stdlib.output_string oc) fmt

let eprintf fmt = fprintf Stdlib.stderr fmt

let printf fmt = fprintf Stdlib.stdout fmt

(* ignored-output variants kept for the Stdlib.Printf surface — the
   vite printf.js shim re-exports them *)
let ifprintf _ fmt = ksprintf (fun _ -> ()) fmt

let ibprintf _ fmt = ksprintf (fun _ -> ()) fmt

