# PPR Project Governance

This document describes the governance model for the PPR (Programa de Participación Regional) project, part of the LACNet ecosystem.

## Overview

PPR is an open source project maintained by LACNet. We are committed to building a transparent, inclusive, and collaborative community.

## Project Structure

### Roles

#### Users

Anyone who uses PPR. Users are encouraged to:
- Report bugs and request features
- Help other users in community channels
- Spread the word about PPR

#### Contributors

Anyone who contributes to PPR. Contributions include:
- Code (features, bug fixes)
- Documentation
- Design and UX
- Testing
- Translations
- Community support

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to become a contributor.

#### Committers

Contributors who have demonstrated:
- Sustained, high-quality contributions
- Deep understanding of the project architecture
- Alignment with project goals and values

Committers have:
- Write access to the repository
- Ability to review and approve pull requests
- Voice in technical decisions

#### Maintainers

Committers who have shown leadership:
- Long-term commitment to the project
- Excellent technical judgment
- Ability to guide the project direction

Maintainers have:
- Final say on technical decisions
- Ability to release new versions
- Responsibility for project health

### Current Team

| Role | Name | GitHub | Focus Area |
|------|------|--------|------------|
| Lead Maintainer | TBD | @tbd | Overall project direction |
| Maintainer | TBD | @tbd | Backend architecture |
| Maintainer | TBD | @tbd | Frontend & UX |
| Maintainer | TBD | @tbd | DevOps & Infrastructure |

## Decision Making

### Consensus Seeking

Most decisions are made through consensus:

1. **Proposal** - A maintainer or contributor proposes a change
2. **Discussion** - Community discusses in an issue or MR
3. **Revision** - Proposal is updated based on feedback
4. **Decision** - If consensus is reached, the change is accepted

### Voting

For decisions where consensus cannot be reached:

- Each maintainer has one vote
- Decisions require a simple majority
- Voting is open for at least 72 hours
- Results are documented publicly

### Lazy Consensus

For minor decisions (small fixes, documentation updates):

- Changes can be merged after one approval
- If no objection is raised within 24 hours, it's considered approved
- Any maintainer can request formal review

## Technical Direction

### Architecture Decisions

Major architectural changes require:

1. An Architecture Decision Record (ADR)
2. Review by at least two maintainers
3. Public discussion period (minimum 1 week)
4. Documentation of decision and rationale

### Release Process

Releases follow semantic versioning (SemVer):

- **Major** (X.0.0) - Breaking changes
- **Minor** (x.Y.0) - New features, backwards compatible
- **Patch** (x.y.Z) - Bug fixes

Release schedule:
- Regular releases every 4-6 weeks
- Patch releases as needed for critical bugs/security

### Security

Security vulnerabilities are handled privately:

1. Report to [security@lacnet.com](mailto:security@lacnet.com)
2. Maintainers assess and patch
3. Coordinated disclosure after fix is available
4. Public security advisory is published

## Community Guidelines

### Communication Channels

| Channel | Purpose |
|---------|---------|
| GitLab Issues | Bug reports, feature requests |
| GitLab MRs | Code contributions |
| Email List | Announcements, discussions |
| Community Calls | Monthly sync-ups |

### Meetings

- **Community Call**: Monthly, open to all
- **Maintainer Sync**: Bi-weekly, maintainers only
- **Office Hours**: Weekly, for contributor support

Meeting notes are published in the repository wiki.

### Code of Conduct

All participants must adhere to our [Code of Conduct](./CODE_OF_CONDUCT.md). Violations can result in:

1. Warning
2. Temporary ban
3. Permanent ban

Reports go to [conduct@lacnet.com](mailto:conduct@lacnet.com).

## Becoming a Maintainer

### Path to Maintainership

1. **Contribute actively** for at least 6 months
2. **Demonstrate expertise** in your area
3. **Show leadership** in helping others
4. **Nomination** by an existing maintainer
5. **Approval** by majority of maintainers

### Maintainer Responsibilities

Maintainers are expected to:

- Review PRs in a timely manner
- Participate in technical discussions
- Help maintain project health
- Mentor new contributors
- Represent the project professionally

### Stepping Down

Maintainers may step down at any time:

1. Notify other maintainers
2. Help transition responsibilities
3. Maintainer emeritus status is granted

Inactive maintainers (no activity for 6 months) may be asked to step down.

## Relationship with LACNet

PPR is part of the LACNet ecosystem:

- LACNet provides infrastructure and support
- LACNet has final say on trademark/branding
- Technical decisions are made by the community
- LACNet may appoint initial maintainers

## Amendments

This governance document can be amended:

1. Propose changes via merge request
2. Discussion period of at least 2 weeks
3. Approval by 2/3 of maintainers
4. Changes are documented and versioned

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01 | Initial governance document |

---

*This document is inspired by governance models from Apache, Node.js, and Kubernetes projects.*
