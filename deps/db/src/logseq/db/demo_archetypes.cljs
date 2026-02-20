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
  {:role            {:block/title "Role"
                     :logseq.property/type :default}
   :email           {:block/title "Email"
                     :logseq.property/type :default}
   :company         {:block/title "Company"
                     :logseq.property/type :node
                     :build/property-classes [:Company]}
   :url             {:block/title "URL"
                     :logseq.property/type :url}
   :attendees       {:block/title "Attendees"
                     :logseq.property/type :node
                     :db/cardinality :many
                     :build/property-classes [:Person]}
   :agenda          {:block/title "Agenda"
                     :logseq.property/type :default}
   :notes           {:block/title "Notes"
                     :logseq.property/type :default}
   :project-status  {:block/title "Project Status"
                     :logseq.property/type :default
                     :build/closed-values
                     [{:value "Backlog"  :icon {:id "circle-dotted" :type :tabler-icon}}
                      {:value "Active"   :icon {:id "circle-half-2" :type :tabler-icon}}
                      {:value "Paused"   :icon {:id "player-pause"  :type :tabler-icon}}
                      {:value "Done"     :icon {:id "circle-check"  :type :tabler-icon}}]}
   :team            {:block/title "Team"
                     :logseq.property/type :node
                     :db/cardinality :many
                     :build/property-classes [:Person]}
   :project         {:block/title "Project"
                     :logseq.property/type :node
                     :build/property-classes [:Project]}
   :author          {:block/title "Author"
                     :logseq.property/type :node
                     :db/cardinality :many
                     :build/property-classes [:Author]}
   :reading-status  {:block/title "Reading Status"
                     :logseq.property/type :default
                     :build/closed-values
                     [{:value "Want to Read" :icon {:id "eye"          :type :tabler-icon}}
                      {:value "Reading"      :icon {:id "book"         :type :tabler-icon}}
                      {:value "Completed"    :icon {:id "circle-check" :type :tabler-icon}}
                      {:value "Abandoned"    :icon {:id "circle-x"     :type :tabler-icon}}]}
   :genre           {:block/title "Genre"
                     :logseq.property/type :default}
   :source          {:block/title "Source"
                     :logseq.property/type :url}
   :price           {:block/title "Price"
                     :logseq.property/type :default}
   :frequency       {:block/title "Frequency"
                     :logseq.property/type :default}
   :category        {:block/title "Category"
                     :logseq.property/type :default}
   :quarter         {:block/title "Quarter"
                     :logseq.property/type :default}
   :okr-status      {:block/title "OKR Status"
                     :logseq.property/type :default
                     :build/closed-values
                     [{:value "On Track"  :icon {:id "circle-check"    :type :tabler-icon}}
                      {:value "At Risk"   :icon {:id "alert-triangle"  :type :tabler-icon}}
                      {:value "Off Track" :icon {:id "circle-x"        :type :tabler-icon}}]}
   :decision-status {:block/title "Decision status"  ;; Sentence case
                     :logseq.property/type :default
                     :build/closed-values
                     [{:value "Proposed"  :icon {:id "message-circle" :type :tabler-icon}}
                      {:value "Accepted"  :icon {:id "circle-check"  :type :tabler-icon}}
                      {:value "Revisited" :icon {:id "refresh"       :type :tabler-icon}}]}
   :stakeholders    {:block/title "Stakeholders"
                     :logseq.property/type :node
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

(def operator-class-placement
  "Declares how each class should be instantiated in the demo graph.
   - :page-only — entities exist as pages in the cast. Journal blocks reference
     them via [[wiki links]] but NEVER tag themselves with these classes.
   - :block-only — never in the cast. Born as tagged blocks inside journal entries.
     The block IS the object (e.g., a meeting note, a reflection).
   - :mixed — substantial instances are pages in the cast; lightweight instances
     are born as tagged block objects in journals using the parent/child pattern."
  {:page-only  #{:Person :Author :Company :Project :Tool :Subscription}
   :block-only #{:Meeting :Decision :Reflection}
   :mixed      #{:Book :Read :Idea :OKR}})

(def operator-archetype
  "Complete Operator/PM archetype definition."
  {:name            "Operator/PM"
   :description     "A product manager or operator who uses Logseq for daily work:
                     meeting notes, project tracking, reading lists, decision logs, and OKRs."
   :properties      operator-properties
   :classes         operator-classes
   :cast-spec       operator-cast-spec
   :timeline        operator-timeline-spec
   :patterns        operator-journal-patterns
   :class-placement operator-class-placement})

;; =============================================================================
;; Student Archetype
;; =============================================================================
;; A university student who uses Logseq for coursework, study sessions,
;; campus life, and internship tracking. Heavy note-taking during lectures,
;; assignment management, reading lists, and study group coordination.

(def student-properties
  "Properties for the Student archetype.
   Note: Built-in :logseq.property/status, :logseq.property/priority,
   :logseq.property/deadline are NOT redefined -- they're used via
   :logseq.class/Task for TODO items in journals."
  {:role            {:block/title "Role"
                     :logseq.property/type :default}
   :email           {:block/title "Email"
                     :logseq.property/type :default}
   :department      {:block/title "Department"
                     :logseq.property/type :default}
   :office-hours    {:block/title "Office hours"  ;; Sentence case
                     :logseq.property/type :default}
   :course-code     {:block/title "Course Code"
                     :logseq.property/type :default}
   :semester        {:block/title "Semester"
                     :logseq.property/type :default}
   :instructor      {:block/title "Instructor"
                     :logseq.property/type :node
                     :build/property-classes [:Professor]}
   :credits         {:block/title "Credits"
                     :logseq.property/type :default}
   :due-date        {:block/title "Due date"  ;; Sentence case
                     :logseq.property/type :default}
   :subject         {:block/title "Subject"
                     :logseq.property/type :node
                     :build/property-classes [:Course]}
   :study-method    {:block/title "Study Method"
                     :logseq.property/type :default
                     :build/closed-values
                     [{:value "Flashcards"        :icon {:id "cards"       :type :tabler-icon}}
                      {:value "Practice Problems"  :icon {:id "pencil"     :type :tabler-icon}}
                      {:value "Group Review"       :icon {:id "users"      :type :tabler-icon}}
                      {:value "Summary Notes"      :icon {:id "notes"      :type :tabler-icon}}
                      {:value "Past Exams"         :icon {:id "file-check" :type :tabler-icon}}]}
   :location        {:block/title "Location"
                     :logseq.property/type :default}
   :event-date      {:block/title "Event Date"
                     :logseq.property/type :default}
   :company         {:block/title "Company"
                     :logseq.property/type :node
                     :build/property-classes [:Company]}
   :position        {:block/title "Position"
                     :logseq.property/type :default}
   :reading-status  {:block/title "Reading Status"
                     :logseq.property/type :default
                     :build/closed-values
                     [{:value "Want to Read" :icon {:id "eye"          :type :tabler-icon}}
                      {:value "Reading"      :icon {:id "book"         :type :tabler-icon}}
                      {:value "Completed"    :icon {:id "circle-check" :type :tabler-icon}}
                      {:value "Abandoned"    :icon {:id "circle-x"     :type :tabler-icon}}]}
   :author          {:block/title "Author"
                     :logseq.property/type :node
                     :db/cardinality :many
                     :build/property-classes [:Author]}
   :genre           {:block/title "Genre"
                     :logseq.property/type :default}
   :goal-status     {:block/title "Goal Status"
                     :logseq.property/type :default
                     :build/closed-values
                     [{:value "Not Started" :icon {:id "circle-dotted" :type :tabler-icon}}
                      {:value "In Progress" :icon {:id "circle-half-2" :type :tabler-icon}}
                      {:value "Achieved"    :icon {:id "circle-check"  :type :tabler-icon}}
                      {:value "Dropped"     :icon {:id "circle-x"      :type :tabler-icon}}]}
   :priority-level  {:block/title "Priority level"  ;; Sentence case
                     :logseq.property/type :default
                     :build/closed-values
                     [{:value "High"   :icon {:id "urgent"     :type :tabler-icon}}
                      {:value "Medium" :icon {:id "minus"      :type :tabler-icon}}
                      {:value "Low"    :icon {:id "arrow-down" :type :tabler-icon}}]}
   :members         {:block/title "Members"
                     :logseq.property/type :node
                     :db/cardinality :many
                     :build/property-classes [:Person]}})

(def student-classes
  "Classes (tags) for the Student archetype.

   Inheritance:
   - #Professor extends #Person
   - #Author extends #Person
   - #Book extends #Read"
  {:Person         {:build/class-properties [:role :email]
                    :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "user"}}}
   :Professor      {:build/class-extends [:Person]
                    :build/class-properties [:department :office-hours]
                    :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "school"}}}
   :Author         {:build/class-extends [:Person]
                    :build/class-properties [:genre]
                    :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "feather"}}}
   :Company        {:build/class-properties [:location]
                    :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "building"}}}
   :Course         {:build/class-properties [:course-code :semester :instructor :credits]
                    :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "notebook"}}}
   :Assignment     {:build/class-properties [:due-date :subject]
                    :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "clipboard-text"}}}
   :Study-Group    {:block/title "Study Group"
                    :build/class-properties [:subject :members :study-method]
                    :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "users-group"}}}
   :Lecture        {:build/class-properties [:subject :location]
                    :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "presentation"}}}
   :Campus-Event   {:block/title "Campus Event"
                    :build/class-properties [:event-date :location]
                    :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "confetti"}}}
   :Internship     {:build/class-properties [:company :position]
                    :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "briefcase"}}}
   :Read           {:build/class-properties [:reading-status]
                    :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "book-2"}}}
   :Book           {:build/class-extends [:Read]
                    :build/class-properties [:author :genre]
                    :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "book"}}}
   :Idea           {:build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "bulb"}}}
   :Reflection     {:build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "pencil"}}}
   :Semester-Goal  {:block/title "Semester Goal"
                    :build/class-properties [:goal-status :priority-level]
                    :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "target"}}}})

