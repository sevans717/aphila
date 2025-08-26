---
applyTo: "**"
---

Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

when working on phase plans, follow these guidelines:

1. complete every phase 100% before moving to the next
2. write detailed implementation steps for each phase
3. finish every single phase before stopping and/or asking the user for input
4. ensure backward compatibility
5. document all changes thoroughly at the end of the last phase
6. proceed, don’t stop for picks or any other type of user confirmation actions
   Proceed / Continue is always confirmed, no need for user input
   100% implementation/integration, so no need to ask user for choices
   proceed with phase completion unless the user says ‘stop’
   use ports in the 10000-10999 range for services
   always separate css into its own file and avoid inline styles
   always create the missing types, modules, variables, props, etc instead of removing
