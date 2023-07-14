## Description

This Pull Request introduces numerous changes over the whole Lum Network codebase, along with specific Millions improvements.

- Upgrade to Cosmos SDK v0.47.3
  - Upgrade to Cosmos SDK v0.47
  - Migration to CometBFT
  - Upgrade to Ibc-go v7
  - Protobuf clean up and re-generation
- Millions - Handle pool paused state
  - Properly handle all pool states (especially Paused state to prevent Draws from happening)
  - Pool state update via governance proposal
- Millions - Allow native zone toAddress
  - Allow for withdrawals to go directly on a remote zone wallet (instead of going back to the Lum Network)
- Millions - Handle re-delegate assets from a disabled validator
  - Evenly redelegate assets from disabled validators (not part of the active set anymore) upon Pool update proposal success
- Millions - Add msg to edit a deposit
  - Edit winner address
  - Edit sponsor mode
- Millions - Fix draw prizes fees implementation
  - Migration to add uncollected fees to the PrizePool not included in this fixe, this should be evaluated at a later time due to the low amount which has not been collected
- Millions - Prize uniqueness capability for Prize batches
  - Allow for a Prize batch to be consider a 'unique win' to prevent a winner to win other prizes
- DFract - move from Proposal to Tx based minting
  - Change WithdrawAndMint proposal into an UpdateParams proposal with an UpdateParams handler
  - Add a new tx based message WithdrawAndMint
- ATOM Pool prize strategy update
  - Make the biggest prize a 'unique' win to prevent the winner (in case a winner is found) to also win other prizes
  - Slight review of prize batches in order to better distribute the winning chances and the amounts according to the current prize pool

## How to upgrade

- This upgrade is scheduled for Wednesday `Monday, July 17th around 15:15 UTC`
- The exact target block is `8424000`
- Upon reaching this block you will see a message `ERR UPGRADE "v1.5.0" NEEDED at height: 8424000` and `ERR CONSENSUS FAILURE!!!`
- WARNING: Upgrading prior to this block and this message WILL literally make your node good for a full hard reset, you really don't want to do that
- Once you receive this message you must upgrade you node:
  - `git pull`
  - `git checkout v1.5.0`
  - `make install`
  - `lumd version`
    - `1.5.0`
    - `9aa98e57fe9e774983271e0724176a683eec8bf6`
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
