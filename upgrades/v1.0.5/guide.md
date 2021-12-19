# Description
The main-net of the Lum Network was launched on Dec. 14th. The same day Osmosis ran an update as well which broke the capability to create IBC channels between Osmosis and Lum Network. Thus preventing us from creating liquidity pools on the Osmosis platform.

This upgrade to v1.0.5 alongside Osmosis' upgrade (which will happen the same day) is intended to fix this IBC integration issue and enable our networks to communicate.

# How to upgrade
- This upgrade is scheduled for `Monday Dec. 20 at around 17:00 UTC`
- The exact target block is `90300`
- Upon reaching this block you will see a message `ERR UPGRADE "v1.0.5" NEEDED at height: 90300` and `ERR CONSENSUS FAILURE!!!`
- WARNING: Upgrading prior to this block and this message WILL literally make your node good for a full hard reset, you really don't want to do that
- Once you receive this message you must upgrade you node:
```
git checkout v1.0.5
make
lumd version
1.0.5
sudo systemctl restart lumd
```
- If it succeeds you should see it in the logs `journalctl -u lumd -f`

# Upgrade details
Critical upgrade that fixes issues related to the Staking module and IBC:
- Upgrade to IBC v2
- Fix Staking module initialization
- Also more info here: Unable to create new IBC channels with Osmosis osmosis-labs/osmosis#665

Side improvements:
- Always enable api and telemetry
- Backport sync and node info rest endpoints for compatibility purpose

# Install and setup Cosmovisor

We highly recommend validators use cosmovisor to run their nodes. This will make low-downtime upgrades smoother,
as validators don't have to manually upgrade binaries during the upgrade, and instead can preinstall new binaries, and
cosmovisor will automatically update them based on on-chain SoftwareUpgrade proposals.

You should review the docs for cosmovisor located here: https://docs.cosmos.network/master/run-node/cosmovisor.html

If you choose to use cosmovisor, please continue with these instructions:

To install Cosmovisor:

```
git clone https://github.com/cosmos/cosmos-sdk
cd cosmos-sdk
git checkout cosmovisor/v1.0.0
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

# Prepare lumd to run with cosmovisor

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
ExecStart=$GOPATH/bin/cosmovisor start
Restart=always
RestartSec=3
LimitNOFILE=4096

[Install]
WantedBy=multi-user.target
```

## Prepare for upgrade (v1.0.5)

To prepare for the upgrade, you need to build & install the new binary and move it to the right cosmovisor-folder.

```
git clone https://github.com/lum-network/chain && cd chain
git checkout v1.0.5
make
lumd version
1.0.5
```
```
mkdir -p ~/.lumd/cosmovisor/upgrades/v1.0.5/bin
mv $GOPATH/bin/lumd ~/.lumd/cosmovisor/upgrades/v1.0.5/bin
```

Now cosmovisor will run with the current binary, and will automatically upgrade to this new binary at the appropriate height if run with:
```
sudo systemctl daemon-reload
sudo systemctl restart lumd
```


Please note, this updates your `$GOPATH/bin/lumd` binary and moves it to the right cosmovisor folder. From this point on your lumd can only be called from terminal using 
```
cosmovisor version
```
