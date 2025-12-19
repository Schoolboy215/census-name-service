--
-- PostgreSQL database dump
--

-- Dumped from database version 15.15 (b7509d4)
-- Dumped by pg_dump version 17.4

-- Started on 2025-12-19 09:22:49

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 6 (class 2615 OID 24576)
-- Name: CENSUS_NAMES; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

CREATE SCHEMA "CENSUS_NAMES";


ALTER SCHEMA "CENSUS_NAMES" OWNER TO neondb_owner;

--
-- TOC entry 248 (class 1255 OID 892928)
-- Name: get_weighted_first_name(text, integer, text, integer, boolean); Type: FUNCTION; Schema: CENSUS_NAMES; Owner: neondb_owner
--

CREATE FUNCTION "CENSUS_NAMES".get_weighted_first_name(_sex text DEFAULT NULL::text, _yob integer DEFAULT NULL::integer, _state text DEFAULT NULL::text, _percentile integer DEFAULT 100, _top boolean DEFAULT true) RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
    total_weight INT;
    target_weight INT;
    cumulative_weight INT := 0;
    rec RECORD;
    v_sql text;
BEGIN
    SET search_path TO "CENSUS_NAMES";
    
    -- Create a temp table with weights multiplied by the selected race
    CREATE TEMP TABLE IF NOT EXISTS my_temp(
      name varchar(32),
      weight INT
    ) ON COMMIT DROP;
  
    IF (_sex IS NULL) AND (_yob IS NULL) AND (_state IS NULL) THEN                -- 0 0 0
      v_sql := 'INSERT INTO my_temp (name, weight) SELECT name, sum("occurences") as total_occurences from "firstNames" GROUP BY name ORDER BY total_occurences DESC;';
    ELSIF (_sex IS NOT NULL) AND (_yob IS NULL) AND (_state IS NULL) THEN         -- 1 0 0
      v_sql := format('INSERT INTO my_temp (name, weight) SELECT name, sum(occurences) as total_occurences FROM "firstNames" WHERE sex = ''%s'' GROUP BY name ORDER BY total_occurences DESC', _sex);
    ELSIF (_sex IS NULL) AND (_yob IS NOT NULL) AND (_state IS NULL) THEN         -- 0 1 0
      v_sql := format('INSERT INTO my_temp (name, weight) SELECT name, sum(occurences) as total_occurences FROM "firstNames" WHERE yob = %s GROUP BY name ORDER BY total_occurences DESC', _yob);
    ELSIF (_sex IS NOT NULL) AND (_yob IS NOT NULL) AND (_STATE IS NULL) THEN     -- 1 1 0
      v_sql := format('INSERT INTO my_temp (name, weight) SELECT name, sum(occurences) as total_occurences FROM "firstNames" WHERE sex = ''%s'' AND yob = %s GROUP BY name ORDER BY total_occurences DESC', _sex, _yob);
    ELSIF (_sex IS NULL) AND (_yob IS NULL) AND (_state IS NOT NULL) THEN         -- 0 0 1
      v_sql := format('INSERT INTO my_temp (name, weight) SELECT name, sum(occurences) as total_occurences FROM "firstNames" WHERE state = ''%s'' GROUP BY name ORDER BY total_occurences DESC', _state);
    ELSIF (_sex IS NOT NULL) AND (_yob IS NULL) AND (_state IS NOT NULL) THEN     -- 1 0 1
      v_sql := format('INSERT INTO my_temp (name, weight) SELECT name, sum(occurences) as total_occurences FROM "firstNames" WHERE sex = ''%s'' AND state = ''%s'' GROUP BY name ORDER BY total_occurences DESC', _sex, _state);
    ELSIF (_sex IS NULL) AND (_yob IS NOT NULL) AND (_state IS NOT NULL) THEN     -- 0 1 1
      v_sql := format('INSERT INTO my_temp (name, weight) SELECT name, sum(occurences) as total_occurences FROM "firstNames" WHERE yob = %s AND state = ''%s'' GROUP BY name ORDER BY total_occurences DESC', _yob, _state);
    ELSIF (_sex IS NOT NULL) AND (_yob IS NOT NULL) AND (_state IS NOT NULL) THEN -- 1 1 1
      v_sql := format('INSERT INTO my_temp (name, weight) SELECT name, sum(occurences) as total_occurences FROM "firstNames" WHERE sex = ''%s'' AND yob = %s AND state = ''%s'' GROUP BY name ORDER BY total_occurences DESC', _sex, _yob, _state);
    END IF;

    -- Execute the dynamic SQL
    EXECUTE v_sql;
    
    -- Get the sum of all weights
    SELECT SUM(weight) INTO total_weight FROM my_temp;

    -- Generate a random number between 0 and total_weight
    IF _top = TRUE THEN
      SELECT FLOOR(random() * total_weight * (_percentile / 100.0)) INTO target_weight;
    ELSE
      SELECT FLOOR(random() * total_weight * (_percentile / 100.0) + (total_weight * ((100 - _percentile) / 100.0))) INTO target_weight;
    END IF;

    -- Iterate through the records and find the one matching the weighted random number
    FOR rec IN SELECT name, weight FROM my_temp LOOP
        cumulative_weight := cumulative_weight + rec.weight;
        IF cumulative_weight > target_weight THEN
            RETURN rec.name;
        END IF;
    END LOOP;
    RETURN ''; -- If nothing found
