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
b47626b9d78ed7ed3c413304387026f907c70cbe@peer-0.mainnet.lum.network:26656,6d0df63b66363d1042f01bf43eab1a646b794f9a@149.248.3.45:41156,0ef932a447d24abfc30291e50f14471d388ea007@142.132.199.98:11656,faac1937e214f9177f1bdb1c66988f8e9102dbec@149.28.103.64:12656,e12fcc7d9fc9b8b2901aec950f161418794cccf0@65.108.77.38:26656,4fa94546241526072ad85951d4d49d167842fdc2@135.181.214.219:26656,542e266b8f0cfc7a13a128bff9e45da0a3690a1d@65.21.75.219:26656,6db1990e4b445fd1fce3c8c81da2b7128a1ebb78@65.21.76.182:26656,5a29947212a2615e43dac54deb55356a162e173a@35.181.76.160:26656,433c60a5bc0a693484b7af26208922b84773117e@34.209.132.0:26656,9afac13ba62fbfaf8d06867c30007162511093c0@54.214.134.223:26656,a7f8832cb8842f9fb118122354fff22d3051fb83@3.36.179.104:26656,02d34d0d9b66be609e90d71c43c06e439357898b@51.250.24.4:26656
```

### lumd version

```sh
$ lumd version --long
name: lum
server_name: lumd
version: 1.1.0
commit: d8f3696d5973e6f299f1dd7517f39c033649ee96
```

## Installation

**Prerequisites:** Make sure to have [Golang >=1.18](https://golang.org/).

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
git checkout v1.1.0
make install
```

### Check that you have the right lumd version installed:

```sh
lumd version --long
```
```
name: lum
server_name: lumd
version: 1.1.0
commit: d8f3696d5973e6f299f1dd7517f39c033649ee96
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

### 1. Minimum hardware requirements

- 4 CPU ores
- 16 GB RAM
- 200 GB of disk space
- 100 mbps bandwidth

### 2. Configure minimum gas price
Configure the minimum gas price to `minimum-gas-prices = "0.001ulum"`
```sh
nano ~/.lumd/config/app.toml
```

### 3. Create validator transaction

Set the parameters you want
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

You can also edit your validator afterward
```sh
lumd tx staking edit-validator \
   --website="https://lum.network" \
   --details="So luminous" \
   --chain-id=lum-network-1 \

```

### 4. Upload validator logo

If you want your validator to have a logo displayed on the [Lum Network explorer](https://explorer.lum.network/validators), you must follow the procedure detailed here: https://github.com/lum-network/public-assets

If you want to do the same for [Mintscan](https://mintscan.io/lum/validators), you must follow the similar procedure detailed here: https://github.com/cosmostation/cosmostation_token_resource


### 5. Join Discord

Once your validator is up and running you can join the private validator channel on Discord.

This is the main communication channel with validators.

- Join the [Lum Network Discord server](https://discord.gg/KwyVvnBcXF)
- Ping the infrastructure-support channel to get the Validator Role and access the validator channels
