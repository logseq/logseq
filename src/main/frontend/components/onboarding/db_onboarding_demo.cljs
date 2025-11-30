(ns frontend.components.onboarding.db-onboarding-demo
  "Demo visual components for DB onboarding flows"
  (:require [rum.core :as rum]))

;; ============================================================================
;; Shared Subcomponents (Private Helpers)
;; ============================================================================

(defn- mini-tag
  "Renders a miniature tag chip with optional fields display"
  [{:keys [name fields show-fields?]}]
  [:div.mini-tag.inline-flex.items-center.gap-0.5.px-1
   [:a.hash-symbol.text-xs "#"]
   [:span.text-xs name]
   (when (and show-fields? fields)
     [:span.text-xs.opacity-50 (str "(" (count fields) ")")])])

(defn- mini-bullet
  "Renders a 6x6px property bullet (filled or bordered)"
  [{:keys [type]}]
  [:div.inline-flex.items-center.justify-center.w-4.h-4
   [:div {:class (if (= type :filled)
                   "property-bullet-filled-square"
                   "property-bullet-bordered-square")}]])

(defn- mini-property-row
  "Renders a property key-value pair with bullets"
  [{:keys [property-name value empty? icon]}]
  [:div.mini-property-row.flex.items-center.gap-2.text-xs.ml-6
   {:style {:min-height "28px"}}
   (when icon
     [:span.text-xs icon])
   [:span.opacity-70 (str property-name)]
   (when-not empty?
     [:span value])])

(defn- mini-block
  "Renders a miniature block with bullet and content"
  [{:keys [content tag properties]}]
  [:div.mini-block.flex.gap-2.items-start
   [:div.mini-block-bullet]
   [:div.mini-block-content.flex-1
    [:div.flex.items-center.gap-1.flex-wrap
     [:span.text-sm content]
     (when tag
       (mini-tag tag))]
    (when properties
      [:div.mini-properties.mt-1.space-y-1
       (for [prop properties]
         ^{:key (:property-name prop)}
         (mini-property-row prop))])]])

(defn- mini-collection-table
  "Renders a simplified collection table"
  [{:keys [headers rows]}]
  [:div.mini-collection-table
   [:table.w-full
    [:thead
     [:tr
      (for [header headers]
        ^{:key header}
        [:th header])]]
    [:tbody
     (for [[idx row] (map-indexed vector rows)]
       ^{:key idx}
       [:tr
        (for [[cell-idx cell] (map-indexed vector row)]
          ^{:key cell-idx}
          [:td cell])])]]])

;; ============================================================================
;; Main Visual Components
;; ============================================================================

(rum/defc md-update-visual
  "Visual for MD update popup - split card with benefits and example"
  []
  [:div.md-update-visual.flex.rounded-lg.overflow-hidden.cp__onboarding-demo
   {:style {:width "100%"
            :height "200px"
            :background "linear-gradient(135deg, var(--lx-gray-02, var(--rx-gray-02)) 0%, var(--lx-gray-03, var(--rx-gray-03)) 100%)"}}

   ;; Left side: Benefits list (60%)
   [:div.benefits-side.p-4.flex.flex-col.justify-center
    {:style {:flex "0.6"}}
    [:div.space-y-2
     [:div.benefit-item.flex.items-start.gap-2
      [:div.check-icon.text-xs "✓"]
      [:span.text-xs "Tags become templates"]]
     [:div.benefit-item.flex.items-start.gap-2
      [:div.check-icon.text-xs "✓"]
      [:span.text-xs "Add fields inline"]]
     [:div.benefit-item.flex.items-start.gap-2
      [:div.check-icon.text-xs "✓"]
      [:span.text-xs "Auto collections"]]]]

   ;; Right side: Mini page preview (40%)
   [:div.preview-side.p-3.flex.items-center.justify-center
    {:style {:flex "0.4"
             :background-color "var(--lx-gray-01, var(--rx-gray-01))"}}
    [:div.mini-page-preview.w-full
     (mini-block
      {:content "The Name of the Wind"
       :tag {:name "Book"}
       :properties [{:property-name "Author" :value "Patrick Rothfuss" :empty? false :icon "📚"}
                    {:property-name "Status" :value "Reading" :empty? false}
                    {:property-name "Rating" :value "★★★★★" :empty? false}]})]]])

