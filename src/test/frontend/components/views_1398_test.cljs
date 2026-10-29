(ns frontend.components.views-1398-test
  (:require ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [frontend.components.views :as views]
            [frontend.context.i18n :refer [t]]
            [frontend.db.async :as db-async]
            [frontend.rfx :as rfx]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.object :as gobj]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

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

(deftest table-name-cell-shows-untitled-for-a-page-without-title-test
  (let [untitled (t :ui/untitled)
        render-cell (fn [title]
                      (let [block {:block/uuid (random-uuid) :block/title title}]
                        (render-static
                         (views/block-title-interactive block {:width 200}))))
        preview-cell-texts (fn [title]
                             (filter string?
                                     (tree-seq coll? seq
                                               (#'views/first-window-block-title
                                                {:block/uuid (random-uuid)
                                                 :block/title title
                                                 :block.temp/first-window-preview? true}))))]
    (is (not (string/blank? untitled)))
    (with-redefs [state/get-component (fn [k]
                                        (when (= :block/inline-title k)
                                          (fn [_config text] (.createElement react "span" nil text))))]
      (doseq [title ["" "  " nil (str (random-uuid))]]
        (is (string/includes? (render-cell title) untitled)
            (str "A table name cell with title " (pr-str title) " must not be empty"))
        (is (some #{untitled} (preview-cell-texts title))
            (str "A first-window name cell with title " (pr-str title) " must not be empty")))
      (let [html (render-cell "Real page")]
        (is (string/includes? html "Real page"))
        (is (not (string/includes? html untitled)))))))

(deftest change-filter-operator-of-a-filter-without-value-test
  (async done
    (let [stored (atom nil)
          property {:db/ident :user.property/note :logseq.property/type :default}
          filters {:or? false :filters [[:user.property/note :text-contains]]}]
      (with-redefs [db-async/<get-view-filter-data
                    (fn [_property _opts] (p/resolved {:value-after-operator-change nil}))]
        (-> (p/do! (#'views/<change-filter-operator! property :text-not-contains filters
                                                     #(reset! stored %) 0))
            (p/then (fn [_]
                      (is (= [[:user.property/note :text-not-contains]] (:filters @stored))
                          "A clause with no value changes its operator")))
            (p/catch (fn [error]
                       (is false (str "Changing the operator failed: " (ex-message error)))))
            (p/finally done))))))

(deftest previous-paint-survives-search-input-change-only-test
  (let [view-uuid (random-uuid)
        asc [{:id :block/title :asc? true}]
        desc [{:id :block/title :asc? false}]
        key-for (fn [sorting input]
                  (:previous-paint-key
                   (#'views/loaded-view-resource-plan
                    view-uuid :class-objects sorting nil input nil nil 990)))]
    (is (some? (key-for asc "")))
    (is (= (key-for asc "") (key-for asc "a") (key-for asc "ab"))
        "Typing in the search box must not drop the previous paint, or the search input unmounts on the first keystroke.")
    (is (not= (key-for asc "a") (key-for desc "a"))
        "A new sort order still drops the previous paint.")))

(deftest previous-paint-key-changes-with-sort-and-filter-of-a-non-windowed-view-test
  (let [view-uuid (random-uuid)
        asc [{:id :block/title :asc? true}]
        desc [{:id :block/title :asc? false}]
        filters {:filters [[:block/title :text-contains "a"]]}
        plan-for (fn [sorting filters input]
                   (#'views/loaded-view-resource-plan
                    view-uuid :linked-references sorting filters input nil nil 990))
        key-for (fn [sorting filters input]
                  (:previous-paint-key (plan-for sorting filters input)))]
    (is (nil? (:window-context (plan-for asc nil "")))
        "Linked references are not windowed, so the key cannot come from the window context.")
    (is (= (key-for asc nil "") (key-for asc nil "a"))
        "Typing in the search box keeps the previous paint.")
    (is (not= (key-for asc nil "") (key-for desc nil ""))
        "A new sort order drops the previous paint, so old rows are not left selectable.")
    (is (not= (key-for asc nil "") (key-for asc filters ""))
        "A new filter drops the previous paint, so old rows are not left selectable.")))

(defn- row-ids-selected-by-shift-click
  "Row ids that a shift-click on `row` selects when the last selected row is at
  `last-selected-idx`."
  [table row last-selected-idx]
  (let [selected (atom #{})
        checkbox-props (atom nil)]
    (with-redefs [shui/checkbox (fn [props] (reset! checkbox-props props) nil)
                  rfx/use-sub (constantly nil)
                  rfx/snapshot-sub (fn [path]
                                     (when (= :last-selected-idx (last path))
                                       last-selected-idx))
                  state/set-state! (fn [path value]
                                     (when (true? value)
                                       (swap! selected conj (last path))))
                  util/stop (fn [_e] nil)]
      (render-static (views/row-checkbox table row nil))
      ((:on-click @checkbox-props) #js {:shiftKey true}))
    @selected))

(deftest shift-click-selects-the-range-past-the-painted-window-test
  (let [row-ids (vec (repeatedly 40 random-uuid))
        table {:data (subvec row-ids 0 10)
               :full-data row-ids
               :state {:selection-id "shift-range"}}
        row (fn [idx] {:db/id (inc idx) :block/uuid (nth row-ids idx)})]
    (testing "a flat table paints a window of its rows"
      (is (= (set (subvec row-ids 0 26))
             (row-ids-selected-by-shift-click table (row 25) 0))
          "The range runs over every row between the two clicks, not only the painted window."))
    (testing "a group table spans the rows of its group"
      (let [group (subvec row-ids 10 20)
            group-table (assoc table
                               :data group
                               :state {:selection-id "shift-range"
                                       :group-by-property {:db/ident :block/tags}})]
        (is (= (set (subvec row-ids 12 16))
               (row-ids-selected-by-shift-click group-table (row 15) 2)))))))

(deftest open-buttons-render-only-in-the-name-column-test
  (let [block {:db/id 1
               :block/uuid (random-uuid)
               :block/title "Project"}
        button-count (fn [property-ident]
                       (with-redefs [state/get-component (constantly (fn [& _] nil))
                                     util/mobile? (constantly false)]
                         (count (re-seq #"<button"
                                        (render-static
                                         (views/block-title-interactive
                                          block
                                          {:property-ident property-ident
                                           :width 200}))))))]
    (is (= 2 (button-count :block/title))
        "The name column keeps its open and open-in-sidebar buttons.")
    (is (zero? (button-count :logseq.property/description))
        "A text property cell must not repeat the name column's open buttons.")))
