(ns frontend.schema-register
  "Macro 'defkeyword' to def keyword with docstring and malli-schema")


(defmacro defkeyword
  "Define keyword with docstring and malli-schema"
  [kw docstring & [optional-malli-schema]]
  (assert (keyword? kw) "must be keyword")
  (assert (some? docstring) "must have 'docstring' arg")
  (let [register-schema (when optional-malli-schema
                          `[(assert (frontend.schema-register/not-register-yet? ~kw) (str "Already registered: " ~kw))
                            (frontend.schema-register/register! ~kw ~optional-malli-schema)])]
    `(do
       (cljs.spec.alpha/def ~kw any?)
       ~@register-schema)))
