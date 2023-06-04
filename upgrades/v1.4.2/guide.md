## ⚠️ PATCHED VERSION FOR v1.4.1 UPGRADE ⚠️

**This upgrade is only required for node operators and validators halted at block #7799476 (wrong AppHash).**

This version (v1.4.2) is a replacement of v1.4.1 which prevents a chain halt (wrong AppHash) on block #7799476.

All node operators and validators syncing a new node SHOULD NOT NEED TO DO THIS and should upgrade to v1.4.2 when requested to upgrade to v1.4.1 (see [v1.4.1 upgrade guide](https://github.com/lum-network/mainnet/blob/master/upgrades/v1.4.1/guide.md) for details).

## Description

See [Lum Network Chain PR#30](https://github.com/lum-network/chain/pull/30) for complete change details:

PR#30 fixes two issues related to the Cosmos Millions module implementation:
1. **[critical issue]** Use of Maps (Pool.Validator proto entity) with non-deterministic serialization behaviour causing the network to halt (AppHash).
2. **[critical issue]** An incorrect implementation of the IBC `NewMsgTransfer` call is preventing to transfer assets back from remote chains to the Lum Network. This is due to always providing this function with the same transfer channel id, which is different on both ends of the IBC pipe. This is fixed by passing the counterparty channel id to the function.
3. **[minor issue]** Some debug timeout timestamps (5 minutes) were left in the code instead of the standard Millions one of 30 minutes. This is fixed as well. A too low timestamp could've broken procedures in case of relayer temporary downtime.

## How to upgrade

This upgrade requires to restart your node from a clean state sync exported on block #7799476.

### ⚠️ WARNING ⚠️
Follow this guide carefully, especially if you are running a validator node

Failing to backup your `priv_validator_state.json` as described in this guide will likely make you double sign.

### Procedure

Please replace $LUMD_HOME with the home folder for your node (ex: `~/.lumd`) and adapt this guide based on your node setup.

**1. Stop your node**
  - `systemctl stop lumd`

**2. Download state sync from block #7799476**
  - `cd $LUMD_HOME`
  - `wget https://storage.googleapis.com/lum-network.appspot.com/snapshots/lum-snapshot-7799476.tar.gz`
  - `sha256sum lum-snapshot-7799476.tar.gz`
    - `55e6c23c4d70ead527aaae0392beb98211deb48ec989f0f1a8d28348241aef02`

**3. (Validators only) Backup your `priv_validator_state.json` located in your `data` folder**
  - `cp data/priv_validator_state.json backup_priv_validator_state.json`
  - `cat backup_priv_validator_state.json` should work

**4. Erase data folder**
  - note: you can also make a backup of it before doing so but it might take a while (and a lot of disk space)
  - `rm -rf data`

**5. Import state sync**
  - `tar -zxf lum-snapshot-7799476.tar.gz`
  - `ls -l data` should output files such as `application.db`, `blockstore.db` etc...

**6. (Validators only) Import your backed up `priv_validator_state.json`**
  - `cp backup_priv_validator_state.json data/priv_validator_state.json`
  - `cat data/priv_validator_state.json` should output your backed up file

**7. Upgrade to v1.4.2**
  - `cd YOUR_PATH_TO_LUMD_GIT`
  - `git pull`
  - `git checkout v1.4.2`
  - `make install`
  - `lumd version`
    - `1.4.2`
    - `c65be31156dff3217e1d85099debc324d56626a7`

**8. Change `timeout_precommit_delta` to `0ms` to speed up consensus rounds**
  - `nano config/config.toml`
  - Edit line `timeout_precommit_delta` to set it to `0ms`
  - Save file `ctrl + X` then `Y`

**9. Restart your node**
  - `systemctl start lumd`

**10. Check logs and wait for consensus success**
  - `journalctl -u lumd -f `

### Clean up once chain mints block again
Please wait a few blocks before doing the following !

Once block #7799477 gets minted you can revert the `timeout_precommit_delta` to its default value (`500ms`), it will simply require to restart your node.
