--
-- PostgreSQL database dump
--

-- Dumped from database version 15.1
-- Dumped by pg_dump version 15.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: blocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blocks (
    action character varying NOT NULL,
    amount_in double precision,
    amount_out double precision,
    path jsonb,
    created_at timestamp with time zone DEFAULT now(),
    pool_hash character varying(64),
    hash character varying(64) NOT NULL
);


ALTER TABLE public.blocks OWNER TO postgres;

--
-- Name: pool_states; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pool_states (
    id integer NOT NULL,
    cur_liq double precision NOT NULL,
    cur_price double precision NOT NULL,
    cur_pp double precision NOT NULL,
    cur_left double precision NOT NULL,
    cur_right double precision NOT NULL,
    quest_left_price double precision NOT NULL,
    quest_right_price double precision NOT NULL,
    quest_left_volume double precision,
    quest_right_volume double precision,
    created_at timestamp with time zone DEFAULT now(),
    block_hash character varying(64),
    pool_hash character varying(64)
);


ALTER TABLE public.pool_states OWNER TO postgres;

--
-- Name: pool_states_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pool_states_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pool_states_id_seq OWNER TO postgres;

--
-- Name: pool_states_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pool_states_id_seq OWNED BY public.pool_states.id;


--
-- Name: pools; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pools (
    id integer NOT NULL,
    hash character varying,
    type character varying NOT NULL,
    kind character varying,
    positions jsonb,
    created_at timestamp with time zone DEFAULT now(),
    published_at timestamp with time zone,
    updated_at timestamp with time zone,
    quest_left_hash character varying(64),
    quest_right_hash character varying(64)
);


ALTER TABLE public.pools OWNER TO postgres;

--
-- Name: pools_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pools_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pools_id_seq OWNER TO postgres;

--
-- Name: pools_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pools_id_seq OWNED BY public.pools.id;


