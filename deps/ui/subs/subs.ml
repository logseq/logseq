(* The subscription pipeline: worker "sync-db-changes" broadcasts are
   stashed, debounced against UI activity, then spliced into the
   subscribed stores (Subs_state.current_page / current_journals)
   through Page_delta — republishing as Page_loaded / Journals_loaded
   or falling back to a full route reload when a delta can't apply.

   Every touch point outside this package is injected through [hooks]:
   the editor predicates that defer reloads, the publish fns that feed
   the model, the enrichment helpers the splice needs, and the
   invalidation/plugin side-effects the app wires in at init. *)

let ( let* ) = Ui_task.( let* )

type hooks =
  { reload : unit -> unit
      (** full route reload — the delta-less/failed-splice fallback *)
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
  ; refetch_page : Model.page -> Model.page option Ui_task.t
      (** block-level fallback: a delta that can't splice refetches only
          the affected page/day's blocks — never the whole route *)
  ; resync_editing : unit -> unit
      (** remote tx landed — re-read the editing block's title into the
          buffer like cljs update-editing-block-title-if-changed!, so a
          later commit can't overwrite the remote rename *)
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
(* cljs pipeline also treats tx-meta :outliner-op = :apply-template as
   remote work — a template apply echo re-runs the editing-buffer
   resync even when its delta is already applied *)
let pending_apply_template = ref false
let reload_pending = ref false
let reload_first_ms = ref 0.0
let reload_last_ms = ref 0.0
(* bumping the generation disarms a scheduled fire_reload — a route
   change clears the stash and must not let a timer armed for the old
   route fire a reload onto the new one *)
let reload_gen = ref 0

(* each full-route reload pays a worker fetch plus ~280ms of whole-tree
   rebuild+flush; the app caps reload cadence while an editor is open *)
let reload_last_fire_ms = ref 0.0

let reload_debounce_ms = 400.0
let reload_max_wait_ms = 2000.0

let clear_pending_deltas () =
  incr reload_gen;
  pending_deltas := [];
  pending_unknown_delta := false;
  pending_apply_template := false;
  reload_pending := false;
  reload_first_ms := 0.0

let perf_enabled =
  lazy (match Sys.getenv_opt "LOGSEQ_PERF" with Some _ -> true | None -> false)

let perf_time name f =
  if Lazy.force perf_enabled
  then begin
    let t0 = Ui_services.time_now () in
    let r = f () in
    Printf.eprintf "[perf] subs.%s %.1fms\n%!" name
      (Ui_services.time_now () -. t0);
    r
  end
  else f ()

let perf_time_p name p =
  if Lazy.force perf_enabled
  then begin
    let t0 = Ui_services.time_now () in
    let* r = p in
    Printf.eprintf "[perf] subs.%s %.1fms\n%!" name
      (Ui_services.time_now () -. t0);
    Ui_task.resolve r
  end
  else p

let rec schedule_reload () =
  reload_last_ms := Ui_services.time_now ();
  if !reload_first_ms = 0.0 then reload_first_ms := !reload_last_ms;
  if not !reload_pending then (
    reload_pending := true;
    let gen = !reload_gen in
    (hooks_or_fail ()).schedule (fun () -> fire_reload gen))

and fire_reload gen =
  if gen <> !reload_gen then ()
  else
    let h = hooks_or_fail () in
    let now = Ui_services.time_now () in
    let flood_active =
      now -. !reload_last_ms < reload_debounce_ms
      && now -. !reload_first_ms < reload_max_wait_ms
    in
    if flood_active || h.ui_busy ~now ~last_fire:!reload_last_fire_ms
    then h.schedule (fun () -> fire_reload gen)
    else (
      reload_pending := false;
      reload_first_ms := 0.0;
      reload_last_fire_ms := now;
      Ui_services.perf_mark "reload:fire";
      ignore (apply_pending ()))

(* splice the stashed tx deltas into the subscribed stores; fall back
   to the full route reload when a broadcast carried no delta, the
   stash isn't contiguous with the materialized rev, or there's no
   route page to patch *)
and apply_pending () : unit Ui_task.t =
  let h = hooks_or_fail () in
  (* deferred op deltas are older revs — merge them first so the
     strict broadcast splices build on the right basis *)
  let deltas = Page_delta.drain_deferred () @ !pending_deltas in
  let unknown = !pending_unknown_delta in
  let apply_template = !pending_apply_template in
  clear_pending_deltas ();
  (* unioned affected-keys of the batch; [] = unknown/no info -> sync
     subs run unfiltered *)
  let affected =
    if deltas = [] then []
    else List.concat_map Page_delta.delta_affected deltas
  in
  let finish () =
    perf_time "sync_subs"
      (fun () -> Subs_state.run_sync_subs affected);
    (* every path that calls finish is a remote/non-own batch — a dup
       echo of our own op never reaches it *)
    h.resync_editing ()
  in
  (* sync subs (sidebar recents/favorites, views queries, embed
     refresh) are graph-wide — a delta that touches no mounted page can
     still change them, so finish() runs for any non-duplicate batch;
     only the page/journals publish + refetch is gated on relevance *)
  match (!Subs_state.current_page, deltas, unknown) with
  | Some _, _ :: _, false -> (
      let all_dup =
        (not apply_template)
        && List.for_all Page_delta.delta_already_applied deltas
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
        Ui_task.catch
          (Page_delta.with_apply_queue (fun () ->
              match !Subs_state.current_page with
              | Some base -> (
                  let rec fold (p : Model.page) = function
                    | [] -> Ui_task.resolve (Page_delta.Applied p)
                    | d :: rest -> (
                        let* applied =
                          perf_time_p "apply_to_page"
                            (Page_delta.apply_to_page ~strict:true
                               (h.helpers_of p) p d)
                        in
                        match applied with
                        | Page_delta.Applied p' -> fold p' rest
                        | Page_delta.Unchanged -> fold p rest
                        | Page_delta.Failed -> Ui_task.resolve Page_delta.Failed)
                  in
                  let* m = fold base deltas in
                  (match m with
                   | Page_delta.Applied p'
                     when p' != base
                          &&
                          (match !Subs_state.current_page with
                           | Some c -> c == base
                           | None -> false) ->
                       perf_time "publish_page" (fun () -> h.publish_page p');
                       perf_time "refresh_side" (fun () ->
                           h.refresh_page_side p')
                   | _ -> ());
                  Ui_task.resolve m)
              | None -> Ui_task.resolve Page_delta.Failed))
          (fun _ ->
            (* a rejected fold (enrichment/refetch helpers can reject)
               must not swallow the batch — treat it as an unspliceable
               delta so the refetch/reload fallback still runs *)
            Ui_task.resolve Page_delta.Failed)
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
          Ui_task.resolve ()
      | Page_delta.Unchanged ->
          (* irrelevant — nothing to republish, nothing to prune *)
          Ui_task.resolve ()
      | Page_delta.Failed -> (
          (* relevant but unspliceable — refetch only this page's
             blocks, never the whole route *)
          match !Subs_state.current_page with
          | Some p -> (
              let* fresh =
                Ui_task.catch (h.refetch_page p)
                  (fun _ -> Ui_task.resolve None)
              in
              match fresh with
              | Some p' ->
                  (* the route may have moved on while the fetch was
                     in flight — publishing would clobber the new
                     route's store with the old page *)
                  (match !Subs_state.current_page with
                   | Some c when c == p ->
                       h.publish_page p';
                       h.refresh_page_side p';
                       if not all_dup then prune ();
                       (* the refetched tree already contains these
                          deltas' effects — mark their revs so the next
                          broadcast splices instead of refetching *)
                       List.iter Page_delta.note_applied_of_delta
                         deltas;
                       (* finish() already ran against the pre-refetch
                          model — resync the editing buffer again now
                          that the fresh tree is in *)
                       h.resync_editing ()
                   | _ -> ());
                  Ui_task.resolve ()
              | None ->
                  h.reload ();
                  Ui_task.resolve ())
          | None -> Ui_task.resolve ())))
  | _ ->
      (* journals route keeps its pages in current_journals — splice
         the queued deltas into the touched day(s) like the op path *)
      if !Subs_state.current_journals <> [] && deltas <> []
         && not unknown
      then
        let start_js = !Subs_state.current_journals in
        let all_dup =
          (not apply_template)
          && List.for_all Page_delta.delta_already_applied deltas
        in
        let* merged =
          Ui_task.catch
            (Page_delta.with_apply_queue (fun () ->
                let rec go js = function
                  | [] -> Ui_task.resolve (Page_delta.Applied js)
                  | d :: rest -> (
                      let* applied =
                        Page_delta.apply_to_journals ~strict:true
                          h.helpers_of js d
                      in
                      match applied with
                      | Page_delta.Applied js' -> go js' rest
                      | Page_delta.Unchanged -> go js rest
                      | Page_delta.Failed -> Ui_task.resolve Page_delta.Failed)
                in
                go start_js deltas))
            (fun _ -> Ui_task.resolve Page_delta.Failed)
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
             Ui_task.resolve ()
         | Page_delta.Applied _ | Page_delta.Unchanged ->
             if not all_dup then finish ();
             Ui_task.resolve ()
         | Page_delta.Failed -> (
             (* relevant but unspliceable — refetch only the days the
                deltas touched, never the whole journals route *)
             let touched (p : Model.page) =
               List.exists
                 (fun d -> Page_delta.delta_touches d p)
                 deltas
             in
             let rec refetch acc = function
               | [] -> Ui_task.resolve (Some (List.rev acc))
               | (p : Model.page) :: rest ->
                   if not (touched p) then refetch (p :: acc) rest
                   else
                     let* fresh =
                       Ui_task.catch (h.refetch_page p)
                         (fun _ -> Ui_task.resolve None)
                     in
                     (match fresh with
                      | Some p' -> refetch (p' :: acc) rest
                      | None -> Ui_task.resolve None)
             in
             let* js' = refetch [] start_js in
             match js' with
             | Some js'
               when !Subs_state.current_journals == start_js ->
                 h.publish_journals js';
                 (* refetched days already contain the deltas' effects
                    — mark so the next broadcast splices *)
                 List.iter Page_delta.note_applied_of_delta deltas;
                 if not all_dup then begin
                   finish ();
                   h.prune_overrides
                     (List.concat_map Page_delta.delta_uuids deltas)
                 end;
                 Ui_task.resolve ()
             | Some _ -> Ui_task.resolve ()
             | None ->
                 h.reload ();
                 Ui_task.resolve ()))
      else (
        h.reload ();
        finish ();
        Ui_task.resolve ())

(* "sync-db-changes" entry point — the worker broadcast lands here from
   Worker_events.dispatch with the whole tx report *)
let on_db_changes (payload : Wire.t) =
  Ui_services.perf_mark "worker:sync-db-changes";
  let h = hooks_or_fail () in
  (match Wire.get payload "delta" with
   | Some delta ->
       pending_deltas := !pending_deltas @ [ delta ];
       h.invalidate_pull_uuids (Page_delta.delta_uuids delta)
   | None ->
       pending_unknown_delta := true;
       h.invalidate_pull_caches ());
  (match
     Option.bind (Wire.get payload "tx-meta")
       (fun tm -> Wire.get tm "outliner-op")
   with
   | Some (Wire.Keyword "apply-template")
   | Some (Wire.String "apply-template") ->
       pending_apply_template := true
   | _ -> ());
  (* cljs pipeline.cljs publish-plugin-hook! — fire plugin db hooks for
     the tx report before the UI reloads *)
  h.fire_db_hooks payload;
  schedule_reload ()
