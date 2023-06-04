## ⚠️ v1.4.1 has been replaced by v1.4.2 - read guide carefully ⚠️

Version v1.4.1 will break your node on block #7799476, do not use it.

You must use v1.4.2 instead, as described in this guide.

If your node is in a clean state at block #7740000 (the block height for v1.4.1 upgrade) you can use v1.4.2 by following this upgrade guide.

## Description

This pull request fixes the pruning by patching the ICAController store

The PR content can be browsed at https://github.com/lum-network/chain/pull/24

**Optional:** check [v1.4.2 upgrade guide](https://github.com/lum-network/mainnet/blob/master/upgrades/v1.4.2/guide.md) for more information on v1.4.1 and v1.4.2 differences.

## How to upgrade

- This upgrade is scheduled for Wednesday `Tuesday, May 30th around 16:00 UTC`
- The exact target block is `7740000`
- Upon reaching this block you will see a message `ERR UPGRADE "v1.4.1" NEEDED at height: 7740000` and `ERR CONSENSUS FAILURE!!!`
- WARNING: Upgrading prior to this block and this message WILL literally make your node good for a full hard reset, you really don't want to do that
- Once you receive this message you must upgrade you node:
  - `git pull`
  - `git checkout v1.4.2`
  - `make install`
  - `lumd version`
    - `1.4.2`
    - `c65be31156dff3217e1d85099debc324d56626a7`
  - `sudo systemctl restart lumd`
- If it succeeds you should see it in the logs `journalctl -u lumd -f `

## Install and setup Cosmovisor

We highly recommend validators use cosmovisor to run their nodes. This will make low-downtime upgrades smoother,
as validators don't have to manually upgrade binaries during the upgrade, and instead can preinstall new binaries, and
cosmovisor will automatically update them based on on-chain SoftwareUpgrade proposals.

You should review the docs for cosmovisor located here: https://docs.cosmos.network/master/run-node/cosmovisor.html

If you choose to use cosmovisor, please continue with these instructions:

To install Cosmovisor:

```
git clone https://github.com/cosmos/cosmos-sdk
cd cosmos-sdk
git checkout cosmovisor/v1.3.0
make cosmovisor
cp cosmovisor/cosmovisor $GOPATH/bin/cosmovisor
cd $HOME
```

After this, you must make the necessary folders for cosmosvisor in your daemon home directory (~/.lumd).

```
mkdir -p ~/.lumd/cosmovisor
mkdir -p ~/.lumd/cosmovisor/genesis
mkdir -p ~/.lumd/cosmovisor/genesis/bin
mkdir -p ~/.lumd/cosmovisor/upgrades
```

Cosmovisor requires some ENVIRONMENT VARIABLES be set in order to function properly.  We recommend setting these in
your `.profile` so it is automatically set in every session.

For validators we recommmend setting
- `DAEMON_ALLOW_DOWNLOAD_BINARIES=false`
- `DAEMON_LOG_BUFFER_SIZE=512`
- `DAEMON_RESTART_AFTER_UPGRADE=true`
- `UNSAFE_SKIP_BACKUP=true`

```
echo "# Setup Cosmovisor" >> ~/.profile
echo "export DAEMON_NAME=lumd" >> ~/.profile
echo "export DAEMON_HOME=$HOME/.lumd" >> ~/.profile
echo "export DAEMON_ALLOW_DOWNLOAD_BINARIES=false" >> ~/.profile
echo "export DAEMON_LOG_BUFFER_SIZE=512" >> ~/.profile
echo "export DAEMON_RESTART_AFTER_UPGRADE=true" >> ~/.profile
source ~/.profile
```

## Prepare lumd to run with cosmovisor

move the current lumd binary into the cosmovisor/genesis/bin folder.

```
mv $GOPATH/bin/lumd ~/.lumd/cosmovisor/genesis/bin
```

You will need to edit your service file to run cosmovisor

`sudo vim /etc/systemd/system/lumd.service`
```
[Unit]
Description=Lum Network Daemon
After=network-online.target

[Service]
User=$USER
ExecStart=$GOPATH/bin/cosmovisor run start --home $HOME/.lumd
Restart=always
RestartSec=3
LimitNOFILE=4096

[Install]
WantedBy=multi-user.target
```
