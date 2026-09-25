(* frontend.worker.commands — invoke commands based on user settings.
   cljs-time arithmetic is UTC: the civil helpers here convert epoch ms
   with days_from_civil/civil_from_days (no timezone offset). *)

open Datascript

(* ---------- UTC civil arithmetic (cljs-time.core on UTC instants) -- *)

let days_from_civil (y : int) (m : int) (d : int) : int =
  let y = if m <= 2 then y - 1 else y in
  let era = (if y >= 0 then y else y - 399) / 400 in
  let yoe = y - era * 400 in
  let mp = (m + 9) mod 12 in
  let doy = (153 * mp + 2) / 5 + d - 1 in
  let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy in
  era * 146097 + doe - 719468

let civil_from_days (z : int) : int * int * int =
  let z = z + 719468 in
  let era = (if z >= 0 then z else z - 146096) / 146097 in
  let doe = z - era * 146097 in
  let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365 in
  let y = yoe + era * 400 in
  let doy = doe - (365 * yoe + yoe / 4 - yoe / 100) in
  let mp = (5 * doy + 2) / 153 in
  let d = doy - (153 * mp + 2) / 5 + 1 in
  let m = if mp < 10 then mp + 3 else mp - 9 in
  ((if m <= 2 then y + 1 else y), m, d)

let days_in_month (y : int) (m : int) : int =
  match m with
  | 1 | 3 | 5 | 7 | 8 | 10 | 12 -> 31
  | 4 | 6 | 9 | 11 -> 30
  | 2 ->
      if (y mod 4 = 0 && y mod 100 <> 0) || y mod 400 = 0 then 29 else 28
  | _ -> invalid_arg "days_in_month"

type ucivil =
  { y : int; mo : int; d : int; h : int; mi : int; s : int; ms : int }

let utc_civil_of_ms (ms : int64) : ucivil =
  let days = Int64.div ms 86400000L and rem = Int64.rem ms 86400000L in
  let rem = if Int64.compare rem 0L < 0 then Int64.add rem 86400000L else rem in
  let days = if Int64.compare (Int64.rem ms 86400000L) 0L < 0 then Int64.pred days else days in
  let y, mo, d = civil_from_days (Int64.to_int days) in
  { y; mo; d
  ; h = Int64.to_int (Int64.div rem 3600000L)
  ; mi = Int64.to_int (Int64.div (Int64.rem rem 3600000L) 60000L)
  ; s = Int64.to_int (Int64.div (Int64.rem rem 60000L) 1000L)
  ; ms = Int64.to_int (Int64.rem rem 1000L) }

let ms_of_utc_civil (c : ucivil) : int64 =
  Int64.add
    (Int64.mul (Int64.of_int (days_from_civil c.y c.mo c.d)) 86400000L)
    (Int64.of_int
       (c.h * 3600000 + c.mi * 60000 + c.s * 1000 + c.ms))

type recur_unit = Minute | Hour | Day | Week | Month | Year

(* cljs-time t/plus with joda month/year clamping semantics *)
let add_units (c : ucivil) (u : recur_unit) (n : int) : ucivil =
  match u with
  | Month | Year ->
      let total = (c.y * 12 + (c.mo - 1)) + (if u = Year then n * 12 else n) in
      let y = total / 12 and mo = total mod 12 + 1 in
      let y, mo =
        if total < 0 then
          let y = (total - 11) / 12 in
          (y, total - y * 12 + 1)
        else (y, mo)
      in
      let d = min c.d (days_in_month y mo) in
      { c with y; mo; d }
  | _ ->
      let ms =
        match u with
        | Minute -> Int64.mul (Int64.of_int n) 60000L
        | Hour -> Int64.mul (Int64.of_int n) 3600000L
        | Day -> Int64.mul (Int64.of_int n) 86400000L
        | Week -> Int64.mul (Int64.of_int n) 604800000L
        | _ -> invalid_arg "unreachable"
      in
      utc_civil_of_ms (Int64.add (ms_of_utc_civil c) ms)

