(ns frontend.extensions.graph-pixi-logic-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.extensions.graph.pixi.logic :as logic]))

(deftest visibility-state-keeps-details-visible-and-uses-label-hysteresis
  (let [thresholds {:show-detail-scale 1.0
                    :hide-detail-scale 0.8
                    :show-label-scale 1.3
                    :hide-label-scale 1.1}
        initial {:detail-expanded? false
                 :label-visible? false}
        expanded (logic/next-visibility-state initial 1.05 thresholds)
        sticky (logic/next-visibility-state expanded 0.92 thresholds)
        collapsed (logic/next-visibility-state sticky 0.75 thresholds)
        labels-on (logic/next-visibility-state expanded 1.35 thresholds)
        labels-sticky (logic/next-visibility-state labels-on 1.2 thresholds)
        labels-off (logic/next-visibility-state labels-sticky 1.05 thresholds)]
    (testing "Detail layer stays visible while zooming"
      (is (= {:detail-expanded? true :label-visible? false}
             expanded)))
    (testing "Detail layer does not collapse below the old hide threshold"
      (is (= {:detail-expanded? true :label-visible? false}
             sticky)))
    (testing "Detail layer remains visible at small scale"
      (is (= {:detail-expanded? true :label-visible? false}
             collapsed)))
    (testing "Labels also use hysteresis to avoid flicker"
      (is (= {:detail-expanded? true :label-visible? true}
             labels-on))
      (is (= {:detail-expanded? true :label-visible? true}
             labels-sticky))
      (is (= {:detail-expanded? true :label-visible? false}
             labels-off)))))

