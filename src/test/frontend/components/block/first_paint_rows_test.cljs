(ns frontend.components.block.first-paint-rows-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.block :as block]))

(deftest defer-rows-below-fold-test
  (let [page {:current-page? true :virtualize? true}
        defer? #'block/defer-rows-below-fold?]
    (testing "a page opened from its route defers its rows below the fold"
      (is (true? (defer? page {:saved-scroll-top 0})))
      (is (true? (defer? page {:saved-scroll-top nil}))))
    (testing "an open that must reach a row that can lie below the fold renders every row"
      (is (false? (defer? page {:anchor "ls-block-00000000-0000-0000-0000-000000000000"})))
      (is (false? (defer? page {:saved-scroll-top 480}))))
    (testing "only the standalone page outliner defers"
      (is (false? (defer? (dissoc page :current-page?) {})))
      (is (false? (defer? (dissoc page :virtualize?) {}))))
    (testing "the rtc tests render every row"
      (is (false? (defer? page {:rtc-test? true}))))))

(deftest rows-to-render-test
  (let [rows-to-render #'block/rows-to-render]
    (testing "rows that reach the bottom of the viewport are enough"
      (is (nil? (rows-to-render 3 10 170 700 700)))
      (is (nil? (rows-to-render 3 10 170 1400 700))))
    (testing "a list whose rows are all rendered stops"
      (is (nil? (rows-to-render 10 10 170 400 700))))
    (testing "rows are added at the average height, at most max(2, limit) per pass"
      ;; 1 row of 76 px: 6 would fill the viewport, 2 are added
      (is (= 3 (rows-to-render 1 13 170 246 700)))
      ;; 3 rows of 76 px on average: 4 would fill it, 3 are added
      (is (= 6 (rows-to-render 3 13 170 398 700)))
      ;; 4 rows of 107.5 px on average: 1 more fills it
      (is (= 5 (rows-to-render 4 30 170 600 700))))
    (testing "never more rows than the list holds"
      (is (= 4 (rows-to-render 3 4 170 200 700))))
    (testing "rows without height still grow the list"
      (is (= 3 (rows-to-render 1 13 170 170 700))))))

(defn- fake-wrap
  "A stand-in for a .blocks-list-wrap: its box and the lists inside it."
  [top bottom inside]
  #js {:getBoundingClientRect (fn [] #js {:top top :bottom bottom})
       :contains (fn [other] (boolean (some #(identical? % other) @inside)))})

(defn- fake-entry
  [wrap limit n]
  #js {:wrap #js {:current wrap} :limit limit :count n})

(deftest lists-to-grow-test
  (let [lists-to-grow #'block/lists-to-grow
        outer-inside (atom [])
        inner-wrap (fake-wrap 300 600 (atom []))
        outer-wrap (fake-wrap 170 600 outer-inside)
        _ (reset! outer-inside [inner-wrap])]
    (testing "the innermost list that ends above the fold grows first"
      (let [outer (fake-entry outer-wrap 2 5)
            inner (fake-entry inner-wrap 1 4)]
        (is (= [inner] (lists-to-grow [outer inner] 700)))))
    (testing "once the inner list has all its rows, the outer list grows"
      (let [outer (fake-entry outer-wrap 2 5)
            inner (fake-entry inner-wrap 4 4)]
        (is (= [outer] (lists-to-grow [outer inner] 700)))))
    (testing "a list that reaches the fold does not grow"
      (is (= [] (lists-to-grow [(fake-entry (fake-wrap 170 900 (atom [])) 2 9)] 700))))
    (testing "a list not in the DOM is skipped"
      (is (= [] (lists-to-grow [#js {:wrap #js {:current nil} :limit 1 :count 3}] 700))))))

(deftest close-first-paint-session-test
  (let [^js session (#'block/first-paint-session)
        calls (atom [])
        entry (fn [id] #js {:setLimit (fn [limit] (swap! calls conj [id limit]))})]
    (.add (.-lists session) (entry :a))
    (.add (.-lists session) (entry :b))
    (#'block/close-first-paint-session! session)
    (testing "every deferred tail mounts: each list renders all its rows"
      (is (= #{[:a nil] [:b nil]} (set @calls)))
      (is (= 2 (count @calls))))
    (testing "the session is over: lists mounting now render every row"
      (is (false? (#'block/first-paint-session-open? session)))
      (is (zero? (.-size (.-lists session)))))
    (testing "closing again does nothing"
      (#'block/close-first-paint-session! session)
      (is (= 2 (count @calls))))))

;; A page model for fill-viewport!: lists of rows with heights, where a row
;; may hold a nested list that mounts (with 1 row) when its row renders.
;; Lists stack without gaps from the top of the page at 170 px.

(defn- model-list
  [heights nested]
  (atom {:heights heights :nested nested :limit 1 :entry nil}))

(defn- list-height
  [lst]
  (let [{:keys [heights nested limit]} @lst]
    (reduce + (map-indexed (fn [idx h]
                             (+ h (if-let [child (get nested idx)]
                                    (list-height child)
                                    0)))
                           (take limit heights)))))

(defn- list-top
  "Top of `lst` in the model: after the rows before it in each ancestor."
  [root lst]
  (letfn [(walk [cur top]
            (if (identical? cur lst)
              top
              (let [{:keys [heights nested limit]} @cur]
                (loop [idx 0 y top]
                  (when (< idx limit)
                    (let [row-bottom (+ y (nth heights idx))
                          child (get nested idx)
                          found (when child (walk child row-bottom))]
                      (or found
                          (recur (inc idx)
                                 (+ row-bottom (if child (list-height child) 0))))))))))]
    (walk root 170)))

(defn- mounted-lists
  [lst]
  (let [{:keys [nested limit]} @lst]
    (cons lst (mapcat (fn [[idx child]]
                        (when (< idx limit) (mounted-lists child)))
                      nested))))

(defn- model-session
  "A first-paint session over the model: an entry per mounted list, as the
   lists register on mount."
  [root]
  (let [^js session (#'block/first-paint-session)
        sync! (fn sync! []
                (doseq [lst (mounted-lists root)]
                  (when-not (:entry @lst)
                    (let [entry #js {:count (count (:heights @lst))}
                          wrap #js {:getBoundingClientRect
                                    (fn []
                                      (let [top (list-top root lst)]
                                        #js {:top top :bottom (+ top (list-height lst))}))
                                    :contains
                                    (fn [other]
                                      (boolean
                                       (some #(identical? (some-> (:entry @%) .-wrap .-current) other)
                                             (rest (mounted-lists lst)))))}]
                      (set! (.-wrap entry) #js {:current wrap})
                      (set! (.-setLimit entry)
                            (fn [n]
                              (swap! lst assoc :limit (or n (count (:heights @lst))))
                              (sync!)))
                      (swap! lst assoc :entry entry)
                      (.add (.-lists session) entry)))
                  (let [^js entry (:entry @lst)]
                    (set! (.-limit entry) (:limit @lst)))))]
    (sync!)
    session))

(defn- fill!
  [session]
  (with-redefs [block/flush-sync! (fn [f] (f))
                block/first-paint-viewport-bottom (constantly 700)]
    (#'block/fill-viewport! session)))

(deftest fill-viewport-flat-list-test
  (testing "a flat list renders the rows up to the one that crosses the fold"
    ;; the rows of `Theory of small talk`: the sixth (816 px) crosses 700 px
    (let [root (model-list [72 120 24 72 48 816 72 96 24 48 96 96 72] {})
          session (model-session root)]
      (fill! session)
      (is (= 6 (:limit @root)))
      (is (#'block/first-paint-session-open? session)
          "the tail waits for the task after the paint"))))

(deftest fill-viewport-nested-lists-test
  (testing "a nested list that crosses the fold grows, its ancestors wait for it"
    (let [l2 (model-list [152 200 139 152 24] {})
          l1 (model-list [24 24 24 24] {0 l2})
          root (model-list [24 24 24 24 24] {2 l1})
          session (model-session root)]
      (fill! session)
      ;; root rows end at 266; l2 rows start there: 266-418, 418-618, 618-757
      (is (= 3 (:limit @root)) "the root stops at the row holding the crossing")
      (is (= 1 (:limit @l1)))
      (is (= 3 (:limit @l2)) "the third nested row starts at 618 px, on screen")))
  (testing "a nested list that runs out of rows above the fold hands over to its parent"
    (let [l1 (model-list [24 24] {})
          root (model-list [100 100 100 100 100 100 100 100] {0 l1})
          session (model-session root)]
      (fill! session)
      ;; root row 1 (170-270) holds l1 (270-318); root rows 2.. at 318, 418, 518, 618
      (is (= 2 (:limit @l1)))
      (is (= 5 (:limit @root)))))
  (testing "a closed session grows nothing"
    (let [root (model-list [24 24 24] {})
          session (model-session root)]
      (set! (.-open session) false)
      (fill! session)
      (is (= 1 (:limit @root))))))