--
-- Name: quests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quests (
    id integer NOT NULL,
    hash character varying,
    kind character varying,
    content text,
    creator_hash character varying,
    pools jsonb,
    initial_balance double precision,
    created_at timestamp with time zone DEFAULT now(),
    published_at timestamp with time zone,
    deleted_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.quests OWNER TO postgres;

--
-- Name: quests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.quests_id_seq OWNER TO postgres;

--
-- Name: quests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quests_id_seq OWNED BY public.quests.id;


--
-- Name: wallet_balances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wallet_balances (
    id integer NOT NULL,
    balance double precision NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    quest_hash character varying(64),
    wallet_hash character varying(64)
);


ALTER TABLE public.wallet_balances OWNER TO postgres;

--
-- Name: wallet_balances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wallet_balances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.wallet_balances_id_seq OWNER TO postgres;

--
-- Name: wallet_balances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wallet_balances_id_seq OWNED BY public.wallet_balances.id;


--
-- Name: wallets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wallets (
    id integer NOT NULL,
    name character varying,
    hash character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.wallets OWNER TO postgres;

--
-- Name: wallets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wallets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.wallets_id_seq OWNER TO postgres;

--
-- Name: wallets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wallets_id_seq OWNED BY public.wallets.id;


--
-- Name: pool_states id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pool_states ALTER COLUMN id SET DEFAULT nextval('public.pool_states_id_seq'::regclass);


--
-- Name: pools id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pools ALTER COLUMN id SET DEFAULT nextval('public.pools_id_seq'::regclass);


--
-- Name: quests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quests ALTER COLUMN id SET DEFAULT nextval('public.quests_id_seq'::regclass);


--
-- Name: wallet_balances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallet_balances ALTER COLUMN id SET DEFAULT nextval('public.wallet_balances_id_seq'::regclass);


--
-- Name: wallets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets ALTER COLUMN id SET DEFAULT nextval('public.wallets_id_seq'::regclass);


--
-- Name: blocks blocks_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_hash_key UNIQUE (hash);


--
-- Name: blocks blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_pkey PRIMARY KEY (hash);


--
-- Name: pool_states pool_states_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pool_states
    ADD CONSTRAINT pool_states_pkey PRIMARY KEY (id);


--
-- Name: pools pools_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pools
    ADD CONSTRAINT pools_hash_key UNIQUE (hash);


--
-- Name: pools pools_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pools
    ADD CONSTRAINT pools_pkey PRIMARY KEY (id);


--
-- Name: quests quests_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quests
    ADD CONSTRAINT quests_hash_key UNIQUE (hash);


--
-- Name: quests quests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quests
    ADD CONSTRAINT quests_pkey PRIMARY KEY (id);


--
-- Name: wallet_balances wallet_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallet_balances
    ADD CONSTRAINT wallet_balances_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_hash_key UNIQUE (hash);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: blocks_pool_hash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX blocks_pool_hash_idx ON public.blocks USING btree (pool_hash);


--
-- Name: idx_blocks_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blocks_action ON public.blocks USING btree (action);


--
-- Name: idx_pools_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pools_type ON public.pools USING btree (type);


--
-- Name: pool_states_block_hash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pool_states_block_hash_idx ON public.pool_states USING btree (block_hash);


--
-- Name: pool_states_pool_hash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pool_states_pool_hash_idx ON public.pool_states USING btree (pool_hash);


--
-- Name: pools_hash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX pools_hash_idx ON public.pools USING btree (hash);


--
-- Name: pools_quest_left_hash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pools_quest_left_hash_idx ON public.pools USING btree (quest_left_hash);


--
-- Name: pools_quest_right_hash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pools_quest_right_hash_idx ON public.pools USING btree (quest_right_hash);


--
-- Name: quests_hash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX quests_hash_idx ON public.quests USING btree (hash);


--
-- Name: wallet_balances_quest_hash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX wallet_balances_quest_hash_idx ON public.wallet_balances USING btree (quest_hash);


--
-- Name: wallet_balances_wallet_hash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX wallet_balances_wallet_hash_idx ON public.wallet_balances USING btree (wallet_hash);


--
-- Name: wallets_hash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX wallets_hash_idx ON public.wallets USING btree (hash);


--
-- Name: pool_states pool_states_block_hash_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pool_states
    ADD CONSTRAINT pool_states_block_hash_fkey FOREIGN KEY (block_hash) REFERENCES public.blocks(hash);


--
-- Name: pool_states pool_states_pool_hash_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pool_states
    ADD CONSTRAINT pool_states_pool_hash_fkey FOREIGN KEY (pool_hash) REFERENCES public.pools(hash);


--
-- Name: pools pools_quest_left_hash_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pools
    ADD CONSTRAINT pools_quest_left_hash_fkey FOREIGN KEY (quest_left_hash) REFERENCES public.quests(hash);


--
-- Name: pools pools_quest_right_hash_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pools
    ADD CONSTRAINT pools_quest_right_hash_fkey FOREIGN KEY (quest_right_hash) REFERENCES public.quests(hash);


--
-- Name: wallet_balances wallet_balances_quest_hash_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallet_balances
    ADD CONSTRAINT wallet_balances_quest_hash_fkey FOREIGN KEY (quest_hash) REFERENCES public.quests(hash);


--
-- Name: wallet_balances wallet_balances_wallet_hash_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallet_balances
    ADD CONSTRAINT wallet_balances_wallet_hash_fkey FOREIGN KEY (wallet_hash) REFERENCES public.wallets(hash);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- Name: TABLE blocks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.blocks TO anon;
GRANT ALL ON TABLE public.blocks TO authenticated;
GRANT ALL ON TABLE public.blocks TO service_role;


--
-- Name: TABLE pool_states; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pool_states TO anon;
GRANT ALL ON TABLE public.pool_states TO authenticated;
GRANT ALL ON TABLE public.pool_states TO service_role;


--
-- Name: SEQUENCE pool_states_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.pool_states_id_seq TO anon;
GRANT ALL ON SEQUENCE public.pool_states_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.pool_states_id_seq TO service_role;


--
-- Name: TABLE pools; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pools TO anon;
GRANT ALL ON TABLE public.pools TO authenticated;
GRANT ALL ON TABLE public.pools TO service_role;


--
-- Name: SEQUENCE pools_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.pools_id_seq TO anon;
GRANT ALL ON SEQUENCE public.pools_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.pools_id_seq TO service_role;


--
-- Name: TABLE quests; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.quests TO anon;
GRANT ALL ON TABLE public.quests TO authenticated;
GRANT ALL ON TABLE public.quests TO service_role;


--
-- Name: SEQUENCE quests_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.quests_id_seq TO anon;
GRANT ALL ON SEQUENCE public.quests_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.quests_id_seq TO service_role;


--
-- Name: TABLE wallet_balances; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.wallet_balances TO anon;
GRANT ALL ON TABLE public.wallet_balances TO authenticated;
GRANT ALL ON TABLE public.wallet_balances TO service_role;


--
-- Name: SEQUENCE wallet_balances_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.wallet_balances_id_seq TO anon;
GRANT ALL ON SEQUENCE public.wallet_balances_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.wallet_balances_id_seq TO service_role;


--
-- Name: TABLE wallets; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.wallets TO anon;
GRANT ALL ON TABLE public.wallets TO authenticated;
GRANT ALL ON TABLE public.wallets TO service_role;


--
-- Name: SEQUENCE wallets_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.wallets_id_seq TO anon;
GRANT ALL ON SEQUENCE public.wallets_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.wallets_id_seq TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO service_role;


--
-- PostgreSQL database dump complete
--

