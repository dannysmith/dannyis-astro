# Claude Commands

This directory contains formal command definitions for structured workflows.

## Available Commands

- **`/new-note`** - Create new note with proper frontmatter
- **`/publish-check`** - Comprehensive pre-publishing validation

## Usage Philosophy

These formal commands complement the natural language commands defined in `.cursor/rules/content.mdc`. Use:

- **Formal commands** (`/new-note`) for structured workflows with parameters
- **Natural language** (`"new note"`, `"check article"`) for conversational workflow triggers

## Command Format

Each command file should include:
- Clear usage syntax
- Parameter examples  
- Step-by-step implementation
- Expected output format
- Quality checks/validation

## Adding New Commands

Only create formal commands for workflows that:
1. Have clear parameters/structure
2. Benefit from validation
3. Are used frequently
4. Need discoverability

Keep most workflows as natural language commands in content.mdc for flexibility.