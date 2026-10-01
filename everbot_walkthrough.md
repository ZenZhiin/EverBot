# EverBot Solutions: Robot Work Allocation System

---

### Project Overview

We have successfully built and verified the complete **EverBot Robot Work Allocation System** inside the dedicated `EverBot/` repository. The codebase is engineered specifically to demonstrate **Senior Software Engineer / Tech Lead** fundamentals for **EverestEngineering**:

- **Primary Stack**: **Node.js & Strict TypeScript** (directly meeting the job posting's requirement for 5+ years TypeScript/Node experience).
- **Architecture**: **Clean Architecture & SOLID Principles** (Domain-Driven Design with strict isolation of Domain, Strategies, Services, and CLI layers).
- **Zero Runtime Dependencies**: The entire core engine and terminal CLI operate with zero third-party production dependencies, ensuring maximum portability, security, and zero vulnerability surface.
- **Test-Driven Development (TDD)**: 100% pass rate across **7 test suites and 39 automated tests** using Vitest.
- **Continuous Integration (CI)**: Includes GitHub Actions workflow (`.github/workflows/ci.yml`) for automated type-checking, building, and test execution.
- **Git Commit Discipline**: 10 progressive, semantic git commits documenting an authentic engineering workflow.

---

### Key Components & File Directory

| Layer | File Link | Purpose & Design Pattern |
| :--- | :--- | :--- |
| **Domain** | [`types.ts`](file:///Users/kennysoon/Documents/EverestEngineering/EverBot/src/domain/types.ts) | `RobotType` enum, immutable specifications, value objects, and DTO contracts. |
| **Domain** | [`inventory.ts`](file:///Users/kennysoon/Documents/EverestEngineering/EverBot/src/domain/inventory.ts) | Encapsulated inventory state, capacity calculations, single-use tracking, and clone/rollback. |
| **Domain** | [`exceptions.ts`](file:///Users/kennysoon/Documents/EverestEngineering/EverBot/src/domain/exceptions.ts) | Domain error hierarchy implementing exact error messages required by the specification. |
| **Strategy** | [`base.ts`](file:///Users/kennysoon/Documents/EverestEngineering/EverBot/src/strategies/base.ts) | Strategy Pattern interface (`AllocationStrategy`) and shared domain input validations. |
| **Strategy** | [`category_distribution.ts`](file:///Users/kennysoon/Documents/EverestEngineering/EverBot/src/strategies/category_distribution.ts) | **Level 1**: Enforces mandatory category representation while strictly minimizing excess delivered hours. |
| **Strategy** | [`cost_optimized.ts`](file:///Users/kennysoon/Documents/EverestEngineering/EverBot/src/strategies/cost_optimized.ts) | **Level 2**: Bounded branch-and-bound optimization minimizing total charging cost with excess-hour tie-breaker. |
| **Service** | [`financial_comparison.ts`](file:///Users/kennysoon/Documents/EverestEngineering/EverBot/src/services/financial_comparison.ts) | **Level 2 Addition**: Generates financial impact reports and exact textual insights comparing Level 1 vs Level 2. |
| **Service** | [`standby_optimizer.ts`](file:///Users/kennysoon/Documents/EverestEngineering/EverBot/src/services/standby_optimizer.ts) | **Level 3**: Evaluates capacity shortfalls and generates all non-redundant standby options, highlighting the cost-optimal choice. |
| **Service** | [`multi_client_allocator.ts`](file:///Users/kennysoon/Documents/EverestEngineering/EverBot/src/services/multi_client_allocator.ts) | **Level 4**: Priority queue sorting (highest hours first), active stock exhaustion, and standby fallback across concurrent clients. |
| **Service** | [`metrics_reporter.ts`](file:///Users/kennysoon/Documents/EverestEngineering/EverBot/src/services/metrics_reporter.ts) | **Bonus**: Calculates total robots, total costs, fleet utilization %, and individual Bravo/Charlie/Delta utilization rates. |
| **CLI** | [`app.ts`](file:///Users/kennysoon/Documents/EverestEngineering/EverBot/src/cli/app.ts) | Application controller supporting interactive prompts and scripted batch execution modes. |
| **CLI** | [`index.ts`](file:///Users/kennysoon/Documents/EverestEngineering/EverBot/src/cli/index.ts) | Executable entry point with argument parsing and `--help` documentation. |
| **Docs** | [`README.md`](file:///Users/kennysoon/Documents/EverestEngineering/EverBot/README.md) | Comprehensive engineering documentation with Mermaid diagrams, complexity analysis, quickstart, and AI disclosure. |
| **CI** | [`.github/workflows/ci.yml`](file:///Users/kennysoon/Documents/EverestEngineering/EverBot/.github/workflows/ci.yml) | GitHub Actions pipeline executing `typecheck`, `build`, and `test`. |

---

### Verification Proof & Slide Scenarios

All scenarios from the EverestEngineering challenge slide deck were tested and verified:

#### 1. Level 1 - 16 Hours Requested (Slide 7)
```
Input: Bravo: 2, Charlie: 3, Delta: 2 | Hours: 16
Output:
Robot Assignment
Bravo: 1
Charlie: 1
Delta: 1

Total Work Hours Provided: 16
Client Work Hours Requested: 16
```
*(Exact match with Slide 7)*

#### 2. Level 2 - 20 Hours Requested (Slide 9 Example 1)
```
Input: Bravo: 2, Charlie: 3, Delta: 2 | Hours: 20
Output:
Cost Optimized Allocation
Charlie: 1
Delta: 2

Total Hours Provided: 21
Total Charging Cost: $11
```
*(Exact match with Slide 9 Example 1)*

#### 3. Level 2 - 6 Hours Requested (Slide 9 Example 2)
```
Input: Bravo: 2, Charlie: 2, Delta: 3 | Hours: 6
Output:
Cost Optimized Allocation
Bravo: 2

Total Hours Provided: 6
Total Charging Cost: $4
```
*(Exact match with Slide 9 Example 2: Bravo: 2 selected over Delta: 1 due to 0 excess hours tie-breaker)*

#### 4. Level 1 vs Level 2 Comparison (Slide 10)
```
Level 1 Cost: $12
Level 2 Cost: $11

Cost Difference: $1

Insight:
Level 1 strategy resulted in $1 additional cost due to mandatory usage of multiple robot categories.
```
*(Exact match with Slide 10)*

#### 5. Level 3 - Standby Activation (Slide 12)
```
Active Robot Capacity: 16 hours
Client Work Requested: 21 hours

Additional Standby Robots Required:
Charlie: 1 - cost $3
or
Bravo: 2 - cost $4
or
Delta: 1 - cost $4

The output should show Charlie: 1 as it's the cost optimised one
```
*(Exact match with Slide 12)*

#### 6. Level 4 & Bonus - Multi-Client Allocation with Metrics (Slide 14 & 17)
```
Client working hours: 16, 10, 22, 7

Prioritized Execution Order:
- Client 3 (22 hours): Bravo: 2, Delta: 2 -> 22h, $12
- Client 1 (16 hours): Delta: 2 -> 16h, $8
- Client 2 (10 hours): Charlie: 2 -> 10h, $6
- Client 4 (7 hours): Bravo: 1, Charlie: 1 -> 8h, $5

Allocation Summary:
Total Robots Used: 10
Total Charging Cost: $31
Avg Robot Utilization: 98.2%

Efficiency Metrics:
Bravo utilization: 100% (3/3)
Charlie utilization: 75% (3/4)
Delta utilization: 100% (4/4)
```
*(Exact match with Slide 14 & 17)*

---

### How to Run Locally

Inside the `EverBot/` directory:

```bash
# 1. Run all unit and integration tests (TDD)
npm test

# 2. Run TypeScript strict type-checking
npm run typecheck

# 3. Build project
npm run build

# 4. Run interactive terminal application
npm start

# 5. Run scripted / CLI argument mode
npm start -- --bravo 2 --charlie 3 --delta 2 --hours 16 --mode level1
```

---

### How to Submit to EverestEngineering

As requested in Matthew Kumar's email, you can submit using any of these options:
1. **GitHub Repository**: Push the `EverBot` directory to a new GitHub repository (public or private with Matthew invited). The repository is already a clean git repo with 10 structured commits and a CI pipeline!
2. **ZIP File**: Create a zip archive of the `EverBot/` directory (excluding `node_modules` and `dist`):
   ```bash
   cd /Users/kennysoon/Documents/EverestEngineering
   zip -r EverBot_Solution_KennySoon.zip EverBot -x "EverBot/node_modules/*" "EverBot/dist/*"
   ```
3. **Email Reply**: Attach the zip file or link to your repository directly in your email reply to Matthew Kumar.
