import * as fs from 'fs';
import * as csv from 'fast-csv';
import { LumConstants, LumUtils } from '@lum-network/sdk-javascript';

// Make sure we have the required destination folder
if (!fs.existsSync('tmp')) {
    fs.mkdirSync('tmp');
}

// Create the CSV stream
const csvStream = csv.format({ headers: true });
csvStream.pipe(fs.createWriteStream('tmp/airdrop_osmo.csv')).on('end', () => process.exit());

class Entry {
    osmo_addr: string;
    lum_addr: string;
    uosmo: number;
    ulum: number;

    constructor(cosmos_addr: string) {
        const bech = LumUtils.Bech32.decode(cosmos_addr);
        this.osmo_addr = cosmos_addr;
        this.lum_addr = LumUtils.Bech32.encode(LumConstants.LumBech32PrefixAccAddr, bech.data);
        this.uosmo = 0;
        this.ulum = 0;
    }
}

interface Entries {
    [key: string]: Entry;
}

class Pool {
    id: string;
    total_shares: number;
    total_weight: number;
    uosmo_weight: number;
    uosmo_ratio: number;
    uosmo_amount: number;
    uosmo_per_share: number;

    constructor(id: string, total_shares: number, total_weight: number, uosmo_weight: number, uosmo_amount: number) {
        this.id = id;
        this.total_shares = total_shares;
        this.total_weight = total_weight;
        this.uosmo_weight = uosmo_weight;
        this.uosmo_amount = uosmo_amount;
        this.uosmo_ratio = uosmo_weight / total_weight;
        this.uosmo_per_share = uosmo_amount / total_shares;
    }
}

interface Pools {
    [key: string]: Pool;
}

const main = () => {
    const entries: Entries = {};
    const pools: Pools = {};

    // Available stakedrop ulum
    const ulumAvailable = 250_000_000_000_000;
    // Minimum uosmo cap (30 OSMO)
    const uosmoMinCap = 30_000_000;
    // Maximum uosmo cap (20,000 OSMO)
    const uosmoMaxCap = 20_000_000_000;

    console.log('Loading osmo export...');

    const rawData = fs.readFileSync('snapshots/osmo_export.json');
    const data = JSON.parse(rawData.toString());

    console.log('Osmo export loaded with success');

    let lpCount = 0;
    let uosmoTotal = 0;
    const rejectedPools = [];

    console.log('Parsing osmo export...');

    // Create a osmo pool map
    for (const info of data['app_state']['gamm']['pools']) {
        let uosmoWeight = 0;
        let uosmoAmount = 0;
        for (const asset of info.poolAssets) {
            if (asset.token.denom === 'uosmo') {
                uosmoWeight = asset.weight;
                uosmoAmount = asset.token.amount;
                break;
            }
        }
        if (uosmoAmount > 0) {
            pools[info.totalShares.denom] = new Pool(
                info.id,
                parseInt(info.totalShares.amount, 10),
                parseInt(info.totalWeight, 10),
                uosmoWeight,
                uosmoAmount
            );
        } else {
            rejectedPools.push(info.id);
        }
    }

    console.log('Osmo pools loaded with success:');
    console.log(`- ${Object.keys(pools).length} accepted pools`);
    console.log(`- ${rejectedPools.length} rejected pools`);

    // Locked LP token holders
    for (const line of data['app_state']['lockup']['locks']) {
        let uosmo = 0;
        for (const coin of line['coins']) {
            const pool = pools[coin['denom']];
            if (pool) {
                uosmo += parseInt(coin['amount'], 10) * pool.uosmo_per_share;
            }
        }

        // Ignore if no uosmo
        if (uosmo <= 0) {
            continue;
        }

        if (entries[line['owner']] === undefined) {
            entries[line['owner']] = new Entry(line['owner']);
            lpCount++;
        }
        entries[line['owner']].uosmo += uosmo;
        uosmoTotal += uosmo;
    }

    console.log('Osmo export parsed with success:');
    console.log(`- ${lpCount} addresses found for a total of ${uosmoTotal} uosmo locked in the liquidity pools`);

    console.log('Computing ulum from uosmo...');
    // Iterate a first time to remove addresses below min cap and compute ratio
    let uosmoCapped = 0;
    for (const entry in entries) {
        if (entries[entry].uosmo < uosmoMinCap) {
            delete entries[entry];
        } else {
            uosmoCapped += Math.min(entries[entry].uosmo, uosmoMaxCap);
        }
    }
    const ratio = ulumAvailable / uosmoCapped;
    let ulumDropped = 0;
    for (const entry in entries) {
        entries[entry].uosmo = Math.floor(entries[entry].uosmo);
        entries[entry].ulum = Math.floor(Math.min(entries[entry].uosmo, uosmoMaxCap) * ratio);
        ulumDropped += entries[entry].ulum;
    }

    console.log('ulum computation done:');
    console.log(`- ratio: ${ratio}`);
    console.log(`- addresses: ${Object.keys(entries).length}`);
    console.log(`- ulum dropped: ${ulumDropped}`);
    console.log(`- ulum remaining dust: ${ulumAvailable - ulumDropped}`);

    console.log(
        `Giving remaining ${
            ulumAvailable - ulumDropped
        } ulum dust to osmo1t8qckan2yrygq7kl9apwhzfalwzgc242lk02ch (because why not...)`
    );
    entries['osmo1qqtywra8ar6uea24426rr2wrn9gh93knh3mh0h'].ulum += ulumAvailable - ulumDropped;

    console.log('Writing output...');

    for (const entry in entries) {
        csvStream.write({
            osmo_addr: entries[entry].osmo_addr,
            lum_addr: entries[entry].lum_addr,
            uosmo: entries[entry].uosmo,
            ulum: entries[entry].ulum,
        });
    }
    csvStream.end();

    console.log('Output written with success, exiting');
};

main();
