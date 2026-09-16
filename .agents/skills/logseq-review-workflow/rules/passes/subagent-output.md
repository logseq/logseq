# Review Pass Subagent Output

Use this output contract for every `logseq-review-workflow` pass subagent.

## Hard constraints

- Stay read-only: do not edit files, stage changes, commit, push, or rewrite code.
- Inspect only the assigned pass. Mention cross-pass concerns as notes, not primary findings.
- Report candidate findings only when backed by concrete evidence.
- Set each finding's `Category` to the assigned pass type. Do not invent categories.
- Include questions when intent or contract ambiguity prevents a confident finding.

## Output

```markdown
## <Pass Name> Pass Result

### Candidate findings

- **Severity:** Blocking | Important | Minor | Question
- **Category:** Correctness | Data contract | Regression | Failure mode | Migration validation | Performance | Test coverage | Repository convention | System Additions
- **Location:** `path/to/file.cljs:line`
- **Issue:** What is wrong.
- **Evidence:** Code path, invariant, test, runtime observation, contract, or command output inspected.
- **Impact:** Concrete user, data, runtime, or maintenance impact.
- **Suggested validation:** Exact command, REPL probe, CLI workflow, UI workflow, or static check the main agent can use.
- **Suggestion:** Smallest actionable fix.

### Checks run

- Exact commands, REPL probes, static files, or reasoning paths inspected.

### Questions

- Ambiguities that should remain questions unless the main agent finds more evidence.
```

If there are no findings, state the files and behavior areas inspected and why they passed this pass.

For System Additions, also include a separate `### Additions inventory` section with Retain / Simplify / Question assessments as defined in [`system-additions.md`](./system-additions.md), even when there are no candidate findings. Compare demonstrated benefit with ongoing maintenance obligations and investigate smaller alternatives. Inventory dispositions are not severity ratings; evidence-backed unnecessary complexity must also appear under candidate findings, not only in the inventory.
