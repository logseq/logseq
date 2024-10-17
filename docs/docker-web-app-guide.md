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

## With plugins enabled

Current implementation ships plugins alongside the graph files.

You need to prepare this directory so that when LogSeq web access the local directory it can parse the plugins to be loaded from a `preferences.json` file. The plugins are served from the container's web server. The graph's plugins directory needs to be mounted on the container to let LogSeq side load them.

### Prepare the local folder

Prepare your logseq's repo. Copy the `$HOME/.logseq/plugins` to `path/to/logseq-repo/dot-logseq`
```shell
cd path/to/logseq-repo
mkdir dot-logseq
cp -r $HOME/.logseq/plugins dot-logseq/.
```

Edit `dot-logseq/preferences.json` and list the plugins you want to enable under the `externals` key.
Make sure the paths in the list are relative to the `path/to/logseq-repo` directory and start with `./`:

```json
{
  "theme": null,
  "themes": {
    "mode": "light",
    "light": null,
    "dark": null
  },
  "externals": [
    "./plugins/logseq-todo-plugin",
    "./plugins/logseq-excalidraw"
  ]
}
```

The final structure should be similar to the following one:
```
logseq-repo
├── dot-logseq
│   ├── preferences.json
│   ├── plugins
│   │   └── logseq-todo-plugin
│   │   └── logseq-excalidraw
│   └── settings
├── journals
├── logseq
│   ├── config.edn
│   └── custom.css
└── pages
```

### Build the image
```shell
git clone -b master https://github.com/logseq/logseq.git && cd logseq
docker build -f Dockerfile.local . -t logseq-webapp-local:latest
```

### Run the container
```shell
docker run -d --rm -p 127.0.0.1:3001:80 -v path/to/logseq-repo/dot-logseq/plugins:/usr/share/nginx/html/plugins:ro logseq-webapp-local:latest
```

Browse http://127.0.0.1:3001. Click on "Add a graph" and open `path/to/logseq-repo` directory, grant `Edit files` permission.

**Note**: If plugins are not loaded the first time you open the directory, reload the page.

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
