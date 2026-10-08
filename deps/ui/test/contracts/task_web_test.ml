let () =
  let queue = Queue.create () and owner = ref true in
  let enqueue callback = Queue.add callback queue in
  let drain () = while not (Queue.is_empty queue) do Queue.take queue () done in
  let set_owner = function None -> !owner | Some value -> owner := value; value in
  Ui_task_scenarios.run ~enqueue ~drain ~set_owner ();
  Ui_services_scenarios.run ()