(deftest select-label-node-ids-culls-overlap-and-prioritizes-tags
  (let [nodes [{:id "tag-a" :kind "tag" :degree 10 :x 100 :y 120 :label "Tag A"}
               {:id "obj-a" :kind "object" :degree 20 :x 108 :y 122 :label "Object A"}
               {:id "obj-b" :kind "object" :degree 5 :x 310 :y 210 :label "Object B"}
               {:id "obj-c" :kind "object" :degree 5 :x 900 :y 900 :label "Offscreen"}
               {:id "no-label" :kind "tag" :degree 99 :x 120 :y 120 :label nil}]
        ids (logic/select-label-node-ids nodes
                                         {:viewport {:min-x 0 :min-y 0 :max-x 500 :max-y 400}
                                          :transform {:scale 1.4 :x 0 :y 0}
                                          :screen-cell-width 140
                                          :screen-cell-height 26
                                          :max-labels 20})]
    (testing "Tag keeps the overlapping label slot over non-tag nodes"
      (is (= "tag-a" (first ids)))
      (is (not (some #{"obj-a"} ids))))
    (testing "Visible non-overlapping nodes still get labels"
      (is (some #{"obj-b"} ids)))
    (testing "Offscreen and empty labels are ignored"
      (is (not (some #{"obj-c"} ids)))
      (is (not (some #{"no-label"} ids))))))

(deftest select-label-node-ids-respects-max-label-cap
  (let [nodes (mapv (fn [idx]
                      {:id (str "node-" idx)
                       :kind (if (zero? (mod idx 7)) "tag" "object")
                       :degree (- 500 idx)
                       :x (+ 10 (* idx 30))
                       :y (+ 10 (* (mod idx 8) 40))
                       :label (str "Node " idx)})
                    (range 400))
        ids (logic/select-label-node-ids nodes
                                         {:viewport {:min-x 0 :min-y 0 :max-x 2000 :max-y 1200}
                                          :transform {:scale 1.2 :x 0 :y 0}
                                          :screen-cell-width 120
                                          :screen-cell-height 24
                                          :max-labels 60})]
    (is (= 60 (count ids)))))

(deftest label-text-defaults-to-short-and-expands-on-hover
  (let [label "This is a very long title for a graph node label"
        short-text (logic/label-display-text label false)
        hover-text (logic/label-display-text label true)]
    (is (= "This is a very long..." short-text))
    (is (= label hover-text))
    (is (= "Short" (logic/label-display-text "Short" false)))))

(deftest label-surfaces-occlude-crossing-links
  (is (= 1.0 (logic/label-surface-fill-alpha :node false)))
  (is (= 1.0 (logic/label-surface-fill-alpha :node true)))
  (is (= 1.0 (logic/label-surface-fill-alpha :edge false))))

(deftest renderer-init-options-enable-smooth-strokes
  (is (= true (:antialias (logic/renderer-init-options 2)))))

(deftest graph-ticker-targets-above-120-fps
  (let [ticker #js {:maxFPS 0}]
    (is (identical? ticker (logic/apply-graph-ticker-frame-rate! ticker)))
    (is (> (.-maxFPS ticker) 120))
    (is (= 144 (.-maxFPS ticker)))))

(deftest fps-overlay-position-anchors-in-lower-right-corner
  (let [position-fn (resolve 'frontend.extensions.graph.pixi.logic/fps-overlay-position)
        actual (when position-fn
                 (position-fn 1000 768 78 22 {:margin 12}))]
    (is (fn? position-fn))
    (is (= {:x 902 :y 730} actual))))

(deftest edge-label-angle-stays-aligned-and-readable
  (is (= 0 (logic/readable-edge-label-angle 0 0 100 0)))
  (is (= 0 (logic/readable-edge-label-angle 100 0 0 0)))
  (is (= (/ js/Math.PI 2) (logic/readable-edge-label-angle 0 0 0 100)))
  (is (= (/ js/Math.PI -2) (logic/readable-edge-label-angle 0 100 0 0))))

(deftest edge-render-runs-separate-bidirectional-links
  (let [runs (logic/edge-render-runs [{:source "a" :target "b"}
                                      {:source "b" :target "a"}
                                      {:source "a" :target "c"}]
                                     true)]
    (is (= [true true true] (mapv :show-arrow? runs)))
    (is (not= 0 (:parallel-offset (first runs))))
    (is (= (:parallel-offset (first runs))
           (:parallel-offset (second runs))))
    (is (= 0 (:parallel-offset (nth runs 2)))))
  (is (= [false]
         (mapv :show-arrow? (logic/edge-render-runs [{:source "a" :target "b"}] false)))))

(deftest edge-render-runs-deduplicate-same-direction-links
  (let [runs (logic/edge-render-runs [{:source "tienson" :target "publish" :label "Project"}
                                      {:source "tienson" :target "publish" :label "Project"}
                                      {:source "publish" :target "tienson" :label "Lead"}]
                                     true)]
    (is (= 2 (count runs)))
    (is (= #{["tienson" "publish"] ["publish" "tienson"]}
           (set (map (juxt :source :target) runs))))
    (is (= [true true] (mapv :show-arrow? runs)))
    (is (= 1 (count (filter #(= ["tienson" "publish"]
                                ((juxt :source :target) %))
                             runs))))))

(deftest icon-display-text-renders-emoji-icons
  (is (= "⭐" (logic/icon-display-text {:type :emoji :id "star"})))
  (is (= "🚀" (logic/icon-display-text {:type "emoji" :id "rocket"})))
  (is (= "★" (logic/icon-display-text "★")))
  (is (nil? (logic/icon-display-text {:type :tabler-icon :id "star"}))))

(deftest connected-drag-weights-attenuates-by-depth
  (let [neighbor-map {"a" ["b" "c"]
                      "b" ["a" "d"]
                      "c" ["a"]
                      "d" ["b" "e"]
                      "e" ["d"]}
        weights (logic/connected-drag-weights neighbor-map "a"
                                              {:max-depth 2
                                               :decay 0.5
                                               :min-weight 0.2})]
    (is (= 1.0 (get weights "a")))
    (is (= 0.5 (get weights "b")))
    (is (= 0.5 (get weights "c")))
    (is (= 0.25 (get weights "d")))
    (is (nil? (get weights "e")))))

(deftest merge-node-positions-updates-drag-preview-layout
  (let [layout-by-id {"a" {:id "a" :x 0 :y 0}
                      "b" {:id "b" :x 10 :y 10}}
        result (logic/merge-node-positions
                layout-by-id
                {"a" {:x 25 :y 30}
                 "missing" {:x 5 :y 6}})]
    (is (= {:id "a" :x 25 :y 30} (get result "a")))
    (is (= {:id "b" :x 10 :y 10} (get result "b")))
    (is (not (contains? result "missing")))))

(deftest current-layout-prefers-drag-preview-for-label-positioning
  (let [committed {"a" {:id "a" :x 0 :y 0}}
        preview {"a" {:id "a" :x 50 :y 60}}]
    (is (= preview (logic/current-layout-by-id committed preview)))
    (is (= committed (logic/current-layout-by-id committed nil)))))

(deftest highlighted-node-selection-supports-add-remove-and-one-hop-state
  (let [neighbor-map {"a" ["b" "c"]
                      "b" ["a" "d"]
                      "c" ["a"]
                      "d" ["b"]}
        selected (-> #{}
                     (logic/update-highlighted-node-ids "a" false)
                     (logic/update-highlighted-node-ids "d" false)
                     (logic/update-highlighted-node-ids "a" true))
        state (logic/highlight-state selected neighbor-map)]
    (is (= #{"d"} selected))
    (is (= #{"d"} (:selected-ids state)))
    (is (= #{"b"} (:connected-ids state)))
    (is (= :selected (logic/node-emphasis state "d")))
    (is (= :connected (logic/node-emphasis state "b")))
    (is (= :dimmed (logic/node-emphasis state "a")))
    (is (= :normal (logic/node-emphasis (logic/highlight-state #{} neighbor-map) "a")))))

(deftest highlighted-node-selection-respects-depth
  (let [neighbor-map {"a" ["b" "c"]
                      "b" ["a" "d"]
                      "c" ["a"]
                      "d" ["b" "e"]
                      "e" ["d"]}
        one-hop (logic/highlight-state #{"a"} neighbor-map 1)
        two-hop (logic/highlight-state #{"a"} neighbor-map 2)]
    (is (= #{"a" "b" "c"} (:active-ids one-hop)))
    (is (= #{"a" "b" "c" "d"} (:active-ids two-hop)))
    (is (= :dimmed (logic/node-emphasis one-hop "d")))
    (is (= :connected (logic/node-emphasis two-hop "d")))))

(deftest highlighted-links-hide-default-lines-and-filter-selected-neighborhood
  (let [links [{:source "a" :target "b"}
               {:source "a" :target "c"}
               {:source "b" :target "d"}
               {:source "d" :target "e"}]
        neighbor-map {"a" ["b" "c"]
                      "b" ["a" "d"]
                      "c" ["a"]
                      "d" ["b" "e"]
                      "e" ["d"]}
        state (logic/highlight-state #{"a"} neighbor-map 2)]
    (is (empty? (logic/highlight-visible-links links (logic/highlight-state #{} neighbor-map))))
    (is (= #{{:source "a" :target "b"}
             {:source "a" :target "c"}
             {:source "b" :target "d"}}
           (set (logic/highlight-visible-links links state))))))

(deftest node-click-action-distinguishes-highlight-unhighlight-and-open
  (is (= {:action :highlight
          :next-click {:node-id "a" :time 1000}}
         (logic/node-click-action nil "a" {:selected? false} 1000)))
  (is (= {:action :open
          :next-click nil}
         (logic/node-click-action {:node-id "a" :time 1000} "a" {:selected? true} 1210)))
  (is (= {:action :highlight
          :next-click {:node-id "b" :time 1210}}
         (logic/node-click-action {:node-id "a" :time 1000} "b" {:selected? false} 1210)))
  (is (= {:action :unhighlight
          :next-click {:node-id "a" :time 1400}}
         (logic/node-click-action {:node-id "a" :time 1000} "a" {:selected? true} 1400)))
  (is (= {:action :open
          :next-click nil}
         (logic/node-click-action {:node-id "a" :time 1000} "a" {:open? true} 1210))))

(deftest layout-tick-count-scales-with-graph-size
  (testing "Small graphs still get enough settling passes"
    (is (= 160 (logic/layout-tick-count 80 :all-pages))))
  (testing "Medium all-pages graphs avoid the old fixed 220 tick cost"
    (is (= 90 (logic/layout-tick-count 643 :all-pages))))
  (testing "Large tags-and-objects graphs keep d3 force under the first-render budget"
    (is (= 3 (logic/layout-tick-count 3887 :tags-and-objects))))
  (testing "Large graphs stay bounded"
    (is (= 70 (logic/layout-tick-count 2500 :all-pages)))))

(deftest layout-mode-switches-to-fast-layout-for-large-graphs
  (is (= :force (logic/layout-mode 2499 :all-pages)))
  (is (= :fast (logic/layout-mode 2500 :all-pages)))
  (is (= :force (logic/layout-mode 2200 :tags-and-objects)))
  (is (= :force (logic/layout-mode 3887 :tags-and-objects)))
  (is (= :fast (logic/layout-mode 50000 :all-pages))))

(deftest draw-edge-limit-is-bounded-for-large-graphs
  (is (= 712 (logic/draw-edge-limit 643 712 :all-pages)))
  (is (= 3600 (logic/draw-edge-limit 50000 120000 :all-pages))))

(deftest render-node-limit-is-bounded-for-large-graphs
  (is (= 643 (logic/render-node-limit 643 :all-pages)))
  (is (= 2200 (logic/render-node-limit 50000 :all-pages))))

(deftest label-render-state-does-not-expand-labels-while-fading-out
  (testing "Zoomed-in labels are shown without hover"
    (is (= {:target-alpha 1.0
            :update? true
            :hovered-only? false}
           (logic/label-render-state nil {:label-visible? true} 0.0))))
  (testing "Nearby hover shows only the focused label while zoom labels are hidden"
    (is (= {:target-alpha 1.0
            :update? true
            :hovered-only? true}
           (logic/label-render-state "node-a" {:label-visible? false} 0.0))))
  (testing "Fading alpha without hover does not recalculate normal label candidates"
    (is (= {:target-alpha 0.0
            :update? false
            :hovered-only? true}
           (logic/label-render-state nil {:label-visible? false} 0.35)))))

(deftest label-render-state-filters-labels-in-select-mode
  (is (= {:target-alpha 1.0
          :update? true
          :hovered-only? false
          :selected-only? true
          :active-only? false}
         (logic/label-render-state nil #{"a"} #{"a" "b"} {:label-visible? false
                                                           :linked-label-visible? false} 0.0)))
  (is (= {:target-alpha 1.0
          :update? true
          :hovered-only? false
          :selected-only? true
          :active-only? false}
         (logic/label-render-state nil #{"a"} #{"a" "b"} {:label-visible? true
                                                           :linked-label-visible? false} 1.0)))
  (is (= {:target-alpha 1.0
          :update? true
          :hovered-only? false
          :selected-only? false
          :active-only? true}
         (logic/label-render-state nil #{"a"} #{"a" "b"} {:label-visible? true
                                                           :linked-label-visible? true} 1.0))))

(deftest label-render-state-hides-default-labels-in-task-status-preview
  (testing "Task zoom-in uses its own label layer, so the default graph hover label is suppressed"
    (is (= {:target-alpha 0.0
            :update? true
            :hovered-only? true
            :selected-only? false
            :active-only? false}
           (logic/label-render-state "done-1"
                                     #{"tag-task"}
                                     #{"tag-task" "done-1"}
                                     {:label-visible? true
                                      :linked-label-visible? true
                                      :task-status-preview-active? true}
                                     1.0)))))

(deftest fit-transform-scales-graph-into-viewport
  (let [nodes [{:x -500 :y -250 :radius 10}
               {:x 500 :y 250 :radius 10}]
        transform (logic/fit-transform nodes 1000 500 {:padding 50})]
    (is (= 0.7692307692307693 (:scale transform)))
    (is (= 500 (:x transform)))
    (is (= 250 (:y transform)))))

(deftest zoom-scale-bounds-allow-farther-zoom-out
  (is (= 0.05 logic/min-zoom-scale))
  (is (= 0.05 (logic/clamp-zoom-scale 0.01)))
  (is (= 3.6 (logic/clamp-zoom-scale 10))))

(defn- task-node
  [id status-ident status-title updated-at created-at]
  (cond->
   {:id id
    :kind "object"
    :label id
    :task? true
    :tags [{:id "tag-task" :label "Task" :db-ident :logseq.class/Task}]
    :block/created-at created-at
    :x 0
    :y 0
    :radius 4}
    status-ident
    (assoc :task/status-ident status-ident
           :task/status-title status-title)
    updated-at
    (assoc :block/updated-at updated-at)))

(defn- task-node-with-label
  [id status-ident status-title label tag updated-at created-at]
  (assoc (task-node id status-ident status-title updated-at created-at)
         :label label
         :tags [{:id "tag-task" :label "Task" :db-ident :logseq.class/Task}
                {:id (str "tag-" (subs tag 1)) :label (subs tag 1)}]))

(defn- sample-task-graph-groups
  []
  [{:status-key :logseq.property/status.todo
    :status-title "Todo"
    :count 84
    :tasks [(task-node-with-label "todo-research" :logseq.property/status.todo "Todo" "Research Logseq plugins" "#research" 1000 1)
            (task-node-with-label "todo-brief" :logseq.property/status.todo "Todo" "Write project brief" "#docs" 999 2)
            (task-node-with-label "todo-ui" :logseq.property/status.todo "Todo" "UI exploration" "#design" 998 3)
            (task-node-with-label "todo-guide" :logseq.property/status.todo "Todo" "Outline graphs guide" "#docs" 997 4)]}
   {:status-key :logseq.property/status.doing
    :status-title "Doing"
    :count 27
    :tasks [(task-node-with-label "doing-onboarding" :logseq.property/status.doing "Doing" "Revise onboarding flow" "#product" 1000 1)
            (task-node-with-label "doing-filters" :logseq.property/status.doing "Doing" "Implement graph filters" "#eng" 999 2)
            (task-node-with-label "doing-search" :logseq.property/status.doing "Doing" "Improve search speed" "#performance" 998 3)
            (task-node-with-label "doing-query" :logseq.property/status.doing "Doing" "Refactor query engine" "#eng" 997 4)]}
   {:status-key :logseq.property/status.waiting
    :status-title "Waiting"
    :count 16
    :tasks [(task-node-with-label "waiting-design" :logseq.property/status.waiting "Waiting" "Feedback from design review" "#design" 1000 1)
            (task-node-with-label "waiting-api" :logseq.property/status.waiting "Waiting" "API access approval" "#infra" 999 2)
            (task-node-with-label "waiting-copy" :logseq.property/status.waiting "Waiting" "Marketing copy review" "#growth" 998 3)
            (task-node-with-label "waiting-interviews" :logseq.property/status.waiting "Waiting" "User interview takeaways" "#research" 997 4)]}
   {:status-key :logseq.property/status.done
    :status-title "Done"
    :count 112
    :tasks [(task-node-with-label "done-ci" :logseq.property/status.done "Done" "Set up CI pipeline" "#eng" 1000 1)
            (task-node-with-label "done-audit" :logseq.property/status.done "Done" "Design system audit" "#design" 999 2)
            (task-node-with-label "done-zoom" :logseq.property/status.done "Done" "Fix graph zoom issue" "#bug" 998 3)
            (task-node-with-label "done-shortcuts" :logseq.property/status.done "Done" "Add keyboard shortcuts" "#enhancement" 997 4)]}])

(defn- label-boxes-overlap?
  [a b]
  (let [a-label (:label-card a)
        b-label (:label-card b)
        ax (get-in a-label [:position :x])
        ay (get-in a-label [:position :y])
        bx (get-in b-label [:position :x])
        by (get-in b-label [:position :y])
        aw (:width a-label)
        ah (:height a-label)
        bw (:width b-label)
        bh (:height b-label)]
    (and (< (js/Math.abs (- ax bx)) (/ (+ aw bw) 2))
         (< (js/Math.abs (- ay by)) (/ (+ ah bh) 2)))))

(defn- label-card-bounds
  [card]
  (let [x (get-in card [:position :x])
        y (get-in card [:position :y])
        half-width (/ (:width card) 2)
        half-height (/ (:height card) 2)]
    {:min-x (- x half-width)
     :max-x (+ x half-width)
     :min-y (- y half-height)
     :max-y (+ y half-height)}))

(defn- point-inside-bounds?
  [{:keys [x y]} {:keys [min-x max-x min-y max-y]} padding]
  (and (<= (- min-x padding) x (+ max-x padding))
       (<= (- min-y padding) y (+ max-y padding))))

(defn- label-card-overlaps-point?
  [card point padding]
  (point-inside-bounds? point (label-card-bounds card) padding))

(defn- bounds-overlap?
  [a b padding]
  (and (< (- (:min-x a) padding) (+ (:max-x b) padding))
       (< (- (:min-x b) padding) (+ (:max-x a) padding))
       (< (- (:min-y a) padding) (+ (:max-y b) padding))
       (< (- (:min-y b) padding) (+ (:max-y a) padding))))

(defn- group-blob-bounds
  [group]
  (let [xs (map :x (:blob-points group))
        ys (map :y (:blob-points group))]
    {:min-x (apply min xs)
     :max-x (apply max xs)
     :min-y (apply min ys)
     :max-y (apply max ys)}))

(defn- task-detail-fixture
  []
  (let [tasks [(task-node "todo-new" :logseq.property/status.todo "Todo" 900 100)
               (task-node "todo-old" :logseq.property/status.todo "Todo" 100 800)
               (task-node "doing" :logseq.property/status.doing "Doing" 800 200)
               (task-node "done" :logseq.property/status.done "Done" 700 300)
               (task-node "canceled" :logseq.property/status.canceled "Canceled" 600 400)
               (task-node "unknown" :user.status/waiting "Waiting" 500 500)
               (task-node "no-status" nil nil nil 900)]
        nodes (vec (cons {:id "tag-task"
                          :kind "tag"
                          :label "Task"
                          :db-ident :logseq.class/Task
                          :x 0
                          :y 0
                          :radius 9}
                         tasks))
        neighbor-map {"tag-task" (mapv :id tasks)}]
    {:nodes nodes
     :neighbor-map neighbor-map
     :visible-node-ids (set (map :id nodes))}))

(defn- distance
  [a b]
  (let [dx (- (:x a) (:x b))
        dy (- (:y a) (:y b))]
    (js/Math.sqrt (+ (* dx dx) (* dy dy)))))

(deftest task-status-detail-eligibility-requires-clicked-built-in-task-group
  (let [{:keys [nodes neighbor-map visible-node-ids]} (task-detail-fixture)]
    (is (logic/task-status-detail-eligible?
         nodes
         "tag-task"
         neighbor-map
         visible-node-ids
         {:view-mode :tags-and-objects}))
    (is (not (logic/task-status-detail-eligible?
              nodes
              "tag-task"
              neighbor-map
              visible-node-ids
              {:view-mode :all-pages})))
    (is (not (logic/task-status-detail-eligible?
              nodes
              nil
              neighbor-map
              visible-node-ids
              {:view-mode :tags-and-objects})))
    (is (logic/task-status-detail-eligible?
         nodes
         "tag-task"
         neighbor-map
         visible-node-ids
         {:view-mode :tags-and-objects
          :grid-layout? true}))
    (is (not (logic/task-status-detail-eligible?
              (conj nodes {:id "tag-project" :kind "tag" :label "Project"})
              "tag-project"
              (assoc neighbor-map "tag-project" ["todo-new" "todo-old" "doing" "done"])
              (conj visible-node-ids "tag-project")
              {:view-mode :tags-and-objects})))
    (is (logic/task-status-detail-eligible?
         (conj nodes {:id "tag-task-name-only" :kind "tag" :label "Task"})
         "tag-task-name-only"
         (assoc neighbor-map "tag-task-name-only" ["todo-new" "todo-old" "doing" "done"])
         (conj visible-node-ids "tag-task-name-only")
         {:view-mode :tags-and-objects}))
    (is (not (logic/task-status-detail-eligible?
              (take 4 nodes)
              "tag-task"
              {"tag-task" ["todo-new" "todo-old" "doing"]}
              #{"tag-task" "todo-new" "todo-old" "doing"}
              {:view-mode :tags-and-objects})))))

(deftest task-status-preview-sync-action-keeps-active-preview-during-drag
  (is (= :sync
         (logic/task-status-preview-sync-action
          {:eligible? true
           :dragging? false
           :preview-active? true})))
  (is (= :keep
         (logic/task-status-preview-sync-action
          {:eligible? true
           :dragging? true
           :preview-active? true})))
  (is (= :clear
         (logic/task-status-preview-sync-action
          {:eligible? true
           :dragging? true
           :preview-active? false})))
  (is (= :clear
         (logic/task-status-preview-sync-action
          {:eligible? false
           :dragging? true
           :preview-active? true}))))

(deftest task-status-detail-accepts-clicked-task-tag-neighbors-as-task-nodes
  (let [plain-neighbors (mapv (fn [idx]
                                {:id (str "task-neighbor-" idx)
                                 :kind "object"
                                 :label (str "Task neighbor " idx)
                                 :block/created-at idx})
                              (range 5))
        nodes (vec (cons {:id "tag-task"
                          :kind "tag"
                          :label "Task"
                          :db-ident :logseq.class/Task}
                         plain-neighbors))
        neighbor-map {"tag-task" (mapv :id plain-neighbors)}
        visible-node-ids (set (map :id nodes))
        groups (logic/task-status-groups nodes "tag-task" neighbor-map visible-node-ids nil)
        layout (logic/task-status-group-layout groups {:center-x 0 :center-y 0})]
    (is (logic/task-status-detail-eligible?
         nodes
         "tag-task"
         neighbor-map
         visible-node-ids
         {:view-mode :tags-and-objects}))
    (is (= ["NO STATUS"] (mapv :status-key groups)))
    (is (= (set (map :id plain-neighbors))
           (set (keys (:positions-by-id layout)))))))

(deftest task-status-detail-accepts-clicked-task-node-neighbors-as-task-nodes
  (let [plain-neighbors (mapv (fn [idx]
                                {:id (str "task-neighbor-" idx)
                                 :kind "object"
                                 :label (str "Task neighbor " idx)
                                 :block/created-at idx})
                              (range 5))
        nodes (vec (cons {:id "tag-task"
                          :kind "object"
                          :label "Task"
                          :db-ident :logseq.class/Task}
                         plain-neighbors))
        neighbor-map {"tag-task" (mapv :id plain-neighbors)}
        visible-node-ids (set (map :id nodes))
        groups (logic/task-status-groups nodes "tag-task" neighbor-map visible-node-ids nil)
        layout (logic/task-status-group-layout groups {:center-x 0 :center-y 0})]
    (is (logic/task-status-detail-eligible?
         nodes
         "tag-task"
         neighbor-map
         visible-node-ids
         {:view-mode :tags-and-objects}))
    (is (= (set (map :id plain-neighbors))
           (set (keys (:positions-by-id layout)))))))

(deftest task-status-groups-use-status-order-and-recent-tasks
  (let [{:keys [nodes neighbor-map visible-node-ids]} (task-detail-fixture)
        groups (logic/task-status-groups nodes "tag-task" neighbor-map visible-node-ids {:width 1024 :height 768})
        by-key (into {} (map (juxt :status-key identity) groups))]
    (is (= #{"TODO" "DOING" "CANCELED" "WAITING" "DONE" "NO STATUS"}
           (set (map :status-key groups))))
    (is (= ["todo-new" "todo-old"]
           (mapv :id (:tasks (get by-key "TODO")))))
    (is (= ["canceled"]
           (mapv :id (:tasks (get by-key "CANCELED")))))
    (is (= ["unknown"]
           (mapv :id (:tasks (get by-key "WAITING")))))
    (is (= "no-status"
           (-> by-key (get "NO STATUS") :tasks last :id)))))

(deftest task-status-groups-preserve-real-status-groups
  (let [tasks [(task-node "todo" :logseq.property/status.todo "Todo" 100 0)
               (task-node "later" :logseq.property/status.later "Later" 90 0)
               (task-node "doing" :logseq.property/status.doing "Doing" 80 0)
               (task-node "review" :logseq.property/status.in-review "In Review" 70 0)
               (task-node "backlog" :logseq.property/status.backlog "Backlog" 60 0)
               (task-node "paused" :user.status/paused "Paused" 50 0)
               (task-node "done" :logseq.property/status.done "Done" 40 0)
               (task-node "missing" nil nil 30 0)]
        nodes (vec (cons {:id "tag-task"
                          :kind "tag"
                          :label "Task"
                         :db-ident :logseq.class/Task}
                         tasks))
        neighbor-map {"tag-task" (mapv :id tasks)}
        visible-node-ids (set (map :id nodes))
        groups (logic/task-status-groups nodes "tag-task" neighbor-map visible-node-ids nil)
        by-title (into {} (map (juxt :status-title identity) groups))]
    (is (= #{"Todo" "Later" "Doing" "In Review" "Backlog" "Paused" "Done" "No status"}
           (set (map :status-title groups))))
    (is (= ["todo" "later" "missing"]
           (mapv :id (concat (:tasks (get by-title "Todo"))
                             (:tasks (get by-title "Later"))
                             (:tasks (get by-title "No status"))))))
    (is (= ["doing"]
           (mapv :id (:tasks (get by-title "Doing")))))
    (is (= ["review"]
           (mapv :id (:tasks (get by-title "In Review")))))
    (is (= ["backlog"]
           (mapv :id (:tasks (get by-title "Backlog")))))
    (is (= ["paused"]
           (mapv :id (:tasks (get by-title "Paused")))))
    (is (= ["done"]
           (mapv :id (:tasks (get by-title "Done")))))))

(deftest task-status-layout-keeps-custom-statuses-as-independent-data-areas
  (let [status-counts [[:user.status/triage "Triage" 8]
                       [:user.status/customer-review "Customer Review" 8]
                       [:user.status/ready-to-ship "Ready To Ship" 8]]
        groups (mapv (fn [[status-key status-title count]]
                       {:status-key status-key
                        :status-title status-title
                        :count count
                        :tasks (mapv #(task-node (str (name status-key) "-" %)
                                                 status-key
                                                 status-title
                                                 (+ 1000 %)
                                                 %)
                                     (range count))})
                     status-counts)
        layout-groups (:groups (logic/task-status-group-layout groups {:center-x 0 :center-y 0}))
        expected-areas #{"user.status/triage"
                         "user.status/customer-review"
                         "user.status/ready-to-ship"}]
    (is (= expected-areas (set (map :status-area layout-groups))))
    (is (= expected-areas (set (map :normalized-status layout-groups))))))

(deftest task-status-group-layout-defaults-to-roomy-recent-twelve-and-supports-configurable-visible-count
  (let [tasks (mapv #(task-node (str "todo-" %) :logseq.property/status.todo "Todo" (+ 1000 %) %) (range 12))
        groups [{:status-key :logseq.property/status.todo
                 :status-title "Todo"
                 :count (count tasks)
                 :tasks (vec (sort-by logic/task-sort-key tasks))}]
        default-group (-> (logic/task-status-group-layout groups {:center-x 0 :center-y 0})
                          :groups
                          first)
        configured-group (-> (logic/task-status-group-layout
                              groups
                             {:center-x 0
                              :center-y 0
                               :visible-recent-node-count-per-group 7})
                             :groups
                             first)]
    (is (= ["todo-11" "todo-10" "todo-9" "todo-8" "todo-7" "todo-6"
            "todo-5" "todo-4" "todo-3" "todo-2" "todo-1" "todo-0"]
           (mapv :id (:tasks default-group))))
    (is (= 7 (count (:tasks configured-group))))
    (is (= 5 (:hidden-count configured-group)))))

(deftest task-status-group-layout-displays-most-recent-updated-blocks-per-status
  (let [tasks [(task-node "stale-created-last" :logseq.property/status.todo "Todo" nil 9000)
               (task-node "updated-200" :logseq.property/status.todo "Todo" 200 1)
               (task-node "updated-500" :logseq.property/status.todo "Todo" 500 2)
               (task-node "updated-300" :logseq.property/status.todo "Todo" 300 3)
               (task-node "updated-100" :logseq.property/status.todo "Todo" 100 4)]
        group (-> (logic/task-status-group-layout
                   [{:status-key :logseq.property/status.todo
                     :status-title "Todo"
                     :count (count tasks)
                     :tasks tasks}]
                   {:center-x 0
                    :center-y 0
                    :visible-recent-task-count 3})
                  :groups
                  first)]
    (is (= ["updated-500" "updated-300" "updated-200"]
           (mapv :id (:tasks group))))
    (is (= ["updated-500" "updated-300" "updated-200"]
           (take 3 (:all-task-ids group))))))

(deftest task-status-group-layout-reduces-visible-dots-in-tight-viewports
  (let [tasks (mapv #(task-node (str "todo-" %) :logseq.property/status.todo "Todo" (+ 1000 %) %) (range 12))
        groups [{:status-key :logseq.property/status.todo
                 :status-title "Todo"
                 :count (count tasks)
                 :tasks (vec (sort-by logic/task-sort-key tasks))}]
        roomy-group (-> (logic/task-status-group-layout groups {:center-x 0
                                                                :center-y 0
                                                                :width 1280
                                                                :height 840})
                        :groups
                        first)
        tight-group (-> (logic/task-status-group-layout groups {:center-x 0
                                                               :center-y 0
                                                               :width 360
                                                               :height 280})
                       :groups
                       first)]
    (is (= ["todo-11" "todo-10" "todo-9" "todo-8" "todo-7" "todo-6"
            "todo-5" "todo-4" "todo-3" "todo-2" "todo-1" "todo-0"]
           (mapv :id (:tasks roomy-group))))
    (is (= ["todo-11" "todo-10"]
           (mapv :id (:tasks tight-group))))
    (is (= 10 (:hidden-count tight-group)))
    (is (some? (:collapsed-node tight-group)))))

(deftest task-status-group-layout-reveals-overflow-in-batches
  (let [tasks (mapv #(task-node (str "todo-" %) :logseq.property/status.todo "Todo" (+ 1000 %) %) (range 23))
        groups [{:status-key :logseq.property/status.todo
                 :status-title "Todo"
                 :count (count tasks)
                 :tasks (vec (sort-by logic/task-sort-key tasks))}]
        initial-group (-> (logic/task-status-group-layout
                           groups
                           {:center-x 0
                            :center-y 0
                            :visible-recent-node-count-per-group 5})
                          :groups
                          first)
        revealed-group (-> (logic/task-status-group-layout
                            groups
                            {:center-x 0
                             :center-y 0
                             :visible-recent-node-count-per-group 5
                             :revealed-task-count-by-status {"logseq.property/status.todo" 10}})
                           :groups
                           first)
        fully-revealed-group (-> (logic/task-status-group-layout
                                  groups
                                  {:center-x 0
                                   :center-y 0
                                   :visible-recent-node-count-per-group 5
                                   :revealed-task-count-by-status {"logseq.property/status.todo" 23}})
                                 :groups
                                 first)]
    (is (= 5 (count (:tasks initial-group))))
    (is (= 18 (:hidden-count initial-group)))
    (is (= 10 (count (:tasks revealed-group))))
    (is (= 13 (:hidden-count revealed-group)))
    (is (some? (:collapsed-node revealed-group)))
    (is (= 23 (count (:tasks fully-revealed-group))))
    (is (= 0 (:hidden-count fully-revealed-group)))
    (is (nil? (:collapsed-node fully-revealed-group)))))

(deftest task-status-group-title-text-includes-hidden-items-entrypoint
  (is (= "TODO 74 ..."
         (logic/task-status-group-title-text {:status-title "Todo"
                                              :status-key :logseq.property/status.todo
                                              :count 74
                                              :hidden-count 62})))
  (is (= "IN REVIEW 8"
         (logic/task-status-group-title-text {:status-title "In Review"
                                              :status-key :logseq.property/status.in-review
                                              :count 8
                                              :hidden-count 0}))))

(deftest task-status-group-layout-keeps-center-label-clear-of-center-node
  (let [layout (logic/task-status-group-layout
                [{:status-key :logseq.property/status.todo
                  :status-title "Todo"
                  :count 8
                  :tasks (mapv #(task-node (str "todo-" %) :logseq.property/status.todo "Todo" (+ 1000 %) %)
                               (range 8))}]
                {:center-x 100
                 :center-y 200
                 :center-label "Task"})
        center (:center layout)
        center-card (:label-card center)
        center-point (select-keys center [:x :y])]
    (is (= "Task" (:title center-card)))
    (is (not (label-card-overlaps-point? center-card center-point 34)))))

(deftest task-status-group-layout-keeps-more-recent-items-in-crowded-statuses
  (let [status-counts [[:user.status/triage "Triage" 12]
                       [:user.status/ready "Ready" 12]
                       [:user.status/doing "Doing" 12]
                       [:user.status/review "Review" 12]
                       [:user.status/waiting "Waiting" 12]
                       [:user.status/blocked "Blocked" 12]
                       [:user.status/done "Done" 12]]
        groups (mapv (fn [[status-key status-title count]]
                       {:status-key status-key
                        :status-title status-title
                        :count count
                        :tasks (mapv #(task-node (str (name status-key) "-" %)
                                                 status-key
                                                 status-title
                                                 (+ 1000 %)
                                                 %)
                                     (range count))})
                     status-counts)
        layout-groups (:groups (logic/task-status-group-layout groups {:center-x 0
                                                                       :center-y 0
                                                                       :width 1280
                                                                       :height 900}))]
    (is (every? #(<= 5 (count (:tasks %))) layout-groups))
    (is (every? #(= (mapv :id (:tasks %))
                    (take 5 (:all-task-ids %)))
                layout-groups))))

(deftest task-status-label-cards-stay-near-their-dots
  (let [tasks (mapv #(assoc (task-node (str "todo-" %) :logseq.property/status.todo "Todo" (+ 1000 %) %)
                            :label (str "Task label " %))
                    (range 4))
        labelled-tasks (-> (logic/task-status-group-layout
                             [{:status-key :logseq.property/status.todo
                               :status-title "Todo"
                               :count (count tasks)
                               :tasks (vec (sort-by logic/task-sort-key tasks))}]
                             {:center-x 0
                              :center-y 0
                              :visible-limit 4
                              :label-limit 4})
                            :groups
                            first
                            :tasks)]
    (is (every? (fn [task]
                  (<= (distance task (get-in task [:label-card :position])) 150))
                labelled-tasks))))

(deftest task-status-more-control-stays-with-status-badge
  (let [tasks (mapv #(assoc (task-node (str "todo-" %) :logseq.property/status.todo "Todo" (+ 1000 %) %)
                            :label (str "Task label " %))
                    (range 16))
        group (-> (logic/task-status-group-layout
                   [{:status-key :logseq.property/status.todo
                     :status-title "Todo"
                     :count (count tasks)
                     :tasks (vec (sort-by logic/task-sort-key tasks))}]
                   {:center-x 0
                    :center-y 0
                    :visible-limit 8
                    :label-limit 6})
                  :groups
                  first)
        badge (:badge-card group)
        more (:collapsed-node group)]
    (is (some? more))
    (is (> (:x more)
           (+ (get-in badge [:position :x]) (/ (:width badge) 2))))
    (is (<= (js/Math.abs (- (:y more) (get-in badge [:position :y]))) 6))))

(deftest task-status-layout-by-id-uses-subtle-center-anchor
  (let [layout-by-id (logic/task-status-layout-by-id
                      {:id "tag-task"
                       :label "Task"
                       :x 10
                       :y 20
                       :radius 9}
                      {:groups []})
        center (get layout-by-id "tag-task")]
    (is (<= (:radius center) 24))
    (is (true? (:task-center? center)))))

(deftest wheel-zoom-transform-ignores-input-while-locked
  (is (nil? (logic/wheel-zoom-transform
             {:world-x 10 :world-y 20 :scale 1.0}
             {:screen-x 300 :screen-y 240 :delta-y -120 :locked? true})))
  (is (= {:x 289.0 :y 218.0 :scale 1.1}
         (logic/wheel-zoom-transform
          {:world-x 10 :world-y 20 :scale 1.0}
          {:screen-x 300 :screen-y 240 :delta-y -120}))))

(deftest graph-key-action-exits-active-task-status-preview-with-escape
  (let [action-fn (resolve 'frontend.extensions.graph.pixi.logic/graph-key-action)]
    (is (fn? action-fn))
    (is (= :exit-task-status-preview
           (when action-fn
             (action-fn {:key "Escape"
                         :task-status-preview-active? true}))))
    (is (nil? (when action-fn
                (action-fn {:key "Escape"
                            :task-status-preview-active? false}))))
    (is (nil? (when action-fn
                (action-fn {:key "Enter"
                            :task-status-preview-active? true}))))))

(deftest task-status-fit-key-changes-with-viewport-size
  (let [groups [{:normalized-status "logseq.property/status.todo"
                 :count 12}]
        revealed {"logseq.property/status.todo" 10}
        base-key (logic/task-status-fit-key
                  "tag-task"
                  revealed
                  groups
                  {:width 960 :height 640})
        wider-key (logic/task-status-fit-key
                   "tag-task"
                   revealed
                   groups
                   {:width 1280 :height 640})]
    (is (not= base-key wider-key))
    (is (= base-key
           (logic/task-status-fit-key
            "tag-task"
            revealed
            groups
            {:width 960 :height 640})))))

(deftest task-status-fit-key-changes-when-recent-task-blocks-change
  (let [base-groups [{:status-key :logseq.property/status.todo
                      :status-title "Todo"
                      :normalized-status "logseq.property/status.todo"
                      :count 4
                      :tasks [(task-node "first" :logseq.property/status.todo "Todo" 400 1)
                              (task-node "second" :logseq.property/status.todo "Todo" 300 2)
                              (task-node "third" :logseq.property/status.todo "Todo" 200 3)
                              (task-node "fourth" :logseq.property/status.todo "Todo" 100 4)]}]
        changed-groups [{:status-key :logseq.property/status.todo
                         :status-title "Todo"
                         :normalized-status "logseq.property/status.todo"
                         :count 4
                         :tasks [(task-node "first" :logseq.property/status.todo "Todo" 400 1)
                                 (task-node "third" :logseq.property/status.todo "Todo" 500 3)
                                 (task-node "second" :logseq.property/status.todo "Todo" 300 2)
                                 (task-node "fourth" :logseq.property/status.todo "Todo" 100 4)]}]
        opts {:width 1024
              :height 768
              :visible-recent-task-count 3}]
    (is (not= (logic/task-status-fit-key "tag-task" {} base-groups opts)
              (logic/task-status-fit-key "tag-task" {} changed-groups opts)))))

(deftest task-status-group-layout-collapses-overflow-and-builds-denoised-links
  (let [tasks (mapv #(task-node (str "todo-" %) :logseq.property/status.todo "Todo" (+ 1000 %) %) (range 30))
        groups [{:status-key "TODO"
                 :normalized-status "TODO"
                 :status-title "TODO"
                 :count (count tasks)
                 :tasks (vec (sort-by logic/task-sort-key tasks))}]
        layout (logic/task-status-group-layout groups {:center-x 0
                                                       :center-y 0
                                                       :visible-limit 12})
        group (first (:groups layout))
        links (logic/task-status-display-links "tag-task" (:groups layout))]
    (is (= 30 (:count group)))
    (is (= 12 (count (:tasks group))))
    (is (= 18 (:hidden-count group)))
    (is (= "task-status-collapsed:TODO" (get-in group [:collapsed-node :id])))
    (is (= 12 (count (:positions-by-id layout))))
    (is (contains? (logic/task-status-visible-node-ids "tag-task" (:groups layout))
                   "task-status-collapsed:TODO"))
    (is (= 1 (count (filter #(= "root-to-group" (:edge/type %)) links))))
    (is (empty? (filter #(= "root-to-task" (:edge/type %)) links)))
    (is (seq (filter #(= "task-relation" (:edge/type %)) links)))))

(deftest task-status-display-links-does-not-recreate-center-star-lines
  (let [tasks (mapv #(task-node (str "todo-" %) :logseq.property/status.todo "Todo" (+ 1000 %) %) (range 12))
        layout (logic/task-status-group-layout
                [{:status-key :logseq.property/status.todo
                  :status-title "Todo"
                  :count (count tasks)
                  :tasks tasks}]
                {:center-x 0
                 :center-y 0})
        links (logic/task-status-display-links "tag-task" (:groups layout))]
    (is (= #{"root-to-group" "task-relation"} (set (map :edge/type links))))
    (is (empty? (filter #(= "tag-task" (:source %))
                        (filter #(= "root-to-task" (:edge/type %)) links))))))

(deftest task-status-group-layout-labels-every-visible-dot-by-default
  (let [tasks (mapv #(assoc (task-node (str "todo-" %) :logseq.property/status.todo "Todo" (+ 1000 %) %)
                            :label (str "Visible task label " %))
                    (range 10))
        group (-> (logic/task-status-group-layout
                   [{:status-key :logseq.property/status.todo
                     :status-title "Todo"
                     :count (count tasks)
                     :tasks (vec (sort-by logic/task-sort-key tasks))}]
                   {:center-x 0 :center-y 0 :visible-limit 10})
                  :groups
                  first)]
    (is (= 10 (count (:tasks group))))
    (is (every? :task-status-label? (:tasks group)))
    (is (every? :label-position (:tasks group)))))

(deftest task-status-graph-layout-exposes-organic-blobs-cards-and-direct-links
  (let [layout (logic/task-status-group-layout (sample-task-graph-groups) {:center-x 0 :center-y 0})
        groups (:groups layout)
        links (logic/task-status-display-links "tag-task" groups)
        by-key (into {} (map (juxt :status-key identity) groups))
        labelled-tasks (mapcat #(filter :task-status-label? (:tasks %)) groups)]
    (is (= #{"TODO" "DOING" "WAITING" "DONE"} (set (map :status-key groups))))
    (is (= 84 (:count (get by-key "TODO"))))
    (is (= 27 (:count (get by-key "DOING"))))
    (is (= 16 (:count (get by-key "WAITING"))))
    (is (= 112 (:count (get by-key "DONE"))))
    (is (every? #(<= 8 (count (:blob-points %))) groups))
    (is (every? #(#{:top-left :top-right :bottom-left :bottom-right} (:position-hint %)) groups))
    (is (= #{"Research Logseq plugins" "Write project brief" "UI exploration" "Outline graphs guide"
             "Revise onboarding flow" "Implement graph filters" "Improve search speed" "Refactor query engine"
             "Feedback from design review" "API access approval" "Marketing copy review" "User interview takeaways"
             "Set up CI pipeline" "Design system audit" "Fix graph zoom issue" "Add keyboard shortcuts"}
           (set (map :label labelled-tasks))))
    (is (= #{"#research" "#docs" "#design" "#product" "#eng" "#performance"
             "#infra" "#growth" "#bug" "#enhancement"}
           (set (keep #(get-in % [:label-card :tag]) labelled-tasks))))
    (is (every? #(get-in % [:label-card :position]) labelled-tasks))
    (is (every? (fn [[a b]] (not (label-boxes-overlap? a b)))
                (for [a labelled-tasks
                      b labelled-tasks
                      :when (neg? (compare (:id a) (:id b)))]
                  [a b])))
    (is (every? (fn [labelled-task]
                  (not (label-card-overlaps-point?
                        (:label-card labelled-task)
                        (select-keys labelled-task [:x :y])
                        8)))
                labelled-tasks))
    (is (empty? (filter #(= "root-to-task" (:edge/type %)) links)))
    (is (= (set (map :id groups))
           (set (map :target (filter #(= "root-to-group" (:edge/type %)) links)))))
    (is (seq (filter #(= "task-relation" (:edge/type %)) links)))))

(deftest task-sort-key-prefers-updated-created-and-label
  (let [tasks [(assoc (task-node "b" :logseq.property/status.todo "Todo" nil 200) :label "B")
               (assoc (task-node "a" :logseq.property/status.todo "Todo" nil 300) :label "A")
               (assoc (task-node "updated" :logseq.property/status.todo "Todo" 100 100) :label "Updated")]]
    (is (= ["updated" "a" "b"]
           (mapv :id (sort-by logic/task-sort-key tasks))))))

(deftest task-status-group-layout-regroups-all-task-nodes-in-graph-space
  (let [{:keys [nodes neighbor-map visible-node-ids]} (task-detail-fixture)
        groups (logic/task-status-groups nodes "tag-task" neighbor-map visible-node-ids nil)
        layout (logic/task-status-group-layout groups {:center-x 10 :center-y 20})
        all-task-ids (set (mapcat #(map :id (:tasks %)) groups))
        by-key (into {} (map (juxt :status-key identity) (:groups layout)))]
    (is (= all-task-ids (set (keys (:positions-by-id layout)))))
    (is (every? (fn [group]
                  (and (number? (:x group))
                       (number? (:y group))
                       (number? (:radius group))
                       (not (contains? group :bounds))))
                (:groups layout)))
    (is (not= (select-keys (get by-key "TODO") [:x :y])
              (select-keys (get by-key "DONE") [:x :y])))
    (is (every? (fn [{:keys [tasks radius] :as group}]
                  (every? (fn [task]
                            (<= (distance group (get (:positions-by-id layout) (:id task)))
                                radius))
                          tasks))
                (:groups layout)))))

(deftest task-status-group-layout-keeps-dense-task-nodes-evenly-spaced
  (let [tasks (mapv #(task-node (str "todo-" %) :logseq.property/status.todo "Todo" (+ 1000 %) %) (range 84))
        groups [{:status-key :logseq.property/status.todo
                 :status-title "Todo"
                 :count (count tasks)
                 :tasks (vec (sort-by logic/task-sort-key tasks))}]
        layout (logic/task-status-group-layout groups {:center-x 0 :center-y 0})
        positions (vec (vals (:positions-by-id layout)))
        min-distance (apply min (for [a-idx (range (count positions))
                                      b-idx (range (inc a-idx) (count positions))]
                                  (distance (nth positions a-idx) (nth positions b-idx))))
        max-distance (apply max (map #(distance (first (:groups layout)) %) positions))]
    (is (>= min-distance 22))
    (is (<= max-distance (- (:radius (first (:groups layout))) 14)))))

(deftest task-status-group-layout-compacts-large-status-groups
  (let [task-count 672
        tasks (mapv #(task-node (str "done-" %) :logseq.property/status.done "Done" (+ 1000 %) %) (range task-count))
        groups [{:status-key :logseq.property/status.done
                 :status-title "Done"
                 :count task-count
                 :tasks tasks}]
        layout (logic/task-status-group-layout groups {:center-x 0 :center-y 0})
        group (first (:groups layout))
        positions (vec (vals (:positions-by-id layout)))]
    (is (= logic/task-status-detail-visible-limit (count positions)))
    (is (= (- task-count logic/task-status-detail-visible-limit)
           (:hidden-count group)))
    (is (<= (:radius group) 200))
    (is (every? #(<= (distance group %) (:radius group)) positions))))

(deftest task-status-group-layout-gives-larger-statuses-more-room-without-rendering-all-dots
  (let [status-counts [[:logseq.property/status.backlog "Backlog" 8]
                       [:logseq.property/status.done "Done" 672]]
        groups (mapv (fn [[status-key status-title count]]
                       {:status-key status-key
                        :status-title status-title
                        :count count
                        :tasks (mapv #(task-node (str (name status-key) "-" %)
                                                 status-key
                                                 status-title
                                                 (+ 1000 %)
                                                 %)
                                     (range count))})
                     status-counts)
        by-title (into {} (map (juxt :status-title identity)
                               (:groups (logic/task-status-group-layout
                                         groups
                                         {:center-x 0
                                          :center-y 0
                                          :visible-limit 8
                                          :label-limit 4}))))
        backlog (get by-title "Backlog")
        done (get by-title "Done")]
    (is (= 8 (count (:tasks done))))
    (is (= 664 (:hidden-count done)))
    (is (>= (:radius done) (+ (:radius backlog) 32)))
    (is (<= (:radius done) 220))))

(deftest task-status-group-layout-exposes-recent-task-labels-for-visible-dots
  (let [tasks (mapv #(assoc (task-node (str "todo-" %) :logseq.property/status.todo "Todo" (+ 1000 %) %)
                            :label (str "Task label " %))
                    (range 12))
        groups [{:status-key :logseq.property/status.todo
                 :status-title "Todo"
                 :count (count tasks)
                 :tasks (vec (sort-by logic/task-sort-key tasks))}]
        layout (logic/task-status-group-layout groups {:center-x 0 :center-y 0})
        labelled-tasks (filter :task-status-label? (-> layout :groups first :tasks))]
    (is (= ["todo-11" "todo-10" "todo-9" "todo-8" "todo-7" "todo-6"
            "todo-5" "todo-4" "todo-3" "todo-2" "todo-1" "todo-0"]
           (mapv :id labelled-tasks)))
    (is (every? :label-position labelled-tasks))
    (is (= 12 (count (:positions-by-id layout))))))

(deftest task-status-group-layout-exposes-status-label-and-count-anchors
  (let [tasks (mapv #(task-node (str "todo-" %) :logseq.property/status.todo "Todo" (+ 1000 %) %) (range 12))
        groups [{:status-key :logseq.property/status.todo
                 :status-title "Todo"
                 :count (count tasks)
                 :tasks (vec (sort-by logic/task-sort-key tasks))}]
        group (-> (logic/task-status-group-layout groups {:center-x 20 :center-y 30})
                  :groups
                  first)]
    (is (number? (get-in group [:label-position :x])))
    (is (< (get-in group [:label-position :y]) (- (:y group) (:radius group))))
    (is (number? (get-in group [:count-position :x])))
    (is (> (get-in group [:count-position :y]) (:y group)))))

(deftest task-status-group-layout-places-status-pill-inside-blob-top-left
  (let [tasks (mapv #(task-node (str "todo-" %) :logseq.property/status.todo "Todo" (+ 1000 %) %) (range 12))
        groups [{:status-key :logseq.property/status.todo
                 :status-title "Todo"
                 :count (count tasks)
                 :tasks (vec (sort-by logic/task-sort-key tasks))}]
        group (-> (logic/task-status-group-layout groups {:center-x 20 :center-y 30})
                  :groups
                  first)
        xs (map :x (:blob-points group))
        ys (map :y (:blob-points group))
        min-x (apply min xs)
        min-y (apply min ys)]
    (is (> (get-in group [:label-position :x]) min-x))
    (is (< (get-in group [:label-position :x]) (:x group)))
    (is (> (get-in group [:label-position :y]) min-y))
    (is (< (get-in group [:label-position :y]) (:y group)))))

(deftest task-status-label-cards-keep-readable-full-titles-for-wrapped-rendering
  (let [task (assoc (task-node "long-title" :logseq.property/status.doing "Doing" 1000 0)
                    :label "Reproduce and fix https://github.com/logseq/logseq/issues/12345 graph view label clipping"
                    :tags [{:label "bug"}])
        groups [{:status-key :logseq.property/status.doing
                 :status-title "Doing"
                 :count 1
                 :tasks [task]}]
        labelled-task (-> (logic/task-status-group-layout groups {:center-x 0 :center-y 0
                                                                  :label-limit 1})
                          :groups
                          first
                          :tasks
                          first)]
    (is (= (:label task) (get-in labelled-task [:label-card :title])))
    (is (>= (get-in labelled-task [:label-card :width]) 210))
    (is (>= (get-in labelled-task [:label-card :height]) 52))))

(deftest task-status-label-cards-reserve-height-for-wrapped-long-titles-without-tags
  (let [task (assoc (task-node "long-title" :logseq.property/status.todo "Todo" 1000 0)
                    :label "Deleting page causes invalid data when child blocks have references to the page data")
        groups [{:status-key :logseq.property/status.todo
                 :status-title "Todo"
                 :count 1
                 :tasks [task]}]
        labelled-task (-> (logic/task-status-group-layout groups {:center-x 0
                                                                  :center-y 0
                                                                  :label-limit 1})
                          :groups
                          first
                          :tasks
                          first)]
    (is (= (:label task) (get-in labelled-task [:label-card :title])))
    (is (>= (get-in labelled-task [:label-card :height]) 54))))

(deftest task-status-group-layout-keeps-status-badge-clear-of-task-labels
  (let [tasks [(assoc (task-node "delete-page" :logseq.property/status.todo "Todo" 1000 0)
                      :label "Deleting page causes invalid data when child blocks have references to the page data")
               (assoc (task-node "entity-print" :logseq.property/status.todo "Todo" 999 1)
                      :label "fix d/entity print")
               (assoc (task-node "alias-redirect" :logseq.property/status.todo "Todo" 998 2)
                      :label "fix alias recursive redirect")]
        group (-> (logic/task-status-group-layout
                   [{:status-key :logseq.property/status.todo
                     :status-title "Todo"
                     :count 74
                     :tasks tasks}]
                   {:center-x 0
                    :center-y 0
                    :visible-limit 3
                    :label-limit 3})
                  :groups
                  first)
        badge-card (:badge-card group)
        labelled-tasks (filter :task-status-label? (:tasks group))]
    (is (some? badge-card))
    (is (every? (fn [task]
                  (not (bounds-overlap?
                        (label-card-bounds badge-card)
                        (label-card-bounds (:label-card task))
                        8)))
                labelled-tasks))))

(deftest task-status-layout-keeps-label-cards-and-more-away-from-dots
  (let [tasks (mapv #(assoc (task-node (str "todo-" %) :logseq.property/status.todo "Todo" (+ 1000 %) %)
                            :label (str "Task label " %))
                    (range 16))
        group (-> (logic/task-status-group-layout
                   [{:status-key :logseq.property/status.todo
                     :status-title "Todo"
                     :count (count tasks)
                     :tasks (vec (sort-by logic/task-sort-key tasks))}]
                   {:center-x 0 :center-y 0 :visible-limit 8 :label-limit 6})
                  :groups
                  first)
        visible-points (concat (map #(select-keys % [:x :y]) (:tasks group))
                               [(select-keys (:collapsed-node group) [:x :y])])
        cards (keep :label-card (:tasks group))
        more-point (select-keys (:collapsed-node group) [:x :y])]
    (is (every? (fn [card]
                  (not-any? #(label-card-overlaps-point? card % 8) visible-points))
                cards))
    (is (not-any? #(label-card-overlaps-point? % more-point 10) cards))))

(deftest task-status-group-layout-separates-adjacent-large-primary-statuses
  (let [status-counts [[:logseq.property/status.backlog "Backlog" 360]
                       [:logseq.property/status.todo "Todo" 360]
                       [:logseq.property/status.doing "Doing" 120]
                       [:logseq.property/status.done "Done" 120]]
        groups (mapv (fn [[status-key status-title count]]
                       {:status-key status-key
                        :status-title status-title
                        :count count
                        :tasks (mapv #(task-node (str (name status-key) "-" %)
                                                 status-key
                                                 status-title
                                                 (+ 1000 %)
                                                 %)
                                     (range count))})
                     status-counts)
        circles (:groups (logic/task-status-group-layout groups {:center-x 0 :center-y 0}))]
    (is (every? (fn [[a b]]
                  (>= (distance a b)
                      (+ (:radius a) (:radius b) 72)))
                (for [a circles
                      b circles
                      :when (neg? (compare (:status-key a) (:status-key b)))]
                  [a b])))))

(deftest task-status-group-layout-keeps-real-task-statuses-near-the-selected-task
  (let [status-counts [[:logseq.property/status.backlog "Backlog" 8]
                       [:logseq.property/status.todo "Todo" 74]
                       [:logseq.property/status.doing "Doing" 20]
                       [:logseq.property/status.in-review "In Review" 10]
                       [:logseq.property/status.done "Done" 672]
                       [:logseq.property/status.canceled "Canceled" 16]
                       [:user.status/paused "Paused" 15]]
        groups (mapv (fn [[status-key status-title count]]
                       {:status-key status-key
                        :status-title status-title
                        :count count
                        :tasks (mapv #(task-node (str (name status-key) "-" %)
                                                 status-key
                                                 status-title
                                                 (+ 1000 %)
                                                 %)
                                     (range count))})
                     status-counts)
        layout (logic/task-status-group-layout groups {:center-x 100 :center-y 200})
        circles (:groups layout)
        min-x (apply min (map #(- (:x %) (:radius %)) circles))
        max-x (apply max (map #(+ (:x %) (:radius %)) circles))
        min-y (apply min (map #(- (:y %) (:radius %)) circles))
        max-y (apply max (map #(+ (:y %) (:radius %)) circles))]
    (is (<= (- max-x min-x) 1350))
    (is (<= (- max-y min-y) 1150))
    (is (every? #(<= (distance {:x 100 :y 200} %) 620) circles))))

(deftest task-status-group-layout-spreads-statuses-that-share-an-area
  (let [status-counts [[:logseq.property/status.todo "Todo" 74]
                       [:logseq.property/status.doing "Doing" 20]
                       [:logseq.property/status.in-review "In Review" 10]
                       [:logseq.property/status.backlog "Backlog" 8]
                       [:logseq.property/status.canceled "Canceled" 16]
                       [:logseq.property/status.done "Done" 112]]
        groups (mapv (fn [[status-key status-title count]]
                       {:status-key status-key
                        :status-title status-title
                        :count count
                        :tasks (mapv #(task-node (str (name status-key) "-" %)
                                                 status-key
                                                 status-title
                                                 (+ 1000 %)
                                                 %)
                                     (range count))})
                     status-counts)
        by-title (into {} (map (juxt :status-title identity)
                               (:groups (logic/task-status-group-layout groups {:center-x 0 :center-y 0}))))]
    (is (not= (:position-hint (get by-title "Doing"))
              (:position-hint (get by-title "In Review"))))
    (is (not= (:position-hint (get by-title "Backlog"))
              (:position-hint (get by-title "Canceled"))))))

(deftest task-status-group-layout-keeps-status-circles-apart
  (let [status-counts [[:logseq.property/status.todo "Todo" 84]
                       [:logseq.property/status.doing "Doing" 27]
                       [:logseq.property/status.done "Done" 112]
                       [:user.status/waiting "Waiting" 16]]
        groups (mapv (fn [[status-key status-title count]]
                       {:status-key status-key
                        :status-title status-title
                        :count count
                        :tasks (mapv #(task-node (str (name status-key) "-" %)
                                                 status-key
                                                 status-title
                                                 (+ 1000 %)
                                                 %)
                                     (range count))})
                     status-counts)
        layout (logic/task-status-group-layout groups {:center-x 0 :center-y 0})
        circles (:groups layout)]
    (is (every? (fn [[a b]]
                  (>= (distance a b)
                      (+ (:radius a) (:radius b) 48)))
                (for [a circles
                      b circles
                      :when (neg? (compare (:status-key a) (:status-key b)))]
                  [a b])))))

(deftest task-status-group-layout-keeps-status-blob-bounds-apart
  (let [status-counts [[:user.status/alpha "Alpha" 12]
                       [:user.status/beta "Beta" 12]
                       [:user.status/gamma "Gamma" 12]
                       [:user.status/delta "Delta" 12]
                       [:user.status/epsilon "Epsilon" 12]
                       [:user.status/zeta "Zeta" 12]]
        groups (mapv (fn [[status-key status-title count]]
                       {:status-key status-key
                        :status-title status-title
                        :count count
                        :tasks (mapv #(assoc (task-node (str (name status-key) "-" %)
                                                           status-key
                                                           status-title
                                                           (+ 1000 %)
                                                           %)
                                              :label (str status-title " item " %))
                                     (range count))})
                     status-counts)
        layout-groups (:groups (logic/task-status-group-layout groups {:center-x 0
                                                                       :center-y 0
                                                                       :label-limit 4}))]
    (is (every? (fn [[a b]]
                  (not (bounds-overlap? (group-blob-bounds a)
                                        (group-blob-bounds b)
                                        20)))
                (for [a layout-groups
                      b layout-groups
                      :when (neg? (compare (:status-key a) (:status-key b)))]
                  [a b])))))

(deftest task-status-group-layout-places-primary-statuses-around-task-center
  (let [groups [{:status-key :logseq.property/status.todo :status-title "Todo" :count 8 :tasks []}
                {:status-key :logseq.property/status.doing :status-title "Doing" :count 8 :tasks []}
                {:status-key :logseq.property/status.done :status-title "Done" :count 8 :tasks []}
                {:status-key :user.status/waiting :status-title "Waiting" :count 8 :tasks []}]
        layout-groups (:groups (logic/task-status-group-layout groups {:center-x 100 :center-y 200}))]
    (is (= #{:top-left :top-right :bottom-left :bottom-right}
           (set (map :position-hint layout-groups))))
    (is (every? (fn [{:keys [x y position-hint]}]
                  (case position-hint
                    :top-left (and (< x 100) (< y 200))
                    :top-right (and (> x 100) (< y 200))
                    :bottom-left (and (< x 100) (> y 200))
                    :bottom-right (and (> x 100) (> y 200))
                    false))
                layout-groups))))

(deftest layout-nodes-uses-link-forces
  (let [nodes [{:id "tag-a" :kind "tag" :label "Tag A"}
               {:id "obj-linked" :kind "object" :label "Linked object"}
               {:id "obj-island" :kind "object" :label "Island object"}]
        links [{:source "obj-linked" :target "tag-a"}]
        layouted (logic/layout-nodes nodes links :tags-and-objects false)
        by-id (into {} (map (juxt :id identity) layouted))
        node-distance (fn [a b]
                        (let [a* (get by-id a)
                              b* (get by-id b)
                              dx (- (:x a*) (:x b*))
                              dy (- (:y a*) (:y b*))]
                          (js/Math.sqrt (+ (* dx dx) (* dy dy)))))]
    (is (= 3 (count layouted)))
    (is (every? #(and (number? (:x %))
                      (number? (:y %))
                      (number? (:degree %))
                      (number? (:radius %))
                      (number? (:color-int %)))
                layouted))
    (is (< (node-distance "tag-a" "obj-linked")
           (node-distance "tag-a" "obj-island")))))

(deftest layout-nodes-tags-mode-assigns-clusters
  (let [nodes [{:id "tag-a" :kind "tag" :label "Tag A"}
               {:id "tag-b" :kind "tag" :label "Tag B"}
               {:id "obj-a" :kind "object" :label "Object A"}
               {:id "obj-b" :kind "object" :label "Object B"}]
        links [{:source "obj-a" :target "tag-a"}
               {:source "obj-b" :target "tag-b"}]
        layouted (logic/layout-nodes nodes links :tags-and-objects false)
        by-id (into {} (map (juxt :id identity) layouted))]
    (is (= "tag-a" (:cluster-id (get by-id "tag-a"))))
    (is (= "tag-a" (:cluster-id (get by-id "obj-a"))))
    (is (= "tag-b" (:cluster-id (get by-id "tag-b"))))
    (is (= "tag-b" (:cluster-id (get by-id "obj-b"))))))

(deftest layout-nodes-tags-mode-grid-layout-keeps-clusters-apart
  (let [tag-count 18
        object-count 12
        tags (mapv (fn [idx]
                     {:id (str "tag-" idx)
                      :kind "tag"
                      :label (str "Tag " idx)})
                   (range tag-count))
        objects (mapcat (fn [tag-idx]
                          (mapv (fn [object-idx]
                                  {:id (str "obj-" tag-idx "-" object-idx)
                                   :kind "object"
                                   :label (str "Object " tag-idx "-" object-idx)})
                                (range object-count)))
                        (range tag-count))
        links (mapcat (fn [tag-idx]
                        (mapv (fn [object-idx]
                                {:source (str "obj-" tag-idx "-" object-idx)
                                 :target (str "tag-" tag-idx)})
                              (range object-count)))
                      (range tag-count))
        layouted (logic/layout-nodes (vec (concat tags objects))
                                     (vec links)
                                     :tags-and-objects
                                     false
                                     {:grid-layout? true})
        backgrounds (logic/tag-cluster-backgrounds
                     layouted
                     :tags-and-objects
                     {:grid-layout? true})
        center-distance (fn [a b]
                          (let [dx (- (:x a) (:x b))
                                dy (- (:y a) (:y b))]
                            (js/Math.sqrt (+ (* dx dx) (* dy dy)))))
        width (- (apply max (map :x backgrounds))
                 (apply min (map :x backgrounds)))
        height (- (apply max (map :y backgrounds))
                  (apply min (map :y backgrounds)))]
    (is (= tag-count (count backgrounds)))
    (is (< width 2200))
    (is (< height 1800))
    (is (every? (fn [[a b]]
                  (> (center-distance a b)
                     (+ (:radius a) (:radius b) 24)))
                (for [a backgrounds
                      b backgrounds
                      :when (neg? (compare (:id a) (:id b)))]
                  [a b])))))

(deftest layout-nodes-tags-mode-can-use-relaxed-clusters
  (let [tag-count 6
        object-count 4
        tags (mapv (fn [idx]
                     {:id (str "tag-" idx)
                      :kind "tag"
                      :label (str "Tag " idx)})
                   (range tag-count))
        objects (mapcat (fn [tag-idx]
                          (mapv (fn [object-idx]
                                  {:id (str "obj-" tag-idx "-" object-idx)
                                   :kind "object"
                                   :label (str "Object " tag-idx "-" object-idx)})
                                (range object-count)))
                        (range tag-count))
        links (mapcat (fn [tag-idx]
                        (mapv (fn [object-idx]
                                {:source (str "obj-" tag-idx "-" object-idx)
                                 :target (str "tag-" tag-idx)})
                              (range object-count)))
                      (range tag-count))
        relaxed (logic/layout-nodes (vec (concat tags objects))
                                    (vec links)
                                    :tags-and-objects
                                    false
                                    {:grid-layout? false})
        by-id (into {} (map (juxt :id identity) relaxed))
        origin-distance (fn [node]
                          (js/Math.sqrt (+ (* (:x node) (:x node))
                                           (* (:y node) (:y node)))))]
    (is (some #(<= (origin-distance (get by-id (str "tag-" %))) 420)
              (range tag-count)))))

(deftest layout-nodes-tags-mode-grid-layout-duplicates-multi-tag-nodes
  (let [nodes [{:id "tag-a" :kind "tag" :label "Tag A"}
               {:id "tag-b" :kind "tag" :label "Tag B"}
               {:id "obj-a" :kind "object" :label "Object A"}]
        links [{:source "obj-a" :target "tag-a"}
               {:source "obj-a" :target "tag-b"}]
        layouted (logic/layout-nodes nodes links :tags-and-objects false {:grid-layout? true})
        object-copies (filter #(= "obj-a" (logic/node-source-id %)) layouted)
        display-links (logic/display-links links layouted)]
    (is (= 4 (count layouted)))
    (is (= #{"tag-a" "tag-b"} (set (map :cluster-id object-copies))))
    (is (= 2 (count (set (map :id object-copies)))))
    (is (= #{{:source (logic/visual-node-id "tag-a" "obj-a") :target "tag-a"}
             {:source (logic/visual-node-id "tag-b" "obj-a") :target "tag-b"}}
           (set (map #(select-keys % [:source :target]) display-links))))))

(deftest layout-nodes-tags-mode-non-grid-keeps-single-multi-tag-node
  (let [nodes [{:id "tag-a" :kind "tag" :label "Tag A"}
               {:id "tag-b" :kind "tag" :label "Tag B"}
               {:id "obj-a" :kind "object" :label "Object A"}]
        links [{:source "obj-a" :target "tag-a"}
               {:source "obj-a" :target "tag-b"}]
        layouted (logic/layout-nodes nodes links :tags-and-objects false {:grid-layout? false})
        object-nodes (filter #(= "obj-a" (logic/node-source-id %)) layouted)]
    (is (= 3 (count layouted)))
    (is (= 1 (count object-nodes)))
    (is (= "obj-a" (:id (first object-nodes))))))

(deftest layout-nodes-tags-mode-non-grid-keeps-old-seed-shape
  (let [tag-count 8
        object-count 120
        tags (mapv (fn [idx]
                     {:id (str "tag-" idx)
                      :kind "tag"
                      :label (str "Tag " idx)})
                   (range tag-count))
        objects (mapcat (fn [tag-idx]
                          (mapv (fn [object-idx]
                                  {:id (str "obj-" tag-idx "-" object-idx)
                                   :kind "object"
                                   :label (str "Object " tag-idx "-" object-idx)})
                                (range object-count)))
                        (range tag-count))
        links (mapcat (fn [tag-idx]
                        (mapv (fn [object-idx]
                                {:source (str "obj-" tag-idx "-" object-idx)
                                 :target (str "tag-" tag-idx)})
                              (range object-count)))
                      (range tag-count))
        layouted (logic/layout-nodes (vec (concat tags objects))
                                     (vec links)
                                     :tags-and-objects
                                     false
                                     {:grid-layout? false})
        tag-radius (fn [idx]
                     (let [{:keys [x y]} (some #(when (= (str "tag-" idx) (:id %)) %) layouted)]
                       (js/Math.round (js/Math.sqrt (+ (* x x) (* y y))))))]
    (is (= 968 (count layouted)))
    (is (every? #(<= 240 (tag-radius %) 760) (range tag-count)))))

(deftest tag-cluster-backgrounds-wrap-clustered-nodes
  (let [backgrounds (logic/tag-cluster-backgrounds
                     [{:id "tag-a" :kind "tag" :cluster-id "tag-a" :x 0 :y 0 :radius 10}
                      {:id "obj-a" :kind "object" :cluster-id "tag-a" :x 60 :y 0 :radius 8}
                      {:id "tag-b" :kind "tag" :cluster-id "tag-b" :x 300 :y 0 :radius 10}
                      {:id "obj-b" :kind "object" :cluster-id "tag-b" :x 360 :y 0 :radius 8}]
                     :tags-and-objects)]
    (is (= #{"tag-a" "tag-b"} (set (map :id backgrounds))))
    (is (every? #(>= (:radius %) 84) backgrounds))
    (is (= [] (logic/tag-cluster-backgrounds
               [{:id "tag-a" :kind "tag" :cluster-id "tag-a" :x 0 :y 0 :radius 10}]
               :all-pages)))))

(deftest tag-cluster-backgrounds-are-centered-on-tag-node
  (let [[background] (logic/tag-cluster-backgrounds
                      [{:id "tag-a" :kind "tag" :label "Tag A" :cluster-id "tag-a" :x 100 :y 80 :radius 10}
                       {:id "obj-a" :kind "object" :cluster-id "tag-a" :x 260 :y 80 :radius 8}
                       {:id "obj-b" :kind "object" :cluster-id "tag-a" :x 100 :y 220 :radius 8}]
                      :tags-and-objects
                      {:grid-layout? true})]
    (is (= 100 (:x background)))
    (is (= 80 (:y background)))
    (is (> (:radius background) 170))))

(deftest tag-cluster-backgrounds-use-bounds-center-for-non-grid
  (let [[background] (logic/tag-cluster-backgrounds
                      [{:id "tag-a" :kind "tag" :label "Tag A" :cluster-id "tag-a" :x 100 :y 80 :radius 10}
                       {:id "obj-a" :kind "object" :cluster-id "tag-a" :x 260 :y 80 :radius 8}
                       {:id "obj-b" :kind "object" :cluster-id "tag-a" :x 100 :y 220 :radius 8}]
                      :tags-and-objects
                      {:grid-layout? false})]
    (is (= 179 (:x background)))
    (is (= 149 (:y background)))))

(deftest tag-cluster-background-colors-come-from-tag-title
  (let [backgrounds (logic/tag-cluster-backgrounds
                     [{:id "tag-a" :kind "tag" :label "Design" :cluster-id "tag-a" :x 0 :y 0 :radius 10}
                      {:id "tag-b" :kind "tag" :label "Research" :cluster-id "tag-b" :x 180 :y 0 :radius 10}
                      {:id "tag-c" :kind "tag" :label "Design" :cluster-id "tag-c" :x 360 :y 0 :radius 10}]
                     :tags-and-objects)
        color-by-id (into {} (map (juxt :id :color-int) backgrounds))]
    (is (not= (get color-by-id "tag-a")
              (get color-by-id "tag-b")))
    (is (= (get color-by-id "tag-a")
           (get color-by-id "tag-c")))))

(deftest layout-nodes-ignores-links-with-missing-nodes
  (let [nodes [{:id 168 :kind "page" :label "Existing page"}
               {:id 169 :kind "page" :label "Linked page"}]
        links [{:source 168 :target 169}
               {:source 168 :target 170}]
        layouted (logic/layout-nodes nodes links :all-pages false)
        by-id (into {} (map (juxt :id identity) layouted))]
    (is (= #{168 169} (set (map :id layouted))))
    (is (= 1 (:degree (get by-id 168))))
    (is (= 1 (:degree (get by-id 169))))))

(deftest layout-nodes-sizes-hubs-by-edge-count
  (let [nodes (mapv (fn [id]
                      {:id id
                       :kind "page"
                       :label (str "Page " id)})
                    ["hub" "leaf-1" "leaf-2" "leaf-3" "leaf-4" "leaf-5" "island"])
        links (mapv (fn [target]
                      {:source "hub"
                       :target target})
                    ["leaf-1" "leaf-2" "leaf-3" "leaf-4" "leaf-5"])
        layouted (logic/layout-nodes nodes links :all-pages false)
        by-id (into {} (map (juxt :id identity) layouted))]
    (is (= 5 (:degree (get by-id "hub"))))
    (is (<= (+ (:radius (get by-id "leaf-1")) 4.0)
            (:radius (get by-id "hub"))))
    (is (< (:radius (get by-id "island"))
           (:radius (get by-id "leaf-1"))))))

(deftest layout-nodes-fast-all-pages-keeps-degree-based-sizing
  (let [nodes (mapv (fn [idx]
                      {:id idx
                       :kind "page"
                       :label (str "Page " idx)})
                    (range 3000))
        links (conj (mapv (fn [target]
                            {:source 0
                             :target target})
                          (range 1 101))
                    {:source 0 :target 999999})
        layouted (logic/layout-nodes nodes links :all-pages false)
        by-id (into {} (map (juxt :id identity) layouted))]
    (is (= 3000 (count layouted)))
    (is (= 100 (:degree (get by-id 0))))
    (is (= 1 (:degree (get by-id 1))))
    (is (= 0 (:degree (get by-id 101))))
    (is (< (:radius (get by-id 1))
           (:radius (get by-id 0))))))

(deftest layout-nodes-large-graph-uses-fast-path
  (let [nodes (mapv (fn [idx]
                      {:id idx
                       :kind "page"
                       :label (str "Page " idx)})
                    (range 50000))
        links (mapv (fn [idx]
                      {:source idx
                       :target (mod (inc idx) 50000)})
                    (range 50000))
        start (.now js/performance)
        layouted (logic/layout-nodes nodes links :all-pages false)
        elapsed (- (.now js/performance) start)
        sample (take 100 layouted)]
    (is (= 50000 (count layouted)))
    (is (every? #(and (number? (:x %))
                      (number? (:y %))
                      (number? (:degree %))
                      (number? (:radius %))
                      (number? (:color-int %)))
                sample))
    (is (< elapsed 1000))))

(deftest layout-nodes-4k-all-pages-uses-fast-path
  (let [nodes (mapv (fn [idx]
                      {:id idx
                       :kind "page"
                       :label (str "Movie " idx)})
                    (range 4000))
        links (mapv (fn [idx]
                      {:source idx
                       :target (mod (inc idx) 4000)})
                    (range 4000))
        start (.now js/performance)
        layouted (logic/layout-nodes nodes links :all-pages false)
        elapsed (- (.now js/performance) start)]
    (is (= 4000 (count layouted)))
    (is (< elapsed 250))))

(deftest layout-nodes-medium-tags-and-objects-uses-bounded-d3-force
  (let [tag-count 12
        object-count 3875
        tags (mapv (fn [idx]
                     {:id (str "tag-" idx)
                      :kind "tag"
                      :label (str "Tag " idx)})
                   (range tag-count))
        objects (mapv (fn [idx]
                        {:id (str "obj-" idx)
                         :kind "object"
                         :label (str "Object " idx)})
                      (range object-count))
        nodes (into tags objects)
        links (mapv (fn [idx]
                      {:source (str "obj-" idx)
                       :target (str "tag-" (mod idx tag-count))})
                    (range object-count))
        start (.now js/performance)
        layouted (logic/layout-nodes nodes links :tags-and-objects false)
        elapsed (- (.now js/performance) start)
        by-id (into {} (map (juxt :id identity) layouted))]
    (is (= (+ tag-count object-count) (count layouted)))
    (is (every? #(and (number? (:x %))
                      (number? (:y %))
                      (number? (:degree %))
                      (number? (:radius %))
                      (number? (:color-int %)))
                (take 200 layouted)))
    (is (< elapsed 1000))
    (is (< (js/Math.abs (:x (get by-id "tag-0"))) 900))
    (is (< (js/Math.abs (:y (get by-id "tag-0"))) 900))))

(deftest layout-nodes-non-grid-tags-keeps-force-layout-controls
  (let [tag-count 8
        object-count 960
        tags (mapv (fn [idx]
                     {:id (str "tag-" idx)
                      :kind "tag"
                      :label (str "Tag " idx)})
                   (range tag-count))
        objects (mapv (fn [idx]
                        {:id (str "obj-" idx)
                         :kind "object"
                         :label (str "Object " idx)})
                      (range object-count))
        nodes (into tags objects)
        links (mapv (fn [idx]
                      {:source (str "obj-" idx)
                       :target (str "tag-" (mod idx tag-count))})
                    (range object-count))
        compact (logic/layout-nodes nodes links :tags-and-objects false {:link-distance 40})
        loose (logic/layout-nodes nodes links :tags-and-objects false {:link-distance 140})
        compact-by-id (into {} (map (juxt :id identity) compact))
        loose-by-id (into {} (map (juxt :id identity) loose))
        compact-node (get compact-by-id "obj-100")
        loose-node (get loose-by-id "obj-100")]
    (is (not= [(:x compact-node) (:y compact-node)]
              [(:x loose-node) (:y loose-node)]))))
