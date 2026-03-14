SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict G8qXhw3Z1U2n571BmxwXzRFgalvVkKbvb5C8Jg4CAPapv6CgaWzXrhgA7PZu1f5

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

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
-- Data for Name: address; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: songs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."songs" ("id", "name", "created_at") VALUES
	(1, 'A Hard Day''s Night', '2026-02-12 09:21:00.909348+00'),
	(2, 'Ticket To Ride', '2026-02-12 09:21:00.909348+00'),
	(3, 'Eight Days A Week', '2026-02-12 09:21:00.909348+00'),
	(4, 'Twist And Shout', '2026-02-12 09:21:00.909348+00'),
	(5, 'I Saw Her Standing There', '2026-02-12 09:21:00.909348+00'),
	(6, 'She Loves You', '2026-02-12 09:21:00.909348+00'),
	(7, 'All My Loving', '2026-02-12 09:21:00.909348+00'),
	(8, 'You Really Got A Hold On Me', '2026-02-12 09:21:00.909348+00'),
	(9, 'This Boy', '2026-02-12 09:21:00.909348+00'),
	(10, 'I Want To Hold Your Hand', '2026-02-12 09:21:00.909348+00'),
	(11, 'From Me To You', '2026-02-12 09:21:00.909348+00'),
	(12, 'Please Please Me', '2026-02-12 09:21:00.909348+00'),
	(13, 'Roll Over Beethoven', '2026-02-12 09:21:00.909348+00'),
	(14, 'Help!', '2026-02-12 09:21:00.909348+00'),
	(15, 'In My Life', '2026-02-12 09:21:00.909348+00'),
	(16, 'We Can Work It Out', '2026-02-12 09:21:00.909348+00'),
	(17, 'Day Tripper', '2026-02-12 09:21:00.909348+00'),
	(18, 'Long Tall Sally', '2026-02-12 09:21:00.909348+00'),
	(19, 'Sgt. Pepper''s Lonely Hearts Club Band', '2026-02-12 09:21:00.909348+00'),
	(20, 'With A Little Help From My Friends', '2026-02-12 09:21:00.909348+00'),
	(21, 'Nowhere Man', '2026-02-12 09:21:00.909348+00'),
	(22, 'Yellow Submarine', '2026-02-12 09:21:00.909348+00'),
	(23, 'Tomorrow Never Knows	Back In The U.S.S.R.', '2026-02-12 09:21:00.909348+00'),
	(24, 'Octopus''s Garden', '2026-02-12 09:21:00.909348+00'),
	(25, 'Birthday', '2026-02-12 09:21:00.909348+00'),
	(26, 'Helter Skelter', '2026-02-12 09:21:00.909348+00'),
	(27, 'Got To Get You Into My Life', '2026-02-12 09:21:00.909348+00'),
	(28, 'Drive My Car', '2026-02-12 09:21:00.909348+00'),
	(29, 'Something', '2026-02-12 09:21:00.909348+00'),
	(30, 'Come Together', '2026-02-12 09:21:00.909348+00'),
	(31, 'Get Back', '2026-02-12 09:21:00.909348+00'),
	(32, 'Taxman', '2026-02-12 09:21:00.909348+00'),
	(33, 'I''m Happy Just To Dance With You', '2026-02-12 09:21:00.909348+00'),
	(34, 'Any Time At All', '2026-02-12 09:21:00.909348+00'),
	(35, 'You Can''t Do That', '2026-02-12 09:21:00.909348+00'),
	(36, 'Oh Darling', '2026-02-12 09:21:00.909348+00'),
	(37, 'Here Comes The Sun', '2026-02-12 09:21:00.909348+00'),
	(38, 'Because', '2026-02-12 09:21:00.909348+00'),
	(39, 'The End', '2026-02-12 09:21:00.909348+00'),
	(40, 'Honey Don''t', '2026-02-12 09:21:00.909348+00'),
	(41, 'What You''re Doing', '2026-02-12 09:21:00.909348+00'),
	(42, 'The Night Before', '2026-02-12 09:21:00.909348+00'),
	(43, 'You''ve Got To Hide Your Love Away', '2026-02-12 09:21:00.909348+00'),
	(44, 'I''ve Got A Feeling	One After 909', '2026-02-12 09:21:00.909348+00'),
	(45, 'Let It Be', '2026-02-12 09:21:00.909348+00'),
	(46, 'Magical Mystery Tour', '2026-02-12 09:21:00.909348+00'),
	(47, 'Strawberry Fields Forever', '2026-02-12 09:21:00.909348+00'),
	(48, 'Penny Lane', '2026-02-12 09:21:00.909348+00'),
	(49, 'Paperback Writer', '2026-02-12 09:21:00.909348+00'),
	(50, 'Rain', '2026-02-12 09:21:00.909348+00'),
	(51, 'Lady Madonna', '2026-02-12 09:21:00.909348+00'),
	(52, 'Revolution', '2026-02-12 09:21:00.909348+00'),
	(53, 'The Ballad Of John And Yoko', '2026-02-12 09:21:00.909348+00'),
	(54, 'Love Me Do', '2026-02-12 09:21:00.909348+00'),
	(55, 'She Said She Said', '2026-02-12 09:21:00.909348+00'),
	(56, 'Good Day Sunshine', '2026-02-12 09:21:00.909348+00'),
	(57, 'And Your Bird Can Sing', '2026-02-12 09:21:00.909348+00'),
	(58, 'I Want To Tell You', '2026-02-12 09:21:00.909348+00'),
	(59, 'What Goes On', '2026-02-12 09:21:00.909348+00'),
	(60, 'I''m Looking Through You', '2026-02-12 09:21:00.909348+00'),
	(61, 'If I Needed Someone', '2026-02-12 09:21:00.909348+00'),
	(62, 'Getting Better', '2026-02-12 09:21:00.909348+00'),
	(63, 'While My Guitar Gently Weeps', '2026-02-12 09:21:00.909348+00'),
	(64, 'Why Don''t We Do It In The Road', '2026-02-12 09:21:00.909348+00'),
	(65, 'I Wanna Be Your Man', '2026-02-12 09:21:00.909348+00');


--
-- Name: address_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."address_id_seq"', 1, false);


--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."events_id_seq"', 1, false);


--
-- Name: songs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."songs_id_seq"', 65, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict G8qXhw3Z1U2n571BmxwXzRFgalvVkKbvb5C8Jg4CAPapv6CgaWzXrhgA7PZu1f5

RESET ALL;
