(* rtc-asset-upload-download-progress broadcast: latest
   {direction,loaded,total} per asset per repo — cljs
   :rtc/asset-upload-download-progress subscription backing
   asset-transfer-counts / assets-progressing.

   Leaf module (no deps) so worker_events can feed it without a cycle
   (Rtc_flows -> Rtc_ops -> Worker_events). *)

type t =
  { ap_id : string
  ; ap_direction : string
  ; ap_loaded : int
  ; ap_total : int
  }

let table : (string, (string, t) Hashtbl.t) Hashtbl.t = Hashtbl.create 4

let note ~repo ~asset_id ~direction ~loaded ~total =
  let per_repo =
    match Hashtbl.find_opt table repo with
    | Some t -> t
    | None ->
        let t = Hashtbl.create 8 in
        Hashtbl.replace table repo t;
        t
  in
  Hashtbl.replace per_repo asset_id { ap_id = asset_id
                                    ; ap_direction = direction
                                    ; ap_loaded = loaded
                                    ; ap_total = total }

(* cljs asset-transfer-counts: distinct assets still in flight
   (loaded != total) per direction — returns (uploads, downloads) *)
let transfer_counts (repo : string) : int * int =
  match Hashtbl.find_opt table repo with
  | None -> (0, 0)
  | Some t ->
      Hashtbl.fold
        (fun _ p (up, down) ->
          if p.ap_loaded = p.ap_total then (up, down)
          else if p.ap_direction = "upload" then (up + 1, down)
          else if p.ap_direction = "download" then (up, down + 1)
          else (up, down))
        t (0, 0)

let in_flight (repo : string) : t list =
  match Hashtbl.find_opt table repo with
  | None -> []
  | Some t ->
      Hashtbl.fold (fun _ p acc -> p :: acc) t []
      |> List.filter (fun p -> p.ap_loaded <> p.ap_total)
