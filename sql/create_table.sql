CREATE DATABASE lnc;

CREATE TABLE lnc.pinghistory (
  host varchar(100) NOT NULL,
  alive boolean,
  timestamp timestamp
);

CREATE TABLE lnc.fetchhistory (
  url varchar(100) NOT NULL,
  alive boolean,
  timestamp timestamp
);
