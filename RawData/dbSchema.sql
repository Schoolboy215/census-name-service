--
-- PostgreSQL database dump
--

-- Dumped from database version 15.15 (2933c9e)
-- Dumped by pg_dump version 17.4

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
-- Name: CENSUS_NAMES; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "CENSUS_NAMES";


--
-- Name: check_api_key(uuid, boolean, numeric); Type: FUNCTION; Schema: CENSUS_NAMES; Owner: -
--

CREATE FUNCTION "CENSUS_NAMES".check_api_key(_key uuid, _increment boolean DEFAULT false, _secondsallowed numeric DEFAULT 0) RETURNS integer
    LANGUAGE plpgsql
    AS $$
-- 0 : No key
-- 1 : Valid key, valid use
-- 2 : Valid key, used too recently
DECLARE
    rec                 RECORD := NULL;
    curTime             TIMESTAMP;
    v_sql               text;
    ret                 INTEGER := 0;
    timeSinceLastUse    INTERVAL;
BEGIN
    SET search_path TO "CENSUS_NAMES";
    
    SELECT * into rec FROM "apiKeys" WHERE key = _key;

    IF rec is NULL THEN
        ret :=0;
    ELSE
        IF _secondsAllowed != 0 THEN
            SELECT CURRENT_TIMESTAMP into curTime;
            timeSinceLastUse := CURRENT_TIMESTAMP - rec."lastUse";
            IF EXTRACT(EPOCH FROM timeSinceLastUse) < _secondsAllowed THEN
                ret := 2;
            ELSE
                ret := 1;
            END IF;
        ELSE
            ret := 1;
        END IF;
    END IF;

    IF _increment AND ret = 1 THEN
        UPDATE "apiKeys" set "lastUse" = CURRENT_TIMESTAMP, uses = rec.uses + 1 WHERE id = rec.id;
    END IF;

    RETURN ret;
END;
$$;


--
-- Name: get_weighted_first_name(text, integer, text, integer, boolean); Type: FUNCTION; Schema: CENSUS_NAMES; Owner: -
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


--
-- Name: get_weighted_last_name(text, integer, boolean); Type: FUNCTION; Schema: CENSUS_NAMES; Owner: -
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


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: apiKeys; Type: TABLE; Schema: CENSUS_NAMES; Owner: -
--

CREATE TABLE "CENSUS_NAMES"."apiKeys" (
    id integer NOT NULL,
    key uuid DEFAULT gen_random_uuid(),
    email text NOT NULL,
    created timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    uses integer DEFAULT 0,
    "lastUse" timestamp without time zone
);


--
-- Name: apiKeys_id_seq; Type: SEQUENCE; Schema: CENSUS_NAMES; Owner: -
--

ALTER TABLE "CENSUS_NAMES"."apiKeys" ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "CENSUS_NAMES"."apiKeys_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: firstNames; Type: TABLE; Schema: CENSUS_NAMES; Owner: -
--

CREATE TABLE "CENSUS_NAMES"."firstNames" (
    state character(2),
    sex character(1),
    yob smallint,
    name character varying(15),
    occurences integer
);


--
-- Name: lastNames; Type: TABLE; Schema: CENSUS_NAMES; Owner: -
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


--
-- Name: apiKeys apiKeys_email_key; Type: CONSTRAINT; Schema: CENSUS_NAMES; Owner: -
--

ALTER TABLE ONLY "CENSUS_NAMES"."apiKeys"
    ADD CONSTRAINT "apiKeys_email_key" UNIQUE (email);


--
-- Name: apiKeys apiKeys_key_key; Type: CONSTRAINT; Schema: CENSUS_NAMES; Owner: -
--

ALTER TABLE ONLY "CENSUS_NAMES"."apiKeys"
    ADD CONSTRAINT "apiKeys_key_key" UNIQUE (key);


--
-- Name: apiKeys apiKeys_pkey; Type: CONSTRAINT; Schema: CENSUS_NAMES; Owner: -
--

ALTER TABLE ONLY "CENSUS_NAMES"."apiKeys"
    ADD CONSTRAINT "apiKeys_pkey" PRIMARY KEY (id);


--
-- Name: fnsearch_idx; Type: INDEX; Schema: CENSUS_NAMES; Owner: -
--

CREATE INDEX fnsearch_idx ON "CENSUS_NAMES"."firstNames" USING btree (state, sex, yob);


--
-- Name: lnsearch_idx; Type: INDEX; Schema: CENSUS_NAMES; Owner: -
--

CREATE INDEX lnsearch_idx ON "CENSUS_NAMES"."lastNames" USING btree (name, occurences, "pctWhite", "pctBlack", "pctApi", "pctAian", "pctHispanic");


--
-- PostgreSQL database dump complete
--

