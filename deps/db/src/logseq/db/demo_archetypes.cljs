(ns logseq.db.demo-archetypes
  "Archetype definitions for AI-generated demo graphs.
   Each archetype defines a tag taxonomy, property schemas, cast spec,
   timeline spec, and journal pattern weights. Used by both CLI scripts
   (Phase 1) and the browser app (Phase 2) for graph generation.")

;; =============================================================================
;; Operator/PM Archetype
;; =============================================================================
;; A product manager / operator who uses Logseq for daily work:
;; meeting notes, project tracking, reading lists, decision logs, OKRs.
;; Closest to a real power-user graph with rich cross-references.

(def operator-properties
  "Properties for the Operator/PM archetype.
   Note: Built-in :logseq.property/status, :logseq.property/priority,
   :logseq.property/deadline are NOT redefined — they're used via
   :logseq.class/Task for TODO items in journals."
  {:role          {:logseq.property/type :default}
   :email         {:logseq.property/type :default}
   :company       {:logseq.property/type :node
                   :build/property-classes [:Company]}
   :url           {:logseq.property/type :url}
   :attendees     {:logseq.property/type :node
                   :db/cardinality :many
                   :build/property-classes [:Person]}
   :agenda        {:logseq.property/type :default}
   :notes         {:logseq.property/type :default}
   :project-status {:logseq.property/type :default
                    :build/closed-values
                    [{:value "Backlog"  :icon {:id "circle-dotted" :type :tabler-icon}}
                     {:value "Active"   :icon {:id "circle-half-2" :type :tabler-icon}}
                     {:value "Paused"   :icon {:id "player-pause"  :type :tabler-icon}}
                     {:value "Done"     :icon {:id "circle-check"  :type :tabler-icon}}]}
   :team          {:logseq.property/type :node
                   :db/cardinality :many
                   :build/property-classes [:Person]}
   :project       {:logseq.property/type :node
                   :build/property-classes [:Project]}
   :author        {:logseq.property/type :node
                   :db/cardinality :many
                   :build/property-classes [:Author]}
   :reading-status {:logseq.property/type :default
                    :build/closed-values
                    [{:value "Want to Read" :icon {:id "eye"          :type :tabler-icon}}
                     {:value "Reading"      :icon {:id "book"         :type :tabler-icon}}
                     {:value "Completed"    :icon {:id "circle-check" :type :tabler-icon}}
                     {:value "Abandoned"    :icon {:id "circle-x"     :type :tabler-icon}}]}
   :genre         {:logseq.property/type :default}
   :source        {:logseq.property/type :url}
   :price         {:logseq.property/type :default}
   :frequency     {:logseq.property/type :default}
   :category      {:logseq.property/type :default}
   :quarter       {:logseq.property/type :default}
   :okr-status    {:logseq.property/type :default
                   :build/closed-values
                   [{:value "On Track"  :icon {:id "circle-check"    :type :tabler-icon}}
                    {:value "At Risk"   :icon {:id "alert-triangle"  :type :tabler-icon}}
                    {:value "Off Track" :icon {:id "circle-x"        :type :tabler-icon}}]}
   :decision-status {:logseq.property/type :default
                     :build/closed-values
                     [{:value "Proposed"  :icon {:id "message-circle" :type :tabler-icon}}
                      {:value "Accepted"  :icon {:id "circle-check"  :type :tabler-icon}}
                      {:value "Revisited" :icon {:id "refresh"       :type :tabler-icon}}]}
   :stakeholders  {:logseq.property/type :node
                   :db/cardinality :many
                   :build/property-classes [:Person]}})

(def operator-classes
  "Classes (tags) for the Operator/PM archetype.
   Note: We do NOT create a custom Task class — built-in :logseq.class/Task
   is used for TODO items in journals with built-in status/priority/deadline.

   Inheritance:
   - #Author extends #Person → Author tag page shows genre + role, email, company
   - #Book extends #Read → Book tag page shows author, genre + reading-status"
  {:Person       {:build/class-properties [:role :email :company]
                  :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "user"}}}
   :Author       {:build/class-extends [:Person]
                  :build/class-properties [:genre]
                  :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "feather"}}}
   :Company      {:build/class-properties [:url]
                  :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "building"}}}
   :Meeting      {:build/class-properties [:attendees :agenda :notes]
                  :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "calendar-event"}}}
   :Project      {:build/class-properties [:project-status :team]
                  :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "briefcase"}}}
   :Read         {:build/class-properties [:reading-status]
                  :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "book-2"}}}
   :Book         {:build/class-extends [:Read]
                  :build/class-properties [:author :genre]
                  :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "book"}}}
   :Idea         {:build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "bulb"}}}
   :Reflection   {:build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "pencil"}}}
   :Tool         {:build/class-properties [:url :category]
                  :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "tool"}}}
   :Subscription {:build/class-properties [:source :price :frequency]
                  :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "credit-card"}}}
   :OKR          {:build/class-properties [:quarter :okr-status]
                  :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "target"}}}
   :Decision     {:build/class-properties [:decision-status :stakeholders]
                  :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "scale"}}}})

(def operator-cast-spec
  "How many entities of each type to generate for the Operator/PM archetype."
  {:people        {:count 25
                   :mix {:coworker 10 :report 4 :executive 3
                         :friend 4 :family 2 :acquaintance 2}}
   :authors       {:count 12}
   :companies     {:count 4
                   :mix {:employer 1 :client 2 :partner 1}}
   :projects      {:count 7
                   :mix {:product-feature 3 :internal-tool 2 :migration 1 :process 1}}
   :books         {:count 14
                   :mix {:business 4 :design 3 :fiction 3 :self-help 2 :technical 2}}
   :tools         {:count 6}
   :subscriptions {:count 4}
   :ideas         {:count 10}})

(def operator-timeline-spec
  "Timeline configuration for journal generation."
  {:duration-months 6
   :start-date      20250801  ;; Aug 1, 2025
   :end-date        20260131  ;; Jan 31, 2026
   :phases
   [{:months [20250801 20250901] :label "Onboarding & Q3 kickoff" :activity :high}
    {:months [20251001 20251101] :label "Deep execution phase"    :activity :medium}
    {:months [20251201 20260101] :label "Q4 wrap-up & holidays"   :activity :low}]})

(def operator-journal-patterns
  "Weighted patterns for journal day content.
   Weights should sum to ~100. Empty days are explicit."
  {:empty-day          20  ;; No content at all
   :minimal-day        15  ;; 1-2 quick notes or links
   :meeting-heavy-day  15  ;; 2-3 meetings with structured notes
   :task-focused-day   15  ;; Several TODOs, progress updates
   :reflection-day      8  ;; Longer freeform writing, ideas
   :reading-day         7  ;; Book notes, article links
   :mixed-day          20  ;; Combination of the above
   })

(def operator-archetype
  "Complete Operator/PM archetype definition."
  {:name        "Operator/PM"
   :description "A product manager or operator who uses Logseq for daily work:
                 meeting notes, project tracking, reading lists, decision logs, and OKRs."
   :properties  operator-properties
   :classes     operator-classes
   :cast-spec   operator-cast-spec
   :timeline    operator-timeline-spec
   :patterns    operator-journal-patterns})

;; =============================================================================
;; Archetype Registry
;; =============================================================================

(def archetypes
  "All available archetype definitions, keyed by identifier."
  {:operator operator-archetype})
