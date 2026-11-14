(ns logseq.publish.render-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.publish.render :as render]))

(defn- block-content->html
  [content]
  (render/render-hiccup
   (render/block-content-nodes {:block/title content} {:uuid->title {} :graph-uuid "g"} 1)))

(deftest entity-properties-filters-explicitly-hidden-properties
  (testing "property is filtered when ctx marks it hidden"
    (let [entity {:user.property/secret "value"}
          ctx {:property-hidden-by-ident {:user.property/secret true}}
          result (render/entity-properties entity ctx {})]
      (is (nil? (get result :user.property/secret))))))

(deftest entity-properties-filters-built-in-hidden-properties
  (testing "built-in properties with :hide? true are filtered without property entity metadata"
    (let [entity {:logseq.property/created-from-property "some-value"}
          ctx {:property-hidden-by-ident {}}
          result (render/entity-properties entity ctx {})]
      (is (nil? (get result :logseq.property/created-from-property))))))

(deftest filter-tags-removes-built-in-tag-values
  (testing "built-in class keyword tags are removed"
    (let [result (render/filter-tags [:logseq.class/Tag :user.property/custom] {})]
      (is (= [:user.property/custom] result))))
  (testing "built-in class entities are removed"
    (let [entities {1 {:db/ident :logseq.class/Tag}
                    2 {:db/ident :user.property/custom}}
          result (render/filter-tags [1 2] entities)]
      (is (= [2] result)))))

(deftest block-content-nodes-use-auto-dir
  (let [node (render/block-content-nodes
              {:block/title "english then عربي"}
              {:uuid->title {} :graph-uuid "g"}
              1)]
    (is (= "auto" (get-in node [1 :dir])))))

(deftest block-content-from-ref-uses-auto-dir
  (let [node (render/block-content-from-ref
              {"source_block_content" "كلام عربي then english"}
              {:uuid->title {} :graph-uuid "g"})]
    (is (= "auto" (get-in node [1 :dir])))))

(deftest render-properties-use-auto-dir
  (let [props {:user.property/sample "english then عربي"}
        ctx {:property-title-by-ident {}
             :property-type-by-ident {}}
        rendered (render/render-properties props ctx {})
        entry (first (second rendered))
        dd-node (nth entry 2)]
    (is (= :dd.property-value (first dd-node)))
    (is (= "auto" (get-in dd-node [1 :dir])))))

(deftest block-content-nodes-embeds-youtube-shorts-player
  (let [node (render/block-content-nodes
              {:block/title "{{video https://www.youtube.com/shorts/xu9p5ynlhZk}}"}
              {:uuid->title {} :graph-uuid "g"}
              1)
        html (render/render-hiccup node)]
    (is (re-find #"https://www\.youtube\.com/embed/xu9p5ynlhZk" html))))

(deftest block-content-nodes-renders-inline-latex
  (is (= "<span class=\"block-text\" dir=\"auto\">before <span class=\"math-inline\">x^2</span> after</span>"
         (block-content->html "before $x^2$ after"))))

(deftest block-content-nodes-renders-displayed-latex-inside-paragraph
  (is (= "<span class=\"block-text\" dir=\"auto\">a <span class=\"math-inline\" data-display=\"true\">y</span> b</span>"
         (block-content->html "a $$y$$ b"))))

(deftest block-content-nodes-renders-display-latex-block
  (is (= "<div class=\"block-text\" dir=\"auto\"><div class=\"math-block\">\\int_0^1 x\\,dx</div></div>"
         (block-content->html "$$\\int_0^1 x\\,dx$$"))))

(deftest block-content-nodes-renders-latex-environments
  (testing "equation environments render their bare content"
    (is (= "<div class=\"block-text\" dir=\"auto\"><div class=\"math-block\">a=b\n</div></div>"
           (block-content->html "\\begin{equation}\na=b\n\\end{equation}"))))
  (testing "other environments keep their begin and end"
    (is (= "<div class=\"block-text\" dir=\"auto\"><div class=\"math-block\">\\begin{align}\nc&amp;=d\n\\end{align}</div></div>"
           (block-content->html "\\begin{align}\nc&=d\n\\end{align}")))))

(deftest block-content-nodes-escapes-latex
  (is (= "<span class=\"block-text\" dir=\"auto\"><span class=\"math-inline\">a&lt;b &amp; c</span></span>"
         (block-content->html "$a<b & c$")))
  (is (= "<div class=\"block-text\" dir=\"auto\"><div class=\"math-block\">&lt;img src=x onerror=alert(1)&gt;</div></div>"
         (block-content->html "$$<img src=x onerror=alert(1)>$$"))))