(def student-cast-spec
  "How many entities of each type to generate for the Student archetype."
  {:people          {:count 18
                     :mix {:classmate 6 :professor 4 :ta 2
                           :friend 3 :study-buddy 2 :roommate 1}}
   :authors         {:count 8}
   :companies       {:count 3
                     :mix {:tech-company 1 :startup 1 :nonprofit 1}}
   :courses         {:count 7
                     :mix {:core 3 :elective 2 :lab 1 :seminar 1}}
   :books           {:count 10
                     :mix {:textbook 4 :fiction 2 :self-help 2 :technical 2}}
   :study-groups    {:count 5}
   :campus-events   {:count 4
                     :mix {:workshop 1 :hackathon 1 :career-fair 1 :social 1}}
   :internships     {:count 3
                     :mix {:summer 1 :part-time 1 :upcoming 1}}
   :semester-goals  {:count 6}
   :ideas           {:count 8}})

(def student-timeline-spec
  "Timeline configuration for journal generation."
  {:duration-months 6
   :start-date      20250901  ;; Sep 1, 2025
   :end-date        20260228  ;; Feb 28, 2026
   :phases
   [{:months [20250901 20251001] :label "Fall semester start & orientation" :activity :high}
    {:months [20251101 20251201] :label "Midterms & deep study"             :activity :medium}
    {:months [20260101 20260201] :label "Finals, break & spring kickoff"    :activity :low}]})

