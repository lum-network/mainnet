import * as fs from 'fs';
import * as csv from 'fast-csv';
import { LumConstants, LumUtils } from '@lum-network/sdk-javascript';

// Make sure we have the required destination folder
if (!fs.existsSync('tmp')) {
    fs.mkdirSync('tmp');
}

// Create the CSV stream
const csvStream = csv.format({ headers: true });
csvStream.pipe(fs.createWriteStream('tmp/airdrop_atom.csv')).on('end', () => process.exit());

class Entry {
    cosmos_addr: string;
    lum_addr: string;
    uatom: number;
    ulum: number;

    constructor(cosmos_addr: string) {
        const bech = LumUtils.Bech32.decode(cosmos_addr);
        this.cosmos_addr = cosmos_addr;
        this.lum_addr = LumUtils.Bech32.encode(LumConstants.LumBech32PrefixAccAddr, bech.data);
        this.uatom = 0;
        this.ulum = 0;
    }
}

interface Entries {
    [key: string]: Entry;
}

const main = () => {
    const entries: Entries = {};
    // Available stakedrop ulum
    const ulumAvailable = 250_000_000_000_000;
    // Minimum uatom cap (5 ATOM)
    const uatomMinCap = 5_000_000;
    // Maximum uatom cap (3000 ATOM)
    const uatomMaxCap = 3_000_000_000;

    // Centralized validators to exclude
    const excludedValidators = [
        'cosmosvaloper156gqf9837u7d4c4678yt3rl4ls9c5vuursrrzf',
        'cosmosvaloper1a3yjj7d3qnx4spgvjcwjq9cw9snrrrhu5h6jll',
        'cosmosvaloper1nm0rrq86ucezaf8uj35pq9fpwr5r82clzyvtd8',
        'cosmosvaloper1qaa9zej9a0ge3ugpx3pxyx602lxh3ztqgfnp42',
        'cosmosvaloper1z66j0z75a9flwnez7sa8jxx46cqu4rfhd9q82w',
    ];
    // Addresses to exclude since they cheated other Stakedrops
    const excludedDelegators = [
        'cosmos1mfap94z3fn0c6qhsj9r2xzkpl4u32thj32yjaw',
        'cosmos19m522gc38lcjcrtryht7852zdcf02fy5dl3485',
        'cosmos18003m32kneftuxk32cwxyugdnlaak2dqak0tcu',
        'cosmos1utj9vnja2nma8mkgjmtwee0vgm6g9ejewznxrr',
        'cosmos1s08yeaa8npqzmxsxlkrkyjp0xy3l92eusrxv5g',
        'cosmos1ryfnnxsqppmqm4xyzmf8m963gg2vc5wturjueg',
        'cosmos180a0flgynja8nxhethd2qkzrcnet606jf838yx',
        'cosmos1mcl6mwgsgudjkpxaedzfhwy9pws5xv9vhq7udx',
        'cosmos1aasymukl7xe84mzs75va9ncwg8j3g2vkvrudcp',
        'cosmos108fjyav0rdxh4ufvz4ru5s98w76z4uv6rhjea9',
        'cosmos1dlg5dqcx36rfc50m5zcw7zd60jkm05npasyycs',
        'cosmos1tjmu8sd5y49k8dyk4u7zvdzg28whthc3u7002n',
        'cosmos13t76x3dmsavfsfjdd9nffuzvs3m2jnm270du0a',
        'cosmos1rqunfs4fe76r7gvpnww8e4hfafych357qgt2ch',
        'cosmos1ej98aw2wdkvknrd3hv4zmfwmxs9q423y3xqfm9',
        'cosmos1emsh5d3d0dqwusln0jguvzh0mq8jve6a00pkjz',
        'cosmos1p4z4ty9077r437jtrtfyh3r6fx7dhcw8jr0vut',
        'cosmos18zqu7jy7al3c202nnl8jstgm6sq7z6q35wv7fq',
        'cosmos1ddspvxws5dlnx93n430z0ngw3m4k508rnercyf',
    ];

    console.log('Loading atom export...');

    const rawData = fs.readFileSync('snapshots/atom_export.json');
    const data = JSON.parse(rawData.toString());

    console.log('Atom export loaded with success');

    let processedUnique = 0;
    let processedTotal = 0;
    let unprocessedValidators = 0;
    let unprocessedDelegators = 0;
    let processedUatom = 0;
    let unprocessedUatom = 0;

    console.log('Parsing atom export...');

    for (const line of data['app_state']['staking']['delegations']) {
        if (excludedDelegators.includes(line['delegator_address'])) {
            unprocessedDelegators++;
            unprocessedUatom += parseInt(line['shares'], 10);
            continue;
        }

        if (excludedValidators.includes(line['validator_address'])) {
            unprocessedValidators++;
            unprocessedUatom += parseInt(line['shares'], 10);
            continue;
        }

        if (entries[line['delegator_address']] === undefined) {
            entries[line['delegator_address']] = new Entry(line['delegator_address']);
            processedUnique++;
        }
        processedTotal++;
        const uatomStaked = parseInt(line['shares'], 10);
        processedUatom += uatomStaked;
        entries[line['delegator_address']].uatom += uatomStaked;

        // console.log(`Processed ${line['delegator_address']}`);
    }

    console.log('Atom export parsed with success:');
    console.log(`- ${processedTotal} addresses accepted (${processedUnique} unique)`);
    console.log(`- ${processedUatom} uatom accepted, ${unprocessedUatom} uatom rejected`);
    console.log(
        `- ${unprocessedValidators} rejected from validators, ${unprocessedDelegators} rejected from delegators`
    );

    console.log('Computing ulum from uatom...');
    // Iterate a first time to remove addresses below min cap and compute ratio
    let uatomCapped = 0;
    for (const entry in entries) {
        if (entries[entry].uatom < uatomMinCap) {
            delete entries[entry];
        } else {
            uatomCapped += Math.min(entries[entry].uatom, uatomMaxCap);
        }
    }
    const ratio = ulumAvailable / uatomCapped;
    let ulumDropped = 0;
    for (const entry in entries) {
        entries[entry].ulum = Math.floor(Math.min(entries[entry].uatom, uatomMaxCap) * ratio);
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
        } ulum dust to cosmos1k2d9ed9vgfuk2m58a2d80q9u6qljkh4vvf589n (because why not...)`
    );
    entries['cosmos1k2d9ed9vgfuk2m58a2d80q9u6qljkh4vvf589n'].ulum += ulumAvailable - ulumDropped;

    console.log('Writing output...');

    for (const entry in entries) {
        csvStream.write({
            cosmos_addr: entries[entry].cosmos_addr,
            lum_addr: entries[entry].lum_addr,
            uatom: entries[entry].uatom,
            ulum: entries[entry].ulum,
        });
    }
    csvStream.end();

    console.log('Output written with success, exiting');
};

main();
