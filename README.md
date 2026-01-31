<img src=".\node-server\frontend\pictures\saafR_logo_black.png" align="right" width="300" />

# saafR
saafR (safe accident and anxiety free routing) is a specialized routing application for bikes designed to prioritize rider comfort and physical safety over the fastest path. While traditional routers focus on the shortest distance, saafR calculates routes by evaluating the safety of every street in Münster.
<br clear="right"/>

## About This Project
This application was developed as part of a master's project in the Geoinformatics program at the University of Münster's Institute for Geoinformatics.

### Authors
Andreas Rademaker ([nicevibesplus](https://github.com/nicevibesplus)) \
Emil Erlenkötter ([emil282](https://github.com/emil282)) \
Florian Thiemann ([fthiemann](https://github.com/fthiemann)) \
Jan Becker ([janbecker2](https://github.com/janbecker2)) \
Lea Heming ([LeaHem77](https://github.com/LeaHem77))

## Installation & Setup
As the application consists of multiple docker containers, docker must be installed.
### Windows
```powershell
# 1. Clone the repository
git clone https://github.com/nicevibesplus/saafR.git
cd saafR

# 2. Download the data 
# Note: You may need to run 'Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process' 
# if script execution is disabled.
./start_data/download_data.ps1

# 3. Start the environment
docker compose down -v
docker compose up --build -d
```

### Linux
```bash
# 1. Clone the repository
git clone https://github.com/nicevibesplus/saafR.git
cd saafR

# 2. Download the data using PowerShell for Linux
pwsh ./start_data/download_data.ps1

# 3. Start the environment
# Note: Use 'sudo' if your user is not in the docker group
docker compose down -v
docker compose up --build -d
```