(def student-journal-patterns
  "Weighted patterns for journal day content.
   Weights should sum to ~100. Empty days are explicit."
  {:empty-day          15  ;; No content at all
   :minimal-day        12  ;; 1-2 quick notes or links
   :study-day          20  ;; Lecture notes, flashcards, problem sets
   :task-focused-day   15  ;; Assignment deadlines, TODOs
   :reflection-day     10  ;; Longer freeform writing, ideas
   :reading-day         8  ;; Book notes, article links
   :mixed-day          20  ;; Combination of the above
   })

(def student-class-placement
  "Declares how each class should be instantiated in the demo graph.
   See operator-class-placement for full documentation."
  {:page-only  #{:Person :Professor :Author :Company :Course
                 :Internship :Semester-Goal}
   :block-only #{:Lecture :Assignment :Reflection}
   :mixed      #{:Book :Read :Idea :Study-Group :Campus-Event}})

(def student-archetype
  "Complete Student archetype definition."
  {:name            "Student"
   :description     "A university student who uses Logseq for coursework, study sessions,
                     campus life, and internship tracking. Lecture notes, assignments,
                     reading lists, study groups, and semester goals."
   :properties      student-properties
   :classes         student-classes
   :cast-spec       student-cast-spec
   :timeline        student-timeline-spec
   :patterns        student-journal-patterns
   :class-placement student-class-placement})

;; =============================================================================
;; Researcher/Academic Archetype
;; =============================================================================
;; A PhD researcher or academic who uses Logseq for literature reviews,
;; experiment tracking, grant writing, and conference preparation.
;; Heavy emphasis on reading, cross-referencing papers, and structured notes.

(def researcher-properties
  "Properties for the Researcher/Academic archetype.
   Note: Built-in :logseq.property/status, :logseq.property/priority,
   :logseq.property/deadline are NOT redefined -- they're used via
   :logseq.class/Task for TODO items in journals."
  {:role              {:block/title "Role"
                       :logseq.property/type :default}
   :email             {:block/title "Email"
                       :logseq.property/type :default}
   :institution       {:block/title "Institution"
                       :logseq.property/type :node
                       :build/property-classes [:Institution]}
   :department        {:block/title "Department"
                       :logseq.property/type :default}
   :affiliation       {:block/title "Affiliation"
                       :logseq.property/type :node
                       :db/cardinality :many
                       :build/property-classes [:Institution]}
   :research-area     {:block/title "Research area"  ;; Sentence case
                       :logseq.property/type :default}
   :project-status    {:block/title "Project Status"
                       :logseq.property/type :default
                       :build/closed-values
                       [{:value "Proposed"    :icon {:id "circle-dotted" :type :tabler-icon}}
                        {:value "Active"      :icon {:id "circle-half-2" :type :tabler-icon}}
                        {:value "On Hold"     :icon {:id "player-pause"  :type :tabler-icon}}
                        {:value "Completed"   :icon {:id "circle-check"  :type :tabler-icon}}]}
   :funding-source    {:block/title "Funding Source"
                       :logseq.property/type :default}
   :pi                {:block/title "PI"
                       :logseq.property/type :node
                       :build/property-classes [:Person]}
   :collaborators     {:block/title "Collaborators"
                       :logseq.property/type :node
                       :db/cardinality :many
                       :build/property-classes [:Person]}
   :publication-status {:block/title "Publication Status"
                        :logseq.property/type :default
                        :build/closed-values
                        [{:value "Draft"        :icon {:id "pencil"         :type :tabler-icon}}
                         {:value "Submitted"    :icon {:id "send"           :type :tabler-icon}}
                         {:value "In Review"    :icon {:id "eye"            :type :tabler-icon}}
                         {:value "Revision"     :icon {:id "edit"           :type :tabler-icon}}
                         {:value "Accepted"     :icon {:id "circle-check"   :type :tabler-icon}}
                         {:value "Published"    :icon {:id "check"          :type :tabler-icon}}
                         {:value "Rejected"     :icon {:id "circle-x"       :type :tabler-icon}}]}
   :journal-name      {:block/title "Journal"
                       :logseq.property/type :default}
   :doi               {:block/title "DOI"
                       :logseq.property/type :url}
   :hypothesis        {:block/title "Hypothesis"
                       :logseq.property/type :default}
   :methodology       {:block/title "Methodology"
                       :logseq.property/type :default}
   :sample-size       {:block/title "Sample size"  ;; Sentence case
                       :logseq.property/type :default}
   :results-summary   {:block/title "Results summary"  ;; Sentence case
                       :logseq.property/type :default}
   :conference-name   {:block/title "Conference Name"
                       :logseq.property/type :default}
   :deadline          {:block/title "Deadline"
                       :logseq.property/type :default}
   :venue             {:block/title "Venue"
                       :logseq.property/type :default}
   :grant-status      {:block/title "Grant Status"
                       :logseq.property/type :default
                       :build/closed-values
                       [{:value "Planning"     :icon {:id "notes"        :type :tabler-icon}}
                        {:value "Submitted"    :icon {:id "send"         :type :tabler-icon}}
                        {:value "Under Review" :icon {:id "eye"          :type :tabler-icon}}
                        {:value "Funded"       :icon {:id "circle-check" :type :tabler-icon}}
                        {:value "Declined"     :icon {:id "circle-x"     :type :tabler-icon}}]}
   :amount            {:block/title "Amount"
                       :logseq.property/type :default}
   :dataset-name      {:block/title "Dataset Name"
                       :logseq.property/type :default}
   :data-format       {:block/title "Data format"  ;; Sentence case
                       :logseq.property/type :default}
   :reading-status    {:block/title "Reading Status"
                       :logseq.property/type :default
                       :build/closed-values
                       [{:value "Want to Read" :icon {:id "eye"          :type :tabler-icon}}
                        {:value "Reading"      :icon {:id "book"         :type :tabler-icon}}
                        {:value "Completed"    :icon {:id "circle-check" :type :tabler-icon}}
                        {:value "Abandoned"    :icon {:id "circle-x"     :type :tabler-icon}}]}
   :author            {:block/title "Author"
                       :logseq.property/type :node
                       :db/cardinality :many
                       :build/property-classes [:Person]}
   :genre             {:block/title "Genre"
                       :logseq.property/type :default}})

(def researcher-classes
  "Classes (tags) for the Researcher/Academic archetype.

   Inheritance:
   - #Collaborator extends #Person
   - #Book extends #Read"
  {:Person             {:build/class-properties [:role :email :institution :department]
                        :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "user"}}}
   :Collaborator       {:build/class-extends [:Person]
                        :build/class-properties [:affiliation :research-area]
                        :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "users"}}}
   :Institution        {:build/class-properties [:department]
                        :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "building"}}}
   :Research-Project   {:block/title "Research Project"
                        :build/class-properties [:project-status :pi :collaborators :funding-source :research-area]
                        :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "flask"}}}
   :Paper              {:build/class-properties [:author :publication-status :journal-name :doi :research-area]
                        :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "file-text"}}}
   :Experiment         {:build/class-properties [:hypothesis :methodology :sample-size :results-summary]
                        :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "test-pipe"}}}
   :Literature-Note    {:block/title "Literature Note"
                        :build/class-properties [:author :doi]
                        :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "notes"}}}
   :Conference         {:build/class-properties [:conference-name :venue :deadline]
                        :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "microphone"}}}
   :Grant              {:build/class-properties [:grant-status :amount :funding-source :deadline]
                        :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "coin"}}}
   :Dataset            {:build/class-properties [:dataset-name :data-format]
                        :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "database"}}}
   :Lab-Meeting        {:block/title "Lab meeting"  ;; Sentence case
                        :build/class-properties [:collaborators]
                        :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "microscope"}}}
   :Read               {:build/class-properties [:reading-status]
                        :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "book-2"}}}
   :Book               {:build/class-extends [:Read]
                        :build/class-properties [:author :genre]
                        :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "book"}}}
   :Idea               {:build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "bulb"}}}
   :Reflection         {:build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "pencil"}}}
   :Research-Question  {:block/title "Research Question"
                        :build/class-properties [:research-area]
                        :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "help"}}}})