(* cljs-time t/in-* — whole units between two instants *)
let in_units (a : ucivil) (b : ucivil) (u : recur_unit) : int =
  let ms_a = ms_of_utc_civil a and ms_b = ms_of_utc_civil b in
  match u with
  | Minute -> Int64.to_int (Int64.div (Int64.sub ms_b ms_a) 60000L)
  | Hour -> Int64.to_int (Int64.div (Int64.sub ms_b ms_a) 3600000L)
  | Day -> Int64.to_int (Int64.div (Int64.sub ms_b ms_a) 86400000L)
  | Week -> Int64.to_int (Int64.div (Int64.sub ms_b ms_a) 604800000L)
  | Month | Year ->
      let raw = (b.y - a.y) * 12 + (b.mo - a.mo) in
      (* a whole month only counts when the day/time doesn't regress *)
      let months =
        if ms_b >= ms_a && (b.d < a.d || (b.d = a.d
           && (b.h * 3600000 + b.mi * 60000 + b.s * 1000 + b.ms)
              < (a.h * 3600000 + a.mi * 60000 + a.s * 1000 + a.ms)))
        then raw - 1
        else if ms_b < ms_a && (b.d > a.d || (b.d = a.d
           && (b.h * 3600000 + b.mi * 60000 + b.s * 1000 + b.ms)
              > (a.h * 3600000 + a.mi * 60000 + a.s * 1000 + a.ms)))
        then raw + 1
        else raw
      in
      if u = Year then months / 12 else months

let utc_now () : ucivil = utc_civil_of_ms (Date_time_util.time_ms ())

let ucivil_after (a : ucivil) (b : ucivil) : bool =
  Int64.compare (ms_of_utc_civil a) (ms_of_utc_civil b) > 0

(* date-time-util/journal-day->ms — yyyymmdd int parsed as UTC date *)
let journal_day_to_ms (day : int) : int64 =
  let y = day / 10000 and mo = (day / 100) mod 100 and d = day mod 100 in
  ms_of_utc_civil { y; mo; d; h = 0; mi = 0; s = 0; ms = 0 }

(* ---------- commands core ---------- *)

(* cljs get-property — :status resolves through
   :logseq.property.repeat/checked-property *)
let get_property (ent : entity) (property : string) : string =
  if property = "status" then
    match Ldb.ref_ent ent "logseq.property.repeat/checked-property" with
    | Some p ->
        (match Ldb.ident_of p with
         | Some i -> i
         | None -> "logseq.property/status")
    | None -> "logseq.property/status"
  else property

(* cljs get-value — :status :done/:todo resolve via closed values or
   checkbox type *)
let get_value (ent : entity) (property : string) (value : value) : value =
  let resolved_done checked =
    match Ldb.ref_ent ent "logseq.property.repeat/checked-property" with
    | Some p ->
        let choices =
          Db_property.property_closed_values p
        in
        if Ldb.value p "logseq.property/type" = Some (Keyword "checkbox") then
          Some (Bool checked)
        else
          List.find_map
            (fun (c : entity) ->
              match Ldb.value c "logseq.property/choice-checkbox-state" with
              | Some (Bool s) when s = checked -> Some (Int c.id)
              | _ -> None)
            choices
    | None -> None
  in
  match property, value with
  | "status", Keyword "done" ->
      (match resolved_done true with
       | Some v -> v
       | None -> Keyword "logseq.property/status.done")
  | "status", Keyword "todo" ->
      (match resolved_done false with
       | Some v -> v
       | None -> Keyword "logseq.property/status.todo")
  | _ -> value

(* cljs satisfy-condition? *)
let satisfy_condition (db : db) (ent : entity)
    ~(kind : string) ~(property : string) ~(value : value)
    (datoms : datom list) : bool =
  let property' = get_property ent property in
  let value' = get_value ent property value in
  match entity db (Ident property') with
  | None -> false
  | Some property_entity ->
      let ref_ =
        match Ldb.value property_entity "logseq.property/type" with
        | Some (Keyword t) ->
            List.mem t Db_property.all_ref_property_types
        | _ -> false
      in
      let value_matches (datom_value : value option) : bool =
        (* cljs db-value: entity-conditions read the raw attr value;
           ref? dereferences the datom eid to an entity *)
        let db_value =
          match datom_value with
          | None ->
              if ref_ then
                (match Ldb.ref_ent ent property' with
                 | Some e -> `VEnt e
                 | None ->
                     (match Ldb.ref_ents ent property' with
                      | _ :: _ as es -> `VEnts es
                      | [] -> `VRaw (Ldb.value ent property')))
              else `VRaw (Ldb.value ent property')
          | Some dv ->
              if ref_ then
                (* cljs (d/entity db datom-value) — ref datoms carry Ref *)
                (match dv with
                 | Int id | Ref id ->
                     (match Ldb.ent_of_id db id with
                      | Some e -> `VEnt e
                      | None -> `VRaw (Some dv))
                 | _ -> `VRaw (Some dv))
              else `VRaw (Some dv)
        in
        let qualified_keyword (v : value) : string option =
          match v with
          | Keyword k when String.contains k '/' -> Some k
          | _ -> None
        in
        match qualified_keyword value' with
        | Some k ->
            (* cljs (and (map? db-value) (= value' (:db/ident db-value))) *)
            (match db_value with
             | `VEnt e -> Ldb.ident_of e = Some k
             | _ -> false)
        | None when ref_ ->
            (match db_value with
             | `VEnt e ->
                 (* cljs: uuid? | property-value-content | :db/id *)
                 (match value' with
                  | Uuid u -> Ldb.value e "block/uuid" = Some (Uuid u)
                  | _ -> false)
                 || Db_property.property_value_content e = Some value'
                 || (match value' with
                     | Int i -> e.id = i
                     | _ -> false)
             | `VRaw (Some (Int i)) when value' = Int i -> true
             | _ -> false)
        | None ->
            (match db_value with
             | `VRaw v -> v = Some value'
             | `VEnt _ | `VEnts _ -> false)
      in
      if datoms <> [] then
        if kind = "datom-attribute-check?" then
          List.exists
            (fun (d : datom) ->
              match entity db (Ident d.a) with
              | Some attr_ent ->
                  Ldb.value attr_ent property
                  = Some value'
              | None -> false)
            datoms
        else
          List.exists
            (fun (d : datom) -> d.added && value_matches (Some d.v))
            (List.filter (fun (d : datom) -> d.a = property') datoms)
      else value_matches None

(* cljs commands table — user-configurable via *commands atom upstream;
   the two defaults are the entire current set. *)
type command_condition =
  { kind : string
  ; property : string
  ; value : value }

type command =
  { entity_conditions : command_condition list
  ; tx_conditions : command_condition list
  ; actions : string list list }

let commands : command list =
  [ { entity_conditions =
        [ { kind = "entity-value"
          ; property = "logseq.property.repeat/repeated?"
          ; value = Bool true } ]
    ; tx_conditions =
        [ { kind = "tx-value"
          ; property = "status"
          ; value = Keyword "done" } ]
    ; actions = [ [ "reschedule" ]; [ "set-property"; "status"; "todo" ] ] }
  ; { entity_conditions = []
    ; tx_conditions =
        [ { kind = "datom-attribute-check?"
          ; property = "logseq.property/enable-history?"
          ; value = Bool true } ]
    ; actions = [ [ "record-property-history" ] ] } ]

(* cljs advance-from-completion — `.+` *)
let advance_from_completion (u : recur_unit) (frequency : int) : ucivil =
  add_units (utc_now ()) u frequency

(* cljs advance-from-scheduled — `+` *)
let advance_from_scheduled (datetime : ucivil) (u : recur_unit)
    (frequency : int) : ucivil =
  add_units datetime u frequency

(* cljs advance-until-future — `++` *)
let advance_until_future (datetime : ucivil) (u : recur_unit)
    (frequency : int) : ucivil =
  let now = utc_now () in
  let periods =
    max 1
      (if ucivil_after datetime now then 1
       else in_units datetime now u)
  in
  let delta_n =
    int_of_float (Float.of_int periods /. Float.of_int frequency
                  |> Float.ceil)
    * frequency
  in
  let result = add_units datetime u delta_n in
  let rec loop cand =
    if ucivil_after cand now then cand
    else loop (add_units cand u frequency)
  in
  loop result

let repeat_next_timestamp (datetime : ucivil) (u : recur_unit)
    (frequency : int) (repeat_type : string) : ucivil =
  match repeat_type with
  | "logseq.property.repeat/repeat-type.dotted-plus" ->
      advance_from_completion u frequency
  | "logseq.property.repeat/repeat-type.plus" ->
      advance_from_scheduled datetime u frequency
  | _ -> advance_until_future datetime u frequency

let get_next_time (current_value : int64) (unit : entity)
    (frequency : int) (repeat_type : string) : int64 option =
  let recur_unit =
    match Ldb.ident_of unit with
    | Some "logseq.property.repeat/recur-unit.minute" -> Some Minute
    | Some "logseq.property.repeat/recur-unit.hour" -> Some Hour
    | Some "logseq.property.repeat/recur-unit.day" -> Some Day
    | Some "logseq.property.repeat/recur-unit.week" -> Some Week
    | Some "logseq.property.repeat/recur-unit.month" -> Some Month
    | Some "logseq.property.repeat/recur-unit.year" -> Some Year
    | _ -> None
  in
  match recur_unit with
  | Some u when frequency > 0 ->
      Some
        (ms_of_utc_civil
           (repeat_next_timestamp (utc_civil_of_ms current_value) u
              frequency repeat_type))
  | _ -> None

(* cljs resolve-recur-frequency — explicit value or default-value block *)
let resolve_recur_frequency (db : db) (ent : entity)
    : int * tx_op list =
  let explicit =
    match Ldb.ref_ent ent "logseq.property.repeat/recur-frequency" with
    | Some v ->
        (match Db_property.property_value_content v with
         | Some (Int n) -> Some n
         | Some (Float f) -> Some (int_of_float f)
         | _ -> None)
    | None -> None
  in
  match explicit with
  | Some n -> (n, [])
  | None ->
      let property =
        match entity db (Ident "logseq.property.repeat/recur-frequency") with
        | Some p -> p
        | None -> invalid_arg "recur-frequency property missing"
      in
      let default_value_block =
        Db_property_build.build_property_value_block
          (Block_map.of_entity property) (Block_map.of_entity property)
          (Int 1)
      in
      let dvb_uuid =
        match Block_map.uuid_attr default_value_block "block/uuid" with
        | Some u -> u
        | None -> invalid_arg "default value block missing uuid"
      in
      (1,
       [ Block_map.to_tx_op db default_value_block
       ; Add
           (Entity_id property.id,
            "logseq.property/default-value",
            Ref_to (Lookup_ref ("block/uuid", Uuid dvb_uuid))) ])

(* cljs compute-reschedule-property-tx *)
let compute_reschedule_property_tx (db : db) (ent : entity)
    (property_ident : string) : tx_op list =
  let frequency, default_value_tx_data =
    resolve_recur_frequency db ent
  in
  let unit = Ldb.ref_ent ent "logseq.property.repeat/recur-unit" in
  let repeat_type =
    match
      Option.bind
        (Ldb.ref_ent ent "logseq.property.repeat/repeat-type")
        Ldb.ident_of
    with
    | Some i -> i
    | None -> "logseq.property.repeat/repeat-type.double-plus"
  in
  let property = entity db (Ident property_ident) in
  let date_ =
    match property with
    | Some p -> Ldb.value p "logseq.property/type" = Some (Keyword "date")
    | None -> false
  in
  let current_value : int64 option =
    match entity db (Ident property_ident) |> Option.is_some,
          Ldb.ref_ent ent property_ident,
          Ldb.value ent property_ident
    with
    | true, Some v, _ when date_ ->
        (match Ldb.value v "block/journal-day" with
         | Some (Int day) ->
             (* date-time-util/journal-day->ms — ms of local midnight
                of the journal day *)
             Some (journal_day_to_ms day)
         | _ -> None)
    (* cljs untyped get — epoch-ms reads back as the platform's numeric
       rep (Int/Float); Instant only for legacy ~t-decoded data *)
    | true, _, Some (Int ms) -> Some (Int64.of_int ms)
    | true, _, Some (Float f) -> Some (Int64.of_float f)
    | true, _, Some (Instant ms) -> Some ms
    | _ -> None
  in
  match frequency > 0, unit, current_value with
  | true, Some u, Some cv ->
      (match get_next_time cv u frequency repeat_type with
       | None -> []
       | Some next_time_long ->
           let journal_day =
             Outliner_pipeline.get_journal_day_from_long db
               (Common_util.value_of_ms next_time_long)
           in
           let page_uuid, page_txs =
             match journal_day with
             | Some eid ->
                 ((match Ldb.ent_of_id db eid with
                   | Some e ->
                       (match Ldb.value e "block/uuid" with
                        | Some (Uuid u) -> Some u
                        | _ -> None)
                   | None -> None),
                  [])
             | None ->
                 let formatter =
                   match entity db (Ident "logseq.class/Journal") with
                   | Some j ->
                       Ldb.string_value j
                         "logseq.property.journal/title-format"
                   | None -> None
                 in
                 let lc = Date_time.of_epoch_ms next_time_long in
                 let next_day_int =
                   lc.year * 10000 + lc.month * 100 + lc.day
                 in
                 let title =
                   Ldb.journal_title_of_day next_day_int
                     (match formatter with
                      | Some f -> f
                      | None -> "MMM do, yyyy")
                 in
                 let r = Outliner_page.create db title () in
                 ( r.page_uuid
                 , Datascript.parse_tx_data_string
                     (Db_transact.tx_edn r.tx_data) )
           in
           let value =
             if date_ then
               match page_uuid with
               | Some u ->
                   Some (Ref_to (Lookup_ref ("block/uuid", Uuid u)))
               | None -> None
             else Some (Common_util.value_of_ms next_time_long)
           in
           default_value_tx_data @ page_txs
           @ (match value with
              | Some v ->
                  [ Add (Entity_id ent.id, property_ident, v) ]
              | None -> []))
  | _ -> []

(* cljs repeat-temporal-property-idents *)
let repeat_temporal_property_idents =
  [ "logseq.property/scheduled"; "logseq.property/deadline" ]

let existing_repeat_temporal_property_idents (ent : entity) : string list =
  List.filter
    (fun a -> Option.is_some (Ldb.value ent a))
    repeat_temporal_property_idents

(* cljs reschedule-property-idents *)
let reschedule_property_idents (ent : entity) : string list =
  let explicit =
    Option.bind
      (Ldb.ref_ent ent "logseq.property.repeat/temporal-property")
      Ldb.ident_of
  in
  match explicit with
  | Some epi ->
      let others =
        match epi with
        | "logseq.property/scheduled" ->
            if Option.is_some (Ldb.value ent "logseq.property/deadline")
            then [ "logseq.property/deadline" ] else []
        | "logseq.property/deadline" ->
            if Option.is_some (Ldb.value ent "logseq.property/scheduled")
            then [ "logseq.property/scheduled" ] else []
        | _ -> []
      in
      List.sort_uniq String.compare (epi :: others)
  | None -> existing_repeat_temporal_property_idents ent

(* cljs handle-command :reschedule *)
let handle_reschedule (db : db) (ent : entity) : tx_op list =
  List.concat_map
    (compute_reschedule_property_tx db ent)
    (reschedule_property_idents ent)

(* cljs handle-command :set-property *)
let handle_set_property (ent : entity) (property : string)
    (value : value) : tx_op list =
  let property' = get_property ent property in
  let value' = get_value ent property value in
  [ Add (Entity_id ent.id, property', value') ]

(* cljs handle-command :record-property-history *)
let handle_record_property_history (db : db) (ent : entity)
    (datoms : datom list) : tx_op list =
  List.filter_map
    (fun (d : datom) ->
      match entity db (Ident d.a) with
      | Some property
        when Ldb.value property "logseq.property/enable-history?"
             = Some (Bool true) && d.added ->
          let ref_ =
            Ldb.value property "db/valueType" = Some (Keyword "db.type/ref")
          in
          let value_key =
            if ref_ then "logseq.property.history/ref-value"
            else "logseq.property.history/scalar-value"
          in
          Some
            (Block_map.to_tx_op db
               (Db_property_build.block_with_timestamps
                  [ "block/uuid", Uuid (Common_uuid.new_block_id ())
                  ; (value_key), d.v
                  ; "logseq.property.history/block", Int ent.id
                  ; "logseq.property.history/property", Int property.id ]))
      | _ -> None)
    datoms

(* cljs execute-command — dispatch actions *)
let execute_command (db : db) (ent : entity) (datoms : datom list)
    (command : command) : tx_op list =
  List.concat_map
    (fun action ->
      match action with
      | [ "reschedule" ] -> handle_reschedule db ent
      | [ "set-property"; prop; v ] ->
          handle_set_property ent prop (Keyword v)
      | [ "record-property-history" ] ->
          handle_record_property_history db ent datoms
      | _ -> invalid_arg "Unhandled command")
    command.actions

(* cljs run-commands — group tx-data by e, check conditions, run actions *)
let run_commands (db_after : db) (tx_data : datom list) : tx_op list =
  let by_e =
    List.fold_left
      (fun acc (d : datom) ->
        let cur = try List.assoc d.e acc with Not_found -> [] in
        (d.e, d :: cur) :: List.remove_assoc d.e acc)
      [] tx_data
  in
  List.concat_map
    (fun (e, datoms) ->
      let datoms = List.rev datoms in
      match entity db_after (Entity_id e) with
      | None -> []
      | Some ent ->
          let matching =
            List.filter
              (fun (c : command) ->
                (c.entity_conditions = []
                 || List.for_all
                      (fun cond ->
                        satisfy_condition db_after ent ~kind:cond.kind
                          ~property:cond.property ~value:cond.value [])
                      c.entity_conditions)
                && List.for_all
                     (fun cond ->
                       satisfy_condition db_after ent ~kind:cond.kind
                         ~property:cond.property ~value:cond.value datoms)
                     c.tx_conditions)
              commands
          in
          List.concat_map
            (execute_command db_after ent datoms)
            matching)
    by_e
