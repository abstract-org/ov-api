#!/bin/bash

# change following if needed:
# -h {your_host}
# -p {your_port}
# -U {username}
 psql -h localhost -p 5432 -U postgres < ./dump_public.sql