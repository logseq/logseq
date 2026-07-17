module Db_platform = Melange_db_worker_spec.Platform
module Browser_api = Entry_common.Make (Db_platform.Browser)
module Bridge = Entry_bridge.Bridge

module Platform = struct
  type browser_platform = Browser_api.base_platform

  let browser_platform () = Browser_api.base_platform ()
  let browser = browser_platform ()
end
