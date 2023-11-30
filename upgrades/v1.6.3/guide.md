## Description

This software upgrade is required to adopt the following changes:

- Global: Bump of the Ledger dependencies to improve device connection stability
- CosmosMillions: Restore interchain account should patch the affected entities
- CosmosMillions: Add missing entities to genesis export / import operations
- CosmosMillions: Introduce temporary context for processing withdrawals batch

## How to upgrade

- This upgrade is scheduled for Wednesday `Thursday, November 30Th around 16:30 UTC`
- The exact target block is `10444000`
- Upon reaching this block you will see a message `ERR UPGRADE "v1.6.3" NEEDED at height: 10444000` and `ERR CONSENSUS FAILURE!!!`
- WARNING: Upgrading prior to this block and this message WILL literally make your node good for a full hard reset, you really don't want to do that
- Once you receive this message you must upgrade you node:
  - `git pull`
  - `git checkout v1.6.3`
  - `make install`
  - `lumd version`
    - `1.6.3`
    - `4f4349bef967279608cd0cc88e4caadbd12e785c`
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
