(ns frontend.components.icon-test
  (:require [cljs.test :refer [deftest is testing use-fixtures]]
            [frontend.components.icon :as icon]
            [frontend.context.i18n :as i18n]
            [frontend.state :as state]))

;; Reset preferred-language between tests so a previous test's locale
;; setting can't leak into the next test's initials derivation.
(use-fixtures :each
  (fn [f]
    (state/set-state! :preferred-language nil)
    (f)
    (state/set-state! :preferred-language nil)))

;; Pre-existing tests for `normalize-tabs` and `emoji-sections` were removed
;; in this commit because those private helpers no longer exist in
;; frontend.components.icon (the file has been refactored several times since
;; the tests were written). Phase 1 of the avatar-shape-and-fallback work adds
;; the avatar-shape coverage below; broader test backfill is tracked outside
;; this PR.

(deftest normalize-icon-avatar-shape
  (testing "legacy avatars without :shape default to :circle (backward compat)"
    (let [normalized (icon/normalize-icon {:type :avatar :data {:value "JK"}})]
      (is (= :circle (get-in normalized [:data :shape])))
      (is (= "JK" (get-in normalized [:data :value])))))

  (testing "avatars preserve :shape :rounded-rect when stored"
    (let [normalized (icon/normalize-icon
                      {:type :avatar :data {:value "AC" :shape :rounded-rect}})]
      (is (= :rounded-rect (get-in normalized [:data :shape])))))

  (testing "avatars preserve :shape :circle when explicitly set"
    (let [normalized (icon/normalize-icon
                      {:type :avatar :data {:value "X" :shape :circle}})]
      (is (= :circle (get-in normalized [:data :shape])))))

  (testing "shape is read-through from a top-level :shape key (legacy shape)"
    ;; defensive: some older serializations stored :shape outside :data
    (let [normalized (icon/normalize-icon
                      {:type :avatar :shape :rounded-rect :data {:value "X"}})]
      (is (= :rounded-rect (get-in normalized [:data :shape])))))

  (testing "shape coexists with color + image without disturbing them"
    (let [normalized (icon/normalize-icon
                      {:type :avatar
                       :data {:value "X"
                              :shape :rounded-rect
                              :color "#FF802B"
                              :backgroundColor "#FF802B"
                              :asset-uuid "abc-123"
                              :asset-type "png"}})]
      (is (= :rounded-rect (get-in normalized [:data :shape])))
      (is (= "#FF802B"     (get-in normalized [:data :color])))
      (is (= "#FF802B"     (get-in normalized [:data :backgroundColor])))
      (is (= "abc-123"     (get-in normalized [:data :asset-uuid])))
      (is (= "png"         (get-in normalized [:data :asset-type]))))))

