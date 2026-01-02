# Kotlin Multiplatform Migration Feature Plan

## Epic Overview

### User Value
Migrate Logseq from Clojure/ClojureScript to Kotlin Multiplatform to improve developer experience through better IDE tooling, static typing, and enhanced cross-platform code reuse. This addresses developer pain points with dynamic typing, debugging, and separate codebases for web/desktop/mobile platforms while maintaining all existing functionality and privacy-first principles.

### Success Metrics
- 80% reduction in compilation time for incremental builds
- 50% improvement in IDE responsiveness and error detection
- 60% code reuse across platforms (web, desktop, mobile)
- Zero regression in user-facing features
- Successful deployment of first Kotlin-based release within 12 months

### Scope
**Included:**
- Core business logic (data models, graph operations, search, sync)
- Shared UI components and state management
- Database layer (replacing DataScript with SQLDelight or similar)
- Build system migration (from Shadow-CLJS to Kotlin/JS, Gradle)
- Mobile and desktop native implementations
- Plugin API compatibility layer

**Excluded:**
- Legacy Clojure codebase maintenance beyond migration period
- Third-party Clojure libraries without Kotlin equivalents
- Non-core features (plugins, themes) until core migration complete

### Constraints
- Maintain backward compatibility with existing user data formats
- Preserve privacy-first architecture and local-first design
- Gradual migration with parallel Clojure/Kotlin development during transition
- Resource constraints: 2-3 senior developers, 12-month timeline
- Legal/compliance: Open-source license compatibility

## Architecture Decisions

### ADR 001: Adopt Kotlin Multiplatform for Cross-Platform Development
**Context:** Logseq currently maintains separate ClojureScript codebases for web, Electron desktop, and React Native mobile apps, leading to code duplication and inconsistent behavior across platforms.

**Decision:** Migrate to Kotlin Multiplatform with shared business logic, platform-specific UI layers, and unified build system.

**Rationale:** Kotlin Multiplatform provides:
- Static typing with null safety
- Excellent IDE support (IntelliJ IDEA)
- Code sharing across JVM/JS/Native targets
- Mature ecosystem for mobile/desktop/web development
- Better performance than ClojureScript

**Consequences:**
- Steep learning curve for Clojure developers
- Initial productivity dip during transition
- Need to replace Clojure-specific libraries (DataScript → SQLDelight)
- Potential breaking changes in plugin API
- Positive: Long-term maintainability and feature parity across platforms

**Patterns Applied:** Clean Architecture, Hexagonal Architecture, CQRS for data operations

## Story Breakdown

### Story 1: Migrate Core Data Models and Domain Logic [8 weeks]

**User Value:** Establish type-safe, shared data models that work across all platforms while preserving Logseq's graph-based knowledge structure.

**Acceptance Criteria:**
- All core entities (Block, Page, Graph) defined in Kotlin with proper serialization
- Business rules for graph operations implemented and tested
- Data migration path from DataScript format defined
- Type safety prevents common runtime errors

#### Tasks

##### 1.1 Analyze Current DataScript Schema [2h]
**Objective:** Document all entities, relationships, and queries used in current DataScript implementation.

**Context Boundary:**
- Files: src/main/frontend/db.cljs, deps/common/src/logseq/common/schema.cljs (3 max)
- Lines: ~500 lines total
- Concepts: DataScript schema definition, entity relationships

**Prerequisites:**
- Understanding of Datalog query patterns
- Familiarity with current graph data model

**Implementation Approach:**
1. Extract entity definitions from schema
2. Document relationship patterns
3. Identify query patterns for CRUD operations
4. Map to equivalent relational/SQL structures

**Validation Strategy:**
- Unit tests for schema parsing
- Integration tests with sample data
- Documentation completeness check

**Success Criteria:** Complete schema documentation with entity-relationship diagrams

**INVEST Check:**
- Independent: No external dependencies
- Negotiable: Schema analysis approach flexible
- Valuable: Foundation for all subsequent migrations
- Estimable: 2 hours based on codebase familiarity
- Small: Focused schema analysis only
- Testable: Automated verification of documentation accuracy

##### 1.2 Design Kotlin Data Classes [3h]
**Objective:** Create type-safe Kotlin data classes equivalent to current Clojure records.

**Context Boundary:**
- Files: (new) shared/src/commonMain/kotlin/logseq/model/Block.kt, Page.kt, Graph.kt (3 max)
- Lines: ~400 lines total
- Concepts: Kotlin data classes, sealed classes for types

