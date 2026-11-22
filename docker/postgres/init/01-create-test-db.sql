-- Run only when the pgdata volume is first initialized.
-- Separate database for integration, API, and concurrency tests (§8).
CREATE DATABASE ledgerly_test OWNER ledgerly;
