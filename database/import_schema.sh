#!/bin/bash

# Load environment variables from .env.test file
ENV_FILE="../.env.test"
if [ -f "$ENV_FILE" ]; then
  source "$ENV_FILE"
else
  echo "Warning: .env.test file not found. Using default values."
fi

# Set default values for database connection parameters
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5433}
DB_USERNAME=${DB_USERNAME:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_DATABASE=${DB_DATABASE:-postgres}

# Check if an SQL file is provided, otherwise use the default one
SQL_FILE=${1:-./schema_public.sql}

if [ ! -f "$SQL_FILE" ]; then
  echo "Error: SQL file '$SQL_FILE' not found."
  exit 1
fi

export PGPASSWORD="$DB_PASSWORD"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" -f "$SQL_FILE"

unset PGPASSWORD
