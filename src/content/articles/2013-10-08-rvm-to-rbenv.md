---
title: 'From RVM to rbenv'
pubDate: 2013-10-08
slug: rvm-to-rbenv
draft: false
description: 'Switching from RVM to rbenv for simpler Ruby version and gem management'
tags: ['ruby', 'rbenv', 'rvm', 'development', 'tools']
---

I recently switched from RVM (Ruby Version Manager) to rbenv for Ruby version and gem management. This isn't so much of a 'howto', as a dump of my bash history for anyone looking to make a similar transition.

## Why I Left RVM

RVM had several issues that frustrated me:

- **Complicated gem and Ruby version management** - The system felt overly complex
- **Unclear storage locations** - I never knew where gems and Ruby versions were actually stored
- **Confusing gemset commands** - The gemset system was hard to understand and manage

## Why rbenv is Better

rbenv offers several advantages:

- **Simpler to understand** - The system is more transparent
- **Works well with Bundler** - Better integration with modern Ruby workflows
- **Easier project-specific Ruby version management** - `.ruby-version` files just work

## The Migration Process

Here's the process I followed to switch:

1. **Completely remove RVM** - Clean out all RVM-related files and configurations
2. **Clean out old Ruby and gem installations** - Start fresh
3. **Install rbenv via Homebrew** - Use the package manager for easy installation
4. **Install desired Ruby versions** - Install 1.9.3 and 2.1.4 (the versions I needed)
5. **Set up default gems** - Install commonly used gems
6. **Install rbenv plugins** - Add rbenv-bundler for better Bundler integration

## The Result

The goal was to create "a decent local ruby environment that I actually understand." rbenv delivers on this promise by being:

- **Transparent** - I can see exactly what's happening
- **Simple** - No complex gemset management
- **Reliable** - Works consistently across projects

## Key Commands

The most important rbenv commands I use daily:

```bash
rbenv versions          # List installed Ruby versions
rbenv global 2.1.4      # Set global Ruby version
rbenv local 1.9.3       # Set local Ruby version for current directory
rbenv rehash            # Refresh rbenv shims
```

The switch from RVM to rbenv was one of the best development environment decisions I've made. If you're frustrated with RVM's complexity, rbenv is definitely worth considering.