(rum/defc welcome-visual
  "Visual for welcome screen - central page with orbiting chips"
  []
  [:div.welcome-visual.relative.flex.items-center.justify-center.cp__onboarding-demo
   {:style {:width "100%"
            :height "300px"
            :background "radial-gradient(circle at center, var(--lx-gray-02, var(--rx-gray-02)) 0%, var(--lx-gray-01, var(--rx-gray-01)) 100%)"}}

   ;; Central mini page
   [:div.central-page.rounded-lg.p-4.relative.z-10
    {:style {:width "180px"
             :background-color "var(--lx-gray-01, var(--rx-gray-01))"}}
    [:div.space-y-2
     (mini-block {:content "My Reading List"})
     (mini-block {:content "Currently reading The Name of the Wind"
                  :tag {:name "Book"}})
     (mini-block {:content "Need to follow up with the author"})]]

   ;; Orbiting chips (positioned absolutely)
   [:div.orbiting-chip.absolute.animate-float
    {:style {:top "20%" :left "10%"}}
    (mini-tag {:name "Book" :fields ["Author" "Title" "Status" "Rating"] :show-fields? true})]

   [:div.orbiting-chip.absolute.animate-float-delayed
    {:style {:top "15%" :right "15%"}}
    (mini-tag {:name "Person" :fields ["Name" "Role" "Email"] :show-fields? true})]

   [:div.orbiting-chip.absolute.animate-float-delayed-2
    {:style {:bottom "25%" :left "15%"}}
    [:div.collection-chip.px-2.py-1.rounded.text-xs.opacity-70
     {:style {:background-color "var(--lx-gray-03, var(--rx-gray-03))"}}
     [:div.flex.items-center.gap-1
      [:span "📊"]
      [:span "Collections"]]]]])

;; Carousel slide content helpers
(defn- slide-1-content
  "Slide 1: Block with empty properties"
  []
  [:div.space-y-2.p-4
   (mini-block
    {:content "The Name of the Wind"
     :tag {:name "Book"}
     :properties [{:property-name "Author" :empty? true}
                  {:property-name "Status" :empty? true}
                  {:property-name "Rating" :empty? true}]})])

(defn- slide-2-content
  "Slide 2: Block with filled properties"
  []
  [:div.space-y-2.p-4
   (mini-block
    {:content "The Name of the Wind"
     :tag {:name "Book"}
     :properties [{:property-name "Author" :value "Patrick Rothfuss" :empty? false :icon "📚"}
                  {:property-name "Status" :value "Reading" :empty? false}
                  {:property-name "Rating" :value "★★★★★" :empty? false}]})])

(defn- slide-3-content
  "Slide 3: Tag page with collection table"
  []
  [:div.p-4
   ;; Tag page header
   [:div.flex.items-center.gap-1.mb-3
    [:span.text-xl "#"]
    [:span.text-xl {:style {:color "var(--lx-accent-09, var(--rx-accent-09))"}} "Book"]]
   ;; Collection table
   (mini-collection-table
    {:headers ["Title" "Author" "Status"]
     :rows [["The Name of the Wind" "P. Rothfuss" "Reading"]
            ["1984" "G. Orwell" "Done"]
            ["Dune" "F. Herbert" "Queue"]]})])

