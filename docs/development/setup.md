# Development setup

Frappe does not run natively on Windows. Use **WSL2 with Ubuntu 24.04** (the owner's PC already has it).
Docker (`frappe_docker` devcontainer) is an alternative but is not installed. This is roadmap slice **E1**;
the steps have not been run yet — fix this page when they are.

## 1. System packages (inside Ubuntu)
```bash
sudo apt update && sudo apt install -y git python3-dev python3-venv python3-pip pipx redis-server mariadb-server mariadb-client libmysqlclient-dev pkg-config xvfb libfontconfig wkhtmltopdf curl fonts-noto-core
```

MariaDB must use utf8mb4:
```bash
sudo tee /etc/mysql/mariadb.conf.d/99-frappe.cnf <<'EOF'
[mysqld]
character-set-client-handshake = FALSE
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
[mysql]
default-character-set = utf8mb4
EOF
sudo service mariadb restart && sudo mariadb-secure-installation
```

Node 18 + yarn, and the bench CLI:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && source ~/.bashrc && nvm install 18 && npm install -g yarn
pipx install frappe-bench && pipx ensurepath && source ~/.bashrc
```

## 2. Bench, ERPNext, site
```bash
cd ~ && bench init frappe-bench --frappe-branch version-15
cd ~/frappe-bench && bench get-app erpnext --branch version-15
bench new-site sijil.localhost --admin-password admin --install-app erpnext
bench --site sijil.localhost set-config developer_mode 1 && bench use sijil.localhost
```
`admin` is a local-only development password. Never reuse it on staging or production.

## 3. Sijil
Option A — the code lives in WSL (fastest; file watching works):
```bash
cd ~/frappe-bench && bench get-app /mnt/c/Users/<you>/Desktop/aqarat/sijil
```
Edit it at `~/frappe-bench/apps/sijil` (VS Code "WSL" extension, or `\\wsl$\Ubuntu-24.04\home\<user>\frappe-bench\apps\sijil` from Windows) and commit from there.

Option B — keep the Windows folder and symlink it (slower; JS changes may need a manual `bench build`):
```bash
cd ~/frappe-bench && ln -s /mnt/c/Users/<you>/Desktop/aqarat/sijil apps/sijil
./env/bin/pip install -e apps/sijil && echo "sijil" >> sites/apps.txt
```

Then:
```bash
bench --site sijil.localhost install-app sijil && bench --site sijil.localhost migrate
bench --site sijil.localhost execute sijil.install.make_demo_data
bench start
```
Open **`http://sijil.localhost:8000/sijil`** (the React app; `bench build --app sijil` builds it). 

React with hot reload against the bench:
```bash
bench --site sijil.localhost set-config ignore_csrf 1   # local site only
cd ~/frappe-bench/apps/sijil/frontend && npm install && npm run dev
```
Then open `http://localhost:8080/sijil/` and log in through it. Without a bench at all:
`npm run dev:mock` (in-memory sample data).

## Edit → see loop
| Changed | Do |
|---|---|
| Python (services, api, controllers) | Usually auto-reloads; refresh |
| `hooks.py` | Restart `bench start` |
| DocType JSON, reports, workspace | `bench --site sijil.localhost migrate` |
| `translations/ar.csv` | `bench --site sijil.localhost clear-cache` |
| React (`frontend/`) for the bench-served `/sijil` page | `bench build --app sijil`, then hard-refresh |
| React (`frontend/`) | Vite hot reload |

Arabic UI: user menu → My Settings → Language → `ar`.

## Line endings
`.gitattributes` forces LF. Commit from one side (Windows *or* WSL) for a given checkout.
