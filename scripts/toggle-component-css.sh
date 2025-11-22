#!/bin/bash
# Toggle component CSS on/off for CSS refactoring workflow
# Usage: ./scripts/toggle-component-css.sh [disable|enable|status]

set -e

COMPONENTS_DIR="src/components"
LAYOUTS_DIR="src/layouts"
PAGES_DIR="src/pages"

disable_css() {
  echo "Disabling component CSS..."
  echo ""

  find "$COMPONENTS_DIR" "$LAYOUTS_DIR" "$PAGES_DIR" -name "*.astro" -type f | while read -r file; do
    if grep -q '<style' "$file" 2>/dev/null; then
      sed -i '' 's/<style\b/<disabled-style/g; s/<\/style>/<\/disabled-style>/g' "$file"
      echo "  Disabled: $file"
    fi
  done

  echo ""
  echo "Done! Component CSS is now disabled."
  echo "Run './scripts/toggle-component-css.sh enable' to re-enable all."
  echo "Run './scripts/toggle-component-css.sh enable <pattern>' to enable specific files."
}

enable_css() {
  echo "Enabling component CSS..."
  echo ""

  find "$COMPONENTS_DIR" "$LAYOUTS_DIR" "$PAGES_DIR" -name "*.astro" -type f | while read -r file; do
    if grep -q '<disabled-style' "$file" 2>/dev/null; then
      sed -i '' 's/<disabled-style/<style/g; s/<\/disabled-style>/<\/style>/g' "$file"
      echo "  Enabled: $file"
    fi
  done

  echo ""
  echo "Done! All component CSS is now enabled."
}

enable_file() {
  local pattern="$1"
  echo "Enabling CSS in files matching: $pattern"
  echo ""

  find "$COMPONENTS_DIR" "$LAYOUTS_DIR" "$PAGES_DIR" -name "*.astro" -type f | while read -r file; do
    if [[ "$file" == *"$pattern"* ]] && grep -q '<disabled-style' "$file" 2>/dev/null; then
      sed -i '' 's/<disabled-style/<style/g; s/<\/disabled-style>/<\/style>/g' "$file"
      echo "  Enabled: $file"
    fi
  done
}

show_status() {
  echo "Component CSS Status"
  echo "===================="
  echo ""

  echo "DISABLED:"
  find "$COMPONENTS_DIR" "$LAYOUTS_DIR" "$PAGES_DIR" -name "*.astro" -type f -exec grep -l '<disabled-style' {} \; 2>/dev/null | sort | sed 's/^/  /' || echo "  (none)"

  echo ""
  echo "ENABLED:"
  # Find files with <style but not <disabled-style
  find "$COMPONENTS_DIR" "$LAYOUTS_DIR" "$PAGES_DIR" -name "*.astro" -type f | while read -r file; do
    if grep -q '<style' "$file" 2>/dev/null && ! grep -q '<disabled-style' "$file" 2>/dev/null; then
      echo "  $file"
    fi
  done
}

case "$1" in
  disable)
    disable_css
    ;;
  enable)
    if [ -n "$2" ]; then
      enable_file "$2"
    else
      enable_css
    fi
    ;;
  status)
    show_status
    ;;
  *)
    echo "Toggle Component CSS"
    echo "===================="
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  disable         Disable ALL component CSS"
    echo "  enable          Enable ALL component CSS"
    echo "  enable <name>   Enable CSS in files matching <name>"
    echo "  status          Show enabled/disabled status"
    echo ""
    echo "Examples:"
    echo "  $0 disable              # Disable all"
    echo "  $0 enable Footer        # Enable Footer.astro"
    echo "  $0 enable MainNav       # Enable MainNavigation.astro"
    echo "  $0 status               # See what's enabled/disabled"
    ;;
esac
