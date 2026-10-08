let () =
  let queue = Queue.create () and owner = ref true in
  let mutex = Mutex.create () in
  let enqueue callback = Mutex.lock mutex; Queue.add callback queue; Mutex.unlock mutex in
  let take () =
    Mutex.lock mutex;
    let callback = if Queue.is_empty queue then None else Some (Queue.take queue) in
    Mutex.unlock mutex;
    callback
  in
  let rec drain () = match take () with None -> () | Some callback -> callback (); drain () in
  let set_owner = function None -> !owner | Some value -> owner := value; value in
  Ui_task_scenarios.run ~enqueue ~drain ~set_owner ();
  let main_thread = Thread.id (Thread.self ()) in
  let task, resolve, _ = Ui_task.pending () in
  let callback_thread = ref None in
  ignore (Ui_task.bind task (fun () ->
    callback_thread := Some (Thread.id (Thread.self ()));
    Ui_task.resolve ()));
  let worker = Thread.create resolve () in
  Thread.join worker;
  if !callback_thread <> None then failwith "worker thread executed UI callback";
  drain ();
  if !callback_thread <> Some main_thread then failwith "callback did not run on the application thread";
  print_endline "PASS real native I/O completion enters the application thread";
  Ui_services_scenarios.run ()
