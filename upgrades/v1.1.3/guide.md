# Lum Network - Critical Upgrade v1.1.3

## Description
The Lum Network halted following the v1.1.0 upgrade on Apr. 28 at 18:50 UTC.
This upgrade is therefore required in order to resume minting blocks.
A full postmortem article will be published in the coming days and added to this repository.

### This upgrade contains:
Fixes on the Beam module which caused the halt at block height `1960665`
Improvements to the export/import feature of the Beam module in order to restore the chain state from a new Genesis export

### Important notes:
- This upgrade is scheduled for `Friday Apr. 29 around 17:30 UTC`
- There is NO real target block and time for this upgrade
- This is considered a hard fork since it requires to use a new Genesis state based on the export of the Lum Network at block height `1960665`

## [OPTIONAL] Verifying the provided Genesis file

For the more tech savvy you can verify that the provided Genesis is the right one.
We have already verified and compared it between 3 full validator nodes, but other verifications are welcome.

Steps to reproduce:
  - Stop your lum service
  - Upgrade binary to v1.1.3
  - Run `lumd export --home {LUMD_HOME} &> genesis-export.json`
  - Pretty the json output
    - `cat genesis-export.json | python3 -m json.tool > genesis-export-pretty.json`
  - Replace the faulty timestamp for Beam with ID `3b07374f-29bf-47cc-9f3f-988a4bafec75`
    - `nano genesis-export-pretty.json`
    - Find the Beam with ctrl+w then type `3b07374f` + enter
    - Replace the created_at value with `2022-04-28T18:50:38.000000000Z`
    - save and exit with ctrl+x + enter
  - `sha256sum genesis-export-pretty.json` -> 8a327bbbcee02f19733160b1fb853e32edf83d3e9139486dfd2781ff0567c3a2

## [MANDATORY] Upgrade procedure

- You should make a copy of your disk or at least your lumd HOME folder
  - This is not mandatory but highly recommended
  - We will provide backups anyway but please keep in mind that you are responsible for you node operation and that some data cannot be recovered by public backups such as your validator key & state
- Stop your lumd process systemctl stop lumd
- Install version 1.1.3
  - `git checkout master`
  - `git pull`
  - `git checkout v1.1.3`
  - `make install`
  - `lumd version` -> v1.1.3
- Download the new genesis state
  - `wget -O genesis-1960665.json https://github.com/lum-network/mainnet/blob/master/upgrades/v1.1.3/genesis-1960665.json?raw=true`
  - `sha256sum genesis-1960665.json` -> 8a327bbbcee02f19733160b1fb853e32edf83d3e9139486dfd2781ff0567c3a2
  - `cp genesis-1960665.json {LUMD_HOME}/config/genesis.json`
- Unsafe reset your node
  - `lumd unsafe-reset-all --home {LUMD_HOME}`
- Upgrade your peers list using the [updated list](/persistent_peers.txt)
- Restart your node
  - `systemctl restart lumd`

### Check that your upgrade is working

- The import process of the new Genesis file should log tons of Persisted beam...
- Running the following command should show you the new voting round in progress
  - `watch -n 0.08 "curl -s localhost:26657/consensus_state | jq '.result.round_state.height_vote_set[0] | (.prevotes_bit_array, .precommits_bit_array)'"`
- You should see tons of spammy logs from nodes with the halted version, this is not an issue and it is supposed to happen
- Once the consensus reaches 2/3 votes we will start producing blocks again
