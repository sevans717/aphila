#!/bin/bash
set -e

echo "Setting up PostGIS extension..."

# Wait for PostgreSQL to be ready
until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 2
done

# Create PostGIS extension if it doesn't exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Enable PostGIS extension
    CREATE EXTENSION IF NOT EXISTS postgis;
    CREATE EXTENSION IF NOT EXISTS postgis_topology;

    -- Verify PostGIS is working
    SELECT PostGIS_full_version();

    -- Create spatial indexes for geospatial queries
    CREATE INDEX IF NOT EXISTS idx_profiles_location_gist ON public.profiles USING GIST ("location");
    CREATE INDEX IF NOT EXISTS idx_profiles_latlon_point ON public.profiles USING GIST ((POINT("longitude", "latitude")));

    -- Add spatial functions for distance calculations
    CREATE OR REPLACE FUNCTION calculate_distance_km(lat1 double precision, lon1 double precision, lat2 double precision, lon2 double precision)
    RETURNS double precision AS \$\$
    BEGIN
        RETURN ST_Distance(
            ST_GeogFromText('POINT(' || lon1 || ' ' || lat1 || ')'),
            ST_GeogFromText('POINT(' || lon2 || ' ' || lat2 || ')')
        ) / 1000.0; -- Convert to kilometers
    END;
    \$\$ LANGUAGE plpgsql IMMUTABLE;
EOSQL

echo "PostGIS setup completed successfully"
