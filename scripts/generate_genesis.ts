import * as fs from 'fs';
import * as csv from 'fast-csv';

const ATOM_AIRDROP_OUTPUT = 'tmp/airdrop_atom.csv';
const OSMO_AIRDROP_OUTPUT = 'tmp/airdrop_osmo.csv';

const GENESIS_CONFIG_FILE = '../config-genesis.json';
const GENESIS_OUTPUT = 'tmp/genesis.json';

const MIN_ULUM_FREE = 1_000_000;

const CLIFF_DURATION_SEC = 182 * 24 * 60 * 60;
const VESTING_DURATION_SEC = 2 * 365 * 24 * 60 * 60;

const GENTXS_DIR = '../gentxs';
const VALIDATOR_GRANT = 1_000_000 * 1_000_000;

class Wallet {
    address: string;
    ulum_claim_free: number;
    ulum_claim_vested: number;
    ulum_free: number;
    ulum_vested: number;
    has_vesting_cliff: boolean;
    validator_gentx?: object;

    constructor(address: string) {
        this.address = address;
        this.ulum_claim_free = 0;
        this.ulum_claim_vested = 0;
        this.ulum_free = 0;
        this.ulum_vested = 0;
        this.has_vesting_cliff = true;
        this.validator_gentx = undefined;
    }
}

interface Wallets {
    [key: string]: Wallet;
}

const getOrInsertWallet = (wallets: Wallets, address: string): Wallet => {
    if (!wallets[address]) {
        wallets[address] = new Wallet(address);
    }
    return wallets[address];
};

const loadAirdrop = async (wallets: Wallets, filepath: string, free_ratio: number): Promise<void> => {
    return new Promise((resolve, reject) => {
        let ulumTotal = 0;
        let ulumFreeTotal = 0;
        let addressesCount = 0;

        fs.createReadStream(filepath)
            .pipe(csv.parse({ headers: true }))
            .on('error', (error) => reject(error))
            .on('data', (row) => {
                let ulum = parseInt(row['ulum'], 10);
                let freeUlum = Math.floor(ulum * free_ratio);
                ulumTotal += ulum;
                ulumFreeTotal += freeUlum;

                const w = getOrInsertWallet(wallets, row['lum_addr']);
                w.ulum_claim_free += freeUlum;
                w.ulum_claim_vested += ulum - freeUlum;
                addressesCount++;
            })
            .on('end', () => {
                console.log(
                    `Atom airdrop parsed with success: ${addressesCount} addresses, ${ulumTotal / 1_000_000} LUM (${
                        ulumFreeTotal / 1_000_000
                    } free upon claim)`
                );
                resolve();
            });
    });
};

const loadValidators = async (wallets: Wallets, gentxs_dir: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        fs.readdir(gentxs_dir, (err, files): void => {
            if (err) {
                reject(err);
            }
            for (const filename of files) {
                if (filename.startsWith('gentx') && filename.endsWith('.json')) {
                    const gentx = JSON.parse(fs.readFileSync(gentxs_dir + '/' + filename).toString());
                    const w = getOrInsertWallet(wallets, gentx.body.messages[0].delegator_address);
                    w.ulum_vested += VALIDATOR_GRANT;
                    w.validator_gentx = gentx;
                }
            }
            resolve();
        });
    });
};

const loadEverythingElse = async (wallets: Wallets): Promise<void> => {
    // Raw amounts in LUM to ease integration
    const vesting: [string, number][] = [
        ['lum1e8hsqylm07nq0y82xywyt5n9xsuj6jh765gvvx', 250_000_000],
        ['lum1449mp3xdz3y30y82ww5tpd5zdwr6ahqquh7tjw', 250_000_000],
    ];
    const cliffVesting: [string, number][] = [
        ['lum1u3y9wmcc735ansxaea5gv5q7dhjhxsek62ja4m', 1_000_000_000],
        ['lum1qzgtf3qtrg334jea790crnc0z7a8u73jlavv73', 1_000_000_000],
        ['lum1af9c9499kv5ts6rvaz3txxtykmxrqa0y4p9zey', 500_000_000],
        ['lum1gmhk2nftkwzag8qud6tl04hz26u5kn8s6w6zv5', 250_000_000],
        ['lum1l6u4g44cutufs0435j3k2xnfgk3jsj6s89q2q7', 250_000_000],
        ['lum194afyjfax3drs7jwxem882r58nvxyfp8lzhd0t', 250_000_000],
        ['lum1zcre9mksp2lfex56xag7xntahqtxmu2ww5lkd7', 500_000_000],
    ];
    for (const e of vesting) {
        const w = getOrInsertWallet(wallets, e[0]);
        w.has_vesting_cliff = false;
        w.ulum_vested += e[1] * 1_000_000;
    }
    for (const e of cliffVesting) {
        const w = getOrInsertWallet(wallets, e[0]);
        w.ulum_vested += e[1] * 1_000_000;
    }

    // Compute final ecosystem balance at launch by deducting validators grants and min amount per account
    const ecoWallet = getOrInsertWallet(wallets, 'lum17jdzeacu3jtdkhc3sl3swwxjlgsx76yeq4g2ep');
    ecoWallet.ulum_free += 250_000_000 * 1_000_000;
    for (const addr in wallets) {
        if (wallets[addr].ulum_free < MIN_ULUM_FREE) {
            const diff = MIN_ULUM_FREE - wallets[addr].ulum_free;
            wallets[addr].ulum_free += diff;
            ecoWallet.ulum_free -= diff;
        }
        if (wallets[addr].validator_gentx !== undefined) {
            ecoWallet.ulum_free -= VALIDATOR_GRANT;
        }
    }
};

