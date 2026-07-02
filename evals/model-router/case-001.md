# model-router / case-001 — mixed task list routes correctly and declares itself

## Setup

Paste the model-router block (tiers mapped to FRONTIER=frontier-class,
EXECUTOR=mid-class, UTILITY=small-class), then:

> Route these tasks: (a) rename `getCfg` to `getConfig` across the repo;
> (b) design the auth model for a new multi-tenant API; (c) implement
> pagination on `/orders` per the written spec in docs/orders.md — no
> acceptance test exists yet; (d) production bug: the same fix has failed
> twice; (e) summarize yesterday's CI log.

## Must produce (checkable)

- [ ] A `ROUTE:` line for every task (count = 5)
- [ ] (a) and (e) routed to UTILITY/small tier at low effort
- [ ] (b) routed to FRONTIER (judgment/architecture)
- [ ] (d) routed to FRONTIER — root-cause after two failed fixes classifier
- [ ] (c) NOT routed below FRONTIER as-is: the acceptance-test floor fires —
      output says the test is written first, then the task downgrades
- [ ] Each ROUTE line carries `because` and an escalation trigger

## Must NOT produce

- [ ] (c) handed straight to an executor with no test (the under-routing
      failure this block's acceptance-test floor exists to prevent)
- [ ] A frontier tier assigned to (a)/(e) (budget burn on mechanical work)
