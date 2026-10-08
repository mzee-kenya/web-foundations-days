
# School Database Design

## Students Table

The `students` table stores information about students in the school. Each student has a unique `student_id`, a name, and an email address. The email is required and must be unique so that two students cannot have the same email address.

## Courses Table

The `courses` table stores the courses offered by the school. Each course has a unique `course_id` and a course name. The course ID is used to identify each course when creating relationships with other tables.

## Enrolments Table

The `enrolments` table records which students are taking which courses. It contains the student ID, course ID, and the student's grade for that course. It also has its own `enrolment_id` as the primary key.

## Relationships

There is a one-to-many relationship between `students` and `enrolments`. One student can have many enrolments, but each enrolment belongs to one student.

There is also a one-to-many relationship between `courses` and `enrolments`. One course can have many enrolments, but each enrolment belongs to one course.

Together, students and courses have a many-to-many relationship. A student can take many courses, and a course can have many students. The `enrolments` table is needed as a join table because it connects the two tables and also stores information about the relationship, such as the student's grade.

## Index

I would add an index on `enrolments.student_id` because student IDs are frequently used when finding all courses taken by a particular student. An index can make these searches faster, especially when the database contains many enrolment records.

Example:

```sql
CREATE INDEX idx_enrolments_student_id
ON enrolments(student_id);
```

## SQL or NoSQL?

I would choose SQL for this school system because the data has clear relationships between students, courses, and enrolments. SQL databases are suitable when data needs to be structured and relationships need to be maintained using primary keys and foreign keys. SQL also makes it easy to use JOIN, GROUP BY, and other queries to retrieve related information. Since this system has a many-to-many relationship between students and courses, a relational SQL database would be a better choice than NoSQL.
