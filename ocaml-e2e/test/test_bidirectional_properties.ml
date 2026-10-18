(** Port of bidirectional_properties_test.clj. *)

open Fest.Promise

let env = Fixtures.shared_open_page ()

let () =
  Fest.Promise.test "bidirectional-properties-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let friend_prop = "friend" in
    let person_tag = "Person" in
    let project_tag = "Project" in
    let target = "Bob" in
    let container_page = "Bidirectional Props" in
    let* _ =
      Api.ls_api_call env "editor.createTag"
        [| Api.str person_tag
         ; Api.obj
             [ ( "tagProperties"
               , Api.arr
                   [| Api.obj
                        [ "name", Api.str friend_prop
                        ; "schema", Api.obj [ "type", Api.str "node" ] ]
                   |] ) ]
        |]
    in
    let* _ =
      Api.ls_api_call env "editor.createTag" [| Api.str project_tag |]
    in
    let* person =
      Api.ls_api_call env "editor.getTag" [| Api.str person_tag |]
    in
    let* friend =
      Api.ls_api_call env "editor.getPage" [| Api.str friend_prop |]
    in
    let person_uuid = Api.get_uuid person () in
    let friend_id =
      match Api.get_id friend () with
      | Some n -> float_of_int n
      | None -> failwith "friend id missing"
    in
    let person_id =
      match Api.get_id person () with
      | Some n -> float_of_int n
      | None -> failwith "person id missing"
    in
    let* _ =
      Api.ls_api_call env "editor.upsertBlockProperty"
        [| Api.num friend_id
         ; Api.str "logseq.property/classes"
         ; Api.num person_id |]
    in
    Fest.equal (person_uuid <> None) true Fest.expect;
    let person_uuid' = match person_uuid with Some u -> u | None -> "" in
    let* _ =
      Api.ls_api_call env "editor.upsertBlockProperty"
        [| Api.str person_uuid'
         ; Api.str "logseq.property.class/bidirectional-property-title"
         ; Api.str "People" |]
    in
    let* _ =
      Api.ls_api_call env "editor.upsertBlockProperty"
        [| Api.str person_uuid'
         ; Api.str "logseq.property.class/enable-bidirectional?"
         ; Api.bool true |]
    in
    let* _ = Api.ls_api_call env "editor.createPage" [| Api.str target |] in
    let* _ =
      Api.ls_api_call env "editor.createPage" [| Api.str container_page |]
    in
    let* bob = Api.ls_api_call env "editor.getPage" [| Api.str target |] in
    let bob_id =
      match Api.get_id bob () with
      | Some n -> float_of_int n
      | None -> failwith "bob id missing"
    in
    let* _ =
      Api.ls_api_call env "editor.insertBlock"
        [| Api.str container_page
         ; Api.str ("Alice #" ^ person_tag)
         ; Api.obj [ ("properties", Api.obj [ (friend_prop, Api.num bob_id) ]) ]
        |]
    in
    let* _ =
      Api.ls_api_call env "editor.insertBlock"
        [| Api.str container_page
         ; Api.str ("Charlie #" ^ project_tag)
         ; Api.obj [ ("properties", Api.obj [ (friend_prop, Api.num bob_id) ]) ]
        |]
    in
    let* () = Ls_page.goto_page env target in
    let* () = Pw.wait_for env ".property-k:text('People')" in
    let* _ =
      E2e_assert.is_visible env
        ".property-value .block-title-wrap:text('Alice')"
    in
    let* () =
      E2e_assert.have_count env ".property-k:text('Projects')" 0
    in
    Fixtures.validate_graph env)
