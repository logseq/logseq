# Build static resources with pnpm release before building this image.
# .github/workflows/build-docker.yml builds the checked-out revision.
FROM nginx:1.24.0-alpine3.17

COPY static/ /usr/share/nginx/html/