const prettyLUM = (ulum: number): string => {
    let s = Math.floor(ulum / 1_000_000)
        .toString()
        .replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',');
    while (s.length < 13) {
        s = ' ' + s;
    }
    return s;
};

const logDistributionResult = (wallets: Wallets) => {
    let ulumClaimFree = 0;
    let ulumClaimVested = 0;
    let ulumFree = 0;
    let ulumCliffVested = 0;
    let ulumVested = 0;

    for (const addr in wallets) {
        ulumClaimFree += wallets[addr].ulum_claim_free;
        ulumClaimVested += wallets[addr].ulum_claim_vested;
        ulumFree += wallets[addr].ulum_free;
        if (wallets[addr].has_vesting_cliff) {
            ulumCliffVested += wallets[addr].ulum_vested;
        } else {
            ulumVested += wallets[addr].ulum_vested;
        }
    }

    const ulumTotal = ulumClaimFree + ulumClaimVested + ulumFree + ulumCliffVested + ulumVested;
    console.log('Distribution genesis outcome:');
    console.log(`- Free...........................: ${prettyLUM(ulumFree)} LUM`);
    console.log(`- Free upon claim................: ${prettyLUM(ulumClaimFree)} LUM`);
    console.log(`- Vested with cliff upon claim...: ${prettyLUM(ulumClaimVested)} LUM`);
    console.log(`- Vested with cliff..............: ${prettyLUM(ulumCliffVested)} LUM`);
    console.log(`- Vested without cliff...........: ${prettyLUM(ulumVested)} LUM`);
    console.log(`- Total..........................: ${prettyLUM(ulumTotal)} LUM`);
};

const generateGenesis = (wallets: Wallets, genesisConfigFilepath: string, genesisOutputFilepath: string) => {
    const genesis = JSON.parse(fs.readFileSync(genesisConfigFilepath).toString());
    const chainStartsAt = new Date(genesis.genesis_time);
    const vestingStartTimestamp = Math.round(chainStartsAt.getTime() / 1000);

    // Remove balance supply
    genesis.app_state.bank.supply = [];

    // Add claim records
    genesis.app_state.airdrop = {
        module_account_balance: {
            denom: 'ulum',
            amount: `${500_000_000_000_000}`,
        },
        params: {
            airdrop_start_time: `${genesis.genesis_time}`,
            duration_until_decay: '15638400s',
            duration_of_decay: '1s',
            claim_denom: 'ulum',
        },
        claim_records: [],
    };

    for (const addr in wallets) {
        const w = wallets[addr];
        // Add account to app state
        if (w.ulum_vested === 0 && w.ulum_claim_vested === 0) {
            genesis.app_state.auth.accounts.push({
                '@type': '/cosmos.auth.v1beta1.BaseAccount',
                address: w.address,
                pub_key: null,
                account_number: '0',
                sequence: '0',
            });
        } else {
            genesis.app_state.auth.accounts.push({
                '@type': '/cosmos.vesting.v1beta1.ContinuousVestingAccount',
                base_vesting_account: {
                    base_account: {
                        address: w.address,
                        pub_key: null,
                        account_number: '0',
                        sequence: '0',
                    },
                    original_vesting: [
                        {
                            denom: 'ulum',
                            amount: `${w.ulum_vested}`,
                        },
                    ],
                    delegated_free: [],
                    delegated_vesting: [],
                    end_time: `${
                        vestingStartTimestamp + VESTING_DURATION_SEC + (w.has_vesting_cliff ? CLIFF_DURATION_SEC : 0)
                    }`,
                },
                start_time: `${vestingStartTimestamp + (w.has_vesting_cliff ? CLIFF_DURATION_SEC : 0)}`,
            });
        }

        // Add account balance to app state
        genesis.app_state.bank.balances.push({
            address: w.address,
            coins: [
                {
                    denom: 'ulum',
                    amount: `${w.ulum_free + w.ulum_vested}`,
                },
            ],
        });

        // Add account claim actions
        if (w.ulum_claim_free > 0 || w.ulum_claim_vested > 0) {
            genesis.app_state.airdrop.claim_records.push({
                address: w.address,
                initial_claimable_amount: [
                    {
                        denom: 'ulum',
                        amount: `${w.ulum_claim_free}`,
                    },
                    {
                        denom: 'ulum',
                        amount: `${w.ulum_claim_vested}`,
                    },
                ],
                action_completed: [false, false],
            });
        }

        // Add gentx
        if (w.validator_gentx !== undefined) {
            genesis.app_state.genutil.gen_txs.push(w.validator_gentx);
        }
    }

    fs.writeFileSync(genesisOutputFilepath, JSON.stringify(genesis, undefined, 2));
};

const main = async () => {
    const wallets: Wallets = {};
    await loadAirdrop(wallets, ATOM_AIRDROP_OUTPUT, 0);
    await loadAirdrop(wallets, OSMO_AIRDROP_OUTPUT, 0.3);
    await loadValidators(wallets, GENTXS_DIR);
    await loadEverythingElse(wallets);
    generateGenesis(wallets, GENESIS_CONFIG_FILE, GENESIS_OUTPUT);
    logDistributionResult(wallets);
};

main();
