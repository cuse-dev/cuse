# SQL Initialization Templates

This directory contains SQL initialization scripts that are automatically mounted to the PostgreSQL container's `/docker-entrypoint-initdb.d` directory when the database is started.

The `init.sql` file contains the database schema definition and is based on the Prisma migration files from the database package. This ensures that the database schema is automatically initialized when the container is first started.

## How it works

1. When the Docker Compose file is generated, this directory is mounted to the PostgreSQL container's `/docker-entrypoint-initdb.d` directory.
2. When the PostgreSQL container is first started, it automatically executes all `.sql` files in the `/docker-entrypoint-initdb.d` directory.

This approach ensures that the database schema is automatically initialized without requiring manual migration steps.

## Updating the schema

If you need to update the database schema:

1. Make your changes to the Prisma schema in the database package
2. Generate a new migration using Prisma
3. Update the `init.sql` file in this directory with the new schema

Alternatively, you can add additional SQL files to this directory for more complex initialization scenarios. 