(deftest normalize-icon-avatar-fallback
  (testing "legacy avatars without :fallback-type default to :letters"
    (let [normalized (icon/normalize-icon {:type :avatar :data {:value "JK"}})]
      (is (= :letters (get-in normalized [:data :fallback-type])))
      (is (nil? (get-in normalized [:data :fallback-icon])))))

  (testing "explicit :fallback-type :icon with valid :fallback-icon round-trips"
    (let [normalized (icon/normalize-icon
                      {:type :avatar
                       :data {:value "AC"
                              :fallback-type :icon
                              :fallback-icon "briefcase"}})]
      (is (= :icon (get-in normalized [:data :fallback-type])))
      (is (= "briefcase" (get-in normalized [:data :fallback-icon])))))

  (testing ":fallback-type :icon with no :fallback-icon degrades to :letters"
    ;; Defensive: an :icon type without a name is unrenderable, so we want
    ;; the renderer's invariant (`:icon implies non-blank :fallback-icon`)
    ;; to be enforced at normalization time rather than every read site.
    (let [normalized (icon/normalize-icon
                      {:type :avatar
                       :data {:value "X" :fallback-type :icon}})]
      (is (= :letters (get-in normalized [:data :fallback-type])))
      (is (nil? (get-in normalized [:data :fallback-icon])))))

  (testing ":fallback-type :icon with blank string :fallback-icon also degrades"
    (let [normalized (icon/normalize-icon
                      {:type :avatar
                       :data {:value "X"
                              :fallback-type :icon
                              :fallback-icon ""}})]
      (is (= :letters (get-in normalized [:data :fallback-type])))))

  (testing "switching back to :letters drops :fallback-icon"
    ;; Simulates the user picking Letters in the Fallback dropdown after
    ;; previously having picked an icon. The picker writes :fallback-type
    ;; :letters; we shouldn't carry the dormant :fallback-icon along
    ;; unless someone explicitly retains it.
    (let [normalized (icon/normalize-icon
                      {:type :avatar
                       :data {:value "X" :fallback-type :letters}})]
      (is (= :letters (get-in normalized [:data :fallback-type])))
      (is (nil? (get-in normalized [:data :fallback-icon])))))

  (testing "fallback fields read from top-level keys (legacy serializations)"
    (let [normalized (icon/normalize-icon
                      {:type :avatar
                       :fallback-type :icon
                       :fallback-icon "star"
                       :data {:value "X"}})]
      (is (= :icon (get-in normalized [:data :fallback-type])))
      (is (= "star" (get-in normalized [:data :fallback-icon])))))

  (testing "shape, fallback, color, and image all coexist in one avatar"
    (let [normalized (icon/normalize-icon
                      {:type :avatar
                       :data {:value "AC"
                              :shape :rounded-rect
                              :fallback-type :icon
                              :fallback-icon "briefcase"
                              :color "#5B6CFF"
                              :backgroundColor "#5B6CFF"
                              :asset-uuid "uuid-1"
                              :asset-type "jpg"}})]
      (is (= :rounded-rect (get-in normalized [:data :shape])))
      (is (= :icon         (get-in normalized [:data :fallback-type])))
      (is (= "briefcase"   (get-in normalized [:data :fallback-icon])))
      (is (= "#5B6CFF"     (get-in normalized [:data :color])))
      (is (= "uuid-1"      (get-in normalized [:data :asset-uuid]))))))

(deftest humanize-icon-name-test
  (testing "camelCase splits on word boundaries"
    (is (= "Briefcase"        (icon/humanize-icon-name "briefcase")))
    (is (= "Timeline event"   (icon/humanize-icon-name "TimelineEvent")))
    (is (= "Arrows maximize"  (icon/humanize-icon-name "ArrowsMaximize"))))

  (testing "Brand prefix is stripped (BrandSlack -> Slack)"
    ;; The brand-name suffix is the meaningful token; rendering 'Brand
    ;; slack' would be redundant when the icon glyph is already a Slack
    ;; logo.
    (is (= "Slack" (icon/humanize-icon-name "BrandSlack"))))

  (testing "well-known acronyms preserve their uppercase form"
    (is (= "TV off"      (icon/humanize-icon-name "TvOff")))
    (is (= "3D cube sphere" (icon/humanize-icon-name "3dCubeSphere")))
    (is (= "2FA lock"    (icon/humanize-icon-name "2faLock"))))

  (testing "kebab-case input is normalized the same way"
    (is (= "3D cube sphere" (icon/humanize-icon-name "3d-cube-sphere"))))

  (testing "blank input returns empty string (caller-friendly)"
    (is (= "" (icon/humanize-icon-name nil)))
    (is (= "" (icon/humanize-icon-name "")))))

