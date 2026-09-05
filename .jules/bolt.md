## 2025-09-05 - N+1 Query in Categories API
**Learning:** Found a classic N+1 query problem where getting all categories also fetched product counts for each category one by one. With large category lists, this causes significant database load and high TTFB (Time To First Byte).
**Action:** Replace parallel `countDocuments()` requests with a single MongoDB `$group` aggregation on the Product collection, then map results using an in-memory O(1) Map lookup. Always look for loop-based database queries to optimize into aggregations.
