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
