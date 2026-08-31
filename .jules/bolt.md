## 2024-05-30 - N+1 Query Fix in MongoDB Categories API
**Learning:** Found an N+1 query issue in the `/api/categories` route where fetching product counts executed a database query per category. Replaced it with a single MongoDB `$group` aggregation to collect all product counts efficiently.
**Action:** When gathering related counts across multiple entities in MongoDB, always use an aggregation framework like `$group` instead of iterating and counting individually to maintain O(1) query complexity.
