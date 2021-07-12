(ns frontend.extensions.zotero.schema
  (:require [frontend.util :as util]
            [shadow.resource :as rc]))

(def schema (-> (rc/inline "zotero-schema.json")
                (util/json->clj true)))
