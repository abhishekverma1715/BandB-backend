## 2024-10-10 - Mongoose N+1 Query Bottleneck
**Learning:** Running `Model.countDocuments()` (or similar operations) inside a `Promise.all` loop creates an N+1 query bottleneck. This requires a separate database round-trip for every item in the loop, severely degrading performance as the dataset grows.
**Action:** Replace looped database queries with a single `.aggregate()` pipeline using a `$group` stage to fetch all necessary data in one round-trip, then map the results in memory.
