
-- Day 6 Assignment
-- School Database
-- SQLite compatible

-- =========================================
-- 1. CREATE TABLES
-- =========================================

CREATE TABLE students (
    student_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY,
    course_name TEXT NOT NULL
);

CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,

    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),

    -- A student cannot enrol in the same course twice.
    UNIQUE (student_id, course_id)
);


-- =========================================
-- 2. INSERT STUDENTS
-- =========================================

INSERT INTO students (student_id, name, email)
VALUES
    (1, 'Lenox Otieno', 'lenox@example.com'),
    (2, 'Grace Wanjiku', 'grace@example.com'),
    (3, 'Brian Kamau', 'brian@example.com'),
    (4, 'Mary Achieng', 'mary@example.com');


-- =========================================
-- 3. INSERT COURSES
-- =========================================

INSERT INTO courses (course_id, course_name)
VALUES
    (1, 'Database Systems'),
    (2, 'Web Development'),
    (3, 'Computer Networks');


-- =========================================
-- 4. INSERT ENROLMENTS
-- =========================================

INSERT INTO enrolments (enrolment_id, student_id, course_id, grade)
VALUES
    (1, 1, 1, 'A'),
    (2, 1, 2, 'B'),
    (3, 2, 1, 'A'),
    (4, 2, 3, 'B'),
    (5, 3, 2, 'A');


-- =========================================
-- 5. QUERY: ALL COURSES FOR ONE STUDENT
-- =========================================

-- Find all courses taken by Lenox Otieno.

SELECT
    students.name AS student_name,
    courses.course_name,
    enrolments.grade
FROM students
JOIN enrolments
    ON students.student_id = enrolments.student_id
JOIN courses
    ON enrolments.course_id = courses.course_id
WHERE students.name = 'Lenox Otieno';


-- =========================================
-- 6. QUERY: ALL STUDENTS ON ONE COURSE
-- =========================================

-- Find all students enrolled in Database Systems.

SELECT
    students.name AS student_name,
    students.email
FROM students
JOIN enrolments
    ON students.student_id = enrolments.student_id
JOIN courses
    ON enrolments.course_id = courses.course_id
WHERE courses.course_name = 'Database Systems';


-- =========================================
-- 7. QUERY: NUMBER OF STUDENTS PER COURSE
-- =========================================

SELECT
    courses.course_name,
    COUNT(enrolments.student_id) AS number_of_students
FROM courses
LEFT JOIN enrolments
    ON courses.course_id = enrolments.course_id
GROUP BY courses.course_id, courses.course_name;


-- =========================================
-- 8. QUERY: STUDENTS WHO HAVE NO ENROLMENTS
-- =========================================

SELECT
    students.student_id,
    students.name,
    students.email
FROM students
LEFT JOIN enrolments
    ON students.student_id = enrolments.student_id
WHERE enrolments.student_id IS NULL;


-- =========================================
-- 9. UPDATE ONE ENROLMENT'S GRADE
-- =========================================

UPDATE enrolments
SET grade = 'A+'
WHERE enrolment_id = 2;


-- Check the updated enrolment.
SELECT *
FROM enrolments
WHERE enrolment_id = 2;
