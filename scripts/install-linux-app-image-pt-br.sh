#!/usr/bin/env bash
set -euo pipefail

# Instala o Logseq AppImage no sistema de usuário (menu de aplicações)
# Coloca o AppImage em ~/.local/bin, cria o ícone e o arquivo .desktop
# Uso: ./install-logseq-appimage.sh [caminho/para/Logseq.AppImage]

APPIMAGE_SRC=""
if [ -n "${1:-}" ]; then
  APPIMAGE_SRC="$1"
else
  # try to detect any Logseq AppImage in current directory (case-insensitive)
  # search script directory and current working directory
  SEARCH_DIRS=("$(pwd)" "$(dirname "$0")")
  for d in "${SEARCH_DIRS[@]}"; do
    if [ -d "$d" ]; then
      # find files matching patterns
      while IFS= read -r -d $'\0' f; do
        if [ -z "$APPIMAGE_SRC" ]; then
          APPIMAGE_SRC="$f"
        fi
      done < <(find "$d" -maxdepth 1 -type f \( -iname "*logseq*.AppImage" -o -iname "*log-seq*.AppImage" \) -print0 2>/dev/null)
    fi
  done
fi
APPNAME="Logseq"
BIN_DIR="$HOME/.local/bin"
APPIMAGE_DEST="$BIN_DIR/logseq.AppImage"
DESKTOP_DIR="$HOME/.local/share/applications"
ICON_DIR="$HOME/.local/share/icons/hicolor/256x256/apps"
ICON_NAME="logseq.png"
ICON_SRC_FILE_B64="$(dirname "$0")/icon.png.b64"
ICON_SRC_PNG="$(dirname "$0")/logseq.png"
ICON_SRC_PNG_ALT="$(dirname "$0")/icon.png"

echo "Instalador do $APPNAME para o diretório do usuário"

if [ -z "$APPIMAGE_SRC" ] || [ ! -f "$APPIMAGE_SRC" ]; then
  echo "Arquivo AppImage do Logseq não encontrado."
  echo "Coloque o AppImage no diretório atual com nome contendo 'logseq' ou passe o caminho como primeiro argumento:"
  echo "  ./install-logseq-appimage.sh /caminho/para/Logseq-*.AppImage"
  exit 1
fi

mkdir -p "$BIN_DIR" "$DESKTOP_DIR" "$ICON_DIR"

echo "Copiando AppImage para $APPIMAGE_DEST..."
cp -f "$APPIMAGE_SRC" "$APPIMAGE_DEST"
chmod +x "$APPIMAGE_DEST"

#Se necessário, baixe um ícone PNG do Logseq de sua preferência.
echo "Escrevendo ícone..."
# Prioridade: arquivo PNG local (`logseq.png`), arquivo PNG alternativo (`icon.png`), arquivo base64 (`icon.png.b64`), fallback transparente
if [ -f "$ICON_SRC_PNG" ]; then
  cp -f "$ICON_SRC_PNG" "$ICON_DIR/$ICON_NAME"
elif [ -f "$ICON_SRC_PNG_ALT" ]; then
  cp -f "$ICON_SRC_PNG_ALT" "$ICON_DIR/$ICON_NAME"
elif [ -f "$ICON_SRC_FILE_B64" ]; then
  base64 -d "$ICON_SRC_FILE_B64" > "$ICON_DIR/$ICON_NAME"
else
  # fallback: grava um PNG 1x1 transparente decodificado a partir de base64
  echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn8B9pOqWQAAAABJRU5ErkJggg==" | base64 -d > "$ICON_DIR/$ICON_NAME"
fi
chmod 644 "$ICON_DIR/$ICON_NAME" || true
chmod 644 "$ICON_DIR/$ICON_NAME" || true

# Também copie o mesmo ícone para tamanhos comuns para aumentar compatibilidade com temas
for SIZE in 128 64; do
  DST_DIR="$HOME/.local/share/icons/hicolor/${SIZE}x${SIZE}/apps"
  mkdir -p "$DST_DIR"
  cp -f "$ICON_DIR/$ICON_NAME" "$DST_DIR/$ICON_NAME" || true
  chmod 644 "$DST_DIR/$ICON_NAME" || true
done

DESKTOP_FILE="$DESKTOP_DIR/logseq.desktop"
echo "Criando arquivo .desktop em $DESKTOP_FILE"
# Descrição pesquisada e compacta para o Logseq (pt_BR e fallback em inglês)
APP_COMMENT_EN="Local-first outliner and knowledge base. Note-taking, backlinks, graph view, Markdown/Org support."
APP_COMMENT_PT="Base de conhecimento e outliner local-first. Anotações, backlinks, visualização em grafo, suporte Markdown/Org, focado em privacidade."
cat > "$DESKTOP_FILE" <<DESK
[Desktop Entry]
Name=$APPNAME
Name[pt_BR]=$APPNAME
GenericName=Personal knowledge base
Comment=$APP_COMMENT_EN
Comment[pt_BR]=$APP_COMMENT_PT
Exec=$APPIMAGE_DEST %U
TryExec=$APPIMAGE_DEST
Icon=logseq
Terminal=false
Type=Application
Categories=Office;Productivity;Utility;
StartupWMClass=Logseq
X-AppImage-Version=0.10.14
DESK

echo "Atualizando banco de dados de aplicações/ícones, se comandos existirem..."
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$HOME/.local/share/applications" || true
fi

if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  # atualizar cache no diretório 'hicolor' onde os temas de ícone residem
  GTK_ICON_DIR=$(dirname "$(dirname "$ICON_DIR")")
  gtk-update-icon-cache -f -t "$GTK_ICON_DIR" || true
fi

echo "Instalação concluída. Você deve ver o $APPNAME no menu de aplicações (talvez após logout/login)."
echo "AppImage instalado em: $APPIMAGE_DEST"
echo "Ícone instalado em: $ICON_DIR/$ICON_NAME"
echo "Arquivo .desktop: $DESKTOP_FILE"

echo "Se não aparecer imediatamente, tente:"
echo "  - reiniciar sessão/mostrar aplicações"
echo "  - executar: update-desktop-database ~/.local/share/applications"

exit 0
