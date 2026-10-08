# TicketHub — Event Ticketing System Design

## 1. Requirements

TicketHub is a website that allows users to discover concerts and events, view available seats, reserve seats temporarily, pay for tickets, and view their purchased tickets.

### Functional Requirements

The system must allow users to:

1. Register and log in.
2. Browse upcoming concerts and events.
3. View event details such as name, venue, date, and ticket prices.
4. View the seating arrangement and current seat availability.
5. Temporarily hold one or more available seats.
6. Pay for seats that they have successfully held.
7. Create a confirmed order after successful payment.
8. View their purchased tickets.
9. Cancel or release an expired seat hold.
10. Prevent two customers from purchasing the same seat.

### Non-Functional Requirements

**Speed:** Normal browsing requests should normally respond within about 1–2 seconds. During a major sale, the system should remain responsive even when many users are waiting.

**Correctness:** The system must never sell one seat to two different customers. Seat holds and purchases must use database transactions and constraints rather than relying only on application-level checks.

**Fairness:** During a popular concert sale, users should have a fair opportunity to purchase tickets. A virtual waiting room or queue should control admission instead of allowing unlimited users to compete directly for the database.

**Availability:** The system should continue operating if an individual application server fails.

**Scalability:** The system should handle normal traffic and sudden traffic spikes without requiring a complete redesign.

**Security:** User accounts, authentication information, and payment operations must be protected. Users should only be able to view their own orders and tickets.

---

# 2. Traffic Estimates

The given system facts are:

- 2,000,000 registered users
- 50,000 visitors on a normal day
- Each visitor views 10 pages
- 5,000 tickets sold on a normal day
- A popular concert has 200,000 people attempting to buy 20,000 seats within 10 minutes

## Normal Traffic

Daily page views:

```text
50,000 visitors × 10 pages
= 500,000 page views/day
```

Average page requests per second:

```text
500,000 ÷ 86,400
≈ 5.8 requests/second
```

Therefore, normal traffic averages approximately **6 page requests per second**.

For capacity planning, assume the normal peak is approximately five times the average:

```text
6 × 5 = 30 requests/second
```

TicketHub should therefore comfortably support at least approximately **30 requests per second during normal peak periods**.

Normal ticket sales are:

```text
5,000 ÷ 86,400
≈ 0.058 purchases/second
```

This shows that normal purchasing traffic is much smaller than browsing traffic.

## Popular Concert Sale

The popular concert creates:

```text
200,000 people ÷ 10 minutes
```

Ten minutes equals 600 seconds:

```text
200,000 ÷ 600
≈ 333 purchase attempts/second
```

Therefore, the system may receive approximately **333 purchase attempts per second** during the sale.

Compared with the normal average of approximately 6 page requests per second:

```text
333 ÷ 6
≈ 55.5
```

The sale creates more than **55 times the normal average request pressure**.

However, the most important challenge is not only the request rate. The 200,000 users are competing for only **20,000 seats**, meaning many requests may target the same limited inventory at nearly the same time.

### Traffic Comparison

| Metric | Normal Day | Popular Concert Sale |
|---|---:|---:|
| Users/visitors | 50,000/day | 200,000 in 10 minutes |
| Page views | 500,000/day | Highly concentrated |
| Average request pressure | ~6/sec | ~333 purchase attempts/sec |
| Tickets/seats | 5,000 sold/day | 20,000 seats |
| Main challenge | General performance | Concurrency, fairness, and correctness |

---

# 3. API Design

TicketHub uses a REST-style API.

| Method | Endpoint | Purpose | Success |
|---|---|---|---|
| GET | `/api/events` | Browse upcoming events | 200 OK |
| GET | `/api/events/{event_id}` | View event details | 200 OK |
| GET | `/api/events/{event_id}/seats` | View seat availability | 200 OK |
| POST | `/api/events/{event_id}/holds` | Hold selected seats | 201 Created |
| DELETE | `/api/holds/{hold_id}` | Release a seat hold | 204 No Content |
| POST | `/api/orders` | Complete payment and create order | 201 Created |
| GET | `/api/orders/{order_id}` | View an order | 200 OK |
| GET | `/api/tickets` | View the user's tickets | 200 OK |

