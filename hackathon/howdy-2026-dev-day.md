# Agentic Software Engineering Hackathon *Build real software with agents*

Dev Day 2026 Competition Outline \+ Rules

**2025 → 2026: From prompting AI to engineering systems of agents.**

# **Introduction**

**Welcome to Howdy’s 2026 International Dev Day Competition\!**

Last year, the challenge was about what you could build with AI. This year, the challenge is about how you engineer with agents.

Your mission is to build a small but real working software product using a modern agentic engineering workflow: defining intent, creating the right context, orchestrating work, running tasks in parallel, building verification and feedback loops, and giving agents enough autonomy to make meaningful progress without constant human prompting.

You choose what to build. It can be useful, ambitious, weird, delightful, technical, or completely unexpected. The product matters, but the engineering system behind it matters just as much.

## **Why Participate?**

* **Level Up—**Experience how modern agentic software engineering actually works, hands on.  
* **Build Differently—**Move beyond prompting and learn to engineer context, tools, workflows, verification, and feedback loops.  
* **Think Bigger—**Use agents to tackle more ambitious work than a single developer could normally complete in a few hours.  
* **Learn by Shipping—**Leave Dev Day with a working product, a reproducible workflow, and practical techniques you can use immediately.  
* **Show Your System—**Demonstrate not only what you built, but how your engineering system planned, built, tested, reviewed, and improved it.  
* **Compete—**Win prizes for the strongest agentic engineering, orchestration, harness, product, creativity, and surprise.

**The goal is simple: by the end of Dev Day, every participant should have experienced what modern agentic software engineering feels like.**

# **The Evolution of Dev Day**

|  | 2025 | 2026 |
| ----- | ----- | ----- |
| **Model** | Human → AI Tool → Product | Human → Agentic System → Product |
| **Focus** | Prompting and AI assisted building | Context, orchestration, autonomy, and verification |

# **Hackathon Strategy**

We are running a short, focused hackathon where participants build a small but meaningful software product using a modern agentic development workflow. The scope should be achievable in hours, not days.

Unlike a traditional hackathon, the challenge is not only the final product. Participants must demonstrate how they engineered the system around the agents: how they defined the goal, managed context, delegated work, parallelized where useful, created verification, handled failures, and decided when human judgment was necessary.

Participants may use gstack, HumanLayer inspired workflows, Claude Code, Codex, Cursor, custom agent frameworks, custom harnesses, or equivalent modern tooling.

There is no preferred framework or vendor.

**The goal is to learn how to engineer with agents, not how to use one specific tool.**

## **What Can You Build?**

* A web or mobile application  
* A developer tool, CLI, SDK, or automation  
* An internal productivity tool  
* An AI powered application or agent  
* A game or interactive experience  
* A data or workflow product  
* Something useful, surprising, or completely unexpected

There is no Howdy API requirement. The idea is open. The engineering approach is not.

# **Required Agentic Engineering Workflow**

Every qualifying project must demonstrate the following six capabilities:

## **1\. Intent \+ Specification**

Use AI to turn the idea into a clear engineering specification before substantial implementation begins.

The specification should include requirements, constraints, architecture, major decisions, an implementation approach, and a clear definition of done.

The goal is to give agents a durable understanding of what they are trying to accomplish instead of repeatedly telling them what to do next.

## **2\. Context Engineering**

Deliberately manage what information agents receive and when they receive it.

This may include repository instructions, plans, research artifacts, skills, tools, specialized contexts, subagents, context compaction, fresh contexts for new phases of work, or structured handoffs between agents.

More context is not automatically better context.

Strong workflows give agents the information they need for the current task while avoiding unnecessary noise.

## **3\. Orchestration \+ Parallel Work**

Break substantial work into meaningful workstreams and decide how those workstreams should be executed.

This may involve multiple agents, subagents, contexts, branches, worktrees, or other forms of delegation.

Where the tooling and project support it, run independent workstreams in parallel.

Teams should show how work was divided, how dependencies were managed, how outputs were integrated, and why those boundaries were chosen.

The goal is meaningful orchestration, not simply creating several agents with different names.

## **4\. Harness \+ Back Pressure**

Build mechanisms that let agents verify whether their work is actually correct.

Examples include unit tests, integration tests, browser tests, type checks, linting, builds, automated evaluations, screenshots, visual verification, security checks, AI code review, deployment checks, or other machine readable feedback.