(def researcher-cast-spec
  "How many entities of each type to generate for the Researcher/Academic archetype."
  {:people             {:count 22
                        :mix {:advisor 1 :lab-member 6 :collaborator 5
                              :committee 3 :reviewer 3 :friend 2 :family 2}}
   :authors            {:count 15}
   :institutions       {:count 5
                        :mix {:home 1 :collaborating 3 :conference-host 1}}
   :projects           {:count 7
                        :mix {:dissertation 1 :funded-study 2 :pilot 2
                              :collaboration 1 :side-project 1}}
   :papers             {:count 14
                        :mix {:own-draft 3 :own-published 2 :key-reference 5
                              :to-review 2 :seminal 2}}
   :experiments        {:count 5
                        :mix {:ongoing 2 :completed 2 :pilot 1}}
   :books              {:count 10
                        :mix {:methodology 3 :theory 3 :fiction 2 :popular-science 2}}
   :conferences        {:count 4
                        :mix {:attended 2 :submitted 1 :upcoming 1}}
   :grants             {:count 3
                        :mix {:active 1 :submitted 1 :planning 1}}
   :datasets           {:count 4
                        :mix {:own 2 :public 1 :shared 1}}
   :literature-notes   {:count 8}
   :ideas              {:count 10}
   :research-questions {:count 6}})

