# Day 8 Reflection

The most difficult concept in this course was designing a system that can handle a large increase in traffic while still keeping data correct. At first, I mainly thought about how to make a website work for normal users. The TicketHub capstone helped me understand that system design also requires thinking about what happens when thousands of users perform the same action at the same time. The double-booking problem was especially important because a fast system is not useful if two customers can purchase the same seat.

I overcame this difficulty by breaking the problem into smaller parts. I started with requirements, then estimated traffic, designed the API and database, and finally connected the components through an architecture. Learning about transactions, row-level locking, constraints, caching, queues, and load balancing helped me understand how different parts of a system work together.

Based on the feedback from the capstone, I would improve my architecture diagram by making the request flows and responsibilities of each component even clearer. I would also improve my capacity estimates by using more realistic production metrics and testing assumptions.

Next, I want to learn more about cloud architecture, distributed systems, database optimization, and DevOps. I especially want to practice deploying scalable applications using cloud services so that I can move from designing systems on paper to building and operating them in real environments.