The important part is that the agent can observe the result and react to it.

**BUILD → VERIFY → OBSERVE → FIX → REPEAT**

## **5\. Autonomous Loops \+ Recovery**

Demonstrate at least one meaningful place where an agent can continue making progress without requiring another human prompt after every step.

For example:

An agent implements a feature.

Tests fail.

The agent examines the failure.

It fixes the implementation.

It runs the tests again.

A browser check finds another problem.

The agent fixes that too.

The loop continues until the acceptance criteria are satisfied or human judgment is required.

**The goal is not maximum autonomy. The goal is reliable autonomy.**

## **6\. Human as Orchestrator**

Show where the engineer made the important decisions: defining goals, setting constraints, choosing architecture, deciding what context agents needed, resolving ambiguity, reviewing tradeoffs, redirecting the system, handling risky changes, and deciding when the product was ready.

The goal is not to remove the engineer.

The goal is to move the engineer away from repetitive instructions and toward judgment.

# **Agentic Engineering Principles**

Strong submissions should demonstrate an understanding of several ideas behind modern agentic software engineering.

## **Prompts Are Not the System**

The goal is not to write increasingly elaborate prompts.

Instead, think about what should become part of the engineering environment:

* Specifications  
* Repository instructions  
* Skills  
* Tools  
* Tests  
* Hooks  
* Evals  
* Context  
* Progress artifacts  
* Feedback loops

A useful question throughout Dev Day is:

**Am I telling the agent what to do again, or can I improve the system so I never need to give that instruction again?**

## **Use Agents for Judgment, Deterministic Systems for Guarantees**

Some things should be instructions.

Other things should simply happen.

For example, instead of repeatedly asking an agent to run tests, the harness can run them automatically.

Instead of telling an agent not to modify a protected directory, a deterministic control can prevent it.

Instead of asking an agent to continue when verification fails, the workflow can automatically return the failure to the implementation loop.

Use agent reasoning where judgment is useful.

Use deterministic controls where guarantees are useful.

## **Agent Count Is Not the Goal**

A complicated system with many agents is not automatically better.

Sometimes one orchestrator with excellent context, tools, verification, and autonomous recovery is more effective than ten loosely coordinated agents.

Subagents, separate contexts, and parallel workers should exist because they improve context isolation, specialization, execution, or reliability.

# **Contest Rules**

1. Projects must be built during the competition window.  
2. Projects must use a modern agentic development workflow and satisfy the required capabilities above.  
3. Participants may use any approved agent framework, coding model, development tool, programming language, cloud platform, database, API, or external service.  
4. There is no required framework or minimum number of named agents.  
5. Participants must demonstrate meaningful orchestration or delegation beyond ordinary interactive AI assisted coding.  
6. Parallel work should be demonstrated where the project and tooling provide a reasonable opportunity for independent workstreams.  
7. The project must include a harness or automated feedback mechanism that agents can use to validate and improve their work.  
8. The project must demonstrate at least one meaningful autonomous feedback or recovery loop.  
9. Keep scope small enough to ship a working result in hours, not days.  
10. The final submission must make both the product and the agentic engineering process reproducible.  
11. All qualifying projects will be evaluated using the general rubric and considered for every applicable prize category.

# **Eligibility**

The competition is open to Howdy Developers, including internal engineers and Howdy Professionals, subject to the final Dev Day eligibility rules. Teams are allowed and may be multidisciplinary. Each person may participate in only one submission.

# **Submission Requirements**

Each team must submit the following (\*):

* Project Name — A clear and concise title.  
* Working Product — A link or runnable version of the application.  
* Code Repository — Source code and the files required to run the project.  
* Short Description — 1 to 2 sentences explaining what the product does.  
* Engineering Spec — Requirements, architecture, constraints, acceptance criteria, and major technical decisions.  
* Agentic System Map — How context, agents, tools, workstreams, and orchestration were structured.  
* Parallelization Evidence — A short explanation or evidence showing which workstreams ran in parallel.  
* Harness / Evaluation — Tests, evals, review loops, hooks, or other mechanisms used to validate and improve the product.  
* Autonomous Loop Evidence — Show at least one place where an agent detected a problem, reacted, and continued without another human instruction.  
* AI Development Log — Enough evidence to understand the workflow, important iterations, failures, corrections, and human decisions.  
* README — Setup and run instructions, dependencies, environment variables, and any external services required.  
* Demo Video — Maximum 3 minutes.

