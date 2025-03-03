# SQL Initialization Scripts

This directory has been deprecated. SQL initialization scripts are now stored in the `templates/sql` directory and are mounted directly to the PostgreSQL container's `/docker-entrypoint-initdb.d` directory when the database is started.

Please refer to the `templates/sql/README.md` for more information. 