# Lum Network - MainNet Scripts

Scripts to generate the genesis file.

## Setup
```sh
yarn install
```

## Airdrop computation

### Compute ATOM Liquidity Providers Airdrop
Output will be written in `tmp/airdrop_atom.csv`
```sh
yarn airdrop_compute_atom
```

### Compute OSMO Liquidity Providers Airdrop
Output will be written in `tmp/airdrop_osmo.csv`
```sh
yarn airdrop_compute_osmo
```

## Genesis file generation

Compute the airdrops output first
```sh
yarn airdrop_compute_atom && yarn airdrop_compute_osmo
```

### Generate pre-genesis.json file

Output will be written in `tmp/pre-genesis.json`
```sh
yarn generate_pregenesis
```

### Generate genesis.json file

Output will be written in `tmp/pre-genesis.json`
```sh
yarn generate_genesis
```