(deftest strip-leading-honorific-test
  (testing "English: common prefixes are stripped"
    (is (= "David Kowalski"   (i18n/strip-leading-honorific "Dr. David Kowalski" :en)))
    (is (= "Smith"            (i18n/strip-leading-honorific "Mrs. Smith" :en)))
    (is (= "Patrick Stewart"  (i18n/strip-leading-honorific "Sir Patrick Stewart" :en))))

  (testing "no-period variant of a typically-periodized prefix"
    (is (= "David Kowalski" (i18n/strip-leading-honorific "Dr David Kowalski" :en)))
    (is (= "Smith"          (i18n/strip-leading-honorific "Mrs Smith" :en))))

  (testing "case-insensitive matching"
    (is (= "DAVID KOWALSKI"  (i18n/strip-leading-honorific "DR. DAVID KOWALSKI" :en)))
    (is (= "david kowalski"  (i18n/strip-leading-honorific "dr. david kowalski" :en))))

  (testing "longest-first: 'Mrs.' wins over 'Mr.'"
    (is (= "Robinson" (i18n/strip-leading-honorific "Mrs. Robinson" :en))))

  (testing "whitespace requirement: 'Drew' is NOT a 'Dr', no-space yields no strip"
    (is (= "Drew Barrymore"     (i18n/strip-leading-honorific "Drew Barrymore" :en)))
    (is (= "Dr.David Kowalski"  (i18n/strip-leading-honorific "Dr.David Kowalski" :en))))

  (testing "blank-result safety: bare prefix is preserved"
    (is (= "Dr." (i18n/strip-leading-honorific "Dr." :en)))
    (is (= "Dr"  (i18n/strip-leading-honorific "Dr"  :en))))

  (testing "single-pass: doesn't strip nested honorifics"
    (is (= "Dr. Müller" (i18n/strip-leading-honorific "Prof. Dr. Müller" :de))))

  (testing "German"
    (is (= "Schneider" (i18n/strip-leading-honorific "Dr. Schneider" :de))))

  (testing "French"
    (is (= "Macron" (i18n/strip-leading-honorific "M. Macron" :fr)))
    (is (= "Curie"  (i18n/strip-leading-honorific "Mme. Curie" :fr))))

  (testing "Spanish"
    (is (= "García" (i18n/strip-leading-honorific "Dr. García" :es))))

  (testing "unknown locale falls back to English"
    (is (= "David Kowalski" (i18n/strip-leading-honorific "Dr. David Kowalski" :xx))))

  (testing "nil / blank / non-string input is returned as-is"
    (is (nil? (i18n/strip-leading-honorific nil :en)))
    (is (= "" (i18n/strip-leading-honorific "" :en)))
    (is (= "   " (i18n/strip-leading-honorific "   " :en))))

  (testing "no match: title is returned unchanged"
    (is (= "Acme Inc."   (i18n/strip-leading-honorific "Acme Inc." :en)))
    (is (= "The Beatles" (i18n/strip-leading-honorific "The Beatles" :en)))))

(deftest derive-avatar-initials-honorific-test
  (testing "English honorifics with default locale — two-word names"
    (is (= "DK" (icon/derive-avatar-initials "Dr. David Kowalski")))
    (is (= "PS" (icon/derive-avatar-initials "Sir Patrick Stewart")))
    (is (= "DB" (icon/derive-avatar-initials "Drew Barrymore"))))

  (testing "honorific + single name reduces to single-word path (first 2 chars)"
    ;; "Mrs. Smith" → strip "Mrs." → "Smith" → single-word path → "SM".
    ;; Consistent with how mononyms ("Madonna" → "MA") are handled.
    (is (= "SM" (icon/derive-avatar-initials "Mrs. Smith")))
    (is (= "SC" (icon/derive-avatar-initials "Dr. Schneider"))))

  (testing "no-period variant"
    (is (= "DK" (icon/derive-avatar-initials "Dr David Kowalski"))))

  (testing "non-English with locale switch"
    (state/set-state! :preferred-language "fr")
    (is (= "MA" (icon/derive-avatar-initials "M. Macron"))))

  (testing "unchanged behavior for non-honorific titles"
    (is (= "DK" (icon/derive-avatar-initials "David Kowalski")))
    (is (= "TB" (icon/derive-avatar-initials "The Beatles")))
    (is (= "AC" (icon/derive-avatar-initials "Acme Corp")))))

(deftest derive-initials-honorific-test
  (testing "case-preserving + honorific stripping"
    (is (= "DK" (icon/derive-initials "Dr. David Kowalski")))
    (is (= "Sm" (icon/derive-initials "Mrs. Smith"))))  ; single word post-strip

  (testing "non-honorific titles unchanged (case preserved from source)"
    (is (= "DK" (icon/derive-initials "David Kowalski")))
    (is (= "TB" (icon/derive-initials "The Beatles")))))

(deftest derive-abbreviated-honorific-test
  (testing "honorific stripping flows through to abbreviated derivation"
    ;; "Dr. Math 203" → strip → "Math 203" → keeps as-is (< 8 chars)
    (is (= "Math 203" (icon/derive-abbreviated "Dr. Math 203")))))
