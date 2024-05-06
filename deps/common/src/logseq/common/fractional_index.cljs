(ns logseq.common.fractional-index
  "Fractional indexing to create an ordering that can be used for Realtime Editing of Ordered Sequences")

;; Original code from https://github.com/rocicorp/fractional-indexing,
;; It's converted to cljs by using AI.

(def base-62-digits
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz")

(defn char->int
  [^js c]
  (.charCodeAt c))

(defn get-integer-length
  [head]
  (let [head-char (char->int head)]
    (cond
      (and (>= head-char (char->int \a)) (<= head-char (char->int \z)))
      (+ (- head-char (char->int \a)) 2)

      (and (>= head-char (char->int \A)) (<= head-char (char->int \Z)))
      (+ (- (char->int \Z) head-char) 2)

      :else
      (throw (js/Error. (str "invalid order key head: " head))))))

(defn validate-integer
  [int]
  (when-not (= (count int) (get-integer-length (first int)))
    (throw (js/Error. (str "invalid integer part of order key: " int)))))

(defn get-integer-part
  [key]
  (let [integer-part-length (get-integer-length (first key))]
    (when (> integer-part-length (count key))
      (throw (js/Error. (str "invalid order key: " key))))
    (subs key 0 integer-part-length)))

(defn validate-order-key
  [key digits]
  (when (= key (str "A" (repeat 26 (first digits))))
    (throw (js/Error. (str "invalid order key: " key))))
  (let [i (get-integer-part key)
        f (subs key (count i))]
    (when (= (last f) (first digits))
      (throw (js/Error. (str "invalid order key: " key))))))

(defn increment-integer
  [x digits]
  (validate-integer x)
  (let [[head & digs] (seq x)
        [carry? diff] (reduce
                        (fn [[carry? digs] dig]
                          (if carry?
                            (let [d (inc (.indexOf digits dig))]
                              (if (= d (count digits))
                                [true (conj digs (first digits))]
                                [false (conj digs (nth digits d))]))
                            [carry? digs]))
                        [true []]
                        (reverse digs))
        digs (into (subvec (vec digs) 0 (- (count digs)
                                           (count diff)))
                   (reverse diff))]
    (if carry?
      (cond
        (= head \Z) (str "a" (first digits))
        (= head \z) nil
        :else (let [h (char (inc (.charCodeAt head 0)))
                    digs (if (> (compare h \a) 0)
                           (conj digs (first digits))
                           (pop digs))]
                (str h (apply str digs))))
      (str head (apply str digs)))))

(defn decrement-integer
  [x digits]
  (validate-integer x)
  (let [[head & digs] (seq x)
        [borrow digs] (reduce
                       (fn [[_ digs] dig]
                         (let [d (dec (.indexOf digits dig))]
                           (if (= d -1)
                             [true (conj digs (last digits))]
                             [false (conj digs (nth digits d))])))
                       [true []]
                       (reverse digs))]
    (if borrow
      (cond
        (= head \a) (str "Z" (last digits))
        (= head \A) nil
        :else (let [h (char (- (.charCodeAt head 0) 1))
                    digs (if (< (compare h \Z) 0)
                           (conj digs (last digits))
                           (pop digs))]
                (str h (apply str digs))))
      (str head (apply str digs)))))

(defn midpoint
  [a b digits]
  (let [zero (first digits)]
    (when (and b (or (>= (compare a b) 0) (= (last a) zero) (= (last b) zero)))
      (throw (js/Error. (str a " >= " b " or trailing zero"))))
    (let [n (when b
              (first (keep-indexed (fn [i _c] (when-not (= (nth a i zero) (nth b i)) i)) b)))]
      (if (and n (> n 0))
        (str (subs b 0 n) (midpoint (subs a n) (subs b n) digits))
        (let [digit-a (if (seq a) (.indexOf digits (first a)) 0)
              digit-b (if (seq b) (.indexOf digits (first b)) (count digits))]
          (if (> (- digit-b digit-a) 1)
            (str (nth digits (Math/round (* 0.5 (+ digit-a digit-b)))))
            (if (and (seq b) (> (count b) 1))
              (subs b 0 1)
              (str (nth digits digit-a) (midpoint (subs a 1) nil digits)))))))))

(defn generate-key-between
  [a b & {:keys [digits]
          :or {digits base-62-digits}}]
  (when a (validate-order-key a digits))
  (when b (validate-order-key b digits))
  (when (and a b (>= (compare a b) 0))
    (throw (js/Error. (str a " >= " b))))
  (cond
    (nil? a) (if (nil? b)
               (str "a" (first digits))
               (let [ib (get-integer-part b)
                     fb (subs b (count ib))]
                 (if (= ib (str "A" (apply str (repeat 26 (first digits)))))
                   (str ib (midpoint "" fb digits))
                   (if (< (compare ib b) 0)
                     ib
                     (let [res (decrement-integer ib digits)]
                       (if (nil? res)
                         (throw (js/Error. "cannot decrement any more"))
                         res))))))
    (nil? b) (let [ia (get-integer-part a)
                   fa (subs a (count ia))
                   i (increment-integer ia digits)]
               (if (nil? i)
                 (str ia (midpoint fa nil digits))
                 i))
    :else (let [ia (get-integer-part a)
                fa (subs a (count ia))
                ib (get-integer-part b)
                fb (subs b (count ib))]
            (if (= ia ib)
              (str ia (midpoint fa fb digits))
              (let [i (increment-integer ia digits)]
                (if (nil? i)
                  (throw (js/Error. "cannot increment any more"))
                  (if (< (compare i b) 0) i (str ia (midpoint fa nil digits)))))))))

(defn generate-n-keys-between
  [a b n & {:keys [digits]
            :or {digits base-62-digits}}]
  (cond
    (= n 0) []
    (= n 1) [(generate-key-between a b digits)]
    :else (let [c (generate-key-between a b digits)]
            (concat
             (generate-n-keys-between a c (Math/floor (/ n 2)) digits)
             [c]
             (generate-n-keys-between c b (- n (Math/floor (/ n 2)) 1) digits)))))
