## Description

This pull request introduces a few major changes:

- First, we bump used versions of the SDK to the latest non-breaking one, v0.45.7
- Second, we introduce a cleaner structure for the app folder. Now keepers have their own file, and are initialized in separate functions all getting called in the root app initialize function
- Third, we get rid of the simapp. Used as a simulation application for local testing purposes, it was in fact introducing a higher level of complexity than required, with possibles desync due to the fact that every change on the main app has to be copied out to the simapp. Every testing suite has been modified to reflect that change.
- Fourth, we bump IBC used version from v2 to v3. This also introduces ICS 27, a.k.a Interchain Accounts.

The ICS 27 integration has been realized using the official documentation available here https://github.com/cosmos/ibc-go/blob/main/docs/migrations/v2-to-v3.md
The upgrade enables both host & controller modes, and it registers a few message to be authorized through ICA, including the custom beam ones.

## How to upgrade

- This upgrade is scheduled for Thursday `Sept. 19 around 17:00 UTC`
- The exact target block is `4009300`
- Upon reaching this block you will see a message `ERR UPGRADE "v1.2.0" NEEDED at height: 4009300` and `ERR CONSENSUS FAILURE!!!`
- WARNING: Upgrading prior to this block and this message WILL literally make your node good for a full hard reset, you really don't want to do that
- Once you receive this message you must upgrade you node:
  - `git pull`
  - `git checkout v1.2.0`
  - `make`
  - `lumd version`
    - `1.2.0`
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