## Browse Events

```http
GET /api/events
```

Example response:

```json
{
  "events": [
    {
      "event_id": 101,
      "name": "Summer Music Festival",
      "venue": "Nairobi Arena",
      "event_date": "2026-12-20T18:00:00Z"
    }
  ]
}
```

## View Seats

```http
GET /api/events/101/seats
```

Example response:

```json
{
  "event_id": 101,
  "seats": [
    {
      "seat_id": 501,
      "section": "A",
      "seat_number": "A01",
      "status": "available"
    },
    {
      "seat_id": 502,
      "section": "A",
      "seat_number": "A02",
      "status": "held"
    }
  ]
}
```

## Hold Seats

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

The hold has an expiration time so abandoned checkout sessions do not keep seats unavailable forever.

## Complete Payment

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

## View Tickets

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

TicketHub should use a relational database because ticket sales require transactions, foreign keys, constraints, and strong consistency.

The main tables are:

1. `users`
2. `events`
3. `seats`
4. `orders`
5. `order_items`
6. `seat_holds`

## Users Table

Stores customer accounts.

| Column | Type | Key |
|---|---|---|
| user_id | BIGINT | Primary Key |
| name | VARCHAR(100) | |
| email | VARCHAR(255) | UNIQUE |
| password_hash | VARCHAR(255) | |
| created_at | TIMESTAMP | |

## Events Table

Stores concerts and other events.

| Column | Type | Key |
|---|---|---|
| event_id | BIGINT | Primary Key |
| name | VARCHAR(200) | |
| venue | VARCHAR(200) | |
| event_date | TIMESTAMP | |
| created_at | TIMESTAMP | |

## Seats Table

Stores the seats belonging to each event.

| Column | Type | Key |
|---|---|---|
| seat_id | BIGINT | Primary Key |
| event_id | BIGINT | Foreign Key |
| section | VARCHAR(50) | |
| seat_number | VARCHAR(50) | |
| price | DECIMAL(10,2) | |

A unique constraint on `(event_id, seat_number)` ensures that the same seat number cannot be created twice for the same event.

## Orders Table

Stores completed or pending customer orders.

| Column | Type | Key |
|---|---|---|
| order_id | BIGINT | Primary Key |
| user_id | BIGINT | Foreign Key |
| status | VARCHAR(30) | |
| total_amount | DECIMAL(10,2) | |
| created_at | TIMESTAMP | |

## Order Items Table

Stores the individual seats included in an order.

| Column | Type | Key |
|---|---|---|
| order_item_id | BIGINT | Primary Key |
| order_id | BIGINT | Foreign Key |
| event_id | BIGINT | Foreign Key |
| seat_id | BIGINT | Foreign Key |
| price | DECIMAL(10,2) | |

## Seat Holds Table

Stores temporary reservations.

| Column | Type | Key |
|---|---|---|
| hold_id | BIGINT | Primary Key |
| user_id | BIGINT | Foreign Key |
| event_id | BIGINT | Foreign Key |
| seat_id | BIGINT | Foreign Key |
| expires_at | TIMESTAMP | |
| status | VARCHAR(20) | |

### Relationships

```text
Users
  |
  | 1-to-many
  v
Orders
  |
  | 1-to-many
  v
Order Items
  |
  | many-to-one
  v
Seats
  |
  | many-to-one
  v
Events
```

Seat holds connect users to seats temporarily:

```text
Users ───< Seat Holds >─── Seats ───> Events
```

Therefore:

- One user can have many orders.
- One user can have many seat holds.
- One event has many seats.
- One order has many order items.
- Each order item references a specific event seat.

## Example SQL Schema

