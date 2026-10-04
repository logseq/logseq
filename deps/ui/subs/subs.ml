(* The subscription pipeline: worker "sync-db-changes" broadcasts are
   stashed, debounced against UI activity, then spliced into the
   subscribed stores (Subs_state.current_page / current_journals)
   through Page_delta — republishing as Page_loaded / Journals_loaded
   or falling back to a full route reload when a delta can't apply.

   Every touch point outside this package is injected through [hooks]:
   the editor predicates that defer reloads, the publish fns that feed
   the model, the enrichment helpers the splice needs, and the
   invalidation/plugin side-effects the app wires in at init. *)

open Promise_ext

type hooks =
  { reload : unit -> unit
      (** full route reload — the delta-less/failed-splice fallback *)
  ; after_apply : unit -> unit
      (** refresh views mounted outside the model (query instances) *)
  ; refresh_page_side : Model.page -> unit
      (** the side-fetches a page load also runs (refs, unlinked) *)
  ; prune_overrides : string list -> unit
      (** drop title overrides for the uuids a splice made authoritative *)
  ; invalidate_pull_uuids : string list -> unit
      (** only the touched entities' pull entries go stale *)
  ; invalidate_pull_caches : unit -> unit
      (** a delta-less broadcast invalidates everything *)
  ; fire_db_hooks : Wire.t -> unit
      (** plugin db hooks fire for the tx report before the UI reloads *)
  ; helpers_of : Model.page -> Page_delta.helpers
      (** editor-layer enrichment the splice needs (tags, embeds,
          collapse merge, page-field refresh) *)
  ; ui_busy : now:float -> last_fire:float -> bool
      (** editor/overlay activity that defers a reload (typing, menus,
          the editing-session throttle) *)
  ; schedule : (unit -> unit) -> unit
      (** defer one fire_reload pass (~150ms) *)
  ; publish_page : Model.page -> unit
      (** commit a merged page — Runtime.send Page_loaded *)
  ; publish_journals : Model.page list -> unit
      (** commit a merged journals list — Runtime.send Journals_loaded *)
  ; refetch_page : Model.page -> Model.page option Js.Promise.t
      (** block-level fallback: a delta that can't splice refetches only
          the affected page/day's blocks — never the whole route *)
  }

let hooks : hooks option ref = ref None

let install_hooks h = hooks := Some h

let hooks_or_fail () =
  match !hooks with
  | Some h -> h
  | None -> failwith "subs hooks not installed"

(* A full route reload tears into the editing textarea mid-keystroke,
   so the app defers while input is recent. During an RTC merge flood
   broadcasts arrive faster than the debounce — trailing debounce
   instead: re-arm while requests keep landing, with a max wait so a
   continuous flood can't postpone the refresh forever. *)
let pending_deltas : Wire.t list ref = ref []
let pending_unknown_delta = ref false
let reload_pending = ref false
let reload_first_ms = ref 0.0
let reload_last_ms = ref 0.0

(* each full-route reload pays a worker fetch plus ~280ms of whole-tree
   rebuild+flush; the app caps reload cadence while an editor is open *)
let reload_last_fire_ms = ref 0.0

let reload_debounce_ms = 400.0
let reload_max_wait_ms = 2000.0
let edit_input_idle_ms = 750.0

let clear_pending_deltas () =
  pending_deltas := [];
  pending_unknown_delta := false

let rec schedule_reload () =
  reload_last_ms := Platform.date_now_ms ();
  if !reload_first_ms = 0.0 then reload_first_ms := !reload_last_ms;
  if not !reload_pending then (
    reload_pending := true;
    (hooks_or_fail ()).schedule fire_reload)

and fire_reload () =
  let h = hooks_or_fail () in
  let now = Platform.date_now_ms () in
  let flood_active =
    now -. !reload_last_ms < reload_debounce_ms
    && now -. !reload_first_ms < reload_max_wait_ms
  in
  if flood_active || h.ui_busy ~now ~last_fire:!reload_last_fire_ms
  then h.schedule fire_reload
  else (
    reload_pending := false;
    reload_first_ms := 0.0;
    reload_last_fire_ms := now;
    Platform.perf_mark "reload:fire";
    ignore (apply_pending ()))

(* splice the stashed tx deltas into the subscribed stores; fall back
   to the full route reload when a broadcast carried no delta, the
   stash isn't contiguous with the materialized rev, or there's no
   route page to patch *)
and apply_pending () : unit Js.Promise.t =
  let h = hooks_or_fail () in
  (* deferred op deltas are older revs — merge them first so the
     strict broadcast splices build on the right basis *)
  let deltas = Page_delta.drain_deferred () @ !pending_deltas in
  let unknown = !pending_unknown_delta in
  clear_pending_deltas ();
  let finish () =
    h.after_apply ();
    Subs_state.run_sync_subs ()
  in
  (* sync subs (sidebar recents/favorites, views queries, embed
     refresh) are graph-wide — a delta that touches no mounted page can
     still change them, so finish() runs for any non-duplicate batch;
     only the page/journals publish + refetch is gated on relevance *)
  match (!Subs_state.current_page, deltas, unknown) with
  | Some _, _ :: _, false -> (
      let all_dup =
        List.for_all Page_delta.delta_already_applied deltas
      in
      let prune () =
        h.prune_overrides
          (List.concat_map Page_delta.delta_uuids deltas)
      in
      (* fold and publish inside the apply queue so a racing arm can't
         interleave between our splice and our publish — canon rows
         replace block fields wholesale, so a stale arm publishing last
         would blank rows the newer model already advanced *)
      let* merged =
        Page_delta.with_apply_queue (fun () ->
            match !Subs_state.current_page with
            | Some base -> (
                let rec fold (p : Model.page) = function
                  | [] -> Js.Promise.resolve (Page_delta.Applied p)
                  | d :: rest -> (
                      let* applied =
                        Page_delta.apply_to_page ~strict:true
                          (h.helpers_of p) p d
                      in
                      match applied with
                      | Page_delta.Applied p' -> fold p' rest
                      | Page_delta.Unchanged -> fold p rest
                      | Page_delta.Failed -> Js.Promise.resolve Page_delta.Failed)
                in
                let* m = fold base deltas in
                (match m with
                 | Page_delta.Applied p'
                   when p' != base
                        &&
                        (match !Subs_state.current_page with
                         | Some c -> c == base
                         | None -> false) ->
                     h.publish_page p';
                     h.refresh_page_side p'
                 | _ -> ());
                Js.Promise.resolve m)
            | None -> Js.Promise.resolve Page_delta.Failed)
      in
      (* a broadcast carrying only deltas we already spliced from our
         own op response has nothing new to publish — skip the subs
         refresh, it would just re-issue the sidebar/view fetches *)
      if not all_dup then finish ();
      (match merged with
      | Page_delta.Applied _ ->
          (* the spliced rows are authoritative for the uuids these txs
             touched — drop only those title overrides, keep in-flight
             commits *)
          if not all_dup then prune ();
          Js.Promise.resolve ()
      | Page_delta.Unchanged ->
          (* irrelevant — nothing to republish, nothing to prune *)
          Js.Promise.resolve ()
      | Page_delta.Failed -> (
          (* relevant but unspliceable — refetch only this page's
             blocks, never the whole route *)
          match !Subs_state.current_page with
          | Some p -> (
              let* fresh = h.refetch_page p in
              match fresh with
              | Some p' ->
                  h.publish_page p';
                  h.refresh_page_side p';
                  if not all_dup then prune ();
                  Js.Promise.resolve ()
              | None ->
                  h.reload ();
                  Js.Promise.resolve ())
          | None -> Js.Promise.resolve ())))
  | _ ->
      (* journals route keeps its pages in current_journals — splice
         the queued deltas into the touched day(s) like the op path *)
      if !Subs_state.current_journals <> [] && deltas <> []
         && not unknown
      then
        let start_js = !Subs_state.current_journals in
        let all_dup =
          List.for_all Page_delta.delta_already_applied deltas
        in
        let* merged =
          Page_delta.with_apply_queue (fun () ->
              let rec go js = function
                | [] -> Js.Promise.resolve (Page_delta.Applied js)
                | d :: rest -> (
                    let* applied =
                      Page_delta.apply_to_journals ~strict:true
                        h.helpers_of js d
                    in
                    match applied with
                    | Page_delta.Applied js' -> go js' rest
                    | Page_delta.Unchanged -> go js rest
                    | Page_delta.Failed -> Js.Promise.resolve Page_delta.Failed)
              in
              go start_js deltas)
        in
        (match merged with
         | Page_delta.Applied js' when js' != start_js
                        && !Subs_state.current_journals == start_js ->
             h.publish_journals js';
             if not all_dup then begin
               finish ();
               h.prune_overrides
                 (List.concat_map Page_delta.delta_uuids deltas)
             end;
             Js.Promise.resolve ()
         | Page_delta.Applied _ | Page_delta.Unchanged ->
             if not all_dup then finish ();
             Js.Promise.resolve ()
         | Page_delta.Failed -> (
             (* relevant but unspliceable — refetch only the days the
                deltas touched, never the whole journals route *)
             let touched (p : Model.page) =
               List.exists
                 (fun d -> Page_delta.delta_touches d p)
                 deltas
             in
             let rec refetch acc = function
               | [] -> Js.Promise.resolve (Some (List.rev acc))
               | (p : Model.page) :: rest ->
                   if not (touched p) then refetch (p :: acc) rest
                   else
                     let* fresh = h.refetch_page p in
                     (match fresh with
                      | Some p' -> refetch (p' :: acc) rest
                      | None -> Js.Promise.resolve None)
             in
             let* js' = refetch [] start_js in
             match js' with
             | Some js'
               when !Subs_state.current_journals == start_js ->
                 h.publish_journals js';
                 if not all_dup then begin
                   finish ();
                   h.prune_overrides
                     (List.concat_map Page_delta.delta_uuids deltas)
                 end;
                 Js.Promise.resolve ()
             | Some _ -> Js.Promise.resolve ()
             | None ->
                 h.reload ();
                 Js.Promise.resolve ()))
      else (
        h.reload ();
        finish ();
        Js.Promise.resolve ())

(* "sync-db-changes" entry point — the worker broadcast lands here from
   Worker_events.dispatch with the whole tx report *)
let on_db_changes (payload : Wire.t) =
  Platform.perf_mark "worker:sync-db-changes";
  let h = hooks_or_fail () in
  (match Wire.get payload "delta" with
   | Some delta ->
       pending_deltas := !pending_deltas @ [ delta ];
       h.invalidate_pull_uuids (Page_delta.delta_uuids delta)
   | None ->
       pending_unknown_delta := true;
       h.invalidate_pull_caches ());
  (* cljs pipeline.cljs publish-plugin-hook! — fire plugin db hooks for
     the tx report before the UI reloads *)
  h.fire_db_hooks payload;
  schedule_reload ()
