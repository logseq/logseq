let () =
  Handbook_scenarios.run ~check:(fun message condition -> if not condition then failwith message);
  print_endline "native Handbook catalog, search, links, Unicode and chapters: OK";
  if Array.length Sys.argv=2 then begin
    let source=In_channel.with_open_bin Sys.argv.(1) In_channel.input_all in
    let catalog=Handbook_data.parse source in
    let links=ref 0 in
    List.iter (fun node -> Option.iter (fun content ->
      let nodes,_=Render_html.parse_nodes content 0 (String.length content) [] in
      let rec visit = function
        | Render_html.Text _ -> ()
        | Render_html.Elem (tag,attributes,children) ->
            if tag="a" then Option.iter (fun href ->
              ignore (Handbook_data.resolve catalog ~from:node.Handbook_data.key href);incr links)
              (List.assoc_opt "href" attributes);
            List.iter visit children in
      List.iter visit nodes) node.Handbook_data.content) catalog.entries;
    let keys nodes=Json.Array (Array.of_list (List.map (fun node -> Json.String node.Handbook_data.key) nodes)) in
    print_endline (Json.stringify (Json.Object [
      "entries",Json.Number (float_of_int (List.length catalog.entries));
      "categories",keys (Handbook_data.categories catalog);
      "popular",keys (Handbook_data.popular catalog);
      "sync",keys (Handbook_data.search catalog "sync");
      "validated_links",Json.Number (float_of_int !links)]))
  end