```sql
CREATE TABLE users (
    user_id BIGINT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE events (
    event_id BIGINT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    venue VARCHAR(200) NOT NULL,
    event_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE seats (
    seat_id BIGINT PRIMARY KEY,
    event_id BIGINT NOT NULL,
    section VARCHAR(50) NOT NULL,
    seat_number VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (event_id) REFERENCES events(event_id),
    UNIQUE (event_id, seat_number)
);

CREATE TABLE orders (
    order_id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE order_items (
    order_item_id BIGINT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    event_id BIGINT NOT NULL,
    seat_id BIGINT NOT NULL,
    price DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id),
    FOREIGN KEY (seat_id) REFERENCES seats(seat_id)
);

CREATE TABLE seat_holds (
    hold_id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    event_id BIGINT NOT NULL,
    seat_id BIGINT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id),
    FOREIGN KEY (seat_id) REFERENCES seats(seat_id)
);
```

---

# 5. Preventing Double-Booking

The most important correctness problem in TicketHub is preventing two customers from buying the same seat.

An application-level check such as:

```text
if seat is available:
    buy seat
```

is not sufficient.

Two requests could both read the seat as available before either request updates it. This creates a race condition.

TicketHub therefore uses:

- Database transactions
- Row-level locking
- Conditional updates
- Unique constraints
- Temporary seat holds

## Seat Hold Transaction

When a customer requests a seat, the application starts a database transaction.

A simplified example is:

```sql
BEGIN;

SELECT seat_id
FROM seats
WHERE seat_id = 501
FOR UPDATE;
```

`FOR UPDATE` locks the selected row until the transaction completes.

The application then checks whether the seat is already held or sold.

If it is available:

```sql
UPDATE seats
SET status = 'held'
WHERE seat_id = 501
  AND status = 'available';
```

The system then creates the corresponding hold:

```sql
INSERT INTO seat_holds
(
    hold_id,
    user_id,
    event_id,
    seat_id,
    expires_at,
    status
)
VALUES
(
    9001,
    1001,
    101,
    501,
    '2026-12-20 18:10:00',
    'active'
);
```

Finally:

```sql
COMMIT;
```

If another customer attempts to hold the same seat at the same time, that transaction must wait for the lock. When it obtains the lock, it sees that the seat is no longer available and the request is rejected.

## Purchase Transaction

Payment and ticket confirmation must also be handled carefully.

The system should:

1. Start a transaction.
2. Lock the relevant seat/hold record.
3. Verify that the hold belongs to the customer.
4. Verify that the hold has not expired.
5. Confirm the payment.
6. Create the order.
7. Create the order item.
8. Mark the hold as completed.
9. Commit the transaction.

If any important operation fails, the transaction can roll back.

## Database Constraints

The database should also enforce uniqueness.

For example:

```sql
CREATE UNIQUE INDEX unique_event_seat
ON seats(event_id, seat_number);
```

This ensures that a physical seat number cannot be duplicated inside one event.

For confirmed purchases, the application should also enforce that a seat can have only one active confirmed ticket.

The important principle is that **the database is the final authority on seat availability**. The application must never assume that a seat is available merely because an earlier API response said so.

This combination of transactions, row locking, and constraints prevents race conditions and protects TicketHub from double-booking during the 200,000-user sale.

---

# 6. Architecture

```text
                         200,000 Users
                              |
                              v
                         +---------+
                         |   DNS   |
                         +---------+
                              |
                              v
                         +---------+
                         |   CDN   |
                         +---------+
                              |
                              v
                    +-------------------+
                    | Virtual Waiting   |
                    | Room / Queue      |
                    +-------------------+
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
                    |          |          |
                    +----------+----------+
                               |
                    +-------------------+
                    |       Cache       |
                    +-------------------+
                         /           \
                        v             v
              +----------------+   +----------------+
              | Primary DB     |   | Read Replica   |
              | Transactions   |-->| Read Queries   |
              +----------------+   +----------------+
                       |
                       v
                +--------------+
                | Message Queue|
                +--------------+
                       |
                       v
                +--------------+
                | Workers      |
                +--------------+
```

