```markdown
# SnapShare Photo App Scaling Plan

## 1. Assumptions

SnapShare is a photo-sharing application where users upload photos and view a feed containing photos from people they follow.

The following assumptions are based on the facts provided:

- There are 10 million registered users.
- 10% of registered users are active each day.
- Each daily active user uploads 1 photo per day.
- Each daily active user views 50 feed pages per day.
- The average original photo size is 2 MB.
- Each photo also has a 50 KB thumbnail.
- A day has 86,400 seconds.
- A year is assumed to have 365 days.
- For peak traffic, I will use 5 times the average traffic.
- The calculations below represent average traffic over a full day. Real traffic would be uneven throughout the day.

### Daily Active Users

10% of 10 million users are active each day:

10,000,000 × 10% = 1,000,000 daily active users.

Therefore, SnapShare has approximately **1 million daily active users**.

---

## 2. Traffic and Storage Estimates

### Uploads Per Second

Each daily active user uploads 1 photo per day.

Daily uploads:

1,000,000 × 1 = 1,000,000 photos per day.

There are 86,400 seconds in a day.

Average uploads per second:

1,000,000 ÷ 86,400 ≈ 11.57 uploads per second.

Therefore, the average upload rate is approximately **12 uploads per second**.

Using the 5× peak assumption:

11.57 × 5 ≈ 57.87 uploads per second.

Therefore, peak uploads are approximately **58 uploads per second**.

---

### Feed Views Per Second

Each daily active user views 50 feed pages per day.

Daily feed views:

1,000,000 × 50 = 50,000,000 feed pages per day.

Average feed views per second:

50,000,000 ÷ 86,400 ≈ 578.70 feed views per second.

Therefore, the average feed traffic is approximately **579 feed views per second**.

Using the 5× peak assumption:

578.70 × 5 ≈ 2,893.5.

Therefore, peak feed traffic is approximately **2,894 feed views per second**.

---

### Photo Storage Per Year

Each uploaded photo has:

- Original photo = 2 MB
- Thumbnail = 50 KB

Assuming 1 MB = 1,000 KB:

2 MB = 2,000 KB.

Total storage per photo:

2,000 KB + 50 KB = 2,050 KB.

There are 1,000,000 uploads per day.

Daily photo storage:

1,000,000 × 2 MB = 2,000,000 MB

This is approximately:

2,000 GB = 2 TB of original photos per day.

The thumbnails add approximately:

1,000,000 × 50 KB = 50,000,000 KB
≈ 50 GB per day.

Therefore, total daily photo storage is approximately:

2 TB + 50 GB = 2.05 TB per day.

For one year:

2.05 TB × 365 ≈ 748.25 TB.

Therefore, SnapShare would require approximately **748 TB of storage per year** for original photos and thumbnails.

This estimate does not include database storage, backups, replication, metadata, or other infrastructure overhead.

---

## 3. Read-Heavy or Write-Heavy?

SnapShare is a **read-heavy system**.

The application receives approximately:

- 12 uploads per second on average.
- 579 feed views per second on average.

Feed views are therefore much more frequent than photo uploads.

This means the architecture should be designed primarily to handle a large number of read requests. Caching, CDNs, database read replicas, and scalable app servers can reduce the load on the main database and application servers.

---

## 4. Why Photos Should Not Be Stored in the Database

The actual photo files should not be stored directly inside the database because photos are large binary files and storing millions of them would make the database much larger and harder to manage.

Instead, the original photos and thumbnails should be stored in **object storage**.

The database should store metadata such as:

- Photo ID
- User ID
- Photo URL or object-storage key
- Upload time
- Caption
- Thumbnail location

Object storage is better suited for large files because it is designed to store and retrieve large amounts of unstructured data and can scale to very large storage requirements.

A CDN can then cache and deliver frequently requested photos and thumbnails closer to users.

---

## 5. SnapShare Architecture Diagram

```text
                         ┌───────────────────┐
                         │      Users        │
                         │ Mobile / Web App  │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │       CDN         │
                         │ Photos / Thumbs   │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │  Load Balancer    │
                         └─────────┬─────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
              ┌──────────┐   ┌──────────┐   ┌──────────┐
              │App Server│   │App Server│   │App Server│
              │    1     │   │    2     │   │    3     │
              └────┬─────┘   └────┬─────┘   └────┬─────┘
                   │              │              │
                   └──────────────┼──────────────┘
                                  │
                       ┌──────────┴──────────┐
                       │                     │
                       ▼                     ▼
                ┌─────────────┐       ┌──────────────┐
                │    Cache    │       │   Database   │
                │ Redis/etc.  │       │    Primary   │
                └─────────────┘       └──────┬───────┘
                                             │
                                             ▼
                                      ┌──────────────┐
                                      │ Read Replica │
                                      └──────────────┘


