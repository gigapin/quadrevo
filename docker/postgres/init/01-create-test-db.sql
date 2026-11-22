-- Run only when the pgdata volume is first initialized.
-- Separate database for integration, API, and concurrency tests.
CREATE DATABASE quadrevo_test OWNER quadrevo;
