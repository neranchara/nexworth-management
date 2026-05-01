--
-- PostgreSQL database dump
--

\restrict cOJMqNQCWKlbGA0qqV7Vw3fFwgxL46Pe8abVuLesBSL7g4gWCcJvZuY2pxVKa2I

-- Dumped from database version 18.2 (49f2ca4)
-- Dumped by pg_dump version 18.3

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

ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_roleId_fkey";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY public."Transaction" DROP CONSTRAINT IF EXISTS "Transaction_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Transaction" DROP CONSTRAINT IF EXISTS "Transaction_typeId_fkey";
ALTER TABLE IF EXISTS ONLY public."Transaction" DROP CONSTRAINT IF EXISTS "Transaction_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY public."Transaction" DROP CONSTRAINT IF EXISTS "Transaction_loanId_fkey";
ALTER TABLE IF EXISTS ONLY public."Transaction" DROP CONSTRAINT IF EXISTS "Transaction_linkedTransactionId_fkey";
ALTER TABLE IF EXISTS ONLY public."Transaction" DROP CONSTRAINT IF EXISTS "Transaction_liabilityId_fkey";
ALTER TABLE IF EXISTS ONLY public."Transaction" DROP CONSTRAINT IF EXISTS "Transaction_categoryId_fkey";
ALTER TABLE IF EXISTS ONLY public."Transaction" DROP CONSTRAINT IF EXISTS "Transaction_assetId_fkey";
ALTER TABLE IF EXISTS ONLY public."Transaction" DROP CONSTRAINT IF EXISTS "Transaction_accountId_fkey";
ALTER TABLE IF EXISTS ONLY public."TransactionType" DROP CONSTRAINT IF EXISTS "TransactionType_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY public."TransactionCategory" DROP CONSTRAINT IF EXISTS "TransactionCategory_typeId_fkey";
ALTER TABLE IF EXISTS ONLY public."TransactionCategory" DROP CONSTRAINT IF EXISTS "TransactionCategory_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY public."Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Role" DROP CONSTRAINT IF EXISTS "Role_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY public."Permission" DROP CONSTRAINT IF EXISTS "Permission_roleId_fkey";
ALTER TABLE IF EXISTS ONLY public."Loan" DROP CONSTRAINT IF EXISTS "Loan_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Loan" DROP CONSTRAINT IF EXISTS "Loan_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY public."Loan" DROP CONSTRAINT IF EXISTS "Loan_liabilityId_fkey";
ALTER TABLE IF EXISTS ONLY public."Loan" DROP CONSTRAINT IF EXISTS "Loan_assetId_fkey";
ALTER TABLE IF EXISTS ONLY public."Liability" DROP CONSTRAINT IF EXISTS "Liability_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Liability" DROP CONSTRAINT IF EXISTS "Liability_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY public."Liability" DROP CONSTRAINT IF EXISTS "Liability_accountId_fkey";
ALTER TABLE IF EXISTS ONLY public."FinancialRecord" DROP CONSTRAINT IF EXISTS "FinancialRecord_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."FinancialRecord" DROP CONSTRAINT IF EXISTS "FinancialRecord_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY public."FinancialRecord" DROP CONSTRAINT IF EXISTS "FinancialRecord_accountId_fkey";
ALTER TABLE IF EXISTS ONLY public."Bank" DROP CONSTRAINT IF EXISTS "Bank_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY public."Asset" DROP CONSTRAINT IF EXISTS "Asset_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Asset" DROP CONSTRAINT IF EXISTS "Asset_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY public."Asset" DROP CONSTRAINT IF EXISTS "Asset_accountId_fkey";
ALTER TABLE IF EXISTS ONLY public."Account" DROP CONSTRAINT IF EXISTS "Account_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Account" DROP CONSTRAINT IF EXISTS "Account_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY public."Account" DROP CONSTRAINT IF EXISTS "Account_bankId_fkey";
DROP INDEX IF EXISTS public."User_pairingCode_key";
DROP INDEX IF EXISTS public."User_lineUserId_key";
DROP INDEX IF EXISTS public."User_email_key";
DROP INDEX IF EXISTS public."TransactionType_organizationId_name_key";
DROP INDEX IF EXISTS public."TransactionCategory_organizationId_name_typeId_key";
DROP INDEX IF EXISTS public."Session_token_key";
DROP INDEX IF EXISTS public."Role_organizationId_name_key";
DROP INDEX IF EXISTS public."Permission_roleId_resource_key";
DROP INDEX IF EXISTS public."Liability_accountId_key";
DROP INDEX IF EXISTS public."Bank_organizationId_code_key";
DROP INDEX IF EXISTS public."Asset_accountId_key";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."Transaction" DROP CONSTRAINT IF EXISTS "Transaction_pkey";
ALTER TABLE IF EXISTS ONLY public."TransactionType" DROP CONSTRAINT IF EXISTS "TransactionType_pkey";
ALTER TABLE IF EXISTS ONLY public."TransactionCategory" DROP CONSTRAINT IF EXISTS "TransactionCategory_pkey";
ALTER TABLE IF EXISTS ONLY public."Session" DROP CONSTRAINT IF EXISTS "Session_pkey";
ALTER TABLE IF EXISTS ONLY public."Role" DROP CONSTRAINT IF EXISTS "Role_pkey";
ALTER TABLE IF EXISTS ONLY public."Permission" DROP CONSTRAINT IF EXISTS "Permission_pkey";
ALTER TABLE IF EXISTS ONLY public."Organization" DROP CONSTRAINT IF EXISTS "Organization_pkey";
ALTER TABLE IF EXISTS ONLY public."Loan" DROP CONSTRAINT IF EXISTS "Loan_pkey";
ALTER TABLE IF EXISTS ONLY public."Liability" DROP CONSTRAINT IF EXISTS "Liability_pkey";
ALTER TABLE IF EXISTS ONLY public."FinancialRecord" DROP CONSTRAINT IF EXISTS "FinancialRecord_pkey";
ALTER TABLE IF EXISTS ONLY public."Bank" DROP CONSTRAINT IF EXISTS "Bank_pkey";
ALTER TABLE IF EXISTS ONLY public."Asset" DROP CONSTRAINT IF EXISTS "Asset_pkey";
ALTER TABLE IF EXISTS ONLY public."Account" DROP CONSTRAINT IF EXISTS "Account_pkey";
DROP TABLE IF EXISTS public."User";
DROP TABLE IF EXISTS public."TransactionType";
DROP TABLE IF EXISTS public."TransactionCategory";
DROP TABLE IF EXISTS public."Transaction";
DROP TABLE IF EXISTS public."Session";
DROP TABLE IF EXISTS public."Role";
DROP TABLE IF EXISTS public."Permission";
DROP TABLE IF EXISTS public."Organization";
DROP TABLE IF EXISTS public."Loan";
DROP TABLE IF EXISTS public."Liability";
DROP TABLE IF EXISTS public."FinancialRecord";
DROP TABLE IF EXISTS public."Bank";
DROP TABLE IF EXISTS public."Asset";
DROP TABLE IF EXISTS public."Account";
DROP TYPE IF EXISTS public."TransactionBehavior";
DROP TYPE IF EXISTS public."FinancialRecordType";
DROP TYPE IF EXISTS public."AccountType";
--
-- Name: AccountType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AccountType" AS ENUM (
    'BANK',
    'STOCK',
    'GOLD',
    'CASHFLOW',
    'INTERNAL',
    'EMERGENCY',
    'GOAL',
    'INVESTMENT',
    'SAVING',
    'FAMILY',
    'LIABILITY'
);


--
-- Name: FinancialRecordType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."FinancialRecordType" AS ENUM (
    'ASSET',
    'LIABILITY'
);


--
-- Name: TransactionBehavior; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TransactionBehavior" AS ENUM (
    'INCOME',
    'EXPENSE',
    'SAVING',
    'INVESTMENT',
    'GOAL_SAVING',
    'INTERNAL_TRANSFER',
    'DEBT',
    'LOAN_BORROW',
    'LOAN_REPAY',
    'GOAL',
    'EMERGENCY'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    "organizationId" text,
    "userId" text NOT NULL,
    name text NOT NULL,
    type public."AccountType" NOT NULL,
    "bankId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "isPersonal" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "accountNumber" text DEFAULT '-'::text NOT NULL,
    "actualDate" timestamp(3) without time zone
);


--
-- Name: Asset; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Asset" (
    id text NOT NULL,
    "organizationId" text,
    "userId" text NOT NULL,
    "accountId" text NOT NULL,
    amount double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Bank; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Bank" (
    id text NOT NULL,
    "organizationId" text,
    code text NOT NULL,
    name text NOT NULL,
    color text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: FinancialRecord; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FinancialRecord" (
    id text NOT NULL,
    "organizationId" text,
    "userId" text NOT NULL,
    "accountId" text NOT NULL,
    amount double precision NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    type public."FinancialRecordType" NOT NULL,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Liability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Liability" (
    id text NOT NULL,
    "organizationId" text,
    "userId" text NOT NULL,
    "accountId" text NOT NULL,
    amount double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Loan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Loan" (
    id text NOT NULL,
    "organizationId" text,
    code text,
    "userId" text NOT NULL,
    "accountId" text NOT NULL,
    name text NOT NULL,
    "totalAmount" double precision DEFAULT 0 NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "actualDate" timestamp(3) without time zone,
    "assetId" text,
    "liabilityId" text
);


--
-- Name: Organization; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Organization" (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


--
-- Name: Permission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Permission" (
    id text NOT NULL,
    "roleId" text NOT NULL,
    resource text NOT NULL,
    "canView" boolean DEFAULT false NOT NULL,
    "canCreate" boolean DEFAULT false NOT NULL,
    "canUpdate" boolean DEFAULT false NOT NULL,
    "canDelete" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Role" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "organizationId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "isSystemRole" boolean DEFAULT false NOT NULL
);


--
-- Name: Session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "userId" text NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Transaction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Transaction" (
    id text NOT NULL,
    "organizationId" text,
    "userId" text NOT NULL,
    "accountId" text NOT NULL,
    "categoryId" text NOT NULL,
    "typeId" text NOT NULL,
    amount double precision NOT NULL,
    description text,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    note text,
    "loanId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "actualDate" timestamp(3) without time zone,
    "assetId" text,
    "liabilityId" text,
    "linkedTransactionId" text,
    direction text
);


--
-- Name: TransactionCategory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TransactionCategory" (
    id text NOT NULL,
    "organizationId" text,
    name text NOT NULL,
    "typeId" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: TransactionType; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TransactionType" (
    id text NOT NULL,
    "organizationId" text,
    name text NOT NULL,
    behavior public."TransactionBehavior" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    "firstName" text,
    "lastName" text,
    "roleId" text,
    "organizationId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "lineUserId" text,
    "pairingCode" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isSystemAdmin" boolean DEFAULT false NOT NULL
);


--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Account" (id, "organizationId", "userId", name, type, "bankId", "isActive", "isPersonal", "createdAt", "updatedAt", "accountNumber", "actualDate") FROM stdin;
main-acc-166baf00-012e-4961-8ea5-93fbad9cbdaa	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	166baf00-012e-4961-8ea5-93fbad9cbdaa	Main KBANK	BANK	758cf3e1-70a0-4055-8780-f4ae9668ac0c	t	t	2026-04-30 18:13:15.783	2026-04-30 18:13:15.783	-	2026-04-30 18:13:15.782
emergency-acc-166baf00-012e-4961-8ea5-93fbad9cbdaa	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	166baf00-012e-4961-8ea5-93fbad9cbdaa	Emergency SCB	EMERGENCY	d0df3f10-8027-46fd-8253-87f642e42248	t	t	2026-04-30 18:13:15.8	2026-04-30 18:13:15.8	-	2026-04-30 18:13:15.8
saving-acc-166baf00-012e-4961-8ea5-93fbad9cbdaa	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	166baf00-012e-4961-8ea5-93fbad9cbdaa	Saving Fund	SAVING	\N	t	t	2026-04-30 18:13:15.811	2026-04-30 18:13:15.811	-	2026-04-30 18:13:15.81
main-acc-4fd24e66-2498-4fd7-b40b-be8bfd94a413	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	4fd24e66-2498-4fd7-b40b-be8bfd94a413	Main KBANK	BANK	758cf3e1-70a0-4055-8780-f4ae9668ac0c	t	t	2026-04-30 18:13:15.9	2026-04-30 18:13:15.9	-	2026-04-30 18:13:15.9
emergency-acc-4fd24e66-2498-4fd7-b40b-be8bfd94a413	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	4fd24e66-2498-4fd7-b40b-be8bfd94a413	Emergency SCB	EMERGENCY	d0df3f10-8027-46fd-8253-87f642e42248	t	t	2026-04-30 18:13:15.91	2026-04-30 18:13:15.91	-	2026-04-30 18:13:15.91
saving-acc-4fd24e66-2498-4fd7-b40b-be8bfd94a413	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	4fd24e66-2498-4fd7-b40b-be8bfd94a413	Saving Fund	SAVING	\N	t	t	2026-04-30 18:13:15.92	2026-04-30 18:13:15.92	-	2026-04-30 18:13:15.919
4272c985-b852-4143-ac4f-ac635443de8b	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	K-US500X-A(A)	INVESTMENT	e50a03d0-5d36-47ab-8216-12dd5ef923d2	t	t	2026-04-11 10:29:29.61	2026-04-25 19:23:01.434	030-3-50199-1	\N
4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	กรุงเทพ	CASHFLOW	a9532d66-6378-42ee-92be-f735a9e085ed	t	t	2026-03-25 10:15:34.15	2026-04-30 13:24:11.498	8777393375	\N
89e8be90-4999-4593-8e47-01a618ae0d94	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	กสิกร	CASHFLOW	e50a03d0-5d36-47ab-8216-12dd5ef923d2	t	t	2026-03-25 10:15:34.163	2026-04-30 13:24:20.02	030-3-50199-1	\N
9b4cb30c-3f41-45ce-8e24-6e4423e1095c	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	Cloud Pocket ASML	INVESTMENT	e50a03d0-5d36-47ab-8216-12dd5ef923d2	t	t	2026-03-25 10:15:34.173	2026-04-24 18:27:25.605	2011874579	\N
568b2711-bec4-4793-b606-14e4c3a08817	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	Cloud Pocket ค่าใช้จ่ายรถ	GOAL	e50a03d0-5d36-47ab-8216-12dd5ef923d2	t	t	2026-03-25 10:15:34.171	2026-04-24 18:27:25.605	2011874579	\N
8557fae0-d2a7-439e-ba8b-3f5465423542	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	Cloud Pocket เที่ยว	GOAL	e50a03d0-5d36-47ab-8216-12dd5ef923d2	t	t	2026-03-25 10:15:34.169	2026-04-24 18:27:25.605	2011874579	\N
011aed10-550c-4669-8d0e-af36c53e3611	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	ธนาคารอาคารสงเคราะห์	INVESTMENT	fd458e1d-00cd-4842-a8f4-6f97ebbda77b	t	f	2026-04-22 18:10:13.089	2026-04-22 18:51:21.982		\N
d5c5f882-4edd-4f49-8e88-677bd1a1f9cb	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	Dime	INVESTMENT	9f5446fa-c274-448e-96ff-b5d6205db701	t	t	2026-03-25 10:15:34.191	2026-03-25 14:37:45.888	000-000-0000	\N
736e95ba-15ca-408c-a02d-71874e3e54e3	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	6163032	INVESTMENT	a9532d66-6378-42ee-92be-f735a9e085ed	t	t	2026-03-25 10:15:34.189	2026-04-17 04:59:02.065	6163032	\N
7c0133d0-7a90-47a8-bd7e-ab071cfca1c8	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	กรุงเทพ มด	FAMILY	a9532d66-6378-42ee-92be-f735a9e085ed	t	f	2026-04-22 14:50:44.955	2026-04-22 18:51:41.179		\N
1a18f846-019f-4f24-82b5-305fa809cccd	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	Cloud Pocket ทำบุญ	GOAL	e50a03d0-5d36-47ab-8216-12dd5ef923d2	t	t	2026-03-25 12:54:41.916	2026-04-24 18:27:25.605	2011874579	\N
e118748e-8fe5-4c36-a119-6555f6af4160	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	ออมสิน รายเดือนแม่	FAMILY	36fa873e-cbeb-45f6-ba95-e362ccd1dbeb	t	f	2026-03-25 10:15:34.186	2026-04-22 18:51:53.81	020437464645	\N
d78d57fa-7b30-49e1-82e7-bcb16d87193b	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	บัตรเครดิต UOB	LIABILITY	c09992ca-34c7-4326-8997-ad08c4c473f1	t	f	2026-03-25 10:15:34.187	2026-04-22 18:51:27.348	4035952438	\N
c0222442-a596-46f5-89e3-b19635ba5d57	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	กรุงไทย รายเดือนแม่	FAMILY	5c866813-ab02-41bd-90fb-be199efd900c	t	f	2026-03-25 10:15:34.184	2026-04-22 18:51:34.504	4460449528	\N
424385e4-ee45-4d16-be1f-e2fb93459d3f	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	กรุงไทย ดิ๊บ	FAMILY	5c866813-ab02-41bd-90fb-be199efd900c	t	f	2026-04-22 14:54:48.507	2026-04-22 18:51:37.905		\N
dde45f0a-23a1-4c53-bc03-5a907ef5f406	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	ออมสิน เงินออมแม่	SAVING	36fa873e-cbeb-45f6-ba95-e362ccd1dbeb	t	f	2026-03-25 10:15:34.182	2026-04-22 18:51:57.837	020457072229	\N
bdc303b8-199c-432d-9a43-2ceee54b4adf	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	ออมสิน สำรองครอบครัว	SAVING	36fa873e-cbeb-45f6-ba95-e362ccd1dbeb	t	t	2026-03-25 10:15:34.164	2026-03-28 12:18:36.817	020125686467	\N
ddf4f482-12d3-48ec-bdc7-fdd8faa8a46a	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	Cloud Pocket เมล็ดกาแฟ	INVESTMENT	e50a03d0-5d36-47ab-8216-12dd5ef923d2	t	t	2026-03-25 10:15:34.18	2026-04-24 18:27:25.605	2011874579	\N
850cb1a3-c642-4882-a3a6-2d047ccac110	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	Cloud Pocket ออมทอง	INVESTMENT	e50a03d0-5d36-47ab-8216-12dd5ef923d2	t	t	2026-03-25 10:15:34.178	2026-04-24 18:27:25.605	2011874579	\N
5e1bb381-4871-46f2-93d8-bb339304efce	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	Cloud Pocket กองทุนกสิกร	INVESTMENT	e50a03d0-5d36-47ab-8216-12dd5ef923d2	t	t	2026-03-25 10:15:34.176	2026-04-24 18:27:25.605	2011874579	\N
e7133872-dedf-4e1b-a915-3b1458266906	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	Cloud Pocket TSMC	INVESTMENT	e50a03d0-5d36-47ab-8216-12dd5ef923d2	t	t	2026-03-25 10:15:34.174	2026-04-24 18:27:25.605	2011874579	\N
a9debac2-2e2e-450c-ada1-2d652c557801	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	ไทยพาณิชย์	CASHFLOW	8bc3e27a-34a0-4adf-812c-26435b680489	t	t	2026-03-25 10:15:34.161	2026-03-28 12:13:25.061	4035952438	\N
bf76aa0f-db8a-4062-ba12-aaae5f06a479	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	ออมสิน บัญชีเงินซื้อรถ	GOAL	36fa873e-cbeb-45f6-ba95-e362ccd1dbeb	t	t	2026-03-25 10:15:34.167	2026-04-25 19:22:14.543	020384026249	\N
d176b133-d7e7-4a5e-bd77-701cef7f7bca	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	Cloud Pocket ฉุกเฉิน	EMERGENCY	e50a03d0-5d36-47ab-8216-12dd5ef923d2	t	t	2026-04-25 19:18:36.55	2026-04-25 19:20:11.636	2011874579	\N
\.


--
-- Data for Name: Asset; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Asset" (id, "organizationId", "userId", "accountId", amount, "createdAt", "updatedAt") FROM stdin;
bab7389e-b573-4e02-ba66-45129c9a3bdf	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	d5c5f882-4edd-4f49-8e88-677bd1a1f9cb	19516.56	2026-03-25 15:31:59.894	2026-04-30 17:04:02.633
2bc891a6-e07a-46f6-9802-cf8f0e1af1e0	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	c0222442-a596-46f5-89e3-b19635ba5d57	51000	2026-03-25 17:01:29.06	2026-04-30 18:48:51.917
b8f82762-46ef-4555-afcd-784360c432ab	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	a9debac2-2e2e-450c-ada1-2d652c557801	1633.67	2026-03-25 17:42:45.857	2026-04-30 16:54:43.972
ba7fa51f-8045-4f07-8050-61e7490a0f49	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4272c985-b852-4143-ac4f-ac635443de8b	14533.02	2026-04-11 10:29:29.658	2026-04-30 17:05:33.78
15c79449-ff47-4f84-9e31-cfdb66be744e	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	9b4cb30c-3f41-45ce-8e24-6e4423e1095c	0	2026-03-25 15:31:59.904	2026-04-30 16:57:32.028
24cc6423-cae4-4a98-a81b-cf87072fe0b1	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	166baf00-012e-4961-8ea5-93fbad9cbdaa	main-acc-166baf00-012e-4961-8ea5-93fbad9cbdaa	95000	2026-04-30 18:13:15.821	2026-04-30 18:40:36.394
b65b827a-8c16-4fef-8567-c4686b595205	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	424385e4-ee45-4d16-be1f-e2fb93459d3f	0	2026-04-22 14:55:04.232	2026-04-25 19:25:42.218
24b40ac2-72f3-4b53-98c6-8d13790c4bd9	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bf76aa0f-db8a-4062-ba12-aaae5f06a479	346032.08	2026-03-25 15:31:59.92	2026-04-30 18:44:13.805
d273de1a-b925-4546-9835-135de8f46716	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	850cb1a3-c642-4882-a3a6-2d047ccac110	4000	2026-03-25 15:31:59.906	2026-04-30 16:58:13.336
a6d588d1-2a65-46fd-94c1-405762083521	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	568b2711-bec4-4793-b606-14e4c3a08817	3000	2026-03-25 15:31:59.903	2026-04-30 16:58:57.239
d057c431-a00f-4408-8f12-fd9c9c93409e	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	89e8be90-4999-4593-8e47-01a618ae0d94	0	2026-03-25 15:31:59.916	2026-04-30 18:44:24.55
65584d9a-70eb-403c-9fe7-ed8e229e8b89	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	166baf00-012e-4961-8ea5-93fbad9cbdaa	emergency-acc-166baf00-012e-4961-8ea5-93fbad9cbdaa	45000	2026-04-30 18:13:15.84	2026-04-30 18:40:36.405
51b4fd2e-84b8-4f14-b4b0-e5b3ee217e28	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	1a18f846-019f-4f24-82b5-305fa809cccd	1600	2026-03-25 15:31:59.896	2026-04-30 16:59:37.554
c45faa95-e927-499c-90bb-78e42ac13c29	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	ddf4f482-12d3-48ec-bdc7-fdd8faa8a46a	1771.25	2026-03-25 15:31:59.918	2026-04-30 16:56:18.517
7a6855f6-0008-417b-a5df-d5d279802489	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	8557fae0-d2a7-439e-ba8b-3f5465423542	1400	2026-03-25 15:31:59.901	2026-04-30 17:00:35.392
d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	59287.38	2026-03-25 15:31:59.914	2026-04-30 16:53:01.495
6817f6d3-94d4-4841-a28d-1444b6a3a8c6	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	d176b133-d7e7-4a5e-bd77-701cef7f7bca	34876	2026-04-25 19:25:42.56	2026-04-30 16:57:11.679
573e41d0-b3a7-4c53-a9c0-715d99ee592d	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	7c0133d0-7a90-47a8-bd7e-ab071cfca1c8	111000	2026-04-22 16:09:52.067	2026-04-30 18:08:05.422
dc93307c-9918-470d-87d6-626c4df2f43b	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	e118748e-8fe5-4c36-a119-6555f6af4160	21000	2026-03-28 12:31:49.393	2026-04-30 13:25:41.42
fcce5ed4-d10a-437e-8807-1114e98f8192	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	5e1bb381-4871-46f2-93d8-bb339304efce	700	2026-03-25 15:31:59.9	2026-04-30 17:01:07.937
45517d10-82f6-4930-a07f-ae756c314bb4	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	e7133872-dedf-4e1b-a915-3b1458266906	0	2026-03-25 15:31:59.909	2026-04-30 16:48:05.16
a07ecfbd-38e3-459a-a94b-c172b9c809b0	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	011aed10-550c-4669-8d0e-af36c53e3611	3518	2026-04-22 18:11:34.471	2026-04-30 16:39:50.346
de43a9e1-6ca0-4f9e-92df-1c547e54ccc9	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	166baf00-012e-4961-8ea5-93fbad9cbdaa	saving-acc-166baf00-012e-4961-8ea5-93fbad9cbdaa	5000	2026-04-30 18:13:15.85	2026-04-30 18:40:36.412
7f0439bd-700c-4a10-b5ac-db8d12eca0a3	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	736e95ba-15ca-408c-a02d-71874e3e54e3	24206.47	2026-03-25 15:31:59.888	2026-04-30 17:02:03.814
cceb2a57-5d62-49af-9f8e-0a46c70ef69b	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	4fd24e66-2498-4fd7-b40b-be8bfd94a413	main-acc-4fd24e66-2498-4fd7-b40b-be8bfd94a413	95000	2026-04-30 18:13:15.93	2026-04-30 18:40:36.546
a822a312-fea6-4d0b-ae19-ff1461f3bc4e	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	4fd24e66-2498-4fd7-b40b-be8bfd94a413	emergency-acc-4fd24e66-2498-4fd7-b40b-be8bfd94a413	45000	2026-04-30 18:13:15.941	2026-04-30 18:40:36.553
89065518-6f17-4406-b2da-b8182d902dfa	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	4fd24e66-2498-4fd7-b40b-be8bfd94a413	saving-acc-4fd24e66-2498-4fd7-b40b-be8bfd94a413	5000	2026-04-30 18:13:15.95	2026-04-30 18:40:36.56
b3c3d325-dfea-4544-8bfb-764e00f4f8ad	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	0	2026-03-25 16:57:07.564	2026-04-30 18:49:18.035
f428d88f-9a22-4d84-b159-db6ce64fb7fc	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	dde45f0a-23a1-4c53-bc03-5a907ef5f406	4000	2026-03-25 15:31:59.897	2026-04-30 18:49:18.09
\.


--
-- Data for Name: Bank; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Bank" (id, "organizationId", code, name, color, "createdAt") FROM stdin;
fd458e1d-00cd-4842-a8f4-6f97ebbda77b	32839490-a7f5-4730-a78f-0923f494bf47	GHB	ธนาคารอาคารสงเคราะห์	#EF4822	2026-04-22 18:09:37.874
ce6cb29c-d2c1-42b6-82c0-a14906f83ad7	ee81df9d-bb14-419b-bd49-d4c77b4d4214	KBANK	ธนาคารกสิกรไทย	\N	2026-04-24 11:44:38.6
57f3252d-8607-4b22-90e8-c3dc8f8552f6	ee81df9d-bb14-419b-bd49-d4c77b4d4214	KTB	ธนาคารกรุงไทย	\N	2026-04-24 11:44:38.603
4ab3d1f8-f8ed-4b5b-b672-48cf0d092580	ee81df9d-bb14-419b-bd49-d4c77b4d4214	GSB	ธนาคารออมสิน	\N	2026-04-24 11:44:38.604
764eb963-56d6-41a8-9314-0a43c87d0775	ee81df9d-bb14-419b-bd49-d4c77b4d4214	KKP	เกียรตินาคินภัทร	\N	2026-04-24 11:44:38.606
d1f350e9-be26-4fc6-8a7e-49bc3dcf5a0a	ee81df9d-bb14-419b-bd49-d4c77b4d4214	UOB	ธนาคารยูโอบี	\N	2026-04-24 11:44:38.608
0a17beb2-de2f-4436-9fcd-0978a7d5701f	\N	BBL	ธนาคารกรุงเทพ	\N	2026-04-30 13:09:11.756
a9532d66-6378-42ee-92be-f735a9e085ed	32839490-a7f5-4730-a78f-0923f494bf47	BBL	ธนาคารกรุงเทพ	#0047AB	2026-03-25 10:15:34.138
8bc3e27a-34a0-4adf-812c-26435b680489	32839490-a7f5-4730-a78f-0923f494bf47	SCB	ธนาคารไทยพาณิชย์	#4E2E7F	2026-03-25 10:15:34.14
e50a03d0-5d36-47ab-8216-12dd5ef923d2	32839490-a7f5-4730-a78f-0923f494bf47	KBANK	ธนาคารกสิกรไทย	#00A950	2026-03-25 10:15:34.141
5c866813-ab02-41bd-90fb-be199efd900c	32839490-a7f5-4730-a78f-0923f494bf47	KTB	ธนาคารกรุงไทย	#00ADEF	2026-03-25 10:15:34.143
36fa873e-cbeb-45f6-ba95-e362ccd1dbeb	32839490-a7f5-4730-a78f-0923f494bf47	GSB	ธนาคารออมสิน	#EB198D	2026-03-25 10:15:34.144
9f5446fa-c274-448e-96ff-b5d6205db701	32839490-a7f5-4730-a78f-0923f494bf47	KKP	เกียรตินาคินภัทร	#a971fe	2026-03-25 10:15:34.145
c09992ca-34c7-4326-8997-ad08c4c473f1	32839490-a7f5-4730-a78f-0923f494bf47	UOB	ธนาคารยูโอบี	#0062ff	2026-03-25 10:15:34.146
4eab020d-f3ae-444d-a66f-257a41c61887	\N	SCB	ธนาคารไทยพาณิชย์	\N	2026-04-30 13:09:11.759
98c57f68-c7eb-46e3-87c9-259bdbe54a91	\N	KBANK	ธนาคารกสิกรไทย	\N	2026-04-30 13:09:11.763
c05b50a6-2e8c-4e46-88b7-d7a588bc40cd	\N	KTB	ธนาคารกรุงไทย	\N	2026-04-30 13:09:11.767
7184d5a7-0cdb-464b-aead-ef162c9e7347	\N	GSB	ธนาคารออมสิน	\N	2026-04-30 13:09:11.77
84ab8dac-dbc0-4720-ae5d-aa36484ce5f5	\N	SCB	ธนาคารไทยพาณิชย์	\N	2026-04-30 13:09:11.104
bc058f01-8178-445a-8851-9682be9d52ca	ee81df9d-bb14-419b-bd49-d4c77b4d4214	BBL	ธนาคารกรุงเทพ	\N	2026-04-24 11:44:38.595
404e7de9-e426-4ce0-858e-9a9b102efcff	ee81df9d-bb14-419b-bd49-d4c77b4d4214	SCB	ธนาคารไทยพาณิชย์	\N	2026-04-24 11:44:38.598
d3430882-0b11-440e-9b3b-cd67fb81cf41	\N	KBANK	ธนาคารกสิกรไทย	\N	2026-04-30 13:09:11.108
5b2f0280-28e6-437d-aa13-53dd1f4050a6	\N	KTB	ธนาคารกรุงไทย	\N	2026-04-30 13:09:11.112
2b87683b-578d-4091-bda0-ede0d49f0769	\N	GSB	ธนาคารออมสิน	\N	2026-04-30 13:09:11.117
ed1ae2b3-2504-4bf8-9172-b4df2ddb37cf	\N	KKP	เกียรตินาคินภัทร	\N	2026-04-30 13:09:11.121
c1131b20-6952-4a6e-969c-07809c79b62b	\N	UOB	ธนาคารยูโอบี	\N	2026-04-30 13:09:11.125
fba3fb59-914b-4d21-9a4f-e7bbc00f5175	\N	BBL	ธนาคารกรุงเทพ	\N	2026-04-30 13:09:11.096
10d9eea4-a964-4be9-aef2-0b94ba6293d4	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	UOB	ธนาคารยูโอบี	\N	2026-04-30 18:13:14.631
17518d23-1773-4cf7-aee5-95bf6ba7a6fb	32839490-a7f5-4730-a78f-0923f494bf47	TTB	ธนาคารทหารไทย	#02401f	2026-04-30 13:18:11.789
f253fc9b-6764-46bc-8b6b-d15a250d9d62	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	BBL	ธนาคารกรุงเทพ	\N	2026-04-30 18:13:15.18
d0df3f10-8027-46fd-8253-87f642e42248	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	SCB	ธนาคารไทยพาณิชย์	\N	2026-04-30 18:13:15.183
758cf3e1-70a0-4055-8780-f4ae9668ac0c	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	KBANK	ธนาคารกสิกรไทย	\N	2026-04-30 18:13:15.185
2ddef388-e9ba-4686-a01f-1c068efd7a9b	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	KTB	ธนาคารกรุงไทย	\N	2026-04-30 18:13:15.189
203b6871-1ff7-4be4-83a0-0817db3f6bed	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	GSB	ธนาคารออมสิน	\N	2026-04-30 18:13:15.192
e8757a65-1791-403f-bf4e-b9258a08d9c3	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	KKP	เกียรตินาคินภัทร	\N	2026-04-30 18:13:15.195
fe1d04f8-c7d8-44f2-8cc9-e0ddae4829c9	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	UOB	ธนาคารยูโอบี	\N	2026-04-30 18:13:15.198
4333d363-f5fa-4f52-be41-c4ba53d138bd	\N	KKP	เกียรตินาคินภัทร	\N	2026-04-30 13:09:11.773
d32414e6-c9a3-4131-a0e4-9da9b07133bf	\N	UOB	ธนาคารยูโอบี	\N	2026-04-30 13:09:11.777
96c9eb7a-7f0f-4eae-94d8-1d1f4c1d8a26	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	BBL	ธนาคารกรุงเทพ	\N	2026-04-30 18:13:14.609
d816092c-bb67-4a72-a216-9a413cf01fc5	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	SCB	ธนาคารไทยพาณิชย์	\N	2026-04-30 18:13:14.614
1dc8fcf0-a504-466f-a72d-1804d5ff79b8	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	KBANK	ธนาคารกสิกรไทย	\N	2026-04-30 18:13:14.618
e4458e84-a30c-4cdf-b570-8049cf4e3e6a	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	KTB	ธนาคารกรุงไทย	\N	2026-04-30 18:13:14.621
11616f37-8b45-49d3-87fc-5981c52b4556	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	GSB	ธนาคารออมสิน	\N	2026-04-30 18:13:14.624
1fb95bcf-fdd7-4f75-af8b-e3d47b28a24f	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	KKP	เกียรตินาคินภัทร	\N	2026-04-30 18:13:14.628
\.


--
-- Data for Name: FinancialRecord; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FinancialRecord" (id, "organizationId", "userId", "accountId", amount, date, type, note, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Liability; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Liability" (id, "organizationId", "userId", "accountId", amount, "createdAt", "updatedAt") FROM stdin;
51f240a8-e35d-4752-b2ac-1f147d00186a	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	d78d57fa-7b30-49e1-82e7-bcb16d87193b	0	2026-03-25 15:31:59.911	2026-04-30 17:51:29.332
\.


--
-- Data for Name: Loan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Loan" (id, "organizationId", code, "userId", "accountId", name, "totalAmount", status, date, "createdAt", "updatedAt", "actualDate", "assetId", "liabilityId") FROM stdin;
39a4917c-c589-446a-a84f-fe5bf7a42680	32839490-a7f5-4730-a78f-0923f494bf47	L003	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	ภาษี	2224	ACTIVE	2026-02-21 00:00:00	2026-03-25 13:06:14.192	2026-03-25 16:04:36.991	2026-02-21 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N
45c7d2cf-cd62-4f83-8883-d8696ec26187	32839490-a7f5-4730-a78f-0923f494bf47	L004	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	วันเกิดแม่	2000	ACTIVE	2026-02-04 00:00:00	2026-03-25 13:06:14.194	2026-03-25 16:04:36.992	2026-02-04 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N
4b967a70-2733-42ca-89ab-8fb17fc1c363	32839490-a7f5-4730-a78f-0923f494bf47	L005	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	ซื้อของแม่	12700	ACTIVE	2026-02-03 00:00:00	2026-03-25 13:06:14.196	2026-03-25 16:04:36.994	2026-02-03 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N
a6695f95-48a0-4cb4-9c04-878c9a6236f6	32839490-a7f5-4730-a78f-0923f494bf47	L006	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	ยืม	3000	ACTIVE	2026-03-15 00:00:00	2026-03-25 13:06:14.198	2026-03-25 16:04:36.995	2026-03-15 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N
a2bc9399-3298-458c-a582-bdd9c587ae6e	32839490-a7f5-4730-a78f-0923f494bf47	L007	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	ยืม	1000	ACTIVE	2026-03-19 00:00:00	2026-03-25 13:06:14.2	2026-03-25 16:04:36.996	2026-03-19 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N
85222b31-c36e-409c-a71b-cfc2d6a53042	32839490-a7f5-4730-a78f-0923f494bf47	L008	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	ยืม	1000	ACTIVE	2026-03-20 00:00:00	2026-03-25 13:06:14.202	2026-03-25 16:04:36.998	2026-03-20 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N
7663b24e-385e-4682-a12f-6471b55343c9	32839490-a7f5-4730-a78f-0923f494bf47	L009	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	ซ่อมจานดาวเทียม	1500	ACTIVE	2026-03-23 00:00:00	2026-03-25 13:06:14.203	2026-03-25 16:04:36.999	2026-03-23 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N
bebe1ff5-92b0-4650-96ea-ba6a4c142c50	32839490-a7f5-4730-a78f-0923f494bf47	L010	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	ยืม	1000	ACTIVE	2026-03-24 00:00:00	2026-03-25 13:06:14.205	2026-03-25 16:04:37.001	2026-03-24 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N
dfb71216-006f-4ecc-961f-64a691d45aea	32839490-a7f5-4730-a78f-0923f494bf47	L028	2dc4de80-5323-4859-81f0-caf914fc5f60	89e8be90-4999-4593-8e47-01a618ae0d94	ชุดทำงาน	4850	ACTIVE	2026-04-22 16:49:51.08	2026-04-22 16:49:51.082	2026-04-22 16:49:51.082	2026-04-11 00:00:00	d057c431-a00f-4408-8f12-fd9c9c93409e	\N
a41d7d63-ce2f-4cc8-9039-24442eadec60	32839490-a7f5-4730-a78f-0923f494bf47	L4711	2dc4de80-5323-4859-81f0-caf914fc5f60	bf76aa0f-db8a-4062-ba12-aaae5f06a479	ยืมทำบ้าน 20000+30000	50000	ACTIVE	2026-01-17 00:00:00	2026-04-30 18:43:11.581	2026-04-30 18:43:11.581	2026-01-17 00:00:00	\N	\N
\.


--
-- Data for Name: Organization; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Organization" (id, name, "createdAt", "updatedAt", "isActive") FROM stdin;
ee81df9d-bb14-419b-bd49-d4c77b4d4214	System Management	2026-04-24 11:44:38.338	2026-04-24 11:44:38.338	t
32839490-a7f5-4730-a78f-0923f494bf47	neranchara	2026-03-25 10:15:34.065	2026-04-25 19:00:22.785	t
87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	Nexworth Business	2026-04-30 18:13:14.326	2026-04-30 18:13:14.326	t
bf143f6d-d1f3-495a-b639-7fed3d87a0e1	Test Environment	2026-04-30 18:13:14.861	2026-04-30 18:13:14.861	t
\.


--
-- Data for Name: Permission; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Permission" (id, "roleId", resource, "canView", "canCreate", "canUpdate", "canDelete", "createdAt", "updatedAt") FROM stdin;
888956cd-ea50-41fc-9438-66ab9bef8aaa	1c9afd93-7eee-4aaf-a04f-0d7d33d32bc3	monthly-summary	t	t	t	t	2026-04-25 19:08:52.109	2026-04-25 19:08:52.109
951b8c11-e87c-4ab3-80b0-52cf862a2607	1c9afd93-7eee-4aaf-a04f-0d7d33d32bc3	roles	t	t	t	t	2026-04-25 19:08:52.177	2026-04-25 19:08:52.177
61296ee2-d92f-4e13-ab66-2119b5393da2	1c9afd93-7eee-4aaf-a04f-0d7d33d32bc3	settings	t	t	t	t	2026-04-25 19:08:52.212	2026-04-25 19:08:52.212
4aea279d-8a09-4d83-aeb2-c39416ef5209	ed8154d1-dd0b-4665-8d9c-876cfde5ea05	monthly	t	f	f	f	2026-04-24 11:44:38.524	2026-04-30 18:40:33.991
3136b697-499d-419a-85d1-9ebb1f009772	70a86436-c928-44cf-80c9-2f7df89de496	loan-tracker	t	t	t	t	2026-04-24 11:44:38.526	2026-04-30 18:40:33.995
00761534-43f6-45bb-9828-054af43ece1e	108fc3ee-bda1-4afa-b45e-598b5079ed02	loan-tracker	t	f	f	f	2026-04-24 11:44:38.528	2026-04-30 18:40:33.999
10030e14-62ec-40f7-a49b-9dbcd82f08fc	376a7dca-f65c-48eb-879f-4c7f3d3e3a89	loan-tracker	t	f	f	f	2026-04-24 11:44:38.531	2026-04-30 18:40:34.002
a878be37-65c8-40a3-9d70-5619c589c126	ed8154d1-dd0b-4665-8d9c-876cfde5ea05	loan-tracker	t	f	f	f	2026-04-24 11:44:38.534	2026-04-30 18:40:34.006
e916f982-6fd6-4df2-b853-1a527a942e8b	70a86436-c928-44cf-80c9-2f7df89de496	liabilities	t	t	t	t	2026-04-24 11:44:38.536	2026-04-30 18:40:34.01
99fa0882-dc80-4fb3-b42c-3fa3b6262b2e	108fc3ee-bda1-4afa-b45e-598b5079ed02	liabilities	t	f	f	f	2026-04-24 11:44:38.538	2026-04-30 18:40:34.013
c3b09f3b-66ae-44ae-83d8-f8eea6a05baf	376a7dca-f65c-48eb-879f-4c7f3d3e3a89	liabilities	t	f	f	f	2026-04-24 11:44:38.541	2026-04-30 18:40:34.017
a35eda4e-18a7-41c9-b1dc-94ea7954336b	ed8154d1-dd0b-4665-8d9c-876cfde5ea05	liabilities	t	f	f	f	2026-04-24 11:44:38.544	2026-04-30 18:40:34.021
b7e28c73-a01a-443f-b317-7a9edbcc591d	70a86436-c928-44cf-80c9-2f7df89de496	assets	t	t	t	t	2026-04-24 11:44:38.546	2026-04-30 18:40:34.025
aa7539b8-47d8-4063-b18f-e2eee74ba22c	108fc3ee-bda1-4afa-b45e-598b5079ed02	assets	t	f	f	f	2026-04-24 11:44:38.548	2026-04-30 18:40:34.028
ef8ea706-5007-4a90-86b9-2fe706ff5b14	376a7dca-f65c-48eb-879f-4c7f3d3e3a89	assets	t	f	f	f	2026-04-24 11:44:38.553	2026-04-30 18:40:34.032
c883e926-848f-4dd1-aa04-728c8b5cc15d	ed8154d1-dd0b-4665-8d9c-876cfde5ea05	assets	t	f	f	f	2026-04-24 11:44:38.555	2026-04-30 18:40:34.035
e620d7e3-6e83-412c-b212-4afd2f736c28	70a86436-c928-44cf-80c9-2f7df89de496	accounts	t	t	t	t	2026-04-24 11:44:38.558	2026-04-30 18:40:34.038
c1df6d32-64e1-4b7d-924f-52d3e7033a81	108fc3ee-bda1-4afa-b45e-598b5079ed02	accounts	f	f	f	f	2026-04-24 11:44:38.56	2026-04-30 18:40:34.042
3e6c7667-b204-4f25-8338-e5afc33588f4	376a7dca-f65c-48eb-879f-4c7f3d3e3a89	accounts	f	f	f	f	2026-04-24 11:44:38.563	2026-04-30 18:40:34.046
db26e893-476b-4c72-bc73-1860c377254d	ed8154d1-dd0b-4665-8d9c-876cfde5ea05	accounts	f	f	f	f	2026-04-24 11:44:38.565	2026-04-30 18:40:34.05
b9dcb1b0-9b0b-463e-8cd6-2ea98472d26b	70a86436-c928-44cf-80c9-2f7df89de496	banks	t	t	t	t	2026-04-24 11:44:38.567	2026-04-30 18:40:34.053
b5eb1af7-4819-49cf-98e9-14cd08c6a80a	108fc3ee-bda1-4afa-b45e-598b5079ed02	banks	f	f	f	f	2026-04-24 11:44:38.569	2026-04-30 18:40:34.057
6375ffef-2d0b-4db8-b237-bbee14b6e257	376a7dca-f65c-48eb-879f-4c7f3d3e3a89	banks	f	f	f	f	2026-04-24 11:44:38.572	2026-04-30 18:40:34.061
3b7b23ff-c8a6-465c-a370-a8f184b6bdcf	ed8154d1-dd0b-4665-8d9c-876cfde5ea05	banks	f	f	f	f	2026-04-24 11:44:38.574	2026-04-30 18:40:34.064
093439a1-a398-45c8-87fe-1fc693fa9a5b	70a86436-c928-44cf-80c9-2f7df89de496	types	t	t	t	t	2026-04-24 11:44:38.576	2026-04-30 18:40:34.068
6b1a8b37-a386-4d9d-ba43-2dbabe07192b	108fc3ee-bda1-4afa-b45e-598b5079ed02	types	f	f	f	f	2026-04-24 11:44:38.579	2026-04-30 18:40:34.071
9a697ffc-d325-4f88-8555-c04ae5362791	376a7dca-f65c-48eb-879f-4c7f3d3e3a89	types	f	f	f	f	2026-04-24 11:44:38.582	2026-04-30 18:40:34.075
f9741088-b1f9-493c-b71b-8d80d351239b	ed8154d1-dd0b-4665-8d9c-876cfde5ea05	types	f	f	f	f	2026-04-24 11:44:38.584	2026-04-30 18:40:34.079
afbf658f-861e-42a9-adc2-746ea374b4aa	70a86436-c928-44cf-80c9-2f7df89de496	categories	t	t	t	t	2026-04-24 11:44:38.586	2026-04-30 18:40:34.082
9a5b9f8b-33f8-4190-abea-337986cd47ce	108fc3ee-bda1-4afa-b45e-598b5079ed02	categories	f	f	f	f	2026-04-24 11:44:38.589	2026-04-30 18:40:34.086
329fcfa1-909e-4016-8851-1557ccbd7cf1	376a7dca-f65c-48eb-879f-4c7f3d3e3a89	categories	f	f	f	f	2026-04-24 11:44:38.591	2026-04-30 18:40:34.09
e9cda25d-1abf-4f7a-9ea7-759e9d9e6fd4	ed8154d1-dd0b-4665-8d9c-876cfde5ea05	categories	f	f	f	f	2026-04-24 11:44:38.593	2026-04-30 18:40:34.094
d84804cd-ae09-490a-94a9-4f7c64edf9c8	70a86436-c928-44cf-80c9-2f7df89de496	dashboard	t	t	t	t	2026-04-24 11:44:38.472	2026-04-30 18:40:33.907
3362ccb3-aecb-4942-a599-9b2d6b1cf64a	108fc3ee-bda1-4afa-b45e-598b5079ed02	dashboard	t	f	f	f	2026-04-24 11:44:38.475	2026-04-30 18:40:33.917
3fb49690-0538-44bb-bba3-b9a1f3beeeab	376a7dca-f65c-48eb-879f-4c7f3d3e3a89	dashboard	t	f	f	f	2026-04-24 11:44:38.479	2026-04-30 18:40:33.924
cba10a4e-e6fc-402f-8788-86d99a68db3b	ed8154d1-dd0b-4665-8d9c-876cfde5ea05	dashboard	t	f	f	f	2026-04-24 11:44:38.482	2026-04-30 18:40:33.928
3557ff6e-414b-4278-a3c6-d6e543a0bb42	70a86436-c928-44cf-80c9-2f7df89de496	users	t	t	t	t	2026-04-24 11:44:38.486	2026-04-30 18:40:33.932
c351bf4a-c750-4a1e-a91c-fe441fa58877	108fc3ee-bda1-4afa-b45e-598b5079ed02	users	f	f	f	f	2026-04-24 11:44:38.489	2026-04-30 18:40:33.936
8c10bace-2348-48bc-a241-449b92be6f92	376a7dca-f65c-48eb-879f-4c7f3d3e3a89	users	f	f	f	f	2026-04-24 11:44:38.491	2026-04-30 18:40:33.94
58e74702-bb39-423d-94c1-cd4f61b5114e	ed8154d1-dd0b-4665-8d9c-876cfde5ea05	users	f	f	f	f	2026-04-24 11:44:38.494	2026-04-30 18:40:33.944
54704349-8897-47be-8812-17b52853d9f7	70a86436-c928-44cf-80c9-2f7df89de496	transactions	t	t	t	t	2026-04-24 11:44:38.496	2026-04-30 18:40:33.948
07c0357e-bf1b-4601-8bd3-b53117dfb1c7	108fc3ee-bda1-4afa-b45e-598b5079ed02	transactions	t	f	f	f	2026-04-24 11:44:38.498	2026-04-30 18:40:33.951
2e0af564-aae5-454c-9c01-838a7cda1b2f	376a7dca-f65c-48eb-879f-4c7f3d3e3a89	transactions	t	f	f	f	2026-04-24 11:44:38.501	2026-04-30 18:40:33.955
06aedc96-224c-4d19-8891-79ffa46cda12	ed8154d1-dd0b-4665-8d9c-876cfde5ea05	transactions	t	f	f	f	2026-04-24 11:44:38.503	2026-04-30 18:40:33.959
af6223c1-65cc-4540-977c-a43e96547e43	70a86436-c928-44cf-80c9-2f7df89de496	permissions	t	t	t	t	2026-04-24 11:44:38.506	2026-04-30 18:40:33.963
d2c92088-e306-48c3-9246-143a63cfb307	108fc3ee-bda1-4afa-b45e-598b5079ed02	permissions	f	f	f	f	2026-04-24 11:44:38.508	2026-04-30 18:40:33.967
6305ec5a-2b74-448b-b7b7-d519159714db	376a7dca-f65c-48eb-879f-4c7f3d3e3a89	permissions	f	f	f	f	2026-04-24 11:44:38.511	2026-04-30 18:40:33.971
00675759-be1e-4caf-bf8b-865d6acfa589	ed8154d1-dd0b-4665-8d9c-876cfde5ea05	permissions	f	f	f	f	2026-04-24 11:44:38.514	2026-04-30 18:40:33.975
7eff703f-d03a-4ef3-a02c-69a8ef27b4ca	1c9afd93-7eee-4aaf-a04f-0d7d33d32bc3	dashboard	t	t	t	t	2026-04-25 19:08:51.884	2026-04-30 13:05:27.615
cd743205-7665-432c-92ce-a14a6283a66a	108fc3ee-bda1-4afa-b45e-598b5079ed02	monthly	t	f	f	f	2026-04-24 11:44:38.518	2026-04-30 18:40:33.983
4f9989e5-f885-42c8-bb07-765451b04a34	376a7dca-f65c-48eb-879f-4c7f3d3e3a89	monthly	t	f	f	f	2026-04-24 11:44:38.521	2026-04-30 18:40:33.987
5a9802a1-2176-4c52-a52d-8ab83a5f83df	1c9afd93-7eee-4aaf-a04f-0d7d33d32bc3	users	t	t	t	t	2026-04-25 19:08:52.143	2026-04-30 13:05:27.756
61f0d972-3f22-4256-b099-66a070dd4053	1c9afd93-7eee-4aaf-a04f-0d7d33d32bc3	transactions	t	t	t	t	2026-04-25 19:08:51.971	2026-04-30 13:05:27.886
813806ad-c93b-478a-9c14-d396dfa0d34a	1c9afd93-7eee-4aaf-a04f-0d7d33d32bc3	loan-tracker	t	t	t	t	2026-04-25 19:08:52.075	2026-04-30 13:05:28.281
b52db9a0-2fa3-40ad-8f08-96830658fc93	1c9afd93-7eee-4aaf-a04f-0d7d33d32bc3	liabilities	t	t	t	t	2026-04-25 19:08:52.04	2026-04-30 13:05:28.413
196b5b08-a6e4-4e4f-bef9-503955c35880	1c9afd93-7eee-4aaf-a04f-0d7d33d32bc3	assets	t	t	t	t	2026-04-25 19:08:52.006	2026-04-30 13:05:28.542
9a5ad7b5-537a-4b98-adfb-1b4a4853458a	70a86436-c928-44cf-80c9-2f7df89de496	monthly	t	t	t	t	2026-04-24 11:44:38.516	2026-04-30 18:40:33.979
3336ebb0-47dc-4355-908e-45a8de988d5a	34cea92f-6d42-4af5-9d41-36fbaea1537c	dashboard	t	f	f	f	2026-04-30 13:05:27.647	2026-04-30 13:05:27.647
b6410879-1693-4dcf-ab4c-688e28a8f9df	3f43b210-ded7-4ba5-8fe4-87dab4e9c26c	dashboard	t	f	f	f	2026-04-30 13:05:27.688	2026-04-30 13:05:27.688
6d7180a3-3fef-4871-8425-391780527a19	bd7d517f-df05-44cc-b97f-0a8a50b16e59	dashboard	t	f	f	f	2026-04-30 13:05:27.722	2026-04-30 13:05:27.722
4724dceb-9843-4816-8ca0-0cbaefaebcf3	34cea92f-6d42-4af5-9d41-36fbaea1537c	users	f	f	f	f	2026-04-30 13:05:27.789	2026-04-30 13:05:27.789
09814a58-49bc-4107-8fad-80a1334ef65b	3f43b210-ded7-4ba5-8fe4-87dab4e9c26c	users	f	f	f	f	2026-04-30 13:05:27.821	2026-04-30 13:05:27.821
5ceca8c4-76e2-433f-8a9b-594f818e24bd	bd7d517f-df05-44cc-b97f-0a8a50b16e59	users	f	f	f	f	2026-04-30 13:05:27.854	2026-04-30 13:05:27.854
3a08eebf-64b0-4a99-9f2f-b51d10ea8eb5	34cea92f-6d42-4af5-9d41-36fbaea1537c	transactions	t	f	f	f	2026-04-30 13:05:27.918	2026-04-30 13:05:27.918
e424f463-0aed-423f-9568-c2c15f46a922	3f43b210-ded7-4ba5-8fe4-87dab4e9c26c	transactions	t	f	f	f	2026-04-30 13:05:27.952	2026-04-30 13:05:27.952
2c5887d9-e166-40a0-83f8-899f5c7f8f36	bd7d517f-df05-44cc-b97f-0a8a50b16e59	transactions	t	f	f	f	2026-04-30 13:05:27.987	2026-04-30 13:05:27.987
7e405e92-c5d1-4ee4-ab8b-da633e627a43	1c9afd93-7eee-4aaf-a04f-0d7d33d32bc3	permissions	t	t	t	t	2026-04-30 13:05:28.019	2026-04-30 13:05:28.019
ae4a38a9-c5dd-48e9-82e0-e94610454f2d	34cea92f-6d42-4af5-9d41-36fbaea1537c	permissions	f	f	f	f	2026-04-30 13:05:28.052	2026-04-30 13:05:28.052
378aec0c-0c27-4317-9e3a-ece3f9227266	3f43b210-ded7-4ba5-8fe4-87dab4e9c26c	permissions	f	f	f	f	2026-04-30 13:05:28.085	2026-04-30 13:05:28.085
7aebebe8-7eac-49df-a726-e46bc49ad482	bd7d517f-df05-44cc-b97f-0a8a50b16e59	permissions	f	f	f	f	2026-04-30 13:05:28.118	2026-04-30 13:05:28.118
d90f8707-4417-401f-9113-98680a8aea90	1c9afd93-7eee-4aaf-a04f-0d7d33d32bc3	monthly	t	t	t	t	2026-04-30 13:05:28.151	2026-04-30 13:05:28.151
dca15279-5050-47ee-8d74-3e2736e0f2c9	34cea92f-6d42-4af5-9d41-36fbaea1537c	monthly	t	f	f	f	2026-04-30 13:05:28.183	2026-04-30 13:05:28.183
c83f7b9b-cc77-41f1-9bbd-0c29fc960e61	3f43b210-ded7-4ba5-8fe4-87dab4e9c26c	monthly	t	f	f	f	2026-04-30 13:05:28.215	2026-04-30 13:05:28.215
989247b1-4ac3-4ded-ab2e-cd491846bc62	bd7d517f-df05-44cc-b97f-0a8a50b16e59	monthly	t	f	f	f	2026-04-30 13:05:28.248	2026-04-30 13:05:28.248
6053a72f-f0c5-4273-8466-182b61541114	34cea92f-6d42-4af5-9d41-36fbaea1537c	loan-tracker	t	f	f	f	2026-04-30 13:05:28.314	2026-04-30 13:05:28.314
66c0f383-346e-4c07-9dbc-b71542ed99b4	3f43b210-ded7-4ba5-8fe4-87dab4e9c26c	loan-tracker	t	f	f	f	2026-04-30 13:05:28.347	2026-04-30 13:05:28.347
2e855b94-02af-43d8-8d61-9f4b7b1f3b3b	bd7d517f-df05-44cc-b97f-0a8a50b16e59	loan-tracker	t	f	f	f	2026-04-30 13:05:28.379	2026-04-30 13:05:28.379
bfacd70a-169e-4a90-85a6-1e683a950b80	34cea92f-6d42-4af5-9d41-36fbaea1537c	liabilities	t	f	f	f	2026-04-30 13:05:28.445	2026-04-30 13:05:28.445
c68d7bcc-ec04-4d17-a3b4-329989bd87c8	3f43b210-ded7-4ba5-8fe4-87dab4e9c26c	liabilities	t	f	f	f	2026-04-30 13:05:28.477	2026-04-30 13:05:28.477
bce1e754-ad3e-4c4e-bbef-ac7e3f4448b7	bd7d517f-df05-44cc-b97f-0a8a50b16e59	liabilities	t	f	f	f	2026-04-30 13:05:28.509	2026-04-30 13:05:28.509
69d3b439-e3d6-4e47-8762-1b5ec740c6ad	34cea92f-6d42-4af5-9d41-36fbaea1537c	assets	t	f	f	f	2026-04-30 13:05:28.574	2026-04-30 13:05:28.574
a9ad1209-7759-4b53-887d-631639b5967e	3f43b210-ded7-4ba5-8fe4-87dab4e9c26c	assets	t	f	f	f	2026-04-30 13:05:28.606	2026-04-30 13:05:28.606
c1202b70-e1d3-47e5-8b75-956fc5691f1e	bd7d517f-df05-44cc-b97f-0a8a50b16e59	assets	t	f	f	f	2026-04-30 13:05:28.638	2026-04-30 13:05:28.638
482629dc-e669-4caa-909d-f9864267cdad	1c9afd93-7eee-4aaf-a04f-0d7d33d32bc3	accounts	t	t	t	t	2026-04-30 13:05:28.671	2026-04-30 13:05:28.671
165ea8bc-6efa-4c48-83e3-f493ea8e5118	34cea92f-6d42-4af5-9d41-36fbaea1537c	accounts	f	f	f	f	2026-04-30 13:05:28.704	2026-04-30 13:05:28.704
509c1362-25ec-4e66-b313-f8c116ea489a	3f43b210-ded7-4ba5-8fe4-87dab4e9c26c	accounts	f	f	f	f	2026-04-30 13:05:28.737	2026-04-30 13:05:28.737
dde2835c-c082-482b-b320-82475f98ff36	bd7d517f-df05-44cc-b97f-0a8a50b16e59	accounts	f	f	f	f	2026-04-30 13:05:28.769	2026-04-30 13:05:28.769
7f2a64e4-1d83-4f08-9a62-7362e1e6c43f	1c9afd93-7eee-4aaf-a04f-0d7d33d32bc3	banks	t	t	t	t	2026-04-30 13:05:28.802	2026-04-30 13:05:28.802
b5c055d9-d4fc-44c5-87ee-5bf5fa1c210e	34cea92f-6d42-4af5-9d41-36fbaea1537c	banks	f	f	f	f	2026-04-30 13:05:28.835	2026-04-30 13:05:28.835
b138a78a-f6d4-4d3c-a14a-fc8b40b8b6ab	3f43b210-ded7-4ba5-8fe4-87dab4e9c26c	banks	f	f	f	f	2026-04-30 13:05:28.868	2026-04-30 13:05:28.868
8631acad-b183-45f9-a97a-ed800e6e1618	bd7d517f-df05-44cc-b97f-0a8a50b16e59	banks	f	f	f	f	2026-04-30 13:05:28.901	2026-04-30 13:05:28.901
7e7d2626-5bae-46f2-95f2-d38594c40b46	1c9afd93-7eee-4aaf-a04f-0d7d33d32bc3	types	t	t	t	t	2026-04-30 13:05:28.935	2026-04-30 13:05:28.935
ed19b202-87f4-4df1-86ff-770bbfc3f6a9	34cea92f-6d42-4af5-9d41-36fbaea1537c	types	f	f	f	f	2026-04-30 13:05:28.967	2026-04-30 13:05:28.967
01426f5b-a24f-4677-8ec5-7497abc2e3bc	3f43b210-ded7-4ba5-8fe4-87dab4e9c26c	types	f	f	f	f	2026-04-30 13:05:29.006	2026-04-30 13:05:29.006
15b799e2-9120-4f66-bcb5-00e9dfa32dbd	bd7d517f-df05-44cc-b97f-0a8a50b16e59	types	f	f	f	f	2026-04-30 13:05:29.038	2026-04-30 13:05:29.038
77a75803-372b-4c2d-8cd1-358a496a908d	1c9afd93-7eee-4aaf-a04f-0d7d33d32bc3	categories	t	t	t	t	2026-04-30 13:05:29.071	2026-04-30 13:05:29.071
ccade333-aeec-4ce4-87f3-5aa61dfb5ec9	34cea92f-6d42-4af5-9d41-36fbaea1537c	categories	f	f	f	f	2026-04-30 13:05:29.103	2026-04-30 13:05:29.103
d185f551-e7e3-4020-855c-522088af4381	3f43b210-ded7-4ba5-8fe4-87dab4e9c26c	categories	f	f	f	f	2026-04-30 13:05:29.135	2026-04-30 13:05:29.135
98a068ea-9c26-4566-b1b3-f867604276d1	bd7d517f-df05-44cc-b97f-0a8a50b16e59	categories	f	f	f	f	2026-04-30 13:05:29.167	2026-04-30 13:05:29.167
008b6712-9386-4ec5-aff0-0e6e6449c6ad	b376021c-731f-44f0-906a-bcc3f0f80e58	banks	f	f	f	f	2026-04-30 13:09:11.056	2026-04-30 16:21:50.942
fc0633dd-3773-4055-8cdb-d48cf2c0c646	ae990866-fe93-4ed4-8fd1-366d1e6bc512	banks	f	f	f	f	2026-04-30 13:09:11.06	2026-04-30 16:21:50.945
232b63c1-15cb-4907-b7c0-3e17e92ceb22	dae7c000-c362-41c3-bb11-c8243b405b51	types	t	t	t	t	2026-04-30 13:09:11.064	2026-04-30 16:21:50.947
8f42fd45-7d89-42ea-aba2-5a91754f813b	dae7c000-c362-41c3-bb11-c8243b405b51	liabilities	t	t	t	t	2026-04-30 13:09:10.993	2026-04-30 16:21:50.912
21a104c8-00c6-46cc-b8ff-6840d34e37ff	b376021c-731f-44f0-906a-bcc3f0f80e58	liabilities	t	f	f	f	2026-04-30 13:09:11.002	2026-04-30 16:21:50.916
e7d91b95-3070-4b4a-9fd1-0bcc3eb53fa0	ae990866-fe93-4ed4-8fd1-366d1e6bc512	liabilities	t	f	f	f	2026-04-30 13:09:11.006	2026-04-30 16:21:50.918
6229e350-1a30-4079-b0b8-c45dff3e3fbd	dae7c000-c362-41c3-bb11-c8243b405b51	assets	t	t	t	t	2026-04-30 13:09:11.01	2026-04-30 16:21:50.92
232e7726-a2c3-47bf-b340-2facf5d69712	07d4568f-3cfd-410a-9c00-7e7dbdf597aa	assets	t	f	f	f	2026-04-30 13:09:11.014	2026-04-30 16:21:50.922
05d9f825-522a-405f-8f7f-2289368e7c36	b376021c-731f-44f0-906a-bcc3f0f80e58	assets	t	f	f	f	2026-04-30 13:09:11.018	2026-04-30 16:21:50.924
3ed2d876-13f1-4014-8366-a3cfbb965967	ae990866-fe93-4ed4-8fd1-366d1e6bc512	assets	t	f	f	f	2026-04-30 13:09:11.023	2026-04-30 16:21:50.927
faf1f266-06fe-4716-8dc0-9b78e34c7abe	dae7c000-c362-41c3-bb11-c8243b405b51	accounts	t	t	t	t	2026-04-30 13:09:11.028	2026-04-30 16:21:50.929
429c5081-6e6a-4ea4-93bf-730de56ba1cc	07d4568f-3cfd-410a-9c00-7e7dbdf597aa	accounts	f	f	f	f	2026-04-30 13:09:11.032	2026-04-30 16:21:50.931
c54958f9-4cd7-41c5-9091-ee31f20e4720	b376021c-731f-44f0-906a-bcc3f0f80e58	accounts	f	f	f	f	2026-04-30 13:09:11.037	2026-04-30 16:21:50.933
4fd90a49-7658-4744-9ccd-2db4c8f16fe8	ae990866-fe93-4ed4-8fd1-366d1e6bc512	accounts	f	f	f	f	2026-04-30 13:09:11.042	2026-04-30 16:21:50.936
c8dd18f5-6b98-485f-b722-db8dea4e9929	dae7c000-c362-41c3-bb11-c8243b405b51	banks	t	t	t	t	2026-04-30 13:09:11.047	2026-04-30 16:21:50.938
c7db0f4e-9066-4653-a3fd-73ac4cd6e9e2	07d4568f-3cfd-410a-9c00-7e7dbdf597aa	banks	f	f	f	f	2026-04-30 13:09:11.051	2026-04-30 16:21:50.94
e15faa8e-4233-4c38-9adc-beed0eca82cc	ac7b8d42-51de-4c45-8cbd-24c55ed54222	banks	t	t	t	t	2026-03-24 04:58:47.379	2026-04-17 10:54:54.437
a238726c-0521-426c-a582-1764f59d502d	ac7b8d42-51de-4c45-8cbd-24c55ed54222	types	t	t	t	t	2026-03-24 04:58:47.381	2026-04-17 10:54:54.437
c0686f8d-769b-45d3-a44b-ad6546a6b8ca	ac7b8d42-51de-4c45-8cbd-24c55ed54222	categories	t	t	t	t	2026-03-24 04:58:47.382	2026-04-17 10:54:54.437
3bbcb922-11c3-48e0-a8e1-ccac94167e61	ac7b8d42-51de-4c45-8cbd-24c55ed54222	users	t	t	t	t	2026-03-24 04:58:47.383	2026-04-17 10:54:54.437
32e60876-988f-4de5-92ce-1004525b41eb	ac7b8d42-51de-4c45-8cbd-24c55ed54222	loan-tracker	t	t	t	t	2026-03-24 04:58:47.383	2026-04-17 10:54:54.437
76f315b6-727b-4efb-ae60-150f22d6d3fa	ac7b8d42-51de-4c45-8cbd-24c55ed54222	permissions	t	t	t	t	2026-03-24 04:58:47.384	2026-04-17 10:54:54.437
ccc13a32-493e-4913-9066-f6ff67fff233	ac7b8d42-51de-4c45-8cbd-24c55ed54222	dashboard	t	t	t	t	2026-03-24 04:58:47.369	2026-04-17 10:54:54.437
f7b30fa4-9763-45d3-b3b3-120a650c4fb8	ac7b8d42-51de-4c45-8cbd-24c55ed54222	monthly	t	t	t	t	2026-03-24 04:58:47.373	2026-04-17 10:54:54.437
b20f7260-22e8-4865-8db4-f2a7dbe27554	ac7b8d42-51de-4c45-8cbd-24c55ed54222	transactions	t	t	t	t	2026-03-24 04:58:47.374	2026-04-17 10:54:54.437
f2923009-228f-4ac4-a543-3d7dc4e735c3	ac7b8d42-51de-4c45-8cbd-24c55ed54222	accounts	t	t	t	t	2026-03-24 04:58:47.375	2026-04-17 10:54:54.437
734421af-3a95-4661-8fde-5d25f6abcc6b	ac7b8d42-51de-4c45-8cbd-24c55ed54222	assets	t	t	t	t	2026-03-24 04:58:47.376	2026-04-17 10:54:54.437
e78e007e-46d9-4fd3-8cae-5c5049a210e5	ac7b8d42-51de-4c45-8cbd-24c55ed54222	liabilities	t	t	t	t	2026-03-24 04:58:47.378	2026-04-17 10:54:54.437
3c7405a3-46b3-4111-aac4-d478172e0ea2	c6f3b92a-fe9a-4231-ab0b-aa470fecaf0d	dashboard	t	f	f	f	2026-03-24 06:20:33.723	2026-03-25 10:36:52.548
32e54828-140f-45c4-8ee1-ce53344aef57	c6f3b92a-fe9a-4231-ab0b-aa470fecaf0d	monthly	f	f	f	f	2026-03-24 06:20:33.723	2026-03-25 10:36:52.548
a324277a-7fa9-427f-9758-dc3ef50e2d17	c6f3b92a-fe9a-4231-ab0b-aa470fecaf0d	transactions	f	f	f	f	2026-03-24 06:20:33.723	2026-03-25 10:36:52.548
e628cccb-511e-41c1-8af8-755f9eb87d65	c6f3b92a-fe9a-4231-ab0b-aa470fecaf0d	accounts	f	f	f	f	2026-03-24 06:20:33.723	2026-03-25 10:36:52.548
08c9032e-d28f-446c-abee-682975a145fd	c6f3b92a-fe9a-4231-ab0b-aa470fecaf0d	assets	f	f	f	f	2026-03-24 06:20:33.723	2026-03-25 10:36:52.548
cfba4d11-14f7-440f-9ef2-09784ea0e98d	c6f3b92a-fe9a-4231-ab0b-aa470fecaf0d	liabilities	f	f	f	f	2026-03-24 06:20:33.723	2026-03-25 10:36:52.548
0e312de9-c3ae-48c1-9ba9-618c9cbf0664	c6f3b92a-fe9a-4231-ab0b-aa470fecaf0d	banks	f	f	f	f	2026-03-24 06:20:33.723	2026-03-25 10:36:52.548
b77d9d4c-887c-4757-bf37-d2e93f4f5b1d	c6f3b92a-fe9a-4231-ab0b-aa470fecaf0d	types	f	f	f	f	2026-03-24 06:20:33.723	2026-03-25 10:36:52.548
c4267baf-c3d0-499e-b712-a5970fbb00da	c6f3b92a-fe9a-4231-ab0b-aa470fecaf0d	categories	f	f	f	f	2026-03-24 06:20:33.723	2026-03-25 10:36:52.548
13448304-5313-4de4-9eac-1df8c65b6135	c6f3b92a-fe9a-4231-ab0b-aa470fecaf0d	users	f	f	f	f	2026-03-24 06:20:33.723	2026-03-25 10:36:52.548
c7808093-c7e9-49e7-88fa-2a7bafe8586d	c6f3b92a-fe9a-4231-ab0b-aa470fecaf0d	loan-tracker	f	f	f	f	2026-03-24 06:20:33.723	2026-03-25 10:36:52.548
27a87c53-1d0e-4308-a40e-c3935ed9fef0	c6f3b92a-fe9a-4231-ab0b-aa470fecaf0d	permissions	f	f	f	f	2026-03-24 06:20:33.723	2026-03-25 10:36:52.548
f8a3a008-1093-4302-bd16-469899ba7766	f0e9f618-132a-4dea-8a1d-8fa8181ee69f	dashboard	t	t	f	f	2026-03-25 10:39:29.968	2026-03-25 10:39:49.271
809b6f45-738b-47d9-9a77-8170766ab0cc	f0e9f618-132a-4dea-8a1d-8fa8181ee69f	monthly	t	t	f	f	2026-03-25 10:39:29.968	2026-03-25 10:39:49.271
1dc26334-5656-4c0b-a1f1-1d5bc7fcf890	f0e9f618-132a-4dea-8a1d-8fa8181ee69f	transactions	t	t	f	f	2026-03-25 10:39:29.968	2026-03-25 10:39:49.271
e3a758b1-77b8-4547-b9d4-d992b8a17da6	f0e9f618-132a-4dea-8a1d-8fa8181ee69f	accounts	t	t	f	f	2026-03-25 10:39:29.968	2026-03-25 10:39:49.271
681dab2c-945f-41aa-b32f-88aa5c219271	f0e9f618-132a-4dea-8a1d-8fa8181ee69f	assets	t	t	f	f	2026-03-25 10:39:29.968	2026-03-25 10:39:49.271
06a270ae-ee96-4088-9bcc-fd9afabc160d	f0e9f618-132a-4dea-8a1d-8fa8181ee69f	liabilities	t	t	f	f	2026-03-25 10:39:29.968	2026-03-25 10:39:49.271
30bdaced-058d-465b-a879-bcd5e76a239c	f0e9f618-132a-4dea-8a1d-8fa8181ee69f	banks	t	t	f	f	2026-03-25 10:39:29.968	2026-03-25 10:39:49.271
7082056e-ece4-41af-b82b-947e22473605	f0e9f618-132a-4dea-8a1d-8fa8181ee69f	types	f	f	f	f	2026-03-25 10:39:29.968	2026-03-25 10:39:49.271
e579bc86-6bba-48f2-b948-6a671d076704	f0e9f618-132a-4dea-8a1d-8fa8181ee69f	categories	f	f	f	f	2026-03-25 10:39:29.968	2026-03-25 10:39:49.271
d1c2c1bd-df05-43a5-a0da-eddec12978a1	f0e9f618-132a-4dea-8a1d-8fa8181ee69f	users	f	f	f	f	2026-03-25 10:39:29.968	2026-03-25 10:39:49.271
c37c36d7-56e3-4cf2-b16c-5e089ccb4c9a	f0e9f618-132a-4dea-8a1d-8fa8181ee69f	loan-tracker	t	t	f	f	2026-03-25 10:39:29.968	2026-03-25 10:39:49.271
d04016a6-3620-4d2f-bad5-7af04e7b8a8f	f0e9f618-132a-4dea-8a1d-8fa8181ee69f	permissions	f	f	f	f	2026-03-25 10:39:29.968	2026-03-25 10:39:49.271
cde52357-4700-4e13-be75-75d5e7eaa2cd	ae990866-fe93-4ed4-8fd1-366d1e6bc512	permissions	f	f	f	f	2026-04-30 13:09:10.959	2026-04-30 16:21:50.892
2a4ea336-28de-46f2-9530-9b7b6c8a08ad	dae7c000-c362-41c3-bb11-c8243b405b51	monthly	t	t	t	t	2026-04-30 13:09:10.962	2026-04-30 16:21:50.894
be2c12e3-7d63-4e90-bf01-ccdcb78ed0b6	07d4568f-3cfd-410a-9c00-7e7dbdf597aa	monthly	t	f	f	f	2026-04-30 13:09:10.966	2026-04-30 16:21:50.896
a168221f-26e5-438a-a61b-83e450ac9f89	b376021c-731f-44f0-906a-bcc3f0f80e58	monthly	t	f	f	f	2026-04-30 13:09:10.97	2026-04-30 16:21:50.899
d67006ba-968f-4f51-85de-b98c8350d880	ae990866-fe93-4ed4-8fd1-366d1e6bc512	monthly	t	f	f	f	2026-04-30 13:09:10.974	2026-04-30 16:21:50.901
51a8f964-16db-47e9-b10d-3bb1cbfab743	dae7c000-c362-41c3-bb11-c8243b405b51	loan-tracker	t	t	t	t	2026-04-30 13:09:10.978	2026-04-30 16:21:50.903
29f71955-c822-4461-b65b-8e2dacaca287	07d4568f-3cfd-410a-9c00-7e7dbdf597aa	loan-tracker	t	f	f	f	2026-04-30 13:09:10.981	2026-04-30 16:21:50.906
791a6cec-b4e4-4db6-aa21-67ea8ca30164	b376021c-731f-44f0-906a-bcc3f0f80e58	loan-tracker	t	f	f	f	2026-04-30 13:09:10.985	2026-04-30 16:21:50.908
112d39d9-e09d-4e8f-89a1-df965e8629c2	07d4568f-3cfd-410a-9c00-7e7dbdf597aa	dashboard	t	f	f	f	2026-04-30 13:09:10.898	2026-04-30 16:21:50.862
5723e9fe-e64c-4772-8ac8-06378f0fb122	b376021c-731f-44f0-906a-bcc3f0f80e58	dashboard	t	f	f	f	2026-04-30 13:09:10.902	2026-04-30 16:21:50.864
4a4836bd-463f-4488-a7bf-38c1a6b74831	ae990866-fe93-4ed4-8fd1-366d1e6bc512	dashboard	t	f	f	f	2026-04-30 13:09:10.907	2026-04-30 16:21:50.867
5a0762a1-61c0-4725-a314-6e4f9a6342b9	dae7c000-c362-41c3-bb11-c8243b405b51	users	t	t	t	t	2026-04-30 13:09:10.911	2026-04-30 16:21:50.869
1c8b9180-1b7b-47e6-8f2f-024e8af01feb	07d4568f-3cfd-410a-9c00-7e7dbdf597aa	users	f	f	f	f	2026-04-30 13:09:10.915	2026-04-30 16:21:50.871
614bcbb8-8765-4044-bb75-7392a062bcb9	b376021c-731f-44f0-906a-bcc3f0f80e58	users	f	f	f	f	2026-04-30 13:09:10.92	2026-04-30 16:21:50.873
870fa9d3-8419-4985-9d1b-f8aa1b181f28	ae990866-fe93-4ed4-8fd1-366d1e6bc512	users	f	f	f	f	2026-04-30 13:09:10.924	2026-04-30 16:21:50.875
ca82e740-13b0-44ae-936e-050415fb78ab	07d4568f-3cfd-410a-9c00-7e7dbdf597aa	transactions	t	f	f	f	2026-04-30 13:09:10.933	2026-04-30 16:21:50.879
c82f1584-cb75-49cd-9885-d4ed329a2763	b376021c-731f-44f0-906a-bcc3f0f80e58	transactions	t	f	f	f	2026-04-30 13:09:10.937	2026-04-30 16:21:50.881
4d1fd75b-f70f-44c4-af2c-3600afb992c1	ae990866-fe93-4ed4-8fd1-366d1e6bc512	transactions	t	f	f	f	2026-04-30 13:09:10.942	2026-04-30 16:21:50.883
b4a9a2a9-4741-4ec8-9c5e-b109671180c9	dae7c000-c362-41c3-bb11-c8243b405b51	permissions	t	t	t	t	2026-04-30 13:09:10.946	2026-04-30 16:21:50.886
1d672cc0-0c86-4eba-9dc6-7c4bb0c44a35	07d4568f-3cfd-410a-9c00-7e7dbdf597aa	permissions	f	f	f	f	2026-04-30 13:09:10.951	2026-04-30 16:21:50.888
9b5a41c2-cf16-474e-bccb-fb89fff2568c	b376021c-731f-44f0-906a-bcc3f0f80e58	permissions	f	f	f	f	2026-04-30 13:09:10.955	2026-04-30 16:21:50.89
328b13dd-3b0e-44b4-9737-13349283c04f	a112181e-c553-4d1c-934c-e958afa6a052	assets	t	f	f	f	2026-04-30 13:09:11.685	2026-04-30 16:21:51.413
4b094849-b79c-4cb2-8fb7-58f643df1de2	a9e77cd8-1544-4722-bb2b-54ff850b8982	assets	t	f	f	f	2026-04-30 13:09:11.689	2026-04-30 16:21:51.415
6e3d7b79-6aaa-4f40-bd8b-e1eed6962749	0c48ba16-5074-4aec-ab3b-21fbca367711	assets	t	f	f	f	2026-04-30 13:09:11.693	2026-04-30 16:21:51.417
c792a2bc-95ca-4e51-8ec5-34c09b7477cd	6c8615e4-a673-4f96-be77-2a55f83c1e01	accounts	t	t	t	t	2026-04-30 13:09:11.697	2026-04-30 16:21:51.419
fd7bff04-d4f2-493f-a158-c597de8f0259	a112181e-c553-4d1c-934c-e958afa6a052	accounts	f	f	f	f	2026-04-30 13:09:11.701	2026-04-30 16:21:51.421
ce3adb65-0672-4295-ac2f-48440561f4ba	a9e77cd8-1544-4722-bb2b-54ff850b8982	accounts	f	f	f	f	2026-04-30 13:09:11.704	2026-04-30 16:21:51.424
7adb74f6-76a0-48b1-a210-4ae855293aba	0c48ba16-5074-4aec-ab3b-21fbca367711	accounts	f	f	f	f	2026-04-30 13:09:11.708	2026-04-30 16:21:51.426
9b987b79-632c-4e32-96ab-2ac7a4dff37b	6c8615e4-a673-4f96-be77-2a55f83c1e01	banks	t	t	t	t	2026-04-30 13:09:11.712	2026-04-30 16:21:51.429
3bb1101d-c4ed-49d0-ac36-0b0c3a5c064a	a112181e-c553-4d1c-934c-e958afa6a052	banks	f	f	f	f	2026-04-30 13:09:11.716	2026-04-30 16:21:51.431
4e506370-a098-4994-8a46-2b7fbfcfa001	a9e77cd8-1544-4722-bb2b-54ff850b8982	banks	f	f	f	f	2026-04-30 13:09:11.719	2026-04-30 16:21:51.433
458448d5-1955-4601-a173-500c830e29a0	0c48ba16-5074-4aec-ab3b-21fbca367711	banks	f	f	f	f	2026-04-30 13:09:11.723	2026-04-30 16:21:51.435
7a527304-74f5-416d-af0b-46e5837eed4b	6c8615e4-a673-4f96-be77-2a55f83c1e01	types	t	t	t	t	2026-04-30 13:09:11.727	2026-04-30 16:21:51.437
e977328c-bb2c-4450-b39e-282c365f1c28	a112181e-c553-4d1c-934c-e958afa6a052	types	f	f	f	f	2026-04-30 13:09:11.731	2026-04-30 16:21:51.439
964b56d8-fc5e-410b-a687-48933d149c94	a9e77cd8-1544-4722-bb2b-54ff850b8982	types	f	f	f	f	2026-04-30 13:09:11.734	2026-04-30 16:21:51.44
9a95f975-9394-4482-9b71-9c37b489050f	0c48ba16-5074-4aec-ab3b-21fbca367711	types	f	f	f	f	2026-04-30 13:09:11.738	2026-04-30 16:21:51.442
d82482fd-6016-4e5a-8bcb-1de4b6c8fbf8	6c8615e4-a673-4f96-be77-2a55f83c1e01	categories	t	t	t	t	2026-04-30 13:09:11.742	2026-04-30 16:21:51.444
fd8fc735-a4cb-401c-b4de-6aeb9635323a	a112181e-c553-4d1c-934c-e958afa6a052	categories	f	f	f	f	2026-04-30 13:09:11.745	2026-04-30 16:21:51.446
8b26890a-2ccc-457f-b9e9-4a7f205c14c1	a9e77cd8-1544-4722-bb2b-54ff850b8982	categories	f	f	f	f	2026-04-30 13:09:11.748	2026-04-30 16:21:51.448
49d158e4-d396-4580-9ff5-bc3b72a09e82	0c48ba16-5074-4aec-ab3b-21fbca367711	categories	f	f	f	f	2026-04-30 13:09:11.752	2026-04-30 16:21:51.45
21f53b3d-8ad0-4bc1-83a1-38c858d57443	6c8615e4-a673-4f96-be77-2a55f83c1e01	dashboard	t	t	t	t	2026-04-30 13:09:11.58	2026-04-30 16:21:51.353
69709e32-3619-404f-b25e-2072545f0b92	dae7c000-c362-41c3-bb11-c8243b405b51	dashboard	t	t	t	t	2026-04-30 13:09:10.893	2026-04-30 16:21:50.86
eca32f2d-cd99-43e1-9809-4874d612d950	a9e77cd8-1544-4722-bb2b-54ff850b8982	dashboard	t	f	f	f	2026-04-30 13:09:11.587	2026-04-30 16:21:51.358
332ce8ef-6970-4749-90a3-09197dbbf718	dae7c000-c362-41c3-bb11-c8243b405b51	transactions	t	t	t	t	2026-04-30 13:09:10.928	2026-04-30 16:21:50.877
3e18ff6e-39bb-4ef5-a85f-36bf4392ed92	6c8615e4-a673-4f96-be77-2a55f83c1e01	users	t	t	t	t	2026-04-30 13:09:11.594	2026-04-30 16:21:51.362
9293bb6e-2983-4a37-8b84-9750f4aa3a52	07d4568f-3cfd-410a-9c00-7e7dbdf597aa	types	f	f	f	f	2026-04-30 13:09:11.068	2026-04-30 16:21:50.95
f9895401-4360-48ea-8cb5-e033f828f461	a9e77cd8-1544-4722-bb2b-54ff850b8982	users	f	f	f	f	2026-04-30 13:09:11.602	2026-04-30 16:21:51.367
b85f5868-679e-472b-abcb-f309a86ca7de	b376021c-731f-44f0-906a-bcc3f0f80e58	types	f	f	f	f	2026-04-30 13:09:11.072	2026-04-30 16:21:50.951
d98d8f66-1ec8-4c0e-98f7-c7015d9d48af	6c8615e4-a673-4f96-be77-2a55f83c1e01	transactions	t	t	t	t	2026-04-30 13:09:11.609	2026-04-30 16:21:51.371
622ce74d-9dbb-43e8-b410-d0d760797bc6	ae990866-fe93-4ed4-8fd1-366d1e6bc512	types	f	f	f	f	2026-04-30 13:09:11.076	2026-04-30 16:21:50.954
2fb8890a-aebf-4e66-afc5-044bd8f14676	a9e77cd8-1544-4722-bb2b-54ff850b8982	transactions	t	f	f	f	2026-04-30 13:09:11.616	2026-04-30 16:21:51.375
44fd9c89-4ebc-4bf3-83b0-e19bc997c20c	dae7c000-c362-41c3-bb11-c8243b405b51	categories	t	t	t	t	2026-04-30 13:09:11.08	2026-04-30 16:21:50.956
d7c1d744-84b1-49ae-a97e-1425a7e00cbb	6c8615e4-a673-4f96-be77-2a55f83c1e01	permissions	t	t	t	t	2026-04-30 13:09:11.623	2026-04-30 16:21:51.379
abdbc5dc-8016-412b-bc31-ed401e1ebd73	07d4568f-3cfd-410a-9c00-7e7dbdf597aa	categories	f	f	f	f	2026-04-30 13:09:11.084	2026-04-30 16:21:50.959
221b7175-f2ed-454c-9bec-211bf7fbda63	a9e77cd8-1544-4722-bb2b-54ff850b8982	permissions	f	f	f	f	2026-04-30 13:09:11.631	2026-04-30 16:21:51.383
8b95724e-e006-44cc-bc9c-c6dc64d7f7f1	b376021c-731f-44f0-906a-bcc3f0f80e58	categories	f	f	f	f	2026-04-30 13:09:11.088	2026-04-30 16:21:50.961
1ce3bca9-df6c-4655-a2f6-b40d01263b35	6c8615e4-a673-4f96-be77-2a55f83c1e01	monthly	t	t	t	t	2026-04-30 13:09:11.638	2026-04-30 16:21:51.388
a2c49bcd-6ede-4295-a827-76ad0577aaa5	ae990866-fe93-4ed4-8fd1-366d1e6bc512	categories	f	f	f	f	2026-04-30 13:09:11.092	2026-04-30 16:21:50.963
0da25ece-af83-49ae-9191-01ce5e3bddf1	a112181e-c553-4d1c-934c-e958afa6a052	dashboard	t	f	f	f	2026-04-30 13:09:11.583	2026-04-30 16:21:51.355
003fd3bd-e63f-436e-9e54-1ad87731ef09	a9e77cd8-1544-4722-bb2b-54ff850b8982	monthly	t	f	f	f	2026-04-30 13:09:11.645	2026-04-30 16:21:51.391
ebe1d9f0-c9eb-41ce-9811-6eb5d5f1e388	0c48ba16-5074-4aec-ab3b-21fbca367711	dashboard	t	f	f	f	2026-04-30 13:09:11.59	2026-04-30 16:21:51.36
b735d1ab-277e-43a8-b4e1-3585363e4b0c	6c8615e4-a673-4f96-be77-2a55f83c1e01	loan-tracker	t	t	t	t	2026-04-30 13:09:11.652	2026-04-30 16:21:51.395
b3fc6979-3747-4825-8f5c-9b654fb2984b	a112181e-c553-4d1c-934c-e958afa6a052	users	f	f	f	f	2026-04-30 13:09:11.598	2026-04-30 16:21:51.365
39311ab3-c3db-4d6e-88c4-5f806a5bee7b	0c48ba16-5074-4aec-ab3b-21fbca367711	loan-tracker	t	f	f	f	2026-04-30 13:09:11.663	2026-04-30 16:21:51.401
7f692a52-d5bd-4f10-8b50-ff8d98c47a11	0c48ba16-5074-4aec-ab3b-21fbca367711	users	f	f	f	f	2026-04-30 13:09:11.606	2026-04-30 16:21:51.369
6a8d50f4-7616-400e-ac12-1191975c27bc	a112181e-c553-4d1c-934c-e958afa6a052	liabilities	t	f	f	f	2026-04-30 13:09:11.671	2026-04-30 16:21:51.406
2430a4cc-9502-424a-98fd-a60d4f53a793	a112181e-c553-4d1c-934c-e958afa6a052	transactions	t	f	f	f	2026-04-30 13:09:11.613	2026-04-30 16:21:51.373
38dc6d9e-aefc-42b8-8e28-fc7c1f809300	0c48ba16-5074-4aec-ab3b-21fbca367711	liabilities	t	f	f	f	2026-04-30 13:09:11.678	2026-04-30 16:21:51.409
1c5f8f43-fde9-43ab-a5ee-335863dc59ff	a112181e-c553-4d1c-934c-e958afa6a052	permissions	f	f	f	f	2026-04-30 13:09:11.627	2026-04-30 16:21:51.381
d3f94e92-32ff-46d8-8625-53d233014b64	0c48ba16-5074-4aec-ab3b-21fbca367711	permissions	f	f	f	f	2026-04-30 13:09:11.634	2026-04-30 16:21:51.385
7eaecbb2-6b50-4545-847d-293eda3e27c2	a112181e-c553-4d1c-934c-e958afa6a052	monthly	t	f	f	f	2026-04-30 13:09:11.642	2026-04-30 16:21:51.389
50562df1-3176-403e-83d5-04b1b17f06da	0c48ba16-5074-4aec-ab3b-21fbca367711	monthly	t	f	f	f	2026-04-30 13:09:11.649	2026-04-30 16:21:51.393
687610e8-ab51-4d8c-8548-07191517bac2	a112181e-c553-4d1c-934c-e958afa6a052	loan-tracker	t	f	f	f	2026-04-30 13:09:11.656	2026-04-30 16:21:51.398
ac2d6a80-e804-42a0-a378-e0198ec532f6	6c8615e4-a673-4f96-be77-2a55f83c1e01	liabilities	t	t	t	t	2026-04-30 13:09:11.666	2026-04-30 16:21:51.403
81d36fa3-fed6-4c56-ba67-a52e1436c130	a9e77cd8-1544-4722-bb2b-54ff850b8982	liabilities	t	f	f	f	2026-04-30 13:09:11.674	2026-04-30 16:21:51.407
f0268ee3-26d2-45c8-bd3f-cbebdd84382a	6c8615e4-a673-4f96-be77-2a55f83c1e01	assets	t	t	t	t	2026-04-30 13:09:11.681	2026-04-30 16:21:51.411
aac7dc76-3cf8-4a4d-af77-785b797869ad	0c48ba16-5074-4aec-ab3b-21fbca367711	transactions	t	f	f	f	2026-04-30 13:09:11.619	2026-04-30 16:21:51.377
557cf327-62fc-470e-80a6-5dd5aac36b32	ec66bee8-7d3c-4c78-9139-19866ba65365	dashboard	t	t	t	t	2026-04-30 18:13:14.453	2026-04-30 18:40:34.476
8e26ca24-86d9-436c-b5aa-dfa92b3fb436	6cace32b-2f6a-4afe-ac38-9cc901b1db64	dashboard	t	f	f	f	2026-04-30 18:13:14.458	2026-04-30 18:40:34.482
6fff8b8d-3cba-4404-8401-d7573af62e70	ead44c38-c42b-4069-9691-cd2991c24d66	dashboard	t	f	f	f	2026-04-30 18:13:14.462	2026-04-30 18:40:34.486
142a674f-5925-4653-8df0-9d5c7626f487	fc0f9a22-6fbe-4528-86a8-48580af44719	dashboard	t	f	f	f	2026-04-30 18:13:14.466	2026-04-30 18:40:34.49
17678874-dd2f-4147-8501-b6b50109a1d9	ec66bee8-7d3c-4c78-9139-19866ba65365	users	t	t	t	t	2026-04-30 18:13:14.469	2026-04-30 18:40:34.494
00ef5fae-ed9e-4d59-899a-f6a54abc33b5	6cace32b-2f6a-4afe-ac38-9cc901b1db64	users	f	f	f	f	2026-04-30 18:13:14.472	2026-04-30 18:40:34.499
c4e3aff6-363c-4220-8212-f1b1e77722b4	ead44c38-c42b-4069-9691-cd2991c24d66	users	f	f	f	f	2026-04-30 18:13:14.476	2026-04-30 18:40:34.508
dcda8bff-09f9-4606-a901-56cccd3bc83e	fc0f9a22-6fbe-4528-86a8-48580af44719	users	f	f	f	f	2026-04-30 18:13:14.479	2026-04-30 18:40:34.512
04e09d4f-2244-49d3-986f-e6b098dbe072	ec66bee8-7d3c-4c78-9139-19866ba65365	transactions	t	t	t	t	2026-04-30 18:13:14.483	2026-04-30 18:40:34.516
67012940-56e0-4be2-9c37-b84439a3ed28	6cace32b-2f6a-4afe-ac38-9cc901b1db64	transactions	t	f	f	f	2026-04-30 18:13:14.486	2026-04-30 18:40:34.525
fcef193d-714a-4e05-8788-1a1632438000	ead44c38-c42b-4069-9691-cd2991c24d66	transactions	t	f	f	f	2026-04-30 18:13:14.489	2026-04-30 18:40:34.531
84ed6329-07a5-433c-853c-9a4df8cb65a8	fc0f9a22-6fbe-4528-86a8-48580af44719	transactions	t	f	f	f	2026-04-30 18:13:14.493	2026-04-30 18:40:34.535
180d07b7-abcb-4e61-9673-8100268f6b05	ae990866-fe93-4ed4-8fd1-366d1e6bc512	loan-tracker	t	f	f	f	2026-04-30 13:09:10.989	2026-04-30 16:21:50.91
123d64d3-b445-4a09-9983-3e4b8d1eb6c1	07d4568f-3cfd-410a-9c00-7e7dbdf597aa	liabilities	t	f	f	f	2026-04-30 13:09:10.998	2026-04-30 16:21:50.914
2b8d6f77-49fc-46d4-b9f5-24000cff638b	a9e77cd8-1544-4722-bb2b-54ff850b8982	loan-tracker	t	f	f	f	2026-04-30 13:09:11.66	2026-04-30 16:21:51.399
dae39713-c34a-4f8e-874d-7f4d33b6c395	2580a37e-11af-41af-a061-31031fbec6c9	dashboard	t	f	f	f	2026-04-30 18:13:15.044	2026-04-30 18:40:35.743
bb93c269-c292-429a-bc83-42106217a9e5	e0a170d1-8489-42d7-bb84-0db6d64a4286	users	t	t	t	t	2026-04-30 18:13:15.047	2026-04-30 18:40:35.746
fe45f508-9f85-43c1-bf5a-8471d95d8b9a	e3380d24-5c10-4f7f-b5e3-cde56b36a2c5	users	f	f	f	f	2026-04-30 18:13:15.051	2026-04-30 18:40:35.75
4347aae1-864e-48fb-b0d6-be53bc9ed71d	6cb1120e-a42e-4658-9ddd-75a81fed9ae7	users	f	f	f	f	2026-04-30 18:13:15.053	2026-04-30 18:40:35.753
2d35c9a8-549c-4b00-88ba-5ae3b8eaf921	e0a170d1-8489-42d7-bb84-0db6d64a4286	transactions	t	t	t	t	2026-04-30 18:13:15.06	2026-04-30 18:40:35.76
e4b0c0ee-f8d1-45bb-953e-ca2498010c75	e3380d24-5c10-4f7f-b5e3-cde56b36a2c5	transactions	t	f	f	f	2026-04-30 18:13:15.063	2026-04-30 18:40:35.764
9ff526f9-a89e-40dc-8f3d-55c62a46606a	6cb1120e-a42e-4658-9ddd-75a81fed9ae7	transactions	t	f	f	f	2026-04-30 18:13:15.067	2026-04-30 18:40:35.768
48f75540-6109-4b84-aef4-6049d9762448	2580a37e-11af-41af-a061-31031fbec6c9	transactions	t	f	f	f	2026-04-30 18:13:15.07	2026-04-30 18:40:35.771
7de910a7-5434-431d-9a1f-8aeb56e98088	e0a170d1-8489-42d7-bb84-0db6d64a4286	permissions	t	t	t	t	2026-04-30 18:13:15.074	2026-04-30 18:40:35.775
873e2ec4-2562-4676-9907-329e1c2a5170	e3380d24-5c10-4f7f-b5e3-cde56b36a2c5	permissions	f	f	f	f	2026-04-30 18:13:15.077	2026-04-30 18:40:35.778
6289c100-1824-4f78-892c-ac49a0648e75	6cb1120e-a42e-4658-9ddd-75a81fed9ae7	permissions	f	f	f	f	2026-04-30 18:13:15.08	2026-04-30 18:40:35.782
23e9dd82-104c-4cd3-9195-b5e285cc84e0	2580a37e-11af-41af-a061-31031fbec6c9	permissions	f	f	f	f	2026-04-30 18:13:15.083	2026-04-30 18:40:35.785
7a0705df-0bab-4dba-9b84-b700d9e2a207	e0a170d1-8489-42d7-bb84-0db6d64a4286	monthly	t	t	t	t	2026-04-30 18:13:15.086	2026-04-30 18:40:35.793
2a31edf0-87de-46f9-bae6-ca1213ce12e9	e3380d24-5c10-4f7f-b5e3-cde56b36a2c5	monthly	t	f	f	f	2026-04-30 18:13:15.09	2026-04-30 18:40:35.796
9b0ffb5d-4f2d-469b-8426-44484bc4df68	6cb1120e-a42e-4658-9ddd-75a81fed9ae7	monthly	t	f	f	f	2026-04-30 18:13:15.094	2026-04-30 18:40:35.8
59341185-8bae-4bbb-89bd-14b405c91736	2580a37e-11af-41af-a061-31031fbec6c9	monthly	t	f	f	f	2026-04-30 18:13:15.097	2026-04-30 18:40:35.803
fcfcea66-0759-4c46-99f9-eb6443d16ba0	e0a170d1-8489-42d7-bb84-0db6d64a4286	loan-tracker	t	t	t	t	2026-04-30 18:13:15.1	2026-04-30 18:40:35.807
155bd05a-6a5d-43f9-b93c-3e82334ef593	e3380d24-5c10-4f7f-b5e3-cde56b36a2c5	loan-tracker	t	f	f	f	2026-04-30 18:13:15.103	2026-04-30 18:40:35.81
8da96338-321d-4d3c-8cef-5e4919c3909e	6cb1120e-a42e-4658-9ddd-75a81fed9ae7	loan-tracker	t	f	f	f	2026-04-30 18:13:15.105	2026-04-30 18:40:35.814
8deed3da-0860-4171-b3d7-e982c53006b2	2580a37e-11af-41af-a061-31031fbec6c9	loan-tracker	t	f	f	f	2026-04-30 18:13:15.108	2026-04-30 18:40:35.817
fe8f6860-f71a-4b19-bc1a-98a4955a03b7	e3380d24-5c10-4f7f-b5e3-cde56b36a2c5	dashboard	t	f	f	f	2026-04-30 18:13:15.037	2026-04-30 18:40:35.736
db20760f-13c0-4d45-b74b-18dcfbef327c	ec66bee8-7d3c-4c78-9139-19866ba65365	permissions	t	t	t	t	2026-04-30 18:13:14.496	2026-04-30 18:40:34.539
11f43e68-d461-4dde-a0e2-5ee3a7d8bcb3	6cace32b-2f6a-4afe-ac38-9cc901b1db64	permissions	f	f	f	f	2026-04-30 18:13:14.5	2026-04-30 18:40:34.544
dd1ddb17-48e7-4361-9631-c8def4f4a3ef	ead44c38-c42b-4069-9691-cd2991c24d66	permissions	f	f	f	f	2026-04-30 18:13:14.503	2026-04-30 18:40:34.552
acc3934d-05bc-4b3d-9f42-613e32bcbc81	fc0f9a22-6fbe-4528-86a8-48580af44719	permissions	f	f	f	f	2026-04-30 18:13:14.506	2026-04-30 18:40:34.557
fe4c1560-85f9-4357-8441-b706fb33f08d	ec66bee8-7d3c-4c78-9139-19866ba65365	monthly	t	t	t	t	2026-04-30 18:13:14.509	2026-04-30 18:40:34.56
d8d50fe8-8fcc-4f7d-b870-3975dfc89772	6cace32b-2f6a-4afe-ac38-9cc901b1db64	monthly	t	f	f	f	2026-04-30 18:13:14.511	2026-04-30 18:40:34.567
02c3beec-810b-4f30-a2a2-ec8e4c08cf38	ead44c38-c42b-4069-9691-cd2991c24d66	monthly	t	f	f	f	2026-04-30 18:13:14.514	2026-04-30 18:40:34.575
55853c15-0053-48ad-99bb-bbbcddb6eda6	fc0f9a22-6fbe-4528-86a8-48580af44719	monthly	t	f	f	f	2026-04-30 18:13:14.517	2026-04-30 18:40:34.579
7ef32dca-c47e-43a5-bd7e-9674b97e2dcb	ec66bee8-7d3c-4c78-9139-19866ba65365	loan-tracker	t	t	t	t	2026-04-30 18:13:14.52	2026-04-30 18:40:34.582
6e4fbb87-9fe1-4eee-9bc5-b77e33398ed3	6cace32b-2f6a-4afe-ac38-9cc901b1db64	loan-tracker	t	f	f	f	2026-04-30 18:13:14.523	2026-04-30 18:40:34.586
7bfe0828-edde-4509-85fd-ffc66e555158	ead44c38-c42b-4069-9691-cd2991c24d66	loan-tracker	t	f	f	f	2026-04-30 18:13:14.526	2026-04-30 18:40:34.591
6a061267-72e1-4b60-9779-29f3340fcee3	fc0f9a22-6fbe-4528-86a8-48580af44719	loan-tracker	t	f	f	f	2026-04-30 18:13:14.53	2026-04-30 18:40:34.595
6e01a0f2-90cf-465d-ada0-79393240176d	ec66bee8-7d3c-4c78-9139-19866ba65365	liabilities	t	t	t	t	2026-04-30 18:13:14.533	2026-04-30 18:40:34.6
2c5b3002-7aa4-493e-a6e0-650442771e45	6cace32b-2f6a-4afe-ac38-9cc901b1db64	liabilities	t	f	f	f	2026-04-30 18:13:14.536	2026-04-30 18:40:34.604
fb7c2056-f72d-4d10-a187-fe35cba9d12c	fc0f9a22-6fbe-4528-86a8-48580af44719	liabilities	t	f	f	f	2026-04-30 18:13:14.543	2026-04-30 18:40:34.624
b5422b77-c5a5-467d-b870-24545ab0fc0c	ec66bee8-7d3c-4c78-9139-19866ba65365	assets	t	t	t	t	2026-04-30 18:13:14.546	2026-04-30 18:40:34.628
95924012-8527-4edb-a71e-2955c498e41a	6cace32b-2f6a-4afe-ac38-9cc901b1db64	assets	t	f	f	f	2026-04-30 18:13:14.55	2026-04-30 18:40:34.632
c2e3a36f-93e7-4e9a-a5ec-dfc720781de6	ead44c38-c42b-4069-9691-cd2991c24d66	assets	t	f	f	f	2026-04-30 18:13:14.553	2026-04-30 18:40:34.639
a3772b1f-965a-437f-b71f-b158f84bbfd5	fc0f9a22-6fbe-4528-86a8-48580af44719	assets	t	f	f	f	2026-04-30 18:13:14.556	2026-04-30 18:40:34.643
745657ce-c14b-44ad-8cf1-e1211adf88ff	ec66bee8-7d3c-4c78-9139-19866ba65365	accounts	t	t	t	t	2026-04-30 18:13:14.559	2026-04-30 18:40:34.647
46910b1c-4c4a-475d-8e86-7bb6a57e5e44	6cace32b-2f6a-4afe-ac38-9cc901b1db64	accounts	f	f	f	f	2026-04-30 18:13:14.562	2026-04-30 18:40:34.651
6d0c1449-c262-464a-8fa3-001b3c97f649	ead44c38-c42b-4069-9691-cd2991c24d66	accounts	f	f	f	f	2026-04-30 18:13:14.565	2026-04-30 18:40:34.655
8b6d3430-d4ef-4d36-b6be-7dcf518c1349	fc0f9a22-6fbe-4528-86a8-48580af44719	accounts	f	f	f	f	2026-04-30 18:13:14.568	2026-04-30 18:40:34.659
a814c922-b8c9-4cb5-8d73-b7bb8ae38d6d	ec66bee8-7d3c-4c78-9139-19866ba65365	banks	t	t	t	t	2026-04-30 18:13:14.572	2026-04-30 18:40:34.664
be764e86-f164-4680-a71d-a77e5c0bf381	6cace32b-2f6a-4afe-ac38-9cc901b1db64	banks	f	f	f	f	2026-04-30 18:13:14.575	2026-04-30 18:40:34.668
49703e51-bd82-4fc1-a08e-3ac8ed2a55f7	ead44c38-c42b-4069-9691-cd2991c24d66	banks	f	f	f	f	2026-04-30 18:13:14.578	2026-04-30 18:40:34.671
14d5345f-ac13-4343-a50d-d1ee0ed385c0	fc0f9a22-6fbe-4528-86a8-48580af44719	banks	f	f	f	f	2026-04-30 18:13:14.581	2026-04-30 18:40:34.675
d1524a26-a994-4bd1-a87d-66d967483ec4	ec66bee8-7d3c-4c78-9139-19866ba65365	types	t	t	t	t	2026-04-30 18:13:14.584	2026-04-30 18:40:34.679
2e7bd5e5-e181-4fae-878e-bc75ba2b6b64	6cace32b-2f6a-4afe-ac38-9cc901b1db64	types	f	f	f	f	2026-04-30 18:13:14.587	2026-04-30 18:40:34.683
18a046ac-bb87-42e3-99d4-1fcca613811c	ead44c38-c42b-4069-9691-cd2991c24d66	types	f	f	f	f	2026-04-30 18:13:14.59	2026-04-30 18:40:34.687
289ef1fd-659a-4d8e-8c3e-82927cc47b9d	fc0f9a22-6fbe-4528-86a8-48580af44719	types	f	f	f	f	2026-04-30 18:13:14.593	2026-04-30 18:40:34.697
17d85df3-4c99-4dc7-84b2-b71da33314c4	ec66bee8-7d3c-4c78-9139-19866ba65365	categories	t	t	t	t	2026-04-30 18:13:14.596	2026-04-30 18:40:34.702
3ac411d8-058b-49fc-ace8-532d4c650ff1	6cace32b-2f6a-4afe-ac38-9cc901b1db64	categories	f	f	f	f	2026-04-30 18:13:14.599	2026-04-30 18:40:34.706
06c43cc9-263f-4f81-af12-737cb9c1cb23	ead44c38-c42b-4069-9691-cd2991c24d66	categories	f	f	f	f	2026-04-30 18:13:14.602	2026-04-30 18:40:34.71
61552894-e5b5-4780-8d3c-79cbfb2c58c9	fc0f9a22-6fbe-4528-86a8-48580af44719	categories	f	f	f	f	2026-04-30 18:13:14.606	2026-04-30 18:40:34.715
f402d508-2ef0-4097-a6df-ed72ea041b1c	6cb1120e-a42e-4658-9ddd-75a81fed9ae7	dashboard	t	f	f	f	2026-04-30 18:13:15.04	2026-04-30 18:40:35.74
cc56b148-b558-4489-93aa-c1ee9e8ac940	2580a37e-11af-41af-a061-31031fbec6c9	liabilities	t	f	f	f	2026-04-30 18:13:15.12	2026-04-30 18:40:35.842
9cf231c4-4f64-4f95-a719-b27f4e36b8ce	e0a170d1-8489-42d7-bb84-0db6d64a4286	assets	t	t	t	t	2026-04-30 18:13:15.123	2026-04-30 18:40:35.845
d05d78d4-b340-42c6-a03b-a5c082e779c5	e3380d24-5c10-4f7f-b5e3-cde56b36a2c5	assets	t	f	f	f	2026-04-30 18:13:15.125	2026-04-30 18:40:35.849
68806243-af82-43dc-91f3-447be83ee760	6cb1120e-a42e-4658-9ddd-75a81fed9ae7	assets	t	f	f	f	2026-04-30 18:13:15.129	2026-04-30 18:40:35.853
fa73123f-f0ff-4cb8-9213-ffe38af2eb49	2580a37e-11af-41af-a061-31031fbec6c9	assets	t	f	f	f	2026-04-30 18:13:15.131	2026-04-30 18:40:35.857
c7e4dc86-0213-4fe1-8925-737586c9e42c	e0a170d1-8489-42d7-bb84-0db6d64a4286	accounts	t	t	t	t	2026-04-30 18:13:15.134	2026-04-30 18:40:35.86
fc64f2e7-e5bb-4052-b7e4-77a804d98182	e3380d24-5c10-4f7f-b5e3-cde56b36a2c5	accounts	f	f	f	f	2026-04-30 18:13:15.137	2026-04-30 18:40:35.864
e23b92f4-9d5a-40f8-8a22-b3e2cdd9b4fa	6cb1120e-a42e-4658-9ddd-75a81fed9ae7	accounts	f	f	f	f	2026-04-30 18:13:15.14	2026-04-30 18:40:35.867
8ab9755c-a493-45df-84ed-3f8623d21364	2580a37e-11af-41af-a061-31031fbec6c9	accounts	f	f	f	f	2026-04-30 18:13:15.142	2026-04-30 18:40:35.871
00d2aa0f-6c76-4e4c-a7a4-58dbc44a7c21	e0a170d1-8489-42d7-bb84-0db6d64a4286	banks	t	t	t	t	2026-04-30 18:13:15.145	2026-04-30 18:40:35.875
60643fc5-c8ef-4ce2-b336-e883a6491373	e3380d24-5c10-4f7f-b5e3-cde56b36a2c5	banks	f	f	f	f	2026-04-30 18:13:15.148	2026-04-30 18:40:35.879
3f0d008e-1167-406b-bb7b-2d22e39dcbdc	6cb1120e-a42e-4658-9ddd-75a81fed9ae7	banks	f	f	f	f	2026-04-30 18:13:15.152	2026-04-30 18:40:35.883
250aff64-5322-4957-80d4-99c09c9343e8	2580a37e-11af-41af-a061-31031fbec6c9	banks	f	f	f	f	2026-04-30 18:13:15.155	2026-04-30 18:40:35.887
c1168a00-2c57-4238-b339-aa59cf161b43	e0a170d1-8489-42d7-bb84-0db6d64a4286	types	t	t	t	t	2026-04-30 18:13:15.157	2026-04-30 18:40:35.891
eec95493-4453-4c10-950e-589ced111d14	e3380d24-5c10-4f7f-b5e3-cde56b36a2c5	types	f	f	f	f	2026-04-30 18:13:15.161	2026-04-30 18:40:35.894
8047959c-9cf9-4d94-b980-8fec7c75dc80	6cb1120e-a42e-4658-9ddd-75a81fed9ae7	types	f	f	f	f	2026-04-30 18:13:15.163	2026-04-30 18:40:35.898
a6ff0924-e693-4aa1-ad80-c518a455bad2	2580a37e-11af-41af-a061-31031fbec6c9	types	f	f	f	f	2026-04-30 18:13:15.166	2026-04-30 18:40:35.902
3c1b4b8c-b6b6-47c3-b836-c742f6329b96	e0a170d1-8489-42d7-bb84-0db6d64a4286	categories	t	t	t	t	2026-04-30 18:13:15.169	2026-04-30 18:40:35.906
504c6684-8c66-449a-971d-f9b30c9a350d	e3380d24-5c10-4f7f-b5e3-cde56b36a2c5	categories	f	f	f	f	2026-04-30 18:13:15.172	2026-04-30 18:40:35.91
5865bbf6-5bb2-422d-a59a-75dfd9aa33c4	6cb1120e-a42e-4658-9ddd-75a81fed9ae7	categories	f	f	f	f	2026-04-30 18:13:15.174	2026-04-30 18:40:35.913
bf76d901-3310-412b-b4d7-efa1f583c402	2580a37e-11af-41af-a061-31031fbec6c9	categories	f	f	f	f	2026-04-30 18:13:15.177	2026-04-30 18:40:35.917
e31fe5a8-e0e1-45b8-a4fe-4bfbe22dc097	ead44c38-c42b-4069-9691-cd2991c24d66	liabilities	t	f	f	f	2026-04-30 18:13:14.54	2026-04-30 18:40:34.616
64906b3f-0623-444b-984c-d1933302a0be	e0a170d1-8489-42d7-bb84-0db6d64a4286	dashboard	t	t	t	t	2026-04-30 18:13:15.033	2026-04-30 18:40:35.732
d9441736-13dd-4343-a901-501580586f0f	2580a37e-11af-41af-a061-31031fbec6c9	users	f	f	f	f	2026-04-30 18:13:15.057	2026-04-30 18:40:35.757
8b6a5265-b307-4c21-bd7e-4b56068840d2	e0a170d1-8489-42d7-bb84-0db6d64a4286	liabilities	t	t	t	t	2026-04-30 18:13:15.111	2026-04-30 18:40:35.823
cf1d1d9f-59c4-4afe-bd1f-14480016e299	e3380d24-5c10-4f7f-b5e3-cde56b36a2c5	liabilities	t	f	f	f	2026-04-30 18:13:15.114	2026-04-30 18:40:35.835
f05198b3-c559-48be-8979-4f0bb0490efc	6cb1120e-a42e-4658-9ddd-75a81fed9ae7	liabilities	t	f	f	f	2026-04-30 18:13:15.117	2026-04-30 18:40:35.838
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Role" (id, name, description, "createdAt", "organizationId", "isActive", "isSystemRole") FROM stdin;
ac7b8d42-51de-4c45-8cbd-24c55ed54222	Admin	\N	2026-03-23 07:24:44.413	\N	t	f
c6f3b92a-fe9a-4231-ab0b-aa470fecaf0d	Guest	\N	2026-03-23 07:24:44.422	\N	t	f
f0e9f618-132a-4dea-8a1d-8fa8181ee69f	Assistant	\N	2026-03-23 07:24:44.421	\N	t	f
1c9afd93-7eee-4aaf-a04f-0d7d33d32bc3	Admin	Administrator with full access	2026-04-25 19:08:15.618	32839490-a7f5-4730-a78f-0923f494bf47	t	f
34cea92f-6d42-4af5-9d41-36fbaea1537c	Production User	\N	2026-04-30 13:05:27.081	32839490-a7f5-4730-a78f-0923f494bf47	t	f
3f43b210-ded7-4ba5-8fe4-87dab4e9c26c	Officer	\N	2026-04-30 13:05:27.272	32839490-a7f5-4730-a78f-0923f494bf47	t	f
bd7d517f-df05-44cc-b97f-0a8a50b16e59	Guest	\N	2026-04-30 13:05:27.43	32839490-a7f5-4730-a78f-0923f494bf47	t	f
dae7c000-c362-41c3-bb11-c8243b405b51	Admin	\N	2026-04-30 13:09:10.825	\N	t	f
07d4568f-3cfd-410a-9c00-7e7dbdf597aa	Production User	\N	2026-04-30 13:09:10.842	\N	t	f
b376021c-731f-44f0-906a-bcc3f0f80e58	Officer	\N	2026-04-30 13:09:10.857	\N	t	f
ae990866-fe93-4ed4-8fd1-366d1e6bc512	Guest	\N	2026-04-30 13:09:10.876	\N	t	f
6c8615e4-a673-4f96-be77-2a55f83c1e01	Admin	\N	2026-04-30 13:09:11.523	\N	t	f
a112181e-c553-4d1c-934c-e958afa6a052	Production User	\N	2026-04-30 13:09:11.537	\N	t	f
a9e77cd8-1544-4722-bb2b-54ff850b8982	Officer	\N	2026-04-30 13:09:11.55	\N	t	f
0c48ba16-5074-4aec-ab3b-21fbca367711	Guest	\N	2026-04-30 13:09:11.563	\N	t	f
ec66bee8-7d3c-4c78-9139-19866ba65365	Admin	\N	2026-04-30 18:13:14.402	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	t	f
6cace32b-2f6a-4afe-ac38-9cc901b1db64	Production User	\N	2026-04-30 18:13:14.418	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	t	f
ead44c38-c42b-4069-9691-cd2991c24d66	Officer	\N	2026-04-30 18:13:14.43	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	t	f
fc0f9a22-6fbe-4528-86a8-48580af44719	Guest	\N	2026-04-30 18:13:14.439	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	t	f
e0a170d1-8489-42d7-bb84-0db6d64a4286	Admin	\N	2026-04-30 18:13:14.991	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	t	f
e3380d24-5c10-4f7f-b5e3-cde56b36a2c5	Production User	\N	2026-04-30 18:13:15.001	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	t	f
6cb1120e-a42e-4658-9ddd-75a81fed9ae7	Officer	\N	2026-04-30 18:13:15.011	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	t	f
2580a37e-11af-41af-a061-31031fbec6c9	Guest	\N	2026-04-30 18:13:15.021	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	t	f
70a86436-c928-44cf-80c9-2f7df89de496	Admin	\N	2026-04-24 11:44:38.441	ee81df9d-bb14-419b-bd49-d4c77b4d4214	t	f
108fc3ee-bda1-4afa-b45e-598b5079ed02	Production User	\N	2026-04-24 11:44:38.45	ee81df9d-bb14-419b-bd49-d4c77b4d4214	t	f
376a7dca-f65c-48eb-879f-4c7f3d3e3a89	Officer	\N	2026-04-24 11:44:38.456	ee81df9d-bb14-419b-bd49-d4c77b4d4214	t	f
ed8154d1-dd0b-4665-8d9c-876cfde5ea05	Guest	\N	2026-04-24 11:44:38.461	ee81df9d-bb14-419b-bd49-d4c77b4d4214	t	f
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Session" (id, "userId", token, "expiresAt", "createdAt") FROM stdin;
423f7aa7-9996-423f-86db-9e27e1311c08	7a95476c-1a39-4232-bcd1-9fb1bb651006	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YTk1NDc2Yy0xYTM5LTQyMzItYmNkMS05ZmIxYmI2NTEwMDYiLCJlbWFpbCI6InN1cGVyYWRtaW5AbmV4d29ydGgubmV0Iiwicm9sZSI6IkFkbWluIiwiaXNTeXN0ZW1BZG1pbiI6dHJ1ZSwib3JnYW5pemF0aW9uSWQiOiJlZTgxZGY5ZC1iYjE0LTQxOWItYmQ0OS1kNGM3N2I0ZDQyMTQiLCJvcmdOYW1lIjoiU3lzdGVtIE1hbmFnZW1lbnQiLCJwZXJtaXNzaW9ucyI6W3siaWQiOiJkODQ4MDRjZC1hZTA5LTQ5MGEtOTRhOS00ZjdjNjRlZGY5YzgiLCJyb2xlSWQiOiI3MGE4NjQzNi1jOTI4LTQ0Y2YtODBjOS0yZjdkZjg5ZGU0OTYiLCJyZXNvdXJjZSI6ImRhc2hib2FyZCIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNDcyWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNDcyWiJ9LHsiaWQiOiIzNTU3ZmY2ZS00MTRiLTQyNzgtYTNjNi1kNmU1NDNhMGJiNDIiLCJyb2xlSWQiOiI3MGE4NjQzNi1jOTI4LTQ0Y2YtODBjOS0yZjdkZjg5ZGU0OTYiLCJyZXNvdXJjZSI6InVzZXJzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC40ODZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC40ODZaIn0seyJpZCI6IjU0NzA0MzQ5LTg4OTctNDdiZS04ODEyLTE3YjUyODUzZDlmNyIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoidHJhbnNhY3Rpb25zIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC40OTZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC40OTZaIn0seyJpZCI6ImFmNjIyM2MxLTY1Y2MtNDU0MC05NzdjLWE0M2U5NjU0N2U0MyIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoicGVybWlzc2lvbnMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjUwNloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjUwNloifSx7ImlkIjoiOWE1YWQ3YjUtNTM3YS00Yjk4LWFkZmItMWI0YTQ4NTM0NThhIiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJtb250aGx5IiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41MTZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41MTZaIn0seyJpZCI6IjMxMzZiNjk3LTQ5OWQtNDE5YS04NWQxLTllYmIxZjAwOTc3MiIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoibG9hbi10cmFja2VyIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41MjZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41MjZaIn0seyJpZCI6ImU5MTZmOTgyLTZmZDYtNGRmMi1iODUzLTFhNTI3YTk0MmU4YiIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoibGlhYmlsaXRpZXMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjUzNloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjUzNloifSx7ImlkIjoiYjdlMjhjNzMtYTAxYS00NDNmLWIzMTctN2E5ZWRiY2M1OTFkIiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJhc3NldHMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjU0NloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjU0NloifSx7ImlkIjoiZTYyMGQ3ZTMtNmU4My00MTJjLWIyMTItNGFmZDJmNzM2YzI4Iiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJhY2NvdW50cyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNTU4WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNTU4WiJ9LHsiaWQiOiJiOWRjYjFiMC05YjBiLTQ2M2UtOGNkNi0yZWE5ODQ3MmQyNmIiLCJyb2xlSWQiOiI3MGE4NjQzNi1jOTI4LTQ0Y2YtODBjOS0yZjdkZjg5ZGU0OTYiLCJyZXNvdXJjZSI6ImJhbmtzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41NjdaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41NjdaIn0seyJpZCI6IjA5MzQzOWExLWEzOTgtNDVjOC04N2ZlLTFmYzY5M2ZhOWE1YiIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoidHlwZXMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjU3NloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjU3NloifSx7ImlkIjoiYWZiZjY1OGYtODYxZS00MmE5LWFkYzItNzQ2ZWEzNzRiNGFhIiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJjYXRlZ29yaWVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41ODZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41ODZaIn1dLCJpYXQiOjE3NzcwMzQzODIsImV4cCI6MTc3NzEyMDc4Mn0.P3f8rmB7R_bEWS7YEBLHtbSLP-1Ub5Hv2yEy6eDAi6g	2026-04-25 12:39:42.39	2026-04-24 12:39:42.392
513109bf-8471-4709-a5d5-41726efb2525	7a95476c-1a39-4232-bcd1-9fb1bb651006	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YTk1NDc2Yy0xYTM5LTQyMzItYmNkMS05ZmIxYmI2NTEwMDYiLCJlbWFpbCI6InN1cGVyYWRtaW5AbmV4d29ydGgubmV0Iiwicm9sZSI6IkFkbWluIiwiaXNTeXN0ZW1BZG1pbiI6dHJ1ZSwib3JnYW5pemF0aW9uSWQiOiJlZTgxZGY5ZC1iYjE0LTQxOWItYmQ0OS1kNGM3N2I0ZDQyMTQiLCJvcmdOYW1lIjoiU3lzdGVtIE1hbmFnZW1lbnQiLCJwZXJtaXNzaW9ucyI6W3siaWQiOiJkODQ4MDRjZC1hZTA5LTQ5MGEtOTRhOS00ZjdjNjRlZGY5YzgiLCJyb2xlSWQiOiI3MGE4NjQzNi1jOTI4LTQ0Y2YtODBjOS0yZjdkZjg5ZGU0OTYiLCJyZXNvdXJjZSI6ImRhc2hib2FyZCIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNDcyWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNDcyWiJ9LHsiaWQiOiIzNTU3ZmY2ZS00MTRiLTQyNzgtYTNjNi1kNmU1NDNhMGJiNDIiLCJyb2xlSWQiOiI3MGE4NjQzNi1jOTI4LTQ0Y2YtODBjOS0yZjdkZjg5ZGU0OTYiLCJyZXNvdXJjZSI6InVzZXJzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC40ODZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC40ODZaIn0seyJpZCI6IjU0NzA0MzQ5LTg4OTctNDdiZS04ODEyLTE3YjUyODUzZDlmNyIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoidHJhbnNhY3Rpb25zIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC40OTZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC40OTZaIn0seyJpZCI6ImFmNjIyM2MxLTY1Y2MtNDU0MC05NzdjLWE0M2U5NjU0N2U0MyIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoicGVybWlzc2lvbnMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjUwNloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjUwNloifSx7ImlkIjoiOWE1YWQ3YjUtNTM3YS00Yjk4LWFkZmItMWI0YTQ4NTM0NThhIiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJtb250aGx5IiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41MTZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41MTZaIn0seyJpZCI6IjMxMzZiNjk3LTQ5OWQtNDE5YS04NWQxLTllYmIxZjAwOTc3MiIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoibG9hbi10cmFja2VyIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41MjZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41MjZaIn0seyJpZCI6ImU5MTZmOTgyLTZmZDYtNGRmMi1iODUzLTFhNTI3YTk0MmU4YiIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoibGlhYmlsaXRpZXMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjUzNloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjUzNloifSx7ImlkIjoiYjdlMjhjNzMtYTAxYS00NDNmLWIzMTctN2E5ZWRiY2M1OTFkIiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJhc3NldHMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjU0NloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjU0NloifSx7ImlkIjoiZTYyMGQ3ZTMtNmU4My00MTJjLWIyMTItNGFmZDJmNzM2YzI4Iiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJhY2NvdW50cyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNTU4WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNTU4WiJ9LHsiaWQiOiJiOWRjYjFiMC05YjBiLTQ2M2UtOGNkNi0yZWE5ODQ3MmQyNmIiLCJyb2xlSWQiOiI3MGE4NjQzNi1jOTI4LTQ0Y2YtODBjOS0yZjdkZjg5ZGU0OTYiLCJyZXNvdXJjZSI6ImJhbmtzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41NjdaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41NjdaIn0seyJpZCI6IjA5MzQzOWExLWEzOTgtNDVjOC04N2ZlLTFmYzY5M2ZhOWE1YiIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoidHlwZXMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjU3NloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjU3NloifSx7ImlkIjoiYWZiZjY1OGYtODYxZS00MmE5LWFkYzItNzQ2ZWEzNzRiNGFhIiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJjYXRlZ29yaWVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41ODZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41ODZaIn1dLCJpYXQiOjE3NzcwMzQ0MDUsImV4cCI6MTc3NzEyMDgwNX0.Bqgo-yrxwbsw8aT1p6jkcJB8rgfoGX8CiW2pEWQvYoU	2026-04-25 12:40:05.903	2026-04-24 12:40:05.99
f6951a67-3fed-4b08-a088-59f35a88f185	7a95476c-1a39-4232-bcd1-9fb1bb651006	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YTk1NDc2Yy0xYTM5LTQyMzItYmNkMS05ZmIxYmI2NTEwMDYiLCJlbWFpbCI6InN1cGVyYWRtaW5AbmV4d29ydGgubmV0Iiwicm9sZSI6IkFkbWluIiwiaXNTeXN0ZW1BZG1pbiI6dHJ1ZSwib3JnYW5pemF0aW9uSWQiOiJlZTgxZGY5ZC1iYjE0LTQxOWItYmQ0OS1kNGM3N2I0ZDQyMTQiLCJvcmdOYW1lIjoiU3lzdGVtIE1hbmFnZW1lbnQiLCJwZXJtaXNzaW9ucyI6W3siaWQiOiJkODQ4MDRjZC1hZTA5LTQ5MGEtOTRhOS00ZjdjNjRlZGY5YzgiLCJyb2xlSWQiOiI3MGE4NjQzNi1jOTI4LTQ0Y2YtODBjOS0yZjdkZjg5ZGU0OTYiLCJyZXNvdXJjZSI6ImRhc2hib2FyZCIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNDcyWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNDcyWiJ9LHsiaWQiOiIzNTU3ZmY2ZS00MTRiLTQyNzgtYTNjNi1kNmU1NDNhMGJiNDIiLCJyb2xlSWQiOiI3MGE4NjQzNi1jOTI4LTQ0Y2YtODBjOS0yZjdkZjg5ZGU0OTYiLCJyZXNvdXJjZSI6InVzZXJzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC40ODZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC40ODZaIn0seyJpZCI6IjU0NzA0MzQ5LTg4OTctNDdiZS04ODEyLTE3YjUyODUzZDlmNyIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoidHJhbnNhY3Rpb25zIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC40OTZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC40OTZaIn0seyJpZCI6ImFmNjIyM2MxLTY1Y2MtNDU0MC05NzdjLWE0M2U5NjU0N2U0MyIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoicGVybWlzc2lvbnMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjUwNloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjUwNloifSx7ImlkIjoiOWE1YWQ3YjUtNTM3YS00Yjk4LWFkZmItMWI0YTQ4NTM0NThhIiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJtb250aGx5IiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41MTZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41MTZaIn0seyJpZCI6IjMxMzZiNjk3LTQ5OWQtNDE5YS04NWQxLTllYmIxZjAwOTc3MiIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoibG9hbi10cmFja2VyIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41MjZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41MjZaIn0seyJpZCI6ImU5MTZmOTgyLTZmZDYtNGRmMi1iODUzLTFhNTI3YTk0MmU4YiIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoibGlhYmlsaXRpZXMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjUzNloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjUzNloifSx7ImlkIjoiYjdlMjhjNzMtYTAxYS00NDNmLWIzMTctN2E5ZWRiY2M1OTFkIiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJhc3NldHMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjU0NloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjU0NloifSx7ImlkIjoiZTYyMGQ3ZTMtNmU4My00MTJjLWIyMTItNGFmZDJmNzM2YzI4Iiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJhY2NvdW50cyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNTU4WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNTU4WiJ9LHsiaWQiOiJiOWRjYjFiMC05YjBiLTQ2M2UtOGNkNi0yZWE5ODQ3MmQyNmIiLCJyb2xlSWQiOiI3MGE4NjQzNi1jOTI4LTQ0Y2YtODBjOS0yZjdkZjg5ZGU0OTYiLCJyZXNvdXJjZSI6ImJhbmtzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41NjdaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41NjdaIn0seyJpZCI6IjA5MzQzOWExLWEzOTgtNDVjOC04N2ZlLTFmYzY5M2ZhOWE1YiIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoidHlwZXMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjU3NloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjU3NloifSx7ImlkIjoiYWZiZjY1OGYtODYxZS00MmE5LWFkYzItNzQ2ZWEzNzRiNGFhIiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJjYXRlZ29yaWVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41ODZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41ODZaIn1dLCJpYXQiOjE3NzcwMzQ0MjMsImV4cCI6MTc3NzEyMDgyM30.zpeQFmz7KlNUXVin4EBZD0c8QZS5C8LfovIunMGuqrE	2026-04-25 12:40:23.888	2026-04-24 12:40:23.889
cfee3927-76f5-4947-913e-3fc4ee5c3377	7a95476c-1a39-4232-bcd1-9fb1bb651006	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YTk1NDc2Yy0xYTM5LTQyMzItYmNkMS05ZmIxYmI2NTEwMDYiLCJlbWFpbCI6InN1cGVyYWRtaW5AbmV4d29ydGgubmV0Iiwicm9sZSI6IkFkbWluIiwiaXNTeXN0ZW1BZG1pbiI6dHJ1ZSwib3JnYW5pemF0aW9uSWQiOiJlZTgxZGY5ZC1iYjE0LTQxOWItYmQ0OS1kNGM3N2I0ZDQyMTQiLCJvcmdOYW1lIjoiU3lzdGVtIE1hbmFnZW1lbnQiLCJwZXJtaXNzaW9ucyI6W3siaWQiOiJkODQ4MDRjZC1hZTA5LTQ5MGEtOTRhOS00ZjdjNjRlZGY5YzgiLCJyb2xlSWQiOiI3MGE4NjQzNi1jOTI4LTQ0Y2YtODBjOS0yZjdkZjg5ZGU0OTYiLCJyZXNvdXJjZSI6ImRhc2hib2FyZCIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNDcyWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNDcyWiJ9LHsiaWQiOiIzNTU3ZmY2ZS00MTRiLTQyNzgtYTNjNi1kNmU1NDNhMGJiNDIiLCJyb2xlSWQiOiI3MGE4NjQzNi1jOTI4LTQ0Y2YtODBjOS0yZjdkZjg5ZGU0OTYiLCJyZXNvdXJjZSI6InVzZXJzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC40ODZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC40ODZaIn0seyJpZCI6IjU0NzA0MzQ5LTg4OTctNDdiZS04ODEyLTE3YjUyODUzZDlmNyIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoidHJhbnNhY3Rpb25zIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC40OTZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC40OTZaIn0seyJpZCI6ImFmNjIyM2MxLTY1Y2MtNDU0MC05NzdjLWE0M2U5NjU0N2U0MyIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoicGVybWlzc2lvbnMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjUwNloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjUwNloifSx7ImlkIjoiOWE1YWQ3YjUtNTM3YS00Yjk4LWFkZmItMWI0YTQ4NTM0NThhIiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJtb250aGx5IiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41MTZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41MTZaIn0seyJpZCI6IjMxMzZiNjk3LTQ5OWQtNDE5YS04NWQxLTllYmIxZjAwOTc3MiIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoibG9hbi10cmFja2VyIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41MjZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41MjZaIn0seyJpZCI6ImU5MTZmOTgyLTZmZDYtNGRmMi1iODUzLTFhNTI3YTk0MmU4YiIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoibGlhYmlsaXRpZXMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjUzNloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjUzNloifSx7ImlkIjoiYjdlMjhjNzMtYTAxYS00NDNmLWIzMTctN2E5ZWRiY2M1OTFkIiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJhc3NldHMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjU0NloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjU0NloifSx7ImlkIjoiZTYyMGQ3ZTMtNmU4My00MTJjLWIyMTItNGFmZDJmNzM2YzI4Iiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJhY2NvdW50cyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNTU4WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNTU4WiJ9LHsiaWQiOiJiOWRjYjFiMC05YjBiLTQ2M2UtOGNkNi0yZWE5ODQ3MmQyNmIiLCJyb2xlSWQiOiI3MGE4NjQzNi1jOTI4LTQ0Y2YtODBjOS0yZjdkZjg5ZGU0OTYiLCJyZXNvdXJjZSI6ImJhbmtzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41NjdaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41NjdaIn0seyJpZCI6IjA5MzQzOWExLWEzOTgtNDVjOC04N2ZlLTFmYzY5M2ZhOWE1YiIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoidHlwZXMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjU3NloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjU3NloifSx7ImlkIjoiYWZiZjY1OGYtODYxZS00MmE5LWFkYzItNzQ2ZWEzNzRiNGFhIiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJjYXRlZ29yaWVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41ODZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41ODZaIn1dLCJpYXQiOjE3NzcwNDIwMzAsImV4cCI6MTc3NzEyODQzMH0.LAD2TBoD5oOKJ-eK7DFXJwqJbygbd_xi52uaOtrrFMY	2026-04-25 14:47:10.984	2026-04-24 14:47:10.987
bf94bbb0-f901-4c67-84a9-e5f1064e5412	7a95476c-1a39-4232-bcd1-9fb1bb651006	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YTk1NDc2Yy0xYTM5LTQyMzItYmNkMS05ZmIxYmI2NTEwMDYiLCJlbWFpbCI6InN1cGVyYWRtaW5AbmV4d29ydGgubmV0Iiwicm9sZSI6IkFkbWluIiwiaXNTeXN0ZW1BZG1pbiI6dHJ1ZSwib3JnYW5pemF0aW9uSWQiOiJlZTgxZGY5ZC1iYjE0LTQxOWItYmQ0OS1kNGM3N2I0ZDQyMTQiLCJvcmdOYW1lIjoiU3lzdGVtIE1hbmFnZW1lbnQiLCJwZXJtaXNzaW9ucyI6W3siaWQiOiJkODQ4MDRjZC1hZTA5LTQ5MGEtOTRhOS00ZjdjNjRlZGY5YzgiLCJyb2xlSWQiOiI3MGE4NjQzNi1jOTI4LTQ0Y2YtODBjOS0yZjdkZjg5ZGU0OTYiLCJyZXNvdXJjZSI6ImRhc2hib2FyZCIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNDcyWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNDcyWiJ9LHsiaWQiOiIzNTU3ZmY2ZS00MTRiLTQyNzgtYTNjNi1kNmU1NDNhMGJiNDIiLCJyb2xlSWQiOiI3MGE4NjQzNi1jOTI4LTQ0Y2YtODBjOS0yZjdkZjg5ZGU0OTYiLCJyZXNvdXJjZSI6InVzZXJzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC40ODZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC40ODZaIn0seyJpZCI6IjU0NzA0MzQ5LTg4OTctNDdiZS04ODEyLTE3YjUyODUzZDlmNyIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoidHJhbnNhY3Rpb25zIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC40OTZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC40OTZaIn0seyJpZCI6ImFmNjIyM2MxLTY1Y2MtNDU0MC05NzdjLWE0M2U5NjU0N2U0MyIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoicGVybWlzc2lvbnMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjUwNloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjUwNloifSx7ImlkIjoiOWE1YWQ3YjUtNTM3YS00Yjk4LWFkZmItMWI0YTQ4NTM0NThhIiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJtb250aGx5IiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41MTZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41MTZaIn0seyJpZCI6IjMxMzZiNjk3LTQ5OWQtNDE5YS04NWQxLTllYmIxZjAwOTc3MiIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoibG9hbi10cmFja2VyIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41MjZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41MjZaIn0seyJpZCI6ImU5MTZmOTgyLTZmZDYtNGRmMi1iODUzLTFhNTI3YTk0MmU4YiIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoibGlhYmlsaXRpZXMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjUzNloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjUzNloifSx7ImlkIjoiYjdlMjhjNzMtYTAxYS00NDNmLWIzMTctN2E5ZWRiY2M1OTFkIiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJhc3NldHMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjU0NloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjU0NloifSx7ImlkIjoiZTYyMGQ3ZTMtNmU4My00MTJjLWIyMTItNGFmZDJmNzM2YzI4Iiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJhY2NvdW50cyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNTU4WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNTU4WiJ9LHsiaWQiOiJiOWRjYjFiMC05YjBiLTQ2M2UtOGNkNi0yZWE5ODQ3MmQyNmIiLCJyb2xlSWQiOiI3MGE4NjQzNi1jOTI4LTQ0Y2YtODBjOS0yZjdkZjg5ZGU0OTYiLCJyZXNvdXJjZSI6ImJhbmtzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41NjdaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41NjdaIn0seyJpZCI6IjA5MzQzOWExLWEzOTgtNDVjOC04N2ZlLTFmYzY5M2ZhOWE1YiIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoidHlwZXMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjU3NloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjU3NloifSx7ImlkIjoiYWZiZjY1OGYtODYxZS00MmE5LWFkYzItNzQ2ZWEzNzRiNGFhIiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJjYXRlZ29yaWVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41ODZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41ODZaIn1dLCJpYXQiOjE3NzcxMjIwNDgsImV4cCI6MTc3NzIwODQ0OH0.mfpYBsTItkujUbAjlnbtGSiW2GWW6KBerkbhvMaJ_2E	2026-04-26 13:00:48.821	2026-04-25 13:00:48.91
f00b4788-158a-4542-9b3f-7817ed3eb1a8	7a95476c-1a39-4232-bcd1-9fb1bb651006	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YTk1NDc2Yy0xYTM5LTQyMzItYmNkMS05ZmIxYmI2NTEwMDYiLCJlbWFpbCI6InN1cGVyYWRtaW5AbmV4d29ydGgubmV0Iiwicm9sZSI6IkFkbWluIiwiaXNTeXN0ZW1BZG1pbiI6dHJ1ZSwib3JnYW5pemF0aW9uSWQiOiJlZTgxZGY5ZC1iYjE0LTQxOWItYmQ0OS1kNGM3N2I0ZDQyMTQiLCJvcmdOYW1lIjoiU3lzdGVtIE1hbmFnZW1lbnQiLCJwZXJtaXNzaW9ucyI6W3siaWQiOiJkODQ4MDRjZC1hZTA5LTQ5MGEtOTRhOS00ZjdjNjRlZGY5YzgiLCJyb2xlSWQiOiI3MGE4NjQzNi1jOTI4LTQ0Y2YtODBjOS0yZjdkZjg5ZGU0OTYiLCJyZXNvdXJjZSI6ImRhc2hib2FyZCIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNDcyWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNDcyWiJ9LHsiaWQiOiIzNTU3ZmY2ZS00MTRiLTQyNzgtYTNjNi1kNmU1NDNhMGJiNDIiLCJyb2xlSWQiOiI3MGE4NjQzNi1jOTI4LTQ0Y2YtODBjOS0yZjdkZjg5ZGU0OTYiLCJyZXNvdXJjZSI6InVzZXJzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC40ODZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC40ODZaIn0seyJpZCI6IjU0NzA0MzQ5LTg4OTctNDdiZS04ODEyLTE3YjUyODUzZDlmNyIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoidHJhbnNhY3Rpb25zIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC40OTZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC40OTZaIn0seyJpZCI6ImFmNjIyM2MxLTY1Y2MtNDU0MC05NzdjLWE0M2U5NjU0N2U0MyIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoicGVybWlzc2lvbnMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjUwNloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjUwNloifSx7ImlkIjoiOWE1YWQ3YjUtNTM3YS00Yjk4LWFkZmItMWI0YTQ4NTM0NThhIiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJtb250aGx5IiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41MTZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41MTZaIn0seyJpZCI6IjMxMzZiNjk3LTQ5OWQtNDE5YS04NWQxLTllYmIxZjAwOTc3MiIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoibG9hbi10cmFja2VyIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41MjZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41MjZaIn0seyJpZCI6ImU5MTZmOTgyLTZmZDYtNGRmMi1iODUzLTFhNTI3YTk0MmU4YiIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoibGlhYmlsaXRpZXMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjUzNloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjUzNloifSx7ImlkIjoiYjdlMjhjNzMtYTAxYS00NDNmLWIzMTctN2E5ZWRiY2M1OTFkIiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJhc3NldHMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjU0NloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjU0NloifSx7ImlkIjoiZTYyMGQ3ZTMtNmU4My00MTJjLWIyMTItNGFmZDJmNzM2YzI4Iiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJhY2NvdW50cyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNTU4WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNTU4WiJ9LHsiaWQiOiJiOWRjYjFiMC05YjBiLTQ2M2UtOGNkNi0yZWE5ODQ3MmQyNmIiLCJyb2xlSWQiOiI3MGE4NjQzNi1jOTI4LTQ0Y2YtODBjOS0yZjdkZjg5ZGU0OTYiLCJyZXNvdXJjZSI6ImJhbmtzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41NjdaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41NjdaIn0seyJpZCI6IjA5MzQzOWExLWEzOTgtNDVjOC04N2ZlLTFmYzY5M2ZhOWE1YiIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoidHlwZXMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjU3NloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjU3NloifSx7ImlkIjoiYWZiZjY1OGYtODYxZS00MmE5LWFkYzItNzQ2ZWEzNzRiNGFhIiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJjYXRlZ29yaWVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41ODZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41ODZaIn1dLCJpYXQiOjE3NzcxMjc4MjgsImV4cCI6MTc3NzIxNDIyOH0.BCQgizGD5zliaul0kW3dMWmNyApqoQh0d-zl178oW9A	2026-04-26 14:37:08.114	2026-04-25 14:37:08.116
2df0f556-d79a-4fe2-8c44-60d802ad118c	2dc4de80-5323-4859-81f0-caf914fc5f60	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZGM0ZGU4MC01MzIzLTQ4NTktODFmMC1jYWY5MTRmYzVmNjAiLCJlbWFpbCI6Im5lcmFuY2hhcmEua3NyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiIsImlzU3lzdGVtQWRtaW4iOmZhbHNlLCJvcmdhbml6YXRpb25JZCI6IjMyODM5NDkwLWE3ZjUtNDczMC1hNzhmLTA5MjNmNDk0YmY0NyIsIm9yZ05hbWUiOiJuZXJhbmNoYXJhIiwicGVybWlzc2lvbnMiOlt7ImlkIjoiZTE1ZmFhOGUtNDIzMy00YzM4LTlhZGMtYmVlZDBlY2E4MmNjIiwicm9sZUlkIjoiYWM3YjhkNDItNTFkZS00YzQ1LThjYmQtMjRjNTVlZDU0MjIyIiwicmVzb3VyY2UiOiJiYW5rcyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDMtMjRUMDQ6NTg6NDcuMzc5WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMTdUMTA6NTQ6NTQuNDM3WiJ9LHsiaWQiOiJhMjM4NzI2Yy0wNTIxLTQyNmMtYTU4Mi0xNzY0ZjU5ZDUwMmQiLCJyb2xlSWQiOiJhYzdiOGQ0Mi01MWRlLTRjNDUtOGNiZC0yNGM1NWVkNTQyMjIiLCJyZXNvdXJjZSI6InR5cGVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wMy0yNFQwNDo1ODo0Ny4zODFaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0xN1QxMDo1NDo1NC40MzdaIn0seyJpZCI6ImMwNjg2ZjhkLTc2OWItNDVkMy1hNDRiLWFkNjU0NmE2YjhjYSIsInJvbGVJZCI6ImFjN2I4ZDQyLTUxZGUtNGM0NS04Y2JkLTI0YzU1ZWQ1NDIyMiIsInJlc291cmNlIjoiY2F0ZWdvcmllcyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDMtMjRUMDQ6NTg6NDcuMzgyWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMTdUMTA6NTQ6NTQuNDM3WiJ9LHsiaWQiOiIzYmJjYjkyMi0xMWMzLTQ4ZTAtYThlMS1jY2FjOTQxNjdlNjEiLCJyb2xlSWQiOiJhYzdiOGQ0Mi01MWRlLTRjNDUtOGNiZC0yNGM1NWVkNTQyMjIiLCJyZXNvdXJjZSI6InVzZXJzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wMy0yNFQwNDo1ODo0Ny4zODNaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0xN1QxMDo1NDo1NC40MzdaIn0seyJpZCI6IjMyZTYwODc2LTk4OGYtNGRlNS05MmNlLTEwMDQ1MjViNDFlYiIsInJvbGVJZCI6ImFjN2I4ZDQyLTUxZGUtNGM0NS04Y2JkLTI0YzU1ZWQ1NDIyMiIsInJlc291cmNlIjoibG9hbi10cmFja2VyIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wMy0yNFQwNDo1ODo0Ny4zODNaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0xN1QxMDo1NDo1NC40MzdaIn0seyJpZCI6Ijc2ZjMxNWI2LTcyN2ItNGVmYi1hZTYwLTE1MGYyMmQ2ZDNmYSIsInJvbGVJZCI6ImFjN2I4ZDQyLTUxZGUtNGM0NS04Y2JkLTI0YzU1ZWQ1NDIyMiIsInJlc291cmNlIjoicGVybWlzc2lvbnMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTAzLTI0VDA0OjU4OjQ3LjM4NFoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTE3VDEwOjU0OjU0LjQzN1oifSx7ImlkIjoiY2NjMTNhMzItNDkzZS00OTEzLTkwNjYtZjZmZjY3ZmZmMjMzIiwicm9sZUlkIjoiYWM3YjhkNDItNTFkZS00YzQ1LThjYmQtMjRjNTVlZDU0MjIyIiwicmVzb3VyY2UiOiJkYXNoYm9hcmQiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTAzLTI0VDA0OjU4OjQ3LjM2OVoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTE3VDEwOjU0OjU0LjQzN1oifSx7ImlkIjoiZjdiMzBmYTQtOTc2My00NWQzLWIzYjMtMTIwYTY1MGM0ZmI4Iiwicm9sZUlkIjoiYWM3YjhkNDItNTFkZS00YzQ1LThjYmQtMjRjNTVlZDU0MjIyIiwicmVzb3VyY2UiOiJtb250aGx5IiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wMy0yNFQwNDo1ODo0Ny4zNzNaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0xN1QxMDo1NDo1NC40MzdaIn0seyJpZCI6ImIyMGY3MjYwLTIyZTgtNDg2NS04ZGI0LWYyYTdkYmUyNzU1NCIsInJvbGVJZCI6ImFjN2I4ZDQyLTUxZGUtNGM0NS04Y2JkLTI0YzU1ZWQ1NDIyMiIsInJlc291cmNlIjoidHJhbnNhY3Rpb25zIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wMy0yNFQwNDo1ODo0Ny4zNzRaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0xN1QxMDo1NDo1NC40MzdaIn0seyJpZCI6ImYyOTIzMDA5LTIyOGYtNGFjNC1hNTQzLTNkN2RjNGU3MzVjMyIsInJvbGVJZCI6ImFjN2I4ZDQyLTUxZGUtNGM0NS04Y2JkLTI0YzU1ZWQ1NDIyMiIsInJlc291cmNlIjoiYWNjb3VudHMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTAzLTI0VDA0OjU4OjQ3LjM3NVoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTE3VDEwOjU0OjU0LjQzN1oifSx7ImlkIjoiNzM0NDIxYWYtM2E5NS00NjYxLThmZGUtNWQyNWY2YWJjYzZiIiwicm9sZUlkIjoiYWM3YjhkNDItNTFkZS00YzQ1LThjYmQtMjRjNTVlZDU0MjIyIiwicmVzb3VyY2UiOiJhc3NldHMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTAzLTI0VDA0OjU4OjQ3LjM3NloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTE3VDEwOjU0OjU0LjQzN1oifSx7ImlkIjoiZTc4ZTAwN2UtNDZkOS00ZmQzLThjYWUtNWM1MDQ5YTIxMGU1Iiwicm9sZUlkIjoiYWM3YjhkNDItNTFkZS00YzQ1LThjYmQtMjRjNTVlZDU0MjIyIiwicmVzb3VyY2UiOiJsaWFiaWxpdGllcyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDMtMjRUMDQ6NTg6NDcuMzc4WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMTdUMTA6NTQ6NTQuNDM3WiJ9XSwiaWF0IjoxNzc3MTQzNzMwLCJleHAiOjE3NzcyMzAxMzB9.e8p3L5AMjVxaW0KvwYEXIlJHyutA-L6xkMcDDnrlHe0	2026-04-26 19:02:10.671	2026-04-25 19:02:10.673
34b5540e-671d-492e-8759-b89237589842	2dc4de80-5323-4859-81f0-caf914fc5f60	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZGM0ZGU4MC01MzIzLTQ4NTktODFmMC1jYWY5MTRmYzVmNjAiLCJlbWFpbCI6Im5lcmFuY2hhcmEua3NyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiIsImlzU3lzdGVtQWRtaW4iOmZhbHNlLCJvcmdhbml6YXRpb25JZCI6IjMyODM5NDkwLWE3ZjUtNDczMC1hNzhmLTA5MjNmNDk0YmY0NyIsIm9yZ05hbWUiOiJuZXJhbmNoYXJhIiwicGVybWlzc2lvbnMiOlt7ImlkIjoiN2VmZjcwM2YtZDAzYS00ZWYzLWEwMmMtNjlhOGVmMjdiNGNhIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJkYXNoYm9hcmQiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUxLjg4NFoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUxLjg4NFoifSx7ImlkIjoiNjFmMGQ5NzItM2YyMi00MjU2LWIwOTktNjZhMDcwZGQ0MDUzIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJ0cmFuc2FjdGlvbnMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUxLjk3MVoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUxLjk3MVoifSx7ImlkIjoiMTk2YjViMDgtYTZlNC00ZTRmLWJlZjktNTAzOTU1YzM1ODgwIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJhc3NldHMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUyLjAwNloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUyLjAwNloifSx7ImlkIjoiYjUyZGI5YTAtMmZhMy00MGFkLThmMDgtOTY4MzA2NThmYzkzIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJsaWFiaWxpdGllcyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMDQwWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMDQwWiJ9LHsiaWQiOiI4MTM4MDZhZC1jOTNiLTQ3OGEtOWMxNC1kMzk2ZGZhMGQzNGEiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6ImxvYW4tdHJhY2tlciIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMDc1WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMDc1WiJ9LHsiaWQiOiI4ODg5NTZjZC1lYTUwLTQxZmMtOTQzOC02NmFiOWJlZjhhYWEiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6Im1vbnRobHktc3VtbWFyeSIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTA5WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTA5WiJ9LHsiaWQiOiI1YTk4MDJhMS0yMTc2LTRjNTItYTUyZC04YWI4M2E1ZjgzZGYiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6InVzZXJzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4xNDNaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4xNDNaIn0seyJpZCI6Ijk1MWI4YzExLWU4N2MtNGFiMy04MGIwLTUyY2Y4NjJhMjYwNyIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoicm9sZXMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUyLjE3N1oiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUyLjE3N1oifSx7ImlkIjoiNjEyOTZlZTItZDkyZi00ZTEzLWFiNjYtMjExOWI1MzkzZGEyIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJzZXR0aW5ncyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMjEyWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMjEyWiJ9XSwiaWF0IjoxNzc3MTc3NDg1LCJleHAiOjE3NzcyNjM4ODV9.gxN4k179lm5Y8FQKlz-B1PLBUW6V6cndXuqYCgn0O60	2026-04-27 04:24:45.792	2026-04-26 04:24:45.882
924da239-4a67-464f-9064-eda4c4feaed3	2dc4de80-5323-4859-81f0-caf914fc5f60	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZGM0ZGU4MC01MzIzLTQ4NTktODFmMC1jYWY5MTRmYzVmNjAiLCJlbWFpbCI6Im5lcmFuY2hhcmEua3NyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiIsImlzU3lzdGVtQWRtaW4iOmZhbHNlLCJvcmdhbml6YXRpb25JZCI6IjMyODM5NDkwLWE3ZjUtNDczMC1hNzhmLTA5MjNmNDk0YmY0NyIsIm9yZ05hbWUiOiJuZXJhbmNoYXJhIiwicGVybWlzc2lvbnMiOlt7ImlkIjoiN2VmZjcwM2YtZDAzYS00ZWYzLWEwMmMtNjlhOGVmMjdiNGNhIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJkYXNoYm9hcmQiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUxLjg4NFoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUxLjg4NFoifSx7ImlkIjoiNjFmMGQ5NzItM2YyMi00MjU2LWIwOTktNjZhMDcwZGQ0MDUzIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJ0cmFuc2FjdGlvbnMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUxLjk3MVoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUxLjk3MVoifSx7ImlkIjoiMTk2YjViMDgtYTZlNC00ZTRmLWJlZjktNTAzOTU1YzM1ODgwIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJhc3NldHMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUyLjAwNloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUyLjAwNloifSx7ImlkIjoiYjUyZGI5YTAtMmZhMy00MGFkLThmMDgtOTY4MzA2NThmYzkzIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJsaWFiaWxpdGllcyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMDQwWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMDQwWiJ9LHsiaWQiOiI4MTM4MDZhZC1jOTNiLTQ3OGEtOWMxNC1kMzk2ZGZhMGQzNGEiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6ImxvYW4tdHJhY2tlciIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMDc1WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMDc1WiJ9LHsiaWQiOiI4ODg5NTZjZC1lYTUwLTQxZmMtOTQzOC02NmFiOWJlZjhhYWEiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6Im1vbnRobHktc3VtbWFyeSIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTA5WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTA5WiJ9LHsiaWQiOiI1YTk4MDJhMS0yMTc2LTRjNTItYTUyZC04YWI4M2E1ZjgzZGYiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6InVzZXJzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4xNDNaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4xNDNaIn0seyJpZCI6Ijk1MWI4YzExLWU4N2MtNGFiMy04MGIwLTUyY2Y4NjJhMjYwNyIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoicm9sZXMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUyLjE3N1oiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUyLjE3N1oifSx7ImlkIjoiNjEyOTZlZTItZDkyZi00ZTEzLWFiNjYtMjExOWI1MzkzZGEyIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJzZXR0aW5ncyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMjEyWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMjEyWiJ9XSwiaWF0IjoxNzc3MzY3MjYzLCJleHAiOjE3Nzc0NTM2NjN9.WwCl2lJPeu7nFQPtaxqnMSySuemFr7sqtitsdlGbink	2026-04-29 09:07:43.892	2026-04-28 09:07:43.896
82e6d313-54d6-4a69-9c3d-6fb72e30d268	2dc4de80-5323-4859-81f0-caf914fc5f60	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZGM0ZGU4MC01MzIzLTQ4NTktODFmMC1jYWY5MTRmYzVmNjAiLCJlbWFpbCI6Im5lcmFuY2hhcmEua3NyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiIsImlzU3lzdGVtQWRtaW4iOmZhbHNlLCJvcmdhbml6YXRpb25JZCI6IjMyODM5NDkwLWE3ZjUtNDczMC1hNzhmLTA5MjNmNDk0YmY0NyIsIm9yZ05hbWUiOiJuZXJhbmNoYXJhIiwicGVybWlzc2lvbnMiOlt7ImlkIjoiN2VmZjcwM2YtZDAzYS00ZWYzLWEwMmMtNjlhOGVmMjdiNGNhIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJkYXNoYm9hcmQiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUxLjg4NFoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUxLjg4NFoifSx7ImlkIjoiNjFmMGQ5NzItM2YyMi00MjU2LWIwOTktNjZhMDcwZGQ0MDUzIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJ0cmFuc2FjdGlvbnMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUxLjk3MVoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUxLjk3MVoifSx7ImlkIjoiMTk2YjViMDgtYTZlNC00ZTRmLWJlZjktNTAzOTU1YzM1ODgwIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJhc3NldHMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUyLjAwNloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUyLjAwNloifSx7ImlkIjoiYjUyZGI5YTAtMmZhMy00MGFkLThmMDgtOTY4MzA2NThmYzkzIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJsaWFiaWxpdGllcyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMDQwWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMDQwWiJ9LHsiaWQiOiI4MTM4MDZhZC1jOTNiLTQ3OGEtOWMxNC1kMzk2ZGZhMGQzNGEiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6ImxvYW4tdHJhY2tlciIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMDc1WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMDc1WiJ9LHsiaWQiOiI4ODg5NTZjZC1lYTUwLTQxZmMtOTQzOC02NmFiOWJlZjhhYWEiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6Im1vbnRobHktc3VtbWFyeSIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTA5WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTA5WiJ9LHsiaWQiOiI1YTk4MDJhMS0yMTc2LTRjNTItYTUyZC04YWI4M2E1ZjgzZGYiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6InVzZXJzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4xNDNaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4xNDNaIn0seyJpZCI6Ijk1MWI4YzExLWU4N2MtNGFiMy04MGIwLTUyY2Y4NjJhMjYwNyIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoicm9sZXMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUyLjE3N1oiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUyLjE3N1oifSx7ImlkIjoiNjEyOTZlZTItZDkyZi00ZTEzLWFiNjYtMjExOWI1MzkzZGEyIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJzZXR0aW5ncyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMjEyWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMjEyWiJ9XSwiaWF0IjoxNzc3NTQ5MTQyLCJleHAiOjE3Nzc2MzU1NDJ9.8GTjajSNUpQPEs7E3DPQhTENtpYdvWHZSQoQVeXwxgY	2026-05-01 11:39:02.392	2026-04-30 11:39:02.393
759c036f-e7d9-4d3a-89a9-eb59b6f9d24e	2dc4de80-5323-4859-81f0-caf914fc5f60	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZGM0ZGU4MC01MzIzLTQ4NTktODFmMC1jYWY5MTRmYzVmNjAiLCJlbWFpbCI6Im5lcmFuY2hhcmEua3NyQGdtYWlsLmNvbSIsImZpcnN0TmFtZSI6Ik5lcmFuY2hhcmEiLCJsYXN0TmFtZSI6IkFkbWluIiwicm9sZSI6IkFkbWluIiwiaXNTeXN0ZW1BZG1pbiI6ZmFsc2UsIm9yZ2FuaXphdGlvbklkIjoiMzI4Mzk0OTAtYTdmNS00NzMwLWE3OGYtMDkyM2Y0OTRiZjQ3Iiwib3JnTmFtZSI6Im5lcmFuY2hhcmEiLCJwZXJtaXNzaW9ucyI6W3siaWQiOiI4ODg5NTZjZC1lYTUwLTQxZmMtOTQzOC02NmFiOWJlZjhhYWEiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6Im1vbnRobHktc3VtbWFyeSIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTA5WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTA5WiJ9LHsiaWQiOiI5NTFiOGMxMS1lODdjLTRhYjMtODBiMC01MmNmODYyYTI2MDciLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6InJvbGVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4xNzdaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4xNzdaIn0seyJpZCI6IjYxMjk2ZWUyLWQ5MmYtNGUxMy1hYjY2LTIxMTliNTM5M2RhMiIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoic2V0dGluZ3MiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUyLjIxMloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUyLjIxMloifSx7ImlkIjoiN2VmZjcwM2YtZDAzYS00ZWYzLWEwMmMtNjlhOGVmMjdiNGNhIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJkYXNoYm9hcmQiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUxLjg4NFoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI3LjYxNVoifSx7ImlkIjoiNWE5ODAyYTEtMjE3Ni00YzUyLWE1MmQtOGFiODNhNWY4M2RmIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJ1c2VycyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTQzWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjcuNzU2WiJ9LHsiaWQiOiI2MWYwZDk3Mi0zZjIyLTQyNTYtYjA5OS02NmEwNzBkZDQwNTMiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6InRyYW5zYWN0aW9ucyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTEuOTcxWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjcuODg2WiJ9LHsiaWQiOiI4MTM4MDZhZC1jOTNiLTQ3OGEtOWMxNC1kMzk2ZGZhMGQzNGEiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6ImxvYW4tdHJhY2tlciIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMDc1WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjguMjgxWiJ9LHsiaWQiOiJiNTJkYjlhMC0yZmEzLTQwYWQtOGYwOC05NjgzMDY1OGZjOTMiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6ImxpYWJpbGl0aWVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4wNDBaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC40MTNaIn0seyJpZCI6IjE5NmI1YjA4LWE2ZTQtNGU0Zi1iZWY5LTUwMzk1NWMzNTg4MCIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoiYXNzZXRzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4wMDZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC41NDJaIn0seyJpZCI6IjdlNDA1ZTkyLWM1ZDEtNGVlNC1hYjhiLWRhNjMzZTYyN2E0MyIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoicGVybWlzc2lvbnMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjAxOVoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjAxOVoifSx7ImlkIjoiZDkwZjg3MDctNDQxNy00MDFmLTkxMTMtOTg2ODBhOGFlYTkwIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJtb250aGx5IiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC4xNTFaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC4xNTFaIn0seyJpZCI6IjQ4MjYyOWRjLWU2NjktNGNhYS05MDlkLWY5ODY0MjY3Y2RhZCIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoiYWNjb3VudHMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjY3MVoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjY3MVoifSx7ImlkIjoiN2YyYTY0ZTQtMWQ4My00ZjA4LTlhNjItNzM2MmUxZTZjNDNmIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJiYW5rcyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjguODAyWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjguODAyWiJ9LHsiaWQiOiI3ZTdkMjYyNi01YmFlLTQ2ZjItOTVmMi1kMzg1OTRjNDBiNDYiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6InR5cGVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC45MzVaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC45MzVaIn0seyJpZCI6Ijc3YTc1ODAzLTM3MmItNGMyZC04Y2QxLTM1OGE0OTZhOTA4ZCIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoiY2F0ZWdvcmllcyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjkuMDcxWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjkuMDcxWiJ9XSwiaWF0IjoxNzc3NTU5NzA5LCJleHAiOjE3Nzc2NDYxMDl9.ADvVsqAQGL0DifcV5U2gZOmqeb4RBwNmBzLHjfxhjeo	2026-05-01 14:35:09.869	2026-04-30 14:35:09.871
b8e1ddb5-780c-4419-bdbc-70d50ed98a13	2dc4de80-5323-4859-81f0-caf914fc5f60	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZGM0ZGU4MC01MzIzLTQ4NTktODFmMC1jYWY5MTRmYzVmNjAiLCJlbWFpbCI6Im5lcmFuY2hhcmEua3NyQGdtYWlsLmNvbSIsImZpcnN0TmFtZSI6Ik5lcmFuY2hhcmEiLCJsYXN0TmFtZSI6IkFkbWluIiwicm9sZSI6IkFkbWluIiwiaXNTeXN0ZW1BZG1pbiI6ZmFsc2UsIm9yZ2FuaXphdGlvbklkIjoiMzI4Mzk0OTAtYTdmNS00NzMwLWE3OGYtMDkyM2Y0OTRiZjQ3Iiwib3JnTmFtZSI6Im5lcmFuY2hhcmEiLCJwZXJtaXNzaW9ucyI6W3siaWQiOiI4ODg5NTZjZC1lYTUwLTQxZmMtOTQzOC02NmFiOWJlZjhhYWEiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6Im1vbnRobHktc3VtbWFyeSIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTA5WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTA5WiJ9LHsiaWQiOiI5NTFiOGMxMS1lODdjLTRhYjMtODBiMC01MmNmODYyYTI2MDciLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6InJvbGVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4xNzdaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4xNzdaIn0seyJpZCI6IjYxMjk2ZWUyLWQ5MmYtNGUxMy1hYjY2LTIxMTliNTM5M2RhMiIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoic2V0dGluZ3MiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUyLjIxMloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUyLjIxMloifSx7ImlkIjoiN2VmZjcwM2YtZDAzYS00ZWYzLWEwMmMtNjlhOGVmMjdiNGNhIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJkYXNoYm9hcmQiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUxLjg4NFoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI3LjYxNVoifSx7ImlkIjoiNWE5ODAyYTEtMjE3Ni00YzUyLWE1MmQtOGFiODNhNWY4M2RmIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJ1c2VycyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTQzWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjcuNzU2WiJ9LHsiaWQiOiI2MWYwZDk3Mi0zZjIyLTQyNTYtYjA5OS02NmEwNzBkZDQwNTMiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6InRyYW5zYWN0aW9ucyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTEuOTcxWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjcuODg2WiJ9LHsiaWQiOiI4MTM4MDZhZC1jOTNiLTQ3OGEtOWMxNC1kMzk2ZGZhMGQzNGEiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6ImxvYW4tdHJhY2tlciIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMDc1WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjguMjgxWiJ9LHsiaWQiOiJiNTJkYjlhMC0yZmEzLTQwYWQtOGYwOC05NjgzMDY1OGZjOTMiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6ImxpYWJpbGl0aWVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4wNDBaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC40MTNaIn0seyJpZCI6IjE5NmI1YjA4LWE2ZTQtNGU0Zi1iZWY5LTUwMzk1NWMzNTg4MCIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoiYXNzZXRzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4wMDZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC41NDJaIn0seyJpZCI6IjdlNDA1ZTkyLWM1ZDEtNGVlNC1hYjhiLWRhNjMzZTYyN2E0MyIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoicGVybWlzc2lvbnMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjAxOVoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjAxOVoifSx7ImlkIjoiZDkwZjg3MDctNDQxNy00MDFmLTkxMTMtOTg2ODBhOGFlYTkwIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJtb250aGx5IiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC4xNTFaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC4xNTFaIn0seyJpZCI6IjQ4MjYyOWRjLWU2NjktNGNhYS05MDlkLWY5ODY0MjY3Y2RhZCIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoiYWNjb3VudHMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjY3MVoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjY3MVoifSx7ImlkIjoiN2YyYTY0ZTQtMWQ4My00ZjA4LTlhNjItNzM2MmUxZTZjNDNmIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJiYW5rcyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjguODAyWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjguODAyWiJ9LHsiaWQiOiI3ZTdkMjYyNi01YmFlLTQ2ZjItOTVmMi1kMzg1OTRjNDBiNDYiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6InR5cGVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC45MzVaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC45MzVaIn0seyJpZCI6Ijc3YTc1ODAzLTM3MmItNGMyZC04Y2QxLTM1OGE0OTZhOTA4ZCIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoiY2F0ZWdvcmllcyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjkuMDcxWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjkuMDcxWiJ9XSwiaWF0IjoxNzc3NTYwMTQ2LCJleHAiOjE3Nzc2NDY1NDZ9.8vWIRIqJm_kWZss9NUfn2Lh5M9OH1nYB4WL5O4xcfSs	2026-05-01 14:42:26.02	2026-04-30 14:42:26.023
172ffb57-bd3c-464b-976a-ddd9c4935300	2dc4de80-5323-4859-81f0-caf914fc5f60	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZGM0ZGU4MC01MzIzLTQ4NTktODFmMC1jYWY5MTRmYzVmNjAiLCJlbWFpbCI6Im5lcmFuY2hhcmEua3NyQGdtYWlsLmNvbSIsImZpcnN0TmFtZSI6Ik5lcmFuY2hhcmEiLCJsYXN0TmFtZSI6IkFkbWluIiwicm9sZSI6IkFkbWluIiwiaXNTeXN0ZW1BZG1pbiI6ZmFsc2UsIm9yZ2FuaXphdGlvbklkIjoiMzI4Mzk0OTAtYTdmNS00NzMwLWE3OGYtMDkyM2Y0OTRiZjQ3Iiwib3JnTmFtZSI6Im5lcmFuY2hhcmEiLCJwZXJtaXNzaW9ucyI6W3siaWQiOiI4ODg5NTZjZC1lYTUwLTQxZmMtOTQzOC02NmFiOWJlZjhhYWEiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6Im1vbnRobHktc3VtbWFyeSIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTA5WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTA5WiJ9LHsiaWQiOiI5NTFiOGMxMS1lODdjLTRhYjMtODBiMC01MmNmODYyYTI2MDciLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6InJvbGVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4xNzdaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4xNzdaIn0seyJpZCI6IjYxMjk2ZWUyLWQ5MmYtNGUxMy1hYjY2LTIxMTliNTM5M2RhMiIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoic2V0dGluZ3MiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUyLjIxMloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUyLjIxMloifSx7ImlkIjoiN2VmZjcwM2YtZDAzYS00ZWYzLWEwMmMtNjlhOGVmMjdiNGNhIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJkYXNoYm9hcmQiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUxLjg4NFoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI3LjYxNVoifSx7ImlkIjoiNWE5ODAyYTEtMjE3Ni00YzUyLWE1MmQtOGFiODNhNWY4M2RmIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJ1c2VycyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTQzWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjcuNzU2WiJ9LHsiaWQiOiI2MWYwZDk3Mi0zZjIyLTQyNTYtYjA5OS02NmEwNzBkZDQwNTMiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6InRyYW5zYWN0aW9ucyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTEuOTcxWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjcuODg2WiJ9LHsiaWQiOiI4MTM4MDZhZC1jOTNiLTQ3OGEtOWMxNC1kMzk2ZGZhMGQzNGEiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6ImxvYW4tdHJhY2tlciIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMDc1WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjguMjgxWiJ9LHsiaWQiOiJiNTJkYjlhMC0yZmEzLTQwYWQtOGYwOC05NjgzMDY1OGZjOTMiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6ImxpYWJpbGl0aWVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4wNDBaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC40MTNaIn0seyJpZCI6IjE5NmI1YjA4LWE2ZTQtNGU0Zi1iZWY5LTUwMzk1NWMzNTg4MCIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoiYXNzZXRzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4wMDZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC41NDJaIn0seyJpZCI6IjdlNDA1ZTkyLWM1ZDEtNGVlNC1hYjhiLWRhNjMzZTYyN2E0MyIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoicGVybWlzc2lvbnMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjAxOVoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjAxOVoifSx7ImlkIjoiZDkwZjg3MDctNDQxNy00MDFmLTkxMTMtOTg2ODBhOGFlYTkwIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJtb250aGx5IiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC4xNTFaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC4xNTFaIn0seyJpZCI6IjQ4MjYyOWRjLWU2NjktNGNhYS05MDlkLWY5ODY0MjY3Y2RhZCIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoiYWNjb3VudHMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjY3MVoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjY3MVoifSx7ImlkIjoiN2YyYTY0ZTQtMWQ4My00ZjA4LTlhNjItNzM2MmUxZTZjNDNmIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJiYW5rcyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjguODAyWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjguODAyWiJ9LHsiaWQiOiI3ZTdkMjYyNi01YmFlLTQ2ZjItOTVmMi1kMzg1OTRjNDBiNDYiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6InR5cGVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC45MzVaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC45MzVaIn0seyJpZCI6Ijc3YTc1ODAzLTM3MmItNGMyZC04Y2QxLTM1OGE0OTZhOTA4ZCIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoiY2F0ZWdvcmllcyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjkuMDcxWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjkuMDcxWiJ9XSwiaWF0IjoxNzc3NTYzNDk0LCJleHAiOjE3Nzc2NDk4OTR9.1GDHVdJMxxtqNQqe60e9uqL11gHzdaNbrINrqNjH1ec	2026-05-01 15:38:14.915	2026-04-30 15:38:14.917
08c4a927-95e9-4377-8632-51e281c5eeca	2dc4de80-5323-4859-81f0-caf914fc5f60	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZGM0ZGU4MC01MzIzLTQ4NTktODFmMC1jYWY5MTRmYzVmNjAiLCJlbWFpbCI6Im5lcmFuY2hhcmEua3NyQGdtYWlsLmNvbSIsImZpcnN0TmFtZSI6Ik5lcmFuY2hhcmEiLCJsYXN0TmFtZSI6IkFkbWluIiwicm9sZSI6IkFkbWluIiwiaXNTeXN0ZW1BZG1pbiI6ZmFsc2UsIm9yZ2FuaXphdGlvbklkIjoiMzI4Mzk0OTAtYTdmNS00NzMwLWE3OGYtMDkyM2Y0OTRiZjQ3Iiwib3JnTmFtZSI6Im5lcmFuY2hhcmEiLCJwZXJtaXNzaW9ucyI6W3siaWQiOiI4ODg5NTZjZC1lYTUwLTQxZmMtOTQzOC02NmFiOWJlZjhhYWEiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6Im1vbnRobHktc3VtbWFyeSIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTA5WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTA5WiJ9LHsiaWQiOiI5NTFiOGMxMS1lODdjLTRhYjMtODBiMC01MmNmODYyYTI2MDciLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6InJvbGVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4xNzdaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4xNzdaIn0seyJpZCI6IjYxMjk2ZWUyLWQ5MmYtNGUxMy1hYjY2LTIxMTliNTM5M2RhMiIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoic2V0dGluZ3MiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUyLjIxMloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUyLjIxMloifSx7ImlkIjoiN2VmZjcwM2YtZDAzYS00ZWYzLWEwMmMtNjlhOGVmMjdiNGNhIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJkYXNoYm9hcmQiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUxLjg4NFoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI3LjYxNVoifSx7ImlkIjoiNWE5ODAyYTEtMjE3Ni00YzUyLWE1MmQtOGFiODNhNWY4M2RmIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJ1c2VycyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTQzWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjcuNzU2WiJ9LHsiaWQiOiI2MWYwZDk3Mi0zZjIyLTQyNTYtYjA5OS02NmEwNzBkZDQwNTMiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6InRyYW5zYWN0aW9ucyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTEuOTcxWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjcuODg2WiJ9LHsiaWQiOiI4MTM4MDZhZC1jOTNiLTQ3OGEtOWMxNC1kMzk2ZGZhMGQzNGEiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6ImxvYW4tdHJhY2tlciIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMDc1WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjguMjgxWiJ9LHsiaWQiOiJiNTJkYjlhMC0yZmEzLTQwYWQtOGYwOC05NjgzMDY1OGZjOTMiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6ImxpYWJpbGl0aWVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4wNDBaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC40MTNaIn0seyJpZCI6IjE5NmI1YjA4LWE2ZTQtNGU0Zi1iZWY5LTUwMzk1NWMzNTg4MCIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoiYXNzZXRzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4wMDZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC41NDJaIn0seyJpZCI6IjdlNDA1ZTkyLWM1ZDEtNGVlNC1hYjhiLWRhNjMzZTYyN2E0MyIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoicGVybWlzc2lvbnMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjAxOVoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjAxOVoifSx7ImlkIjoiZDkwZjg3MDctNDQxNy00MDFmLTkxMTMtOTg2ODBhOGFlYTkwIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJtb250aGx5IiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC4xNTFaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC4xNTFaIn0seyJpZCI6IjQ4MjYyOWRjLWU2NjktNGNhYS05MDlkLWY5ODY0MjY3Y2RhZCIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoiYWNjb3VudHMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjY3MVoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjY3MVoifSx7ImlkIjoiN2YyYTY0ZTQtMWQ4My00ZjA4LTlhNjItNzM2MmUxZTZjNDNmIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJiYW5rcyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjguODAyWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjguODAyWiJ9LHsiaWQiOiI3ZTdkMjYyNi01YmFlLTQ2ZjItOTVmMi1kMzg1OTRjNDBiNDYiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6InR5cGVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC45MzVaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC45MzVaIn0seyJpZCI6Ijc3YTc1ODAzLTM3MmItNGMyZC04Y2QxLTM1OGE0OTZhOTA4ZCIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoiY2F0ZWdvcmllcyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjkuMDcxWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjkuMDcxWiJ9XSwiaWF0IjoxNzc3NTYzODY1LCJleHAiOjE3Nzc2NTAyNjV9.EpTJih6VFOaxlJH2T3U6hUcKSfQET98iuzEoqp-dlzA	2026-05-01 15:44:25.659	2026-04-30 15:44:25.661
4a13b5a4-dddc-477d-8dc2-71b1e181ba5e	2dc4de80-5323-4859-81f0-caf914fc5f60	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZGM0ZGU4MC01MzIzLTQ4NTktODFmMC1jYWY5MTRmYzVmNjAiLCJlbWFpbCI6Im5lcmFuY2hhcmEua3NyQGdtYWlsLmNvbSIsImZpcnN0TmFtZSI6Ik5lcmFuY2hhcmEiLCJsYXN0TmFtZSI6IkFkbWluIiwicm9sZSI6IkFkbWluIiwiaXNTeXN0ZW1BZG1pbiI6ZmFsc2UsIm9yZ2FuaXphdGlvbklkIjoiMzI4Mzk0OTAtYTdmNS00NzMwLWE3OGYtMDkyM2Y0OTRiZjQ3Iiwib3JnTmFtZSI6Im5lcmFuY2hhcmEiLCJwZXJtaXNzaW9ucyI6W3siaWQiOiI4ODg5NTZjZC1lYTUwLTQxZmMtOTQzOC02NmFiOWJlZjhhYWEiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6Im1vbnRobHktc3VtbWFyeSIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTA5WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTA5WiJ9LHsiaWQiOiI5NTFiOGMxMS1lODdjLTRhYjMtODBiMC01MmNmODYyYTI2MDciLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6InJvbGVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4xNzdaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4xNzdaIn0seyJpZCI6IjYxMjk2ZWUyLWQ5MmYtNGUxMy1hYjY2LTIxMTliNTM5M2RhMiIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoic2V0dGluZ3MiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUyLjIxMloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUyLjIxMloifSx7ImlkIjoiN2VmZjcwM2YtZDAzYS00ZWYzLWEwMmMtNjlhOGVmMjdiNGNhIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJkYXNoYm9hcmQiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUxLjg4NFoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI3LjYxNVoifSx7ImlkIjoiNWE5ODAyYTEtMjE3Ni00YzUyLWE1MmQtOGFiODNhNWY4M2RmIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJ1c2VycyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTQzWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjcuNzU2WiJ9LHsiaWQiOiI2MWYwZDk3Mi0zZjIyLTQyNTYtYjA5OS02NmEwNzBkZDQwNTMiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6InRyYW5zYWN0aW9ucyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTEuOTcxWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjcuODg2WiJ9LHsiaWQiOiI4MTM4MDZhZC1jOTNiLTQ3OGEtOWMxNC1kMzk2ZGZhMGQzNGEiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6ImxvYW4tdHJhY2tlciIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMDc1WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjguMjgxWiJ9LHsiaWQiOiJiNTJkYjlhMC0yZmEzLTQwYWQtOGYwOC05NjgzMDY1OGZjOTMiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6ImxpYWJpbGl0aWVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4wNDBaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC40MTNaIn0seyJpZCI6IjE5NmI1YjA4LWE2ZTQtNGU0Zi1iZWY5LTUwMzk1NWMzNTg4MCIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoiYXNzZXRzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4wMDZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC41NDJaIn0seyJpZCI6IjdlNDA1ZTkyLWM1ZDEtNGVlNC1hYjhiLWRhNjMzZTYyN2E0MyIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoicGVybWlzc2lvbnMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjAxOVoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjAxOVoifSx7ImlkIjoiZDkwZjg3MDctNDQxNy00MDFmLTkxMTMtOTg2ODBhOGFlYTkwIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJtb250aGx5IiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC4xNTFaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC4xNTFaIn0seyJpZCI6IjQ4MjYyOWRjLWU2NjktNGNhYS05MDlkLWY5ODY0MjY3Y2RhZCIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoiYWNjb3VudHMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjY3MVoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjY3MVoifSx7ImlkIjoiN2YyYTY0ZTQtMWQ4My00ZjA4LTlhNjItNzM2MmUxZTZjNDNmIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJiYW5rcyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjguODAyWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjguODAyWiJ9LHsiaWQiOiI3ZTdkMjYyNi01YmFlLTQ2ZjItOTVmMi1kMzg1OTRjNDBiNDYiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6InR5cGVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC45MzVaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC45MzVaIn0seyJpZCI6Ijc3YTc1ODAzLTM3MmItNGMyZC04Y2QxLTM1OGE0OTZhOTA4ZCIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoiY2F0ZWdvcmllcyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjkuMDcxWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjkuMDcxWiJ9XSwiaWF0IjoxNzc3NTY2MjQ2LCJleHAiOjE3Nzc2NTI2NDZ9.kT5zONu5zMhON2VrM3NKOBqmgmgm4sPoqpDFPuJvLos	2026-05-01 16:24:06.304	2026-04-30 16:24:06.307
043124a6-3444-46aa-93b2-6020ba894c3f	2dc4de80-5323-4859-81f0-caf914fc5f60	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZGM0ZGU4MC01MzIzLTQ4NTktODFmMC1jYWY5MTRmYzVmNjAiLCJlbWFpbCI6Im5lcmFuY2hhcmEua3NyQGdtYWlsLmNvbSIsImZpcnN0TmFtZSI6Ik5lcmFuY2hhcmEiLCJsYXN0TmFtZSI6IkFkbWluIiwicm9sZSI6IkFkbWluIiwiaXNTeXN0ZW1BZG1pbiI6ZmFsc2UsIm9yZ2FuaXphdGlvbklkIjoiMzI4Mzk0OTAtYTdmNS00NzMwLWE3OGYtMDkyM2Y0OTRiZjQ3Iiwib3JnTmFtZSI6Im5lcmFuY2hhcmEiLCJwZXJtaXNzaW9ucyI6W3siaWQiOiI4ODg5NTZjZC1lYTUwLTQxZmMtOTQzOC02NmFiOWJlZjhhYWEiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6Im1vbnRobHktc3VtbWFyeSIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTA5WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTA5WiJ9LHsiaWQiOiI5NTFiOGMxMS1lODdjLTRhYjMtODBiMC01MmNmODYyYTI2MDciLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6InJvbGVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4xNzdaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4xNzdaIn0seyJpZCI6IjYxMjk2ZWUyLWQ5MmYtNGUxMy1hYjY2LTIxMTliNTM5M2RhMiIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoic2V0dGluZ3MiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUyLjIxMloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUyLjIxMloifSx7ImlkIjoiN2VmZjcwM2YtZDAzYS00ZWYzLWEwMmMtNjlhOGVmMjdiNGNhIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJkYXNoYm9hcmQiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUxLjg4NFoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI3LjYxNVoifSx7ImlkIjoiNWE5ODAyYTEtMjE3Ni00YzUyLWE1MmQtOGFiODNhNWY4M2RmIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJ1c2VycyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTQzWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjcuNzU2WiJ9LHsiaWQiOiI2MWYwZDk3Mi0zZjIyLTQyNTYtYjA5OS02NmEwNzBkZDQwNTMiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6InRyYW5zYWN0aW9ucyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTEuOTcxWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjcuODg2WiJ9LHsiaWQiOiI4MTM4MDZhZC1jOTNiLTQ3OGEtOWMxNC1kMzk2ZGZhMGQzNGEiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6ImxvYW4tdHJhY2tlciIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMDc1WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjguMjgxWiJ9LHsiaWQiOiJiNTJkYjlhMC0yZmEzLTQwYWQtOGYwOC05NjgzMDY1OGZjOTMiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6ImxpYWJpbGl0aWVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4wNDBaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC40MTNaIn0seyJpZCI6IjE5NmI1YjA4LWE2ZTQtNGU0Zi1iZWY5LTUwMzk1NWMzNTg4MCIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoiYXNzZXRzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4wMDZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC41NDJaIn0seyJpZCI6IjdlNDA1ZTkyLWM1ZDEtNGVlNC1hYjhiLWRhNjMzZTYyN2E0MyIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoicGVybWlzc2lvbnMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjAxOVoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjAxOVoifSx7ImlkIjoiZDkwZjg3MDctNDQxNy00MDFmLTkxMTMtOTg2ODBhOGFlYTkwIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJtb250aGx5IiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC4xNTFaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC4xNTFaIn0seyJpZCI6IjQ4MjYyOWRjLWU2NjktNGNhYS05MDlkLWY5ODY0MjY3Y2RhZCIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoiYWNjb3VudHMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjY3MVoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjY3MVoifSx7ImlkIjoiN2YyYTY0ZTQtMWQ4My00ZjA4LTlhNjItNzM2MmUxZTZjNDNmIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJiYW5rcyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjguODAyWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjguODAyWiJ9LHsiaWQiOiI3ZTdkMjYyNi01YmFlLTQ2ZjItOTVmMi1kMzg1OTRjNDBiNDYiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6InR5cGVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC45MzVaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC45MzVaIn0seyJpZCI6Ijc3YTc1ODAzLTM3MmItNGMyZC04Y2QxLTM1OGE0OTZhOTA4ZCIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoiY2F0ZWdvcmllcyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjkuMDcxWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjkuMDcxWiJ9XSwiaWF0IjoxNzc3NTY2ODIzLCJleHAiOjE3Nzc2NTMyMjN9.X4R8shVugKrernP5tpo1tX8MAtUenRI2ShMgZrWZyJI	2026-05-01 16:33:43.512	2026-04-30 16:33:43.513
e2112d99-49fb-4229-97ec-820e4d93ab4d	5fd22c63-a824-4b14-84ec-c588cf7ee27a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZmQyMmM2My1hODI0LTRiMTQtODRlYy1jNTg4Y2Y3ZWUyN2EiLCJlbWFpbCI6InN1cGVyYWRtaW5AbmV4d29ydGgub25saW5lIiwiZmlyc3ROYW1lIjoiU3lzdGVtIiwibGFzdE5hbWUiOiJBZG1pbiIsInJvbGUiOiJBZG1pbiIsImlzU3lzdGVtQWRtaW4iOnRydWUsIm9yZ2FuaXphdGlvbklkIjoiZWU4MWRmOWQtYmIxNC00MTliLWJkNDktZDRjNzdiNGQ0MjE0Iiwib3JnTmFtZSI6IlN5c3RlbSBNYW5hZ2VtZW50IiwicGVybWlzc2lvbnMiOlt7ImlkIjoiMzEzNmI2OTctNDk5ZC00MTlhLTg1ZDEtOWViYjFmMDA5NzcyIiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJsb2FuLXRyYWNrZXIiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjUyNloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTMwVDE2OjIxOjUwLjY2NFoifSx7ImlkIjoiZTkxNmY5ODItNmZkNi00ZGYyLWI4NTMtMWE1MjdhOTQyZThiIiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJsaWFiaWxpdGllcyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNTM2WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTY6MjE6NTAuNjcyWiJ9LHsiaWQiOiJiN2UyOGM3My1hMDFhLTQ0M2YtYjMxNy03YTllZGJjYzU5MWQiLCJyb2xlSWQiOiI3MGE4NjQzNi1jOTI4LTQ0Y2YtODBjOS0yZjdkZjg5ZGU0OTYiLCJyZXNvdXJjZSI6ImFzc2V0cyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNTQ2WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTY6MjE6NTAuNjgwWiJ9LHsiaWQiOiJlNjIwZDdlMy02ZTgzLTQxMmMtYjIxMi00YWZkMmY3MzZjMjgiLCJyb2xlSWQiOiI3MGE4NjQzNi1jOTI4LTQ0Y2YtODBjOS0yZjdkZjg5ZGU0OTYiLCJyZXNvdXJjZSI6ImFjY291bnRzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41NThaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxNjoyMTo1MC42ODhaIn0seyJpZCI6ImI5ZGNiMWIwLTliMGItNDYzZS04Y2Q2LTJlYTk4NDcyZDI2YiIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoiYmFua3MiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjU2N1oiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTMwVDE2OjIxOjUwLjY5NloifSx7ImlkIjoiMDkzNDM5YTEtYTM5OC00NWM4LTg3ZmUtMWZjNjkzZmE5YTViIiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJ0eXBlcyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNTc2WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTY6MjE6NTAuNzA0WiJ9LHsiaWQiOiJhZmJmNjU4Zi04NjFlLTQyYTktYWRjMi03NDZlYTM3NGI0YWEiLCJyb2xlSWQiOiI3MGE4NjQzNi1jOTI4LTQ0Y2YtODBjOS0yZjdkZjg5ZGU0OTYiLCJyZXNvdXJjZSI6ImNhdGVnb3JpZXMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjU4NloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTMwVDE2OjIxOjUwLjcxMloifSx7ImlkIjoiZDg0ODA0Y2QtYWUwOS00OTBhLTk0YTktNGY3YzY0ZWRmOWM4Iiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJkYXNoYm9hcmQiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI0VDExOjQ0OjM4LjQ3MloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTMwVDE2OjIxOjUwLjYxOVoifSx7ImlkIjoiMzU1N2ZmNmUtNDE0Yi00Mjc4LWEzYzYtZDZlNTQzYTBiYjQyIiwicm9sZUlkIjoiNzBhODY0MzYtYzkyOC00NGNmLTgwYzktMmY3ZGY4OWRlNDk2IiwicmVzb3VyY2UiOiJ1c2VycyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNDg2WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTY6MjE6NTAuNjMwWiJ9LHsiaWQiOiI1NDcwNDM0OS04ODk3LTQ3YmUtODgxMi0xN2I1Mjg1M2Q5ZjciLCJyb2xlSWQiOiI3MGE4NjQzNi1jOTI4LTQ0Y2YtODBjOS0yZjdkZjg5ZGU0OTYiLCJyZXNvdXJjZSI6InRyYW5zYWN0aW9ucyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNDk2WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTY6MjE6NTAuNjM4WiJ9LHsiaWQiOiJhZjYyMjNjMS02NWNjLTQ1NDAtOTc3Yy1hNDNlOTY1NDdlNDMiLCJyb2xlSWQiOiI3MGE4NjQzNi1jOTI4LTQ0Y2YtODBjOS0yZjdkZjg5ZGU0OTYiLCJyZXNvdXJjZSI6InBlcm1pc3Npb25zIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNFQxMTo0NDozOC41MDZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxNjoyMTo1MC42NDhaIn0seyJpZCI6IjlhNWFkN2I1LTUzN2EtNGI5OC1hZGZiLTFiNGE0ODUzNDU4YSIsInJvbGVJZCI6IjcwYTg2NDM2LWM5MjgtNDRjZi04MGM5LTJmN2RmODlkZTQ5NiIsInJlc291cmNlIjoibW9udGhseSIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjRUMTE6NDQ6MzguNTE2WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTY6MjE6NTAuNjU2WiJ9XSwiaWF0IjoxNzc3NTY5ODkzLCJleHAiOjE3Nzc2NTYyOTN9.0j9y5-22tAPkV4ePa_NB2k7zNnzNXJeQY5rq-PNeX3M	2026-05-01 17:24:53.314	2026-04-30 17:24:53.316
44386272-e05c-4fb3-adb3-43cdff578ab3	2dc4de80-5323-4859-81f0-caf914fc5f60	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZGM0ZGU4MC01MzIzLTQ4NTktODFmMC1jYWY5MTRmYzVmNjAiLCJlbWFpbCI6Im5lcmFuY2hhcmEua3NyQGdtYWlsLmNvbSIsImZpcnN0TmFtZSI6Ik5lcmFuY2hhcmEiLCJsYXN0TmFtZSI6IkFkbWluIiwicm9sZSI6IkFkbWluIiwiaXNTeXN0ZW1BZG1pbiI6ZmFsc2UsIm9yZ2FuaXphdGlvbklkIjoiMzI4Mzk0OTAtYTdmNS00NzMwLWE3OGYtMDkyM2Y0OTRiZjQ3Iiwib3JnTmFtZSI6Im5lcmFuY2hhcmEiLCJwZXJtaXNzaW9ucyI6W3siaWQiOiI4ODg5NTZjZC1lYTUwLTQxZmMtOTQzOC02NmFiOWJlZjhhYWEiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6Im1vbnRobHktc3VtbWFyeSIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTA5WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTA5WiJ9LHsiaWQiOiI5NTFiOGMxMS1lODdjLTRhYjMtODBiMC01MmNmODYyYTI2MDciLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6InJvbGVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4xNzdaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4xNzdaIn0seyJpZCI6IjYxMjk2ZWUyLWQ5MmYtNGUxMy1hYjY2LTIxMTliNTM5M2RhMiIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoic2V0dGluZ3MiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUyLjIxMloiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUyLjIxMloifSx7ImlkIjoiN2VmZjcwM2YtZDAzYS00ZWYzLWEwMmMtNjlhOGVmMjdiNGNhIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJkYXNoYm9hcmQiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTI1VDE5OjA4OjUxLjg4NFoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI3LjYxNVoifSx7ImlkIjoiNWE5ODAyYTEtMjE3Ni00YzUyLWE1MmQtOGFiODNhNWY4M2RmIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJ1c2VycyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMTQzWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjcuNzU2WiJ9LHsiaWQiOiI2MWYwZDk3Mi0zZjIyLTQyNTYtYjA5OS02NmEwNzBkZDQwNTMiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6InRyYW5zYWN0aW9ucyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTEuOTcxWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjcuODg2WiJ9LHsiaWQiOiI4MTM4MDZhZC1jOTNiLTQ3OGEtOWMxNC1kMzk2ZGZhMGQzNGEiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6ImxvYW4tdHJhY2tlciIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMjVUMTk6MDg6NTIuMDc1WiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjguMjgxWiJ9LHsiaWQiOiJiNTJkYjlhMC0yZmEzLTQwYWQtOGYwOC05NjgzMDY1OGZjOTMiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6ImxpYWJpbGl0aWVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4wNDBaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC40MTNaIn0seyJpZCI6IjE5NmI1YjA4LWE2ZTQtNGU0Zi1iZWY5LTUwMzk1NWMzNTg4MCIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoiYXNzZXRzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0yNVQxOTowODo1Mi4wMDZaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC41NDJaIn0seyJpZCI6IjdlNDA1ZTkyLWM1ZDEtNGVlNC1hYjhiLWRhNjMzZTYyN2E0MyIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoicGVybWlzc2lvbnMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjAxOVoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjAxOVoifSx7ImlkIjoiZDkwZjg3MDctNDQxNy00MDFmLTkxMTMtOTg2ODBhOGFlYTkwIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJtb250aGx5IiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC4xNTFaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC4xNTFaIn0seyJpZCI6IjQ4MjYyOWRjLWU2NjktNGNhYS05MDlkLWY5ODY0MjY3Y2RhZCIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoiYWNjb3VudHMiLCJjYW5WaWV3Ijp0cnVlLCJjYW5DcmVhdGUiOnRydWUsImNhblVwZGF0ZSI6dHJ1ZSwiY2FuRGVsZXRlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjY3MVoiLCJ1cGRhdGVkQXQiOiIyMDI2LTA0LTMwVDEzOjA1OjI4LjY3MVoifSx7ImlkIjoiN2YyYTY0ZTQtMWQ4My00ZjA4LTlhNjItNzM2MmUxZTZjNDNmIiwicm9sZUlkIjoiMWM5YWZkOTMtN2VlZS00YWFmLWEwNGYtMGQ3ZDMzZDMyYmMzIiwicmVzb3VyY2UiOiJiYW5rcyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjguODAyWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjguODAyWiJ9LHsiaWQiOiI3ZTdkMjYyNi01YmFlLTQ2ZjItOTVmMi1kMzg1OTRjNDBiNDYiLCJyb2xlSWQiOiIxYzlhZmQ5My03ZWVlLTRhYWYtYTA0Zi0wZDdkMzNkMzJiYzMiLCJyZXNvdXJjZSI6InR5cGVzIiwiY2FuVmlldyI6dHJ1ZSwiY2FuQ3JlYXRlIjp0cnVlLCJjYW5VcGRhdGUiOnRydWUsImNhbkRlbGV0ZSI6dHJ1ZSwiY3JlYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC45MzVaIiwidXBkYXRlZEF0IjoiMjAyNi0wNC0zMFQxMzowNToyOC45MzVaIn0seyJpZCI6Ijc3YTc1ODAzLTM3MmItNGMyZC04Y2QxLTM1OGE0OTZhOTA4ZCIsInJvbGVJZCI6IjFjOWFmZDkzLTdlZWUtNGFhZi1hMDRmLTBkN2QzM2QzMmJjMyIsInJlc291cmNlIjoiY2F0ZWdvcmllcyIsImNhblZpZXciOnRydWUsImNhbkNyZWF0ZSI6dHJ1ZSwiY2FuVXBkYXRlIjp0cnVlLCJjYW5EZWxldGUiOnRydWUsImNyZWF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjkuMDcxWiIsInVwZGF0ZWRBdCI6IjIwMjYtMDQtMzBUMTM6MDU6MjkuMDcxWiJ9XSwiaWF0IjoxNzc3NTc0NTE4LCJleHAiOjE3Nzc2NjA5MTh9.FKDX6G4fLBkMDLS591ce1U2rd46Te7tWQP8sCGXjcgw	2026-05-01 18:41:58.793	2026-04-30 18:41:58.795
\.


--
-- Data for Name: Transaction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Transaction" (id, "organizationId", "userId", "accountId", "categoryId", "typeId", amount, description, date, note, "loanId", "createdAt", "updatedAt", "actualDate", "assetId", "liabilityId", "linkedTransactionId", direction) FROM stdin;
5106c960-a4c8-4e56-b99b-7c68ab9336ad	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	0c8a91f9-4fce-4356-9bb5-4b38484f498e	50eef538-7008-4732-a6b3-8039b36305c6	1400	Cloud Pocket ทำบุญ	2026-03-28 00:00:00		\N	2026-04-22 16:58:21.564	2026-04-30 16:44:51.225	2026-03-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	5c6e7651-53a5-41d0-bd5c-caf8eac2ba31	FROM
b96372bd-324e-448e-898c-d134fd90d362	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	e7133872-dedf-4e1b-a915-3b1458266906	85ae760d-31e6-444c-b392-431fa86ff590	5f1440e5-4ecc-484c-a3ec-b82a47fd8c6d	3000	Cloud Pocket TSMC	2026-03-28 00:00:00	\N	\N	2026-04-22 17:24:55.866	2026-04-30 16:44:38.372	2026-03-28 00:00:00	45517d10-82f6-4930-a07f-ae756c314bb4	\N	d3d7fd73-d1f5-48e1-a874-2106eb3de842	TO
9553ab62-6279-454a-99a6-b1916a6c8082	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	568b2711-bec4-4793-b606-14e4c3a08817	15bb00ee-0c3d-42a2-afb6-b8c9e4423e33	37102991-baf1-4f98-8608-0d57f260ccce	1000	Cloud Pocket ค่าใช้จ่ายรถ	2026-03-28 00:00:00	\N	\N	2026-04-22 17:24:55.903	2026-04-30 16:45:16.663	2026-03-28 00:00:00	a6d588d1-2a65-46fd-94c1-405762083521	\N	52c8ad1c-c3fd-4595-8c91-2a4bde748879	TO
5c6e7651-53a5-41d0-bd5c-caf8eac2ba31	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	1a18f846-019f-4f24-82b5-305fa809cccd	d709a0ba-8a12-4e99-bf5b-84f5372b4fcc	37102991-baf1-4f98-8608-0d57f260ccce	1400	Cloud Pocket ทำบุญ	2026-03-28 00:00:00	\N	\N	2026-04-22 17:24:55.883	2026-04-30 16:44:51.254	2026-03-28 00:00:00	51b4fd2e-84b8-4f14-b4b0-e5b3ee217e28	\N	5106c960-a4c8-4e56-b99b-7c68ab9336ad	TO
f570358f-fbba-414e-aab8-3b3790ca2ac1	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	d5c5f882-4edd-4f49-8e88-677bd1a1f9cb	85ae760d-31e6-444c-b392-431fa86ff590	5f1440e5-4ecc-484c-a3ec-b82a47fd8c6d	3000	ย้ายไป DIME	2026-04-11 00:00:00	\N	\N	2026-04-22 17:24:55.889	2026-04-30 16:48:05.154	2026-04-01 00:00:00	bab7389e-b573-4e02-ba66-45129c9a3bdf	\N	1d399ae3-a586-4fde-b0e0-52dd482b5b38	TO
99f90c28-22ac-4caa-9e67-406739403c06	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	7c0133d0-7a90-47a8-bd7e-ab071cfca1c8	93ad5045-adae-41d9-8202-d0f3ec20a0f3	5f1440e5-4ecc-484c-a3ec-b82a47fd8c6d	100000	มดสร้างบ้าน	2025-04-01 00:00:00		\N	2026-03-25 11:22:57.537	2026-04-30 16:49:40.437	2025-04-01 00:00:00	573e41d0-b3a7-4c53-a9c0-715d99ee592d	\N	349bd4a4-f1a7-4c4e-aed1-58fe38017843	TO
b2999fa5-004c-4076-8081-8487dd4b7ad4	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	9b4cb30c-3f41-45ce-8e24-6e4423e1095c	85ae760d-31e6-444c-b392-431fa86ff590	5f1440e5-4ecc-484c-a3ec-b82a47fd8c6d	2000	Cloud Pocket ASML	2026-03-28 00:00:00	\N	\N	2026-04-22 17:24:55.895	2026-04-30 16:45:59.775	2026-03-28 00:00:00	15c79449-ff47-4f84-9e31-cfdb66be744e	\N	b70d2ae4-828b-46a3-915d-a9422076d5de	TO
93bf313d-97b0-4a4d-abd2-bbe932630b50	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bf76aa0f-db8a-4062-ba12-aaae5f06a479	7e99a6eb-1877-400a-b2d3-a9c451c4ba2a	37102991-baf1-4f98-8608-0d57f260ccce	210000	ออมสิน บัญชีเงินซื้อรถ	2026-03-28 00:00:00	\N	\N	2026-04-22 17:24:55.906	2026-04-30 16:46:11.451	2026-03-28 00:00:00	24b40ac2-72f3-4b53-98c6-8d13790c4bd9	\N	20a953d4-d04a-4b69-bdd1-748da98d1fa4	TO
3533656b-a991-4979-9aa7-de814ac74d57	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	d5c5f882-4edd-4f49-8e88-677bd1a1f9cb	85ae760d-31e6-444c-b392-431fa86ff590	5f1440e5-4ecc-484c-a3ec-b82a47fd8c6d	3000	ย้ายไป DIME	2026-04-11 00:00:00	\N	\N	2026-04-22 17:24:55.886	2026-04-30 16:47:56.141	2026-04-01 00:00:00	bab7389e-b573-4e02-ba66-45129c9a3bdf	\N	32c1fc59-75da-4c59-a2a7-4c30774bad3d	TO
6be48a0a-9388-4cb1-bfd9-d8bcb0e22d87	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	850cb1a3-c642-4882-a3a6-2d047ccac110	64f06cc6-7a38-4b01-9e91-dfff28f5dc9c	5f1440e5-4ecc-484c-a3ec-b82a47fd8c6d	1000	Cloud Pocket ออมทอง	2026-03-28 00:00:00	\N	\N	2026-04-22 17:24:55.898	2026-04-30 16:46:53.646	2026-03-28 00:00:00	d273de1a-b925-4546-9835-135de8f46716	\N	b4150d78-f25c-457a-a290-0fdd3f75bdcf	TO
8641799d-aeb5-48e8-bf42-5f605321f6d5	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	de15062e-86de-4572-90bb-2a8b68448b4a	50eef538-7008-4732-a6b3-8039b36305c6	7000	เงินเดือนแม่บัญชีออมสิน	2026-01-28 00:00:00		\N	2026-03-25 11:13:26.973	2026-04-30 14:25:36.967	2026-01-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	fab7d9e1-5ed3-4691-9dd0-32104fee8549	FROM
cf1ade7a-9d68-47be-8211-ad3a9850f551	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	81a7bd00-a24a-466f-9301-5d7ac0ac1ed4	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	58633	เงินเดือน	2026-01-28 00:00:00	\N	\N	2026-03-25 11:13:26.926	2026-04-30 14:25:36.477	2026-01-28 00:00:00	\N	\N	\N	TO
4ea4f622-aee7-4f6f-8e4d-3870173d0ca6	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	de15062e-86de-4572-90bb-2a8b68448b4a	50eef538-7008-4732-a6b3-8039b36305c6	5000	เงินเดือนแม่ กรุงไทย	2026-01-28 00:00:00		\N	2026-04-22 17:53:44.226	2026-04-30 14:25:37.037	2026-01-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	81417741-8645-4be0-a688-e65b4f5e9d03	FROM
d3d7fd73-d1f5-48e1-a874-2106eb3de842	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	0c8a91f9-4fce-4356-9bb5-4b38484f498e	50eef538-7008-4732-a6b3-8039b36305c6	3000	Cloud Pocket TSMC	2026-03-28 00:00:00		\N	2026-04-22 16:33:32.285	2026-04-30 16:44:38.334	2026-03-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	b96372bd-324e-448e-898c-d134fd90d362	FROM
bcb3a4a9-efc3-409d-9156-45736e22e770	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	d1450fd3-8880-4dff-90c8-d606ffc206fc	dd3f9c0d-6554-4895-a57f-387acf6fe4f5	4300	UOB	2026-01-28 00:00:00		\N	2026-03-25 11:13:26.976	2026-04-30 14:25:37.105	2026-01-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	bd7ba956-0e68-4bdc-8213-865506638898	FROM
1b849d83-98bf-4750-ae8a-50b715813a69	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	0c8a91f9-4fce-4356-9bb5-4b38484f498e	50eef538-7008-4732-a6b3-8039b36305c6	2000	คืนเงินบัญชีครอบครัว (ออมสิน 020125686467)	2026-01-28 00:00:00		\N	2026-04-22 17:30:59.458	2026-04-30 16:35:42.94	2026-01-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	b28fe561-85a5-4186-9851-1d3de4d0db5e	FROM
90facc53-544e-4466-9fec-83ec08f7a702	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	81a7bd00-a24a-466f-9301-5d7ac0ac1ed4	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	58633	เงินเดือน	2026-02-28 00:00:00	\N	\N	2026-03-25 12:18:45.674	2026-04-30 14:25:36.548	2026-02-28 00:00:00	\N	\N	\N	TO
0fbec5d5-977f-4e97-b128-dbca53a29d95	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	8557fae0-d2a7-439e-ba8b-3f5465423542	48faa8c5-2561-428a-a8a8-ce3e456e7f1c	37102991-baf1-4f98-8608-0d57f260ccce	500	Cloud Pocket เที่ยว	2026-03-28 00:00:00	\N	\N	2026-04-22 17:24:55.892	2026-04-30 16:45:51.306	2026-03-28 00:00:00	7a6855f6-0008-417b-a5df-d5d279802489	\N	7fb62902-868b-483f-b2e2-af10455ced09	TO
895b5ca3-079c-4ed0-8e24-858c9695d580	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	dde45f0a-23a1-4c53-bc03-5a907ef5f406	2f1955b9-333d-4ced-96ec-e33cfdbb9f5d	abaaab5b-cbd5-488b-b8a2-c6f9f2270203	1000	บัญชีออมสินแม่ (ออมสิน)	2026-02-28 00:00:00		\N	2026-03-25 12:18:45.71	2026-04-30 14:25:37.392	2026-02-28 00:00:00	f428d88f-9a22-4d84-b159-db6ce64fb7fc	\N	54e5b063-f469-42f8-bd7c-b839b56f7174	FROM
77188af0-710d-4782-8407-958b3f6b8200	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	0c8a91f9-4fce-4356-9bb5-4b38484f498e	50eef538-7008-4732-a6b3-8039b36305c6	15000	บัญชีเงินซื้อรถ (ออมสิน)	2026-02-28 00:00:00		\N	2026-04-22 17:54:57.539	2026-04-30 14:25:37.462	2026-02-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	d5870f36-4114-4961-b0ed-bbc322afe8e6	FROM
da93df72-143e-4782-b383-d08aec587210	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	de15062e-86de-4572-90bb-2a8b68448b4a	50eef538-7008-4732-a6b3-8039b36305c6	7000	เงินเดือนแม่บัญชีออมสิน	2026-02-28 00:00:00		\N	2026-03-25 12:18:45.716	2026-04-30 14:25:37.499	2026-02-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	2f0c857b-8396-49e6-a872-34454970a3a2	FROM
aac726e7-6263-4971-a2be-d1d2fd124beb	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	92e80bf4-bdb1-47f2-9795-4a5284bb5c98	e0309b7f-8890-4cff-a3c1-c24058ed9b05	2224	ยืมเงิน: ภาษี	2026-02-21 00:00:00	Auto-backfilled from Loan record L003	39a4917c-c589-446a-a84f-fe5bf7a42680	2026-03-25 14:01:14.627	2026-04-30 16:38:18.354	2026-02-21 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N	\N	FROM
a4ebbba4-54bd-4cba-9dcd-c7e1971e8e8f	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	994f27ad-e4b9-4c56-85a0-5286df799ac4	50eef538-7008-4732-a6b3-8039b36305c6	10000	ค่าใช้จ่ายรายเดือน 3	2026-03-28 00:00:00		\N	2026-03-28 12:21:41.274	2026-04-30 14:25:37.602	2026-03-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	f97106ec-e35e-479c-8fdd-992c81be7690	FROM
7030f4e1-ba62-4891-8d39-ef27ff3c0cac	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	92e80bf4-bdb1-47f2-9795-4a5284bb5c98	e0309b7f-8890-4cff-a3c1-c24058ed9b05	2000	ยืมเงิน: วันเกิดแม่	2026-02-04 00:00:00	Auto-backfilled from Loan record L004	45c7d2cf-cd62-4f83-8883-d8696ec26187	2026-03-25 14:01:14.63	2026-04-30 14:48:27.159	2026-02-04 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N	\N	FROM
11522427-5ff0-4e63-af26-3da6f16c9a51	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	d1450fd3-8880-4dff-90c8-d606ffc206fc	dd3f9c0d-6554-4895-a57f-387acf6fe4f5	4000	UOB	2026-02-28 00:00:00		\N	2026-03-25 12:18:45.723	2026-04-30 16:38:09.468	2026-02-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	701be571-886b-468e-9c7c-f883f6a7fbd4	FROM
f5538e4d-7879-4a89-8e0a-87c948ddc8e7	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	de15062e-86de-4572-90bb-2a8b68448b4a	50eef538-7008-4732-a6b3-8039b36305c6	12700	ซื้อของเข้าบ้านให้แม่	2026-02-28 00:00:00		\N	2026-03-25 12:18:45.719	2026-04-30 14:25:37.139	2026-02-28 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N	\N	FROM
6492207b-7dba-45ef-8b65-59d77b39c073	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	0c8a91f9-4fce-4356-9bb5-4b38484f498e	50eef538-7008-4732-a6b3-8039b36305c6	1000	ออมเงินสด (ออมสิน 020125686467)	2026-01-28 00:00:00		\N	2026-04-22 17:31:38.855	2026-04-30 16:36:01.291	2026-01-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	4596ec39-cf78-4274-901a-f8441b25b733	FROM
7ef70b51-0c1b-46db-9f94-2024ef8d2d5d	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	15ae3505-3233-44a4-a0ba-d6c776567cc2	50eef538-7008-4732-a6b3-8039b36305c6	2670.72	ค่าโทรศัพท์ + ค่า Internet บ้าน	2026-02-28 00:00:00	\N	\N	2026-03-25 12:18:45.726	2026-04-30 14:25:37.173	2026-02-28 00:00:00	\N	\N	\N	FROM
b73ea4a9-868d-461f-afc4-0e212f5caf23	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	92e80bf4-bdb1-47f2-9795-4a5284bb5c98	e0309b7f-8890-4cff-a3c1-c24058ed9b05	1000	ยืมเงิน: ยืม	2026-03-20 00:00:00	Auto-backfilled from Loan record L008	85222b31-c36e-409c-a71b-cfc2d6a53042	2026-03-25 14:01:14.639	2026-04-30 14:48:27.196	2026-03-20 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N	\N	FROM
6911659e-1060-4404-af37-bc388d19ae2a	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	de15062e-86de-4572-90bb-2a8b68448b4a	50eef538-7008-4732-a6b3-8039b36305c6	5000	เงินเดือนแม่บัญชีกรุงไทย	2026-02-28 00:00:00		\N	2026-03-25 12:18:45.713	2026-04-30 16:38:37.67	2026-02-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	16c64de9-5005-469a-98c5-d3d68978e9f6	FROM
2b76fdae-e933-46b4-91e1-ae7800faf16b	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	15ae3505-3233-44a4-a0ba-d6c776567cc2	50eef538-7008-4732-a6b3-8039b36305c6	650	ค่าน้ำดื่ม	2026-02-28 00:00:00	\N	\N	2026-03-25 12:18:45.739	2026-04-30 14:25:37.284	2026-02-28 00:00:00	\N	\N	\N	FROM
54e5b063-f469-42f8-bd7c-b839b56f7174	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	0c8a91f9-4fce-4356-9bb5-4b38484f498e	50eef538-7008-4732-a6b3-8039b36305c6	1000	บัญชีออมสินแม่ (ออมสิน)	2026-02-28 00:00:00		\N	2026-04-22 17:54:48.805	2026-04-30 14:25:37.356	2026-02-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	895b5ca3-079c-4ed0-8e24-858c9695d580	FROM
2f0c857b-8396-49e6-a872-34454970a3a2	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	e118748e-8fe5-4c36-a119-6555f6af4160	81142bbd-265d-4775-ae55-df4ea295fe4d	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	7000	เงินเดือนแม่บัญชีออมสิน	2026-02-28 00:00:00		\N	2026-04-22 17:57:33.826	2026-04-30 14:25:38.309	2026-02-28 00:00:00	dc93307c-9918-470d-87d6-626c4df2f43b	\N	da93df72-143e-4782-b383-d08aec587210	TO
d5870f36-4114-4961-b0ed-bbc322afe8e6	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bf76aa0f-db8a-4062-ba12-aaae5f06a479	7e99a6eb-1877-400a-b2d3-a9c451c4ba2a	37102991-baf1-4f98-8608-0d57f260ccce	15000	บัญชีเงินซื้อรถ (ออมสิน)	2026-02-28 00:00:00		\N	2026-03-25 12:18:45.696	2026-04-30 14:25:38.343	2026-02-28 00:00:00	24b40ac2-72f3-4b53-98c6-8d13790c4bd9	\N	77188af0-710d-4782-8407-958b3f6b8200	FROM
552f0ba3-7f5a-4b8b-a1a4-695f4b70972e	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	15ae3505-3233-44a4-a0ba-d6c776567cc2	50eef538-7008-4732-a6b3-8039b36305c6	3000	ค่าเช่าบ้าน+ค่าน้ำ+ค่าไฟ	2026-03-28 00:00:00		\N	2026-03-28 12:21:41.252	2026-04-30 14:25:38.379	2026-03-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	9cca4843-0144-44b0-b6ef-ff7602568b90	FROM
189d588b-558f-4385-af73-bbf029889397	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	92e80bf4-bdb1-47f2-9795-4a5284bb5c98	e0309b7f-8890-4cff-a3c1-c24058ed9b05	1000	ยืมเงิน: ยืม	2026-03-24 00:00:00	Auto-backfilled from Loan record L010	bebe1ff5-92b0-4650-96ea-ba6a4c142c50	2026-03-25 14:01:14.643	2026-04-30 14:48:27.312	2026-03-24 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N	\N	FROM
262eb92a-78f6-43cb-815b-df5ea4777595	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	92e80bf4-bdb1-47f2-9795-4a5284bb5c98	e0309b7f-8890-4cff-a3c1-c24058ed9b05	12700	ยืมเงิน: ซื้อของแม่	2026-02-03 00:00:00	Auto-backfilled from Loan record L005	4b967a70-2733-42ca-89ab-8fb17fc1c363	2026-03-25 14:01:14.632	2026-04-30 14:48:27.348	2026-02-03 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N	\N	FROM
ff2484ba-543c-40ad-9559-5506a3ec7ef9	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	15ae3505-3233-44a4-a0ba-d6c776567cc2	50eef538-7008-4732-a6b3-8039b36305c6	1683	ภาษี	2026-01-28 00:00:00	\N	\N	2026-03-25 11:13:26.943	2026-04-30 14:25:37.777	2026-01-28 00:00:00	\N	\N	\N	FROM
769b1987-ba74-486e-a9be-f69d03a83ee0	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	15ae3505-3233-44a4-a0ba-d6c776567cc2	50eef538-7008-4732-a6b3-8039b36305c6	2670.72	ค่าโทรศัพท์ + ค่า Internet บ้าน	2026-01-28 00:00:00	\N	\N	2026-03-25 11:13:26.98	2026-04-30 14:25:37.811	2026-01-28 00:00:00	\N	\N	\N	FROM
0d5c4ab1-8a36-4547-9e13-e720d17eede2	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	92e80bf4-bdb1-47f2-9795-4a5284bb5c98	e0309b7f-8890-4cff-a3c1-c24058ed9b05	3000	ยืมเงิน: ยืม	2026-03-15 00:00:00	Auto-backfilled from Loan record L006	a6695f95-48a0-4cb4-9c04-878c9a6236f6	2026-03-25 14:01:14.634	2026-04-30 14:48:27.383	2026-03-15 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N	\N	FROM
4589e223-d640-477e-be8d-e5ddadc1b492	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	92e80bf4-bdb1-47f2-9795-4a5284bb5c98	e0309b7f-8890-4cff-a3c1-c24058ed9b05	1000	ยืมเงิน: ยืม	2026-03-19 00:00:00	Auto-backfilled from Loan record L007	a2bc9399-3298-458c-a582-bdd9c587ae6e	2026-03-25 14:01:14.636	2026-04-30 14:48:27.419	2026-03-19 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N	\N	FROM
7ba0d30b-4fbe-4bc1-93b4-2cb64193b8be	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	92e80bf4-bdb1-47f2-9795-4a5284bb5c98	e0309b7f-8890-4cff-a3c1-c24058ed9b05	1500	ยืมเงิน: ซ่อมจานดาวเทียม	2026-03-23 00:00:00	Auto-backfilled from Loan record L009	7663b24e-385e-4682-a12f-6471b55343c9	2026-03-25 14:01:14.641	2026-04-30 14:48:27.27	2026-03-23 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N	\N	FROM
a23ff250-01ea-43e0-bd08-1ae8552156ac	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	15ae3505-3233-44a4-a0ba-d6c776567cc2	50eef538-7008-4732-a6b3-8039b36305c6	875	ประกันสังคม	2026-01-28 00:00:00	\N	\N	2026-03-25 11:13:26.94	2026-04-30 14:25:37.982	2026-01-28 00:00:00	\N	\N	\N	FROM
e14fdecb-2e4e-4589-9a30-4fe3d712df1c	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	15ae3505-3233-44a4-a0ba-d6c776567cc2	50eef538-7008-4732-a6b3-8039b36305c6	650	ค่าน้ำดื่ม	2026-03-28 00:00:00	\N	\N	2026-03-28 12:21:41.262	2026-04-30 14:25:38.016	2026-03-28 00:00:00	\N	\N	\N	FROM
8938e9ac-fc7e-46c4-9a44-fc3fd11de221	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	789d64f0-7782-4c66-a2de-dbac6ea77fee	50eef538-7008-4732-a6b3-8039b36305c6	500	ค่าไฟวัดกุดขอนแก่น	2026-03-28 00:00:00	\N	\N	2026-03-28 12:21:41.267	2026-04-30 14:25:38.05	2026-03-28 00:00:00	\N	\N	\N	FROM
feed66ef-07c5-4528-bd62-7b9bc15e9c56	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	15ae3505-3233-44a4-a0ba-d6c776567cc2	50eef538-7008-4732-a6b3-8039b36305c6	650	ค่าน้ำดื่ม	2026-01-28 00:00:00	\N	\N	2026-03-25 11:13:26.99	2026-04-30 14:25:38.093	2026-01-28 00:00:00	\N	\N	\N	FROM
c3e4b737-5e14-4ce2-aadc-9b8a8e1323ec	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	789d64f0-7782-4c66-a2de-dbac6ea77fee	50eef538-7008-4732-a6b3-8039b36305c6	500	ค่าไฟวัดกุดขอนแก่น	2026-01-28 00:00:00	\N	\N	2026-03-25 11:13:26.994	2026-04-30 14:25:38.135	2026-01-28 00:00:00	\N	\N	\N	FROM
ecdc3e35-ce1f-4392-a58b-e7042d6fc572	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	15ae3505-3233-44a4-a0ba-d6c776567cc2	50eef538-7008-4732-a6b3-8039b36305c6	875	ประกันสังคม	2026-02-28 00:00:00	\N	\N	2026-03-25 12:18:45.679	2026-04-30 14:25:38.17	2026-02-28 00:00:00	\N	\N	\N	FROM
09f04f16-e1bd-42f5-a847-0561b24bfd81	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	15ae3505-3233-44a4-a0ba-d6c776567cc2	50eef538-7008-4732-a6b3-8039b36305c6	1683	ภาษี	2026-02-28 00:00:00	\N	\N	2026-03-25 12:18:45.682	2026-04-30 14:25:38.204	2026-02-28 00:00:00	\N	\N	\N	FROM
17d52fdf-78a4-4084-ae2c-6d1f2fc1aae2	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	789d64f0-7782-4c66-a2de-dbac6ea77fee	50eef538-7008-4732-a6b3-8039b36305c6	500	ค่าไฟวัดกุดขอนแก่น	2026-02-28 00:00:00	\N	\N	2026-03-25 12:18:45.742	2026-04-30 14:25:38.238	2026-02-28 00:00:00	\N	\N	\N	FROM
274bb634-cc3c-4f42-842b-ff5c908c8769	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	789d64f0-7782-4c66-a2de-dbac6ea77fee	50eef538-7008-4732-a6b3-8039b36305c6	100	มูลนิธิ บุ๋ม ปนัดดา	2026-02-28 00:00:00	\N	\N	2026-03-25 12:18:45.745	2026-04-30 14:25:38.413	2026-02-28 00:00:00	\N	\N	\N	FROM
510d7540-0abe-4b9a-86d1-f6b43ea07336	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bf76aa0f-db8a-4062-ba12-aaae5f06a479	7e99a6eb-1877-400a-b2d3-a9c451c4ba2a	37102991-baf1-4f98-8608-0d57f260ccce	15000	บัญชีเงินซื้อรถ (ออมสิน)	2026-01-28 00:00:00	\N	\N	2026-04-22 17:33:40.217	2026-04-30 16:36:18.258	2026-01-28 00:00:00	24b40ac2-72f3-4b53-98c6-8d13790c4bd9	\N	2c15fc2a-0b00-414a-8003-d9316dd1dca2	TO
e2a56674-5818-4efd-b4e1-7a62644069ae	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	15ae3505-3233-44a4-a0ba-d6c776567cc2	50eef538-7008-4732-a6b3-8039b36305c6	3000	ค่าเช่าบ้าน+ค่าน้ำ+ค่าไฟ	2026-02-28 00:00:00		\N	2026-03-25 12:18:45.729	2026-04-30 14:25:38.938	2026-02-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	a3b94f14-eee1-4fca-b588-51f4815d8bb4	FROM
701be571-886b-468e-9c7c-f883f6a7fbd4	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	d78d57fa-7b30-49e1-82e7-bcb16d87193b	81142bbd-265d-4775-ae55-df4ea295fe4d	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	4000	UOB	2026-02-28 00:00:00		\N	2026-04-22 17:58:14.569	2026-04-30 16:38:09.524	2026-02-28 00:00:00	\N	51f240a8-e35d-4752-b2ac-1f147d00186a	11522427-5ff0-4e63-af26-3da6f16c9a51	TO
34b78e30-14d8-46a2-83c4-4b63d9842411	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	2f1955b9-333d-4ced-96ec-e33cfdbb9f5d	abaaab5b-cbd5-488b-b8a2-c6f9f2270203	1000	บัญชีออมสินแม่ (ออมสิน)	2026-01-28 00:00:00		\N	2026-04-22 17:12:01.144	2026-04-30 14:25:39.006	2026-01-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	3e9d4d60-51a5-406a-a643-098334e54f9a	FROM
78027a66-55f0-45a1-a7d8-870713c5bda5	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	15ae3505-3233-44a4-a0ba-d6c776567cc2	50eef538-7008-4732-a6b3-8039b36305c6	3000	ค่าเช่าบ้าน+ค่าน้ำ+ค่าไฟ	2026-01-28 00:00:00		\N	2026-03-25 11:13:26.983	2026-04-30 16:34:13.048	2026-01-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	aae46675-a8fb-4258-9cfe-089f0c6e7c4e	FROM
25d3b7a5-e3aa-4fe4-b1f7-daca9f8455cf	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	81a7bd00-a24a-466f-9301-5d7ac0ac1ed4	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	58633	เงินเดือน	2026-03-28 00:00:00	\N	\N	2026-03-28 12:21:41.17	2026-04-30 14:25:38.448	2026-03-28 00:00:00	\N	\N	\N	TO
a5308b38-e4f4-408e-8a27-58895cbac0f0	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	3dc7d7da-7d24-40d5-a79c-eeb7f2df7f26	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	351798	เงินชดเชย	2026-03-28 00:00:00		\N	2026-03-28 12:21:41.188	2026-04-30 14:25:38.482	2026-03-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	\N	TO
1a800942-3461-48e4-8427-7005b76a74e8	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	15ae3505-3233-44a4-a0ba-d6c776567cc2	50eef538-7008-4732-a6b3-8039b36305c6	1000	ค่าซื้อของรายเดือน	2026-01-28 00:00:00		\N	2026-03-25 11:13:26.986	2026-04-30 14:25:38.517	2026-01-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	\N	FROM
d5fb9f9e-56de-4610-bea3-faeb6eda8ddd	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	15ae3505-3233-44a4-a0ba-d6c776567cc2	50eef538-7008-4732-a6b3-8039b36305c6	1683	ภาษี	2026-03-28 00:00:00		\N	2026-03-28 12:21:41.185	2026-04-30 14:25:38.551	2026-03-28 00:00:00	\N	\N	\N	FROM
c3e492b3-bd12-4fea-acc5-0bf16446849f	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	15ae3505-3233-44a4-a0ba-d6c776567cc2	50eef538-7008-4732-a6b3-8039b36305c6	875	ประกันสังคม	2026-03-28 00:00:00		\N	2026-03-28 12:21:41.182	2026-04-30 14:25:38.586	2026-03-28 00:00:00	\N	\N	\N	FROM
1e08b61f-36ed-4161-913f-de3589321fff	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	3dc7d7da-7d24-40d5-a79c-eeb7f2df7f26	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	9000	ขายทองแม่	2026-03-26 00:00:00		\N	2026-03-25 17:44:57.978	2026-04-30 14:25:38.656	2026-03-07 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N	\N	TO
e229654e-6ba5-4bb0-8179-b8516cacbc57	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	789d64f0-7782-4c66-a2de-dbac6ea77fee	50eef538-7008-4732-a6b3-8039b36305c6	100	มูลนิธิ บุ๋ม ปนัดดา	2026-01-28 00:00:00		\N	2026-03-25 11:13:26.997	2026-04-30 14:25:38.69	2026-01-28 00:00:00	\N	\N	\N	FROM
c8d4fbd1-b083-4c41-923c-b9c95fd24bfb	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	789d64f0-7782-4c66-a2de-dbac6ea77fee	50eef538-7008-4732-a6b3-8039b36305c6	100	มูลนิธิ บุ๋ม ปนัดดา	2026-03-28 00:00:00	\N	\N	2026-03-28 12:21:41.271	2026-04-30 14:25:38.727	2026-03-28 00:00:00	\N	\N	\N	FROM
10bb5569-74db-4556-95bf-155b6fd3c067	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	aaa2dcef-080b-46a9-a902-e15f924984eb	e8804a23-dfc8-4b85-ac55-808c22bd5299	3000	คืนเงิน: ยืม	2026-03-28 12:36:41.903		a6695f95-48a0-4cb4-9c04-878c9a6236f6	2026-03-28 12:36:41.904	2026-04-30 14:25:38.762	2026-03-28 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N	\N	FROM
94a135f1-b248-491c-815d-ccf6d3dae45a	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	aaa2dcef-080b-46a9-a902-e15f924984eb	e8804a23-dfc8-4b85-ac55-808c22bd5299	1000	คืนเงิน: ยืม	2026-03-28 12:36:54.014		a2bc9399-3298-458c-a582-bdd9c587ae6e	2026-03-28 12:36:54.015	2026-04-30 14:25:38.797	2026-03-28 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N	\N	FROM
6d0a955c-3773-401e-9727-447e0684b30c	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	aaa2dcef-080b-46a9-a902-e15f924984eb	e8804a23-dfc8-4b85-ac55-808c22bd5299	1000	คืนเงิน: ยืม	2026-03-28 12:37:00.381		85222b31-c36e-409c-a71b-cfc2d6a53042	2026-03-28 12:37:00.382	2026-04-30 14:25:38.834	2026-03-28 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N	\N	FROM
18564749-8090-479a-946d-003d7ad163c1	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	89e8be90-4999-4593-8e47-01a618ae0d94	994f27ad-e4b9-4c56-85a0-5286df799ac4	50eef538-7008-4732-a6b3-8039b36305c6	5000	ค่าใช้จ่ายเพิ่มช่วงแม่มา	2026-04-11 00:00:00		\N	2026-04-11 10:05:55.283	2026-04-30 16:48:43.933	2026-04-06 00:00:00	d057c431-a00f-4408-8f12-fd9c9c93409e	\N	\N	FROM
1d399ae3-a586-4fde-b0e0-52dd482b5b38	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	e7133872-dedf-4e1b-a915-3b1458266906	0c8a91f9-4fce-4356-9bb5-4b38484f498e	50eef538-7008-4732-a6b3-8039b36305c6	3000	ย้ายไป DIME	2026-04-11 00:00:00		\N	2026-04-11 11:45:48.413	2026-04-30 16:48:05.117	2026-04-01 00:00:00	45517d10-82f6-4930-a07f-ae756c314bb4	\N	f570358f-fbba-414e-aab8-3b3790ca2ac1	FROM
5aa4909c-f280-4a69-86d7-e67eefc69e50	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	89e8be90-4999-4593-8e47-01a618ae0d94	de15062e-86de-4572-90bb-2a8b68448b4a	50eef538-7008-4732-a6b3-8039b36305c6	3200	ค่าทำฟันแม่	2026-04-11 00:00:00		\N	2026-04-11 10:04:21.182	2026-04-30 16:48:23.185	2026-04-03 00:00:00	d057c431-a00f-4408-8f12-fd9c9c93409e	\N	\N	FROM
3222a44f-2092-4453-9d14-5ccc45f13214	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	7c0133d0-7a90-47a8-bd7e-ab071cfca1c8	81142bbd-265d-4775-ae55-df4ea295fe4d	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	1000	ค่าซื้อของรายเดือน	2026-02-28 00:00:00		\N	2026-04-22 17:58:36.793	2026-04-30 14:25:39.526	2026-02-28 00:00:00	573e41d0-b3a7-4c53-a9c0-715d99ee592d	\N	42fbd423-0a38-4a3a-b012-d12747b2b498	TO
fe7f2747-d371-42b2-97c1-89176f312b3f	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	aaa2dcef-080b-46a9-a902-e15f924984eb	e8804a23-dfc8-4b85-ac55-808c22bd5299	1000	คืนเงิน: ซ่อมจานดาวเทียม	2026-03-28 12:37:04.99		7663b24e-385e-4682-a12f-6471b55343c9	2026-03-28 12:37:04.991	2026-04-30 14:25:39.074	2026-03-28 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N	\N	FROM
601bc975-e9e5-4d24-818a-a70c73faff24	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	aaa2dcef-080b-46a9-a902-e15f924984eb	e8804a23-dfc8-4b85-ac55-808c22bd5299	47300	คืนเงินบัญชีครอบครัว (ออมสิน 020125686467)	2026-02-28 00:00:00		\N	2026-03-25 12:18:45.688	2026-04-30 14:25:39.561	2026-02-28 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N	20da3baf-9f5e-4961-a31c-fde74222799e	FROM
4e6eb575-b62a-4063-a25c-5558992cf53c	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	de15062e-86de-4572-90bb-2a8b68448b4a	50eef538-7008-4732-a6b3-8039b36305c6	1000	กรุงไทย รายเดือนแม่	2026-03-28 00:00:00		\N	2026-03-28 12:21:41.238	2026-04-30 14:25:39.596	2026-03-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	badece96-297d-49d0-bc76-24d95170df48	FROM
c4d67177-4a80-4089-9745-b3e07529e5cd	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	dde45f0a-23a1-4c53-bc03-5a907ef5f406	2f1955b9-333d-4ced-96ec-e33cfdbb9f5d	abaaab5b-cbd5-488b-b8a2-c6f9f2270203	1000	ออมสิน เงินออมแม่	2026-03-28 00:00:00		\N	2026-04-22 18:06:26.493	2026-04-30 14:25:39.631	2026-03-28 00:00:00	f428d88f-9a22-4d84-b159-db6ce64fb7fc	\N	45f67371-f127-4f18-94ed-6a1d73dd727d	FROM
32c1fc59-75da-4c59-a2a7-4c30774bad3d	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	9b4cb30c-3f41-45ce-8e24-6e4423e1095c	0c8a91f9-4fce-4356-9bb5-4b38484f498e	50eef538-7008-4732-a6b3-8039b36305c6	3000	ย้ายไป DIME	2026-04-11 00:00:00		\N	2026-04-11 11:44:40.626	2026-04-30 16:47:56.112	2026-04-01 00:00:00	15c79449-ff47-4f84-9e31-cfdb66be744e	\N	3533656b-a991-4979-9aa7-de814ac74d57	FROM
a5eaac98-0da5-4b46-8e1f-be72ba3a589d	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	aaa2dcef-080b-46a9-a902-e15f924984eb	e8804a23-dfc8-4b85-ac55-808c22bd5299	1000	คืนเงิน: ยืม	2026-03-28 12:37:09.774		bebe1ff5-92b0-4650-96ea-ba6a4c142c50	2026-03-28 12:37:09.775	2026-04-30 14:25:39.109	2026-03-28 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N	\N	FROM
bae02319-3616-4144-af13-689c74d065a6	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	aaa2dcef-080b-46a9-a902-e15f924984eb	e8804a23-dfc8-4b85-ac55-808c22bd5299	500	คืนเงิน: ซ่อมจานดาวเทียม	2026-03-28 12:49:38.209		7663b24e-385e-4682-a12f-6471b55343c9	2026-03-28 12:49:38.211	2026-04-30 14:25:39.143	2026-03-28 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N	\N	FROM
62552e7b-3d2e-488e-9f15-ec7433bf0cb7	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	994f27ad-e4b9-4c56-85a0-5286df799ac4	50eef538-7008-4732-a6b3-8039b36305c6	7500	ใช้จ่ายส่วนตัวเพิ่มเติม	2026-04-07 00:00:00		\N	2026-04-07 09:56:21.154	2026-04-30 16:48:50.604	2026-03-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	\N	FROM
febb4c8c-91fb-4e86-9940-c9ed0a0a84d6	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	89e8be90-4999-4593-8e47-01a618ae0d94	de15062e-86de-4572-90bb-2a8b68448b4a	50eef538-7008-4732-a6b3-8039b36305c6	1698	กุญแจบ้าน	2026-04-11 00:00:00		\N	2026-04-11 10:05:22.062	2026-04-30 16:48:27.107	2026-04-04 00:00:00	d057c431-a00f-4408-8f12-fd9c9c93409e	\N	\N	FROM
1192c15c-c6c3-42fa-890b-c380a12b2eb1	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bf76aa0f-db8a-4062-ba12-aaae5f06a479	994f27ad-e4b9-4c56-85a0-5286df799ac4	50eef538-7008-4732-a6b3-8039b36305c6	5000	มัดจำรถ	2026-04-06 00:00:00		\N	2026-04-11 10:22:56.947	2026-04-30 16:48:53.078	2026-04-06 00:00:00	24b40ac2-72f3-4b53-98c6-8d13790c4bd9	\N	\N	FROM
46647661-5318-4657-b816-98fcd100ca4f	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	89e8be90-4999-4593-8e47-01a618ae0d94	92e80bf4-bdb1-47f2-9795-4a5284bb5c98	e0309b7f-8890-4cff-a3c1-c24058ed9b05	4850	รายการตั้งต้น: ชุดทำงาน	2026-04-22 00:00:00	\N	dfb71216-006f-4ecc-961f-64a691d45aea	2026-04-22 18:27:44.547	2026-04-30 16:48:34.925	2026-04-11 00:00:00	d057c431-a00f-4408-8f12-fd9c9c93409e	\N	\N	FROM
ddb11c28-3cf8-4fe4-9b6b-c2ebb2781773	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	d1450fd3-8880-4dff-90c8-d606ffc206fc	dd3f9c0d-6554-4895-a57f-387acf6fe4f5	6414.73	จ่ายบัตร UOB	2026-04-07 00:00:00		\N	2026-04-07 10:04:51.914	2026-04-30 16:48:39.039	2026-03-30 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	d97176aa-c79c-41ca-beec-3ba744c2f6b7	FROM
badece96-297d-49d0-bc76-24d95170df48	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	c0222442-a596-46f5-89e3-b19635ba5d57	81142bbd-265d-4775-ae55-df4ea295fe4d	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	1000	กรุงไทย รายเดือนแม่	2026-03-28 00:00:00		\N	2026-04-22 18:06:12.896	2026-04-30 14:25:39.388	2026-03-28 00:00:00	2bc891a6-e07a-46f6-9802-cf8f0e1af1e0	\N	4e6eb575-b62a-4063-a25c-5558992cf53c	TO
ab13c60f-1ae3-485c-89b2-ab996fca7667	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	d1450fd3-8880-4dff-90c8-d606ffc206fc	dd3f9c0d-6554-4895-a57f-387acf6fe4f5	15836.73	ปรับยอดบัตรเครดิตจากปี 2025	2025-12-31 00:00:00		\N	2026-04-22 18:32:42.615	2026-04-30 17:44:44.585	2025-12-31 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	641714ca-678e-4bfb-88f5-c08c25de4cc2	FROM
641714ca-678e-4bfb-88f5-c08c25de4cc2	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	d78d57fa-7b30-49e1-82e7-bcb16d87193b	81142bbd-265d-4775-ae55-df4ea295fe4d	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	15836.73	ปรับยอดบัตรเครดิตจากปี 2025	2025-12-31 00:00:00		\N	2026-04-22 18:32:42.599	2026-04-30 17:44:44.634	2025-12-31 00:00:00	\N	51f240a8-e35d-4752-b2ac-1f147d00186a	ab13c60f-1ae3-485c-89b2-ab996fca7667	TO
407d3a36-f309-4c52-b402-aad3c622dc31	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	166baf00-012e-4961-8ea5-93fbad9cbdaa	main-acc-166baf00-012e-4961-8ea5-93fbad9cbdaa	be4410bb-51d6-4db5-b7d5-a09a00821ba0	137065dd-2161-47bd-920a-11dd873988e7	100000	Monthly Salary	2026-04-01 00:00:00	\N	\N	2026-04-30 18:13:15.864	2026-04-30 18:13:15.864	\N	24cc6423-cae4-4a98-a81b-cf87072fe0b1	\N	\N	\N
a3b94f14-eee1-4fca-b588-51f4815d8bb4	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	7c0133d0-7a90-47a8-bd7e-ab071cfca1c8	81142bbd-265d-4775-ae55-df4ea295fe4d	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	3000	ค่าเช่าบ้าน+ค่าน้ำ+ค่าไฟ	2026-02-28 00:00:00		\N	2026-04-22 17:58:44.646	2026-04-30 14:25:39.769	2026-02-28 00:00:00	573e41d0-b3a7-4c53-a9c0-715d99ee592d	\N	e2a56674-5818-4efd-b4e1-7a62644069ae	TO
ceaa3572-aa2f-4090-a26e-9797be55e09a	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	7c0133d0-7a90-47a8-bd7e-ab071cfca1c8	81142bbd-265d-4775-ae55-df4ea295fe4d	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	1000	ค่าซื้อของรายเดือน	2026-03-28 00:00:00		\N	2026-04-22 18:01:19.146	2026-04-30 14:25:39.803	2026-03-28 00:00:00	573e41d0-b3a7-4c53-a9c0-715d99ee592d	\N	0cffe834-581a-4492-a8dd-415ad347236f	TO
8307a546-be18-4d07-a69c-b9137255676a	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	0c8a91f9-4fce-4356-9bb5-4b38484f498e	50eef538-7008-4732-a6b3-8039b36305c6	20000	ออม จากเงินชดเชย	2026-03-30 00:00:00		\N	2026-04-22 18:01:07.218	2026-04-30 16:41:37.551	2026-03-30 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	2f5172c8-9bab-4a28-a668-7eeeba2e2a4f	FROM
0cffe834-581a-4492-a8dd-415ad347236f	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	994f27ad-e4b9-4c56-85a0-5286df799ac4	50eef538-7008-4732-a6b3-8039b36305c6	1000	ค่าซื้อของรายเดือน	2026-03-28 00:00:00		\N	2026-03-28 12:21:41.257	2026-04-30 14:25:39.872	2026-03-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	ceaa3572-aa2f-4090-a26e-9797be55e09a	FROM
1f58ac87-c824-4ab1-ac64-7781420a4415	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	a9debac2-2e2e-450c-ada1-2d652c557801	81142bbd-265d-4775-ae55-df4ea295fe4d	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	6000	ค่าใช้จ่ายทั่วไป	2026-03-26 00:00:00		\N	2026-04-22 18:06:37.403	2026-04-30 14:25:39.906	2026-03-26 00:00:00	b8f82762-46ef-4555-afcd-784360c432ab	\N	ed324a5a-1108-4727-8e1b-e6ad24401587	TO
3e9d4d60-51a5-406a-a643-098334e54f9a	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	dde45f0a-23a1-4c53-bc03-5a907ef5f406	81142bbd-265d-4775-ae55-df4ea295fe4d	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	1000	บัญชีออมสินแม่ (ออมสิน)	2026-01-28 00:00:00		\N	2026-04-22 17:50:48.31	2026-04-30 14:25:39.978	2026-01-28 00:00:00	f428d88f-9a22-4d84-b159-db6ce64fb7fc	\N	34b78e30-14d8-46a2-83c4-4b63d9842411	TO
6c8aeb28-8e9e-41b0-a059-a21dcbe86149	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	a9debac2-2e2e-450c-ada1-2d652c557801	0c8a91f9-4fce-4356-9bb5-4b38484f498e	50eef538-7008-4732-a6b3-8039b36305c6	38000	ออม จากประกันแม่	2026-03-06 00:00:00		\N	2026-04-22 18:06:59.643	2026-04-30 16:42:40.519	2026-03-06 00:00:00	b8f82762-46ef-4555-afcd-784360c432ab	\N	2c2a63c2-1561-4c78-a137-17c0545df2ee	FROM
ec4b8cbe-42c2-401f-8d93-223ef452a907	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	0c8a91f9-4fce-4356-9bb5-4b38484f498e	50eef538-7008-4732-a6b3-8039b36305c6	46418	ออมกสิกร	2026-03-28 00:00:00		\N	2026-04-22 16:35:06.825	2026-04-30 16:46:22.655	2026-03-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	66f2e571-6c01-4b0d-9204-2ded1d369dc2	FROM
d97176aa-c79c-41ca-beec-3ba744c2f6b7	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	d78d57fa-7b30-49e1-82e7-bcb16d87193b	81142bbd-265d-4775-ae55-df4ea295fe4d	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	6414.73	จ่ายบัตร UOB	2026-04-07 00:00:00		\N	2026-04-22 16:31:07.057	2026-04-30 16:48:39.067	2026-03-30 00:00:00	\N	51f240a8-e35d-4752-b2ac-1f147d00186a	ddb11c28-3cf8-4fe4-9b6b-c2ebb2781773	TO
171279ea-9228-4ee6-860f-d11c8565c046	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	994f27ad-e4b9-4c56-85a0-5286df799ac4	50eef538-7008-4732-a6b3-8039b36305c6	15000	มัดจำม่าน	2026-04-07 00:00:00		\N	2026-04-07 09:54:51.218	2026-04-30 16:48:47.184	2026-03-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	\N	FROM
4596ec39-cf78-4274-901a-f8441b25b733	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	598e3174-e46b-4dab-ba59-113fbacccd63	abaaab5b-cbd5-488b-b8a2-c6f9f2270203	1000	ออมเงินสด (ออมสิน 020125686467)	2026-01-28 00:00:00		\N	2026-04-22 17:12:55.054	2026-04-30 16:36:01.323	2026-01-28 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N	6492207b-7dba-45ef-8b65-59d77b39c073	TO
aae46675-a8fb-4258-9cfe-089f0c6e7c4e	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	7c0133d0-7a90-47a8-bd7e-ab071cfca1c8	81142bbd-265d-4775-ae55-df4ea295fe4d	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	3000	ค่าเช่าบ้าน+ค่าน้ำ+ค่าไฟ	2026-01-28 00:00:00		\N	2026-04-22 17:50:13.73	2026-04-30 16:34:13.104	2026-01-28 00:00:00	573e41d0-b3a7-4c53-a9c0-715d99ee592d	\N	78027a66-55f0-45a1-a7d8-870713c5bda5	TO
e2a3e0eb-249a-4a17-8d4b-55c135505d83	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	15ae3505-3233-44a4-a0ba-d6c776567cc2	50eef538-7008-4732-a6b3-8039b36305c6	2676.07	ค่าโทรศัพท์ + ค่า Internet บ้าน	2026-03-28 00:00:00		\N	2026-03-28 12:21:41.249	2026-04-30 14:25:39.7	2026-03-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	\N	FROM
b8095931-00be-431e-8b69-e228b934a0e2	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	d78d57fa-7b30-49e1-82e7-bcb16d87193b	81142bbd-265d-4775-ae55-df4ea295fe4d	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	40122	จ่ายบัตร UOB	2026-03-28 00:00:00		\N	2026-04-22 17:02:37.05	2026-04-30 16:40:33.65	2026-03-28 00:00:00	\N	51f240a8-e35d-4752-b2ac-1f147d00186a	c1fff409-f6f1-4c7b-9d52-fd9381333a3e	TO
579490ff-0b12-432b-b017-182cec152a61	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	e118748e-8fe5-4c36-a119-6555f6af4160	81142bbd-265d-4775-ae55-df4ea295fe4d	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	7000	ออมสิน รายเดือนแม่	2026-03-28 00:00:00		\N	2026-04-22 18:02:12.805	2026-04-30 14:25:40.389	2026-03-28 00:00:00	dc93307c-9918-470d-87d6-626c4df2f43b	\N	261b6fe1-5589-4d0d-a665-63d829d99d54	TO
52c8ad1c-c3fd-4595-8c91-2a4bde748879	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	0c8a91f9-4fce-4356-9bb5-4b38484f498e	50eef538-7008-4732-a6b3-8039b36305c6	1000	Cloud Pocket ค่าใช้จ่ายรถ	2026-03-28 00:00:00		\N	2026-04-22 16:58:12.124	2026-04-30 16:45:16.63	2026-03-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	9553ab62-6279-454a-99a6-b1916a6c8082	FROM
2133efc5-b099-4c8b-9ac2-b4eadddfa068	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	89e8be90-4999-4593-8e47-01a618ae0d94	aaa2dcef-080b-46a9-a902-e15f924984eb	e8804a23-dfc8-4b85-ac55-808c22bd5299	1980	คืนเงิน: ชุดทำงาน	2026-04-22 00:00:00	ชุดทำงาน ส่วนของมด	dfb71216-006f-4ecc-961f-64a691d45aea	2026-04-22 16:50:15.595	2026-04-30 16:48:59.771	2026-04-11 00:00:00	d057c431-a00f-4408-8f12-fd9c9c93409e	\N	\N	FROM
0f83b2d9-aa9c-44d9-87d4-f442a319432d	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	c0222442-a596-46f5-89e3-b19635ba5d57	81142bbd-265d-4775-ae55-df4ea295fe4d	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	5000	เงินเดือนแม่บัญชีกรุงไทย	2026-01-28 00:00:00		\N	2026-04-22 17:52:06.801	2026-04-30 16:36:08.328	2026-01-28 00:00:00	2bc891a6-e07a-46f6-9802-cf8f0e1af1e0	\N	a4bb1d66-c399-4161-af95-8fe14d07670a	TO
2c2a63c2-1561-4c78-a137-17c0545df2ee	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	598e3174-e46b-4dab-ba59-113fbacccd63	abaaab5b-cbd5-488b-b8a2-c6f9f2270203	38000	ออม จากประกันแม่	2026-03-06 00:00:00		\N	2026-04-22 17:05:57.689	2026-04-30 16:42:40.49	2026-03-06 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N	6c8aeb28-8e9e-41b0-a059-a21dcbe86149	TO
9cca4843-0144-44b0-b6ef-ff7602568b90	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	7c0133d0-7a90-47a8-bd7e-ab071cfca1c8	81142bbd-265d-4775-ae55-df4ea295fe4d	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	3000	ค่าเช่าบ้าน+ค่าน้ำ+ค่าไฟ	2026-03-28 00:00:00		\N	2026-04-22 18:02:20.502	2026-04-30 14:25:40.562	2026-03-28 00:00:00	573e41d0-b3a7-4c53-a9c0-715d99ee592d	\N	552f0ba3-7f5a-4b8b-a1a4-695f4b70972e	TO
02a0f189-e8f6-4576-834f-4ffc76ec3715	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	a9debac2-2e2e-450c-ada1-2d652c557801	994f27ad-e4b9-4c56-85a0-5286df799ac4	50eef538-7008-4732-a6b3-8039b36305c6	5123.44	จ่าย Shopee Pay	2026-02-28 00:00:00		\N	2026-04-22 18:54:00.312	2026-04-30 16:38:03.084	2026-02-28 00:00:00	b8f82762-46ef-4555-afcd-784360c432ab	\N	\N	FROM
b4150d78-f25c-457a-a290-0fdd3f75bdcf	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	0c8a91f9-4fce-4356-9bb5-4b38484f498e	50eef538-7008-4732-a6b3-8039b36305c6	1000	Cloud Pocket ออมทอง	2026-03-28 00:00:00		\N	2026-04-22 16:33:11.243	2026-04-30 16:46:53.618	2026-03-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	6be48a0a-9388-4cb1-bfd9-d8bcb0e22d87	FROM
cc2c2b6c-d162-4e98-b04a-452d70a527e5	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	011aed10-550c-4669-8d0e-af36c53e3611	9bc0d553-b8d2-4aaf-a5be-c2956b3600fb	5f1440e5-4ecc-484c-a3ec-b82a47fd8c6d	1759	กองทุนสำรองเลี้ยงชีพ	2026-02-28 00:00:00		\N	2026-03-25 12:18:45.685	2026-04-30 16:39:50.331	2026-02-28 00:00:00	a07ecfbd-38e3-459a-a94b-c172b9c809b0	\N	0a8a7234-119c-4ba6-8871-9b72297b30a8	TO
2f5172c8-9bab-4a28-a668-7eeeba2e2a4f	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	598e3174-e46b-4dab-ba59-113fbacccd63	abaaab5b-cbd5-488b-b8a2-c6f9f2270203	20000	ออม จากเงินชดเชย	2026-03-30 00:00:00		\N	2026-04-22 17:07:30.031	2026-04-30 16:41:37.509	2026-03-30 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N	8307a546-be18-4d07-a69c-b9137255676a	TO
e5d12194-925a-4775-a055-9eaafb8c7fc9	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	0c8a91f9-4fce-4356-9bb5-4b38484f498e	50eef538-7008-4732-a6b3-8039b36305c6	500	Cloud Pocket กองทุนกสิกร	2026-03-28 00:00:00		\N	2026-04-22 16:33:22.634	2026-04-30 16:45:28.809	2026-03-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	8610f4b3-d030-4d74-a631-dd2d1682ff8d	FROM
bd7ba956-0e68-4bdc-8213-865506638898	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	d78d57fa-7b30-49e1-82e7-bcb16d87193b	81142bbd-265d-4775-ae55-df4ea295fe4d	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	4300	UOB	2026-01-28 00:00:00		\N	2026-04-22 17:11:08.163	2026-04-30 14:25:40.772	2026-01-28 00:00:00	\N	51f240a8-e35d-4752-b2ac-1f147d00186a	bcb3a4a9-efc3-409d-9156-45736e22e770	TO
a4bb1d66-c399-4161-af95-8fe14d07670a	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	de15062e-86de-4572-90bb-2a8b68448b4a	50eef538-7008-4732-a6b3-8039b36305c6	5000	เงินเดือนแม่บัญชีกรุงไทย	2026-01-28 00:00:00		\N	2026-04-22 17:52:06.867	2026-04-30 16:36:08.277	2026-01-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	0f83b2d9-aa9c-44d9-87d4-f442a319432d	FROM
0a8a7234-119c-4ba6-8871-9b72297b30a8	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	0c8a91f9-4fce-4356-9bb5-4b38484f498e	50eef538-7008-4732-a6b3-8039b36305c6	1759	กองทุนสำรองเลี้ยงชีพ	2026-02-28 00:00:00		\N	2026-04-22 18:21:54.781	2026-04-30 16:39:50.263	2026-02-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	cc2c2b6c-d162-4e98-b04a-452d70a527e5	FROM
c8459a1e-ed4d-4ae1-b18f-850be6595c24	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	a9debac2-2e2e-450c-ada1-2d652c557801	15ae3505-3233-44a4-a0ba-d6c776567cc2	50eef538-7008-4732-a6b3-8039b36305c6	6296	จ่าย Shopee Pay	2026-03-28 00:00:00		\N	2026-04-22 18:55:03.74	2026-04-30 14:25:40.32	2026-03-28 00:00:00	b8f82762-46ef-4555-afcd-784360c432ab	\N	\N	FROM
b785e107-1f9f-4f54-85a4-4029339d7692	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	994f27ad-e4b9-4c56-85a0-5286df799ac4	50eef538-7008-4732-a6b3-8039b36305c6	4591	จ่าย Shopee Pay	2026-01-28 00:00:00		\N	2026-04-22 18:41:21.69	2026-04-30 16:37:27.532	2026-01-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	\N	FROM
6ec30999-cc1b-4fdf-8de5-e14dab2190e2	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	166baf00-012e-4961-8ea5-93fbad9cbdaa	emergency-acc-166baf00-012e-4961-8ea5-93fbad9cbdaa	93e941ca-01f0-4a93-9791-429a005f35e5	137065dd-2161-47bd-920a-11dd873988e7	45000	Emergency Fund Top-up	2026-04-05 00:00:00	\N	\N	2026-04-30 18:13:15.87	2026-04-30 18:13:15.87	\N	65584d9a-70eb-403c-9fe7-ed8e229e8b89	\N	\N	\N
4465802b-f7de-4ca5-8ee6-5c698e54d123	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	166baf00-012e-4961-8ea5-93fbad9cbdaa	main-acc-166baf00-012e-4961-8ea5-93fbad9cbdaa	484cddf8-8ca8-490c-acff-8127ff8b8365	296e4c31-4910-49f5-90d9-1c635161a48a	5000	Transfer to Savings	2026-04-10 00:00:00	\N	\N	2026-04-30 18:13:15.876	2026-04-30 18:13:15.876	\N	24cc6423-cae4-4a98-a81b-cf87072fe0b1	\N	\N	\N
61c39131-9442-46b7-8d41-93bca3c0986f	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	4fd24e66-2498-4fd7-b40b-be8bfd94a413	main-acc-4fd24e66-2498-4fd7-b40b-be8bfd94a413	be4410bb-51d6-4db5-b7d5-a09a00821ba0	137065dd-2161-47bd-920a-11dd873988e7	100000	Monthly Salary	2026-04-01 00:00:00	\N	\N	2026-04-30 18:13:15.961	2026-04-30 18:13:15.961	\N	cceb2a57-5d62-49af-9f8e-0a46c70ef69b	\N	\N	\N
435260aa-c57b-4ddf-a684-401921b86206	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	011aed10-550c-4669-8d0e-af36c53e3611	85ae760d-31e6-444c-b392-431fa86ff590	5f1440e5-4ecc-484c-a3ec-b82a47fd8c6d	1759	กองทุนสำรองเลี้ยงชีพ	2026-01-28 00:00:00		\N	2026-03-25 11:13:26.947	2026-04-30 16:36:12.029	2026-01-28 00:00:00	a07ecfbd-38e3-459a-a94b-c172b9c809b0	\N	959b056b-8a4d-44fd-996d-8c663fe1ee44	TO
2c15fc2a-0b00-414a-8003-d9316dd1dca2	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	0c8a91f9-4fce-4356-9bb5-4b38484f498e	50eef538-7008-4732-a6b3-8039b36305c6	15000	บัญชีเงินซื้อรถ (ออมสิน)	2026-01-28 00:00:00		\N	2026-04-22 16:15:08.209	2026-04-30 16:36:18.205	2026-01-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	510d7540-0abe-4b9a-86d1-f6b43ea07336	FROM
959b056b-8a4d-44fd-996d-8c663fe1ee44	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	0c8a91f9-4fce-4356-9bb5-4b38484f498e	50eef538-7008-4732-a6b3-8039b36305c6	1759	กองทุนสำรองเลี้ยงชีพ	2026-01-28 00:00:00		\N	2026-04-22 18:10:45.821	2026-04-30 16:36:11.998	2026-01-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	435260aa-c57b-4ddf-a684-401921b86206	FROM
b28fe561-85a5-4186-9851-1d3de4d0db5e	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	598e3174-e46b-4dab-ba59-113fbacccd63	abaaab5b-cbd5-488b-b8a2-c6f9f2270203	2000	คืนเงินบัญชีครอบครัว (ออมสิน 020125686467)	2026-01-28 00:00:00		\N	2026-04-22 17:11:32.378	2026-04-30 16:35:42.993	2026-01-28 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N	1b849d83-98bf-4750-ae8a-50b715813a69	TO
261b6fe1-5589-4d0d-a665-63d829d99d54	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	de15062e-86de-4572-90bb-2a8b68448b4a	50eef538-7008-4732-a6b3-8039b36305c6	7000	ออมสิน รายเดือนแม่	2026-03-28 00:00:00		\N	2026-03-28 12:21:41.242	2026-04-30 14:25:40.841	2026-03-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	579490ff-0b12-432b-b017-182cec152a61	FROM
f97106ec-e35e-479c-8fdd-992c81be7690	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	a9debac2-2e2e-450c-ada1-2d652c557801	81142bbd-265d-4775-ae55-df4ea295fe4d	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	10000	ค่าใช้จ่ายรายเดือน 3	2026-03-28 00:00:00		\N	2026-04-22 18:04:12.99	2026-04-30 14:25:40.875	2026-03-28 00:00:00	b8f82762-46ef-4555-afcd-784360c432ab	\N	a4ebbba4-54bd-4cba-9dcd-c7e1971e8e8f	TO
ed324a5a-1108-4727-8e1b-e6ad24401587	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	994f27ad-e4b9-4c56-85a0-5286df799ac4	50eef538-7008-4732-a6b3-8039b36305c6	6000	ค่าใช้จ่ายทั่วไป	2026-03-26 00:00:00		\N	2026-03-25 17:43:31.768	2026-04-30 14:25:40.909	2026-03-26 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	1f58ac87-c824-4ab1-ac64-7781420a4415	FROM
c1fff409-f6f1-4c7b-9d52-fd9381333a3e	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	d1450fd3-8880-4dff-90c8-d606ffc206fc	dd3f9c0d-6554-4895-a57f-387acf6fe4f5	40122	จ่ายบัตร UOB	2026-03-28 00:00:00		\N	2026-03-28 12:21:41.246	2026-04-30 16:40:33.579	2026-03-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	b8095931-00be-431e-8b69-e228b934a0e2	FROM
7fb62902-868b-483f-b2e2-af10455ced09	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	0c8a91f9-4fce-4356-9bb5-4b38484f498e	50eef538-7008-4732-a6b3-8039b36305c6	500	Cloud Pocket เที่ยว	2026-03-28 00:00:00		\N	2026-04-22 16:58:35.088	2026-04-30 16:45:51.268	2026-03-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	0fbec5d5-977f-4e97-b128-dbca53a29d95	FROM
20da3baf-9f5e-4961-a31c-fde74222799e	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	0c8a91f9-4fce-4356-9bb5-4b38484f498e	50eef538-7008-4732-a6b3-8039b36305c6	47300	คืนเงินบัญชีครอบครัว (ออมสิน 020125686467)	2026-02-28 00:00:00		\N	2026-04-22 17:58:57.984	2026-04-30 14:25:41.012	2026-02-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	601bc975-e9e5-4d24-818a-a70c73faff24	FROM
b70d2ae4-828b-46a3-915d-a9422076d5de	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	0c8a91f9-4fce-4356-9bb5-4b38484f498e	50eef538-7008-4732-a6b3-8039b36305c6	2000	Cloud Pocket ASML	2026-03-28 00:00:00		\N	2026-04-22 16:37:15.704	2026-04-30 16:45:59.746	2026-03-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	b2999fa5-004c-4076-8081-8487dd4b7ad4	FROM
66f2e571-6c01-4b0d-9204-2ded1d369dc2	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	89e8be90-4999-4593-8e47-01a618ae0d94	d38b7568-c937-4962-8857-dbb9a5a03edd	abaaab5b-cbd5-488b-b8a2-c6f9f2270203	46418	ออมกสิกร	2026-03-28 00:00:00		\N	2026-04-22 18:02:46.448	2026-04-30 16:46:22.702	2026-03-28 00:00:00	d057c431-a00f-4408-8f12-fd9c9c93409e	\N	ec4b8cbe-42c2-401f-8d93-223ef452a907	TO
45f67371-f127-4f18-94ed-6a1d73dd727d	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	2f1955b9-333d-4ced-96ec-e33cfdbb9f5d	abaaab5b-cbd5-488b-b8a2-c6f9f2270203	1000	ออมสิน เงินออมแม่	2026-03-28 00:00:00		\N	2026-04-22 16:34:25.606	2026-04-30 14:25:41.116	2026-03-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	c4d67177-4a80-4089-9745-b3e07529e5cd	FROM
16c64de9-5005-469a-98c5-d3d68978e9f6	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	c0222442-a596-46f5-89e3-b19635ba5d57	81142bbd-265d-4775-ae55-df4ea295fe4d	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	5000	เงินเดือนแม่บัญชีกรุงไทย	2026-02-28 00:00:00		\N	2026-04-22 17:57:42.542	2026-04-30 16:38:37.733	2026-02-28 00:00:00	2bc891a6-e07a-46f6-9802-cf8f0e1af1e0	\N	6911659e-1060-4404-af37-bc388d19ae2a	TO
81417741-8645-4be0-a688-e65b4f5e9d03	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	c0222442-a596-46f5-89e3-b19635ba5d57	81142bbd-265d-4775-ae55-df4ea295fe4d	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	5000	เงินเดือนแม่ กรุงไทย	2026-01-28 00:00:00		\N	2026-04-22 17:53:44.209	2026-04-30 14:25:41.255	2026-01-28 00:00:00	2bc891a6-e07a-46f6-9802-cf8f0e1af1e0	\N	4ea4f622-aee7-4f6f-8e4d-3870173d0ca6	TO
dee7bf24-f945-4998-9371-20eb13689ee9	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	4fd24e66-2498-4fd7-b40b-be8bfd94a413	emergency-acc-4fd24e66-2498-4fd7-b40b-be8bfd94a413	93e941ca-01f0-4a93-9791-429a005f35e5	137065dd-2161-47bd-920a-11dd873988e7	45000	Emergency Fund Top-up	2026-04-05 00:00:00	\N	\N	2026-04-30 18:13:15.967	2026-04-30 18:13:15.967	\N	a822a312-fea6-4d0b-ae19-ff1461f3bc4e	\N	\N	\N
4484d54c-3a42-4f95-a5ef-4f36a89c9d3b	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	4fd24e66-2498-4fd7-b40b-be8bfd94a413	main-acc-4fd24e66-2498-4fd7-b40b-be8bfd94a413	484cddf8-8ca8-490c-acff-8127ff8b8365	296e4c31-4910-49f5-90d9-1c635161a48a	5000	Transfer to Savings	2026-04-10 00:00:00	\N	\N	2026-04-30 18:13:15.972	2026-04-30 18:13:15.972	\N	cceb2a57-5d62-49af-9f8e-0a46c70ef69b	\N	\N	\N
3ab7454b-3ba8-4b19-b604-626dcf80b173	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	166baf00-012e-4961-8ea5-93fbad9cbdaa	emergency-acc-166baf00-012e-4961-8ea5-93fbad9cbdaa	be4410bb-51d6-4db5-b7d5-a09a00821ba0	137065dd-2161-47bd-920a-11dd873988e7	45000	Test Income April	2026-04-15 00:00:00	\N	\N	2026-04-30 18:13:15.999	2026-04-30 18:13:15.999	\N	\N	\N	\N	\N
09513ef9-a434-4d10-9fa7-355df71e7846	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	166baf00-012e-4961-8ea5-93fbad9cbdaa	emergency-acc-166baf00-012e-4961-8ea5-93fbad9cbdaa	be4410bb-51d6-4db5-b7d5-a09a00821ba0	296e4c31-4910-49f5-90d9-1c635161a48a	5000	Test Internal Transfer	2026-04-15 00:00:00	\N	\N	2026-04-30 18:13:16.005	2026-04-30 18:13:16.005	\N	\N	\N	\N	\N
fab7d9e1-5ed3-4691-9dd0-32104fee8549	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	e118748e-8fe5-4c36-a119-6555f6af4160	81142bbd-265d-4775-ae55-df4ea295fe4d	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	7000	เงินเดือนแม่บัญชีออมสิน	2026-01-28 00:00:00		\N	2026-04-22 17:49:57.907	2026-04-30 14:25:42.051	2026-01-28 00:00:00	dc93307c-9918-470d-87d6-626c4df2f43b	\N	8641799d-aeb5-48e8-bf42-5f605321f6d5	TO
e0768cdb-276a-44ec-9e08-ddbfe5cc8195	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	166baf00-012e-4961-8ea5-93fbad9cbdaa	main-acc-166baf00-012e-4961-8ea5-93fbad9cbdaa	be4410bb-51d6-4db5-b7d5-a09a00821ba0	137065dd-2161-47bd-920a-11dd873988e7	100000	Monthly Salary	2026-04-01 00:00:00	\N	\N	2026-04-30 18:40:36.358	2026-04-30 18:40:36.358	\N	24cc6423-cae4-4a98-a81b-cf87072fe0b1	\N	\N	\N
578702e8-d8c6-46df-8271-ad2fc291c4cf	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	166baf00-012e-4961-8ea5-93fbad9cbdaa	emergency-acc-166baf00-012e-4961-8ea5-93fbad9cbdaa	93e941ca-01f0-4a93-9791-429a005f35e5	137065dd-2161-47bd-920a-11dd873988e7	45000	Emergency Fund Top-up	2026-04-05 00:00:00	\N	\N	2026-04-30 18:40:36.38	2026-04-30 18:40:36.38	\N	65584d9a-70eb-403c-9fe7-ed8e229e8b89	\N	\N	\N
992b4313-f885-4ae2-ac02-fd2dee84b97c	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	166baf00-012e-4961-8ea5-93fbad9cbdaa	main-acc-166baf00-012e-4961-8ea5-93fbad9cbdaa	484cddf8-8ca8-490c-acff-8127ff8b8365	296e4c31-4910-49f5-90d9-1c635161a48a	5000	Transfer to Savings	2026-04-10 00:00:00	\N	\N	2026-04-30 18:40:36.389	2026-04-30 18:40:36.389	\N	24cc6423-cae4-4a98-a81b-cf87072fe0b1	\N	\N	\N
d11f2c70-7bc9-4730-a4ca-ed10750d735c	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	4fd24e66-2498-4fd7-b40b-be8bfd94a413	main-acc-4fd24e66-2498-4fd7-b40b-be8bfd94a413	be4410bb-51d6-4db5-b7d5-a09a00821ba0	137065dd-2161-47bd-920a-11dd873988e7	100000	Monthly Salary	2026-04-01 00:00:00	\N	\N	2026-04-30 18:40:36.524	2026-04-30 18:40:36.524	\N	cceb2a57-5d62-49af-9f8e-0a46c70ef69b	\N	\N	\N
d35dbe37-e286-4120-9d0f-508f86d2694a	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	4fd24e66-2498-4fd7-b40b-be8bfd94a413	emergency-acc-4fd24e66-2498-4fd7-b40b-be8bfd94a413	93e941ca-01f0-4a93-9791-429a005f35e5	137065dd-2161-47bd-920a-11dd873988e7	45000	Emergency Fund Top-up	2026-04-05 00:00:00	\N	\N	2026-04-30 18:40:36.534	2026-04-30 18:40:36.534	\N	a822a312-fea6-4d0b-ae19-ff1461f3bc4e	\N	\N	\N
064e6fd3-8e4d-41f1-9a74-1a6889026e17	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	4fd24e66-2498-4fd7-b40b-be8bfd94a413	main-acc-4fd24e66-2498-4fd7-b40b-be8bfd94a413	484cddf8-8ca8-490c-acff-8127ff8b8365	296e4c31-4910-49f5-90d9-1c635161a48a	5000	Transfer to Savings	2026-04-10 00:00:00	\N	\N	2026-04-30 18:40:36.541	2026-04-30 18:40:36.541	\N	cceb2a57-5d62-49af-9f8e-0a46c70ef69b	\N	\N	\N
6b5879a5-c3e8-49f0-b44b-a13fe7908f19	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	166baf00-012e-4961-8ea5-93fbad9cbdaa	emergency-acc-166baf00-012e-4961-8ea5-93fbad9cbdaa	be4410bb-51d6-4db5-b7d5-a09a00821ba0	137065dd-2161-47bd-920a-11dd873988e7	45000	Test Income April	2026-04-15 00:00:00	\N	\N	2026-04-30 18:40:36.604	2026-04-30 18:40:36.604	\N	\N	\N	\N	\N
7b7a8d32-cd07-4fc1-9228-de48be254a82	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	166baf00-012e-4961-8ea5-93fbad9cbdaa	emergency-acc-166baf00-012e-4961-8ea5-93fbad9cbdaa	be4410bb-51d6-4db5-b7d5-a09a00821ba0	296e4c31-4910-49f5-90d9-1c635161a48a	5000	Test Internal Transfer	2026-04-15 00:00:00	\N	\N	2026-04-30 18:40:36.615	2026-04-30 18:40:36.615	\N	\N	\N	\N	\N
42fbd423-0a38-4a3a-b012-d12747b2b498	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	15ae3505-3233-44a4-a0ba-d6c776567cc2	50eef538-7008-4732-a6b3-8039b36305c6	1000	ค่าซื้อของรายเดือน	2026-02-28 00:00:00		\N	2026-03-25 12:18:45.733	2026-04-30 14:25:38.272	2026-02-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	3222a44f-2092-4453-9d14-5ccc45f13214	FROM
8610f4b3-d030-4d74-a631-dd2d1682ff8d	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	5e1bb381-4871-46f2-93d8-bb339304efce	9bc0d553-b8d2-4aaf-a5be-c2956b3600fb	5f1440e5-4ecc-484c-a3ec-b82a47fd8c6d	500	Cloud Pocket กองทุนกสิกร	2026-03-28 00:00:00	\N	\N	2026-04-22 17:24:55.9	2026-04-30 16:45:28.85	2026-03-28 00:00:00	fcce5ed4-d10a-437e-8807-1114e98f8192	\N	e5d12194-925a-4775-a055-9eaafb8c7fc9	TO
c2097e63-2439-4109-9e5a-47225eadbe8f	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bf76aa0f-db8a-4062-ba12-aaae5f06a479	92e80bf4-bdb1-47f2-9795-4a5284bb5c98	e0309b7f-8890-4cff-a3c1-c24058ed9b05	50000	ยืมทำบ้าน 20000+30000	2026-01-17 00:00:00		a41d7d63-ce2f-4cc8-9039-24442eadec60	2026-04-30 18:43:11.465	2026-04-30 18:43:11.589	2026-01-17 00:00:00	24b40ac2-72f3-4b53-98c6-8d13790c4bd9	\N	890bd7b6-1a3b-4bfe-ab95-cee942718d74	FROM
349bd4a4-f1a7-4c4e-aed1-58fe38017843	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bf76aa0f-db8a-4062-ba12-aaae5f06a479	0c8a91f9-4fce-4356-9bb5-4b38484f498e	50eef538-7008-4732-a6b3-8039b36305c6	100000	มดสร้างบ้าน	2025-04-01 00:00:00		\N	2026-04-22 18:58:40.224	2026-04-30 16:49:40.404	2025-04-01 00:00:00	24b40ac2-72f3-4b53-98c6-8d13790c4bd9	\N	99f90c28-22ac-4caa-9e67-406739403c06	FROM
890bd7b6-1a3b-4bfe-ab95-cee942718d74	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	c0222442-a596-46f5-89e3-b19635ba5d57	81142bbd-265d-4775-ae55-df4ea295fe4d	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	50000	ยืมทำบ้าน 20000+30000	2026-01-17 00:00:00		a41d7d63-ce2f-4cc8-9039-24442eadec60	2026-04-30 18:43:11.522	2026-04-30 18:43:11.594	2026-01-17 00:00:00	2bc891a6-e07a-46f6-9802-cf8f0e1af1e0	\N	c2097e63-2439-4109-9e5a-47225eadbe8f	TO
6ef57678-1adc-4933-9b87-4b3dfdc666d1	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	c0222442-a596-46f5-89e3-b19635ba5d57	81142bbd-265d-4775-ae55-df4ea295fe4d	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	5000	เงินเดือนแม่	2026-04-29 00:00:00		\N	2026-04-30 18:48:51.867	2026-04-30 18:48:51.867	2026-04-29 00:00:00	2bc891a6-e07a-46f6-9802-cf8f0e1af1e0	\N	188cdb62-52e2-4ebc-bfa6-35ba43316f99	TO
188cdb62-52e2-4ebc-bfa6-35ba43316f99	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	cf8ce70f-8062-47d1-9f81-deb156d029e9	50eef538-7008-4732-a6b3-8039b36305c6	5000	เงินเดือนแม่	2026-04-29 00:00:00		\N	2026-04-30 18:48:51.788	2026-04-30 18:48:51.924	2026-04-29 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	6ef57678-1adc-4933-9b87-4b3dfdc666d1	FROM
38f6ec15-b522-4176-8392-812d6172d2bc	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	dde45f0a-23a1-4c53-bc03-5a907ef5f406	81142bbd-265d-4775-ae55-df4ea295fe4d	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	1000	เงินออมแม่	2026-04-29 00:00:00		\N	2026-04-30 18:49:18.057	2026-04-30 18:49:18.057	2026-04-29 00:00:00	f428d88f-9a22-4d84-b159-db6ce64fb7fc	\N	8413c3bc-9289-48d1-84f8-2274b1d0c1c3	TO
8413c3bc-9289-48d1-84f8-2274b1d0c1c3	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	2f1955b9-333d-4ced-96ec-e33cfdbb9f5d	abaaab5b-cbd5-488b-b8a2-c6f9f2270203	1000	เงินออมแม่	2026-04-29 00:00:00		\N	2026-04-30 18:49:17.991	2026-04-30 18:49:18.097	2026-04-29 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	38f6ec15-b522-4176-8392-812d6172d2bc	FROM
92d5c1ba-54cc-406f-ac0a-37bb35560044	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	a9debac2-2e2e-450c-ada1-2d652c557801	3dc7d7da-7d24-40d5-a79c-eeb7f2df7f26	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	38000	ประกันแม่	2026-03-06 00:00:00		\N	2026-04-30 16:43:24.215	2026-04-30 16:43:24.215	2026-03-06 00:00:00	b8f82762-46ef-4555-afcd-784360c432ab	\N	\N	TO
20a953d4-d04a-4b69-bdd1-748da98d1fa4	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4c0cac9c-1cc3-4732-bc76-0244a90f3a3f	0c8a91f9-4fce-4356-9bb5-4b38484f498e	50eef538-7008-4732-a6b3-8039b36305c6	210000	ออมสิน บัญชีเงินซื้อรถ	2026-03-28 00:00:00		\N	2026-04-22 17:07:53.781	2026-04-30 16:46:11.424	2026-03-28 00:00:00	b3c3d325-dfea-4544-8bfb-764e00f4f8ad	\N	93bf313d-97b0-4a4d-abd2-bbe932630b50	FROM
1cec6674-7aac-4379-88f5-9f62a8b14d00	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	ddf4f482-12d3-48ec-bdc7-fdd8faa8a46a	72d4a1d5-86f3-42c1-ad80-ebef0851a0a8	5f1440e5-4ecc-484c-a3ec-b82a47fd8c6d	1771.25	ปรับยอดจากปัจจุบัน 30-Apr-26	2026-04-30 00:00:00		\N	2026-04-30 16:56:18.474	2026-04-30 16:56:18.474	2026-04-30 00:00:00	c45faa95-e927-499c-90bb-78e42ac13c29	\N	\N	TO
0c7b04e1-e018-4875-ac3b-98b112e2378b	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	bdc303b8-199c-432d-9a43-2ceee54b4adf	0c8a91f9-4fce-4356-9bb5-4b38484f498e	50eef538-7008-4732-a6b3-8039b36305c6	10000	ซื้อหุ้น Microsoft + 	2026-04-29 00:00:00		\N	2026-04-30 16:51:57.884	2026-04-30 16:51:57.884	2026-04-29 00:00:00	d09a8a93-f3ae-44fe-9b78-7b24271c3ed0	\N	aa066b3c-ebb3-49d2-9edd-9d58ff507bc4	FROM
aa066b3c-ebb3-49d2-9edd-9d58ff507bc4	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	d5c5f882-4edd-4f49-8e88-677bd1a1f9cb	85ae760d-31e6-444c-b392-431fa86ff590	5f1440e5-4ecc-484c-a3ec-b82a47fd8c6d	10000	ซื้อหุ้น Microsoft + 	2026-04-29 00:00:00		\N	2026-04-30 16:51:57.811	2026-04-30 16:51:57.94	2026-04-29 00:00:00	bab7389e-b573-4e02-ba66-45129c9a3bdf	\N	0c7b04e1-e018-4875-ac3b-98b112e2378b	TO
a86d29e4-9c97-475f-8857-6e744985013b	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	d176b133-d7e7-4a5e-bd77-701cef7f7bca	598e3174-e46b-4dab-ba59-113fbacccd63	abaaab5b-cbd5-488b-b8a2-c6f9f2270203	34876	ปรับยอดจากปัจจุบัน 30-Apr-26	2026-04-30 00:00:00		\N	2026-04-30 16:57:11.638	2026-04-30 16:57:11.638	2026-04-30 00:00:00	6817f6d3-94d4-4841-a28d-1444b6a3a8c6	\N	\N	TO
55928815-d0db-44ec-8c22-eafc08c8fb85	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	850cb1a3-c642-4882-a3a6-2d047ccac110	598e3174-e46b-4dab-ba59-113fbacccd63	abaaab5b-cbd5-488b-b8a2-c6f9f2270203	3000	ปรับยอดจากปัจจุบัน 30-Apr-26	2026-04-30 00:00:00		\N	2026-04-30 16:58:13.299	2026-04-30 16:58:13.299	\N	d273de1a-b925-4546-9835-135de8f46716	\N	\N	TO
1da9ba6a-67a1-4c9a-b23c-6e3950406b31	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	568b2711-bec4-4793-b606-14e4c3a08817	15bb00ee-0c3d-42a2-afb6-b8c9e4423e33	37102991-baf1-4f98-8608-0d57f260ccce	2000	ปรับยอดจากปัจจุบัน 30-Apr-26	2026-04-30 00:00:00		\N	2026-04-30 16:58:57.21	2026-04-30 16:58:57.21	2026-04-30 00:00:00	a6d588d1-2a65-46fd-94c1-405762083521	\N	\N	TO
4a5e3903-6845-48fd-b970-345733e47233	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	1a18f846-019f-4f24-82b5-305fa809cccd	d709a0ba-8a12-4e99-bf5b-84f5372b4fcc	37102991-baf1-4f98-8608-0d57f260ccce	200	ปรับยอดจากปัจจุบัน 30-Apr-26	2026-04-30 00:00:00		\N	2026-04-30 16:59:37.526	2026-04-30 16:59:37.526	2026-04-30 00:00:00	51b4fd2e-84b8-4f14-b4b0-e5b3ee217e28	\N	\N	TO
d7f86205-f151-42e9-b079-0d6f2eb8c7c7	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	8557fae0-d2a7-439e-ba8b-3f5465423542	48faa8c5-2561-428a-a8a8-ce3e456e7f1c	37102991-baf1-4f98-8608-0d57f260ccce	900	ปรับยอดจากปัจจุบัน 30-Apr-26	2026-05-01 00:00:00		\N	2026-04-30 17:00:35.343	2026-04-30 17:00:35.343	2026-05-01 00:00:00	7a6855f6-0008-417b-a5df-d5d279802489	\N	\N	TO
ecde7e7a-766c-494d-b3db-86a0622504fc	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	5e1bb381-4871-46f2-93d8-bb339304efce	9bc0d553-b8d2-4aaf-a5be-c2956b3600fb	5f1440e5-4ecc-484c-a3ec-b82a47fd8c6d	200	ปรับยอดจากปัจจุบัน 30-Apr-26	2026-05-01 00:00:00		\N	2026-04-30 17:01:07.898	2026-04-30 17:01:07.898	2026-05-01 00:00:00	fcce5ed4-d10a-437e-8807-1114e98f8192	\N	\N	TO
2b811bc7-4bcf-4642-a1e1-430698b29093	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	736e95ba-15ca-408c-a02d-71874e3e54e3	85ae760d-31e6-444c-b392-431fa86ff590	5f1440e5-4ecc-484c-a3ec-b82a47fd8c6d	24206.47	ปรับยอดจากปัจจุบัน 30-Apr-26	2026-05-01 00:00:00		\N	2026-04-30 17:02:03.772	2026-04-30 17:02:03.772	\N	7f0439bd-700c-4a10-b5ac-db8d12eca0a3	\N	\N	TO
24ad4c51-381d-4f78-8835-0ef419b33c49	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	d5c5f882-4edd-4f49-8e88-677bd1a1f9cb	85ae760d-31e6-444c-b392-431fa86ff590	5f1440e5-4ecc-484c-a3ec-b82a47fd8c6d	3516.56	ปรับยอดจากปัจจุบัน 30-Apr-26 (Rate เงิน)	2026-05-01 00:00:00		\N	2026-04-30 17:04:02.596	2026-04-30 17:04:02.596	2026-05-01 00:00:00	bab7389e-b573-4e02-ba66-45129c9a3bdf	\N	\N	TO
83a02337-3908-4325-a079-93482674bf13	32839490-a7f5-4730-a78f-0923f494bf47	2dc4de80-5323-4859-81f0-caf914fc5f60	4272c985-b852-4143-ac4f-ac635443de8b	9bc0d553-b8d2-4aaf-a5be-c2956b3600fb	5f1440e5-4ecc-484c-a3ec-b82a47fd8c6d	14533.02	ปรับยอดจากปัจจุบัน 30-Apr-26 (ตาม Rate ไม่กำไร)	2026-05-01 00:00:00		\N	2026-04-30 17:05:33.703	2026-04-30 17:05:33.703	2026-05-01 00:00:00	ba7fa51f-8045-4f07-8050-61e7490a0f49	\N	\N	TO
\.


--
-- Data for Name: TransactionCategory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TransactionCategory" (id, "organizationId", name, "typeId", "isActive", "createdAt", "updatedAt") FROM stdin;
99d3c427-dbe5-4da0-91f1-ff458182d3e0	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	เงินเดือน	78154f8c-300a-4a1e-8452-b18d293dc36a	t	2026-04-30 18:13:14.666	2026-04-30 18:13:14.666
19db5b6c-2547-4120-b4ae-cfd4c8d20165	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	รายได้อื่น	78154f8c-300a-4a1e-8452-b18d293dc36a	t	2026-04-30 18:13:14.683	2026-04-30 18:13:14.683
d920c362-516a-46ba-8d1b-020f93d54aab	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	ค่าใช้จ่ายประจำ	b60cb864-6ac8-4d46-8e52-106951c8228c	t	2026-04-30 18:13:14.7	2026-04-30 18:13:14.7
f800c894-403c-4dd8-bd36-5ff71508efbf	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	ค่าใช้จ่ายส่วนตัว	b60cb864-6ac8-4d46-8e52-106951c8228c	t	2026-04-30 18:13:14.714	2026-04-30 18:13:14.714
4727017e-2958-45b2-a204-857f23420d7b	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	ครอบครัว	b60cb864-6ac8-4d46-8e52-106951c8228c	t	2026-04-30 18:13:14.726	2026-04-30 18:13:14.726
c1dc7bee-b74d-43ae-b097-fc9698003368	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	ท่องเที่ยว	b0b12e36-fb22-47af-8e75-56e72eb3584f	t	2026-04-30 18:13:14.737	2026-04-30 18:13:14.737
548db6d1-de93-4e02-a799-dc671bfa3289	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	ค่าใช้จ่ายรถ	b0b12e36-fb22-47af-8e75-56e72eb3584f	t	2026-04-30 18:13:14.748	2026-04-30 18:13:14.748
a66ce3c7-be69-4d4a-b9d9-fef139874b8b	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	บริจาค	b0b12e36-fb22-47af-8e75-56e72eb3584f	t	2026-04-30 18:13:14.759	2026-04-30 18:13:14.759
1a40079f-8a54-414d-bffc-299ca7a8deec	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	เงินออม	b0b12e36-fb22-47af-8e75-56e72eb3584f	t	2026-04-30 18:13:14.769	2026-04-30 18:13:14.769
16254a92-ea26-4d7e-b154-0c35131118c2	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	เงินฉุกเฉิน	b0b12e36-fb22-47af-8e75-56e72eb3584f	t	2026-04-30 18:13:14.778	2026-04-30 18:13:14.778
994f27ad-e4b9-4c56-85a0-5286df799ac4	32839490-a7f5-4730-a78f-0923f494bf47	ค่าใช้จ่ายส่วนตัว	50eef538-7008-4732-a6b3-8039b36305c6	t	2026-03-25 10:15:34.215	2026-03-25 10:15:34.215
789d64f0-7782-4c66-a2de-dbac6ea77fee	32839490-a7f5-4730-a78f-0923f494bf47	บริจาค	50eef538-7008-4732-a6b3-8039b36305c6	t	2026-03-25 11:13:26.992	2026-03-25 11:13:26.992
de15062e-86de-4572-90bb-2a8b68448b4a	32839490-a7f5-4730-a78f-0923f494bf47	รายจ่ายครอบครัว	50eef538-7008-4732-a6b3-8039b36305c6	t	2026-03-25 10:15:34.216	2026-04-11 11:49:40.293
d1450fd3-8880-4dff-90c8-d606ffc206fc	32839490-a7f5-4730-a78f-0923f494bf47	ชำระหนี้	dd3f9c0d-6554-4895-a57f-387acf6fe4f5	t	2026-03-25 10:15:34.226	2026-03-25 10:15:34.226
92e80bf4-bdb1-47f2-9795-4a5284bb5c98	32839490-a7f5-4730-a78f-0923f494bf47	ยืมเงินภายใน	e0309b7f-8890-4cff-a3c1-c24058ed9b05	t	2026-03-25 14:01:14.608	2026-03-25 14:01:14.608
bee0dcc8-17dd-4881-bff0-59bc824aed1f	32839490-a7f5-4730-a78f-0923f494bf47	เงินฉุกเฉิน	e0309b7f-8890-4cff-a3c1-c24058ed9b05	t	2026-03-25 10:15:34.221	2026-03-25 16:59:53.879
aaa2dcef-080b-46a9-a902-e15f924984eb	32839490-a7f5-4730-a78f-0923f494bf47	คืนเงินภายใน	e8804a23-dfc8-4b85-ac55-808c22bd5299	t	2026-03-25 17:35:16.744	2026-03-25 17:35:16.744
7e99a6eb-1877-400a-b2d3-a9c451c4ba2a	32839490-a7f5-4730-a78f-0923f494bf47	เงินซื้อรถ	37102991-baf1-4f98-8608-0d57f260ccce	t	2026-03-25 10:15:34.222	2026-03-25 10:16:31.525
48faa8c5-2561-428a-a8a8-ce3e456e7f1c	32839490-a7f5-4730-a78f-0923f494bf47	ท่องเที่ยว	37102991-baf1-4f98-8608-0d57f260ccce	t	2026-03-25 10:15:34.218	2026-03-25 10:16:31.529
164b962c-bfb0-4bdd-a7d5-81bc6f643e5f	ee81df9d-bb14-419b-bd49-d4c77b4d4214	เงินเดือน	fb7691fb-9f04-4375-9bc7-d40479e092d8	t	2026-04-24 11:44:38.629	2026-04-24 11:44:38.629
a3f95e7b-d4d9-4ced-ae65-2fabe1dbaba3	ee81df9d-bb14-419b-bd49-d4c77b4d4214	รายได้อื่น	fb7691fb-9f04-4375-9bc7-d40479e092d8	t	2026-04-24 11:44:38.632	2026-04-24 11:44:38.632
d4d92787-beb7-4026-b790-d4078d924fe2	ee81df9d-bb14-419b-bd49-d4c77b4d4214	ค่าใช้จ่ายประจำ	8aaadd78-bd5d-40ea-b4b3-ab0b7837ca35	t	2026-04-24 11:44:38.635	2026-04-24 11:44:38.635
8fc7ffb4-39b9-4ce4-af1a-ca082e52ab03	ee81df9d-bb14-419b-bd49-d4c77b4d4214	ค่าใช้จ่ายส่วนตัว	8aaadd78-bd5d-40ea-b4b3-ab0b7837ca35	t	2026-04-24 11:44:38.637	2026-04-24 11:44:38.637
7af4b14d-97e9-4a49-9d10-bd3ea456ec1a	ee81df9d-bb14-419b-bd49-d4c77b4d4214	ครอบครัว	8aaadd78-bd5d-40ea-b4b3-ab0b7837ca35	t	2026-04-24 11:44:38.64	2026-04-24 11:44:38.64
03795623-ac7f-4900-b417-d2e18109cf7f	ee81df9d-bb14-419b-bd49-d4c77b4d4214	ท่องเที่ยว	d9c3a6f7-32bb-467e-91b8-acbe0463ad17	t	2026-04-24 11:44:38.642	2026-04-24 11:44:38.642
8bd761c0-6f97-4e56-ad74-0196cb7ad055	ee81df9d-bb14-419b-bd49-d4c77b4d4214	ค่าใช้จ่ายรถ	d9c3a6f7-32bb-467e-91b8-acbe0463ad17	t	2026-04-24 11:44:38.644	2026-04-24 11:44:38.644
e833c7b6-0cfe-48ec-9dfc-51d3a0cce764	ee81df9d-bb14-419b-bd49-d4c77b4d4214	บริจาค	d9c3a6f7-32bb-467e-91b8-acbe0463ad17	t	2026-04-24 11:44:38.647	2026-04-24 11:44:38.647
15bb00ee-0c3d-42a2-afb6-b8c9e4423e33	32839490-a7f5-4730-a78f-0923f494bf47	ค่าใช้จ่ายรถ	37102991-baf1-4f98-8608-0d57f260ccce	t	2026-03-25 10:15:34.219	2026-03-25 10:16:31.53
d709a0ba-8a12-4e99-bf5b-84f5372b4fcc	32839490-a7f5-4730-a78f-0923f494bf47	บริจาครายปี	37102991-baf1-4f98-8608-0d57f260ccce	t	2026-03-28 12:21:41.22	2026-04-11 11:49:24.768
85ae760d-31e6-444c-b392-431fa86ff590	32839490-a7f5-4730-a78f-0923f494bf47	ลงทุนหุ้น	5f1440e5-4ecc-484c-a3ec-b82a47fd8c6d	t	2026-03-25 10:15:34.223	2026-03-25 10:15:34.223
72d4a1d5-86f3-42c1-ad80-ebef0851a0a8	32839490-a7f5-4730-a78f-0923f494bf47	ลงทุนธุรกิจ	5f1440e5-4ecc-484c-a3ec-b82a47fd8c6d	t	2026-03-25 10:15:34.225	2026-03-25 10:15:34.225
598e3174-e46b-4dab-ba59-113fbacccd63	32839490-a7f5-4730-a78f-0923f494bf47	เงินออม	abaaab5b-cbd5-488b-b8a2-c6f9f2270203	t	2026-03-25 10:15:34.22	2026-03-25 16:58:37.045
2f1955b9-333d-4ced-96ec-e33cfdbb9f5d	32839490-a7f5-4730-a78f-0923f494bf47	ออมครอบครัว	abaaab5b-cbd5-488b-b8a2-c6f9f2270203	t	2026-03-25 11:13:26.965	2026-04-11 11:49:47.049
cf8ce70f-8062-47d1-9f81-deb156d029e9	32839490-a7f5-4730-a78f-0923f494bf47	ครอบครัว	50eef538-7008-4732-a6b3-8039b36305c6	t	2026-04-30 13:05:31.192	2026-04-30 13:05:31.192
81a7bd00-a24a-466f-9301-5d7ac0ac1ed4	32839490-a7f5-4730-a78f-0923f494bf47	เงินเดือน	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	t	2026-03-25 10:15:34.21	2026-03-25 10:15:34.21
3dc7d7da-7d24-40d5-a79c-eeb7f2df7f26	32839490-a7f5-4730-a78f-0923f494bf47	รายได้อื่น	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	t	2026-03-25 10:15:34.212	2026-03-25 10:15:34.212
bc8a6407-a054-49fe-9269-a0bae2ab51ed	32839490-a7f5-4730-a78f-0923f494bf47	ปรับยอดค่าใช่จ่ายที่จำไม่ได้	50eef538-7008-4732-a6b3-8039b36305c6	t	2026-04-22 14:53:18.346	2026-04-22 14:53:18.346
15ae3505-3233-44a4-a0ba-d6c776567cc2	32839490-a7f5-4730-a78f-0923f494bf47	ค่าใช้จ่ายประจำ	50eef538-7008-4732-a6b3-8039b36305c6	t	2026-03-25 10:15:34.214	2026-03-25 10:15:34.214
64f06cc6-7a38-4b01-9e91-dfff28f5dc9c	32839490-a7f5-4730-a78f-0923f494bf47	ลงทุนทอง	5f1440e5-4ecc-484c-a3ec-b82a47fd8c6d	t	2026-03-25 10:15:34.224	2026-04-30 13:20:25.634
9036924f-322b-4d8c-b60c-c0f844e4c576	32839490-a7f5-4730-a78f-0923f494bf47	ยกยอด	50eef538-7008-4732-a6b3-8039b36305c6	t	2026-04-17 04:56:39.703	2026-04-30 13:21:14.491
855f3290-86a3-49aa-846c-951921f8beaf	32839490-a7f5-4730-a78f-0923f494bf47	ยกยอด	5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	t	2026-04-17 04:56:39.69	2026-04-30 13:21:23.304
68d6355f-b293-4061-9fce-1be279f10d11	ee81df9d-bb14-419b-bd49-d4c77b4d4214	เงินออม	d9c3a6f7-32bb-467e-91b8-acbe0463ad17	t	2026-04-24 11:44:38.649	2026-04-24 11:44:38.649
c6674ad3-1d80-418c-9c63-d17dd93585d9	ee81df9d-bb14-419b-bd49-d4c77b4d4214	เงินฉุกเฉิน	d9c3a6f7-32bb-467e-91b8-acbe0463ad17	t	2026-04-24 11:44:38.652	2026-04-24 11:44:38.652
99e75298-1361-4e53-b00a-0f097fa431e6	ee81df9d-bb14-419b-bd49-d4c77b4d4214	เงินซื้อรถ	d9c3a6f7-32bb-467e-91b8-acbe0463ad17	t	2026-04-24 11:44:38.653	2026-04-24 11:44:38.653
d5e2f744-36ed-44cb-9a1a-bd7dd1911c79	ee81df9d-bb14-419b-bd49-d4c77b4d4214	ลงทุนหุ้น	d9c3a6f7-32bb-467e-91b8-acbe0463ad17	t	2026-04-24 11:44:38.655	2026-04-24 11:44:38.655
731337bf-0a71-4806-858a-4299b5020f43	ee81df9d-bb14-419b-bd49-d4c77b4d4214	ลงทุนทอง	d9c3a6f7-32bb-467e-91b8-acbe0463ad17	t	2026-04-24 11:44:38.657	2026-04-24 11:44:38.657
4f2e0b6d-5b62-46b1-aba0-470f4f48f6c5	ee81df9d-bb14-419b-bd49-d4c77b4d4214	ลงทุนธุรกิจ	d9c3a6f7-32bb-467e-91b8-acbe0463ad17	t	2026-04-24 11:44:38.659	2026-04-24 11:44:38.659
6b742676-ca34-4182-a37a-b8ff133da86c	ee81df9d-bb14-419b-bd49-d4c77b4d4214	ชำระหนี้	87265b90-d353-4279-916b-076e419cf8ca	t	2026-04-24 11:44:38.662	2026-04-24 11:44:38.662
f63361b8-33f8-4c8b-bb55-4e9027abf3dd	ee81df9d-bb14-419b-bd49-d4c77b4d4214	ยืมเงิน	537e4e50-3c14-47b0-a72e-1b80e7d623b1	t	2026-04-24 11:44:38.664	2026-04-24 11:44:38.664
7ffb2937-829a-4aa0-9451-7e8391ce9a6c	ee81df9d-bb14-419b-bd49-d4c77b4d4214	คืนเงิน	05cc5fee-f8d6-4b82-8c0b-efa878e65676	t	2026-04-24 11:44:38.666	2026-04-24 11:44:38.666
0c8a91f9-4fce-4356-9bb5-4b38484f498e	32839490-a7f5-4730-a78f-0923f494bf47	โอนออกภายใน	e9b974cf-b58c-4df5-aeb4-e3d312036f55	t	2026-04-11 11:44:40.619	2026-04-22 17:43:10.521
81142bbd-265d-4775-ae55-df4ea295fe4d	32839490-a7f5-4730-a78f-0923f494bf47	โอนเข้าภายใน	a634ddc8-ac5f-41d8-8461-9b42f69102f6	t	2026-04-22 16:09:52.055	2026-04-22 17:43:10.526
823a0c63-d4e0-48c1-8622-1ef2d9751fbf	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	เงินซื้อรถ	b0b12e36-fb22-47af-8e75-56e72eb3584f	t	2026-04-30 18:13:14.787	2026-04-30 18:13:14.787
24baa179-5c69-4a81-b03e-d425326109c2	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	ลงทุนหุ้น	b0b12e36-fb22-47af-8e75-56e72eb3584f	t	2026-04-30 18:13:14.798	2026-04-30 18:13:14.798
8ca8bfa8-ab72-4c04-b797-000eb29d18c8	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	ลงทุนทอง	b0b12e36-fb22-47af-8e75-56e72eb3584f	t	2026-04-30 18:13:14.808	2026-04-30 18:13:14.808
8a86b71e-482e-48e5-a23b-0a60e2fe6075	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	ลงทุนธุรกิจ	b0b12e36-fb22-47af-8e75-56e72eb3584f	t	2026-04-30 18:13:14.817	2026-04-30 18:13:14.817
7bb1c471-5127-473e-9556-e6402f5d0c71	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	ชำระหนี้	3411e592-cf1b-48b5-9a6e-d61ade7ceb6d	t	2026-04-30 18:13:14.826	2026-04-30 18:13:14.826
2f3038a7-a8ac-4337-9da2-643864d70e15	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	ยืมเงิน	11f73209-28be-4e4c-a0a4-b45991226a35	t	2026-04-30 18:13:14.837	2026-04-30 18:13:14.837
0c315e4e-b06f-4b1b-b692-e73089adfa51	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	คืนเงิน	0d9502a3-6330-4fc3-8ea5-71358d020e86	t	2026-04-30 18:13:14.847	2026-04-30 18:13:14.847
be4410bb-51d6-4db5-b7d5-a09a00821ba0	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	เงินเดือน	137065dd-2161-47bd-920a-11dd873988e7	t	2026-04-30 18:13:15.227	2026-04-30 18:13:15.227
f70b6882-22e4-457d-b2b9-885b43b2c1a4	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	รายได้อื่น	137065dd-2161-47bd-920a-11dd873988e7	t	2026-04-30 18:13:15.235	2026-04-30 18:13:15.235
5ca4d011-3c72-4b5f-816a-eb0e46b769e7	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	ค่าใช้จ่ายประจำ	3ab63478-f6fd-4a55-bbe7-4efe213c2b7b	t	2026-04-30 18:13:15.244	2026-04-30 18:13:15.244
96b830d5-3418-4e85-a3be-2f362ced8047	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	ค่าใช้จ่ายส่วนตัว	3ab63478-f6fd-4a55-bbe7-4efe213c2b7b	t	2026-04-30 18:13:15.254	2026-04-30 18:13:15.254
adb2c257-a0aa-4ea6-af5c-2b86f5fd0c4b	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	ครอบครัว	3ab63478-f6fd-4a55-bbe7-4efe213c2b7b	t	2026-04-30 18:13:15.263	2026-04-30 18:13:15.263
db9392ec-bbdb-4773-8693-58aacf5bd36c	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	ท่องเที่ยว	489782c9-c514-4d64-b4f8-0a73211e2402	t	2026-04-30 18:13:15.274	2026-04-30 18:13:15.274
652e5d53-8017-424e-a814-21c5c4f52412	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	ค่าใช้จ่ายรถ	489782c9-c514-4d64-b4f8-0a73211e2402	t	2026-04-30 18:13:15.284	2026-04-30 18:13:15.284
f9fa3678-feeb-4aa7-9321-383fb48871a6	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	บริจาค	489782c9-c514-4d64-b4f8-0a73211e2402	t	2026-04-30 18:13:15.293	2026-04-30 18:13:15.293
8a612d6f-8312-4ff7-b18b-ce693e51ff03	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	เงินออม	489782c9-c514-4d64-b4f8-0a73211e2402	t	2026-04-30 18:13:15.302	2026-04-30 18:13:15.302
93e941ca-01f0-4a93-9791-429a005f35e5	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	เงินฉุกเฉิน	489782c9-c514-4d64-b4f8-0a73211e2402	t	2026-04-30 18:13:15.311	2026-04-30 18:13:15.311
3adf234c-e18f-41b2-8a50-9ebd1d6b6dad	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	เงินซื้อรถ	489782c9-c514-4d64-b4f8-0a73211e2402	t	2026-04-30 18:13:15.32	2026-04-30 18:13:15.32
30464b1a-b081-4baf-9cc7-8dfe2d9f5251	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	ลงทุนหุ้น	489782c9-c514-4d64-b4f8-0a73211e2402	t	2026-04-30 18:13:15.328	2026-04-30 18:13:15.328
313de495-49f3-4f08-a426-3d3f7117485e	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	ลงทุนทอง	489782c9-c514-4d64-b4f8-0a73211e2402	t	2026-04-30 18:13:15.337	2026-04-30 18:13:15.337
e5ffddc3-0dfb-4af1-9af9-6805b73d0ca1	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	ลงทุนธุรกิจ	489782c9-c514-4d64-b4f8-0a73211e2402	t	2026-04-30 18:13:15.346	2026-04-30 18:13:15.346
7365c6e8-6582-49e6-af55-ab5a7f357a5b	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	ชำระหนี้	2d591397-9a1f-4950-8c2e-0cc7f0023dea	t	2026-04-30 18:13:15.356	2026-04-30 18:13:15.356
33f78dee-7dc3-4dc7-ba84-a6c4a4f6b67e	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	ยืมเงิน	7ca3ab36-0a76-4146-80ab-56488958b174	t	2026-04-30 18:13:15.366	2026-04-30 18:13:15.366
bb70551d-1cb6-4468-8d48-cbc4249bdbb1	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	คืนเงิน	11372997-f17c-4a1e-ad55-74b675025e5b	t	2026-04-30 18:13:15.375	2026-04-30 18:13:15.375
484cddf8-8ca8-490c-acff-8127ff8b8365	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	โอนเงิน	296e4c31-4910-49f5-90d9-1c635161a48a	t	2026-04-30 18:13:15.768	2026-04-30 18:13:15.768
9bc0d553-b8d2-4aaf-a5be-c2956b3600fb	32839490-a7f5-4730-a78f-0923f494bf47	ลงทุนกองทุน	5f1440e5-4ecc-484c-a3ec-b82a47fd8c6d	t	2026-04-30 13:35:34.31	2026-04-30 13:35:34.31
93ad5045-adae-41d9-8202-d0f3ec20a0f3	32839490-a7f5-4730-a78f-0923f494bf47	ปล่อยกู้	5f1440e5-4ecc-484c-a3ec-b82a47fd8c6d	t	2026-04-30 13:35:46.025	2026-04-30 13:35:46.025
42d92ccd-3101-4120-9d18-4bbcd7456038	\N	เงินเดือน	5d7b8454-b207-4a3c-9c84-1cdfb219a61d	t	2026-04-30 13:09:11.165	2026-04-30 13:09:11.165
648ada80-727b-409c-bae9-04afe928812d	\N	รายได้อื่น	5d7b8454-b207-4a3c-9c84-1cdfb219a61d	t	2026-04-30 13:09:11.18	2026-04-30 13:09:11.18
ac8662f1-f21d-47ad-be77-0240e4a3d583	\N	ค่าใช้จ่ายประจำ	d2851f07-d208-406d-b185-838eef9370c0	t	2026-04-30 13:09:11.198	2026-04-30 13:09:11.198
d6ba8979-ec7c-40b0-a9a9-edd047460926	\N	ค่าใช้จ่ายส่วนตัว	d2851f07-d208-406d-b185-838eef9370c0	t	2026-04-30 13:09:11.213	2026-04-30 13:09:11.213
d665e5a2-f6b1-4432-b14e-102cc129aa8d	\N	ครอบครัว	d2851f07-d208-406d-b185-838eef9370c0	t	2026-04-30 13:09:11.227	2026-04-30 13:09:11.227
86734916-27c3-407f-afcc-20e6d95a8f88	\N	ท่องเที่ยว	1d4b402e-adc6-4aab-98f5-ab8cb7bdb7fd	t	2026-04-30 13:09:11.241	2026-04-30 13:09:11.241
4f4c6bce-5ed2-43f3-86bf-38fcb101d58d	\N	ค่าใช้จ่ายรถ	1d4b402e-adc6-4aab-98f5-ab8cb7bdb7fd	t	2026-04-30 13:09:11.253	2026-04-30 13:09:11.253
d38b7568-c937-4962-8857-dbb9a5a03edd	32839490-a7f5-4730-a78f-0923f494bf47	เงินฉุกเฉิน	abaaab5b-cbd5-488b-b8a2-c6f9f2270203	t	2026-04-30 13:22:03.396	2026-04-30 13:22:03.396
b3c0f717-4ce3-4990-a8d7-1dfa2d1d3126	\N	บริจาค	1d4b402e-adc6-4aab-98f5-ab8cb7bdb7fd	t	2026-04-30 13:09:11.266	2026-04-30 13:09:11.266
6a02d87f-38cc-412d-8097-44d94c4a190a	\N	เงินออม	1d4b402e-adc6-4aab-98f5-ab8cb7bdb7fd	t	2026-04-30 13:09:11.279	2026-04-30 13:09:11.279
87481bec-6558-47a4-bfbb-776248930f2d	\N	เงินฉุกเฉิน	1d4b402e-adc6-4aab-98f5-ab8cb7bdb7fd	t	2026-04-30 13:09:11.292	2026-04-30 13:09:11.292
804685b3-c589-4251-a061-9508734600e2	\N	เงินซื้อรถ	1d4b402e-adc6-4aab-98f5-ab8cb7bdb7fd	t	2026-04-30 13:09:11.304	2026-04-30 13:09:11.304
2b52e19f-daa5-40a9-a8b9-07947b7b14e2	\N	ลงทุนหุ้น	1d4b402e-adc6-4aab-98f5-ab8cb7bdb7fd	t	2026-04-30 13:09:11.317	2026-04-30 13:09:11.317
bcdfddde-9d13-438f-93e6-f52deb58a030	\N	ลงทุนทอง	1d4b402e-adc6-4aab-98f5-ab8cb7bdb7fd	t	2026-04-30 13:09:11.329	2026-04-30 13:09:11.329
6d79d585-e895-4f47-be9d-a5ec5a5b4b1f	\N	ลงทุนธุรกิจ	1d4b402e-adc6-4aab-98f5-ab8cb7bdb7fd	t	2026-04-30 13:09:11.341	2026-04-30 13:09:11.341
fc1f455a-242b-41f3-a01a-875506486d40	\N	ชำระหนี้	cddcaf96-e894-4c6a-91d3-19619f85293f	t	2026-04-30 13:09:11.353	2026-04-30 13:09:11.353
65dccf79-9686-4679-a416-ae586e11cab6	\N	ยืมเงิน	83664b80-589d-4835-9ac6-ac71312cf190	t	2026-04-30 13:09:11.365	2026-04-30 13:09:11.365
f1af21d0-8446-4895-8b43-e69b19ffa22d	\N	คืนเงิน	c6b2ea22-c543-485e-aab1-9e7f9a113d17	t	2026-04-30 13:09:11.378	2026-04-30 13:09:11.378
935f1d45-8135-48d1-9a31-fe4ae6243751	\N	เงินเดือน	2d7b9fac-673e-4918-9ee6-da3a691768ac	t	2026-04-30 13:09:11.814	2026-04-30 13:09:11.814
bbe5f974-72a2-455f-82c4-d829caec3f5c	\N	รายได้อื่น	2d7b9fac-673e-4918-9ee6-da3a691768ac	t	2026-04-30 13:09:11.826	2026-04-30 13:09:11.826
b7b838f0-4d89-4794-8029-c9cfc22e15d7	\N	ค่าใช้จ่ายประจำ	e33d7451-ccde-4303-a752-75d2f92ce214	t	2026-04-30 13:09:11.838	2026-04-30 13:09:11.838
166532f5-3637-4424-aa11-8e9dd5f80c98	\N	ค่าใช้จ่ายส่วนตัว	e33d7451-ccde-4303-a752-75d2f92ce214	t	2026-04-30 13:09:11.85	2026-04-30 13:09:11.85
4d852f27-6eb5-4828-89d9-7d90f35770bb	\N	ครอบครัว	e33d7451-ccde-4303-a752-75d2f92ce214	t	2026-04-30 13:09:11.862	2026-04-30 13:09:11.862
07a457f5-1878-4d08-b216-53d19d37a9b1	\N	ท่องเที่ยว	331af661-2225-474c-a808-9c837345022b	t	2026-04-30 13:09:11.875	2026-04-30 13:09:11.875
442d0f6f-8f45-4324-a905-c6bcb6d1314a	\N	ค่าใช้จ่ายรถ	331af661-2225-474c-a808-9c837345022b	t	2026-04-30 13:09:11.887	2026-04-30 13:09:11.887
1c600111-247f-47b9-a9a9-dd59eda76b84	\N	บริจาค	331af661-2225-474c-a808-9c837345022b	t	2026-04-30 13:09:11.899	2026-04-30 13:09:11.899
6d35e2e3-e278-4ccf-87c8-84eac1195de8	\N	เงินออม	331af661-2225-474c-a808-9c837345022b	t	2026-04-30 13:09:11.911	2026-04-30 13:09:11.911
7855bcc3-fe11-4c55-90c1-450c2d9a16c6	\N	เงินฉุกเฉิน	331af661-2225-474c-a808-9c837345022b	t	2026-04-30 13:09:11.922	2026-04-30 13:09:11.922
0809afea-550b-4954-b193-5a8048eeb7ee	\N	เงินซื้อรถ	331af661-2225-474c-a808-9c837345022b	t	2026-04-30 13:09:11.934	2026-04-30 13:09:11.934
463370e9-5afb-4c94-9b03-7949d064aee6	\N	ลงทุนหุ้น	331af661-2225-474c-a808-9c837345022b	t	2026-04-30 13:09:11.946	2026-04-30 13:09:11.946
1eb980ca-3ed0-491c-9a01-e84f5283c48b	\N	ลงทุนทอง	331af661-2225-474c-a808-9c837345022b	t	2026-04-30 13:09:11.958	2026-04-30 13:09:11.958
e5954705-adce-421f-8e4f-34783bd69d5e	\N	ลงทุนธุรกิจ	331af661-2225-474c-a808-9c837345022b	t	2026-04-30 13:09:11.97	2026-04-30 13:09:11.97
b2315bfd-4841-4f2a-9a54-b7e3e46e92de	\N	ชำระหนี้	971e4b40-cc32-4f8c-8e13-811e0a016909	t	2026-04-30 13:09:11.982	2026-04-30 13:09:11.982
b80c3d4b-b05c-4edc-b290-8e49a091c75e	\N	ยืมเงิน	f7c2170c-1633-4c78-a7b2-1051e4498699	t	2026-04-30 13:09:11.994	2026-04-30 13:09:11.994
8a8a3bc1-b4e6-40dc-850f-d503932f3bac	\N	คืนเงิน	d0203f0a-f5dc-47ca-b19a-f35138701b77	t	2026-04-30 13:09:12.006	2026-04-30 13:09:12.006
8a1ce800-af12-46d2-9502-eb643a43840d	\N	โอนเงิน	c513c61b-be4d-48ad-b435-082636644f8f	t	2026-04-30 13:09:12.525	2026-04-30 13:09:12.525
\.


--
-- Data for Name: TransactionType; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TransactionType" (id, "organizationId", name, behavior, "isActive", "createdAt", "updatedAt") FROM stdin;
a634ddc8-ac5f-41d8-8461-9b42f69102f6	\N	รายรับ	INCOME	t	2026-03-23 07:24:44.5	2026-03-23 07:24:44.5
e9b974cf-b58c-4df5-aeb4-e3d312036f55	\N	รายจ่าย	EXPENSE	t	2026-03-23 07:24:44.503	2026-03-23 07:24:44.503
57c6c069-26c3-4c0c-bd2f-3407feaee805	\N	โอนภายใน	INTERNAL_TRANSFER	t	2026-03-23 07:24:44.505	2026-03-23 07:24:44.505
ec231301-dd16-44ab-889e-09b5f71b0e0b	\N	หนี้	DEBT	t	2026-03-23 07:24:44.506	2026-03-23 07:24:44.506
a19101b7-cac5-4e84-b506-c5d655faf43d	\N	ยืมเงินภายใน	LOAN_BORROW	t	2026-03-23 07:24:44.506	2026-03-23 07:24:44.506
45d5831a-9095-4a8e-b028-0877409514fc	\N	คืนเงินภายใน	LOAN_REPAY	t	2026-03-23 07:24:44.507	2026-03-23 07:24:44.507
befc4bc6-3447-4c7d-b714-6749d044cc29	\N	ออม/ลงทุน	INVESTMENT	t	2026-03-23 07:24:44.504	2026-03-23 07:24:44.504
e932cbb4-c4dc-42fc-b4bc-c4987072b47f	\N	เงินมีเป้าหมาย	SAVING	t	2026-03-25 10:13:50.125	2026-03-25 10:13:50.125
d0203f0a-f5dc-47ca-b19a-f35138701b77	\N	คืนเงินภายใน	LOAN_REPAY	t	2026-04-30 13:09:11.803	2026-04-30 16:21:51.481
512782cb-2f5e-4306-a7c3-acc6c81b3b09	\N	เงินมีเป้าหมาย	GOAL_SAVING	t	2026-04-30 13:09:11.807	2026-04-30 16:21:51.483
1fd11f93-e7b8-46f8-b3df-2fefb2e9c1d0	32839490-a7f5-4730-a78f-0923f494bf47	โอนภายใน	INTERNAL_TRANSFER	t	2026-03-25 10:15:34.2	2026-04-30 13:05:30.376
dd3f9c0d-6554-4895-a57f-387acf6fe4f5	32839490-a7f5-4730-a78f-0923f494bf47	หนี้	DEBT	t	2026-03-25 10:15:34.202	2026-04-30 13:05:30.408
e0309b7f-8890-4cff-a3c1-c24058ed9b05	32839490-a7f5-4730-a78f-0923f494bf47	ยืมเงินภายใน	LOAN_BORROW	t	2026-03-25 10:15:34.203	2026-04-30 13:05:30.441
e8804a23-dfc8-4b85-ac55-808c22bd5299	32839490-a7f5-4730-a78f-0923f494bf47	คืนเงินภายใน	LOAN_REPAY	t	2026-03-25 10:15:34.205	2026-04-30 13:05:30.475
37102991-baf1-4f98-8608-0d57f260ccce	32839490-a7f5-4730-a78f-0923f494bf47	เงินมีเป้าหมาย	GOAL_SAVING	t	2026-03-25 10:15:34.206	2026-04-30 13:05:30.509
db7a6240-c481-4bd4-ada9-ec7babb67c21	\N	รายรับ	INCOME	t	2026-04-24 11:39:51.678	2026-04-24 11:39:51.678
1e522f60-5e4a-41c9-9053-c104cdf6e7c9	\N	รายจ่าย	EXPENSE	t	2026-04-24 11:39:51.688	2026-04-24 11:39:51.688
a2571972-59fa-44a5-b01a-a5b54cc157f0	\N	ออม/ลงทุน	SAVING	t	2026-04-24 11:39:51.692	2026-04-24 11:39:51.692
996ae4c8-7bd4-46de-b6a2-6917d18634e5	\N	โอนภายใน	INTERNAL_TRANSFER	t	2026-04-24 11:39:51.696	2026-04-24 11:39:51.696
75d67132-3aad-451d-ab42-f172d2b31916	\N	หนี้	DEBT	t	2026-04-24 11:39:51.7	2026-04-24 11:39:51.7
1f6bfa69-8528-4c82-9ac3-18e97147e0b5	\N	ยืมเงินภายใน	LOAN_BORROW	t	2026-04-24 11:39:51.703	2026-04-24 11:39:51.703
e51a2ee3-8518-4ba8-b294-0bf66a866528	\N	คืนเงินภายใน	LOAN_REPAY	t	2026-04-24 11:39:51.707	2026-04-24 11:39:51.707
7c9ff93d-36e7-4645-8799-992f95e24ac1	\N	เงินมีเป้าหมาย	GOAL_SAVING	t	2026-04-24 11:39:51.711	2026-04-24 11:39:51.711
1df31d6e-4f51-4ed8-a88f-d87ef8893e41	\N	รายรับ	INCOME	t	2026-04-24 11:39:52.158	2026-04-24 11:39:52.158
cb89fca1-9848-4c1f-a83c-f10621c42408	\N	รายจ่าย	EXPENSE	t	2026-04-24 11:39:52.162	2026-04-24 11:39:52.162
b8e71cd4-37c5-4e9a-aca0-f49ec4ed4a67	\N	ออม/ลงทุน	SAVING	t	2026-04-24 11:39:52.166	2026-04-24 11:39:52.166
6d94de1a-06f1-4953-8502-24ceb9daf820	\N	โอนภายใน	INTERNAL_TRANSFER	t	2026-04-24 11:39:52.17	2026-04-24 11:39:52.17
fe0f185b-e345-48be-b309-88454ba53f21	\N	หนี้	DEBT	t	2026-04-24 11:39:52.173	2026-04-24 11:39:52.173
e5db0e55-9558-4c80-b262-a1826660a37a	\N	ยืมเงินภายใน	LOAN_BORROW	t	2026-04-24 11:39:52.177	2026-04-24 11:39:52.177
5f1440e5-4ecc-484c-a3ec-b82a47fd8c6d	32839490-a7f5-4730-a78f-0923f494bf47	ลงทุน	INVESTMENT	t	2026-03-25 10:15:34.198	2026-03-25 16:56:03.805
abaaab5b-cbd5-488b-b8a2-c6f9f2270203	32839490-a7f5-4730-a78f-0923f494bf47	เงินออม	SAVING	t	2026-03-25 16:56:14.361	2026-04-11 11:55:14.668
5acf0e58-b0ad-4e93-bad3-4e6d5fc81c6d	32839490-a7f5-4730-a78f-0923f494bf47	รายรับ	INCOME	t	2026-03-25 10:15:34.193	2026-04-30 13:05:30.275
50eef538-7008-4732-a6b3-8039b36305c6	32839490-a7f5-4730-a78f-0923f494bf47	รายจ่าย	EXPENSE	t	2026-03-25 10:15:34.196	2026-04-30 13:05:30.307
9def1f2d-369f-4995-b088-28e89afd7322	\N	เงินมีเป้าหมาย	GOAL_SAVING	t	2026-04-30 13:09:11.158	2026-04-30 16:21:50.999
1d4b402e-adc6-4aab-98f5-ab8cb7bdb7fd	\N	ออม/ลงทุน	SAVING	t	2026-04-30 13:09:11.138	2026-04-30 16:21:50.986
1723fba0-0f2e-4e13-a91f-def2fe8ea28d	\N	โอนภายใน	INTERNAL_TRANSFER	t	2026-04-30 13:09:11.142	2026-04-30 16:21:50.989
cddcaf96-e894-4c6a-91d3-19619f85293f	\N	หนี้	DEBT	t	2026-04-30 13:09:11.147	2026-04-30 16:21:50.991
5d7b8454-b207-4a3c-9c84-1cdfb219a61d	\N	รายรับ	INCOME	t	2026-04-30 13:09:11.13	2026-04-30 16:21:50.981
d2851f07-d208-406d-b185-838eef9370c0	\N	รายจ่าย	EXPENSE	t	2026-04-30 13:09:11.134	2026-04-30 16:21:50.984
83664b80-589d-4835-9ac6-ac71312cf190	\N	ยืมเงินภายใน	LOAN_BORROW	t	2026-04-30 13:09:11.151	2026-04-30 16:21:50.993
c6b2ea22-c543-485e-aab1-9e7f9a113d17	\N	คืนเงินภายใน	LOAN_REPAY	t	2026-04-30 13:09:11.155	2026-04-30 16:21:50.996
e33d7451-ccde-4303-a752-75d2f92ce214	\N	รายจ่าย	EXPENSE	t	2026-04-30 13:09:11.784	2026-04-30 16:21:51.47
2d7b9fac-673e-4918-9ee6-da3a691768ac	\N	รายรับ	INCOME	t	2026-04-30 13:09:11.781	2026-04-30 16:21:51.468
331af661-2225-474c-a808-9c837345022b	\N	ออม/ลงทุน	SAVING	t	2026-04-30 13:09:11.788	2026-04-30 16:21:51.472
3c3c8d55-925b-4d5d-9e00-d877a4abbdb8	\N	คืนเงินภายใน	LOAN_REPAY	t	2026-04-24 11:39:52.18	2026-04-24 11:39:52.18
a11cfa94-2837-4757-8ba4-789fc2f7bc86	\N	เงินมีเป้าหมาย	GOAL_SAVING	t	2026-04-24 11:39:52.184	2026-04-24 11:39:52.184
fb7691fb-9f04-4375-9bc7-d40479e092d8	ee81df9d-bb14-419b-bd49-d4c77b4d4214	รายรับ	INCOME	t	2026-04-24 11:44:38.61	2026-04-30 18:40:34.128
8aaadd78-bd5d-40ea-b4b3-ab0b7837ca35	ee81df9d-bb14-419b-bd49-d4c77b4d4214	รายจ่าย	EXPENSE	t	2026-04-24 11:44:38.612	2026-04-30 18:40:34.137
d9c3a6f7-32bb-467e-91b8-acbe0463ad17	ee81df9d-bb14-419b-bd49-d4c77b4d4214	ออม/ลงทุน	SAVING	t	2026-04-24 11:44:38.614	2026-04-30 18:40:34.141
064edceb-078c-4d9d-9b86-c505410a25a3	ee81df9d-bb14-419b-bd49-d4c77b4d4214	โอนภายใน	INTERNAL_TRANSFER	t	2026-04-24 11:44:38.616	2026-04-30 18:40:34.145
c513c61b-be4d-48ad-b435-082636644f8f	\N	โอนภายใน	INTERNAL_TRANSFER	t	2026-04-30 13:09:11.792	2026-04-30 16:21:51.474
971e4b40-cc32-4f8c-8e13-811e0a016909	\N	หนี้	DEBT	t	2026-04-30 13:09:11.796	2026-04-30 16:21:51.476
f7c2170c-1633-4c78-a7b2-1051e4498699	\N	ยืมเงินภายใน	LOAN_BORROW	t	2026-04-30 13:09:11.8	2026-04-30 16:21:51.479
137065dd-2161-47bd-920a-11dd873988e7	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	รายรับ	INCOME	t	2026-04-30 18:13:15.201	2026-04-30 18:40:35.946
87265b90-d353-4279-916b-076e419cf8ca	ee81df9d-bb14-419b-bd49-d4c77b4d4214	หนี้	DEBT	t	2026-04-24 11:44:38.618	2026-04-30 18:40:34.148
537e4e50-3c14-47b0-a72e-1b80e7d623b1	ee81df9d-bb14-419b-bd49-d4c77b4d4214	ยืมเงินภายใน	LOAN_BORROW	t	2026-04-24 11:44:38.62	2026-04-30 18:40:34.152
05cc5fee-f8d6-4b82-8c0b-efa878e65676	ee81df9d-bb14-419b-bd49-d4c77b4d4214	คืนเงินภายใน	LOAN_REPAY	t	2026-04-24 11:44:38.623	2026-04-30 18:40:34.156
7898edc9-7c63-447a-af47-56d46363e40a	ee81df9d-bb14-419b-bd49-d4c77b4d4214	เงินมีเป้าหมาย	GOAL_SAVING	t	2026-04-24 11:44:38.624	2026-04-30 18:40:34.16
78154f8c-300a-4a1e-8452-b18d293dc36a	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	รายรับ	INCOME	t	2026-04-30 18:13:14.635	2026-04-30 18:40:34.748
b60cb864-6ac8-4d46-8e52-106951c8228c	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	รายจ่าย	EXPENSE	t	2026-04-30 18:13:14.642	2026-04-30 18:40:34.752
3ab63478-f6fd-4a55-bbe7-4efe213c2b7b	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	รายจ่าย	EXPENSE	t	2026-04-30 18:13:15.204	2026-04-30 18:40:35.949
b0b12e36-fb22-47af-8e75-56e72eb3584f	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	ออม/ลงทุน	SAVING	t	2026-04-30 18:13:14.645	2026-04-30 18:40:34.755
a8ec533c-4c7e-40d0-a9ee-58da0a25fa0a	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	โอนภายใน	INTERNAL_TRANSFER	t	2026-04-30 18:13:14.649	2026-04-30 18:40:34.759
3411e592-cf1b-48b5-9a6e-d61ade7ceb6d	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	หนี้	DEBT	t	2026-04-30 18:13:14.652	2026-04-30 18:40:34.763
11f73209-28be-4e4c-a0a4-b45991226a35	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	ยืมเงินภายใน	LOAN_BORROW	t	2026-04-30 18:13:14.655	2026-04-30 18:40:34.77
0d9502a3-6330-4fc3-8ea5-71358d020e86	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	คืนเงินภายใน	LOAN_REPAY	t	2026-04-30 18:13:14.658	2026-04-30 18:40:34.774
113c74f6-9667-4a69-acaf-9dd081fa2baf	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	เงินมีเป้าหมาย	GOAL_SAVING	t	2026-04-30 18:13:14.662	2026-04-30 18:40:34.778
489782c9-c514-4d64-b4f8-0a73211e2402	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	ออม/ลงทุน	SAVING	t	2026-04-30 18:13:15.206	2026-04-30 18:40:35.953
296e4c31-4910-49f5-90d9-1c635161a48a	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	โอนภายใน	INTERNAL_TRANSFER	t	2026-04-30 18:13:15.21	2026-04-30 18:40:35.957
2d591397-9a1f-4950-8c2e-0cc7f0023dea	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	หนี้	DEBT	t	2026-04-30 18:13:15.213	2026-04-30 18:40:35.96
7ca3ab36-0a76-4146-80ab-56488958b174	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	ยืมเงินภายใน	LOAN_BORROW	t	2026-04-30 18:13:15.216	2026-04-30 18:40:35.964
11372997-f17c-4a1e-ad55-74b675025e5b	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	คืนเงินภายใน	LOAN_REPAY	t	2026-04-30 18:13:15.219	2026-04-30 18:40:35.968
083d2e74-adaa-4fa6-871a-1741b1ad8639	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	เงินมีเป้าหมาย	GOAL_SAVING	t	2026-04-30 18:13:15.222	2026-04-30 18:40:35.971
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, email, "passwordHash", "firstName", "lastName", "roleId", "organizationId", "isActive", "lineUserId", "pairingCode", "createdAt", "updatedAt", "isSystemAdmin") FROM stdin;
5fd22c63-a824-4b14-84ec-c588cf7ee27a	superadmin@nexworth.online	$2b$10$U5ABZ5pDTHmVOpuIzDGqTu8Nlalm3df8anN30.dl/jw3xOjarWGV6	System	Admin	70a86436-c928-44cf-80c9-2f7df89de496	ee81df9d-bb14-419b-bd49-d4c77b4d4214	t	\N	\N	2026-04-30 13:09:10.165	2026-04-30 18:40:33.899	t
eb4b1e1c-2351-4633-865d-e6010b446b26	admin@nexworth.test	$2b$10$nBx3/.bGX6pdhG9C8Y7fyeUi7tu8D42r/KSzfFhLIkG8JL.9XrD9S	Business	Admin	ec66bee8-7d3c-4c78-9139-19866ba65365	87a73bc3-d9b1-4e71-b9c7-07d70ddbf2c4	t	\N	\N	2026-04-30 18:13:14.392	2026-04-30 18:40:34.466	f
166baf00-012e-4961-8ea5-93fbad9cbdaa	test@nexworth.net	$2b$10$kUQtY/7JCG/n6amEmZUJ5OTV8mYKneX2vBPn8vzyAcdrj3AsYIYse	Test	User	e0a170d1-8489-42d7-bb84-0db6d64a4286	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	t	\N	\N	2026-04-30 18:13:14.924	2026-04-30 18:40:35.141	f
4fd24e66-2498-4fd7-b40b-be8bfd94a413	test-admin@nexworth.net	$2b$10$v7rx6qKNsZ3UmOChvB4wJ.qfMATsY2ABAt7Wss/1ec2DoYOyHSDhC	Test	Admin	e0a170d1-8489-42d7-bb84-0db6d64a4286	bf143f6d-d1f3-495a-b639-7fed3d87a0e1	t	\N	\N	2026-04-30 18:13:14.987	2026-04-30 18:40:35.729	f
2dc4de80-5323-4859-81f0-caf914fc5f60	neranchara.ksr@gmail.com	$2b$10$PKypUkJcpuT7KyJKYa9rYuCQyLkM5PQ8LtZa9KIkHCEczHahg4zim	Neranchara	Admin	1c9afd93-7eee-4aaf-a04f-0d7d33d32bc3	32839490-a7f5-4730-a78f-0923f494bf47	t	\N	\N	2026-03-25 10:15:34.135	2026-04-30 13:05:27.584	f
7a95476c-1a39-4232-bcd1-9fb1bb651006	superadmin@nexworth.net	$2b$10$U5ABZ5pDTHmVOpuIzDGqTu8Nlalm3df8anN30.dl/jw3xOjarWGV6	System	Admin	70a86436-c928-44cf-80c9-2f7df89de496	ee81df9d-bb14-419b-bd49-d4c77b4d4214	t	\N	\N	2026-04-24 11:44:38.397	2026-04-30 17:24:33.609	t
\.


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: Asset Asset_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_pkey" PRIMARY KEY (id);


--
-- Name: Bank Bank_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Bank"
    ADD CONSTRAINT "Bank_pkey" PRIMARY KEY (id);


--
-- Name: FinancialRecord FinancialRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FinancialRecord"
    ADD CONSTRAINT "FinancialRecord_pkey" PRIMARY KEY (id);


--
-- Name: Liability Liability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Liability"
    ADD CONSTRAINT "Liability_pkey" PRIMARY KEY (id);


--
-- Name: Loan Loan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Loan"
    ADD CONSTRAINT "Loan_pkey" PRIMARY KEY (id);


--
-- Name: Organization Organization_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Organization"
    ADD CONSTRAINT "Organization_pkey" PRIMARY KEY (id);


--
-- Name: Permission Permission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Permission"
    ADD CONSTRAINT "Permission_pkey" PRIMARY KEY (id);


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: TransactionCategory TransactionCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TransactionCategory"
    ADD CONSTRAINT "TransactionCategory_pkey" PRIMARY KEY (id);


--
-- Name: TransactionType TransactionType_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TransactionType"
    ADD CONSTRAINT "TransactionType_pkey" PRIMARY KEY (id);


--
-- Name: Transaction Transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Asset_accountId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Asset_accountId_key" ON public."Asset" USING btree ("accountId");


--
-- Name: Bank_organizationId_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Bank_organizationId_code_key" ON public."Bank" USING btree ("organizationId", code);


--
-- Name: Liability_accountId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Liability_accountId_key" ON public."Liability" USING btree ("accountId");


--
-- Name: Permission_roleId_resource_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Permission_roleId_resource_key" ON public."Permission" USING btree ("roleId", resource);


--
-- Name: Role_organizationId_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Role_organizationId_name_key" ON public."Role" USING btree ("organizationId", name);


--
-- Name: Session_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Session_token_key" ON public."Session" USING btree (token);


--
-- Name: TransactionCategory_organizationId_name_typeId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "TransactionCategory_organizationId_name_typeId_key" ON public."TransactionCategory" USING btree ("organizationId", name, "typeId");


--
-- Name: TransactionType_organizationId_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "TransactionType_organizationId_name_key" ON public."TransactionType" USING btree ("organizationId", name);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_lineUserId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_lineUserId_key" ON public."User" USING btree ("lineUserId");


--
-- Name: User_pairingCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_pairingCode_key" ON public."User" USING btree ("pairingCode");


--
-- Name: Account Account_bankId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES public."Bank"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Account Account_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Asset Asset_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."Account"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Asset Asset_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Asset Asset_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Bank Bank_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Bank"
    ADD CONSTRAINT "Bank_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FinancialRecord FinancialRecord_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FinancialRecord"
    ADD CONSTRAINT "FinancialRecord_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."Account"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FinancialRecord FinancialRecord_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FinancialRecord"
    ADD CONSTRAINT "FinancialRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FinancialRecord FinancialRecord_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FinancialRecord"
    ADD CONSTRAINT "FinancialRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Liability Liability_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Liability"
    ADD CONSTRAINT "Liability_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."Account"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Liability Liability_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Liability"
    ADD CONSTRAINT "Liability_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Liability Liability_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Liability"
    ADD CONSTRAINT "Liability_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Loan Loan_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Loan"
    ADD CONSTRAINT "Loan_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public."Asset"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Loan Loan_liabilityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Loan"
    ADD CONSTRAINT "Loan_liabilityId_fkey" FOREIGN KEY ("liabilityId") REFERENCES public."Liability"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Loan Loan_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Loan"
    ADD CONSTRAINT "Loan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Loan Loan_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Loan"
    ADD CONSTRAINT "Loan_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Permission Permission_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Permission"
    ADD CONSTRAINT "Permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Role Role_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TransactionCategory TransactionCategory_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TransactionCategory"
    ADD CONSTRAINT "TransactionCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TransactionCategory TransactionCategory_typeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TransactionCategory"
    ADD CONSTRAINT "TransactionCategory_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES public."TransactionType"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TransactionType TransactionType_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TransactionType"
    ADD CONSTRAINT "TransactionType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."Account"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Transaction Transaction_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public."Asset"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."TransactionCategory"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Transaction Transaction_liabilityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_liabilityId_fkey" FOREIGN KEY ("liabilityId") REFERENCES public."Liability"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_linkedTransactionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_linkedTransactionId_fkey" FOREIGN KEY ("linkedTransactionId") REFERENCES public."Transaction"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_loanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES public."Loan"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_typeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES public."TransactionType"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Transaction Transaction_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict cOJMqNQCWKlbGA0qqV7Vw3fFwgxL46Pe8abVuLesBSL7g4gWCcJvZuY2pxVKa2I

