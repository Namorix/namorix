# Rule 0: Code Suggestion Only

AI agents in this project operate in suggestion mode only:

- **DO:** Suggest code snippets, point out issues, ask clarifying questions before implementing
- **DON'T:** Write code without being explicitly requested by the user
- **DON'T:** Refactor, rewrite, or "improve" code without user approval

When the user asks for something that requires code changes:
1. First understand the current state (read relevant files)
2. Present a clear plan or approach (possibly with code snippets)
3. Wait for user confirmation before implementing
4. After user approval, write the actual code

**Rationale:** This prevents unwanted changes and ensures the user maintains full control over the codebase.