## **3-Minute Demo Format**

| Time | What to Show |
| ----- | ----- |
| **First 90 seconds** | WHAT WE BUILT — Show the product working and the problem or experience it creates. |
| **Final 90 seconds** | HOW WE BUILT IT — Show the specification, context strategy, orchestration, parallel work, harness, autonomous loops, failures, recovery, and key human decisions. |

# **How Will You Be Judged?**

Every qualifying project will be scored out of 100 points. The judging system intentionally rewards both the quality of the product and the quality of the agentic engineering system used to create it.

| Criterion | Points | What Judges Look For |
| ----- | ----- | ----- |
| **Agentic Engineering** | 25 | Quality of decomposition, orchestration, delegation, context boundaries, parallel work, integration, tools, and human decision making. |
| **Harness \+ Autonomous Loops** | 25 | Quality of tests, evals, automated review, back pressure, self correction, failure recovery, and autonomous iteration. |
| **Product Quality** | 20 | Does it work? Is it useful or compelling? Is the implementation technically sound and the experience usable? |
| **Context Engineering** | 10 | How deliberately the team managed context, instructions, artifacts, skills, handoffs, and agent isolation. |
| **Innovation \+ Ambition** | 10 | Originality, technical ambition, creative use of agents, and whether the team attempted something meaningfully beyond a basic AI generated app. |
| **Reproducibility** | 5 | Could another engineer understand and reproduce the product and agentic workflow from the submission? |
| **Demo \+ Storytelling** | 5 | Can the team clearly communicate both the product and the engineering system behind it? |

# **Competition Categories**

* **Best Agentic Engineer / Team —** Overall winner. The strongest combination of product quality, agentic engineering, orchestration, autonomy, and execution.  
* **Best Orchestration —** The most effective decomposition, context isolation, delegation, parallel execution, and integration.  
* **Best Harness / Agentic Loop —** The strongest system for testing, evaluating, reviewing, recovering, and automatically improving work produced by agents.  
* **Most Ambitious Build —** The team that used agentic engineering to successfully tackle the boldest scope within the available time.  
* **Most Creative —** The most original idea, approach, or use of agentic software engineering.  
* **Best Product Experience —** The strongest usability, polish, clarity, and overall product experience.  
* **Most Surprising Result —** The project or workflow that produces the biggest “I didn’t know you could do that” moment.

# **What a Strong Submission Looks Like**

A team decides to build a new developer productivity application.

Instead of asking one coding model to generate the entire product, the team first creates a specification that describes the requirements, architecture, constraints, and definition of done.

An orchestrator researches the codebase and breaks implementation into meaningful workstreams.

Separate contexts investigate different parts of the system and return concise findings rather than filling the main context with every research step.

Frontend and backend implementation run in parallel where useful.

Tests and validation are part of the workflow rather than something added at the end.

An agent can launch the application, inspect it through browser automation, observe failures, fix problems, and run verification again.

An independent review step examines the integrated code.

Deterministic controls enforce important rules that should not depend on the agent remembering them.

The human engineer makes architecture decisions, resolves ambiguity, evaluates tradeoffs, redirects the system when necessary, and decides when the product is ready.

The final product may be simple.

The differentiator is that the team demonstrates a deliberate, repeatable engineering system that allows agents to make substantial progress without requiring the human to manually direct every step.

## **What Will Not Score Well**

* A one shot prompt that generates an entire application with little engineering involvement.  
* Repeated manual prompting where the human specifies every next action.  
* Using several chat sessions sequentially but calling them multiple agents without meaningful specialization or context isolation.  
* Creating fictional agent roles simply to satisfy the competition.  
* Artificial parallelism that provides no engineering benefit.  
* A polished UI with no evidence of planning, testing, orchestration, or feedback loops.  
* A complex agent setup that produces a weak or non working product.  
* An agent that claims work is complete without meaningful verification.  
* A workflow where the human has to discover and diagnose every failure.  
* Blind autonomy without appropriate constraints or human judgment.  
* A submission that cannot explain why its engineering system was designed the way it was.

# **Timeline**

* Launch: August 31st, 2026  
* Submission Deadline: Sep 14, 2026  
* Judging Period: Sep 16, 2026 through Oct 5, 2026  
* Winners Announcement: Oct 13, 2026

# **Prizes**

Prizes will be awarded by category. Total prize pool and category allocations: $5,500

