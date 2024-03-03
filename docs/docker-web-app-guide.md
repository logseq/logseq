# Logseq Docker Web App Guide

From v0.5.6, Logseq is also available as a Docker image of Web App.
The Docker image is available at [ghcr.io/logseq/logseq-webapp:latest](https://github.com/logseq/logseq/pkgs/container/logseq-webapp).

> **Note**
> Logseq web app uses [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) to access the file system. You need a [compatible browser](https://caniuse.com/native-filesystem-api).
> Also, an HTTPS connection is required if you are accessing it remotely.

## Simple one-line start(local machine)

```shell
docker pull ghcr.io/logseq/logseq-webapp:latest
docker run -d --rm -p 127.0.0.1:3001:80 ghcr.io/logseq/logseq-webapp:latest
```

Open the browser and go to <http://localhost:3001>.

## Remote(non-local) access

Here we use the [mkcert](https://github.com/FiloSottile/mkcert) to generate locally-trusted development certificates. For other purposes, you should apply a certificate from a trusted CA.

Suppose you are deploying the web app to 192.168.11.95.

### Install mkcert(web app of Filesystem API requires HTTPS)

```shell
# macOS
brew install mkcert
# or archlinux
sudo pacman -Ss mkcert
# or follow the install instructions from https://github.com/FiloSottile/mkcert
```

### Install mkcert root CA

```shell
mkcert -install
```

### Prepare SSL cert

```shell
mkcert 192.168.11.95 # public IP address or hostname of the remote machine
```

### Prepare SSL Nginx conf

```nginx
# ssl.conf
server {
    listen  443   ssl;
    ssl_certificate /etc/nginx/certs/192.168.11.95.pem;
    ssl_certificate_key /etc/nginx/certs/192.168.11.95-key.pem;
    server_name  localhost;

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }
}
```

### Pull Docker image

Copy the `*.key` and `ssl.conf` files to target machine.

```shell
docker pull ghcr.io/logseq/logseq-webapp:latest

docker run -d --rm -p 8443:443 -v `pwd`:/etc/nginx/certs -v ./ssl.conf:/etc/nginx/conf.d/ssl.conf ghcr.io/logseq/logseq-webapp:latest
```

> **Note**
> The above command will expose the web app to the public network, which is not recommended and may cause security issues.
> Please make sure the firewall is configured properly.

### Done!

Open your browser and navigate to `https://192.168.11.95:8443`.
