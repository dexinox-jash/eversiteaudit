---
type: service
path: src/services/template/templateService.ts
---

# Template Service

Template-driven project creation and management.

## Functions

- `createProjectFromTemplate(templateId, projectPayload)` — Creates project with issues from template sections
- `createCustomTemplate(name, description, categories)` — Creates a new custom template
- `editCustomTemplate(id, name, description, categories)` — Updates an existing custom template
- `deleteCustomTemplate(id)` — Soft-deletes a custom template (built-in templates protected)
- `parseTemplateContent(content)` — Parses template JSON content into section array

## Related

- [[New Project Screen]]
- [[Onboarding Screen]]
- [[Templates Screen]]
- [[Template Repository]]
- [[Services Index]]