END;
$$;


ALTER FUNCTION "CENSUS_NAMES".get_weighted_first_name(_sex text, _yob integer, _state text, _percentile integer, _top boolean) OWNER TO neondb_owner;

--
-- TOC entry 249 (class 1255 OID 910154)
-- Name: get_weighted_last_name(text, integer, boolean); Type: FUNCTION; Schema: CENSUS_NAMES; Owner: neondb_owner
--

CREATE FUNCTION "CENSUS_NAMES".get_weighted_last_name(_race text DEFAULT NULL::text, _percentile integer DEFAULT 100, _top boolean DEFAULT true) RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
    total_weight INT;
    target_weight INT;
    cumulative_weight INT := 0;
    rec RECORD;
    raceField text;
    v_sql text;
BEGIN
    SET search_path TO "CENSUS_NAMES";
    
    CASE _race
      WHEN 'white'    THEN raceField := 'pctWhite';
      WHEN 'black'    THEN raceField := 'pctBlack';
      WHEN 'asian'    THEN raceField := 'pctApi';
      WHEN 'native'   THEN raceField := 'pctAian';
      WHEN 'hispanic' THEN raceField := 'pctHispanic';
      ELSE raceField := '';
    END CASE;
    
    -- Create a temp table with weights multiplied by the selected race
    CREATE TEMP TABLE IF NOT EXISTS my_temp(
      name varchar(32),
      weight INT
    ) ON COMMIT DROP;
    
    IF _race IS NOT NULL THEN
      v_sql := format(
          'INSERT INTO my_temp (name, weight)
          SELECT name, occurences * "lastNames".%I / 100 FROM "lastNames";',
          raceField
      );
    ELSE
      v_sql := 
          'INSERT INTO my_temp (name, weight)
          SELECT name, occurences FROM "lastNames";';
    END IF;

    -- Execute the dynamic SQL
    EXECUTE v_sql;
    
    -- Get the sum of all weights
    SELECT SUM(weight) INTO total_weight FROM my_temp;

    -- Generate a random number between 0 and total_weight
    IF _top = TRUE THEN
      SELECT FLOOR(random() * total_weight * (_percentile / 100.0)) INTO target_weight;
    ELSE
      SELECT FLOOR(random() * total_weight * (_percentile / 100.0) + (total_weight * ((100 - _percentile) / 100.0))) INTO target_weight;
    END IF;

    -- Iterate through the records and find the one matching the weighted random number
    FOR rec IN SELECT name, weight FROM my_temp LOOP
        cumulative_weight := cumulative_weight + rec.weight;
        IF cumulative_weight > target_weight THEN
            RETURN rec.name;
        END IF;
    END LOOP;
    RETURN ''; -- If nothing found in results
END;
$$;


ALTER FUNCTION "CENSUS_NAMES".get_weighted_last_name(_race text, _percentile integer, _top boolean) OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 235 (class 1259 OID 32788)
-- Name: firstNames; Type: TABLE; Schema: CENSUS_NAMES; Owner: neondb_owner
--

CREATE TABLE "CENSUS_NAMES"."firstNames" (
    state character(2),
    sex character(1),
    yob smallint,
    name character varying(15),
    occurences integer
);


ALTER TABLE "CENSUS_NAMES"."firstNames" OWNER TO neondb_owner;

--
-- TOC entry 236 (class 1259 OID 32793)
-- Name: lastNames; Type: TABLE; Schema: CENSUS_NAMES; Owner: neondb_owner
--

CREATE TABLE "CENSUS_NAMES"."lastNames" (
    name character varying(15),
    occurences integer,
    "pctWhite" numeric,
    "pctBlack" numeric,
    "pctApi" numeric,
    "pctAian" numeric,
    "pctHispanic" numeric
);


ALTER TABLE "CENSUS_NAMES"."lastNames" OWNER TO neondb_owner;

--
-- TOC entry 3202 (class 1259 OID 327779)
-- Name: fnsearch_idx; Type: INDEX; Schema: CENSUS_NAMES; Owner: neondb_owner
--

CREATE INDEX fnsearch_idx ON "CENSUS_NAMES"."firstNames" USING btree (state, sex, yob);


--
-- TOC entry 3203 (class 1259 OID 327729)
-- Name: lnsearch_idx; Type: INDEX; Schema: CENSUS_NAMES; Owner: neondb_owner
--

CREATE INDEX lnsearch_idx ON "CENSUS_NAMES"."lastNames" USING btree (name, occurences, "pctWhite", "pctBlack", "pctApi", "pctAian", "pctHispanic");


-- Completed on 2025-12-19 09:22:51

--
-- PostgreSQL database dump complete
--