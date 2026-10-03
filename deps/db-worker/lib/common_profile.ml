(* logseq.common.profile — the volatile maps the profile-fn! macro
   accumulates into. Keys are the profile key keywords rendered as
   strings. *)

let key_to_call_count : (string, int) Hashtbl.t = Hashtbl.create 8
let key_to_time_sum : (string, float) Hashtbl.t = Hashtbl.create 8
