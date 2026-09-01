(ns frontend.components.block.page-ref-math-test
  (:require ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [frontend.components.block :as block]
            [frontend.db.hooks :as db-hooks]
            [frontend.format.block :as format-block]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.object :as gobj]
            [logseq.shui.dialog.core :as shui-dialog]
            [logseq.shui.hooks :as hooks]))

(def ^:private latex-only-title "$$ x^2 + y^2 = z^2 $$")
(def ^:private mixed-title "Pythagoras: $$ x^2 + y^2 = z^2 $$")
(def ^:private formula "x^2 + y^2 = z^2")

(defn- render-static
  [element]
  (let [previous-react (gobj/get js/globalThis "React")]
    (gobj/set js/globalThis "React" react)
    (try
      (.renderToStaticMarkup react-dom-server element)
      (finally
        (if (some? previous-react)
          (gobj/set js/globalThis "React" previous-react)
          (js-delete js/globalThis "React"))))))

(defn- with-page-ref-hooks
  [block f]
  (with-redefs [db-hooks/use-block (constantly block)
                hooks/use-memo (fn [setup _deps] (setup))
                hooks/use-atom (fn [a] [@a #(reset! a %)])
                hooks/use-effect! (fn [_setup _deps])
                hooks/use-state (fn [init] [init identity])
                hooks/use-ref (fn [value] #js {:current value})
                hooks/deref (fn [r] (.-current r))
                hooks/set-ref! (fn [r v] (set! (.-current r) v))
                util/mobile? (constantly false)
                shui-dialog/has-dialog? (constantly false)
                state/show-brackets? (constantly true)]
    (f)))

(defn- render-page-ref-chip
  [block]
  (with-page-ref-hooks
    block
    (fn []
      (render-static
       (block/page-reference {:disable-preview? true
                              :show-brackets? true}
                             (:block/uuid block)
                             nil)))))

(defn- latex-only-block
  []
  {:db/id 101
   :block/uuid #uuid "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
   :block/title latex-only-title})

(defn- math-display-block
  []
  {:db/id 102
   :block/uuid #uuid "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
   :block/title formula
   :logseq.property.node/display-type :math})

(defn- mixed-title-block
  []
  {:db/id 103
   :block/uuid #uuid "cccccccc-cccc-cccc-cccc-cccccccccccc"
   :block/title mixed-title})

(deftest page-ref-math-formula-test
  (testing "unconverted latex-only title exposes the inner formula"
    (is (= formula
           (#'block/page-ref-math-formula (latex-only-block)))))

  (testing "math display-type blocks use the stored formula title"
    (is (= formula
           (#'block/page-ref-math-formula (math-display-block)))))

  (testing "Displayed_Math in ast-body is used when the heading title is empty"
    (is (= formula
           (#'block/page-ref-math-formula
            (merge (latex-only-block)
                   (format-block/parse-title-and-body nil :markdown latex-only-title))))))

  (testing "mixed-title latex is not treated as a standalone formula"
    (is (nil? (format-block/displayed-math-formula mixed-title)))))

(deftest latex-only-page-ref-renders-formula-test
  (testing "a reference to an unconverted latex-only block shows the formula"
    (let [markup (render-page-ref-chip (latex-only-block))]
      (is (string/includes? markup formula))
      (is (string/includes? markup "[["))
      (is (string/includes? markup "]]"))
      (is (or (string/includes? markup "latex-inline")
              (string/includes? markup "latex"))
          "The chip renders latex, not an empty title")))

  (testing "a reference to a Math-block shows the formula instead of an empty chip"
    (let [markup (render-page-ref-chip (math-display-block))]
      (is (string/includes? markup formula))
      (is (string/includes? markup "[["))
      (is (string/includes? markup "]]"))
      (is (not (re-find #"\[\[\s*\]\]" markup)))))

  (testing "mixed-title latex refs keep the usable heading title"
    (let [markup (render-page-ref-chip (mixed-title-block))]
      (is (string/includes? markup "Pythagoras"))
      (is (string/includes? markup "[["))
      (is (string/includes? markup "]]")))))