**Prerequisites:**
- Completion of schema analysis (1.1)
- Kotlin Multiplatform project setup

**Implementation Approach:**
1. Define Block data class with all properties
2. Create Page and Graph entities
3. Implement serialization interfaces (kotlinx.serialization)
4. Add validation logic for business rules

**Validation Strategy:**
- Compile-time type checking
- Unit tests for data class creation and validation
- Serialization round-trip tests

**Success Criteria:** All core entities defined with proper types and validation

##### 1.3 Implement Repository Pattern [4h]
**Objective:** Replace DataScript queries with type-safe repository interfaces.

**Context Boundary:**
- Files: shared/src/commonMain/kotlin/logseq/repository/BlockRepository.kt, PageRepository.kt (3 max)
- Lines: ~500 lines total
- Concepts: Repository pattern, interface segregation

**Prerequisites:**
- Data classes defined (1.2)
- Database abstraction decided (SQLDelight vs Exposed)

**Implementation Approach:**
1. Define repository interfaces with CRUD operations
2. Implement query methods for graph traversal
3. Add search and filtering capabilities
4. Create mock implementations for testing

**Validation Strategy:**
- Interface compliance tests
- Mock repository tests
- Integration tests with in-memory database

**Success Criteria:** Type-safe data access layer with comprehensive test coverage

### Story 2: Migrate State Management and Event Handling [6 weeks]

**User Value:** Unified state management across platforms with reactive updates and consistent behavior.

**Acceptance Criteria:**
- Global app state managed with observable patterns
- Event-driven architecture for user interactions
- Cross-platform state synchronization
- Memory-efficient state updates

#### Tasks

##### 2.1 Analyze Current Rum/Reagent State [2h]
**Objective:** Document current state atoms, reactions, and event handling patterns.

**Context Boundary:**
- Files: src/main/frontend/state.cljs, src/main/frontend/handler.cljs (3 max)
- Lines: ~600 lines total
- Concepts: Reagent atoms, event dispatch patterns

**Prerequisites:**
- Familiarity with ClojureScript state management
- Understanding of current UI update mechanisms

**Implementation Approach:**
1. Map current atoms to observable state
2. Document event flow patterns
3. Identify side effects and subscriptions
4. Plan equivalent Kotlin Flow/StateFlow structures

**Validation Strategy:**
- State transition documentation
- Event flow diagrams
- Completeness audit against UI requirements

**Success Criteria:** Comprehensive state management analysis

##### 2.2 Implement Kotlin State Management [3h]
**Objective:** Create shared state management using Kotlin Flows and StateFlows.

**Context Boundary:**
- Files: shared/src/commonMain/kotlin/logseq/state/AppState.kt, EventBus.kt (3 max)
- Lines: ~450 lines total
- Concepts: Kotlin Flow, StateFlow, SharedFlow

**Prerequisites:**
- State analysis complete (2.1)
- Kotlin coroutines familiarity

**Implementation Approach:**
1. Define AppState data class
2. Implement StateFlow for reactive updates
3. Create event dispatching system
4. Add state persistence layer

**Validation Strategy:**
- State mutation tests
- Flow emission tests
- Memory leak prevention tests

**Success Criteria:** Reactive state management with proper lifecycle handling

### Story 3: Migrate UI Components (Web Platform) [10 weeks]

**User Value:** Native web components with better performance and maintainability.

**Acceptance Criteria:**
- All major UI components migrated to Kotlin/JS + React
- Consistent styling and behavior with current app
- Improved rendering performance
- Accessibility compliance maintained

#### Tasks

##### 3.1 Component Analysis and Design [4h]
**Objective:** Document component hierarchy and identify reusable patterns.

**Context Boundary:**
- Files: src/main/frontend/components/ (sample 3 files)
- Lines: ~800 lines total
- Concepts: Rum component patterns, props/state handling

**Prerequisites:**
- Understanding of current component architecture
- Knowledge of target UI framework (Compose for Web vs React)

**Implementation Approach:**
1. Catalog all components by complexity
2. Identify stateful vs stateless components
3. Document prop interfaces and event handlers
4. Design equivalent Kotlin component structure

**Validation Strategy:**
- Component dependency mapping
- Interface documentation review
- Completeness audit

**Success Criteria:** Component migration roadmap with clear dependencies

##### 3.2 Core Component Migration [4h]
**Objective:** Migrate fundamental UI building blocks (Button, Input, etc.).

