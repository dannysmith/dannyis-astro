---
title: 'The Definition of Done: What does "done" actually mean?'
slug: definition-of-done
pubDate: 2017-06-19
---

Scrum defines the **definition of done** in pretty simple terms: it's the acceptance criteria that are common to every single user story. For scrum teams, it's really important to have a solid definition of what "done" means. They work in sprints, and need some way of deciding whether a user story is actually finished. It's no good ending a sprint with a user story that meets all its acceptance criteria, but had no code review, hasn't been tested and isn't deployable. Such a story is clearly not done. Scrum teams solve this by strictly defining "done". In this case, in addition to meeting the acceptance criteria, the story must also:

- Have had a code review.
- Have been tested.
- Be immediately deployable.

If this isn't the case at the end of the sprint then it isn't done - we can't count it's story points towards the sprint velocity and it needs to go on the backlog for the next sprint planning session.

## What does "done" actually mean, though?

Is a new feature "done" when it's in production and being used by customers? It might be. Equally, it might not. Have we published the changelog? Have we emailed our customers to tell them about the feature?

When is a technical improvement or refactoring "done"? We certainly don't want to email our customers about it, and we probably don't want to add it to the changelog.

The definition of "done" depends on the task.

Some teams get around this problem by having multiple definitions of "done" - one for bugfixes, another for features, another for technical tasks, and so on.

