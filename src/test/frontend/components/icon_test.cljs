(ns frontend.components.icon-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.icon :as icon]
            [frontend.components.icon.keyboard-nav :as kbd-nav]
            [frontend.components.icon.utils :as icon-utils]
            [frontend.storage :as storage]))

(deftest normalize-icon-test
  (testing "legacy emoji map normalizes to the unified shape"
    (let [normalized (icon/normalize-icon {:type :emoji :id "smile"})]
      (is (= :emoji (:type normalized)))
      (is (= "smile" (get-in normalized [:data :value])))))

  (testing "legacy :tabler-icon and :icon maps both normalize to :icon, keeping color"
    (doseq [t [:tabler-icon :icon]]
      (let [normalized (icon/normalize-icon {:type t :id "house" :color "#ff0000"})]
        (is (= :icon (:type normalized)))
        (is (= "house" (get-in normalized [:data :value])))
        (is (= "#ff0000" (get-in normalized [:data :color]))))))

  (testing "string-typed :type keys are coerced"
    (is (= :icon (:type (icon/normalize-icon {:type "tabler-icon" :id "house"})))))

  (testing "unified-shape input passes through untouched"
    (let [v {:type :icon :id "icon-house" :label "house" :data {:value "house"}}]
      (is (= v (icon/normalize-icon v)))))

  (testing "plain strings are treated as tabler icon names"
    (let [normalized (icon/normalize-icon "house")]
      (is (= :icon (:type normalized)))
      (is (= "icon-house" (:id normalized)))))

  (testing "maps without a known :type fall back to a value guess"
    (let [normalized (icon/normalize-icon {:value "house"})]
      (is (= :icon (:type normalized)))
      (is (= "house" (get-in normalized [:data :value])))))

  (testing "nil and unrenderable input normalize to nil"
    (is (nil? (icon/normalize-icon nil)))
    (is (nil? (icon/normalize-icon 42)))))

(deftest icon-data-for-storage-test
  (testing "persists only the id/type/color projection"
    (is (= {:type :icon :id "icon-house" :color "#123456"}
           (icon/icon-data-for-storage {:type :icon :id "icon-house" :color "#123456"
                                        :label "house" :data {:value "house"}})))
    (is (= {:type :emoji :id "emoji-😀"}
           (icon/icon-data-for-storage {:type :emoji :id "emoji-😀" :data {:value "😀"}})))))

(deftest renderable-icon-test
  (testing "emoji values with a non-blank glyph are renderable"
    (is (true? (icon/renderable-icon? {:type :emoji :id "smile"}))))

  (testing "the :none suppression sentinel is never renderable"
    (is (false? (icon/renderable-icon? {:type :none :data {}}))))

  (testing "stored types this build doesn't render fall through to false (invisible, not broken)"
    ;; richer builds persist additional unified-shape types; they normalize
    ;; via the passthrough branch and must land on the case default
    (doseq [foreign [{:type :sticker :data {:value "AB"}}
                     {:type :photo :data {:asset-uuid "u1"}}]]
      (is (false? (icon/renderable-icon? foreign)))))

  (testing "nil input is not renderable"
    (is (false? (icon/renderable-icon? nil)))))

(deftest used-items-test
  (testing "legacy :ui/ls-icons-used migrates once into the v2 key"
    (let [store (atom {:ui/ls-icons-used [{:type "emoji" :id "smile"}]})]
      (with-redefs [storage/get (fn [k] (get @store k))
                    storage/set (fn [k v] (swap! store assoc k v))]
        (let [items (icon/get-used-items)]
          (is (= 1 (count items)))
          (is (= :emoji (:type (first items))))
          (is (seq (get @store :ui/ls-icons-used-v2)))))))

  (testing "add-used-item! dedupes across the whole list and caps at 24"
    (let [emoji-item (fn [i] {:type :emoji :id (str "emoji-" i)
                              :label (str i) :data {:value (str i)}})
          store (atom {:ui/ls-icons-used-v2 (mapv emoji-item (range 30))})]
      (with-redefs [storage/get (fn [k] (get @store k))
                    storage/set (fn [k v] (swap! store assoc k v))]
        ;; re-adding an existing item moves it to the head without duplicating
        (icon/add-used-item! (emoji-item 5))
        (let [items (get @store :ui/ls-icons-used-v2)]
          (is (= 24 (count items)))
          (is (= "emoji-5" (:id (first items))))
          (is (= 1 (count (filter #(= "emoji-5" (:id %)) items)))))))))

(deftest compute-flat-items-tab-scoping-test
  (let [result {:emojis [{:type :emoji :id "e1" :data {:value "e1"}}]
                :icons  [{:type :icon :id "i1" :data {:value "i1"}}]}]
    (testing "search results are scoped by the active tab"
      (is (= ["Emojis" "Icons"]
             (map :label (:sections (kbd-nav/compute-flat-items :all result {})))))
      (is (= ["Emojis"]
             (map :label (:sections (kbd-nav/compute-flat-items :emoji result {})))))
      (is (= ["Icons"]
             (map :label (:sections (kbd-nav/compute-flat-items :icon result {}))))))

    (testing "collapsed sections drop out of the flat list"
      (let [{:keys [items sections]} (kbd-nav/compute-flat-items :all result {"Emojis" false})]
        (is (= ["Icons"] (map :label sections)))
        (is (= ["i1"] (map :id items)))))))

(deftest reaction-picker-opts-test
  (testing "the reaction variant is emoji-only with a hidden topbar"
    (is (= [:emoji] (:allowed-tabs icon/reaction-picker-opts)))
    (is (true? (:hide-topbar? icon/reaction-picker-opts)))
    (is (true? (:show-used? icon/reaction-picker-opts)))
    (is (nil? (:icon-value icon/reaction-picker-opts)))))

(deftest humanize-icon-name-test
  (testing "camelCase splits on word boundaries"
    (is (= "Briefcase"        (icon-utils/humanize-icon-name "briefcase")))
    (is (= "Timeline event"   (icon-utils/humanize-icon-name "TimelineEvent")))
    (is (= "Arrows maximize"  (icon-utils/humanize-icon-name "ArrowsMaximize"))))

  (testing "Brand prefix is stripped (BrandSlack -> Slack)"
    ;; The brand-name suffix is the meaningful token; rendering 'Brand
    ;; slack' would be redundant when the icon glyph is already a Slack
    ;; logo.
    (is (= "Slack" (icon-utils/humanize-icon-name "BrandSlack"))))

  (testing "well-known acronyms preserve their uppercase form"
    (is (= "TV off"      (icon-utils/humanize-icon-name "TvOff")))
    (is (= "3D cube sphere" (icon-utils/humanize-icon-name "3dCubeSphere")))
    (is (= "2FA lock"    (icon-utils/humanize-icon-name "2faLock"))))

  (testing "kebab-case input is normalized the same way"
    (is (= "3D cube sphere" (icon-utils/humanize-icon-name "3d-cube-sphere"))))

  (testing "blank input returns empty string (caller-friendly)"
    (is (= "" (icon-utils/humanize-icon-name nil)))
    (is (= "" (icon-utils/humanize-icon-name "")))))
