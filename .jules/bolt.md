## 2024-05-18 - Mongoose N+1 Query Optimization
**Learning:** Mapping over database results to perform individual `countDocuments()` queries creates severe N+1 bottlenecks.
**Action:** Replace multiple count queries within loops with a single `.aggregate([{ $group: ... }])` call and use an in-memory `Map` for fast O(1) lookups.
