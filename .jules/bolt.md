## 2024-05-25 - [Testing N+1 Categories API Optimization]
**Learning:** Found N+1 query problem in `/api/categories` endpoint where it counts products per category dynamically in a loop.
**Action:** Replace `Promise.all` with a single aggregation pipeline using `$lookup` and `$group` or a `$facet` approach to aggregate product counts.
