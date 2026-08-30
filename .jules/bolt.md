## 2026-08-30 - N+1 Query in Category Route
**Learning:** The `GET /api/categories` endpoint originally used an N+1 query loop using `Product.countDocuments` inside `Promise.all` which caused performance degradation on fetching categories.
**Action:** Used `Product.aggregate` to compute product counts with a single group query in `routes/categories.ts`, followed by mapping the results in memory using a fast lookup `Map`. This optimization significantly improved the performance from O(N) to O(1) database queries.
