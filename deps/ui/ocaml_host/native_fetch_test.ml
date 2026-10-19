let failures=ref 0
let check message value =
  if not value then (incr failures;Printf.eprintf "FAIL: %s\n%!" message)

let await ?(timeout=4.) promise =
  let result=ref None in
  ignore (Js.Promise.catch (fun error -> result:=Some (Error error);Js.Promise.resolve ())
    (Js.Promise.then_ (fun value -> result:=Some (Ok value);Js.Promise.resolve ()) promise));
  let deadline=Unix.gettimeofday ()+.timeout in
  while !result=None && Unix.gettimeofday ()<deadline do Host.drain ();Thread.delay 0.001 done;
  match !result with Some value -> value | None -> failwith "Native Fetch completion timed out"

let with_server ?(requests=1) respond run =
  let socket=Unix.socket ~cloexec:true Unix.PF_INET Unix.SOCK_STREAM 0 in
  Unix.bind socket (Unix.ADDR_INET (Unix.inet_addr_loopback,0));Unix.listen socket 4;
  let port=match Unix.getsockname socket with Unix.ADDR_INET (_,port) -> port | _ -> assert false in
  let received=ref [] and error=ref None in
  let worker=Thread.create (fun () ->
    try for _=1 to requests do
      let readable,_,_=Unix.select [socket] [] [] 2. in
      if readable=[] then failwith "Native Fetch did not connect";
      let connection,_=Unix.accept ~cloexec:true socket in
      let input=Unix.in_channel_of_descr connection and output=Unix.out_channel_of_descr connection in
      Fun.protect ~finally:(fun () -> close_out_noerr output;close_in_noerr input) (fun () ->
        let request=String.trim (input_line input) in
        let rec headers collected =
          let line=String.trim (input_line input) in
          if line="" then List.rev collected else
          let colon=String.index line ':' in
          headers ((String.lowercase_ascii (String.sub line 0 colon),
            String.trim (String.sub line (colon+1) (String.length line-colon-1)))::collected) in
        let headers=headers [] in
        let length=match List.assoc_opt "content-length" headers with None -> 0 | Some value -> int_of_string value in
        let body=really_input_string input length in
        received:=(request,headers,body)::!received;
        let status,extra,response=respond request headers body in
        Printf.fprintf output "HTTP/1.1 %d Test\r\nConnection: close\r\nContent-Length: %d\r\n%s\r\n%s"
          status (String.length response) extra response;
        flush output)
    done with failure -> error:=Some failure) () in
  let value=Fun.protect ~finally:(fun () -> Thread.join worker;Unix.close socket)
    (fun () -> run ("http://127.0.0.1:" ^ string_of_int port)) in
  check "Native Fetch reaches the real server" (!error=None);
  value,List.rev !received

