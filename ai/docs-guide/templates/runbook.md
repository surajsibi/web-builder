<!-- Template: apply the universal manifest in ../01-documentation-standard.md
with type O1 and the applicable R2/R3 risk tier. -->
# Runbook: <Operational outcome>

> Apply the [universal manifest](../01-documentation-standard.md#42-manifest)
> with `type: O1` and the applicable R2/R3 risk tier.

## Trigger, scope, and authorization

<When to use/not use, environments/versions, required role and approval.>

## Hazards and stop conditions

<Data loss, outage, security, financial/safety risks; conditions requiring
escalation instead of action.>

## Preconditions

- <Backup/recovery point verified>
- <Target identity and blast radius verified>
- <Dependencies and access verified>
- <Monitoring and communication ready>

## Observability

<Dashboards, logs, queries, expected healthy/bad signals.>

## Procedure

| Step | Action | Expected evidence | If unexpected |
| --- | --- | --- | --- |
| 1 | <exact scoped action> | <output/signal> | Stop/rollback/escalate |

## Success verification

<Independent checks and observation window.>

## Rollback or containment

<Exact safe reversal, rollback limit, recovery verification.>

## Escalation and communication

<On-call/incident path, stakeholders, evidence to include.>

## Exercise record

<Last representative test, environment, result, limitations, next trigger.>

## Cleanup and follow-up

<Temporary access/data, actions, postmortem or document updates.>
