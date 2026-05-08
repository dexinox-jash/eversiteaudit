---
type: screen
path: src/app/templates/index.tsx
---

# Templates Screen

Manage project templates.

## State

- `templates`
- `showModal`
- `editingTemplate` — null when creating, Template when editing
- `name`, `description`, `categories`

## Behavior

- **Create:** Opens modal with empty form, calls `createCustomTemplate()`
- **Edit:** Opens modal pre-populated with template name, description, and categories (parsed from JSON content), calls `editCustomTemplate()`
- **Delete:** Swipe/press delete on custom templates (built-in templates protected)
- Built-in templates show "Built-in" badge and cannot be edited or deleted

## Components

- `Screen`, `Typography`, `Card`, `Button`, `TextInput`
- `Pencil` icon for edit action
- `Trash2` icon for delete action

## Services

- `templateRepository`
- `createCustomTemplate`, `editCustomTemplate`, `deleteCustomTemplate`
- `parseTemplateContent`
- `hapticSuccess`

## Related

- [[Template Repository]]
- [[Template Service]]
- [[New Project Screen]]
- [[App Navigation Index]]
