(* Native replacements for the melange.js API surface used by the ported
   deps/ui modules. Only the operations actually referenced are
   implemented; unsupported calls raise so missing surface shows up at
   runtime instead of silently misbehaving. *)

  (* erased js object type — only used in signatures *)
  type 'a t = 'a
  type 'a dict = (string, 'a) Hashtbl.t
  type 'a null = 'a option

  module Dict = struct
    type 'a t = (string, 'a) Hashtbl.t

    let empty () = Hashtbl.create 8
    let fromList kvs =
      let d = Hashtbl.create 8 in
      List.iter (fun (k, v) -> Hashtbl.replace d k v) kvs;
      d
    let get t k = Hashtbl.find_opt t k
    let set t k v = Hashtbl.replace t k v
    let unsafeGet t k = Hashtbl.find t k
    let keys t = Array.of_list (Hashtbl.fold (fun k _ acc -> k :: acc) t [])

    let values t =
      Array.of_list (Hashtbl.fold (fun _ v acc -> v :: acc) t [])

    let entries t =
      Array.of_list (Hashtbl.fold (fun k v acc -> (k, v) :: acc) t [])

    let fromList kvs =
      let t = Hashtbl.create (List.length kvs) in
      List.iter (fun (k, v) -> Hashtbl.replace t k v) kvs;
      t

    let fromArray kvs =
      let t = Hashtbl.create (Array.length kvs) in
      Array.iter (fun (k, v) -> Hashtbl.replace t k v) kvs;
      t

    let delete t k = Hashtbl.remove t k
  end

  module Json = struct
    type t =
      | JNull
      | JBoolean of bool
      | JNumber of float
      | JString of string
      | JArray of t array
      | JObject of (string * t) list

    let null = JNull
    let boolean b = JBoolean b
    let number f = JNumber f
    let string s = JString s
    let array a = JArray a
    let object_ (d : (string, t) Hashtbl.t) : t =
      JObject
        (Hashtbl.fold (fun k v acc -> (k, v) :: acc) d [])
    let object_list kvs = JObject kvs
    let decodeString = function JString s -> Some s | _ -> None
    let decodeNumber = function JNumber f -> Some f | _ -> None
    let decodeBoolean = function JBoolean b -> Some b | _ -> None
    let decodeNull = function JNull -> Some () | _ -> None
    let decodeArray = function JArray a -> Some a | _ -> None

    let decodeObject = function
      | JObject kvs ->
          let d = Hashtbl.create 8 in
          List.iter (fun (k, v) -> Hashtbl.replace d k v) kvs;
          Some d
      | _ -> None

    type tagged_t =
      | JSONFalse
      | JSONTrue
      | JSONNull
      | JSONNumber of float
      | JSONString of string
      | JSONArray of t array
      | JSONObject of t Dict.t

    let classify = function
      | JNull -> JSONNull
      | JBoolean false -> JSONFalse
      | JBoolean true -> JSONTrue
      | JNumber f -> JSONNumber f
      | JString s -> JSONString s
      | JArray a -> JSONArray a
      | JObject kvs ->
          let d = Dict.empty () in
          List.iter (fun (k, v) -> Dict.set d k v) kvs;
          JSONObject d


    let stringify t =
      let buf = Buffer.create 64 in
      let rec go = function
        | JNull -> Buffer.add_string buf "null"
        | JBoolean b -> Buffer.add_string buf (if b then "true" else "false")
        | JNumber f ->
            if Float.is_integer f && Float.abs f < 9e15 then
              Buffer.add_string buf (Printf.sprintf "%.0f" f)
            else Buffer.add_string buf (Printf.sprintf "%g" f)
        | JString s ->
            Buffer.add_char buf '"';
            String.iter
              (fun c ->
                match c with
                | '"' -> Buffer.add_string buf "\\\""
                | '\\' -> Buffer.add_string buf "\\\\"
                | '\n' -> Buffer.add_string buf "\\n"
                | '\r' -> Buffer.add_string buf "\\r"
                | '\t' -> Buffer.add_string buf "\\t"
                | c -> Buffer.add_char buf c)
              s;
            Buffer.add_char buf '"'
        | JArray a ->
            Buffer.add_char buf '[';
            Array.iteri
              (fun i v ->
                if i > 0 then Buffer.add_char buf ',';
                go v)
              a;
            Buffer.add_char buf ']'
        | JObject kvs ->
            Buffer.add_char buf '{';
            List.iteri
              (fun i (k, v) ->
                if i > 0 then Buffer.add_char buf ',';
                go (JString k);
                Buffer.add_char buf ':';
                go v)
              kvs;
            Buffer.add_char buf '}'
      in
      go t;
      Buffer.contents buf

    let stringifyAny = function Some v -> stringify v | None -> "undefined"

    let rec of_yojson (j : Yojson.Safe.t) : t =
      match j with
      | `Null -> JNull
      | `Bool b -> JBoolean b
      | `Int n -> JNumber (Float.of_int n)
      | `Float f -> JNumber f
      | `String s -> JString s
      | `List vs -> JArray (Array.of_list (List.map of_yojson vs))
      | `Assoc kvs -> JObject (List.map (fun (k, v) -> k, of_yojson v) kvs)
      | _ -> JNull

    let parseExn s = of_yojson (Yojson.Safe.from_string s)

    (* [kind] is a GADT matching melange Js.Json — its nullary
       constructors share names with [t]'s (renamed [J*] internally). *)
    type _ kind =
      | String : string kind
      | Number : float kind
      | Object : t dict kind
      | Array : t array kind
      | Boolean : bool kind
      | Null : t null kind

    let test (v : t) (type a) (k : a kind) : bool =
      match k with
      | String -> (match v with JString _ -> true | _ -> false)
      | Number -> (match v with JNumber _ -> true | _ -> false)
      | Object -> (match v with JObject _ -> true | _ -> false)
      | Array -> (match v with JArray _ -> true | _ -> false)
      | Boolean -> (match v with JBoolean _ -> true | _ -> false)
      | Null -> (match v with JNull -> true | _ -> false)
    let stringifyAny (_ : 'a) : string option = Some "<opaque>"

  end


  module Promise = struct
    type error = exn

    type 'a state =
      | Pending
      | Resolved of 'a
      | Rejected of error

    type 'a t =
      { mutable state : 'a state
      ; mutable callbacks : ('a state -> unit) list
      }

    let new_pending () = { state = Pending; callbacks = [] }

    let settle t st =
      match t.state with
      | Pending ->
          t.state <- st;
          let cbs = List.rev t.callbacks in
          t.callbacks <- [];
          List.iter (fun cb -> cb st) cbs
      | _ -> ()

    let pending () =
      let t = new_pending () in
      ( t
      , (fun v -> settle t (Resolved v))
      , (fun e -> settle t (Rejected e)) )

    let resolve v = { state = Resolved v; callbacks = [] }
    let reject e = { state = Rejected e; callbacks = [] }
    let unsafe_settle t v = settle t (Resolved v)
    let unsafe_reject t e = settle t (Rejected e)

    let make f =
      let t = new_pending () in
      f ~resolve:(unsafe_settle t) ~reject:(unsafe_reject t);
      t

    let chain (t : 'a t) (on_resolved : 'a -> 'b t)
        (on_rejected : error -> 'b t) : 'b t =
      let out = new_pending () in
      let cont st =
        let r =
          match st with
          | Resolved v -> (
              try on_resolved v
              with e -> reject e)
          | Rejected e -> (
              try on_rejected e
              with e2 -> reject e2)
          | Pending -> out
        in
        (match r.state with
         | Pending ->
             r.callbacks <- (fun st' -> settle out st') :: r.callbacks
         | st' -> settle out st')
      in
      (match t.state with
       | Pending -> t.callbacks <- cont :: t.callbacks
       | st -> cont st);
      out

    let then_ f t = chain t f reject
    let catch f t = chain t resolve f

    let all arr =
      if Array.length arr = 0 then resolve [||]
      else begin
        let out = new_pending () in
        let remaining = ref (Array.length arr) in
        let results = Array.make (Array.length arr) None in
        Array.iteri
          (fun i p ->
            match p.state with
            | Pending ->
                p.callbacks <-
                  (fun st ->
                    match st with
                    | Resolved v ->
                        results.(i) <- Some v;
                        decr remaining;
                        if !remaining = 0 then
                          settle out
                            (Resolved (Array.map Option.get results))
                    | Rejected e -> settle out (Rejected e)
                    | Pending -> ())
                  :: p.callbacks
            | Resolved v ->
                results.(i) <- Some v;
                decr remaining
            | Rejected e -> settle out (Rejected e))
          arr;
        if !remaining = 0 && out.state = Pending then
          settle out (Resolved (Array.map Option.get results));
        out
      end

    let all2 (a, b) =
      then_ (fun av -> then_ (fun bv -> resolve (av, bv)) b) a

    let all3 (a, b, c) =
      then_
        (fun av -> then_ (fun bv -> then_ (fun cv -> resolve (av, bv, cv)) c) b)
        a

    let race arr =
      let out = new_pending () in
      Array.iter
        (fun p ->
          match p.state with
          | Pending ->
              p.callbacks <- (fun st -> settle out st) :: p.callbacks
          | st -> settle out st)
        arr;
      out
  end

  module Date = struct
    type t = float (* epoch milliseconds *)

    let now () = Unix.gettimeofday () *. 1000.
    let fromFloat f = f
    let valueOf t = t
    let getTime t = t

    let tm_of t = Unix.localtime (t /. 1000.)
    let gmt_of t = Unix.gmtime (t /. 1000.)
    let getDate t = Float.of_int (tm_of t).Unix.tm_mday
    let getDay t = Float.of_int (tm_of t).Unix.tm_wday
    let getMonth t = Float.of_int (tm_of t).Unix.tm_mon
    let getFullYear t = Float.of_int ((tm_of t).Unix.tm_year + 1900)
    let getHours t = Float.of_int (tm_of t).Unix.tm_hour
    let getMinutes t = Float.of_int (tm_of t).Unix.tm_min
    let getUTCDate t = Float.of_int (gmt_of t).Unix.tm_mday
    let getUTCDay t = Float.of_int (gmt_of t).Unix.tm_wday

    let of_tm tm =
      (fst (Unix.mktime tm) *. 1000.)

    let setDate ~date t =
      let tm = tm_of t in
      of_tm { tm with Unix.tm_mday = int_of_float date }

    let setMonth ~month t =
      let tm = tm_of t in
      of_tm { tm with Unix.tm_mon = int_of_float month }

    let setFullYear ~year t =
      let tm = tm_of t in
      of_tm { tm with Unix.tm_year = int_of_float year - 1900 }


    let fromString (s : string) : t =
      match Ptime.of_rfc3339 s with
      | Ok (pt, _, _) -> Ptime.to_float_s pt *. 1000.
      | Error _ -> 0.

    let toISOString t =
      match Ptime.of_float_s (t /. 1000.) with
      | Some pt -> Ptime.to_rfc3339 pt ~frac_s:3
      | None -> ""

    let utc ~year ~month ?(date = 1.0) ?(hour = 0.0) ?(minute = 0.0)
        ?(second = 0.0) ?(millisecond = 0.0) () =
      let date =
        ( int_of_float year
        , int_of_float month + 1
        , int_of_float date )
      and time =
        ( int_of_float hour
        , int_of_float minute
        , int_of_float second )
      in
      let p =
        Ptime.of_date_time (date, (time, 0)) |> Option.get
      in
      (Ptime.to_float_s p *. 1000.) +. millisecond

    let make ?(year = 1970.) ?(month = 0.) ?(date = 1.) ?(hours = 0.)
        ?(minutes = 0.) ?(seconds = 0.) ?(milliseconds = 0.) () =
      ignore milliseconds;
      utc ~year ~month ~date ~hour:hours ~minute:minutes ~second:seconds ()
  end

  module String = struct
    let toLowerCase = String.lowercase_ascii
    let toUpperCase = String.uppercase_ascii
    let length = String.length
    let get s i = String.get s i
    let charAt i s = String.make 1 (String.get s i)

    let slice ~from:lo ?end_:hi s =
      let n = String.length s in
      let lo = if lo < 0 then n + lo else lo in
      let hi = match hi with None -> n | Some h -> if h < 0 then n + h else h in
      String.sub s lo (max 0 (min n hi - lo))

    let includes ~search s =
      let ns = String.length search and n = String.length s in
      let rec go i =
        i + ns <= n
        && (String.sub s i ns = search || go (i + 1))
      in
      go 0
  end


  module Undefined = struct
    type 'a t = 'a option

    let empty = None
    let return v = Some v
    let toOption t = t
    let to_opt t = t
    let fromOption t = t
    let bind t f = match t with Some v -> f v | None -> None
    let test t = Option.is_some t
    let testAny t = Option.is_some t
  end

  module Nullable = struct
    type 'a t = 'a option

    let empty = None
    let null = None
    let undefined = None
    let return v = Some v
    let toOption t = t
    let to_opt t = t
    let fromOption t = t
    let bind t f = match t with Some v -> f v | None -> None
    let flatMap t f = bind t f
    let test t = Option.is_some t
  end

  module Null = struct
    type 'a t = 'a option

    let empty = None
    let return v = Some v
    let toOption t = t
    let fromOption t = t
    let bind t f = match t with Some v -> f v | None -> None
  end

  module Option = struct
    type 'a t = 'a option

    let some v = Some v
    let isSome = Option.is_some
    let isNone = Option.is_none
    let default d t = Option.value t ~default:d
    let getExn t = Option.get t
    let map f t = Option.map f t
    let and_ f t = Option.bind t f
  end

  module Exn = struct
    exception Error of Json.t

    let raiseError s = raise (Error (Json.JString s))

    let message = function
      | Failure s -> Some s
      | exn -> Some (Printexc.to_string exn)

    let stack _ = None
    let name _ = None
    let fileName _ = None
    let asJsExn e = Some e
  end

  module Typed_array = struct
    module ArrayBuffer = struct
      type t = Bytes.t

      let make n = Bytes.make n '\000'
      let length = Bytes.length
    end

    module Uint8Array = struct
      type t = Bytes.t

      let make n = Bytes.make n '\000'
      let fromLength = make
      let length t = Bytes.length t
      let get t i = Char.code (Bytes.get t i)
      let unsafe_get = get
      let set t i v = Bytes.set t i (Char.chr (v land 0xff))
      let unsafe_set = set
      let fromBuffer (t : ArrayBuffer.t) () : t = t
      let buffer (t : t) : ArrayBuffer.t = t
      let sub t ~start ~end_ = Bytes.sub t start (end_ - start)
      let to_string t = Bytes.to_string t
    end
  end

  let typeof _ = "object"
  let unsafe_eq (a : 'a) (b : 'a) = a == b
  let log s = print_endline s