let () =
  let owner=Thread.id (Thread.self ()) in
  let payload="{\"value\":\"café 中文 😀\"}" in
  let released=Atomic.make false and responded_early=Atomic.make false in
  let response,_=with_server (fun _ _ _ ->
      let deadline=Unix.gettimeofday ()+.0.5 in
      while not (Atomic.get released) && Unix.gettimeofday ()<deadline do Thread.delay 0.001 done;
      Atomic.set responded_early (not (Atomic.get released));
      200,"Content-Type: application/json\r\n",payload)
    (fun base ->
      let callback=ref None in
      let pending=Fetch.fetch (base ^ "/content") in
      Atomic.set released true;
      check "Native Fetch returns while the response is still pending" (not (Atomic.get responded_early));
      ignore (Js.Promise.then_ (fun response ->
        callback:=Some (Thread.id (Thread.self ()));Js.Promise.resolve response) pending);
      check "Native Fetch settles only through the UI mailbox" (!callback=None);
      let response=await pending in
      check "Native Fetch callbacks run on the owning UI thread" (!callback=Some owner);
      response) in
  check "Native Fetch returns the real status and Unicode body"
    (match response with Ok response -> response.Fetch.Response.status=200 &&
      Fetch.Response.ok response && await (Fetch.Response.text response)=Ok payload | Error _ -> false);
  check "Native Fetch parses the actual Unicode JSON response"
    (match response with Ok response ->
      (match await (Fetch.Response.json response) with
       | Ok (Js.Json.JObject [("value",Js.Json.JString value)]) -> value="café 中文 😀"
       | _ -> false) | Error _ -> false);
  let response,received=with_server (fun _ _ body -> 201,"",body) (fun base ->
    await (Fetch.fetchWithInit (base ^ "/submit")
      (Fetch.RequestInit.make ~method_:Fetch.Post
        ~headers:(Fetch.HeadersInit.makeWithArray [|"X-Request","native";"Content-Type","text/plain"|])
        ~body:(Fetch.BodyInit.make "native request café 中文 😀") ()))) in
  check "Native Fetch sends the requested method, headers and body"
    (match received with [("POST /submit HTTP/1.1",headers,body)] ->
      List.assoc_opt "x-request" headers=Some "native" &&
      List.assoc_opt "content-type" headers=Some "text/plain" && body="native request café 中文 😀"
     | _ -> false);
  check "Native Fetch preserves created responses"
    (match response with Ok response -> response.Fetch.Response.status=201 && Fetch.Response.ok response | _ -> false);
  let response,_=with_server ~requests:2 (fun request _ _ ->
    if request="GET /redirect HTTP/1.1" then 302,"Location: /final\r\n",""
    else 200,"","redirected") (fun base -> await (Fetch.fetch (base ^ "/redirect"))) in
  check "Native Fetch follows redirects and returns the final response"
    (match response with Ok response -> response.Fetch.Response.status=200 &&
      await (Fetch.Response.text response)=Ok "redirected" | _ -> false);
  let response,_=with_server (fun _ _ _ -> 503,"","unavailable")
    (fun base -> await (Fetch.fetch (base ^ "/failure"))) in
  check "HTTP failure remains a response with its real status and body"
    (match response with Ok response -> response.Fetch.Response.status=503 &&
      not (Fetch.Response.ok response) && await (Fetch.Response.text response)=Ok "unavailable" | _ -> false);
  let response,_=with_server (fun _ _ _ -> 200,"","invalid json")
    (fun base -> await (Fetch.fetch (base ^ "/invalid-json"))) in
  check "Invalid response JSON rejects rather than inventing content"
    (match response with Ok response -> Result.is_error (await (Fetch.Response.json response)) | _ -> false);
  check "Malformed native Fetch URLs reject" (Result.is_error (await (Fetch.fetch "not a URL")));
  check "Unsupported native Fetch schemes reject" (Result.is_error (await (Fetch.fetch "file:///etc/hosts")));
  let socket=Unix.socket ~cloexec:true Unix.PF_INET Unix.SOCK_STREAM 0 in
  Unix.bind socket (Unix.ADDR_INET (Unix.inet_addr_loopback,0));
  let port=match Unix.getsockname socket with Unix.ADDR_INET (_,port) -> port | _ -> assert false in
  Unix.close socket;
  check "Connection failures reject instead of resolving status zero"
    (Result.is_error (await (Fetch.fetch ("http://127.0.0.1:" ^ string_of_int port ^ "/"))));
  if Array.mem "--handbook" Sys.argv then begin
    match await ~timeout:35. (Fetch.fetch "https://handbooks.pages.dev/handbooks.edn") with
    | Ok response ->
        check "Public Handbook HTTPS returns actual content"
          (response.Fetch.Response.status=200 && String.length response.body>10_000);
        check "Public Handbook content contains the real EDN catalog"
          (match Edn.parse response.body with
           | Wire.Map fields -> List.assoc_opt (Wire.Keyword "title") fields=Some (Wire.String "Logseq Handbook")
           | _ -> false);
        Printf.printf "native Handbook HTTPS status=%d bytes=%d\n%!"
          response.status (String.length response.body)
    | Error failure -> incr failures;Printf.eprintf "Handbook HTTPS: %s\n%!" (Printexc.to_string failure)
  end;
  Printf.printf "native Fetch: %d failures\n%!" !failures;
  if !failures<>0 then exit 1
