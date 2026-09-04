## 2024-05-18 - Replacing N+1 DB queries with Aggregation
**Learning:** The `/api/categories` endpoint in this Express/Mongoose app had an N+1 query problem where it used `Promise.all` and executed `Product.countDocuments()` for every category inside a map function. In highly nested or list-heavy apps, this architecture suffers significant latency.
**Action:** Use MongoDB `$group` aggregation (e.g., `Product.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }])`) and construct a Map in-memory to reduce queries from O(N) to exactly 2 queries. Avoid `.map` database queries.
