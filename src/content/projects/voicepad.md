---
title: Voicepad
byline: Voice notes from my phone, watch and car into my Obsidian inbox
stage: active-development
audience: personal-only
kind: toy
icon: ../../assets/projects/voicepad-icon.png
image: ../../assets/articles/2026-10-21-voicepad-cover.png
startDate: 2026-10-01
---

Voicepad is a voice-note system for my iPhone, Apple Watch and CarPlay. I ramble into whichever one I've got to hand, and a little later a sane markdown note turns up in my Obsidian inbox: a sensible title, checkbox tasks for the things I said I need to do, dates worked out, and wikilinks to the people, projects and places already in my vault.

The capture apps have one job: record quickly without losing anything. In the car it's voice-first, so I just say "new note", "add to my last note" or "stop recording". The watch app works without the phone, and a recording can start from a widget, Control Centre, the Action button or Siri. Everything syncs through CloudKit to a Mac app, which waits an hour in case I want to add to the note, transcribes it locally with Whisper and hands the transcript to Claude. Claude cleans it up, looks things up on the web when I've asked it to, and writes the note. Then a line linking to it goes into that day's daily note.

I have most of my good ideas in the car, on a walk or at 1am, and none of those are good places to type. Nothing I could find recorded in CarPlay _and_ had a proper Mac app, so I built my own. It's just for me and isn't released, but I've written about [how Voicepad works](/writing/how-voicepad-works/) in a lot of detail.
