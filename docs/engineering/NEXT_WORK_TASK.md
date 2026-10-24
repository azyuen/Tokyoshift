# Next Work task — updated 24 October 2026

Prepare an integrated, playable vehicle engineering build using the latest main branch, preserving all existing gameplay and save compatibility. Test it before deployment.

This user-directed priority supersedes further isolated class/outlier refinement as the next task. Continue from engineering/vehicle-balance-20261015 and its preserved evidence; do not restart research or repeat unaffected simulations.

1. Fetch current main again, preserve outstanding work and integrate on a development branch. Last inspected main was 908979f (R676); engineering previously incorporated main only through c3819c9.
2. Preserve newer gameplay, assets, character assignments, recruitment flows, reversible stock/tuned services, profile/garage ownership and purchased upgrades. Explicitly reconcile the R676 ±40 kW recruitment rule with this branch's fixed stock classes; do not silently overwrite newer behavior.
3. Produce a playable integrated build. Run relevant regression and save-migration tests, then browser checks for startup/profile loading, garage, tuning, dyno, recruitment and racing. Distinguish automated validation from actual browser testing.
4. Resolve confirmed integration failures before deployment. Preserve a tested branch and document any remaining blocker. Existing instructions against merging engine work into main or deploying before full validation remain in force.

Latest completed engineering implementation: a3b2ab2. Core results, AI evidence and browser checks are described in STATUS.md increment 12. Class sensitivity work started afterward is preserved alongside this task; it is not a reason to postpone integration indefinitely. No integration or deployment is claimed by this task update.
