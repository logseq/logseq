val e2e_init_script : string
val refresh_ready_script : string
val install_init_script : Playwright.context -> unit Js.Promise.t
val wait_test_env_ready : Env.t -> bool Js.Promise.t
val test_env_ready : Env.t -> bool Js.Promise.t
val refresh_test_env : Env.t -> bool Js.Promise.t
val developer_mode : Env.t -> bool Js.Promise.t
