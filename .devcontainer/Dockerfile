FROM --platform=linux/amd64 debian:trixie AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    build-essential \
    ca-certificates \
    curl \
    git \
    passwd \
    python3 \
    python3-pip \
    python3-venv \
    python3-certifi \
    python3-urllib3 \
    sudo \
    unzip \
    zsh \
    file \
    tree \
    && rm -rf /var/lib/apt/lists/* \
    && update-ca-certificates

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g npm@latest roblox-ts pnpm

# Create user early and create venv as the node user
RUN useradd -ms /bin/zsh node \
    && chsh -s /bin/zsh node \
    && echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

USER node
ENV HOME=/home/node
ENV ZSH_CUSTOM=/home/node/.oh-my-zsh/custom
WORKDIR /home/node

# Install Oh-My-Zsh, Powerlevel10k, and plugins for node user
RUN git clone --depth=1 https://github.com/ohmyzsh/ohmyzsh.git ~/.oh-my-zsh \
    && git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM}/themes/powerlevel10k \
    && git clone --depth=1 https://github.com/zsh-users/zsh-autosuggestions.git ${ZSH_CUSTOM}/plugins/zsh-autosuggestions \
    && git clone --depth=1 https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM}/plugins/zsh-syntax-highlighting \
    && cp ~/.oh-my-zsh/templates/zshrc.zsh-template ~/.zshrc \
    && sed -i 's/^ZSH_THEME=.*/ZSH_THEME="powerlevel10k\/powerlevel10k"/' ~/.zshrc \
    && sed -i 's/^plugins=(git)/plugins=(git zsh-autosuggestions zsh-syntax-highlighting)/' ~/.zshrc \
    && echo 'source ~/.p10k.zsh' >> ~/.zshrc \
    && echo 'export ZSH_DISABLE_COMPFIX=true' >> ~/.zshrc

# Create virtual environment as node user
RUN python3 -m venv /home/node/venv \
    && /home/node/venv/bin/pip install --upgrade pip \
    && /home/node/venv/bin/pip install certifi urllib3 \
    && /home/node/venv/bin/python -c "import ssl; print('SSL working:', ssl.create_default_context())"

ENV PATH="/home/node/venv/bin:/home/node/.local/bin:$PATH"

RUN curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/rojo-rbx/rokit/main/scripts/install.sh | bash

ENV PATH="/home/node/.rokit/bin:$PATH"

WORKDIR /workspace
COPY --chown=node:node package*.json ./
RUN npm install

COPY --chown=node:node rokit.toml ./
RUN rokit install --no-trust-check

COPY --chown=node:node . .
RUN find scripts/shell -name "*.sh" -type f -exec chmod +x {} \; || true

FROM --platform=linux/amd64 debian:trixie-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    ca-certificates \
    curl \
    git \
    passwd \
    python3 \
    python3-pip \
    python3-venv \
    python3-certifi \
    python3-urllib3 \
    sudo \
    zsh \
    file \
    tree \
    && rm -rf /var/lib/apt/lists/* \
    && update-ca-certificates

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g npm@latest roblox-ts pnpm

RUN useradd -ms /bin/zsh node \
    && chsh -s /bin/zsh node \
    && echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Copy the virtual environment from builder with correct ownership
COPY --from=builder --chown=node:node /home/node/venv /home/node/venv

# Copy Oh-My-Zsh setup from builder
COPY --from=builder --chown=node:node /home/node/.oh-my-zsh /home/node/.oh-my-zsh
COPY --from=builder --chown=node:node /home/node/.zshrc /home/node/.zshrc

USER node
ENV HOME=/home/node
ENV ZSH_CUSTOM=/home/node/.oh-my-zsh/custom
WORKDIR /home/node

# Copy p10k configuration
COPY --chown=node:node .devcontainer/configuration/.p10k.zsh /home/node/.p10k.zsh

ENV PATH="/home/node/venv/bin:/home/node/.local/bin:$PATH"

COPY --from=builder --chown=node:node /home/node/.rokit /home/node/.rokit

ENV PATH="/home/node/.rokit/bin:$PATH"

WORKDIR /workspace
COPY --from=builder --chown=node:node /workspace /workspace

ENV PATH="/home/node/.rokit/bin:/workspace/node_modules/.bin:/home/node/venv/bin:/home/node/.local/bin:$PATH"
ENV NODE_ENV=development

EXPOSE 3000
EXPOSE 34872

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node --version && npm --version || exit 1

ENTRYPOINT ["/workspace/scripts/shell/docker-entrypoint.sh"]
CMD ["zsh"]