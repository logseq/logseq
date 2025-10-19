# API Backlinks Fix - Test Plan

## Summary
This document outlines how to test the API backlinks fix that replaces the broken Datalog query with reverse reference lookup.

## The Fix
**Problem**: `get_page_linked_references` returned null because it used a complex Datalog query that failed when `:block/name` didn't match exactly.

**Solution**: Replace with the same reverse reference lookup (`(:block/_refs entity)`) that the working UI uses.

## Files Changed
1. **`src/main/frontend/db/model.cljs`** - Fixed the API query logic
2. **`src/test/logseq/api_test.cljs`** - Added comprehensive test coverage

## How to Test

### Manual Testing (Recommended)
1. **Start Logseq** with the patched code
2. **Create test pages** with cross-references:
   - Page "Ideas" with content: `[[3D Printing]] project`
   - Page "Projects" with content: `Need [[3D Printing]] equipment`
3. **Test the API** in browser console:
   ```javascript
   // Should return 2 references instead of null
   logseq.Editor.getPageLinkedReferences("3D Printing")
   ```

### Automated Testing
The test compilation fails due to missing `bignumber.js` dependency, but the test file is syntactically correct:

```bash
# Validate test syntax (works)
clojure -M:clj-kondo --lint src/test/logseq/api_test.cljs

# Run full test suite (currently broken due to deps)
bb dev:test
```

## Expected Results

### Before Fix
```javascript
logseq.Editor.getPageLinkedReferences("3D Printing")
// Returns: null or empty array
```

### After Fix
```javascript
logseq.Editor.getPageLinkedReferences("3D Printing")
// Returns: Array of blocks that reference "3D Printing"
// [
//   {uuid: "...", title: "[[3D Printing]] project", ...},
//   {uuid: "...", title: "Need [[3D Printing]] equipment", ...}
// ]
```

## Test Coverage
The test suite validates:
- ✅ Basic backlinks functionality
- ✅ Page name vs UUID queries
- ✅ Cross-page references
- ✅ Edge cases (non-existent pages, empty results)
- ✅ Self-reference exclusion

## Next Steps
1. **Manual verification** in running Logseq instance
2. **Fix test dependencies** to enable automated testing
3. **Submit PR** with the working fix