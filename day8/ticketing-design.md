# TicketHub System Design

## 1. Requirements

TicketHub is a website that allows users to browse concerts and events, view available seats, temporarily hold seats, purchase tickets, and view their purchased tickets.

### Functional Requirements

The system should allow users to:

1. Register and log in.
2. Browse upcoming concerts and events.
3. View event details such as name, date, venue, and ticket prices.
4. View the seating arrangement and available seats for an event.
5. Temporarily hold one or more seats before payment.
6. Pay for held seats.
7. Receive a confirmed order after successful payment.
8. View their purchased tickets.
9. Prevent two users from purchasing the same seat.
10. Release seats automatically when a hold expires without payment.

### Non-Functional Requirements

#### Speed

Normal browsing requests should normally respond within about 1–2 seconds. Seat availability should be updated quickly so users see accurate information during a sale.

#### Correctness

The system must never sell the same seat to two different users. Seat holds, payments, and order creation must be handled using reliable database transactions.

#### Fairness

During a popular concert sale, users should have a fair opportunity to obtain tickets. The system should use a queue or controlled admission system instead of allowing unlimited users to directly overload the ticket-purchasing service.

#### Availability

TicketHub should remain available during major ticket sales. Multiple application servers and redundant infrastructure should prevent one server failure from taking down the whole service.

#### Security

Passwords and payment information must be protected. Authentication and authorization must be required for purchasing and viewing personal tickets.

#### Scalability

The architecture should support normal traffic as well as sudden traffic spikes when a highly popular concert goes on sale.

---

# 2. Traffic and Capacity Estimates

TicketHub has:

- 2,000,000 registered users
- 50,000 visitors on a normal day
- Each visitor views 10 pages
- 5,000 tickets sold on a normal day
- A popular concert has 200,000 people attempting to buy 20,000 seats in the first 10 minutes

## Normal Traffic

There are:

50,000 visitors × 10 pages = 500,000 page views per day.

Average page requests per second:

500,000 ÷ 86,400 ≈ 5.8 requests/second.

Therefore, normal traffic is approximately **6 page requests per second on average**.

For planning, TicketHub should support a higher peak than the daily average. If the normal peak is approximately 5 times the average:

6 × 5 = 30 requests/second.

The system should therefore comfortably support at least about **30 requests per second during normal peak periods**.

There are also 5,000 tickets sold per day:

5,000 ÷ 86,400 ≈ 0.058 ticket purchases/second on average.

Ticket purchasing is therefore much less frequent than browsing during normal traffic.

## Big Sale Traffic

During the popular concert sale:

200,000 people attempt to buy tickets in 10 minutes.

10 minutes = 600 seconds.

Therefore:

200,000 ÷ 600 ≈ 333 purchase attempts/second.

This is about:

333 ÷ 6 ≈ 55 times the normal average page traffic.

The biggest difference is that the big sale creates a very large number of concurrent users trying to perform operations involving the same 20,000 seats.

The system therefore needs special protection for the sale, including a waiting room or queue, rate limiting, caching, and strong database transactions.

### Comparison

| Metric | Normal Day | Popular Concert Sale |
|---|---:|---:|
| Visitors/attempting users | 50,000/day | 200,000 in 10 minutes |
| Page views | 500,000/day | Very high concentrated traffic |
| Average page requests | ~6/sec | ~333 purchase attempts/sec |
| Tickets | 5,000/day | 20,000 seats |
| Main challenge | General availability | Concurrency and fairness |

---

# 3. API Design

TicketHub can expose a REST API.

| Method | Endpoint | Purpose | Success |
|---|---|---|---|
| GET | `/api/events` | Browse upcoming events | 200 OK |
| GET | `/api/events/{event_id}` | View event details | 200 OK |
| GET | `/api/events/{event_id}/seats` | View seats and availability | 200 OK |
| POST | `/api/events/{event_id}/holds` | Temporarily hold selected seats | 201 Created |
| POST | `/api/orders` | Pay for held seats and create an order | 201 Created |
| GET | `/api/orders/{order_id}` | View order details | 200 OK |
| GET | `/api/tickets` | View the user's tickets | 200 OK |

### Example: Browse Events

```http
GET /api/events
```

Response:

