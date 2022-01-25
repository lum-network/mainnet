import { default as axios } from 'axios';
import * as csv from 'fast-csv';
import { LumClient, LumConstants, LumRegistry, LumTypes, LumUtils } from '@lum-network/sdk-javascript';
import { BondStatus } from '@lum-network/sdk-javascript/build/codec/cosmos/staking/v1beta1/staking';

class Validator {
    name: string;
    operator_address: string;
    bonded_height: number;
    is_jailed: boolean;
    is_bonded: boolean;
    lum_stakes: number;
    missed_blocks: number;
    commission: number;
    lum_delegation: number;

    constructor(
        name: string,
        operator_address: string,
        is_jailed: boolean,
        is_bonded: boolean,
        bonded_height: number,
        missed_blocks: number,
        lum_stakes: number,
        commission: number,
        lum_delegation: number,
    ) {
        this.name = name;
        this.operator_address = operator_address;
        this.is_jailed = is_jailed;
        this.is_bonded = is_bonded;
        this.bonded_height = bonded_height;
        this.missed_blocks = missed_blocks;
        this.lum_stakes = lum_stakes;
        this.commission = commission;
        this.lum_delegation = lum_delegation;
    }
}

const fetchAllStakingValidators = async (lumClt: LumClient) => {
    const bonded = await lumClt.queryClient.staking.validators('BOND_STATUS_BONDED');
    const unbonded = await lumClt.queryClient.staking.validators('BOND_STATUS_UNBONDED');
    const unbonding = await lumClt.queryClient.staking.validators('BOND_STATUS_UNBONDING');
    return bonded.validators.concat(unbonded.validators).concat(unbonding.validators);
};

const fetchAllDelegationsFrom = async (lumClt: LumClient, addr: string) => {
    if (!addr || addr === '') {
        return [];
    }
    let delegations = [];
    while (true) {
        const res = await lumClt.queryClient.staking.delegatorDelegations(addr);
        delegations = delegations.concat(res.delegationResponses);
        if (!res.pagination || !res.pagination.nextKey || res.pagination.total.toInt() === delegations.length) {
            break;
        }
    }
    return delegations;
};

const fetchMissedBlocksDailyAvg30Days = async (): Promise<{ [key: string]: number }> => {
    const res = await axios.post(
        'https://chain-monitor.cros-nest.com/api/ds/query',
        JSON.stringify({
            'queries': [
                {
                    'exemplar': true,
                    'expr': 'chain_operator_misses_new{chain_id="lum-network-1"}',
                    'interval': '',
                    'legendFormat': '{{ moniker }}',
                    'refId': 'A',
                    'datasource': { 'uid': 'SvF_AYvnz', 'type': 'prometheus' },
                    'queryType': 'timeSeriesQuery',
                    'requestId': '2A',
                    'utcOffsetSec': 0,
                    'datasourceId': 1,
                    'intervalMs': 24 * 60 * 60 * 1000,
                    'maxDataPoints': 100,
                },
            ],

            'from': `${new Date().getTime() - 30 * 24 * 60 * 60 * 1000}`,
            'to': `${new Date().getTime()}`,
        }),
        {
            headers: {
                'content-type': 'application/json',
            },
        },
    );

    const vals: { [key: string]: number } = {};
    for (let frame of res.data.results.A.frames) {
        let missed_blocks = 0;
        for (let value of frame.data.values[1]) {
            if (value > 0) {
                missed_blocks += value;
            }
        }
        vals[frame.schema.fields[1].labels.operator] = missed_blocks / frame.data.values[1].length;
    }

    return vals;
};

const main = async () => {
    const lumClt = await LumClient.connect('https://node0.mainnet.lum.network:443/rpc');

    const delegations = await fetchAllDelegationsFrom(lumClt, process.argv[2]);
    const tmValidators = (await lumClt.tmClient.validatorsAll()).validators;
    const stakingValidators = await fetchAllStakingValidators(lumClt);
    const slashingValidators = (await lumClt.queryClient.slashing.signing_infos()).info;
    const missedBlocksValidators = await fetchMissedBlocksDailyAvg30Days();

    const output_validators: Validator[] = [];

    for (let stake_val of stakingValidators) {
        const cons_pubkey = LumRegistry.decode(stake_val.consensusPubkey) as LumTypes.PubKey;
        const tm_val = tmValidators.filter(
            (v) => LumUtils.Bech32.encode(LumConstants.LumBech32PrefixConsPub, v.pubkey.data) === LumUtils.Bech32.encode(LumConstants.LumBech32PrefixConsPub, cons_pubkey.key),
        )[0];

        const slash_val = tm_val ? slashingValidators.filter((v) => v.address === LumUtils.Bech32.encode(LumConstants.LumBech32PrefixConsAddr, tm_val.address))[0] : null;
        const deleg = delegations.filter((d) => d.delegation.validatorAddress === stake_val.operatorAddress);

        output_validators.push(
            new Validator(
                stake_val.description.moniker,
                stake_val.operatorAddress,
                slash_val ? slash_val.jailedUntil > new Date() : false,
                stake_val.status === BondStatus.BOND_STATUS_BONDED,
                slash_val ? slash_val.startHeight.toInt() : -1,
                slash_val ? missedBlocksValidators[slash_val.address] || 0 : 0,
                parseInt(stake_val.tokens) / 1_000_000,
                parseFloat(stake_val.commission.commissionRates.rate) / 1_000_000_000_000_000_000,
                deleg.length === 1 ? parseInt(deleg[0].balance.amount) / 1_000_000 : 0,
            ),
        );
    }

    // Sort by voting power
    output_validators.sort((a, b) => b.lum_stakes - a.lum_stakes);

    const out = csv.format({ delimiter: ',' });
    out.pipe(process.stdout);
    out.write(['name', 'bonded', 'operator address', 'bonded height', 'missed blocks 24h avg', 'lum stakes', 'commission', 'lum delegated']);
    for (let val of output_validators) {
        out.write([val.name, val.is_bonded, val.operator_address, val.bonded_height, val.missed_blocks, val.lum_stakes, val.commission, val.lum_delegation]);
    }
    out.end();
};

main();
