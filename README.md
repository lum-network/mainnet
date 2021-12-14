# Lum Network - MainNet

You already know the drill, but you'll find all the informations here!

## Timeline
### Phase 1: Gentx submission deadline
December 13th, 5:00PM UTC

You must submit your gentx (see instructions below) by this time to be included in the genesis.

[./config-genesis.json](./config-genesis.json) contains the genesis configuration (without any account yet). Feel free to comment on that over Discord.

### Phase 2: Genesis Launch
December 14th, 5:00PM UTC

You must have your validator up and running by this time and be available for further instructions if necessary.

### Phase 3: Post Genesis launch
The main communication channel for validators is Discord.

Join the Lum Network [Discord server](https://discord.gg/KwyVvnBcXF).

Upon the Genesis launch everyone can join the network freely and aim to be one of the top validators.

## Key informations

### Chain ID
```bash
lum-network-1
```

### Genesis file
Available in this repository: [./genesis.json](./genesis.json)

```sh
curl -s  https://raw.githubusercontent.com/lum-network/mainnet/master/genesis.json > ~/.lumd/config/genesis.json

sha256sum ~/.lumd/config/genesis.json
3bbbd7aff6c545126d869fc683f6344e65ae71b048b25540826cd2f3be91a24c
```

### Seed nodes
Available here: [./seeds.txt](./seeds.txt)

```
19ad16527c98b782ee35df56b65a3a251bd99971@peer-1.mainnet.lum.network:26656
```

### Persistent peers
Available here: [./persistent_peers.txt](./persistent_peers.txt)

```
b47626b9d78ed7ed3c413304387026f907c70cbe@peer-0.mainnet.lum.network:26656
```

### lumd version

```sh
$ lumd version --long
name: lum
server_name: lumd
version: 1.0.4
commit: e3068181b029af45bcbbe4678804b776eef6087b
```

## Installation

**Prerequisites:** Make sure to have [Golang >=1.17](https://golang.org/).

### Make sure your Go configuration looks like that one (especially the GO111Module):

```sh
export GOROOT=/usr/local/go
export GOPATH=$HOME/go
export GO111MODULE=on
export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin
```

### Clone the repository

```sh
git clone https://github.com/lum-network/chain.git
cd chain
git checkout v1.0.4
make install
```

### Check that you have the right lumd version installed:

```sh
lumd version --long
```
```
name: lum
server_name: lumd
version: 1.0.4
commit: e3068181b029af45bcbbe4678804b776eef6087b
```

### Minimum hardware requirements

- 4 CPU ores
- 16 GB RAM
- 200 GB of disk space
- 100 mbps bandwidth

## Setup validator node

### Generate genesis transaction (gentx)

1. Initialize the Lum Network directories and create the local genesis file with the correct chain-id:

   ```sh
   lumd init <moniker-name> --chain-id=lum-network-1
   ```

2. Create a local key pair:

   ```sh
   lumd keys add <key-name>
   ```

3. Add your account to your local genesis file with the following amount (1Mi LUM + 1 LUM) and the key you just created.

   ```sh
   lumd add-genesis-account $(lumd keys show <key-name> -a) 1000001000000ulum
   ```

4. Create the gentx, use `1000000000000ulum` (1Mi LUM):

   ```sh
   lumd gentx <key-name> 1000000000000ulum \
       --chain-id=lum-network-1 \
       --moniker="<moniker>" \
       --commission-rate="0.01" \
       --[other custom params]
   ```

   If all goes well, you will see a message similar to the following:

   ```sh
   Genesis transaction written to "/home/user/.lumd/config/gentx/gentx-******.json"
   ```

### Submit genesis transaction

- Fork [the mainnet repo](https://github.com/lum-network/mainnet) into your Github account

- Clone your repo using

  ```bash
  git clone https://github.com/<your-github-username>/mainnet
  ```

- Copy the generated gentx json file to `<repo_path>/gentxs/`

  ```sh
  > cd mainnet
  > cp ~/.lumd/config/gentx/gentx-*****.json ./gentxs/gentx-<moniker-name>.json
  ```

- Commit and push to your repo
- Create a PR onto https://github.com/lum-network/mainnet
- Only PRs from invited validators will be accepted. This is to ensure the network successfully starts on time.

## Running in production

Download Genesis file when the time is right.
```sh
curl -s  https://raw.githubusercontent.com/lum-network/mainnet/master/genesis.json > ~/.lumd/config/genesis.json

sha256sum ~/.lumd/config/genesis.json
3bbbd7aff6c545126d869fc683f6344e65ae71b048b25540826cd2f3be91a24c
```

Create a systemd file for your Lum Network service:

```sh
sudo nano /etc/systemd/system/lumd.service
```

Copy and paste the following and update `<YOUR_HOME_PATH>`:

```sh
[Unit]
Description=Lum Network daemon
After=network-online.target

[Service]
User=lum
ExecStart=/<YOUR_HOME_PATH>/go/bin/lumd start --p2p.laddr tcp://0.0.0.0:26656 --home /<YOUR_HOME_PATH>/.lumd
Restart=on-failure
RestartSec=3
LimitNOFILE=4096

[Install]
WantedBy=multi-user.target
```

2
**This assumes `$HOME/go` to be your Go workspace, and `$HOME/.lumd` to be your directory for config and data. Your actual directory locations may vary.**

Enable and start the new service:

```sh
sudo systemctl enable lumd
sudo systemctl start lumd
```

Check status:

```sh
lumd status
```

Check logs:

```sh
journalctl -u lumd -f
```