(def researcher-timeline-spec
  "Timeline configuration for journal generation."
  {:duration-months 6
   :start-date      20250801  ;; Aug 1, 2025
   :end-date        20260131  ;; Jan 31, 2026
   :phases
   [{:months [20250801 20250901] :label "Fall semester start & lit review"  :activity :high}
    {:months [20251001 20251101] :label "Data collection & conferences"    :activity :high}
    {:months [20251201 20260101] :label "Writing season & grant deadlines" :activity :medium}]})

(def researcher-journal-patterns
  "Weighted patterns for journal day content.
   Weights should sum to ~100. Empty days are explicit."
  {:empty-day          18  ;; No content at all
   :minimal-day        12  ;; 1-2 quick notes or links
   :reading-day        15  ;; Literature review, paper annotations
   :writing-day        12  ;; Drafting papers, grant proposals
   :lab-meeting-day     8  ;; Lab meetings, committee meetings
   :experiment-day     10  ;; Lab work, data collection, analysis
   :task-focused-day   10  ;; Several TODOs, admin tasks, emails
   :reflection-day      7  ;; Research questions, idea development
   :mixed-day           8  ;; Combination of the above
   })

(def researcher-class-placement
  "Declares how each class should be instantiated in the demo graph.
   See operator-class-placement for full documentation."
  {:page-only  #{:Person :Collaborator :Institution :Research-Project
                 :Paper :Conference :Grant :Dataset}
   :block-only #{:Lab-Meeting :Reflection}
   :mixed      #{:Book :Read :Idea :Experiment :Literature-Note
                 :Research-Question}})

(def researcher-archetype
  "Complete Researcher/Academic archetype definition."
  {:name            "Researcher/Academic"
   :description     "A PhD researcher or academic who uses Logseq for literature reviews,
                     experiment tracking, grant writing, and conference preparation."
   :properties      researcher-properties
   :classes         researcher-classes
   :cast-spec       researcher-cast-spec
   :timeline        researcher-timeline-spec
   :patterns        researcher-journal-patterns
   :class-placement researcher-class-placement})

;; =============================================================================
;; Writer Archetype
;; =============================================================================
;; A writer / content creator who uses Logseq for drafts, research, character
;; development, world building, and a publishing pipeline.
;; Rich with narrative planning, reading notes, and submission tracking.

(def writer-properties
  "Properties for the Writer archetype.
   Note: Built-in :logseq.property/status, :logseq.property/priority,
   :logseq.property/deadline are NOT redefined -- they're used via
   :logseq.class/Task for TODO items in journals."
  {:role               {:block/title "Role"
                        :logseq.property/type :default}
   :email              {:block/title "Email"
                        :logseq.property/type :default}
   :publication-name   {:block/title "Publication Name"
                        :logseq.property/type :default}
   :publication-url    {:block/title "Publication URL"
                        :logseq.property/type :url}
   :genre              {:block/title "Genre"
                        :logseq.property/type :default}
   :word-count-target  {:block/title "Word count target"  ;; Sentence case
                        :logseq.property/type :default}
   :current-word-count {:block/title "Current Word Count"
                        :logseq.property/type :default}
   :project-status     {:block/title "Project Status"
                        :logseq.property/type :default
                        :build/closed-values
                        [{:value "Idea"        :icon {:id "bulb"          :type :tabler-icon}}
                         {:value "Outlining"   :icon {:id "list"          :type :tabler-icon}}
                         {:value "Drafting"    :icon {:id "pencil"        :type :tabler-icon}}
                         {:value "Revising"    :icon {:id "arrows-diff"   :type :tabler-icon}}
                         {:value "Querying"    :icon {:id "send"          :type :tabler-icon}}
                         {:value "Published"   :icon {:id "circle-check"  :type :tabler-icon}}
                         {:value "Shelved"     :icon {:id "archive"       :type :tabler-icon}}]}
   :draft-status       {:block/title "Draft Status"
                        :logseq.property/type :default
                        :build/closed-values
                        [{:value "Zero Draft"   :icon {:id "file"          :type :tabler-icon}}
                         {:value "First Draft"  :icon {:id "file-text"     :type :tabler-icon}}
                         {:value "Second Draft" :icon {:id "file-check"    :type :tabler-icon}}
                         {:value "Final Draft"  :icon {:id "circle-check"  :type :tabler-icon}}
                         {:value "Abandoned"    :icon {:id "circle-x"      :type :tabler-icon}}]}
   :deadline           {:block/title "Deadline"
                        :logseq.property/type :default}
   :character-name     {:block/title "Character Name"
                        :logseq.property/type :default}
   :character-role     {:block/title "Character Role"
                        :logseq.property/type :default}
   :setting            {:block/title "Setting"
                        :logseq.property/type :default}
   :reading-status     {:block/title "Reading Status"
                        :logseq.property/type :default
                        :build/closed-values
                        [{:value "Want to Read" :icon {:id "eye"          :type :tabler-icon}}
                         {:value "Reading"      :icon {:id "book"         :type :tabler-icon}}
                         {:value "Completed"    :icon {:id "circle-check" :type :tabler-icon}}
                         {:value "Abandoned"    :icon {:id "circle-x"     :type :tabler-icon}}]}
   :author             {:block/title "Author"
                        :logseq.property/type :node
                        :db/cardinality :many
                        :build/property-classes [:Person]}
   :submission-status  {:block/title "Submission Status"
                        :logseq.property/type :default
                        :build/closed-values
                        [{:value "Preparing"         :icon {:id "file-pencil"   :type :tabler-icon}}
                         {:value "Submitted"         :icon {:id "send"          :type :tabler-icon}}
                         {:value "Under Review"      :icon {:id "clock"         :type :tabler-icon}}
                         {:value "Accepted"          :icon {:id "circle-check"  :type :tabler-icon}}
                         {:value "Rejected"          :icon {:id "circle-x"      :type :tabler-icon}}
                         {:value "Revise & Resubmit" :icon {:id "refresh"       :type :tabler-icon}}]}
   :response-date      {:block/title "Response Date"
                        :logseq.property/type :default}
   :target-audience    {:block/title "Target audience"  ;; Sentence case
                        :logseq.property/type :default}
   :format             {:block/title "Format"
                        :logseq.property/type :default}
   :pitch-status       {:block/title "Pitch Status"
                        :logseq.property/type :default
                        :build/closed-values
                        [{:value "Drafting"     :icon {:id "pencil"       :type :tabler-icon}}
                         {:value "Ready"        :icon {:id "circle-dot"   :type :tabler-icon}}
                         {:value "Sent"         :icon {:id "send"         :type :tabler-icon}}
                         {:value "Interested"   :icon {:id "star"         :type :tabler-icon}}
                         {:value "Passed"       :icon {:id "circle-x"     :type :tabler-icon}}]}
   :writing-project    {:block/title "Writing Project"
                        :logseq.property/type :node
                        :build/property-classes [:Writing-Project]}})

