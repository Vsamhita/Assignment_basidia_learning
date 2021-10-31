CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    email varchar(200) NOT NULL,
    fb_id text DEFAULT NULL,
    password varchar(200) NOT NULL,
    status varchar(200) NOT NULL DEFAULT 'active',
    first_name varchar(255) DEFAULT NULL,
    last_name varchar(255) DEFAULT NULL,
    mobile_number varchar(20) DEFAULT NULL,
    address text DEFAULT NULL,
    street varchar(255) DEFAULT NULL,
    zipcode varchar(255) DEFAULT NULL,
    city integer DEFAULT NULL,
    countryid integer DEFAULT NULL,
    gender varchar(200) NOT NULL DEFAULT 'female',
    profile_pic varchar(255) DEFAULT NULL,
    dob date DEFAULT NULL,
    email_verified boolean NOT NULL DEFAULT 'Y',
    last_login timestamp without time zone,
    reset_link_time bigint,
    reset_email_sent boolean NOT NULL DEFAULT 'N',
    no_of_friends integer DEFAULT NULL,
    no_of_friend_requests integer DEFAULT 0,
    created_at timestamp without time zone,
    updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
)


CREATE TABLE friends(
    id integer NOT NULL,
    friend_id integer NOT NULL
)

CREATE TABLE requests(
    id integer NOT NULL,
    friend_id integer NOT NULL
)

CREATE TABLE posts(
    id SERIAL PRIMARY KEY,
    content varchar(200) NOT NULL,
    user_id integer NOT NULL
)

 