* Best Agentic Engineer / Team—$1250  
* Best Orchestration—$1000  
* Best Harness / Agentic Loop — $1000  
* Most Ambitious Build—$750  
* Most Creative—$500  
* Best Product Experience—$500  
* Most Surprising Result—$500

# **Terms and Conditions**

* Ownership of Submissions — Final ownership and intellectual property terms will follow Howdy’s approved 2026 Dev Day competition terms.  
* Confidentiality — Participants must protect any proprietary information, credentials, datasets, or internal materials made available during the competition.  
* Secrets and Credentials — Never commit API keys, tokens, passwords, or other secrets to source control. Use environment variables and placeholder .env.example files.  
* Data Use — Do not expose, export, or share confidential or personal data unless explicitly authorized for the competition.  
* No Additional Compensation — Participants will not receive compensation for submissions beyond any prizes awarded under the final competition rules.  
* Compliance — Submissions must comply with applicable laws, third party rights, Howdy policies, and the final competition terms.

# **The 2026 Challenge**

**Submission form: {[link](https://howdyinc.typeform.com/to/jrJoc6UU)}**

**Last year: What can you build with AI?**

**This year: How do you engineer with agents?**

**SPECIFY → CONTEXTUALIZE → ORCHESTRATE → BUILD → VERIFY → RECOVER → SHIP**

**(\*) Submission Format Details**

**Project Name** — Enter the project name directly in the official Submission Form.

**Working Product** — Provide a URL to a live, accessible version of the application. If the project is not web based, provide clear instructions for running it locally.

**Code Repository** — Provide a link to the project’s GitHub repository containing the complete source code and all files required to reproduce the project.

**Short Description** — Enter a 1 to 2 sentence description directly in the Submission Form explaining what the project does and why it is interesting or useful.

**Engineering Spec** — Include a SPEC.md file in the repository under /docs. It should briefly describe the objective, requirements, constraints, proposed architecture, major technical decisions, and definition of done.

**Agentic System Map** — Include a SYSTEM.md file under /docs. Describe the agents, contexts, tools, skills, orchestration, delegation, parallel work, deterministic controls, and how outputs were integrated.

**Parallelization Evidence** — Include this in SYSTEM.md. Briefly show which agents or workstreams operated in parallel and how their work was coordinated. A simple diagram, timeline, screenshot, or short explanation is sufficient.

**Harness / Evaluation** — Include the actual tests, evals, scripts, hooks, browser automation, or other validation mechanisms in the repository and briefly explain in the README how they were used to create feedback loops.

**Autonomous Loop Evidence** — **Autonomous Loop Evidence** — Include a short example in SYSTEM.md or AI-DEV-LOG.md demonstrating at least one complete autonomous loop.

At minimum, the evidence should show the agent:

**ACT → VERIFY → OBSERVE A PROBLEM → FIX → VERIFY AGAIN**

These steps must happen **without a new human instruction in the middle of the loop**.

Evidence should remain lightweight. A screenshot, short execution log, interaction history excerpt, test output, browser trace, or similar artifact is sufficient, as long as judges can understand what happened and verify that the loop closed autonomously.

Human intervention is fully acceptable before or after the loop—and throughout the rest of the development process. The requirement is simply that the demonstrated loop itself progresses from action through verification, correction, and re-verification without additional human prompting.

There is no required tool, number of iterations, or evidence format. Judges retain discretion to determine whether the example demonstrates a meaningful and genuinely autonomous engineering loop.

**Example:**

Agent implements feature → tests fail → agent inspects failure → agent fixes implementation → tests pass

No human prompt occurs between these steps.

**AI Development Log** — Include an AI-DEV-LOG.md file under /docs. This is not expected to contain every prompt or full conversation history. Highlight the most important iterations, failures, corrections, context changes, agent interactions, autonomous loops, and human decisions that shaped the final product.

**README** — Include a standard README.md at the root of the repository with setup and run instructions, dependencies, required environment variables, external services, and anything judges need to reproduce the project.

**Demo Video** — Provide a shareable video link, with a maximum duration of 3 minutes. We recommend approximately **90 seconds showing what you built** and **90 seconds showing how you built it**, including your specification, context strategy, orchestration, parallel work, harnesses, autonomous loops, failures, recovery, and key engineering decisions.

**Keep it lightweight. We want evidence of your agentic engineering process, not paperwork.**

