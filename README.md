# Lum Network - MainNet

Official documentation hosted here: https://docs.lum.network

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
b47626b9d78ed7ed3c413304387026f907c70cbe@peer-0.mainnet.lum.network:26656,5ea36d78ae774c9086c2d3fc8b91f12aa4bf3029@46.101.251.76:26656,a7f8832cb8842f9fb118122354fff22d3051fb83@3.36.179.104:26656,9afac13ba62fbfaf8d06867c30007162511093c0@54.214.134.223:26656,433c60a5bc0a693484b7af26208922b84773117e@34.209.132.0:26656,8fafab32895a31a0d7f17de58eddb492c6ced6d1@185.194.219.83:36656,c06eae3d9ea779710bca44e03f57e961b59d63f1@82.65.223.126:46656,4166de0e7721b6eec9c776abf2c38c40e7f820c5@202.61.239.130:26656,5a29947212a2615e43dac54deb55356a162e173a@35.181.76.160:26656
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

## Setup your node

Download Genesis file.
```sh
curl -s  https://raw.githubusercontent.com/lum-network/mainnet/master/genesis.json > ~/.lumd/config/genesis.json

sha256sum ~/.lumd/config/genesis.json
3bbbd7aff6c545126d869fc683f6344e65ae71b048b25540826cd2f3be91a24c
```

Add seed peers and persistent peers to your config.toml
```sh
nano ~/.lumd/config/config.toml
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

## Validator setup

### Minimum hardware requirements

- 4 CPU ores
- 16 GB RAM
- 200 GB of disk space
- 100 mbps bandwidth

### Configure minimum gas price
Configure the minimum gas price to `minimum-gas-prices = "0.001ulum"`
```sh
nano ~/.lumd/config/app.toml
```

### Create validator transaction

```sh
lumd tx staking create-validator \
  --amount=1000000ulum \
  --pubkey=$(lumd tendermint show-validator) \
  --moniker="my super new validator" \
  --commission-rate="0.10" \
  --commission-max-rate="0.20" \
  --commission-max-change-rate="0.01" \
  --min-self-delegation="1" \
  --chain-id=lum-network-1
```

### Edit validator

```sh
lumd tx staking edit-validator \
   --website="https://lum.network" \
   --details="So luminous" \
   --chain-id=lum-network-1 \

```