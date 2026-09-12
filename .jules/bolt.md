## 2024-03-24 - [N+1 query in .map]
**Learning:** [Calling Mongoose model functions like countDocuments() within a .map() loop creates significant N+1 query bottlenecks on the backend, increasing DB latency linearly with the number of categories.]
**Action:** [Use a single .aggregate() pipeline with a $group stage to fetch all needed metrics in a single database roundtrip, then map the data in-memory.]