At [CharlieHR](http://charliehr.com/), this seemed overly complex. We don't use scrum, and we don't work in iterations. But we still need a way to remind ourselves of the stuff that should be done before a task is considered finished. So we invented a checklist.

## Our DoD at Charlie

We use two definitions. The first is **ready to merge**. Everything in this checklist needs to be ticked off before the pull request is merged to the `master` branch. The second is **actually done**. Everything in this checklist must be ticked off before the card is moved to the Done column on our task boards.

It's worth noting that these rules apply to _every single work item_ that goes through our task boards, so long as it involves code. Whether it's a large user story with multiple dependencies or a tiny bugfix, the person doing the work is expected to run through these checklists.

That doesn't mean that everything on the checklists has to be ticked off for every work item, though - a tiny technical improvement is unlikely to need a marketing email written about it, for example. It does mean that everything in the checklist must be **considered** for every work item. We trust our engineers to use their judgement.

While you're reading the DoD below, bear in mind…

- We use Trello for our task boards. Most teams have columns for **backlog**, **next up**, **in progress** and **done**. New features and user stories are represented by trello cards on a team backlog.
- Technical improvements and exceptions begin life as GitHub issues. These get a trello card on the backlog when they are assigned to or picked up by a team. Bugs live in [Sifter](http://sifterapp.com/), and get a trello card when they're assigned to a team.
- The order in which the items below are considered is irrelevant, so long as they have all been considered.

I've made notes in italics, since some of the items need a bit of explanation.

## Checklist 1: Ready to Merge

- **Kickoff done and requirements clear. Kickoff Document stored on Drive.** This is where we define our acceptance criteria and the scope of a new feature. Most non-trivial user stories require this, and the kickoff for an epic may spawn multiple, smaller, inter-dependant user stories. Bugfixes don't normally need a kickoff: it's down to the product manager and engineers to decide whether a work item needs one. The kickoff document is just the record of the discussion, and contains sufficient acceptance criteria to get the thing out.
- **Implementation Plan written and reviewed.** This is something we're trying out. For non-trivial work items, engineers discuss and plan the technical solution. This usually involves whiteboarding and scribbling on bits of paper. The implementation plan is a summary of that thinking and is available for engineers from other teams to review. We're hoping this will help catch architectural and system design problems early. For technical improvements, this discussion has usually happened on the associated github issue already.
- **DPIA Form Completed.** Do we need to do a Data Protection Impact Assessment?
- **Card on Trello, properly labelled, sized and PR/Issue linked (mandatory).** Before a trello card is picked up it must be labeled, have a T-Shirt size and have any associated stuff (kickoff doc, implementation plan, github issue, sifter issue etc) attached to it. Once a pull request is open, this (or these) should be attached too.
- P**ull Request open and properly labelled (mandatory).** We open a PR after the first commit to a branch. Early comments on the PR save time and help share knowledge between teams.
- **Acceptance criteria met. Obviously.** If changes to the requirements have been agreed with the product manager, have they been noted on the kickoff document or trello card?
- **Unit tests written.**
- **Functional specs written.**
- **Documentation folder reviewed for any changes/additions.** We have a directory containing markdown files that describe the design patterns and conventions we use.
- **Environment variables documented, added to secrets manager and present in staging & production environments.**
- **Analytics considered.** Do we need to track user behaviour, and how should that be reported to our analytics tools. For larger work items, this is usually specified in the the kickoff doc.
- **“What's New" section updated.** If this is a new feature, we may want to tell our users about it.
- **l18n reviewed.** All our copy (including microcopy) should live in [locale files](https://guides.rubyonrails.org/i18n.html).
- **Security & Data Protection Review (mandatory).** We take security seriously. Have we made a deliberate and methodical check that this doesn't introduce any obvious security or data protection issues. This is particularly important for small bugfixes, since they may not have had detailed planning.
- **Code Review from at least one other (mandatory).** We strictly enforce this with our GitHub settings.
- **[CodeClimate](https://codeclimate.com/) clear of errors.** As well as tracking our test coverage, we run static analysis tools like rubocop and ESLint against out changes. We're still tweaking the rules for these tools to suit our in-house style.
- **Feature Branch green on CI (mandatory).** We also enforce this. You cannot merge to master with a red build on your feature branch.

## Checklist 2: Actually Done

- **Merged to master and feature branch deleted (mandatory).** The master branch is automatically deployed to our staging environment. [I wrote about our merge process earlier](https://medium.com/@dannysmith/synchronising-git-merges-with-slack-d905f7cbd55c).
- **Related GitHub Issues closed or updated.**
- **Sifter, Appsignal, and #tech-support issues closed 🏁.** We have a slack channel where people can raise technical issues. If a work item resolves or relates to one of these, it should be marked. This mostly applies to tiny bugfixes. Resolved bugs and exceptions should be closed in Sifter and Appsignal, respectively.
- **Manually tested on staging environment (mandatory).** We don't have dedicated QA people, so engineers and product managers conduct acceptance and exploratory tests. For work items that carry significant business or technical risk, we'll draft in people from across the company to help.
- **Deployed to production with no obvious errors/exceptions (mandatory).** Once a PR is deployed, we expect our engineers to keep an eye on the slack channel that shows our exceptions. If the deploy causes a flurry of them, it should either be rolled back and fixed or they should be addressed in a new PR before the work item can be considered done.
- **Release email sent.** We send a company-wide email for all non-trivial releases.
- **Marketing document updated.** If the work item is a new feature or important bugfix, it's recorded in a spreadsheet. The marketing team refer to this when sending updates to our users.
- **Usage metrics checked/set up.** Have we checked that data is coming through correctly? Do we need to update any formulas or one of our [Geckoboard](https://www.geckoboard.com/) dashboards?
- **Help pages updated.** If we've added a feature, changed the way something works or updated the UI, we might need to update our user guides, help documentation and canned responses in intercom.
- **FINALLY, card moved to "done" on trello (mandatory).**

## Mandatory Items

You'll notice that some of the items are marked _mandatory_. **Those must be done for every single work item. No exceptions.** For a scrum purist, these are the only things that should appear in a Definition of Done. For us (right now), they are probably the least useful items on the list - they're all important enough that we'd remember to do them even if we didn't have a checklist!

At the moment, we're deliberately keeping our mandatory items to a minimum, though we have discussed making more stuff mandatory. As we continue to evolve our process, I expect we'll add items to support our current engineering goals. If we were focussed on improving our unit test coverage, we might include an item that says _"all new models and <abbr title="Plain Old Ruby Object">PORO</abbr>s must have an associated unit test"_. If we were focussed on improving the quality of our codebase, we might insist that "every pull request must improve the CodeClimate quality rating". We might even decide to [make proof of business value a prerequisite](https://medium.com/rootpath/delivering-business-value-with-kanban-and-validated-learning-55749daffecc) for "done".

Currently though, we are focussed on building an awesome product, and while most pull requests include unit tests and quality improvements, **it doesn't make sense to _mandate_ that just now.** Our "Definition of Done" is designed to help us work better and faster, and will change and evolve alongside our business goals.
