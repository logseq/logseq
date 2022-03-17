(ns frontend.spec)

(defmacro valid?
  "same as `s/valid?`, and will print explain info when false"
  [spec x]
  `(let [r# (cljs.spec.alpha/valid? ~spec ~x)]
    (when-not r#
      (cljs.spec.alpha/explain ~spec ~x)
      (println ~x))
    r#))
