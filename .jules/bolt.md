## 2024-10-18 - Mongoose N+1 Query Bottleneck Resolution
**Learning:** Found an N+1 query issue in `routes/categories.ts` where a loop was being used to fetch product counts per category, causing multiple DB round-trips. Running `countDocuments()` inside a `.map()` or `.forEach()` in MongoDB significantly impacts performance as the database scales.
**Action:** When aggregating related data across multiple documents, use a single `.aggregate()` pipeline with a `$group` stage to fetch all needed counts in one database round-trip, then map the results in memory.