(def writer-classes
  "Classes (tags) for the Writer archetype.

   Inheritance:
   - #Editor extends #Person
   - #Book extends #Read"
  {:Person            {:build/class-properties [:role :email]
                       :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "user"}}}
   :Editor            {:build/class-extends [:Person]
                       :build/class-properties [:publication-name :publication-url]
                       :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "user-edit"}}}
   :Publication       {:build/class-properties [:publication-name :publication-url :genre :format]
                       :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "news"}}}
   :Writing-Project   {:block/title "Writing Project"
                       :build/class-properties [:project-status :genre :word-count-target :current-word-count :deadline :target-audience]
                       :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "notebook"}}}
   :Draft             {:build/class-properties [:draft-status :writing-project]
                       :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "file-text"}}}
   :Character         {:build/class-properties [:character-name :character-role :writing-project]
                       :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "masks-theater"}}}
   :World-Building    {:block/title "World building"  ;; Sentence case
                       :build/class-properties [:setting :writing-project]
                       :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "map"}}}
   :Research-Note     {:block/title "Research Note"
                       :build/class-properties [:writing-project]
                       :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "notes"}}}
   :Read              {:build/class-properties [:reading-status]
                       :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "book-2"}}}
   :Book              {:build/class-extends [:Read]
                       :build/class-properties [:author :genre]
                       :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "book"}}}
   :Idea              {:build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "bulb"}}}
   :Reflection        {:build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "pencil"}}}
   :Submission        {:build/class-properties [:submission-status :writing-project :publication-name :response-date :pitch-status]
                       :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "mailbox"}}}})

(def writer-cast-spec
  "How many entities of each type to generate for the Writer archetype."
  {:people             {:count 16
                        :mix {:editor 3 :beta-reader 3 :writing-group 4
                              :agent 1 :friend 3 :family 2}}
   :writing-projects   {:count 5
                        :mix {:novel 2 :short-story 2 :essay 1}}
   :books              {:count 10
                        :mix {:craft 3 :fiction 4 :nonfiction 2 :poetry 1}}
   :publications       {:count 4
                        :mix {:literary-magazine 2 :online-journal 1 :anthology 1}}
   :characters         {:count 6}
   :world-building     {:count 5}
   :research-notes     {:count 6}
   :drafts             {:count 5}
   :submissions        {:count 4}
   :ideas              {:count 8}
   :reflections        {:count 4}})

(def writer-timeline-spec
  "Timeline configuration for journal generation."
  {:duration-months 6
   :start-date      20250801  ;; Aug 1, 2025
   :end-date        20260131  ;; Jan 31, 2026
   :phases
   [{:months [20250801 20250901] :label "NaNoWriMo prep & world building" :activity :medium}
    {:months [20251001 20251101] :label "NaNoWriMo sprint & drafting"     :activity :high}
    {:months [20251201 20260101] :label "Revision, submissions & rest"    :activity :low}]})

(def writer-journal-patterns
  "Weighted patterns for journal day content.
   Weights should sum to ~100. Empty days are explicit."
  {:empty-day           15  ;; No content at all
   :minimal-day         10  ;; 1-2 quick notes or links
   :writing-day         20  ;; Drafting sessions, word counts, scene notes
   :research-day        10  ;; Research notes, reference gathering
   :reading-day         12  ;; Book notes, craft study, reading log
   :revision-day         8  ;; Editing passes, feedback integration
   :task-focused-day    10  ;; Submission tracking, deadlines, admin
   :reflection-day       5  ;; Journaling about process, breakthroughs
   :mixed-day           10  ;; Combination of the above
   })

