(ns electron.interop)

(defn default-function-or-module
  [module]
  (let [default-export (.-default ^js module)]
    (if (fn? default-export)
      default-export
      module)))