## Architecture Components

### DNS

DNS directs users to the TicketHub service and allows the service to use a stable domain name.

### CDN

The CDN caches static content such as JavaScript, CSS, images, event posters, and other files. This prevents every user from requesting these files from the application servers.

### Virtual Waiting Room

The waiting room is especially important during a popular concert sale. It prevents all 200,000 users from simultaneously entering the purchase system.

It controls how many users are allowed to proceed at a time and creates a fairer purchasing process.

### Load Balancer

The load balancer distributes requests across multiple application servers.

If one application server fails, the other servers can continue handling traffic.

### Application Servers

Application servers handle API requests such as browsing events, viewing seats, creating holds, processing orders, and retrieving tickets.

Multiple servers allow horizontal scaling.

### Cache

Frequently requested data such as event details can be cached to reduce database load.

However, cached seat availability should not be treated as the final authority because seat status can change quickly.

### Primary Database

The primary database handles authoritative writes, including seat holds, orders, and ticket confirmations.

Transactions and row-level locks are performed here.

### Read Replica

The read replica handles suitable read-heavy operations such as event browsing and other queries that do not require the latest transactional state.

This reduces read pressure on the primary database.

### Message Queue

The queue absorbs bursts of work and prevents background operations from overwhelming application servers.

It can also support asynchronous tasks such as sending ticket confirmation messages.

### Workers

Workers consume jobs from the queue and process background tasks such as sending emails, generating ticket documents, and cleaning up expired holds.

---

# 7. Handling the Popular Concert Sale

The 200,000-user sale is the most demanding scenario.

TicketHub handles it using several techniques.

First, users enter a virtual waiting room instead of directly sending unlimited purchase requests to the application servers.

Second, static content is served through the CDN.

Third, multiple application servers operate behind the load balancer.

Fourth, event information can be cached.

Fifth, the primary database remains the authoritative source for seat state.

Sixth, seat holds and purchases use transactions and row-level locks.

Seventh, expired holds are cleaned up so seats return to the available pool.

The 20,000 seats are therefore protected even when approximately 333 purchase attempts per second are being generated.

The system does not try to make every request succeed simultaneously. Instead, it controls admission and protects the critical database operations.

---

# 8. Trade-Offs

## Trade-Off 1: Strong Consistency vs Performance

Database transactions and row-level locks protect against double-booking, but they add database work and can cause requests competing for the same seat to wait.

TicketHub accepts this performance cost because correctness is more important than achieving the lowest possible latency for a purchase.

## Trade-Off 2: Waiting Room vs Immediate Access

A waiting room limits the number of users entering the purchase system and makes the sale more stable and fair.

However, users may have to wait before purchasing tickets.

TicketHub accepts the waiting time because allowing 200,000 users to compete directly could overload the service and create an unfair or unreliable experience.

## Trade-Off 3: Cache Speed vs Freshness

Caching reduces database traffic and improves response times.

However, cached seat information can become stale.

Therefore, TicketHub can cache event information but must perform a fresh transactional availability check against the primary database before confirming a seat.

## Trade-Off 4: Read Replicas vs Immediate Consistency

Read replicas improve read scalability, but replication can introduce a small delay.

Therefore, information such as confirmed seat ownership should be read from the primary database when the latest state is required.

---

# Conclusion

TicketHub must be designed differently from a normal content website because ticket inventory is limited and many users may attempt to purchase the same resource simultaneously.

Normal traffic is approximately 6 page requests per second, while the popular concert creates approximately 333 purchase attempts per second. This represents more than 55 times the normal average pressure.

The architecture therefore combines a CDN, waiting room, load balancer, multiple application servers, caching, a primary database, a read replica, a message queue, and background workers.

Most importantly, seat availability is protected by database transactions, row-level locking, conditional updates, and constraints. These mechanisms ensure that two users cannot successfully purchase the same seat even when thousands of requests arrive concurrently.