(def writer-class-placement
  "Declares how each class should be instantiated in the demo graph.
   See operator-class-placement for full documentation."
  {:page-only  #{:Person :Editor :Publication :Writing-Project
                 :Character :World-Building :Submission}
   :block-only #{:Reflection}
   :mixed      #{:Book :Read :Idea :Draft :Research-Note}})

(def writer-archetype
  "Complete Writer archetype definition."
  {:name            "Writer"
   :description     "A writer or content creator who uses Logseq for drafts, research,
                     character development, world building, and a publishing pipeline."
   :properties      writer-properties
   :classes         writer-classes
   :cast-spec       writer-cast-spec
   :timeline        writer-timeline-spec
   :patterns        writer-journal-patterns
   :class-placement writer-class-placement})

;; =============================================================================
;; Developer Archetype
;; =============================================================================
;; A software developer who uses Logseq for technical notes, architecture
;; decisions, sprint tracking, learning logs, and coding journals.
;; Heavy on code references, ADRs, debugging sessions, and tech reading.

(def developer-properties
  "Properties for the Developer archetype.
   Note: Built-in :logseq.property/status, :logseq.property/priority,
   :logseq.property/deadline are NOT redefined -- they're used via
   :logseq.class/Task for TODO items in journals."
  {:role            {:block/title "Role"
                     :logseq.property/type :default}
   :email           {:block/title "Email"
                     :logseq.property/type :default}
   :company         {:block/title "Company"
                     :logseq.property/type :node
                     :build/property-classes [:Company]}
   :github          {:block/title "GitHub"
                     :logseq.property/type :url}
   :team            {:block/title "Team"
                     :logseq.property/type :node
                     :db/cardinality :many
                     :build/property-classes [:Person]}
   :tech-stack      {:block/title "Tech stack"  ;; Sentence case
                     :logseq.property/type :default}
   :project-status  {:block/title "Project Status"
                     :logseq.property/type :default
                     :build/closed-values
                     [{:value "Backlog"     :icon {:id "circle-dotted" :type :tabler-icon}}
                      {:value "In Progress" :icon {:id "circle-half-2" :type :tabler-icon}}
                      {:value "In Review"   :icon {:id "eye-check"     :type :tabler-icon}}
                      {:value "Shipped"     :icon {:id "circle-check"  :type :tabler-icon}}]}
   :language        {:block/title "Language"
                     :logseq.property/type :default}
   :repo-url        {:block/title "Repo URL"
                     :logseq.property/type :url}
   :decision-status {:block/title "Decision Status"
                     :logseq.property/type :default
                     :build/closed-values
                     [{:value "Proposed"   :icon {:id "message-circle" :type :tabler-icon}}
                      {:value "Accepted"   :icon {:id "circle-check"  :type :tabler-icon}}
                      {:value "Superseded" :icon {:id "replace"        :type :tabler-icon}}
                      {:value "Deprecated" :icon {:id "circle-x"      :type :tabler-icon}}]}
   :stakeholders    {:block/title "Stakeholders"
                     :logseq.property/type :node
                     :db/cardinality :many
                     :build/property-classes [:Person]}
   :severity        {:block/title "Severity"
                     :logseq.property/type :default
                     :build/closed-values
                     [{:value "Critical" :icon {:id "urgent"          :type :tabler-icon}}
                      {:value "Major"    :icon {:id "alert-triangle"  :type :tabler-icon}}
                      {:value "Minor"    :icon {:id "info-circle"     :type :tabler-icon}}
                      {:value "Trivial"  :icon {:id "circle-dot"      :type :tabler-icon}}]}
   :sprint-number   {:block/title "Sprint Number"
                     :logseq.property/type :default}
   :velocity        {:block/title "Velocity"
                     :logseq.property/type :default}
   :sprint-goal     {:block/title "Sprint goal"  ;; Sentence case
                     :logseq.property/type :default}
   :topic           {:block/title "Topic"
                     :logseq.property/type :default}
   :reading-status  {:block/title "Reading Status"
                     :logseq.property/type :default
                     :build/closed-values
                     [{:value "Want to Read" :icon {:id "eye"          :type :tabler-icon}}
                      {:value "Reading"      :icon {:id "book"         :type :tabler-icon}}
                      {:value "Completed"    :icon {:id "circle-check" :type :tabler-icon}}
                      {:value "Abandoned"    :icon {:id "circle-x"     :type :tabler-icon}}]}
   :author          {:block/title "Author"
                     :logseq.property/type :node
                     :db/cardinality :many
                     :build/property-classes [:Person]}
   :genre           {:block/title "Genre"
                     :logseq.property/type :default}
   :category        {:block/title "Category"
                     :logseq.property/type :default}
   :url             {:block/title "URL"
                     :logseq.property/type :url}
   :goal-status     {:block/title "Goal status"  ;; Sentence case
                     :logseq.property/type :default
                     :build/closed-values
                     [{:value "Not Started" :icon {:id "circle-dotted"   :type :tabler-icon}}
                      {:value "In Progress" :icon {:id "circle-half-2"   :type :tabler-icon}}
                      {:value "Achieved"    :icon {:id "circle-check"    :type :tabler-icon}}
                      {:value "Deferred"    :icon {:id "clock-pause"     :type :tabler-icon}}]}})

(def developer-classes
  "Classes (tags) for the Developer archetype.

   Inheritance:
   - #Teammate extends #Person
   - #Book extends #Read"
  {:Person                {:build/class-properties [:role :email :company :github]
                           :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "user"}}}
   :Teammate              {:build/class-extends [:Person]
                           :build/class-properties [:team :tech-stack]
                           :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "users"}}}
   :Company               {:build/class-properties [:url]
                           :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "building"}}}
   :Project               {:build/class-properties [:project-status :team :tech-stack :repo-url]
                           :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "code"}}}
   :Repository            {:build/class-properties [:language :url]
                           :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "git-branch"}}}
   :Architecture-Decision {:block/title "Architecture Decision"
                           :build/class-properties [:decision-status :stakeholders]
                           :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "layout-board"}}}
   :Bug-Report            {:block/title "Bug report"  ;; Sentence case
                           :build/class-properties [:severity :project-status]
                           :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "bug"}}}
   :Sprint                {:build/class-properties [:sprint-number :velocity :sprint-goal]
                           :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "run"}}}
   :Tech-Note             {:block/title "Tech Note"
                           :build/class-properties [:topic :category]
                           :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "file-code"}}}
   :Read                  {:build/class-properties [:reading-status]
                           :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "book-2"}}}
   :Book                  {:build/class-extends [:Read]
                           :build/class-properties [:author :genre]
                           :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "book"}}}
   :Tool                  {:build/class-properties [:url :category]
                           :build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "tool"}}}
   :Idea                  {:build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "bulb"}}}
   :Reflection            {:build/properties {:logseq.property.class/default-icon {:type :tabler-icon :id "pencil"}}}})