(defn- slide-4-content
  "Slide 4: Sync across devices with collaboration"
  []
  [:div.relative.h-full.p-4.flex.items-center.justify-center
   {:style {:background-color "var(--lx-gray-01, var(--rx-gray-01))"}}
   
   ;; Left device (desktop)
   [:div.flex-1.flex.flex-col.items-center
    {:style {:max-width "45%"}}
    [:div.rounded-lg.p-3
     {:style {:width "100%"
              :background-color "var(--lx-gray-01, var(--rx-gray-01))"
              :border "1px solid var(--lx-gray-04, var(--rx-gray-04))"}}
     (mini-block
      {:content "Team meeting notes"
       :tag {:name "Meeting"}
       :properties [{:property-name "Date" :value "Today" :empty? false}
                    {:property-name "Participants" :value "3" :empty? false}]})]]
   
   ;; Sync indicator in the middle
   [:div.flex.flex-col.items-center.justify-center
    {:style {:width "10%"
             :position "relative"}}
    [:div.rounded-full.p-2
     {:style {:background-color "var(--lx-gray-03, var(--rx-gray-03))"
              :width "32px"
              :height "32px"
              :display "flex"
              :align-items "center"
              :justify-content "center"}}
     [:span.text-xs "↻"]]
    [:div.text-xs.opacity-50.mt-1 "Synced"]]
   
   ;; Right device (mobile, smaller/offset)
   [:div.flex-1.flex.flex-col.items-center
    {:style {:max-width "45%"
             :transform "translateY(8px)"
             :opacity "0.95"}}
    [:div.rounded-lg.p-2
     {:style {:width "80%"
              :background-color "var(--lx-gray-01, var(--rx-gray-01))"
              :border "1px solid var(--lx-gray-04, var(--rx-gray-04))"}}
     (mini-block
      {:content "Team meeting notes"
       :tag {:name "Meeting"}
       :properties [{:property-name "Date" :value "Today" :empty? false}
                    {:property-name "Participants" :value "3" :empty? false}]})]]
   
   ;; Collaboration avatars in corner
   [:div.absolute
    {:style {:top "8px"
             :right "8px"
             :display "flex"
             :gap "-4px"}}
    (for [i (range 3)]
      ^{:key i}
      [:div.rounded-full
       {:style {:width "20px"
                :height "20px"
                :border "2px solid var(--lx-gray-01, var(--rx-gray-01))"
                :background-color (nth ["var(--lx-blue-09, var(--rx-blue-09))"
                                        "var(--lx-green-09, var(--rx-green-09))"
                                        "var(--lx-purple-09, var(--rx-purple-09))"] i)
                :margin-left (if (zero? i) "0" "-8px")}}])]])

(defn- slide-5-content
  "Slide 5: Options overlay"
  []
  [:div.relative.h-full.p-4
   ;; Dimmed tag page in background
   [:div.flex-1.opacity-30
    [:div.text-xs.mb-2 "#Book"]
    [:div.rounded.p-2.space-y-1
     {:style {:background-color "var(--lx-gray-02, var(--rx-gray-02))"}}
     (for [i (range 3)]
       ^{:key i}
       [:div.h-4.rounded
        {:style {:background-color "var(--lx-gray-03, var(--rx-gray-03))"}}])]]

   ;; Two option cards overlaid
   [:div.flex.flex-col.gap-2.absolute.inset-x-4
    {:style {:top "50%" :transform "translateY(-50%)"}}
    [:div.option-card.rounded-lg.p-3.text-center
     {:style {:background-color "var(--lx-gray-01, var(--rx-gray-01))"
              :border "2px solid var(--lx-accent-09, var(--rx-accent-09))"}}
     [:div.text-xs.font-medium "Import existing graph"]
     [:div.text-xs.opacity-50.mt-1 "Keep your notes"]]

    [:div.option-card.rounded-lg.p-3.text-center
     {:style {:background-color "var(--lx-gray-01, var(--rx-gray-01))"
              :border "1px solid var(--lx-gray-04, var(--rx-gray-04))"}}
     [:div.text-xs.font-medium "Start fresh"]
     [:div.text-xs.opacity-50.mt-1 "New DB graph"]]]])

(rum/defc carousel-demo-window
  "Reusable mini Logseq window for carousel slides"
  [{:keys [slide]}]
  [:div.carousel-demo-window.rounded-lg.overflow-hidden.cp__onboarding-demo
   {:style {:width "100%"
            :height "250px"}}

   ;; Mini window header
   [:div.window-header.px-3.py-2
    [:div.flex.items-center.gap-2
     [:div.window-dots.flex.gap-1
      [:div.w-2.h-2.rounded-full {:style {:background-color "var(--lx-gray-05, var(--rx-gray-05))"}}]
      [:div.w-2.h-2.rounded-full {:style {:background-color "var(--lx-gray-05, var(--rx-gray-05))"}}]
      [:div.w-2.h-2.rounded-full {:style {:background-color "var(--lx-gray-05, var(--rx-gray-05))"}}]]
     [:span.text-xs.opacity-50 "demo.logseq"]]]

   ;; Content area (varies by slide)
   [:div.window-content
    (case slide
      1 (slide-1-content)
      2 (slide-2-content)
      3 (slide-3-content)
      4 (slide-4-content)
      5 (slide-5-content)
      (slide-1-content))]])
