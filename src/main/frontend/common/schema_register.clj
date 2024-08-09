(ns frontend.common.schema-register
  "Macro 'defkeyword' to def keyword with docstring and malli-schema.
   Used by frontend and worker namespaces")


(defmacro defkeyword
  "Define keyword with docstring and malli-schema"
  [kw docstring & [optional-malli-schema]]
  (assert (keyword? kw) "must be keyword")
  (assert (some? docstring) "must have 'docstring' arg")
  (when optional-malli-schema
    `(do (assert (frontend.common.schema-register/not-register-yet? ~kw) (str "Already registered: " ~kw))
         (frontend.common.schema-register/register! ~kw ~optional-malli-schema))))