(def developer-cast-spec
  "How many entities of each type to generate for the Developer archetype."
  {:people                  {:count 20
                             :mix {:teammate 8 :tech-lead 3 :manager 2
                                   :oss-contributor 3 :mentor 2 :friend 2}}
   :companies               {:count 3
                             :mix {:employer 1 :client 1 :partner 1}}
   :projects                {:count 6
                             :mix {:backend-service 2 :frontend-app 1 :library 1
                                   :infrastructure 1 :migration 1}}
   :repositories            {:count 5}
   :architecture-decisions  {:count 5}
   :bug-reports             {:count 6}
   :sprints                 {:count 4}
   :tech-notes              {:count 8}
   :books                   {:count 10
                             :mix {:technical 4 :cs-theory 2 :fiction 2 :self-help 2}}
   :tools                   {:count 7}
   :ideas                   {:count 8}
   :learning-goals          {:count 4}})

(def developer-timeline-spec
  "Timeline configuration for journal generation."
  {:duration-months 6
   :start-date      20250801  ;; Aug 1, 2025
   :end-date        20260131  ;; Jan 31, 2026
   :phases
   [{:months [20250801 20250901] :label "New project kickoff & architecture" :activity :high}
    {:months [20251001 20251101] :label "Deep implementation & sprint cycles" :activity :high}
    {:months [20251201 20260101] :label "Stabilization & year-end wrap-up"   :activity :medium}]})

(def developer-journal-patterns
  "Weighted patterns for journal day content.
   Weights should sum to ~100. Empty days are explicit."
  {:empty-day          15  ;; No content at all
   :minimal-day        12  ;; Quick standup note or link
   :coding-day         20  ;; Deep work: implementation notes, code snippets, debugging
   :pr-review-day      10  ;; Code reviews, feedback, merge notes
   :debugging-day       8  ;; Bug investigations, stack traces, root cause analysis
   :learning-day        8  ;; Reading docs, tutorials, book notes
   :task-focused-day   10  ;; Sprint tasks, ticket updates, planning
   :reflection-day      5  ;; Retrospectives, career thoughts, ideas
   :mixed-day          12  ;; Combination of the above
   })

(def developer-class-placement
  "Declares how each class should be instantiated in the demo graph.
   See operator-class-placement for full documentation."
  {:page-only  #{:Person :Teammate :Company :Project :Repository
                 :Architecture-Decision :Sprint :Tool}
   :block-only #{:Reflection}
   :mixed      #{:Book :Read :Idea :Bug-Report :Tech-Note}})

(def developer-archetype
  "Complete Developer archetype definition."
  {:name            "Developer"
   :description     "A software developer who uses Logseq for technical notes,
                     architecture decisions, sprint tracking, learning logs, and coding journals."
   :properties      developer-properties
   :classes         developer-classes
   :cast-spec       developer-cast-spec
   :timeline        developer-timeline-spec
   :patterns        developer-journal-patterns
   :class-placement developer-class-placement})

;; =============================================================================
;; Archetype Registry
;; =============================================================================

(def archetypes
  "All available archetype definitions, keyed by identifier."
  {:operator   operator-archetype
   :student    student-archetype
   :researcher researcher-archetype
   :writer     writer-archetype
   :developer  developer-archetype})
