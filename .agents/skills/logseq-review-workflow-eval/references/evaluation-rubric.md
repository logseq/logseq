# Evaluation Rubric

Use this rubric after comparing raw before and after outputs.

## Decision labels

- **Improved**: the after run keeps or adds true findings, applies more relevant rules, improves evidence, and is more honest about verification.
- **Regressed**: the after run loses true findings, adds speculative findings, skips required checks, misroutes the review, or claims unrun validation.
- **Mixed**: the after run improves one dimension but worsens another.
- **Inconclusive**: prompt quality, environment drift, missing outputs, or nondeterminism prevents a fair judgment.

## Criteria

1. Finding quality
   - Prefer concrete issue, impact, location, and minimal fix.
   - Penalize broad rewrites, style-only noise, or unverifiable speculation.

2. Coverage
   - Check whether changed Logseq modules and libraries were routed to the right rule files.
   - Check whether data contracts, migrations, CLI behavior, UI behavior, and tests were considered when relevant.

3. Validation rigor
   - Reward exact commands, REPL probes, UI workflows, static invariant checks, or explicit reasons runtime checks did not apply.
   - Penalize claims that something was verified when no check is shown.

4. Subagent orchestration
   - Check whether independent pass results were gathered or whether the run clearly explained why delegation was unavailable.
   - Reward deduplication and validation of candidate findings before final reporting.

5. Final answer usability
   - Prefer concise severity, category, location, issue, impact, and suggestion fields.
   - Penalize conclusions that hide uncertainty or omit verification limitations.

## Recommended conclusion format

```markdown
Conclusion: Improved | Regressed | Mixed | Inconclusive

Evidence:
- Finding delta:
- Validation delta:
- Rule-routing delta:
- False-positive or lost-finding risk:
- Run limitations:
```