Photo Upload Path
─────────────────

              ┌───────────────┐
              │  App Server   │
              └───────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │ Object Storage│
              │ Original Photo│
              └───────┬───────┘
                      │
                      │
                      ▼
                 ┌─────────┐
                 │  Queue  │
                 └────┬────┘
                      │
                      ▼
                 ┌─────────┐
                 │ Worker  │
                 │Thumbnail│
                 └────┬────┘
                      │
                      ▼
              ┌───────────────┐
              │ Object Storage│
              │   Thumbnail   │
              └───────────────┘
```

---

## 6. Component Responsibilities

### CDN

The CDN delivers frequently requested photos and thumbnails from locations closer to users, reducing latency and application-server traffic.

### Load Balancer

The load balancer distributes incoming requests across multiple application servers so that one server does not become overloaded.

### App Servers

The application servers handle business logic such as authentication, uploads, feed generation, user relationships, and API requests.

### Cache

The cache stores frequently requested information such as popular feed data or user information so that the application does not need to query the database for every request.

### Database

The primary database stores structured application data such as users, follows, photo metadata, captions, and relationships.

### Read Replica

The read replica handles read queries separately from the primary database, reducing the load on the primary database in this read-heavy system.

### Object Storage

Object storage stores the large original photo files and thumbnails instead of putting the files directly into the database.

### Queue

The queue stores background jobs that need to be processed asynchronously, such as thumbnail generation.

### Worker

The worker takes thumbnail jobs from the queue, creates smaller versions of uploaded photos, and stores the thumbnails in object storage.

---

## 7. Photo Upload Flow

When a user uploads a photo, the process would work as follows:

1. The user selects a photo in the SnapShare application.

2. The application sends the upload request to the load balancer.

3. The load balancer sends the request to one of the available application servers.

4. The application server authenticates the user and validates the uploaded photo.

5. The original photo is stored in object storage rather than inside the database.

6. The application stores the photo metadata in the database, including the user ID and object-storage location.

7. The application creates a thumbnail-generation job.

8. The job is placed into the queue.

9. A background worker takes the job from the queue.

10. The worker downloads or accesses the original photo from object storage.

11. The worker creates a smaller thumbnail version.

12. The worker stores the thumbnail in object storage.

13. The thumbnail location is recorded with the photo metadata.

14. When users view their feed, the CDN can deliver the thumbnail or photo efficiently.

This approach allows thumbnail processing to happen in the background without making the user wait for the thumbnail to be created before the upload process can finish.

---

## 8. Scaling Trade-offs

### Trade-off 1: Cache Performance vs Data Freshness

Using a cache improves performance and reduces database load, but cached information can become outdated.

For example, a user's feed may contain cached information that does not immediately reflect a new post. A suitable cache expiration or invalidation strategy would therefore be required.

### Trade-off 2: Read Replicas vs Consistency

Using database read replicas allows the system to handle more read traffic, but replicas can sometimes lag behind the primary database.

This means a user may briefly read older information after a write.

### Trade-off 3: Asynchronous Thumbnail Processing vs Immediate Results

Using a queue and background worker improves upload performance because thumbnail generation does not block the upload request.

However, the thumbnail may not be available immediately after the photo is uploaded because it must wait for the worker to process the job.

### Trade-off 4: Object Storage and CDN Cost vs Performance

Object storage and a CDN provide good scalability and fast photo delivery, but they introduce additional infrastructure and usage costs.

The improved performance and scalability would be valuable for a photo-sharing application with millions of users.

---

## 9. Conclusion

SnapShare should use a distributed architecture because it needs to support approximately 1 million daily active users, around 12 photo uploads per second on average, and around 579 feed views per second on average.

Because the application is read-heavy, the design should focus on caching, CDN delivery, load balancing, and database read replicas.

Original photos and thumbnails should be stored in object storage, while the database should store photo metadata. A queue and background worker should handle thumbnail generation so that uploads remain fast and scalable.
```

### Final checks before pushing

Your `day7` folder should contain:

```text
web-foundations-days/
└── day7/
    └── photo-app-scaling.md
```

The important calculations are:

| Metric | Average | Peak (5×) |
|---|---:|---:|
| Daily active users | 1,000,000 | — |
| Photo uploads/sec | ~12 | ~58 |
| Feed views/sec | ~579 | ~2,894 |
| Storage/year | ~748.25 TB | — |

Then run:

```bash
git add day7/
git commit -m "Day 7 assignment"
git push origin main
```

This covers **all nine instructions** in the assignment, including the required architecture components, calculations, upload flow, and trade-offs.