**Context Boundary:**
- Files: jsMain/kotlin/logseq/ui/Button.kt, Input.kt, Layout.kt (3 max)
- Lines: ~500 lines total
- Concepts: Kotlin/JS DOM manipulation, CSS-in-JS

**Prerequisites:**
- Component analysis complete (3.1)
- Kotlin/JS setup with chosen UI library

**Implementation Approach:**
1. Implement basic components with proper styling
2. Add event handling and accessibility
3. Create composition utilities
4. Test cross-browser compatibility

**Validation Strategy:**
- Visual regression tests
- Accessibility audits
- Performance benchmarks

**Success Criteria:** Reusable UI component library

## Known Issues

### Bug 001: 🐛 Data Migration Complexity [HIGH SEVERITY]
**Description:** Converting from DataScript's flexible document model to relational/SQL structures may lose some dynamic query capabilities used by plugins.

**Mitigation:**
- Implement flexible metadata storage for plugin data
- Provide migration utilities with data validation
- Create compatibility layer for dynamic queries

**Files Likely Affected:**
- shared/src/commonMain/kotlin/logseq/repository/Migration.kt - Migration logic
- shared/src/commonMain/kotlin/logseq/model/Metadata.kt - Metadata handling
- jsMain/kotlin/logseq/plugin/CompatibilityLayer.kt - Plugin API bridge

**Prevention Strategy:**
- Early plugin developer consultation
- Comprehensive migration testing with real data
- Gradual rollout with rollback capability

**Related Tasks:** 1.1, 1.2, 1.3, 4.1

### Bug 002: 🐛 Performance Regression in Graph Traversal [MEDIUM SEVERITY]
**Description:** Kotlin's stricter typing may impact performance of complex graph queries compared to DataScript's optimized Datalog engine.

**Mitigation:**
- Profile query performance during development
- Implement query optimization strategies
- Consider hybrid approach for complex traversals

**Files Likely Affected:**
- shared/src/commonMain/kotlin/logseq/repository/GraphRepository.kt - Query implementation
- shared/src/commonMain/kotlin/logseq/service/GraphService.kt - Business logic

**Prevention Strategy:**
- Performance benchmarking from day one
- Query optimization reviews
- Alternative implementation options

**Related Tasks:** 1.3, 5.2

## Dependency Visualization
```
Epic: Kotlin Multiplatform Migration
├── Story 1: Core Data Models [8w]
│   ├── Task 1.1: Schema Analysis [2h]
│   ├── Task 1.2: Kotlin Data Classes [3h]
│   └── Task 1.3: Repository Pattern [4h]
├── Story 2: State Management [6w]
│   ├── Task 2.1: State Analysis [2h]
│   └── Task 2.2: Kotlin State Impl [3h]
├── Story 3: Web UI Components [10w]
│   ├── Task 3.1: Component Analysis [4h]
│   ├── Task 3.2: Core Components [4h]
│   └── ... (additional tasks)
└── Story 4: Mobile Migration [12w]
    └── ... (platform-specific tasks)
```

## Integration Checkpoints
- **After Story 1:** Core data layer functional with unit tests passing
- **After Story 2:** State management integrated with basic UI
- **After Story 3:** Web platform fully migrated and feature-complete
- **Final:** All platforms migrated, end-to-end tests passing, production deployment ready

## Context Preparation Guide

### Task 1.1
**Files to Load:**
- src/main/frontend/db.cljs - Current DataScript usage
- deps/common/src/logseq/common/schema.cljs - Schema definitions
- src/main/frontend/db_mixins.cljs - Database operations

**Concepts to Understand:**
- DataScript entity-attribute-value model
- Datalog query syntax
- Current graph data relationships

### Task 1.2
**Files to Load:**
- (new) shared/src/commonMain/kotlin/logseq/model/Block.kt - Data class template
- (new) shared/src/commonMain/kotlin/logseq/model/Page.kt - Page entity
- (new) shared/src/commonMain/kotlin/logseq/model/Graph.kt - Graph container

**Concepts to Understand:**
- Kotlin data classes and serialization
- Value objects vs entities in domain modeling
- Null safety and type safety principles

## Success Criteria
- All atomic tasks completed and validated
- 80% test coverage achieved across all modules
- Zero critical bugs in migrated functionality
- Performance benchmarks met or exceeded
- Successful cross-platform builds
- Documentation complete and accurate
- Code review approval from Clojure and Kotlin experts
- User acceptance testing passed</content>
<parameter name="filePath">docs/tasks/kotlin-multiplatform-migration.md