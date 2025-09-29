# =====================
# Builder Stage
# =====================
FROM debian:trixie AS builder

# Install all system dependencies at once
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash build-essential ca-certificates curl git passwd \
    python3 python3-pip python3-venv python3-certifi python3-urllib3 \
    sudo unzip zsh file tree \
    && rm -rf /var/lib/apt/lists/* && update-ca-certificates

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install global npm tools
RUN npm install -g npm@latest roblox-ts pnpm concurrently

# Create non-root user
RUN useradd -ms /bin/zsh node \
    && chsh -s /bin/zsh node \
    && echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

USER node
ENV HOME=/home/node
ENV ZSH_CUSTOM=/home/node/.oh-my-zsh/custom
WORKDIR /home/node

# =====================
# Parallel Setup using concurrently
# =====================
# Install Oh-My-Zsh, Powerlevel10k, plugins, Python venv, and Rokit concurrently
RUN concurrently \
    "git clone --depth=1 https://github.com/ohmyzsh/ohmyzsh.git ~/.oh-my-zsh" \
    "git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM}/themes/powerlevel10k" \
    "git clone --depth=1 https://github.com/zsh-users/zsh-autosuggestions.git ${ZSH_CUSTOM}/plugins/zsh-autosuggestions" \
    "git clone --depth=1 https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM}/plugins/zsh-syntax-highlighting" \
    "python3 -m venv /home/node/venv && /home/node/venv/bin/pip install --upgrade pip certifi urllib3" \
    "curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/rojo-rbx/rokit/main/scripts/install.sh | bash" \
    --kill-others --success first

# Configure Oh-My-Zsh & Powerlevel10k
RUN cp ~/.oh-my-zsh/templates/zshrc.zsh-template ~/.zshrc \
    && sed -i 's/^ZSH_THEME=.*/ZSH_THEME="powerlevel10k\/powerlevel10k"/' ~/.zshrc \
    && sed -i 's/^plugins=(git)/plugins=(git zsh-autosuggestions zsh-syntax-highlighting)/' ~/.zshrc \
    && echo 'source ~/.p10k.zsh' >> ~/.zshrc \
    && echo 'export ZSH_DISABLE_COMPFIX=true' >> ~/.zshrc

ENV PATH="/home/node/venv/bin:/home/node/.local/bin:/home/node/.rokit/bin:$PATH"

# =====================
# Project Setup
# =====================
WORKDIR /workspace
COPY --chown=node:node package*.json ./

# npm install cached (only runs if package*.json changes)
RUN npm install

COPY --chown=node:node rokit.toml ./
# Force source build for Rokit tools
ENV ROKIT_BUILD_FROM_SOURCE=1
RUN rokit install --no-trust-check

# Copy remaining project files
COPY --chown=node:node . .

# Make shell scripts executable
RUN find scripts/shell -name "*.sh" -type f -exec chmod +x {} \; || true

# =====================
# Final Stage
# =====================
FROM debian:trixie-slim

# Runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash ca-certificates curl git passwd python3 python3-pip python3-venv \
    python3-certifi python3-urllib3 sudo zsh file tree \
    && rm -rf /var/lib/apt/lists/* && update-ca-certificates

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g npm@latest roblox-ts pnpm concurrently

RUN useradd -ms /bin/zsh node \
    && chsh -s /bin/zsh node \
    && echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

USER node
ENV HOME=/home/node
ENV ZSH_CUSTOM=/home/node/.oh-my-zsh/custom
WORKDIR /home/node

# Copy from builder
COPY --from=builder --chown=node:node /home/node/venv /home/node/venv
COPY --from=builder --chown=node:node /home/node/.oh-my-zsh /home/node/.oh-my-zsh
COPY --from=builder --chown=node:node /home/node/.zshrc /home/node/.zshrc
COPY --from=builder --chown=node:node /home/node/.rokit /home/node/.rokit
COPY --from=builder --chown=node:node /workspace /workspace

ENV PATH="/home/node/.rokit/bin:/workspace/node_modules/.bin:/home/node/venv/bin:/home/node/.local/bin:$PATH"
ENV NODE_ENV=development

EXPOSE 3000
EXPOSE 34872

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node --version && npm --version || exit 1

CMD ["zsh"]
