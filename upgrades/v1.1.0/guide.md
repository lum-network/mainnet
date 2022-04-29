## Description

This pull request introduces some minor and other major changes, including:

- Cosmos v0.45.0 upgrade
- CI & CD upgrade
- Configuration scripts upgrade
- Beam auto-close feature fix
- Beam creation date fix
- Keplr REST endpoints fix
- Indirect dependencies fix for MapOfZones
- Bumped golang version to 1.18

Migration between old and new implementation is planned and integrated

## How to upgrade

- This upgrade is scheduled for Thursday `Apr. 28 around 17:00 UTC`
- The exact target block is `1960300`
- Upon reaching this block you will see a message `ERR UPGRADE "v1.1.0" NEEDED at height: 1960300` and `ERR CONSENSUS FAILURE!!!`
- WARNING: Upgrading prior to this block and this message WILL literally make your node good for a full hard reset, you really don't want to do that
- Once you receive this message you must upgrade you node:
  - `git pull`
  - `git checkout v1.1.0`
  - `make`
  - `lumd version`
    - `1.1.0`
  - `sudo systemctl restart lumd`
- If it succeeds you should see it in the logs `journalctl -u lumd -f `
