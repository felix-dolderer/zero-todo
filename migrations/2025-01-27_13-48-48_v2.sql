CREATE TABLE "task" (
  "id" INT PRIMARY KEY,
  "creatorID" VARCHAR REFERENCES "user"(id),
  "assigneeID" VARCHAR REFERENCES "user"(id),
  "title" VARCHAR NOT NULL,
  "timestamp" TIMESTAMP NOT NULL,
  "completed" BOOLEAN NOT NULL
);
