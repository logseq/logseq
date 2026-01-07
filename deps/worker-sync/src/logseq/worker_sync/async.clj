(ns logseq.worker-sync.async
  (:require [shadow.cljs.modern]))

(defmacro js-await
  "Like `let` but for async values, executed sequentially.
  Non-async values are wrapped in `js/Promise.resolve`."
  [[a b & bindings] & body]
  (let [b `(~'js/Promise.resolve ~b)]
    (if (seq bindings)
      `(shadow.cljs.modern/js-await ~[a b] (js-await ~bindings ~@body))
      `(shadow.cljs.modern/js-await ~[a b] ~@body))))
