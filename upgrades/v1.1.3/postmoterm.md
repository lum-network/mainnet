# Lum Network - postmortem report
Postmortem report regarding the chain halt which happened post v1.1.0 update and was solved by upgrade v1.1.3.

## Summary
- [v1.1.0](https://www.mintscan.io/lum/proposals/17) was rolled out on `Apr. 28 around 20:00 UTC` at block `1960300`
- The chain upgraded with success and block production kept going until block `1960665`
- Block `1960665` was produced but contained a transaction with caused the state machine to become `non-deterministic`
- At this point it was impossible for validators to agree on block `1960666` since they all had a different `Block.Header.AppHash`
- The chain was halted and issue was investigated by the Lum Team alongside many validators (who we thank again for their help and commitment)
- After exploring all possible options to restart the network it was decided to use a new genesis file starting at height `1960665`
- [v1.1.3](https://github.com/lum-network/mainnet/blob/master/upgrades/v1.1.3/guide.md) was rolled out on `Apr 29 around 19:30 UTC` and the network resumed producing block around `20:00 UTC` the same day

## Issue details

### Description
The issue was caused by a line of code in the Beam module causing the state machine to store `non-deterministic` data in the key value store.
 
Since the transaction and the block triggering this issue were valid they were accepted by the network and considered the highest block height for the chain.

But since the code created `non-deterministic` data and stored it into the key value store it led all validators to have a different AppHash which is required by the consensus algorithm to determine the validity of a proposed block.

In more simple terms, a valid transaction and a valid block were produced but the outcome of delivering the transactions for this block led to an inconsistent state machine across the whole validator set.

### AppHash documentation
From Tendermint's [repository](https://github.com/tendermint/tendermint) and [official documentation](https://docs.tendermint.com/master/spec/abci++/abci++_basic_concepts_002_draft.html#determinism)
```
The AppHash is unique in that it is application specific, and allows for
application-specific Merkle proofs about the state of the application.
While some applications keep all relevant state in the transactions themselves
(like Bitcoin and its UTXOs), others maintain a separated state that is
computed deterministically *from* transactions, but is not contained directly in
the transactions themselves (like Ethereum contracts and accounts).
```

### Error log
```sh
ERR prevote step: ProposalBlock is invalid err="wrong Block.Header.AppHash.  Expected 96A3A300C1C951786A5EF624DE9683B297ABC01644CCEE5CAD79654D1E862981, got 0FD13B1AA369CCB22135B2FFF2E1542B1A5DDF18AF3D6904FE267D759F91DDB2" height=1960666 module=consensus round=239
```

## Explored solutions

We figured out the origin of the issue in the code in no time since the error log was quite obvious.

But the challenge was to actually "restart" the network and produce new blocks with an inconsistent application state. Here is the list of the major solutions with explored and tried on a private testnet with 3 nodes affected by the same issue voluntarely.

### Upgrade binary in place (fail)
*Have validators upgrade their binary and restart it*

1. Naive test to see if the nodes would catch up and resume block pre-vote
    - Does not work since the key value store has already been updated
    - We expected this outcome but it was worth a try and fairly quick to confirm
2. Had a temporary hook at launch to override the faulty state in the key value store
    - Does not work since it is either impossible or corrupts the key value store
    - Might be worth another try with more complex hooks but we estimated the time to achieve a viable and safe solution not worth the effort. Moreover this solution requires to mess with the state machine which is likely to produce undesired side effects

### Rollback one block (fail)
*Have validators upgrade their binary, rollback one block and restart it*

We discovered a new [rollback command](https://github.com/cosmos/cosmos-sdk/pull/11179/files) was available since `Cosmos SDK v0.45.2` and decided to give it a try by upgrading to this sdk version and applying the fix as well.

The rollback command was executed on all testnet nodes and succeeded. 

But restarting the nodes binary led to an instant panic at start apparently due to files corruption. We are not sure at the time of writting why this panic occured but after a few tries we decided to reject this option since the logs were not helpful, the feature is still in its infancy and not much feedback on using this feature was available.

### Hard fork with a new Genesis (success)
*Have validators upgrade their binary and restart from a new genesis*

This is the solution used by most chains which experienced a similar issue. It make sense since it ensures a proper clean restart of the network. Moreover, validators not available to upgrade in sync are not a blocker since they broadcast messages on another genesis initial height which is by default logged and ignored.

We tried to avoid this solution since it lead to fragmented chains and make it more difficult to have archive nodes with all blocks available. Not something critical but we would have prefer to avoid this solution nonetheless.

This solution steps are described in the [v1.1.3 upgrade guide](./guide.md).

Since the application state was inconsistent between validators we also provided a way to reproduce the exact same genesis that we exported from the Lum Network nodes. Thus ensuring no edition beyond what was strictly necessary occureed during the export. This verification process is immutable and still available for anyone willing to reproduce it.

*Note: we decided and made sure not to have to change the chain-id during this upgrade. This was a key decision since chaning the chain-id brings more issues than actual solutions, especially when it comes to IBC.*

## Conclusion

- Documentation and opensource knowledge is key, thanks to all the projects who documented properly postmortem their chain halt issues
- We improved our CICD to avoid this kind of non-deterministic issues in the future, thanks to @joeabbey for the [PR#10](https://github.com/lum-network/chain/pull/10/files)
- We improved our upgrade testing procedure to include nodes in seggregated datacenters and servers in order to accurately represent a mainnet scenario
