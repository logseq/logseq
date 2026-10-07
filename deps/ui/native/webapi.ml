(* Opaque host-object types. Native code never dereferences these —
   platform functions that return them are stubs, and the values flow
   only back into stubs. *)
  type opaque = int

  module Dom = struct
    module Element = struct
      type t = opaque
    end

    module Document = struct
      type t = opaque
    end

    module HtmlInputElement = struct
      type t = opaque
    end

    module HtmlTextAreaElement = struct
      type t = opaque
    end
  end

  module Blob = struct
    type t = opaque
  end

  module File = struct
    type t = opaque
  end

  module Url = struct
    let createObjectURL _ = failwith "Webapi.Url.createObjectURL"
    let revokeObjectURL _ = ()
  end
