@echo off
SET ENVIRONMENT=dev
SET JWT_SECRET=4fa183cf1d28460498b13330835e80ad
SET COOKIE_SECRET=10a42ca724e34f4db6086a772d787034
SET DATABASE_URL=postgres://localhost:5432/logseq
SET GITHUB_APP2_ID=78728
SET GITHUB_APP2_KEY=xxxxxxxxxxxxxxxxxxxx
SET GITHUB_APP2_SECRET=xxxxxxxxxxxxxxxxxxxx
SET GITHUB_APP_PEM=
SET LOG_PATH=%AppData%\..\Local\Temp\logseq

pg_ctl start
start cmd.exe /k "java -Duser.timezone=UTC -jar logseq.jar"
yarn && yarn watch