```json
{
  "events": [
    {
      "id": 101,
      "name": "Summer Music Festival",
      "venue": "Nairobi Arena",
      "date": "2026-12-20"
    }
  ]
}
```

### Example: View Seats

```http
GET /api/events/101/seats
```

Response:

```json
{
  "event_id": 101,
  "seats": [
    {
      "id": 501,
      "section": "A",
      "number": "A01",
      "status": "available"
    },
    {
      "id": 502,
      "section": "A",
      "number": "A02",
      "status": "held"
    }
  ]
}
```

### Example: Hold Seats

```http
POST /api/events/101/holds
```

Request:

```json
{
  "seat_ids": [501, 502]
}
```

Response:

```json
{
  "hold_id": 9001,
  "expires_at": "2026-12-20T18:10:00Z"
}
```

The hold should expire automatically after a short period, such as 10 minutes.

### Example: Payment

```http
POST /api/orders
```

Request:

```json
{
  "hold_id": 9001,
  "payment_method": "mobile_money"
}
```

Response:

```json
{
  "order_id": 7001,
  "status": "confirmed"
}
```

### Example: View Tickets

```http
GET /api/tickets
```

Response:

```json
{
  "tickets": [
    {
      "ticket_id": 8001,
      "event_id": 101,
      "seat_id": 501,
      "order_id": 7001
    }
  ]
}
```

---

# 4. Data Model

TicketHub uses a relational database because ticket purchasing requires strong consistency, transactions, foreign keys, and uniqueness constraints.

## Users

| Column | Type | Key |
|---|---|---|
| user_id | INTEGER | Primary Key |
| name | VARCHAR(100) | |
| email | VARCHAR(255) | UNIQUE |
| password_hash | VARCHAR(255) | |
| created_at | TIMESTAMP | |

## Events

| Column | Type | Key |
|---|---|---|
| event_id | INTEGER | Primary Key |
| name | VARCHAR(200) | |
| venue | VARCHAR(200) | |
| event_date | TIMESTAMP | |
| created_at | TIMESTAMP | |

## Seats

| Column | Type | Key |
|---|---|---|
| seat_id | INTEGER | Primary Key |
| event_id | INTEGER | Foreign Key |
| section | VARCHAR(50) | |
| seat_number | VARCHAR(50) | |
| price | DECIMAL(10,2) | |

Each event has many seats, so there is a one-to-many relationship between `events` and `seats`.

## Orders

| Column | Type | Key |
|---|---|---|
| order_id | INTEGER | Primary Key |
| user_id | INTEGER | Foreign Key |
| event_id | INTEGER | Foreign Key |
| seat_id | INTEGER | Foreign Key |
| status | VARCHAR(30) | |
| amount | DECIMAL(10,2) | |
| created_at | TIMESTAMP | |

A user can have many orders. An event can have many orders. Each confirmed order is associated with a seat.

### Relationships

```text
Users
  |
  | 1-to-many
  v
Orders
  |
  | many-to-one
  v
Events
  |
  | 1-to-many
  v
Seats
```

For a production system, separate `order_items` or `tickets` tables could be added to allow one order to contain multiple seats. The simplified model above focuses on the core design.

---

# 5. Preventing Double-Booking

Preventing two people from buying the same seat is the most important correctness requirement in TicketHub.

The system should use **database transactions, row-level locking, and unique constraints**.

When a user requests a seat hold:

1. Start a database transaction.
2. Lock the requested seat row.
3. Check whether the seat is already held or sold.
4. If the seat is available, create the hold.
5. Mark the seat as held.
6. Commit the transaction.
7. If the seat is already unavailable, reject the request.

The database transaction ensures that two requests cannot successfully modify the same seat at exactly the same time.

A simplified SQL constraint can also help:

```sql
CREATE UNIQUE INDEX unique_event_seat
ON seats(event_id, seat_number);
```

This prevents the same physical seat number from being duplicated within an event.

For the actual purchase, the system should also maintain a unique record for a confirmed seat assignment. For example:

```sql
CREATE UNIQUE INDEX unique_confirmed_seat
ON tickets(event_id, seat_id)
WHERE status = 'confirmed';
```

The exact syntax depends on the database system.

### Example Transaction

