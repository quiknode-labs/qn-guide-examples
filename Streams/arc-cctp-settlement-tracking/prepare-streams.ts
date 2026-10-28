import fs from 'node:fs';
import { parseArgs } from 'node:util';

const {values} = parseArgs({options:{
  continuous:{type:'boolean',default:false},
  validation:{type:'boolean',default:false},
  'base-start':{type:'string'}, 'arc-start':{type:'string'},
}});
if (values.continuous && values.validation) throw Error('Choose continuous or validation mode');
if (!values.continuous && (values['base-start'] || values['arc-start'])) throw Error('Starting blocks require --continuous');
function block(value: string | undefined) {
  if (!value || !/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) throw Error('Continuous mode requires --base-start and --arc-start block numbers');
  return Number(value);
}
const database = {
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT ?? 5432),
  database: process.env.PGDATABASE,
  username: process.env.STREAM_PGUSER ?? process.env.PGUSER,
  password: process.env.STREAM_PGPASSWORD ?? process.env.PGPASSWORD,
  sslmode: 'require', table_name:'cctp_batches', max_retry:3, retry_interval_sec:1,
};
if (!database.host || !database.database || !database.username || !database.password) throw Error('Set the PostgreSQL connection values in .env');
const cases = values.validation ? [
  {name:'base-burn',chain:'base',start:52627678,end:52627678},
  {name:'arc-receive',chain:'arc',start:26048044,end:26048044},
  {name:'arc-burn',chain:'arc',start:26034675,end:26034675},
  {name:'base-receive',chain:'base',start:52624297,end:52624297},
] : [
  {name:'base',chain:'base',start:values.continuous?block(values['base-start']):52627678,end:values.continuous?-1:52627678},
  {name:'arc',chain:'arc',start:values.continuous?block(values['arc-start']):26048044,end:values.continuous?-1:26048044},
];
fs.mkdirSync('stream-config',{recursive:true});
for (const feed of cases) {
  const config = {
    name:`example-cctp-${feed.name}`,
    network:`${feed.chain}-mainnet`,dataset:'logs',
    filter_function:Buffer.from(fs.readFileSync(new URL(`./filter-${feed.chain}.js`,import.meta.url))).toString('base64'),
    filter_language:'javascript',region:'europe_central',
    start_range:feed.start,end_range:feed.end,
    dataset_batch_size:1,elastic_batch_enabled:false,
    fix_block_reorgs:feed.chain==='base'?1:0,keep_distance_from_tip:0,
    destination:'postgres',destination_attributes:database,status:'active',
  };
  const filename=`stream-config/${feed.name}.private.json`;
  fs.writeFileSync(filename,JSON.stringify(config,null,2),{mode:0o600});
  fs.chmodSync(filename,0o600);
}
console.log(`Prepared ${cases.length} ${values.continuous?'continuous':'bounded'} Stream configurations in stream-config/.`);
