# syntax=docker/dockerfile:1
FROM nginx:1.27-alpine

# Placeholder site for empty scaffold repo — replaced when source is committed.
RUN rm -rf /usr/share/nginx/html/*
COPY README.md /usr/share/nginx/html/README.md
RUN printf '%s\n' \
    '<!doctype html>' \
    '<html><head><meta charset="utf-8"><title>faithful-e2e-f</title>' \
    '<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:6rem auto;padding:0 1rem;color:#222}code{background:#f4f4f4;padding:.15em .35em;border-radius:4px}</style>' \
    '</head><body>' \
    '<h1>faithful-e2e-f</h1>' \
    '<p>This project has been deployed successfully but does not yet contain application code.</p>' \
    '<p>Push source to the <code>main</code> branch and the next deploy will replace this placeholder.</p>' \
    '</body></html>' > /usr/share/nginx/html/index.html

# Simple nginx config: serve static files at /, health at /healthz.
RUN printf '%s\n' \
    'server {' \
    '  listen 8080;' \
    '  root /usr/share/nginx/html;' \
    '  location = /healthz { return 200 "ok\n"; add_header Content-Type text/plain; }' \
    '  location / { try_files $uri $uri/ /index.html; }' \
    '}' > /etc/nginx/conf.d/default.conf \
 && sed -i 's/listen\s*80;/listen 8080;/' /etc/nginx/conf.d/default.conf || true

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