```sql
BEGIN;

SELECT *
FROM seats
WHERE seat_id = 501
FOR UPDATE;

-- Check that the seat is still available.

UPDATE seats
SET status = 'held'
WHERE seat_id = 501
  AND status = 'available';

-- Create the temporary hold.

COMMIT;
```

The `FOR UPDATE` lock prevents another transaction from changing that seat until the current transaction finishes.

During payment, the system performs another transaction to verify that the hold belongs to the user and has not expired before changing it into a confirmed purchase.

This combination of **transactions + row locking + database constraints** provides protection against double-booking even when thousands of users are attempting to buy tickets simultaneously.

---

# 6. System Architecture

```text
                         Users
                           |
                           v
                    +-------------+
                    |     DNS     |
                    +-------------+
                           |
                           v
                    +-------------+
                    |     CDN     |
                    +-------------+
                           |
                           v
                 +-------------------+
                 | Load Balancer     |
                 +-------------------+
                    /       |       \
                   /        |        \
                  v         v         v
          +---------+ +---------+ +---------+
          | App 1   | | App 2   | | App 3   |
          +---------+ +---------+ +---------+
               \         |         /
                \        |        /
                 v       v       v
                  +-------------+
                  |    Cache    |
                  +-------------+
                        |
              +---------+---------+
              |                   |
              v                   v
       +-------------+      +-------------+
       | Primary DB  |----->| Read Replica|
       +-------------+      +-------------+
              |
              v
       +-------------+
       | Queue       |
       +-------------+
              |
              v
       +-------------+
       | Workers     |
       +-------------+
```

### Components

**Users:** Customers access TicketHub through web or mobile browsers.

**DNS:** Directs users to the TicketHub service.

**CDN:** Caches static content such as images, CSS, JavaScript, and event artwork.

**Load Balancer:** Distributes requests across multiple application servers.

**Application Servers:** Process authentication, event browsing, seat holds, orders, and ticket requests.

**Cache:** Stores frequently accessed event and seat information to reduce database reads.

**Primary Database:** Handles transactions and writes such as seat holds and confirmed purchases.

**Read Replica:** Handles read-heavy operations such as browsing events and viewing non-changing information.

**Queue:** Controls large bursts of purchase requests and helps create a fair waiting line during major sales.

**Workers:** Process background tasks such as notifications, expired holds, emails, and payment-related jobs.

---

# 7. Handling the Big Sale

When the popular concert goes on sale, 200,000 users may attempt to purchase 20,000 seats in only 10 minutes.

TicketHub should not allow all 200,000 users to directly perform expensive database operations at the same time.

Instead, users first enter a **virtual waiting room**.

The queue controls how many users can proceed to the purchasing system at once. This improves fairness and protects the database from an uncontrolled traffic spike.

Event information can be cached because thousands of users may request the same event details.

Seat availability must be handled more carefully because it changes frequently. Seat holds and purchases go through the transactional primary database.

Multiple application servers allow the system to continue operating if one server fails.

The read replica handles suitable read operations, while the primary database remains responsible for authoritative seat changes.

---

# 8. Trade-Offs

## Trade-Off 1: Strong Consistency vs Performance

Using transactions and database locks provides strong correctness and prevents double-booking. However, locking rows can reduce throughput when many users compete for the same seats.

TicketHub accepts this performance cost because selling the same seat twice would be much worse than slightly slower purchasing.

## Trade-Off 2: Queue Fairness vs User Experience

A waiting room protects the system and creates a fairer purchasing process, but users may have to wait before accessing tickets.

Without a queue, users might experience server failures or extremely slow responses during a popular sale.

TicketHub therefore sacrifices some immediate access in exchange for reliability and fairness.

## Trade-Off 3: Cache Performance vs Freshness

Caching event information improves performance and reduces database load. However, cached seat information can become outdated.

For this reason, cached data should never be treated as the final authority when purchasing a seat. The primary transactional database must perform the final availability check.

---

# Conclusion

TicketHub requires a design that prioritizes correctness, fairness, and scalability. Normal traffic is relatively manageable, but a popular concert can create a sudden spike of approximately 200,000 potential buyers.

The combination of a waiting queue, load-balanced application servers, caching, a primary database, read replicas, background workers, and strong database transactions allows TicketHub to handle this spike.

Most importantly, seat purchases are protected using transactions, row-level locking, and database constraints so that two customers cannot successfully purchase the same seat.