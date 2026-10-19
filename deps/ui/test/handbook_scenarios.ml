let fixture = {js|{:title "Test Handbook"
 :popular-topics ["1.Start/1.First-Topic"]
 :children ({:key "1.start" :title "Getting started" :description "Start here"
 :color "#dd2624" :icon "eyeglass"
 :children [{:key "1.start/_1.first_topic" :title "First topic café 中文 😀"
 :description "An introduction" :content "<p>One <strong>bold</strong></p>"
 :cover "./assets/Café image.png" :demos "./assets/guide video.mp4"}
 {:key "1.start/_2.second_topic" :title "Sync notes" :content "<p>Two</p>"}
 {:key "1.start/_3.guide" :title "Guide" :children
 ({:key "1.start/_3.guide/first" :title "Guide start" :content "<p>Start</p>"}
 {:key "1.start/_3.guide/second" :title "Guide finish" :content "<p>Finish</p>"
 :demos ["./assets/a.mp4" "./assets/b.mp4"]})}]}
 {:key "2.empty" :title "Empty" :children ()}
 {:key "3.sync" :title "Sync" :children
 ({:key "3.sync/_1.setup" :title "Sync account" :content "<p>Account</p>"})})}|js}

let run ~check =
  let catalog=Handbook_data.parse fixture in
  let key node=node.Handbook_data.key in
  let keys nodes=List.map key nodes in
  check "Handbook parses the actual EDN list/vector tree shape"
    (catalog.root.title="Test Handbook" && List.length catalog.entries=10);
  check "Handbook hides empty categories while preserving catalog entries"
    (keys (Handbook_data.categories catalog)=["1.start";"3.sync"] &&
     Option.is_some (Handbook_data.get catalog "2.empty"));
  check "Handbook resolves published mixed-case popular topic keys"
    (keys (Handbook_data.popular catalog)=["1.start/_1.first_topic"]);
  check "Handbook normalizes keys once without altering canonical underscores"
    (Handbook_data.normalize_key "1.Getting-Started/2.First-Topic"="1.getting_started/_2.first_topic" &&
     Handbook_data.normalize_key "1.getting_started/_2.first_topic"="1.getting_started/_2.first_topic");
  check "Handbook preserves Unicode, rich content and media metadata"
    (match Handbook_data.get catalog "1.start/_1.first_topic" with
     | Some node -> node.title={js|First topic café 中文 😀|js} &&
         node.content=Some "<p>One <strong>bold</strong></p>" &&
         node.cover=Some {js|./assets/Café image.png|js} && node.demos=["./assets/guide video.mp4"]
     | None -> false);
  check "Handbook admits multiple chapter demos"
    (Option.map (fun node -> node.Handbook_data.demos)
       (Handbook_data.get catalog "1.start/_3.guide/second")=Some ["./assets/a.mp4";"./assets/b.mp4"]);
  check "Handbook retains category styling metadata"
    (match Handbook_data.get catalog "1.start" with
     | Some node -> node.color=Some "#dd2624" && node.icon=Some "eyeglass" && node.description=Some "Start here"
     | None -> false);
  let resolves from href expected =
    try Handbook_data.resolve catalog ~from href=expected with _ -> false in
  check "Handbook follows relative sibling article links"
    (resolves "1.start/_1.first_topic" "./2.Second-Topic.edn" (Handbook_data.Internal "1.start/_2.second_topic"));
  check "Handbook follows relative category links"
    (resolves "1.start/_1.first_topic" "../3.sync" (Handbook_data.Internal "3.sync"));
  check "Handbook follows nested chapter and explicit root links"
    (resolves "1.start/_3.guide/first" "second" (Handbook_data.Internal "1.start/_3.guide/second") &&
     resolves "1.start/_3.guide/first" "@/3.Sync/1.Setup" (Handbook_data.Internal "3.sync/_1.setup"));
  check "Handbook preserves external URLs for their host action"
    (resolves "1.start/_1.first_topic" "https://example.com/a" (Handbook_data.External "https://example.com/a"));
  check "Handbook encodes relative asset paths without corrupting Unicode or percent escapes"
    (Handbook_data.asset_url {js|./assets/Café image 中文 😀.png|js}=
       "https://handbooks.pages.dev/assets/Caf%C3%A9%20image%20%E4%B8%AD%E6%96%87%20%F0%9F%98%80.png" &&
     Handbook_data.asset_url "/assets/already%20encoded.png"="https://handbooks.pages.dev/assets/already%20encoded.png" &&
     Handbook_data.asset_url "https://example.com/image.png"="https://example.com/image.png");
  check "Handbook searches the complete title catalog"
    (keys (Handbook_data.search catalog "sync")=["3.sync";"1.start/_2.second_topic";"3.sync/_1.setup"]);
  check "Handbook category search stays within its topic and chapter descendants"
    (keys (Handbook_data.search ~within:"1.start" catalog "sync")=["1.start/_2.second_topic"] &&
     keys (Handbook_data.search ~within:"1.start" catalog "finish")=["1.start/_3.guide/second"]);
  check "Handbook search preserves accented, Chinese and emoji titles"
    (keys (Handbook_data.search catalog "cafe")=["1.start/_1.first_topic"] &&
     keys (Handbook_data.search catalog {js|中文|js})=["1.start/_1.first_topic"] &&
     keys (Handbook_data.search catalog {js|😀|js})=["1.start/_1.first_topic"]);
  check "Empty and unmatched Handbook searches are empty"
    (Handbook_data.search catalog "   "=[] && Handbook_data.search catalog "missing-zzz"=[]);
  check "Opening a topic group selects its first readable chapter"
    (Option.map key (Handbook_data.reading_node catalog "1.start/_3.guide")=Some "1.start/_3.guide/first");
  check "Handbook chapter controls move within the current sibling group"
    (Option.map key (Handbook_data.adjacent catalog "1.start/_3.guide/first" `Next)=Some "1.start/_3.guide/second" &&
     Option.map key (Handbook_data.adjacent catalog "1.start/_3.guide/second" `Prev)=Some "1.start/_3.guide/first" &&
     Handbook_data.adjacent catalog "1.start/_3.guide/first" `Prev=None &&
     Handbook_data.adjacent catalog "1.start/_3.guide/second" `Next=None);
  check "Handbook flat categories also expose next-topic controls"
    (Option.map key (Handbook_data.adjacent catalog "1.start/_1.first_topic" `Next)=Some "1.start/_2.second_topic");
  let rejects f=try ignore (f ());false with Invalid_argument _ | Edn.Parse_error _ -> true in
  List.iter (fun (name,source) -> check ("Handbook rejects " ^ name)
    (rejects (fun () -> Handbook_data.parse source)))
    ["an invalid catalog root","[]";
     "missing topic keys","{:title \"Root\" :children [{:title \"Missing\"}]}";
     "duplicate topic keys","{:title \"Root\" :children [{:key \"same\" :title \"A\"} {:key \"same\" :title \"B\"}]}";
     "invalid content fields","{:title \"Root\" :children [{:key \"a\" :title \"A\" :content 42}]}";
     "invalid child collections","{:title \"Root\" :children 42}";
     "invalid demo collections","{:title \"Root\" :children [{:key \"a\" :title \"A\" :demos [42]}]}" ];
  check "Broken internal Handbook links fail explicitly"
    (rejects (fun () -> Handbook_data.resolve catalog ~from:"1.start/_1.first_topic" "missing"))
